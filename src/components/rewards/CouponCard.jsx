import { Ticket } from 'lucide-react';
import { differenceInCalendarDays } from 'date-fns';
import { StatusBadge } from '../ui';

export const CouponCard = ({ coupon, onViewQr }) => {
  const expiresDate = coupon.expires?.length === 10 ? new Date(`${coupon.expires}T12:00:00`) : new Date(coupon.expires);
  const remainingDays = differenceInCalendarDays(expiresDate, new Date());
  const formattedDate = expiresDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'long' });
  const isActive = coupon.status === 'ACTIVE';

  return (
    <article className="rw-card rw-coupon-card" aria-label={coupon.title}>
      <div className="rw-card-body rw-coupon-body">
        <div className="rw-coupon-header">
          <Ticket size={20} color="var(--rw-primary)" aria-hidden="true" />
          <StatusBadge status={coupon.status} />
        </div>
        <h3 className="rw-coupon-title">{coupon.title}</h3>
        {coupon.porcentaje_descuento != null && (
          <p className="rw-coupon-discount">{coupon.porcentaje_descuento}% de descuento</p>
        )}
        {coupon.store && <p className="rw-coupon-store">{coupon.store}</p>}
        <p className="rw-coupon-expiry">Válido hasta {formattedDate}</p>
        {isActive && remainingDays >= 0 && (
          <p className="rw-coupon-remaining">Quedan: {remainingDays} días</p>
        )}
        <button
          type="button"
          className="rw-btn rw-btn-primary rw-btn-block rw-coupon-qr-btn"
          disabled={!isActive}
          onClick={() => onViewQr(coupon)}
        >
          Ver QR
        </button>
      </div>
    </article>
  );
};
