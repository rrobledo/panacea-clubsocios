import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(config => {
  try {
    const stored = localStorage.getItem('panacea_auth');
    if (stored) {
      const { access_token } = JSON.parse(stored);
      if (access_token) config.headers.Authorization = `Bearer ${access_token}`;
    }
  } catch {}
  return config;
});

client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('panacea_auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const getCredits = () =>
  client.get('/recompensas/creditos');

export const getRewardMachine = () =>
  client.get('/recompensas/maquina');

export const playRewardMachine = () =>
  client.post('/recompensas/maquina/jugar');

export const getCoupons = () =>
  client.get('/recompensas/cupones');

export const getPromotions = () =>
  client.get('/recompensas/promociones');

export const getActivity = () =>
  client.get('/recompensas/actividad');
