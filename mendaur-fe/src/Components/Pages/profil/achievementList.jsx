import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { apiGet } from "../../../services/api";
import cache from "../../../utils/cache";
import "./achievementList.css";
import {
  Medal,
  Star,
  Users,
  CheckCircle,
  Lock,
  Recycle,
  Trophy,
  Target,
  Zap,
} from "lucide-react";

const CACHE_TTL = {
  BADGES: 5 * 60 * 1000,        // 5 minutes - increased for better offline support
  TOTAL_REWARDS: 10 * 60 * 1000, // 10 minutes
};

// Icon mapping by badge type
const iconMapByType = {
  "tabung_sampah": <Recycle size={40} className="badgeIcon" />,
  "setor_sampah": <Recycle size={40} className="badgeIcon" />,
  "poin": <Star size={40} className="badgeIcon" />,
  "leaderboard": <Trophy size={40} className="badgeIcon" />,
  "konsistensi": <Target size={40} className="badgeIcon" />,
  "general": <Medal size={40} className="badgeIcon" />,
};

// Icon mapping by badge ID (fallback)
const iconMap = {
  "badge-001": <Medal size={40} className="badgeIcon" />,
  "badge-002": <Star size={40} className="badgeIcon" />,
  "badge-003": <Users size={40} className="badgeIcon" />,
};

