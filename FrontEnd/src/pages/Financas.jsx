import React, { useState, useMemo } from "react";
import { DollarSign, TrendingDown, TrendingUp, Edit, Trash2, Search, Filter } from "lucide-react";
import { useFinancas } from '../utils/useFinanças';


import AddTransactionModal from '../components/AddTransactionModal';
import EditTransactionModal from '../components/EditTransactionModal';
import { useAuth } from '../AuthContext';

// Função de formatação para R$
const formatarMoeda = (valor) => {
  const numValor = parseFloat(valor) || 0;
  return numValor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const Card = ({ title, icon, value }) => (
  <div className="bg-[#1e293b] p-5 rounded-xl shadow-lg flex flex-col">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
      {icon}
    </div>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);


export default function Financas() {
  const { transacoes, loading: loadingTransacoes, erro: erroTransacoes, summary, adicionarTransacao, deletarTransacao, atualizarTransacao } = useFinancas();

  const { receitaTotal: totalRevenue, despesaTotal: totalCost, lucroLiquido: totalProfit } = summary;

  const loading = loadingTransacoes;
  const erro = erroTransacoes;
  const { currentUser } = useAuth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  
  // Estados para Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState(''); // 'Receita', 'Despesa'
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Função de Salvar 
  const handleSaveTransaction = async (data) => {
    try {
      await adicionarTransacao(data);
      setShowAddModal(false);
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      throw new Error(error.message || "Erro desconhecido ao salvar.");
    }
  };


  // Função para abrir o modal de edição
  const handleEditClick = (transaction) => {
    setTransactionToEdit(transaction);
    setShowEditModal(true);
  };

  // Função para confirmar e deletar (usa a função do hook)
  const handleDeleteClick = (id) => {
    if (window.confirm("Tem certeza que deseja deletar esta transação?")) {
      deletarTransacao(id).catch(err => {
        alert("Erro ao deletar: " + err.message);
      });
    }
  };

  // Lógica de Filtragem
  const filteredTransacoes = useMemo(() => {
    if (!Array.isArray(transacoes)) return [];

    return transacoes.filter(t => {
      // Filtro por termo de busca (descrição ou categoria)
      const matchesSearch = searchTerm === '' ||
        t.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.categoria?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por tipo
      const matchesType = filterType === '' || t.tipo === filterType;

      // Filtro por categoria
      const matchesCategory = filterCategory === '' || t.categoria === filterCategory;

      // Filtro por data
      let matchesDate = true;
      if (filterStartDate || filterEndDate) {
        const transactionDate = t.data?.toDate ? t.data.toDate() : (t.data?.seconds ? new Date(t.data.seconds * 1000) : null);
        if (transactionDate) {
          if (filterStartDate) {
            const start = new Date(filterStartDate);
            start.setHours(0, 0, 0, 0);
            matchesDate = matchesDate && transactionDate >= start;
          }
          if (filterEndDate) {
            const end = new Date(filterEndDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && transactionDate <= end;
          }
        }
      }

      return matchesSearch && matchesType && matchesCategory && matchesDate;
    }).sort((a, b) => {
      // Ordena por data (mais recente primeiro)
      const dateA = a.data?.seconds || 0;
      const dateB = b.data?.seconds || 0;
      return dateB - dateA;
    });
  }, [transacoes, searchTerm, filterType, filterCategory, filterStartDate, filterEndDate]);

  // Extrai categorias únicas para o filtro
  const uniqueCategories = useMemo(() => {
    const categories = new Set(transacoes.map(t => t.categoria).filter(Boolean));
    return Array.from(categories).sort();
  }, [transacoes]);


  if (loading) {
    return <div className="p-6 text-white text-center">Carregando dados financeiros...</div>;
  }

  if (erro) {
    return (
      <div className="p-6 text-white text-center">
        <h1 className="text-xl text-red-500 mb-4">Erro ao carregar dados financeiros.</h1>
        <p className="text-red-400">Mensagem: {erro}</p>
        <p className="mt-4 text-sm text-gray-400">Verifique o console para detalhes sobre a necessidade de índices ou permissões.</p>
      </div>
    );
  }

  // Lógica do Gráfico de Linha (Melhoria)
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const lucroPorMes = Array(12).fill(0);
  
  if (Array.isArray(transacoes)) {
    transacoes.forEach(t => {
      if (t.data && typeof t.data.toDate === 'function') {
        try {
          const mes = t.data.toDate().getMonth(); // 0-11
          const valor = t.tipo === 'Receita' ? (t.valor || 0) : -(t.valor || 0);
          if (mes >= 0 && mes <= 11) {
            lucroPorMes[mes] += valor;
          }
        } catch (e) {
          // console.warn("Transação ignorada por erro de data (toDate):", t);
        }
      }
    });
  }

  const maxLucro = Math.max(...lucroPorMes, 0);
  const minLucro = Math.min(...lucroPorMes, 0);
  const range = maxLucro - minLucro;
  const padding = range * 0.1; // 10% de padding
  const maxAbs = Math.max(Math.abs(maxLucro), Math.abs(minLucro));
  const yMax = maxAbs + padding;
  const yMin = -maxAbs - padding;
  const yRange = yMax - yMin;

  // Função para calcular a posição Y de um ponto no gráfico (0 a 100)
  const getYPosition = (value) => {
    return 100 - ((value - yMin) / yRange) * 100;
  };

  // Cria os pontos para o gráfico de linha SVG
  const points = lucroPorMes.map((lucro, index) => {
    const x = (index / (meses.length - 1)) * 100;
    const y = getYPosition(lucro);
    return `${x},${y}`;
  }).join(' ');

  // Posição da linha zero (0)
  const zeroLineY = getYPosition(0);


  return (
    <div className="p-6 bg-[#0f172a] text-white min-h-screen">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestão Financeira</h1>
          <p className="text-gray-400">Acompanhe receitas, despesas e lucratividade.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 w-full sm:w-auto"
          aria-label="Adicionar transação"
        >
          + Adicionar Transação
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card title="Receita Total" icon={<TrendingUp className="text-green-500" />} value={formatarMoeda(totalRevenue)} />
        <Card title="Custo Total" icon={<TrendingDown className="text-red-500" />} value={formatarMoeda(totalCost)} />
        <Card title="Lucro Líquido" icon={<DollarSign className={totalProfit >= 0 ? 'text-green-500' : 'text-red-500'} />} value={formatarMoeda(totalProfit)} />
      </div>

      {/* Seção Gráfico e Histórico de Transações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Linha (Melhoria) */}
        <div className="lg:col-span-3 bg-[#1e293b] p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-lg font-semibold mb-4">Tendência de Lucro Líquido (Últimos 12 Meses)</h2>
          <div className="relative h-64 sm:h-80 lg:h-96">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              {/* Linha Zero */}
              <line x1="0" y1={zeroLineY} x2="100" y2={zeroLineY} stroke="#4b5563" strokeWidth="0.2" strokeDasharray="1,1" />

              {/* Linha do Gráfico */}
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="0.5"
                points={points}
              />

              {/* Pontos e Tooltips */}
              {lucroPorMes.map((lucro, index) => {
                const x = (index / (meses.length - 1)) * 100;
                const y = getYPosition(lucro);
                const isPositive = lucro >= 0;
                const color = isPositive ? '#10b981' : '#ef4444'; // green-500 ou red-500
                const tooltipText = `${meses[index]}: ${formatarMoeda(lucro)}`;

                return (
                  <g key={meses[index]}>
                    {/* Ponto */}
                    <circle cx={x} cy={y} r="1" fill={color} stroke="#1e293b" strokeWidth="0.5" />
                    
                    {/* Área de Interação (para tooltip) */}
                    <rect x={x - 4} y="0" width="8" height="100" fill="transparent" className="hover:opacity-100 opacity-0 transition-opacity duration-300 cursor-pointer">
                      <title>{tooltipText}</title>
                    </rect>
                  </g>
                );
              })}
            </svg>
            
            {/* Eixo X (Rótulos dos Meses) */}
            <div className="flex justify-between mt-2 text-xs text-gray-400 px-2">
              {meses.map(mes => <span key={mes} className="w-1/12 text-center">{mes}</span>)}
            </div>

            {/* Eixo Y (Rótulos de Valor - Simplificado) */}
            <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-xs text-gray-400 -translate-x-full pr-2">
                <span>{formatarMoeda(yMax)}</span>
                <span>{formatarMoeda(0)}</span>
                <span>{formatarMoeda(yMin)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Transações */}
      <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Filter size={20} /> Histórico de Transações</h2>
        
        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Buscar por descrição ou categoria..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white border-gray-600 placeholder-gray-400 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <select
            className="py-2 px-4 border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white border-gray-600 text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Todos os Tipos</option>
            <option value="Receita">Receita</option>
            <option value="Despesa">Despesa</option>
          </select>

          <select
            className="py-2 px-4 border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white border-gray-600 text-sm"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Todas as Categorias</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <input
            type="date"
            className="py-2 px-4 border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white border-gray-600 text-sm"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            title="Data Inicial"
          />
          <input
            type="date"
            className="py-2 px-4 border rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white border-gray-600 text-sm"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            title="Data Final"
          />
        </div>

        {/* Tabela de Histórico */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Valor</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {filteredTransacoes.length > 0 ? (
                filteredTransacoes.map((t) => {
                  const date = t.data?.toDate ? t.data.toDate() : (t.data?.seconds ? new Date(t.data.seconds * 1000) : null);
                  return (
                    <tr key={t.id} className="hover:bg-gray-700 transition duration-150">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">{date ? date.toLocaleDateString('pt-BR') : 'N/A'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">{t.descricao}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">{t.categoria}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.tipo === 'Receita' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {t.tipo}
                        </span>
                      </td>
                      <td className={`px-4 py-4 whitespace-nowrap text-sm font-bold text-right ${t.tipo === 'Receita' ? 'text-green-400' : 'text-red-400'}`}>
                        {formatarMoeda(t.valor)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button onClick={() => handleEditClick(t)} className="text-indigo-400 hover:text-indigo-300 inline-block" title="Editar">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDeleteClick(t.id)} className="text-red-400 hover:text-red-300 inline-block" title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-4 text-center text-gray-400">Nenhuma transação encontrada com os filtros aplicados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/*Adicionar Transação */}
      {showAddModal && (
        <AddTransactionModal
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveTransaction}
        />
      )}

      {/*Editar Transação */}
      {showEditModal && transactionToEdit && (
        <EditTransactionModal
          onClose={() => {
            setShowEditModal(false);
            setTransactionToEdit(null);
          }}
          transactionToEdit={transactionToEdit}
        />
      )}
    </div>
  );
}