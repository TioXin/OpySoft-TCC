import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Painel from "../pages/Painel";
import Inventario from "../pages/Inventario";
import Pedidos from "../pages/Pedidos";
import Planos from "../pages/Planos";
import Montador from "../pages/Montador";

export default function DashBoard() {
  const [activeTab, setActiveTab] = useState("Painel");

  return (
    <div className="flex h-screen bg-[#0f172a] text-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === "Painel" && <Painel />}
        {activeTab === "Inventário" && <Inventario />}
        {activeTab === "Pedidos" && <Pedidos />}
        {activeTab === "Planos" && <Planos />}
        {activeTab === "Montador de PC" && <Montador />}
      </main>
    </div>
  );
}

