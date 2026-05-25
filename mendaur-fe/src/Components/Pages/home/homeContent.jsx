import { useEffect, useState, useCallback, useMemo, memo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Recycle, Trophy, Star, TrendingUp, Award, Activity, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ArtikelCard from "../../lib/artikel";
import Banner from "../../lib/banner";
import { API_BASE_URL } from "../../../config/api";
import { DashboardSkeleton } from "../../Loading/Skeleton";
import cache from "../../../utils/cache";
import "./homeContent.css";

// Memoized StatCard to prevent unnecessary re-renders
const StatCard = memo(function StatCard({ icon, title, value, color }) {
  return (
    <div className="statCard">
      <div className="statIcon" style={{ color }}>
        {icon}
      </div>
      <div className="statInfo">
        <p className="statTitle">{title}</p>
        <p className="statValue">{value}</p>
      </div>
    </div>
  );
});

const HomeContent = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(false);
  const lastFetchedUserId = useRef(null);

  // Memoize headers
  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }, []);

  // Optimized fetch with shorter timeout for non-critical endpoints
  const fetchWithTimeout = useCallback(async (url, timeout = 8000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { 
        headers: getHeaders(),
        credentials: 'include',  // ⚠️ WAJIB untuk Safari/iOS
        mode: 'cors',
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }, [getHeaders]);

  // Optimized fetch - ALL 6 API CALLS IN PARALLEL with caching
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    const userId = user?.user_id || localStorage.getItem('id_user');
    const token = localStorage.getItem('token');

    if (!token || !userId) {
      setLoading(false);
      return;
    }

    // Clear cache if user changed
    cache.clearUserCache(userId);

    // Force refresh if user changed since last fetch
    if (lastFetchedUserId.current !== userId) {
      forceRefresh = true;
      lastFetchedUserId.current = userId;
    }

    // Check cache first - instant load if available (skip if forceRefresh)
    const cachedStats = !forceRefresh ? cache.get(`stats-${userId}`) : null;
    const cachedLeaderboard = !forceRefresh ? cache.get('leaderboard') : null;
    const cachedBadges = !forceRefresh ? cache.get(`badges-${userId}`) : null;
    const cachedActivities = !forceRefresh ? cache.get(`activities-${userId}`) : null;

    if (cachedStats) setUserStats(cachedStats);
    if (cachedLeaderboard) setLeaderboard(cachedLeaderboard);
    if (cachedBadges) setUserBadges(cachedBadges);
    if (cachedActivities) setRecentActivities(cachedActivities);

    // If all cached, skip loading
    if (cachedStats && cachedLeaderboard && cachedBadges && cachedActivities) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // FETCH ALL 6 ENDPOINTS IN PARALLEL - much faster than sequential
      const [statsRes, leaderRes, badgesRes, tabungRes, redeemRes, withdrawRes] = await Promise.allSettled([
        !cachedStats ? fetchWithTimeout(`${API_BASE_URL}/dashboard/stats/${userId}`, 10000) : Promise.resolve(null),
        !cachedLeaderboard ? fetchWithTimeout(`${API_BASE_URL}/dashboard/leaderboard`, 10000) : Promise.resolve(null),
        !cachedBadges ? fetchWithTimeout(`${API_BASE_URL}/users/${userId}/badges-list?filter=unlocked`, 8000) : Promise.resolve(null),
        !cachedActivities ? fetchWithTimeout(`${API_BASE_URL}/setor-sampah/user/${userId}`, 6000) : Promise.resolve(null),
        !cachedActivities ? fetchWithTimeout(`${API_BASE_URL}/penukaran-produk/user/${userId}`, 6000) : Promise.resolve(null),
        !cachedActivities ? fetchWithTimeout(`${API_BASE_URL}/penarikan-tunai/user/${userId}`, 6000) : Promise.resolve(null),
      ]);

      // Process stats
      if (!cachedStats && statsRes.status === 'fulfilled' && statsRes.value?.ok) {
        const data = await statsRes.value.json();
        setUserStats(data.data);
        cache.set(`stats-${userId}`, data.data, 120000);
      }

      // Process leaderboard
      if (!cachedLeaderboard && leaderRes.status === 'fulfilled' && leaderRes.value?.ok) {
        const data = await leaderRes.value.json();
        setLeaderboard(data.data || []);
        cache.set('leaderboard', data.data || [], 60000);
      }

      // Process badges - map from badges-list API format
      if (!cachedBadges && badgesRes.status === 'fulfilled' && badgesRes.value?.ok) {
        const data = await badgesRes.value.json();
        const badges = (data.data || []).map(badge => ({
          ...badge,
          badge_id: badge.badge_id || badge.id,
          nama_badge: badge.nama || badge.nama_badge,
          reward_poin: badge.reward_poin || 0,
          icon: badge.icon || null,
        }));
        setUserBadges(badges);
        cache.set(`badges-${userId}`, badges, 300000);
      }

      // Process activities in parallel
      if (!cachedActivities) {
        const allActivities = [];

        if (tabungRes.status === 'fulfilled' && tabungRes.value?.ok) {
          const data = await tabungRes.value.json();
          (data.data || []).slice(0, 10).forEach((item, i) => {
            allActivities.push({
              id: `tabung-${item.setor_id || item.id || i}`,
              tipe_aktivitas: 'tabung_sampah',
              deskripsi: `Menabung ${item.berat_sampah || item.total_berat || 0} kg ${item.jenis_sampah?.nama_jenis || item.nama_jenis || 'sampah'}`,
              tanggal: item.tanggal_setor || item.created_at,
              poin_perubahan: item.poin_diperoleh || item.poin || 0,
            });
          });
        }

        if (redeemRes.status === 'fulfilled' && redeemRes.value?.ok) {
          const data = await redeemRes.value.json();
          (data.data || []).slice(0, 10).forEach((item, i) => {
            allActivities.push({
              id: `redeem-${item.penukaran_id || item.id || i}`,
              tipe_aktivitas: 'tukar_poin',
              deskripsi: `Menukar poin untuk ${item.produk?.nama_produk || item.nama_produk || 'produk'}`,
              tanggal: item.tanggal_penukaran || item.created_at,
              poin_perubahan: -(item.poin_digunakan || item.poin || 0),
            });
          });
        }

        if (withdrawRes.status === 'fulfilled' && withdrawRes.value?.ok) {
          const data = await withdrawRes.value.json();
          (data.data || []).slice(0, 10).forEach((item, i) => {
            allActivities.push({
              id: `withdraw-${item.penarikan_id || item.id || i}`,
              tipe_aktivitas: 'penarikan_tunai',
              deskripsi: `Penarikan tunai Rp ${(item.jumlah_rupiah || item.nominal || 0).toLocaleString('id-ID')}`,
              tanggal: item.tanggal_penarikan || item.created_at,
              poin_perubahan: -(item.poin_digunakan || 0),
            });
          });
        }

        allActivities.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        const recentActs = allActivities.slice(0, 5);
        setRecentActivities(recentActs);
        cache.set(`activities-${userId}`, recentActs, 60000);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id, fetchWithTimeout]);

  useEffect(() => {
    if (isAuthenticated && user?.user_id) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user?.user_id, fetchDashboardData]);

  // Refresh leaderboard with cache clear
  const refreshLeaderboard = useCallback(async () => {
    try {
      setLeaderboardLoading(true);
      setLeaderboardError(false);
      cache.clear('leaderboard');
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/dashboard/leaderboard`, 10000);
      
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.data || []);
        cache.set('leaderboard', data.data || [], 60000);
      } else {
        setLeaderboardError(true);
      }
    } catch {
      setLeaderboardError(true);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [fetchWithTimeout]);

  // Memoize current user ID
  const currentUserId = useMemo(() => user?.user_id || localStorage.getItem('id_user'), [user?.user_id]);

  // Memoize badge icon URL helper
  const getBadgeIconUrl = useCallback((icon) => {
    if (!icon) return null;
    if (/^\p{Emoji}/u.test(icon) || icon.length <= 4) return null;
    if (icon.startsWith('http')) return icon;
    if (!icon.includes('.') && !icon.includes('/')) return null;
    const cleanPath = icon.startsWith('storage/') ? icon : `storage/${icon}`;
    return `${API_BASE_URL}/${cleanPath}`;
  }, []);

  // Memoize leaderboard items
  const leaderboardItems = useMemo(() => {
    if (leaderboardError) {
      return (
        <div className="leaderboardError">
          <p>Gagal memuat leaderboard</p>
          <button onClick={refreshLeaderboard} className="retryBtn">Coba Lagi</button>
        </div>
      );
    }
    if (leaderboard.length === 0) {
      return <p className="emptyState">Belum ada data leaderboard</p>;
    }
    return leaderboard.slice(0, 6).map((leader, index) => {
      /* Fallback chain poin - prioritas: total_poin (dari API) > display_poin > actual_poin */
      const points = leader.total_poin ?? leader.display_poin ?? leader.poin_tercatat ?? leader.poin_season ?? leader.actual_poin ?? leader.poin ?? leader.points ?? 0;
      return (
        <div
          key={leader.user_id}
          className={`leaderboardItem ${leader.user_id == currentUserId ? 'currentUser' : ''}`}
        >
          <span className="leaderRank">#{index + 1}</span>
          <span className="leaderName">{leader.nama ?? leader.nama_user ?? leader.name ?? 'Unknown'}</span>
          <span className="leaderPoints">{points.toLocaleString('id-ID')} pts</span>
        </div>
      );
    });
  }, [leaderboard, leaderboardError, currentUserId, refreshLeaderboard]);

  // Memoize badge items
  const badgeItems = useMemo(() => {
    if (userBadges.length === 0) {
      return <p className="emptyState">Belum ada badge. Tabung sampah untuk mendapatkan badge!</p>;
    }
    return (
      <div className="badgesList">
        {userBadges.map((badge) => {
          const iconUrl = getBadgeIconUrl(badge.icon || badge.gambar || badge.icon_url);
          return (
            <div key={badge.badge_id || badge.id} className="badgeItem">
              <span className="badgeIcon">
                {iconUrl ? (
                  <img src={iconUrl} alt={badge.nama_badge || 'Badge'} className="badgeIconImg" loading="lazy"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                ) : null}
                <span style={{ display: iconUrl ? 'none' : 'block' }}>🏅</span>
              </span>
              <div className="badgeInfo">
                <p className="badgeName">{badge.nama_badge || badge.nama || 'Badge'}</p>
                <p className="badgeReward">+{badge.reward_poin || badge.poin || 0} poin</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [userBadges, getBadgeIconUrl]);

  // Memoize activity items
  const activityItems = useMemo(() => {
    if (recentActivities.length === 0) {
      return <p className="emptyState">Belum ada aktivitas</p>;
    }
    return (
      <div className="activityList">
        {recentActivities.map((activity, index) => (
          <div key={activity.id || `activity-${index}`} className="activityItem">
            <div className="activityIcon">
              {activity.tipe_aktivitas === 'tabung_sampah' || activity.tipe_aktivitas === 'setor_sampah' ? '♻️' :
               activity.tipe_aktivitas === 'tukar_poin' || activity.tipe_aktivitas === 'penukaran_produk' ? '🛍️' :
               activity.tipe_aktivitas === 'penarikan_tunai' || activity.tipe_aktivitas === 'tarik_tunai' ? '💰' : '📋'}
            </div>
            <div className="activityContent">
              <p className="activityDesc">{activity.deskripsi}</p>
              <p className="activityDate">
                {new Date(activity.tanggal || activity.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </p>
            </div>
            {activity.poin_perubahan !== 0 && activity.poin_perubahan !== undefined && (
              <span className={`activityPoints ${activity.poin_perubahan > 0 ? 'positive' : 'negative'}`}>
                {activity.poin_perubahan > 0 ? '+' : ''}{activity.poin_perubahan} poin
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }, [recentActivities]);

  if (!isAuthenticated) {
    return (
      <div className="homeContentWrapper">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2>Selamat Datang di Mendaur!</h2>
          <p style={{ margin: '20px 0', color: '#666' }}>
            Login untuk melihat statistik dan mengumpulkan poin
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '12px 32px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Login Sekarang
          </button>
        </div>

        <section className="bannerSection">
          <Banner />
        </section>

        <section className="artikelSection">
          <h2 className="artikelTitle">
            <Recycle size={20} style={{ marginRight: "8px" }} />
            Artikel Terbaru
          </h2>
          <div className="artikelGrid">
            <ArtikelCard fetchFromAPI={true} perPage={6} />
          </div>
        </section>
      </div>
    );
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="homeContentWrapper">
      {/* Welcome Section */}
      <section className="welcomeSection">
        <h1 className="welcomeTitle">Selamat Datang, {user.nama}!</h1>
        <p className="welcomeSubtitle">Mari kita kelola sampah dan kumpulkan poin hari ini</p>
      </section>

      <section className="bannerSection">
        <Banner />
      </section>

      {/* Stats Grid - using memoized StatCard */}
      <section className="statsSection">
        <div className="statsGrid">
          <StatCard
            icon={<Star />}
            title="Saldo Poin"
            value={userStats?.actual_poin ?? user.actual_poin ?? 0}
            color="#FFB800"
          />
          <StatCard
            icon={<Recycle />}
            title="Sampah Ditabung"
            value={`${userStats?.total_setor_sampah ?? userStats?.total_sampah ?? user.total_setor_sampah ?? 0} Kg`}
            color="#4CAF50"
          />
          <StatCard
            icon={<Award />}
            title="Badge"
            value={userBadges.length}
            color="#9C27B0"
          />
          <StatCard
            icon={<TrendingUp />}
            title="Peringkat"
            value={`#${userStats?.rank ?? userStats?.peringkat ?? ((leaderboard.findIndex(l => l.user_id == user?.user_id) + 1) || '-')}`}
            color="#2196F3"
          />
        </div>
      </section>

      {/* Leaderboard & Badges Row - using memoized items */}
      <div className="dashboardRow">
        <section className="leaderboardSection">
          <div className="sectionTitleWrapper">
            <h2 className="sectionTitle">
              <Trophy size={20} />
              Leaderboard
            </h2>
            <button 
              className="refreshBtn" 
              onClick={refreshLeaderboard}
              disabled={leaderboardLoading}
              title="Refresh leaderboard"
            >
              <RefreshCw size={16} className={leaderboardLoading ? 'spinning' : ''} />
            </button>
          </div>
          <div className="leaderboardList">
            {leaderboardItems}
          </div>
        </section>

        <section className="badgesSection">
          <h2 className="sectionTitle">
            <Award size={20} />
            Badges Anda ({userBadges.length})
          </h2>
          {badgeItems}
        </section>
      </div>

      {/* Recent Activity - using memoized items */}
      <section className="activitySection">
        <h2 className="sectionTitle">
          <Activity size={20} />
          Aktivitas Terbaru
        </h2>
        {activityItems}
      </section>

      {/* Articles Section */}
      <section className="artikelSection">
        <h2 className="artikelTitle">
          <Recycle size={20} style={{ marginRight: "8px" }} />
          Artikel Terbaru
        </h2>
        <div className="artikelGrid">
          <ArtikelCard fetchFromAPI={true} perPage={6} />
        </div>
      </section>
    </div>
  );
};

export default HomeContent;
