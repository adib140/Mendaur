import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart3,
  TrendingUp,
  Loader,
  AlertCircle,
  Scale,
  Package,
  Percent,
  ArrowUpRight,
} from 'lucide-react'
import adminApi from '../../../../services/adminApi'
import '../styles/analyticsManagement.css'

// Mock waste analytics data for development/fallback
const MOCK_WASTE_ANALYTICS = {
  period: 'monthly',
  total_weight: 245.8,
  total_transactions: 128,
  average_per_transaction: 1.92,
  trending: 'up',
  growth_percentage: 12.5,
  waste_by_type: [
    { type: 'Plastik', weight: 89.2, count: 45, percentage: 36.3 },
    { type: 'Kertas', weight: 78.5, count: 32, percentage: 31.9 },
    { type: 'Logam', weight: 45.3, count: 28, percentage: 18.4 },
    { type: 'Kaca', weight: 32.8, count: 23, percentage: 13.3 },
  ],
  monthly_trend: [
    { month: 'Jan', weight: 180.5 },
    { month: 'Feb', weight: 195.3 },
    { month: 'Mar', weight: 210.7 },
    { month: 'Apr', weight: 225.2 },
    { month: 'Mei', weight: 245.8 },
    { month: 'Jun', weight: 238.4 },
    { month: 'Jul', weight: 252.1 },
    { month: 'Agu', weight: 268.9 },
    { month: 'Sep', weight: 275.3 },
    { month: 'Okt', weight: 290.6 },
    { month: 'Nov', weight: 285.2 },
    { month: 'Des', weight: 302.4 },
  ],
  top_contributors: [
    { name: 'Ahmad Rizki', weight: 45.5, percentage: 18.5 },
    { name: 'Siti Nurhaliza', weight: 62.8, percentage: 25.6 },
    { name: 'Budi Santoso', weight: 38.2, percentage: 15.6 },
  ],
}

