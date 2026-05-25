import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Eye, Edit2, Trash2, Search, X, Loader, Upload, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import adminApi from '../../../../services/adminApi'
import '../styles/contentManagement.css'

// Database mock data (matching mendaur_api schema)
const MOCK_PRODUCTS = [
  { produk_id: 1, nama: 'Tas Belanja Ramah Lingkungan', harga_poin: 50, stok: 100, status: 'tersedia', deskripsi: 'Tas belanja terbuat dari bahan daur ulang', foto: 'produk/tas-belanja.jpg' },
  { produk_id: 2, nama: 'Botol Minum Stainless', harga_poin: 100, stok: 50, status: 'tersedia', deskripsi: 'Botol minum 500ml stainless steel', foto: 'produk/botol-stainless.jpg' },
  { produk_id: 3, nama: 'Pupuk Kompos Organik 1kg', harga_poin: 30, stok: 200, status: 'tersedia', deskripsi: 'Pupuk kompos hasil pengolahan sampah organik', foto: 'produk/pupuk-kompos.jpg' },
  { produk_id: 4, nama: 'Sedotan Stainless (Set 4)', harga_poin: 40, stok: 150, status: 'tersedia', deskripsi: 'Set sedotan stainless dengan sikat pembersih', foto: 'produk/sedotan-stainless.jpg' },
  { produk_id: 5, nama: 'Voucher Pulsa 50K', harga_poin: 500, stok: 0, status: 'habis', deskripsi: 'Voucher pulsa senilai Rp 50.000', foto: 'produk/voucher-pulsa.jpg' },
]

