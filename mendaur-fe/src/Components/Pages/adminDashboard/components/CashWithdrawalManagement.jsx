import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye,
  Download,
  Search,
  Check,
  X,
  Loader,
  Calendar,
  User,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import adminApi from '../../../../services/adminApi';
import '../styles/cashWithdrawalManagement.css';

// Mock data for fallback
const MOCK_CASH_WITHDRAWALS = [
  {
    id: 1,
    user_id: 1,
    user_name: 'Budi Santoso',
    user_email: 'budi@email.com',
    jumlah_poin: 5000,
    jumlah_rupiah: 50000,
    nama_bank: 'BCA',
    nomor_rekening: '1234567890',
    nama_penerima: 'Budi Santoso',
    status: 'pending',
    created_at: '2025-12-20T10:30:00',
    catatan_admin: null,
  },
  {
    id: 2,
    user_id: 2,
    user_name: 'Siti Nurhaliza',
    user_email: 'siti@email.com',
    jumlah_poin: 8000,
    jumlah_rupiah: 80000,
    nama_bank: 'Mandiri',
    nomor_rekening: '9876543210',
    nama_penerima: 'Siti N',
    status: 'approved',
    created_at: '2025-12-19T14:15:00',
    catatan_admin: 'Sudah ditransfer',
    tanggal_verifikasi: '2025-12-19T15:00:00',
    processed_at: '2025-12-20T09:00:00',
  },
  {
    id: 3,
    user_id: 3,
    user_name: 'Ahmad Wijaya',
    user_email: 'ahmad@email.com',
    jumlah_poin: 3000,
    jumlah_rupiah: 30000,
    nama_bank: 'BNI',
    nomor_rekening: '1111111111',
    nama_penerima: 'Ahmad W',
    status: 'rejected',
    created_at: '2025-12-18T09:45:00',
    catatan_admin: 'Nomor rekening tidak valid',
    tanggal_verifikasi: '2025-12-18T11:00:00',
  },
  {
    id: 4,
    user_id: 4,
    user_name: 'Dina Kusuma',
    user_email: 'dina@email.com',
    jumlah_poin: 10000,
    jumlah_rupiah: 100000,
    nama_bank: 'BCA',
    nomor_rekening: '2222222222',
    nama_penerima: 'Dina Kusuma',
    status: 'pending',
    created_at: '2025-12-20T08:20:00',
    catatan_admin: null,
  },
];

