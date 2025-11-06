import React, { useState, useEffect } from "react";
import { db } from '../firebase-config';
import { collection, query, onSnapshot, serverTimestamp, runTransaction, doc } from 'firebase/firestore'; 
import { useAuth } from '../AuthContext'; 
import AddOrderModal from "../components/AddOrderModal";

function Field({ label, children, isCompatible = true }) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-gray-700">
            <label className="text-gray-300 font-medium">{label}</label>
            <div className={`flex items-center gap-2 ${!isCompatible ? 'border-l-4 border-red-500 pl-2' : ''}`}>
                {children}
                {!isCompatible && <span className="text-red-500 text-sm">(Incompatível)</span>}
            </div>
        </div>
    );
}

const formatBRL = (value) => {
    const numValue = parseFloat(value) || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue);
};

const LABELS = {
    cpu: 'Processador (CPU)',
    mobo: 'Placa-Mãe',
    ram: 'Memória RAM',
    gpu: 'Placa de Vídeo (GPU)',
    storage: 'Armazenamento',
    psu: 'Fonte',
    case: 'Gabinete',
    cooler: 'Cooler (Refrigeração)',
};

const categorizeInventory = (items) => {
    const categories = {
        cpu: [], motherboards: [], rams: [], gpus: [], storages: [], psus: [], cases: [], coolers: [],
    };

    items.forEach(item => {
        item.price = parseFloat(item.price) || 0;
        item.power = parseInt(item.power, 10) || 0;
        item.watt = parseInt(item.watt, 10) || 0;

        switch (item.category) {
            case 'CPU': categories.cpu.push(item); break;
            case 'Placa-Mãe': categories.motherboards.push(item); break;
            case 'RAM': categories.rams.push(item); break;
            case 'GPU': categories.gpus.push(item); break;
            case 'Armazenamento': categories.storages.push(item); break;
            case 'Fonte': categories.psus.push(item); break;
            case 'Gabinete': categories.cases.push(item); break;
            case 'Cooler': categories.coolers.push(item); break;
            default: break;
        }
    });

    return categories;
};

