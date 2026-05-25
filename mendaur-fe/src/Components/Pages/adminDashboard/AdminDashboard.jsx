import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Loader } from 'lucide-react'
import AdminSidebar from './components/AdminSidebar'
import OverviewCards from './components/OverviewCards'
import UserManagementTable from './components/UserManagementTable'
// Phase 2 Components (Temporarily removed for clean deployment)
// import WasteAnalytics from './components/WasteAnalytics'
// import PointsDistribution from './components/PointsDistribution'
// import WasteByUserTable from './components/WasteByUserTable'
// import ReportsSection from './components/ReportsSection'
import ContentManagement from './components/ContentManagement'
import WasteDepositsManagement from './components/WasteDepositsManagement'
import ProductRedemptionManagement from './components/ProductRedemptionManagement'
import CashWithdrawalManagement from './components/CashWithdrawalManagement'
import NotificationManagement from './components/NotificationManagement'
import LeaderboardManagement from './components/LeaderboardManagement'
import './adminDashboard.css'
import './styles/adminSidebar.css'
// import './styles/analyticsComponents.css' // Phase 2 CSS
import './styles/contentManagement.css'
import './styles/wasteDepositsManagement.css'
import './styles/productRedemptionManagement.css'
import './styles/cashWithdrawalManagement.css'
import './styles/notificationManagement.css'
import './styles/leaderboardManagement.css'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('users')
  const [contentTab, setContentTab] = useState('produk')  // Track content management sub-tab

  useEffect(() => {
    // Check user role from localStorage
    const role = localStorage.getItem('role')
    const token = localStorage.getItem('token')

    if (!token || (role !== 'admin' && role !== 'superadmin')) {
      setError('Access denied. Admin or Superadmin role required.')
      setLoading(false)
      return
    }

    setUserRole(role)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <Loader className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-dashboard-error">
        <AlertCircle className="error-icon" />
        <h2>Access Denied</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/login')} className="btn-redirect">
          Go to Login
        </button>
      </div>
    )
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
    navigate('/login')
  }

  // Handle tab changes, including content management sub-tabs
  const handleTabChange = (tabId) => {
    if (tabId === 'content-produk') {
      setActiveTab('content')
      setContentTab('produk')
    } else if (tabId === 'content-artikel') {
      setActiveTab('content')
      setContentTab('artikel')
    } else if (tabId === 'content-badge') {
      setActiveTab('content')
      setContentTab('badge')
    } else if (tabId === 'content-jadwal') {
      setActiveTab('content')
      setContentTab('jadwal')
    } else if (tabId === 'content-harga') {
      setActiveTab('content')
      setContentTab('harga-sampah')
    } else {
      setActiveTab(tabId)
    }
  }

  const _tabs = [
    { id: 'overview', label: 'Dashboard' },
    { id: 'waste-deposits', label: 'Tabung Sampah' },
    { id: 'product-redemption', label: 'Penukaran Produk' },
    { id: 'cash-withdrawal', label: 'Penarikan Tunai' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'waste', label: 'Waste Analytics' },
    { id: 'points', label: 'Points Distribution' },
    { id: 'waste-by-user', label: 'Waste by User' },
    { id: 'users', label: 'User Management' },
    { id: 'notification', label: 'Notification Management' },
    { id: 'content', label: 'Content Management' },
    { id: 'reports', label: 'Reports' }
  ]

  return (
    <>
      {/* Admin Sidebar */}
      <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} onLogout={handleLogout} userRole={userRole} />

      {/* Main Content */}
      <main className="admin-main-content">
        {/* Header Section */}
        <div className="admin-dashboard-container">
          <div className="admin-dashboard-header">
            <div className="header-content">
              <h1>Admin Dashboard</h1>
              <p className="role-badge">
                Role: <span className="role-text">{userRole.toUpperCase()}</span>
              </p>
            </div>
            <p className="header-description">
              Comprehensive analytics and management for Mendaur system
            </p>
          </div>
        </div>

        {/* Overview Cards - Only shown in User Management */}
        {activeTab === 'users' && (
          <div className="admin-dashboard-container overview-section">
            <OverviewCards />
          </div>
        )}

        {/* Tab Content Section */}
        <div className="admin-dashboard-container">
          <div className="tab-content">
            {/* Overview Dashboard Tab */}
            {activeTab === 'overview' && (
              <div className="tab-pane">
                <div className="overview-welcome">
                  <h2>Selamat Datang di Admin Dashboard</h2>
                  <p>Pilih menu di samping untuk mengelola sistem Mendaur</p>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="tab-pane">
                <UserManagementTable />
              </div>
            )}

            {/* Waste Deposits Tab */}
            {activeTab === 'waste-deposits' && (
              <div className="tab-pane">
                <WasteDepositsManagement />
              </div>
            )}

            {/* Product Redemption Tab */}
            {activeTab === 'product-redemption' && (
              <div className="tab-pane">
                <ProductRedemptionManagement />
              </div>
            )}

            {/* Cash Withdrawal Tab */}
            {activeTab === 'cash-withdrawal' && (
              <div className="tab-pane">
                <CashWithdrawalManagement />
              </div>
            )}

            {/* Leaderboard Management Tab */}
            {activeTab === 'leaderboard' && (
              <div className="tab-pane">
                <LeaderboardManagement />
              </div>
            )}

            {/* Phase 2 Features - Temporarily Disabled for Clean Deployment */}
            {/* Waste Analytics Tab */}
            {activeTab === 'waste' && (
              <div className="tab-pane">
                {/* <WasteAnalytics /> */}
                <div className="coming-soon">
                  <h3>Analytics Dashboard</h3>
                  <p>Fitur ini akan tersedia di Phase 2</p>
                </div>
              </div>
            )}

            {/* Points Distribution Tab */}
            {activeTab === 'points' && (
              <div className="tab-pane">
                {/* <PointsDistribution /> */}
                <div className="coming-soon">
                  <h3>Points Analytics</h3>
                  <p>Fitur ini akan tersedia di Phase 2</p>
                </div>
              </div>
            )}

            {/* Waste by User Tab */}
            {activeTab === 'waste-by-user' && (
              <div className="tab-pane">
                {/* <WasteByUserTable /> */}
                <div className="coming-soon">
                  <h3>Waste by User Table</h3>
                  <p>Fitur ini akan tersedia di Phase 2</p>
                </div>
              </div>
            )}

            {/* Notification Management Tab */}
            {activeTab === 'notification' && (
              <div className="tab-pane">
                <NotificationManagement />
              </div>
            )}

            {/* Content Management Tab */}
            {activeTab === 'content' && (
              <div className="tab-pane">
                <ContentManagement initialTab={contentTab} />
              </div>
            )}

            {/* Reports Tab - Phase 2 Feature */}
            {activeTab === 'reports' && (
              <div className="tab-pane">
                {/* <ReportsSection /> */}
                <div className="coming-soon">
                  <h3>Reports & Export</h3>
                  <p>Fitur ini akan tersedia di Phase 2</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

export default AdminDashboard
