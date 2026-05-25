// Backup Service - Superadmin only

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
  console.error('Backup Service Error:', error)
  return {
    success: false,
    message: error.message || defaultMessage,
    data: null
  }
}

export const backupService = {
  // Create database backup
  create: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/superadmin/backup/create`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({})
      })

      if (response.status === 403) {
        return {
          success: false,
          message: 'Only superadmins can create backups'
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        data: data.data || data,
        message: data.message || 'Backup created successfully'
      }
    } catch (error) {
      return handleError(error, 'Failed to create backup')
    }
  },

  // Get all backups
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/superadmin/backup/list`, {
        method: 'GET',
        headers: getAuthHeader()
      })

      if (response.status === 403) {
        return {
          success: false,
          message: 'Only superadmins can view backups'
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        data: data.data || [],
        metadata: data.metadata || {}
      }
    } catch (error) {
      return handleError(error, 'Failed to fetch backups list')
    }
  },

  // Get backup by ID
  getOne: async (backupId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/superadmin/backup/${backupId}`, {
        method: 'GET',
        headers: getAuthHeader()
      })

      if (response.status === 404) {
        return {
          success: false,
          message: 'Backup not found'
        }
      }

      if (response.status === 403) {
        return {
          success: false,
          message: 'Only superadmins can view backups'
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
      return handleError(error, 'Failed to fetch backup details')
    }
  },

  // Download backup file
  download: async (backupId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/superadmin/backup/${backupId}/download`,
        {
          method: 'GET',
          headers: getAuthHeader()
        }
      )

      if (response.status === 404) {
        return {
          success: false,
          message: 'Backup not found'
        }
      }

      if (response.status === 403) {
        return {
          success: false,
          message: 'Only superadmins can download backups'
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Handle file download
      const blob = await response.blob()
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/['"]/g, '')
        : `backup-${backupId}.sql`

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return {
        success: true,
        message: `Backup downloaded: ${filename}`
      }
    } catch (error) {
      return handleError(error, 'Failed to download backup')
    }
  },

  // Restore database from backup (destructive!)
  restore: async (backupId, confirmRestore = false) => {
    try {
      if (!confirmRestore) {
        return {
          success: false,
          message: 'Please confirm database restoration. This action cannot be undone.'
        }
      }

      const response = await fetch(`${API_BASE_URL}/superadmin/backup/${backupId}/restore`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ confirmed: true })
      })

      if (response.status === 404) {
        return {
          success: false,
          message: 'Backup not found'
        }
      }

      if (response.status === 403) {
        return {
          success: false,
          message: 'Only superadmins can restore backups'
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        message: data.message || 'Database restored successfully',
        data: data.data || null
      }
    } catch (error) {
      return handleError(error, 'Failed to restore backup')
    }
  },

  // Delete backup
  delete: async (backupId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/superadmin/backup/${backupId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })

      if (response.status === 404) {
        return {
          success: false,
          message: 'Backup not found'
        }
      }

      if (response.status === 403) {
        return {
          success: false,
          message: 'Only superadmins can delete backups'
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        message: data.message || 'Backup deleted'
      }
    } catch (error) {
      return handleError(error, 'Failed to delete backup')
    }
  }
}
