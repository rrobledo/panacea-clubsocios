import { Sparkles } from 'lucide-react';
import { Skeleton } from '../ui';

export const Hero = ({ name, credits, loading, onPlay }) => (
  <section id="rw-home" className="rw-hero" aria-labelledby="rw-hero-heading">
    <Sparkles className="rw-hero-deco" size={120} aria-hidden="true" />
    <div className="rw-hero-content">
      {loading ? (
        <>
          <Skeleton width={220} height={28} style={{ marginBottom: 12, background: 'rgba(255,255,255,0.25)' }} />
          <Skeleton width={160} height={40} style={{ marginBottom: 16, background: 'rgba(255,255,255,0.25)' }} />
        </>
      ) : (
        <>
          <h1 id="rw-hero-heading" className="rw-hero-title">¡Hola de nuevo, {name}!</h1>
          <p className="rw-hero-balance">Tenés <strong>{credits} Créditos</strong></p>
        </>
      )}
      <p className="rw-hero-hint">Ganá más créditos comprando en nuestros locales.</p>
      <button type="button" className="rw-btn rw-btn-primary rw-hero-cta" onClick={onPlay}>
        Jugar ahora
      </button>
    </div>
  </section>
);
