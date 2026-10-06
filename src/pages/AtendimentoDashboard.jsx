import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  Headset,
  LoaderCircle,
  RefreshCw,
  Search,
  Ticket,
  UsersRound
} from 'lucide-react';
import atendimentoService from '../services/atendimentoService';

const PAGE_SIZE = 100;
const PENDENTES = new Set(['pendente', 'aguardando', 'aguardando atendimento', 'na fila', 'em espera']);
const ATIVOS = new Set(['em-atendimento', 'em atendimento']);
const CONCLUIDOS = new Set(['finalizado', 'finalizada', 'concluido', 'concluído', 'concluida', 'concluída']);
const CANCELADOS = new Set(['cancelado', 'cancelada']);

const normalizarStatus = (registro) => String(registro.status ?? registro.Status ?? '')
  .trim()
  .toLocaleLowerCase('pt-BR');

const obterNumero = (registro) => Number(
  registro.numeroAtual ?? registro.NumeroAtual ?? registro.numero ?? registro.Numero ?? 0
);

const obterPrefixo = (registro) => String(registro.prefixo ?? registro.Prefixo ?? '');
const obterInicio = (registro) => registro.dataInicioAtendimento ?? registro.DataInicioAtendimento;
const obterFim = (registro) => registro.dataFinalizacaoAtendimento ?? registro.DataFinalizacaoAtendimento;
const obterCriado = (registro) => registro.created ?? registro.Created;

const obterGrupoStatus = (registro) => {
  const status = normalizarStatus(registro);
  if (PENDENTES.has(status)) return 'pendente';
  if (ATIVOS.has(status)) return 'ativo';
  if (CONCLUIDOS.has(status)) return 'concluido';
  if (CANCELADOS.has(status)) return 'cancelado';
  return 'outro';
};

const obterChave = (registro) => registro.id
  ?? registro.Id
  ?? registro.atendimentoId
  ?? registro.AtendimentoId
  ?? `${obterPrefixo(registro)}-${obterNumero(registro)}`;

const nomeStatus = (registro) => {
  const status = normalizarStatus(registro);
  const nomes = {
    pendente: 'Pendente',
    aguardando: 'Aguardando',
    'aguardando atendimento': 'Aguardando',
    'na fila': 'Na fila',
    'em espera': 'Em espera',
    'em-atendimento': 'Em atendimento',
    'em atendimento': 'Em atendimento',
    finalizado: 'Finalizado',
    finalizada: 'Finalizado',
    cancelado: 'Cancelado',
    cancelada: 'Cancelado'
  };
  return nomes[status] ?? (status ? status.replaceAll('-', ' ') : 'Sem status');
};

const classesStatus = (grupo) => ({
  pendente: 'bg-amber-100 text-amber-900',
  ativo: 'bg-sky-100 text-sky-800',
  concluido: 'bg-emerald-100 text-emerald-800',
  cancelado: 'bg-rose-100 text-rose-800',
  outro: 'bg-gray-100 text-gray-700'
}[grupo]);

const tempoEmSegundos = (registro, agora = Date.now()) => {
  const inicio = obterInicio(registro);
  if (!inicio) return null;
  const fim = obterFim(registro);
  const grupo = obterGrupoStatus(registro);
  if (!fim && grupo !== 'ativo') return null;
  const inicioMs = new Date(inicio).getTime();
  const fimMs = fim ? new Date(fim).getTime() : agora;
  if (Number.isNaN(inicioMs) || Number.isNaN(fimMs)) return null;
  return Math.max(0, Math.floor((fimMs - inicioMs) / 1000));
};

const esperaEmSegundos = (registro) => {
  const criado = obterCriado(registro);
  const inicio = obterInicio(registro);
  if (!criado || !inicio) return null;
  const criadoMs = new Date(criado).getTime();
  const inicioMs = new Date(inicio).getTime();
  if (Number.isNaN(criadoMs) || Number.isNaN(inicioMs) || inicioMs < criadoMs) return null;
  return Math.floor((inicioMs - criadoMs) / 1000);
};

