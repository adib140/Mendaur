import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader,
  X,
  Plus,
  Eye,
  Trash2,
  Users,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import adminApi from '../../../../services/adminApi';
import '../styles/notificationManagement.css';

// Mock data - sesuai struktur tabel notifikasi
const MOCK_NOTIFICATIONS = [
  {
    notifikasi_id: 1,
    user_id: 5,
    judul: 'Approval Success',
    pesan: 'Your withdrawal has been approved',
    tipe: 'success',
    is_read: false,
    created_at: '2025-12-22T11:30:00Z',
  },
  {
    notifikasi_id: 2,
    user_id: 3,
    judul: 'Scheduled Maintenance',
    pesan: 'System maintenance scheduled for tonight',
    tipe: 'info',
    is_read: true,
    created_at: '2025-12-21T15:00:00Z',
  },
];

export default function NotificationManagement() {
  const { hasPermission } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    judul: '',
    pesan: '',
    tipe: 'info',
    recipientType: 'all',
    recipients: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch notifications from API
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const result = await adminApi.getNotifications();
      
      // Multi-format response handler
      // API returns: {success: true, data: {current_page, data: [...], ...}}
      // or: {status: 'success', data: {current_page, data: [...], ...}}
      let data = [];
      
      if (result.success && result.data) {
        // Direct array
        if (Array.isArray(result.data)) {
          data = result.data;
        } 
        // Paginated response: {data: {data: [...]}}
        else if (result.data?.data && Array.isArray(result.data.data)) {
          data = result.data.data;
        }
        // Nested in notifications key
        else if (result.data?.notifications && Array.isArray(result.data.notifications)) {
          data = result.data.notifications;
        }
        
        // If API returns empty array, use mock for demo
        if (data.length === 0) {
          data = MOCK_NOTIFICATIONS;
        }
      } else {
        data = MOCK_NOTIFICATIONS;
      }
      
      setNotifications(data);
    } catch {
      setNotifications(MOCK_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications on component mount
  useEffect(() => {
    loadNotifications();
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    if (filterStatus === 'read' && !n.is_read) return false;
    if (filterStatus === 'unread' && n.is_read) return false;
    if (searchQuery && !((n.judul || '').toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    return true;
  });

  const stats = {
    total: notifications.length,
    read: notifications.filter((n) => n.is_read).length,
    unread: notifications.filter((n) => !n.is_read).length,
  };

  const handleCreateClick = () => {
    // ✅ Permission check
    if (!hasPermission('manage_notifications')) {
      alert('❌ You do not have permission to create notifications')
      return
    }
    setFormData({
      user_id: '',
      judul: '',
      pesan: '',
      tipe: 'info',
      recipientType: 'all',
      recipients: [],
    });
    setShowCreateModal(true);
  };

  const handlePreview = (notif) => {
    setSelectedNotif(notif);
    setShowPreviewModal(true);
  };

  const handleCreateSubmit = async () => {
    if (!formData.judul || !formData.pesan) {
      alert('Judul dan pesan notifikasi wajib diisi!');
      return;
    }
    // ✅ Permission check before submission
    if (!hasPermission('manage_notifications')) {
      alert('❌ You do not have permission to create notifications')
      return
    }
    setIsSubmitting(true);
    try {
      // Build payload matching backend API structure
      const payload = {
        judul: formData.judul,
        pesan: formData.pesan,
        tipe: formData.tipe || 'info',
      };

      // If specific user selected, add user_id
      if (formData.recipientType === 'specific' && formData.user_id) {
        payload.user_id = parseInt(formData.user_id);
      } else {
        // For broadcast to all, we need to handle differently
        // This may require a different endpoint or backend logic
        payload.user_id = 1; // Default or handle broadcast
      }

      const result = await adminApi.createNotification(payload);
      if (result.success) {
        // Refresh notifications from server
        await loadNotifications();
        setShowCreateModal(false);
        alert('✅ Notifikasi berhasil dibuat dan dikirim');
      } else {
        alert(`❌ ${result.message || 'Gagal membuat notifikasi'}`);
      }
    } catch (err) {
      console.error('Create error:', err);
      alert('Terjadi kesalahan saat membuat notifikasi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNotification = async (notifikasiId) => {
    // ✅ Permission check
    if (!hasPermission('manage_notifications')) {
      alert('❌ You do not have permission to delete notifications')
      return
    }
    if (window.confirm('Hapus notifikasi ini?')) {
      try {
        const result = await adminApi.deleteNotification(notifikasiId);
        if (result.success) {
          // Refresh notifications from server
          await loadNotifications();
          alert('✅ Notifikasi berhasil dihapus');
        } else {
          alert(`❌ ${result.message || 'Gagal menghapus notifikasi'}`);
        }
      } catch {
        // Delete error handled silently
      }
    }
  };

  const getTypeIcon = (tipe) => {
    const icons = {
      info: <AlertCircle size={16} />,
      success: <CheckCircle size={16} />,
      warning: <AlertCircle size={16} />,
    };
    return icons[tipe] || <Bell size={16} />;
  };

  return (
    <div className="notification-management">
      <div className="management-header">
        <h2>Kelola Notifikasi</h2>
        <p>Kirim dan kelola notifikasi kepada nasabah</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Notifikasi</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <Bell size={24} color="#0284c7" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Sudah Dibaca</span>
            <span className="stat-value" style={{ color: '#10b981' }}>{stats.read}</span>
          </div>
          <div className="stat-icon" style={{ background: '#d1fae5' }}>
            <CheckCircle size={24} color="#10b981" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Belum Dibaca</span>
            <span className="stat-value" style={{ color: '#f59e0b' }}>{stats.unread}</span>
          </div>
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <Clock size={24} color="#f59e0b" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input">
          <Search size={18} />
          <input
            type="text"
            placeholder="Cari notifikasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Semua Status</option>
          <option value="read">Sudah Dibaca</option>
          <option value="unread">Belum Dibaca</option>
        </select>

        <button className="create-btn" onClick={handleCreateClick}>
          <Plus size={18} /> Kirim Notifikasi
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="loading-state">
          <Loader className="spinner" />
          <p>Memuat notifikasi...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} />
          <h3>Tidak ada notifikasi</h3>
          <p>Belum ada notifikasi yang sesuai dengan filter Anda</p>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications.map((notif) => (
            <div key={notif.notifikasi_id} className="notification-item">
              <div className="notif-icon" style={{ color: notif.is_read ? '#10b981' : '#f59e0b' }}>
                {getTypeIcon(notif.tipe)}
              </div>

              <div className="notif-content">
                <div className="notif-header">
                  <div>
                    <h3>{notif.judul}</h3>
                    <p className="notif-message">{(notif.pesan || '').substring(0, 80)}...</p>
                  </div>
                  <span className="status-badge" style={{ 
                    color: notif.is_read ? '#10b981' : '#f59e0b', 
                    borderColor: notif.is_read ? '#10b981' : '#f59e0b' 
                  }}>
                    {notif.is_read ? 'Dibaca' : 'Belum Dibaca'}
                  </span>
                </div>

                <div className="notif-stats">
                  <div className="stat">
                    <Users size={14} />
                    <span>User ID: {notif.user_id}</span>
                  </div>
                  <div className="stat">
                    <MessageSquare size={14} />
                    <span>Tipe: {notif.tipe || 'info'}</span>
                  </div>
                </div>

                <div className="notif-footer">
                  <span className="date">
                    Dibuat: {new Date(notif.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <div className="actions">
                    <button className="action-btn view-btn" onClick={() => handlePreview(notif)}>
                      <Eye size={14} /> Lihat
                    </button>
                    <button className="action-btn delete-btn" onClick={() => handleDeleteNotification(notif.notifikasi_id)}>
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Kirim Notifikasi Baru</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="judul">Judul <span className="required">*</span></label>
                <input
                  id="judul"
                  type="text"
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Contoh: Jadwal Penyetoran Diperbarui"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="pesan">Pesan <span className="required">*</span></label>
                <textarea
                  id="pesan"
                  value={formData.pesan}
                  onChange={(e) => setFormData({ ...formData, pesan: e.target.value })}
                  placeholder="Tulis pesan notifikasi di sini..."
                  className="form-input"
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="tipe">Tipe <span className="required">*</span></label>
                  <select
                    id="tipe"
                    value={formData.tipe}
                    onChange={(e) => setFormData({ ...formData, tipe: e.target.value })}
                    className="form-input"
                  >
                    <option value="info">Informasi</option>
                    <option value="success">Sukses</option>
                    <option value="warning">Peringatan</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="recipient">Penerima <span className="required">*</span></label>
                  <select
                    id="recipient"
                    value={formData.recipientType}
                    onChange={(e) => setFormData({ ...formData, recipientType: e.target.value })}
                    className="form-input"
                  >
                    <option value="all">Semua Nasabah</option>
                    <option value="specific">Nasabah Tertentu</option>
                  </select>
                </div>
              </div>

              {formData.recipientType === 'specific' && (
                <div className="form-group">
                  <label htmlFor="user_id">User ID <span className="required">*</span></label>
                  <input
                    id="user_id"
                    type="number"
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    placeholder="Masukkan User ID"
                    className="form-input"
                    min="1"
                  />
                </div>
              )}

              <div className="info-box">
                <AlertCircle size={16} />
                <p>Notifikasi akan dikirim langsung ke user yang dipilih.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowCreateModal(false)}
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Notifikasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedNotif && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content modal-preview" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Preview Notifikasi</h3>
              <button className="close-btn" onClick={() => setShowPreviewModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="notification-preview">
                <div className="preview-header">
                  <div className="preview-icon">{getTypeIcon(selectedNotif.tipe)}</div>
                  <div className="preview-content">
                    <h4>{selectedNotif.judul}</h4>
                    <span className="preview-type">{(selectedNotif.tipe || 'info').toUpperCase()}</span>
                  </div>
                </div>

                <div className="preview-message">
                  <p>{selectedNotif.pesan}</p>
                </div>

                <div className="preview-stats">
                  <div className="stat-item">
                    <span className="label">User ID:</span>
                    <span className="value">{selectedNotif.user_id}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Tipe:</span>
                    <span className="value">{selectedNotif.tipe || 'info'}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Status Baca:</span>
                    <span className="value">{selectedNotif.is_read ? 'Sudah Dibaca' : 'Belum Dibaca'}</span>
                  </div>
                </div>

                <div className="preview-footer">
                  <span>Dibuat: <strong>{new Date(selectedNotif.created_at).toLocaleString('id-ID')}</strong></span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowPreviewModal(false)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
