import { ShoppingBag, Gift } from 'lucide-react';
import { isToday, isYesterday, format } from 'date-fns';
import { es } from 'date-fns/locale';

const toDate = (d) => (d.includes('T') ? new Date(d) : new Date(`${d}T12:00:00`));

const groupLabel = (dateStr) => {
  const d = toDate(dateStr);
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  return format(d, "d 'de' MMMM", { locale: es });
};

const fmtCurrency = (v) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);

export const Timeline = ({ entries }) => {
  const groups = [];
  entries.forEach((entry) => {
    const label = groupLabel(entry.date);
    let group = groups.find(g => g.label === label);
    if (!group) {
      group = { label, items: [] };
      groups.push(group);
    }
    group.items.push(entry);
  });

  return (
    <div className="rw-timeline">
      {groups.map(({ label, items }) => (
        <div key={label} className="rw-timeline-group">
          <div className="rw-timeline-day">{label}</div>
          {items.map((entry, i) => (
            <div key={i} className="rw-timeline-item">
              <div className="rw-timeline-icon">
                {entry.type === 'PURCHASE' ? <ShoppingBag size={16} /> : <Gift size={16} />}
              </div>
              <div className="rw-timeline-content">
                {entry.type === 'PURCHASE' ? (
                  <>
                    <span className="rw-timeline-title">Compra</span>
                    {entry.amount !== undefined && (
                      <span className="rw-timeline-detail">{fmtCurrency(entry.amount)}</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="rw-timeline-title">Jugó la Máquina de Recompensas</span>
                    {entry.reward && <span className="rw-timeline-detail">Ganó: {entry.reward}</span>}
                  </>
                )}
              </div>
              <div className={`rw-timeline-credits ${entry.credits >= 0 ? 'rw-positive' : 'rw-negative'}`}>
                {entry.credits >= 0 ? '+' : ''}{entry.credits} Créditos
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
