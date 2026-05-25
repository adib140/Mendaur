import React, { useState, useEffect } from "react";
import { Trophy, Scale, Medal, Clock, Calendar } from "lucide-react";
import { API_BASE_URL } from "../../../config/api";
import "./leaderboardHeader.css";

const LeaderboardHeader = () => {
  const [stats, setStats] = useState({
    poin: 0,
    sampah: 0,
    peringkat: '—',
    totalPeserta: 0,
    poinChange: 0,
    sampahChange: 0,
    seasonPoin: 0,
  });
  const [loading, setLoading] = useState(true);
  const [resetInfo, setResetInfo] = useState({
    nextReset: null,
    daysRemaining: 0,
    hoursRemaining: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('id_user');

        if (!token || !userId) {
          setStats({
            poin: 0,
            sampah: 0,
            peringkat: '—',
            totalPeserta: 0,
            poinChange: 0,
            sampahChange: 0,
            seasonPoin: 0,
          });
          setLoading(false);
          return;
        }

        // Calculate current season dates
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const seasonNumber = Math.floor(month / 3) + 1;
        const seasonStartMonth = (seasonNumber - 1) * 3;
        const seasonEndMonth = seasonStartMonth + 2;
        const seasonStart = new Date(year, seasonStartMonth, 1).toISOString().split('T')[0];
        const seasonEnd = new Date(year, seasonEndMonth + 1, 0).toISOString().split('T')[0];

        const leaderboardUrl = `${API_BASE_URL}/dashboard/leaderboard?period=season&start_date=${seasonStart}&end_date=${seasonEnd}`;

        const fetchWithTimeout = async (url, options, timeout = 15000) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          try {
            const response = await fetch(url, { 
              ...options, 
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
        };

        const [userStatsResponse, leaderboardResponse] = await Promise.allSettled([
          fetchWithTimeout(`${API_BASE_URL}/dashboard/stats/${userId}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }),
          fetchWithTimeout(leaderboardUrl, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }),
        ]);

        let userStatsData = null;
        let leaderboardData = null;

        if (userStatsResponse.status === 'fulfilled' && userStatsResponse.value.ok) {
          userStatsData = await userStatsResponse.value.json();
        }

        if (leaderboardResponse.status === 'fulfilled' && leaderboardResponse.value.ok) {
          leaderboardData = await leaderboardResponse.value.json();
        }

        let userPoints = 0;
        let userWaste = 0;
        let userRank = null;
        const currentUserId = parseInt(userId, 10);

        /* Ambil data dari user stats */
        if (userStatsData?.user) {
          userPoints = userStatsData.user.display_poin ?? userStatsData.user.poin_season ?? userStatsData.user.actual_poin ?? userStatsData.user.poin ?? 0;
          userWaste = userStatsData.user.total_sampah ?? userStatsData.user.total_setor_sampah ?? userStatsData.user.sampah ?? 0;
        } else if (userStatsData?.statistics) {
          userPoints = userStatsData.statistics.display_poin ?? userStatsData.statistics.poin_season ?? userStatsData.statistics.actual_poin ?? userStatsData.statistics.poin ?? 0;
          userWaste = userStatsData.statistics.total_sampah ?? userStatsData.statistics.total_setor_sampah ?? userStatsData.statistics.sampah ?? 0;
        } else if (userStatsData?.data) {
          userPoints = userStatsData.data.display_poin ?? userStatsData.data.poin_season ?? userStatsData.data.actual_poin ?? userStatsData.data.poin ?? 0;
          userWaste = userStatsData.data.total_sampah ?? userStatsData.data.total_setor_sampah ?? userStatsData.data.sampah ?? 0;
        }

        let leaderboard = [];
        if (leaderboardData?.data && Array.isArray(leaderboardData.data)) {
          leaderboard = leaderboardData.data;
        } else if (Array.isArray(leaderboardData)) {
          leaderboard = leaderboardData;
        }

        const totalPeserta = Array.isArray(leaderboard) ? leaderboard.length : 0;

        /* Cari rank user dari leaderboard */
        if (Array.isArray(leaderboard) && leaderboard.length > 0) {
          const userIndex = leaderboard.findIndex(user => {
            const leaderboardUserId = parseInt(user.user_id || user.id, 10);
            return leaderboardUserId === currentUserId;
          });

          if (userIndex !== -1) {
            const currentUser = leaderboard[userIndex];
            userRank = userIndex + 1; // Rank dimulai dari 1
            
            /* Ambil data dari leaderboard jika stats kosong */
            if (userPoints === 0) {
              userPoints = currentUser.display_poin ?? currentUser.poin_season ?? currentUser.actual_poin ?? currentUser.poin ?? 0;
            }
            if (userWaste === 0) {
              userWaste = currentUser.total_sampah ?? currentUser.total_setor_sampah ?? currentUser.sampah_terkumpul ?? 0;
            }
          }
        }

        const peringkat = userRank ? `#${userRank}` : '—';

        setStats({
          poin: userPoints,
          sampah: userWaste,
          peringkat,
          totalPeserta,
          poinChange: 50,
          sampahChange: 2.1,
          seasonPoin: userPoints,
        });
      } catch {
        setStats({
          poin: 0,
          sampah: 0,
          peringkat: '—',
          totalPeserta: 0,
          poinChange: 0,
          sampahChange: 0,
          seasonPoin: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const calculateResetInfo = () => {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
      const diff = nextMonth.getTime() - now.getTime();
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      setResetInfo({
        nextReset: nextMonth,
        daysRemaining: days,
        hoursRemaining: hours,
      });
    };
    
    calculateResetInfo();
    const interval = setInterval(calculateResetInfo, 1000 * 60);
    return () => clearInterval(interval);
  }, []);

  const formatResetDate = () => {
    if (!resetInfo.nextReset) return '—';
    return resetInfo.nextReset.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const statsCards = [
    {
      title: "Poinmu",
      value: loading ? "..." : stats.poin.toLocaleString('id-ID'),
      description: loading ? "Memuat..." : `+${stats.poinChange} dari kemarin`,
      icon: <Trophy size={20} />,
    },
    {
      title: "Capaian Sampahmu",
      value: loading ? "..." : `${stats.sampah.toLocaleString('id-ID')} Kg`,
      description: loading ? "Memuat..." : `+${stats.sampahChange} kg minggu ini`,
      icon: <Scale size={20} />,
    },
    {
      title: "Peringkatmu",
      value: loading ? "..." : stats.peringkat,
      description: loading ? "Memuat..." : `dari ${Number.isFinite(stats.totalPeserta) ? stats.totalPeserta.toLocaleString('id-ID') : 0} peserta`,
      icon: <Medal size={20} />,
    },
  ];

  return (
    <section className="leaderboard-header">
      <div className="user-info-header">
        <h2>Leaderboard</h2>
        <span>Lihat peringkat dan pencapaian Anda dibandingkan dengan anggota komunitas lainnya</span>
      </div>
      
      <div className="statsCardRow">
        {statsCards.map((stat, index) => (
          <div key={stat.title || index} className="infoCard">
            <div className="cardTop">
              <p className="cardTitle">{stat.title}</p>
              <div className="cardIcon">{stat.icon}</div>
            </div>
            <p className="cardValue">{stat.value}</p>
            <p className="cardDescription">{stat.description}</p>
          </div>
        ))}
      </div>

      <div className="resetBanner">
        <div className="resetIcon">
          <Clock size={20} />
        </div>
        <div className="resetContent">
          <div className="resetTitle">
            <Calendar size={16} />
            Waktu Reset Leaderboard
          </div>
          <p className="resetSubtitle">
            Leaderboard akan direset setiap awal bulan (tanggal 1) pukul 00:00 WIB
          </p>
          <div className="resetTags">
            <span className="resetTag">Reset Berikutnya: {formatResetDate()}</span>
            <span className="resetTag">Sisa Waktu: {resetInfo.daysRemaining} hari {resetInfo.hoursRemaining} jam</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeaderboardHeader;
