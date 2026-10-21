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
import { getCredits, getRewardMachine, getCoupons, getPromotions, getActivity } from '../services/rewardsApi';
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

  const [playModalOpen, setPlayModalOpen] = useState(false);

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

  useEffect(() => { fetchCredits(); }, [fetchCredits]);
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
    if ((credits?.current ?? 0) < (rewardMachine?.cost ?? Infinity)) {
      toast.warning('No tenés créditos suficientes para jugar.');
      return;
    }
    setPlayModalOpen(true);
  };

  const handlePlayResolved = (data) => {
    if (data?.credits) setCredits(data.credits);
    if (data?.coupon) {
      setCoupons(prev => [data.coupon, ...prev]);
      setActivity(prev => [
        { type: 'PLAY', credits: -(rewardMachine?.cost ?? 0), reward: data.coupon.title, date: new Date().toISOString() },
        ...prev,
      ]);
    }
  };

  return (
    <RewardsShell onPlay={openPlayModal}>
      <Hero
        name={user?.email?.split('@')[0] || 'Socio'}
        credits={credits?.current ?? 0}
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
          currentCredits={credits?.current ?? 0}
          loading={machineLoading}
          error={machineError}
          onRetry={retryRewardMachine}
          onPlay={openPlayModal}
        />
      </div>

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
          onResolved={handlePlayResolved}
        />
      )}
    </RewardsShell>
  );
};
