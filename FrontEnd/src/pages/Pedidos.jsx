import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, AlertTriangle, Check } from "lucide-react";
import OrderModal from "../components/OrderModal";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db } from '../firebase-config';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { useAuth } from '../AuthContext';

const formatBRL = (value) => {
  const numValue = parseFloat(value) || 0;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue);
};

export default function Pedidos() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState(null);

  // Estado para confirmação de Cancelamento
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    orderId: null,
  });

  const tabs = ["Todos", "Pendente", "Processando", "Enviados", "Entregues", "Cancelado"];
  const orderStatuses = ["Pendente", "Processando", "Enviados", "Entregues", "Cancelado"];

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const ordersCollectionRef = collection(db, 'empresas', currentUser.uid, 'pedidos');

    const q = query(ordersCollectionRef, orderBy('dataCriacao', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          components: data.components || [],
          date: data.dataCriacao?.toDate ? data.dataCriacao.toDate() : new Date(),
          total: data.total || data.suggestedPrice || 0,
          client: data.clientName || data.client || 'N/A',
          status: data.status || 'Pendente',
        };
      });
      setOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar pedidos:", error);
      setOrders([]);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const handleOpenModal = (order = null) => {
    setOrderToEdit(order);
    setIsModalOpen(true);
  };

  const handleSaveOrder = async (newOrderData) => {
    if (!currentUser?.uid) return;
    const baseCollection = collection(db, 'empresas', currentUser.uid, 'pedidos');

    try {
      const cleanOrderData = (data) => {
        return Object.fromEntries(
          Object.entries(data).filter(([_, value]) => value !== undefined && value !== null)
        );
      };

      const dataToSave = {
        clientName: newOrderData.clientName,
        total: newOrderData.total,
        costPrice: newOrderData.costPrice,
        profitMargin: newOrderData.profitMargin,
        status: newOrderData.status,
        notes: newOrderData.notes,
        components: newOrderData.components.map(comp => cleanOrderData(comp)),
      };

      if (newOrderData.id) {
        const orderRef = doc(baseCollection, newOrderData.id);

        const currentOrder = orders.find(o => o.id === newOrderData.id);
        const initialStatus = currentOrder?.status || "Pendente";
        const newStatus = newOrderData.status;

        // Aplicar a lógica de transição de estoque (apenas se houver mudança de status relevante)
        if (initialStatus !== newStatus) {
          await handleStockTransaction(newOrderData.id, newStatus, initialStatus, newOrderData.components);
        }

        await updateDoc(orderRef, dataToSave);
      } else {
        await addDoc(baseCollection, {
          ...dataToSave,
          dataCriacao: serverTimestamp(),
          userId: currentUser.uid,
        });
      }

      setIsModalOpen(false);
      setOrderToEdit(null);
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Falha ao salvar o pedido. Detalhes: " + error.message);
    }
  };

  // CORRIGIDA: Função centralizada para lidar com transações de estoque
  const handleStockTransaction = async (orderId, newStatus, oldStatus, components) => {
    if (!currentUser?.uid || oldStatus === newStatus) return;

    // Status considerados de CONSUMO (dedução de estoque)
    const CONSUMPTION_STATUSES = ['Enviados', 'Entregues'];

    // ** REGRA 1: DEDUÇÃO (Consumo) **
    // Acontece se for para um status de consumo E o status anterior NÃO era um status de consumo NEM Cancelado.
    const isDeduction =
      CONSUMPTION_STATUSES.includes(newStatus) &&
      !CONSUMPTION_STATUSES.includes(oldStatus) &&
      oldStatus !== 'Cancelado';

    // ** REGRA 2: ESTORNO (Restock) **
    // 2a. Estorno por Cancelamento: Se o novo status for 'Cancelado' E o status antigo era de consumo.
    const isRestockFromCancel =
      (newStatus === 'Cancelado' && CONSUMPTION_STATUSES.includes(oldStatus));

    // 2b. Estorno por Reversão: Se o status antigo era de consumo E o novo status NÃO for um status de consumo NEM 'Cancelado' (voltando para Pendente/Processando).
    const isRestockFromRevert =
      CONSUMPTION_STATUSES.includes(oldStatus) &&
      !CONSUMPTION_STATUSES.includes(newStatus) &&
      newStatus !== 'Cancelado';

    const isRestock = isRestockFromCancel || isRestockFromRevert;

    let transactionType = null;
    if (isDeduction) {
      transactionType = "DEDUCAO";
    } else if (isRestock) {
      transactionType = "ESTORNO";
    } else {
      // Se não houver transação de estoque, apenas atualiza o status
      const orderRef = doc(db, 'empresas', currentUser.uid, 'pedidos', orderId);
      await updateDoc(orderRef, { status: newStatus, dataAtualizacao: serverTimestamp() });
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        for (const item of components) {
          const itemId = item.id;
          const quantidadePedido = parseFloat(item.qty || 0);

          if (!itemId || quantidadePedido <= 0) continue;

          const inventoryRef = doc(db, 'empresas', currentUser.uid, 'inventario', itemId);
          const inventoryDoc = await transaction.get(inventoryRef);

          if (!inventoryDoc.exists()) {
            console.warn(`Item de inventário não encontrado para ID: ${itemId}`);
            continue;
          }

          const currentQuantity = inventoryDoc.data().quantity || 0;
          const estoqueMinimo = inventoryDoc.data().minStock || 5;
          const estoqueCritico = inventoryDoc.data().criticalStock || 1;

          let changeAmount = 0;
          if (transactionType === "DEDUCAO") changeAmount = -quantidadePedido;
          else if (transactionType === "ESTORNO") changeAmount = quantidadePedido;

          const newQtd = currentQuantity + changeAmount;

          if (transactionType === "DEDUCAO" && newQtd < 0) {
            throw new Error(`Estoque insuficiente para o item: ${item.name || itemId}. (Necessário: ${quantidadePedido}, Disponível: ${currentQuantity})`);
          }

          let newStatusInventario = 'Em Estoque';
          if (newQtd <= estoqueCritico) {
            newStatusInventario = 'Estoque Crítico';
          } else if (newQtd <= estoqueMinimo) {
            newStatusInventario = 'Estoque Baixo';
          }

          transaction.update(inventoryRef, {
            quantity: newQtd,
            status: newStatusInventario,
            dataUltimaAtualizacao: serverTimestamp()
          });
        }

        const orderRef = doc(db, 'empresas', currentUser.uid, 'pedidos', orderId);
        transaction.update(orderRef, {
          status: newStatus,
          dataAtualizacao: serverTimestamp()
        });
      });

      alert(`Status do pedido ${orderId.substring(0, 6)}... atualizado para ${newStatus} e estoque ajustado com sucesso!`);

    } catch (error) {
      console.error("Erro na transação de estoque/status:", error);
      alert(`Falha na atualização. Nenhuma mudança foi salva. Detalhe: ${error.message}`);
    }
  }


  // CORRIGIDO: Lógica de atualização de status usando a nova função de transação
  const handleUpdateStatus = async (id, newStatus) => {
    if (!currentUser?.uid) return;

    const order = orders.find(o => o.id === id);
    if (!order) return;
    const oldStatus = order.status;

    // ** BLOQUEIO DE MUDANÇA DE STATUS APÓS CANCELAMENTO **
    if (oldStatus === 'Cancelado' && newStatus !== 'Cancelado') {
      alert("Pedidos cancelados não podem ter seu status alterado. Deletar e criar novamente se necessário.");
      return; // Sai da função, impedindo a mudança
    }


    if (oldStatus === newStatus) {
      // Se for cancelar e já estiver no modal de confirmação, faça o cancelamento
      if (newStatus === 'Cancelado' && confirmation.isOpen && confirmation.orderId === id) {
        // Fechar o modal de confirmação e processar o cancelamento
        setConfirmation({ isOpen: false, orderId: null });
      } else {
        return;
      }
    }

    // Se estiver indo para "Cancelado" E o status antigo não era Cancelado, abre o modal de confirmação
    if (newStatus === 'Cancelado' && oldStatus !== 'Cancelado') {
      setConfirmation({ isOpen: true, orderId: id });
      return;
    }

    await handleStockTransaction(id, newStatus, oldStatus, order.components);
  };

  // Ação para confirmar o cancelamento
  const handleConfirmCancel = async () => {
    const orderId = confirmation.orderId;
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      setConfirmation({ isOpen: false, orderId: null });
      return;
    }

    // Passa a chamada de status para a função que lida com a transação
    await handleStockTransaction(orderId, 'Cancelado', order.status, order.components);
    setConfirmation({ isOpen: false, orderId: null });
  };

  // Ação para cancelar a confirmação
  const handleCancelConfirmation = () => {
    setConfirmation({ isOpen: false, orderId: null });
  };


  const handleDeleteOrder = async (id) => {
    if (!currentUser?.uid) return;
    const order = orders.find(o => o.id === id);

    if (!order) return;

    if (!window.confirm(`Tem certeza que deseja deletar o pedido ${id.substring(0, 6)}...? Isso é permanente.`)) {
      return;
    }

    try {
      // Se o pedido estava em um estado de consumo, cancela ele primeiro para estornar o estoque.
      if (order.status === 'Enviados' || order.status === 'Entregues') {
        // Chama a transação para garantir o estorno antes de deletar
        await handleStockTransaction(id, 'Cancelado', order.status, order.components);
      }

      const orderRef = doc(db, 'empresas', currentUser.uid, 'pedidos', id);
      await deleteDoc(orderRef);
      alert(`Pedido ${id.substring(0, 6)}... deletado com sucesso.`);

    } catch (error) {
      console.error("Erro ao deletar pedido:", error);
      alert("Falha ao deletar o pedido. Detalhes: " + error.message);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-800 text-yellow-200 border-yellow-700';
      case 'Processando': return 'bg-blue-800 text-blue-200 border-blue-700';
      case 'Enviados': return 'bg-purple-800 text-purple-200 border-purple-700';
      case 'Entregues': return 'bg-green-800 text-green-200 border-green-700';
      case 'Cancelado': return 'bg-red-800 text-red-200 border-red-700';
      default: return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (tab === "Todos") {
      return true;
    }
    return order.status === tab;
  });

  return (
    <div className="text-white p-6 md:p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-400">Gestão de Pedidos</h1>
          <p className="text-gray-400">
            Processos, acompanhe e crie pedidos (incluindo os gerados no Montador).
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition duration-150 shadow-lg"
        >
          <Plus size={18} />
          Novo Pedido Manual
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b border-gray-700/50 overflow-x-auto whitespace-nowrap">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 -mb-px font-medium transition duration-150 ${tab === t
              ? "border-b-2 border-blue-500 text-blue-400"
              : "text-gray-400 hover:text-white hover:bg-[#1e293b] rounded-t-md"
              }`}
          >
            {t} ({orders.filter(o => t === 'Todos' || o.status === t).length})
          </button>
        ))}
      </div>

      {/* Tabela */}
      <section className="bg-[#1e293b] p-6 rounded-xl shadow-2xl">
        <h2 className="text-xl font-semibold mb-4 text-gray-200">{tab === "Todos" ? "Todos os Pedidos" : `Pedidos ${tab}`}</h2>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Carregando pedidos do Firestore...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-gray-300 border-separate" style={{ borderSpacing: '0 0.5rem' }}>
              <thead className="text-gray-400">
                <tr>
                  <th className="py-3 px-4 font-normal">ID</th>
                  <th className="py-3 px-4 font-normal">Cliente</th>
                  <th className="py-3 px-4 font-normal">Data</th>
                  <th className="py-3 px-4 font-normal">Total</th>
                  <th className="py-3 px-4 font-normal">Status</th>
                  <th className="py-3 px-4 font-normal">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const isCancelled = order.status === 'Cancelado';
                    return (
                      <tr
                        key={order.id}
                        className="bg-[#0f172a] rounded-lg shadow-md hover:bg-[#152033] transition duration-200 cursor-pointer"
                        onClick={() => handleOpenModal(order)}
                      >
                        <td className="py-4 px-4 text-blue-400 font-mono rounded-l-lg">{order.id.substring(0, 6)}...</td>
                        <td className="py-4 px-4 font-medium">{order.client}</td>
                        <td className="py-4 px-4 text-sm">{format(order.date, 'dd/MM/yyyy', { locale: ptBR })}</td>
                        <td className="py-4 px-4 font-bold text-green-400">{formatBRL(order.total)}</td>
                        <td className="py-4 px-4">
                          <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                              disabled={isCancelled} // ** BLOQUEIO APLICADO **
                              className={`p-2 pr-8 rounded-lg text-xs font-semibold cursor-pointer border ${getStatusStyle(order.status)} 
                                                                focus:ring-blue-500 focus:border-blue-500 transition appearance-none ${isCancelled ? 'opacity-50 cursor-not-allowed' : ''}`}
                              style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                            >
                              {orderStatuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 flex gap-1 rounded-r-lg" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenModal(order)}
                            className="p-2 rounded-full text-blue-400 hover:bg-blue-800/70 transition"
                            title="Visualizar/Editar Pedido Completo"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-2 rounded-full text-red-400 hover:bg-red-800/70 transition"
                            title="Deletar Pedido"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-500 bg-[#0f172a] rounded-lg">
                      Nenhum pedido na categoria "{tab}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal de Adicionar/Editar/Visualizar Pedido */}
      {isModalOpen && (
        <OrderModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveOrder}
          orderToEdit={orderToEdit}
        />
      )}

      {/* Modal de Confirmação de Cancelamento */}
      {confirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] text-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3 text-yellow-400">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-bold">Confirmar Cancelamento</h3>
            </div>
            <p className="text-gray-300">
              Ao cancelar o pedido {confirmation.orderId.substring(0, 6)}, o estoque dos itens será estornado e não havera como retornar essa ação. 
              Tem certeza que deseja continuar?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelConfirmation}
                className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition font-semibold"
              >
                Não, Manter Status
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex items-center gap-1 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition font-semibold"
              >
                <Check size={18} /> Sim, Cancelar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}