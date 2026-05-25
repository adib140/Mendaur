import React, { useState, useEffect } from 'react';
import { Calendar, Filter, ChevronLeft, ChevronRight, AlertCircle, Search } from 'lucide-react';
import { API_BASE_URL } from '../../../config/api';
import './pointHistory.css';

const AllUsersHistory = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('all');

  const itemsPerPage = 10;

  useEffect(() => {
    // Check admin role
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      setError('Access denied. Admin only.');
      setLoading(false);
      return;
    }
    setIsAdmin(true);
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterType, startDate, endDate, selectedUserId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters for admin view (all users)
      const params = new URLSearchParams({
        page: currentPage,
        per_page: itemsPerPage,
      });

      // Add user filter if selected
      if (selectedUserId !== 'all') {
        params.append('user_id', selectedUserId);
      }

      if (filterType !== 'all') {
        params.append('type', filterType);
      }

      if (startDate) {
        params.append('start_date', startDate);
      }

      if (endDate) {
        params.append('end_date', endDate);
      }

      // Use admin endpoint for all users' history
      const response = await fetch(
        `${API_BASE_URL}/poin/admin/history?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.status}`);
      }

      const data = await response.json();

      setHistory(data.data || []);
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const handleDateFilter = () => {
    setCurrentPage(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilterType('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type) => {
    const labels = {
      deposit: 'Deposit',
      tabung_sampah: 'Tabung Sampah',
      setor_sampah: 'Tabung Sampah',
      redeem: 'Redemption',
      tukar_poin: 'Point Exchange',
      bonus: 'Bonus',
      adjustment: 'Adjustment',
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type) => {
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

  const getTypeColor = (type) => {
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
      <div className="point-history error-state">
        <AlertCircle size={32} />
        <p>Access Denied - Admin Only</p>
      </div>
    );
  }

  return (
    <div className="point-history-container">
      {/* Header */}
      <div className="history-header">
        <h2>All Users - Point History</h2>
        <button
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} />
          Filters
        </button>
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

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Type</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => handleFilterChange('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${filterType === 'tabung_sampah' ? 'active' : ''}`}
                onClick={() => handleFilterChange('tabung_sampah')}
              >
                Tabung Sampah
              </button>
              <button
                className={`filter-btn ${filterType === 'tukar_poin' ? 'active' : ''}`}
                onClick={() => handleFilterChange('tukar_poin')}
              >
                Redemptions
              </button>
              <button
                className={`filter-btn ${filterType === 'bonus' ? 'active' : ''}`}
                onClick={() => handleFilterChange('bonus')}
              >
                Bonuses
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label>Date Range</label>
            <div className="date-inputs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start Date"
              />
              <span>—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End Date"
              />
            </div>
          </div>

          <div className="filter-actions">
            <button className="apply-btn" onClick={handleDateFilter}>
              Apply Filters
            </button>
            <button className="clear-btn" onClick={clearFilters}>
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading && history.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading history...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <AlertCircle size={32} />
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchHistory}>
            Retry
          </button>
        </div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <Calendar size={32} />
          <p>No transactions found</p>
          <p className="empty-message">Try adjusting your filters or start depositing waste</p>
        </div>
      ) : (
        <>
          {/* History Table - Desktop */}
          <div className="history-table desktop-view">
            <div className="table-header">
              <div className="col-user">User</div>
              <div className="col-date">Date</div>
              <div className="col-type">Type</div>
              <div className="col-description">Description</div>
              <div className="col-amount">Amount</div>
            </div>

            <div className="table-body">
              {history.map((item, index) => (
                <div key={index} className="table-row">
                  <div className="col-user">
                    <strong>{item.user_name || 'Unknown'}</strong>
                  </div>
                  <div className="col-date">
                    <span className="date-text">{formatDate(item.created_at)}</span>
                    <span className="time-text">{formatTime(item.created_at)}</span>
                  </div>
                  <div className="col-type">
                    <span className={`type-badge ${getTypeColor(item.type)}`}>
                      <span className="type-icon">{getTypeIcon(item.type)}</span>
                      {getTypeLabel(item.type)}
                    </span>
                  </div>
                  <div className="col-description">
                    {item.description || 'Point Transaction'}
                  </div>
                  <div className="col-amount">
                    <span
                      className={`amount-value ${
                        item.amount >= 0 ? 'positive' : 'negative'
                      }`}
                    >
                      {item.amount >= 0 ? '+' : '-'}
                      {Math.abs(item.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* History List - Mobile */}
          <div className="history-list mobile-view">
            {history.map((item, index) => (
              <div key={index} className="list-item">
                <div className="item-header">
                  <div className="item-type">
                    <span className="type-icon">{getTypeIcon(item.type)}</span>
                    <div>
                      <p className="type-label">{item.user_name || 'Unknown'}</p>
                      <p className="description-text">
                        {getTypeLabel(item.type)} - {item.description || 'Point Transaction'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`amount-value ${
                      item.amount >= 0 ? 'positive' : 'negative'
                    }`}
                  >
                    {item.amount >= 0 ? '+' : '-'}
                    {Math.abs(item.amount)}
                  </span>
                </div>
                <div className="item-date">
                  {formatDate(item.created_at)} {formatTime(item.created_at)}
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
                <ChevronLeft size={18} />
                Previous
              </button>

              <div className="page-info">
                Page {currentPage} of {totalPages}
              </div>

              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AllUsersHistory;
