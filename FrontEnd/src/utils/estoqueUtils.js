import { db } from '../firebase-config';
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';

/**
 * * @param {Array} items 
 * @param {string} userId 
 * @param {number} multiplier
 */
export const updateEstoqueFromPedido = async (items, userId, multiplier) => {
    if (!items || items.length === 0) return;
    if (multiplier !== 1 && multiplier !== -1) {
        throw new Error("Multiplicador inválido. Use 1 para estorno ou -1 para consumo.");
    }

    try {
        await runTransaction(db, async (transaction) => {

            for (const itemPedido of items) {
                // Assumindo que você usa item.id e item.qtd ou item.qty
                const itemId = itemPedido.itemId || itemPedido.id;
                const quantidade = parseFloat(itemPedido.qtd || itemPedido.qty) || 0;

                if (!itemId || quantidade <= 0) continue;

                const itemRef = doc(db, "empresas", userId, "inventario", itemId);
                const itemDoc = await transaction.get(itemRef); // <-- LEITURA DENTRO DA TRANSAÇÃO

                if (!itemDoc.exists()) {
                    console.warn(`Item de inventário não encontrado (ID: ${itemId}). Pulando.`);
                    continue; 
                }

                // Se o inventário usa 'qtdAtual' e 'estoqueMinimo'
                const currentQtd = itemDoc.data().qtdAtual || 0;
                const estoqueMinimo = itemDoc.data().estoqueMinimo || 5;

                const changeAmount = quantidade * multiplier; // (Ex: -1 * 10 = -10, ou 1 * 10 = +10)
                const newQtd = currentQtd + changeAmount;
                
                if (multiplier === -1 && newQtd < 0) {
                    // Impede consumo se estoque for insuficiente e reverte toda a transação
                    throw new Error(`Estoque insuficiente para o item: ${itemPedido.name || itemId}. (Necessário: ${quantidade}, Disponível: ${currentQtd})`);
                }

                // Define o novo status do estoque
                let newStatus = 'Em Estoque';
                if (newQtd <= 1) {
                    newStatus = 'Estoque Crítico';
                } else if (newQtd <= estoqueMinimo) {
                    newStatus = 'Estoque Baixo';
                }

                // Escreve a atualização (DENTRO DA TRANSAÇÃO)
                transaction.update(itemRef, {
                    qtdAtual: newQtd,
                    status: newStatus,
                    dataUltimaAtualizacao: serverTimestamp(),
                });
            }
        });
        
        console.log(`Ajuste de estoque concluído com sucesso (Multiplicador: ${multiplier}).`);
        return true; // Sucesso

    } catch (error) {
        console.error("ERRO CRÍTICO na transação de estoque:", error);
        throw error; // Propaga o erro para quem chamou a função
    }
};