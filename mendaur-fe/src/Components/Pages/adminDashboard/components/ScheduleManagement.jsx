import React, { useState, useEffect } from 'react';
import {
  Eye,
  Search,
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import adminApi from '../../../../services/adminApi';
import '../styles/scheduleManagement.css';

export default function ScheduleManagement() {
  const { hasPermission } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDay, setFilterDay] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  
  const MOCK_SCHEDULES = [
    {
      jadwal_penyetoran_id: 1,
      hari: 'Senin',
      waktu_mulai: '08:00:00',
      waktu_selesai: '12:00:00',
      lokasi: 'Bank Sampah Pusat - Jl. Sudirman No. 1, Jakarta Pusat',
      status: 'Buka',
    },
    {
      jadwal_penyetoran_id: 2,
      hari: 'Rabu',
      waktu_mulai: '10:00:00',
      waktu_selesai: '14:00:00',
      lokasi: 'TPS 3R Kuningan - Jl. Gatot Subroto No. 45, Jakarta Selatan',
      status: 'Buka',
    },
    {
      jadwal_penyetoran_id: 3,
      hari: 'Jumat',
      waktu_mulai: '14:00:00',
      waktu_selesai: '18:00:00',
      lokasi: 'Bank Sampah Ancol - Jl. Hayam Wuruk No. 88, Jakarta Barat',
      status: 'Tutup',
    },
  ];
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [formData, setFormData] = useState({
    hari: 'Senin',
    waktu_mulai: '08:00',
    waktu_selesai: '12:00',
    lokasi: '',
    status: 'Buka',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSchedules = async () => {
    try {
      setLoading(true)
      const result = await adminApi.getAllSchedules(1, 50)
      if (result.success && result.data) {
        // Handle multiple response formats
        let schedulesData
        if (Array.isArray(result.data)) {
          schedulesData = result.data
        } else if (result.data && typeof result.data === 'object' && Array.isArray(result.data.schedules)) {
          schedulesData = result.data.schedules
        } else if (result.data && typeof result.data === 'object' && Array.isArray(result.data.data)) {
          schedulesData = result.data.data
        } else {
          console.warn('Unexpected schedules response format, using mock data')
          schedulesData = MOCK_SCHEDULES
        }
        setSchedules(schedulesData)
      } else {
        console.warn('Failed to fetch schedules, using fallback')
        setSchedules(MOCK_SCHEDULES)
      }
    } catch (err) {
      console.warn('Schedule fetch error, using mock data:', err.message)
      setSchedules(MOCK_SCHEDULES)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSchedules()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredSchedules = schedules.filter((s) => {
    if (filterDay !== 'all' && s.hari !== filterDay) return false;
    if (filterLocation !== 'all' && s.lokasi !== filterLocation) return false;
    if (searchQuery && !s.lokasi.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: schedules.length,
    jadwalBuka: schedules.filter(s => s.status === 'Buka').length,
    jadwalTutup: schedules.filter(s => s.status === 'Tutup').length,
  };

  const locations = [...new Set(schedules.map((s) => s.lokasi))];
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  const handleViewDetail = (schedule) => {
    setSelectedSchedule(schedule);
    setShowDetailModal(true);
  };

  const handleCreateClick = () => {
    // ✅ Permission check
    if (!hasPermission('manage_schedule')) {
      alert('❌ You do not have permission to create schedules')
      return
    }
    setFormData({
      hari: 'Senin',
      waktu_mulai: '08:00',
      waktu_selesai: '12:00',
      lokasi: '',
      status: 'Buka',
    });
    setShowCreateModal(true);
  };

  const handleEditClick = (schedule) => {
    // ✅ Permission check
    if (!hasPermission('manage_schedule')) {
      alert('❌ You do not have permission to edit schedules')
      return
    }
    setFormData({
      hari: schedule.hari || 'Senin',
      waktu_mulai: schedule.waktu_mulai ? schedule.waktu_mulai.substring(0, 5) : '08:00',
      waktu_selesai: schedule.waktu_selesai ? schedule.waktu_selesai.substring(0, 5) : '12:00',
      lokasi: schedule.lokasi || '',
      status: schedule.status || 'Buka',
    });
    setSelectedSchedule(schedule);
    setShowEditModal(true);
  };

  const handleDeleteClick = (schedule) => {
    // ✅ Permission check
    if (!hasPermission('manage_schedule')) {
      alert('❌ You do not have permission to delete schedules')
      return
    }
    if (window.confirm('Hapus jadwal ini? Nasabah yang terdaftar akan diberitahu.')) {
      (async () => {
        try {
          setLoading(true);
          const response = await adminApi.deleteSchedule(schedule.jadwal_penyetoran_id);
          if (response.success) {
            await loadSchedules()
            alert('✅ Jadwal berhasil dihapus');
          } else {
            alert('❌ ' + (response.message || 'Gagal menghapus jadwal'));
          }
        } catch (error) {
          console.error('Delete error:', error);
          alert('❌ Terjadi kesalahan saat menghapus jadwal');
        } finally {
          setLoading(false);
        }
      })();
    }
  };

  const handleCreateSubmit = async () => {
    // Validate required fields
    if (!formData.hari || !formData.waktu_mulai || !formData.waktu_selesai || !formData.lokasi) {
      alert('Hari, waktu mulai, waktu selesai, dan lokasi wajib diisi!');
      return;
    }
    
    // Validate time logic
    if (formData.waktu_mulai >= formData.waktu_selesai) {
      alert('Waktu mulai harus lebih awal dari waktu selesai!');
      return;
    }
    
    // ✅ Permission check before submission
    if (!hasPermission('manage_schedule')) {
      alert('❌ You do not have permission to create schedules')
      return
    }
    
    setIsSubmitting(true);
    try {
      // Prepare data to send - matching new API structure
      const scheduleData = {
        hari: formData.hari,
        waktu_mulai: formData.waktu_mulai,
        waktu_selesai: formData.waktu_selesai,
        lokasi: formData.lokasi.trim(),
        status: formData.status || 'Buka'
      }
      
      const result = await adminApi.createSchedule(scheduleData);
      
      if (result.success) {
        // Refresh schedules list
        await loadSchedules()
        setShowCreateModal(false);
        alert('Jadwal baru berhasil dibuat');
      } else {
        let errorMessage = 'Gagal membuat jadwal'
        
        if (result.message) {
          errorMessage = result.message
        } else if (result.error) {
          errorMessage = result.error
        } else if (result.details && result.details.message) {
          errorMessage = result.details.message
        }
        
        alert(`❌ ${errorMessage}`);
      }
    } catch (err) {
      alert(`Error: ${err.message || 'Terjadi kesalahan saat membuat jadwal'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!formData.hari || !formData.waktu_mulai || !formData.waktu_selesai || !formData.lokasi) {
      alert('Hari, waktu mulai, waktu selesai, dan lokasi wajib diisi!');
      return;
    }
    
    // Validate time logic
    if (formData.waktu_mulai >= formData.waktu_selesai) {
      alert('Waktu mulai harus lebih awal dari waktu selesai!');
      return;
    }
    
    // ✅ Permission check before submission
    if (!hasPermission('manage_schedule')) {
      alert('❌ You do not have permission to edit schedules')
      return
    }
    setIsSubmitting(true);
    try {
      const scheduleData = {
        hari: formData.hari,
        waktu_mulai: formData.waktu_mulai,
        waktu_selesai: formData.waktu_selesai,
        lokasi: formData.lokasi.trim(),
        status: formData.status || 'Buka'
      }
      
      const result = await adminApi.updateSchedule(selectedSchedule.jadwal_penyetoran_id, scheduleData);
      
      if (result.success) {
        // Refresh schedules list
        await loadSchedules()
        setShowEditModal(false);
        alert('✅ Jadwal berhasil diperbarui');
      } else {
        alert('❌ ' + (result.message || result.error || 'Gagal memperbarui jadwal'));
      }
    } catch {
      alert('❌ Terjadi kesalahan saat memperbarui jadwal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="schedule-management">
      <div className="management-header">
        <h2>Kelola Jadwal Penyetoran</h2>
        <p>Atur jadwal pengambilan sampah dan kelola nasabah terdaftar</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Jadwal</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <Calendar size={24} color="#0284c7" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Jadwal Buka</span>
            <span className="stat-value">{stats.jadwalBuka}</span>
          </div>
          <div className="stat-icon" style={{ background: '#d1fae5' }}>
            <CheckCircle size={24} color="#10b981" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Jadwal Tutup</span>
            <span className="stat-value">{stats.jadwalTutup}</span>
          </div>
          <div className="stat-icon" style={{ background: '#fee2e2' }}>
            <AlertCircle size={24} color="#ef4444" />
          </div>
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-bar">
          <div className="search-input">
            <Search size={18} />
            <input
              type="text"
              placeholder="Cari lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
          >
            <option value="all">Semua Hari</option>
            {days.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
          >
            <option value="all">Semua Lokasi</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <button className="create-btn" onClick={handleCreateClick}>
            <Plus size={18} /> Tambah Jadwal
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader className="spinner" />
          <p>Memuat jadwal...</p>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="empty-state">
          <AlertCircle size={48} />
          <h3>Tidak ada jadwal</h3>
          <p>Belum ada jadwal penyetoran yang sesuai dengan filter Anda</p>
        </div>
      ) : (
        <div className="schedules-container">
          {filteredSchedules.map((schedule) => (
            <div key={schedule.jadwal_penyetoran_id || schedule.id} className="schedule-card">
              <div className="schedule-card-header">
                <div className="schedule-main-info">
                  <div className="schedule-day-time">
                    <Calendar size={20} />
                    <div>
                      <h3>{schedule.hari}</h3>
                      <p className="time-range">
                        <Clock size={14} /> {schedule.waktu_mulai?.substring(0, 5)} - {schedule.waktu_selesai?.substring(0, 5)}
                      </p>
                    </div>
                  </div>
                  <div className="schedule-location">
                    <MapPin size={18} />
                    <div>
                      <p className="location-name">{schedule.lokasi}</p>
                    </div>
                  </div>
                </div>
                <span className={`status-badge ${schedule.status === 'Buka' ? 'Buka' : 'Tutup'}`}>
                  {schedule.status}
                </span>
              </div>

              <div className="schedule-card-footer">
                <button
                  className="action-btn view-btn"
                  onClick={() => handleViewDetail(schedule)}
                  title="Lihat Detail"
                >
                  <Eye size={16} /> Detail
                </button>
                <button
                  className="action-btn edit-btn"
                  onClick={() => handleEditClick(schedule)}
                  title="Edit Jadwal"
                >
                  <Edit size={16} /> Edit
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDeleteClick(schedule)}
                  title="Hapus Jadwal"
                >
                  <Trash2 size={16} /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSchedule && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Jadwal Penyetoran</h3>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="info-section">
                <h4>Informasi Jadwal</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Hari</span>
                    <span className="value">{selectedSchedule.hari}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Waktu</span>
                    <span className="value">
                      {selectedSchedule.waktu_mulai?.substring(0, 5)} - {selectedSchedule.waktu_selesai?.substring(0, 5)}
                    </span>
                  </div>
                  <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="label">Lokasi</span>
                    <span className="value">{selectedSchedule.lokasi}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Status</span>
                    <span className={`status-badge ${selectedSchedule.status === 'Buka' ? 'Buka' : 'Tutup'}`}>
                      {selectedSchedule.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>
                Tutup
              </button>
              <button className="btn-primary" onClick={() => { setShowDetailModal(false); handleEditClick(selectedSchedule); }}>
                <Edit size={16} /> Edit Jadwal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Buat Jadwal Penyetoran Baru</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="hari">Hari <span className="required">*</span></label>
                <select
                  id="hari"
                  value={formData.hari}
                  onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
                  className="form-input"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="time">Waktu Mulai <span className="required">*</span></label>
                <input
                  id="time"
                  type="time"
                  value={formData.waktu_mulai}
                  onChange={(e) => setFormData({ ...formData, waktu_mulai: e.target.value })}
                  className="form-input"
                />
                <small className="form-hint">Format: HH:mm (contoh: 08:00)</small>
              </div>

              <div className="form-group">
                <label htmlFor="time-end">Waktu Selesai <span className="required">*</span></label>
                <input
                  id="time-end"
                  type="time"
                  value={formData.waktu_selesai}
                  onChange={(e) => setFormData({ ...formData, waktu_selesai: e.target.value })}
                  className="form-input"
                />
                <small className="form-hint">Format: HH:mm (contoh: 12:00)</small>
              </div>

              <div className="form-group">
                <label htmlFor="location">Lokasi <span className="required">*</span></label>
                <input
                  id="location"
                  type="text"
                  value={formData.lokasi}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  placeholder="Contoh: Bank Sampah Pusat - Jl. Sudirman No. 1"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="form-input"
                >
                  <option value="Buka">Buka</option>
                  <option value="Tutup">Tutup</option>
                </select>
                <small className="form-hint">Jadwal Tutup akan terlihat tidak aktif di sisi pengguna</small>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)} disabled={isSubmitting}>
                Batal
              </button>
              <button className="btn-primary" onClick={handleCreateSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Membuat...' : 'Buat Jadwal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSchedule && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Jadwal Penyetoran</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-hari">Hari <span className="required">*</span></label>
                <select
                  id="edit-hari"
                  value={formData.hari}
                  onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
                  className="form-input"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-time">Waktu Mulai <span className="required">*</span></label>
                <input
                  id="edit-time"
                  type="time"
                  value={formData.waktu_mulai}
                  onChange={(e) => setFormData({ ...formData, waktu_mulai: e.target.value })}
                  className="form-input"
                />
                <small className="form-hint">Format: HH:mm (contoh: 08:00)</small>
              </div>

              <div className="form-group">
                <label htmlFor="edit-time-end">Waktu Selesai <span className="required">*</span></label>
                <input
                  id="edit-time-end"
                  type="time"
                  value={formData.waktu_selesai}
                  onChange={(e) => setFormData({ ...formData, waktu_selesai: e.target.value })}
                  className="form-input"
                />
                <small className="form-hint">Format: HH:mm (contoh: 12:00)</small>
              </div>

              <div className="form-group">
                <label htmlFor="edit-location">Lokasi <span className="required">*</span></label>
                <input
                  id="edit-location"
                  type="text"
                  value={formData.lokasi}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  placeholder="Contoh: Bank Sampah Pusat - Jl. Sudirman No. 1"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-status">Status</label>
                <select
                  id="edit-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="form-input"
                >
                  <option value="Buka">Buka</option>
                  <option value="Tutup">Tutup</option>
                </select>
                <small className="form-hint">Jadwal Tutup akan terlihat tidak aktif di sisi pengguna</small>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)} disabled={isSubmitting}>
                Batal
              </button>
              <button className="btn-primary" onClick={handleEditSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
