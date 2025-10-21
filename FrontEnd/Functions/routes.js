// functions/routes.js

const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

// Inicializa os serviços necessários
const db = admin.firestore();
const { getAuth } = require("firebase-admin/auth");

const ITEM_COLLECTION = "itens";
const USER_PROFILE_COLLECTION = "users";

// --------------------------------------------------------------------
// 1. ROTAS DE CADASTRO E PERFIL (POST /api/register)
// --------------------------------------------------------------------
router.post("/register", async (req, res) => {
  const data = req.body;
  if (!data.email || !data.password || !data.cnpj) {
    return res.status(400).send({ error: "Dados obrigatórios faltando." });
  }
  let user_id = null;

  try {
    // 1. Criação no Firebase Auth
    const userRecord = await getAuth().createUser({
      email: data.email,
      password: data.password,
      emailVerified: false,
    });
    user_id = userRecord.uid; // 2. Salvando no Firestore
    const profile_data = {
      nome_empresa: data.nome_empresa,
      cnpj: data.cnpj,
      razao_social: data.razao_social,
      email: data.email,
      telefone: data.telefone || "",
      uid: user_id, // CORREÇÃO FINAL PARA O ERRO UNDEFINED
      criado_em: new Date(),
    };
    await db.collection(USER_PROFILE_COLLECTION).doc(user_id).set(profile_data);

    return res
      .status(201)
      .send({ message: "Usuário e Perfil criados com sucesso!", uid: user_id });
  } catch (error) {
    console.error("Erro no cadastro:", error.code, error.message);
    if (error.code === "auth/email-already-exists") {
      return res.status(400).send({ error: "Este e-mail já está em uso." });
    } /* // 🛑 CORREÇÃO DO STATUS 500: Comentar o rollback. // O rollback pode estar falhando e disparando um erro não capturado que leva ao 500.
    if (user_id) {
      getAuth()
        .deleteUser(user_id)
        .catch((e) => console.error("Falha ao limpar usuário:", e));
    }
    */ // Se o erro não for de e-mail duplicado, retorna 500.
    return res
      .status(500)
      .send({ error: "Erro interno ao salvar dados. Tente novamente." });
  }
});

// --------------------------------------------------------------------
// 2. ROTAS PROTEGIDAS DE DADOS (GET/POST /api/itens)
// --------------------------------------------------------------------

// ... (GET /itens omitido para brevidade)

// POST /itens
router.post("/itens", async (req, res) => {
  // ATENÇÃO: req.user.uid é injetado por um middleware de autenticação (não incluso).
  // Se a rota for chamada sem um token válido, req.user será undefined.
  const user_id = req.user.uid;
  const itemData = req.body;
  if (!itemData.nome) {
    return res.status(400).send({ error: "O campo 'nome' é obrigatório." });
  }

  const novoItem = {
    user_id: user_id,
    nome: itemData.nome,
    descricao: itemData.descricao || null,
    criado_em: new Date(), // CORREÇÃO FINAL PARA O ERRO UNDEFINED
  };
  try {
    const docRef = await db.collection(ITEM_COLLECTION).add(novoItem);
    return res.status(201).send({
      message: "Item criado com sucesso!",
      id: docRef.id,
      ...novoItem,
    });
  } catch (error) {
    console.error("Erro ao criar item:", error);
    return res.status(500).send({ error: "Falha ao salvar o novo item." });
  }
});

module.exports = router;
