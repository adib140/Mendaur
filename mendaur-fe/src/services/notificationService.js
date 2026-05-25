// Notification Service - Updated with Safari/iOS compatibility

import { API_BASE_URL } from '../config/api';
import { getRawItem, removeItem } from '../utils/storage';

const getAuthHeader = () => {
  const token = getRawItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

// Fetch options for Safari/iOS compatibility
const getFetchOptions = (method = 'GET', body = null) => {
  const options = {
    method,
    headers: getAuthHeader(),
    credentials: 'include',  // ⚠️ WAJIB untuk Safari/iOS
    mode: 'cors',
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  return options;
};

// Handle authentication errors
const handleAuthError = (status) => {
  if (status === 401) {
    console.warn('[Notification] Auth expired, clearing session');
    removeItem('token');
    removeItem('user');
    removeItem('userRole');
    removeItem('userId');
    return true;
  }
  return false;
};

const handleError = (error, defaultMessage = 'Terjadi kesalahan') => {
  console.error('[Notification] Error:', error);
  return {
    success: false,
    message: error.message || defaultMessage,
    data: null
  };
};

export const notificationService = {
  // Get all notifications with pagination
  getAll: async (perPage = 20, page = 1) => {
    try {
      const params = new URLSearchParams({ per_page: perPage, page });
      const response = await fetch(
        `${API_BASE_URL}/notifications?${params}`,
        getFetchOptions('GET')
      );

      if (handleAuthError(response.status)) {
        return { success: false, message: 'Sesi berakhir', data: [], authError: true };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.data || [],
        pagination: data.meta || {}
      };
    } catch (error) {
      return handleError(error, 'Gagal mengambil notifikasi');
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/unread-count`,
        getFetchOptions('GET')
      );

      if (handleAuthError(response.status)) {
        return { success: false, unreadCount: 0, authError: true };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        unreadCount: data.unread_count || 0
      };
    } catch (error) {
      return handleError(error, 'Gagal mengambil jumlah notifikasi');
    }
  },

  // Get unread notifications only
  getUnread: async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/unread`,
        getFetchOptions('GET')
      );

      if (handleAuthError(response.status)) {
        return { success: false, data: [], count: 0, authError: true };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.data || [],
        count: data.count || 0
      };
    } catch (error) {
      return handleError(error, 'Gagal mengambil notifikasi belum dibaca');
    }
  },

  // Get single notification by ID
  getOne: async (id) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${id}`,
        getFetchOptions('GET')
      );

      if (handleAuthError(response.status)) {
        return { success: false, data: null, authError: true };
      }

      if (response.status === 404) {
        return {
          success: false,
          message: 'Notifikasi tidak ditemukan',
          data: null
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || data
      };
    } catch (error) {
      return handleError(error, 'Gagal mengambil notifikasi');
    }
  },

  // Mark notification as read
  markAsRead: async (id) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${id}/read`,
        getFetchOptions('PATCH', {})
      );

      if (handleAuthError(response.status)) {
        return { success: false, authError: true };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.data || data
      };
    } catch (error) {
      return handleError(error, 'Gagal menandai notifikasi sebagai dibaca');
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/mark-all-read`,
        getFetchOptions('PATCH', {})
      );

      if (handleAuthError(response.status)) {
        return { success: false, authError: true };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: data.message || 'Semua notifikasi ditandai dibaca'
      };
    } catch (error) {
      return handleError(error, 'Gagal menandai semua notifikasi');
    }
  },

  // Delete notification
  delete: async (id) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/${id}`,
        getFetchOptions('DELETE')
      );

      if (handleAuthError(response.status)) {
        return { success: false, authError: true };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        message: data.message || 'Notifikasi dihapus'
      };
    } catch (error) {
      return handleError(error, 'Gagal menghapus notifikasi');
    }
  },

  // Create notification (Admin only)
  create: async (notificationData) => {
    try {
      const { user_id, judul, pesan, tipe, related_id, related_type } = notificationData;

      if (!user_id || !judul || !pesan) {
        return {
          success: false,
          message: 'user_id, judul, dan pesan wajib diisi'
        };
      }

      const response = await fetch(
        `${API_BASE_URL}/notifications/create`,
        getFetchOptions('POST', {
          user_id,
          judul,
          pesan,
          tipe: tipe || null,
          related_id: related_id || null,
          related_type: related_type || null
        })
      );

      if (handleAuthError(response.status)) {
        return { success: false, authError: true };
      }

      if (response.status === 403) {
        return {
          success: false,
          message: 'Hanya admin yang dapat membuat notifikasi'
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.data || data
      };
    } catch (error) {
      return handleError(error, 'Gagal membuat notifikasi');
    }
  }
};