export default function Montador() {
    const { currentUser } = useAuth();
    const [inventoryData, setInventoryData] = useState(null); 
    const [loadingInventory, setLoadingInventory] = useState(true);
    
    const [sel, setSel] = useState({ 
        cpu: null, mobo: null, ram: null, gpu: null, storage: null, psu: null, case: null, cooler: null,
    });
    const [profit, setProfit] = useState(20); 
    
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [prefilledData, setPrefilledData] = useState(null);

    useEffect(() => {
        if (!currentUser?.uid) {
            setLoadingInventory(false);
            return;
        }

        const inventoryCollectionRef = collection(db, 'empresas', currentUser.uid, 'inventario');
        const q = query(inventoryCollectionRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).filter(item => (item.quantity > 0));

            setInventoryData(categorizeInventory(items));
            setLoadingInventory(false);
        }, (error) => {
            console.error("Erro ao carregar inventário:", error);
            setLoadingInventory(false);
        });

        return unsubscribe;
    }, [currentUser]);
    
    const DATA = inventoryData || {
        cpu: [], motherboards: [], rams: [], gpus: [], storages: [], psus: [], cases: [], coolers: []
    };

    const costPrice = Object.values(sel).reduce((sum, item) => sum + (item?.price || 0), 0);
    const estimatedPower = Object.values(sel).reduce((sum, item) => sum + (item?.power || 0), 0);
    const suggestedPrice = costPrice * (1 + (Number(profit) / 100));
    const isReadyToOrder = Object.values(sel).every(v => v !== null);

    const checkCompatibility = (component) => {
        const { cpu, mobo, ram, psu } = sel;
        
        // 1. CPU/Motherboard
        if (component.category === 'Placa-Mãe' && cpu) {
            if (component.socket !== cpu.socket) return false;
        }
        
        // 2. RAM/Motherboard
        if (component.category === 'RAM' && mobo) {
            if (component.ramType !== mobo.ramType) return false;
        }
        
        // 3. PSU/Power Demand (Usa 80% da capacidade da fonte selecionada)
        const psuWatt = component.category === 'Fonte' ? component.watt : psu?.watt || 0;
        if (psuWatt > 0 && estimatedPower > (psuWatt * 0.8)) {
             // Se for um componente que não é a fonte, e a fonte está no limite.
             if (component.category !== 'Fonte') return false; 
        }

        return true;
    };
    
    const handleSelect = (categoryKey, itemId) => {
        let componentList;
        switch (categoryKey) {
            case 'cpu': componentList = DATA.cpu; break;
            case 'mobo': componentList = DATA.motherboards; break;
            case 'ram': componentList = DATA.rams; break;
            case 'gpu': componentList = DATA.gpus; break;
            case 'storage': componentList = DATA.storages; break;
            case 'psu': componentList = DATA.psus; break;
            case 'case': componentList = DATA.cases; break;
            case 'cooler': componentList = DATA.coolers; break;
            default: return;
        }

        const selectedItem = componentList.find(item => item.id === itemId) || null;
        
        setSel(prev => ({
            ...prev,
            [categoryKey]: selectedItem
        }));
    };
    
    const clearSelection = () => {
        setSel({ cpu: null, mobo: null, ram: null, gpu: null, storage: null, psu: null, case: null, cooler: null });
        setProfit(20);
    };

    // Prepara os dados e abre o modal
    const handlePrepareOrder = () => {
        if (!isReadyToOrder) { 
            alert("Por favor, selecione todos os 8 componentes para prosseguir.");
            return;
        }

        const dataForModal = {
            costPrice: costPrice,
            profitMargin: Number(profit) || 0,
            suggestedPrice: suggestedPrice,
            estimatedPower: estimatedPower,
            status: "Pendente",

            components: Object.entries(sel).map(([key, item]) => ({
                category: LABELS[key],
                id: item.id,
                name: item.component, 
                price: item.price,
                sku: item.sku || 'N/A',
                qty: 1 // Sempre 1 para montagem de PC
            })),
            
            userId: currentUser.uid,
            userName: currentUser.email,
        };
        
        setPrefilledData(dataForModal);
        setIsModalOpen(true);
    };

    // Executa a transação atômica completa (Cria Pedido e Deduz Estoque)
    const handleFinalizeTransaction = async (finalOrderData) => {
        if (!currentUser?.uid) {
            alert("Erro de autenticação.");
            return;
        }
        
        setIsSaving(true);
        setIsModalOpen(false); 

        const itemsToDeduct = finalOrderData.components.map(item => ({ 
            id: item.id, 
            qty: item.qty 
        }));
        
        const orderDocData = {
            clientName: finalOrderData.clientName,
            total: finalOrderData.suggestedPrice,
            costPrice: finalOrderData.costPrice,
            profitMargin: finalOrderData.profitMargin,
            estimatedPower: finalOrderData.estimatedPower,
            status: finalOrderData.status,
            notes: finalOrderData.notes,
            dataCriacao: serverTimestamp(),
        };

        try {
            await runTransaction(db, async (transaction) => {
                
                // 1. LEITURAS (Regra do Firestore: reads before writes)
                const inventoryRefs = itemsToDeduct.map(item => 
                    doc(db, 'empresas', currentUser.uid, 'inventario', item.id)
                );
                
                const inventoryDocs = await Promise.all(
                    inventoryRefs.map(ref => transaction.get(ref))
                );

                // 2. VALIDAÇÃO E CÁLCULO
                const updates = [];
                for (let i = 0; i < itemsToDeduct.length; i++) {
                    const item = itemsToDeduct[i];
                    const docSnap = inventoryDocs[i];

                    if (!docSnap.exists()) {
                        throw new Error(`Componente não encontrado (ID: ${item.id}).`);
                    }

                    const currentStock = docSnap.data().quantity || 0;
                    if (currentStock < item.qty) {
                        throw new Error(`Estoque insuficiente para o item ${docSnap.data().component}. Atual: ${currentStock}`);
                    }

                    updates.push({
                        ref: inventoryRefs[i],
                        newQuantity: currentStock - item.qty
                    });
                }

                // 3. ESCRITAS
                const newOrderRef = doc(collection(db, 'empresas', currentUser.uid, 'pedidos'));
                
                // A. Salva o Pedido
                transaction.set(newOrderRef, { 
                    ...orderDocData, 
                    orderId: newOrderRef.id,
                    components: finalOrderData.components 
                });

                // B. Deduz o Estoque
                updates.forEach(update => {
                    transaction.update(update.ref, { quantity: update.newQuantity });
                });
            });

            alert(`✅ Pedido finalizado com sucesso para o cliente ${finalOrderData.clientName}!`);
            clearSelection();
            
        } catch (error) {
            console.error("Erro na transação:", error);
            alert(`❌ Falha ao concluir a transação. Detalhes: ${error.message || "Verifique o console."}`);
        } finally {
            setIsSaving(false);
            setPrefilledData(null);
        }
    };

    if (loadingInventory) {
        return <div className="text-white p-8">Carregando itens do inventário...</div>;
    }
    
    const getComponentPriceAndName = (item) => {
        return `${item.component} ${item.socket ? `(${item.socket})` : ''} - ${formatBRL(item.price)}`;
    };

    return (
        <div className="flex flex-col md:flex-row bg-[#0b1220] text-white min-h-screen">
            <main className="flex-1 w-full p-6 md:p-8 overflow-y-auto">
                <h1 className="text-4xl font-extrabold mb-8 text-blue-400">Montador de PC Profissional</h1>
                
                <div className="bg-[#1e293b] p-6 rounded-xl shadow-xl space-y-4">
                    <h2 className="text-2xl font-semibold border-b border-gray-700 pb-3">Selecione os Componentes</h2>

                    <Field label={LABELS.cpu}>
                        <select
                            value={sel.cpu?.id || ''}
                            onChange={(e) => handleSelect('cpu', e.target.value)}
                            className="bg-[#0f172a] p-2 rounded text-sm w-full sm:w-64"
                        >
                            <option value="">Selecione um CPU</option>
                            {DATA.cpu.map(item => (
                                <option key={item.id} value={item.id}>
                                    {getComponentPriceAndName(item)}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label={LABELS.mobo} isCompatible={!sel.mobo || checkCompatibility(sel.mobo)}>
                        <select
                            value={sel.mobo?.id || ''}
                            onChange={(e) => handleSelect('mobo', e.target.value)}
                            disabled={!sel.cpu}
                            className="bg-[#0f172a] p-2 rounded text-sm w-full sm:w-64 disabled:opacity-50"
                        >
                            <option value="">Selecione uma Placa-Mãe</option>
                            {DATA.motherboards
                                .filter(item => !sel.cpu || item.socket === sel.cpu.socket) // Filtro primário para Socket
                                .map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.component} (RAM: {item.ramType}) - {formatBRL(item.price)}
                                </option>
                            ))}
                        </select>
                    </Field>
                    
                    <Field label={LABELS.ram} isCompatible={!sel.ram || checkCompatibility(sel.ram)}>
                        <select 
                            value={sel.ram?.id || ''} 
                            onChange={(e) => handleSelect('ram', e.target.value)}
                            disabled={!sel.mobo}
                            className="bg-[#0f172a] p-2 rounded text-sm w-full sm:w-64 disabled:opacity-50"
                        >
                            <option value="">Selecione a Memória RAM</option>
                            {DATA.rams
                                .filter(item => !sel.mobo || item.ramType === sel.mobo.ramType) // Filtro primário para Tipo RAM
                                .map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.component} ({item.ramType}) - {formatBRL(item.price)}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label={LABELS.gpu}>
                        <select 
                            value={sel.gpu?.id || ''} 
                            onChange={(e) => handleSelect('gpu', e.target.value)}
                            className="bg-[#0f172a] p-2 rounded text-sm w-full sm:w-64"
                        >
                            <option value="">Selecione a GPU</option>
                            {DATA.gpus.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.component} - {formatBRL(item.price)}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label={LABELS.cooler}>
                        <select 
                            value={sel.cooler?.id || ''} 
                            onChange={(e) => handleSelect('cooler', e.target.value)}
                            className="bg-[#0f172a] p-2 rounded text-sm w-full sm:w-64"
                        >
                            <option value="">Selecione o Cooler</option>
                            {DATA.coolers.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.component} - {formatBRL(item.price)}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label={LABELS.storage}>
                        <select 
                            value={sel.storage?.id || ''} 
                            onChange={(e) => handleSelect('storage', e.target.value)}
                            className="bg-[#0f172a] p-2 rounded text-sm w-full sm:w-64"
                        >
                            <option value="">Selecione o Armazenamento</option>
                            {DATA.storages.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.component} - {formatBRL(item.price)}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label={LABELS.psu} isCompatible={!sel.psu || checkCompatibility(sel.psu)}>
                        <select 
                            value={sel.psu?.id || ''} 
                            onChange={(e) => handleSelect('psu', e.target.value)}
                            className="bg-[#0f172a] p-2 rounded text-sm w-full sm:w-64"
                        >
                            <option value="">Selecione a Fonte</option>
                            {DATA.psus
                                .filter(item => checkCompatibility(item))
                                .map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.component} ({item.watt}W) - {formatBRL(item.price)}
                                </option>
                            ))}
                        </select>
                    </Field>
                    
                    <Field label={LABELS.case}>
                        <select 
                            value={sel.case?.id || ''} 
                            onChange={(e) => handleSelect('case', e.target.value)}
                            className="bg-[#0f172a] p-2 rounded text-sm w-full sm:w-64"
                        >
                            <option value="">Selecione o Gabinete</option>
                            {DATA.cases.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.component} - {formatBRL(item.price)}
                                </option>
                            ))}
                        </select>
                    </Field>
                    
                </div>
            </main>

            <aside className="w-96 bg-[#0f172a] p-8 border-l border-gray-800 flex-shrink-0">
                <h2 className="text-2xl font-extrabold mb-6 text-green-400">Resumo da Montagem</h2>
                
                <div className="space-y-4 bg-[#1e293b] p-4 rounded-lg">
                    <div className="flex justify-between items-center text-gray-300">
                        <span>Custo dos Componentes (R$):</span>
                        <span className="font-bold text-lg">{formatBRL(costPrice)}</span> 
                    </div>
                    <div className="flex justify-between items-center text-gray-300">
                        <span>Consumo Total Estimado (W):</span>
                        <span className={`font-bold text-lg ${sel.psu && estimatedPower > (sel.psu.watt * 0.8) ? 'text-red-500' : 'text-yellow-400'}`}>
                            {estimatedPower}W
                            {sel.psu && estimatedPower > (sel.psu.watt * 0.8) && ' (ALERTA!)'}
                        </span>
                    </div>
                    <div className="border-t border-gray-700 pt-4">
                        <label className="block text-sm font-medium mb-2">Margem de Lucro (%)</label>
                        <input
                            type="number"
                            value={profit}
                            onChange={(e) => setProfit(e.target.value)}
                            min="0"
                            className="w-full p-2 rounded bg-[#0b1220] border border-gray-700 text-center"
                        />
                    </div>
                </div>

                <div className="mt-8 p-4 bg-green-900/30 rounded-lg border border-green-700">
                    <h3 className="text-lg font-semibold text-green-400">Preço Sugerido ao Cliente</h3>
                    <p className="text-4xl font-extrabold mt-2 text-white">{formatBRL(suggestedPrice)}</p> 
                </div>
                
                <button 
                    onClick={handlePrepareOrder} 
                    disabled={isSaving || !isReadyToOrder}
                    className={`w-full mt-6 py-3 rounded-xl font-bold transition 
                        ${isSaving || !isReadyToOrder ? 
                            'bg-gray-500 cursor-not-allowed' : 'bg-[#0ea5a4] hover:bg-[#0c8a8a]'}`}
                >
                    {isSaving ? 'Processando Transação...' : 'Criar Pedido da Montagem'}
                </button>
                <button 
                    onClick={clearSelection} 
                    disabled={isSaving}
                    className="w-full mt-3 py-3 rounded-xl font-bold transition bg-gray-600 hover:bg-gray-700"
                >
                    Limpar Seleção
                </button>
                {!isReadyToOrder && (
                    <p className="text-red-400 text-sm mt-3 text-center">Selecione todos os 8 itens para criar o pedido.</p>
                )}
            </aside>

            {isModalOpen && prefilledData && (
                <AddOrderModal
                    initialData={prefilledData}
                    onClose={() => {
                        setIsModalOpen(false);
                        setPrefilledData(null);
                    }}
                    onFinalize={handleFinalizeTransaction}
                />
            )}
        </div>
    );
}