export default function ProductManagement() {
  const { hasPermission } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dialog states
  const [viewDialog, setViewDialog] = useState({ open: false, data: null })
  const [addDialog, setAddDialog] = useState({ open: false })
  const [editDialog, setEditDialog] = useState({ open: false, data: null })
  const [formData, setFormData] = useState({
    nama: '',
    harga_poin: '',
    stok: '',
    kategori: '',
    status: 'tersedia',
    deskripsi: '',
    foto: null,
    fotoPreview: '',
  })

  // Load products from API
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)

      // Call adminApi endpoint
      const response = await adminApi.getAllProducts(1, 100)
      
      // Check if API call was successful
      if (!response.success || !response.data) {
        console.warn('API failed or returned no data, using mock data')
        setProducts(MOCK_PRODUCTS)
        return
      }
      
      // Multi-format response handler (supports 3+ formats)
      let productsData = MOCK_PRODUCTS
      if (Array.isArray(response.data)) {
        // Direct array format
        productsData = response.data
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Wrapped in data key
        productsData = response.data.data
      } else if (response.data?.produk && Array.isArray(response.data.produk)) {
        // Wrapped in produk key
        productsData = response.data.produk
      }
      
      setProducts(productsData)
    } catch (err) {
      console.warn('Error fetching products, using mock data:', err.message)
      // Fallback to mock data on error
      setProducts(MOCK_PRODUCTS)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load products on component mount
  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchSearch = product.nama.toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus = filterStatus === 'all' || product.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [products, searchQuery, filterStatus])

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  const handleAdd = () => {
    if (!hasPermission('manage_content')) {
      alert('❌ Anda tidak memiliki izin untuk menambah produk')
      return
    }
    setFormData({ nama: '', harga_poin: '', stok: '', kategori: '', status: 'tersedia', deskripsi: '', foto: null, fotoPreview: '' })
    setAddDialog({ open: true })
  }

  const handleEdit = (product) => {
    if (!hasPermission('manage_content')) {
      alert('❌ Anda tidak memiliki izin untuk mengedit produk')
      return
    }
    setFormData({ 
      nama: product.nama,
      harga_poin: product.harga_poin,
      stok: product.stok,
      kategori: product.kategori || '',
      status: product.status,
      deskripsi: product.deskripsi,
      foto: null,
      fotoPreview: product.foto ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${product.foto}` : ''
    })
    setEditDialog({ open: true, data: product })
  }

  const handleView = (product) => {
    setViewDialog({ open: true, data: product })
  }

  const handleDelete = async (produk_id) => {
    if (!hasPermission('manage_content')) {
      alert('❌ Anda tidak memiliki izin untuk menghapus produk')
      return
    }
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      try {
        setLoading(true)
        const response = await adminApi.deleteProduct(produk_id)
        
        if (response.success) {
          // Refresh products list
          await loadProducts()
          alert('✅ Produk berhasil dihapus')
        } else {
          alert('❌ ' + (response.message || 'Gagal menghapus produk'))
        }
      } catch (error) {
        console.error('Error deleting product:', error)
        alert('❌ Terjadi kesalahan saat menghapus produk')
      } finally {
        setLoading(false)
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

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type (jpeg, jpg, png only)
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
      if (!validTypes.includes(file.type)) {
        alert('❌ Format file harus JPEG, JPG, atau PNG')
        return
      }
      // Validate file size (max 2MB as per backend)
      if (file.size > 2 * 1024 * 1024) {
        alert('❌ Ukuran file maksimal 2MB')
        return
      }
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          foto: file,
          fotoPreview: reader.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveAdd = async () => {
    // ✅ Validation
    if (!formData.nama) {
      alert('❌ Nama produk harus diisi')
      return
    }
    
    if (!formData.harga_poin || parseInt(formData.harga_poin) <= 0) {
      alert('❌ Harga poin harus diisi dan lebih dari 0')
      return
    }

    if (!formData.kategori) {
      alert('❌ Kategori produk harus diisi')
      return
    }

    // ✅ Permission check
    if (!hasPermission('manage_content')) {
      alert('❌ You do not have permission to create products')
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Build payload with snake_case field names matching backend
      const payload = {
        nama: formData.nama,
        harga_poin: parseInt(formData.harga_poin),
        stok: parseInt(formData.stok) || 0,
        kategori: formData.kategori,
        deskripsi: formData.deskripsi || '',
        status: formData.status || 'tersedia',
        foto: formData.foto instanceof File ? formData.foto : null,
      }
      
      const response = await adminApi.createProduct(payload)
      
      if (response.success) {
        // Refresh products list
        await loadProducts()
        alert('✅ Produk berhasil ditambahkan')
        setAddDialog({ open: false })
        setFormData({ nama: '', harga_poin: '', stok: '', kategori: '', status: 'tersedia', deskripsi: '', foto: null, fotoPreview: '' })
        setCurrentPage(1)
      } else {
        alert('❌ ' + (response.message || 'Gagal menambahkan produk'))
      }
    } catch (error) {
      console.error('Error adding product:', error)
      alert('❌ ' + (error.message || 'Terjadi kesalahan saat menambahkan produk'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveEdit = async () => {
    // ✅ Validation
    if (!formData.nama) {
      alert('❌ Nama produk harus diisi')
      return
    }
    
    if (!formData.harga_poin || parseInt(formData.harga_poin) <= 0) {
      alert('❌ Harga poin harus diisi dan lebih dari 0')
      return
    }

    if (!formData.kategori) {
      alert('❌ Kategori produk harus diisi')
      return
    }

    // ✅ Permission check
    if (!hasPermission('manage_content')) {
      alert('❌ You do not have permission to update products')
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Build payload with snake_case field names matching backend
      const payload = {
        nama: formData.nama,
        harga_poin: parseInt(formData.harga_poin),
        stok: parseInt(formData.stok) || 0,
        kategori: formData.kategori,
        deskripsi: formData.deskripsi || '',
        status: formData.status || 'tersedia',
        foto: formData.foto instanceof File ? formData.foto : null,
      }
      
      const response = await adminApi.updateProduct(editDialog.data.produk_id, payload)
      
      if (response.success) {
        // Refresh products list
        await loadProducts()
        alert('✅ Produk berhasil diperbarui')
        setEditDialog({ open: false, data: null })
        setFormData({ nama: '', harga_poin: '', stok: '', kategori: '', status: 'tersedia', deskripsi: '', foto: null, fotoPreview: '' })
      } else {
        alert('❌ ' + (response.message || 'Gagal memperbarui produk'))
      }
    } catch (error) {
      console.error('Error updating product:', error)
      alert('❌ ' + (error.message || 'Terjadi kesalahan saat memperbarui produk'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="product-management">
      {/* Header */}
      <div className="management-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>Manajemen Produk</h2>
            <p>Kelola semua produk dan inventaris</p>
          </div>
          <button 
            className="btn-refresh"
            onClick={loadProducts}
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

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Produk</span>
            <span className="stat-value">{products.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Stok</span>
            <span className="stat-value">{products.reduce((sum, p) => sum + p.stok, 0)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Tersedia</span>
            <span className="stat-value">{products.filter(p => p.status === 'tersedia').length}</span>
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
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="form-input"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Semua Status</option>
          <option value="tersedia">Tersedia</option>
          <option value="habis">Habis</option>
        </select>

        <button className="btn-add" onClick={handleAdd}>
          <Plus size={18} /> Tambah Produk
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Loader className="spinner" size={32} />
          <p>Memuat produk...</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama</th>
                  <th>Harga</th>
                  <th>Stok</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Tidak ada produk</td>
                  </tr>
                ) : (
                  currentItems.map((product) => (
                    <tr key={product.produk_id}>
                      <td>{product.produk_id}</td>
                      <td><strong>{product.nama}</strong></td>
                      <td>
                        <span style={{ backgroundColor: '#e0f2fe', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>
                          {product.harga_poin} poin
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: product.stok === 0 ? '#fee2e2' : '#dcfce7',
                          color: product.stok === 0 ? '#991b1b' : '#166534',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          {product.stok}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${product.status === 'tersedia' ? 'badge-aktif' : 'badge-habis'}`}>
                          {product.status === 'tersedia' ? 'Tersedia' : 'Habis'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-icon" onClick={() => handleView(product)} title="Lihat">
                            <Eye size={16} />
                          </button>
                          <button className="btn-icon" onClick={() => handleEdit(product)} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button className="btn-icon delete" onClick={() => handleDelete(product.produk_id)} title="Hapus">
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
              <h4>Detail Produk</h4>
              <button className="btn-close" onClick={() => setViewDialog({ open: false, data: null })}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {viewDialog.data && (
                <>
                  <div className="field-row">
                    <span className="field-label">ID:</span>
                    <span className="field-value">{viewDialog.data.produk_id}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Nama:</span>
                    <span className="field-value">{viewDialog.data.nama}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Harga Poin:</span>
                    <span className="field-value">{viewDialog.data.harga_poin} poin</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Stok:</span>
                    <span className="field-value">{viewDialog.data.stok}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Status:</span>
                    <span className="field-value">{viewDialog.data.status === 'tersedia' ? 'Tersedia' : 'Habis'}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Deskripsi:</span>
                    <span className="field-value">{viewDialog.data.deskripsi}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Foto:</span>
                    <span className="field-value">{viewDialog.data.foto || '-'}</span>
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
              <h4>Tambah Produk Baru</h4>
              <button className="btn-close" onClick={() => setAddDialog({ open: false })}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nama Produk *</label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleFormChange}
                  placeholder="Masukkan nama produk"
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Harga Poin *</label>
                  <input
                    type="number"
                    name="harga_poin"
                    value={formData.harga_poin}
                    onChange={handleFormChange}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Stok</label>
                  <input
                    type="number"
                    name="stok"
                    value={formData.stok}
                    onChange={handleFormChange}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Kategori *</label>
                <input
                  type="text"
                  name="kategori"
                  value={formData.kategori}
                  onChange={handleFormChange}
                  placeholder="Masukkan kategori produk"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="form-input"
                >
                  <option value="tersedia">Tersedia</option>
                  <option value="habis">Habis</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
              <div className="form-group">
                <label>Deskripsi</label>
                <textarea
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleFormChange}
                  placeholder="Masukkan deskripsi produk"
                  className="form-input"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Foto Produk</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#f8fafc',
                    transition: 'all 0.3s'
                  }}>
                    <input
                      type="file"
                      id="foto-add"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleFotoChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="foto-add" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Upload size={32} color="#64748b" />
                      <span style={{ fontSize: '14px', color: '#475569' }}>Klik untuk upload foto</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>JPEG, JPG, PNG (max 2MB)</span>
                    </label>
                  </div>
                  {formData.fotoPreview && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                      <img src={formData.fotoPreview} alt="preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, foto: null, fotoPreview: '' }))}
                        style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Hapus Foto
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setAddDialog({ open: false })} disabled={isSubmitting}>
                Batal
              </button>
              <button className="btn-primary" onClick={handleSaveAdd} disabled={isSubmitting}>
                {isSubmitting ? 'Menambah...' : 'Tambah Produk'}
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
              <h4>Edit Produk</h4>
              <button className="btn-close" onClick={() => setEditDialog({ open: false, data: null })}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nama Produk *</label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleFormChange}
                  placeholder="Masukkan nama produk"
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Harga Poin *</label>
                  <input
                    type="number"
                    name="harga_poin"
                    value={formData.harga_poin}
                    onChange={handleFormChange}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Stok</label>
                  <input
                    type="number"
                    name="stok"
                    value={formData.stok}
                    onChange={handleFormChange}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Kategori *</label>
                <input
                  type="text"
                  name="kategori"
                  value={formData.kategori}
                  onChange={handleFormChange}
                  placeholder="Masukkan kategori produk"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="form-input"
                >
                  <option value="tersedia">Tersedia</option>
                  <option value="habis">Habis</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
              <div className="form-group">
                <label>Deskripsi</label>
                <textarea
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleFormChange}
                  placeholder="Masukkan deskripsi produk"
                  className="form-input"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Foto Produk</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#f8fafc',
                    transition: 'all 0.3s'
                  }}>
                    <input
                      type="file"
                      id="foto-edit"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleFotoChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="foto-edit" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Upload size={32} color="#64748b" />
                      <span style={{ fontSize: '14px', color: '#475569' }}>Klik untuk ganti foto</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>JPEG, JPG, PNG (max 2MB)</span>
                    </label>
                  </div>
                  {(formData.fotoPreview || formData.foto) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                      <img src={formData.fotoPreview || formData.foto} alt="preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, foto: null, fotoPreview: '' }))}
                        style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Hapus Foto
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setEditDialog({ open: false, data: null })} disabled={isSubmitting}>
                Batal
              </button>
              <button className="btn-primary" onClick={handleSaveEdit} disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
