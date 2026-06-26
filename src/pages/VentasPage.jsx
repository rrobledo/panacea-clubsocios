import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getVentas } from '../services/sociosApi';
import { DataGrid } from '../components/grid/DataGrid';

const fmtFecha = (v) => {
  if (!v) return '—';
  return new Date(v).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const fmtImporte = (v) => {
  if (v == null) return '—';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v);
};

export const VentasPage = () => {
  const { user } = useAuth();
  const toast    = useToast();
  const navigate = useNavigate();

  const [ventas,  setVentas]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.socio_id) { setLoading(false); return; }
    getVentas(user.socio_id)
      .then(res => setVentas(res.data))
      .catch(() => toast.error('No se pudieron cargar las ventas.'))
      .finally(() => setLoading(false));
  }, [user?.socio_id]);

  const columns = useMemo(() => [
    {
      accessorKey: 'fecha',
      header: 'Fecha',
      size: 160,
      cell: ({ getValue }) => fmtFecha(getValue()),
    },
    {
      accessorKey: 'lugar',
      header: 'Lugar',
      size: 200,
      cell: ({ getValue }) => getValue() || '—',
    },
    {
      accessorKey: 'importe',
      header: 'Importe',
      size: 140,
      cell: ({ getValue }) => (
        <span style={{ fontWeight: 600 }}>{fmtImporte(getValue())}</span>
      ),
    },
    {
      id: 'accion',
      header: '',
      size: 80,
      cell: () => (
        <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500 }}>
          Ver detalle →
        </span>
      ),
    },
  ], []);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingBag size={22} />
            Mis compras
          </div>
          <div className="page-subtitle">Historial de ventas asociadas a tu cuenta.</div>
        </div>
      </div>

      <DataGrid
        title="Ventas"
        columns={columns}
        data={ventas}
        loading={loading}
        emptyText="No hay ventas registradas."
        showExport={false}
        onRowClick={(row) => navigate(`/ventas/${row.id}`)}
      />
    </div>
  );
};
