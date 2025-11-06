import { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { useAuth } from '../AuthContext';

export const useCompletedOrders = () => {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!currentUser?.uid) {
            setOrders([]);
            setLoading(false);
            return;
        }

        // Caminho para a subcoleção de pedidos
        const baseCollection = collection(db, 'empresas', currentUser.uid, 'pedidos');

        // REQUER ÍNDICE: [status ASC, dataCriacao DESC]
        const q = query(
            baseCollection,
            where('status', '==', 'Entregues'),
            orderBy('dataCriacao', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    total: parseFloat(data.total) || 0,
                    cliente: data.clientName || 'Cliente N/A',
                    data: data.dataCriacao?.toDate ? data.dataCriacao.toDate().toLocaleDateString('pt-BR') : 'N/A',
                };
            });

            setOrders(fetchedOrders);
            setLoading(false);
            setError(null);
        }, (err) => {
            console.error("Erro ao carregar pedidos CONCLUÍDOS (useCompletedOrders):", err);
            setError(`Erro: Crie o índice [status ASC, dataCriacao DESC] para Pedidos (${err.code})`);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    return { orders, loading, error }; // Retorna 'loading' e 'error'
};