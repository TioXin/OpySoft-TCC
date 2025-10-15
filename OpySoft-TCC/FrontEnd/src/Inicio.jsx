import { Shield, RefreshCcw, CheckCircle, Lock, Smile } from "lucide-react";
import { useNavigate } from 'react-router-dom';

export default function Inicio() {
//   Cores: #1caee3 - claro claro - /cyan 500/
// #1075b3 - claro escuro - /sky 700/

// #23299e - escuro claro - 
// #13076a - escuro escuro
const navigate = useNavigate();

  return (
    <div className="bg-gray-900 text-gray-100 font-sans flex flex-col min-h-screen">

      {/* Header  */}
      <header className="absolute top-0 left-0 w-full z-20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8" />
          <a  href="/"><span className="font-bold text-lg text-white">
            Opy<span className="text-cyan-500">Soft</span>
          </span></a>
        </div>

        <nav className="hidden md:flex gap-6 text-white">
          <a href="#" className="hover:text-sky-700 transition">Home</a>
          <a href="#sobre" className="hover:text-sky-700 transition">Sobre</a>
          <a href="#beneficios" className="hover:text-sky-700 transition">Benefícios</a>
          <a href="#contato" className="hover:text-sky-700 transition">Contato</a>
        </nav>

        <div className="md:hidden">
          <button className="text-white">☰</button>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="relative bg-cover bg-center flex flex-col items-center justify-center py-24"
        style={{ backgroundImage: "url('/hero.png')" }}
      >
        <div className="absolute inset-0 bg-black/50 z-0"></div>
        <div className="relative p-6 text-center max-w-md md:max-w-xl mx-auto z-10">
          <p className="text-gray-200 mb-8 text-2xl md:text-4xl font-bold leading-snug">
            Transforme sua empresa de manutenção de hardware com o OpySoft ERP. <br /><span className="text-cyan-500">Teste gratuito agora!</span>
          </p>
          <button  onClick={() => navigate('/register')} className="cursor-pointer bg-cyan-500 hover:bg-sky-700 text-white font-semibold px-9 py-5 rounded-lg shadow-md transition mb-4">
            Fazer o Teste Gratuito
          </button>
          <p className="text-xs text-gray-400">
            Ao fazer o teste gratuito, você concorda com nossos{" "}
            <span className="underline cursor-pointer text-gray-300 hover:text-red-400">
              termos de serviço
            </span>
          </p>
        </div>
      </section>

      {/* Sobre nós */}
      <section id="sobre" className="py-16 px-6 bg-gray-900">
        <h2 className="text-4xl font-bold mb-6 text-white text-center">Sobre nós</h2>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-300 text-lg leading-relaxed">
            Apaixonados por tecnologia e especialistas em hardware, nossa equipe decidiu criar soluções que realmente funcionam. Ao longo de nossas carreiras, lidamos com sistemas ultrapassados e planilhas complexas no Excel, mostrando a necessidade de ferramentas modernas e eficientes. Quando surgiu a oportunidade de desenvolver nosso TCC, aproveitamos para criar um ERP pensado para resolver problemas reais, simplificar processos e otimizar o dia a dia das empresas que trabalham com hardware. Com o OpySoft ERP, nosso objetivo é transformar a forma como essas empresas gerenciam suas operações, tornando tudo mais ágil, seguro e confiável.
          </p>
          <button  onClick={() => navigate('/sobreNos')} className="cursor-pointer bg-cyan-500 hover:bg-sky-700 text-white font-semibold px-9 py-5 rounded-lg shadow-md transition mb-4 mt-4">
           Conheça Nossa Equipe
          </button>
          <h3 className="text-3xl font-bold text-white mt-6">
            Opy<span className="text-cyan-500">Soft</span>
            <div className="h-1 w-24 bg-sky-700 mt-2 mx-auto"></div>
          </h3>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="py-16 px-6 bg-gray-950 flex-1">
        <h2 className="text-3xl font-bold text-center mb-10 text-white">Por que o OpySoft?</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="flex items-start gap-4 bg-gray-800 p-4 rounded-lg shadow hover:shadow-xl transition">
            <CheckCircle className="text-green-400 w-8 h-8" />
            <div>
              <h4 className="font-semibold text-white">Fácil de usar</h4>
              <p className="text-gray-400 text-sm">
                Interface simples e prática, sem necessidade de conhecimento técnico.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-gray-800 p-4 rounded-lg shadow hover:shadow-xl transition">
            <Shield className="text-purple-400 w-8 h-8" />
            <div>
              <h4 className="font-semibold text-white">No-log policy</h4>
              <p className="text-gray-400 text-sm">
                Não rastreamos, coletamos ou vendemos seus dados pessoais.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-gray-800 p-4 rounded-lg shadow hover:shadow-xl transition">
            <Lock className="text-blue-400 w-8 h-8" />
            <div>
              <h4 className="font-semibold text-white">Segurança</h4>
              <p className="text-gray-400 text-sm">
                Criptografia de nível militar (256-bit AES).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-gray-800 p-4 rounded-lg shadow hover:shadow-xl transition">
            <RefreshCcw className="text-yellow-400 w-8 h-8" />
            <div>
              <h4 className="font-semibold text-white">Atualização automática</h4>
              <p className="text-gray-400 text-sm">
                O sistema é atualizado constantemente sem precisar de ações do usuário.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-gray-800 p-4 rounded-lg shadow hover:shadow-xl transition">
            <Smile className="text-pink-400 w-8 h-8" />
            <div>
              <h4 className="font-semibold text-white">Suporte rápido</h4>
              <p className="text-gray-400 text-sm">
                Equipe pronta para te auxiliar sempre que precisar.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-gray-800 p-4 rounded-lg shadow hover:shadow-xl transition">
            <Lock className="text-blue-400 w-8 h-8" />
            <div>
              <h4 className="font-semibold text-white">Customizável</h4>
              <p className="text-gray-400 text-sm">
                Ajuste o ERP de acordo com as necessidades da sua empresa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-gray-950 text-gray-400 py-6 mt-10">
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
