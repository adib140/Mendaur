// Admin API Service

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://bsusedulurmendaur.my.id/api'

const getAuthHeader = (isFormData = false) => {
  const token = localStorage.getItem('token')
  
  if (isFormData) {
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}

// ⚠️ Safari/iOS compatible fetch options
const getFetchOptions = (options = {}) => ({
  ...options,
  credentials: 'include',  // WAJIB untuk Safari/iOS
  mode: 'cors',
})

// Safari/iOS compatible fetch wrapper
const safeFetch = (url, options = {}) => {
  return fetch(url, getFetchOptions(options))
}

const buildFormData = (data, fileFields = []) => {
  const formData = new FormData()
  
  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) return
    
    if (fileFields.includes(key) && value instanceof File) {
      formData.append(key, value)
    } else if (typeof value === 'boolean') {
      formData.append(key, value ? '1' : '0')
    } else if (typeof value === 'number') {
      formData.append(key, String(value))
    } else if (value !== '') {
      formData.append(key, value)
    }
  })
  
  return formData
}

const handleError = (error, defaultMessage = 'An error occurred') => {
  return {
    success: false,
    message: error.message || defaultMessage,
    data: null
  }
}

// Send notification to user after transaction
const sendTransactionNotification = async (userId, judul, pesan, tipe = 'info', relatedId = null, relatedType = null) => {
  try {
    if (!userId) {
      console.warn('[Notification] No user_id provided, skipping notification')
      return { success: false, message: 'No user_id' }
    }

    const response = await safeFetch(`${API_BASE_URL}/admin/notifications`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({
        user_id: parseInt(userId),
        judul,
        pesan,
        tipe,
        related_id: relatedId,
        related_type: relatedType
      })
    })

    if (!response.ok) {
      console.warn('[Notification] Failed to send:', response.status)
      return { success: false, message: `HTTP ${response.status}` }
    }

    const data = await response.json()
    console.log('[Notification] Sent successfully to user:', userId)
    return { success: true, data }
  } catch (error) {
    console.warn('[Notification] Error sending:', error.message)
    return { success: false, message: error.message, data: null }
  }
}

/**
 * Dashboard Overview - GET /api/admin/dashboard/overview
 */
