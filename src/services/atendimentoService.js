import { apiClient } from './apiClient';

const atendimentoService = {
  listar: ({ guicheAtual, dataInicio, dataFim, page = 1, pageSize = 10 } = {}) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (guicheAtual !== undefined && guicheAtual !== null) params.set('guicheAtual', String(guicheAtual));
    if (dataInicio) params.set('dataInicio', dataInicio);
    if (dataFim) params.set('dataFim', dataFim);
    return apiClient.get(`/atendimento?${params.toString()}`);
  },
  listarPorGuiche: (guiche, page = 1, pageSize = 10) =>
    apiClient.get(`/atendimento/guiche/${guiche}?page=${page}&pageSize=${pageSize}`),
  chamar: (senha) => apiClient.post('/atendimento/chamar', senha),
  iniciar: (atendimento) => apiClient.post('/atendimento/iniciar', atendimento),
  finalizar: (atendimento) => apiClient.post('/atendimento/finalizar', atendimento),
  cancelar: (atendimento) => apiClient.post('/atendimento/cancelar', atendimento)
};

export default atendimentoService;