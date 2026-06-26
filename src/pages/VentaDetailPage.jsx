import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, DollarSign } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getVenta, getVentaDetail } from '../services/sociosApi';
import { PageLoader } from '../components/ui';
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

const InfoItem = ({ icon: Icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
    <Icon size={16} style={{ color: 'var(--primary)', marginTop: 2, flexShrink: 0 }} />
    <div>
      <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: 15 }}>{value}</div>
    </div>
  </div>
);

export const VentaDetailPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const toast    = useToast();

  const [venta,   setVenta]   = useState(null);
  const [detalle, setDetalle] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getVenta(id), getVentaDetail(id)])
      .then(([vRes, dRes]) => {
        setVenta(vRes.data);
        setDetalle(dRes.data);
      })
      .catch(() => toast.error('No se pudo cargar el detalle de la venta.'))
      .finally(() => setLoading(false));
  }, [id]);

  const columns = useMemo(() => [
    {
      accessorKey: 'categoria',
      header: 'Categoría',
      size: 160,
      cell: ({ getValue }) => getValue() || '—',
    },
    {
      accessorKey: 'producto',
      header: 'Producto',
      cell: ({ getValue }) => getValue() || '—',
    },
    {
      accessorKey: 'cantidad',
      header: 'Cantidad',
      size: 100,
      cell: ({ getValue }) => getValue() ?? '—',
    },
    {
      accessorKey: 'subtotal',
      header: 'Subtotal',
      size: 140,
      cell: ({ getValue }) => (
        <span style={{ fontWeight: 600 }}>{fmtImporte(getValue())}</span>
      ),
    },
  ], []);

  if (loading) return <PageLoader />;

  return (
    <div>
      {/* ── Encabezado de página ─────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-left">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/ventas')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}
          >
            <ArrowLeft size={15} /> Volver a mis compras
          </button>
          <div className="page-title">Detalle de compra</div>
          <div className="page-subtitle">Venta #{id}</div>
        </div>
      </div>

      {/* ── Cabecera de la venta ─────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 24,
          }}>
            <InfoItem icon={Calendar}    label="Fecha"   value={fmtFecha(venta?.fecha)} />
            <InfoItem icon={MapPin}      label="Lugar"   value={venta?.lugar || '—'} />
            <InfoItem icon={DollarSign}  label="Importe" value={fmtImporte(venta?.importe)} />
          </div>
        </div>
      </div>

      {/* ── Líneas de detalle ────────────────────────────────────────────── */}
      <DataGrid
        title="Productos"
        columns={columns}
        data={detalle}
        loading={false}
        emptyText="Sin detalle de productos para esta venta."
        showSearch={false}
        showExport={false}
      />
    </div>
  );
};
