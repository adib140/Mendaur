import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye,
  Edit2,
  Trash2,
  Download,
  Search,
  Filter,
  Check,
  X,
  Loader,
  Calendar,
  User,
  Package,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  ShoppingCart,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import adminApi from '../../../../services/adminApi';
import '../styles/productRedemptionManagement.css';

// Mock data for fallback
const MOCK_PRODUCT_REDEMPTIONS = [
  {
    id: 1,
    user_id: 1,
    user_name: 'Budi Santoso',
    user_email: 'budi@email.com',
    product_id: 1,
    product_name: 'Tas Belanja Kain',
    product_image: 'https://via.placeholder.com/300x200?text=Tas+Belanja',
    poin_digunakan: 25000,
    metode_ambil: 'Ambil di Bank Sampah',
    status: 'pending',
    created_at: '2025-12-20T10:30:00',
    catatan: 'Mohon disiapkan untuk diambil Jumat',
    catatan_admin: null,
    tanggal_target_ambil: '2025-12-24',
  },
  {
    id: 2,
    user_id: 2,
    user_name: 'Siti Nurhaliza',
    user_email: 'siti@email.com',
    product_id: 2,
    product_name: 'Botol Minum Eco',
    product_image: 'https://via.placeholder.com/300x200?text=Botol+Minum',
    poin_digunakan: 15000,
    metode_ambil: 'Ambil di Bank Sampah',
    status: 'approved',
    created_at: '2025-12-19T14:15:00',
    catatan: null,
    catatan_admin: 'Sudah siap diambil di loket 2',
    tanggal_verifikasi: '2025-12-19T15:00:00',
    tanggal_target_ambil: '2025-12-22',
  },
  {
    id: 3,
    user_id: 3,
    user_name: 'Ahmad Wijaya',
    user_email: 'ahmad@email.com',
    product_id: 3,
    product_name: 'Sarung Tangan Organik',
    product_image: 'https://via.placeholder.com/300x200?text=Sarung+Tangan',
    poin_digunakan: 8000,
    metode_ambil: 'Ambil di Bank Sampah',
    status: 'picked_up',
    created_at: '2025-12-18T09:45:00',
    catatan: null,
    catatan_admin: 'Produk sudah diambil pada 2025-12-20 12:30',
    tanggal_verifikasi: '2025-12-18T11:00:00',
    tanggal_ambil: '2025-12-20T12:30:00',
    tanggal_target_ambil: '2025-12-22',
  },
  {
    id: 4,
    user_id: 4,
    user_name: 'Dina Kusuma',
    user_email: 'dina@email.com',
    product_id: 1,
    product_name: 'Tas Belanja Kain',
    product_image: 'https://via.placeholder.com/300x200?text=Tas+Belanja',
    poin_digunakan: 25000,
    metode_ambil: 'Ambil di Bank Sampah',
    status: 'rejected',
    created_at: '2025-12-17T08:20:00',
    catatan: null,
    catatan_admin: 'Stok produk sudah habis saat approval',
    tanggal_verifikasi: '2025-12-17T10:00:00',
    tanggal_target_ambil: '2025-12-21',
  },
]

