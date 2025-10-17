// Functions/index.js (FINALMENTE CORRIGIDO)

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// ******************************************************
// AÇÃO CRÍTICA: INICIALIZAÇÃO DEVE SER A PRIMEIRA A SER CHAMADA!
// Ela resolve a 'FirebaseAppError: The default Firebase app does not exist.'
// ******************************************************
admin.initializeApp();

// Importa o roteador SOMENTE DEPOIS que o Admin foi inicializado.
const routes = require('./routes');
const isAuthenticated = require('./authMiddleware');

const app = express();

// --- CORS e JSON Parsing ---
const corsOptions = {
    origin: [
        'http://localhost:5173', // Adicionado a porta padrão do Vite
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        // ... domínios de produção
    ],
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api', require('./routes'));
// --- Roteamento e Middleware ---

// O middleware de autenticação NÃO deve ser aplicado aqui,
// para que a rota /api/register seja pública.
app.use('/api', routes);


// Exporta o aplicativo Express como a Cloud Function 'api'
exports.api = functions.https.onRequest(app);