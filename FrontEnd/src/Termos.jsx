import { useNavigate } from 'react-router-dom';

export default function Termos() {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-900 text-gray-100 font-sans flex flex-col min-h-screen">

      {/* Header */}
      <header className="absolute top-0 left-0 w-full z-20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8" />
          <a href="/" className="font-bold text-lg text-white">
            Opy<span className="text-cyan-500">Soft</span>
          </a>
        </div>

        <nav className="hidden md:flex gap-6 text-white">
          <a href="/" className="hover:text-sky-700 transition">Home</a>
          <a href="/#sobre" className="hover:text-sky-700 transition">Sobre</a>
          <a href="/#beneficios" className="hover:text-sky-700 transition">Benefícios</a>
          <a href="/#contato" className="hover:text-sky-700 transition">Contato</a>
        </nav>

        <div className="md:hidden">
          <button className="text-white" aria-label="Menu">☰</button>
        </div>
      </header>

      {/* Termos de Serviço */}
      <section className="pt-32 pb-20 px-6 bg-gray-900 flex-grow">


        <div className="max-w-5xl bg-gray-950 p-10 rounded-md mx-auto text-gray-300 text-lg leading-relaxed space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-12 text-white">
          Termos de Serviço
        </h1>
          <p><strong className="text-white">1. Aceitação dos Termos</strong><br />
          Ao utilizar o software OpySoft ERP, você, empresa contratante, concorda com estes Termos de Serviço e com a nossa Política de Privacidade.
          </p>

          <p><strong className="text-white">2. Descrição do Serviço</strong><br />
            O OpySoft ERP é um software de gestão empresarial (ERP) baseado em nuvem, criado para empresas do setor de hardware, oferecendo ferramentas para gerenciamento integrado.
          </p>

          <p><strong className="text-white">3. Elegibilidade</strong><br />
            O uso do serviço está restrito a empresas legalmente registradas no setor de hardware e informática.
          </p>

          <p><strong className="text-white">4. Cadastro e Conta</strong><br />
            O Usuário deve fornecer dados precisos e manter suas credenciais em segurança. Toda atividade realizada na conta é de responsabilidade do Usuário.
          </p>

          <p><strong className="text-white">5. Pagamento e Renovação</strong><br />
            O serviço é cobrado mensalmente. A renovação é automática, salvo cancelamento prévio.
          </p>

          <p><strong className="text-white">6. Uso Permitido</strong><br />
            O serviço deve ser usado exclusivamente para fins legais e comerciais, relacionados à atividade empresarial de hardware.
          </p>

          <p><strong className="text-white">7. Cancelamento e Suspensão</strong><br />
            O cancelamento pode ser feito a qualquer momento. A inadimplência poderá suspender o acesso.
          </p>

          <p><strong className="text-white">8. Propriedade Intelectual</strong><br />
            Todo o conteúdo do sistema é propriedade da OpySoft. O uso é licenciado, não transferido.
          </p>

          <p><strong className="text-white">9. Limitação de Responsabilidade</strong><br />
            O serviço é fornecido "como está", sem garantias. A OpySoft não se responsabiliza por perdas indiretas.
          </p>

          <p><strong className="text-white">10. Suporte e Manutenção</strong><br />
            Suporte está disponível conforme plano contratado. Atualizações podem ocorrer sem aviso prévio.
          </p>

          <p><strong className="text-white">11. Privacidade e Dados</strong><br />
            Os dados são tratados conforme a Política de Privacidade, em conformidade com a LGPD.
          </p>

          <p><strong className="text-white">12. Modificações nos Termos</strong><br />
            Estes termos podem ser atualizados. O uso contínuo do sistema representa concordância com as alterações.
          </p>

          <p><strong className="text-white">13. Disposições Gerais</strong><br />
            Estes termos seguem a legislação brasileira. O foro competente é o da comarca da sede da OpySoft.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-6 mt-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            © {new Date().getFullYear()} OpySoft. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <a href="termos" className="hover:text-sky-700 transition">Termos de Serviço</a>
            <a href="Privacidade" className="hover:text-sky-700 transition">Política de Privacidade</a>
            <a href="#" className="hover:text-sky-700 transition">Contato</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
