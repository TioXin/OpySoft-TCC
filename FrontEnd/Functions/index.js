// index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

// ******************************************************
// AÇÃO CRÍTICA: INICIALIZAÇÃO DEVE SER A PRIMEIRA A SER CHAMADA!
// ******************************************************
admin.initializeApp();

// Importa o roteador SOMENTE DEPOIS que o Admin foi inicializado.
const routes = require("./routes");
// const isAuthenticated = require('./authMiddleware'); // Comentado por enquanto, mas necessário para rotas protegidas

const app = express();

// --- CORS e JSON Parsing ---
const corsOptions = {
  origin: [
    "http://localhost:5173", // Porta padrão do Vite (Ambiente Dev)
    "http://127.0.0.1:5173",
    "http://localhost:3000", // Porta padrão do React CLI
    "http://127.0.0.1:3000", // Adicione aqui o domínio de produção (ex: https://opysoft.web.app)
  ],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
// ---------------------------

// --- Roteamento e Middleware ---
app.use("/api", routes);

// -------------------------------

// Exporta o aplicativo Express como a Cloud Function 'api'
exports.api = functions.https.onRequest(app);
