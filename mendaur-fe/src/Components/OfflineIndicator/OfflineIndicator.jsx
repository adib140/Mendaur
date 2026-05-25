import React from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOffline';
import './OfflineIndicator.css';

/**
 * Offline Indicator Component
 * Shows a banner when user is offline or just came back online
 */
export default function OfflineIndicator() {
  const { isOnline, wasOffline, setWasOffline } = useOnlineStatus();

  // Don't render anything if online and wasn't offline
  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <>
      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner offline">
          <div className="offline-banner-content">
            <WifiOff size={18} />
            <span>Anda sedang offline. Beberapa fitur mungkin terbatas.</span>
          </div>
          <button 
            className="offline-retry-btn"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={14} />
            Coba Lagi
          </button>
        </div>
      )}

      {/* Back Online Banner */}
      {isOnline && wasOffline && (
        <div className="offline-banner online">
          <div className="offline-banner-content">
            <Wifi size={18} />
            <span>Koneksi kembali! Data akan diperbarui.</span>
          </div>
          <button 
            className="offline-dismiss-btn"
            onClick={() => setWasOffline(false)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

/**
 * Offline Badge - small indicator for cached data
 */
export function CachedDataBadge({ isFromCache }) {
  if (!isFromCache) return null;

  return (
    <span className="cached-data-badge" title="Data dari cache offline">
      <WifiOff size={12} />
      Cached
    </span>
  );
}