const WasteAnalytics = () => {
  const [wasteData, setWasteData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('monthly')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  const loadWasteAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const filters = { year }
      if (period === 'monthly' || period === 'daily') {
        filters.month = month
      }

      const result = await adminApi.getWasteAnalytics(period, filters)

      let data = null
      
      if (result.success && result.data) {
        // API returns: {data: {totalWaste, byCategory, monthlyTrend}}
        const apiData = result.data
        
        // Map API response to component expected format
        data = {
          period: period,
          total_weight: apiData.totalWaste || 0,
          total_transactions: apiData.totalTransactions || 0,
          average_per_transaction: apiData.averagePerTransaction || 0,
          growth_percentage: apiData.growthPercentage || 0,
          // Map byCategory to waste_by_type
          waste_by_type: (apiData.byCategory || []).map((cat, idx) => ({
            type: cat.nama_kategori || cat.name || cat.category || `Kategori ${idx + 1}`,
            weight: cat.total_berat || cat.weight || cat.total || 0,
            count: cat.jumlah || cat.count || 0,
            percentage: cat.percentage || 0
          })),
          // Map monthlyTrend
          monthly_trend: (apiData.monthlyTrend || []).map((item, idx) => ({
            month: item.month || item.bulan || `Bulan ${idx + 1}`,
            weight: item.total || item.weight || item.berat || 0
          })),
          top_contributors: apiData.topContributors || []
        }
        
        // If no real data, use mock for demo
        if (data.total_weight === 0 && data.waste_by_type.length === 0) {
          data = MOCK_WASTE_ANALYTICS
        }
      } else {
        data = MOCK_WASTE_ANALYTICS
      }

      setWasteData(data)
    } catch {
      setWasteData(MOCK_WASTE_ANALYTICS)
    } finally {
      setLoading(false)
    }
  }, [period, year, month])

  useEffect(() => {
    loadWasteAnalytics()
  }, [loadWasteAnalytics])

  const getProgressColor = (index) => {
    const colors = ['green', 'blue', 'yellow', 'purple']
    return colors[index % colors.length]
  }

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <h2>
          <BarChart3 size={28} color="#10b981" />
          Analitik Penyetoran Sampah
        </h2>
        <p>Analisis tren dan distribusi penyetoran sampah per tipe dan periode waktu</p>
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

      {/* Loading State */}
      {loading && (
        <div className="analytics-loading">
          <Loader size={40} className="spinner" />
          <p>Memuat data analitik...</p>
        </div>
      )}

      {/* Content */}
      {!loading && wasteData && (
        <>
          {/* Statistics Cards */}
          <div className="analytics-stats-grid">
            <div className="analytics-stat-card weight">
              <div className="stat-icon-wrapper weight">
                <Scale size={28} />
              </div>
              <div className="stat-info">
                <div className="label">Total Sampah</div>
                <div className="value">{(wasteData.total_weight || 0).toFixed(1)} kg</div>
              </div>
            </div>

            <div className="analytics-stat-card count">
              <div className="stat-icon-wrapper count">
                <Package size={28} />
              </div>
              <div className="stat-info">
                <div className="label">Total Penyetoran</div>
                <div className="value">{wasteData.total_transactions || 0}</div>
              </div>
            </div>

            <div className="analytics-stat-card points">
              <div className="stat-icon-wrapper points">
                <TrendingUp size={28} />
              </div>
              <div className="stat-info">
                <div className="label">Rata-rata per Setor</div>
                <div className="value">{(wasteData.average_per_transaction || 0).toFixed(2)} kg</div>
              </div>
            </div>

            {wasteData.growth_percentage !== undefined && (
              <div className="analytics-stat-card growth">
                <div className="stat-icon-wrapper growth">
                  <ArrowUpRight size={28} />
                </div>
                <div className="stat-info">
                  <div className="label">Pertumbuhan</div>
                  <div className="value">+{wasteData.growth_percentage}%</div>
                </div>
              </div>
            )}
          </div>

          {/* Waste by Type */}
          {wasteData.waste_by_type && wasteData.waste_by_type.length > 0 && (
            <div className="analytics-section">
              <div className="section-header">
                <h3 className="section-title">📦 Distribusi Sampah per Jenis</h3>
              </div>
              
              <div className="analytics-table-wrapper">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Jenis Sampah</th>
                      <th>Berat Total</th>
                      <th>Jumlah Setor</th>
                      <th>Persentase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wasteData.waste_by_type.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{item.type || item.nama_jenis || item.jenis}</strong>
                        </td>
                        <td>
                          <span className="weight-badge">
                            {(item.weight || item.berat || 0).toFixed(2)} kg
                          </span>
                        </td>
                        <td>
                          <span className="count-badge">
                            {item.count || item.jumlah || 0}x
                          </span>
                        </td>
                        <td>
                          <div className="progress-container">
                            <div className="progress-bar">
                              <div 
                                className={`progress-fill ${getProgressColor(index)}`}
                                style={{ width: `${item.percentage || 0}%` }}
                              />
                            </div>
                            <span className="progress-label">
                              {(item.percentage || 0).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Visual Bar Chart */}
              {/* <div className="analytics-chart-container" style={{ marginTop: '20px' }}>
                <div className="chart-header">
                  <h4 className="chart-title">📊 Visualisasi Distribusi</h4>
                </div>
                <div className="bar-chart">
                  {wasteData.waste_by_type.map((item, index) => (
                    <div key={index} className="bar-chart-item">
                      <span className="bar-label">{item.type || item.nama_jenis}</span>
                      <div className="bar-visual">
                        <div className="bar-track">
                          <div 
                            className={`bar-fill ${getProgressColor(index)}`}
                            style={{ width: `${item.percentage || 0}%` }}
                          >
                            <span className="bar-value">{(item.weight || 0).toFixed(1)} kg</span>
                          </div>
                        </div>
                        <span className="bar-percentage">{(item.percentage || 0).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div> */}
            </div>
          )}

          {/* Monthly Trend */}
          {wasteData.monthly_trend && wasteData.monthly_trend.length > 0 && (
            <div className="analytics-section">
              <div className="section-header">
                <h3 className="section-title">📊 Tren Bulanan Penyetoran Sampah</h3>
                <div className="chart-year-filter">
                  <label>Tahun:</label>
                  <select 
                    value={year} 
                    onChange={(e) => setYear(Number(e.target.value))}
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
                      const maxWeight = Math.max(...wasteData.monthly_trend.map((m) => m.weight))
                      return (
                        <span key={val} className="y-axis-label">
                          {((maxWeight * val) / 100).toFixed(0)} kg
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
                        stroke="#10b981"
                        strokeWidth="2"
                        points={wasteData.monthly_trend.map((item, index) => {
                          const maxWeight = Math.max(...wasteData.monthly_trend.map((m) => m.weight))
                          const x = (index / (wasteData.monthly_trend.length - 1)) * 100
                          const y = 100 - ((item.weight / maxWeight) * 100)
                          return `${x},${y}`
                        }).join(' ')}
                      />
                      {/* Area Fill */}
                      <polygon
                        className="chart-area-fill"
                        fill="url(#greenGradient)"
                        points={`0,100 ${wasteData.monthly_trend.map((item, index) => {
                          const maxWeight = Math.max(...wasteData.monthly_trend.map((m) => m.weight))
                          const x = (index / (wasteData.monthly_trend.length - 1)) * 100
                          const y = 100 - ((item.weight / maxWeight) * 100)
                          return `${x},${y}`
                        }).join(' ')} 100,100`}
                      />
                      <defs>
                        <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                    </svg>
                    
                    {/* Dot Points */}
                    <div className="chart-dots-container">
                      {wasteData.monthly_trend.map((item, index) => {
                        const maxWeight = Math.max(...wasteData.monthly_trend.map((m) => m.weight))
                        const percentage = maxWeight > 0 ? (item.weight / maxWeight) * 100 : 0
                        const leftPos = (index / (wasteData.monthly_trend.length - 1)) * 100
                        
                        return (
                          <div 
                            key={index}
                            className="chart-dot-wrapper"
                            style={{ 
                              left: `${leftPos}%`,
                              bottom: `${percentage}%`
                            }}
                          >
                            <div className="chart-dot green" />
                            <div className="chart-dot-tooltip">
                              <strong>{item.month || item.bulan}</strong>
                              <span>{(item.weight || 0).toFixed(1)} kg</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* X-Axis Labels */}
                    <div className="line-chart-x-axis">
                      {wasteData.monthly_trend.map((item, index) => (
                        <span key={index} className="x-axis-label">
                          {item.month || item.bulan}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Contributors */}
          {wasteData.top_contributors && wasteData.top_contributors.length > 0 && (
            <div className="analytics-section">
              <div className="section-header">
                <h3 className="section-title">👑 Kontributor Terbesar</h3>
              </div>
              
              <div className="chart-cards-grid">
                {wasteData.top_contributors.map((contributor, index) => (
                  <div key={index} className="top-contributor-card" style={{ marginBottom: 0 }}>
                    <div className="top-contributor-icon">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                    <div className="top-contributor-info">
                      <div className="top-contributor-label">#{index + 1} Kontributor</div>
                      <div className="top-contributor-name">{contributor.name || contributor.nama}</div>
                      <div className="top-contributor-stats">
                        <span><Scale size={14} /> {contributor.weight || contributor.berat} kg</span>
                        <span><Percent size={14} /> {contributor.percentage}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !wasteData && (
        <div className="analytics-empty">
          <AlertCircle size={48} />
          <p>Tidak ada data analitik yang tersedia</p>
        </div>
      )}
    </div>
  )
}

export default WasteAnalytics
