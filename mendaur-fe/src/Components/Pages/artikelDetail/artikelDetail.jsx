import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Eye, Calendar, User, ArrowLeft, Clock, Share2, BookOpen, TrendingUp } from "lucide-react";
import { API_BASE_URL, getStorageUrl } from "../../../config/api";
import "./artikelDetail.css";

const ArtikelDetail = () => {
  const { id: artikelId } = useParams(); // Using artikel_id instead of slug
  const navigate = useNavigate();
  const [artikelData, setArtikelData] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [popularArticles, setPopularArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Scroll to top when article changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [artikelId]);

  useEffect(() => {
    fetchArtikelDetail();
    fetchRelatedArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artikelId]);

  const fetchArtikelDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try fetching single artikel by ID
      let response = await fetch(`${API_BASE_URL}/artikel/${artikelId}`);
      
      // If 404, try fetching all articles and filter by ID
      if (!response.ok && response.status === 404) {
        response = await fetch(`${API_BASE_URL}/artikel`);
        
        if (!response.ok) {
          // Use mock data if API is not available
          console.log('Artikel API tidak tersedia, menggunakan mock data');
          setArtikelData({
            artikel_id: artikelId,
            judul: 'Artikel Sampel',
            konten: 'Konten artikel ini sedang dalam pengembangan. Silakan coba lagi nanti.',
            gambar: null,
            penulis: 'Admin',
            tanggal_publikasi: new Date().toISOString(),
            kategori: 'Umum',
            dilihat: 0,
            status: 'published'
          });
          return;
        }
        
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
          // Find article by ID from the list
          const article = result.data.find(a => a.artikel_id?.toString() === artikelId?.toString());
          
          if (article) {
            setArtikelData(article);
          } else {
            // Use mock data if article not found
            console.log('Artikel tidak ditemukan, menggunakan mock data');
            setArtikelData({
              artikel_id: artikelId,
              judul: 'Artikel Sampel',
              konten: 'Konten artikel ini sedang dalam pengembangan. Silakan coba lagi nanti.',
              gambar: null,
              penulis: 'Admin',
              tanggal_publikasi: new Date().toISOString(),
              kategori: 'Umum',
              dilihat: 0,
              status: 'published'
            });
          }
        } else {
          setError('Artikel tidak ditemukan');
        }
        return;
      }
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('Akses ditolak');
        } else {
          setError('Gagal memuat artikel');
        }
        return;
      }
      
      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        setArtikelData(result.data);
      } else {
        setError('Artikel tidak ditemukan');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      // Use mock data on any error
      console.log('Error loading artikel, menggunakan mock data');
      setArtikelData({
        artikel_id: artikelId,
        judul: 'Artikel Sampel',
        konten: 'Konten artikel ini sedang dalam pengembangan. Silakan coba lagi nanti.',
        gambar: null,
        penulis: 'Admin',
        tanggal_publikasi: new Date().toISOString(),
        kategori: 'Umum',
        dilihat: 0,
        status: 'published'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedArticles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/artikel`);
      if (!response.ok) return;
      
      const result = await response.json();
      if (result.status === 'success') {
        // Filter out current article and get related (use artikel_id)
        const filtered = result.data
          .filter(a => a.artikel_id?.toString() !== artikelId?.toString())
          .slice(0, 4);
        setRelatedArticles(filtered);
        
        // Get popular articles (use dilihat instead of jumlah_views)
        const popular = result.data
          .filter(a => a.artikel_id?.toString() !== artikelId?.toString())
          .sort((a, b) => (b.dilihat || 0) - (a.dilihat || 0))
          .slice(0, 5);
        setPopularArticles(popular);
      }
    } catch {
      // Silent fail for related articles
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatReadingTime = (content) => {
    if (!content) return '1 menit';
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} menit`;
  };

  const getImageUrl = (foto) => {
    if (!foto) return null;
    
    // Handle Cloudinary URLs and local storage paths
    if (foto.startsWith('http://') || foto.startsWith('https://')) {
      return foto;
    }
    
    return getStorageUrl(foto);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: artikelData?.judul_artikel,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link artikel berhasil disalin!');
    }
  };

  if (loading) {
    return (
      <div className="artikel-detail-page">
        <div className="artikel-loading">
          <div className="loading-spinner"></div>
          <p>Memuat artikel...</p>
        </div>
      </div>
    );
  }

  if (error || !artikelData) {
    return (
      <div className="artikel-detail-page">
        <div className="artikel-error">
          <BookOpen size={48} />
          <h2>{error || 'Artikel tidak ditemukan'}</h2>
          <p>Artikel yang Anda cari mungkin telah dihapus atau tidak tersedia.</p>
          <button onClick={() => navigate('/dashboard/artikel')} className="btn-back-home">
            <ArrowLeft size={18} />
            Kembali ke Daftar Artikel
          </button>
        </div>
      </div>
    );
  }

  const content = artikelData.konten || '';

  return (
    <div className="artikel-detail-page">
      {/* Breadcrumb */}
      <div className="artikel-breadcrumb">
        <div className="breadcrumb-container">
          <Link to="/dashboard">Beranda</Link>
          <span>/</span>
          <Link to="/dashboard/artikel">Artikel</Link>
          <span>/</span>
          <span className="current">{artikelData.kategori}</span>
        </div>
      </div>

      <div className="artikel-detail-container">
        {/* Main Content */}
        <main className="artikel-main-content">
          {/* Article Header */}
          <header className="artikel-header">
            <span className="artikel-kategori-badge">{artikelData.kategori}</span>
            <h1 className="artikel-title">{artikelData.judul}</h1>
            
            <div className="artikel-meta-info">
              <div className="meta-item">
                <User size={16} />
                <span>Tim Mendaur</span>
              </div>
              <div className="meta-item">
                <Calendar size={16} />
                <span>{formatDate(artikelData.created_at)}</span>
              </div>
              <div className="meta-item">
                <Clock size={16} />
                <span>{formatReadingTime(content)} baca</span>
              </div>
              {(artikelData.dilihat || 0) > 0 && (
                <div className="meta-item">
                  <Eye size={16} />
                  <span>{artikelData.dilihat} views</span>
                </div>
              )}
            </div>

            <button className="btn-share" onClick={handleShare}>
              <Share2 size={16} />
              Bagikan
            </button>
          </header>

          {/* Featured Image */}
          {artikelData.gambar && (
            <figure className="artikel-featured-image">
              <img 
                src={getImageUrl(artikelData.gambar)} 
                alt={artikelData.judul}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </figure>
          )}

          {/* Article Content */}
          <article className="artikel-content">
            {content.split('\n').map((paragraph, index) => {
              if (!paragraph.trim()) return null;
              return <p key={index}>{paragraph}</p>;
            })}
          </article>

          {/* Tags */}
          {artikelData.tags && (
            <div className="artikel-tags">
              {artikelData.tags.split(',').map((tag, index) => (
                <span key={index} className="tag">{tag.trim()}</span>
              ))}
            </div>
          )}

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <section className="related-articles">
              <h3>Baca Juga</h3>
              <div className="related-grid">
                {relatedArticles.map((article) => (
                  <Link 
                    to={`/dashboard/artikel/${article.artikel_id}`} 
                    key={article.artikel_id}
                    className="related-card"
                  >
                    {article.gambar && (
                      <img 
                        src={getImageUrl(article.gambar)} 
                        alt={article.judul}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div className="related-info">
                      <span className="related-category">{article.kategori}</span>
                      <h4>{article.judul}</h4>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Sidebar */}
        <aside className="artikel-sidebar">
          {/* Popular Articles */}
          <div className="sidebar-section">
            <h3>
              <TrendingUp size={18} />
              Artikel Populer
            </h3>
            <div className="popular-list">
              {popularArticles.map((article, index) => (
                <Link 
                  to={`/dashboard/artikel/${article.artikel_id}`} 
                  key={article.artikel_id}
                  className="popular-item"
                >
                  <span className="popular-number">{index + 1}</span>
                  <div className="popular-content">
                    <h4>{article.judul}</h4>
                    <span className="popular-meta">
                      <Eye size={12} />
                      {article.dilihat || 0} views
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Back Button */}
          <button onClick={() => navigate('/dashboard/artikel')} className="btn-back">
            <ArrowLeft size={18} />
            Kembali ke Daftar Artikel
          </button>
        </aside>
      </div>
    </div>
  );
};

export default ArtikelDetail;