import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from './Pages/context/AuthContext'
import { notificationService } from '../services/notificationService'
import './NotificationBell.css'

const NotificationBell = () => {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  // Fetch unread notifications
  const fetchUnreadNotifications = async () => {
    setLoading(true)
    try {
      const response = await notificationService.getUnread()
      if (response.success) {
        setNotifications(response.data || [])
        setUnreadCount(response.count || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch count periodically
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount()
      if (response.success) {
        setUnreadCount(response.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  // Initial load and polling
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }
    
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [isAuthenticated])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle bell click
  const handleBellClick = () => {
    setShowDropdown(!showDropdown)
    if (!showDropdown) {
      fetchUnreadNotifications()
    }
  }

  // Mark as read
  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation()
    try {
      const response = await notificationService.markAsRead(notificationId)
      if (response.success) {
        setNotifications(
          notifications.filter((n) => n.id !== notificationId)
        )
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation()
    try {
      const response = await notificationService.markAllAsRead()
      if (response.success) {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={handleBellClick}
        aria-label="Notifications"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-btn"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          {loading ? (
            <div className="dropdown-loading">
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="notification-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="notification-item"
                  onClick={(e) => handleMarkAsRead(notification.id, e)}
                >
                  <div className="notification-content">
                    <h4>{notification.judul || notification.title}</h4>
                    <p>{notification.pesan || notification.message}</p>
                    <span className="time">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className="close-btn"
                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-notifications">
              <p>No unread notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
