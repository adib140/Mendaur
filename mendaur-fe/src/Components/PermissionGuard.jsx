import React from 'react';
import { useAuth } from './Pages/context/AuthContext';

// Permission-based conditional render
// Usage:
//   <PermissionGuard permission="approve_deposit">...</PermissionGuard>
//   <PermissionGuard permission={['a', 'b']} require="any">...</PermissionGuard>
//   <PermissionGuard permission={['a', 'b']} require="all">...</PermissionGuard>
export function PermissionGuard({
  permission,
  require = 'any',
  fallback = null,
  children
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  // Single permission
  if (typeof permission === 'string') {
    if (!hasPermission(permission)) {
      return fallback;
    }
    return children;
  }

  // Multiple permissions
  if (Array.isArray(permission)) {
    let authorized = false;

    if (require === 'all') {
      authorized = hasAllPermissions(permission);
    } else {
      authorized = hasAnyPermission(permission);
    }

    if (!authorized) {
      return fallback;
    }
    return children;
  }

  return fallback;
}

/**
 * RoleGuard Component
 * 
 * Conditionally renders children based on user role
 * 
 * Props:
 *   - role: String | String[] - Required role(s)
 *   - fallback: ReactNode - What to show if no role match
 *   - children: ReactNode - Content to render if authorized
 * 
 * Examples:
 *   
 *   // Single role
 *   <RoleGuard role="admin">
 *     <AdminPanel />
 *   </RoleGuard>
 *   
 *   // Multiple roles (matches any)
 *   <RoleGuard role={['admin', 'superadmin']}>
 *     <AdminFeatures />
 *   </RoleGuard>
 */
export function RoleGuard({
  role,
  fallback = null,
  children
}) {
  const { role: userRole } = useAuth();

  if (typeof role === 'string') {
    if (userRole !== role) {
      return fallback;
    }
    return children;
  }

  if (Array.isArray(role)) {
    if (!role.includes(userRole)) {
      return fallback;
    }
    return children;
  }

  return fallback;
}

// Admin/Superadmin shortcut
export function AdminGuard({ fallback = null, children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return fallback;
  return children;
}

// Superadmin only shortcut
export function SuperAdminGuard({ fallback = null, children }) {
  const { isSuperAdmin } = useAuth();
  if (!isSuperAdmin) return fallback;
  return children;
}

export default PermissionGuard;
