import React from "react";

export default function Inventario() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Inventário</h1>
      <p className="text-gray-400 mb-6">Gerencie seu estoque de componentes.</p>

      <section className="bg-[#0b1220] p-6 rounded-xl">
        <h2 className="text-lg font-semibold mb-4">Estoque de Componentes</h2>
        <table className="w-full text-left text-gray-300">
          <thead className="text-gray-400 border-b border-gray-700">
            <tr>
              <th className="pb-2">Componente</th>
              <th className="pb-2">SKU</th>
              <th className="pb-2">Quantidade</th>
              <th className="pb-2">Fornecedor</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="5" className="text-center py-6 text-gray-500">
                Nenhum componente cadastrado.
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}