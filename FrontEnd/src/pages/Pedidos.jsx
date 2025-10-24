import React, { useState } from "react";
import { Plus } from "lucide-react";

export default function Pedidos() {
  const [tab, setTab] = useState("Todos");
  const tabs = ["Todos", "Processando", "Enviados", "Entregues"];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Pedidos</h1>
          <p className="text-gray-400">
            Processe e acompanhe os pedidos dos clientes.
          </p>
        </div>

        <button className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
          <Plus size={16} />
          Novo Pedido
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-4">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md font-medium ${
              tab === t ? "bg-[#1e293b] text-white" : "text-gray-400 hover:bg-[#1e293b]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <section className="bg-[#0b1220] p-6 rounded-xl">
        <h2 className="text-lg font-semibold mb-4">Todos os Pedidos</h2>
        <table className="w-full text-left text-gray-300">
          <thead className="text-gray-400 border-b border-gray-700">
            <tr>
              <th className="pb-2">ID do Pedido</th>
              <th className="pb-2">Cliente</th>
              <th className="pb-2">Data</th>
              <th className="pb-2">Total</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="5" className="text-center py-6 text-gray-500">
                Nenhum pedido encontrado.
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}