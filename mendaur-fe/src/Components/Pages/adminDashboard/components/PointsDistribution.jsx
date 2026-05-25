import { useState, useEffect, useCallback } from 'react'
import { 
  PieChart, 
  Loader, 
  AlertCircle,
  Coins,
  TrendingUp,
  FileText,
  RefreshCw,
  Banknote,
  Search,
  User,
  Calendar
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import adminApi from '../../../../services/adminApi'
import '../styles/analyticsManagement.css'

// Mock points data for development/fallback
const MOCK_POINTS_DATA = {
  total_poin: 8450,
  total_transaksi: 385,
  summary: [
    { source: 'Setoran Sampah', total_poin: 4200, jumlah_transaksi: 280 },
    { source: 'Referral', total_poin: 2100, jumlah_transaksi: 70 },
    { source: 'Bonus', total_poin: 1050, jumlah_transaksi: 35 },
  ],
  chart_data: [
    { label: 'Jan', total_poin: 1800 },
    { label: 'Feb', total_poin: 2100 },
    { label: 'Mar', total_poin: 2350 },
    { label: 'Apr', total_poin: 2200 },
    { label: 'Mei', total_poin: 2450 },
    { label: 'Jun', total_poin: 2680 },
    { label: 'Jul', total_poin: 2890 },
    { label: 'Agu', total_poin: 3100 },
    { label: 'Sep', total_poin: 3250 },
    { label: 'Okt', total_poin: 3420 },
    { label: 'Nov', total_poin: 3580 },
    { label: 'Des', total_poin: 3750 },
  ],
}

// Konversi rate: 1 poin = Rp 100
const POINT_TO_RUPIAH_RATE = 100

// Mock user points history data
const MOCK_USER_POINTS_HISTORY = [
  { id: 1, nama: 'Ahmad Rizki', email: 'ahmad@example.com', poin: 1250, sumber: 'Setoran Sampah', tanggal: '2025-12-20' },
  { id: 2, nama: 'Siti Nurhaliza', email: 'siti@example.com', poin: 850, sumber: 'Referral', tanggal: '2025-12-19' },
  { id: 3, nama: 'Budi Santoso', email: 'budi@example.com', poin: 500, sumber: 'Setoran Sampah', tanggal: '2025-12-18' },
  { id: 4, nama: 'Dewi Lestari', email: 'dewi@example.com', poin: 1100, sumber: 'Bonus', tanggal: '2025-12-17' },
  { id: 5, nama: 'Rudi Hermawan', email: 'rudi@example.com', poin: 750, sumber: 'Setoran Sampah', tanggal: '2025-12-16' },
  { id: 6, nama: 'Ani Wijaya', email: 'ani@example.com', poin: 920, sumber: 'Referral', tanggal: '2025-12-15' },
  { id: 7, nama: 'Joko Prasetyo', email: 'joko@example.com', poin: 680, sumber: 'Setoran Sampah', tanggal: '2025-12-14' },
  { id: 8, nama: 'Maya Sari', email: 'maya@example.com', poin: 450, sumber: 'Bonus', tanggal: '2025-12-13' },
]

const PointsDistribution = () => {
  const { hasPermission } = useAuth()
  const [pointsData, setPointsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState('monthly')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [chartYear, setChartYear] = useState(new Date().getFullYear())
  const [userPointsHistory] = useState(MOCK_USER_POINTS_HISTORY)
  const [searchQuery, setSearchQuery] = useState('')

  const loadPointsData = useCallback(async () => {
    try {
      if (!hasPermission('view_analytics')) {
        setError('Anda tidak memiliki izin untuk melihat analitik poin')
        setLoading(false)
        return
      }
      
      setLoading(true)
      setError(null)
      
      const filters = { year }
      if (period !== 'yearly') {
        filters.month = month
      }
      
      const result = await adminApi.getPointsAnalytics(period, filters)
      
      let data = null
      
      if (result.success && result.data) {
        // API returns: {data: {totalDistributed, bySource, topUsers, monthlyDistribution}}
        const apiData = result.data
        
        // Map bySource object to summary array
        const bySourceArr = []
        if (apiData.bySource && typeof apiData.bySource === 'object') {
          Object.entries(apiData.bySource).forEach(([source, value]) => {
            bySourceArr.push({
              source: source,
              total_poin: typeof value === 'object' ? (value.total || value.points || 0) : value,
              jumlah_transaksi: typeof value === 'object' ? (value.count || value.transactions || 0) : 0
            })
          })
        }
        
        // Map API response to component expected format
        data = {
          total_poin: Math.abs(apiData.totalDistributed || 0),
          total_transaksi: apiData.totalTransactions || bySourceArr.reduce((sum, s) => sum + (s.jumlah_transaksi || 0), 0),
          summary: bySourceArr.length > 0 ? bySourceArr : MOCK_POINTS_DATA.summary,
          // Map monthlyDistribution to chart_data with short month names or use MOCK data
          chart_data: apiData.monthlyDistribution && apiData.monthlyDistribution.length > 0 
            ? apiData.monthlyDistribution.map((item, idx) => {
                // Convert month format (e.g., "2025-01" or full date) to short name
                let monthLabel = item.month || item.bulan || ''
                if (monthLabel.includes('-')) {
                  // Format "2025-01" -> get month number
                  const monthNum = parseInt(monthLabel.split('-')[1], 10)
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
                  monthLabel = monthNames[monthNum - 1] || `Bln ${monthNum}`
                }
                return {
                  label: monthLabel || `Bln ${idx + 1}`,
                  total_poin: Math.abs(item.total || item.points || item.poin || 0)
                }
              })
            : MOCK_POINTS_DATA.chart_data,
          top_users: apiData.topUsers || []
        }
        
        // If essentially no data, use mock
        if (data.total_poin === 0 && data.summary.length === 0) {
          data = MOCK_POINTS_DATA
        }
      } else {
        data = MOCK_POINTS_DATA
      }
      
      setPointsData(data)
    } catch {
      setPointsData(MOCK_POINTS_DATA)
    } finally {
      setLoading(false)
    }
  }, [hasPermission, period, year, month])

  useEffect(() => {
    loadPointsData()
  }, [loadPointsData])

  const getSourceColor = (index) => {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']
    return colors[index % colors.length]
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="analytics-empty">
          <AlertCircle size={48} color="#ef4444" />
          <p>{error}</p>
          <button onClick={() => { setError(null); loadPointsData() }} className="export-btn" style={{ marginTop: '16px' }}>
            <RefreshCw size={18} /> Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <h2>
          <PieChart size={28} color="#f59e0b" />
          Distribusi Poin
        </h2>
        <p>Analisis distribusi dan tren poin nasabah berdasarkan sumber</p>
      </div>

      {/* Filters */}
      <div className="analytics-filters">
        <div className="filter-group">
          <label>Periode</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="filter-select"
          >
            <option value="daily">Harian</option>
            <option value="monthly">Bulanan</option>
            <option value="yearly">Tahunan</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Tahun</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="filter-select"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {period !== 'yearly' && (
          <div className="filter-group">
            <label>Bulan</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="filter-select"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2025, i, 1).toLocaleDateString('id-ID', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="analytics-loading">
          <Loader size={40} className="spinner" />
          <p>Memuat data poin...</p>
        </div>
      )}

      {/* Content */}
      {!loading && pointsData && (
        <>
          {/* Statistics Cards */}
          <div className="analytics-stats-grid">
            <div className="analytics-stat-card points">
              <div className="stat-icon-wrapper points">
                <Coins size={28} />
              </div>
              <div className="stat-info">
                <div className="label">Total Poin</div>
                <div className="value">
                  {(pointsData.total_poin || pointsData.total_points || 0).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div className="analytics-stat-card weight">
              <div className="stat-icon-wrapper weight">
                <Banknote size={28} />
              </div>
              <div className="stat-info">
                <div className="label">Nilai Rupiah</div>
                <div className="value">
                  Rp {((pointsData.total_poin || pointsData.total_points || 0) * POINT_TO_RUPIAH_RATE).toLocaleString('id-ID')}
                </div>
                <div className="stat-sub" style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                  1 poin = Rp {POINT_TO_RUPIAH_RATE.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div className="analytics-stat-card count">
              <div className="stat-icon-wrapper count">
                <FileText size={28} />
              </div>
              <div className="stat-info">
                <div className="label">Total Transaksi</div>
                <div className="value">
                  {pointsData.total_transaksi || pointsData.total_transactions || 0}
                </div>
              </div>
            </div>

            {(pointsData.total_poin || pointsData.total_points) > 0 && 
             (pointsData.total_transaksi || pointsData.total_transactions) > 0 && (
              <div className="analytics-stat-card growth">
                <div className="stat-icon-wrapper growth">
                  <TrendingUp size={28} />
                </div>
                <div className="stat-info">
                  <div className="label">Rata-rata per Transaksi</div>
                  <div className="value">
                    {Math.round(
                      (pointsData.total_poin || pointsData.total_points) / 
                      (pointsData.total_transaksi || pointsData.total_transactions)
                    ).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Points by Source */}
          {pointsData.summary && pointsData.summary.length > 0 && (
            <div className="analytics-section">
              <div className="section-header">
                <h3 className="section-title">📊 Distribusi Poin per Sumber</h3>
              </div>
              
              <div className="chart-cards-grid">
                {pointsData.summary.map((item, index) => {
                  const totalPoin = pointsData.total_poin || pointsData.total_points || 1
                  const percentage = ((item.total_poin || item.points || 0) / totalPoin * 100).toFixed(1)
                  
                  return (
                    <div key={index} className="chart-card" style={{ borderLeft: `4px solid ${getSourceColor(index)}` }}>
                      <div className="chart-card-header">
                        <span className="chart-card-title">{item.source || item.sumber}</span>
                      </div>
                      <div className="chart-card-value" style={{ color: getSourceColor(index) }}>
                        {(item.total_poin || item.points || 0).toLocaleString('id-ID')}
                      </div>
                      <div className="chart-card-sub">
                        {item.jumlah_transaksi || item.count || 0} transaksi • {percentage}%
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ 
                              width: `${percentage}%`,
                              background: getSourceColor(index)
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Chart Data / Trend - Line Chart with Dots */}
          {pointsData.chart_data && pointsData.chart_data.length > 0 && (
            <div className="analytics-section">
              <div className="section-header">
                <h3 className="section-title">📈 Tren Poin Bulanan</h3>
                <div className="chart-year-filter">
                  <label>Tahun:</label>
                  <select 
                    value={chartYear} 
                    onChange={(e) => setChartYear(Number(e.target.value))}
                    className="filter-select-sm"
                  >
                    {[2023, 2024, 2025, 2026].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Line Chart with Dots */}
              <div className="analytics-chart-container">
                <div className="line-chart-wrapper">
                  {/* Y-Axis Labels */}
                  <div className="line-chart-y-axis">
                    {[100, 75, 50, 25, 0].map((val) => {
                      const maxPoin = Math.max(...pointsData.chart_data.map((c) => c.total_poin || c.points || 0))
                      return (
                        <span key={val} className="y-axis-label">
                          {((maxPoin * val) / 100).toLocaleString('id-ID')}
                        </span>
                      )
                    })}
                  </div>
                  
                  {/* Chart Area */}
                  <div className="line-chart-area">
                    {/* Grid Lines */}
                    <div className="chart-grid-lines">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="grid-line" />
                      ))}
                    </div>
                    
                    {/* SVG Line Chart */}
                    <svg className="line-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {/* Line Path */}
                      <polyline
                        className="chart-line"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        points={pointsData.chart_data.map((item, index) => {
                          const maxPoin = Math.max(...pointsData.chart_data.map((c) => c.total_poin || c.points || 0))
                          const poin = item.total_poin || item.points || 0
                          const x = (index / (pointsData.chart_data.length - 1)) * 100
                          const y = 100 - ((poin / maxPoin) * 100)
                          return `${x},${y}`
                        }).join(' ')}
                      />
                      {/* Area Fill */}
                      <polygon
                        className="chart-area-fill"
                        fill="url(#yellowGradient)"
                        points={`0,100 ${pointsData.chart_data.map((item, index) => {
                          const maxPoin = Math.max(...pointsData.chart_data.map((c) => c.total_poin || c.points || 0))
                          const poin = item.total_poin || item.points || 0
                          const x = (index / (pointsData.chart_data.length - 1)) * 100
                          const y = 100 - ((poin / maxPoin) * 100)
                          return `${x},${y}`
                        }).join(' ')} 100,100`}
                      />
                      <defs>
                        <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                    </svg>
                    
                    {/* Dot Points */}
                    <div className="chart-dots-container">
                      {pointsData.chart_data.map((item, index) => {
                        const maxPoin = Math.max(...pointsData.chart_data.map((c) => c.total_poin || c.points || 0))
                        const poin = item.total_poin || item.points || 0
                        const percentage = maxPoin > 0 ? (poin / maxPoin) * 100 : 0
                        const leftPos = (index / (pointsData.chart_data.length - 1)) * 100
                        
                        return (
                          <div 
                            key={index}
                            className="chart-dot-wrapper"
                            style={{ 
                              left: `${leftPos}%`,
                              bottom: `${percentage}%`
                            }}
                          >
                            <div className="chart-dot yellow" />
                            <div className="chart-dot-tooltip">
                              <strong>{item.label || item.periode}</strong>
                              <span>{poin.toLocaleString('id-ID')} poin</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* X-Axis Labels */}
                    <div className="line-chart-x-axis">
                      {pointsData.chart_data.map((item, index) => (
                        <span key={index} className="x-axis-label">
                          {item.label || item.periode}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Points History Table */}
          <div className="analytics-section">
            <div className="section-header">
              <h3 className="section-title">📋 Riwayat Perolehan Poin User</h3>
            </div>
            
            {/* Search */}
            <div className="analytics-filters" style={{ marginBottom: '16px' }}>
              <div className="search-container">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Cari nama user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            
            <div className="analytics-table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th><User size={14} /> Nama User</th>
                    <th>Email</th>
                    <th><Coins size={14} /> Poin</th>
                    <th>Sumber</th>
                    <th><Calendar size={14} /> Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {userPointsHistory
                    .filter(user => 
                      user.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((record) => (
                      <tr key={record.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '600',
                              fontSize: '14px'
                            }}>
                              {record.nama.charAt(0)}
                            </div>
                            <strong>{record.nama}</strong>
                          </div>
                        </td>
                        <td style={{ color: '#6b7280' }}>{record.email}</td>
                        <td>
                          <span className="points-badge">
                            +{record.poin.toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td>
                          <span className={`source-badge ${record.sumber.toLowerCase().replace(' ', '-')}`}>
                            {record.sumber}
                          </span>
                        </td>
                        <td style={{ color: '#6b7280' }}>
                          {new Date(record.tanggal).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            
            {userPointsHistory.filter(user => 
              user.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.email.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 && (
              <div className="analytics-empty" style={{ padding: '40px' }}>
                <Search size={32} color="#9ca3af" />
                <p>Tidak ada data yang sesuai dengan pencarian "{searchQuery}"</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && !pointsData && (
        <div className="analytics-empty">
          <AlertCircle size={48} />
          <p>Tidak ada data poin yang tersedia</p>
        </div>
      )}
    </div>
  )
}

export default PointsDistribution
