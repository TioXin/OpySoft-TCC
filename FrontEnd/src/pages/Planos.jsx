import React from "react";
import { Check } from "lucide-react";

export default function Planos() {
  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-white">Planos e Preços</h1>
      <p className="text-gray-400 mb-8">Escolha o plano que melhor se adapta às necessidades do seu negócio.</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-stretch">
        {/* Teste Gratuito */}
        <div className="flex flex-col justify-between rounded-xl p-8 min-h-[480px] transition transform hover:scale-105">
          <div className="h-full bg-gradient-to-br from-[#092935] to-[#0f3b45] rounded-xl p-6 shadow-md ring-1 ring-white/6">
            <div className="inline-flex items-center gap-3 mb-3">
              <span className="text-sm font-semibold text-white bg-green-600 px-2 py-1 rounded">Teste gratuito</span>
              <span className="text-xs text-gray-300">7 dias</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Grátis — 7 dias</h3>
            <p className="text-gray-300 mb-6">Teste todas as funcionalidades por 7 dias sem compromisso.</p>

            <div className="text-3xl font-extrabold mb-6 text-white">
              Grátis <span className="text-base font-medium text-gray-300">/ 7 dias</span>
            </div>

            <ul className="text-gray-200 space-y-3">
              <li className="flex items-start gap-3">
                <Check className="text-green-400 w-5 h-5 mt-1" />
                <span>Acesso completo às funcionalidades</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="text-green-400 w-5 h-5 mt-1" />
                <span>Até 2 usuários durante o teste</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="text-green-400 w-5 h-5 mt-1" />
                <span>Suporte por email</span>
              </li>
            </ul>
          </div>

          <div className="mt-6">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md font-semibold shadow-sm cursor-pointer">Iniciar teste gratuito — 7 dias</button>
            <button className="w-full mt-3 border border-green-600 text-green-600 py-2 rounded-md hover:bg-green-50/5 cursor-pointer">Mais informações</button>
          </div>
        </div>

        {/* Mensal */}
        <div className="flex flex-col justify-between rounded-xl p-8 min-h-[480px] transition transform hover:scale-105">
          <div className="h-full bg-gradient-to-br from-[#0a2338] to-[#103d4d] rounded-xl p-6 shadow-md ring-1 ring-white/6">
            <h3 className="text-xl font-semibold mb-2 text-white">Mensal</h3>
            <p className="text-gray-300 mb-6">Ideal para indivíduos e equipes pequenas começando.</p>

            <div className="text-3xl font-extrabold mb-4 text-white">
              R$49 <span className="text-base font-medium text-gray-300">/mês</span>
            </div>

            <ul className="text-gray-200 space-y-3">
              <li className="flex items-start gap-3">
                <Check className="text-green-400 w-5 h-5 mt-1" />
                <span>Até 2 usuários</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="text-green-400 w-5 h-5 mt-1" />
                <span>Gestão de Inventário</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="text-green-400 w-5 h-5 mt-1" />
                <span>Gestão de Pedidos</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="text-green-400 w-5 h-5 mt-1" />
                <span>Montador de PC</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="text-green-400 w-5 h-5 mt-1" />
                <span>Suporte por Email</span>
              </li>
            </ul>
          </div>

          <div className="mt-6">
            <button className="w-full bg-[#0d304e] hover:bg-[#174e8b] text-white py-3 rounded-md shadow-sm cursor-pointer">Começar Agora</button>
          </div>
        </div>

        {/* Anual (destaque) */}
        <div className="flex flex-col justify-between rounded-xl p-8 min-h-[480px] transition transform hover:scale-105">
          <div className="h-full bg-gradient-to-br from-[#083b33] to-[#0b4e48] rounded-xl p-6 shadow-2xl ring-2 ring-[#0ea5a4]/30">
            <h3 className="text-xl font-semibold mb-2 text-white">Anual</h3>
            <p className="text-gray-300 mb-6">Perfeito para negócios em crescimento que precisam de mais recursos.</p>

            <div className="text-3xl font-extrabold mb-4 text-white">
              R$499 <span className="text-base font-medium text-gray-300">/ano</span>
            </div>

            <ul className="text-gray-200 space-y-3">
              <li className="flex items-start gap-3">
                <Check className="text-green-400 w-5 h-5 mt-1" />
                <span>Até 10 usuários</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="text-green-400 w-5 h-5 mt-1" />
                <span>Tudo do plano Mensal</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="text-green-400 w-5 h-5 mt-1" />
                <span>Planejamento de Produção</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="text-green-400 w-5 h-5 mt-1" />
                <span>Gestão de Fornecedores</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="text-green-400 w-5 h-5 mt-1" />
                <span>Relatórios Avançados</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="text-green-400 w-5 h-5 mt-1" />
                <span>Suporte Prioritário</span>
              </li>
            </ul>
          </div>

          <div className="mt-6">
            <button className="w-full bg-[#0ea5a4] hover:bg-[#0aa196] text-white py-3 rounded-md font-semibold shadow cursor-pointer">Escolher Anual</button>
          </div>
        </div>

        {/* Empresarial */}
        <div className="flex flex-col justify-between rounded-xl p-8 min-h-[480px] transition transform hover:scale-105">
          <div className="h-full bg-gradient-to-br from-[#07212a] to-[#0b2b38] rounded-xl p-6 shadow-md ring-1 ring-white/6">
            <h3 className="text-xl font-semibold mb-2 text-white">Empresarial</h3>
            <p className="text-gray-300 mb-6">Solução completa para grandes operações e requisitos específicos.</p>

            <div className="text-3xl font-extrabold mb-4 text-white">Customizado</div>

            <ul className="text-gray-200 space-y-3">
              <li className="flex items-start gap-3">
                <Check className="text-green-400 w-5 h-5 mt-1" />
                <span>Usuários ilimitados</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="text-green-400 w-5 h-5 mt-1" />
                <span>Tudo do plano Anual</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="text-green-400 w-5 h-5 mt-1" />
                <span>Análise de IA da Cadeia de Suprimentos</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="text-green-400 w-5 h-5 mt-1" />
                <span>Integrações Personalizadas (API)</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="text-green-400 w-5 h-5 mt-1" />
                <span>Gerente de Conta Dedicado</span>
              </li>
            </ul>
          </div>

          <div className="mt-6">
            <button className="w-full bg-[#071827] hover:bg-[#081a2e] text-white py-3 rounded-md shadow-sm cursor-pointer">Entre em Contato</button>
            <button className="w-full mt-3 border border-green-600 text-green-600 py-2 rounded-md hover:bg-green-50/5 cursor-pointer">Solicitar demonstração / teste</button>
          </div>
        </div>
      </div>
    </div>
  );
}