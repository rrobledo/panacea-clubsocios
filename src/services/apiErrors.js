// Extrae el código de error de negocio de una respuesta del backend.
// Soporta { code }, { detail: { code } } y { detail: "CODE" } (estilo FastAPI).
export const getErrorCode = (err) => {
  const data = err?.response?.data;
  if (!data) return null;
  if (typeof data.code === 'string') return data.code;
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.detail?.code === 'string') return data.detail.code;
  return null;
};

export const getErrorMessage = (err, messages = {}, fallback = 'Ocurrió un error. Intentá nuevamente.') => {
  const code = getErrorCode(err);
  if (code && messages[code]) return messages[code];
  if (err?.response?.status === 403) return 'No tenés permisos para realizar esta acción.';
  return fallback;
};
