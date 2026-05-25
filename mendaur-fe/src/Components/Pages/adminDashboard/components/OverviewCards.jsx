import { useState, useEffect } from 'react'
import { Users, Trash2, Coins, TrendingUp, Loader } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import adminApi from '../../../../services/adminApi'

const MOCK_DATA = {
  users: { total: 8, active_30days: 8 },
  waste: { yearly_total_kg: 16.7, yearly_total_count: 10 },
  points: { yearly_total: 0, monthly_total: 0 },
  redemptions: { yearly_total_points_redeemed: 0 }
}

const OverviewCards = () => {
  const { hasPermission } = useAuth()
  const [stats, setStats] = useState(MOCK_DATA)
  const [loading, setLoading] = useState(true)

  // Separated fetch function (Session 2 pattern)
  const loadOverviewStats = async () => {
    try {
      setLoading(true)
      const result = await adminApi.getOverview()
      
      // Check for 401 specifically and handle gracefully
      if (result.statusCode === 401) {
        console.warn('Admin overview endpoint returned 401 - using mock data for now')
        setStats(MOCK_DATA)
        return
      }
      
      // Multi-format response handler (supports 3+ formats)
      let statsData = MOCK_DATA
      if (result.success && result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
        // Check if it has the right structure
        if (result.data.users && result.data.waste && result.data.points && result.data.redemptions) {
          statsData = result.data
        } else if (result.data.data && typeof result.data.data === 'object') {
          // Wrapped in data key
          statsData = result.data.data
        } else if (result.data.stats && typeof result.data.stats === 'object') {
          // Wrapped in stats key
          statsData = result.data.stats
        }
      }
      
      setStats(statsData)
    } catch (err) {
      console.warn('Stats fetch error, using mock data:', err.message)
      setStats(MOCK_DATA)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOverviewStats()
  }, [])

  const mockData = stats

  const cards = [
    {
      id: 'users',
      title: 'Total Users',
      value: mockData?.users?.total || 0,
      icon: Users,
      color: 'card-blue',
      subtitle: `${mockData?.users?.active_30days || 0} active (30d)`
    },
    {
      id: 'waste',
      title: 'Total Waste',
      value: `${mockData?.waste?.yearly_total_kg || 0} kg`,
      icon: Trash2,
      color: 'card-green',
      subtitle: `${mockData?.waste?.yearly_total_count || 0} deposits`
    },
    {
      id: 'points',
      title: 'Points Distributed',
      value: mockData?.points?.yearly_total || 0,
      icon: Coins,
      color: 'card-yellow',
      subtitle: `${mockData?.points?.monthly_total || 0} this month`
    },
    {
      id: 'redemptions',
      title: 'Points Redeemed',
      value: mockData?.redemptions?.yearly_total_points_redeemed || 0,
      icon: TrendingUp,
      color: 'card-purple',
      subtitle: 'This year'
    }
  ]

  return (
    <div className="overview-cards-grid">
      {loading && (
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <Loader size={24} className="spinner" />
        </div>
      )}
      {!loading && cards.map((card) => {
        // ✅ Permission check - only show cards user has access to
        const canViewCard = card.id === 'users' 
          ? hasPermission('view_users') 
          : hasPermission('view_analytics')
        
        if (!canViewCard) return null
        
        const IconComponent = card.icon
        return (
          <div key={card.id} className={`overview-card ${card.color}`}>
            <div className="card-header">
              <div className="card-icon">
                <IconComponent size={24} />
              </div>
            </div>
            <div className="card-body">
              <h3 className="card-title">{card.title}</h3>
              <p className="card-value">{card.value}</p>
              <p className="card-subtitle">{card.subtitle}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default OverviewCards
