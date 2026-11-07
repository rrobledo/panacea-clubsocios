import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RewardsShell } from '../components/rewards/RewardsShell';
import { Hero } from '../components/rewards/Hero';
import { CreditsCard } from '../components/rewards/CreditsCard';
import { RewardMachineCard, PlayMachineModal } from '../components/rewards/RewardMachineCard';
import { CouponsSection } from '../components/rewards/CouponsSection';
import { PromotionsSection } from '../components/rewards/PromotionsSection';
import { ActivitySection } from '../components/rewards/ActivitySection';
import { BenefitsSection } from '../components/rewards/BenefitsSection';
import { getCredits, getRewardMachine, getCoupons, getPromotions, getActivity, getBenefits } from '../services/rewardsApi';
import '../components/rewards/rewards-theme.css';
import '../components/rewards/rewards-page.css';

export const RewardsHomePage = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [credits, setCredits] = useState(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [creditsError, setCreditsError] = useState(false);

  const [rewardMachine, setRewardMachine] = useState(null);
  const [machineLoading, setMachineLoading] = useState(true);
  const [machineError, setMachineError] = useState(false);

  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(false);

  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [couponsError, setCouponsError] = useState(false);

  const [promotions, setPromotions] = useState([]);
  const [promotionsLoading, setPromotionsLoading] = useState(true);
  const [promotionsError, setPromotionsError] = useState(false);

  const [benefits, setBenefits] = useState([]);
  const [benefitsLoading, setBenefitsLoading] = useState(true);
  const [benefitsError, setBenefitsError] = useState(false);

  const [playModalOpen, setPlayModalOpen] = useState(false);

  const balance = credits?.saldo ?? 0;

  // Each section's data is fetched by a plain fetchX (safe to call from a mount
  // effect: it only touches state inside the async .then/.catch/.finally, never
  // synchronously). retryX additionally resets loading/error state up front and
  // is used by the section's own Retry button (a real event handler).
  const fetchCredits = useCallback(() => {
    getCredits()
      .then(res => setCredits(res.data))
      .catch(() => setCreditsError(true))
      .finally(() => setCreditsLoading(false));
  }, []);
  const retryCredits = () => { setCreditsLoading(true); setCreditsError(false); fetchCredits(); };

  const fetchRewardMachine = useCallback(() => {
    getRewardMachine()
      .then(res => setRewardMachine(res.data))
      .catch(() => setMachineError(true))
      .finally(() => setMachineLoading(false));
  }, []);
  const retryRewardMachine = () => { setMachineLoading(true); setMachineError(false); fetchRewardMachine(); };

  const fetchCoupons = useCallback(() => {
    getCoupons()
      .then(res => setCoupons(res.data))
      .catch(() => setCouponsError(true))
      .finally(() => setCouponsLoading(false));
  }, []);
  const retryCoupons = () => { setCouponsLoading(true); setCouponsError(false); fetchCoupons(); };

  const fetchPromotions = useCallback(() => {
    getPromotions()
      .then(res => setPromotions(res.data))
      .catch(() => setPromotionsError(true))
      .finally(() => setPromotionsLoading(false));
  }, []);
  const retryPromotions = () => { setPromotionsLoading(true); setPromotionsError(false); fetchPromotions(); };

  const fetchActivity = useCallback(() => {
    getActivity()
      .then(res => setActivity(res.data))
      .catch(() => setActivityError(true))
      .finally(() => setActivityLoading(false));
  }, []);
  const retryActivity = () => { setActivityLoading(true); setActivityError(false); fetchActivity(); };

  const fetchBenefits = useCallback(() => {
    getBenefits()
      .then(res => setBenefits(Array.isArray(res.data) ? res.data : res.data?.items ?? []))
      .catch(() => setBenefitsError(true))
      .finally(() => setBenefitsLoading(false));
  }, []);
  const retryBenefits = () => { setBenefitsLoading(true); setBenefitsError(false); fetchBenefits(); };

  useEffect(() => { fetchCredits(); }, [fetchCredits]);
  useEffect(() => { fetchBenefits(); }, [fetchBenefits]);
  useEffect(() => { fetchRewardMachine(); }, [fetchRewardMachine]);
  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);
  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);
  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  const openPlayModal = () => {
    if (creditsLoading || machineLoading) return;
    if (!rewardMachine?.enabled) {
      toast.warning('La Máquina de Recompensas no está disponible en este momento.');
      return;
    }
    if (balance < (rewardMachine?.cost ?? Infinity)) {
      toast.warning('No tenés puntos suficientes para jugar.');
      return;
    }
    setPlayModalOpen(true);
  };

  // Tras jugar o canjear, el ledger del backend es la fuente de verdad:
  // se refrescan saldo, cupones, actividad y beneficios (canjeable/stock).
  const refreshAfterPointsChange = () => {
    fetchCredits();
    fetchCoupons();
    fetchActivity();
    fetchBenefits();
  };

  return (
    <RewardsShell onPlay={openPlayModal}>
      <Hero
        name={user?.email?.split('@')[0] || 'Socio'}
        points={balance}
        loading={creditsLoading}
        onPlay={openPlayModal}
      />

      <div className="rw-credits-machine-row">
        <CreditsCard
          credits={credits}
          loading={creditsLoading}
          error={creditsError}
          onRetry={retryCredits}
        />
        <RewardMachineCard
          cost={rewardMachine?.cost ?? 0}
          enabled={rewardMachine?.enabled ?? false}
          currentCredits={balance}
          loading={machineLoading}
          error={machineError}
          onRetry={retryRewardMachine}
          onPlay={openPlayModal}
        />
      </div>

      <BenefitsSection
        benefits={benefits}
        balance={balance}
        loading={benefitsLoading || creditsLoading}
        error={benefitsError}
        onRetry={retryBenefits}
        onRedeemed={refreshAfterPointsChange}
      />

      <CouponsSection
        coupons={coupons}
        loading={couponsLoading}
        error={couponsError}
        onRetry={retryCoupons}
        onPlay={openPlayModal}
      />

      <PromotionsSection
        promotions={promotions}
        loading={promotionsLoading}
        error={promotionsError}
        onRetry={retryPromotions}
      />

      <ActivitySection
        activity={activity}
        loading={activityLoading}
        error={activityError}
        onRetry={retryActivity}
      />

      {playModalOpen && (
        <PlayMachineModal
          onClose={() => setPlayModalOpen(false)}
          onResolved={refreshAfterPointsChange}
        />
      )}
    </RewardsShell>
  );
};
