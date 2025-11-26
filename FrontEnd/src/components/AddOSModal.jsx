import React, { useState, useEffect } from 'react';
import { X, Save, ClipboardList } from 'lucide-react';
import { db } from '../firebase-config';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../AuthContext';

export default function AddOSModal({ isOpen, onClose, onAdd, initialData = null }) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState(initialData ? {
    cliente_nome: initialData.cliente_nome || '',
    cliente_contato: initialData.cliente_contato || '',
    equipamento: initialData.equipamento || '',
    problema_relatado: initialData.problema_relatado || '',
    acessorios: initialData.acessorios || '',
    valor_total: initialData.valor_total || 0,
  } : {
    cliente_nome: '',
    cliente_contato: '',
    equipamento: '',
    problema_relatado: '',
    acessorios: '',
    valor_total: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);

  // Carregar clientes do Firebase
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "empresas", currentUser.uid, "clientes"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClients(clientList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    let finalValue = value;
    if (type === 'number') {
      finalValue = parseFloat(value) || 0;
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleClientSelect = (e) => {
    const clientId = e.target.value;
    setSelectedClientId(clientId);

    if (clientId) {
      const selectedClient = clients.find(c => c.id === clientId);
      if (selectedClient) {
        setFormData(prev => ({
          ...prev,
          cliente_nome: selectedClient.nome,
          cliente_contato: selectedClient.telefone || selectedClient.email || '',
        }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);

    // Validação básica
    if (!formData.cliente_nome || !formData.equipamento || !formData.problema_relatado) {
      alert("Por favor, preencha o nome do cliente, o equipamento e o problema relatado.");
      setIsSaving(false);
      return;
    }

    // Payload final
    const payload = {
      ...formData,
      valor_total: parseFloat(formData.valor_total) || 0,
      cliente_id: selectedClientId, // Adiciona o ID do cliente selecionado
    };

    onAdd(payload)
      .then(() => {
        setIsSaving(false);
        // Resetar formulário após sucesso (apenas se for adição)
        if (!initialData) {
          setFormData({
            cliente_nome: '',
            cliente_contato: '',
            equipamento: '',
            problema_relatado: '',
            acessorios: '',
            valor_total: 0,
          });
          setSelectedClientId(null);
        }
      })
      .catch(() => {
        setIsSaving(false);
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="bg-[#0b1220] p-8 rounded-2xl shadow-2xl shadow-blue-900/50 w-full max-w-lg max-h-[95vh] flex flex-col transform transition-all duration-300 scale-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b border-gray-700/50 pb-4 mb-6 flex-shrink-0">
          <h2 className="text-2xl font-extrabold text-blue-400">
            {initialData ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto pr-2 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Selecionar Cliente Cadastrado */}
            <div>
              <label htmlFor="cliente_select" className="block text-sm font-semibold text-gray-300 mb-1">Selecionar Cliente *</label>
              <select
                id="cliente_select"
                value={selectedClientId || ''}
                onChange={handleClientSelect}
                className="mt-1 block w-full bg-[#1e293b] border border-gray-700 rounded-lg shadow-inner p-3 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              >
                <option value="">-- Selecione um cliente --</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Cliente - Nome e Contato */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cliente_nome" className="block text-sm font-semibold text-gray-300 mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  name="cliente_nome"
                  id="cliente_nome"
                  value={formData.cliente_nome}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-[#1e293b] border border-gray-700 rounded-lg shadow-inner p-3 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                  required
                />
              </div>
              <div>
                <label htmlFor="cliente_contato" className="block text-sm font-semibold text-gray-300 mb-1">Contato</label>
                <input
                  type="text"
                  name="cliente_contato"
                  id="cliente_contato"
                  value={formData.cliente_contato}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-[#1e293b] border border-gray-700 rounded-lg shadow-inner p-3 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                  placeholder="Telefone ou Email"
                />
              </div>
            </div>

            {/* Equipamento */}
            <div>
              <label htmlFor="equipamento" className="block text-sm font-semibold text-gray-300 mb-1">Equipamento *</label>
              <input
                type="text"
                name="equipamento"
                id="equipamento"
                value={formData.equipamento}
                onChange={handleChange}
                className="mt-1 block w-full bg-[#1e293b] border border-gray-700 rounded-lg shadow-inner p-3 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                required
              />
            </div>

            {/* Problema Relatado */}
            <div>
              <label htmlFor="problema_relatado" className="block text-sm font-semibold text-gray-300 mb-1">Problema Relatado *</label>
              <textarea
                name="problema_relatado"
                id="problema_relatado"
                rows="3"
                value={formData.problema_relatado}
                onChange={handleChange}
                className="mt-1 block w-full bg-[#1e293b] border border-gray-700 rounded-lg shadow-inner p-3 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                required
              ></textarea>
            </div>

            {/* Acessórios e Valor */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="acessorios" className="block text-sm font-semibold text-gray-300 mb-1">Acessórios Entregues</label>
                <input
                  type="text"
                  name="acessorios"
                  id="acessorios"
                  value={formData.acessorios}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-[#1e293b] border border-gray-700 rounded-lg shadow-inner p-3 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                />
              </div>
              <div>
                <label htmlFor="valor_total" className="block text-sm font-semibold text-gray-300 mb-1">Valor Estimado (R$)</label>
                <input
                  type="number"
                  name="valor_total"
                  id="valor_total"
                  value={formData.valor_total}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full bg-[#1e293b] border border-gray-700 rounded-lg shadow-inner p-3 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3 border-t border-gray-700/50 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
                disabled={isSaving}
              >
                <Save size={18} className="mr-2" />
                {isSaving ? 'Salvando...' : (initialData ? 'Salvar Alterações' : 'Salvar OS')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}