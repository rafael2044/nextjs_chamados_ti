// lib/api.ts
import axios from 'axios';
import Cookies from 'js-cookie';

// 1. Crie a instância do Axios
const api = axios.create({
  // Defina a URL base da sua API
  baseURL: process.env.NEXT_PUBLIC_API_URL, // Ex: 'http://localhost:8000/api/v1'
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Crie um Interceptor de Requisição (Request Interceptor)
// Este interceptor é executado ANTES de cada requisição.
api.interceptors.request.use(
  (config) => {
    // Pegue o token dos cookies
    const token = Cookies.get('jwt_token');

    // Se o token existir, anexe-o ao cabeçalho Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config; // Retorne a configuração modificada
  },
  (error) => {
    // Em caso de erro na configuração da requisição
    return Promise.reject(error);
  }
);

// 3. Crie um Interceptor de Resposta (Response Interceptor)
// Este interceptor é executado DEPOIS de cada resposta.
api.interceptors.response.use(
  (response) => {
    // Se a resposta for bem-sucedida (status 2xx), apenas a retorne
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Se o erro NÃO for 401 ou se já tentamos renovar, rejeita
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Tenta pegar o refresh token
    const refreshToken = Cookies.get('refresh_token'); // CORREÇÃO: Usando Cookies

    // Caso 1: 401, mas SEM refresh token (desloga o usuário)
    if (!refreshToken) {
      console.error("401 sem refresh token. Deslogando.");
      Cookies.remove('jwt_token');
      Cookies.remove('refresh_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Caso 2: 401, COM refresh token (tenta renovar)
    originalRequest._retry = true; // Marca que já tentamos

    try {
      // Envia o refresh token para a rota de renovação
      // Usamos a 'api' pois ela já tem o baseURL
      const res = await api.post('/refresh', { refresh_token: refreshToken });

      const { access_token } = res.data;

      // ATUALIZA O COOKIE (em vez de localStorage)
      Cookies.set('jwt_token', access_token, { expires: 7, secure: true, sameSite: 'strict' });
      
      // Atualiza o header da requisição original que falhou
      originalRequest.headers.Authorization = `Bearer ${access_token}`;

      // Reenvia a requisição original com o novo token
      return api(originalRequest);

    } catch (refreshError) {
      // Caso 3: O refresh token falhou (ex: 401 no /refresh)
      // O refresh token é inválido ou expirou. Desloga o usuário.
      console.error("Falha ao renovar token. Deslogando.", refreshError);
      
      // LIMPA OS COOKIES (em vez de localStorage)
      Cookies.remove('jwt_token');
      Cookies.remove('refresh_token');
      window.location.href = '/login';
      
      return Promise.reject(refreshError);
    }
  }
);
// 4. Exporte a instância
export default api;