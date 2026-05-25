import React, { useState, useEffect } from 'react';
import {
  Star,
  Search,
  Download,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  AlertCircle,
  Loader,
  Award,
  Users,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import adminApi from '../../../../services/adminApi';
import '../styles/badgeManagement.css';

export default function BadgeManagement() {
  const { hasPermission } = useAuth();
  const [badges, setBadges] = useState([]);
  const [nasabahBadges, setNasabahBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    tipe: 'tabung',
    deskripsi: '',
    syarat_setor: 1,
    syarat_poin: 0,
    reward_poin: 50,
    icon: '🌱',
  });
  const [assignData, setAssignData] = useState({
    nasabah_id: '',
    nasabah_name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MOCK_BADGES = [
    {
      badge_id: 1,
      nama: 'Pemula Peduli',
      deskripsi: 'Tabung sampah pertama kali',
      icon: '🌱',
      syarat_poin: 0,
      syarat_setor: 1,
      reward_poin: 50,
      tipe: 'tabung',
      assigned_count: 45,
    },
    {
      badge_id: 2,
      nama: 'Green Hero',
      deskripsi: 'Telah melakukan 10 kali tabung sampah',
      icon: '🦸',
      syarat_poin: 0,
      syarat_setor: 10,
      reward_poin: 200,
      tipe: 'tabung',
      assigned_count: 32,
    },
    {
      badge_id: 3,
      nama: 'Gold Collector',
      deskripsi: 'Kumpulkan 600 poin reward',
      icon: '🏆',
      syarat_poin: 600,
      syarat_setor: 0,
      reward_poin: 100,
      tipe: 'poin',
      assigned_count: 18,
    },
    {
      badge_id: 4,
      nama: 'Top Contributor',
      deskripsi: 'Berada di peringkat teratas',
      icon: '👑',
      syarat_poin: 0,
      syarat_setor: 0,
      reward_poin: 500,
      tipe: 'ranking',
      assigned_count: 5,
    },
  ];

  const MOCK_NASABAH_BADGES = [
    { id: 1, nasabah_id: 1, nasabah_name: 'Ahmad Wijaya', badge_id: 2, badge_name: 'Green Hero', badge_icon: '🦸', tipe: 'setor', assigned_date: '2025-12-10' },
    { id: 2, nasabah_id: 2, nasabah_name: 'Siti Nurhaliza', badge_id: 3, badge_name: 'Gold Collector', badge_icon: '🏆', tipe: 'poin', assigned_date: '2025-11-15' },
    { id: 3, nasabah_id: 3, nasabah_name: 'Dina Kusuma', badge_id: 1, badge_name: 'Pemula Peduli', badge_icon: '🌱', tipe: 'setor', assigned_date: '2025-12-01' },
    { id: 4, nasabah_id: 4, nasabah_name: 'Eka Putri', badge_id: 2, badge_name: 'Green Hero', badge_icon: '🦸', tipe: 'setor', assigned_date: '2025-10-20' },
    { id: 5, nasabah_id: 5, nasabah_name: 'Farah Husna', badge_id: 3, badge_name: 'Gold Collector', badge_icon: '🏆', tipe: 'poin', assigned_date: '2025-09-10' },
  ];

  useEffect(() => {
    loadBadges();
    loadNasabahBadges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const result = await adminApi.getAllBadges(1, 50);
      if (result.success && result.data) {
        let badgesData = result.data;
        // Handle different response formats
        if (Array.isArray(badgesData)) {
          setBadges(badgesData);
        } else if (badgesData && typeof badgesData === 'object' && Array.isArray(badgesData.badges)) {
          setBadges(badgesData.badges);
        } else if (badgesData && typeof badgesData === 'object' && Array.isArray(badgesData.data)) {
          setBadges(badgesData.data);
        } else {
          console.warn('Unexpected badges response format, using mock data');
          setBadges(MOCK_BADGES);
        }
      } else {
        console.warn('Failed to fetch badges:', result.message);
        setBadges(MOCK_BADGES);
      }
    } catch (err) {
      console.warn('Badge fetch error, using mock data:', err.message);
      setBadges(MOCK_BADGES);
    } finally {
      setLoading(false);
    }
  };

  const loadNasabahBadges = async () => {
    try {
      // Load nasabah badges mock data
      setNasabahBadges(MOCK_NASABAH_BADGES);
      // Future: Replace with API call to getUsersWithBadge or similar
    } catch (err) {
      console.warn('Error loading nasabah badges:', err.message);
      setNasabahBadges(MOCK_NASABAH_BADGES);
    }
  };

  const filteredBadges = Array.isArray(badges) ? badges.filter((b) => {
    if (filterTier !== 'all' && b.tier !== filterTier) return false;
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }) : [];

  const stats = {
    totalBadges: Array.isArray(badges) ? badges.length : 0,
    totalAssigned: nasabahBadges.length,
    setorCount: Array.isArray(badges) ? badges.filter(b => b.tipe === 'setor').reduce((sum, b) => sum + (b.assigned_count || 0), 0) : 0,
    poinCount: Array.isArray(badges) ? badges.filter(b => b.tipe === 'poin').reduce((sum, b) => sum + (b.assigned_count || 0), 0) : 0,
    rankingCount: Array.isArray(badges) ? badges.filter(b => b.tipe === 'ranking').reduce((sum, b) => sum + (b.assigned_count || 0), 0) : 0,
  };

  const types = ['setor', 'poin', 'ranking'];
  const typeLabels = {
    setor: 'Pencapaian Setor',
    poin: 'Pencapaian Poin',
    ranking: 'Pencapaian Ranking',
  };

  const getTypeColor = (type) => {
    const colors = {
      setor: '#10b981',
      poin: '#3b82f6',
      ranking: '#f59e0b',
    };
    return colors[type] || '#6b7280';
  };

  const handleCreateClick = () => {
    if (!hasPermission('manage_badges')) {
      alert('❌ You do not have permission to create badges')
      return
    }
    setSelectedBadge(null); // Reset untuk mode create
    setFormData({
      nama: '',
      tipe: 'setor',
      deskripsi: '',
      syarat_setor: 1,
      syarat_poin: 0,
      reward_poin: 50,
      icon: '🌱',
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async () => {
    if (!formData.nama) {
      alert('Nama badge wajib diisi!');
      return;
    }
    if (!hasPermission('manage_badges')) {
      alert('❌ You do not have permission to manage badges')
      return
    }
    setIsSubmitting(true);
    try {
      // Build payload matching backend API structure
      const payload = {
        nama: formData.nama,
        tipe: formData.tipe,
        deskripsi: formData.deskripsi || '',
        syarat_setor: formData.tipe === 'setor' ? parseInt(formData.syarat_setor) || 1 : 0,
        syarat_poin: formData.tipe === 'poin' ? parseInt(formData.syarat_poin) || 0 : 0,
        reward_poin: parseInt(formData.reward_poin) || 0,
        icon: formData.icon || '🌱',
      };

      let result;
      if (selectedBadge) {
        // Edit mode - update existing badge
        result = await adminApi.updateBadge(selectedBadge.badge_id, payload);
      } else {
        // Create mode - create new badge
        result = await adminApi.createBadge(payload);
      }

      if (result.success) {
        // Refresh badges list
        await loadBadges();
        setShowCreateModal(false);
        setSelectedBadge(null);
        alert(selectedBadge ? '✅ Badge berhasil diperbarui' : '✅ Badge berhasil dibuat');
      } else {
        alert('❌ ' + (result.message || (selectedBadge ? 'Gagal memperbarui badge' : 'Gagal membuat badge')));
      }
    } catch (err) {
      console.error(selectedBadge ? 'Update badge error:' : 'Create badge error:', err);
      alert('❌ Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignClick = (badge) => {
    if (!hasPermission('manage_badges')) {
      alert('❌ You do not have permission to assign badges')
      return
    }
    setSelectedBadge(badge);
    setAssignData({ nasabah_id: '', nasabah_name: '' });
    setShowAssignModal(true);
  };

  const handleEditClick = (badge) => {
    if (!hasPermission('manage_badges')) {
      alert('❌ You do not have permission to edit badges')
      return
    }
    setSelectedBadge(badge);
    setFormData({
      nama: badge.nama || '',
      tipe: badge.tipe || 'setor',
      deskripsi: badge.deskripsi || '',
      syarat_setor: badge.syarat_setor || 1,
      syarat_poin: badge.syarat_poin || 0,
      reward_poin: badge.reward_poin || 50,
      icon: badge.icon || '🌱',
    });
    setShowCreateModal(true);
  };

  const handleDeleteBadge = async (badgeId) => {
    if (!hasPermission('manage_badges')) {
      alert('❌ You do not have permission to delete badges')
      return
    }
    if (!window.confirm('Apakah Anda yakin ingin menghapus badge ini? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }
    
    try {
      setLoading(true);
      const result = await adminApi.deleteBadge(badgeId);
      
      if (result.success) {
        // Remove from local state
        setBadges(badges.filter(b => b.badge_id !== badgeId));
        // Also remove any assignments for this badge
        setNasabahBadges(nasabahBadges.filter(a => a.badge_id !== badgeId));
        alert('✅ Badge berhasil dihapus');
      } else {
        alert('❌ ' + (result.message || 'Gagal menghapus badge'));
      }
    } catch (err) {
      console.error('Delete badge error:', err);
      alert('❌ Error deleting badge: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubmit = async () => {
    if (!assignData.nasabah_name) {
      alert('Pilih nasabah untuk ditugaskan badge!');
      return;
    }
    if (!hasPermission('manage_badges')) {
      alert('❌ You do not have permission to assign badges')
      return
    }
    setIsSubmitting(true);
    try {
      const userId = parseInt(assignData.nasabah_id) || nasabahBadges.length + 1;
      const result = await adminApi.assignBadgeToUser(selectedBadge.badge_id, userId);

      if (result.success) {
        const newAssignment = {
          id: nasabahBadges.length + 1,
          nasabah_id: userId,
          nasabah_name: assignData.nasabah_name,
          badge_id: selectedBadge.badge_id,
          badge_name: selectedBadge.nama,
          badge_icon: selectedBadge.icon,
          tipe: selectedBadge.tipe,
          assigned_date: new Date().toISOString().split('T')[0],
        };
        setNasabahBadges([...nasabahBadges, newAssignment]);
        const updatedBadges = badges.map((b) =>
          b.badge_id === selectedBadge.badge_id ? { ...b, assigned_count: (b.assigned_count || 0) + 1 } : b
        );
        setBadges(updatedBadges);
        setShowAssignModal(false);
        alert('✅ Badge berhasil ditugaskan kepada nasabah');
      } else {
        alert('❌ ' + (result.message || 'Gagal menugaskan badge'));
      }
    } catch (err) {
      console.error('Assign badge error:', err);
      alert('❌ Error assigning badge: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!hasPermission('manage_badges')) {
      alert('❌ You do not have permission to delete badge assignments')
      return
    }
    if (window.confirm('Hapus badge ini dari nasabah?')) {
      try {
        setLoading(true);
        const assignment = nasabahBadges.find((a) => a.id === assignmentId);
        
        // Remove from local state
        setNasabahBadges(nasabahBadges.filter((a) => a.id !== assignmentId));
        const updatedBadges = badges.map((b) =>
          b.badge_id === assignment.badge_id ? { ...b, assigned_count: Math.max(0, (b.assigned_count || 0) - 1) } : b
        );
        setBadges(updatedBadges);
        alert('✅ Badge berhasil dihapus dari nasabah');
      } catch (err) {
        console.error('Delete assignment error:', err);
        alert('❌ Error deleting badge assignment: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="badge-management">
      <div className="management-header">
        <h2>Kelola Badge & Pencapaian</h2>
        <p>Atur badge, tingkatan, dan kelola penugasan badge kepada nasabah</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Badge</span>
            <span className="stat-value">{stats.totalBadges}</span>
          </div>
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <Award size={24} color="#d97706" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Ditugaskan</span>
            <span className="stat-value">{stats.totalAssigned}</span>
          </div>
          <div className="stat-icon" style={{ background: '#e0e7ff' }}>
            <Users size={24} color="#4f46e5" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Setor Sampah</span>
            <span className="stat-value">{stats.setorCount}</span>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <TrendingUp size={24} color="#10b981" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Poin</span>
            <span className="stat-value">{stats.poinCount}</span>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
            <Star size={24} color="#3b82f6" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Ranking</span>
            <span className="stat-value">{stats.rankingCount}</span>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
            <Award size={24} color="#f59e0b" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="badge-tabs">
        <button className="tab-btn active">Badge Tersedia</button>
        <button className="tab-btn">Penugasan Nasabah</button>
      </div>

      {/* Badge List */}
      <div className="filter-bar">
        <div className="search-input">
          <Search size={18} />
          <input
            type="text"
            placeholder="Cari badge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
        >
          <option value="all">Semua Tipe</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {typeLabels[type]}
            </option>
          ))}
        </select>

        <button className="create-btn" onClick={handleCreateClick}>
          <Plus size={18} /> Buat Badge Baru
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader className="spinner" />
          <p>Memuat badge...</p>
        </div>
      ) : (
        <div className="badges-grid">
          {filteredBadges.map((badge) => (
            <div key={badge.badge_id} className="badge-card">
              <div className="badge-icon-large">{badge.icon}</div>
              <h3>{badge.nama}</h3>
              <p className="tier-label" style={{ borderColor: getTypeColor(badge.tipe), color: getTypeColor(badge.tipe) }}>
                {typeLabels[badge.tipe]}
              </p>
              <p className="badge-description">{badge.deskripsi}</p>
              <div className="badge-stats">
                {badge.tipe === 'setor' && (
                  <div className="stat">
                    <span className="label">Syarat Setor:</span>
                    <span className="value">{badge.syarat_setor}x</span>
                  </div>
                )}
                {badge.tipe === 'poin' && (
                  <div className="stat">
                    <span className="label">Syarat Poin:</span>
                    <span className="value">{badge.syarat_poin}</span>
                  </div>
                )}
                {badge.tipe === 'ranking' && (
                  <div className="stat">
                    <span className="label">Tipe:</span>
                    <span className="value">Ranking</span>
                  </div>
                )}
                <div className="stat">
                  <span className="label">Claim:</span>
                  <span className="value">{badge.assigned_count || 0}</span>
                </div>
              </div>
              <div className="badge-actions">
                <button
                  className="assign-btn"
                  onClick={() => handleAssignClick(badge)}
                >
                  <Check size={16} /> Tugaskan
                </button>
                <button
                  className="edit-btn"
                  onClick={() => handleEditClick(badge)}
                  title="Edit Badge"
                >
                  <Edit size={16} />
                </button>
                <button
                  className="delete-badge-btn"
                  onClick={() => handleDeleteBadge(badge.badge_id)}
                  title="Hapus Badge"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Penugasan Tab */}
      <div className="assignments-section">
        <h3>Penugasan Badge Nasabah</h3>
        <div className="assignments-table">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Nasabah</th>
                <th>Badge</th>
                <th>Tier</th>
                <th>Tanggal Penugasan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {nasabahBadges.map((assignment, idx) => (
                <tr key={assignment.id}>
                  <td>{idx + 1}</td>
                  <td className="nasabah-name">{assignment.nasabah_name}</td>
                  <td>
                    <span className="badge-pill">
                      {assignment.badge_icon} {assignment.badge_name}
                    </span>
                  </td>
                  <td>
                    <span className="tier-badge" style={{ color: getTypeColor(assignment.tipe) }}>
                      {typeLabels[assignment.tipe]}
                    </span>
                  </td>
                  <td className="date">{new Date(assignment.assigned_date).toLocaleDateString('id-ID')}</td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                    >
                      <Trash2 size={14} /> Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setSelectedBadge(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedBadge ? 'Edit Badge' : 'Buat Badge Baru'}</h3>
              <button className="close-btn" onClick={() => { setShowCreateModal(false); setSelectedBadge(null); }}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="icon">Ikon Badge <span className="required">*</span></label>
                <div className="emoji-picker">
                  {['🌱', '🦸', '🏆', '👑', '🎯', '💎', '🌟', '✨', '🔥', '💪', '🥇', '🥈', '🥉', '🏅', '🎖️', '⭐'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`emoji-btn ${formData.icon === emoji ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, icon: emoji })}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="nama">Nama Badge <span className="required">*</span></label>
                <input
                  id="nama"
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Green Hero, Gold Collector"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tipe">Tipe Badge <span className="required">*</span></label>
                <select
                  id="tipe"
                  value={formData.tipe}
                  onChange={(e) => {
                    const newTipe = e.target.value;
                    setFormData({ 
                      ...formData, 
                      tipe: newTipe,
                      syarat_setor: newTipe === 'setor' ? formData.syarat_setor : 0,
                      syarat_poin: newTipe === 'poin' ? formData.syarat_poin : 0
                    });
                  }}
                  className="form-input"
                >
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {typeLabels[type]}
                    </option>
                  ))}
                </select>
              </div>

              {formData.tipe === 'setor' && (
                <div className="form-group">
                  <label htmlFor="syarat_setor">Syarat Penyetoran (jumlah) <span className="required">*</span></label>
                  <input
                    id="syarat_setor"
                    type="number"
                    value={formData.syarat_setor}
                    onChange={(e) => setFormData({ ...formData, syarat_setor: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="form-input"
                  />
                </div>
              )}

              {formData.tipe === 'poin' && (
                <div className="form-group">
                  <label htmlFor="syarat_poin">Syarat Poin <span className="required">*</span></label>
                  <input
                    id="syarat_poin"
                    type="number"
                    value={formData.syarat_poin}
                    onChange={(e) => setFormData({ ...formData, syarat_poin: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="form-input"
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="reward_poin">Reward Poin <span className="required">*</span></label>
                <input
                  id="reward_poin"
                  type="number"
                  value={formData.reward_poin}
                  onChange={(e) => setFormData({ ...formData, reward_poin: parseInt(e.target.value) || 50 })}
                  min="0"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="deskripsi">Deskripsi <span className="required">*</span></label>
                <textarea
                  id="deskripsi"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Jelaskan apa yang mewakili badge ini"
                  className="form-input"
                  rows="4"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => { setShowCreateModal(false); setSelectedBadge(null); }}
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (selectedBadge ? 'Menyimpan...' : 'Membuat...') : (selectedBadge ? 'Simpan Perubahan' : 'Buat Badge')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedBadge && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tugaskan {selectedBadge.icon} {selectedBadge.nama}</h3>
              <button className="close-btn" onClick={() => setShowAssignModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="badge-preview">
                <div className="preview-icon">{selectedBadge.icon}</div>
                <div className="preview-info">
                  <h4>{selectedBadge.nama}</h4>
                  <p>{typeLabels[selectedBadge.tipe]}</p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="nasabah">Pilih Nasabah <span className="required">*</span></label>
                <input
                  id="nasabah"
                  type="text"
                  value={assignData.nasabah_name}
                  onChange={(e) => setAssignData({ ...assignData, nasabah_name: e.target.value })}
                  placeholder="Cari atau ketik nama nasabah..."
                  className="form-input"
                  list="nasabah-list"
                />
                <datalist id="nasabah-list">
                  {[
                    'Ahmad Wijaya',
                    'Siti Nurhaliza',
                    'Dina Kusuma',
                    'Eka Putri',
                    'Farah Husna',
                    'Gandi Hermawan',
                    'Hendra Kusuma',
                  ].map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div className="info-box">
                <AlertCircle size={16} />
                <p>Badge akan ditugaskan ke nasabah dan notifikasi akan dikirimkan.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowAssignModal(false)}
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                className="btn-primary"
                onClick={handleAssignSubmit}
                disabled={isSubmitting || !assignData.nasabah_name}
              >
                {isSubmitting ? 'Menugaskan...' : 'Tugaskan Badge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
