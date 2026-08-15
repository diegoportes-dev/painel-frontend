import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [erroSincronizacao, setErroSincronizacao] = useState(false);
  const [metricas, setMetricas] = useState({
    totalUsuarios: 0,
    totalPerfis: 0, // <-- Corrigido aqui: mudado de totalPerfim para totalPerfis
    faturamentoMensal: 14250,
    taxaConversao: 3.4
  });

  const carregarDadosDashboard = async () => {
    setLoading(true);
    setErroSincronizacao(false);
    
    // 1. Tenta buscar total de usuários de forma isolada
    try {
      const resUsuarios = await apiClient.get('/usuarios?page=1&pageSize=1');
      if (resUsuarios) {
        const pagina = resUsuarios.Pagination || resUsuarios.pagination;
        setMetricas(prev => ({
          ...prev,
          totalUsuarios: parseInt(pagina?.TotalItems || pagina?.totalItems, 10) || 0
        }));
      }
    } catch (err) {
      console.warn('[Dashboard] Não foi possível ler o contador de usuários:', err.message);
      setErroSincronizacao(true);
    }

    // 2. Tenta buscar total de perfis de forma isolada
    try {
      const resPerfis = await apiClient.get('/perfis?page=1&pageSize=1');
      if (resPerfis) {
        const pagina = resPerfis.Pagination || resPerfis.pagination;
        setMetricas(prev => ({
          ...prev,
          totalPerfis: parseInt(pagina?.TotalItems || pagina?.totalItems, 10) || 0 // <-- Corrigido aqui
        }));
      }
    } catch (err) {
      console.warn('[Dashboard] Não foi possível ler o contador de perfis:', err.message);
      setErroSincronizacao(true);
    }

    setLoading(false);
  };

  useEffect(() => {
    carregarDadosDashboard();
  }, []);

  return (
    <div className="space-y-8 w-full animate-in fade-in duration-200">
      
      {/* Título e Ação */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">Dashboard</h1>
          <p className="text-sm text-gray-600">Visão geral do sistema, tráfego de dados e controle gerencial.</p>
        </div>
        <button
          onClick={carregarDadosDashboard}
          disabled={loading}
          className="flex items-center gap-2 rounded bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Sincronizando...' : 'Atualizar Dados'}
        </button>
      </div>

      {erroSincronizacao && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded text-xs font-medium">
          Aviso: Alguns contadores automáticos não puderam ser carregados. Exibindo dados locais seguros.
        </div>
      )}

      {/* QUADRANTE DE CARDS DE ESTATÍSTICA */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 w-full">
        
        {/* CARD 1: USUÁRIOS */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuários Cadastrados</p>
            <h3 className="text-3xl font-bold text-gray-900">{metricas.totalUsuarios}</h3>
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <ArrowUpRight size={14} />
              <span>+12.4%</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Users size={22} />
          </div>
        </div>

        {/* CARD 2: PERFIS */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Perfis / Regras</p>
            <h3 className="text-3xl font-bold text-gray-900">{metricas.totalPerfis}</h3> {/* <-- Corrigido aqui */}
            <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
              <span className="text-gray-400 font-normal">Base:</span>
              <span className="text-[#85ce36] font-bold uppercase text-[10px]">C# .NET</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <ShieldCheck size={22} />
          </div>
        </div>

        {/* CARD 3: FATURAMENTO */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Receita Mensal</p>
            <h3 className="text-3xl font-bold text-gray-900">
              {metricas.faturamentoMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <ArrowUpRight size={14} />
              <span>+8.2%</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-lg bg-[#85ce36]/10 flex items-center justify-center text-[#85ce36]">
            <DollarSign size={22} />
          </div>
        </div>

        {/* CARD 4: TAXA Conversão */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Performance Geral</p>
            <h3 className="text-3xl font-bold text-gray-900">{metricas.taxaConversao}%</h3>
            <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
              <ArrowDownRight size={14} />
              <span>-0.4%</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            <TrendingUp size={22} />
          </div>
        </div>

      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 w-full">
        
        {/* Histórico */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Histórico de Movimentação</h3>
              <p className="text-xs text-gray-500">Mapeamento de chamadas e transações de rede da plataforma.</p>
            </div>
            <span className="bg-gray-100 text-gray-600 px-2.5 py-1 text-xs font-medium rounded">Últimos 6 meses</span>
          </div>

          <div className="h-64 flex items-end justify-between gap-4 pt-4 px-2">
            {[
              { mes: 'Jan', valor: 45, cor: 'bg-[#42a1ec]' },
              { mes: 'Fev', valor: 65, cor: 'bg-[#42a1ec]' },
              { mes: 'Mar', valor: 35, cor: 'bg-[#42a1ec]' },
              { mes: 'Abr', valor: 85, cor: 'bg-[#85ce36]' }, 
              { mes: 'Mai', valor: 55, cor: 'bg-[#42a1ec]' },
              { mes: 'Jun', valor: 75, cor: 'bg-[#42a1ec]' }
            ].map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  {item.valor}k
                </span>
                <div 
                  className={`w-full ${item.cor} rounded-t transition-all duration-500 ease-out hover:brightness-95`}
                  style={{ height: `${item.valor}%` }}
                />
                <span className="text-xs font-medium text-gray-500">{item.mes}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Circular */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-bold text-gray-900 text-base">Distribuição de Status</h3>
            <p className="text-xs text-gray-500">Divisão de usuários ativos e inativos na base.</p>
          </div>

          <div className="flex flex-col items-center justify-center py-4 space-y-6">
            <div className="relative h-32 w-32 rounded-full border-8 border-gray-100 flex items-center justify-center shadow-inner">
              <div className="absolute inset-0 rounded-full border-8 border-t-[#85ce36] border-r-[#42a1ec] opacity-80"></div>
              <div className="text-center">
                <span className="text-2xl font-black text-gray-800">82%</span>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Eficiência</p>
              </div>
            </div>

            <div className="w-full space-y-2.5 pt-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="h-3 w-3 rounded bg-[#85ce36]"></span>
                  <span>Usuários Ativos</span>
                </div>
                <span className="text-gray-900 font-bold">78%</span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="h-3 w-3 rounded bg-[#42a1ec]"></span>
                  <span>Administradores</span>
                </div>
                <span className="text-gray-900 font-bold">14%</span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="h-3 w-3 rounded bg-red-400"></span>
                  <span>Contas Inativas</span>
                </div>
                <span className="text-gray-900 font-bold">8%</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
