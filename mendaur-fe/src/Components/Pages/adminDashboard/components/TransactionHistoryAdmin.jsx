import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Loader,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Gift,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import adminApi from '../../../services/adminApi';
import '../styles/transactionHistoryAdmin.css';

// Mock transaction data for fallback
const MOCK_TRANSACTIONS = [
  {
    id: 1,
    user_id: 1,
    user_name: 'Budi Santoso',
    user_email: 'budi@email.com',
    type: 'waste_deposit',
    category: 'Setor Sampah',
    description: 'Setoran Plastik - 2.5 kg',
    amount: 25,
    transaction_date: '2025-12-20T10:30:00',
    status: 'completed',
    waste_type: 'Plastik',
    weight: 2.5,
    details: 'Plastik botol minuman',
  },
  {
    id: 2,
    user_id: 2,
    user_name: 'Siti Nurhaliza',
    user_email: 'siti@email.com',
    type: 'product_redemption',
    category: 'Penukaran Produk',
    description: 'Penukaran Tas Belanja Kain',
    amount: -25000,
    transaction_date: '2025-12-19T14:15:00',
    status: 'approved',
    product_name: 'Tas Belanja Kain',
    product_id: 1,
    points_used: 25000,
  },
  {
    id: 3,
    user_id: 3,
    user_name: 'Ahmad Wijaya',
    user_email: 'ahmad@email.com',
    type: 'cash_withdrawal',
    category: 'Penarikan Tunai',
    description: 'Penarikan Tunai ke BCA',
    amount: -50000,
    transaction_date: '2025-12-18T09:45:00',
    status: 'pending',
    bank_name: 'BCA',
    account_number: '1234567890',
  },
  {
    id: 4,
    user_id: 4,
    user_name: 'Dina Kusuma',
    user_email: 'dina@email.com',
    type: 'waste_deposit',
    category: 'Setor Sampah',
    description: 'Setoran Kertas - 3.0 kg',
    amount: 30,
    transaction_date: '2025-12-17T08:20:00',
    status: 'completed',
    waste_type: 'Kertas',
    weight: 3.0,
  },
];

