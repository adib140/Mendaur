/**
 * Storage Utility - Wrapper untuk localStorage dengan fallback
 * Handles iOS Private Mode dan browser yang tidak support localStorage
 */

// In-memory fallback storage
const memoryStorage = new Map();

/**
 * Check if localStorage is available
 */
const isLocalStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

// Cache the check result
const localStorageAvailable = isLocalStorageAvailable();

/**
 * Get item from storage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key not found
 * @returns {*} Stored value or default
 */
export const getItem = (key, defaultValue = null) => {
  try {
    if (localStorageAvailable) {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      
      // Try to parse JSON, return raw string if fails
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } else {
      // Fallback to memory storage
      return memoryStorage.has(key) ? memoryStorage.get(key) : defaultValue;
    }
  } catch (error) {
    console.warn(`[Storage] Error getting item "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Set item in storage
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON stringified if object)
 * @returns {boolean} Success status
 */
export const setItem = (key, value) => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (localStorageAvailable) {
      localStorage.setItem(key, stringValue);
    } else {
      // Fallback to memory storage
      memoryStorage.set(key, value);
    }
    return true;
  } catch (error) {
    console.warn(`[Storage] Error setting item "${key}":`, error);
    // Try memory storage as last resort
    memoryStorage.set(key, value);
    return false;
  }
};

/**
 * Remove item from storage
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export const removeItem = (key) => {
  try {
    if (localStorageAvailable) {
      localStorage.removeItem(key);
    }
    memoryStorage.delete(key);
    return true;
  } catch (error) {
    console.warn(`[Storage] Error removing item "${key}":`, error);
    return false;
  }
};

/**
 * Clear all storage
 * @returns {boolean} Success status
 */
export const clear = () => {
  try {
    if (localStorageAvailable) {
      localStorage.clear();
    }
    memoryStorage.clear();
    return true;
  } catch (error) {
    console.warn('[Storage] Error clearing storage:', error);
    return false;
  }
};

/**
 * Get raw string item (for token, etc)
 * @param {string} key - Storage key
 * @returns {string|null} Raw string value
 */
export const getRawItem = (key) => {
  try {
    if (localStorageAvailable) {
      return localStorage.getItem(key);
    } else {
      const value = memoryStorage.get(key);
      return value !== undefined ? String(value) : null;
    }
  } catch (error) {
    console.warn(`[Storage] Error getting raw item "${key}":`, error);
    return null;
  }
};

/**
 * Check if storage is using fallback (memory)
 * @returns {boolean}
 */
export const isUsingFallback = () => !localStorageAvailable;

// Export storage object for compatibility
export const storage = {
  getItem,
  setItem,
  removeItem,
  clear,
  getRawItem,
  isUsingFallback,
  isAvailable: localStorageAvailable,
};

export default storage;
