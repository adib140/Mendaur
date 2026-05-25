// API Helper
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://bsusedulurmendaur.my.id/api';
const DEFAULT_TIMEOUT = 15000;

const fetchWithTimeout = async (url, options = {}, timeout = DEFAULT_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',  // ⚠️ WAJIB untuk Safari/iOS
      mode: 'cors',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server took too long to respond');
    }
    throw error;
  }
};

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const fullUrl = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetchWithTimeout(fullUrl, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status}`;
      let errorData = null;
      
      try {
        errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Response not JSON
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    const responseData = await response.json();
    return responseData;
    
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error - Unable to connect to server');
    }
    throw error;
  }
};

export const apiGet = (endpoint, options = {}) =>
  apiCall(endpoint, { method: 'GET', ...options });

export const apiPost = (endpoint, body, options = {}) =>
  apiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options
  });

export const apiPut = (endpoint, body, options = {}) =>
  apiCall(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...options
  });

export const apiDelete = (endpoint, options = {}) =>
  apiCall(endpoint, { method: 'DELETE', ...options });

// Specific endpoints
export const getUser = (userId) => apiGet(`/users/${userId}`);
export const getUserBadges = (userId) => apiGet(`/users/${userId}/badges`);
export const getUnlockedBadges = (userId) => apiGet(`/users/${userId}/unlocked-badges`);
export const getBadgeTitle = (userId) => apiGet(`/users/${userId}/badge-title`);
export const setBadgeTitle = (userId, badgeId) => apiPut(`/users/${userId}/badge-title`, { badge_id: badgeId });
export const getUserActivity = (userId, limit = 20) => apiGet(`/users/${userId}/aktivitas?limit=${limit}`);
export const getUserPoints = (userId) => apiGet(`/points/user/${userId}`);
export const getDashboardStats = (userId) => apiGet(`/dashboard/user-stats/${userId}`);
export const getLeaderboard = (type = 'poin', limit = 10) => apiGet(`/dashboard/leaderboard?type=${type}&limit=${limit}`);
export const getArticles = () => apiGet(`/articles`);
export const getArticle = (id) => apiGet(`/articles/${id}`);
export const login = (email, password) => apiPost('/login', { email, password }, { headers: {} });
export const register = (data) => apiPost('/register', data, { headers: {} });

// Update profile - tries PUT /api/profile first, falls back to POST /api/profile/update
export const updateUserProfile = async (userId, data) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  };

  // Primary endpoint
  try {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ ...data, user_id: userId }),
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fallback to POST
  }

  // Fallback endpoint
  const response = await fetch(`${API_BASE_URL}/profile/update`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...data, user_id: userId }),
  });
  
  if (response.ok) {
    return await response.json();
  }
  
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.message || 'Gagal memperbarui profil');
};

// Legacy function
export const fetchRiwayat = async () => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/riwayat`);
  return res.json();
};

// Avatar Upload - POST /api/users/{id}/avatar
export const uploadUserAvatar = async (userId, avatarFile) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(avatarFile.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.');
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (avatarFile.size > maxSize) {
      throw new Error('File size must not exceed 2MB');
    }

    const formData = new FormData();
    formData.append('avatar', avatarFile);

    const response = await fetch(`${API_BASE_URL}/users/${userId}/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });

    if (!response.ok) {
      let errorMessage = `Upload failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Response not JSON
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Avatar uploaded successfully',
      data: data.data || data,
      path: data.data?.path || data.path
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null
    };
  }
};
