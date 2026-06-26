import { useState, useEffect } from 'react';
import { User, Save, Lock, Eye, EyeOff } from 'lucide-react';
import { getMe, updateMe } from '../services/sociosApi';
import { useToast } from '../context/ToastContext';
import { PageLoader, Field } from '../components/ui';

const PasswordInput = ({ name, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="pw-wrap">
      <input
        name={name}
        type={show ? 'text' : 'password'}
        className="form-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="new-password"
      />
      <button type="button" className="pw-toggle" onClick={() => setShow(s => !s)} tabIndex={-1}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};

export const CuentaPage = () => {
  const toast = useToast();
  const [socio, setSocio] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Datos personales ──────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre_apellido: '',
    telefono: '',
    fecha_nacimiento: '',
  });

  // ── Cambio de contraseña ──────────────────────────────────────────────────
  const [savingPw, setSavingPw] = useState(false);
  const [pw, setPw] = useState({ nueva: '', confirmar: '' });
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    getMe()
      .then(res => {
        setSocio(res.data);
        setForm({
          nombre_apellido: res.data.nombre_apellido || '',
          telefono: res.data.telefono || '',
          fecha_nacimiento: res.data.fecha_nacimiento || '',
        });
      })
      .catch(() => toast.error('No se pudo cargar el perfil.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPw(p => ({ ...p, [name]: value }));
    setPwError('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateMe(socio.id, {
        nombre_apellido: form.nombre_apellido,
        telefono: form.telefono || null,
        fecha_nacimiento: form.fecha_nacimiento || null,
      });
      setSocio(res.data);
      toast.success('Perfil actualizado correctamente.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pw.nueva.length < 8) {
      setPwError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (pw.nueva !== pw.confirmar) {
      setPwError('Las contraseñas no coinciden.');
      return;
    }
    setSavingPw(true);
    try {
      await updateMe(socio.id, { password: pw.nueva });
      setPw({ nueva: '', confirmar: '' });
      toast.success('Contraseña actualizada correctamente.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al cambiar la contraseña.');
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Mi cuenta</div>
          <div className="page-subtitle">Consultá y actualizá tus datos personales.</div>
        </div>
      </div>

      {/* ── Datos personales ─────────────────────────────────────────────── */}
      <div className="card" style={{ maxWidth: 640, marginBottom: 24 }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <User size={18} />
          <span style={{ fontWeight: 600 }}>Datos personales</span>
        </div>
        <div className="card-body">
          <form onSubmit={handleProfileSubmit}>
            <div style={{ display: 'grid', gap: 20 }}>

              <Field label="Nombre y apellido" required>
                <input
                  name="nombre_apellido"
                  type="text"
                  className="form-input"
                  value={form.nombre_apellido}
                  onChange={handleChange}
                  required
                  placeholder="Juan Pérez"
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="DNI">
                  <input
                    type="text"
                    className="form-input"
                    value={socio?.dni || ''}
                    readOnly
                    style={{ background: 'var(--gray-50)', color: 'var(--gray-500)', cursor: 'not-allowed' }}
                  />
                </Field>
                <Field label="Fecha de nacimiento">
                  <input
                    name="fecha_nacimiento"
                    type="date"
                    className="form-input"
                    value={form.fecha_nacimiento}
                    onChange={handleChange}
                  />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Email">
                  <input
                    type="email"
                    className="form-input"
                    value={socio?.email || ''}
                    readOnly
                    style={{ background: 'var(--gray-50)', color: 'var(--gray-500)', cursor: 'not-allowed' }}
                  />
                </Field>
                <Field label="Teléfono">
                  <input
                    name="telefono"
                    type="tel"
                    className="form-input"
                    value={form.telefono}
                    onChange={handleChange}
                    placeholder="+54 9 11 1234-5678"
                  />
                </Field>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {saving
                    ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    : <Save size={15} />
                  }
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>

      {/* ── Cambiar contraseña ───────────────────────────────────────────── */}
      <div className="card" style={{ maxWidth: 640 }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Lock size={18} />
          <span style={{ fontWeight: 600 }}>Cambiar contraseña</span>
        </div>
        <div className="card-body">
          <form onSubmit={handlePasswordSubmit}>
            <div style={{ display: 'grid', gap: 20 }}>

              <Field label="Nueva contraseña" required error={pwError && pw.nueva.length > 0 && pw.nueva.length < 8 ? pwError : undefined}>
                <PasswordInput
                  name="nueva"
                  value={pw.nueva}
                  onChange={handlePwChange}
                  placeholder="Mínimo 8 caracteres"
                />
              </Field>

              <Field
                label="Confirmar contraseña"
                required
                error={pwError && pw.nueva.length >= 8 ? pwError : undefined}
              >
                <PasswordInput
                  name="confirmar"
                  value={pw.confirmar}
                  onChange={handlePwChange}
                  placeholder="Repetí la nueva contraseña"
                />
              </Field>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingPw || !pw.nueva || !pw.confirmar}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {savingPw
                    ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    : <Lock size={15} />
                  }
                  {savingPw ? 'Guardando…' : 'Cambiar contraseña'}
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
