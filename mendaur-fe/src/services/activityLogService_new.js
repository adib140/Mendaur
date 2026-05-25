/**
 * Activity Log Service
 * Handles all activity log API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://bsusedulurmendaur.my.id/api'

const getAuthHeader = () => {
  const token = localStorage.getItem('token')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}

const handleError = (error, defaultMessage = 'An error occurred') => {
  console.error('Activity Log Service Error:', error)
  return {
    success: false,
    message: error.message || defaultMessage,
    data: null
  }
}

export const activityLogService = {
  /**
   * Get all activity logs with pagination and filters
   * Used by: ActivityLogsTable.jsx
   */
  getAll: async (options = {}) => {
    try {
      const { 
        perPage = 20, 
        page = 1, 
        user_id = null, 
        action = null, 
        date_from = null, 
        date_to = null 
      } = options

      const params = new URLSearchParams({
        per_page: perPage,
        page: page
      })

      // Add optional filters
      if (user_id) params.append('user_id', user_id)
      if (action) params.append('action', action)
      if (date_from) params.append('date_from', date_from)
      if (date_to) params.append('date_to', date_to)

      const response = await fetch(`${API_BASE_URL}/admin/activity-logs?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        data: data.data || [],
        pagination: data.meta || {
          current_page: page,
          per_page: perPage,
          total: 0,
          last_page: 1
        }
      }
    } catch (error) {
      return handleError(error, 'Failed to fetch activity logs')
    }
  },

  /**
   * Get single activity log by ID
   */
  getById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/activity-logs/${id}`, {
        method: 'GET',
        headers: getAuthHeader()
      })

      if (response.status === 404) {
        return {
          success: false,
          message: 'Activity log not found',
          data: null
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        data: data.data || data
      }
    } catch (error) {
      return handleError(error, 'Failed to fetch activity log')
    }
  },

  /**
   * Get activity logs for specific user
   */
  getUserLogs: async (userId, perPage = 20, page = 1) => {
    return await activityLogService.getAll({
      user_id: userId,
      perPage,
      page
    })
  },

  /**
   * Get activity logs by action type
   */
  getByAction: async (action, perPage = 20, page = 1) => {
    return await activityLogService.getAll({
      action,
      perPage,
      page
    })
  }
}
