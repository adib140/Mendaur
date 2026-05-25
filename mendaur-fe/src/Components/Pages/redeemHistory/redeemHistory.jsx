import React, { useState, useEffect } from 'react';
import { Gift, Calendar, AlertCircle, Search } from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';
import './redeemHistory.css';

const AllRedemptions = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('all');

  const itemsPerPage = 8;

  useEffect(() => {
    // Check admin role
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      setError('Access denied. Admin only.');
      setLoading(false);
      return;
    }
    setIsAdmin(true);
    fetchRedemptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchRedemptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterStatus, selectedUserId]);

  const fetchRedemptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage,
        per_page: itemsPerPage,
      });

      // Add user filter if selected
      if (selectedUserId !== 'all') {
        params.append('user_id', selectedUserId);
      }

      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      // Use admin endpoint for all users' redemptions
      const response = await fetch(
        `${API_BASE_URL}/poin/admin/redemptions?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch redemptions: ${response.status}`);
      }

      const data = await response.json();

      setRedemptions(data.data || []);
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
    } catch (err) {
      console.error('Error fetching redemptions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: { label: 'Completed', class: 'status-completed' },
      pending: { label: 'Pending', class: 'status-pending' },
      cancelled: { label: 'Cancelled', class: 'status-cancelled' },
    };
    return badges[status] || { label: status, class: 'status-default' };
  };

  if (!isAdmin) {
    return (
      <div className="redeem-history error-state">
        <AlertCircle size={32} />
        <p>Access Denied - Admin Only</p>
      </div>
    );
  }

  return (
    <div className="redeem-history-container">
      {/* Header */}
      <div className="history-header">
        <h2>All Users - Redemption History</h2>
        <div className="status-filters">
          <button
            className={`status-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => {
              setFilterStatus('all');
              setCurrentPage(1);
            }}
          >
            All
          </button>
          <button
            className={`status-btn ${filterStatus === 'completed' ? 'active' : ''}`}
            onClick={() => {
              setFilterStatus('completed');
              setCurrentPage(1);
            }}
          >
            Completed
          </button>
          <button
            className={`status-btn ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => {
              setFilterStatus('pending');
              setCurrentPage(1);
            }}
          >
            Pending
          </button>
        </div>
      </div>

      {/* User Selection */}
      <div className="user-selection">
        <label>Filter by User:</label>
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            placeholder="Enter user name or ID"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
        </div>
        <button
          className={`user-filter-btn ${selectedUserId === 'all' ? 'active' : ''}`}
          onClick={() => {
            setSelectedUserId('all');
            setUserSearch('');
            setCurrentPage(1);
          }}
        >
          All Users
        </button>
        {userSearch && (
          <button
            className="user-filter-btn active"
            onClick={() => {
              setSelectedUserId(userSearch);
              setCurrentPage(1);
            }}
          >
            Search: {userSearch}
          </button>
        )}
      </div>

      {/* Content */}
      {loading && redemptions.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading redemptions...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <AlertCircle size={32} />
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchRedemptions}>
            Retry
          </button>
        </div>
      ) : redemptions.length === 0 ? (
        <div className="empty-state">
          <Gift size={40} />
          <p>No redemptions yet</p>
          <p className="empty-message">
            Start earning points and redeem your favorite products!
          </p>
        </div>
      ) : (
        <>
          {/* Redemptions Grid */}
          <div className="redemptions-grid">
            {redemptions.map((redemption, index) => (
              <div key={index} className="redemption-card">
                {/* Card Header */}
                <div className="card-header">
                  <div className="user-info">
                    <strong>{redemption.user_name || 'Unknown'}</strong>
                  </div>
                  <div className="status-badge">
                    <span className={getStatusBadge(redemption.status).class}>
                      {getStatusBadge(redemption.status).label}
                    </span>
                  </div>
                  <div className="reward-date">
                    {formatDate(redemption.redeemed_at || redemption.created_at)}
                  </div>
                </div>

                {/* Product Info */}
                <div className="product-info">
                  {redemption.product_image && (
                    <img
                      src={redemption.product_image}
                      alt={redemption.product_name}
                      className="product-image"
                    />
                  )}
                  <div className="product-details">
                    <h4>{redemption.product_name}</h4>
                    <p className="product-category">
                      {redemption.product_category || 'Product'}
                    </p>
                  </div>
                </div>

                {/* Points Cost */}
                <div className="points-section">
                  <span className="points-label">Points Spent:</span>
                  <span className="points-value">{redemption.points_used}</span>
                </div>

                {/* Timeline */}
                <div className="timeline">
                  <div className="timeline-item">
                    <span className="timeline-label">Redeemed</span>
                    <span className="timeline-date">
                      {formatDate(redemption.created_at)}
                    </span>
                  </div>
                  {redemption.redeemed_at && (
                    <div className="timeline-item">
                      <span className="timeline-label">Received</span>
                      <span className="timeline-date">
                        {formatDate(redemption.redeemed_at)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="card-footer">
                  <span className="transaction-id">
                    ID: {redemption.penukaran_produk_id}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>

              <div className="page-info">
                Page {currentPage} of {totalPages}
              </div>

              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AllRedemptions;
