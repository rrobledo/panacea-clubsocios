import { useState } from 'react';
import { Ticket } from 'lucide-react';
import { Skeleton, EmptyState, ErrorState, Modal } from '../ui';
import { Carousel } from './Carousel';
import { CouponCard } from './CouponCard';

const isImageSrc = (v) => typeof v === 'string' && (v.startsWith('http') || v.startsWith('data:image'));

const QrModal = ({ coupon, onClose }) => {
  if (!coupon) return null;
  return (
    <Modal open onClose={onClose} title={coupon.title} size="sm">
      <div className="rw-qr-modal">
        {isImageSrc(coupon.qrCode) ? (
          <img src={coupon.qrCode} alt={`Código QR para ${coupon.title}`} className="rw-qr-image" />
        ) : (
          <div className="rw-qr-placeholder" role="img" aria-label={`Código QR para ${coupon.title}`}>
            {coupon.qrCode || coupon.codigo || coupon.id}
          </div>
        )}
        {coupon.codigo && <p className="rw-qr-code">{coupon.codigo}</p>}
        {coupon.porcentaje_descuento != null && (
          <p className="rw-qr-detail">{coupon.porcentaje_descuento}% de descuento · un cupón por compra</p>
        )}
        {coupon.store && <p className="rw-qr-detail">{coupon.store}</p>}
      </div>
    </Modal>
  );
};

export const CouponsSection = ({ coupons, loading, error, onRetry, onPlay }) => {
  const [qrCoupon, setQrCoupon] = useState(null);

  return (
    <section id="rw-coupons" className="rw-section" aria-labelledby="rw-coupons-heading">
      <h2 id="rw-coupons-heading" className="rw-section-title">Cupones activos</h2>

      {loading ? (
        <div className="rw-coupons-row">
          {[0, 1, 2].map(i => <Skeleton key={i} height={190} radius={20} />)}
        </div>
      ) : error ? (
        <ErrorState message="No pudimos cargar tus cupones." onRetry={onRetry} />
      ) : coupons.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="Todavía no tenés cupones"
          description="Canjeá tus puntos por un beneficio o jugá en la Máquina de Recompensas."
          action={<button type="button" className="rw-btn rw-btn-primary" onClick={onPlay}>Jugar</button>}
        />
      ) : (
        <>
          <div className="rw-coupons-row hide-mobile">
            {coupons.map(c => <CouponCard key={c.id} coupon={c} onViewQr={setQrCoupon} />)}
          </div>
          <div className="show-mobile">
            <Carousel ariaLabel="Cupones activos">
              {coupons.map(c => <CouponCard key={c.id} coupon={c} onViewQr={setQrCoupon} />)}
            </Carousel>
          </div>
        </>
      )}

      <QrModal coupon={qrCoupon} onClose={() => setQrCoupon(null)} />
    </section>
  );
};