export default function ProductRedemptionManagement() {
  const { hasPermission } = useAuth();
  // States
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    notes: '',
  });
  const [rejectionData, setRejectionData] = useState({
    reason: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Separated fetch function (Session 2 pattern)
  const loadProductRedemptions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getProductRedemptions();
      
      // Multi-format response handler (supports 3+ formats)
      let data = MOCK_PRODUCT_REDEMPTIONS;
      if (Array.isArray(result.data)) data = result.data;
      else if (result.data?.data) data = result.data.data;
      else if (result.data?.redemptions) data = result.data.redemptions;
      
      // Map API response to expected format (handle nested user/product objects)
      const mappedData = data.map(r => ({
        ...r,
        // Handle nested user object from API
        user_name: r.user_name || r.user?.name || r.user?.nama_lengkap || '-',
        user_email: r.user_email || r.user?.email || '-',
        // Handle nested product object from API
        product_name: r.product_name || r.produk?.nama || r.produk?.name || '-',
        product_image: r.product_image || r.produk?.foto || r.produk?.image || null,
        // Ensure numeric values
        poin_digunakan: Number(r.poin_digunakan) || Number(r.jumlah_poin) || 0,
      }));
      
      setRedemptions(mappedData);
    } catch {
      setRedemptions(MOCK_PRODUCT_REDEMPTIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load redemptions on component mount
  useEffect(() => {
    loadProductRedemptions();
  }, [loadProductRedemptions]);

  // Filter logic
  const filteredRedemptions = redemptions.filter((redemption) => {
    // Status filter
    if (statusFilter !== 'all' && redemption.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !redemption.user_name.toLowerCase().includes(query) &&
        !redemption.product_name.toLowerCase().includes(query) &&
        !redemption.id.toString().includes(query)
      ) {
        return false;
      }
    }

    // Product filter
    if (productFilter !== 'all' && redemption.product_name !== productFilter) {
      return false;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      const redemptionDate = new Date(redemption.created_at);
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        if (redemptionDate < fromDate) return false;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (redemptionDate > toDate) return false;
      }
    }

    return true;
  });

  // Calculate stats - support both 'picked_up' and 'completed' status
  const stats = {
    total: redemptions.length,
    pending: redemptions.filter((r) => r.status === 'pending').length,
    approved: redemptions.filter((r) => r.status === 'approved' || r.status === 'diproses' || r.status === 'dikirim').length,
    rejected: redemptions.filter((r) => r.status === 'rejected' || r.status === 'cancelled').length,
    picked_up: redemptions.filter((r) => r.status === 'picked_up' || r.status === 'completed').length,
    totalPoints: redemptions.reduce((sum, r) => sum + (Number(r.poin_digunakan) || 0), 0),
  };

  // Helper functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
      case 'diproses':
      case 'dikirim':
        return '#3b82f6';
      case 'picked_up':
      case 'completed':
        return '#10b981';
      case 'rejected':
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'approved':
        return 'Disetujui';
      case 'diproses':
        return 'Diproses';
      case 'dikirim':
        return 'Dikirim';
      case 'picked_up':
      case 'completed':
        return 'Selesai';
      case 'rejected':
      case 'cancelled':
        return 'Ditolak';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} />;
      case 'approved':
      case 'diproses':
      case 'dikirim':
        return <CheckCircle size={16} />;
      case 'picked_up':
      case 'completed':
        return <Check size={16} />;
      case 'rejected':
      case 'cancelled':
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  // Check if status allows complete action
  const canComplete = (status) => {
    return ['approved', 'diproses', 'dikirim'].includes(status);
  };

  // Action handlers
  const handleViewDetail = (redemption) => {
    setSelectedRedemption(redemption);
    setShowDetailModal(true);
  };

  const handleApproveClick = (redemption) => {
    // ✅ Permission check
    if (!hasPermission('approve_redemption')) {
      alert('❌ You do not have permission to approve redemptions')
      return
    }
    setSelectedRedemption(redemption);
    setApprovalData({ notes: '' });
    setShowApprovalModal(true);
  };

  const handleRejectClick = (redemption) => {
    // ✅ Permission check
    if (!hasPermission('approve_redemption')) {
      alert('❌ You do not have permission to reject redemptions')
      return
    }
    setSelectedRedemption(redemption);
    setRejectionData({ reason: '', notes: '' });
    setShowRejectionModal(true);
  };

  const handleApprovalSubmit = async () => {
    // ✅ Permission check before submission
    if (!hasPermission('approve_redemption')) {
      alert('❌ You do not have permission to approve redemptions')
      return
    }
    setIsSubmitting(true);
    try {
      // Get user_id and product name for notification
      const userId = selectedRedemption?.user_id;
      const productName = selectedRedemption?.nama_produk || selectedRedemption?.product_name;
      
      const result = await adminApi.approveRedemption(
        selectedRedemption.id, 
        { catatan_admin: approvalData.notes },
        userId, // Pass userId for auto-notification
        productName // Pass productName for notification message
      );
      if (result.success) {
        // Refresh data from server
        await loadProductRedemptions();
        setShowApprovalModal(false);
        alert('✅ Penukaran disetujui! Notifikasi terkirim ke nasabah.');
      } else {
        alert(`❌ ${result.message || 'Gagal menyetujui penukaran'}`);
      }
    } catch (err) {
      console.error('Approval error:', err);
      alert('Terjadi kesalahan saat menyetujui penukaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectionSubmit = async () => {
    if (!rejectionData.reason.trim()) {
      alert('Alasan penolakan wajib diisi');
      return;
    }
    // ✅ Permission check before submission
    if (!hasPermission('approve_redemption')) {
      alert('❌ You do not have permission to reject redemptions')
      return
    }

    setIsSubmitting(true);
    try {
      // Get user_id and product name for notification
      const userId = selectedRedemption?.user_id;
      const productName = selectedRedemption?.nama_produk || selectedRedemption?.product_name;
      
      const result = await adminApi.rejectRedemption(
        selectedRedemption.id, 
        { reason: rejectionData.reason, notes: rejectionData.notes },
        userId, // Pass userId for auto-notification
        productName // Pass productName for notification message
      );
      if (result.success) {
        // Refresh data from server
        await loadProductRedemptions();
        setShowRejectionModal(false);
        alert('❌ Penukaran ditolak. Poin dikembalikan & notifikasi terkirim ke nasabah.');
      } else {
        alert(`❌ ${result.message || 'Gagal menolak penukaran'}`);
      }
    } catch (err) {
      console.error('Rejection error:', err);
      alert('Terjadi kesalahan saat menolak penukaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickupClick = async (redemption) => {
    if (window.confirm('Konfirmasi produk sudah diambil oleh nasabah?')) {
      try {
        // Get user_id and product name for notification
        const userId = redemption?.user_id;
        const productName = redemption?.nama_produk || redemption?.product_name;
        
        const result = await adminApi.completeRedemption(
          redemption.id,
          'Produk sudah diambil oleh nasabah',
          userId,
          productName
        );
        if (result.success) {
          // Refresh data from server
          await loadProductRedemptions();
          alert('✅ Status updated: Produk sudah diambil/selesai');
        } else {
          alert(`❌ ${result.message || 'Gagal update status'}`);
        }
      } catch (err) {
        console.error('Complete error:', err);
        alert('Terjadi kesalahan saat update status');
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Nasabah', 'Produk', 'Poin', 'Status', 'Tanggal', 'Target Ambil'];
    const csvContent = [
      headers.join(','),
      ...filteredRedemptions.map((r) =>
        [
          r.id,
          r.user_name,
          r.product_name,
          r.poin_digunakan,
          r.status,
          formatDate(r.created_at),
          new Date(r.tanggal_target_ambil).toLocaleDateString('id-ID'),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `penukaran-produk-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const products = [...new Set(redemptions.map((r) => r.product_name))];

  return (
    <div className="product-redemption-management">
      {/* Header */}
      <div className="management-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>Kelola Penukaran Produk</h2>
            <p>Kelola dan persetujui semua permintaan penukaran produk dari nasabah</p>
          </div>
          <button 
            className="btn-refresh"
            onClick={loadProductRedemptions}
            disabled={loading}
            title="Refresh data"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              border: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Penukaran</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-icon" style={{ background: '#e5e7eb' }}>
            <ShoppingCart size={24} color="#6b7280" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Menunggu Persetujuan</span>
            <span className="stat-value" style={{ color: '#f59e0b' }}>{stats.pending}</span>
          </div>
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <Clock size={24} color="#f59e0b" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Disetujui</span>
            <span className="stat-value" style={{ color: '#3b82f6' }}>{stats.approved}</span>
          </div>
          <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <CheckCircle size={24} color="#3b82f6" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Sudah Diambil</span>
            <span className="stat-value" style={{ color: '#10b981' }}>{stats.picked_up}</span>
          </div>
          <div className="stat-icon" style={{ background: '#d1fae5' }}>
            <Check size={24} color="#10b981" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Ditolak</span>
            <span className="stat-value" style={{ color: '#ef4444' }}>{stats.rejected}</span>
          </div>
          <div className="stat-icon" style={{ background: '#fee2e2' }}>
            <XCircle size={24} color="#ef4444" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Poin Digunakan</span>
            <span className="stat-value">{stats.totalPoints}</span>
          </div>
          <div className="stat-icon" style={{ background: '#fef08a' }}>
            <Package size={24} color="#eab308" />
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-bar">
          <div className="search-input">
            <Search size={18} />
            <input
              type="text"
              placeholder="Cari nama, produk, atau ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="approved">Disetujui</option>
            <option value="picked_up">Diambil</option>
            <option value="rejected">Ditolak</option>
          </select>

          <select
            className="filter-select"
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
          >
            <option value="all">Semua Produk</option>
            {products.map((product, index) => (
              <option key={`product-${index}-${product}`} value={product}>
                {product}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="filter-select"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />

          <input
            type="date"
            className="filter-select"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />

          <button className="export-btn" onClick={handleExportCSV}>
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Redemptions Table */}
      {loading ? (
        <div className="loading-state">
          <Loader className="spinner" />
          <p>Memuat data penukaran...</p>
        </div>
      ) : filteredRedemptions.length === 0 ? (
        <div className="empty-state">
          <AlertCircle size={48} />
          <h3>Tidak ada data penukaran</h3>
          <p>Tidak ada penukaran yang sesuai dengan filter Anda</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="redemptions-table-wrapper">
            <table className="redemptions-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nasabah</th>
                  <th>Produk</th>
                  <th>Poin</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredRedemptions.map((redemption) => (
                  <tr key={redemption.id}>
                    <td className="redemption-id">#{redemption.id}</td>
                    <td>
                      <div className="redemption-user">
                        <User size={16} />
                        <div className="user-info">
                          <strong>{redemption.user_name}</strong>
                          <small>{redemption.user_email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="product-info">
                        <Package size={14} />
                        {redemption.product_name}
                      </div>
                    </td>
                    <td className="text-center">{redemption.poin_digunakan}</td>
                    <td className="text-sm">{formatDate(redemption.created_at)}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(redemption.status) + '20', color: getStatusColor(redemption.status) }}
                      >
                        {getStatusIcon(redemption.status)}
                        {getStatusText(redemption.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleViewDetail(redemption)}
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </button>
                        {redemption.status === 'pending' && (
                          <>
                            <button
                              className="action-btn approve-btn"
                              onClick={() => handleApproveClick(redemption)}
                              title="Setujui"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="action-btn reject-btn"
                              onClick={() => handleRejectClick(redemption)}
                              title="Tolak"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {canComplete(redemption.status) && (
                          <>
                            <button
                              className="action-btn pickup-btn"
                              onClick={() => handlePickupClick(redemption)}
                              title="Tandai Selesai/Diambil"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="action-btn reject-btn"
                              onClick={() => handleRejectClick(redemption)}
                              title="Tolak & Refund Poin"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="redemptions-mobile-cards">
            {filteredRedemptions.map((redemption) => (
              <div key={redemption.id} className="redemption-card">
                <div className="card-header">
                  <div className="card-title">
                    <strong>{redemption.product_name}</strong>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(redemption.status) + '20', color: getStatusColor(redemption.status) }}
                    >
                      {getStatusIcon(redemption.status)}
                      {getStatusText(redemption.status)}
                    </span>
                  </div>
                  <small>{redemption.user_name}</small>
                </div>
                <div className="card-body">
                  <div className="card-row">
                    <span className="label">Email:</span>
                    <span className="value">{redemption.user_email}</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Poin:</span>
                    <span className="value">{redemption.poin_digunakan}</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Tanggal:</span>
                    <span className="value">{formatDate(redemption.created_at)}</span>
                  </div>
                </div>
                <div className="card-actions">
                  <button className="action-btn view-btn" onClick={() => handleViewDetail(redemption)}>
                    <Eye size={16} /> Detail
                  </button>
                  {redemption.status === 'pending' && (
                    <>
                      <button className="action-btn approve-btn" onClick={() => handleApproveClick(redemption)}>
                        <Check size={16} /> Setujui
                      </button>
                      <button className="action-btn reject-btn" onClick={() => handleRejectClick(redemption)}>
                        <X size={16} /> Tolak
                      </button>
                    </>
                  )}
                  {canComplete(redemption.status) && (
                    <>
                      <button className="action-btn pickup-btn" onClick={() => handlePickupClick(redemption)}>
                        <Check size={16} /> Selesai
                      </button>
                      <button className="action-btn reject-btn" onClick={() => handleRejectClick(redemption)}>
                        <X size={16} /> Tolak
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRedemption && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Penukaran Produk</h3>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              {/* Product Image */}
              <div className="product-image-section">
                <img src={selectedRedemption.product_image} alt={selectedRedemption.product_name} className="product-image" />
              </div>

              {/* Product & User Info */}
              <div className="info-section">
                <h4>Informasi Penukaran</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">ID Penukaran</span>
                    <span className="value">#{selectedRedemption.id}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Nama Nasabah</span>
                    <span className="value">{selectedRedemption.user_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Email</span>
                    <span className="value">{selectedRedemption.user_email}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Nama Produk</span>
                    <span className="value">{selectedRedemption.product_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Poin Digunakan</span>
                    <span className="value">{selectedRedemption.poin_digunakan}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Metode Ambil</span>
                    <span className="value">{selectedRedemption.metode_ambil}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Tanggal Penukaran</span>
                    <span className="value">{formatDate(selectedRedemption.created_at)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Target Pengambilan</span>
                    <span className="value">{new Date(selectedRedemption.tanggal_target_ambil).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* Nasabah Notes */}
              {selectedRedemption.catatan && (
                <div className="notes-section">
                  <h4>Catatan Nasabah</h4>
                  <div className="notes-box">
                    <p>{selectedRedemption.catatan}</p>
                  </div>
                </div>
              )}

              {/* Status Info */}
              <div className="status-section">
                <h4>Status Verifikasi</h4>
                <div className="status-info">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(selectedRedemption.status) + '20', color: getStatusColor(selectedRedemption.status) }}
                  >
                    {getStatusIcon(selectedRedemption.status)}
                    {getStatusText(selectedRedemption.status)}
                  </span>
                  {selectedRedemption.catatan_admin && (
                    <div className="notes-box">
                      <strong>Catatan Admin:</strong>
                      <p>{selectedRedemption.catatan_admin}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {selectedRedemption.status === 'pending' && (
                <>
                  <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>
                    Tutup
                  </button>
                  <div className="modal-actions">
                    <button className="btn-reject" onClick={() => { setShowDetailModal(false); handleRejectClick(selectedRedemption); }}>
                      <X size={16} /> Tolak
                    </button>
                    <button className="btn-approve" onClick={() => { setShowDetailModal(false); handleApproveClick(selectedRedemption); }}>
                      <Check size={16} /> Setujui
                    </button>
                  </div>
                </>
              )}
              {selectedRedemption.status !== 'pending' && (
                <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedRedemption && (
        <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Setujui Penukaran Produk</h3>
              <button className="close-btn" onClick={() => setShowApprovalModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="approval-info">
                <div className="info-item">
                  <span className="label">Nasabah</span>
                  <span className="value">{selectedRedemption.user_name}</span>
                </div>
                <div className="info-item">
                  <span className="label">Produk</span>
                  <span className="value">{selectedRedemption.product_name}</span>
                </div>
                <div className="info-item">
                  <span className="label">Poin yang Digunakan</span>
                  <span className="value">{selectedRedemption.poin_digunakan}</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Catatan (Opsional)</label>
                <textarea
                  id="notes"
                  value={approvalData.notes}
                  onChange={(e) => setApprovalData({ ...approvalData, notes: e.target.value })}
                  placeholder="Contoh: Sudah disiapkan di loket 2, silakan datang besok pukul 10:00"
                  rows="4"
                />
              </div>

              <div className="approval-note">
                <AlertCircle size={16} />
                <div>
                  <p><strong>Informasi:</strong></p>
                  <ul>
                    <li>Nasabah akan menerima notifikasi approval</li>
                    <li>Produk harus disiapkan untuk pengambilan</li>
                    <li>Status berubah menjadi "Diambil" saat nasabah mengambil produk</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowApprovalModal(false)} disabled={isSubmitting}>
                Batal
              </button>
              <button className="btn-approve" onClick={handleApprovalSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Memproses...' : 'Setujui Penukaran'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedRedemption && (
        <div className="modal-overlay" onClick={() => setShowRejectionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tolak Penukaran Produk</h3>
              <button className="close-btn" onClick={() => setShowRejectionModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="rejection-info">
                <div className="info-item">
                  <span className="label">Nasabah</span>
                  <span className="value">{selectedRedemption.user_name}</span>
                </div>
                <div className="info-item">
                  <span className="label">Produk</span>
                  <span className="value">{selectedRedemption.product_name}</span>
                </div>
                <div className="info-item">
                  <span className="label">Poin akan Dikembalikan</span>
                  <span className="value">{selectedRedemption.poin_digunakan}</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reason">
                  Alasan Penolakan <span className="required">*</span>
                </label>
                <select
                  id="reason"
                  value={rejectionData.reason}
                  onChange={(e) => setRejectionData({ ...rejectionData, reason: e.target.value })}
                >
                  <option value="">Pilih alasan penolakan</option>
                  <option value="Stok produk habis">Stok produk habis</option>
                  <option value="Produk rusak/tidak layak">Produk rusak/tidak layak</option>
                  <option value="Permintaan ditarik kembali">Permintaan ditarik kembali</option>
                  <option value="Data nasabah tidak valid">Data nasabah tidak valid</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Keterangan Tambahan</label>
                <textarea
                  id="notes"
                  value={rejectionData.notes}
                  onChange={(e) => setRejectionData({ ...rejectionData, notes: e.target.value })}
                  placeholder="Jelaskan secara detail alasan penolakan..."
                  rows="4"
                />
              </div>

              <div className="rejection-note">
                <AlertCircle size={16} />
                <div>
                  <p>Nasabah akan menerima notifikasi penolakan dan poin akan dikembalikan ke akun mereka.</p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowRejectionModal(false)} disabled={isSubmitting}>
                Batal
              </button>
              <button className="btn-reject" onClick={handleRejectionSubmit} disabled={isSubmitting || !rejectionData.reason}>
                {isSubmitting ? 'Memproses...' : 'Tolak Penukaran'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
