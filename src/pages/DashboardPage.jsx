import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getComprasSemanales, getComprasPorCategoria } from '../services/sociosApi';
import { KpiCard, RevenueChart, DonutChart } from '../components/charts';

const fmtSemana = (fecha) =>
  new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });

const desdeHaceDosM = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 2);
  return d.toISOString().slice(0, 10);
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const [semanas,    setSemanas]    = useState([]);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    if (!user?.socio_id) return;
    const params = { socio_id: user.socio_id, desde: desdeHaceDosM() };
    getComprasSemanales(params)
      .then(res =>
        setSemanas(res.data.map(r => ({ semana: fmtSemana(r.fecha), total: Number(r.total) })))
      )
      .catch(() => {});
    getComprasPorCategoria(params)
      .then(res => setCategorias(res.data.map(r => ({ name: r.name, value: Number(r.value) }))))
      .catch(() => {});
  }, [user?.socio_id]);

  const totalCompras = semanas.reduce((acc, s) => acc + s.total, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Panel</div>
          <div className="page-subtitle">Bienvenido. Aquí está el resumen de actividad.</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <KpiCard
          label="Compras (últimos 2 meses)"
          value={new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(totalCompras)}
          icon={ShoppingBag}
          color="#2563eb"
        />
      </div>

      {/* Gráfico compras semanales */}
      <div style={{ marginBottom: 24 }}>
        <RevenueChart
          data={semanas}
          xKey="semana"
          yKey="total"
          title="Compras semanales"
          subtitle="Importe total por semana — últimos 2 meses"
          yLabel="Compras"
        />
      </div>

      {/* Ventas por categoría */}
      <DonutChart data={categorias} title="Ventas por categoría" />
    </div>
  );
};
