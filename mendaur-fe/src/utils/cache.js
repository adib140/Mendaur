// Simple in-memory cache with TTL - SHARED across app
const cache = {
  data: {},
  lastUserId: null,
  
  set(key, value, ttlMs = 60000) {
    this.data[key] = { value, expiry: Date.now() + ttlMs };
  },
  
  get(key) {
    const item = this.data[key];
    if (!item) return null;
    if (Date.now() > item.expiry) {
      delete this.data[key];
      return null;
    }
    return item.value;
  },
  
  clear(key) {
    if (key) delete this.data[key];
    else this.data = {};
  },
  
  // Clear all user-specific cache when user changes
  clearUserCache(userId) {
    if (this.lastUserId && this.lastUserId !== userId) {
      // User changed, clear all cached data
      this.data = {};
    }
    this.lastUserId = userId;
  },
  
  // Alias for clearUserCache - check if user changed and clear cache
  checkUserChange(userId) {
    this.clearUserCache(userId);
  },
  
  // Force clear all cache
  clearAll() {
    this.data = {};
    this.lastUserId = null;
  }
};

export default cache;