export const adminApi = {
  // Dashboard
  getOverview: async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        return {
          success: false,
          message: 'Not authenticated. Please login again.',
          data: null
        }
      }

      const response = await safeFetch(`${API_BASE_URL}/admin/dashboard/overview`, {
        method: 'GET',
        headers: getAuthHeader()
      })

      if (response.status === 401) {
        return {
          success: false,
          message: 'Authentication failed. Please login again.',
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
      return handleError(error, 'Failed to fetch overview stats')
    }
  },

  // Users
  getAllUsers: async (page = 1, limit = 10, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page,
        limit,
        ...filters
      })

      const response = await safeFetch(`${API_BASE_URL}/admin/users?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data
      }
    } catch (error) {
      return handleError(error, 'Failed to fetch users')
    }
  },

  updateUserStatus: async (userId, status) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data
      }
    } catch (error) {
      return handleError(error, 'Failed to update user status')
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return {
        success: true,
        message: 'User deleted successfully'
      }
    } catch (error) {
      return handleError(error, 'Failed to delete user')
    }
  },

  // Create user (backend may return 405)
  createUser: async (userData) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        if (response.status === 405) {
          throw new Error('Backend does not support user creation yet. Please contact the backend team to implement POST /api/admin/users endpoint.')
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data,
        message: 'User created successfully'
      }
    } catch (error) {
      return handleError(error, 'Failed to create user')
    }
  },

  // Phase 2 Analytics - Disabled
  /* 
  // Analytics - Waste
  getWasteAnalytics: async (period = 'monthly', filters = {}) => {
    try {
      const params = new URLSearchParams({
        period,
        ...filters
      })

      const response = await safeFetch(`${API_BASE_URL}/admin/analytics/waste?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data
      }
    } catch (error) {
      return handleError(error, 'Failed to fetch waste analytics')
    }
  },

  getWasteByUser: async (page = 1, limit = 10, filters = {}) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        
        return { success: false, message: 'Not authenticated', data: null }
      }
      
      const params = new URLSearchParams({
        page,
        limit,
        ...filters
      })

      const url = `${API_BASE_URL}/admin/analytics/waste-by-user?${params}`
      
      const response = await safeFetch(url, {
        method: 'GET',
        headers: getAuthHeader()
      })

      if (!response.ok) {
        return { 
          success: false, 
          error: `HTTP ${response.status}`, 
          message: response.statusText,
          data: null 
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data
      }
    } catch (error) {
      return handleError(error, 'Failed to fetch waste by user')
    }
  },

  // Analytics - Points
  getPointsAnalytics: async (period = 'monthly', filters = {}) => {
    try {
      const params = new URLSearchParams({
        period,
        ...filters
      })

      const response = await safeFetch(`${API_BASE_URL}/admin/analytics/points?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data
      }
    } catch (error) {
      return handleError(error, 'Failed to fetch points analytics')
    }
  },
  */

  awardPoints: async (userId, points, reason = '') => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/points/award`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          user_id: userId,
          points,
          reason
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data
      }
    } catch (error) {
      return handleError(error, 'Failed to award points')
    }
  },

  getPointsHistory: async (page = 1, limit = 20, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page,
        limit,
        ...filters
      })

      const response = await safeFetch(`${API_BASE_URL}/admin/points/history?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data
      }
    } catch (error) {
      return handleError(error, 'Failed to fetch points history')
    }
  },

  // Leaderboard
  getLeaderboard: async (period = 'monthly', limit = 100) => {
    try {
      const params = new URLSearchParams({ period, limit })

      const response = await safeFetch(`${API_BASE_URL}/admin/leaderboard?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data
      }
    } catch (error) {
      return handleError(error, 'Failed to fetch leaderboard')
    }
  },

  // Reports
  generateReport: async (type, period, startDate, endDate, format = 'pdf') => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/reports/generate`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          type,
          period,
          startDate,
          endDate,
          format
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data
      }
    } catch (error) {
      return handleError(error, 'Failed to generate report')
    }
  },

  exportData: async (type = 'users', format = 'csv') => {
    try {
      const params = new URLSearchParams({ type, format })

      const response = await safeFetch(`${API_BASE_URL}/admin/export?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // For file downloads, return the response directly
      return {
        success: true,
        data: response
      }
    } catch (error) {
      return handleError(error, 'Failed to export data')
    }
  },

  // ============================================
  // PHASE 1 ENDPOINTS - WASTE DEPOSIT MANAGEMENT
  // ============================================

  /**
   * List all waste deposits with filtering and pagination
   * GET /api/admin/penyetoran-sampah
   * Alias: getAllPenyetoranSampah
   */
  listWasteDeposits: async (page = 1, limit = 10, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page,
        limit,
        ...filters
      })

      const headers = getAuthHeader()

      const response = await safeFetch(`${API_BASE_URL}/admin/penyetoran-sampah?${params}`, {
        method: 'GET',
        headers: headers
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        data: data.data || data
      }
    } catch (error) {
      return handleError(error, 'Failed to fetch waste deposits')
    }
  },

  /**
   * Get details of a specific waste deposit
   * GET /api/admin/penyetoran-sampah/{id}
   */
  getWasteDepositDetail: async (depositId) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/penyetoran-sampah/${depositId}`, {
        method: 'GET',
        headers: getAuthHeader()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data
      }
    } catch (error) {
      return handleError(error, 'Failed to fetch deposit details')
    }
  },

  /**
   * Approve a waste deposit and assign poin
   * PATCH /api/admin/penyetoran-sampah/{id}/approve
   * Optional: poin_didapat (will be calculated automatically if not provided)
   * Auto-sends notification to user after approval
   */
  approveWasteDeposit: async (depositId, poinDiberikan, beratKg = null, catatanAdmin = null, userId = null) => {
    try {
      const payload = {
        poin_diberikan: parseInt(poinDiberikan)
      }
      
      // Include berat_kg if admin wants to edit weight
      if (beratKg !== null && beratKg !== undefined) {
        payload.berat_kg = parseFloat(beratKg)
      }
      
      // Include catatan_admin if provided
      if (catatanAdmin && catatanAdmin.trim()) {
        payload.catatan_admin = catatanAdmin.trim()
      }
      
      const response = await safeFetch(`${API_BASE_URL}/admin/penyetoran-sampah/${depositId}/approve`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      // 🔔 AUTO SEND NOTIFICATION to user
      if (userId) {
        const beratInfo = beratKg ? `${beratKg} kg` : ''
        await sendTransactionNotification(
          userId,
          'Penyetoran Sampah Disetujui ✅',
          `Penyetoran sampah Anda${beratInfo ? ` seberat ${beratInfo}` : ''} telah disetujui. Anda mendapatkan ${poinDiberikan} poin!`,
          'success',
          depositId,
          'penyetoran_sampah'
        )
      }
      
      return {
        success: true,
        message: 'Deposit approved successfully',
        data: data.data || data
      }
    } catch (error) {
      return handleError(error, 'Failed to approve waste deposit')
    }
  },

  /**
   * Reject a waste deposit with reason
   * PATCH /api/admin/penyetoran-sampah/{id}/reject
   * Field: alasan_penolakan (REQUIRED - must have rejection reason)
   * Auto-sends notification to user after rejection
   */
  rejectWasteDeposit: async (depositId, alasanPenolakan, userId = null) => {
    try {
      if (!alasanPenolakan || !alasanPenolakan.trim()) {
        return {
          success: false,
          message: 'Alasan penolakan wajib diisi'
        }
      }
      
      const response = await safeFetch(`${API_BASE_URL}/admin/penyetoran-sampah/${depositId}/reject`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({
          alasan_penolakan: alasanPenolakan.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      // 🔔 AUTO SEND NOTIFICATION to user
      if (userId) {
        await sendTransactionNotification(
          userId,
          'Penyetoran Sampah Ditolak ❌',
          `Maaf, penyetoran sampah Anda ditolak. Alasan: ${alasanPenolakan.trim()}`,
          'warning',
          depositId,
          'penyetoran_sampah'
        )
      }
      
      return {
        success: true,
        message: 'Deposit rejected successfully',
        data: data.data || data
      }
    } catch (error) {
      return handleError(error, 'Failed to reject waste deposit')
    }
  },

  /**
   * Delete a waste deposit (Superadmin only)
   * DELETE /api/admin/penyetoran-sampah/{id}
   */
  deleteWasteDeposit: async (depositId) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/penyetoran-sampah/${depositId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        message: 'Deposit deleted successfully',
        data: data.data || data
      }
    } catch (error) {
      return handleError(error, 'Failed to delete waste deposit')
    }
  },

  /**
   * Get waste deposit statistics
   * GET /api/admin/penyetoran-sampah/stats/overview
   */
  getWasteStats: async () => {
    try {
      const headers = getAuthHeader()

      const response = await safeFetch(`${API_BASE_URL}/admin/penyetoran-sampah/stats/overview`, {
        method: 'GET',
        headers: headers
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        data: data.data || data
      }
    } catch (error) {
      return handleError(error, 'Failed to fetch waste statistics')
    }
  },

  // ============================================
  // ISSUE 2: MISSING ENDPOINTS (19 total)
  // ============================================

  // ADMIN MANAGEMENT (6 endpoints)
  /**
   * Get all admin users
   * GET /api/superadmin/admins
   */
  getAllAdmins: async (page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams({ page, limit })
      const response = await safeFetch(`${API_BASE_URL}/superadmin/admins?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch admins')
    }
  },

  /**
   * Get admin user by ID
   * GET /api/superadmin/admins/{adminId}
   */
  getAdminById: async (adminId) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/superadmin/admins/${adminId}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch admin')
    }
  },

  /**
   * Create new admin user
   * POST /api/superadmin/admins
   */
  createAdmin: async (adminData) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/superadmin/admins`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(adminData)
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to create admin')
    }
  },

  /**
   * Update admin user
   * PUT /api/superadmin/admins/{adminId}
   */
  updateAdmin: async (adminId, adminData) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/superadmin/admins/${adminId}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(adminData)
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to update admin')
    }
  },

  /**
   * Delete admin user
   * DELETE /api/superadmin/admins/{adminId}
   */
  deleteAdmin: async (adminId) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/superadmin/admins/${adminId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to delete admin')
    }
  },

  /**
   * Get admin activity logs
   * GET /api/superadmin/admins/{adminId}/activity-logs
   */
  getAdminActivityLogs: async (adminId, page = 1, limit = 20) => {
    try {
      const params = new URLSearchParams({ page, limit })
      const response = await safeFetch(`${API_BASE_URL}/superadmin/admins/${adminId}/activity-logs?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch activity logs')
    }
  },

  // ROLE MANAGEMENT (5 endpoints)
  /**
   * Get all roles
   * GET /api/superadmin/roles
   */
  getAllRoles: async () => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/superadmin/roles`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch roles')
    }
  },

  /**
   * Get role by ID
   * GET /api/superadmin/roles/{roleId}
   */
  getRoleById: async (roleId) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/superadmin/roles/${roleId}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch role')
    }
  },

  /**
   * Create new role
   * POST /api/superadmin/roles
   */
  createRole: async (roleData) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/superadmin/roles`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(roleData)
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to create role')
    }
  },

  /**
   * Update role
   * PUT /api/superadmin/roles/{roleId}
   */
  updateRole: async (roleId, roleData) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/superadmin/roles/${roleId}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(roleData)
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to update role')
    }
  },

  /**
   * Delete role
   * DELETE /api/superadmin/roles/{roleId}
   */
  deleteRole: async (roleId) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/superadmin/roles/${roleId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to delete role')
    }
  },

  // PERMISSION ASSIGNMENT (3 endpoints)
  /**
   * Assign permissions to role
   * POST /api/superadmin/roles/{roleId}/permissions
   */
  assignPermissionsToRole: async (roleId, permissionIds) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/superadmin/roles/${roleId}/permissions`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ permission_ids: permissionIds })
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to assign permissions')
    }
  },

  /**
   * Get role permissions
   * GET /api/superadmin/roles/{roleId}/permissions
   */
  getRolePermissions: async (roleId) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/superadmin/roles/${roleId}/permissions`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch role permissions')
    }
  },

  /**
   * Get all available permissions
   * GET /api/superadmin/permissions
   */
  getAllPermissions: async () => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/superadmin/permissions`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch permissions')
    }
  },

  // BADGE MANAGEMENT (5 endpoints)
  /**
   * Get all badges
   * GET /api/admin/badges
   */
  getAllBadges: async (page = 1, limit = 20) => {
    try {
      const params = new URLSearchParams({ page, limit })
      const response = await safeFetch(`${API_BASE_URL}/admin/badges?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch badges')
    }
  },

  /**
   * Create badge
   * POST /api/admin/badges
   * Fields: nama, tipe (setor/poin/ranking), deskripsi, syarat_setor, syarat_poin, reward_poin, icon (emoji string)
   * Note: icon is an EMOJI STRING like '🌱', NOT a file upload
   */
  createBadge: async (badgeData) => {
    try {
      // Build payload with correct field names matching backend
      const payload = {
        nama: badgeData.nama,
        tipe: badgeData.tipe,
        deskripsi: badgeData.deskripsi || '',
        syarat_setor: badgeData.syarat_setor || 0,
        syarat_poin: badgeData.syarat_poin || 0,
        reward_poin: badgeData.reward_poin || 0,
        icon: badgeData.icon || '🌱' // Emoji string, not file
      }
      
      const response = await safeFetch(`${API_BASE_URL}/admin/badges`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to create badge')
    }
  },

  /**
   * Update badge
   * PUT /api/admin/badges/{badgeId}
   * Fields: nama, tipe (setor/poin/ranking), deskripsi, syarat_setor, syarat_poin, reward_poin, icon (emoji string)
   * Note: icon is an EMOJI STRING like '🌱', NOT a file upload
   */
  updateBadge: async (badgeId, badgeData) => {
    try {
      // Build payload with correct field names matching backend
      const payload = {
        nama: badgeData.nama,
        tipe: badgeData.tipe,
        deskripsi: badgeData.deskripsi || '',
        syarat_setor: badgeData.syarat_setor || 0,
        syarat_poin: badgeData.syarat_poin || 0,
        reward_poin: badgeData.reward_poin || 0,
        icon: badgeData.icon || '🌱' // Emoji string, not file
      }
      
      const response = await safeFetch(`${API_BASE_URL}/admin/badges/${badgeId}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to update badge')
    }
  },

  /**
   * Delete badge
   * DELETE /api/admin/badges/{badgeId}
   */
  deleteBadge: async (badgeId) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/badges/${badgeId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to delete badge')
    }
  },

  /**
   * Assign badge to user
   * POST /api/admin/badges/{badgeId}/assign
   */
  assignBadgeToUser: async (badgeId, userId) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/badges/${badgeId}/assign`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ user_id: userId })
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to assign badge')
    }
  },

  // ============================================
  // PRODUCT MANAGEMENT (4 endpoints)
  // ============================================

  /**
   * Get all products with pagination and filtering
   * GET /api/admin/produk
   */
  getAllProducts: async (page = 1, limit = 10, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page,
        limit,
        ...filters
      })
      const response = await safeFetch(`${API_BASE_URL}/admin/produk?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch products')
    }
  },

  /**
   * Create new product
   * POST /api/admin/produk
   * Supports file upload for foto field
   */
  createProduct: async (productData) => {
    try {
      // Build FormData for file upload support
      const formData = buildFormData({
        nama: productData.nama,
        harga_poin: productData.harga_poin,
        stok: productData.stok,
        kategori: productData.kategori,
        deskripsi: productData.deskripsi,
        status: productData.status,
        foto: productData.foto
      }, ['foto'])
      
      const response = await safeFetch(`${API_BASE_URL}/admin/produk`, {
        method: 'POST',
        headers: getAuthHeader(true),
        body: formData
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to create product')
    }
  },

  /**
   * Update product
   * PUT /api/admin/produk/{produkId}
   * Supports file upload for foto field
   */
  updateProduct: async (produkId, productData) => {
    try {
      // Build FormData for file upload support
      const formData = buildFormData({
        nama: productData.nama,
        harga_poin: productData.harga_poin,
        stok: productData.stok,
        kategori: productData.kategori,
        deskripsi: productData.deskripsi,
        status: productData.status,
        foto: productData.foto
      }, ['foto'])
      
      // Add _method field for Laravel to handle PUT via POST
      formData.append('_method', 'PUT')
      
      const response = await safeFetch(`${API_BASE_URL}/admin/produk/${produkId}`, {
        method: 'POST',
        headers: getAuthHeader(true),
        body: formData
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to update product')
    }
  },

  /**
   * Delete product
   * DELETE /api/admin/produk/{produkId}
   */
  deleteProduct: async (produkId) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/produk/${produkId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to delete product')
    }
  },

  // ============================================
  // PRODUCT REDEMPTION MANAGEMENT (4 endpoints)
  // ============================================

  /**
   * Get all product redemptions
   * GET /api/admin/penukar-produk
   */
  getProductRedemptions: async (page = 1, limit = 20, filters = {}) => {
    try {
      const params = new URLSearchParams({ page, limit, ...filters })
      const response = await safeFetch(`${API_BASE_URL}/admin/penukar-produk?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch product redemptions')
    }
  },

  /**
   * Approve product redemption
   * PATCH /api/admin/penukar-produk/{id}/approve
   * Auto-sends notification to user after approval
   */
  approveRedemption: async (redemptionId, approvalData, userId = null, productName = null) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/penukar-produk/${redemptionId}/approve`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify(approvalData)
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      // 🔔 AUTO SEND NOTIFICATION to user
      if (userId) {
        await sendTransactionNotification(
          userId,
          'Penukaran Produk Disetujui ✅',
          `Penukaran produk${productName ? ` "${productName}"` : ''} Anda telah disetujui. Silakan ambil produk Anda di lokasi yang ditentukan.`,
          'success',
          redemptionId,
          'penukaran_produk'
        )
      }
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to approve redemption')
    }
  },

  /**
   * Reject product redemption
   * PATCH /api/admin/penukar-produk/{id}/reject
   * Field: alasan (optional)
   * Auto-sends notification to user after rejection
   */
  rejectRedemption: async (redemptionId, rejectionData, userId = null, productName = null) => {
    try {
      // Support both object format and string for backward compatibility
      const alasan = typeof rejectionData === 'object'
        ? (rejectionData.reason || rejectionData.alasan || '')
        : (rejectionData || '')
      
      const response = await safeFetch(`${API_BASE_URL}/admin/penukar-produk/${redemptionId}/reject`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ alasan })
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }
      const data = await response.json()
      
      // 🔔 AUTO SEND NOTIFICATION to user
      if (userId) {
        await sendTransactionNotification(
          userId,
          'Penukaran Produk Ditolak ❌',
          `Maaf, penukaran produk${productName ? ` "${productName}"` : ''} Anda ditolak.${alasan ? ` Alasan: ${alasan}` : ''} Poin Anda akan dikembalikan.`,
          'warning',
          redemptionId,
          'penukaran_produk'
        )
      }
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to reject redemption')
    }
  },

  /**
   * Complete product redemption (mark as picked up/completed)
   * PATCH /api/admin/penukar-produk/{id}/complete
   * Auto-sends notification to user after completion
   */
  completeRedemption: async (redemptionId, catatan = '', userId = null, productName = null) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/penukar-produk/${redemptionId}/complete`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ catatan })
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }
      const data = await response.json()
      
      // 🔔 AUTO SEND NOTIFICATION to user
      if (userId) {
        await sendTransactionNotification(
          userId,
          'Produk Berhasil Diambil 🎉',
          `Produk${productName ? ` "${productName}"` : ''} telah berhasil Anda ambil. Terima kasih telah menggunakan poin Anda!`,
          'success',
          redemptionId,
          'penukaran_produk'
        )
      }
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to complete redemption')
    }
  },

  // ============================================
  // WASTE ITEM & CATEGORY MANAGEMENT (5 endpoints)
  // ============================================

  /**
   * Get all waste categories
   * GET /api/admin/waste-categories
   */
  getAllWasteCategories: async () => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/waste-categories`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch waste categories')
    }
  },

  /**
   * Get all waste items (jenis_sampah)
   * GET /api/admin/jenis-sampah
   */
  getAllWasteItems: async (page = 1, limit = 20, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page,
        limit,
        ...filters
      })
      const response = await safeFetch(`${API_BASE_URL}/admin/jenis-sampah?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch waste items')
    }
  },

  /**
   * Create waste item
   * POST /api/admin/jenis-sampah
   */
  createWasteItem: async (wasteItemData) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/jenis-sampah`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(wasteItemData)
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to create waste item')
    }
  },

  /**
   * Update waste item
   * PUT /api/admin/jenis-sampah/{jenisSampahId}
   */
  updateWasteItem: async (jenisSampahId, wasteItemData) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/jenis-sampah/${jenisSampahId}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(wasteItemData)
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to update waste item')
    }
  },

  /**
   * Delete waste item
   * DELETE /api/admin/jenis-sampah/{jenisSampahId}
   */
  deleteWasteItem: async (jenisSampahId) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/jenis-sampah/${jenisSampahId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to delete waste item')
    }
  },

  // ============================================
  // SCHEDULE MANAGEMENT (6 endpoints)
  // ============================================

  /**
   * Get all waste deposit schedules (jadwal_penyetoran)
   * GET /api/admin/jadwal-penyetoran
   */
  getAllSchedules: async (page = 1, limit = 20, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page,
        limit,
        ...filters
      })
      const response = await safeFetch(`${API_BASE_URL}/admin/jadwal-penyetoran?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch schedules')
    }
  },

  /**
   * Get schedule details
   * GET /api/admin/jadwal-penyetoran/{jadwalId}
   */
  getScheduleDetail: async (jadwalId) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/jadwal-penyetoran/${jadwalId}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch schedule details')
    }
  },

  /**
   * Create new schedule
   * POST /api/admin/jadwal-penyetoran
   * Required fields: hari (enum: Senin-Minggu), waktu_mulai (HH:mm), waktu_selesai (HH:mm), lokasi
   * Optional fields: status (Buka/Tutup - default: Buka)
   */
  createSchedule: async (scheduleData) => {
    try {
      // Ensure time format is HH:mm (not HH:mm:ss)
      const formatTime = (time) => {
        if (!time) return time
        return time.substring(0, 5)
      }
      
      const payload = {
        hari: scheduleData.hari,
        waktu_mulai: formatTime(scheduleData.waktu_mulai),
        waktu_selesai: formatTime(scheduleData.waktu_selesai),
        lokasi: scheduleData.lokasi,
        status: scheduleData.status || 'Buka'
      }
      
      
      
      const response = await safeFetch(`${API_BASE_URL}/admin/jadwal-penyetoran`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      })
      
      
      
      if (!response.ok) {
        const errorText = await response.text()
        
        try {
          const errorData = JSON.parse(errorText)
          
          return { 
            success: false, 
            error: errorData.message || errorData.error || `HTTP ${response.status}`,
            details: errorData
          }
        } catch {
          return { 
            success: false, 
            error: `HTTP ${response.status}: ${errorText || 'Server error'}`,
            details: { status: response.status, body: errorText }
          }
        }
      }
      
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      
      return handleError(error, 'Failed to create schedule')
    }
  },

  /**
   * Update schedule
   * PUT /api/admin/jadwal-penyetoran/{jadwalId}
   * Optional fields: hari (enum: Senin-Minggu), waktu_mulai (HH:mm), waktu_selesai (HH:mm), lokasi, status (Buka/Tutup)
   */
  updateSchedule: async (jadwalId, scheduleData) => {
    try {
      // Ensure time format is HH:mm (not HH:mm:ss)
      const formatTime = (time) => {
        if (!time) return time
        return time.substring(0, 5)
      }
      
      const payload = {
        hari: scheduleData.hari,
        waktu_mulai: formatTime(scheduleData.waktu_mulai),
        waktu_selesai: formatTime(scheduleData.waktu_selesai),
        lokasi: scheduleData.lokasi,
        status: scheduleData.status || 'Buka'
      }
      
      
      
      const response = await safeFetch(`${API_BASE_URL}/admin/jadwal-penyetoran/${jadwalId}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to update schedule')
    }
  },

  /**
   * Delete schedule
   * DELETE /api/admin/jadwal-penyetoran/{jadwalId}
   */
  deleteSchedule: async (jadwalId) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/jadwal-penyetoran/${jadwalId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to delete schedule')
    }
  },

  // ============================================
  // NOTIFICATION MANAGEMENT (4 endpoints)
  // ============================================

  /**
   * Get all notifications
   * GET /api/admin/notifications
   */
  getNotifications: async (page = 1, limit = 20, filters = {}) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        
        return { success: false, message: 'Not authenticated', data: null }
      }
      
      const params = new URLSearchParams({ page, limit, ...filters })
      const url = `${API_BASE_URL}/admin/notifications?${params}`
      
      
      const response = await safeFetch(url, {
        method: 'GET',
        headers: getAuthHeader()
      })
      
      
      
      if (!response.ok) {
        return { 
          success: false, 
          error: `HTTP ${response.status}`, 
          message: response.statusText,
          data: null 
        }
      }
      
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      
      return handleError(error, 'Failed to fetch notifications')
    }
  },

  /**
   * Create notification
   * POST /api/admin/notifications
   */
  createNotification: async (notificationData) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/notifications`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(notificationData)
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to create notification')
    }
  },

  /**
   * Delete notification
   * DELETE /api/admin/notifications/{notificationId}
   */
  deleteNotification: async (notificationId) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to delete notification')
    }
  },

  // ============================================
  // ARTICLE MANAGEMENT (5 endpoints)
  // ============================================

  /**
   * Get all articles
   * GET /api/admin/artikel
   */
  getAllArticles: async (page = 1, limit = 20, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page,
        limit,
        ...filters
      })
      const response = await safeFetch(`${API_BASE_URL}/admin/artikel?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch articles')
    }
  },

  /**
   * Get article details by slug
   * GET /api/admin/artikel/{slug}
   */
  getArticleDetail: async (slug) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/artikel/${slug}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch article details')
    }
  },

  /**
   * Create new article
   * POST /api/admin/artikel
   * Fields: judul, konten, penulis, kategori, tanggal_publikasi (required), foto_cover (optional file)
   */
  createArticle: async (articleData) => {
    try {
      const hasFile = articleData.foto_cover instanceof File
      
      if (hasFile) {
        // Use FormData for file upload
        const formData = buildFormData({
          judul: articleData.judul,
          konten: articleData.konten,
          penulis: articleData.penulis,
          kategori: articleData.kategori,
          tanggal_publikasi: articleData.tanggal_publikasi,
          foto_cover: articleData.foto_cover
        }, ['foto_cover'])
        
        const response = await safeFetch(`${API_BASE_URL}/admin/artikel`, {
          method: 'POST',
          headers: getAuthHeader(true),
          body: formData
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        
        return { success: true, data: data.data || data }
      } else {
        // Use JSON for non-file data
        const response = await safeFetch(`${API_BASE_URL}/admin/artikel`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({
            judul: articleData.judul,
            konten: articleData.konten,
            penulis: articleData.penulis,
            kategori: articleData.kategori,
            tanggal_publikasi: articleData.tanggal_publikasi
          })
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        
        return { success: true, data: data.data || data }
      }
    } catch (error) {
      return handleError(error, 'Failed to create article')
    }
  },

  /**
   * Update article by slug
   * PUT /api/admin/artikel/{slug}
   * Fields: judul, konten, penulis, kategori, tanggal_publikasi, foto_cover (optional file)
   */
  updateArticle: async (slug, articleData) => {
    try {
      const hasFile = articleData.foto_cover instanceof File
      
      if (hasFile) {
        // Use FormData for file upload
        const formData = buildFormData({
          judul: articleData.judul,
          konten: articleData.konten,
          penulis: articleData.penulis,
          kategori: articleData.kategori,
          tanggal_publikasi: articleData.tanggal_publikasi,
          foto_cover: articleData.foto_cover
        }, ['foto_cover'])
        formData.append('_method', 'PUT')
        
        const response = await safeFetch(`${API_BASE_URL}/admin/artikel/${slug}`, {
          method: 'POST',
          headers: getAuthHeader(true),
          body: formData
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        
        return { success: true, data: data.data || data }
      } else {
        // Use JSON for non-file updates
        const response = await safeFetch(`${API_BASE_URL}/admin/artikel/${slug}`, {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify({
            judul: articleData.judul,
            konten: articleData.konten,
            penulis: articleData.penulis,
            kategori: articleData.kategori,
            tanggal_publikasi: articleData.tanggal_publikasi
          })
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        
        return { success: true, data: data.data || data }
      }
    } catch (error) {
      return handleError(error, 'Failed to update article')
    }
  },

  /**
   * Delete article by slug
   * DELETE /api/admin/artikel/{slug}
   */
  deleteArticle: async (slug) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/artikel/${slug}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to delete article')
    }
  },

  // ============================================
  // TRANSACTION HISTORY (2 endpoints)
  // ============================================

  /**
   * Get all transactions (combined view)
   * GET /api/admin/transactions
   */
  getAllTransactions: async (page = 1, limit = 20, filters = {}) => {
    try {
      const params = new URLSearchParams({ page, limit, ...filters })
      const response = await safeFetch(`${API_BASE_URL}/admin/transactions?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch transactions')
    }
  },

  /**
   * Export transactions to CSV/Excel
   * GET /api/admin/transactions/export
   */
  exportTransactions: async (format = 'csv', filters = {}) => {
    try {
      const params = new URLSearchParams({ format, ...filters })
      const response = await safeFetch(`${API_BASE_URL}/admin/transactions/export?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return { success: true, data: response }
    } catch (error) {
      return handleError(error, 'Failed to export transactions')
    }
  },

  /**
   * Get cash withdrawals list
   * GET /api/admin/penarikan-tunai
   */
  getCashWithdrawals: async (page = 1, limit = 20, filters = {}) => {
    try {
      const params = new URLSearchParams({ page, limit, ...filters })
      const response = await safeFetch(`${API_BASE_URL}/admin/penarikan-tunai?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch cash withdrawals')
    }
  },

  /**
   * Approve cash withdrawal
   * PATCH /api/admin/penarikan-tunai/{id}/approve
   * Auto-sends notification to user after approval
   */
  approveCashWithdrawal: async (id, notes = '', userId = null, amount = null) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/penarikan-tunai/${id}/approve`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ catatan_admin: notes })
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      
      // 🔔 AUTO SEND NOTIFICATION to user
      if (userId) {
        const amountInfo = amount ? `Rp ${parseInt(amount).toLocaleString('id-ID')}` : ''
        await sendTransactionNotification(
          userId,
          'Penarikan Tunai Disetujui ✅',
          `Penarikan tunai${amountInfo ? ` sebesar ${amountInfo}` : ''} Anda telah disetujui. Dana akan segera ditransfer ke rekening Anda.`,
          'success',
          id,
          'penarikan_tunai'
        )
      }
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to approve cash withdrawal')
    }
  },

  /**
   * Reject cash withdrawal
   * PATCH /api/admin/penarikan-tunai/{id}/reject
   * Field: catatan_admin (required - alasan penolakan)
   * Auto-sends notification to user after rejection
   */
  rejectCashWithdrawal: async (id, rejectionData, userId = null) => {
    try {
      // Support both object format and string for backward compatibility
      const catatan_admin = typeof rejectionData === 'object'
        ? (rejectionData.reason || rejectionData.catatan_admin || rejectionData.notes || '')
        : (rejectionData || '')
      
      const response = await safeFetch(`${API_BASE_URL}/admin/penarikan-tunai/${id}/reject`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ catatan_admin })
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }
      const data = await response.json()
      
      // 🔔 AUTO SEND NOTIFICATION to user
      if (userId) {
        await sendTransactionNotification(
          userId,
          'Penarikan Tunai Ditolak ❌',
          `Maaf, penarikan tunai Anda ditolak.${catatan_admin ? ` Alasan: ${catatan_admin}` : ''} Poin Anda akan dikembalikan.`,
          'warning',
          id,
          'penarikan_tunai'
        )
      }
      
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to reject cash withdrawal')
    }
  },

  // ============ ADDITIONAL USER MANAGEMENT ENDPOINTS ============
  getAdminUserById: async (userId) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch user')
    }
  },

  updateAdminUser: async (userId, userData) => {
    try {
      
      
      
      
      
      const response = await safeFetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(userData)
      })
      
      
      
      
      if (!response.ok) {
        const errorData = await response.json()
        
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Unknown error'}`)
      }
      
      const data = await response.json()
      
      
      return { success: true, data: data.data || data }
    } catch (error) {
      
      return handleError(error, 'Failed to update user')
    }
  },

  updateUserRole: async (userId, roleId) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ role_id: roleId })
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to update user role')
    }
  },

  deleteAdminUser: async (userId) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to delete user')
    }
  },

  // ============ WASTE DEPOSITS ADDITIONAL METHODS ============
  getPenyetoranSampahById: async (id) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/penyetoran-sampah/${id}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch waste deposit')
    }
  },

  approvePenyetoranSampah: async (id, catatan = '') => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/penyetoran-sampah/${id}/approve`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ catatan_admin: catatan })
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to approve waste deposit')
    }
  },

  rejectPenyetoranSampah: async (id, catatan = '') => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/penyetoran-sampah/${id}/reject`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: JSON.stringify({ catatan_admin: catatan })
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to reject waste deposit')
    }
  },

  getPenyetoranStats: async () => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/penyetoran-sampah/stats/overview`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch waste deposit stats')
    }
  },

  deletePenyetoranSampah: async (id) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/penyetoran-sampah/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to delete waste deposit')
    }
  },

  // ============ BADGE ADDITIONAL METHODS ============
  getBadgeAdminById: async (id) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/badges/${id}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch badge')
    }
  },

  getUsersWithBadge: async (badgeId, page = 1, perPage = 50) => {
    try {
      const params = new URLSearchParams({ page, per_page: perPage })
      const response = await safeFetch(`${API_BASE_URL}/admin/badges/${badgeId}/users?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch users with badge')
    }
  },

  // ============ PRODUCT ADDITIONAL METHODS ============
  getProdukById: async (id) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/admin/produk/${id}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch product')
    }
  },

  // ============ ANALYTICS ADDITIONAL METHODS ============
  getWasteByUserAnalytics: async (page = 1, perPage = 50) => {
    try {
      const params = new URLSearchParams({ page, per_page: perPage })
      const response = await safeFetch(`${API_BASE_URL}/admin/analytics/waste-by-user?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch waste by user analytics')
    }
  },

  // ============ ACTIVITY LOGS ENDPOINTS ============
  getAllActivityLogs: async (page = 1, perPage = 50, filters = {}) => {
    try {
      const params = new URLSearchParams({ page, per_page: perPage })
      if (filters.user_id) params.append('user_id', filters.user_id)
      if (filters.activity_type) params.append('activity_type', filters.activity_type)
      if (filters.date_from) params.append('date_from', filters.date_from)
      if (filters.date_to) params.append('date_to', filters.date_to)
      
      const response = await safeFetch(`${API_BASE_URL}/admin/activity-logs?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch activity logs')
    }
  },

  getActivityLogsStats: async (dateFrom = null, dateTo = null) => {
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      
      const response = await safeFetch(`${API_BASE_URL}/admin/activity-logs/stats/overview?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch activity logs stats')
    }
  },

  exportActivityLogsCSV: async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      if (filters.user_id) params.append('user_id', filters.user_id)
      if (filters.date_from) params.append('date_from', filters.date_from)
      if (filters.date_to) params.append('date_to', filters.date_to)
      
      const response = await safeFetch(`${API_BASE_URL}/admin/activity-logs/export/csv?${params}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      return { success: true }
    } catch (error) {
      return handleError(error, 'Failed to export activity logs')
    }
  },

  getUserActivityLogs: async (userId, page = 1, perPage = 50) => {
    try {
      const params = new URLSearchParams({ page, per_page: perPage })
      const response = await safeFetch(`${API_BASE_URL}/admin/users/${userId}/activity-logs?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return { success: true, data: data.data || data }
    } catch (error) {
      return handleError(error, 'Failed to fetch user activity logs')
    }
  }
}

// Add function aliases for backward compatibility
adminApi.getAllPenyetoranSampah = adminApi.listWasteDeposits
adminApi.approvePenyetoranSampah = adminApi.approveWasteDeposit
adminApi.rejectPenyetoranSampah = adminApi.rejectWasteDeposit

export default adminApi
