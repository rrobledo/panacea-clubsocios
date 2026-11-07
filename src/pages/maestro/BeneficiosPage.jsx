import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Power } from 'lucide-react';
import { DataGrid } from '../../components/grid/DataGrid';
import { Modal, ConfirmDialog, Field, ErrorState } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { getAdminBenefits, createBenefit, updateBenefit } from '../../services/adminApi';
import { getErrorMessage } from '../../services/apiErrors';
import {
  fmtCurrency, fmtDate, todayISO, toDateInput, toList,
  requiredNumber, optionalPositiveInt, optionalPositiveNumber,
} from './helpers';

const schema = z.object({
  nombre:               z.string().trim().min(1, 'Requerido').max(120),
  descripcion:          z.string().max(500).optional(),
  imagen_url:           z.string().url('URL inválida').optional().or(z.literal('')),
  costo_puntos:         requiredNumber().pipe(z.number().int('Debe ser entero').positive('Debe ser mayor a 0')),
  porcentaje_descuento: requiredNumber().pipe(z.number().gt(0, 'Debe ser mayor a 0').max(100, 'Máximo 100')),
  tope_descuento:       optionalPositiveNumber(),
  dias_validez_cupon:   requiredNumber().pipe(z.number().int('Debe ser entero').positive('Debe ser mayor a 0')),
  limite_por_socio:     optionalPositiveInt(),
  stock:                z.preprocess(v => (v === '' || v == null ? null : Number(v)), z.number().int('Debe ser entero').min(0, 'No puede ser negativo').nullable()),
  vigente_desde:        z.string().min(1, 'Requerido'),
  vigente_hasta:        z.string().optional(),
  activo:               z.boolean(),
}).refine(d => !d.vigente_hasta || d.vigente_hasta > d.vigente_desde, {
  message: 'Debe ser posterior a "Vigente desde"', path: ['vigente_hasta'],
});

const EMPTY = {
  nombre: '', descripcion: '', imagen_url: '',
  costo_puntos: '', porcentaje_descuento: '', tope_descuento: '',
  dias_validez_cupon: 30, limite_por_socio: '', stock: '',
  vigente_desde: todayISO(), vigente_hasta: '', activo: true,
};

const toFormValues = (b) => b ? {
  nombre: b.nombre ?? '',
  descripcion: b.descripcion ?? '',
  imagen_url: b.imagen_url ?? '',
  costo_puntos: b.costo_puntos ?? '',
  porcentaje_descuento: b.porcentaje_descuento ?? '',
  tope_descuento: b.tope_descuento ?? '',
  dias_validez_cupon: b.dias_validez_cupon ?? 30,
  limite_por_socio: b.limite_por_socio ?? '',
  stock: b.stock ?? '',
  vigente_desde: toDateInput(b.vigente_desde),
  vigente_hasta: toDateInput(b.vigente_hasta),
  activo: b.activo ?? true,
} : { ...EMPTY, vigente_desde: todayISO() };

const BenefitFormModal = ({ benefit, onClose, onSaved }) => {
  const toast = useToast();
  const isEdit = !!benefit?.id;
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(benefit),
  });

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      descripcion: values.descripcion || null,
      imagen_url: values.imagen_url || null,
      vigente_hasta: values.vigente_hasta || null,
    };
    setSaving(true);
    try {
      const res = isEdit ? await updateBenefit(benefit.id, payload) : await createBenefit(payload);
      toast.success(isEdit ? 'Beneficio actualizado.' : 'Beneficio creado.');
      onSaved(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, {
        VIGENCIA_INVALIDA: '"Vigente hasta" debe ser posterior a "Vigente desde".',
      }, 'No se pudo guardar el beneficio.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Editar beneficio' : 'Nuevo beneficio'}
      size="lg"
      footer={<>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" form="benefit-form" className="btn btn-primary" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </>}
    >
      <form id="benefit-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid-2">
          <Field label="Nombre" required error={errors.nombre?.message} span={2}>
            <input className="form-input" {...register('nombre')} placeholder="Ej. 15% en farmacia" />
          </Field>
          <Field label="Descripción" error={errors.descripcion?.message} span={2}>
            <textarea className="form-textarea" rows={2} {...register('descripcion')} />
          </Field>
          <Field label="URL de imagen" error={errors.imagen_url?.message} span={2}>
            <input className="form-input" {...register('imagen_url')} placeholder="https://…" />
          </Field>
          <Field label="Costo en puntos" required error={errors.costo_puntos?.message}>
            <input type="number" min="1" step="1" className="form-input" {...register('costo_puntos')} />
          </Field>
          <Field label="% de descuento" required error={errors.porcentaje_descuento?.message}>
            <input type="number" min="0.01" max="100" step="0.01" className="form-input" {...register('porcentaje_descuento')} />
          </Field>
          <Field label="Tope de descuento ($)" error={errors.tope_descuento?.message} hint="Vacío = sin tope">
            <input type="number" min="0" step="0.01" className="form-input" {...register('tope_descuento')} />
          </Field>
          <Field label="Días de validez del cupón" required error={errors.dias_validez_cupon?.message}>
            <input type="number" min="1" step="1" className="form-input" {...register('dias_validez_cupon')} />
          </Field>
          <Field label="Límite por socio" error={errors.limite_por_socio?.message} hint="Vacío = sin límite">
            <input type="number" min="1" step="1" className="form-input" {...register('limite_por_socio')} />
          </Field>
          <Field label="Stock" error={errors.stock?.message} hint="Vacío = ilimitado">
            <input type="number" min="0" step="1" className="form-input" {...register('stock')} />
          </Field>
          <Field label="Vigente desde" required error={errors.vigente_desde?.message}>
            <input type="date" className="form-input" {...register('vigente_desde')} />
          </Field>
          <Field label="Vigente hasta" error={errors.vigente_hasta?.message} hint="Vacío = sin vencimiento">
            <input type="date" className="form-input" {...register('vigente_hasta')} />
          </Field>
          <Field span={2}>
            <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
              <input type="checkbox" {...register('activo')} />
              <span>Activo (visible para los socios)</span>
            </label>
          </Field>
        </div>
      </form>
    </Modal>
  );
};

