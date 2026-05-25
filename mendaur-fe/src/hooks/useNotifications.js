import { useState, useCallback } from 'react'
import { notificationService } from '../services/notificationService'

// Hook for notification operations
export const useNotifications = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getUnread = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await notificationService.getUnread()
      if (response.success) {
        return response.data || []
      } else {
        setError(response.message)
        return []
      }
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const getUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount()
      if (response.success) {
        return response.unreadCount || 0
      }
      return 0
    } catch (err) {
      console.error('Error fetching unread count:', err)
      return 0
    }
  }, [])

  const markAsRead = useCallback(async (notificationId) => {
    setLoading(true)
    setError(null)
    try {
      const response = await notificationService.markAsRead(notificationId)
      if (response.success) {
        return true
      } else {
        setError(response.message)
        return false
      }
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await notificationService.markAllAsRead()
      if (response.success) {
        return true
      } else {
        setError(response.message)
        return false
      }
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteNotification = useCallback(async (notificationId) => {
    setLoading(true)
    setError(null)
    try {
      const response = await notificationService.delete(notificationId)
      if (response.success) {
        return true
      } else {
        setError(response.message)
        return false
      }
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const create = useCallback(async (notificationData) => {
    setLoading(true)
    setError(null)
    try {
      const response = await notificationService.create(notificationData)
      if (response.success) {
        return response.data
      } else {
        setError(response.message)
        return null
      }
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    getUnread,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    create
  }
}
