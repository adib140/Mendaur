import { useState, useEffect } from 'react'
import { Plus, Eye, Edit2, Trash2, Search, X, Loader, Calendar } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import adminApi from '../../../../services/adminApi'
import '../styles/contentManagement.css'

// Article categories
const ARTICLE_CATEGORIES = [
  'Tips & Trik',
  'Edukasi',
  'Inspirasi',
  'Lingkungan',
  'DIY',
  'Tutorial',
  'Teknologi',
  'Regulasi'
]

// Mock data
const MOCK_ARTICLES = [
  { artikel_id: 1, judul: '5 Cara Mudah Memilah Sampah di Rumah', penulis: 'Tim Mendaur', kategori: 'Tips & Trik', tanggal_publikasi: '2024-11-01', views: 234, konten: 'Panduan lengkap memulai perjalanan zero waste Anda...', slug: '5-cara-mudah-memilah-sampah-di-rumah', foto_cover: null },
  { artikel_id: 2, judul: 'Manfaat Daur Ulang Plastik', penulis: 'Tim Mendaur', kategori: 'Edukasi', tanggal_publikasi: '2024-10-28', views: 567, konten: 'Plastik dapat didaur ulang menjadi berbagai produk bermanfaat...', slug: 'manfaat-daur-ulang-plastik', foto_cover: null },
  { artikel_id: 3, judul: 'Cara Menjaga Kebersihan Lingkungan', penulis: 'Tim Mendaur', kategori: 'Lingkungan', tanggal_publikasi: '2024-10-25', views: 789, konten: 'Langkah-langkah sederhana untuk menjaga kebersihan lingkungan...', slug: 'cara-menjaga-kebersihan-lingkungan', foto_cover: null },
  { artikel_id: 4, judul: 'Inovasi Terbaru dalam Teknologi Daur Ulang', penulis: 'Tim Mendaur', kategori: 'Teknologi', tanggal_publikasi: '2024-10-20', views: 345, konten: 'Teknologi AI dan IoT mengubah cara kita mendaur ulang sampah...', slug: 'inovasi-terbaru-dalam-teknologi-daur-ulang', foto_cover: null },
]

