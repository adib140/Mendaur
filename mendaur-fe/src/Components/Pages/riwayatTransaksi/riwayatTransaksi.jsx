import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowUp,
  ArrowDown,
  Calendar,
  CheckCircle,
  Truck,
  RefreshCcw,
  RefreshCw,
  XCircle,
  DollarSign,
  Package,
  Recycle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { API_BASE_URL } from "../../../config/api";
import cache from "../../../utils/cache";
import "./riwayatTransaksi.css";

export default function RiwayatTransaksi() {
  const [filterKategori, setFilterKategori] = useState("semua");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // desc = terbaru, asc = terlama
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0
  });

  const statusOptions = [
    { value: "semua", label: "Semua" },
    { value: "pending", label: "Menunggu" },
    { value: "approved", label: "Disetujui" },
    { value: "rejected", label: "Ditolak" }
  ];

  const normalizeStatus = (status) => {
    if (!status) return "pending";
    const statusLower = status.toLowerCase();
    if (["approved", "disetujui", "claimed", "delivered"].includes(statusLower)) return "approved";
    if (["completed", "selesai"].includes(statusLower)) return "completed";
    if (["rejected", "ditolak", "cancelled", "dibatalkan"].includes(statusLower)) return "rejected";
    if (["pending", "menunggu", "diproses"].includes(statusLower)) return "pending";
    return "pending";
  };

  // Optimized fetch with parallel requests and caching
  const fetchTransactions = useCallback(async (forceRefresh = false) => {
    const userId = localStorage.getItem('id_user');
    const token = localStorage.getItem('token');
    const cacheKey = `transactions-${userId}`;

    // Check cache first
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) {
        setTransactions(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch ALL 3 endpoints in PARALLEL
      const fetchOptions = {
        credentials: 'include',  // ⚠️ WAJIB untuk Safari/iOS
        mode: 'cors',
      };
      
      const [withdrawalsRes, wasteRes, productRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/penarikan-tunai`, {
          ...fetchOptions,
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        }),
        fetch(`${API_BASE_URL}/users/${userId}/tabung-sampah`, {
          ...fetchOptions,
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        }),
        fetch(`${API_BASE_URL}/penukaran-produk/user/${userId}`, {
          ...fetchOptions,
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        }),
      ]);

      let withdrawals = [];
      let wasteDeposits = [];
      let productRedemptions = [];

      // Process withdrawals
      if (withdrawalsRes.status === 'fulfilled' && withdrawalsRes.value.ok) {
        const data = await withdrawalsRes.value.json();
        const allWithdrawals = data.data?.data || data.data || [];
        withdrawals = allWithdrawals
          .filter(item => item.user_id?.toString() === userId?.toString())
          .map(item => ({
            id: `withdrawal-${item.penarikan_tunai_id}`,
            type: 'tarik_tunai',
            kategori: 'penukaran',
            deskripsi: `Penarikan Tunai ke ${item.nama_bank}`,
            detail: `-${item.jumlah_poin} poin`,
            points: -item.jumlah_poin,
            amount: item.jumlah_rupiah,
            status: item.status,
            normalizedStatus: normalizeStatus(item.status),
            timestamp: item.created_at,
            bankName: item.nama_bank,
            accountNumber: item.nomor_rekening,
            accountName: item.nama_penerima,
            adminNote: item.catatan_admin,
            processedAt: item.processed_at,
          }));
      }

      // Process waste deposits
      if (wasteRes.status === 'fulfilled' && wasteRes.value.ok) {
        const data = await wasteRes.value.json();
        wasteDeposits = (data.data || []).map(item => ({
          id: `waste-${item.tabung_sampah_id}`,
          type: 'tabung_sampah',
          kategori: 'tabung',
          deskripsi: `Tabung ${item.jenis_sampah}`,
          detail: `+${item.poin_didapat || item.poin_diperoleh || 0} poin`,
          points: item.poin_didapat || item.poin_diperoleh || 0,
          status: item.status || 'approved',
          normalizedStatus: normalizeStatus(item.status || 'approved'),
          timestamp: item.tanggal_setor || item.created_at,
          wasteType: item.jenis_sampah,
          weight: item.berat_kg || item.berat,
          location: item.titik_lokasi || item.lokasi,
        }));
      }

      // Process product redemptions
      if (productRes.status === 'fulfilled' && productRes.value.ok) {
        const data = await productRes.value.json();
        const allRedemptions = Array.isArray(data) ? data : (data.data || []);
        productRedemptions = allRedemptions
          .map(item => ({
            id: `product-${item.id || item.penukaran_produk_id}`,
            type: 'tukar_produk',
            kategori: 'penukaran',
            deskripsi: `Penukaran ${item.produk?.nama || item.nama_produk || 'Produk'}`,
            detail: `-${item.poin_digunakan || item.jumlah_poin || 0} poin`,
            points: -(item.poin_digunakan || item.jumlah_poin || 0),
            status: item.status || 'pending',
            normalizedStatus: normalizeStatus(item.status || 'pending'),
            timestamp: item.created_at,
            productName: item.produk?.nama || item.nama_produk,
            productId: item.produk?.id || item.produk_id,
            quantity: item.jumlah || 1,
            claimInstructions: item.status === 'approved' ? 'Silakan datang ke kantor Bank Sampah untuk mengambil produk' : null,
            adminNote: item.catatan_admin,
            approvedAt: item.approved_at,
            claimedAt: item.claimed_at,
            rejectedAt: item.rejected_at,
          }));
      }

      // Combine and sort
      const allTransactions = [...withdrawals, ...wasteDeposits, ...productRedemptions];
      allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Calculate stats
      const newStats = {
        total: allTransactions.length,
        pending: allTransactions.filter(t => t.normalizedStatus === 'pending').length,
        approved: allTransactions.filter(t => t.normalizedStatus === 'approved').length,
        rejected: allTransactions.filter(t => t.normalizedStatus === 'rejected').length,
        completed: allTransactions.filter(t => t.normalizedStatus === 'completed').length
      };
      setStats(newStats);

      setTransactions(allTransactions);
      // Cache for 1 minute
      cache.set(cacheKey, allTransactions, 60000);
    } catch {
      setError('Gagal memuat riwayat transaksi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
      case "selesai":
      case "delivered":
      case "claimed":
      case "completed":
        return <CheckCircle className="statusIcon green" />;
      case "pending":
      case "diproses":
        return <RefreshCcw className="statusIcon orange" />;
      case "rejected":
      case "dibatalkan":
      case "cancelled":
        return <XCircle className="statusIcon red" />;
      case "dikirim":
      case "shipped":
        return <Truck className="statusIcon blue" />;
      default:
        return <Clock className="statusIcon gray" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved": return "Disetujui - Siap Diambil";
      case "pending": return "Menunggu Persetujuan";
      case "rejected": return "Ditolak";
      case "claimed": return "Sudah Diambil";
      case "selesai": return "Selesai";
      case "completed": return "Selesai";
      case "dikirim": return "Dikirim";
      case "shipped": return "Dalam Pengiriman";
      case "delivered": return "Sudah Diterima";
      case "diproses": return "Diproses";
      case "dibatalkan": return "Dibatalkan";
      case "cancelled": return "Dibatalkan";
      default: return "Menunggu";
    }
  };

  // Filter and sort transactions using normalizedStatus
  const filteredTransactions = transactions
    .filter((item) => {
      const matchKategori = filterKategori === "semua" || item.kategori === filterKategori;
      const matchStatus = filterStatus === "semua" || item.normalizedStatus === filterStatus;
      const matchSearch = item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase());
      return matchKategori && matchStatus && matchSearch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.tanggal);
      const dateB = new Date(b.tanggal);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="riwayatContainer">
      <header className="riwayatHeader">
        <div className="headerTitleRow">
          <div>
            <h1>Riwayat Aktivitas</h1>
            <p>Jejak kontribusi dan penukaran Anda di Mendaur</p>
          </div>
        </div>
      </header>

      {/* Stats Info - Similar to Riwayat Tabung */}
      <div className="riwayatStatsInfo">
        <div className="statItem">
          <span className="statLabel">Total</span>
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

      {/* Search & Status Filter */}
      <div className="searchAndStatus">
        <div className="searchBox">
          <Search className="searchIcon" />
          <input
            type="text"
            placeholder="Cari aktivitas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          className="sortButton"
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          title={sortOrder === "desc" ? "Terbaru" : "Terlama"}
        >
          {sortOrder === "desc" ? (
            <>
              <ArrowDown size={16} />
              <span>Terbaru</span>
            </>
          ) : (
            <>
              <ArrowUp size={16} />
              <span>Terlama</span>
            </>
          )}
        </button>

        <select
          className="statusDropdown"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Kategori Filter */}
      <div className="riwayatFilterBar">
        <div className="filterKategoriStatus">
          <button
            className={`filterStatusItem ${filterKategori === "semua" ? "active" : ""}`}
            onClick={() => setFilterKategori("semua")}
          >
            <div className="statusIconWrapper">
              <RefreshCcw className="statusIcon gray" />
              <span className="statusLabel">Semua</span>
            </div>
          </button>

          <button
            className={`filterStatusItem ${filterKategori === "tabung" ? "active" : ""}`}
            onClick={() => setFilterKategori("tabung")}
          >
            <div className="statusIconWrapper">
              <CheckCircle className="statusIcon green" />
              <span className="statusLabel">Tabung Sampah</span>
            </div>
          </button>

          <button
            className={`filterStatusItem ${filterKategori === "penukaran" ? "active" : ""}`}
            onClick={() => setFilterKategori("penukaran")}
          >
            <div className="statusIconWrapper">
              <XCircle className="statusIcon red" />
              <span className="statusLabel">Penukaran</span>
            </div>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loadingState">
          <Loader className="spinner" size={40} />
          <p>Memuat riwayat transaksi...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="errorState">
          <AlertCircle size={40} />
          <p>{error}</p>
          <button onClick={fetchTransactions}>Coba Lagi</button>
        </div>
      )}

      {/* Riwayat List */}
      {!loading && !error && (
        <div className={`riwayatCardWrapper ${filterKategori === "semua" ? "scrollableWrapper" : ""}`}>
          <ul className="riwayatCardList">
            {filteredTransactions.length === 0 ? (
              <div className="emptyState">
                <p>Tidak ada transaksi ditemukan</p>
                <button onClick={() => {
                  setSearchTerm("");
                  setFilterKategori("semua");
                  setFilterStatus("semua");
                }}>Reset Filter</button>
              </div>
            ) : (
              filteredTransactions.map((item) => (
                <li key={item.id} className={`riwayatCard ${item.normalizedStatus}`}>
                  <div className="cardTop">
                    <div className="cardTitleBlock">
                      <h3 className="cardTitle">{item.deskripsi}</h3>
                      <p className="cardSub">
                        {item.type === "tarik_tunai" && "Penarikan Tunai"}
                        {item.type === "tukar_produk" && "Penukaran Produk"}
                        {item.type === "tabung_sampah" && "Tabung Sampah"}
                        {item.type === "setor_sampah" && "Tabung Sampah"}
                      </p>
                    </div>
                    <div className={`cardPoint ${item.kategori === 'tabung' || item.kategori === 'penyetoran' ? "masuk" : "keluar"}`}>
                      {item.kategori === 'tabung' || item.kategori === 'penyetoran' ? <ArrowUpCircle className="pointIcon" /> : <ArrowDownCircle className="pointIcon" />}
                      <span>{item.detail}</span>
                    </div>
                  </div>

                  <div className="cardDetail">
                    <div className="cardInfoBlock">
                      {/* Cash Withdrawal Details */}
                      {item.type === "tarik_tunai" && (
                        <>
                          <p className="cardNote kurang">
                            <DollarSign size={14} />
                            Rp {item.amount?.toLocaleString('id-ID')}
                          </p>
                          <p className="cardInfo">
                            {item.bankName} - {item.accountNumber}
                          </p>
                          {item.adminNote && (
                            <p className="adminNote">
                              <AlertCircle size={14} />
                              {item.adminNote}
                            </p>
                          )}
                        </>
                      )}

                      {/* Waste Deposit Details */}
                      {(item.type === "tabung_sampah" || item.type === "setor_sampah") && (
                        <>
                          <p className="cardNote tambah">
                            <Recycle size={14} />
                            {item.weight} kg {item.wasteType}
                          </p>
                          {item.location && (
                            <p className="cardInfo">
                              📍 {item.location}
                            </p>
                          )}
                        </>
                      )}

                      {/* Product Redemption Details */}
                      {item.type === "tukar_produk" && (
                        <>
                          <p className="cardNote kurang">
                            <Package size={14} />
                            {item.productName} {item.quantity > 1 && `(${item.quantity}x)`}
                          </p>

                          {/* Claim Instructions for Approved Status */}
                          {item.status === 'approved' && item.claimInstructions && (
                            <div className="claimInstructions">
                              <CheckCircle size={14} className="claimIcon" />
                              <p>{item.claimInstructions}</p>
                            </div>
                          )}

                          {/* Claimed Status */}
                          {item.status === 'claimed' && item.claimedAt && (
                            <p className="cardInfo success">
                              <CheckCircle size={14} />
                              Diambil pada {new Date(item.claimedAt).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          )}

                          {/* Admin Note for Rejected/Cancelled */}
                          {(item.status === 'rejected' || item.status === 'cancelled') && item.adminNote && (
                            <p className="adminNote">
                              <AlertCircle size={14} />
                              Alasan: {item.adminNote}
                            </p>
                          )}

                          {item.trackingNumber && (
                            <p className="cardInfo">
                              <Truck size={14} />
                              Resi: {item.trackingNumber}
                            </p>
                          )}
                          {item.deliveryAddress && (
                            <p className="cardInfo">
                              � {item.deliveryAddress.length > 50
                                ? item.deliveryAddress.substring(0, 50) + '...'
                                : item.deliveryAddress}
                            </p>
                          )}
                          {item.notes && (
                            <p className="cardInfo">
                              💬 {item.notes}
                            </p>
                          )}
                        </>
                      )}

                      {/* Generic Point Labels */}
                      {!item.type && item.points > 0 && <p className="cardNote tambah">Penambahan poin</p>}
                      {!item.type && item.points < 0 && <p className="cardNote kurang">Pengurangan poin</p>}
                    </div>
                    <div className="cardMeta">
                      <div className="metaItem">
                        <Calendar className="metaIcon" />
                        {new Date(item.timestamp).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="metaItem">
                        <Clock className="metaIcon" />
                        {new Date(item.timestamp).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="statusBadge">
                      {getStatusIcon(item.status)}
                      <span>{getStatusText(item.status)}</span>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
