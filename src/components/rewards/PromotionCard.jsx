export const PromotionCard = ({ promotion, onLearnMore }) => (
  <article className="rw-card rw-card--hoverable rw-promotion-card">
    {promotion.image && (
      <img
        src={promotion.image}
        alt={promotion.title}
        loading="lazy"
        className="rw-promotion-image"
      />
    )}
    <div className="rw-card-body rw-promotion-body">
      <h3 className="rw-promotion-title">{promotion.title}</h3>
      <p className="rw-promotion-description">{promotion.description}</p>
      <button
        type="button"
        className="rw-btn rw-btn-primary rw-promotion-cta"
        onClick={() => onLearnMore(promotion)}
      >
        Conocer más
      </button>
    </div>
  </article>
);
