import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Importação do Axios
import { Building2, Mail, Lock, Phone, Landmark } from 'lucide-react';

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
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // AQUI ESTÁ A CHAMADA CORRETA para o seu backend
            const response = await axios.post('/api/register', {
                nome_empresa: formData.nome_empresa,
                cnpj: formData.cnpj,
                razao_social: formData.razao_social,
                email: formData.email,
                telefone: formData.telefone,
                password: formData.password,
            });

            console.log("Cadastro bem-sucedido:", response.data);
            alert("Cadastro realizado com sucesso! Faça login.");
            navigate('/login');

        } catch (err) {
            const errorMessage = err.response?.data?.error || "Erro desconhecido. Verifique o console.";
            console.error("Erro no registro:", err);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

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

                    {/* Botão de cadastro */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`cursor-pointer w-full text-white font-semibold py-3 rounded-md shadow transition ${
                            isLoading ? 'bg-gray-500' : 'bg-cyan-500 hover:bg-sky-700'
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