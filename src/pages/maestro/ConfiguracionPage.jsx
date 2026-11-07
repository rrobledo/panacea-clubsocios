import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import { Field, ErrorState, PageLoader } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { getProgramConfig, updateProgramConfig } from '../../services/adminApi';
import { getErrorMessage } from '../../services/apiErrors';
import { requiredNumber } from './helpers';

const schema = z.object({
  meses_expiracion_puntos: requiredNumber().pipe(z.number().int('Debe ser entero').min(0, 'No puede ser negativo')),
  costo_juego_maquina:     requiredNumber().pipe(z.number().int('Debe ser entero').min(0, 'No puede ser negativo')),
  programa_activo:         z.boolean(),
});

const ConfigForm = ({ initial, onSaved }) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      meses_expiracion_puntos: initial?.meses_expiracion_puntos ?? 12,
      costo_juego_maquina: initial?.costo_juego_maquina ?? 0,
      programa_activo: initial?.programa_activo ?? true,
    },
  });

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const res = await updateProgramConfig(values);
      toast.success('Configuración guardada.');
      onSaved(res.data ?? values);
    } catch (err) {
      toast.error(getErrorMessage(err, {}, 'No se pudo guardar la configuración.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="card-body">
        <div className="grid-2">
          <Field
            label="Meses de vigencia de los puntos" required
            error={errors.meses_expiracion_puntos?.message}
            hint="0 = los puntos no vencen"
          >
            <input type="number" min="0" step="1" className="form-input" {...register('meses_expiracion_puntos')} />
          </Field>
          <Field
            label="Costo de jugar la Máquina de Recompensas (puntos)" required
            error={errors.costo_juego_maquina?.message}
          >
            <input type="number" min="0" step="1" className="form-input" {...register('costo_juego_maquina')} />
          </Field>
          <Field span={2} hint="Si se desactiva, las compras no generan puntos y no se permiten canjes.">
            <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
              <input type="checkbox" {...register('programa_activo')} />
              <span>Programa de puntos activo</span>
            </label>
          </Field>
        </div>
      </div>
      <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-primary" disabled={saving || !isDirty}>
          <Save size={16} /> {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
};

export const ConfiguracionPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Remonta el formulario tras guardar para que los valores guardados pasen a ser los iniciales.
  const [version, setVersion] = useState(0);

  const load = useCallback(() => {
    getProgramConfig()
      .then(res => { setConfig(res.data); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Configuración del programa</div>
          <div className="page-subtitle">Parámetros generales del programa de puntos.</div>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <div className="card"><ErrorState message="No se pudo cargar la configuración." onRetry={() => { setLoading(true); load(); }} /></div>
      ) : (
        <ConfigForm
          key={version}
          initial={config}
          onSaved={(saved) => { setConfig(saved); setVersion(v => v + 1); }}
        />
      )}
    </div>
  );
};
