import React, { useState, useEffect } from "react";
import { db } from '../firebase-config';
import { collection, query, onSnapshot, serverTimestamp, doc, setDoc, addDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import AddOrderModal from "../components/AddOrderModal";
import { updateStockTransaction } from '../utils/estoqueUtils'; // Importa a função de transação corrigida

// Componente de Campo (Field) para o layout
function Field({ label, children, isCompatible = true, compatibilityMessage = "Incompatível" }) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-gray-700">
            <span className="text-gray-300 font-medium w-1/3">{label}</span>
            <div className="flex-1 flex items-center gap-2 justify-end">
                {children}
                {!isCompatible && <span className="text-red-400 text-xs text-right">({compatibilityMessage})</span>}
            </div>
        </div>
    );
}

const formatBRL = (value) => {
    const numValue = parseFloat(value) || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue);
};

// Constantes para as chaves e nomes das categorias
const CORE_COMPONENTS = ['cpu', 'mobo', 'ram', 'gpu', 'storage', 'psu', 'case', 'cooler'];
const LABELS = {
    cpu: 'Processador (CPU)', mobo: 'Placa-Mãe', ram: 'Memória RAM',
    gpu: 'Placa de Vídeo (GPU)', storage: 'Armazenamento', psu: 'Fonte (PSU)',
    case: 'Gabinete', cooler: 'Cooler',
};
const CATEGORY_MAP = {
    cpu: 'CPU', mobo: 'Placa-Mãe', ram: 'RAM', gpu: 'GPU',
    storage: 'Armazenamento', psu: 'Fonte', case: 'Gabinete', cooler: 'Cooler',
};

