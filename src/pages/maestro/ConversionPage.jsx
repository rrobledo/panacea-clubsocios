import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Calculator, AlertTriangle, Trash2 } from 'lucide-react';
import { differenceInCalendarDays } from 'date-fns';
import { DataGrid } from '../../components/grid/DataGrid';
import { Modal, Field, ErrorState, Skeleton, ConfirmDialog } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { getPointRules, createPointRule, deletePointRule } from '../../services/adminApi';
import { getErrorMessage } from '../../services/apiErrors';
import {
  fmtCurrency, fmtDate, todayISO, toList, calcPoints, parseLocalDate,
  requiredNumber, optionalPositiveInt,
} from './helpers';

const STALE_DAYS = 90;

const ruleStatus = (r, now = new Date()) => {
  const desde = parseLocalDate(r.vigente_desde);
  const hasta = r.vigente_hasta ? parseLocalDate(r.vigente_hasta) : null;
  if (desde > now) return 'PROGRAMADA';
  if (hasta && hasta <= now) return 'CERRADA';
  return 'VIGENTE';
};

const STATUS_BADGE = {
  VIGENTE:    { cls: 'success', label: 'Vigente' },
  PROGRAMADA: { cls: 'warning', label: 'Programada' },
  CERRADA:    { cls: 'gray',    label: 'Cerrada' },
};

const describeRule = (r) =>
  `${fmtCurrency(r.monto_por_punto)} = 1 punto${Number(r.multiplicador ?? 1) !== 1 ? ` · x${r.multiplicador}` : ''}`;

const schema = z.object({
  monto_por_punto: requiredNumber().pipe(z.number().positive('Debe ser mayor a 0')),
  multiplicador:   requiredNumber().pipe(z.number().positive('Debe ser mayor a 0').max(10, 'Máximo 10')),
  tope_por_compra: optionalPositiveInt(),
  vigente_desde:   z.string().min(1, 'Requerido').refine(v => v >= todayISO(), 'No puede ser anterior a hoy'),
  motivo:          z.string().trim().min(3, 'Indicá el motivo del cambio').max(200),
});

