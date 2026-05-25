/**
 * Fetch Utility - Universal fetch wrapper dengan Safari/iOS compatibility
 * Includes timeout, retry, better error handling
 */

import { API_BASE_URL } from '../config/api';
import { getRawItem, removeItem } from './storage';

// Default timeout (15 seconds)
const DEFAULT_TIMEOUT = 15000;

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

/**
 * Detect if running on Safari/iOS
 */
export const isSafari = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium');
};

export const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Create AbortController with timeout
 */
const createAbortController = (timeout) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  return { controller, timeoutId };
};

/**
 * Sleep function for retry delay
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get authentication headers
 */
export const getAuthHeaders = () => {
  const token = getRawItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Handle authentication errors
 */
const handleAuthError = (status) => {
  if (status === 401) {
    // Token expired or invalid - clear auth data
    removeItem('token');
    removeItem('user');
    removeItem('userRole');
    removeItem('userId');
    
    // Redirect to login if not already there
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      console.warn('[Fetch] Authentication failed, redirecting to login');
      // Use a small delay to allow current operation to complete
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
    return true;
  }
  return false;
};

/**
 * Parse error response
 */
const parseErrorResponse = async (response) => {
  try {
    const data = await response.json();
    return {
      message: data.message || data.error || `HTTP ${response.status}: ${response.statusText}`,
      errors: data.errors || null,
      data: data
    };
  } catch {
    return {
      message: `HTTP ${response.status}: ${response.statusText}`,
      errors: null,
      data: null
    };
  }
};

/**
 * Universal fetch function with all bells and whistles
 * @param {string} endpoint - API endpoint (relative or absolute URL)
 * @param {Object} options - Fetch options
 * @param {Object} config - Additional configuration
 * @returns {Promise<Object>} Response data
 */
export const fetchApi = async (endpoint, options = {}, config = {}) => {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = MAX_RETRIES,
    retryDelay = RETRY_DELAY,
    requireAuth = true,
    baseUrl = API_BASE_URL,
    skipAuthRedirect = false,
  } = config;

  // Build full URL
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  // Build headers
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };
  
  // Remove auth header if not required
  if (!requireAuth) {
    delete headers['Authorization'];
  }

  // Build fetch options - Safari/iOS compatible
  const fetchOptions = {
    ...options,
    headers,
    // ⚠️ WAJIB untuk Safari/iOS - gunakan 'include' untuk cross-origin credentials
    credentials: 'include',
    // Ensure proper mode for CORS
    mode: 'cors',
  };

  let lastError;
  
  // Retry loop
  for (let attempt = 0; attempt <= retries; attempt++) {
    const { controller, timeoutId } = createAbortController(timeout);
    
    try {
      if (attempt > 0) {
        console.log(`[Fetch] Retry attempt ${attempt} for ${endpoint}`);
        await sleep(retryDelay * attempt);
      }

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle auth errors
      if (!skipAuthRedirect && handleAuthError(response.status)) {
        return {
          success: false,
          message: 'Sesi Anda telah berakhir. Silakan login kembali.',
          status: response.status,
          data: null,
        };
      }

      // Handle error responses
      if (!response.ok) {
        const errorInfo = await parseErrorResponse(response);
        
        // Don't retry on client errors (4xx) except 408 (timeout) and 429 (rate limit)
        if (response.status >= 400 && response.status < 500 && 
            response.status !== 408 && response.status !== 429) {
          return {
            success: false,
            message: errorInfo.message,
            errors: errorInfo.errors,
            status: response.status,
            data: errorInfo.data,
          };
        }
        
        throw new Error(errorInfo.message);
      }

      // Parse successful response
      const data = await response.json();
      
      return {
        success: true,
        message: data.message || 'Success',
        data: data.data !== undefined ? data.data : data,
        meta: data.meta || null,
        status: response.status,
      };

    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      // Log error for debugging
      console.error(`[Fetch] Error on attempt ${attempt + 1}:`, {
        url,
        error: error.message,
        name: error.name,
      });

      // Don't retry on abort (timeout)
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: 'Koneksi timeout. Periksa jaringan internet Anda.',
          status: 0,
          data: null,
        };
      }

      // Check for network errors
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        // On last attempt, return error
        if (attempt === retries) {
          return {
            success: false,
            message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
            status: 0,
            data: null,
          };
        }
        // Otherwise, continue to retry
        continue;
      }

      // For other errors on last attempt
      if (attempt === retries) {
        return {
          success: false,
          message: error.message || 'Terjadi kesalahan. Silakan coba lagi.',
          status: 0,
          data: null,
        };
      }
    }
  }

  // Should not reach here, but just in case
  return {
    success: false,
    message: lastError?.message || 'Terjadi kesalahan tidak dikenal.',
    status: 0,
    data: null,
  };
};

/**
 * Shorthand methods
 */
export const get = (endpoint, config = {}) => 
  fetchApi(endpoint, { method: 'GET' }, config);

export const post = (endpoint, data, config = {}) => 
  fetchApi(endpoint, { method: 'POST', body: JSON.stringify(data) }, config);

export const put = (endpoint, data, config = {}) => 
  fetchApi(endpoint, { method: 'PUT', body: JSON.stringify(data) }, config);

export const patch = (endpoint, data, config = {}) => 
  fetchApi(endpoint, { method: 'PATCH', body: JSON.stringify(data) }, config);

export const del = (endpoint, config = {}) => 
  fetchApi(endpoint, { method: 'DELETE' }, config);

/**
 * POST with FormData (for file uploads)
 */
export const postFormData = async (endpoint, formData, config = {}) => {
  const token = getRawItem('token');
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Don't set Content-Type for FormData - browser will set it with boundary
  
  return fetchApi(endpoint, { 
    method: 'POST', 
    body: formData,
    headers,
  }, config);
};

/**
 * Check Safari/iOS compatibility with backend
 * Call this to diagnose connection issues on Safari/iOS
 */
export const checkSafariCompatibility = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/debug/safari-ios`, {
      method: 'GET',
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      return {
        success: false,
        message: `HTTP ${response.status}`,
        browserInfo: {
          isSafari: isSafari(),
          isIOS: isIOS(),
          userAgent: navigator.userAgent,
        },
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data,
      browserInfo: {
        isSafari: isSafari(),
        isIOS: isIOS(),
        userAgent: navigator.userAgent,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      browserInfo: {
        isSafari: isSafari(),
        isIOS: isIOS(),
        userAgent: navigator.userAgent,
      },
    };
  }
};

export default {
  fetchApi,
  get,
  post,
  put,
  patch,
  del,
  postFormData,
  checkSafariCompatibility,
  getAuthHeaders,
  isSafari,
  isIOS,
};
