import { useEffect, useState } from 'react';
import { Gift, PartyPopper } from 'lucide-react';
import { Skeleton, ErrorState, Modal } from '../ui';
import { playRewardMachine } from '../../services/rewardsApi';

export const RewardMachineCard = ({ cost, enabled, currentCredits, loading, error, onRetry, onPlay }) => {
  const insufficientCredits = !loading && currentCredits < cost;
  const disabled = loading || error || !enabled || insufficientCredits;

  return (
    <div className="rw-card rw-card--hoverable rw-machine-card" id="rw-machine">
      <div className="rw-card-body rw-machine-body">
        <div className="rw-machine-illustration" aria-hidden="true">
          <Gift size={56} />
        </div>
        <h2 className="rw-machine-title">Máquina de Recompensas</h2>

        {loading ? (
          <Skeleton width={140} height={20} style={{ margin: '8px 0' }} />
        ) : error ? (
          <ErrorState message="No pudimos cargar la Máquina de Recompensas." onRetry={onRetry} />
        ) : (
          <>
            <p className="rw-machine-cost">Jugá por solo <strong>{cost} Créditos</strong></p>
            <button
              type="button"
              className="rw-btn rw-btn-primary rw-machine-play-btn"
              disabled={disabled}
              onClick={onPlay}
            >
              Jugar
            </button>
            {!enabled && (
              <p className="rw-machine-hint">La Máquina de Recompensas no está disponible en este momento.</p>
            )}
            {enabled && insufficientCredits && (
              <p className="rw-machine-hint">Necesitás {cost - currentCredits} créditos más para jugar.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const MIN_PLAY_DURATION_MS = 600;

// Rendered only while the parent has an open play in progress (mounted via
// `{playModalOpen && <PlayMachineModal .../>}`), so a fresh mount always
// starts from the default 'playing' phase — no reset-on-open effect needed.
export const PlayMachineModal = ({ onClose, onResolved }) => {
  const [phase, setPhase] = useState('playing');
  const [result, setResult] = useState(null);

  const attemptPlay = () => {
    const startedAt = Date.now();
    playRewardMachine()
      .then(res => {
        const wait = Math.max(0, MIN_PLAY_DURATION_MS - (Date.now() - startedAt));
        setTimeout(() => {
          setResult(res.data);
          setPhase('success');
          onResolved(res.data);
        }, wait);
      })
      .catch(() => {
        const wait = Math.max(0, MIN_PLAY_DURATION_MS - (Date.now() - startedAt));
        setTimeout(() => setPhase('error'), wait);
      });
  };

  const retry = () => {
    setPhase('playing');
    setResult(null);
    attemptPlay();
  };

  useEffect(() => { attemptPlay(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal open onClose={onClose} title="Máquina de Recompensas" size="sm">
      {phase === 'playing' && (
        <div className="rw-machine-playing">
          <Gift size={64} className="rw-machine-spin" aria-hidden="true" />
          <p>Girando la máquina…</p>
        </div>
      )}
      {phase === 'success' && (
        <div className="rw-machine-result">
          <PartyPopper size={48} color="var(--rw-accent)" aria-hidden="true" />
          <h3>¡Ganaste un cupón!</h3>
          <p className="rw-machine-result-title">{result?.coupon?.title}</p>
          <button type="button" className="rw-btn rw-btn-primary rw-btn-block" onClick={onClose}>
            Genial
          </button>
        </div>
      )}
      {phase === 'error' && (
        <ErrorState message="No pudimos procesar tu jugada." onRetry={retry} />
      )}
    </Modal>
  );
};