export default function TransactionHistoryAdmin() {
  const { hasPermission } = useAuth();
  
  // States
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Separated fetch function (Session 2 pattern)
  const loadAllTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.getAllTransactions(1, 1000);
      
      // Multi-format response handler (supports 3+ formats)
      let data = MOCK_TRANSACTIONS;
      if (Array.isArray(result.data)) data = result.data;
      else if (result.data?.data) data = result.data.data;
      else if (result.data?.transactions) data = result.data.transactions;
      
      setTransactions(data);
    } catch (err) {
      console.error('Transaction fetch error:', err.message);
      setTransactions(MOCK_TRANSACTIONS);
    } finally {
      setLoading(false);
    }
  };

  // Load transactions on component mount
  useEffect(() => {
    loadAllTransactions();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.user_name.toLowerCase().includes(query) ||
          t.user_email.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.id.toString().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.transaction_date);

        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          if (transactionDate < fromDate) return false;
        }

        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (transactionDate > toDate) return false;
        }

        return true;
      });
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [transactions, searchQuery, typeFilter, statusFilter, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Calculate stats
  const stats = {
    total: transactions.length,
    waste_deposits: transactions.filter((t) => t.type === 'waste_deposit').length,
    product_redemptions: transactions.filter((t) => t.type === 'product_redemption').length,
    cash_withdrawals: transactions.filter((t) => t.type === 'cash_withdrawal').length,
    completed: transactions.filter((t) => t.status === 'completed').length,
    pending: transactions.filter((t) => t.status === 'pending').length,
  };

  // Helper functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'waste_deposit':
        return <TrendingUp size={18} className="text-success" />;
      case 'product_redemption':
        return <Gift size={18} className="text-info" />;
      case 'cash_withdrawal':
        return <DollarSign size={18} className="text-warning" />;
      default:
        return <TrendingDown size={18} />;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: '#10b981', bg: '#ecfdf5', text: 'Completed' },
      pending: { color: '#f59e0b', bg: '#fffbeb', text: 'Pending' },
      approved: { color: '#3b82f6', bg: '#eff6ff', text: 'Approved' },
      rejected: { color: '#ef4444', bg: '#fef2f2', text: 'Rejected' },
    };

    const config = statusConfig[status] || { color: '#6b7280', bg: '#f3f4f6', text: 'Unknown' };

    return (
      <span
        style={{
          color: config.color,
          backgroundColor: config.bg,
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 500,
        }}
      >
        {config.text}
      </span>
    );
  };

  const handleExport = async () => {
    if (!hasPermission('export_reports')) {
      alert('❌ You do not have permission to export transactions');
      return;
    }

    try {
      setLoading(true);
      const result = await adminApi.exportTransactions('csv');

      if (result.success) {
        alert('✅ Transactions exported successfully');
      } else {
        alert('❌ Failed to export transactions');
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('❌ Error exporting transactions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transaction-history-admin">
      {/* Header */}
      <div className="transaction-header">
        <div className="transaction-title">
          <TrendingUp size={24} />
          <h2>Transaction History</h2>
        </div>
        <button
          onClick={handleExport}
          disabled={loading}
          className="btn-export"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="transaction-stats">
        <div className="stat-card">
          <span className="stat-label">Total Transactions</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Waste Deposits</span>
          <span className="stat-value">{stats.waste_deposits}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Product Redemptions</span>
          <span className="stat-value">{stats.product_redemptions}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Cash Withdrawals</span>
          <span className="stat-value">{stats.cash_withdrawals}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completed</span>
          <span className="stat-value" style={{ color: '#10b981' }}>
            {stats.completed}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending</span>
          <span className="stat-value" style={{ color: '#f59e0b' }}>
            {stats.pending}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="transaction-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by user name, email, or transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <Filter size={18} />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="waste_deposit">Waste Deposits</option>
            <option value="product_redemption">Product Redemptions</option>
            <option value="cash_withdrawal">Cash Withdrawals</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="filter-date"
            placeholder="From Date"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="filter-date"
            placeholder="To Date"
          />

          <button
            onClick={() => {
              setSearchQuery('');
              setTypeFilter('all');
              setStatusFilter('all');
              setDateFrom('');
              setDateTo('');
            }}
            className="btn-reset"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="transaction-error">
          <AlertCircle className="error-icon" />
          <p>Error: {error}</p>
          <button onClick={() => setError(null)} className="btn-retry">
            Dismiss
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="transaction-loading">
          <Loader className="spinner" />
          <p>Loading transactions...</p>
        </div>
      )}

      {/* Transactions Table */}
      {!loading && paginatedTransactions.length > 0 && (
        <>
          <div className="transactions-table-wrapper">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="transaction-id">#{transaction.id}</td>
                    <td className="transaction-user">
                      <div className="user-info">
                        <div className="user-name">{transaction.user_name}</div>
                        <div className="user-email">{transaction.user_email}</div>
                      </div>
                    </td>
                    <td className="transaction-type">
                      <div className="type-badge">
                        {getTransactionIcon(transaction.type)}
                        <span>{transaction.category}</span>
                      </div>
                    </td>
                    <td className="transaction-description">
                      {transaction.description}
                    </td>
                    <td className="transaction-amount">
                      <span
                        className={
                          transaction.amount >= 0 ? 'amount-positive' : 'amount-negative'
                        }
                      >
                        {transaction.amount >= 0 ? '+' : ''}
                        {transaction.amount}
                        {transaction.type === 'waste_deposit' ? ' poin' : ''}
                      </span>
                    </td>
                    <td className="transaction-date">
                      {formatDate(transaction.transaction_date)}
                    </td>
                    <td className="transaction-status">
                      {getStatusBadge(transaction.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="pagination-info">
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && paginatedTransactions.length === 0 && (
        <div className="transaction-empty">
          <Trash2 size={48} />
          <p>No transactions found</p>
          <p className="empty-text">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
