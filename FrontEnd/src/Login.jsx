
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import axios from 'axios';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase-config';

export default function LoginCompanyPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Função que lida com a submissão do formulário
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. AUTENTICAÇÃO NO FIREBASE (CLIENT-SIDE)
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. OBTÉM O TOKEN DE AUTORIZAÇÃO
            const idToken = await user.getIdToken();

            // 3. CHAMADA AO BACKEND (NODE.JS) PARA VERIFICAÇÃO/PERFIL
            // 🎯 ALTERADO: de '/api/check-auth' para '/api/profile'
            const response = await axios.get('/api/profile', {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            // Se as etapas 1, 2 e 3 passarem:
            localStorage.setItem('firebaseIdToken', idToken);
            console.log("Login bem-sucedido! Dados do usuário no backend:", response.data);

            // 🎯 AJUSTE CRÍTICO: Usar a rota exatamente como está no App.jsx
            navigate('/DashBoard');

        } catch (err) {
            console.error("Erro de Login:", err);

            // Tratamento de erros do Firebase Auth
            let errorMessage = "Falha no login. Verifique suas credenciais.";

            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                // A partir do Firebase SDK v9.23.0, 'auth/invalid-credential' cobre a maioria dos erros de senha/usuário
                errorMessage = "Email ou senha incorretos. Tente novamente.";
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = "Formato de email inválido.";
            } else if (err.response?.data?.error) {
                // Erro vindo do backend Node.js
                errorMessage = err.response.data.error;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4">

            {/* Header ... */}
            <header className="absolute top-0 left-0 w-full z-20 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8" />
                    <a href="/">
                        <span className="font-bold text-lg text-white">
                            Opy<span className="text-cyan-500">Soft</span>
                        </span>
                    </a>
                </div>
                <nav className="hidden md:flex gap-6 text-white">
                    <a href="/" className="hover:text-sky-700 transition">Home</a>
                    <a href="/#sobre" className="hover:text-sky-700 transition">Sobre</a>
                    <a href="/#beneficios" className="hover:text-sky-700 transition">Benefícios</a>
                    <a href="/#contato" className="hover:text-sky-700 transition">Contato</a>
                </nav>
            </header>

            {/* Formulário de Login */}
            <div className="bg-gray-800 bg-opacity-90 p-8 rounded-lg shadow-lg w-full max-w-2xl mt-24">
                <h2 className="text-3xl font-bold mb-6 text-center">Login da Empresa</h2>

                {/* EXIBIÇÃO DE ERRO */}
                {error && (
                    <div className="bg-red-500 text-white p-3 rounded-md mb-4 text-center">
                        {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleLogin}>

                    {/* Email */}
                    <div>
                        <label className="block text-sm mb-1">Email corporativo</label>
                        <div className="flex items-center bg-gray-700 rounded px-3 py-2">
                            <Mail className="text-cyan-500 mr-2" />
                            <input
                                type="email"
                                placeholder="contato@empresa.com.br"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-transparent w-full outline-none text-white"
                                required
                            />
                        </div>
                    </div>


                    {/* Senha */}
                    <div>
                        <label className="block text-sm mb-1">Senha</label>
                        <div className="flex items-center bg-gray-700 rounded px-3 py-2">
                            <Lock className="text-cyan-500 mr-2" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-transparent w-full outline-none text-white"
                                required
                            />
                        </div>
                    </div>

                    {/* Botão de login */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="cursor-pointer w-full bg-cyan-500 hover:bg-sky-700 text-white font-semibold py-3 rounded-md shadow transition disabled:bg-gray-500"
                    >
                        {loading ? 'Entrando...' : 'Login'}
                    </button>

                    {/* Link para registro */}
                    <p className="text-center text-sm mt-4 text-gray-400">
                        Não tem uma conta? crie uma agora!!{' '}
                        <a
                            href='/register'
                            onClick={(e) => { e.preventDefault(); navigate('/register'); }}
                            className="text-cyan-500 hover:text-sky-400 underline"
                        >
                            <br />
                            Registre-se
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
}