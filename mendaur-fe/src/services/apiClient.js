// API Client - Centralized request handler

import authService from './authService.js';
import { API_BASE_URL } from '../config/api.js';

// Add auth header to request
const requestInterceptor = (options = {}) => {
  const token = authService.getToken();

  return {
    ...options,
    credentials: 'include',  // ⚠️ WAJIB untuk Safari/iOS
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };
};

// Handle response errors
const responseInterceptor = async (response) => {
  const data = await response.json();

  // Handle 401 - Token expired
  if (response.status === 401) {
    const refreshResult = await authService.refreshToken();
    if (!refreshResult.success) {
      authService.logout();
      window.location.href = '/login';
    }
  }

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
};

// Main API call function
export const apiCall = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const requestOptions = requestInterceptor(options);

    const response = await fetch(url, requestOptions);
    const result = await responseInterceptor(response);

    if (!result.ok) {
      const error = new Error(result.data?.message || `HTTP ${result.status}`);
      error.status = result.status;
      error.response = result.data;
      throw error;
    }

    return result.data;
  } catch (error) {
    console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error);
    throw error;
  }
};

// API Helper Methods
export const api = {
  get: (endpoint, options = {}) =>
    apiCall(endpoint, { method: 'GET', ...options }),

  post: (endpoint, body = {}, options = {}) =>
    apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    }),

  patch: (endpoint, body = {}, options = {}) =>
    apiCall(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options,
    }),

  put: (endpoint, body = {}, options = {}) =>
    apiCall(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    }),

  delete: (endpoint, options = {}) =>
    apiCall(endpoint, { method: 'DELETE', ...options }),
};

export default api;
