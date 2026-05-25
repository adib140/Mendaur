/**
 * Temporary Mock Auth Service for Frontend Testing
 * Use this while backend database is being fixed
 * 
 * Instructions:
 * 1. Replace src/services/authService.js with this file temporarily
 * 2. Comment out the real authService.js import
 * 3. Test frontend functionality with mock auth
 * 4. Once backend is fixed, switch back to real authService.js
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://bsusedulurmendaur.my.id/api';

// Mock users for testing different roles
const MOCK_CREDENTIALS = {
  'nasabah@test.com': { password: 'password123', role: 'nasabah', level: 'Nasabah' },
  'admin@test.com': { password: 'password123', role: 'admin', level: 'Admin' },
  'superadmin@test.com': { password: 'password123', role: 'superadmin', level: 'Superadmin' },
};

// Generate mock token
const generateMockToken = () => {
  return `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const authService = {
  /**
   * Mock login - for testing only
   * Use credentials above to test different roles
   */
  login: async (email, password) => {
    try {
      // Check if credentials are in mock list
      const credential = MOCK_CREDENTIALS[email];
      
      if (!credential) {
        return {
          success: false,
          message: 'User not found. Try: nasabah@test.com, admin@test.com, or superadmin@test.com',
          data: null,
        };
      }

      if (credential.password !== password) {
        return {
          success: false,
          message: 'Invalid password. Try: password123',
          data: null,
        };
      }

      // Simulate successful login
      const mockToken = generateMockToken();
      const mockUser = {
        user_id: Math.floor(Math.random() * 1000),
        nama: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        email: email,
        no_hp: '082123456789',
        actual_poin: Math.floor(Math.random() * 5000),
        display_poin: Math.floor(Math.random() * 5000),
        level: credential.level,
      };

      // Store in localStorage
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('userRole', credential.role);
      localStorage.setItem('userId', mockUser.user_id);

      return {
        success: true,
        message: 'Mock login successful (Backend not ready)',
        data: { token: mockToken, user: mockUser },
      };
    } catch {
      return {
        success: false,
        message: 'Mock login error',
        data: null,
      };
    }
  },

  /**
   * Logout user - clear all stored data
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    return { success: true, message: 'Logged out successfully' };
  },

  /**
   * Get current authentication token
   */
  getToken: () => {
    return localStorage.getItem('token');
  },

  /**
   * Get current user data
   */
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Get current user ID
   */
  getUserId: () => {
    const id = localStorage.getItem('userId');
    return id ? parseInt(id) : null;
  },

  /**
   * Get current user role
   */
  getUserRole: () => {
    return localStorage.getItem('userRole') || 'nasabah';
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Check if user is Nasabah
   */
  isNasabah: () => {
    return authService.getUserRole() === 'nasabah';
  },

  /**
   * Check if user is Admin
   */
  isAdmin: () => {
    const role = authService.getUserRole();
    return role === 'admin' || role === 'superadmin';
  },

  /**
   * Check if user is Superadmin
   */
  isSuperAdmin: () => {
    return authService.getUserRole() === 'superadmin';
  },

  /**
   * Check if user can access admin panel
   */
  canAccessAdmin: () => {
    return authService.isAdmin() || authService.isSuperAdmin();
  },

  /**
   * Mock token refresh
   */
  refreshToken: async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        return { success: false, token: null };
      }

      // Generate new mock token
      const newToken = generateMockToken();
      localStorage.setItem('token', newToken);
      return { success: true, token: newToken };
    } catch {
      return { success: false, token: null };
    }
  },
};

export default authService;
