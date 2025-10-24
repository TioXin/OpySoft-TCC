import { useNavigate } from 'react-router-dom';

export default function Privacidade() {
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

            {/* Política de Privacidade */}
            <section className="pt-32 pb-20 px-6 bg-gray-900 flex-grow">
                <div className="max-w-5xl bg-gray-950 p-10 rounded-md mx-auto text-gray-300 text-lg leading-relaxed space-y-6">
                    <h1 className="text-4xl md:text-5xl font-bold text-center mb-12 text-white">
                        Política de Privacidade
                    </h1>

                    <p><strong className="text-white">1. Introdução</strong><br />
                        Esta Política de Privacidade descreve como a OpySoft coleta, utiliza, armazena e protege as informações fornecidas pelos usuários durante o uso do sistema OpySoft ERP.
                    </p>

                    <p><strong className="text-white">2. Informações Coletadas</strong><br />
                        Podemos coletar informações cadastrais da empresa, dados de acesso, logs de uso e informações operacionais inseridas pelos usuários no sistema.
                    </p>

                    <p><strong className="text-white">3. Uso das Informações</strong><br />
                        Os dados são utilizados para funcionamento do ERP, suporte técnico, comunicação com o usuário, melhoria contínua do serviço e cumprimento de obrigações legais.
                    </p>

                    <p><strong className="text-white">4. Compartilhamento de Dados</strong><br />
                        A OpySoft não vende nem compartilha seus dados com terceiros, exceto quando exigido por lei ou com autorização expressa do usuário.
                    </p>

                    <p><strong className="text-white">5. Armazenamento e Segurança</strong><br />
                        As informações são armazenadas em servidores seguros e protegidas por criptografia e protocolos de segurança. Adotamos medidas técnicas e administrativas para garantir a integridade dos dados.
                    </p>

                    <p><strong className="text-white">6. Cookies e Tecnologias de Rastreamento</strong><br />
                        Utilizamos cookies apenas para funcionalidades essenciais da plataforma, como autenticação e performance. Não utilizamos cookies para fins de marketing ou rastreamento indevido.
                    </p>

                    <p><strong className="text-white">7. Direitos do Usuário</strong><br />
                        Você pode solicitar acesso, correção ou exclusão de seus dados pessoais a qualquer momento, conforme os direitos garantidos pela LGPD (Lei Geral de Proteção de Dados).
                    </p>

                    <p><strong className="text-white">8. Retenção de Dados</strong><br />
                        Os dados são mantidos enquanto durar a relação contratual e por períodos adicionais quando exigido por lei ou para fins legítimos da OpySoft.
                    </p>

                    <p><strong className="text-white">9. Alterações nesta Política</strong><br />
                        Esta política pode ser atualizada periodicamente. Recomendamos que o usuário revise este documento regularmente. O uso contínuo do serviço implica aceitação das alterações.
                    </p>

                    <p><strong className="text-white">10. Contato</strong><br />
                        Em caso de dúvidas, entre em contato com nosso suporte através do e-mail <span className="text-cyan-500">dagengroup@gmail.com</span> ou pelo formulário disponível no site.
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
