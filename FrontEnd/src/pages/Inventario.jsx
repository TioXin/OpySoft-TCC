import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import AddItemModal from '../components/AddItemModal';
import AdjustStockModal from '../components/AdjustStockModal';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function Inventario() {
  const { currentUser } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [loading, setLoading] = useState(true);

  // FUNÇÕES UTILS
  const formatBRL = (value) => {
    const numValue = parseFloat(value) || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue);
  };

  const getStatusStyle = (quantity, minStock, criticalStock) => {
    // Garante que as quantidades sejam números para a comparação
    const qty = parseInt(quantity) || 0;
    const min = parseInt(minStock) || 20;
    const critical = parseInt(criticalStock) || 5;

    if (qty <= critical) return { label: 'Estoque Crítico', className: 'bg-red-500/20 text-red-400' };
    if (qty <= min) return { label: 'Estoque Baixo', className: 'bg-yellow-500/20 text-yellow-400' };
    return { label: 'Em estoque', className: 'bg-green-500/20 text-green-400' };
  };

  // FUNÇÕES CRUD
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    // Caminho consistente: /users/{userId}/inventario
    const inventoryCollectionRef = collection(db, 'empresas', currentUser.uid, 'inventario');
    const q = query(inventoryCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInventory(items);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar inventário:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const onSaveItem = async (newItemData) => {
    if (!currentUser?.uid) return;
    try {
      // Cria a referência para o novo documento na subcoleção correta
      const docRef = doc(collection(db, 'empresas', currentUser.uid, 'inventario'));
      await setDoc(docRef, {
        ...newItemData,
        dataCriacao: new Date().toISOString(),
        // Garante que a quantidade e minStock sejam salvos como strings (ou number se preferir)
        quantity: newItemData.quantity ? String(newItemData.quantity) : '0',
        minStock: newItemData.minStock ? String(newItemData.minStock) : '20',
        criticalStock: newItemData.criticalStock ? String(newItemData.criticalStock) : '5',
      });
      alert("Item adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
      alert("Falha ao adicionar item. Verifique as permissões.");
    }
  };

  const onUpdateItem = async (itemId, updatedData) => {
    if (!currentUser?.uid) return;
    try {
      // Referência para o documento específico a ser atualizado
      const itemRef = doc(db, 'empresas', currentUser.uid, 'inventario', itemId);
      await setDoc(itemRef, updatedData, { merge: true });
      alert("Item atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      alert("Falha ao atualizar item. Verifique as permissões.");
    }
  };

  const onDeleteItem = async (itemId) => {
    if (!currentUser?.uid || !window.confirm("Tem certeza que deseja deletar este item?")) return;
    try {
      // Referência para o documento específico a ser deletado
      await deleteDoc(doc(db, 'empresas', currentUser.uid, 'inventario', itemId));
      alert("Item deletado com sucesso!");
    } catch (error) {
      console.error("Erro ao deletar item:", error);
      alert("Falha ao deletar item. Verifique as permissões.");
    }
  };

  const handleEditClick = (item) => {
    setItemToEdit(item);
  };

  if (loading) {
    return <div className="p-8 text-white">Carregando inventário...</div>;
  }

  return (
    <div className="p-6 sm:p-8 bg-[#0b1220] min-h-screen text-white overflow-y-auto custom-scrollbar">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-400">Inventário</h1>
          <p className="text-gray-400 mt-1">Gerencie seu estoque de componentes. Os alertas são definidos por item.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition duration-150 shadow-lg shadow-blue-500/30 w-full sm:w-auto"
          aria-label="Adicionar item ao inventário"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Adicionar Item</span>
          <span className="sm:hidden">Item</span>
        </button>
      </header>

      <div className="bg-[#1e293b] p-4 sm:p-6 rounded-xl shadow-2xl">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-200">Estoque de Componentes</h2>

        <div className="overflow-x-auto hidden md:block">
          <table className="w-full divide-y divide-gray-700 table-auto">
            <thead>
              <tr className="text-gray-400 text-sm uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Componente</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Preço (R$)</th>
                <th className="px-4 py-3 text-left">Qtd. Atual</th>
                <th className="px-4 py-3 text-left">Fornecedor</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-500">
                    Nenhum componente cadastrado.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const { label, className } = getStatusStyle(
                    item.quantity,
                    item.minStock,
                    item.criticalStock
                  );

                  return (
                    <tr key={item.id} className="hover:bg-gray-800/50 transition">
                      <td className="px-4 py-4 font-medium text-gray-100 break-words">{item.component}</td>
                      <td className="px-4 py-4 text-gray-300">{item.sku}</td>
                      <td className="px-4 py-4 text-green-400 font-semibold">{formatBRL(item.price)}</td>
                      <td className="px-4 py-4 text-gray-300">{item.quantity}</td>
                      <td className="px-4 py-4 text-gray-300">{item.supplier}</td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${className}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => handleEditClick(item)}
                            title="Editar Item"
                            className="text-blue-400 hover:text-blue-300 p-1 rounded-full hover:bg-gray-700 transition"
                            aria-label={`Editar ${item.component}`}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            title="Deletar Item"
                            className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-gray-700 transition"
                            aria-label={`Deletar ${item.component}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile: cards view */}
        <div className="md:hidden space-y-4">
          {inventory.length === 0 ? (
            <div className="text-center py-6 text-gray-500">Nenhum componente cadastrado.</div>
          ) : (
            inventory.map((item) => {
              const { label, className } = getStatusStyle(
                item.quantity,
                item.minStock,
                item.criticalStock
              );

              return (
                <div key={item.id} className="bg-[#0f1724] p-4 rounded-lg shadow-sm border border-gray-800">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-100 truncate">{item.component}</h3>
                        <span className={`text-xs font-semibold ${className.replace('/20','/30')}`}></span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">SKU: {item.sku || '-'}</p>
                      <p className="text-sm text-green-400 font-semibold mt-2">{formatBRL(item.price)}</p>
                      <p className="text-xs text-gray-300 mt-1">Qtde: <span className="font-medium text-gray-100">{item.quantity}</span></p>
                      {item.supplier && <p className="text-xs text-gray-400 mt-1">Fornecedor: {item.supplier}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${className}`}>{label}</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditClick(item)} className="text-blue-400 hover:text-blue-300 p-2 rounded-md bg-gray-800/30" aria-label={`Editar ${item.component}`}>
                          <Edit size={16} />
                        </button>
                        <button onClick={() => onDeleteItem(item.id)} className="text-red-400 hover:text-red-300 p-2 rounded-md bg-gray-800/30" aria-label={`Deletar ${item.component}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showAddModal && <AddItemModal onClose={() => setShowAddModal(false)} onSave={onSaveItem} />}

      {itemToEdit && (
        <AdjustStockModal
          onClose={() => setItemToEdit(null)}
          itemToEdit={itemToEdit}
          onUpdate={onUpdateItem}
        />
      )}
    </div>
  );
}