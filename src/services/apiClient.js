const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7000';

export const apiClient = {
  async request(endpoint, options = {}) {
    // 1. Pega o token JWT que salvamos no localStorage durante o Login
    const token = localStorage.getItem('token');

    // 2. Garante que o objeto de configurações e cabeçalhos exista
    options.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // 3. Se o token existir, injeta o Bearer automaticamente no cabeçalho da requisição
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    // 4. Executa a chamada HTTP
    const response = await fetch(`${API_URL}${endpoint}`, options);

    // 5. Trata a expiração do token (Erro 401 do C#)
    if (response.status === 401) {
      localStorage.removeItem('token'); 
      window.location.href = '/login';   
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    // 6. Se a resposta for vazia (ex: No Content 204), retorna sucesso
    if (response.status === 204) return null;

    // Tenta ler o JSON de forma segura (previne crash se o corpo vier vazio)
    const data = await response.json().catch(() => ({}));

    // 7. Se a requisição falhou (Status 400, 422, 500, etc.)
    if (!response.ok) {
      // Se a resposta contiver o dicionário de erros do FluentValidation do C#
      if (data.errors) {
        const errorObj = new Error(data.message || 'Erro de validação.');
        errorObj.validationErrors = data.errors; // Repassa o objeto de erros para o formulário
        throw errorObj;
      }
      throw new Error(data.message || 'Erro ao processar requisição na API.');
    }

    return data;
  },

  // Atalhos para facilitar a digitação no dia a dia
  get(endpoint, options) { return this.request(endpoint, { ...options, method: 'GET' }); },
  post(endpoint, body, options) { return this.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }); },
  put(endpoint, body, options) { return this.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }); },
  delete(endpoint, options) { return this.request(endpoint, { ...options, method: 'DELETE' }); }
};


export default apiClient;