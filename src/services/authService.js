
import { apiClient } from './apiClient';
const API_URL = import.meta.env.VITE_API_URL;

export const authService = {
 
  // Altere apenas o método login dentro do authService:
  async login(email, senha) {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });

    if (response.status === 401) {
      throw new Error('E-mail ou senha incorretos.');
    }

    const data = await response.json();
    
    if (!response.ok) {
      // Se o backend C# enviou a estrutura do FluentValidation, lança o objeto completo
      if (data.errors) {
        const errorObj = new Error(data.message || 'Erro de validação.');
        errorObj.validationErrors = data.errors; // Guarda o dicionário de erros
        throw errorObj;
      }
      throw new Error(data.message || 'Erro ao realizar login.');
    }
    
    return data;
  },


    // 2. [POST] /login/esqueci-senha
  async esqueciSenha(email) {
    const response = await fetch(`${API_URL}/login/esqueci-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      if (data.errors) {
        const errorObj = new Error(data.message || 'Erro de validação.');
        errorObj.validationErrors = data.errors;
        throw errorObj;
      }
      throw new Error(data.message || 'Erro ao processar solicitação.');
    }
    return data;
  },

  // 3. [POST] /login/resetar-senha
  async resetarSenha(email, token, novaSenha) {
    const response = await fetch(`${API_URL}/login/resetar-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, novaSenha }),
    });

    const data = await response.json();
    if (!response.ok) {
      if (data.errors) {
        const errorObj = new Error(data.message || 'Erro de validação.');
        errorObj.validationErrors = data.errors;
        throw errorObj;
      }
      throw new Error(data.message || 'Erro ao redefinir a senha.');
    }
    return data;
  },

  // Cadastro Inicial do Usuario
  setupCadastro: async (payload) => {  
    console.log('[authService] Enviando payload para o setup de cadastro:', payload); 
    const resultado = await apiClient.post('/auth/setup-cadastro', payload);    
    return resultado;
  }

};
