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

export const getMe = () =>
  client.get('/socios/me');

export const updateMe = (id, data) =>
  client.put(`/socios/${id}`, data);

export const getComprasSemanales = (params) =>
  client.get('/ventas/estadisticas/compras_semanales', { params });

export const getComprasPorCategoria = (params) =>
  client.get('/ventas/estadisticas/compras_por_categoria', { params });

export const getVentas = (socioId) =>
  client.get('/ventas/', { params: { socio_id: socioId } });

export const getVenta = (ventaId) =>
  client.get(`/ventas/${ventaId}`);

export const getVentaDetail = (ventaId) =>
  client.get(`/ventas/${ventaId}/detail`);

export const buscarPorDni = (dni) =>
  client.get('/socios/', { params: { dni } });

export const buscarPorNombre = (nombre) =>
  client.get('/socios/', { params: { name: nombre.normalize('NFD').replace(/[̀-ͯ]/g, '') } });

export const registrarVenta = (data) =>
  client.post('/ventas/', data);
