import { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../AuthContext'; 

// =================================================================
// FUNÇÕES DE ESTOQUE (UTILITY - Requer Permissão na Regra do Firestore)
// =================================================================
const updateEstoqueFromPedido = async (itens, userId, multiplicador) => {
    // CORREÇÃO: Recebe 'components' do pedido.
    if (!itens || itens.length === 0) return;

    const batch = writeBatch(db);

    for (const itemPedido of itens) {
        // CORREÇÃO: O ID do documento do inventário é salvo no campo 'id' do componente do pedido.
        // A quantidade no pedido é salva no campo 'qty'.
        const itemId = itemPedido.id; // ID do documento no inventário
        const quantidade = parseFloat(itemPedido.qty) || 0; // Campo 'qty' do pedido
        
        if (!itemId || quantidade <= 0) continue;

        // CORREÇÃO CRÍTICA: Ajusta o caminho para a coleção 'inventario'
        // Consistente com OrderModal.jsx: 'empresas/{userId}/inventario/{itemId}'
        const itemRef = doc(db, "empresas", userId, "inventario", itemId); 
        const changeAmount = quantidade * multiplicador; 

        // Lê o estado atual do item
        const itemDoc = await getDoc(itemRef);
        
        // Verificação crítica: Se o item não existe, o batch.update falhará.
        if (itemDoc.exists()) {
            // CORREÇÃO: Padronizando para 'quantity' como o nome do campo de estoque.
            const currentQtd = itemDoc.data().quantity || 0;
            const newQtd = currentQtd + changeAmount;
            
            // CORREÇÃO: Se não há estoque mínimo definido, usa 5 como fallback
            const estoqueMinimo = itemDoc.data().estoqueMinimo || 5; 

            let newStatus = 'Em Estoque';
            if (newQtd <= 0) { // Correção: Se for 0 ou negativo, é "Sem Estoque"
                 newStatus = 'Sem Estoque';
            } else if (newQtd <= estoqueMinimo) {
                newStatus = 'Estoque Baixo';
            }

            batch.update(itemRef, {
                // CORREÇÃO: Usando 'quantity' para o campo do BD (consistência)
                quantity: newQtd, 
                status: newStatus,
                dataUltimaAtualizacao: new Date(),
            });
        } else {
             // Se o documento do inventário não existe, loga o erro para debug
            console.warn(`[Estoque] Documento do inventário não encontrado para ID: ${itemId}`);
            // NOTA: Aqui você pode decidir se quer lançar um erro ou apenas continuar. 
            // Para não quebrar o commit do batch, apenas avise e continue.
        }
    }
    
    // CORREÇÃO: Tenta o commit mesmo se algum doc não existiu (o .update em si não será feito)
    await batch.commit();
};

// =================================================================
// HOOK PRINCIPAL
// =================================================================
export const usePedidos = () => {
    const { currentUser } = useAuth();
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            setPedidos([]);
            return;
        }

        const pedidosRef = collection(db, "pedidos");
        const q = query(
            pedidosRef,
            where("userId", "==", currentUser.uid),
            orderBy("dataCriacao", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const listaPedidos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setPedidos(listaPedidos);
            setLoading(false);
            setErro(null); 
        }, (error) => {
            console.error("Erro ao carregar pedidos:", error);
            setErro(error.message || "Falha ao carregar pedidos.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);
    
    // -----------------------------------------------------------------
    // LÓGICA DE MUDANÇA DE STATUS (Desconta/Estorna Estoque)
    // -----------------------------------------------------------------
    const alterarStatusPedido = async (pedidoId, novoStatus) => {
        if (!currentUser) throw new Error("Usuário não autenticado.");
        const userId = currentUser.uid;
        const pedidoRef = doc(db, "pedidos", pedidoId);

        try {
            const pedidoSnap = await getDoc(pedidoRef);
            if (!pedidoSnap.exists()) throw new Error("Pedido não encontrado.");
            const pedido = pedidoSnap.data();
            // CORREÇÃO: O campo no pedido se chama 'components' (consistência com OrderModal.jsx)
            const itensPedido = pedido.components || []; 
            const statusAnterior = pedido.status;
            
            // 1. Atualiza o status do Pedido
            await updateDoc(pedidoRef, { status: novoStatus });

            // 2. Lógica de Estoque: Desconta se for CONCLUÍDO (Entregues/Enviados)
            if ((novoStatus === 'Entregues' || novoStatus === 'Enviados') && statusAnterior !== 'Entregues' && statusAnterior !== 'Enviados') {
                // Multiplicador = -1 (decrementa/desconta estoque)
                await updateEstoqueFromPedido(itensPedido, userId, -1);
            } 
            // 3. Lógica de Estoque: Estorna se for CANCELADO (e não era Cancelado antes)
            // NOTA: A lógica aqui assume que o pedido PENDENTE não descontou estoque.
            else if (novoStatus === 'Cancelado' && statusAnterior !== 'Cancelado' && (statusAnterior === 'Entregues' || statusAnterior === 'Enviados')) {
                // Multiplicador = 1 (incrementa/estorna estoque)
                // Apenas estorna se o status anterior era um que já descontou o estoque.
                await updateEstoqueFromPedido(itensPedido, userId, 1);
            }
        } catch (error) {
            console.error("Erro ao alterar status/estoque:", error);
            throw new Error("Falha ao alterar o status do pedido e/ou estoque: " + error.message);
        }
    };
    
    // -----------------------------------------------------------------
    // LÓGICA DE DELETAR PEDIDO (Estorna Estoque)
    // -----------------------------------------------------------------
    const deletarPedido = async (pedidoId) => {
        if (!currentUser) throw new Error("Usuário não autenticado.");
        const userId = currentUser.uid;
        const pedidoRef = doc(db, "pedidos", pedidoId);

        try {
            const pedidoSnap = await getDoc(pedidoRef);
            if (pedidoSnap.exists()) {
                const pedido = pedidoSnap.data();
                // CORREÇÃO: O campo no pedido se chama 'components'
                const itensPedido = pedido.components || [];

                // Se o pedido JÁ havia descontado o estoque (Entregues ou Enviados), 
                // é necessário estornar.
                if (pedido.status === 'Entregues' || pedido.status === 'Enviados') {
                    // Multiplicador = 1 (incrementa/estorna estoque)
                    await updateEstoqueFromPedido(itensPedido, userId, 1);
                }
                // Se estava Pendente/Processando/Cancelado, o estoque não foi afetado 
                // pelo pedido, então não há estorno necessário.
            }

            await deleteDoc(pedidoRef);

        } catch (error) {
            console.error("Erro ao deletar pedido:", error);
            throw new Error("Falha ao deletar o pedido e/ou estornar o estoque: " + error.message);
        }
    };

    return { pedidos, loading, erro, alterarStatusPedido, deletarPedido };
};