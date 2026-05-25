import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Plus, Filter, AlertCircle, CheckCircle, XCircle, Loader } from "lucide-react";
import { API_BASE_URL } from "../../../config/api";
import CalendarView from "./CalendarView";
import BookingModal from "./BookingModal";
import LocationManager from "./LocationManager";
import "./jadwalPengambilan.css";

const JadwalPengambilan = () => {
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("semua");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showLocationManager, setShowLocationManager] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // list or calendar
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch schedules from backend
  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("id_user");

        if (!token || !userId) {
          throw new Error("Authentication required");
        }

        const response = await fetch(`${API_BASE_URL}/jadwal-penyetoran`, {
          credentials: 'include',  // ⚠️ WAJIB untuk Safari/iOS
          mode: 'cors',
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch schedules");
        }

        const result = await response.json();
        const data = result.data || result || [];
        setSchedules(data);
        setFilteredSchedules(data);
      } catch (err) {
        console.error("Error fetching schedules:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [refreshTrigger]);

  // Filter schedules by status
  useEffect(() => {
    if (selectedStatus === "semua") {
      setFilteredSchedules(schedules);
    } else {
      const filtered = schedules.filter(
        (schedule) => schedule.status?.toLowerCase() === selectedStatus.toLowerCase()
      );
      setFilteredSchedules(filtered);
    }
  }, [selectedStatus, schedules]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case "selesai":
      case "approved":
        return <CheckCircle size={18} className="status-icon success" />;
      case "pending":
      case "dijadwalkan":
        return <Clock size={18} className="status-icon pending" />;
      case "dibatalkan":
      case "rejected":
        return <XCircle size={18} className="status-icon rejected" />;
      default:
        return <AlertCircle size={18} className="status-icon default" />;
    }
  };

  const getStatusClass = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case "selesai":
      case "approved":
        return "status-badge success";
      case "pending":
      case "dijadwalkan":
        return "status-badge pending";
      case "dibatalkan":
      case "rejected":
        return "status-badge rejected";
      default:
        return "status-badge default";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    return timeString.substring(0, 5); // HH:MM
  };

  return (
    <div className="jadwal-pengambilan-container">
      {/* Header */}
      <div className="jadwal-header">
        <div className="header-content">
          <h1>📅 Jadwal Pengambilan</h1>
          <p>Kelola jadwal pengambilan sampah Anda dengan mudah</p>
        </div>
        <div className="header-actions">
          <button
            className="btn-location"
            onClick={() => setShowLocationManager(true)}
            title="Kelola Lokasi"
          >
            <MapPin size={18} />
            <span>Lokasi</span>
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowBookingModal(true)}
          >
            <Plus size={18} />
            <span>Jadwalkan Pickup</span>
          </button>
        </div>
      </div>

      {/* View Toggle & Filters */}
      <div className="controls-section">
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            <Filter size={16} />
            List
          </button>
          <button
            className={`toggle-btn ${viewMode === "calendar" ? "active" : ""}`}
            onClick={() => setViewMode("calendar")}
          >
            <Calendar size={16} />
            Kalender
          </button>
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${selectedStatus === "semua" ? "active" : ""}`}
            onClick={() => setSelectedStatus("semua")}
          >
            Semua
          </button>
          <button
            className={`filter-btn ${selectedStatus === "pending" ? "active" : ""}`}
            onClick={() => setSelectedStatus("pending")}
          >
            Pending
          </button>
          <button
            className={`filter-btn ${selectedStatus === "dijadwalkan" ? "active" : ""}`}
            onClick={() => setSelectedStatus("dijadwalkan")}
          >
            Dijadwalkan
          </button>
          <button
            className={`filter-btn ${selectedStatus === "selesai" ? "active" : ""}`}
            onClick={() => setSelectedStatus("selesai")}
          >
            Selesai
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="jadwal-content">
        {loading ? (
          <div className="loading-state">
            <Loader className="spinner" size={40} />
            <p>Memuat jadwal...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={40} />
            <p>Gagal memuat jadwal</p>
            <span>{error}</span>
            <button className="btn-retry" onClick={handleRefresh}>
              Coba Lagi
            </button>
          </div>
        ) : viewMode === "calendar" ? (
          <CalendarView schedules={filteredSchedules} onRefresh={handleRefresh} />
        ) : filteredSchedules.length === 0 ? (
          <div className="empty-state">
            <Calendar size={60} />
            <h3>Belum ada jadwal</h3>
            <p>Jadwalkan pengambilan sampah Anda sekarang</p>
            <button
              className="btn-primary"
              onClick={() => setShowBookingModal(true)}
            >
              <Plus size={18} />
              Buat Jadwal Baru
            </button>
          </div>
        ) : (
          <div className="schedules-list">
            {filteredSchedules.map((schedule) => (
              <div key={schedule.jadwal_penyetoran_id} className="schedule-card">
                <div className="card-header">
                  <div className="card-title">
                    <Calendar size={20} />
                    <h3>{schedule.hari || formatDate(schedule.tanggal)}</h3>
                  </div>
                  <div className={getStatusClass(schedule.status)}>
                    {getStatusIcon(schedule.status)}
                    <span>{schedule.status || "Pending"}</span>
                  </div>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <Clock size={16} />
                    <span>
                      {schedule.jam ||
                       (schedule.waktu_mulai && schedule.waktu_selesai
                         ? `${formatTime(schedule.waktu_mulai)} - ${formatTime(schedule.waktu_selesai)}`
                         : "-")}
                    </span>
                  </div>

                  <div className="info-row">
                    <MapPin size={16} />
                    <span>
                      {schedule.lokasi ||
                       schedule.alamat ||
                       (Array.isArray(schedule.area)
                         ? schedule.area.join(", ")
                         : schedule.area) ||
                       "-"}
                    </span>
                  </div>

                  {schedule.catatan && (
                    <div className="info-row notes">
                      <AlertCircle size={16} />
                      <span>{schedule.catatan}</span>
                    </div>
                  )}
                </div>

                {schedule.status?.toLowerCase() === "pending" && (
                  <div className="card-footer">
                    <button className="btn-secondary btn-sm">Edit</button>
                    <button className="btn-danger btn-sm">Batalkan</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showBookingModal && (
        <BookingModal
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleRefresh}
        />
      )}

      {showLocationManager && (
        <LocationManager
          onClose={() => setShowLocationManager(false)}
        />
      )}
    </div>
  );
};

export default JadwalPengambilan;
