import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Pages/context/AuthContext';
import { House, CircleUserRound, Recycle, Coins, Scroll, WavesLadder } from 'lucide-react';
import './bottomNav.css';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  // Update active tab based on current route
  useEffect(() => {
    const pathname = location.pathname;

    if (pathname === '/dashboard' || pathname === '/') {
      setActiveTab('home');
    } else if (pathname.includes('/dashboard/tabungSampah')) {
      setActiveTab('tabung');
    } else if (pathname.includes('/dashboard/tukarPoin')) {
      setActiveTab('tukar');
    } else if (pathname.includes('/dashboard/riwayatTransaksi')) {
      setActiveTab('riwayat');
    } else if (pathname.includes('/dashboard/leaderboard')) {
      setActiveTab('leaderboard');
    } else if (pathname.includes('/dashboard/profil')) {
      setActiveTab('profil');
    }
  }, [location]);

  const handleNavigation = (tab, path) => {
    setActiveTab(tab);
    navigate(path);
  };

  // Hide bottom nav on desktop (only show on mobile/tablet)
  // Also hide for admin users or on admin routes
  if (!user || isAdmin || location.pathname.includes('/admin')) return null;

  return (
    <>
      <nav className="bottom-nav-container">
        <div className="bottom-nav-wrapper">
          {/* Home */}
          <button
            className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => handleNavigation('home', '/dashboard')}
            title="Home"
          >
            <div className="bottom-nav-icon"><House size={24} strokeWidth={1.5} /></div>
            <span className="bottom-nav-label">Home</span>
          </button>

          {/* Tabung Sampah */}
          <button
            className={`bottom-nav-item ${activeTab === 'tabung' ? 'active' : ''}`}
            onClick={() => handleNavigation('tabung', '/dashboard/tabungSampah')}
            title="Tabung Sampah"
          >
            <div className="bottom-nav-icon"><Recycle size={24} strokeWidth={1.5} /></div>
            <span className="bottom-nav-label">Tabung</span>
          </button>

          {/* Riwayat */}
          <button
            className={`bottom-nav-item ${activeTab === 'riwayat' ? 'active' : ''}`}
            onClick={() => handleNavigation('riwayat', '/dashboard/riwayatTransaksi')}
            title="Riwayat"
          >
            <div className="bottom-nav-icon"><Scroll size={24} strokeWidth={1.5} /></div>
            <span className="bottom-nav-label">Riwayat</span>
          </button>

          {/* Tukar Poin */}
          <button
            className={`bottom-nav-item ${activeTab === 'tukar' ? 'active' : ''}`}
            onClick={() => handleNavigation('tukar', '/dashboard/tukarPoin')}
            title="Tukar Poin"
          >
            <div className="bottom-nav-icon"><Coins size={24} strokeWidth={1.5} /></div>
            <span className="bottom-nav-label">Tukar</span>
          </button>

          {/* Leaderboard */}
          <button
            className={`bottom-nav-item ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => handleNavigation('leaderboard', '/dashboard/leaderboard')}
            title="Leaderboard"
          >
            <div className="bottom-nav-icon"><WavesLadder size={24} strokeWidth={1.5} /></div>
            <span className="bottom-nav-label">Leaderboard</span>
          </button>
        </div>
      </nav>

      {/* Floating Profil Button */}
      <button
        className={`floating-profil-btn ${activeTab === 'profil' ? 'active' : ''}`}
        onClick={() => handleNavigation('profil', '/dashboard/profil')}
        title="Profil"
        aria-label="Buka Profil"
      >
        <div className="floating-btn-icon"><CircleUserRound size={28} strokeWidth={1.5} /></div>
      </button>
    </>
  );
};

export default BottomNav;
