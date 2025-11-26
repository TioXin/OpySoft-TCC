import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, AlertTriangle, Check } from "lucide-react";
import OrderModal from "../components/OrderModal";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { db } from '../firebase-config';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, addDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
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
  const [confirmation, setConfirmation] = useState({ isOpen: false, orderId: null });

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
          id: doc.id, ...data, components: data.components || [],
          date: data.dataCriacao?.toDate ? data.dataCriacao.toDate() : new Date(),
          total: data.total || data.suggestedPrice || 0,
          client: data.clientName || data.client || 'N/A',
          status: data.status || 'Pendente',
          valor_final: data.valor_final || data.total || data.suggestedPrice || 0, // Novo campo
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
      const cleanOrderData = (data) => Object.fromEntries(Object.entries(data).filter(([_, value]) => value !== undefined && value !== null));
      const dataToSave = {
        clientName: newOrderData.clientName, total: newOrderData.total,
        costPrice: newOrderData.costPrice, profitMargin: newOrderData.profitMargin,
        status: newOrderData.status, notes: newOrderData.notes,
        components: newOrderData.components.map(comp => cleanOrderData(comp)),
        valor_final: newOrderData.valor_final || newOrderData.total, // Salva o valor final
      };
      if (newOrderData.id) {
        const orderRef = doc(baseCollection, newOrderData.id);
        const currentOrder = orders.find(o => o.id === newOrderData.id);
        if (currentOrder?.status !== newOrderData.status) {
          await handleStockTransaction(newOrderData.id, newOrderData.status, currentOrder.status);
        }
        await updateDoc(orderRef, dataToSave);
      } else {
        const docRef = await addDoc(baseCollection, { ...dataToSave, dataCriacao: serverTimestamp(), userId: currentUser.uid });
        if (dataToSave.status !== 'Pendente') {
          await handleStockTransaction(docRef.id, dataToSave.status, 'Pendente');
        }
      }
      setIsModalOpen(false);
      setOrderToEdit(null);
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Falha ao salvar o pedido. Detalhes: " + error.message);
    }
  };

  // ✅ CORREÇÃO FINAL: Esta função agora é o cérebro central do estoque.
  const handleStockTransaction = async (orderId, newStatus, oldStatus) => {
    if (!currentUser?.uid || oldStatus === newStatus) return;

    const orderRef = doc(db, 'empresas', currentUser.uid, 'pedidos', orderId);

    // Lógica para registrar transação de Receita em Finanças
    const handleFinanceTransaction = async (orderData, finalValue) => {
      await addDoc(collection(db, "empresas", currentUser.uid, "transacoes"), {
        tipo: 'Receita',
        categoria: 'Venda de Produto',
        descricao: `Pedido ${orderData.id?.substring(0, 6) || 'N/A'} - ${orderData.clientName || orderData.client}`,
        valor: finalValue,
        data: new Date().toISOString(),
        origem: 'Pedido',
        pedido_id: orderData.id,
      });
    };

    try {
      await runTransaction(db, async (transaction) => {
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists()) throw new Error("Pedido não encontrado.");

        const orderData = orderDoc.data();
        const CONSUMPTION_STATUSES = ['Enviados', 'Entregues'];
        const wasInConsumption = CONSUMPTION_STATUSES.includes(oldStatus);
        const isNowInConsumption = CONSUMPTION_STATUSES.includes(newStatus);

        let multiplier = 0;
        if (isNowInConsumption && !wasInConsumption) multiplier = -1; // DEDUÇÃO
        if (wasInConsumption && !isNowInConsumption) multiplier = 1;  // ESTORNO

        // --- ETAPA 1: Lógica de Estoque ---
        if (multiplier !== 0) {
          const components = orderData.components || [];
          const inventoryUpdates = [];

          for (const item of components) {
            const inventoryRef = doc(db, 'empresas', currentUser.uid, 'inventario', item.id);
            const inventoryDoc = await transaction.get(inventoryRef);

            if (!inventoryDoc.exists()) throw new Error(`Item do inventário (ID: ${item.id}) não encontrado.`);

            const currentQty = parseFloat(inventoryDoc.data().quantity) || 0;
            const itemQtyInOrder = parseFloat(item.qty || item.quantity || 0) || 0;
            const newQty = currentQty + (itemQtyInOrder * multiplier);

            if (newQty < 0) throw new Error(`Estoque insuficiente para o item "${inventoryDoc.data().component || item.name}".`);

            inventoryUpdates.push({
              ref: inventoryRef,
              quantity: String(newQty)
            });
          }

          // 1. Atualiza o inventário
          inventoryUpdates.forEach(update => {
            transaction.update(update.ref, { quantity: update.quantity });
          });
        }

        // --- ETAPA 2: Lógica de Finanças e Status ---
        let finalValue = orderData.valor_final || orderData.total || orderData.suggestedPrice || 0;
        let updateData = { status: newStatus, dataAtualizacao: serverTimestamp() };

        if (newStatus === 'Entregues' && oldStatus !== 'Entregues') {
          const valorFinalStr = window.prompt(`Digite o VALOR FINAL do pedido ${orderData.id?.substring(0, 6) || 'N/A'}...:`, finalValue);
          finalValue = parseFloat(valorFinalStr);

          if (isNaN(finalValue) || finalValue <= 0) {
            // Se o usuário cancelar ou inserir valor inválido, não prossegue com a transação
            throw new Error("Transação cancelada: Valor final inválido ou não fornecido.");
          }

          updateData.valor_final = finalValue;
          updateData.data_entrega = new Date().toISOString();

          // 3. Cria a transação de Receita em Finanças (FORA DA TRANSAÇÃO DO FIREBASE)
          // O addDoc não pode ser executado dentro de runTransaction, então vamos apenas atualizar o status e o valor final.
          // A transação de Finanças será feita após o runTransaction ser bem-sucedido.
        }

        // 2. Atualiza o status do pedido no final da transação bem-sucedida
        transaction.update(orderRef, updateData);
      });

      // Se o runTransaction foi bem-sucedido e o status é 'Entregues', registra a transação de Finanças
      const order = orders.find(o => o.id === orderId);
      if (newStatus === 'Entregues' && oldStatus !== 'Entregues') {
        const updatedOrder = orders.find(o => o.id === orderId);
        const finalValue = updatedOrder.valor_final || updatedOrder.total || updatedOrder.suggestedPrice || 0;
        await handleFinanceTransaction(order, finalValue);
        alert(`Status do pedido atualizado para ${newStatus}, estoque ajustado e Receita de ${formatBRL(finalValue)} registrada em Finanças!`);
      } else {
        alert(`Status do pedido atualizado para ${newStatus} e estoque ajustado com sucesso!`);
      }

    } catch (error) {
      console.error("Erro na transação de estoque/status:", error);
      alert(`Falha na atualização. Nenhuma mudança foi salva. Detalhe: ${error.message}`);
      // Recarrega a página para reverter visualmente a mudança de status que falhou
      window.location.reload();
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const order = orders.find(o => o.id === id);
    if (!order || order.status === newStatus) return;
    if (order.status === 'Cancelado') {
      alert("Pedidos cancelados não podem ter seu status alterado.");
      return;
    }
    if (newStatus === 'Cancelado') {
      setConfirmation({ isOpen: true, orderId: id });
      return;
    }
    await handleStockTransaction(id, newStatus, order.status);
  };

  const handleConfirmCancel = async () => {
    const { orderId } = confirmation;
    const order = orders.find(o => o.id === orderId);
    if (order) {
      await handleStockTransaction(orderId, 'Cancelado', order.status);
    }
    setConfirmation({ isOpen: false, orderId: null });
  };

  const handleCancelConfirmation = () => {
    setConfirmation({ isOpen: false, orderId: null });
  };

  const handleDeleteOrder = async (id) => {
    const order = orders.find(o => o.id === id);
    if (!order || !window.confirm(`Tem certeza que deseja deletar o pedido ${id?.substring(0, 6) || 'N/A'}...?`)) return;
    try {
      const CONSUMPTION_STATUSES = ['Enviados', 'Entregues'];
      if (CONSUMPTION_STATUSES.includes(order.status)) {
        await handleStockTransaction(id, 'Cancelado', order.status);
      }
      await deleteDoc(doc(db, 'empresas', currentUser.uid, 'pedidos', id));
      alert(`Pedido ${id?.substring(0, 6) || 'N/A'}... deletado.`);
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

  const filteredOrders = orders.filter(order => tab === "Todos" || order.status === tab);

  return (
    <div className="text-white p-6 md:p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-400">Gestão de Pedidos</h1>
          <p className="text-gray-400">Acompanhe e gerencie todos os pedidos.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition">
          <Plus size={18} /> Novo Pedido Manual
        </button>
      </div>
      <div className="flex gap-4 mb-4 border-b border-gray-700/50 overflow-x-auto whitespace-nowrap">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 -mb-px font-medium transition ${tab === t ? "border-b-2 border-blue-500 text-blue-400" : "text-gray-400 hover:text-white"}`}>
            {t} ({orders.filter(o => t === 'Todos' || o.status === t).length})
          </button>
        ))}
      </div>
      <section className="bg-[#1e293b] p-6 rounded-xl shadow-2xl">
        <h2 className="text-xl font-semibold mb-4 text-gray-200">{tab} Pedidos</h2>
        {loading ? (
          <div className="text-center py-10 text-gray-500">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-gray-300 border-separate" style={{ borderSpacing: '0 0.5rem' }}>
              <thead className="text-gray-400">
                <tr>
                  <th className="py-3 px-4 font-normal">ID</th>
                  <th className="py-3 px-4 font-normal">Cliente</th>
                  <th className="py-3 px-4 font-normal">Data</th>
                  <th className="py-3 px-4 font-normal">Total Estimado</th>
                  <th className="py-3 px-4 font-normal">Valor Final</th>
                  <th className="py-3 px-4 font-normal">Status</th>
                  <th className="py-3 px-4 font-normal">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="bg-[#0f172a] rounded-lg shadow-md hover:bg-[#152033] transition cursor-pointer" onClick={() => handleOpenModal(order)}>
                      <td className="py-4 px-4 text-blue-400 font-mono rounded-l-lg">{order.id.substring(0, 6)}...</td>
                      <td className="py-4 px-4 font-medium">{order.client}</td>
                      <td className="py-4 px-4 text-sm">{format(order.date, 'dd/MM/yyyy', { locale: ptBR })}</td>
                      <td className="py-4 px-4 font-bold text-yellow-400">{formatBRL(order.total)}</td>
                      <td className="py-4 px-4 font-bold text-green-400">{formatBRL(order.valor_final)}</td>
                      <td className="py-4 px-4">
                        <div className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(order.status)}`}>
                          <select
                            className={`appearance-none bg-transparent border-none focus:outline-none cursor-pointer ${getStatusStyle(order.status)}`}
                            value={order.status}
                            onChange={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, e.target.value); }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {orderStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="py-4 px-4 flex gap-1 rounded-r-lg" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleOpenModal(order)} className="p-2 rounded-full text-blue-400 hover:bg-blue-800/70 transition" title="Editar Pedido"><Edit size={18} /></button>
                        <button onClick={() => handleDeleteOrder(order.id)} className="p-2 rounded-full text-red-400 hover:bg-red-800/70 transition" title="Deletar Pedido"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" className="text-center py-10 text-gray-500 bg-[#0f172a] rounded-lg">Nenhum pedido na categoria "{tab}".</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {isModalOpen && <OrderModal onClose={() => setIsModalOpen(false)} onSave={handleSaveOrder} orderToEdit={orderToEdit} />}
      {confirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] text-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3 text-yellow-400"><AlertTriangle size={24} /><h3 className="text-xl font-bold">Confirmar Cancelamento</h3></div>
            <p className="text-gray-300">Ao cancelar, o estoque dos itens será estornado (se aplicável). Deseja continuar?</p>
            <div className="flex justify-end gap-3">
              <button onClick={handleCancelConfirmation} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition font-semibold">Não, Manter</button>
              <button onClick={handleConfirmCancel} className="flex items-center gap-1 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition font-semibold"><Check size={18} /> Sim, Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}