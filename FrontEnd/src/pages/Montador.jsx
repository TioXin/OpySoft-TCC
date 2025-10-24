import React from "react";

const DATA = {
  cpus: [
    { id: "cpu1", name: "Intel i5-12400F", socket: "LGA1700", price: 900, power: 65 },
    { id: "cpu2", name: "Intel i7-12700K", socket: "LGA1700", price: 1700, power: 125 },
    { id: "cpu3", name: "AMD Ryzen 5 5600X", socket: "AM4", price: 1200, power: 65 },
  ],
  motherboards: [
    { id: "mobo1", name: "ASUS PRIME B660 (LGA1700) - DDR4", socket: "LGA1700", ramType: "DDR4", price: 700 },
    { id: "mobo2", name: "MSI MAG Z690 (LGA1700) - DDR5", socket: "LGA1700", ramType: "DDR5", price: 1500 },
    { id: "mobo3", name: "Gigabyte B550 (AM4) - DDR4", socket: "AM4", ramType: "DDR4", price: 650 },
  ],
  rams: [
    { id: "ram1", name: "8GB DDR4 3200MHz", type: "DDR4", price: 180, power: 5 },
    { id: "ram2", name: "16GB DDR4 3600MHz", type: "DDR4", price: 320, power: 5 },
    { id: "ram3", name: "16GB DDR5 4800MHz", type: "DDR5", price: 700, power: 6 },
  ],
  gpus: [
    { id: "gpu1", name: "GTX 1660 Super", price: 1200, power: 125 },
    { id: "gpu2", name: "RTX 4060", price: 2200, power: 160 },
  ],
  storages: [
    { id: "sto1", name: "SSD 500GB NVMe", price: 250, power: 4 },
    { id: "sto2", name: "HDD 2TB", price: 300, power: 6 },
  ],
  psus: [
    { id: "psu1", name: "Fonte 550W Bronze", watt: 550, price: 300 },
    { id: "psu2", name: "Fonte 750W Gold", watt: 750, price: 600 },
  ],
  cases: [
    { id: "case1", name: "Gabinete ATX Mid Tower", price: 250 },
    { id: "case2", name: "Gabinete Mini-ITX", price: 300 },
  ],
};

