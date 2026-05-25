import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Recycle,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Calendar,
  Package,
  Eye,
  X,
  RefreshCw
} from "lucide-react";
import useScrollTop from "../../lib/useScrollTop";
import { API_BASE_URL, getStorageUrl } from "../../../config/api";
import "./riwayatTabung.css";

const RiwayatTabung = () => {
  useScrollTop();
  const { user } = useAuth();

  const [allDeposits, setAllDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  const fetchDeposits = useCallback(async () => {
    try {
      setLoading(true);

      if (!user?.user_id) {
        console.error("User ID not found - user not authenticated");
        setAllDeposits([]);
        return;
      }

      const url = `${API_BASE_URL}/users/${user.user_id}/tabung-sampah`;
      const token = localStorage.getItem('token');
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',  // ⚠️ WAJIB untuk Safari/iOS
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      // Handle different HTTP status codes
      if (response.status === 401) {
        console.error("Unauthorized: Session expired or token invalid");
        localStorage.removeItem('token');
        setAllDeposits([]);
        return;
      }

      if (response.status === 403) {
        console.error("Forbidden: Cannot access other user's deposit data");
        setAllDeposits([]);
        return;
      }

      if (!response.ok) {
        console.warn(`Tabung Sampah API error: ${response.status} ${response.statusText}`);
        setAllDeposits([]);
        return;
      }

      const result = await response.json();

      if (result.status === "success" && Array.isArray(result.data)) {
        const validData = result.data.filter(deposit => {
          return deposit.user_id === user.user_id;
        });

        setAllDeposits(validData);
        calculateStats(validData);
      } else {
        setAllDeposits([]);
      }
    } catch (error) {
      console.error("Error fetching tabung sampah:", error.message);
      setAllDeposits([]);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  // Fetch on mount
  useEffect(() => {
    if (user?.user_id) {
      fetchDeposits();
    }
  }, [user?.user_id, fetchDeposits]);

  // Client-side filtering
  const filteredDeposits = statusFilter === "all" 
    ? allDeposits 
    : allDeposits.filter(d => d.status === statusFilter);

  const calculateStats = (deposits) => {
    setStats({
      total: deposits.length,
      pending: deposits.filter(d => d.status === "pending").length,
      approved: deposits.filter(d => d.status === "approved").length,
      rejected: deposits.filter(d => d.status === "rejected").length
    });
  };

  const openModal = (deposit) => {
    // Security: Verify deposit belongs to current user before opening
    if (deposit.user_id !== user.user_id) {
      return;
    }
    setSelectedDeposit(deposit);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDeposit(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock size={18} />;
      case "approved":
        return <CheckCircle size={18} />;
      case "rejected":
        return <XCircle size={18} />;
      default:
        return <Package size={18} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "var(--color-orange)";
      case "approved":
        return "var(--color-primary-dark)";
      case "rejected":
        return "var(--destructive)";
      default:
        return "#95a5a6";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Menunggu Verifikasi";
      case "approved":
        return "Disetujui";
      case "rejected":
        return "Ditolak";
      default:
        return status;
    }
  };

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  if (loading) {
    return (
      <div className="riwayatTabungWrapper">
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p>Memuat data tabung sampah...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="riwayatTabungWrapper">
      {/* Header */}
      <div className="headerTop">
        <div className="headerTitle">
          <Recycle size={28} className="headerIcon" />
          <h1 className="headerText">Riwayat Tabung Sampah</h1>
        </div>
        <button 
          className="refreshButton" 
          onClick={handleRefresh} 
          disabled={loading}
          title="Refresh data"
        >
          <RefreshCw size={20} className={loading ? 'spinning' : ''} />
        </button>
      </div>
      <div className="riwayatTabungContent">
        {/* Stats Info */}
        <div className="riwayatTabungInfo">
          <div className="statItem">
            <span className="statLabel">Total Tabung</span>
            <span className="statValue">{stats.total}</span>
          </div>
          <div className="statItem">
            <span className="statLabel">Menunggu</span>
            <span className="statValue">{stats.pending}</span>
          </div>
          <div className="statItem">
            <span className="statLabel">Disetujui</span>
            <span className="statValue">{stats.approved}</span>
          </div>
          <div className="statItem">
            <span className="statLabel">Ditolak</span>
            <span className="statValue">{stats.rejected}</span>
          </div>
        </div>
      </div>
      {/* Filter Section */}
      <div className="filterSection">
        <div className="filterButtons">
          <button
            className={`filterBtn ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            <Filter size={16} />
            Semua ({stats.total})
          </button>
          <button
            className={`filterBtn pending ${statusFilter === "pending" ? "active" : ""}`}
            onClick={() => setStatusFilter("pending")}
          >
            <Clock size={16} />
            Menunggu ({stats.pending})
          </button>
          <button
            className={`filterBtn approved ${statusFilter === "approved" ? "active" : ""}`}
            onClick={() => setStatusFilter("approved")}
          >
            <CheckCircle size={16} />
            Disetujui ({stats.approved})
          </button>
          <button
            className={`filterBtn rejected ${statusFilter === "rejected" ? "active" : ""}`}
            onClick={() => setStatusFilter("rejected")}
          >
            <XCircle size={16} />
            Ditolak ({stats.rejected})
          </button>
        </div>
      </div>

      {/* Deposits List */}
      <div className="depositsContainer">
        {filteredDeposits.length === 0 ? (
          <div className="emptyState">
            <div className="emptyIcon">
              {statusFilter === "all" ? "📦" :
               statusFilter === "pending" ? "⏳" :
               statusFilter === "approved" ? "✅" : "❌"}
            </div>
            <h3 className="emptyTitle">
              {statusFilter === "all"
                ? "Belum ada riwayat tabung sampah"
                : `Tidak ada tabung sampah ${getStatusText(statusFilter).toLowerCase()}`}
            </h3>
            <p className="emptySubtext">
              {statusFilter === "all"
                ? "Mulai tabung sampah untuk berkontribusi pada lingkungan!"
                : `Ubah filter untuk melihat tabung sampah lainnya.`}
            </p>
          </div>
        ) : (
          <div className="depositsList">
            {filteredDeposits.map((deposit) => (
              <DepositCard
                key={deposit.tabung_sampah_id}
                deposit={deposit}
                onViewDetail={() => openModal(deposit)}
                formatDate={formatDate}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedDeposit && (
        <DepositModal
          deposit={selectedDeposit}
          onClose={closeModal}
          formatDate={formatDate}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        />
      )}
    </div>
  );
};

// Deposit Card Component
function DepositCard({ deposit, onViewDetail, formatDate, getStatusIcon, getStatusColor, getStatusText }) {
  return (
    <div className="depositCard">
      <div className="cardHeader">
        <div className="depositInfo">
          <h3 className="depositTitle">{deposit.jenis_sampah || "Sampah"}</h3>
          <p className="depositDate">
            <Calendar size={14} />
            {formatDate(deposit.created_at || deposit.tanggal_setor)}
          </p>
        </div>
        <div
          className="statusBadge"
          style={{ backgroundColor: getStatusColor(deposit.status) }}
        >
          {getStatusIcon(deposit.status)}
          <span>{getStatusText(deposit.status)}</span>
        </div>
      </div>

      <div className="cardBody">
        <div className="depositDetail">
          <span className="detailLabel">Berat</span>
          <span className="detailValue">{deposit.berat_kg || deposit.berat || 0} kg</span>
        </div>
        <div className="depositDetail">
          <span className="detailLabel">Poin Didapat</span>
          <span className="detailValue points">
            {deposit.status === "approved" ? `+${deposit.poin_didapat || 0}` : "-"}
          </span>
        </div>
      </div>

      <button className="viewDetailBtn" onClick={onViewDetail}>
        <Eye size={16} />
        Lihat Detail
      </button>
    </div>
  );
}

// Deposit Modal Component
function DepositModal({ deposit, onClose, formatDate, getStatusIcon, getStatusColor, getStatusText }) {
  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2 className="modalTitle">Detail Tabung Sampah</h2>
          <button className="closeBtn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modalBody">
          {/* Status Badge */}
          <div
            className="modalStatusBadge"
            style={{ backgroundColor: getStatusColor(deposit.status) }}
          >
            {getStatusIcon(deposit.status)}
            <span>{getStatusText(deposit.status)}</span>
          </div>

          {/* Photo Evidence - Check multiple possible field names */}
          {(() => {
            const fotoUrl = deposit.foto_bukti || deposit.foto || deposit.gambar || deposit.image || deposit.photo || deposit.bukti_foto;
            if (!fotoUrl) return null;
            
            const fullUrl = fotoUrl.startsWith('http') ? fotoUrl : getStorageUrl(fotoUrl);
            
            return (
              <div className="photoSection">
                <h3 className="sectionTitle">Foto Bukti</h3>
                <img
                  src={fullUrl}
                  alt="Bukti tabung sampah"
                  className="evidencePhoto"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.style.display = 'none';
                  }}
                />
              </div>
            );
          })()}

          {/* Deposit Information */}
          <div className="infoSection">
            <h3 className="sectionTitle">Informasi Tabung Sampah</h3>
            <div className="infoGrid">
              <div className="infoItem">
                <span className="infoLabel">Jenis Sampah</span>
                <span className="infoValue">{deposit.jenis_sampah || "-"}</span>
              </div>
              
              {/* Show Berat Awal only if it exists and is different from berat_kg */}
              {deposit.berat_awal && parseFloat(deposit.berat_awal) > 0 ? (
                <>
                  <div className="infoItem">
                    <span className="infoLabel">Berat Awal</span>
                    <span className="infoValue">{deposit.berat_awal} kg</span>
                  </div>
                  {deposit.status === "approved" && 
                   parseFloat(deposit.berat_kg || deposit.berat || 0) !== parseFloat(deposit.berat_awal) && (
                    <div className="infoItem">
                      <span className="infoLabel">Berat Dikoreksi</span>
                      <span className="infoValue" style={{ 
                        color: '#f59e0b', 
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        ⚠️ {deposit.berat_kg || deposit.berat || 0} kg
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="infoItem">
                  <span className="infoLabel">Berat</span>
                  <span className="infoValue">{deposit.berat_kg || deposit.berat || 0} kg</span>
                </div>
              )}
              
              <div className="infoItem">
                <span className="infoLabel">Titik Lokasi</span>
                <span className="infoValue">{deposit.titik_lokasi || "-"}</span>
              </div>
              <div className="infoItem">
                <span className="infoLabel">Tanggal Tabung</span>
                <span className="infoValue">{formatDate(deposit.created_at || deposit.tanggal_setor)}</span>
              </div>
              <div className="infoItem">
                <span className="infoLabel">Poin Didapat</span>
                <span className="infoValue points">
                  {deposit.status === "approved" ? `+${deposit.poin_didapat || 0} poin` : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Admin Notes (if rejected) */}
          {deposit.status === "rejected" && deposit.catatan_admin && (
            <div className="notesSection rejected">
              <h3 className="sectionTitle">Alasan Penolakan</h3>
              <p className="notesText">{deposit.catatan_admin}</p>
            </div>
          )}

          {/* Admin Notes (if approved) */}
          {deposit.status === "approved" && deposit.catatan_admin && (
            <div className="notesSection approved">
              <h3 className="sectionTitle">Catatan Admin</h3>
              <p className="notesText">{deposit.catatan_admin}</p>
            </div>
          )}

          {/* Approval Info */}
          {(deposit.status === "approved" || deposit.status === "rejected") && deposit.tanggal_verifikasi && (
            <div className="approvalInfo">
              <p className="approvalText">
                {deposit.status === "approved" ? "Disetujui" : "Ditolak"} pada{" "}
                {formatDate(deposit.tanggal_verifikasi)}
              </p>
            </div>
          )}
        </div>

        <div className="modalFooter">
          <button className="closeModalBtn" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default RiwayatTabung;