const formatarDuracao = (segundos) => {
  if (segundos === null || segundos === undefined) return 'Sem registro';
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const restante = segundos % 60;
  return [horas, minutos, restante].map((valor) => String(valor).padStart(2, '0')).join(':');
};

const formatarDataHora = (valor) => {
  if (!valor) return 'Sem registro';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return 'Sem registro';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(data);
};

const formatarDia = (valor) => {
  if (!valor) return 'Sem data';
  const [ano, mes, dia] = valor.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' })
    .format(new Date(Date.UTC(ano, mes - 1, dia)));
};

const extrairRegistros = (resposta) =>
  resposta?.Data || resposta?.data || resposta?.Atendimentos || resposta?.atendimentos || [];

const ordenarFila = (registros) => [...registros].sort((a, b) => {
  const grupoA = obterGrupoStatus(a) === 'pendente' ? 0 : 1;
  const grupoB = obterGrupoStatus(b) === 'pendente' ? 0 : 1;
  return grupoA - grupoB
    || obterNumero(a) - obterNumero(b)
    || obterPrefixo(a).localeCompare(obterPrefixo(b));
});

const analisarAtendimentos = async ({ guicheAtual, dataAnalise }) => {
  const primeiraResposta = await atendimentoService.listar({
    guicheAtual,
    dataInicio: dataAnalise,
    dataFim: dataAnalise,
    page: 1,
    pageSize: PAGE_SIZE
  });
  const primeiraLista = extrairRegistros(primeiraResposta);
  const metadados = primeiraResposta?.Pagination || primeiraResposta?.pagination;
  const totalPaginas = Number(metadados?.TotalPages ?? metadados?.totalPages ?? 1) || 0;
  const todos = Array.isArray(primeiraLista) ? [...primeiraLista] : [];

  for (let pagina = 2; pagina <= totalPaginas; pagina += 1) {
    const resposta = await atendimentoService.listar({
      guicheAtual,
      dataInicio: dataAnalise,
      dataFim: dataAnalise,
      page: pagina,
      pageSize: PAGE_SIZE
    });
    const dados = extrairRegistros(resposta);
    if (Array.isArray(dados)) todos.push(...dados);
  }

  return ordenarFila(todos);
};

const obterGuiche = (registro) => Number(registro.guicheAtual ?? registro.GuicheAtual ?? 0);

const agruparPorGuiche = (registros) => {
  const grupos = new Map();
  registros.forEach((registro) => {
    const guiche = obterGuiche(registro);
    if (!Number.isInteger(guiche) || guiche < 1) return;
    if (!grupos.has(guiche)) grupos.set(guiche, []);
    grupos.get(guiche).push(registro);
  });
  return [...grupos.entries()]
    .sort(([guicheA], [guicheB]) => guicheA - guicheB)
    .map(([guiche, lista]) => ({ guiche, registros: ordenarFila(lista) }));
};

const dataLocalHoje = () => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const parseGuiches = (texto) => [...new Set(
  texto.split(',')
    .map((valor) => Number(valor.trim()))
    .filter((valor) => Number.isInteger(valor) && valor > 0)
)];

const calcularIndicadores = (registros, agora) => {
  const contagens = { pendente: 0, ativo: 0, concluido: 0, cancelado: 0, outro: 0 };
  const duracoes = [];
  const esperas = [];
  registros.forEach((registro) => {
    const grupo = obterGrupoStatus(registro);
    contagens[grupo] += 1;
    const espera = esperaEmSegundos(registro);
    if (espera !== null) esperas.push(espera);
    if (grupo === 'concluido') {
      const duracao = tempoEmSegundos(registro, agora);
      if (duracao !== null) duracoes.push(duracao);
    }
  });
  return {
    ...contagens,
    total: registros.length,
    media: duracoes.length ? Math.round(duracoes.reduce((total, tempo) => total + tempo, 0) / duracoes.length) : null,
    amostraMedia: duracoes.length,
    esperaMedia: esperas.length ? Math.round(esperas.reduce((total, tempo) => total + tempo, 0) / esperas.length) : null,
    amostraEspera: esperas.length
  };
};

