import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Gift, History, AlertCircle } from 'lucide-react';
import AdminStatsCard from '../pointCard/pointCard';
import AllUsersHistory from '../pointHistory/pointHistory';
import PointBreakdown from '../pointBreakdown/pointBreakdown';
import AllRedemptions from '../redeemHistory/redeemHistory';
import './pointDashboard.css';

const AdminPointDashboard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Check admin role
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      setError('Access denied. Admin only.');
      return;
    }
    setIsAdmin(true);
  }, []);

  if (!isAdmin) {
    return (
      <div className="point-dashboard-container error-state">
        <div className="error-message">
          <AlertCircle size={48} />
          <h2>Access Denied</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'overview',
      label: 'System Stats',
      icon: <TrendingUp size={20} />,
      content: <AdminStatsCard />,
    },
    {
      id: 'breakdown',
      label: 'Breakdown',
      icon: <BarChart3 size={20} />,
      content: <PointBreakdown />,
    },
    {
      id: 'history',
      label: 'All Transactions',
      icon: <History size={20} />,
      content: <AllUsersHistory />,
    },
    {
      id: 'redemptions',
      label: 'All Redemptions',
      icon: <Gift size={20} />,
      content: <AllRedemptions />,
    },
  ];

  return (
    <div className="point-dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Admin Points Dashboard</h1>
          <p className="header-subtitle">
            Monitor system-wide point activities and manage user redemptions
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <div className="tabs-scroll">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content-container">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab-content ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.content}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <div className="footer-content">
          <p className="footer-text">
            💡 Tip: Monitor point distributions and ensure accurate user transactions!
          </p>
          <p className="footer-info">
            Last updated: {new Date().toLocaleTimeString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPointDashboard;
