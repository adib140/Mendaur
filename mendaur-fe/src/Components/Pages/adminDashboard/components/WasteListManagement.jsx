import { useState, useEffect, useCallback } from 'react'
import { Plus, Eye, Edit2, Trash2, Search, X, Loader, Package, Layers, TrendingUp, DollarSign } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import adminApi from '../../../../services/adminApi'
import { API_BASE_URL } from '../../../../config/api'
import '../styles/contentManagement.css'

// Mock data
const MOCK_WASTE_ITEMS = [
  { jenis_sampah_id: 1, nama_jenis: 'PET (Botol Minuman)', kategori_sampah_id: 1, kategori_sampah: 'Plastik', satuan: 'kg', harga_per_kg: 3000, kode: 'PLS-PET', is_active: true, updated_at: new Date().toISOString() },
  { jenis_sampah_id: 2, nama_jenis: 'HDPE (Kemasan)', kategori_sampah_id: 1, kategori_sampah: 'Plastik', satuan: 'kg', harga_per_kg: 2500, kode: 'PLS-HDPE', is_active: true, updated_at: new Date().toISOString() },
  { jenis_sampah_id: 3, nama_jenis: 'Kertas Putih', kategori_sampah_id: 2, kategori_sampah: 'Kertas', satuan: 'kg', harga_per_kg: 500, kode: 'PRP-PTH', is_active: true, updated_at: new Date().toISOString() },
  { jenis_sampah_id: 4, nama_jenis: 'Kardus Bekas', kategori_sampah_id: 2, kategori_sampah: 'Kertas', satuan: 'kg', harga_per_kg: 700, kode: 'PRP-KDX', is_active: true, updated_at: new Date().toISOString() },
  { jenis_sampah_id: 5, nama_jenis: 'Aluminium Can', kategori_sampah_id: 3, kategori_sampah: 'Logam', satuan: 'kg', harga_per_kg: 5000, kode: 'LGM-ALU', is_active: true, updated_at: new Date().toISOString() },
  { jenis_sampah_id: 6, nama_jenis: 'Botol Kaca Bening', kategori_sampah_id: 4, kategori_sampah: 'Kaca', satuan: 'kg', harga_per_kg: 1000, kode: 'KCA-BEN', is_active: true, updated_at: new Date().toISOString() },
]

// Category configuration with 8 categories and colors
const WASTE_CATEGORIES = [
  { id: 1, nama: 'Plastik', warna: '#2196F3', icon: '♻️' },
  { id: 2, nama: 'Kertas', warna: '#8B4513', icon: '📄' },
  { id: 3, nama: 'Logam', warna: '#A9A9A9', icon: '🔩' },
  { id: 4, nama: 'Kaca', warna: '#00BCD4', icon: '🍾' },
  { id: 5, nama: 'Elektronik', warna: '#FF9800', icon: '🔌' },
  { id: 6, nama: 'Tekstil', warna: '#E91E63', icon: '👕' },
  { id: 7, nama: 'Pecah Belah', warna: '#9C27B0', icon: '🪟' },
  { id: 8, nama: 'Lainnya', warna: '#607D8B', icon: '🗑️' }
]

// Helper functions
const getCategoryInfo = (kategoriId) => {
  return WASTE_CATEGORIES.find(c => c.id === kategoriId)
}

const getCategoryColor = (kategoriId) => {
  return getCategoryInfo(kategoriId)?.warna || '#999'
}

