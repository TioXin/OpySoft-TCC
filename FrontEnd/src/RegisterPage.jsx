import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // 🟢 NOVO: Importa Link
import { Building2, Mail, Lock, Phone, Landmark } from 'lucide-react';

// Importar Authentication e Firestore do seu config
import { auth, db } from './firebase-config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; 

export default function RegisterCompanyPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nome_empresa: '',
        cnpj: '',
        razao_social: '',
        email: '',
        telefone: '',
        password: '',
        confirmPassword: '',
    });
    // 🟢 NOVO: Estado para controle da checkbox de termos
    const [isTermsAccepted, setIsTermsAccepted] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError(null);
    };
    
    // 🟢 NOVO: Função para alternar o estado da checkbox
    const handleTermsToggle = () => {
        setIsTermsAccepted(!isTermsAccepted);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 🟢 NOVO: Validação dos termos
        if (!isTermsAccepted) {
            setError("Você deve aceitar os Termos de Serviço para continuar.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. CRIAÇÃO DE USUÁRIO (FIREBASE AUTH)
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );
            const user = userCredential.user;
            const uid = user.uid; // ID único gerado pelo Firebase Auth

            // 2. SALVAR DADOS DA EMPRESA (FIRESTORE) - Coleção 'empresas'
            const empresaRef = doc(db, "empresas", uid);

            await setDoc(empresaRef, {
                uid: uid,
                nome_empresa: formData.nome_empresa,
                cnpj: formData.cnpj,
                razao_social: formData.razao_social,
                email_contato: formData.email,
                telefone: formData.telefone,
                data_cadastro: serverTimestamp(),
            });

            // 3. SALVAR DOCUMENTO DE PERFIL (FIRESTORE) - Coleção 'users'
            const userProfileRef = doc(db, "users", uid);
            await setDoc(userProfileRef, {
                uid: uid,
                nome_empresa: formData.nome_empresa, 
                email: formData.email,
                criado_em: serverTimestamp(),
            });


            console.log("Cadastro bem-sucedido. UID:", uid);
            alert("Cadastro realizado com sucesso! Faça login.");
            navigate('/login');

        } catch (error) {
            // Tratamento de erros de Auth do Firebase
            let errorMessage = "Erro desconhecido durante o cadastro.";

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "Este email já está cadastrado. Tente fazer login.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "O formato do email é inválido.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "A senha deve ter pelo menos 6 caracteres.";
            } else {
                // Erro de Firestore, ou outro erro inesperado
                errorMessage = `Erro: ${error.message}`;
            }

            console.error("Erro no registro:", error);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // 🟢 Variável para controlar se o botão deve ser desabilitado
    const isButtonDisabled = isLoading || !isTermsAccepted;


    return (
        <div className="min-h-screen bg-gradient-to-t from-cyan-700 to-sky-950 text-white flex flex-col items-center justify-center px-4">

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

            {/* Formulário de Cadastro de Empresa */}
            <div className="bg-gray-800 bg-opacity-90 p-8 rounded-lg shadow-lg w-full max-w-2xl mt-24">
                <h2 className="text-3xl font-bold mb-6 text-center">Cadastro da Empresa</h2>

                {/* Exibir Erro */}
                {error && (
                    <div className="bg-red-500 text-white p-3 rounded-md mb-4 text-center">
                        {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* ... (Seus campos de formulário permanecem aqui) ... */}
                    
                    {/* Nome da empresa */}
                    <div>
                        <label className="block text-sm mb-1">Nome da empresa</label>
                        <div className="flex items-center bg-gray-700 rounded px-3 py-2">
                            <Building2 className="text-cyan-500 mr-2" />
                            <input
                                type="text"
                                name="nome_empresa"
                                value={formData.nome_empresa}
                                onChange={handleChange}
                                placeholder="Ex: TechHardware"
                                className="bg-transparent w-full outline-none text-white"
                                required
                            />
                        </div>
                    </div>

                    {/* CNPJ */}
                    <div>
                        <label className="block text-sm mb-1">CNPJ</label>
                        <div className="flex items-center bg-gray-700 rounded px-3 py-2">
                            <Landmark className="text-cyan-500 mr-2" />
                            <input
                                type="text"
                                name="cnpj"
                                value={formData.cnpj}
                                onChange={handleChange}
                                placeholder="00.000.000/0001-00"
                                className="bg-transparent w-full outline-none text-white"
                                required
                            />
                        </div>
                    </div>

                    {/* Razão Social */}
                    <div>
                        <label className="block text-sm mb-1">Razão Social</label>
                        <div className="flex items-center bg-gray-700 rounded px-3 py-2">
                            <Building2 className="text-cyan-500 mr-2" />
                            <input
                                type="text"
                                name="razao_social"
                                value={formData.razao_social}
                                onChange={handleChange}
                                placeholder="Nome jurídico da empresa"
                                className="bg-transparent w-full outline-none text-white"
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm mb-1">Email corporativo</label>
                        <div className="flex items-center bg-gray-700 rounded px-3 py-2">
                            <Mail className="text-cyan-500 mr-2" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="contato@empresa.com.br"
                                className="bg-transparent w-full outline-none text-white"
                                required
                            />
                        </div>
                    </div>

                    {/* Telefone */}
                    <div>
                        <label className="block text-sm mb-1">Telefone</label>
                        <div className="flex items-center bg-gray-700 rounded px-3 py-2">
                            <Phone className="text-cyan-500 mr-2" />
                            <input
                                type="tel"
                                name="telefone"
                                value={formData.telefone}
                                onChange={handleChange}
                                placeholder="(11) 91234-5678"
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
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="bg-transparent w-full outline-none text-white"
                                required
                            />
                        </div>
                    </div>

                    {/* Confirmar senha */}
                    <div>
                        <label className="block text-sm mb-1">Confirmar senha</label>
                        <div className="flex items-center bg-gray-700 rounded px-3 py-2">
                            <Lock className="text-cyan-500 mr-2" />
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="bg-transparent w-full outline-none text-white"
                                required
                            />
                        </div>
                    </div>

                    {/* 🟢 NOVO: Checkbox de Termos de Serviço */}
                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            id="termsAcceptance"
                            checked={isTermsAccepted}
                            onChange={handleTermsToggle}
                            className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 border-gray-300 rounded"
                        />
                        <label htmlFor="termsAcceptance" className="text-sm text-gray-300">
                            Eu li e concordo com os{' '}
                            <Link to="/Termos" className="text-cyan-500 hover:text-sky-400 underline font-medium" target="_blank" rel="noopener noreferrer">
                                Termos de Serviço
                            </Link>
                        </label>
                    </div>

                    {/* Botão de cadastro */}
                    <button
                        type="submit"
                        // 🟢 Modificado: Desabilita se isTermsAccepted for falso
                        disabled={isButtonDisabled}
                        className={`cursor-pointer w-full text-white font-semibold py-3 rounded-md shadow transition 
                            ${isButtonDisabled 
                                ? 'bg-gray-500 cursor-not-allowed' 
                                : 'bg-cyan-500 hover:bg-sky-700'
                            }`}
                    >
                        {isLoading ? 'Cadastrando...' : 'Cadastrar Empresa'}
                    </button>

                    {/* Link para login */}
                    <p className="text-center text-sm mt-4 text-gray-400">
                        Já tem uma conta?{' '}
                        <a href='/login' onClick={() => navigate('/login')} className="text-cyan-500 hover:text-sky-400 underline"> <br />
                            Faça login
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
}