// Product API - Public product endpoints
import { API_BASE_URL } from '../config/api';

const DEFAULT_TIMEOUT = 15000;

const fetchWithTimeout = async (url, options = {}, timeout = DEFAULT_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server lambat merespons');
    }
    throw error;
  }
};

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

const handleError = (error) => {
  return {
    success: false,
    message: error.message || 'An error occurred',
    error
  };
};

const productApi = {
  // Get all products - GET /api/produk
  getAllProducts: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.kategori) params.append('kategori', filters.kategori);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      
      const queryString = params.toString();
      const url = `${API_BASE_URL}/produk${queryString ? '?' + queryString : ''}`;
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data: data.data || []
      };
    } catch (error) {
      return handleError(error);
    }
  },

  // Get product by ID - GET /api/produk/{id}
  getProductById: async (productId) => {
    try {
      const url = `${API_BASE_URL}/produk/${productId}`;
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data: data.data || null
      };
    } catch (error) {
      return handleError(error);
    }
  },

  // Redeem product - POST /api/penukaran-produk
  redeemProduct: async (redemptionData) => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/penukaran-produk`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(redemptionData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data: data.data || data,
        message: data.message || 'Penukaran berhasil'
      };
    } catch (error) {
      return handleError(error);
    }
  },

  // Get redemption history - GET /api/penukaran-produk
  getRedemptionHistory: async (userId) => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/penukaran-produk?${params}`, {
        method: 'GET',
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data: data.data || []
      };
    } catch (error) {
      return handleError(error);
    }
  }
};

export default productApi;
