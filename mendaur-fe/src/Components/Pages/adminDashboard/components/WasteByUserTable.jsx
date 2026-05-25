import React, { useState, useEffect, useCallback } from 'react'
import {
  Eye,
  Search,
  Download,
  Loader,
  User,
  Scale,
  Award,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Trophy
} from 'lucide-react'
import adminApi from '../../../../services/adminApi'
import '../styles/analyticsManagement.css'

// Mock waste by user data for development
const MOCK_WASTE_BY_USER = [
  {
    user_id: 1,
    nama_lengkap: 'Ahmad Rizki',
    email: 'ahmad@example.com',
    total_deposits: 15,
    total_kg: 45.5,
    total_points: 455,
    pending_kg: 5.5,
    pending_points: 55,
    approved_kg: 40.0,
    approved_points: 400,
    avg_per_deposit: 3.03,
    last_deposit: new Date(Date.now() - 86400000).toISOString(),
    most_common_waste: 'Plastik',
  },
  {
    user_id: 2,
    nama_lengkap: 'Siti Nurhaliza',
    email: 'siti@example.com',
    total_deposits: 22,
    total_kg: 62.8,
    total_points: 628,
    pending_kg: 3.2,
    pending_points: 32,
    approved_kg: 59.6,
    approved_points: 596,
    avg_per_deposit: 2.85,
    last_deposit: new Date(Date.now() - 172800000).toISOString(),
    most_common_waste: 'Kertas',
  },
  {
    user_id: 3,
    nama_lengkap: 'Budi Santoso',
    email: 'budi@example.com',
    total_deposits: 8,
    total_kg: 18.5,
    total_points: 185,
    pending_kg: 2.1,
    pending_points: 21,
    approved_kg: 16.4,
    approved_points: 164,
    avg_per_deposit: 2.31,
    last_deposit: new Date(Date.now() - 259200000).toISOString(),
    most_common_waste: 'Logam',
  },
]

