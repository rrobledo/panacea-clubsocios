import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Save } from 'lucide-react';
import { Field, InlineLoader, EmptyState } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { buscarPorDni, buscarPorNombre } from '../../services/sociosApi';
import { getSocioPoints, createAdjustment } from '../../services/adminApi';
import { getErrorMessage } from '../../services/apiErrors';
import { requiredNumber } from './helpers';

const toSocioList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return data?.id ? [data] : [];
};

const schema = z.object({
  puntos: requiredNumber().pipe(z.number().int('Debe ser entero').refine(n => n !== 0, 'No puede ser 0')),
  motivo: z.string().trim().min(3, 'Indicá el motivo del ajuste').max(200),
});

const AdjustmentForm = ({ socio, saldo, onSaved }) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { puntos: '', motivo: '' },
  });

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await createAdjustment({ socio_id: socio.id, ...values });
      toast.success(`Ajuste de ${values.puntos > 0 ? '+' : ''}${values.puntos} puntos registrado.`);
      reset();
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err, {
        SALDO_INSUFICIENTE: 'El ajuste dejaría el saldo del socio en negativo.',
      }, 'No se pudo registrar el ajuste.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="card-header">
        <div>
          <h3 className="card-title">{socio.nombre_apellido || socio.email || `Socio #${socio.id}`}</h3>
          {socio.dni && <div className="form-hint">DNI {socio.dni}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="form-hint">Saldo actual</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{saldo ?? '—'} pts</div>
        </div>
      </div>
      <div className="card-body">
        <div className="grid-2">
          <Field label="Puntos" required error={errors.puntos?.message} hint="Positivo suma, negativo resta">
            <input type="number" step="1" className="form-input" {...register('puntos')} />
          </Field>
          <Field label="Motivo" required error={errors.motivo?.message}>
            <input className="form-input" placeholder="Ej. Compensación por reclamo" {...register('motivo')} />
          </Field>
        </div>
      </div>
      <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Save size={16} /> {saving ? 'Registrando…' : 'Registrar ajuste'}
        </button>
      </div>
    </form>
  );
};

export const AjustesPage = () => {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saldo, setSaldo] = useState(null);

  const loadSaldo = (socioId) => {
    setSaldo(null);
    getSocioPoints(socioId)
      .then(res => setSaldo(res.data?.saldo ?? 0))
      .catch(() => toast.error('No se pudo obtener el saldo del socio.'));
  };

  const search = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSelected(null);
    try {
      const res = /^\d+$/.test(q) ? await buscarPorDni(q) : await buscarPorNombre(q);
      setResults(toSocioList(res.data));
    } catch {
      toast.error('No se pudo buscar el socio.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const select = (socio) => {
    setSelected(socio);
    loadSaldo(socio.id);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Ajustes de puntos</div>
          <div className="page-subtitle">Sumá o restá puntos manualmente. Cada ajuste queda registrado con su motivo.</div>
        </div>
      </div>

      <form className="card" style={{ marginBottom: 20 }} onSubmit={search}>
        <div className="card-body flex items-center gap-2">
          <input
            className="form-input"
            placeholder="DNI o nombre del socio"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={searching || !query.trim()}>
            <Search size={16} /> Buscar
          </button>
        </div>
      </form>

      {searching && <InlineLoader text="Buscando…" />}

      {!searching && results && results.length === 0 && (
        <div className="card"><EmptyState icon={Search} title="No se encontraron socios" /></div>
      )}

      {!searching && results && results.length > 0 && !selected && (
        <div className="card">
          <div className="card-body">
            {results.map(s => (
              <button
                key={s.id}
                type="button"
                className="btn btn-ghost w-full"
                style={{ justifyContent: 'space-between' }}
                onClick={() => select(s)}
              >
                <span>{s.nombre_apellido || s.email || `Socio #${s.id}`}</span>
                {s.dni && <span className="form-hint">DNI {s.dni}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <>
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }} onClick={() => setSelected(null)}>
            ← Volver a los resultados
          </button>
          <AdjustmentForm socio={selected} saldo={saldo} onSaved={() => loadSaldo(selected.id)} />
        </>
      )}
    </div>
  );
};
