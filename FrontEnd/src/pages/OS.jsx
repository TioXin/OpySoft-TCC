import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, orderBy, updateDoc, addDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { Plus, Edit, Trash2, Search, ClipboardList, Clock, CheckCircle, XCircle, AlertTriangle, Package, DollarSign, Wrench } from 'lucide-react';
import AddOSModal from '../components/AddOSModal';

// Status de Ordem de Serviço
const OS_STATUS = [
  { value: 'Recebido', label: 'Recebido', icon: Clock, color: 'bg-blue-500' },
  { value: 'Diagnóstico', label: 'Diagnóstico', icon: Search, color: 'bg-yellow-500' },
  { value: 'Aguardando Peça', label: 'Aguardando Peça', icon: Package, color: 'bg-orange-500' },
  { value: 'Em Reparação', label: 'Em Reparação', icon: Wrench, color: 'bg-indigo-500' },
  { value: 'Aguardando Cliente', label: 'Aguardando Cliente', icon: AlertTriangle, color: 'bg-red-500' },
  { value: 'Entregue/Pago', label: 'Entregue/Pago', icon: CheckCircle, color: 'bg-green-500' }, // NOVO STATUS
  { value: 'Cancelado', label: 'Cancelado', icon: XCircle, color: 'bg-gray-500' },
];

// Helper para formatar moeda
const formatBRL = (value) => {
  const numValue = parseFloat(value) || 0;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue);
};

