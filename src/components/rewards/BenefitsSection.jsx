import { useState } from 'react';
import { BadgePercent, Coins } from 'lucide-react';
import { Skeleton, EmptyState, ErrorState, Modal } from '../ui';
import { Carousel } from './Carousel';
import { redeemBenefit } from '../../services/rewardsApi';
import { getErrorMessage } from '../../services/apiErrors';
import { useToast } from '../../context/ToastContext';

const REDEEM_ERRORS = {
  SALDO_INSUFICIENTE: 'No tenés puntos suficientes para este beneficio.',
  LIMITE_ALCANZADO:   'Ya alcanzaste el límite de canjes para este beneficio.',
  SIN_STOCK:          'Este beneficio se quedó sin stock.',
};

const fmtCurrency = (v) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);

const BenefitCard = ({ benefit, balance, onRedeem }) => {
  const missing = Math.max(0, benefit.costo_puntos - balance);
  const canRedeem = benefit.canjeable !== false && missing === 0;

  return (
    <article className="rw-card rw-card--hoverable rw-benefit-card" aria-label={benefit.nombre}>
      {benefit.imagen_url && (
        <img src={benefit.imagen_url} alt="" loading="lazy" className="rw-benefit-image" />
      )}
      <div className="rw-card-body rw-benefit-body">
        <div className="rw-benefit-discount">{benefit.porcentaje_descuento}%</div>
        <h3 className="rw-benefit-title">{benefit.nombre}</h3>
        {benefit.descripcion && <p className="rw-benefit-description">{benefit.descripcion}</p>}
        {benefit.tope_descuento != null && (
          <p className="rw-benefit-meta">Tope de descuento: {fmtCurrency(benefit.tope_descuento)}</p>
        )}
        <div className="rw-benefit-footer">
          <span className="rw-benefit-cost">
            <Coins size={16} color="var(--rw-accent)" aria-hidden="true" />
            {benefit.costo_puntos} pts
          </span>
          <button
            type="button"
            className="rw-btn rw-btn-primary"
            disabled={!canRedeem}
            onClick={() => onRedeem(benefit)}
          >
            Canjear
          </button>
        </div>
        {missing > 0 && <p className="rw-benefit-hint">Te faltan {missing} puntos</p>}
        {missing === 0 && benefit.canjeable === false && (
          <p className="rw-benefit-hint">No disponible para tu cuenta en este momento</p>
        )}
      </div>
    </article>
  );
};

// Montado solo mientras hay un canje en curso, así arranca siempre limpio.
const RedeemModal = ({ benefit, balance, onClose, onRedeemed }) => {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const confirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await redeemBenefit(benefit.id);
      toast.success(`¡Listo! Tu cupón "${benefit.nombre}" ya está en tus cupones.`);
      onRedeemed(res.data);
    } catch (err) {
      setError(getErrorMessage(err, REDEEM_ERRORS, 'No pudimos completar el canje. Intentá nuevamente.'));
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={submitting ? undefined : onClose} title="Canjear beneficio" size="sm">
      <div className="rw-redeem-modal">
        <div>
          <div className="rw-benefit-discount">{benefit.porcentaje_descuento}%</div>
          <h3 className="rw-benefit-title">{benefit.nombre}</h3>
        </div>
        <div className="rw-redeem-summary">
          <span>Se descontarán</span>
          <strong>{benefit.costo_puntos} pts</strong>
        </div>
        <div className="rw-redeem-summary">
          <span>Tu saldo quedará en</span>
          <strong>{balance - benefit.costo_puntos} pts</strong>
        </div>
        <p className="rw-redeem-note">
          El cupón vence a los {benefit.dias_validez_cupon} días. Se puede usar un solo cupón por compra.
          Si vence sin usarse, los puntos no se devuelven.
        </p>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="rw-redeem-actions">
          <button type="button" className="rw-btn rw-btn-ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="button" className="rw-btn rw-btn-primary" onClick={confirm} disabled={submitting}>
            {submitting ? 'Canjeando…' : 'Confirmar canje'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const BenefitsSection = ({ benefits, balance, loading, error, onRetry, onRedeemed }) => {
  const [redeeming, setRedeeming] = useState(null);

  const handleRedeemed = (data) => {
    setRedeeming(null);
    onRedeemed(data);
  };

  return (
    <section id="rw-benefits" className="rw-section" aria-labelledby="rw-benefits-heading">
      <h2 id="rw-benefits-heading" className="rw-section-title">Canjeá tus puntos</h2>

      {loading ? (
        <div className="rw-benefits-grid">
          {[0, 1, 2].map(i => <Skeleton key={i} height={200} radius={20} />)}
        </div>
      ) : error ? (
        <ErrorState message="No pudimos cargar los beneficios." onRetry={onRetry} />
      ) : benefits.length === 0 ? (
        <EmptyState icon={BadgePercent} title="No hay beneficios disponibles por ahora" />
      ) : (
        <>
          <div className="rw-benefits-grid hide-mobile">
            {benefits.map(b => <BenefitCard key={b.id} benefit={b} balance={balance} onRedeem={setRedeeming} />)}
          </div>
          <div className="show-mobile">
            <Carousel ariaLabel="Beneficios para canjear">
              {benefits.map(b => <BenefitCard key={b.id} benefit={b} balance={balance} onRedeem={setRedeeming} />)}
            </Carousel>
          </div>
        </>
      )}

      {redeeming && (
        <RedeemModal
          benefit={redeeming}
          balance={balance}
          onClose={() => setRedeeming(null)}
          onRedeemed={handleRedeemed}
        />
      )}
    </section>
  );
};
