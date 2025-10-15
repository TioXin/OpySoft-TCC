// src/pages/SobreNos.jsx

import React from "react";

export default function SobreNos() {
  const membros = [
    {
      nome: "Nicolas Galvão Bonfante",
      foto: "/nicolas.jpg", // Coloque suas imagens em public/membros/
    },
    {
      nome: "Arthur Goes Francelino",
      foto: "/arthur.jpg",
    },
    {
      nome: "Gustavo Santos Pafume",
      foto: "/gustavo.jpg",
    },
    {
      nome: "Guilherme Pereira",
      foto: "/Guilherme.jpg",
    },
    {
      nome: "Caio Drumond",
      foto: "/caio.jpg",
    }
  ];

  return (
    <div className="bg-gray-900 text-gray-100 font-sans min-h-screen pt-24 px-6">
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

        <div className="md:hidden">
          <button className="text-white">☰</button>
        </div>
      </header>

      {/* Título */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-2">Nossa Equipe</h1>
        <div className="h-1 w-24 bg-sky-700 mt-2 mx-auto"></div>
        <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
          Conheça as pessoas por trás do projeto OpySoft. Cada um contribuiu com dedicação e talento para tornar este ERP uma realidade.
        </p>
      </section>

      {/* Galeria de Membros */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
  {membros.map((membro, index) => (
    <div key={index} className="text-center">
      <div className="w-full aspect-[3/4] overflow-hidden rounded-lg shadow-lg border-2 border-cyan-500">
        <img
          src={membro.foto}
          alt={membro.nome}
          className="w-full h-full object-cover"
        />
      </div>
      <p className="text-lg font-semibold text-white mt-3">{membro.nome}</p>
    </div>
  ))}
</section>


      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-6 mt-16">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            © {new Date().getFullYear()} OpySoft. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-red-400 transition">Termos de Serviço</a>
            <a href="#" className="hover:text-red-400 transition">Política de Privacidade</a>
            <a href="#" className="hover:text-red-400 transition">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