// Badge card
function BadgeCard({ badge }) {
  const isUnlocked = badge.isUnlocked;
  // Use progressPercent from API if available, otherwise calculate it
  const progressPercent = badge.progressPercent !== undefined
    ? badge.progressPercent
    : (badge.target > 0 ? Math.min((badge.progress / badge.target) * 100, 100) : 0);

  // Choose icon based on badge type, ID, or default
  const getIcon = () => {
    if (isUnlocked) {
      return <CheckCircle size={40} className="badgeIcon complete" />;
    }
    // Try badge type first
    if (badge.tipe && iconMapByType[badge.tipe]) {
      return iconMapByType[badge.tipe];
    }
    // Try badge ID
    if (badge.id_badge && iconMap[badge.id_badge]) {
      return iconMap[badge.id_badge];
    }
    // Default locked icon
    return <Lock size={40} className="badgeIcon" />;
  };

  const icon = getIcon();

  return (
    <div className={`achievementCard ${isUnlocked ? "unlocked" : "locked"}`}>
      <div className="achievementThumbnail">
        {badge.icon ? (
          <span className="badgeEmojiIcon">{badge.icon}</span>
        ) : (
          <div className="thumbnailIcon">{icon}</div>
        )}
      </div>

      <div className="achievementContent">
        <h3 className="achievementTitle">{badge.nama_badge}</h3>
        <p className="achievementDesc">{badge.deskripsi || 'Raih badge ini!'}</p>

        {/* Reward Points Display */}
        <div className="badgeRewardSection">
          <span className="rewardLabel">
            <Star size={12} style={{ marginRight: '4px' }} />
            Reward:
          </span>
          <span className="rewardPoints">+{badge.reward_poin || 0} Poin</span>
        </div>

        <div className="achievementTags">
          <span className="badgeTag">{badge.kategori?.toUpperCase() || 'BADGE'}</span>
          <span className="badgeTag">• {isUnlocked ? "UNLOCKED" : "LOCKED"}</span>
        </div>

        {!isUnlocked && badge.target > 0 && (
          <>
            <div className="progressBar">
              <div className="progressFill" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <p className="progressText">
              {badge.progress} / {badge.target} {badge.requirement_type === 'poin' ? 'poin' : 'tabung'}
            </p>
          </>
        )}

        {isUnlocked && badge.unlocked_at && (
          <p className="unlockedDate">
            Didapat: {new Date(badge.unlocked_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </p>
        )}
      </div>
    </div>
  );
}

// Main component
export default function AchievementList({ cachedData, onDataLoaded }) {
  const { user } = useAuth();
  const [allBadges, setAllBadges] = useState(cachedData?.badges || []);
  // eslint-disable-next-line no-unused-vars
  const [userBadges, setUserBadges] = useState(cachedData?.userBadges || []);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(!cachedData);
  const [initialLoading, setInitialLoading] = useState(!cachedData); // Loading awal saja
  const [counts, setCounts] = useState(cachedData?.counts || { all: 0, unlocked: 0, locked: 0 });
  const [message, setMessage] = useState(cachedData?.message || "");
  const [totalRewardsEarned, setTotalRewardsEarned] = useState(0);
  const [totalPossibleRewards, setTotalPossibleRewards] = useState(0);

  // Check for user change (clear stale cache)
  useEffect(() => {
    cache.checkUserChange(user?.user_id);
  }, [user?.user_id]);

  const fetchTotalRewards = useCallback(async () => {
    if (!user?.user_id) return;
    
    const cacheKey = `achievement_total_rewards_${user.user_id}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      setTotalRewardsEarned(cached.earned);
      setTotalPossibleRewards(cached.possible);
      return;
    }

    try {
      const result = await apiGet(`/users/${user.user_id}/badges-list?filter=all`);

      if (result.status === 'success') {
        const badges = result.data || [];

        const earned = badges
          .filter(b => b.is_unlocked)
          .reduce((sum, badge) => sum + (badge.reward_poin || 0), 0);

        const possible = badges
          .reduce((sum, badge) => sum + (badge.reward_poin || 0), 0);

        setTotalRewardsEarned(earned);
        setTotalPossibleRewards(possible);
        cache.set(cacheKey, { earned, possible }, CACHE_TTL.TOTAL_REWARDS);
      }
    } catch {
      setTotalRewardsEarned(110);
      setTotalPossibleRewards(435);
    }
  }, [user?.user_id]);

  const fetchBadges = useCallback(async () => {
    if (!user?.user_id) return;
    
    const cacheKey = `achievement_badges_${user.user_id}_${filter}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      setAllBadges(cached.badges);
      setUserBadges(cached.userBadges);
      setCounts(cached.counts);
      setMessage(cached.message);
      setLoading(false);
      setInitialLoading(false);
      // Notify parent of loaded data
      if (onDataLoaded) {
        onDataLoaded(cached);
      }
      return;
    }

    try {
      setLoading(true);

      const result = await apiGet(`/users/${user.user_id}/badges-list?filter=${filter}`);

      if (result.status === 'success') {
        const badges = result.data || [];

        if (result.counts) {
          setCounts(result.counts);
        }

        if (result.message) {
          setMessage(result.message);
        }

        const badgesWithStatus = badges.map(badge => ({
          ...badge,
          badge_id: badge.badge_id || badge.id,
          nama_badge: badge.nama,
          icon: badge.icon || null,
          isUnlocked: badge.is_unlocked,
          unlocked_at: badge.unlocked_at,
          progress: badge.current_value || 0,
          target: badge.target_value || 0,
          progressPercent: badge.progress_percentage || 0,
          requirement_type: badge.syarat_poin > 0 ? 'poin' : 'tabung',
          kategori: badge.tipe || 'general',
          reward_poin: badge.reward_poin || 0
        }));

        setAllBadges(badgesWithStatus);
        const unlockedBadges = badges.filter(b => b.is_unlocked);
        setUserBadges(unlockedBadges);
        
        // Cache the processed data
        const cacheData = {
          badges: badgesWithStatus,
          userBadges: unlockedBadges,
          counts: result.counts || counts,
          message: result.message || ''
        };
        cache.set(cacheKey, cacheData, CACHE_TTL.BADGES);
        
        // Notify parent of loaded data
        if (onDataLoaded) {
          onDataLoaded(cacheData);
        }
      }
    } catch {
      // Use expanded mock data when API is not available
      const mockBadges = [
        {
          badge_id: 'mock-1',
          nama_badge: 'Badge Awal',
          deskripsi: 'Badge pertama untuk memulai perjalanan',
          isUnlocked: true,
          progress: 1,
          target: 1,
          progressPercent: 100,
          reward_poin: 10,
          tipe: 'general',
          unlocked_at: '2024-12-01'
        },
        {
          badge_id: 'mock-2',
          nama_badge: 'Pengumpul Sampah',
          deskripsi: 'Kumpulkan 5kg sampah plastik',
          isUnlocked: false,
          progress: 2.5,
          target: 5,
          progressPercent: 50,
          reward_poin: 50,
          tipe: 'tabung_sampah'
        },
        {
          badge_id: 'mock-3',
          nama_badge: 'Konsisten Tabung',
          deskripsi: 'Tabung sampah 7 hari berturut-turut',
          isUnlocked: false,
          progress: 3,
          target: 7,
          progressPercent: 43,
          reward_poin: 75,
          tipe: 'konsistensi'
        },
        {
          badge_id: 'mock-4',
          nama_badge: 'Kolektor Poin',
          deskripsi: 'Kumpulkan 1000 poin',
          isUnlocked: true,
          progress: 1250,
          target: 1000,
          progressPercent: 100,
          reward_poin: 100,
          tipe: 'poin',
          unlocked_at: '2024-12-15'
        },
        {
          badge_id: 'mock-5',
          nama_badge: 'Top Performer',
          deskripsi: 'Masuk 3 besar leaderboard',
          isUnlocked: false,
          progress: 5,
          target: 3,
          progressPercent: 0,
          reward_poin: 200,
          tipe: 'leaderboard'
        }
      ];
      
      setAllBadges(mockBadges);
      setUserBadges(mockBadges.filter(b => b.isUnlocked));
      setCounts({ all: 5, unlocked: 2, locked: 3 });
      setMessage('Menggunakan data simulasi - API sedang bermasalah');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id, filter, counts]);

  // Fetch badges when user or filter changes
  useEffect(() => {
    if (user?.user_id) {
      fetchBadges();
    }
  }, [user?.user_id, filter, fetchBadges]);

  // Fetch total rewards on mount
  useEffect(() => {
    if (user?.user_id) {
      fetchTotalRewards();
    }
  }, [user?.user_id, fetchTotalRewards]);

  // Hanya tampilkan loading penuh saat pertama kali load
  if (initialLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading badges...</div>;
  }

  return (
    <>
      {/* Badge Rewards Summary - Selalu tampil */}
      {counts.all > 0 && (
        <div className="badgeRewardsSummary">
          <div className="rewardsSummaryCard">
            <div className="summaryIcon">🏆</div>
            <div className="summaryContent">
              <h3 className="summaryTitle">Total Badge Rewards</h3>
              <p className="summaryValue">
                <span className="earnedPoints">{totalRewardsEarned}</span>
                <span className="totalPoints"> / {totalPossibleRewards} Poin</span>
              </p>
              <div className="summaryProgressBar">
                <div
                  className="summaryProgressFill"
                  style={{ width: `${totalPossibleRewards > 0 ? (totalRewardsEarned / totalPossibleRewards) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="summarySubtext">
                {counts.unlocked} dari {counts.all} badge terkumpul
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="badgeFilter">
        <button
          className={`filterButton ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          <span className="filterIcon">📋</span>
          <span className="filterText">
            <span className="filterLabel">Semua Badge</span>
            <span className="filterCount">{counts.all}</span>
          </span>
        </button>

        <button
          className={`filterButton ${filter === "unlocked" ? "active" : ""}`}
          onClick={() => setFilter("unlocked")}
        >
          <span className="filterIcon">✅</span>
          <span className="filterText">
            <span className="filterLabel">Sudah Didapat</span>
            <span className="filterCount">{counts.unlocked}</span>
          </span>
        </button>

        <button
          className={`filterButton ${filter === "locked" ? "active" : ""}`}
          onClick={() => setFilter("locked")}
        >
          <span className="filterIcon">🔒</span>
          <span className="filterText">
            <span className="filterLabel">Belum Didapat</span>
            <span className="filterCount">{counts.locked}</span>
          </span>
        </button>
      </div>

      {/* Results count - Use message from API if available */}
      <div className="filterResults">
        <p className="resultsText">
          {message || `Menampilkan ${allBadges.length} badge`}
        </p>
      </div>

      {/* Badge List - Loading state hanya untuk cards */}
      <div className="achievementList">
        {loading ? (
          <div className="badgeCardsLoading">
            <div className="loadingSpinner"></div>
            <p>Memuat badge...</p>
          </div>
        ) : allBadges.length === 0 ? (
          <div className="emptyState">
            <div className="emptyIcon">
              {filter === 'unlocked' ? '🎯' : filter === 'locked' ? '🎉' : '🔍'}
            </div>
            <p className="emptyTitle">
              {filter === 'unlocked'
                ? 'Belum ada badge yang didapat'
                : filter === 'locked'
                ? 'Semua badge sudah didapat!'
                : 'Tidak ada badge tersedia'}
            </p>
            <p className="emptySubtext">
              {filter === 'unlocked'
                ? 'Mulai tabung sampah untuk mendapatkan badge pertamamu!'
                : filter === 'locked'
                ? 'Selamat! Kamu sudah mengumpulkan semua badge! 🎊'
                : 'Badge akan muncul di sini'}
            </p>
          </div>
        ) : (
          allBadges.map((badge, index) => (
            <BadgeCard key={badge.badge_id || `badge-${index}`} badge={badge} />
          ))
        )}
      </div>
    </>
  );
}