export default function CashWithdrawalManagement() {
  const { hasPermission } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [approvalData, setApprovalData] = useState({ notes: '' });
  const [rejectionData, setRejectionData] = useState({ reason: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Separated fetch function (Session 2 pattern)
  const loadCashWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.getCashWithdrawals();
      
      // Multi-format response handler (supports 3+ formats)
      let data = MOCK_CASH_WITHDRAWALS;
      if (Array.isArray(result.data)) data = result.data;
      else if (result.data?.data) data = result.data.data;
      else if (result.data?.withdrawals) data = result.data.withdrawals;
      
      // Map API response to expected format (handle nested user object)
      const mappedData = data.map(w => ({
        ...w,
        // Handle nested user object from API
        user_name: w.user_name || w.user?.name || w.user?.nama_lengkap || w.nama_penerima || '-',
        user_email: w.user_email || w.user?.email || '-',
        // Ensure numeric values
        jumlah_poin: Number(w.jumlah_poin) || 0,
        jumlah_rupiah: Number(w.jumlah_rupiah) || 0,
      }));
      
      setWithdrawals(mappedData);
    } catch {
      setWithdrawals(MOCK_CASH_WITHDRAWALS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load withdrawals on component mount
  useEffect(() => {
    loadCashWithdrawals();
  }, [loadCashWithdrawals]);

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!w.user_name.toLowerCase().includes(query) && !w.id.toString().includes(query)) return false;
    }
    if (dateFrom || dateTo) {
      const wDate = new Date(w.created_at);
      if (dateFrom && wDate < new Date(dateFrom)) return false;
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (wDate > toDate) return false;
      }
    }
    return true;
  });

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter((w) => w.status === 'pending').length,
    approved: withdrawals.filter((w) => w.status === 'approved').length,
    rejected: withdrawals.filter((w) => w.status === 'rejected').length,
    totalPoints: withdrawals.reduce((sum, w) => sum + (Number(w.jumlah_poin) || 0), 0),
    totalRupiah: withdrawals.reduce((sum, w) => sum + (Number(w.jumlah_rupiah) || 0), 0),
  };

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
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'approved': return <CheckCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      default: return null;
    }
  };

  const handleViewDetail = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailModal(true);
  };

  const handleApproveClick = (withdrawal) => {
    // ✅ Permission check
    if (!hasPermission('approve_withdrawal')) {
      alert('❌ You do not have permission to approve withdrawals')
      return
    }
    setSelectedWithdrawal(withdrawal);
    setApprovalData({ notes: '' });
    setShowApprovalModal(true);
  };

  const handleRejectClick = (withdrawal) => {
    // ✅ Permission check
    if (!hasPermission('approve_withdrawal')) {
      alert('❌ You do not have permission to reject withdrawals')
      return
    }
    setSelectedWithdrawal(withdrawal);
    setRejectionData({ reason: '', notes: '' });
    setShowRejectionModal(true);
  };

  const handleApprovalSubmit = async () => {
    // ✅ Permission check before submission
    if (!hasPermission('approve_withdrawal')) {
      alert('❌ You do not have permission to approve withdrawals')
      return
    }
    setIsSubmitting(true);
    try {
      // Get user_id and amount for notification
      const userId = selectedWithdrawal?.user_id;
      const amount = selectedWithdrawal?.jumlah_rupiah;
      
      const result = await adminApi.approveCashWithdrawal(
        selectedWithdrawal.id, 
        approvalData.notes,
        userId, // Pass userId for auto-notification
        amount // Pass amount for notification message
      );
      if (result.success) {
        // Refresh data from server
        await loadCashWithdrawals();
        setShowApprovalModal(false);
        alert('✅ Penarikan disetujui! Notifikasi terkirim ke nasabah.');
      } else {
        alert(`❌ ${result.message || 'Gagal menyetujui penarikan'}`);
      }
    } catch (err) {
      console.error('Approval error:', err);
      alert('Terjadi kesalahan saat menyetujui penarikan');
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
    if (!hasPermission('approve_withdrawal')) {
      alert('❌ You do not have permission to reject withdrawals')
      return
    }
    setIsSubmitting(true);
    try {
      // Get user_id for notification
      const userId = selectedWithdrawal?.user_id;
      
      const result = await adminApi.rejectCashWithdrawal(
        selectedWithdrawal.id, 
        { reason: rejectionData.reason, notes: rejectionData.notes },
        userId // Pass userId for auto-notification
      );
      if (result.success) {
        // Refresh data from server
        await loadCashWithdrawals();
        setShowRejectionModal(false);
        alert('❌ Penarikan ditolak. Poin dikembalikan & notifikasi terkirim ke nasabah.');
      } else {
        alert(`❌ ${result.message || 'Gagal menolak penarikan'}`);
      }
    } catch (err) {
      console.error('Rejection error:', err);
      alert('Terjadi kesalahan saat menolak penarikan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Nasabah', 'Poin', 'Nominal (Rp)', 'Bank', 'Status', 'Tanggal'];
    const csvContent = [
      headers.join(','),
      ...filteredWithdrawals.map((w) =>
        [w.id, w.user_name, w.jumlah_poin, w.jumlah_rupiah, w.nama_bank, w.status, formatDate(w.created_at)].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `penarikan-tunai-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="cash-withdrawal-management">
      <div className="management-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>Kelola Penarikan Tunai</h2>
            <p>Kelola dan persetujui semua permintaan penarikan tunai dari nasabah</p>
          </div>
          <button 
            className="btn-refresh"
            onClick={loadCashWithdrawals}
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

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Penarikan</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-icon" style={{ background: '#e5e7eb' }}>
            <DollarSign size={24} color="#6b7280" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Menunggu</span>
            <span className="stat-value" style={{ color: '#f59e0b' }}>{stats.pending}</span>
          </div>
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <Clock size={24} color="#f59e0b" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Disetujui</span>
            <span className="stat-value" style={{ color: '#10b981' }}>{stats.approved}</span>
          </div>
          <div className="stat-icon" style={{ background: '#d1fae5' }}>
            <CheckCircle size={24} color="#10b981" />
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
            <span className="stat-label">Total Poin</span>
            <span className="stat-value">{stats.totalPoints}</span>
          </div>
          <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <CreditCard size={24} color="#0284c7" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Nominal</span>
            <span className="stat-value">Rp {stats.totalRupiah.toLocaleString('id-ID')}</span>
          </div>
          <div className="stat-icon" style={{ background: '#fef08a' }}>
            <DollarSign size={24} color="#eab308" />
          </div>
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-bar">
          <div className="search-input">
            <Search size={18} />
            <input
              type="text"
              placeholder="Cari nama atau ID..."
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
            <option value="rejected">Ditolak</option>
          </select>

          <input type="date" className="filter-select" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" className="filter-select" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />

          <button className="export-btn" onClick={handleExportCSV}>
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader className="spinner" />
          <p>Memuat data penarikan...</p>
        </div>
      ) : filteredWithdrawals.length === 0 ? (
        <div className="empty-state">
          <AlertCircle size={48} />
          <h3>Tidak ada data penarikan</h3>
          <p>Tidak ada penarikan yang sesuai dengan filter Anda</p>
        </div>
      ) : (
        <>
          <div className="withdrawals-table-wrapper">
            <table className="withdrawals-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nasabah</th>
                  <th>Poin</th>
                  <th>Nominal</th>
                  <th>Bank</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredWithdrawals.map((w) => (
                  <tr key={w.id}>
                    <td className="withdrawal-id">#{w.id}</td>
                    <td>
                      <div className="withdrawal-user">
                        <User size={16} />
                        <div className="user-info">
                          <strong>{w.user_name}</strong>
                          <small>{w.user_email}</small>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">{w.jumlah_poin}</td>
                    <td className="text-center">Rp {w.jumlah_rupiah.toLocaleString('id-ID')}</td>
                    <td>{w.nama_bank}</td>
                    <td className="text-sm">{formatDate(w.created_at)}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(w.status) + '20', color: getStatusColor(w.status) }}
                      >
                        {getStatusIcon(w.status)}
                        {getStatusText(w.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn view-btn" onClick={() => handleViewDetail(w)} title="Lihat Detail">
                          <Eye size={16} />
                        </button>
                        {w.status === 'pending' && (
                          <>
                            <button className="action-btn approve-btn" onClick={() => handleApproveClick(w)} title="Setujui">
                              <Check size={16} />
                            </button>
                            <button className="action-btn reject-btn" onClick={() => handleRejectClick(w)} title="Tolak">
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

          <div className="withdrawals-mobile-cards">
            {filteredWithdrawals.map((w) => (
              <div key={w.id} className="withdrawal-card">
                <div className="card-header">
                  <div className="card-title">
                    <strong>{w.user_name}</strong>
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(w.status) + '20', color: getStatusColor(w.status) }}>
                      {getStatusIcon(w.status)}
                      {getStatusText(w.status)}
                    </span>
                  </div>
                  <small>{w.user_email}</small>
                </div>
                <div className="card-body">
                  <div className="card-row">
                    <span className="label">Poin:</span>
                    <span className="value">{w.jumlah_poin}</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Nominal:</span>
                    <span className="value">Rp {w.jumlah_rupiah.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Bank:</span>
                    <span className="value">{w.nama_bank}</span>
                  </div>
                </div>
                <div className="card-actions">
                  <button className="action-btn view-btn" onClick={() => handleViewDetail(w)}>
                    <Eye size={16} /> Detail
                  </button>
                  {w.status === 'pending' && (
                    <>
                      <button className="action-btn approve-btn" onClick={() => handleApproveClick(w)}>
                        <Check size={16} /> Setujui
                      </button>
                      <button className="action-btn reject-btn" onClick={() => handleRejectClick(w)}>
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

      {showDetailModal && selectedWithdrawal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Penarikan Tunai</h3>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="info-section">
                <h4>Informasi Penarikan</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">ID</span>
                    <span className="value">#{selectedWithdrawal.id}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Nama Nasabah</span>
                    <span className="value">{selectedWithdrawal.user_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Email</span>
                    <span className="value">{selectedWithdrawal.user_email}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Poin</span>
                    <span className="value">{selectedWithdrawal.jumlah_poin}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Nominal (Rp)</span>
                    <span className="value">{selectedWithdrawal.jumlah_rupiah.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Tanggal</span>
                    <span className="value">{formatDate(selectedWithdrawal.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h4>Data Rekening Bank</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Nama Bank</span>
                    <span className="value">{selectedWithdrawal.nama_bank}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Nomor Rekening</span>
                    <span className="value">{selectedWithdrawal.nomor_rekening}</span>
                  </div>
                  <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="label">Nama Penerima</span>
                    <span className="value">{selectedWithdrawal.nama_penerima}</span>
                  </div>
                </div>
              </div>

              {selectedWithdrawal.catatan_admin && (
                <div className="info-section">
                  <h4>Catatan Admin</h4>
                  <div className="notes-box">
                    <p>{selectedWithdrawal.catatan_admin}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedWithdrawal.status === 'pending' && (
                <>
                  <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>
                    Tutup
                  </button>
                  <div className="modal-actions">
                    <button className="btn-reject" onClick={() => { setShowDetailModal(false); handleRejectClick(selectedWithdrawal); }}>
                      <X size={16} /> Tolak
                    </button>
                    <button className="btn-approve" onClick={() => { setShowDetailModal(false); handleApproveClick(selectedWithdrawal); }}>
                      <Check size={16} /> Setujui
                    </button>
                  </div>
                </>
              )}
              {selectedWithdrawal.status !== 'pending' && (
                <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showApprovalModal && selectedWithdrawal && (
        <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Setujui Penarikan Tunai</h3>
              <button className="close-btn" onClick={() => setShowApprovalModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="approval-info">
                <div className="info-item">
                  <span className="label">Nasabah</span>
                  <span className="value">{selectedWithdrawal.user_name}</span>
                </div>
                <div className="info-item">
                  <span className="label">Nominal</span>
                  <span className="value">Rp {selectedWithdrawal.jumlah_rupiah.toLocaleString('id-ID')}</span>
                </div>
                <div className="info-item">
                  <span className="label">Rekening Tujuan</span>
                  <span className="value">{selectedWithdrawal.nama_bank} - {selectedWithdrawal.nomor_rekening}</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Catatan Transfer</label>
                <textarea
                  id="notes"
                  value={approvalData.notes}
                  onChange={(e) => setApprovalData({ ...approvalData, notes: e.target.value })}
                  placeholder="Contoh: Transfer dalam 1x24 jam"
                  rows="4"
                />
              </div>

              <div className="approval-note">
                <AlertCircle size={16} />
                <div>
                  <p><strong>Instruksi:</strong></p>
                  <ul>
                    <li>Pastikan data rekening valid sebelum approve</li>
                    <li>Poin akan dikurangi dari akun nasabah</li>
                    <li>Lakukan transfer ke rekening yang terdaftar</li>
                    <li>Konfirmasi setelah transfer dilakukan</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowApprovalModal(false)} disabled={isSubmitting}>
                Batal
              </button>
              <button className="btn-approve" onClick={handleApprovalSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Memproses...' : 'Setujui Penarikan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectionModal && selectedWithdrawal && (
        <div className="modal-overlay" onClick={() => setShowRejectionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tolak Penarikan Tunai</h3>
              <button className="close-btn" onClick={() => setShowRejectionModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="rejection-info">
                <div className="info-item">
                  <span className="label">Nasabah</span>
                  <span className="value">{selectedWithdrawal.user_name}</span>
                </div>
                <div className="info-item">
                  <span className="label">Nominal (Rp)</span>
                  <span className="value">{selectedWithdrawal.jumlah_rupiah.toLocaleString('id-ID')}</span>
                </div>
                <div className="info-item">
                  <span className="label">Poin akan Dikembalikan</span>
                  <span className="value">{selectedWithdrawal.jumlah_poin}</span>
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
                  <option value="Nomor rekening tidak valid">Nomor rekening tidak valid</option>
                  <option value="Data tidak sesuai">Data tidak sesuai</option>
                  <option value="Limit penarikan tercapai">Limit penarikan tercapai</option>
                  <option value="Verifikasi gagal">Verifikasi gagal</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Keterangan</label>
                <textarea
                  id="notes"
                  value={rejectionData.notes}
                  onChange={(e) => setRejectionData({ ...rejectionData, notes: e.target.value })}
                  placeholder="Jelaskan alasan penolakan..."
                  rows="4"
                />
              </div>

              <div className="rejection-note">
                <AlertCircle size={16} />
                <p>Poin akan dikembalikan dan nasabah dapat mengajukan ulang.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowRejectionModal(false)} disabled={isSubmitting}>
                Batal
              </button>
              <button className="btn-reject" onClick={handleRejectionSubmit} disabled={isSubmitting || !rejectionData.reason}>
                {isSubmitting ? 'Memproses...' : 'Tolak Penarikan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
