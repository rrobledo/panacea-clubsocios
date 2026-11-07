import { ShoppingBag, Gift, Ticket, Undo2, Hourglass, Wrench, ArrowLeftRight } from 'lucide-react';
import { isToday, isYesterday, format } from 'date-fns';
import { es } from 'date-fns/locale';

const toDate = (d) => (d.includes('T') ? new Date(d) : new Date(`${d}T12:00:00`));

const groupLabel = (dateStr) => {
  const d = toDate(dateStr);
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  return format(d, "d 'de' MMMM", { locale: es });
};

// Tipos de movimiento del ledger de puntos
const TYPES = {
  ACUMULACION:    { icon: ShoppingBag,    title: 'Compra' },
  CANJE:          { icon: Ticket,         title: 'Canje de beneficio' },
  JUEGO:          { icon: Gift,           title: 'Máquina de Recompensas' },
  REVERSO_COMPRA: { icon: Undo2,          title: 'Compra anulada' },
  EXPIRACION:     { icon: Hourglass,      title: 'Puntos vencidos' },
  AJUSTE:         { icon: Wrench,         title: 'Ajuste' },
  MIGRACION:      { icon: ArrowLeftRight, title: 'Saldo inicial' },
};

export const Timeline = ({ entries }) => {
  const groups = [];
  entries.forEach((entry) => {
    const label = groupLabel(entry.fecha);
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
          {items.map((entry, i) => {
            const { icon: Icon, title } = TYPES[entry.tipo] ?? { icon: Gift, title: 'Movimiento' };
            const pts = Number(entry.puntos) || 0;
            return (
              <div key={entry.id ?? i} className="rw-timeline-item">
                <div className="rw-timeline-icon"><Icon size={16} /></div>
                <div className="rw-timeline-content">
                  <span className="rw-timeline-title">{title}</span>
                  {entry.descripcion && <span className="rw-timeline-detail">{entry.descripcion}</span>}
                </div>
                <div className={`rw-timeline-credits ${pts >= 0 ? 'rw-positive' : 'rw-negative'}`}>
                  {pts >= 0 ? '+' : ''}{pts} pts
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
