import { useCallback, useEffect, useState } from 'react';
import {
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  Clock3,
  Headset,
  LoaderCircle,
  Megaphone,
  RefreshCw,
  TicketCheck
} from 'lucide-react';
import atendimentoService from '../services/atendimentoService';

const PAGE_SIZE = 10;

const obterNumero = (atendimento) => Number(
  atendimento.numeroAtual ?? atendimento.NumeroAtual ?? atendimento.numero ?? atendimento.Numero ?? 0
);

const obterPrefixo = (atendimento) => String(atendimento.prefixo ?? atendimento.Prefixo ?? '');
const obterStatus = (atendimento) => String(atendimento.status ?? atendimento.Status ?? '').trim().toLocaleLowerCase('pt-BR');
const obterInicio = (atendimento) => atendimento.dataInicioAtendimento ?? atendimento.DataInicioAtendimento;
const obterFim = (atendimento) => atendimento.dataFinalizacaoAtendimento ?? atendimento.DataFinalizacaoAtendimento;
const obterCriado = (atendimento) => atendimento.created ?? atendimento.Created;

const statusPendente = new Set(['pendente', 'aguardando', 'aguardando atendimento', 'na fila', 'em espera']);

const podeSelecionar = (atendimento) => statusPendente.has(obterStatus(atendimento));

const rotuloStatus = (status) => {
  const rotulos = {
    pendente: 'Pendente',
    aguardando: 'Aguardando',
    'aguardando atendimento': 'Aguardando',
    'na fila': 'Na fila',
    'em espera': 'Em espera',
    'em-atendimento': 'Em atendimento',
    'em atendimento': 'Em atendimento',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado'
  };
  return rotulos[status] ?? (status ? status.replaceAll('-', ' ') : 'Sem status');
};

const classesStatus = (status) => {
  if (statusPendente.has(status)) return 'bg-amber-100 text-amber-800';
  if (status === 'em-atendimento' || status === 'em atendimento') return 'bg-blue-100 text-blue-800';
  if (status === 'finalizado') return 'bg-emerald-100 text-emerald-800';
  if (status === 'cancelado') return 'bg-rose-100 text-rose-800';
  return 'bg-gray-100 text-gray-700';
};

const obterIdentificador = (atendimento) =>
  atendimento.id
  ?? atendimento.Id
  ?? atendimento.atendimentoId
  ?? atendimento.AtendimentoId
  ?? `${obterPrefixo(atendimento)}-${obterNumero(atendimento)}`;

const ordenarAtendimentos = (lista) => [...lista].sort((a, b) => {
  const prioridadeA = podeSelecionar(a) ? 0 : 1;
  const prioridadeB = podeSelecionar(b) ? 0 : 1;
  return prioridadeA - prioridadeB
    || obterNumero(a) - obterNumero(b)
    || obterPrefixo(a).localeCompare(obterPrefixo(b));
});

const formatarTempo = (segundos) => {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const restante = segundos % 60;
  return [horas, minutos, restante].map((parte) => String(parte).padStart(2, '0')).join(':');
};

const obterTempoRegistrado = (atendimento, agora = Date.now()) => {
  const status = obterStatus(atendimento);
  if (statusPendente.has(status)) return null;
  const inicio = obterInicio(atendimento);
  if (!inicio) return null;
  const fim = obterFim(atendimento);
  const atendimentoAtivo = status === 'em-atendimento' || status === 'em atendimento';
  if (!fim && !atendimentoAtivo) return null;
  const inicioMs = new Date(inicio).getTime();
  const fimMs = fim ? new Date(fim).getTime() : agora;
  if (Number.isNaN(inicioMs) || Number.isNaN(fimMs)) return null;
  return Math.max(0, Math.floor((fimMs - inicioMs) / 1000));
};

const obterTempoEspera = (atendimento) => {
  const criado = obterCriado(atendimento);
  const inicio = obterInicio(atendimento);
  if (!criado || !inicio) return null;
  const criadoMs = new Date(criado).getTime();
  const inicioMs = new Date(inicio).getTime();
  if (Number.isNaN(criadoMs) || Number.isNaN(inicioMs) || inicioMs < criadoMs) return null;
  return Math.floor((inicioMs - criadoMs) / 1000);
};

