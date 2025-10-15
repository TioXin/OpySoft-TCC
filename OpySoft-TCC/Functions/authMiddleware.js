// functions/authMiddleware.js

const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');

// Função de Middleware para validar o ID Token e anexar o usuário à requisição
const isAuthenticated = async (req, res, next) => {
    
    [cite_start]// EXCEÇÃO: A rota de registro não exige autenticação [cite: 5, 12]
    if (req.path === '/register' && req.method === 'POST') {
        return next();
    }
    
    [cite_start]// 1. Extração do Cabeçalho Authorization [cite: 13]
    const authHeader = req.headers.authorization; 

    // Verifica se o cabeçalho existe e se começa com 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ error: "Unauthorized. Token Bearer não fornecido." });
    }

    [cite_start]// Pega apenas o token [cite: 13]
    const token = authHeader.split('Bearer ')[1];

    try {
        [cite_start]// 2. Validação Firebase (Replica auth.verify_id_token(token)) [cite: 14]
        const decodedToken = await getAuth().verifyIdToken(token);
        
        // 3. Mapeamento Usuário
        [cite_start]// O `uid` do Firebase é o que você usava como 'username' do request.user[cite: 15].
        [cite_start]// Não é mais necessário criar o usuário no DB local do Django[cite: 16].
        req.user = decodedToken; 
        
        return next(); // Prossegue para a rota/view
        
    } catch (error) {
        [cite_start]// Replica auth.InvalidIdTokenError [cite: 14]
        console.error('Erro de validação de token:', error);
        return res.status(401).send({ error: "Token Firebase inválido ou expirado." });
    }
};

module.exports = isAuthenticated;