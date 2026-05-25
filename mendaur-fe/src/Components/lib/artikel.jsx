import { Link } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import "./artikel.css";
import Pagination from "../ui/pagination";
import { Eye } from "lucide-react";
import { API_BASE_URL, getStorageUrl } from "../../config/api";

// Simple cache for artikel data
let artikelCache = { data: null, expiry: 0 };

const ArtikelCard = ({
  data = null,
  showPagination = true,
  perPage = 8,
  fetchFromAPI = false,
  category = "",
  searchQuery = ""
}) => {
  const [artikel, setArtikel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchArtikel = useCallback(async () => {
    // Check cache first (5 min TTL)
    if (artikelCache.data && Date.now() < artikelCache.expiry) {
      setArtikel(artikelCache.data);
      return;
    }

    try {
      setLoading(true);
      
      // Shorter timeout for artikel
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(`${API_BASE_URL}/artikel`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        setArtikel([]);
        return;
      }

      const result = await response.json();

      if (result.status === 'success') {
        const artikelData = result.data || [];
        // Cache the raw data
        artikelCache = { data: artikelData, expiry: Date.now() + 300000 };
        setArtikel(artikelData);
      } else {
        setArtikel([]);
      }
    } catch {
      // Use cached data if available on error
      if (artikelCache.data) {
        setArtikel(artikelCache.data);
      } else {
        setArtikel([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchFromAPI) {
      fetchArtikel();
      setCurrentPage(1);
    } else if (data) {
      setArtikel(data);
    }
  }, [fetchFromAPI, data, fetchArtikel]);

  // Memoize filtered artikel
  const filteredArtikel = useMemo(() => {
    let result = artikel;

    if (category) {
      result = result.filter(item => 
        item.kategori && item.kategori.toLowerCase() === category.toLowerCase()
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.judul && item.judul.toLowerCase().includes(query)) ||
        (item.konten && item.konten.toLowerCase().includes(query)) ||
        (item.kategori && item.kategori.toLowerCase().includes(query))
      );
    }

    return result;
  }, [artikel, category, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [category, searchQuery]);

  const totalPages = Math.ceil(filteredArtikel.length / perPage);

  const paginatedArtikel = useMemo(() => 
    showPagination
      ? filteredArtikel.slice((currentPage - 1) * perPage, currentPage * perPage)
      : filteredArtikel,
    [filteredArtikel, currentPage, perPage, showPagination]
  );

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  // Helper function untuk image URL - handles Cloudinary and local storage
  const getImageUrl = (foto) => {
    if (!foto) return null;
    
    // Handle Cloudinary URLs and local storage paths
    if (foto.startsWith('http://') || foto.startsWith('https://')) {
      return foto;
    }
    
    return getStorageUrl(foto);
  };

  if (loading) {
    return (
      <div className="artikelWrapper">
        <div className="artikel-loading-state">
          <div className="artikel-spinner"></div>
          <p>Memuat artikel...</p>
        </div>
      </div>
    );
  }

  if (artikel.length === 0) {
    return (
      <div className="artikelWrapper">
        <div className="artikel-empty-state">
          <p>Tidak ada artikel ditemukan.</p>
          {(category || searchQuery) && (
            <p className="artikel-empty-hint">
              Coba ubah filter atau kata kunci pencarian.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="artikelWrapper">
      {paginatedArtikel.map((item) => {
        // Use artikel_id since slug doesn't exist in API response
        const linkPath = `/dashboard/artikel/${item.artikel_id}`;
        
        return (
          <div className="artikelCard" key={item.artikel_id || item.id}>
            <Link to={linkPath} className="artikelCardImageLink">
              <div className="artikelCardImage">
                {(item.gambar || item.cover || item.foto || item.image) ? (
                  <img
                    src={getImageUrl(item.gambar || item.cover || item.foto || item.image)}
                    alt={item.judul || 'Artikel'}
                    onError={(e) => { 
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="artikelNoImage" style={{ display: (item.gambar || item.cover || item.foto || item.image) ? 'none' : 'flex' }}>
                  <span>📰</span>
                  <p>Gambar tidak tersedia</p>
                </div>
              </div>
            </Link>
            <div className="artikelContent">
              <span className="artikelKategori">{item.kategori || 'Artikel'}</span>
              <Link to={linkPath} className="artikelTitleLink">
                <h3 className="artikelTitle">{item.judul || 'Judul Tidak Tersedia'}</h3>
              </Link>
              <p className="artikelExcerpt">
                {((item.konten || '').slice(0, 120))}...
              </p>
              <div className="artikelMeta">
                <span className="artikelAuthor">Tim Mendaur</span>
                <span className="artikelDate">{formatDate(item.created_at)}</span>
                {(item.dilihat || 0) > 0 && (
                  <span className="artikelViews">
                    <Eye size={14} /> {item.dilihat}
                  </span>
                )}
              </div>
              <Link to={linkPath} className="readMoreBtn">
                Baca Selengkapnya →
              </Link>
            </div>
          </div>
        );
      })}

      {showPagination && totalPages > 1 && (
        <div className="artikelPaginationWrapper">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={prevPage}
            onNext={nextPage}
          />
        </div>
      )}
    </div>
  );
};

export default ArtikelCard;
