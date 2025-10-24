import React from "react";
import {
  Home,
  Box,
  ShoppingCart,
  Cpu,
  Settings,
  Truck,
  DollarSign,
  BarChart2,
  FileText,
  Layers,
  Wrench,
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { name: "Painel", icon: <Home size={18} /> },
    { name: "Inventário", icon: <Box size={18} /> },
    { name: "Pedidos", icon: <ShoppingCart size={18} /> },
    { name: "Montador de PC", icon: <Cpu size={18} /> },
    { name: "Produção", icon: <Settings size={18} /> },
    { name: "Cadeia de Suprimentos", icon: <Truck size={18} /> },
    { name: "Finanças", icon: <DollarSign size={18} /> },
    { name: "Análise de IA", icon: <BarChart2 size={18} /> },
    { name: "Relatórios", icon: <FileText size={18} /> },
    { name: "Planos", icon: <Layers size={18} /> },
  ];

  return (
    <aside className="w-64 bg-[#0b1220] flex flex-col justify-between">
      <div>
        <div className="p-6 flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded">
            <Wrench className="text-white w-5 h-5 cursor-pointer" />
          </div>
          <h1 className="text-xl font-bold">OpySoft</h1>
        </div>

        <nav className="px-4 space-y-2 text-gray-300">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              type="button"
              onClick={() => setActiveTab(tab.name)}
              className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md transition cursor-pointer ${
                activeTab === tab.name ? "bg-[#1e293b] text-white" : "hover:bg-[#1e293b]"
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold">
            N
          </div>
          <div>
            <p className="font-semibold text-sm">nicolas</p>
            <p className="text-xs text-gray-400">nicolas@gmail.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}