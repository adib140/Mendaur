import React, { useState, useEffect } from 'react';
import { Gift, TrendingUp, Clock, AlertCircle, Users } from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';
import './pointCard.css';

const AdminStatsCard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalDistributions, setTotalDistributions] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // Check admin role
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      setError('Access denied. Admin only.');
      setLoading(false);
      return;
    }
    setIsAdmin(true);
    fetchAdminStats();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchAdminStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch system-wide point statistics
      const statsResponse = await fetch(
        `${API_BASE_URL}/poin/admin/stats`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!statsResponse.ok) {
        throw new Error(`Failed to fetch stats: ${statsResponse.status}`);
      }

      const statsData = await statsResponse.json();

      setTotalPoints(statsData.data?.total_points_in_system || 0);
      setActiveUsers(statsData.data?.active_users || 0);
      setTotalDistributions(statsData.data?.total_distributions || 0);
      setRecentActivity(statsData.data?.recent_activity || []);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAdminStats();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'deposit':
      case 'tabung_sampah':
      case 'setor_sampah':
        return '📦';
      case 'redeem':
      case 'tukar_poin':
        return '🎁';
      case 'bonus':
        return '⭐';
      case 'adjustment':
        return '⚙️';
      default:
        return '💰';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'deposit':
      case 'tabung_sampah':
      case 'setor_sampah':
        return 'income';
      case 'redeem':
      case 'tukar_poin':
        return 'expense';
      case 'bonus':
        return 'bonus';
      default:
        return 'neutral';
    }
  };

  if (!isAdmin) {
    return (
      <div className="point-card error-state">
        <div className="error-message">
          <AlertCircle size={32} />
          <p>Access Denied - Admin Only</p>
        </div>
      </div>
    );
  }

  return (
    <div className="point-card-container">
      {/* Admin Stats Card */}
      <div className="point-card main-card">
        <div className="card-header">
          <div className="header-left">
            <Gift className="card-icon" size={28} />
            <h2>System Point Statistics</h2>
          </div>
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh statistics"
          >
            ↻
          </button>
        </div>

        {loading && !totalPoints ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading system statistics...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={32} />
            <p className="error-text">{error}</p>
            <button className="retry-btn" onClick={handleRefresh}>
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Statistics Grid */}
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <p className="stat-label">Total Points in System</p>
                  <p className="stat-value">{totalPoints.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <p className="stat-label">Active Users</p>
                  <p className="stat-value">{activeUsers}</p>
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-icon">📤</div>
                <div className="stat-content">
                  <p className="stat-label">Total Distributions</p>
                  <p className="stat-value">{totalDistributions}</p>
                </div>
              </div>
            </div>

            {/* Last Update */}
            {lastUpdate && (
              <div className="last-update">
                <Clock size={12} />
                Updated: {formatDate(lastUpdate)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Recent System Activity */}
      {!loading && !error && recentActivity.length > 0 && (
        <div className="point-card activity-card">
          <h3 className="activity-title">Recent System Activity</h3>
          <div className="activity-list">
            {recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  <span className="icon-emoji">
                    {getActivityIcon(activity.type)}
                  </span>
                </div>
                <div className="activity-details">
                  <p className="activity-description">
                    {activity.user_name && <strong>{activity.user_name}</strong>}
                    {activity.user_name && ': '}
                    {activity.description || 'Point Transaction'}
                  </p>
                  <span className="activity-date">
                    {formatDate(activity.created_at)}
                  </span>
                </div>
                <div
                  className={`activity-amount ${getActivityColor(activity.type)}`}
                >
                  <span className={activity.amount >= 0 ? 'positive' : 'negative'}>
                    {activity.amount >= 0 ? '+' : '-'}
                    {Math.abs(activity.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && recentActivity.length === 0 && (
        <div className="point-card empty-state">
          <Clock size={32} />
          <p>No recent system activity</p>
          <p className="empty-message">
            Monitor system-wide point distributions here
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminStatsCard;
