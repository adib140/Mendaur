import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import "./tukarPoin.css";
import Pagination from '../../ui/pagination'
import productApi from "../../../services/productApi";
import ProdukCard from "../produk/produkCard";
import { API_BASE_URL, getStorageUrl } from "../../../config/api";
import cache from "../../../utils/cache";

import {
  Star,
  Coins,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";

const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export default function TukarPoin() {
  const { user, refreshUser } = useAuth();
  
  // Get user points from authenticated user data
  // Use actual_poin for balance/transaction validation (updated for new field structure)
  const total_poin = user?.actual_poin || 0;

  // Product states
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const exchangeOptions = [
    { label: "Produk Ramah Lingkungan", detail: "Tukar dengan produk berkelanjutan", icon: "🛍️" },
    { label: "Tarik Tunai", detail: "100 Poin = Rp 1.000", icon: "💰" },
  ];

  // States
  const [selectedOption, setSelectedOption] = useState("Produk Ramah Lingkungan");
  const [showCashModal, setShowCashModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Bank account details for withdrawal
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");

  // Product redemption states
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [redeemError, setRedeemError] = useState("");
  const [redeemQuantity, setRedeemQuantity] = useState(1);


  // Fetch products from backend with caching
  const fetchProducts = useCallback(async () => {
    const cacheKey = 'tukar_poin_products';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      setProducts(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    const result = await productApi.getAllProducts();

    if (result.success) {
      setProducts(result.data);
      cache.set(cacheKey, result.data, CACHE_TTL);
    } else {
      setError(result.message);
      setProducts([]);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [sortBy, setSortBy] = useState("terbaru");

  // Logic Pagination Produk
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 4;
  
  // Use products from API
  const allProducts = products;

  // Get unique categories from products (filter out null/empty values)
  const categories = [
    "Semua", 
    ...new Set(
      allProducts
        .map(p => p.kategori)
        .filter(cat => cat && cat.trim() !== '') // Filter out null, undefined, and empty strings
    )
  ];

  // Filter and search logic
  const filteredProducts = allProducts.filter((product) => {
    // Category filter
    const matchesCategory = selectedCategory === "Semua" 
      ? true 
      : product.kategori === selectedCategory;

    // Search filter (name or description)
    const matchesSearch = searchQuery
      ? product.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchesCategory && matchesSearch;
  });

  // Sort logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "termurah":
        return parseInt(a.harga_poin) - parseInt(b.harga_poin);
      case "termahal":
        return parseInt(b.harga_poin) - parseInt(a.harga_poin);
      case "terpopuler":
        // Sort by stock (lower stock = more popular)
        return parseInt(a.stok) - parseInt(b.stok);
      case "terbaru":
      default:
        // Sort by created_at if available, otherwise keep original order
        if (a.created_at && b.created_at) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return 0;
    }
  });

  const displayProducts = sortedProducts;
  const totalPages = Math.ceil(displayProducts.length / perPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  function nextPage() {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }

  function prevPage() {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }

  // Logic Hitung jumlah Produk per halaman
  const startIndex = (currentPage - 1) * perPage;
  const paginatedProduk = displayProducts.slice(startIndex, startIndex + perPage);


  // Handle option selection
  function handleExchange(item) {
    if (selectedOption === item.label) {
      // If clicking the same option, deselect it
      setSelectedOption(null);
      return;
    }

    setSelectedOption(item.label);

    if (item.label === "Tarik Tunai") {
      setShowCashModal(true);
    }
  }

  // Calculate cash equivalent
  function calculateRupiah(points) {
    return (points / 100) * 1000;
  }

  // Handle withdraw amount change
  function handleWithdrawChange(e) {
    const value = e.target.value;
    setWithdrawAmount(value);
    setWithdrawError("");

    const points = parseInt(value) || 0;
    
    if (points > 0) {
      if (points < 2000) {
        setWithdrawError("Minimum penarikan adalah 2.000 poin (Rp 20.000)");
      } else if (points > total_poin) {
        setWithdrawError("Poin tidak mencukupi");
      } else if (points % 100 !== 0) {
        setWithdrawError("Jumlah poin harus kelipatan 100");
      }
    }
  }

  // Submit cash withdrawal
  async function handleWithdrawSubmit() {
    const points = parseInt(withdrawAmount) || 0;

    // Validation
    if (points < 2000) {
      setWithdrawError("Minimum penarikan adalah 2.000 poin (Rp 20.000)");
      return;
    }

    if (points > total_poin) {
      setWithdrawError("Poin tidak mencukupi");
      return;
    }

    if (points % 100 !== 0) {
      setWithdrawError("Jumlah poin harus kelipatan 100");
      return;
    }

    // Additional validation for bank details
    if (!bankAccount || !bankName || !accountName) {
      setWithdrawError("Mohon lengkapi semua data rekening");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        jumlah_poin: points,
        metode_penarikan: "transfer",
        nomor_rekening: bankAccount,
        nama_bank: bankName,
        nama_penerima: accountName,
      };

      const response = await fetch(`${API_BASE_URL}/penarikan-tunai`, {
        method: 'POST',
        credentials: 'include',  // ⚠️ WAJIB untuk Safari/iOS
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (!response.ok) {
        // Check if there are validation errors
        if (result.errors) {
          const errorMessages = Object.values(result.errors).flat().join('\n');
          throw new Error(errorMessages);
        }
        
        throw new Error(result.message || 'Terjadi kesalahan saat memproses penarikan');
      }

      alert(`Pengajuan penarikan tunai berhasil!\n${points} poin = Rp ${calculateRupiah(points).toLocaleString('id-ID')}\n\nStatus: Menunggu persetujuan admin`);
      
      setShowCashModal(false);
      setWithdrawAmount("");
      setBankAccount("");
      setBankName("");
      setAccountName("");
      setWithdrawError("");
      
      // Refresh user data to update points display
      await refreshUser();
    } catch (err) {
      setWithdrawError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function closeCashModal() {
    setShowCashModal(false);
    setWithdrawAmount("");
    setBankAccount("");
    setBankName("");
    setAccountName("");
    setWithdrawError("");
    setSelectedOption(null);
  }

  // Product Redemption Functions
  function handleRedeemClick(product) {
    setSelectedProduct(product);
    setShowRedeemModal(true);
    setRedeemError("");
    setRedeemQuantity(1); // Reset quantity to 1
  }

  // Handle quantity change
  function handleQuantityChange(value) {
    const newQuantity = parseInt(value) || 1;
    const maxQuantity = parseInt(selectedProduct?.stok) || 1;
    
    if (newQuantity < 1) {
      setRedeemQuantity(1);
    } else if (newQuantity > maxQuantity) {
      setRedeemQuantity(maxQuantity);
      setRedeemError(`Maksimal ${maxQuantity} item`);
    } else {
      setRedeemQuantity(newQuantity);
      setRedeemError("");
    }
  }

  async function handleRedeemSubmit() {
    if (!selectedProduct) return;

    const requiredPoints = parseInt(selectedProduct.harga_poin) * redeemQuantity;

    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      setRedeemError("Anda harus login terlebih dahulu");
      return;
    }

    // Validation
    if (requiredPoints > total_poin) {
      setRedeemError("Poin Anda tidak mencukupi untuk menukar produk ini");
      return;
    }

    if (parseInt(selectedProduct.stok) <= 0) {
      setRedeemError("Maaf, produk ini sedang tidak tersedia");
      return;
    }

    if (redeemQuantity > parseInt(selectedProduct.stok)) {
      setRedeemError(`Stok hanya tersedia ${selectedProduct.stok} item`);
      return;
    }

    if (redeemQuantity < 1) {
      setRedeemError("Jumlah minimal adalah 1");
      return;
    }

    setIsSubmitting(true);
    setRedeemError("");

    try {
      const payload = {
        produk_id: selectedProduct.produk_id, // Product ID
        jumlah: redeemQuantity, // Quantity
        poin_digunakan: requiredPoints, // Total points used
        metode_ambil: 'Ambil di Bank Sampah', // Pickup method
        status: 'pending', // Initial status
        catatan: `Penukaran ${redeemQuantity} ${selectedProduct.nama}`, // Notes
      };
      
      const response = await fetch(`${API_BASE_URL}/penukaran-produk`, {
        method: 'POST',
        credentials: 'include',  // ⚠️ WAJIB untuk Safari/iOS
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
        }
        
        // Handle validation errors (400, 422)
        if (response.status === 400 || response.status === 422) {
          if (result.errors) {
            const errorMessages = Object.values(result.errors).flat().join('\n');
            throw new Error(errorMessages);
          }
          
          if (result.message) {
            throw new Error(result.message);
          }
        }
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        throw new Error(result.message || `Terjadi kesalahan (${response.status}). Silakan coba lagi.`);
      }

      alert(
        `Penukaran produk berhasil!\n\n` +
        `Produk: ${selectedProduct.nama}\n` +
        `Jumlah: ${redeemQuantity} item\n` +
        `Total Poin: ${requiredPoints.toLocaleString('id-ID')}\n\n` +
        `Status: Menunggu persetujuan admin\n\n` +
        `Setelah disetujui, Anda dapat mengambil produk di kantor Bank Sampah.`
      );
      
      closeRedeemModal();
      
      // Refresh user data to update points display
      await refreshUser();
    } catch (err) {
      setRedeemError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function closeRedeemModal() {
    setShowRedeemModal(false);
    setSelectedProduct(null);
    setRedeemError("");
    setRedeemQuantity(1); // Reset quantity
  }

  return (
    <div className="tukarPoinContainer">
      {/* Banner Poin */}
      <section className="userPointsSection">
        <div className="userPointsCard">
          <div className="pointsLabelRow">
            <Coins size={20} color="#FFD700" />
            <span className="pointsLabel">SALDO POIN ANDA</span>
          </div>

          <div className="pointsRow">
            <div className="pointsValueWrapper">
              <p className="pointsValue">{total_poin.toLocaleString('id-ID')} Poin</p>
              <span className="pointsNote">Poin tersedia untuk ditukar</span>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Tukar Poin */}
      <section className="menuTukarPoin">
        <div className="menuHeader">
          <h2>Menu Penukaran</h2>
          <select 
            className="sortDropdown"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="terbaru">Terbaru</option>
            <option value="termurah">Termurah</option>
            <option value="termahal">Termahal</option>
            <option value="terpopuler">Terpopuler</option>
          </select>
        </div>

        <div className="menuGrid">
          {exchangeOptions.map((item) => (
            <button
              key={item.label}
              className={`menuCard ${selectedOption === item.label ? "active" : ""}`}
              onClick={() => handleExchange(item)}
              aria-label={`Tukar ${item.label}`}
            >
              <div className="menuCardContent">
                <div className="menuIcon">{item.icon}</div>
                <h3 className="menuTitle">{item.label}</h3>
                <p className="menuPoin">{item.detail}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Produk Ramah Lingkungan Section */}
      {selectedOption === "Produk Ramah Lingkungan" && (
        <section className="produkPilihanSection">
          <h2 className="produkPilihanTitle">Produk Ramah Lingkungan</h2>
          
          {/* Search and Filter Bar */}
          <div className="filterBarProduct">
            <div className="searchBarProduct">
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="searchInputProduct"
              />
            </div>

            <div className="categoryFilter">
              {categories.map((category, idx) => (
                <button
                  key={`${category}-${idx}`}
                  className={`categoryButton ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Product Count */}
          {!loading && !error && (
            <div className="productCount">
              Menampilkan {displayProducts.length} produk
              {searchQuery && ` untuk "${searchQuery}"`}
              {selectedCategory !== "Semua" && ` di kategori ${selectedCategory}`}
            </div>
          )}
          
          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: '3rem',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <Loader2 size={48} className="spin-animation" style={{ color: 'var(--color-primary)' }} />
              <p style={{ color: '#6b7280' }}>Memuat produk...</p>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              color: '#dc2626',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <AlertCircle size={48} />
              <p>Gagal memuat produk: {error}</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Menampilkan data lokal sebagai fallback</p>
            </div>
          ) : displayProducts.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              color: '#6b7280'
            }}>
              <p>Belum ada produk tersedia</p>
            </div>
          ) : (
            <>
              <ProdukCard
                data={paginatedProduk}
                showPagination={false}
                perPage={perPage}
                onRedeem={handleRedeemClick}
                userPoints={total_poin}
                showRedeemButton={true}
              />

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPrev={prevPage}
                onNext={nextPage}
              />
            </>
          )}
        </section>
      )}

      {/* Product Redemption Modal */}
      {showRedeemModal && selectedProduct && (
        <div className="modalOverlay" onClick={closeRedeemModal}>
          <div className="cashModalContent" onClick={(e) => e.stopPropagation()}>
            <div className="cashModalHeader">
              <h3>Konfirmasi Penukaran</h3>
              <button className="closeModalBtn" onClick={closeRedeemModal}>
                <X size={22} />
              </button>
            </div>

            <div className="cashModalBody">
              {/* Product Details */}
              <div className="redeemProductInfo">
                <div className="redeemProductImage">
                  {selectedProduct.foto ? (
                    <img 
                      src={selectedProduct.foto.startsWith('http') 
                        ? selectedProduct.foto 
                        : getStorageUrl(selectedProduct.foto)}
                      alt={selectedProduct.nama} 
                    />
                  ) : (
                    <div className="imagePlaceholder">Gambar tidak tersedia</div>
                  )}
                </div>
                <div className="redeemProductDetails">
                  <h4>{selectedProduct.nama}</h4>
                  <p className="productDesc">{selectedProduct.deskripsi}</p>
                  <div className="productMeta">
                    <span className="productStock">Stok: {selectedProduct.stok}</span>
                    <span className="productCategory">{selectedProduct.kategori}</span>
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="withdrawForm" style={{ marginBottom: '1.5rem' }}>
                <div className="formGroup">
                  <label htmlFor="redeemQuantity">Jumlah Barang</label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(redeemQuantity - 1)}
                      disabled={redeemQuantity <= 1}
                      style={{
                        padding: '0.75rem 1rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        background: redeemQuantity <= 1 ? '#f3f4f6' : 'white',
                        cursor: redeemQuantity <= 1 ? 'not-allowed' : 'pointer',
                        fontWeight: '700',
                        fontSize: '1.125rem',
                        color: redeemQuantity <= 1 ? '#9ca3af' : '#374151',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      id="redeemQuantity"
                      value={redeemQuantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      min="1"
                      max={selectedProduct.stok}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: '1.125rem',
                        fontWeight: '700'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(redeemQuantity + 1)}
                      disabled={redeemQuantity >= parseInt(selectedProduct.stok)}
                      style={{
                        padding: '0.75rem 1rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        background: redeemQuantity >= parseInt(selectedProduct.stok) ? '#f3f4f6' : 'white',
                        cursor: redeemQuantity >= parseInt(selectedProduct.stok) ? 'not-allowed' : 'pointer',
                        fontWeight: '700',
                        fontSize: '1.125rem',
                        color: redeemQuantity >= parseInt(selectedProduct.stok) ? '#9ca3af' : '#374151',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      +
                    </button>
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: '#6b7280', 
                    marginTop: '0.5rem',
                    textAlign: 'center'
                  }}>
                    Tersedia: {selectedProduct.stok} item
                  </div>
                </div>
              </div>

              {/* Points Info */}
              <div className="withdrawInfo">
                <div className="infoCard">
                  <span className="infoLabel">Poin Anda Saat Ini</span>
                  <span className="infoValue">{total_poin.toLocaleString('id-ID')} Poin</span>
                </div>
                <div className="infoCard">
                  <span className="infoLabel">Poin yang Diperlukan</span>
                  <span className="infoValue" style={{ color: 'var(--color-primary)' }}>
                    {redeemQuantity > 1 && (
                      <span style={{ fontSize: '0.875rem', color: '#6b7280', marginRight: '0.5rem' }}>
                        {redeemQuantity} × {parseInt(selectedProduct.harga_poin).toLocaleString('id-ID')} =
                      </span>
                    )}
                    {(parseInt(selectedProduct.harga_poin) * redeemQuantity).toLocaleString('id-ID')} Poin
                  </span>
                </div>
                <div className="infoCard">
                  <span className="infoLabel">Sisa Poin Setelah Penukaran</span>
                  <span className="infoValue" style={{ 
                    color: (total_poin - (parseInt(selectedProduct.harga_poin) * redeemQuantity)) >= 0 ? '#10b981' : '#dc2626' 
                  }}>
                    {(total_poin - (parseInt(selectedProduct.harga_poin) * redeemQuantity)).toLocaleString('id-ID')} Poin
                  </span>
                </div>
              </div>

              {redeemError && (
                <div className="errorMessage">
                  <AlertCircle size={16} />
                  <span>{redeemError}</span>
                </div>
              )}

              <div className="withdrawNote">
                <AlertCircle size={16} />
                <div>
                  <p><strong>Informasi Penting:</strong></p>
                  <ul>
                    <li>Permintaan penukaran akan diproses oleh admin</li>
                    <li>Setelah disetujui, Anda dapat mengambil produk di kantor Bank Sampah</li>
                    <li>Bawa identitas diri saat pengambilan</li>
                    <li>Produk hanya dapat diambil setelah mendapat konfirmasi persetujuan</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="cashModalActions">
              <button 
                className="btnCancel" 
                onClick={closeRedeemModal}
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button 
                className="btnSubmit" 
                onClick={handleRedeemSubmit}
                disabled={
                  isSubmitting || 
                  parseInt(selectedProduct.harga_poin) > total_poin ||
                  parseInt(selectedProduct.stok) <= 0
                }
              >
                {isSubmitting ? "Memproses..." : "Konfirmasi Penukaran"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Withdrawal Modal */}
      {showCashModal && (
        <div className="modalOverlay" onClick={closeCashModal}>
          <div className="cashModalContent" onClick={(e) => e.stopPropagation()}>
            <div className="cashModalHeader">
              <h3>💰 Tarik Tunai</h3>
              <button className="closeModalBtn" onClick={closeCashModal}>
                <X size={22} />
              </button>
            </div>

            <div className="cashModalBody">
              <div className="withdrawInfo">
                <div className="infoCard">
                  <span className="infoLabel">Saldo Poin Anda</span>
                  <span className="infoValue">{total_poin.toLocaleString('id-ID')} Poin</span>
                </div>
                <div className="infoCard">
                  <span className="infoLabel">Nilai Tukar</span>
                  <span className="infoValue">100 Poin = Rp 1.000</span>
                </div>
              </div>

              <div className="withdrawForm">
                <div className="formGroup">
                  <label htmlFor="withdrawAmount">Jumlah Poin</label>
                  <input
                    type="number"
                    id="withdrawAmount"
                    value={withdrawAmount}
                    onChange={handleWithdrawChange}
                    placeholder="Masukkan jumlah poin"
                    min="2000"
                    max={total_poin}
                    step="100"
                    className={withdrawError ? "input-error" : ""}
                  />
                  {withdrawError && (
                    <div className="errorMessage">
                      <AlertCircle size={16} />
                      <span>{withdrawError}</span>
                    </div>
                  )}
                </div>

                {withdrawAmount && !withdrawError && parseInt(withdrawAmount) >= 2000 && (
                  <div className="conversionResult">
                    <div className="resultCard">
                      <span className="resultLabel">Anda akan menerima:</span>
                      <span className="resultValue">
                        Rp {calculateRupiah(parseInt(withdrawAmount)).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                )}

                <div className="formGroup">
                  <label htmlFor="bankName">Nama Bank</label>
                  <input
                    type="text"
                    id="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Contoh: BCA, Mandiri, BNI"
                  />
                </div>

                <div className="formGroup">
                  <label htmlFor="bankAccount">Nomor Rekening</label>
                  <input
                    type="text"
                    id="bankAccount"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="Masukkan nomor rekening"
                  />
                </div>

                <div className="formGroup">
                  <label htmlFor="accountName">Nama Pemilik Rekening</label>
                  <input
                    type="text"
                    id="accountName"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Nama sesuai rekening bank"
                  />
                </div>

                <div className="withdrawNote">
                  <AlertCircle size={16} />
                  <div>
                    <p><strong>Catatan Penting:</strong></p>
                    <ul>
                      <li>Minimum penarikan: 2.000 poin (Rp 20.000)</li>
                      <li>Jumlah poin harus kelipatan 100</li>
                      <li>Penarikan akan diproses oleh admin dalam 1-3 hari kerja</li>
                      <li>Dana akan ditransfer ke rekening terdaftar</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="cashModalActions">
                <button 
                  className="btnCancel" 
                  onClick={closeCashModal}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button 
                  className="btnSubmit" 
                  onClick={handleWithdrawSubmit}
                  disabled={
                    isSubmitting || 
                    withdrawError || 
                    !withdrawAmount || 
                    parseInt(withdrawAmount) < 2000 ||
                    !bankName ||
                    !bankAccount ||
                    !accountName
                  }
                >
                  {isSubmitting ? "Memproses..." : "Ajukan Penarikan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}