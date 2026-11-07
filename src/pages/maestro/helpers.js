import { z } from 'zod';

export const fmtCurrency = (v) =>
  v == null || v === ''
    ? '—'
    : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);

export const fmtDate = (v) => {
  if (!v) return '—';
  const d = v.length === 10 ? new Date(`${v}T12:00:00`) : new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-AR');
};

// YYYY-MM-DD en hora local
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// 'YYYY-MM-DD' → Date a medianoche LOCAL (new Date('YYYY-MM-DD') la interpreta en UTC)
export const parseLocalDate = (v) => (v && String(v).length === 10 ? new Date(`${v}T00:00:00`) : new Date(v));

// Fecha ISO (o YYYY-MM-DD) → YYYY-MM-DD para inputs type="date"
export const toDateInput = (v) => (v ? String(v).slice(0, 10) : '');

export const toList = (data) => (Array.isArray(data) ? data : data?.items ?? []);

// Misma fórmula que el backend: floor(monto / monto_por_punto × multiplicador), con tope.
export const calcPoints = (monto, rule) => {
  const m = Number(monto);
  const mpp = Number(rule?.monto_por_punto);
  if (!m || !mpp || m <= 0 || mpp <= 0) return 0;
  const pts = Math.floor((m / mpp) * Number(rule.multiplicador ?? 1));
  return rule.tope_por_compra ? Math.min(pts, Number(rule.tope_por_compra)) : pts;
};

const emptyToNull = (v) => (v === '' || v == null || Number.isNaN(v) ? null : Number(v));

export const requiredNumber = (msg = 'Requerido') =>
  z.preprocess(emptyToNull, z.number({ error: msg }));

export const optionalPositiveInt = (msg = 'Debe ser un entero mayor a 0') =>
  z.preprocess(emptyToNull, z.number().int(msg).positive(msg).nullable());

export const optionalPositiveNumber = (msg = 'Debe ser mayor a 0') =>
  z.preprocess(emptyToNull, z.number().positive(msg).nullable());
