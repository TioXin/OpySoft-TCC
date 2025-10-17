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
    
    // -----------------------------------------------------------
    // Lógica de validação (Adicione validações específicas aqui,
    // como checar se o CNPJ já existe ou se todos os campos estão preenchidos)
    if (!data.email || !data.password || !data.cnpj) {
        return res.status(400).send({ error: "Dados obrigatórios faltando." });
    }
    // -----------------------------------------------------------

    let user_id = null;

    try {
        // 1. Criação no Firebase Auth
        const userRecord = await getAuth().createUser({
            email: data.email,
            password: data.password,
            emailVerified: false
        });
        user_id = userRecord.uid;
        
        // 2. Salvando no Firestore (CAMPOS AJUSTADOS PARA COMBINAR COM O FRONTEND)
        const profile_data = {
            // AJUSTADO: nome_empresa do frontend (em vez de nome_juridico)
            "nome_empresa": data.nome_empresa, 
            // AJUSTADO: cnpj do frontend (em vez de cpf_cnpj)
            "cnpj": data.cnpj, 
            // NOVO CAMPO: razao_social do frontend
            "razao_social": data.razao_social, 
            
            "email": data.email, // Salva o email
            "telefone": data.telefone || "", 
            "uid": user_id, 
            "criado_em": admin.firestore.FieldValue.serverTimestamp()
            
            // Note: O campo 'endereco' foi removido, pois não está no formulário.
        };
        
        await db.collection(USER_PROFILE_COLLECTION).doc(user_id).set(profile_data);

        return res.status(201).send({ message: "Usuário e Perfil criados com sucesso!", uid: user_id });

    } catch (error) {
        // O Firebase Auth lança erros se o email já estiver em uso, por exemplo.
        console.error("Erro no cadastro:", error.code, error.message); 
        
        // Se a criação do usuário no Auth falhou por e-mail duplicado
        if (error.code === 'auth/email-already-exists') {
             return res.status(400).send({ error: "Este e-mail já está em uso." });
        }
        
        // Se a criação do perfil no Firestore falhou
        if (user_id) {
             // Tenta apagar o usuário do Auth se o Firestore falhar (para evitar 'lixo')
             getAuth().deleteUser(user_id).catch(e => console.error("Falha ao limpar usuário:", e));
        }

        return res.status(500).send({ error: "Erro interno ao salvar dados. Tente novamente." });
    }
});


// --------------------------------------------------------------------
// 2. ROTAS PROTEGIDAS DE DADOS (GET/POST /api/itens)
// --------------------------------------------------------------------

// GET /itens
router.get('/itens', async (req, res) => {
    // ESSENCIAL: O UID do Firebase injetado pelo authMiddleware
    // A propriedade 'req.user' é definida no seu middleware de autenticação.
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
        console.error("Erro ao buscar itens:", error);
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

    // A marcação de citação foi removida daqui:
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