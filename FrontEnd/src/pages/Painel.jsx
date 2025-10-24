import React from "react";
import { DollarSign, ShoppingCart, Package, BarChart2 } from "lucide-react";

export default function Painel() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">Painel</h1>
      <p className="text-gray-400 mb-8">
        Bem-vindo de volta, aqui está um resumo de suas operações.
      </p>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card
          title="Receita Total"
          icon={<DollarSign className="text-gray-400" />}
          value="R$0,00"
          subtitle="+12.5% do último mês"
        />
        <Card
          title="Novos Pedidos"
          icon={<ShoppingCart className="text-gray-400" />}
          value="+0"
          subtitle="em processamento"
        />
        <Card
          title="Itens com Estoque Baixo"
          icon={<Package className="text-gray-400" />}
          value="0"
          subtitle="itens precisam de reposição"
        />
        <Card
          title="Produção em Andamento"
          icon={<BarChart2 className="text-gray-400" />}
          value="0"
          subtitle="produções ativas"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0b1220] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-2">Visão Geral da Receita</h2>
          <div className="h-48 flex items-end justify-between text-gray-500">
            <span>R$0k</span>
            <div className="w-full h-40 flex items-end justify-between">
              {Array(12)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="w-4 h-1 bg-blue-500 rounded-full"></div>
                ))}
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            {["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"].map(
              (m) => (
                <span key={m}>{m}</span>
              )
            )}
          </div>
        </div>

        <div className="bg-[#0b1220] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-2">Volume de Pedidos</h2>
          <div className="h-48 flex items-end justify-between text-gray-500">
            <span>4</span>
            <div className="w-full h-40 flex items-end justify-between">
              {Array(12)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="w-4 h-1 bg-blue-500 rounded-full"></div>
                ))}
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            {["jan", "mar", "mai", "jul", "set", "out", "dez"].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const Card = ({ title, icon, value, subtitle }) => (
  <div className="bg-[#0b1220] p-5 rounded-xl">
    <div className="flex justify-between mb-2">
      <h3 className="text-sm text-gray-400">{title}</h3>
      {icon}
    </div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-sm text-gray-500">{subtitle}</p>
  </div>
);