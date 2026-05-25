import { Link } from "react-router-dom";
import { useState } from "react";
import "./produkCard.css";
import Pagination from '../../ui/pagination'
import { getStorageUrl } from "../../../config/api";

import { Coins, Package, ShoppingCart } from "lucide-react";

// MANAJEMEN KONTEN PRODUK - Sync with Backend Table `produks`
const ProdukCard = ({ 
  data = [], 
  showPagination = true, 
  perPage = 8,
  onRedeem = null,
  userPoints = 0,
  showRedeemButton = false
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / perPage);

  const paginatedProduk = showPagination
    ? data.slice((currentPage - 1) * perPage, currentPage * perPage)
    : data;

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Get image URL from backend - handles Cloudinary URLs and local storage
  const getImageUrl = (foto) => {
    if (!foto) return null;
    // Backend returns Cloudinary URL or path like "storage/produks/xxx.jpg"
    if (foto.startsWith('http')) return foto;
    
    // Use centralized helper for local storage paths
    return getStorageUrl(foto);
  };

  // Safe parse integer
  const safeParseInt = (value) => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? 0 : parsed;
  };

return (
  <>
    <div className="produkGrid">
      {paginatedProduk.map((item, index) => {
        // Use produk_id from backend table
        const uniqueKey = item.produk_id || `produk-${index}`;
        const animationIndex = paginatedProduk.indexOf(item);
        const imageUrl = getImageUrl(item.foto);
        const hargaPoin = safeParseInt(item.harga_poin);
        const stok = safeParseInt(item.stok);
        
        return (
          <div
            className="produkCard"
            key={uniqueKey}
            style={{ animationDelay: `${animationIndex * 0.05}s` }}
          >
          <div className="produkImageWrapper">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={item.nama} 
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="produkImagePlaceholder" 
              style={{ display: imageUrl ? 'none' : 'flex' }}
            >
              <Package size={48} />
              <span>Gambar belum tersedia</span>
            </div>
            {item.kategori && (
              <span className="produkKategori">{item.kategori}</span>
            )}
            {stok <= 0 && (
              <span className="produkStokHabis">Stok Habis</span>
            )}
          </div>
          
          {/* DESKRIPSI */}
          <div className="produkContent">
            <h3 className="produkNama">
              {item.nama}
            </h3>
            <p className="produkDeskripsi">
              {item.deskripsi 
                ? (item.deskripsi.length > 100 
                    ? item.deskripsi.slice(0, 100) + '...' 
                    : item.deskripsi)
                : 'Tidak ada deskripsi'}
            </p>
            
            <div className="produkMeta">
              <span className="metaStok">
                <Package size={14} />
                Stok: {stok}
              </span>
              <span className="metaStatus" data-status={item.status}>
                {item.status === 'tersedia' ? '✓ Tersedia' : 
                 item.status === 'habis' ? '✕ Habis' : 
                 '⊗ Tidak Aktif'}
              </span>
            </div>

          {/* POIN & ACTION BUTTON */}
            <div className="produkFooter">
              <span className="produkPoin">
                <Coins size={18} />
                <strong>{hargaPoin > 0 ? hargaPoin.toLocaleString('id-ID') : '-'}</strong>
                <small>Poin</small>
              </span>
              {showRedeemButton && onRedeem ? (
                <button
                  className={`redeemBtn ${
                    hargaPoin > userPoints || stok <= 0 
                      ? 'disabled' 
                      : ''
                  }`}
                  onClick={() => onRedeem(item)}
                  disabled={hargaPoin > userPoints || stok <= 0}
                  title={
                    stok <= 0 
                      ? 'Stok habis' 
                      : hargaPoin > userPoints 
                      ? 'Poin tidak mencukupi' 
                      : 'Tukar produk ini'
                  }
                >
                  <ShoppingCart size={16} />
                  {stok <= 0 ? 'Stok Habis' : 'Tukar Sekarang'}
                </button>
              ) : (
                <Link to={`/produk/${item.produk_id}`} className="readMoreBtn">
                  Lihat Detail →
                </Link>
              )}
            </div>
          </div>
        </div>
        );
      })}
    </div>

      {showPagination && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={prevPage}
          onNext={nextPage}
        />
      )}
  </>
);
};

export default ProdukCard;