const NewRuleModal = ({ currentRule, onClose, onSaved }) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [sampleAmount, setSampleAmount] = useState(10000);
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      monto_por_punto: currentRule?.monto_por_punto ?? '',
      multiplicador: currentRule?.multiplicador ?? 1,
      tope_por_compra: currentRule?.tope_por_compra ?? '',
      vigente_desde: todayISO(),
      motivo: '',
    },
  });
  const draft = useWatch({ control });

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await createPointRule(values);
      toast.success('Nueva regla de conversión creada.');
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err, {
        VIGENCIA_RETROACTIVA: 'La fecha de inicio no puede ser anterior a hoy.',
        CONFLICTO_VIGENCIA: 'Ya hay una regla que empieza en esa fecha o después. Eliminá la regla programada primero.',
      }, 'No se pudo crear la regla.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Nueva regla de conversión"
      footer={<>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" form="rule-form" className="btn btn-primary" disabled={saving}>
          {saving ? 'Guardando…' : 'Crear regla'}
        </button>
      </>}
    >
      <form id="rule-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid-2">
          <Field label="Monto por punto ($)" required error={errors.monto_por_punto?.message} hint="Ej. 100 → cada $100 = 1 punto">
            <input type="number" min="0.01" step="0.01" className="form-input" {...register('monto_por_punto')} />
          </Field>
          <Field label="Multiplicador" required error={errors.multiplicador?.message}>
            <input type="number" min="0.1" step="0.1" className="form-input" {...register('multiplicador')} />
          </Field>
          <Field label="Tope de puntos por compra" error={errors.tope_por_compra?.message} hint="Vacío = sin tope">
            <input type="number" min="1" step="1" className="form-input" {...register('tope_por_compra')} />
          </Field>
          <Field label="Vigente desde" required error={errors.vigente_desde?.message}>
            <input type="date" min={todayISO()} className="form-input" {...register('vigente_desde')} />
          </Field>
          <Field label="Motivo" required error={errors.motivo?.message} span={2}>
            <input className="form-input" placeholder="Ej. Ajuste por inflación" {...register('motivo')} />
          </Field>
        </div>
      </form>

      <div className="card" style={{ marginTop: 16, background: 'var(--gray-50)' }}>
        <div className="card-body">
          <div className="flex items-center gap-2" style={{ fontWeight: 600, marginBottom: 12 }}>
            <Calculator size={16} /> Simulador
          </div>
          <Field label="Monto de compra de ejemplo ($)">
            <input
              type="number" min="0" className="form-input"
              value={sampleAmount}
              onChange={e => setSampleAmount(e.target.value)}
            />
          </Field>
          <div className="grid-2" style={{ marginTop: 8 }}>
            <div>
              <div className="form-hint">Con la regla vigente</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {currentRule ? `${calcPoints(sampleAmount, currentRule)} pts` : '—'}
              </div>
            </div>
            <div>
              <div className="form-hint">Con la nueva regla</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>
                {calcPoints(sampleAmount, draft)} pts
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export const ConversionPage = () => {
  const toast = useToast();
  const [deleting, setDeleting] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    getPointRules()
      .then(res => {
        const list = toList(res.data).slice().sort((a, b) => parseLocalDate(b.vigente_desde) - parseLocalDate(a.vigente_desde));
        setRules(list);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const current = useMemo(() => rules.find(r => ruleStatus(r) === 'VIGENTE') ?? null, [rules]);
  const scheduled = useMemo(() => rules.find(r => ruleStatus(r) === 'PROGRAMADA') ?? null, [rules]);
  const ageDays = current ? differenceInCalendarDays(new Date(), parseLocalDate(current.vigente_desde)) : 0;

  const confirmDelete = async () => {
    const rule = deleting;
    setDeleting(null);
    try {
      await deletePointRule(rule.id);
      toast.success('Regla programada eliminada.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, {
        REGLA_EN_USO: 'Solo se pueden eliminar reglas que todavía no empezaron.',
      }, 'No se pudo eliminar la regla.'));
    }
  };

  const columns = useMemo(() => [
    {
      id: 'estado', header: 'Estado', size: 110,
      cell: ({ row }) => {
        const s = STATUS_BADGE[ruleStatus(row.original)];
        return <span className={`badge badge-${s.cls}`}>{s.label}</span>;
      },
    },
    { accessorKey: 'monto_por_punto', header: 'Monto por punto', size: 140, cell: ({ getValue }) => fmtCurrency(getValue()) },
    { accessorKey: 'multiplicador', header: 'Multiplicador', size: 110, cell: ({ getValue }) => `x${getValue() ?? 1}` },
    { accessorKey: 'tope_por_compra', header: 'Tope', size: 90, cell: ({ getValue }) => getValue() ?? '—' },
    { accessorKey: 'vigente_desde', header: 'Desde', size: 110, cell: ({ getValue }) => fmtDate(getValue()) },
    { accessorKey: 'vigente_hasta', header: 'Hasta', size: 110, cell: ({ getValue }) => (getValue() ? fmtDate(getValue()) : '—') },
    { accessorKey: 'motivo', header: 'Motivo', size: 220 },
    { accessorKey: 'creado_por', header: 'Autor', size: 160, cell: ({ getValue }) => getValue() ?? '—' },
    {
      id: 'actions', header: '', size: 50,
      cell: ({ row }) => ruleStatus(row.original) === 'PROGRAMADA' && (
        <button className="btn btn-ghost btn-icon btn-sm" title="Eliminar regla programada" onClick={() => setDeleting(row.original)}>
          <Trash2 size={14} color="var(--danger)" />
        </button>
      ),
    },
  ], []);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Tabla de conversión</div>
          <div className="page-subtitle">Cuántos puntos genera cada compra. Los cambios aplican solo a compras futuras.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)} disabled={loading || error}>
          <Plus size={16} /> Nueva regla
        </button>
      </div>

      {error ? (
        <div className="card"><ErrorState message="No se pudo cargar la tabla de conversión." onRetry={() => { setLoading(true); load(); }} /></div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body">
              <div className="form-hint" style={{ marginBottom: 4 }}>Regla vigente</div>
              {loading ? (
                <Skeleton width={240} height={28} />
              ) : current ? (
                <>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{describeRule(current)}</div>
                  <div className="form-hint">
                    Desde {fmtDate(current.vigente_desde)} ({ageDays} días)
                    {current.tope_por_compra ? ` · tope ${current.tope_por_compra} pts por compra` : ''}
                  </div>
                  {ageDays > STALE_DAYS && (
                    <div className="alert alert-warning" style={{ marginTop: 12 }}>
                      <AlertTriangle size={16} /> La regla vigente tiene más de {STALE_DAYS} días. Revisá si corresponde ajustarla por inflación.
                    </div>
                  )}
                  {scheduled && (
                    <div className="alert alert-info" style={{ marginTop: 12 }}>
                      Programada: {describeRule(scheduled)} desde {fmtDate(scheduled.vigente_desde)}.
                    </div>
                  )}
                </>
              ) : (
                <div className="alert alert-warning">
                  <AlertTriangle size={16} /> No hay una regla vigente: las compras no están generando puntos.
                </div>
              )}
            </div>
          </div>

          <DataGrid
            title="Historial"
            columns={columns}
            data={rules}
            loading={loading}
            showExport={false}
            emptyText="Todavía no hay reglas cargadas."
          />
        </>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Eliminar regla programada"
        message={deleting ? `Se eliminará la regla ${describeRule(deleting)} programada para el ${fmtDate(deleting.vigente_desde)}. La regla vigente seguirá aplicando.` : ''}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />

      {creating && (
        <NewRuleModal
          currentRule={current}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); load(); }}
        />
      )}
    </div>
  );
};
