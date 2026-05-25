// Auth validation utility

import { API_BASE_URL } from '../config/api';

// Test if current token is valid
export const validateCurrentToken = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    return response.ok;
  } catch {
    return false;
  }
};

// Handle 401 - validates token before forcing logout
export const smart401Handler = async (failedEndpoint) => {
  const isTokenValid = await validateCurrentToken();
  
  if (!isTokenValid) {
    forceLogout(`Invalid token detected on ${failedEndpoint}`);
  } else {
    return {
      success: false,
      message: 'This feature is temporarily unavailable. Please try again later.',
      data: null,
      statusCode: 401
    };
  }
};

// Clear auth data and redirect to login
export const forceLogout = (reason = 'Session expired') => {
  console.warn('Force logout triggered:', reason);
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('roleData');
  localStorage.removeItem('permissions');
  localStorage.removeItem('permissionsCount');
  localStorage.removeItem('id_user');
  
  window.location.href = '/login';
};

export default {
  validateCurrentToken,
  smart401Handler,
  forceLogout
};
