import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/api';
import cache from '../../../utils/cache';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [roleData, setRoleData] = useState(null); // Full role object from backend
  const [permissions, setPermissions] = useState([]); // Array of permission strings
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    const storedRoleData = localStorage.getItem('roleData');
    const storedPermissions = localStorage.getItem('permissions');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setRole(storedRole || 'nasabah');
        if (storedRoleData) {
          setRoleData(JSON.parse(storedRoleData));
        }
        if (storedPermissions) {
          setPermissions(JSON.parse(storedPermissions));
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('roleData');
        localStorage.removeItem('permissions');
      }
    }
    setLoading(false);
  }, []);

  const login = (loginResponse) => {
    // Handle both old format and new backend format
    const userData = loginResponse.user || loginResponse;
    const token = loginResponse.token;

    // Extract role information
    const roleName = userData.role?.nama_role || userData.role || 'nasabah';
    const roleObj = userData.role || null;
    // Permissions from backend can be:
    // 1. userData.role?.permissions (array)
    // 2. userData.permissions (number representing count)
    // 3. undefined (default to empty array)
    const permsData = userData.role?.permissions || userData.permissions;
    let userPermissions = [];
    let permissionsCount = 0;
    
    if (Array.isArray(permsData)) {
      userPermissions = permsData;
      permissionsCount = permsData.length;
    } else if (typeof permsData === 'number') {
      permissionsCount = permsData;
      userPermissions = []; // Keep as empty array for consistency
    }

    // Store in state
    setUser(userData);
    setRole(roleName);
    setRoleData(roleObj);
    setPermissions(userPermissions);

    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    localStorage.setItem('role', roleName);
    localStorage.setItem('roleData', JSON.stringify(roleObj));
    localStorage.setItem('permissions', JSON.stringify(userPermissions));
    localStorage.setItem('permissionsCount', permissionsCount.toString()); // Store count separately
    localStorage.setItem('id_user', userData.user_id); // For backward compatibility - now uses user_id from backend
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setRoleData(null);
    setPermissions([]);
    // Clear all cached data on logout
    cache.clearAll();
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('roleData');
    localStorage.removeItem('permissions');
    localStorage.removeItem('permissionsCount');
    localStorage.removeItem('id_user');
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('user', JSON.stringify(updatedUserData));
  };

  // ✅ Refresh user data from backend
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/profile`, {
        credentials: 'include',  // ⚠️ WAJIB untuk Safari/iOS
        mode: 'cors',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const userData = result.data?.user || result.user || result.data;
        
        if (userData) {
          updateUser(userData);
        }
      }
    } catch {
      // Silently handle refresh errors
    }
  };

  // ✅ Check if user has specific permission
  const hasPermission = (permission) => {
    // Superadmin has ALL permissions
    if (role === 'superadmin') return true;
    // Admin also has all admin-related permissions by default
    if (role === 'admin') return true;
    // Regular users must have explicit permission
    if (!Array.isArray(permissions)) return false;
    return permissions.includes(permission);
  };

  // ✅ Check if user has ANY of the provided permissions
  const hasAnyPermission = (permissionsArray) => {
    // Superadmin has all permissions
    if (role === 'superadmin') return true;
    if (!Array.isArray(permissions) || !Array.isArray(permissionsArray)) return false;
    return permissionsArray.some(p => permissions.includes(p));
  };

  // ✅ Check if user has ALL of the provided permissions
  const hasAllPermissions = (permissionsArray) => {
    // Superadmin has all permissions
    if (role === 'superadmin') return true;
    if (!Array.isArray(permissions) || !Array.isArray(permissionsArray)) return false;
    return permissionsArray.every(p => permissions.includes(p));
  };

  // ✅ Check if user is admin or superadmin
  const isAdmin = role === 'admin' || role === 'superadmin';

  // ✅ Check if user is superadmin
  const isSuperAdmin = role === 'superadmin';

  // ✅ Check if user is regular nasabah
  const isNasabah = role === 'nasabah';

  // ✅ Get permissions count (from backend or array length)
  const getPermissionsCount = () => {
    const stored = localStorage.getItem('permissionsCount');
    if (stored) return parseInt(stored);
    return Array.isArray(permissions) ? permissions.length : 0;
  };

  const value = {
    // State
    user,
    role,
    roleData,
    permissions,

    // Methods
    login,
    logout,
    updateUser,
    refreshUser,
    getPermissionsCount,

    // Checks
    isAuthenticated: !!user,
    isAdmin,
    isSuperAdmin,
    isNasabah,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