export default function Atendimento() {
  const [guiche, setGuiche] = useState('1');
  const [guicheConsultado, setGuicheConsultado] = useState(1);
  const [atendimentos, setAtendimentos] = useState([]);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null);
  const [paginacao, setPaginacao] = useState({ pageNumber: 1, totalPages: 0, totalItems: 0 });
  const [agora, setAgora] = useState(Date.now());
  const [emAtendimento, setEmAtendimento] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [salvandoAcao, setSalvandoAcao] = useState(false);
  const [chamandoSenha, setChamandoSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const carregarAtendimentos = useCallback(async (page = 1, guicheAlvo = 1) => {
    setCarregando(true);
    setErro('');
    try {
      const respostaInicial = await atendimentoService.listarPorGuiche(guicheAlvo, 1, PAGE_SIZE);
      const primeirosRegistros = respostaInicial?.Data || respostaInicial?.data || respostaInicial?.Atendimentos || respostaInicial?.atendimentos || [];
      const metadados = respostaInicial?.Pagination || respostaInicial?.pagination;
      const totalItemsApi = Number(metadados?.TotalItems ?? metadados?.totalItems ?? primeirosRegistros.length) || 0;
      let todosRegistros = Array.isArray(primeirosRegistros) ? primeirosRegistros : [];

      if (totalItemsApi > todosRegistros.length) {
        const respostaCompleta = await atendimentoService.listarPorGuiche(guicheAlvo, 1, totalItemsApi);
        const registrosCompletos = respostaCompleta?.Data || respostaCompleta?.data || respostaCompleta?.Atendimentos || respostaCompleta?.atendimentos || [];
        if (Array.isArray(registrosCompletos) && registrosCompletos.length) todosRegistros = registrosCompletos;
      }

      const listaOrdenada = ordenarAtendimentos(todosRegistros);
      const totalItems = listaOrdenada.length;
      const totalPagesCalculado = Math.ceil(totalItems / PAGE_SIZE);
      const paginaSolicitada = Math.min(Math.max(1, page), Math.max(1, totalPagesCalculado));
      setAtendimentos(listaOrdenada);
      setPaginacao({
        pageNumber: paginaSolicitada,
        totalPages: totalPagesCalculado,
        totalItems
      });
      const primeiroPendente = listaOrdenada.find(podeSelecionar) ?? null;
      setAtendimentoSelecionado(primeiroPendente);
      setEmAtendimento(false);
      setGuicheConsultado(guicheAlvo);
      return listaOrdenada;
    } catch (requestError) {
      setErro(requestError.message || 'Não foi possível carregar os chamados deste guichê.');
      setAtendimentos([]);
      setAtendimentoSelecionado(null);
      return [];
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarAtendimentos(1, 1);
  }, [carregarAtendimentos]);

  useEffect(() => {
    const chamadoAguardando = atendimentoSelecionado
      && podeSelecionar(atendimentoSelecionado)
      && obterCriado(atendimentoSelecionado);
    if (!emAtendimento && !chamadoAguardando) return undefined;
    setAgora(Date.now());
    const intervalo = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(intervalo);
  }, [emAtendimento, atendimentoSelecionado]);

  const selecionarAtendimento = (atendimento) => {
    if (!atendimento || !podeSelecionar(atendimento)) return;
    setAtendimentoSelecionado(atendimento);
    setEmAtendimento(false);
  };

  const consultarGuiche = (event) => {
    event.preventDefault();
    const valor = Number(guiche);
    if (!Number.isInteger(valor) || valor <= 0) {
      setErro('Informe um número de guichê maior que zero.');
      return;
    }
    setAtendimentoSelecionado(null);
    carregarAtendimentos(1, valor);
  };

  const avancarChamado = async () => {
    if (!atendimentoSelecionado) return;
    const indiceAtual = atendimentos.findIndex((item) => obterIdentificador(item) === obterIdentificador(atendimentoSelecionado));
    const pendentes = atendimentos
      .map((item, indice) => ({ item, indice }))
      .filter(({ item }) => podeSelecionar(item) && obterIdentificador(item) !== obterIdentificador(atendimentoSelecionado));
    const proximo = pendentes.find(({ indice }) => indice > indiceAtual) ?? pendentes[0];
    if (!proximo) {
      setErro('Não há chamados pendentes após este atendimento.');
      return;
    }
    selecionarAtendimento(proximo.item);
    setPaginacao((atual) => ({ ...atual, pageNumber: Math.floor(proximo.indice / PAGE_SIZE) + 1 }));
  };

  const chamarSenhaSelecionada = async () => {
    if (!atendimentoSelecionado || !podeSelecionar(atendimentoSelecionado) || chamandoSenha || salvandoAcao) return;
    const payload = {
      Prefixo: obterPrefixo(atendimentoSelecionado),
      NumeroAtual: obterNumero(atendimentoSelecionado),
      GuicheAtual: guicheConsultado,
      Prioridade: atendimentoSelecionado.prioridade ?? atendimentoSelecionado.Prioridade ?? 'Normal',
      Status: atendimentoSelecionado.status ?? atendimentoSelecionado.Status ?? 'pendente',
      NomeCliente: atendimentoSelecionado.nomeCliente ?? atendimentoSelecionado.NomeCliente ?? '',
      Observacao: atendimentoSelecionado.observacao ?? atendimentoSelecionado.Observacao ?? ''
    };

    setChamandoSenha(true);
    setErro('');
    setSucesso('');
    try {
      const resposta = await atendimentoService.chamar(payload);
      setSucesso(resposta?.mensagem ?? resposta?.Mensagem ?? 'Senha enviada ao monitor.');
    } catch (requestError) {
      setErro(requestError.message || 'Não foi possível chamar a senha no monitor.');
    } finally {
      setChamandoSenha(false);
    }
  };

  const executarAcao = async (acao) => {
    const podeExecutar = acao === 'cancelar'
      ? podeSelecionar(atendimentoSelecionado) || emAtendimento
      : acao === 'finalizar'
        ? emAtendimento
        : podeSelecionar(atendimentoSelecionado);
    if (!atendimentoSelecionado || !podeExecutar || salvandoAcao) return;
    const payload = {
      Prefixo: obterPrefixo(atendimentoSelecionado),
      NumeroAtual: obterNumero(atendimentoSelecionado),
      GuicheAtual: guicheConsultado
    };
    if (acao === 'finalizar') payload.Observacao = atendimentoSelecionado.observacao ?? atendimentoSelecionado.Observacao ?? null;

    setSalvandoAcao(true);
    setErro('');
    setSucesso('');
    try {
      const buscarAtendimentoPersistido = async () => {
        try {
          const respostaFila = await atendimentoService.listarPorGuiche(guicheConsultado, 1, Math.max(paginacao.totalItems, PAGE_SIZE));
          const registros = respostaFila?.Data || respostaFila?.data || respostaFila?.Atendimentos || respostaFila?.atendimentos || [];
          return registros.find((item) =>
            obterPrefixo(item) === obterPrefixo(atendimentoSelecionado)
            && obterNumero(item) === obterNumero(atendimentoSelecionado)
          ) ?? null;
        } catch {
          return null;
        }
      };

      if (acao === 'iniciar') {
        const resposta = await atendimentoService.iniciar(payload);
        let atualizado = resposta?.atendimento ?? resposta?.Atendimento;
        if (!obterInicio(atualizado ?? {})) atualizado = await buscarAtendimentoPersistido() ?? atualizado;
        const chave = obterIdentificador(atendimentoSelecionado);
        const inicioAtendimento = obterInicio(atualizado ?? {}) ?? new Date().toISOString();
        const registroAtualizado = {
          ...atendimentoSelecionado,
          ...(atualizado ?? {}),
          status: atualizado?.status ?? atualizado?.Status ?? 'em-atendimento',
          dataInicioAtendimento: inicioAtendimento,
          dataFinalizacaoAtendimento: obterFim(atualizado ?? {}) ?? obterFim(atendimentoSelecionado)
        };
        const listaAtualizada = ordenarAtendimentos(atendimentos.map((item) =>
          obterIdentificador(item) === chave ? registroAtualizado : item
        ));
        setAtendimentos(listaAtualizada);
        setAtendimentoSelecionado(registroAtualizado);
        setEmAtendimento(true);
        const indiceAtualizado = listaAtualizada.findIndex((item) => obterIdentificador(item) === chave);
        setPaginacao((atual) => ({ ...atual, pageNumber: Math.floor(indiceAtualizado / PAGE_SIZE) + 1 }));
        return;
      }

      const chamada = acao === 'finalizar' ? atendimentoService.finalizar : atendimentoService.cancelar;
      const resposta = await chamada(payload);
      let atualizado = resposta?.atendimento ?? resposta?.Atendimento;
      if (!obterFim(atualizado ?? {})) atualizado = await buscarAtendimentoPersistido() ?? atualizado;
      const statusFinal = acao === 'finalizar' ? 'finalizado' : 'cancelado';
      const chave = obterIdentificador(atendimentoSelecionado);
      const registroAtualizado = {
        ...atendimentoSelecionado,
        ...(atualizado ?? {}),
        status: atualizado?.status ?? atualizado?.Status ?? statusFinal,
        dataInicioAtendimento: obterInicio(atualizado ?? {}) ?? obterInicio(atendimentoSelecionado),
        dataFinalizacaoAtendimento: obterFim(atualizado ?? {}) ?? obterFim(atendimentoSelecionado)
      };
      const listaAtualizada = ordenarAtendimentos(atendimentos.map((item) =>
        obterIdentificador(item) === chave ? registroAtualizado : item
      ));
      setAtendimentos(listaAtualizada);
      setEmAtendimento(false);
      const proximo = listaAtualizada.find(podeSelecionar) ?? null;
      setAtendimentoSelecionado(proximo);
      if (proximo) {
        const indiceProximo = listaAtualizada.findIndex((item) => obterIdentificador(item) === obterIdentificador(proximo));
        setPaginacao((atual) => ({ ...atual, pageNumber: Math.floor(indiceProximo / PAGE_SIZE) + 1 }));
      } else {
        setErro('Ação concluída. Não há outros chamados pendentes nesta fila.');
      }
    } catch (requestError) {
      setErro(requestError.message || `Não foi possível ${acao} o atendimento.`);
    } finally {
      setSalvandoAcao(false);
    }
  };

  const atendimentoNumero = atendimentoSelecionado ? obterNumero(atendimentoSelecionado) : null;
  const atendimentoPrefixo = atendimentoSelecionado ? obterPrefixo(atendimentoSelecionado) : '';
  const statusSelecionado = atendimentoSelecionado ? obterStatus(atendimentoSelecionado) : '';
  const nomeSolicitante = atendimentoSelecionado?.nomeSolicitante
    ?? atendimentoSelecionado?.NomeSolicitante
    ?? atendimentoSelecionado?.nome
    ?? atendimentoSelecionado?.Nome;
  const tempoSelecionado = atendimentoSelecionado
    ? obterTempoRegistrado(atendimentoSelecionado, agora)
    : null;
  const esperasRegistradas = atendimentos
    .filter((atendimento) => !podeSelecionar(atendimento))
    .map((atendimento) => obterTempoEspera(atendimento))
    .filter((tempo) => tempo !== null);
  const esperaMedia = esperasRegistradas.length
    ? Math.round(esperasRegistradas.reduce((total, tempo) => total + tempo, 0) / esperasRegistradas.length)
    : null;
  const filaPendente = atendimentos.filter(podeSelecionar);
  const indiceNaFilaPendente = atendimentoSelecionado && podeSelecionar(atendimentoSelecionado)
    ? filaPendente.findIndex((item) => obterIdentificador(item) === obterIdentificador(atendimentoSelecionado))
    : -1;
  const inicioPagina = (paginacao.pageNumber - 1) * PAGE_SIZE;
  const atendimentosPagina = atendimentos.slice(inicioPagina, inicioPagina + PAGE_SIZE);

  const mudarPagina = (pagina) => {
    setPaginacao((atual) => ({ ...atual, pageNumber: pagina }));
    setAtendimentoSelecionado(null);
  };

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Central de atendimento</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Fila do guichê</h1>
        </div>
        <form onSubmit={consultarGuiche} className="flex items-end gap-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">Guichê</span>
            <input
              type="number"
              min="1"
              value={guiche}
              onChange={(event) => setGuiche(event.target.value)}
              disabled={emAtendimento}
              className="h-10 w-28 rounded border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              aria-label="Número do guichê"
            />
          </label>
          <button
            type="submit"
            disabled={carregando || emAtendimento}
            className="flex h-10 items-center gap-2 rounded bg-[#2d353c] px-4 text-sm font-semibold text-white transition hover:bg-[#242a30] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={15} />}
            Consultar
          </button>
        </form>
      </div>

      {erro && (
        <div role="alert" className="flex items-center justify-between gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{erro}</span>
          <button type="button" onClick={() => setErro('')} className="font-semibold hover:text-red-900">Fechar</button>
        </div>
      )}
      {sucesso && (
        <div role="status" className="flex items-center justify-between gap-3 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>{sucesso}</span>
          <button type="button" onClick={() => setSucesso('')} className="font-semibold hover:text-emerald-950">Fechar</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <section className="overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-gray-900">Chamado selecionado</h2>
              <p className="mt-0.5 text-xs text-gray-500">Guichê {guicheConsultado}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <Headset size={15} />
              {atendimentoSelecionado ? rotuloStatus(statusSelecionado) : 'Sem seleção'}
            </span>
          </div>

          <div className="flex min-h-64 flex-col items-center justify-center px-5 py-8 text-center">
            {atendimentoSelecionado ? (
              <>
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Senha chamada</span>
                <div className="mt-2 flex items-baseline gap-2 text-[#2d353c]">
                  {atendimentoPrefixo && <span className="text-3xl font-semibold">{atendimentoPrefixo}</span>}
                  <span className="text-7xl font-black tabular-nums">{String(atendimentoNumero).padStart(3, '0')}</span>
                </div>
                {nomeSolicitante && <p className="mt-3 text-base font-medium text-gray-700">{nomeSolicitante}</p>}
                {indiceNaFilaPendente >= 0 && (
                  <div className="mt-4 rounded border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
                    <span className="font-semibold">Posição {indiceNaFilaPendente + 1}</span>
                    <span className="text-amber-800"> de {filaPendente.length} pendentes</span>
                    <span className="mx-2 text-amber-500" aria-hidden="true">·</span>
                    <span>{indiceNaFilaPendente} {indiceNaFilaPendente === 1 ? 'chamado' : 'chamados'} à frente</span>
                  </div>
                )}
                <div className="mt-4 w-full max-w-sm border border-gray-200 bg-gray-50 px-3 py-2 text-center">
                  <p className="text-[10px] font-semibold uppercase text-gray-500">Espera média do guichê</p>
                  <p className="mt-1 font-mono text-lg font-bold tabular-nums text-gray-800">
                    {esperaMedia === null ? '--:--:--' : formatarTempo(esperaMedia)}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {esperasRegistradas.length} chamado(s) não pendente(s) com horários registrados
                  </p>
                </div>
                <div className="mt-5 inline-flex items-center gap-2 rounded bg-gray-100 px-4 py-2 font-mono text-2xl font-semibold tabular-nums text-gray-800">
                  <Clock3 size={20} className="text-blue-600" />
                  {tempoSelecionado === null ? '--:--:--' : formatarTempo(tempoSelecionado)}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-gray-500">
                <TicketCheck size={34} strokeWidth={1.5} />
                <p className="mt-3 font-medium">{carregando ? 'Carregando fila...' : 'Nenhum chamado selecionado'}</p>
                <p className="mt-1 text-sm">Escolha um chamado na fila ao lado.</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4">
            <button
              type="button"
              onClick={chamarSenhaSelecionada}
              disabled={!atendimentoSelecionado || !podeSelecionar(atendimentoSelecionado) || emAtendimento || chamandoSenha || salvandoAcao}
              className="inline-flex h-10 items-center gap-2 rounded border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {chamandoSenha ? <LoaderCircle size={16} className="animate-spin" /> : <Megaphone size={16} />}
              {chamandoSenha ? 'Chamando...' : 'Chamar senha'}
            </button>
            <button
              type="button"
              onClick={() => executarAcao('iniciar')}
              disabled={!atendimentoSelecionado || !podeSelecionar(atendimentoSelecionado) || emAtendimento || salvandoAcao}
              className="inline-flex h-10 items-center gap-2 rounded bg-[#85ce36] px-4 text-sm font-semibold text-[#17210c] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CirclePlay size={17} /> {salvandoAcao ? 'Processando...' : 'Iniciar atendimento'}
            </button>
            <button
              type="button"
              onClick={() => executarAcao('finalizar')}
              disabled={!atendimentoSelecionado || !emAtendimento || salvandoAcao}
              className="inline-flex h-10 items-center gap-2 rounded border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={17} /> Finalizar
            </button>
            <button
              type="button"
              onClick={() => executarAcao('cancelar')}
              disabled={!atendimentoSelecionado || !(podeSelecionar(atendimentoSelecionado) || emAtendimento) || salvandoAcao}
              className="inline-flex h-10 items-center gap-2 rounded border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Ban size={16} /> Cancelar
            </button>
            <button
              type="button"
              onClick={avancarChamado}
              disabled={!atendimentos.some(podeSelecionar) || carregando || salvandoAcao || emAtendimento}
              className="inline-flex h-10 items-center gap-2 rounded bg-[#2d353c] px-4 text-sm font-semibold text-white transition hover:bg-[#242a30] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Próximo <ChevronRight size={17} />
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-gray-900">Fila de chamados</h2>
              <p className="mt-0.5 text-xs text-gray-500">{paginacao.totalItems} chamado(s) no guichê</p>
            </div>
            <span className="text-xs font-medium text-gray-500">Página {paginacao.pageNumber} de {paginacao.totalPages || 0}</span>
          </div>

          <div className="max-h-[390px] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2 text-[10px] font-semibold uppercase text-gray-500">
              <span className="w-8 text-center" title="Posição na fila ordenada">Pos.</span>
              <span className="w-12 text-right">Senha</span>
              <span className="min-w-0 flex-1">Cliente</span>
              <span className="w-24 text-center">Status</span>
              <span className="w-[76px] text-right">Tempo</span>
            </div>
            {atendimentosPagina.length ? atendimentosPagina.map((atendimento, indicePagina) => {
              const indiceAbsoluto = inicioPagina + indicePagina;
              const selecionado = atendimentoSelecionado
                && obterIdentificador(atendimento) === obterIdentificador(atendimentoSelecionado);
              const status = obterStatus(atendimento);
              const elegivel = podeSelecionar(atendimento);
              const jaAtendido = !elegivel;
              const tempoRegistrado = obterTempoRegistrado(atendimento, agora);
              return (
                <button
                  type="button"
                  key={obterIdentificador(atendimento) ?? `${obterPrefixo(atendimento)}-${obterNumero(atendimento)}-${indiceAbsoluto}`}
                  onClick={() => selecionarAtendimento(atendimento)}
                  disabled={!elegivel || emAtendimento}
                  title={elegivel ? 'Selecionar chamado pendente' : 'Este chamado já recebeu uma ação do operador'}
                  className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition ${selecionado ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : jaAtendido ? 'bg-gray-100' : 'bg-white'} ${elegivel ? 'hover:bg-blue-50' : 'cursor-not-allowed'}`}
                >
                  <span className="w-8 shrink-0 text-center font-mono text-xs tabular-nums text-gray-500" title="Posição na fila ordenada">
                    {indiceAbsoluto + 1}
                  </span>
                  <span className={`w-12 text-right font-mono text-sm font-bold tabular-nums ${selecionado ? 'text-blue-700' : 'text-gray-700'}`}>
                    {obterPrefixo(atendimento)}{String(obterNumero(atendimento)).padStart(3, '0')}
                  </span>
                  <span className={`min-w-0 flex-1 truncate text-sm ${jaAtendido ? 'font-medium text-gray-700' : 'text-gray-600'}`}>
                    {atendimento.nomeCliente ?? atendimento.NomeCliente ?? atendimento.nomeSolicitante ?? atendimento.NomeSolicitante ?? atendimento.nome ?? atendimento.Nome ?? 'Chamado'}
                  </span>
                  <span className={`shrink-0 rounded px-2 py-1 text-[11px] font-semibold ${classesStatus(status)}`}>
                    {rotuloStatus(status)}
                  </span>
                  <span className="w-[76px] shrink-0 text-right font-mono text-xs tabular-nums text-gray-500">
                    {tempoRegistrado === null ? '--:--:--' : formatarTempo(tempoRegistrado)}
                  </span>
                  {selecionado && <span className="text-xs font-semibold text-blue-700">Selecionado</span>}
                </button>
              );
            }) : (
              <p className="px-5 py-10 text-center text-sm text-gray-500">
                {carregando ? 'Buscando chamados...' : 'Não há chamados para este guichê.'}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <button
              type="button"
              onClick={() => mudarPagina(paginacao.pageNumber - 1)}
              disabled={carregando || emAtendimento || paginacao.pageNumber <= 1}
              className="inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} /> Anterior
            </button>
            <button
              type="button"
              onClick={() => mudarPagina(paginacao.pageNumber + 1)}
              disabled={carregando || emAtendimento || paginacao.pageNumber >= paginacao.totalPages}
              className="inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima página <ChevronRight size={15} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}