export default function Montador() {
  const [sel, setSel] = React.useState({
    cpu: null,
    mobo: null,
    ram: null,
    gpu: null,
    storage: null,
    psu: null,
    case: null,
  });

  const [profit, setProfit] = React.useState(20); // margem % padrão

  const setKey = (key, id) => {
    setSel((s) => ({ ...s, [key]: id || null }));
  };

  // helpers
  const find = (list, id) => list.find((i) => i.id === id) || null;
  const selected = {
    cpu: find(DATA.cpus, sel.cpu),
    mobo: find(DATA.motherboards, sel.mobo),
    ram: find(DATA.rams, sel.ram),
    gpu: find(DATA.gpus, sel.gpu),
    storage: find(DATA.storages, sel.storage),
    psu: find(DATA.psus, sel.psu),
    case: find(DATA.cases, sel.case),
  };

  // compatibility filters
  const compatibleMobos = DATA.motherboards.filter((m) =>
    selected.cpu ? m.socket === selected.cpu.socket : true
  );
  const compatibleRams = DATA.rams.filter((r) =>
    selected.mobo ? r.type === selected.mobo.ramType : true
  );

  // power estimate
  const estimatedPower =
    (selected.cpu?.power || 0) +
    (selected.gpu?.power || 0) +
    (selected.ram?.power || 0) +
    (selected.storage?.power || 0) +
    50; // motherboard + fans overhead

  const suitablePsus = DATA.psus.filter((p) => p.watt >= estimatedPower);

  const totalPrice = Object.values(selected).reduce((sum, it) => sum + (it?.price || 0), 0);

  const costPrice = totalPrice;
  const suggestedPrice = Math.round(costPrice * (1 + (Number(profit) || 0) / 100));

  const clearSelection = () => setSel({ cpu: null, mobo: null, ram: null, gpu: null, storage: null, psu: null, case: null });

  const formatBRL = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  // rótulos em português para o resumo
  const LABELS = {
    cpu: "Processador (CPU)",
    mobo: "Placa-mãe",
    ram: "Memória RAM",
    gpu: "Placa de Vídeo (GPU)",
    storage: "Armazenamento",
    psu: "Fonte de Alimentação",
    case: "Gabinete",
  };

  return (
    <div className="flex gap-8">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-2">Montador de PC</h2>
        <p className="text-gray-400 mb-6">Monte um computador personalizado e calcule os custos.</p>

        <div className="bg-[#071021] rounded-xl p-6 shadow-md space-y-4">
          <h3 className="text-lg font-semibold mb-2 text-white">Seleção de Componentes</h3>

          <Field label="Processador (CPU)">
            <select
              value={sel.cpu || ""}
              onChange={(e) => setKey("cpu", e.target.value || null)}
              className="bg-[#0b1620] text-white px-3 py-2 rounded w-full cursor-pointer"
            >
              <option value="">Selecione o processador</option>
              {DATA.cpus.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — R$ {c.price}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Placa-mãe">
            <select
              value={sel.mobo || ""}
              onChange={(e) => setKey("mobo", e.target.value || null)}
              className="bg-[#0b1620] text-white px-3 py-2 rounded w-full cursor-pointer"
            >
              <option value="">Selecione a placa-mãe</option>
              {compatibleMobos.length === 0 ? (
                <option value="">Nenhuma peça compatível</option>
              ) : (
                compatibleMobos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.ramType} — R$ {m.price}
                  </option>
                ))
              )}
            </select>
          </Field>

          <Field label="Memória RAM">
            <select
              value={sel.ram || ""}
              onChange={(e) => setKey("ram", e.target.value || null)}
              className="bg-[#0b1620] text-white px-3 py-2 rounded w-full cursor-pointer"
            >
              <option value="">Selecione a memória</option>
              {compatibleRams.length === 0 ? (
                <option value="">Nenhuma peça compatível</option>
              ) : (
                compatibleRams.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — R$ {r.price}
                  </option>
                ))
              )}
            </select>
          </Field>

          <Field label="Placa de Vídeo (GPU)">
            <select
              value={sel.gpu || ""}
              onChange={(e) => setKey("gpu", e.target.value || null)}
              className="bg-[#0b1620] text-white px-3 py-2 rounded w-full cursor-pointer"
            >
              <option value="">Selecione a GPU</option>
              {DATA.gpus.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} — R$ {g.price}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Armazenamento">
            <select
              value={sel.storage || ""}
              onChange={(e) => setKey("storage", e.target.value || null)}
              className="bg-[#0b1620] text-white px-3 py-2 rounded w-full cursor-pointer"
            >
              <option value="">Selecione o armazenamento</option>
              {DATA.storages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — R$ {s.price}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Fonte de Alimentação (PSU)">
            <select
              value={sel.psu || ""}
              onChange={(e) => setKey("psu", e.target.value || null)}
              className="bg-[#0b1620] text-white px-3 py-2 rounded w-full cursor-pointer"
            >
              <option value="">Selecione a fonte</option>
              {suitablePsus.length === 0 ? (
                <option value="">Nenhuma peça compatível</option>
              ) : (
                suitablePsus.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.watt}W — R$ {p.price}
                  </option>
                ))
              )}
            </select>
            <p className="text-xs text-gray-400 mt-1">Estimativa de consumo: {estimatedPower}W</p>
          </Field>

          <Field label="Gabinete">
            <select
              value={sel.case || ""}
              onChange={(e) => setKey("case", e.target.value || null)}
              className="bg-[#0b1620] text-white px-3 py-2 rounded w-full cursor-pointer"
            >
              <option value="">Selecione o gabinete</option>
              {DATA.cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — R$ {c.price}
                </option>
              ))}
            </select>
          </Field>

          <div className="pt-4 border-t border-white/6 flex gap-3">
            <button onClick={clearSelection} className="bg-[#071827] text-white px-4 py-2 rounded cursor-pointer">
              Limpar Seleção
            </button>
          </div>
        </div>
      </div>

      <aside className="w-96">
        <h3 className="text-lg font-semibold mb-2 text-white">Resumo da Montagem</h3>
        <div className="bg-[#071021] rounded-xl p-6 shadow-md">
          {Object.values(selected).every((v) => v === null) ? (
            <div className="bg-[#0b1620] rounded p-4 text-gray-300">Nenhum componente selecionado. Selecione à esquerda.</div>
          ) : (
            <>
              <ul className="space-y-3 mb-4">
                {Object.entries(selected).map(([k, v]) =>
                  v ? (
                    <li key={k} className="flex justify-between">
                      <span>{LABELS[k] || k}</span>
                      <span>R$ {v.price}</span>
                    </li>
                  ) : null
                )}
              </ul>

              <div className="pt-3 border-t border-white/6 space-y-3">
                <div className="flex justify-between text-gray-300">
                  <span>Preço de custo</span>
                  <span className="font-bold">{formatBRL(costPrice)}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm text-gray-300">Margem de lucro (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={profit}
                    onChange={(e) => setProfit(Number(e.target.value))}
                    className="w-20 bg-[#0b1620] text-white px-2 py-1 rounded text-right cursor-pointer"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Preço sugerido</span>
                  <span className="text-green-400 text-lg font-bold">{formatBRL(suggestedPrice)}</span>
                </div>

                <div className="text-sm text-gray-400">Estimativa de consumo: {estimatedPower}W</div>

                <button className="w-full bg-[#0ea5a4] text-white py-2 rounded cursor-pointer">Pagamento completo! (adicionar as finanças)</button>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      {children}
    </div>
  );
}