// functions/routes.js

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
// Inicializa os serviços necessários
const db = admin.firestore();
const { getAuth } = require('firebase-admin/auth');

const ITEM_COLLECTION = 'itens'; 
const USER_PROFILE_COLLECTION = 'users';

// --------------------------------------------------------------------
// 1. ROTAS DE CADASTRO E PERFIL (POST /api/register)
// --------------------------------------------------------------------
router.post('/register', async (req, res) => {
    const data = req.body;
    
    // ... Lógica de validação ...

    let user_id = null;

    try {
        // Criação no Firebase Auth
        const userRecord = await getAuth().createUser({
            email: data.email,
            password: data.password,
            emailVerified: false
        });
        user_id = userRecord.uid;
        
        // Salvando no Firestore
        const profile_data = {
            "nome_juridico": data.nome_juridico,
            "cpf_cnpj": data.cpf_cnpj,
            "endereco": data.endereco,
            "telefone": data.telefone || "", 
            "uid": user_id, 
            "criado_em": admin.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection(USER_PROFILE_COLLECTION).doc(user_id).set(profile_data);

        return res.status(201).send({ message: "Usuário e Perfil criados com sucesso!", uid: user_id });

    } catch (error) {
        // ... Lógica de erro ...
        return res.status(500).send({ error: "Erro interno ao salvar dados do perfil. Tente novamente." });
    }
});


// --------------------------------------------------------------------
// 2. ROTAS PROTEGIDAS DE DADOS (GET/POST /api/itens)
// --------------------------------------------------------------------

// GET /itens
router.get('/itens', async (req, res) => {
    // ESSENCIAL: O UID do Firebase injetado pelo authMiddleware
    const user_id = req.user.uid; 
    
    // ... Lógica de GET ...
    
    try {
        const snapshot = await db.collection(ITEM_COLLECTION)
                                 .where('user_id', '==', user_id)
                                 .orderBy('criado_em', 'desc')
                                 .get();
        
        const itens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        return res.status(200).send(itens);
        
    } catch (error) {
        return res.status(500).send({ error: "Falha ao buscar dados." });
    }
});

// POST /itens
router.post('/itens', async (req, res) => {
    // ESSENCIAL: O UID do Firebase injetado pelo authMiddleware
    const user_id = req.user.uid; 
    const itemData = req.body;
    
    if (!itemData.nome) {
        return res.status(400).send({ error: "O campo 'nome' é obrigatório." });
    }

    // VERIFIQUE SE NÃO HÁ MARCAÇÕES DE CITAÇÃO AQUI
    const novoItem = {
        user_id: user_id, // Insere o user_id automaticamente
        nome: itemData.nome,
        descricao: itemData.descricao || null,
        criado_em: admin.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        const docRef = await db.collection(ITEM_COLLECTION).add(novoItem);
        
        return res.status(201).send({ message: "Item criado com sucesso!", id: docRef.id, ...novoItem });
        
    } catch (error) {
        console.error("Erro ao criar item:", error);
        return res.status(500).send({ error: "Falha ao salvar o novo item." });
    }
});

module.exports = router;