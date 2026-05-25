import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import ProductManagement from './ProductManagement'
import ArtikelManagement from './ArtikelManagement'
import WasteListManagement from './WasteListManagement'
import BadgeManagement from './BadgeManagement'
import ScheduleManagement from './ScheduleManagement'
import '../styles/contentManagement.css'

export default function ContentManagement({ initialTab = 'produk' }) {
  const { hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState(initialTab)

  // Update activeTab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  if (!hasPermission('manage_content')) {
    return (
      <div className="access-denied-container" style={{ padding: '40px', textAlign: 'center' }}>
        <h3>❌ Access Denied</h3>
        <p>Anda tidak memiliki izin untuk mengakses manajemen konten</p>
      </div>
    )
  }

  return (
    <div className="content-management-container">
      {/* Header */}
      <div className="management-header">
        <h2>📋 Content Management</h2>
        <p>Kelola semua konten: Produk, Artikel, Harga Sampah, Badge, dan Jadwal</p>
      </div>

      {/* Tab Navigation */}
      <div className="content-tabs">
        <button
          className={`tab-btn ${activeTab === 'produk' ? 'active' : ''}`}
          onClick={() => setActiveTab('produk')}
        >
          📦 Manajemen Produk
        </button>
        <button
          className={`tab-btn ${activeTab === 'artikel' ? 'active' : ''}`}
          onClick={() => setActiveTab('artikel')}
        >
          📄 Manajemen Artikel
        </button>
        <button
          className={`tab-btn ${activeTab === 'harga-sampah' ? 'active' : ''}`}
          onClick={() => setActiveTab('harga-sampah')}
        >
          💰 Daftar Harga Sampah
        </button>
        <button
          className={`tab-btn ${activeTab === 'badge' ? 'active' : ''}`}
          onClick={() => setActiveTab('badge')}
        >
          🏆 Manajemen Badge
        </button>
        <button
          className={`tab-btn ${activeTab === 'jadwal' ? 'active' : ''}`}
          onClick={() => setActiveTab('jadwal')}
        >
          📅 Jadwal Penyetoran
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content-wrapper">
        {activeTab === 'produk' && <ProductManagement />}
        {activeTab === 'artikel' && <ArtikelManagement />}
        {activeTab === 'harga-sampah' && <WasteListManagement />}
        {activeTab === 'badge' && <BadgeManagement />}
        {activeTab === 'jadwal' && <ScheduleManagement />}
      </div>
    </div>
  )
}
