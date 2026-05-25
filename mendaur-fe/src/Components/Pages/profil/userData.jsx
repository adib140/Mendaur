import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import "../profil/userData.css";
import { getUser, getUserActivity, getUserBadges } from "../../../services/api";
import cache from "../../../utils/cache";

import { Recycle, Star, ArrowLeftRight, Calendar, Trophy, MapPin, Phone, Gift, Zap, ChevronLeft, ChevronRight } from "lucide-react";

const CACHE_TTL = {
  USER_DETAIL: 10 * 60 * 1000, // 10 minutes - increased for better offline support
  ACTIVITY: 5 * 60 * 1000,     // 5 minutes  
  BADGES: 10 * 60 * 1000,      // 10 minutes
};

export default function UserData({ cachedData, onDataLoaded }) {
  const { user } = useAuth();
  const [aktivitas, setAktivitas] = useState(cachedData?.aktivitas || []);
  const [badgeCount, setBadgeCount] = useState(cachedData?.badgeInfo?.count || 0);
  const [loading, setLoading] = useState(!cachedData);
  const [userCreatedAt, setUserCreatedAt] = useState(cachedData?.userCreatedAt || null);
  const [totalBadgeRewards, setTotalBadgeRewards] = useState(cachedData?.badgeInfo?.rewards || 0);

  // Check for user change (clear stale cache)
  useEffect(() => {
    cache.checkUserChange(user?.user_id);
  }, [user?.user_id]);

  const fetchUserData = useCallback(async () => {
    if (!user?.user_id) return;
    
    const cacheKeyUser = `userData_detail_${user.user_id}`;
    const cacheKeyActivity = `userData_activity_${user.user_id}`;
    const cacheKeyBadges = `userData_badges_${user.user_id}`;

    // Check cache first
    const cachedUser = cache.get(cacheKeyUser);
    const cachedActivity = cache.get(cacheKeyActivity);
    const cachedBadges = cache.get(cacheKeyBadges);

    // Helper function to notify parent
    const notifyParent = (userCreated, activities, badgeInfo) => {
      if (onDataLoaded) {
        onDataLoaded({
          userCreatedAt: userCreated,
          aktivitas: activities,
          badgeInfo: badgeInfo
        });
      }
    };

    // If all cached, use cached data immediately
    if (cachedUser && cachedActivity && cachedBadges) {
      setUserCreatedAt(cachedUser);
      setAktivitas(cachedActivity);
      setBadgeCount(cachedBadges.count);
      setTotalBadgeRewards(cachedBadges.rewards);
      setLoading(false);
      notifyParent(cachedUser, cachedActivity, cachedBadges);
      return;
    }

    setLoading(true);

    // Parallel fetch all data with timeout
    const createFetchWithTimeout = (promise, timeoutMs = 8000) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
      ]);
    };

    const [userResult, activityResult, badgesResult] = await Promise.allSettled([
      cachedUser ? Promise.resolve({ cached: true, data: cachedUser }) :
        createFetchWithTimeout(getUser(user.user_id)),
      cachedActivity ? Promise.resolve({ cached: true, data: cachedActivity }) :
        createFetchWithTimeout(getUserActivity(user.user_id)),
      cachedBadges ? Promise.resolve({ cached: true, data: cachedBadges }) :
        createFetchWithTimeout(getUserBadges(user.user_id))
    ]);

    let newUserCreatedAt = cachedUser;
    let newAktivitas = cachedActivity || [];
    let newBadgeInfo = cachedBadges || { count: 0, rewards: 0 };

    // Process user detail
    if (userResult.status === 'fulfilled') {
      const result = userResult.value;
      if (result.cached) {
        setUserCreatedAt(result.data);
        newUserCreatedAt = result.data;
      } else if (result.data?.created_at) {
        setUserCreatedAt(result.data.created_at);
        newUserCreatedAt = result.data.created_at;
        cache.set(cacheKeyUser, result.data.created_at, CACHE_TTL.USER_DETAIL);
      }
    }

    // Process activity
    if (activityResult.status === 'fulfilled') {
      const result = activityResult.value;
      if (result.cached) {
        setAktivitas(result.data);
        newAktivitas = result.data;
      } else if (result.status === 'success') {
        const activityData = result.data || [];
        setAktivitas(activityData);
        newAktivitas = activityData;
        cache.set(cacheKeyActivity, activityData, CACHE_TTL.ACTIVITY);
      }
    }

    // Process badges
    if (badgesResult.status === 'fulfilled') {
      const result = badgesResult.value;
      if (result.cached) {
        setBadgeCount(result.data.count);
        setTotalBadgeRewards(result.data.rewards);
        newBadgeInfo = result.data;
      } else if (result.status === 'success') {
        const badges = result.data || [];
        const count = badges.length;
        const rewards = badges.reduce((sum, badge) => sum + (badge.reward_poin || 0), 0);
        setBadgeCount(count);
        setTotalBadgeRewards(rewards);
        newBadgeInfo = { count, rewards };
        cache.set(cacheKeyBadges, newBadgeInfo, CACHE_TTL.BADGES);
      }
    }

    setLoading(false);
    notifyParent(newUserCreatedAt, newAktivitas, newBadgeInfo);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  useEffect(() => {
    if (user?.user_id) {
      fetchUserData();
    }
  }, [user?.user_id, fetchUserData]);

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'N/A';
    }

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString;
      }

      // Format: DD-MM-YYYY (e.g., "08-12-2024")
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return `${day}-${month}-${year}`;
    } catch {
      return dateString || 'N/A';
    }
  };

  // display_poin = untuk ranking/pencapaian (tidak pernah turun)
  // actual_poin = saldo yang bisa digunakan untuk transaksi
  const stats = [
    { title: "Saldo Poin", value: `${user.actual_poin ?? 0}`, icon: <Star size={20} />, tooltip: "Poin yang bisa digunakan untuk transaksi" },
    { title: "Poin Terkumpul", value: `${user.display_poin ?? user.actual_poin ?? 0}`, icon: <Trophy size={20} />, tooltip: "Total poin yang pernah didapat (untuk ranking)" },
    { title: "Total Sampah", value: `${user.total_setor_sampah ?? user.total_sampah ?? 0} Kg`, icon: <Recycle size={20} /> },
    { title: "Badge Rewards", value: `${totalBadgeRewards} Poin`, icon: <Trophy size={20} />},
    { title: "Badge Terklaim", value: `${badgeCount}`, icon: <Trophy size={20} /> },
    { title: "Bergabung", value: formatDate(userCreatedAt), icon: <Calendar size={20} /> },
  ];

  const contactInfo = [
    { label: "Email", value: user.email, icon: <Star size={16} /> },
    { label: "No. HP", value: user.no_hp || '-', icon: <Phone size={16} /> },
    { label: "Alamat", value: user.alamat || '-', icon: <MapPin size={16} /> },
  ];

  // Helper function untuk mendapatkan icon berdasarkan tipe aktivitas
  const getActivityIcon = (tipeAktivitas) => {
    if (!tipeAktivitas) return <Recycle size={16} />;

    const tipe = tipeAktivitas.toLowerCase();

    if (tipe.includes('tukar_poin') || tipe.includes('tukar poin')) {
      return <ArrowLeftRight size={16} />;
    } else if (tipe.includes('tabung_sampah') || tipe.includes('tabung sampah') || tipe.includes('setor_sampah') || tipe.includes('setor sampah')) {
      return <Recycle size={16} />;
    } else if (tipe.includes('badge_unlock') || tipe.includes('badge unlock') || tipe.includes('badge')) {
      return <Trophy size={16} />;
    } else if (tipe.includes('tukar_produk') || tipe.includes('tukar produk')) {
      return <Gift size={16} />;
    } else if (tipe.includes('poin') || tipe.includes('reward')) {
      return <Zap size={16} />;
    }

    return <Recycle size={16} />;
  };

  // Helper function untuk format nama aktivitas (ubah underscore jadi spasi dan capitalize)
  const formatActivityTitle = (tipeAktivitas) => {
    if (!tipeAktivitas) return 'Aktivitas';

    // Replace underscores with spaces
    const withSpaces = tipeAktivitas.replace(/_/g, ' ');

    // Capitalize each word
    const capitalized = withSpaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return capitalized;
  };

  // Helper function untuk mendapatkan background color berdasarkan tipe aktivitas
  const getActivityColor = (tipeAktivitas) => {
    if (!tipeAktivitas) return 'activity-default';

    const tipe = tipeAktivitas.toLowerCase();

    if (tipe.includes('tukar_poin') || tipe.includes('tukar poin')) {
      return 'activity-tukar-poin';
    } else if (tipe.includes('tabung_sampah') || tipe.includes('tabung sampah') || tipe.includes('setor_sampah') || tipe.includes('setor sampah')) {
      return 'activity-tabung-sampah';
    } else if (tipe.includes('badge_unlock') || tipe.includes('badge unlock') || tipe.includes('badge')) {
      return 'activity-badge';
    } else if (tipe.includes('tukar_produk') || tipe.includes('tukar produk')) {
      return 'activity-tukar-produk';
    } else if (tipe.includes('poin') || tipe.includes('reward')) {
      return 'activity-poin';
    }

    return 'activity-default';
  };

  return (
    <section className="userDataContainer">
      <UserStatsSection stats={stats} />

      <div className="contactInfoSection">
        <h3>Informasi Kontak</h3>
        <div className="contactGrid">
          {contactInfo.map((info, index) => (
            <div key={index} className="contactItem">
              <span className="contactIcon">{info.icon}</span>
              <div>
                <p className="contactLabel">{info.label}</p>
                <p className="contactValue">{info.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ActivityTimelineSection aktivitas={aktivitas} loading={loading} getActivityIcon={getActivityIcon} getActivityColor={getActivityColor} formatActivityTitle={formatActivityTitle} />
    </section>
  );
}

function UserStatsSection({ stats }) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 2;
  const totalPages = Math.ceil(stats.length / itemsPerPage);

  const startIndex = currentPage * itemsPerPage;
  const displayedStats = stats.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevious = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  return (
    <div className="userStatsSection">
      <div className="statsContainer">
        <div className="statsGrid">
          {displayedStats.map((stat, index) => (
            <div key={index} className={`statCard ${stat.highlight ? 'highlighted' : ''}`}>
              <div className="statContent">
                <div className="iconBox">
                  <span className="statIcon">{stat.icon}</span>
                </div>
                <div className="statText">
                  <p className="statTitle">{stat.title}</p>
                  <p className={`statValue ${stat.highlight ? 'rewardValue' : ''}`}>{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="statsPaginationControls">
            <button
              className="paginationBtn prevBtn"
              onClick={handlePrevious}
              aria-label="Previous stats"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="paginationIndicators">
              {Array.from({ length: totalPages }).map((_, index) => (
                <div
                  key={index}
                  className={`paginationDot ${currentPage === index ? 'active' : ''}`}
                  onClick={() => setCurrentPage(index)}
                />
              ))}
            </div>

            <button
              className="paginationBtn nextBtn"
              onClick={handleNext}
              aria-label="Next stats"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityTimelineSection({ aktivitas, loading, getActivityIcon, getActivityColor, formatActivityTitle }) {
  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading aktivitas...</div>;
  }

  if (aktivitas.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        Belum ada aktivitas
      </div>
    );
  }

  return (
    <div className="activitySection">
      <h3>Riwayat Aktivitas</h3>
      <div className="activityList">
        {aktivitas.slice(0, 10).map((akt, index) => (
          <div key={index} className={`activityItem ${getActivityColor(akt.tipe_aktivitas)}`}>
            <div className={`activityIcon ${getActivityColor(akt.tipe_aktivitas)}`}>
              {getActivityIcon(akt.tipe_aktivitas)}
            </div>
            <div className="activityContent">
              <p className="activityTitle">{formatActivityTitle(akt.tipe_aktivitas)}</p>
              <p className="activityDesc">{akt.deskripsi || 'Tidak ada deskripsi'}</p>
              <p className="activityTime">
                {new Date(akt.tanggal).toLocaleDateString('id-ID')}
                {akt.poin_perubahan && akt.poin_perubahan > 0 && (
                  <span style={{ color: '#4CAF50', marginLeft: '8px' }}>
                    +{akt.poin_perubahan} poin
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