const WasteByUserTable = () => {
  // States
  const [wasteByUser, setWasteByUser] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('total_kg')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWaste: 0,
    totalPoints: 0,
    avgPerUser: 0,
    topUser: null,
  })

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  // Pagination
  const itemsPerPage = 10

  const loadWasteByUser = useCallback(async () => {
    setLoading(true)
    try {
      const result = await adminApi.getWasteByUser(currentPage, itemsPerPage)

      // Handle authentication error
      if (!result.success && result.error === 'HTTP 401') {
        // Authentication failed - please login again
      }

      let data = []

      if (result.success && result.data) {
        // API returns: {data: {records: [...], pagination: {...}}}
        if (result.data?.records && Array.isArray(result.data.records)) {
          data = result.data.records
        }
        // Alternative: direct array
        else if (Array.isArray(result.data)) {
          data = result.data
        } 
        // Alternative: nested data.data
        else if (result.data?.data && Array.isArray(result.data.data)) {
          data = result.data.data
        }
        
        // If API returns empty, use mock for demo
        if (data.length === 0) {
          data = MOCK_WASTE_BY_USER
        }
      } else {
        data = MOCK_WASTE_BY_USER
      }

      setWasteByUser(data)
      calculateStats(data)
    } catch {
      setWasteByUser(MOCK_WASTE_BY_USER)
      calculateStats(MOCK_WASTE_BY_USER)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage])

  // Load waste by user on component mount
  useEffect(() => {
    loadWasteByUser()
  }, [loadWasteByUser])

  const calculateStats = (data) => {
    if (!data || data.length === 0) {
      setStats({
        totalUsers: 0,
        totalWaste: 0,
        totalPoints: 0,
        avgPerUser: 0,
        topUser: null,
      })
      return
    }

    const totalWaste = data.reduce((sum, user) => sum + (user.total_kg || 0), 0)
    const totalPoints = data.reduce((sum, user) => sum + (user.total_points || 0), 0)
    const topUser = data.reduce((max, user) =>
      (user.total_kg || 0) > (max?.total_kg || 0) ? user : max
    )

    setStats({
      totalUsers: data.length,
      totalWaste: totalWaste.toFixed(2),
      totalPoints: totalPoints,
      avgPerUser: (totalWaste / data.length).toFixed(2),
      topUser: topUser,
    })
  }

  const filteredData = wasteByUser
    .filter((user) => {
      const query = searchQuery.toLowerCase()
      return (
        user.nama_lengkap?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.most_common_waste?.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      if (typeof aValue === 'string') {
        aValue = aValue?.toLowerCase() || ''
        bValue = bValue?.toLowerCase() || ''
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const handleViewDetails = (user) => {
    setSelectedUser(user)
    setShowDetailModal(true)
  }

  const handleExportCSV = () => {
    const headers = [
      'Nama Lengkap',
      'Email',
      'Total Penyetoran',
      'Total Berat (kg)',
      'Total Poin',
      'Pending (kg)',
      'Pending Poin',
      'Disetujui (kg)',
      'Disetujui Poin',
      'Rata-rata/Setor',
      'Jenis Sampah Utama',
      'Penyetoran Terakhir',
    ]

    const rows = filteredData.map((user) => [
      user.nama_lengkap,
      user.email,
      user.total_deposits,
      user.total_kg,
      user.total_points,
      user.pending_kg,
      user.pending_points,
      user.approved_kg,
      user.approved_points,
      user.avg_per_deposit,
      user.most_common_waste,
      new Date(user.last_deposit).toLocaleDateString('id-ID'),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `waste-by-user-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <h2>
          <User size={28} color="#3b82f6" />
          Analisis Penyetoran per Nasabah
        </h2>
        <p>Riwayat lengkap penyetoran sampah dikelompokkan per pengguna</p>
      </div>

      {/* Statistics Cards */}
      <div className="analytics-stats-grid">
        <div className="analytics-stat-card count">
          <div className="stat-icon-wrapper count">
            <User size={28} />
          </div>
          <div className="stat-info">
            <div className="label">Total Nasabah</div>
            <div className="value">{stats.totalUsers}</div>
          </div>
        </div>

        <div className="analytics-stat-card weight">
          <div className="stat-icon-wrapper weight">
            <Scale size={28} />
          </div>
          <div className="stat-info">
            <div className="label">Total Sampah</div>
            <div className="value">{stats.totalWaste} kg</div>
          </div>
        </div>

        <div className="analytics-stat-card points">
          <div className="stat-icon-wrapper points">
            <Award size={28} />
          </div>
          <div className="stat-info">
            <div className="label">Total Poin</div>
            <div className="value">{stats.totalPoints?.toLocaleString('id-ID')}</div>
          </div>
        </div>

        <div className="analytics-stat-card growth">
          <div className="stat-icon-wrapper growth">
            <TrendingUp size={28} />
          </div>
          <div className="stat-info">
            <div className="label">Rata-rata/Nasabah</div>
            <div className="value">{stats.avgPerUser} kg</div>
          </div>
        </div>
      </div>

      {/* Top User Highlight */}
      {stats.topUser && (
        <div className="analytics-section" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '2px solid #f59e0b', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Trophy size={32} color="#f59e0b" />
            <div>
              <div style={{ fontWeight: '700', fontSize: '18px', color: '#92400e' }}>
                🏆 Top Contributor: {stats.topUser.nama_lengkap}
              </div>
              <div style={{ color: '#b45309', marginTop: '4px' }}>
                {stats.topUser.total_kg} kg • {stats.topUser.total_deposits} penyetoran • {stats.topUser.total_points} poin
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 5 Contributors Bar Chart */}
      {wasteByUser.length > 0 && (
        <div className="analytics-chart-container">
          <div className="chart-header">
            <h4 className="chart-title">📊 Top 5 Kontributor Sampah</h4>
          </div>
          <div className="bar-chart">
            {wasteByUser
              .slice()
              .sort((a, b) => (b.total_kg || 0) - (a.total_kg || 0))
              .slice(0, 5)
              .map((user, index) => {
                const maxKg = Math.max(...wasteByUser.map(u => u.total_kg || 0))
                const percentage = maxKg > 0 ? ((user.total_kg || 0) / maxKg) * 100 : 0
                const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']
                
                return (
                  <div key={user.user_id || index} className="bar-chart-item">
                    <span className="bar-label">{user.nama_lengkap?.split(' ')[0] || 'User'}</span>
                    <div className="bar-visual">
                      <div className="bar-track">
                        <div 
                          className="bar-fill"
                          style={{ 
                            width: `${percentage}%`,
                            background: `linear-gradient(90deg, ${colors[index]}, ${colors[index]}99)`
                          }}
                        >
                          <span className="bar-value">{user.total_kg} kg</span>
                        </div>
                      </div>
                      <span className="bar-percentage">{user.total_points} poin</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="analytics-filters">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Cari nama, email, atau jenis sampah..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="search-input"
          />
        </div>

        <button onClick={handleExportCSV} className="export-btn">
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="analytics-loading">
          <Loader size={40} className="spinner" />
          <p>Memuat data penyetoran...</p>
        </div>
      )}

      {/* Table */}
      {!loading && paginatedData.length > 0 && (
        <div className="analytics-section">
          <div className="analytics-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('nama_lengkap')} style={{ cursor: 'pointer' }}>
                    👤 Nama {sortBy === 'nama_lengkap' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('total_deposits')} style={{ cursor: 'pointer' }}>
                    📦 Total Setor {sortBy === 'total_deposits' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('total_kg')} style={{ cursor: 'pointer' }}>
                    ⚖️ Berat Total {sortBy === 'total_kg' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('total_points')} style={{ cursor: 'pointer' }}>
                    ⭐ Poin Total {sortBy === 'total_points' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('pending_kg')} style={{ cursor: 'pointer' }}>
                    ⏳ Pending {sortBy === 'pending_kg' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('avg_per_deposit')} style={{ cursor: 'pointer' }}>
                    📊 Rata-rata {sortBy === 'avg_per_deposit' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>🏆 Sampah Utama</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((user) => (
                  <tr key={user.user_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '16px'
                        }}>
                          {user.nama_lengkap?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1f2937' }}>{user.nama_lengkap}</div>
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.total_deposits}</td>
                    <td>
                      <span className="weight-badge">{user.total_kg} kg</span>
                    </td>
                    <td>
                      <span className="points-badge">{user.total_points}</span>
                    </td>
                    <td>
                      <span className="pending-badge">
                        {user.pending_kg} kg ({user.pending_points}pt)
                      </span>
                    </td>
                    <td>{user.avg_per_deposit?.toFixed(2)} kg</td>
                    <td>{user.most_common_waste}</td>
                    <td>
                      <button
                        className="action-btn view"
                        title="Lihat detail"
                        onClick={() => handleViewDetails(user)}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && paginatedData.length === 0 && (
        <div className="analytics-empty">
          <AlertCircle size={48} />
          <p>Tidak ada data penyetoran yang sesuai dengan pencarian</p>
          <button onClick={loadWasteByUser} className="export-btn" style={{ marginTop: '16px' }}>
            <RefreshCw size={18} /> Refresh Data
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="analytics-pagination">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Sebelumnya
          </button>

          <div className="pagination-info">
            Halaman {currentPage} dari {totalPages}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Selanjutnya
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Penyetoran - {selectedUser.nama_lengkap}</h3>
              <button
                className="modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{selectedUser.email}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Total Penyetoran</span>
                  <span className="detail-value">{selectedUser.total_deposits}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Total Berat</span>
                  <span className="detail-value">{selectedUser.total_kg} kg</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Total Poin</span>
                  <span className="detail-value">{selectedUser.total_points}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Pending Berat</span>
                  <span className="detail-value pending">{selectedUser.pending_kg} kg</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Pending Poin</span>
                  <span className="detail-value pending">{selectedUser.pending_points}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Disetujui Berat</span>
                  <span className="detail-value approved">{selectedUser.approved_kg} kg</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Disetujui Poin</span>
                  <span className="detail-value approved">{selectedUser.approved_points}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Rata-rata per Penyetoran</span>
                  <span className="detail-value">{selectedUser.avg_per_deposit.toFixed(2)} kg</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Jenis Sampah Utama</span>
                  <span className="detail-value">{selectedUser.most_common_waste}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Penyetoran Terakhir</span>
                  <span className="detail-value">
                    {new Date(selectedUser.last_deposit).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDetailModal(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WasteByUserTable
