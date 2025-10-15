const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// 1. O PONTO CRÍTICO: Inicialização do Firebase Admin SDK
// No emulador, isso deve funcionar. Se estiver usando uma serviceAccountKey.json, o caminho deve estar correto.
admin.initializeApp(); // Use esta forma para o emulador

const db = admin.firestore(); // Se a inicialização acima falhar, o código para aqui.

const app = express();

// --- 1. CORS ---
const corsOptions = {
    origin: [
        'http://localhost:3000', 
        'http://127.0.0.1:3000',
        // Adicione aqui o domínio de produção (seu domínio do Firebase Hosting)
    ], 
    credentials: true, 
};
app.use(cors(corsOptions));
app.use(express.json()); 

// --- 2. Middleware de Autenticação e Rotas ---
const isAuthenticated = require('./authMiddleware'); 

// Aplica o middleware de autenticação a TODAS as rotas que começam com /api
// E carrega todas as rotas definidas em routes.js
app.use('/api', isAuthenticated, require('./routes')); 


// Exporta o aplicativo Express como a Cloud Function 'api' (usado no firebase.json)
exports.api = functions.https.onRequest(app); // Exportação da função HTTP