import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Loader, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "../../../config/api";
import "./jadwalTabungSampah.css";

export default function JadwalTabungSampah({ onSelect, showSelection = false }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeSchedule, setActiveSchedule] = useState(null);

  // Fetch schedules from backend
  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("id_user");

        // Both modes fetch from same endpoint, filter on frontend
        const endpoint = `${API_BASE_URL}/jadwal-penyetoran`;

        const headers = {
          Accept: "application/json",
        };

        // For viewing mode (pickup), need auth - fetch user's schedules
        if (!showSelection) {
          if (!token || !userId) {
            throw new Error("Authentication required");
          }
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(endpoint, { headers });

        if (!response.ok) {
          throw new Error("Failed to fetch schedules");
        }

        const result = await response.json();
        let data = result.data || result || [];

        // Normalization: map new API structure to expected shape
        // New structure: { hari, waktu_mulai, waktu_selesai, lokasi, status: "Buka"/"Tutup" }
        const normalized = (Array.isArray(data) ? data : []).map((item, index) => {
          return {
            jadwal_penyetoran_id: item.jadwal_penyetoran_id || item.id || item._id || index,
            // Status: "Buka" or "Tutup" (capitalize first letter from backend)
            status: item.status || "Buka",
            // Hari replaces tanggal
            hari: item.hari || item.tanggal || item.day || "-",
            // Time fields
            waktu_mulai: item.waktu_mulai || item.start_time || null,
            waktu_selesai: item.waktu_selesai || item.end_time || null,
            // Lokasi
            lokasi: item.lokasi || item.alamat || item.location || null,
          };
        });

        // For selection mode, filter only "Buka" schedules
        if (showSelection) {
          const activeStatuses = ['buka', 'aktif', 'active', 'available', 'open'];
          data = normalized.filter(s => activeStatuses.includes((s.status || '').toLowerCase()));
        } else {
          data = normalized;
        }

        setSchedules(data);
      } catch (err) {
        console.error("Error fetching schedules:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [refreshTrigger, showSelection]);

  const handleScheduleSelect = (scheduleId) => {
    if (activeSchedule === scheduleId) {
      setActiveSchedule(null);
      if (onSelect) onSelect(null);
    } else {
      setActiveSchedule(scheduleId);
      if (onSelect) onSelect(scheduleId);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    return timeString.substring(0, 5); // HH:MM
  };

  return (
    <div className="jadwalCardWrapper">
      {/* Header */}
      <div className="jadwalHeader">
        <div>
          <p className="jadwalCardTitle">
            {showSelection ? " Pilih Jadwal Tabung Sampah" : " Jadwal Pengambilan Sampah"}
          </p>
          <p className="jadwalSubtitle">
            {showSelection
              ? "Pilih jadwal untuk menabung sampah Anda"
              : "Lihat jadwal pengambilan sampah Anda (Penjadwalan diatur oleh admin)"}
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="jadwalLoading">
          <Loader className="spinner" size={36} />
          <p>Memuat jadwal...</p>
        </div>
      ) : error ? (
        <div className="jadwalError">
          <AlertCircle size={36} />
          <p>Gagal memuat jadwal</p>
          <span>{error}</span>
          <button className="btnRetry" onClick={handleRefresh}>
            Coba Lagi
          </button>
        </div>
      ) : schedules.length === 0 ? (
        <div className="jadwalEmpty">
          <Calendar size={52} />
          <h4>Belum ada jadwal</h4>
          <p>Jadwal pengambilan akan ditampilkan di sini setelah admin mengatur jadwal untuk Anda</p>
        </div>
      ) : (
        <div className="jadwalCardGrid">
          {schedules.map((schedule) => {
            const isActive = showSelection && activeSchedule === schedule.jadwal_penyetoran_id;
            const isClosed = schedule.status?.toLowerCase() === 'tutup' || schedule.status?.toLowerCase() === 'closed';
            return (
              <div
                key={schedule.jadwal_penyetoran_id}
                className={`jadwalCardItem ${isActive ? "active" : ""} ${showSelection ? "selectable" : ""} ${isClosed ? "closed" : ""}`}
                style={isClosed ? { opacity: 0.5, pointerEvents: showSelection ? 'none' : 'auto' } : {}}
                onClick={() => showSelection && !isClosed && handleScheduleSelect(schedule.jadwal_penyetoran_id)}
              >
                <div className="jadwalCardTop">
                  <div className="cardTitleSection">
                    <Calendar size={18} />
                    <h4>{schedule.hari || "-"}</h4>
                  </div>
                  {showSelection ? (
                    isClosed ? (
                      <span className="closedBadge" style={{ color: '#ef4444', fontSize: '12px', fontWeight: '500' }}>Tutup</span>
                    ) : (
                      isActive && <span className="activeBadge">✓ Dipilih</span>
                    )
                  ) : (
                    <div className={`status-badge ${schedule.status?.toLowerCase() === 'buka' ? 'success' : 'rejected'}`}>
                      {schedule.status?.toLowerCase() === 'buka' ? (
                        <CheckCircle size={16} className="status-icon success" />
                      ) : (
                        <XCircle size={16} className="status-icon rejected" />
                      )}
                      <span>{schedule.status || "Buka"}</span>
                    </div>
                  )}
                </div>

                <div className="jadwalCardBody">
                  <div className="infoRow">
                    <Clock size={14} />
                    <span>
                      {schedule.waktu_mulai && schedule.waktu_selesai
                        ? `${formatTime(schedule.waktu_mulai)} - ${formatTime(schedule.waktu_selesai)}`
                        : "-"}
                    </span>
                  </div>

                  <div className="infoRow">
                    <MapPin size={14} />
                    <span>{schedule.lokasi || "-"}</span>
                  </div>
                </div>

                {showSelection && (
                  <button
                    className={`selectButton ${isActive ? "selected" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScheduleSelect(schedule.jadwal_penyetoran_id);
                    }}
                  >
                    {isActive ? "✓ Dipilih" : "Pilih Jadwal"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
