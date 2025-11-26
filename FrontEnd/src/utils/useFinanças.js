import { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    getDoc,
    getDocs
} from 'firebase/firestore';
import { useAuth } from '../AuthContext';

// -----------------------------------------------------------------
// FUNÇÃO auxiliar para atualizar o valor do pedido
// -----------------------------------------------------------------
/**
 * Atualiza o campo 'total' de um pedido aninhado.
 */
const atualizarValorPedido = async (documentId, novoValor, userId, tipoDocumento) => {
    if (!userId || !documentId) {
        console.warn(`AVISO: userId ou ${tipoDocumento}Id ausente para atualização.`);
        return;
    }

    const collectionName = tipoDocumento === 'pedido' ? 'pedidos' : 'ordens_servico';
    const documentRef = doc(db, 'empresas', userId, collectionName, documentId);

    try {
        const docSnap = await getDoc(documentRef);

        if (!docSnap.exists()) {
            console.error(`${tipoDocumento} ${documentId} não encontrado. Não foi possível atualizar o total.`);
            throw new Error(`O ${tipoDocumento} ${documentId} não existe. Atualização abortada.`);
        }

        const updateFields = {
            dataAtualizacao: serverTimestamp(),
        };

        // Pedidos usam 'total', OS podem usar 'valorTotal'
        if (tipoDocumento === 'pedido') {
            updateFields.total = novoValor;
        } else if (tipoDocumento === 'os') {
            updateFields.valorTotal = novoValor;
        }

        await updateDoc(documentRef, updateFields);
    } catch (e) {
        console.error(`Erro ao atualizar ${tipoDocumento} (e/ou transação):`, e);
        throw new Error(e.message || `Falha ao atualizar o ${tipoDocumento}.`);
    }
};

