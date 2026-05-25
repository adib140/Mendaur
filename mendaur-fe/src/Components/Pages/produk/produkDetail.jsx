import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Coins, ShoppingCart, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import productApi from '../../../services/productApi';
import { getStorageUrl } from '../../../config/api';
import './produkDetail.css';

export default function ProdukDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [redemptionStatus, setRedemptionStatus] = useState(null);

  const fetchProductDetail = useCallback(async () => {
    setLoading(true);
    const result = await productApi.getProductById(id);
    
    if (result.success) {
      setProduct(result.data);
    } else {
      setError(result.message);
    }
    setLoading(false);
  }, [id]);

  const fetchUserPoints = useCallback(() => {
    // Get from localStorage or API
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserPoints(user.actual_poin || user.display_poin || 0);
  }, []);

  useEffect(() => {
    fetchProductDetail();
    fetchUserPoints();
  }, [fetchProductDetail, fetchUserPoints]);

  const getImageUrl = (foto) => {
    if (!foto) return null;
    // Handle Cloudinary URLs and local storage paths
    if (foto.startsWith('http')) return foto;
    return getStorageUrl(foto);
  };

  const handleRedeem = async () => {
    const hargaPoin = parseInt(product.harga_poin) || 0;
    const stok = parseInt(product.stok) || 0;
    const totalPoints = hargaPoin * quantity;
    
    if (totalPoints > userPoints) {
      alert('Poin Anda tidak mencukupi!');
      return;
    }

    if (quantity > stok) {
      alert('Stok tidak mencukupi!');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.user_id;
    
    if (!userId) {
      alert('Anda harus login terlebih dahulu!');
      navigate('/login');
      return;
    }
    
    const redemptionData = {
      user_id: userId,
      produk_id: product.produk_id,
      jumlah: quantity,
      metode_ambil: 'ambil_ditempat',
      catatan: ''
    };

    
    const result = await productApi.redeemProduct(redemptionData);
    
    if (result.success) {
      setRedemptionStatus('success');
      setShowModal(true);
      fetchUserPoints();
    } else {
      setRedemptionStatus('error');
      setShowModal(true);
      alert(result.message || 'Penukaran gagal');
    }
  };  const closeModal = () => {
    setShowModal(false);
    if (redemptionStatus === 'success') {
      navigate('/dashboard/penukaran');
    }
  };

  if (loading) {
    return (
      <div className="produkDetailLoading">
        <div className="spinner"></div>
        <p>Memuat detail produk...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="produkDetailError">
        <XCircle size={64} color="#ff4444" />
        <h2>Produk Tidak Ditemukan</h2>
        <p>{error || 'Produk yang Anda cari tidak tersedia.'}</p>
        <button onClick={() => navigate('/produk')} className="backBtn">
          <ArrowLeft size={20} />
          Kembali ke Produk
        </button>
      </div>
    );
  }

  const hargaPoin = parseInt(product.harga_poin) || 0;
  const stok = parseInt(product.stok) || 0;
  const totalPoints = hargaPoin * quantity;
  const canRedeem = totalPoints <= userPoints && quantity <= stok && product.status === 'tersedia';

  return (
    <div className="produkDetailWrapper">
      <button onClick={() => navigate('/produk')} className="backButton">
        <ArrowLeft size={20} />
        Kembali
      </button>

      <div className="produkDetailContainer">
        {/* Image Section */}
        <div className="produkDetailImageSection">
          <div className="produkDetailImage">
            {getImageUrl(product.foto) ? (
              <img 
                src={getImageUrl(product.foto)} 
                alt={product.nama}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="imagePlaceholder" 
              style={{ display: getImageUrl(product.foto) ? 'none' : 'flex' }}
            >
              <Package size={80} />
              <span>Gambar tidak tersedia</span>
            </div>
          </div>
          
          {product.kategori && (
            <span className="detailKategori">{product.kategori}</span>
          )}
        </div>

        {/* Info Section */}
        <div className="produkDetailInfo">
          <h1 className="produkDetailTitle">{product.nama}</h1>
          
          <div className="produkDetailMeta">
            <span className={`statusBadge status-${product.status}`}>
              {product.status === 'tersedia' ? '✓ Tersedia' : 
               product.status === 'habis' ? '✕ Stok Habis' : 
               '⊗ Tidak Aktif'}
            </span>
            <span className="stokInfo">
              <Package size={16} />
              Stok: <strong>{stok}</strong>
            </span>
          </div>

          <div className="produkDetailPrice">
            <Coins size={32} />
            <div>
              <strong>{hargaPoin > 0 ? hargaPoin.toLocaleString('id-ID') : '-'}</strong>
              <small>Poin per item</small>
            </div>
          </div>

          <div className="produkDetailDescription">
            <h3>Deskripsi Produk</h3>
            <p>{product.deskripsi || 'Tidak ada deskripsi untuk produk ini.'}</p>
          </div>

          {/* Quantity Selector */}
          <div className="quantitySection">
            <label>Jumlah:</label>
            <div className="quantityControls">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </button>
              <input 
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(Math.max(1, Math.min(stok, parseInt(e.target.value) || 1)))}
                min="1"
                max={stok}
              />
              <button 
                onClick={() => setQuantity(Math.min(stok, quantity + 1))}
                disabled={quantity >= stok}
              >
                +
              </button>
            </div>
          </div>

          {/* Total Points */}
          <div className="totalPointsSection">
            <span>Total Poin:</span>
            <strong>{totalPoints.toLocaleString('id-ID')} Poin</strong>
          </div>

          {/* User Points Info */}
          <div className="userPointsInfo">
            <span>Poin Anda:</span>
            <strong className={userPoints >= totalPoints ? 'sufficient' : 'insufficient'}>
              {userPoints.toLocaleString('id-ID')} Poin
            </strong>
          </div>

          {/* Redeem Button */}
          <button 
            className={`redeemButtonLarge ${!canRedeem ? 'disabled' : ''}`}
            onClick={handleRedeem}
            disabled={!canRedeem}
          >
            <ShoppingCart size={20} />
            {product.status !== 'tersedia' ? 'Produk Tidak Tersedia' :
             totalPoints > userPoints ? 'Poin Tidak Mencukupi' :
             quantity > stok ? 'Stok Tidak Cukup' :
             'Tukar Sekarang'}
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modalOverlay" onClick={closeModal}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            {redemptionStatus === 'success' ? (
              <>
                <CheckCircle size={64} color="#10b981" />
                <h2>Penukaran Berhasil!</h2>
                <p>Permintaan penukaran produk Anda telah dikirim.</p>
                <p>Admin akan segera memproses pesanan Anda.</p>
                <button onClick={closeModal} className="modalBtn success">
                  Lihat Riwayat Penukaran
                </button>
              </>
            ) : (
              <>
                <XCircle size={64} color="#ef4444" />
                <h2>Penukaran Gagal</h2>
                <p>Terjadi kesalahan saat memproses penukaran.</p>
                <p>Silakan coba lagi nanti.</p>
                <button onClick={closeModal} className="modalBtn error">
                  Tutup
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
