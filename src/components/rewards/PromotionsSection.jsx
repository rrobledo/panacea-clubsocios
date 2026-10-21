import { useState } from 'react';
import { Megaphone } from 'lucide-react';
import { Skeleton, EmptyState, ErrorState, Modal } from '../ui';
import { Carousel } from './Carousel';
import { PromotionCard } from './PromotionCard';

const PromotionModal = ({ promotion, onClose }) => {
  if (!promotion) return null;
  return (
    <Modal open onClose={onClose} title={promotion.title} size="sm">
      <div className="rw-promotion-modal">
        {promotion.image && (
          <img src={promotion.image} alt={promotion.title} className="rw-promotion-modal-image" />
        )}
        <p>{promotion.description}</p>
      </div>
    </Modal>
  );
};

export const PromotionsSection = ({ promotions, loading, error, onRetry }) => {
  const [active, setActive] = useState(null);

  return (
    <section id="rw-promotions" className="rw-section" aria-labelledby="rw-promotions-heading">
      <h2 id="rw-promotions-heading" className="rw-section-title">Promociones destacadas</h2>

      {loading ? (
        <div className="rw-promotions-grid">
          {[0, 1, 2].map(i => <Skeleton key={i} height={220} radius={20} />)}
        </div>
      ) : error ? (
        <ErrorState message="No pudimos cargar las promociones." onRetry={onRetry} />
      ) : promotions.length === 0 ? (
        <EmptyState icon={Megaphone} title="No hay promociones disponibles" />
      ) : (
        <>
          <div className="rw-promotions-grid hide-mobile">
            {promotions.map(p => <PromotionCard key={p.id} promotion={p} onLearnMore={setActive} />)}
          </div>
          <div className="show-mobile">
            <Carousel ariaLabel="Promociones destacadas">
              {promotions.map(p => <PromotionCard key={p.id} promotion={p} onLearnMore={setActive} />)}
            </Carousel>
          </div>
        </>
      )}

      <PromotionModal promotion={active} onClose={() => setActive(null)} />
    </section>
  );
};
