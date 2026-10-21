export const Carousel = ({ children, ariaLabel }) => (
  <div className="rw-carousel" role="region" aria-label={ariaLabel} tabIndex={0}>
    <div className="rw-carousel-track">
      {children}
    </div>
  </div>
);