// -----------------------------------------------------------------
// FUNÇÃO HOOK useFinancas
// -----------------------------------------------------------------
export const useFinancas = () => {
    const { currentUser } = useAuth();
    const [transacoes, setTransacoes] = useState([]);
    const [summary, setSummary] = useState({ receitaTotal: 0, despesaTotal: 0, lucroLiquido: 0 });
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    // -----------------------------------------------------------------
    // ONSNAPSHOT para carregar transações
    // -----------------------------------------------------------------
    useEffect(() => {
        if (!currentUser?.uid) return;

        setLoading(true);
        const transacoesRef = collection(db, 'empresas', currentUser.uid, 'transacoes');
        // Adicionando um orderBy 'data' para garantir a ordem
        const q = query(transacoesRef, orderBy('data', 'desc')); 

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let totalReceita = 0;
            let totalDespesa = 0;

            const transacoesList = snapshot.docs.map(doc => {
                const data = doc.data();
                const valor = parseFloat(data.valor) || 0;
                
                if (data.tipo === 'Receita') {
                    totalReceita += valor;
                } else if (data.tipo === 'Despesa') {
                    totalDespesa += valor;
                }

                return {
                    id: doc.id,
                    ...data,
                    valor: valor,
                    // Converter o Timestamp para Date para manipulação
                    data: data.data?.toDate ? data.data.toDate() : (data.data || new Date()),
                };
            });

            setTransacoes(transacoesList);
            setSummary({
                receitaTotal: totalReceita,
                despesaTotal: totalDespesa,
                lucroLiquido: totalReceita - totalDespesa,
            });
            setLoading(false);
            setErro(null);
        }, (error) => {
            console.error("Erro ao carregar transações:", error);
            setErro("Falha ao carregar as transações. Verifique sua conexão e permissões.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);


    // -----------------------------------------------------------------
    // FUNÇÃO DE ADIÇÃO (mantida e melhorada)
    // -----------------------------------------------------------------
    const adicionarTransacao = async (transacaoData) => {
        if (!currentUser?.uid) throw new Error("Usuário não autenticado para adicionar.");

        // O 'data' deve ser serverTimestamp() na adição
        const novaTransacao = {
            ...transacaoData,
            userId: currentUser.uid,
            data: serverTimestamp(), 
            // Garante que os campos de ID não sejam undefined
            pedidoId: transacaoData.pedidoId || null,
            osId: transacaoData.osId || null,
        };
        
        try {
            const transacoesRef = collection(db, 'empresas', currentUser.uid, 'transacoes');
            await addDoc(transacoesRef, novaTransacao);
        } catch (error) {
            console.error("Erro ao adicionar transação:", error);
            throw new Error(error.message || "Falha ao adicionar a transação.");
        }
    };
    
    // -----------------------------------------------------------------
    // FUNÇÃO DEDICADA PARA VENDAS (Receitas)
    // -----------------------------------------------------------------
    /**
     * Adiciona uma transação de Receita e a vincula ao Pedido ou OS.
     * @param {Object} data - Dados da transação (valor, clienteId, descricao)
     * @param {string} [pedidoId] - ID do Pedido, se aplicável.
     * @param {string} [osId] - ID da OS, se aplicável.
     */
    const adicionarTransacaoDeVenda = async (data, pedidoId, osId) => {
        const transacaoData = {
            tipo: 'Receita',
            categoria: pedidoId ? 'Venda de Pedido' : (osId ? 'Serviço de OS' : 'Venda Geral'),
            valor: parseFloat(data.valor),
            clienteId: data.clienteId,
            clienteNome: data.clienteNome,
            descricao: data.descricao,
            pedidoId: pedidoId || null,
            osId: osId || null,
        };
        await adicionarTransacao(transacaoData);
    };


    // -----------------------------------------------------------------
    // FUNÇÃO DE ATUALIZAÇÃO (Melhorada para OS e Pedido)
    // -----------------------------------------------------------------
    const atualizarTransacao = async (id, dataToUpdate) => {
        if (!currentUser?.uid) throw new Error("Usuário não autenticado para atualizar.");

        try {
            const transacaoRef = doc(db, 'empresas', currentUser.uid, 'transacoes', id);
            const transacaoDoc = await getDoc(transacaoRef);
            const transacaoOriginal = transacaoDoc.data();

            if (!transacaoDoc.exists()) throw new Error("Transação não encontrada.");

            // 1. Atualiza a transação em Finanças
            await updateDoc(transacaoRef, {
                ...dataToUpdate,
                dataAtualizacao: serverTimestamp(),
            });

            // 2. Atualiza o valor do Pedido ou OS relacionado, se for Receita
            const finalPedidoId = dataToUpdate.pedidoId || transacaoOriginal?.pedidoId;
            const finalOsId = dataToUpdate.osId || transacaoOriginal?.osId;
            const novoValor = dataToUpdate.valor;
            const tipoTransacao = dataToUpdate.tipo || transacaoOriginal?.tipo;

            if (tipoTransacao === 'Receita' && novoValor !== undefined) {
                if (finalPedidoId) {
                    await atualizarValorPedido(finalPedidoId, novoValor, currentUser.uid, 'pedido');
                } else if (finalOsId) {
                    await atualizarValorPedido(finalOsId, novoValor, currentUser.uid, 'os');
                }
            }

        } catch (error) {
            console.error("Erro ao atualizar transação (e/ou documento relacionado):", error);
            throw new Error(error.message || "Falha ao atualizar a transação.");
        }
    };

    // -----------------------------------------------------------------
    // FUNÇÃO DE DELEÇÃO (ajustada para usar a coleção correta)
    // -----------------------------------------------------------------
    const deletarTransacao = async (id) => {
        if (!currentUser?.uid) throw new Error("Usuário não autenticado para deletar.");

        const transacaoRef = doc(db, 'empresas', currentUser.uid, 'transacoes', id);
        try {
            await deleteDoc(transacaoRef);
        } catch (error) {
            console.error("Erro ao deletar transação:", error);
            throw new Error(error.message || "Falha ao deletar. Verifique as Regras de Segurança.");
        }
    };


    return { transacoes, summary, loading, erro, adicionarTransacao, atualizarTransacao, deletarTransacao, adicionarTransacaoDeVenda };
}