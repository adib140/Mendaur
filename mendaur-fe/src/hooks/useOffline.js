import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to detect online/offline status
 * Returns { isOnline, wasOffline } and provides offline UI helper
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show "back online" notification briefly
      if (wasOffline) {
        setTimeout(() => setWasOffline(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline, setWasOffline };
}

/**
 * Custom hook for caching data in localStorage for offline access
 */
export function useOfflineCache(key, fetchFn, options = {}) {
  const { ttl = 5 * 60 * 1000, enabled = true } = options; // Default 5 min TTL
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const { isOnline } = useOnlineStatus();

  const getCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(`offline_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > ttl;
        if (!isExpired || !isOnline) {
          return data;
        }
      }
    } catch {
      // Invalid cache, ignore
    }
    return null;
  }, [key, ttl, isOnline]);

  const setCachedData = useCallback((newData) => {
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify({
        data: newData,
        timestamp: Date.now()
      }));
    } catch {
      // Storage full or unavailable
    }
  }, [key]);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);

    // Try cache first if offline
    const cached = getCachedData();
    if (!isOnline && cached) {
      setData(cached);
      setIsFromCache(true);
      setLoading(false);
      return;
    }

    try {
      const result = await fetchFn();
      setData(result);
      setIsFromCache(false);
      setCachedData(result);
    } catch (err) {
      // Fallback to cache on error
      if (cached) {
        setData(cached);
        setIsFromCache(true);
      } else {
        setError(err.message || 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchFn, getCachedData, setCachedData, isOnline]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, isFromCache, refetch: fetchData };
}

/**
 * Clear all offline cache
 */
export function clearOfflineCache() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('offline_')) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Get offline cache stats
 */
export function getOfflineCacheStats() {
  const keys = Object.keys(localStorage);
  const offlineKeys = keys.filter(key => key.startsWith('offline_'));
  
  let totalSize = 0;
  offlineKeys.forEach(key => {
    totalSize += localStorage.getItem(key)?.length || 0;
  });

  return {
    count: offlineKeys.length,
    sizeKB: Math.round(totalSize / 1024 * 100) / 100,
    keys: offlineKeys.map(k => k.replace('offline_', ''))
  };
}