const calcularEscala = (valorMaximo) => {
  const bruto = Math.max(valorMaximo, 0.1) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(bruto));
  const normalizado = bruto / magnitude;
  const fator = normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 5 ? 5 : 10;
  const passo = fator * magnitude;
  return { maximo: Math.ceil(valorMaximo / passo) * passo || passo, passo };
};

const formatarMinutosEixo = (valor) => Number(valor.toFixed(1)).toLocaleString('pt-BR', {
  maximumFractionDigits: 1
});

export default function AtendimentoDashboard() {
  const [guiche, setGuiche] = useState('1');
  const [guichesComparacao, setGuichesComparacao] = useState('*');
  const [dataAnalise, setDataAnalise] = useState(dataLocalHoje);
  const [dataConsultada, setDataConsultada] = useState(dataLocalHoje);
  const [guicheConsultado, setGuicheConsultado] = useState(1);
  const [dadosComparacao, setDadosComparacao] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizadoEm, setAtualizadoEm] = useState(null);
  const [agora, setAgora] = useState(Date.now());
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [busca, setBusca] = useState('');

  const carregarDados = useCallback(async (guicheAlvo, guichesAlvo, dataAlvo) => {
    setCarregando(true);
    setErro('');
    try {
      let resultados;
      let erroConsultaPrincipal;
      if (guichesAlvo === '*') {
        const todos = await analisarAtendimentos({ dataAnalise: dataAlvo });
        resultados = agruparPorGuiche(todos);
        if (!resultados.some((resultado) => resultado.guiche === guicheAlvo)) {
          resultados.push({ guiche: guicheAlvo, registros: [] });
          resultados.sort((a, b) => a.guiche - b.guiche);
        }
      } else {
        const guiches = [...new Set([guicheAlvo, ...guichesAlvo])];
        const respostas = await Promise.allSettled(guiches.map((numero) => analisarAtendimentos({ guicheAtual: numero, dataAnalise: dataAlvo })));
        resultados = respostas.map((resultado, indice) => resultado.status === 'fulfilled'
          ? { guiche: guiches[indice], registros: resultado.value }
          : { guiche: guiches[indice], registros: [], erro: resultado.reason?.message || 'Falha ao consultar este guichê.' });
        erroConsultaPrincipal = resultados.find((resultado) => resultado.guiche === guicheAlvo)?.erro;
      }
      const selecionado = resultados.find((resultado) => resultado.guiche === guicheAlvo);
      if (erroConsultaPrincipal || selecionado?.erro) throw new Error(erroConsultaPrincipal || selecionado.erro);
      setRegistros(selecionado?.registros ?? []);
      setDadosComparacao(resultados);
      setGuicheConsultado(guicheAlvo);
      setDataConsultada(dataAlvo);
      setAtualizadoEm(new Date());
      const falhasSecundarias = resultados.filter((resultado) => resultado.erro).map((resultado) => resultado.guiche);
      if (falhasSecundarias.length) {
        setErro(`Não foi possível carregar os guichês: ${falhasSecundarias.join(', ')}. Os demais dados foram mantidos.`);
      }
    } catch (requestError) {
      setErro(requestError.message || 'Não foi possível carregar os dados de atendimento.');
      setRegistros([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados(1, '*', dataLocalHoje());
  }, [carregarDados]);

  useEffect(() => {
    if (!registros.some((registro) => obterGrupoStatus(registro) === 'ativo')) return undefined;
    const timer = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [registros]);

  const metricas = useMemo(() => calcularIndicadores(registros, agora), [registros, agora]);
  const metricasComparacao = useMemo(() => dadosComparacao.map(({ guiche: numero, registros: lista, erro: erroConsulta }) => ({
    guiche: numero,
    erro: erroConsulta,
    ...calcularIndicadores(lista, agora)
  })), [dadosComparacao, agora]);

  const registrosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    return registros.filter((registro) => {
      const grupo = obterGrupoStatus(registro);
      const statusPassa = filtroStatus === 'todos' || grupo === filtroStatus;
      const nome = registro.nomeCliente ?? registro.NomeCliente ?? registro.nomeSolicitante ?? registro.NomeSolicitante ?? '';
      const texto = `${obterPrefixo(registro)} ${obterNumero(registro)} ${nome} ${nomeStatus(registro)}`.toLocaleLowerCase('pt-BR');
      return statusPassa && (!termo || texto.includes(termo));
    });
  }, [registros, filtroStatus, busca]);

  const consultarGuiche = (event) => {
    event.preventDefault();
    const valor = Number(guiche);
    if (!Number.isInteger(valor) || valor < 1) {
      setErro('Informe um guichê maior que zero.');
      return;
    }
    const comparacao = guichesComparacao.trim() === '*' ? '*' : parseGuiches(guichesComparacao);
    if (comparacao !== '*' && !comparacao.length) {
      setErro('Informe * para todos os guichês ou números de guichê separados por vírgula.');
      return;
    }
    carregarDados(valor, comparacao, dataAnalise);
  };

  const cards = [
    { label: 'Aguardando', value: metricas.pendente, detail: 'Chamados pendentes', icon: UsersRound, tone: 'amber' },
    { label: 'Em atendimento', value: metricas.ativo, detail: 'Operações ativas', icon: Headset, tone: 'blue' },
    { label: 'Concluídos', value: metricas.concluido, detail: 'Atendimentos finalizados', icon: CheckCircle2, tone: 'green' },
    { label: 'Tempo médio de atendimento', value: formatarDuracao(metricas.media), detail: `${metricas.amostraMedia} com horários registrados`, icon: Clock3, tone: 'slate' },
    { label: 'Tempo médio de espera', value: formatarDuracao(metricas.esperaMedia), detail: `${metricas.amostraEspera} com criação e início`, icon: Clock3, tone: 'amber' }
  ];

  const cores = {
    amber: 'border-amber-300 text-amber-700 bg-amber-50',
    blue: 'border-sky-300 text-sky-700 bg-sky-50',
    green: 'border-emerald-300 text-emerald-700 bg-emerald-50',
    slate: 'border-slate-300 text-slate-700 bg-slate-50'
  };
  const itensDistribuicao = [
    { label: 'Pendentes', valor: metricas.pendente, color: 'bg-amber-400' },
    { label: 'Em atendimento', valor: metricas.ativo, color: 'bg-sky-500' },
    { label: 'Finalizados', valor: metricas.concluido, color: 'bg-emerald-500' },
    { label: 'Cancelados', valor: metricas.cancelado, color: 'bg-rose-400' },
    { label: 'Outros', valor: metricas.outro, color: 'bg-gray-400' }
  ];
  const filtros = [
    { id: 'todos', label: 'Todos' },
    { id: 'pendente', label: 'Pendentes' },
    { id: 'ativo', label: 'Em atendimento' },
    { id: 'concluido', label: 'Finalizados' },
    { id: 'cancelado', label: 'Cancelados' }
  ];
  const graficosDuracao = [
    {
      key: 'media',
      amostra: 'amostraMedia',
      titulo: 'Tempo médio de atendimento',
      descricao: 'Duração entre o início e a finalização dos chamados concluídos.',
      cor: '#0284c7'
    },
    {
      key: 'esperaMedia',
      amostra: 'amostraEspera',
      titulo: 'Tempo médio de espera',
      descricao: 'Tempo entre a criação do chamado e o início do atendimento.',
      cor: '#d97706'
    }
  ];

  return (
    <div className="w-full space-y-6 pb-4">
      <div className="flex flex-col gap-4 border-b border-gray-300 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-700">
            <Activity size={15} /> Operação de atendimento
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Visão gerencial</h1>
          <p className="mt-1 text-sm text-gray-600">Indicadores de {formatarDia(dataConsultada)} para o guichê {guicheConsultado}.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <form onSubmit={consultarGuiche} className="flex items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600">Guichê</span>
              <input
                type="number"
                min="1"
                value={guiche}
                onChange={(event) => setGuiche(event.target.value)}
                className="h-10 w-24 rounded border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                aria-label="Filtrar por guichê"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600">Comparar guichês (* = todos)</span>
              <input
                type="text"
                value={guichesComparacao}
                onChange={(event) => setGuichesComparacao(event.target.value)}
                placeholder="* ou 1, 2, 3"
                className="h-10 w-40 rounded border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                aria-label="Digite asterisco para todos ou números dos guichês separados por vírgula"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600">Dia da análise</span>
              <input
                type="date"
                value={dataAnalise}
                onChange={(event) => setDataAnalise(event.target.value)}
                className="h-10 rounded border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                aria-label="Dia para análise dos atendimentos"
              />
            </label>
            <button type="submit" disabled={carregando} className="h-10 rounded bg-[#2d353c] px-4 text-sm font-semibold text-white hover:bg-[#242a30] disabled:opacity-50">
              Aplicar
            </button>
          </form>
          <button
            type="button"
            onClick={() => carregarDados(
              guicheConsultado,
              guichesComparacao.trim() === '*' ? '*' : parseGuiches(guichesComparacao),
              dataConsultada
            )}
            disabled={carregando}
            className="inline-flex h-10 items-center gap-2 rounded border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            title="Atualizar indicadores"
          >
            {carregando ? <LoaderCircle size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Atualizar
          </button>
        </div>
      </div>

      {erro && <div role="alert" className="border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-800">{erro}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {cards.map(({ label, value, detail, icon: Icon, tone }) => (
          <section key={label} className="flex min-h-28 items-center justify-between border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
              <p className="mt-1 truncate text-2xl font-bold tabular-nums text-gray-950">{carregando && !registros.length ? '...' : value}</p>
              <p className="mt-1 text-xs text-gray-500">{detail}</p>
            </div>
            <span className={`ml-3 flex h-11 w-11 shrink-0 items-center justify-center border ${cores[tone]}`}>
              <Icon size={20} />
            </span>
          </section>
        ))}
      </div>

      <section className="border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-emerald-700" />
              <h2 className="font-semibold text-gray-900">Comparativo de desempenho</h2>
            </div>
            <p className="mt-1 text-xs text-gray-500">Comparação dos guichês aplicados; o selecionado está destacado em verde.</p>
          </div>
          <span className="border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            Guichê selecionado: {guicheConsultado}
          </span>
        </div>

        <div className="grid grid-cols-1 divide-y divide-gray-200 xl:grid-cols-2 xl:divide-x xl:divide-y-0">
          {graficosDuracao.map((grafico) => {
            const maximoValor = Math.max(0, ...metricasComparacao.map((item) => (item[grafico.key] ?? 0) / 60));
            const escala = calcularEscala(maximoValor);
            const larguraGrafico = Math.max(620, metricasComparacao.length * 88 + 110);
            const alturaGrafico = 340;
            const margem = { esquerda: 76, direita: 24, topo: 26, base: 76 };
            const alturaPlot = alturaGrafico - margem.topo - margem.base;
            const larguraPlot = larguraGrafico - margem.esquerda - margem.direita;
            const larguraColuna = Math.min(42, (larguraPlot / Math.max(metricasComparacao.length, 1)) * 0.48);
            const quantidadeIntervalos = Math.round(escala.maximo / escala.passo);

            return (
              <div key={grafico.key} className="min-w-0 p-4 sm:p-5">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">{grafico.titulo}</h3>
                  <p className="mt-1 text-xs text-gray-500">{grafico.descricao}</p>
                </div>
                {metricasComparacao.length ? (
                  <div className="overflow-x-auto">
                    <svg
                      viewBox={`0 0 ${larguraGrafico} ${alturaGrafico}`}
                      className="block h-auto min-w-full"
                      role="img"
                      aria-label={`${grafico.titulo} por guichê. Eixo vertical em minutos; eixo horizontal por guichê.`}
                    >
                      <text
                        x="18"
                        y={margem.topo + alturaPlot / 2}
                        transform={`rotate(-90 18 ${margem.topo + alturaPlot / 2})`}
                        textAnchor="middle"
                        className="fill-gray-600 text-[11px]"
                      >
                        Minutos
                      </text>

                      {Array.from({ length: quantidadeIntervalos + 1 }, (_, indice) => {
                        const valor = indice * escala.passo;
                        const y = margem.topo + alturaPlot - (valor / escala.maximo) * alturaPlot;
                        return (
                          <g key={`tick-${indice}`}>
                            <line x1={margem.esquerda} x2={larguraGrafico - margem.direita} y1={y} y2={y} stroke="#e5e7eb" strokeDasharray={indice === 0 ? undefined : '3 4'} />
                            <text x={margem.esquerda - 10} y={y + 4} textAnchor="end" className="fill-gray-500 text-[11px]">
                              {formatarMinutosEixo(valor)}
                            </text>
                          </g>
                        );
                      })}

                      <line x1={margem.esquerda} x2={margem.esquerda} y1={margem.topo} y2={margem.topo + alturaPlot} stroke="#9ca3af" />
                      <line x1={margem.esquerda} x2={larguraGrafico - margem.direita} y1={margem.topo + alturaPlot} y2={margem.topo + alturaPlot} stroke="#9ca3af" />

                      {metricasComparacao.map((item, indice) => {
                        const selecionado = item.guiche === guicheConsultado;
                        const segundos = item[grafico.key];
                        const minutos = segundos === null || segundos === undefined ? null : segundos / 60;
                        const xCentro = margem.esquerda + ((indice + 0.5) / metricasComparacao.length) * larguraPlot;
                        const barraAltura = minutos === null ? 0 : (minutos / escala.maximo) * alturaPlot;
                        const y = margem.topo + alturaPlot - barraAltura;
                        const valorTexto = item.erro ? 'Indisp.' : minutos === null ? 'N/D' : formatarDuracao(segundos);
                        const amostra = item[grafico.amostra];

                        return (
                          <g key={item.guiche}>
                            {selecionado && (
                              <rect
                                x={xCentro - larguraPlot / metricasComparacao.length / 2 + 3}
                                y={margem.topo - 8}
                                width={larguraPlot / metricasComparacao.length - 6}
                                height={alturaPlot + margem.base - 4}
                                fill="#ecfdf5"
                              />
                            )}
                            <rect
                              x={xCentro - larguraColuna / 2}
                              y={minutos === null ? margem.topo + alturaPlot - 2 : y}
                              width={larguraColuna}
                              height={Math.max(barraAltura, 2)}
                              fill={selecionado ? '#059669' : grafico.cor}
                              rx="2"
                            >
                              <title>{`Guichê ${item.guiche}: ${valorTexto}; amostra: ${amostra} registros`}</title>
                            </rect>
                            <text
                              x={xCentro}
                              y={Math.max(margem.topo + 12, y - 7)}
                              textAnchor="middle"
                              className={`text-[10px] tabular-nums ${selecionado ? 'fill-emerald-800 font-bold' : 'fill-gray-600'}`}
                            >
                              {valorTexto}
                            </text>
                            <text
                              x={xCentro}
                              y={margem.topo + alturaPlot + 20}
                              textAnchor="middle"
                              className={`text-[11px] ${selecionado ? 'fill-emerald-800 font-bold' : 'fill-gray-600'}`}
                            >
                              G{item.guiche}
                            </text>
                            <text
                              x={xCentro}
                              y={margem.topo + alturaPlot + 37}
                              textAnchor="middle"
                              className="fill-gray-400 text-[9px]"
                            >
                              n={amostra}
                            </text>
                          </g>
                        );
                      })}

                      <text x={margem.esquerda + larguraPlot / 2} y={alturaGrafico - 10} textAnchor="middle" className="fill-gray-600 text-[11px]">
                        Guichês (amostra por coluna)
                      </text>
                    </svg>
                  </div>
                ) : (
                  <p className="flex h-72 items-center justify-center text-sm text-gray-500">Aplique guichês para comparar.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(250px,0.8fr)_minmax(0,2.2fr)]">
        <section className="border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 border-b border-gray-200 pb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Distribuição da fila</h2>
              <p className="mt-1 text-xs text-gray-500">{metricas.total} chamados no guichê {guicheConsultado}</p>
            </div>
            <Ticket size={18} className="text-gray-400" />
          </div>
          <div className="mt-5 space-y-4">
            {itensDistribuicao.map((item) => {
              const percentual = metricas.total ? (item.valor / metricas.total) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-semibold tabular-nums text-gray-900">{item.valor}</span>
                  </div>
                  <div
                    className="h-2 overflow-hidden bg-gray-100"
                    role="progressbar"
                    aria-label={item.label}
                    aria-valuenow={item.valor}
                    aria-valuemin={0}
                    aria-valuemax={metricas.total}
                  >
                    <div className={`h-full ${item.color} transition-[width] duration-500`} style={{ width: `${percentual}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-5 border-t border-gray-100 pt-3 text-xs text-gray-500">
            Distribuição referente ao guichê e dia selecionados.
          </p>
        </section>

        <section className="overflow-hidden border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Acompanhamento de chamados</h2>
              <p className="mt-1 text-xs text-gray-500">Pendentes primeiro; demais ordenados por numeração.</p>
            </div>
            <label className="relative block w-full md:max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar senha ou cliente"
                className="h-9 w-full border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                aria-label="Buscar chamado por senha, cliente ou status"
              />
            </label>
          </div>
          <div className="flex gap-1 overflow-x-auto border-b border-gray-200 px-4 pt-2">
            {filtros.map((filtro) => (
              <button
                key={filtro.id}
                type="button"
                onClick={() => setFiltroStatus(filtro.id)}
                className={`shrink-0 border-b-2 px-3 py-2 text-xs font-semibold transition ${filtroStatus === filtro.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                {filtro.label}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <thead className="bg-gray-50 text-[10px] uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Senha</th>
                  <th className="px-4 py-2.5 font-semibold">Cliente</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold">Início</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Duração</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registrosFiltrados.slice(0, 12).map((registro) => {
                  const grupo = obterGrupoStatus(registro);
                  const nome = registro.nomeCliente ?? registro.NomeCliente ?? registro.nomeSolicitante ?? registro.NomeSolicitante ?? 'Não informado';
                  return (
                    <tr key={obterChave(registro)} className={grupo === 'pendente' ? 'bg-amber-50/50' : grupo === 'concluido' || grupo === 'cancelado' ? 'bg-gray-50' : 'bg-white'}>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-bold text-gray-900">{obterPrefixo(registro)}{String(obterNumero(registro)).padStart(3, '0')}</td>
                      <td className="max-w-48 truncate px-4 py-3 text-sm text-gray-700">{nome}</td>
                      <td className="px-4 py-3"><span className={`whitespace-nowrap px-2 py-1 text-[10px] font-semibold ${classesStatus(grupo)}`}>{nomeStatus(registro)}</span></td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-gray-500">{formatarDataHora(obterInicio(registro))}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs tabular-nums text-gray-700">{formatarDuracao(tempoEmSegundos(registro, agora))}</td>
                    </tr>
                  );
                })}
                {!carregando && registrosFiltrados.length === 0 && (
                  <tr><td colSpan="5" className="px-4 py-10 text-center text-sm text-gray-500">Nenhum chamado corresponde ao filtro.</td></tr>
                )}
                {carregando && registros.length === 0 && (
                  <tr><td colSpan="5" className="px-4 py-10 text-center text-sm text-gray-500">Carregando chamados...</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 text-xs text-gray-500">
            <span>Exibindo {Math.min(registrosFiltrados.length, 12)} de {registrosFiltrados.length} resultado(s)</span>
            <span>{atualizadoEm ? `Atualizado ${formatarDataHora(atualizadoEm)}` : 'Aguardando sincronização'}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
