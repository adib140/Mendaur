// Auth Service - login, logout, token management
// Updated with Safari/iOS compatibility

import { API_BASE_URL } from '../config/api';
import { getItem, setItem, removeItem, getRawItem } from '../utils/storage';

export const authService = {
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',  // ⚠️ WAJIB untuk Safari/iOS
        mode: 'cors',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn('[Auth] Login failed:', response.status, data.message);
        return {
          success: false,
          message: data.message || 'Login gagal. Periksa email dan password Anda.',
          data: null,
        };
      }

      // Store token and user data using storage utility
      if (data.data?.token) {
        setItem('token', data.data.token);
        setItem('user', data.data.user);
        
        // Determine role from user.role field (from API response)
        const userRole = data.data.user?.role?.toLowerCase() || 'nasabah';
        let role = 'nasabah';
        if (userRole.includes('superadmin')) role = 'superadmin';
        else if (userRole.includes('admin')) role = 'admin';
        setItem('userRole', role);
        setItem('userId', data.data.user?.user_id || '');
      }

      return {
        success: true,
        message: 'Login berhasil',
        data: data.data,
      };
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return {
        success: false,
        message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
        data: null,
      };
    }
  },

  logout: () => {
    removeItem('token');
    removeItem('user');
    removeItem('userRole');
    removeItem('userId');
    return { success: true, message: 'Logout berhasil' };
  },

  getToken: () => {
    return getRawItem('token');
  },

  getUser: () => {
    return getItem('user', null);
  },

  getUserId: () => {
    const id = getItem('userId');
    return id ? parseInt(id) : null;
  },

  getUserRole: () => {
    return getItem('userRole', 'nasabah');
  },

  isAuthenticated: () => {
    return !!getRawItem('token');
  },

  isNasabah: () => {
    return authService.getUserRole() === 'nasabah';
  },

  isAdmin: () => {
    const role = authService.getUserRole();
    return role === 'admin' || role === 'superadmin';
  },

  isSuperAdmin: () => {
    return authService.getUserRole() === 'superadmin';
  },

  canAccessAdmin: () => {
    return authService.isAdmin() || authService.isSuperAdmin();
  },

  refreshToken: async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        return { success: false, token: null };
      }

      const response = await fetch(`${API_BASE_URL}/refresh-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',  // ⚠️ WAJIB untuk Safari/iOS
        mode: 'cors',
      });

      const data = await response.json();

      if (data.data?.token) {
        setItem('token', data.data.token);
        return { success: true, token: data.data.token };
      }

      return { success: false, token: null };
    } catch (error) {
      console.error('[Auth] Token refresh error:', error);
      return { success: false, token: null };
    }
  },
};

export default authService;