export default function ArtikelManagement() {
  const { hasPermission } = useAuth()
  const [articles, setArticles] = useState(MOCK_ARTICLES)
  const [filteredArticles, setFilteredArticles] = useState(MOCK_ARTICLES)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Dialog states
  const [viewDialog, setViewDialog] = useState({ open: false, data: null })
  const [addDialog, setAddDialog] = useState({ open: false })
  const [editDialog, setEditDialog] = useState({ open: false, data: null })
  const [categories, setCategories] = useState(ARTICLE_CATEGORIES)
  const [newCategory, setNewCategory] = useState('')
  const [formData, setFormData] = useState({
    judul: '',
    penulis: '',
    kategori: 'Tips & Trik',
    tanggal_publikasi: new Date().toISOString().split('T')[0],
    konten: '',
    foto_cover: null,
  })

  // Separated fetch function (Session 2 pattern)
  const loadArticles = async () => {
    try {
      setLoading(true)
      const result = await adminApi.getAllArticles(1, 50)
      
      // Multi-format response handler (supports 3+ formats)
      let articlesList = MOCK_ARTICLES
      if (Array.isArray(result.data)) {
        // Direct array format
        articlesList = result.data
      } else if (result.data?.data && Array.isArray(result.data.data)) {
        // Wrapped in data key
        articlesList = result.data.data
      } else if (result.data?.articles && Array.isArray(result.data.articles)) {
        // Wrapped in articles key
        articlesList = result.data.articles
      }
      
      setArticles(articlesList)
    } catch (err) {
      console.warn('Articles fetch error, using mock data:', err.message)
      setArticles(MOCK_ARTICLES)
    } finally {
      setLoading(false)
    }
  }

  // Load articles on component mount
  useEffect(() => {
    loadArticles()
  }, [])

  // Filter articles
  useEffect(() => {
    let filtered = articles.filter(article => {
      const matchSearch = article.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.penulis.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = filterCategory === 'all' || article.kategori === filterCategory
      return matchSearch && matchCategory
    })
    setFilteredArticles(filtered)
    setCurrentPage(1)
  }, [searchQuery, filterCategory, articles])

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredArticles.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const handleAdd = () => {
    if (!hasPermission('manage_content')) {
      alert('❌ You do not have permission to add articles')
      return
    }
    setFormData({ judul: '', penulis: '', kategori: 'Tips & Trik', tanggal_publikasi: new Date().toISOString().split('T')[0], konten: '', foto_cover: null })
    setAddDialog({ open: true })
  }

  const handleEdit = (article) => {
    if (!hasPermission('manage_content')) {
      alert('❌ You do not have permission to edit articles')
      return
    }
    setFormData({ ...article })
    setEditDialog({ open: true, data: article })
  }

  const handleView = (article) => {
    setViewDialog({ open: true, data: article })
  }

  const handleDelete = async (article) => {
    if (!hasPermission('manage_content')) {
      alert('❌ You do not have permission to delete articles')
      return
    }
    if (confirm('Apakah Anda yakin ingin menghapus artikel ini?')) {
      try {
        // Use slug for API call
        const response = await adminApi.deleteArticle(article.slug)
        
        if (response.success) {
          // Refresh articles list via separated function
          await loadArticles()
          alert('✅ Artikel berhasil dihapus')
        } else {
          alert('❌ ' + (response.message || 'Gagal menghapus artikel'))
        }
      } catch (error) {
        console.error('Error deleting article:', error)
        alert('❌ Terjadi kesalahan saat menghapus artikel')
      }
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddCategory = (categoryName = null) => {
    const categoryToAdd = categoryName || newCategory
    if (categoryToAdd && categoryToAdd.trim() && !categories.includes(categoryToAdd.trim())) {
      setCategories([...categories, categoryToAdd.trim()])
      setFormData({ ...formData, kategori: categoryToAdd.trim() })
      setNewCategory('')
      return true
    } else {
      alert('❌ Kategori sudah ada atau kosong')
      return false
    }
  }

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleSaveAdd = async () => {
    if (!formData.judul || !formData.penulis) {
      alert('❌ Judul dan penulis harus diisi')
      return
    }
    
    try {
      const slug = generateSlug(formData.judul)
      const payload = {
        judul: formData.judul,
        penulis: formData.penulis,
        kategori: formData.kategori,
        tanggal_publikasi: formData.tanggal_publikasi,
        konten: formData.konten,
        slug: slug,
        foto_cover: formData.foto_cover || null,
      }
      
      const response = await adminApi.createArticle(payload)
      
      if (response.success) {
        // Refresh articles list via separated function
        await loadArticles()
        alert('✅ Artikel berhasil ditambahkan')
        setAddDialog({ open: false })
        setFormData({ judul: '', penulis: '', kategori: 'Tips & Trik', tanggal_publikasi: new Date().toISOString().split('T')[0], konten: '', foto_cover: null })
      } else {
        alert('❌ ' + (response.message || 'Gagal menambahkan artikel'))
      }
    } catch (error) {
      console.error('Error adding article:', error)
      alert('❌ Terjadi kesalahan saat menambahkan artikel')
    }
  }

  const handleSaveEdit = async () => {
    if (!formData.judul || !formData.penulis) {
      alert('❌ Judul dan penulis harus diisi')
      return
    }
    
    try {
      const slug = formData.slug || generateSlug(formData.judul)
      const payload = {
        judul: formData.judul,
        penulis: formData.penulis,
        kategori: formData.kategori,
        tanggal_publikasi: formData.tanggal_publikasi,
        konten: formData.konten,
        slug: slug,
        foto_cover: formData.foto_cover || null,
      }
      
      // Use slug for API call, not artikel_id
      const response = await adminApi.updateArticle(slug, payload)
      
      if (response.success) {
        // Refresh articles list via separated function
        await loadArticles()
        alert('✅ Artikel berhasil diperbarui')
        setEditDialog({ open: false, data: null })
        setFormData({ judul: '', penulis: '', kategori: 'Tips & Trik', tanggal_publikasi: new Date().toISOString().split('T')[0], konten: '', foto_cover: null })
      } else {
        alert('❌ ' + (response.message || 'Gagal memperbarui artikel'))
      }
    } catch (error) {
      console.error('Error updating article:', error)
      alert('❌ Terjadi kesalahan saat memperbarui artikel')
    }
  }

  return (
    <div className="artikel-management">
      {/* Header */}
      <div className="management-header">
        <h2>Manajemen Artikel</h2>
        <p>Kelola semua artikel dan konten edukatif</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Artikel</span>
            <span className="stat-value">{articles.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Tayangan</span>
            <span className="stat-value">{articles.reduce((sum, a) => sum + (a.views || 0), 0).toLocaleString('id-ID')}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Kategori</span>
            <span className="stat-value">{categories.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Rata-rata Tayangan</span>
            <span className="stat-value">{articles.length > 0 ? Math.round(articles.reduce((sum, a) => sum + (a.views || 0), 0) / articles.length) : 0}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Cari artikel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="form-input"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">Semua Kategori</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <button className="btn-add" onClick={handleAdd}>
          <Plus size={18} /> Tambah Artikel
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Loader className="spinner" size={32} />
          <p>Memuat artikel...</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Judul</th>
                  <th>Penulis</th>
                  <th>Kategori</th>
                  <th>Tanggal Publikasi</th>
                  <th>Tayangan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Tidak ada artikel</td>
                  </tr>
                ) : (
                  currentItems.map((article) => (
                    <tr key={article.artikel_id}>
                      <td>{article.artikel_id}</td>
                      <td><strong>{article.judul}</strong></td>
                      <td>{article.penulis}</td>
                      <td>{article.kategori}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                          <Calendar size={14} />
                          {formatDate(article.tanggal_publikasi)}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          fontWeight: '500'
                        }}>
                          {(article.views || 0).toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-icon" onClick={() => handleView(article)} title="Lihat">
                            <Eye size={16} />
                          </button>
                          <button className="btn-icon" onClick={() => handleEdit(article)} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button className="btn-icon delete" onClick={() => handleDelete(article)} title="Hapus">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
              <button
                className="form-input"
                style={{ padding: '6px 12px', cursor: 'pointer', maxWidth: '80px' }}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <span style={{ margin: '0 12px', fontWeight: '500' }}>
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                className="form-input"
                style={{ padding: '6px 12px', cursor: 'pointer', maxWidth: '80px' }}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* View Dialog */}
      {viewDialog.open && (
        <div className="modal-overlay" onClick={() => setViewDialog({ open: false, data: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Detail Artikel</h4>
              <button className="btn-close" onClick={() => setViewDialog({ open: false, data: null })}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {viewDialog.data && (
                <>
                  <div className="field-row">
                    <span className="field-label">ID:</span>
                    <span className="field-value">{viewDialog.data.artikel_id}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Judul:</span>
                    <span className="field-value">{viewDialog.data.judul}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Penulis:</span>
                    <span className="field-value">{viewDialog.data.penulis}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Kategori:</span>
                    <span className="field-value">{viewDialog.data.kategori}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Tanggal Publikasi:</span>
                    <span className="field-value">{formatDate(viewDialog.data.tanggal_publikasi)}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Tayangan:</span>
                    <span className="field-value">{viewDialog.data.views.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Slug:</span>
                    <span className="field-value">{viewDialog.data.slug}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Konten:</span>
                    <span className="field-value" style={{ maxHeight: '200px', overflow: 'auto' }}>{viewDialog.data.konten}</span>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-close-modal" onClick={() => setViewDialog({ open: false, data: null })}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Dialog */}
      {addDialog.open && (
        <div className="modal-overlay" onClick={() => setAddDialog({ open: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Tambah Artikel Baru</h4>
              <button className="btn-close" onClick={() => setAddDialog({ open: false })}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Judul Artikel *</label>
                <input
                  type="text"
                  name="judul"
                  value={formData.judul}
                  onChange={handleFormChange}
                  placeholder="Masukkan judul artikel"
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Penulis *</label>
                  <input
                    type="text"
                    name="penulis"
                    value={formData.penulis}
                    onChange={handleFormChange}
                    placeholder="Nama penulis"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Tanggal Publikasi</label>
                  <input
                    type="date"
                    name="tanggal_publikasi"
                    value={formData.tanggal_publikasi}
                    onChange={handleFormChange}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <select
                    name="kategori"
                    value={formData.kategori}
                    onChange={handleFormChange}
                    className="form-input"
                    style={{ flex: 1 }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap'
                    }}
                    onClick={() => {
                      const newCat = prompt('Masukkan nama kategori baru:')
                      if (newCat) {
                        handleAddCategory(newCat)
                      }
                    }}
                  >
                    Tambah Kategori
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Foto Cover</label>
                <input
                  type="file"
                  name="foto_cover"
                  onChange={(e) => setFormData({ ...formData, foto_cover: e.target.files[0] || null })}
                  accept="image/*"
                  className="form-input"
                  style={{ padding: '8px 4px' }}
                />
                {formData.foto_cover && typeof formData.foto_cover === 'object' && formData.foto_cover instanceof File && (
                  <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#059669' }}>
                    ✅ File: {formData.foto_cover.name}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Konten</label>
                <textarea
                  name="konten"
                  value={formData.konten}
                  onChange={handleFormChange}
                  placeholder="Masukkan konten artikel"
                  className="form-input"
                  rows="5"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setAddDialog({ open: false })}>
                Batal
              </button>
              <button className="btn-primary" onClick={handleSaveAdd}>
                Tambah Artikel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editDialog.open && (
        <div className="modal-overlay" onClick={() => setEditDialog({ open: false, data: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Edit Artikel</h4>
              <button className="btn-close" onClick={() => setEditDialog({ open: false, data: null })}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Judul Artikel *</label>
                <input
                  type="text"
                  name="judul"
                  value={formData.judul}
                  onChange={handleFormChange}
                  placeholder="Masukkan judul artikel"
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Penulis *</label>
                  <input
                    type="text"
                    name="penulis"
                    value={formData.penulis}
                    onChange={handleFormChange}
                    placeholder="Nama penulis"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Tanggal Publikasi</label>
                  <input
                    type="date"
                    name="tanggal_publikasi"
                    value={formData.tanggal_publikasi}
                    onChange={handleFormChange}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <select
                    name="kategori"
                    value={formData.kategori}
                    onChange={handleFormChange}
                    className="form-input"
                    style={{ flex: 1 }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap'
                    }}
                    onClick={() => {
                      const newCat = prompt('Masukkan nama kategori baru:')
                      if (newCat) {
                        handleAddCategory(newCat)
                      }
                    }}
                  >
                    Tambah Kategori
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Foto Cover</label>
                <input
                  type="file"
                  name="foto_cover"
                  onChange={(e) => setFormData({ ...formData, foto_cover: e.target.files[0] || null })}
                  accept="image/*"
                  className="form-input"
                  style={{ padding: '8px 4px' }}
                />
                {formData.foto_cover && typeof formData.foto_cover === 'object' && formData.foto_cover instanceof File && (
                  <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#059669' }}>
                    ✅ File: {formData.foto_cover.name}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Konten</label>
                <textarea
                  name="konten"
                  value={formData.konten}
                  onChange={handleFormChange}
                  placeholder="Masukkan konten artikel"
                  className="form-input"
                  rows="5"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setEditDialog({ open: false, data: null })}>
                Batal
              </button>
              <button className="btn-primary" onClick={handleSaveEdit}>
                Simpan Artikel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