export default function OrdemDeServico() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (currentUser) {
      const q = query(
        collection(db, "empresas", currentUser.uid, "ordens_servico"),
        orderBy('data_recebimento', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const osList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(osList);
        setLoading(false);
      }, (error) => {
        console.error("Erro ao buscar ordens de serviço:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [currentUser]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' ||
      order.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.equipamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === '' || order.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleAddOrder = async (newOrderData) => {
    try {
      const osRef = doc(collection(db, "empresas", currentUser.uid, "ordens_servico"));
      await setDoc(osRef, {
        ...newOrderData,
        data_recebimento: new Date().toISOString(),
        status: 'Recebido', // Status inicial
        valor_estimado: parseFloat(newOrderData.valor_estimado) || 0, // Renomeado para estimado
        valor_final: 0, // Novo campo para o valor final
        cliente_id: newOrderData.cliente_id, // Salva o ID do cliente
      });
      setIsAddModalOpen(false);
      return Promise.resolve(); // Retorna uma Promise resolvida para o modal
    } catch (error) {
      console.error("Erro ao adicionar Ordem de Serviço:", error);
      alert("Falha ao adicionar OS. Verifique o console para detalhes.");
      return Promise.reject(error); // Retorna uma Promise rejeitada
    }
  };

  const handleEditOrder = async (id, updatedData) => {
    try {
      await updateDoc(doc(db, "empresas", currentUser.uid, "ordens_servico", id), updatedData);
      setIsEditModalOpen(false);
      setEditingOrder(null);
      return Promise.resolve();
    } catch (error) {
      console.error("Erro ao editar Ordem de Serviço:", error);
      alert("Falha ao editar OS. Verifique o console para detalhes.");
      return Promise.reject(error);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta Ordem de Serviço?')) {
      try {
        await deleteDoc(doc(db, "empresas", currentUser.uid, "ordens_servico", id));
      } catch (error) {
        console.error("Erro ao excluir Ordem de Serviço:", error);
        alert("Falha ao excluir OS. Verifique o console para detalhes.");
      }
    }
  };

  const handleUpdateStatus = async (order, newStatus) => {
    if (newStatus === 'Entregue/Pago') {
      const valorFinalStr = window.prompt(`Digite o VALOR FINAL da Ordem de Serviço ${order.id?.substring(0, 8) || 'N/A'}:`, order.valor_estimado || 0);
      const valorFinal = parseFloat(valorFinalStr);

      if (isNaN(valorFinal) || valorFinal <= 0) {
        alert("Valor final inválido. A transação não será registrada.");
        return;
      }

      try {
        // 1. Atualiza a OS com o valor final e o novo status
        // 1. Atualiza a OS com o valor final e o novo status
        await updateDoc(doc(db, "empresas", currentUser.uid, "ordens_servico", order.id), {
          status: newStatus,
          valor_final: valorFinal,
          data_entrega: new Date().toISOString(),
        });

        // 2. Cria a transação de Receita em Finanças
        await addDoc(collection(db, "empresas", currentUser.uid, "transacoes"), {
          tipo: 'Receita',
          categoria: 'Ordem de Serviço',
          descricao: `OS ${order.id?.substring(0, 8) || 'N/A'} - ${order.equipamento} (${order.cliente_nome})`,
          valor: valorFinal,
          data: new Date().toISOString(),
          origem: 'OS',
          os_id: order.id,
          cliente_id: order.cliente_id, // Adiciona o ID do cliente para referência
        });

        alert(`✅ OS ${order.id?.substring(0, 8) || 'N/A'} marcada como Entregue/Pago. Receita de ${formatBRL(valorFinal)} registrada em Finanças.`);

      } catch (error) {
        console.error("Erro ao finalizar OS e registrar transação:", error);
        alert("Falha ao finalizar OS e registrar transação. Verifique o console para detalhes.");
      }
    } else {
      // Apenas atualiza o status para os outros casos
      try {
        await updateDoc(doc(db, "empresas", currentUser.uid, "ordens_servico", order.id), {
          status: newStatus,
        });
      } catch (error) {
        console.error("Erro ao atualizar status:", error);
        alert("Falha ao atualizar status. Verifique o console para detalhes.");
      }
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Carregando Ordens de Serviço...</div>;
  }

  return (
    <div className="p-2 sm:p-6 w-full">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center">
        <ClipboardList className="mr-3" size={28} />
        Ordens de Serviço
      </h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:justify-between sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:flex-1">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar por Cliente ou Equipamento..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white border-gray-600 placeholder-gray-400 text-sm sm:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
          <select
            className="py-2 px-4 border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white border-gray-600 text-sm sm:text-base"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos os Status</option>
            {OS_STATUS.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
        >
          <Plus size={20} className="mr-2" />
          Nova OS
        </button>
      </div>

      {/* Versão Desktop - Tabela */}
      <div className="hidden lg:block bg-gray-800 shadow-lg rounded-lg overflow-x-auto border border-gray-700 custom-scrollbar">
        <table className="w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">OS ID</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cliente</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Equipamento</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Valor Estimado</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Valor Final</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Recebimento</th>
              <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const statusInfo = OS_STATUS.find(s => s.value === order.status) || { label: order.status, color: 'bg-gray-400' };
                return (
                  <tr key={order.id} className="hover:bg-gray-700 transition duration-150">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{order.id.substring(0, 8)}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300">{order.cliente_nome}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300">{order.equipamento}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatBRL(order.valor_estimado)}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-400">{order.valor_final ? formatBRL(order.valor_final) : '-'}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(order.data_recebimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <select
                        className="py-1 px-2 border rounded-lg text-xs bg-gray-700 text-white border-gray-600"
                        onChange={(e) => handleUpdateStatus(order, e.target.value)}
                        value={order.status}
                      >
                        {OS_STATUS.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => { setEditingOrder(order); setIsEditModalOpen(true); }}
                        className="text-indigo-400 hover:text-indigo-300 inline-block"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-400 hover:text-red-300 inline-block"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="px-4 sm:px-6 py-4 text-center text-gray-400 bg-gray-800">Nenhuma Ordem de Serviço encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Versão Mobile - Cards */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const statusInfo = OS_STATUS.find(s => s.value === order.status) || { label: order.status, color: 'bg-gray-400' };
            return (
              <div key={order.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4 shadow-lg hover:shadow-xl transition">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-400 uppercase">OS ID</p>
                      <p className="font-semibold text-white text-sm">{order.id.substring(0, 8)}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full text-white ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 uppercase">Cliente</p>
                    <p className="text-sm text-gray-300">{order.cliente_nome}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 uppercase">Equipamento</p>
                    <p className="text-sm text-gray-300">{order.equipamento}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 uppercase">Valor Estimado</p>
                    <p className="text-sm text-gray-300">{formatBRL(order.valor_estimado)}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 uppercase">Valor Final</p>
                    <p className="text-sm font-semibold text-green-400">{order.valor_final ? formatBRL(order.valor_final) : '-'}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 uppercase">Recebimento</p>
                    <p className="text-sm text-gray-300">
                      {new Date(order.data_recebimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 uppercase mb-2">Atualizar Status</p>
                    <select
                      className="w-full py-1 px-2 border rounded-lg text-xs bg-gray-700 text-white border-gray-600"
                      onChange={(e) => handleUpdateStatus(order, e.target.value)}
                      value={order.status}
                    >
                      {OS_STATUS.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-700">
                    <button
                      onClick={() => { setEditingOrder(order); setIsEditModalOpen(true); }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 px-2 rounded transition flex items-center justify-center gap-1"
                      title="Editar"
                    >
                      <Edit size={16} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-2 rounded transition flex items-center justify-center gap-1"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center text-gray-400 py-8 bg-gray-800 rounded-lg border border-gray-700">
            Nenhuma Ordem de Serviço encontrada.
          </div>
        )}
      </div>

      {/* Modal de Adicionar OS */}
      <AddOSModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddOrder}
      />

      {/* Modal de Edição de OS (Reutiliza o mesmo modal, passando os dados para edição) */}
      {isEditModalOpen && editingOrder && (
        <AddOSModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setEditingOrder(null); }}
          onAdd={(updatedData) => handleEditOrder(editingOrder.id, updatedData)}
          initialData={editingOrder} // Passa os dados iniciais para o modal
        />
      )}
    </div>
  );
}