import axios from 'axios';

export const client = axios.create({
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

// Saldo de puntos. Acepta temporalmente la forma anterior ({ current, nextReward })
// mientras el backend migra al nuevo contrato ({ saldo, por_vencer, proxima_recompensa }).
const normalizeCredits = (data = {}) => ({
  saldo: data.saldo ?? data.current ?? 0,
  por_vencer: data.por_vencer ?? null,
  proxima_recompensa: data.proxima_recompensa ?? data.nextReward ?? null,
});

export const getCredits = () =>
  client.get('/recompensas/creditos')
    .then(res => ({ ...res, data: normalizeCredits(res.data) }));

export const getRewardMachine = () =>
  client.get('/recompensas/maquina');

export const playRewardMachine = () =>
  client.post('/recompensas/maquina/jugar');

export const getCoupons = () =>
  client.get('/recompensas/cupones');

export const getPromotions = () =>
  client.get('/recompensas/promociones');

export const getActivity = (params) =>
  client.get('/recompensas/actividad', { params });

export const getCurrentRule = () =>
  client.get('/recompensas/regla-vigente');

export const getBenefits = () =>
  client.get('/recompensas/beneficios');

export const redeemBenefit = (id) =>
  client.post(`/recompensas/beneficios/${id}/canjear`);
