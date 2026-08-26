import apiClient from './apiClient'; // Seu cliente Axios ou Fetch configurado

const nivelAcessoService = {
  getAll: async (page = 1, pageSize = 10) => {
    const response = await apiClient.get(`/niveis-acesso?page=${page}&pageSize=${pageSize}`);
    return response.data;
  },

  // Busca um nível de acesso específico por ID
  getById: async (id) => {
    const response = await apiClient.get(`/niveis-acesso/${id}`);
    return response.data;
  },

  // Cria um novo vínculo de permissão (Perfil + Rota)
  create: async (nivelAcessoData) => {
    const response = await apiClient.post('/niveis-acesso', nivelAcessoData);
    return response.data;
  },

  // Atualiza um vínculo existente
  update: async (id, nivelAcessoData) => {
    const response = await apiClient.put(`/niveis-acesso/${id}`, nivelAcessoData);
    return response.data;
  },

  // Remove uma permissão do catálogo
  delete: async (id) => {
    const response = await apiClient.delete(`/niveis-acesso/${id}`);
    return response.data;
  }
};

export default nivelAcessoService;
