import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { activityLogService } from '../../services/activityLogService'
import './ActivityLogsTable.css'

const ActivityLogsTable = () => {
  const { hasPermission } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ current_page: 1, per_page: 20, total: 0 })
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    dateFrom: '',
    dateTo: ''
  })

  // Check permission
  const canViewLogs = hasPermission('view_activity_logs')

  // Fetch logs with current filters
  const loadLogs = async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const response = await activityLogService.getAll({
        perPage: pagination.per_page,
        page,
        user_id: filters.user_id || null,
        action: filters.action || null,
        date_from: filters.dateFrom || null,
        date_to: filters.dateTo || null
      })

      if (response.success) {
        setLogs(response.data || [])
        setPagination((prev) => ({
          ...prev,
          ...response.pagination,
          current_page: page
        }))
      } else {
        setError(response.message || 'Failed to fetch activity logs')
      }
    } catch (err) {
      setError('Error fetching activity logs: ' + err.message)
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (canViewLogs) {
      loadLogs(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!canViewLogs) {
    return (
      <div className="permission-denied">
        <p>You do not have permission to view activity logs</p>
      </div>
    )
  }

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  // Apply filters
  const handleApplyFilters = () => {
    loadLogs(1)
  }

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      user_id: '',
      action: '',
      dateFrom: '',
      dateTo: ''
    })
    loadLogs(1)
  }

  // Handle pagination
  const handlePrevPage = () => {
    if (pagination.current_page > 1) {
      loadLogs(pagination.current_page - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination.current_page < Math.ceil(pagination.total / pagination.per_page)) {
      loadLogs(pagination.current_page + 1)
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.per_page) || 1

  return (
    <div className="activity-logs-container">
      <div className="logs-header">
        <h2>Activity Logs</h2>
        <p className="total-logs">Total: {pagination.total} activities</p>
      </div>

      {/* Filters */}
      <div className="logs-filters">
        <div className="filter-group">
          <label htmlFor="dateFrom">From Date:</label>
          <input
            type="date"
            id="dateFrom"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleFilterChange}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="dateTo">To Date:</label>
          <input
            type="date"
            id="dateTo"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleFilterChange}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="action">Action:</label>
          <input
            type="text"
            id="action"
            name="action"
            placeholder="e.g., create, update, delete"
            value={filters.action}
            onChange={handleFilterChange}
          />
        </div>

        <div className="filter-buttons">
          <button className="btn-primary" onClick={handleApplyFilters} disabled={loading}>
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>
          <button className="btn-secondary" onClick={handleResetFilters} disabled={loading}>
            Reset
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      {/* Table */}
      {loading && logs.length === 0 ? (
        <div className="loading-state">
          <p>Loading activity logs...</p>
        </div>
      ) : logs.length > 0 ? (
        <>
          <div className="logs-table-wrapper">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Model</th>
                  <th>Description</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="date-cell">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="user-cell">
                      <span className="user-badge">{log.user?.name || 'Unknown'}</span>
                    </td>
                    <td className="action-cell">
                      <span className={`action-badge action-${log.action?.toLowerCase()}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="model-cell">{log.model}</td>
                    <td className="description-cell">{log.description || '-'}</td>
                    <td className="ip-cell">{log.ip_address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="logs-pagination">
            <button
              className="btn-pagination"
              onClick={handlePrevPage}
              disabled={pagination.current_page === 1 || loading}
            >
              ← Previous
            </button>

            <div className="page-info">
              Page {pagination.current_page} of {totalPages}
            </div>

            <button
              className="btn-pagination"
              onClick={handleNextPage}
              disabled={pagination.current_page >= totalPages || loading}
            >
              Next →
            </button>
          </div>
        </>
      ) : (
        <div className="no-logs">
          <p>No activity logs found</p>
        </div>
      )}
    </div>
  )
}

export default ActivityLogsTable