export const BeneficiosPage = () => {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(null);   // null = cerrado · {} = nuevo · beneficio = editar
  const [toggling, setToggling] = useState(null);

  const load = useCallback(() => {
    getAdminBenefits()
      .then(res => { setRows(toList(res.data)); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirmToggle = async () => {
    const b = toggling;
    setToggling(null);
    try {
      await updateBenefit(b.id, { activo: !b.activo });
      toast.success(b.activo ? 'Beneficio desactivado.' : 'Beneficio activado.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, {}, 'No se pudo actualizar el beneficio.'));
    }
  };

  const columns = useMemo(() => [
    { accessorKey: 'nombre', header: 'Nombre', size: 200 },
    { accessorKey: 'costo_puntos', header: 'Puntos', size: 90 },
    { accessorKey: 'porcentaje_descuento', header: '% Desc.', size: 90, cell: ({ getValue }) => `${getValue()}%` },
    { accessorKey: 'tope_descuento', header: 'Tope', size: 110, cell: ({ getValue }) => fmtCurrency(getValue()) },
    { accessorKey: 'stock', header: 'Stock', size: 80, cell: ({ getValue }) => getValue() ?? '∞' },
    {
      id: 'vigencia', header: 'Vigencia', size: 190,
      cell: ({ row }) => `${fmtDate(row.original.vigente_desde)} → ${row.original.vigente_hasta ? fmtDate(row.original.vigente_hasta) : 'sin fin'}`,
    },
    { accessorKey: 'canjes_realizados', header: 'Canjes', size: 80, cell: ({ getValue }) => getValue() ?? '—' },
    {
      accessorKey: 'activo', header: 'Estado', size: 100,
      cell: ({ getValue }) => (
        <span className={`badge badge-${getValue() ? 'success' : 'gray'}`}>{getValue() ? 'Activo' : 'Inactivo'}</span>
      ),
    },
    {
      id: 'actions', header: 'Acciones', size: 100,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost btn-icon btn-sm" title="Editar" onClick={() => setEditing(row.original)}>
            <Edit2 size={14} />
          </button>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            title={row.original.activo ? 'Desactivar' : 'Activar'}
            onClick={() => setToggling(row.original)}
          >
            <Power size={14} color={row.original.activo ? 'var(--danger)' : 'var(--success)'} />
          </button>
        </div>
      ),
    },
  ], []);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Beneficios</div>
          <div className="page-subtitle">Catálogo de descuentos que los socios pueden canjear con puntos.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}>
          <Plus size={16} /> Nuevo beneficio
        </button>
      </div>

      {error ? (
        <div className="card"><ErrorState message="No se pudieron cargar los beneficios." onRetry={() => { setLoading(true); load(); }} /></div>
      ) : (
        <DataGrid
          title="Catálogo"
          columns={columns}
          data={rows}
          loading={loading}
          emptyText="Todavía no hay beneficios cargados."
        />
      )}

      {editing && (
        <BenefitFormModal
          benefit={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      <ConfirmDialog
        open={!!toggling}
        variant={toggling?.activo ? 'danger' : 'primary'}
        title={toggling?.activo ? 'Desactivar beneficio' : 'Activar beneficio'}
        message={toggling?.activo
          ? `"${toggling?.nombre}" dejará de mostrarse a los socios. Los cupones ya emitidos siguen siendo válidos.`
          : `"${toggling?.nombre}" volverá a estar disponible para canjear.`}
        onConfirm={confirmToggle}
        onCancel={() => setToggling(null)}
      />
    </div>
  );
};
