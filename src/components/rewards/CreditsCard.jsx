import { useEffect, useRef, useState } from 'react';
import { Coins } from 'lucide-react';
import { Skeleton, ErrorState } from '../ui';

export const ProgressBar = ({ value, max }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setWidth(pct));
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  return (
    <div className="rw-progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className="rw-progress-fill" style={{ width: `${width}%` }} />
    </div>
  );
};

const useCountUp = (target, active) => {
  const [value, setValue] = useState(0);
  const start = useRef(null);
  useEffect(() => {
    if (!active) return;
    const duration = 900;
    let raf;
    const step = (ts) => {
      if (start.current === null) start.current = ts;
      const progress = Math.min(1, (ts - start.current) / duration);
      setValue(Math.round(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, active]);
  return value;
};

export const CreditsCard = ({ credits, loading, error, onRetry }) => {
  const current = credits?.current ?? 0;
  const nextReward = credits?.nextReward ?? 0;
  const animatedValue = useCountUp(current, !loading && !error);

  return (
    <div className="rw-card rw-card--hoverable rw-credits-card">
      <div className="rw-card-body">
        <div className="rw-credits-label">
          <Coins size={18} color="var(--rw-accent)" />
          <span>Créditos</span>
        </div>

        {loading ? (
          <>
            <Skeleton width={120} height={40} style={{ marginBottom: 16 }} />
            <Skeleton width="100%" height={10} style={{ marginBottom: 8 }} />
          </>
        ) : error ? (
          <ErrorState message="No pudimos cargar tus créditos." onRetry={onRetry} />
        ) : (
          <>
            <div className="rw-credits-value">{animatedValue}</div>
            <div className="rw-credits-progress-label">
              Progreso hacia la próxima recompensa
              <span className="rw-credits-progress-fraction">{current} / {nextReward} Créditos</span>
            </div>
            <ProgressBar value={current} max={nextReward} />
          </>
        )}
      </div>
      {!loading && !error && (
        <div className="rw-card-footer">Próxima recompensa a los {nextReward} créditos</div>
      )}
    </div>
  );
};
