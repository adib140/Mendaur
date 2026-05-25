import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, TrendingUp, Clock, Calendar, Loader2, Trophy, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "../../../config/api";
import cache from "../../../utils/cache";
import "./leaderboardTable.css";
import Pagination from "../../ui/pagination";

// Tier calculation based on points
const getTier = (points, rank) => {
  if (rank === 1) return { name: 'Champion', class: 'champion' };
  if (rank === 2) return { name: 'Expert', class: 'expert' };
  if (rank === 3) return { name: 'Master', class: 'master' };
  if (points >= 50000) return { name: 'Pro', class: 'pro' };
  if (points >= 30000) return { name: 'Advanced', class: 'advanced' };
  if (points >= 10000) return { name: 'Intermediate', class: 'intermediate' };
  return { name: 'Beginner', class: 'beginner' };
};

// Get initials from name
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export default function LeaderboardTable() {
  // State Management
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [timePeriod, setTimePeriod] = useState("season"); // season, monthly, weekly, all
  const [seasonInfo, setSeasonInfo] = useState(null);
  const itemsPerPage = 10;

  // Get current user ID
  const currentUserId = localStorage.getItem('id_user');

  // Calculate current season info (example: quarterly seasons)
  useEffect(() => {
    const calculateSeasonInfo = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth(); // 0-11
      
      // Define seasons (quarterly - adjust as needed)
      const seasonNumber = Math.floor(month / 3) + 1;
      const seasonStartMonth = (seasonNumber - 1) * 3;
      const seasonEndMonth = seasonStartMonth + 2;
      
      const seasonStart = new Date(year, seasonStartMonth, 1);
      const seasonEnd = new Date(year, seasonEndMonth + 1, 0, 23, 59, 59);
      
      const timeRemaining = seasonEnd.getTime() - now.getTime();
      const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
      const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      const seasonNames = ['Musim Semi', 'Musim Panas', 'Musim Gugur', 'Musim Dingin'];
      
      setSeasonInfo({
        name: `Season ${seasonNumber} ${year}`,
        displayName: seasonNames[seasonNumber - 1],
        number: seasonNumber,
        year,
        startDate: seasonStart.toISOString().split('T')[0],
        endDate: seasonEnd.toISOString().split('T')[0],
        startFormatted: seasonStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        endFormatted: seasonEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        daysRemaining,
        hoursRemaining,
        isEnding: daysRemaining <= 7,
      });
    };
    
    calculateSeasonInfo();
    const interval = setInterval(calculateSeasonInfo, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, []);

  // Fetch leaderboard data with caching
  const fetchLeaderboard = useCallback(async (forceRefresh = false) => {
    const cacheKey = `leaderboard-${timePeriod}`;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) {
        setLeaderboardData(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Anda harus login untuk melihat leaderboard');
      }

      let url = `${API_BASE_URL}/dashboard/leaderboard`;
      const params = new URLSearchParams();
      
      if (timePeriod !== 'all') {
        params.append('period', timePeriod);
      }
      
      if (timePeriod === 'season' && seasonInfo) {
        params.append('start_date', seasonInfo.startDate);
        params.append('end_date', seasonInfo.endDate);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',  // ⚠️ WAJIB untuk Safari/iOS
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Gagal mengambil data leaderboard');
      }

      const result = await response.json();
      const data = result.data || result.leaderboard || result;

      // DEBUG: Log struktur data dari API (hapus setelah debug selesai)
      if (Array.isArray(data) && data.length > 0) {
        console.log('Leaderboard API response sample:', {
          firstUser: data[0],
          availableFields: Object.keys(data[0])
        });
      }

      if (Array.isArray(data)) {
        setLeaderboardData(data);
        // Cache for 1 minute
        cache.set(cacheKey, data, 60000);
      } else {
        throw new Error('Format data leaderboard tidak valid');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timeout - server lambat merespons');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [timePeriod, seasonInfo]);

  // Fetch on mount and when period changes
  useEffect(() => {
    if (seasonInfo || timePeriod !== 'season') {
      fetchLeaderboard();
    }
  }, [timePeriod, seasonInfo, fetchLeaderboard]);

  // Listen for leaderboard reset events from admin
  useEffect(() => {
    const handleLeaderboardReset = () => {
      console.log('Leaderboard reset detected, clearing cache and refreshing...');
      // Clear all leaderboard cache entries
      cache.clear(`leaderboard-season`);
      cache.clear(`leaderboard-monthly`);
      cache.clear(`leaderboard-weekly`);
      cache.clear(`leaderboard-all`);
      cache.clear('leaderboard');
      // Force refresh
      fetchLeaderboard(true);
    };

    window.addEventListener('leaderboard-reset', handleLeaderboardReset);

    // Also check localStorage for reset timestamp on mount
    const lastReset = localStorage.getItem('leaderboard_last_reset');
    const lastCheck = sessionStorage.getItem('leaderboard_last_check');
    if (lastReset && lastReset !== lastCheck) {
      sessionStorage.setItem('leaderboard_last_check', lastReset);
      handleLeaderboardReset();
    }

    return () => {
      window.removeEventListener('leaderboard-reset', handleLeaderboardReset);
    };
  }, [fetchLeaderboard]);

  // Filter and search logic
  const filteredUsers = useMemo(() => {
    let filtered = [...leaderboardData];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(user =>
        (user.nama || user.nama_user || user.name || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    // Sort by points (backend should do this, but ensure it's sorted)
    filtered.sort((a, b) => {
      // Prioritas: total_poin (dari API) > display_poin > poin_tercatat > actual_poin
      const pointsA = a.total_poin ?? a.display_poin ?? a.poin_tercatat ?? a.poin_season ?? a.actual_poin ?? a.poin ?? a.points ?? 0;
      const pointsB = b.total_poin ?? b.display_poin ?? b.poin_tercatat ?? b.poin_season ?? b.actual_poin ?? b.poin ?? b.points ?? 0;
      return pointsB - pointsA;
    });

    return filtered;
  }, [leaderboardData, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Time period filter buttons
  const timePeriods = [
    { value: 'season', label: 'Season', icon: <Trophy size={16} /> },
    { value: 'monthly', label: 'Bulan Ini', icon: <Calendar size={16} /> },
    { value: 'weekly', label: 'Minggu Ini', icon: <Clock size={16} /> },
    { value: 'all', label: 'Semua', icon: <TrendingUp size={16} /> },
  ];

  // Refresh handler - clear cache and re-fetch
  const handleRefresh = useCallback(() => {
    cache.clear(`leaderboard-${timePeriod}`);
    fetchLeaderboard(true);
  }, [timePeriod, fetchLeaderboard]);

  return (
    <section className="leaderboardContainer">
      <div className="leaderboardHeader">
        <div className="titleRow">
          <Trophy size={20} className="titleIcon" />
          <h1 className="leaderboardTitle">Leaderboard</h1>
          <button className="refreshButton" onClick={handleRefresh} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>
        </div>

        {/* Time Period Filters */}
        <div className="timePeriodFilters">
          {timePeriods.map(period => (
            <button
              key={period.value}
              className={`periodButton ${timePeriod === period.value ? 'active' : ''}`}
              onClick={() => setTimePeriod(period.value)}
            >
              {period.icon}
              <span>{period.label}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="searchBarContainer">
          <Search className="searchIcon" size={18} />
          <input
            type="text"
            className="searchInput"
            placeholder="Cari pengguna..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clearSearch"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loadingContainer">
          <Loader2 className="spinner" size={36} />
          <p>Memuat leaderboard...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="errorContainer">
          <p className="errorMessage">❌ {error}</p>
          <button className="retryButton" onClick={handleRefresh}>
            Coba Lagi
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredUsers.length === 0 && (
        <div className="emptyContainer">
          <p className="emptyMessage">
            {searchQuery
              ? `Tidak ada pengguna dengan nama "${searchQuery}"`
              : 'Belum ada data leaderboard'}
          </p>
        </div>
      )}

      {/* Leaderboard Cards */}
      {!loading && !error && filteredUsers.length > 0 && (
        <>
          <div className="leaderboardCardList">
            {currentUsers.map((user, index) => {
              const globalIndex = startIndex + index;
              const isCurrentUser = String(user.user_id) === String(currentUserId);
              const userName = user.nama || user.nama_user || user.name || 'Unknown';
              /* Fallback chain untuk sampah - total_setor_sampah adalah field dari API (string) */
              const userWaste = parseFloat(user.total_setor_sampah) || parseFloat(user.total_sampah) || 
                                parseFloat(user.sampah_terkumpul) || parseFloat(user.waste_collected) || 0;
              /* Fallback chain untuk poin - prioritas: total_poin (dari API) > display_poin > actual_poin */
              const userPoints = user.total_poin ?? user.display_poin ?? user.poin_tercatat ?? user.poin_season ?? user.actual_poin ?? user.poin ?? user.points ?? 0;

              const rankEmoji = globalIndex === 0 ? '🥇' : globalIndex === 1 ? '🥈' : globalIndex === 2 ? '🥉' : null;
              const rankClass = globalIndex === 0 ? 'gold' : globalIndex === 1 ? 'silver' : globalIndex === 2 ? 'bronze' : '';
              const tier = getTier(userPoints, globalIndex + 1);
              const initials = getInitials(userName);

              return (
                <div 
                  key={user.user_id || `user-${globalIndex}`} 
                  className={`leaderboardCard ${rankClass} ${isCurrentUser ? 'currentUser' : ''}`}
                >
                  <div className="cardRank">
                    {rankEmoji || <span className="rankNumber">#{globalIndex + 1}</span>}
                  </div>
                  <div className="cardAvatar">{initials}</div>
                  <div className="cardContent">
                    <div className="cardInfo">
                      <div className="cardName">
                        {userName}
                        {isCurrentUser && <span className="youBadge">Anda</span>}
                      </div>
                      <span className={`tierBadge ${tier.class}`}>{tier.name}</span>
                    </div>
                    <div className="cardStats">
                      <div className="cardWaste">
                        <span className="statLabel">Sampah</span>
                        <span className="statValue">{userWaste.toLocaleString('id-ID')} Kg</span>
                      </div>
                      <div className="cardPoints">
                        <span className="statLabel">Poin</span>
                        <span className="statValue">{userPoints.toLocaleString('id-ID')} poin</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="paginationInfo">
            Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)} dari {filteredUsers.length} pengguna
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            onNext={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          />
        </>
      )}
    </section>
  );
}
