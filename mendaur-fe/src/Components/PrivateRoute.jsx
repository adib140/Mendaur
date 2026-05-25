// Protected Route - auth & role check

import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService.js';

const PrivateRoute = ({ component, requiredRole = null }) => {
  const isAuthenticated = authService.isAuthenticated();
  const userRole = authService.getUserRole();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const roleHierarchy = {
      'nasabah': 1,
      'admin': 2,
      'superadmin': 3,
    };

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
      return (
        <div className="access-denied-container">
          <div className="access-denied-card">
            <h1>Access Denied</h1>
            <p>You do not have permission to access this page.</p>
            <p>Required role: <strong>{requiredRole}</strong></p>
            <p>Your role: <strong>{userRole}</strong></p>
            <a href="/dashboard">← Back to Dashboard</a>
          </div>
        </div>
      );
    }
  }

  return React.createElement(component);
};

export default PrivateRoute;
