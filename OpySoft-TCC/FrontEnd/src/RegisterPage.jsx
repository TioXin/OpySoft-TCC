import React from 'react';
import { Building2, Mail, Lock, Phone, Landmark } from 'lucide-react';

export default function RegisterCompanyPage() {
  return (

    <div className="min-h-screen bg-gradient-to-t from-cyan-700 to-sky-950 text-white flex flex-col items-center justify-center px-4">

       {/* Header */}
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

        <form className="space-y-5">
          {/* Nome da empresa */}
          <div>
            <label className="block text-sm mb-1">Nome da empresa</label>
            <div className="flex items-center bg-gray-700 rounded px-3 py-2">
              <Building2 className="text-cyan-500 mr-2" />
              <input
                type="text"
                placeholder="Ex: TechHardware"
                className="bg-transparent w-full outline-none text-white"
              />
            </div>
          </div>

          {/* CNPJ */}
          <div>
            <label className="block text-sm mb-1">CNPJ</label>
            <div className="flex items-center bg-gray-700 rounded px-3 py-2">
              <Landmark className="text-cyan-500 mr-2" />
              <input
                type="number"
                placeholder="00.000.000/0001-00"
                className="bg-transparent w-full outline-none text-white"
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
                placeholder="Nome jurídico da empresa"
                className="bg-transparent w-full outline-none text-white"
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
                placeholder="contato@empresa.com.br"
                className="bg-transparent w-full outline-none text-white"
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
                placeholder="(11) 91234-5678"
                className="bg-transparent w-full outline-none text-white"
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
                className="bg-transparent w-full outline-none text-white"
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
                placeholder="••••••••"
                className="bg-transparent w-full outline-none text-white"
              />
            </div>
          </div>

          {/* Botão de cadastro */}
          <button
            type="submit"
            className=" cursor-pointer w-full bg-cyan-500 hover:bg-sky-700 text-white font-semibold py-3 rounded-md shadow transition"
          >
            Cadastrar Empresa
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