export default function WasteListManagement() {
  const { hasPermission } = useAuth()
  const [wasteItems, setWasteItems] = useState(MOCK_WASTE_ITEMS)
  const [filteredItems, setFilteredItems] = useState(MOCK_WASTE_ITEMS)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Stats dari endpoint baru /api/jenis-sampah/stats
  const [wasteStats, setWasteStats] = useState({
    total_jenis: 0,
    total_kategori: 0,
    harga_tertinggi: 0,
    harga_terendah: 0,
    harga_rata_rata: 0,
  })

  // Dialog states
  const [viewDialog, setViewDialog] = useState({ open: false, data: null })
  const [addDialog, setAddDialog] = useState({ open: false })
  const [editDialog, setEditDialog] = useState({ open: false, data: null })
  const [categories, setCategories] = useState(WASTE_CATEGORIES)
  const [newCategory, setNewCategory] = useState({ nama: '', warna: '#2196F3', icon: '♻️' })
  const [formData, setFormData] = useState({
    nama_jenis: '',
    kategori_sampah_id: 1,
    satuan: 'kg',
    harga_per_kg: '',
    kode: '',
    is_active: true,
  })

  // Fetch waste stats dari endpoint baru
  const loadWasteStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/jenis-sampah/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.data) {
          setWasteStats(result.data)
        }
      }
    } catch (error) {
      console.warn('Error fetching waste stats:', error)
      // Fallback ke perhitungan manual dari wasteItems
    }
  }, [])

  // Separated fetch function (Session 2 pattern)
  const loadWasteItems = async () => {
    setLoading(true)
    try {
      const result = await adminApi.getAllWasteItems(1, 50)
      
      // Multi-format response handler (supports 3+ formats)
      let data = MOCK_WASTE_ITEMS
      if (Array.isArray(result.data)) data = result.data
      else if (result.data?.data) data = result.data.data
      else if (result.data?.waste_items) data = result.data.waste_items
      
      setWasteItems(data)
    } catch (err) {
      console.warn('Waste items fetch error, using mock:', err.message)
      setWasteItems(MOCK_WASTE_ITEMS)
    } finally {
      setLoading(false)
    }
  }

  // Load waste items on component mount
  useEffect(() => {
    loadWasteItems()
    loadWasteStats()
  }, [loadWasteStats])

  // Filter waste items
  useEffect(() => {
    let filtered = wasteItems.filter(item => {
      const matchSearch = item.nama_jenis.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.kode && item.kode.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchCategory = filterCategory === 'all' || item.kategori_sampah_id === parseInt(filterCategory)
      return matchSearch && matchCategory
    })
    setFilteredItems(filtered)
    setCurrentPage(1)
  }, [searchQuery, filterCategory, wasteItems])

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)

  const handleAddCategory = () => {
    if (newCategory.nama.trim() && !categories.some(c => c.nama === newCategory.nama.trim())) {
      const newCat = {
        id: Math.max(...categories.map(c => c.id), 0) + 1,
        nama: newCategory.nama.trim(),
        warna: newCategory.warna,
        icon: newCategory.icon
      }
      setCategories([...categories, newCat])
      setFormData({ ...formData, kategori_sampah_id: newCat.id })
      setNewCategory({ nama: '', warna: '#2196F3', icon: '♻️' })
    } else {
      alert('❌ Kategori sudah ada atau kosong')
    }
  }

  const handleAdd = () => {
    if (!hasPermission('manage_content')) {
      alert('❌ You do not have permission to add waste items')
      return
    }
    setFormData({ nama_jenis: '', kategori_sampah_id: 1, satuan: 'kg', harga_per_kg: '', kode: '', is_active: true })
    setAddDialog({ open: true })
  }

  const handleEdit = (item) => {
    if (!hasPermission('manage_content')) {
      alert('❌ You do not have permission to edit waste items')
      return
    }
    setFormData({ ...item })
    setEditDialog({ open: true, data: item })
  }

  const handleView = (item) => {
    setViewDialog({ open: true, data: item })
  }

  const handleDelete = async (jenis_sampah_id) => {
    if (!hasPermission('manage_content')) {
      alert('❌ You do not have permission to delete waste items')
      return
    }
    if (confirm('Apakah Anda yakin ingin menghapus item sampah ini?')) {
      try {
        const response = await adminApi.deleteWasteItem(jenis_sampah_id)
        
        if (response.success) {
          // Refresh waste items list
          await loadWasteItems()
          alert('✅ Item sampah berhasil dihapus')
        } else {
          alert('❌ ' + (response.message || 'Gagal menghapus item sampah'))
        }
      } catch (error) {
        console.error('Error deleting waste item:', error)
        alert('❌ Terjadi kesalahan saat menghapus item sampah')
      }
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'kategori_sampah_id' ? parseInt(value) : (name === 'is_active' ? e.target.checked : value)
    }))
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleSaveAdd = async () => {
    if (!formData.nama_jenis || !formData.kategori_sampah_id) {
      alert('❌ Nama sampah dan kategori harus diisi')
      return
    }
    
    try {
      setLoading(true)
      const payload = {
        nama_jenis: formData.nama_jenis,
        kategori_sampah_id: formData.kategori_sampah_id,
        satuan: formData.satuan,
        harga_per_kg: parseInt(formData.harga_per_kg) || 0,
        kode: formData.kode || '',
        is_active: formData.is_active,
      }
      
      const response = await adminApi.createWasteItem(payload)
      
      if (response.success) {
        // Refresh waste items list
        const refreshResponse = await adminApi.getAllWasteItems(1, 50)
        if (refreshResponse.success && refreshResponse.data) {
          const wasteList = Array.isArray(refreshResponse.data) ? refreshResponse.data : (refreshResponse.data.data || [])
          setWasteItems(wasteList)
        }
        alert('✅ Item sampah berhasil ditambahkan')
        setAddDialog({ open: false })
        setFormData({ nama_jenis: '', kategori_sampah_id: 1, satuan: 'kg', harga_per_kg: '', kode: '', is_active: true })
      } else {
        alert('❌ ' + (response.message || 'Gagal menambahkan item sampah'))
      }
    } catch (error) {
      console.error('Error adding waste item:', error)
      alert('❌ Terjadi kesalahan saat menambahkan item sampah')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!formData.nama_jenis || !formData.kategori_sampah_id) {
      alert('❌ Nama sampah dan kategori harus diisi')
      return
    }
    
    try {
      setLoading(true)
      const payload = {
        nama_jenis: formData.nama_jenis,
        kategori_sampah_id: formData.kategori_sampah_id,
        satuan: formData.satuan,
        harga_per_kg: parseInt(formData.harga_per_kg) || 0,
        kode: formData.kode || '',
        is_active: formData.is_active,
      }
      
      const response = await adminApi.updateWasteItem(formData.jenis_sampah_id, payload)
      
      if (response.success) {
        // Refresh waste items list
        const refreshResponse = await adminApi.getAllWasteItems(1, 50)
        if (refreshResponse.success && refreshResponse.data) {
          const wasteList = Array.isArray(refreshResponse.data) ? refreshResponse.data : (refreshResponse.data.data || [])
          setWasteItems(wasteList)
        }
        alert('✅ Item sampah berhasil diperbarui')
        setEditDialog({ open: false, data: null })
        setFormData({ nama_jenis: '', kategori_sampah_id: 1, satuan: 'kg', harga_per_kg: '', kode: '', is_active: true })
      } else {
        alert('❌ ' + (response.message || 'Gagal memperbarui item sampah'))
      }
    } catch (error) {
      console.error('Error updating waste item:', error)
      alert('❌ Terjadi kesalahan saat memperbarui item sampah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="waste-list-management">
      {/* Header */}
      <div className="management-header">
        <h2>Manajemen Jenis Sampah</h2>
        <p>Kelola jenis sampah dan harga penebukannya</p>
      </div>

      {/* Stats - Gunakan data dari API jika tersedia */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
            <Package size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Jenis Sampah</span>
            <span className="stat-value">{wasteStats.total_jenis || wasteItems.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
            <Layers size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Kategori</span>
            <span className="stat-value">{wasteStats.total_kategori || categories.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Harga Tertinggi</span>
            <span className="stat-value">
              {formatCurrency(wasteStats.harga_tertinggi || Math.max(...wasteItems.map(item => item.harga_per_kg), 0))}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Harga Rata-rata</span>
            <span className="stat-value">
              {formatCurrency(wasteStats.harga_rata_rata || (wasteItems.length > 0 ? Math.round(wasteItems.reduce((sum, item) => sum + item.harga_per_kg, 0) / wasteItems.length) : 0))}
            </span>
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
            placeholder="Cari jenis sampah..."
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
            <option key={cat.id} value={cat.id}>{cat.nama}</option>
          ))}
        </select>

        <button className="btn-add" onClick={handleAdd}>
          <Plus size={18} /> Tambah Jenis Sampah
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <Loader className="spinner" size={32} />
          <p>Memuat jenis sampah...</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama Jenis</th>
                  <th>Kategori</th>
                  <th>Satuan</th>
                  <th>Harga/kg</th>
                  <th>Kode</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Tidak ada jenis sampah</td>
                  </tr>
                ) : (
                  currentItems.map((item) => (
                    <tr 
                      key={item.jenis_sampah_id}
                      style={item.is_active === false ? { opacity: 0.5, backgroundColor: '#f5f5f5' } : {}}
                    >
                      <td>{item.jenis_sampah_id}</td>
                      <td>
                        <strong>{item.nama_jenis}</strong>
                        {item.is_active === false && (
                          <span style={{ 
                            marginLeft: '8px', 
                            fontSize: '10px', 
                            padding: '2px 6px', 
                            backgroundColor: '#ef4444', 
                            color: 'white', 
                            borderRadius: '4px' 
                          }}>
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          backgroundColor: getCategoryColor(item.kategori_sampah_id) + '20',
                          color: getCategoryColor(item.kategori_sampah_id),
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          {getCategoryInfo(item.kategori_sampah_id)?.icon} {getCategoryInfo(item.kategori_sampah_id)?.nama}
                        </span>
                      </td>
                      <td>{item.satuan}</td>
                      <td>
                        <strong>{formatCurrency(item.harga_per_kg)}/kg</strong>
                      </td>
                      <td>{item.kode || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-icon" onClick={() => handleView(item)} title="Lihat">
                            <Eye size={16} />
                          </button>
                          <button className="btn-icon" onClick={() => handleEdit(item)} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button className="btn-icon delete" onClick={() => handleDelete(item.jenis_sampah_id)} title="Hapus">
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
              <h4>Detail Jenis Sampah</h4>
              <button className="btn-close" onClick={() => setViewDialog({ open: false, data: null })}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {viewDialog.data && (
                <>
                  <div className="field-row">
                    <span className="field-label">ID:</span>
                    <span className="field-value">{viewDialog.data.jenis_sampah_id}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Nama Jenis:</span>
                    <span className="field-value">{viewDialog.data.nama_jenis}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Kategori:</span>
                    <span className="field-value"
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        backgroundColor: getCategoryColor(viewDialog.data.kategori_sampah_id) + '20',
                        color: getCategoryColor(viewDialog.data.kategori_sampah_id),
                        display: 'inline-block',
                        fontWeight: '500'
                      }}
                    >
                      {getCategoryInfo(viewDialog.data.kategori_sampah_id)?.icon} {getCategoryInfo(viewDialog.data.kategori_sampah_id)?.nama}
                    </span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Satuan:</span>
                    <span className="field-value">{viewDialog.data.satuan}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Harga/kg:</span>
                    <span className="field-value" style={{ fontWeight: 'bold', color: '#059669', fontSize: '1.1rem' }}>
                      {formatCurrency(viewDialog.data.harga_per_kg)}
                    </span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Kode:</span>
                    <span className="field-value">{viewDialog.data.kode || '-'}</span>
                  </div>
                  <div className="field-row">
                    <span className="field-label">Status:</span>
                    <span className="field-value">
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: viewDialog.data.is_active ? '#d1fae5' : '#fee2e2',
                        color: viewDialog.data.is_active ? '#065f46' : '#991b1b',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        {viewDialog.data.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </span>
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
              <h4>Tambah Jenis Sampah Baru</h4>
              <button className="btn-close" onClick={() => setAddDialog({ open: false })}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nama Jenis Sampah *</label>
                <input
                  type="text"
                  name="nama_jenis"
                  value={formData.nama_jenis}
                  onChange={handleFormChange}
                  placeholder="Contoh: PET (Botol Minuman)"
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Kategori Sampah *</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <select
                      name="kategori_sampah_id"
                      value={formData.kategori_sampah_id}
                      onChange={handleFormChange}
                      className="form-input"
                      style={{ flex: 1 }}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.nama}</option>
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
                        const newCatName = prompt('Masukkan nama kategori baru:')
                        if (newCatName) {
                          setNewCategory({ ...newCategory, nama: newCatName })
                          handleAddCategory()
                        }
                      }}
                    >
                      Tambah Kategori
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Satuan</label>
                  <input
                    type="text"
                    name="satuan"
                    value={formData.satuan}
                    onChange={handleFormChange}
                    placeholder="kg, liter, dll"
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Harga per kg (Rp)</label>
                  <input
                    type="number"
                    name="harga_per_kg"
                    value={formData.harga_per_kg}
                    onChange={handleFormChange}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Kode Item</label>
                  <input
                    type="text"
                    name="kode"
                    value={formData.kode}
                    onChange={handleFormChange}
                    placeholder="Contoh: PLS-PET"
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleFormChange}
                    style={{ marginRight: '8px' }}
                  />
                  Aktif
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setAddDialog({ open: false })}>
                Batal
              </button>
              <button className="btn-primary" onClick={handleSaveAdd}>
                Tambah Jenis Sampah
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
              <h4>Edit Jenis Sampah</h4>
              <button className="btn-close" onClick={() => setEditDialog({ open: false, data: null })}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nama Jenis Sampah *</label>
                <input
                  type="text"
                  name="nama_jenis"
                  value={formData.nama_jenis}
                  onChange={handleFormChange}
                  placeholder="Contoh: PET (Botol Minuman)"
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Kategori Sampah *</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <select
                      name="kategori_sampah_id"
                      value={formData.kategori_sampah_id}
                      onChange={handleFormChange}
                      className="form-input"
                      style={{ flex: 1 }}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.nama}</option>
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
                        const newCatName = prompt('Masukkan nama kategori baru:')
                        if (newCatName) {
                          setNewCategory({ ...newCategory, nama: newCatName })
                          handleAddCategory()
                        }
                      }}
                    >
                      Tambah Kategori
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Satuan</label>
                  <input
                    type="text"
                    name="satuan"
                    value={formData.satuan}
                    onChange={handleFormChange}
                    placeholder="kg, liter, dll"
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Harga per kg (Rp)</label>
                  <input
                    type="number"
                    name="harga_per_kg"
                    value={formData.harga_per_kg}
                    onChange={handleFormChange}
                    placeholder="0"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Kode Item</label>
                  <input
                    type="text"
                    name="kode"
                    value={formData.kode}
                    onChange={handleFormChange}
                    placeholder="Contoh: PLS-PET"
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleFormChange}
                    style={{ marginRight: '8px' }}
                  />
                  Aktif
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setEditDialog({ open: false, data: null })}>
                Batal
              </button>
              <button className="btn-primary" onClick={handleSaveEdit}>
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
