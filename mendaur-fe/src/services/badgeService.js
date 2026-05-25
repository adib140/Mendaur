// Badge Service - Admin/Superadmin only

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
  console.error('Badge Service Error:', error)
  return {
    success: false,
    message: error.message || defaultMessage,
    data: null
  }
}

export const badgeService = {
  // Get all badges with pagination
  getAll: async (perPage = 20, page = 1) => {
    try {
      const params = new URLSearchParams({ per_page: perPage, page })
      const response = await fetch(`${API_BASE_URL}/admin/badges?${params}`, {
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
        pagination: data.meta || {}
      }
    } catch (error) {
      return handleError(error, 'Failed to fetch badges')
    }
  },

  // Get single badge by ID
  getOne: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/badges/${id}`, {
        method: 'GET',
        headers: getAuthHeader()
      })

      if (response.status === 404) {
        return {
          success: false,
          message: 'Badge not found',
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
      return handleError(error, 'Failed to fetch badge')
    }
  },

  // Create new badge
  create: async (badgeData) => {
    try {
      const { nama, deskripsi, icon, persyaratan, aktif } = badgeData

      if (!nama || !deskripsi) {
        return {
          success: false,
          message: 'nama and deskripsi are required'
        }
      }

      const response = await fetch(`${API_BASE_URL}/admin/badges`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          nama,
          deskripsi,
          icon: icon || null,
          persyaratan: persyaratan || null,
          aktif: aktif === undefined ? true : aktif
        })
      })

      if (response.status === 403) {
        return {
          success: false,
          message: 'Only admins can create badges'
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
      return handleError(error, 'Failed to create badge')
    }
  },

  // Update badge
  update: async (id, badgeData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/badges/${id}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(badgeData)
      })

      if (response.status === 404) {
        return {
          success: false,
          message: 'Badge not found'
        }
      }

      if (response.status === 403) {
        return {
          success: false,
          message: 'Only admins can update badges'
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
      return handleError(error, 'Failed to update badge')
    }
  },

  // Delete badge
  delete: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/badges/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })

      if (response.status === 404) {
        return {
          success: false,
          message: 'Badge not found'
        }
      }

      if (response.status === 403) {
        return {
          success: false,
          message: 'Only admins can delete badges'
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        message: data.message || 'Badge deleted'
      }
    } catch (error) {
      return handleError(error, 'Failed to delete badge')
    }
  },

  // Assign badge to user
  assignToUser: async (badgeId, userId) => {
    try {
      if (!badgeId || !userId) {
        return {
          success: false,
          message: 'badgeId and userId are required'
        }
      }

      const response = await fetch(`${API_BASE_URL}/admin/badges/${badgeId}/assign`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ user_id: userId })
      })

      if (response.status === 404) {
        return {
          success: false,
          message: 'Badge or user not found'
        }
      }

      if (response.status === 403) {
        return {
          success: false,
          message: 'Only admins can assign badges'
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        message: data.message || 'Badge assigned successfully'
      }
    } catch (error) {
      return handleError(error, 'Failed to assign badge')
    }
  },

  // Revoke badge from user
  revokeFromUser: async (badgeId, userId) => {
    try {
      if (!badgeId || !userId) {
        return {
          success: false,
          message: 'badgeId and userId are required'
        }
      }

      const response = await fetch(`${API_BASE_URL}/admin/badges/${badgeId}/revoke`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ user_id: userId })
      })

      if (response.status === 404) {
        return {
          success: false,
          message: 'Badge or user not found'
        }
      }

      if (response.status === 403) {
        return {
          success: false,
          message: 'Only admins can revoke badges'
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        message: data.message || 'Badge revoked successfully'
      }
    } catch (error) {
      return handleError(error, 'Failed to revoke badge')
    }
  }
}
