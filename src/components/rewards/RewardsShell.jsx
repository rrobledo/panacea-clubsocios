import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Home, Ticket, Megaphone, Clock, User, Gift } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './rewards-shell.css';

const NAV_SECTIONS = [
  { id: 'rw-home', label: 'Inicio', icon: Home },
  { id: 'rw-coupons', label: 'Cupones', icon: Ticket },
  { id: 'rw-promotions', label: 'Promociones', icon: Megaphone },
  { id: 'rw-activity', label: 'Historial', icon: Clock },
];

const scrollToSection = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ── Header ────────────────────────────────────────────────────────────────
const RewardsHeader = ({ user }) => {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const initials = (user?.email?.[0] || 'U').toUpperCase();

  return (
    <header className="rw-header">
      <div className="rw-header-inner">
        <div className="rw-logo">
          <div className="rw-logo-icon">CS</div>
          <span className="rw-logo-text">Club Socios</span>
        </div>

        <nav className="rw-nav hide-mobile" aria-label="Navegación principal">
          {NAV_SECTIONS.map(({ id, label }) => (
            <button key={id} type="button" className="rw-nav-link" onClick={() => scrollToSection(id)}>
              {label}
            </button>
          ))}
          <button type="button" className="rw-nav-link" onClick={() => navigate('/configuracion/cuenta')}>
            Perfil
          </button>
        </nav>

        <div className="rw-header-actions">
          <div className="rw-notif-wrap">
            <button
              type="button"
              className="rw-icon-btn"
              aria-label="Notificaciones"
              onClick={() => setNotifOpen(o => !o)}
            >
              <Bell size={19} />
              <span className="rw-notif-dot" aria-hidden="true" />
            </button>
            {notifOpen && (
              <div className="rw-notif-dropdown" role="menu">
                <p className="rw-notif-empty">No tenés notificaciones nuevas.</p>
              </div>
            )}
          </div>
          <button
            type="button"
            className="rw-avatar"
            aria-label="Ir a mi cuenta"
            onClick={() => navigate('/configuracion/cuenta')}
          >
            {initials}
          </button>
        </div>
      </div>
    </header>
  );
};

// ── Bottom tab bar (mobile) ──────────────────────────────────────────────
const BottomNavigation = ({ onPlay }) => {
  const navigate = useNavigate();

  const tabs = [
    { key: 'home', label: 'Inicio', icon: Home, onClick: () => scrollToSection('rw-home') },
    { key: 'coupons', label: 'Cupones', icon: Ticket, onClick: () => scrollToSection('rw-coupons') },
    { key: 'play', label: 'Jugar', icon: Gift, onClick: onPlay },
    { key: 'promotions', label: 'Promos', icon: Megaphone, onClick: () => scrollToSection('rw-promotions') },
    { key: 'profile', label: 'Perfil', icon: User, onClick: () => navigate('/configuracion/cuenta') },
  ];

  return (
    <nav className="rw-bottom-nav show-mobile" aria-label="Navegación inferior">
      {tabs.map(({ key, label, icon: Icon, onClick }) => (
        <button key={key} type="button" className="rw-bottom-nav-item" onClick={onClick} aria-label={label}>
          <Icon size={22} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
};

// ── Shell ─────────────────────────────────────────────────────────────────
export const RewardsShell = ({ children, onPlay }) => {
  const { user } = useAuth();
  return (
    <div className="rewards-theme rw-shell">
      <RewardsHeader user={user} />
      <main className="rw-main">{children}</main>
      <BottomNavigation onPlay={onPlay} />
    </div>
  );
};
