import { client } from './rewardsApi';

// Endpoints de administración ("Maestro"). El backend valida el rol (403 si no es admin).

export const getAdminBenefits = () =>
  client.get('/admin/beneficios');

export const createBenefit = (data) =>
  client.post('/admin/beneficios', data);

export const updateBenefit = (id, data) =>
  client.put(`/admin/beneficios/${id}`, data);

export const getPointRules = () =>
  client.get('/admin/reglas-puntos');

export const createPointRule = (data) =>
  client.post('/admin/reglas-puntos', data);

// Solo reglas programadas a futuro; la regla anterior vuelve a quedar abierta.
export const deletePointRule = (id) =>
  client.delete(`/admin/reglas-puntos/${id}`);

export const getProgramConfig = () =>
  client.get('/admin/configuracion');

export const updateProgramConfig = (data) =>
  client.put('/admin/configuracion', data);

export const getSocioPoints = (socioId) =>
  client.get(`/admin/socios/${socioId}/puntos`);

export const createAdjustment = (data) =>
  client.post('/admin/ajustes-puntos', data);