export default function Montador() {
    const { currentUser } = useAuth();
    const [inventory, setInventory] = useState([]); // Um único array para todo o inventário
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState({}); // Um único objeto para todos os componentes selecionados
    const [profit, setProfit] = useState(20);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [prefilledData, setPrefilledData] = useState(null);

    // Carregamento e processamento do inventário
    useEffect(() => {
        if (!currentUser?.uid) {
            setLoading(false);
            return;
        }
        const inventoryCollectionRef = collection(db, 'empresas', currentUser.uid, 'inventario');
        const q = query(inventoryCollectionRef);
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(item => (parseFloat(item.quantity) || 0) > 0); // Filtra itens com estoque
            setInventory(items);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao carregar inventário:", error);
            setLoading(false);
        });
        return unsubscribe;
    }, [currentUser]);

    // Funções de manipulação e cálculo
    const handleSelect = (key, itemId) => {
        const item = inventory.find(i => i.id === itemId) || null;
        setSelected(prev => {
            const newState = { ...prev, [key]: item };
            // Limpa seleções dependentes se a base mudar
            if (key === 'cpu') {
                newState.mobo = null;
                newState.ram = null;
            }
            if (key === 'mobo') {
                newState.ram = null;
            }
            return newState;
        });
    };

    const clearSelection = () => {
        setSelected({});
        setProfit(20);
    };

    // Cálculos de custo e potência
    const costPrice = CORE_COMPONENTS.reduce((sum, key) => sum + (parseFloat(selected[key]?.price) || 0), 0);
    const estimatedPower = CORE_COMPONENTS.reduce((sum, key) => sum + (parseInt(selected[key]?.power || selected[key]?.estimatedPower, 10) || 0), 0);
    // Correção: Margem de Lucro (Profit Margin) é calculada sobre o preço de venda.
    // Preço de Venda = Custo / (1 - Margem)
    const profitValue = Number(profit);
    // Garante que a margem de lucro não seja 100% ou mais para evitar divisão por zero ou preço negativo.
    const profitMarginPercentage = (profitValue >= 100 || profitValue < 0) ? 0 : profitValue / 100;
    
    let suggestedPrice = 0;
    if (costPrice > 0 && profitMarginPercentage < 1) {
        // Preço de Venda = Custo / (1 - Margem)
        suggestedPrice = costPrice / (1 - profitMarginPercentage);
    } else if (costPrice > 0 && profitMarginPercentage === 0) {
        // Se a margem for 0%, o preço sugerido é o custo.
        suggestedPrice = costPrice;
    } else {
        suggestedPrice = 0;
    }
    const isReadyToProceed = CORE_COMPONENTS.every(key => selected[key] !== null && selected[key] !== undefined);

    // Lógica de compatibilidade
    const getCompatibility = (key) => {
        const { cpu, mobo, psu } = selected;
        if (key === 'mobo' && cpu && mobo && cpu.socket !== mobo.socket) {
            return { compatible: false, message: `Socket ${mobo.socket} incompatível com CPU ${cpu.socket}` };
        }
        if (key === 'ram' && mobo && selected.ram && mobo.ramType !== selected.ram.ramType) {
            return { compatible: false, message: `RAM ${selected.ram.ramType} incompatível com Placa-Mãe ${mobo.ramType}` };
        }
        if (key === 'psu' && psu) {
            const psuWattage = parseInt(psu.watt, 10) || 0;
            if (psuWattage > 0 && estimatedPower > psuWattage) {
                return { compatible: false, message: `Fonte de ${psuWattage}W pode ser insuficiente para ${estimatedPower}W` };
            }
        }
        return { compatible: true };
    };

    // Funções de transação
    const handlePrepareOrder = () => {
        if (!isReadyToProceed) {
            alert("Por favor, selecione todos os 8 componentes principais para prosseguir.");
            return;
        }
        const dataForModal = {
            components: CORE_COMPONENTS.map(key => ({
                category: LABELS[key], id: selected[key].id, name: selected[key].component,
                price: selected[key].price, sku: selected[key].sku || 'N/A', qty: 1,
            })),
            costPrice, profitMargin: profit, suggestedPrice, estimatedPower, status: "Pendente",
        };
        setPrefilledData(dataForModal);
        setIsModalOpen(true);
    };

    const handleSaveToMontados = async () => {
        if (!isReadyToProceed) {
            alert("Por favor, selecione todos os 8 componentes principais para salvar.");
            return;
        }
        const pcName = window.prompt("Digite um nome para este PC Montado (ex: PC Gamer 3060):");
        if (!pcName || pcName.trim() === "") return;

        setIsSaving(true);
        const itemsToDeduct = CORE_COMPONENTS.map(key => ({ id: selected[key].id, qty: 1 }));
        const pcData = {
            name: pcName,
            costPrice: String(costPrice),
            profitMargin: Number(profit),
            suggestedPrice: String(suggestedPrice),
            estimatedPower: estimatedPower,
            status: "Pronto para Venda",
            components: itemsToDeduct.map((item, i) => ({ ...item, name: selected[CORE_COMPONENTS[i]].component, price: selected[CORE_COMPONENTS[i]].price })),
            quantity: '1', // Estoque inicial do PC Montado
            dataMontagem: serverTimestamp(),
        };

        try {
            // Transação para deduzir componentes e criar o PC Montado
            await updateStockTransaction(itemsToDeduct, currentUser.uid, -1);
            const newPCRef = doc(collection(db, 'empresas', currentUser.uid, 'pcs_montados'));
            await setDoc(newPCRef, { ...pcData, id: newPCRef.id });
            alert(`✅ PC Montado "${pcName}" salvo com sucesso e componentes deduzidos do estoque!`);
            clearSelection();
        } catch (error) {
            console.error("Erro ao salvar PC Montado:", error);
            alert(`❌ Falha ao salvar PC. Detalhes: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinalizeTransaction = async (finalOrderData) => {
        setIsSaving(true);
        setIsModalOpen(false);
        const itemsToDeduct = finalOrderData.components.map(item => ({ id: item.id, qty: item.qty }));
	        const orderDocData = {
	            clientName: finalOrderData.clientName, total: String(finalOrderData.suggestedPrice),
	            costPrice: String(finalOrderData.costPrice), profitMargin: finalOrderData.profitMargin,
	            status: finalOrderData.status, notes: finalOrderData.notes,
	            dataCriacao: serverTimestamp(),
	        };
	        
	        const valorTotal = parseFloat(finalOrderData.suggestedPrice) || 0;
	        const valorCusto = parseFloat(finalOrderData.costPrice) || 0;
	        // A lógica de lucro será feita no useFinancas.js (Receita - Despesa)
	
	        try {
	            // 1. Deduzir componentes do estoque
	            await updateStockTransaction(itemsToDeduct, currentUser.uid, -1);
	            
	            // 2. Criar o Pedido
	            const newOrderRef = doc(collection(db, 'empresas', currentUser.uid, 'pedidos'));
	            await setDoc(newOrderRef, { ...orderDocData, orderId: newOrderRef.id, components: finalOrderData.components });
	            
	            // 3. Criar Transação de Receita (Valor Total da Venda)
	            if (valorTotal > 0) {
	                await addDoc(collection(db, "transacoes"), {
	                    userId: currentUser.uid,
	                    tipo: 'Receita',
	                    valor: valorTotal,
	                    descricao: `Faturamento Pedido #${newOrderRef.id.substring(0, 6)} - ${finalOrderData.clientName}`,
	                    data: serverTimestamp(),
	                    pedidoId: newOrderRef.id,
	                });
	            }
	            
	            // 4. Criar Transação de Despesa (Custo)
	            if (valorCusto > 0) {
	                await addDoc(collection(db, "transacoes"), {
	                    userId: currentUser.uid,
	                    tipo: 'Despesa',
	                    valor: valorCusto,
	                    descricao: `Custo de Produção Pedido #${newOrderRef.id.substring(0, 6)}`,
	                    data: serverTimestamp(),
	                    pedidoId: newOrderRef.id,
	                });
	            }
	
	            alert(`✅ Pedido para ${finalOrderData.clientName} finalizado, estoque deduzido e transações financeiras registradas!`);
	            clearSelection();
	        } catch (error) {
            console.error("Erro na transação:", error);
            alert(`❌ Falha ao concluir a transação. Detalhes: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="text-white p-8">Carregando inventário...</div>;
    }

    return (
        <div className="flex flex-col lg:flex-row bg-[#0b1220] text-white min-h-screen p-6 gap-6">
            {/* Coluna da Esquerda: Seletores de Componentes */}
            <main className="flex-1 lg:w-2/3 bg-[#1e293b] p-6 rounded-xl shadow-xl">
                <h1 className="text-3xl font-bold mb-6 text-blue-400 border-b border-gray-700 pb-4">Montador de PC</h1>
                <div className="space-y-2">
                    {CORE_COMPONENTS.map(key => {
                        const { compatible, message } = getCompatibility(key);
                        const isDisabled = (key === 'mobo' && !selected.cpu) || (key === 'ram' && !selected.mobo);
                        return (
                            <Field key={key} label={LABELS[key]} isCompatible={compatible} compatibilityMessage={message}>
                                <select
                                    value={selected[key]?.id || ''}
                                    onChange={(e) => handleSelect(key, e.target.value)}
                                    disabled={isDisabled}
                                    className="bg-[#0f172a] p-2 rounded text-sm w-full max-w-xs disabled:opacity-50"
                                >
                                    <option value="">Selecione um(a) {LABELS[key]}</option>
                                    {inventory
                                        .filter(item => {
                                            if (item.category !== CATEGORY_MAP[key]) return false;
                                            if (key === 'mobo' && selected.cpu) return item.socket === selected.cpu.socket;
                                            if (key === 'ram' && selected.mobo) return item.ramType === selected.mobo.ramType;
                                            return true;
                                        })
                                        .map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.component} - {formatBRL(item.price)}
                                            </option>
                                        ))}
                                </select>
                            </Field>
                        );
                    })}
                </div>
            </main>

            {/* Coluna da Direita: Resumo e Ações */}
            <aside className="lg:w-1/3 bg-[#1e293b] p-6 rounded-xl shadow-xl flex flex-col h-fit sticky top-6">
                <h2 className="text-2xl font-bold mb-4 text-green-400">Resumo da Montagem</h2>
                <div className="space-y-4 flex-grow">
                    <div className="flex justify-between items-center text-gray-300">
                        <span>Custo Total:</span>
                        <span className="font-bold text-lg text-yellow-400">{formatBRL(costPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-300">
                        <span>Potência Total (W):</span>
                        <span className="font-bold text-lg text-blue-400">{estimatedPower}W</span>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Margem de Lucro (%)</label>
                        <input type="number" value={profit} onChange={(e) => setProfit(e.target.value)} min="0" className="w-full p-2 rounded bg-[#0f172a] border border-gray-700 text-center" />
                    </div>
                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="text-lg font-semibold text-green-400">Preço Sugerido (Venda):</h3>
                        <p className="text-4xl font-extrabold mt-1">{formatBRL(suggestedPrice)}</p>
                    </div>
                </div>
                <div className="mt-6 space-y-3">
                    <button onClick={handlePrepareOrder} disabled={isSaving || !isReadyToProceed} className="w-full py-3 rounded-lg font-bold transition bg-teal-600 hover:bg-teal-700 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        Finalizar e Criar Pedido
                    </button>
                    <button onClick={handleSaveToMontados} disabled={isSaving || !isReadyToProceed} className="w-full py-3 rounded-lg font-bold transition bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        Salvar no Inventário de PCs
                    </button>
                    <button onClick={clearSelection} disabled={isSaving} className="w-full py-2 rounded-lg font-semibold transition bg-gray-600 hover:bg-gray-700">
                        Limpar Seleção
                    </button>
                </div>
            </aside>

            {isModalOpen && prefilledData && (
                <AddOrderModal
                    initialData={prefilledData}
                    onClose={() => setIsModalOpen(false)}
                    onFinalize={handleFinalizeTransaction}
                />
            )}
        </div>
    );
}