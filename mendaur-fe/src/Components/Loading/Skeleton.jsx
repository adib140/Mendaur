import './Skeleton.css';

// Base Skeleton Component
export const Skeleton = ({ className = '', style = {} }) => (
  <div className={`skeleton ${className}`} style={style} />
);

// Text Skeleton
export const SkeletonText = ({ lines = 1, className = '' }) => (
  <>
    {Array.from({ length: lines }).map((_, i) => (
      <div 
        key={i} 
        className={`skeleton skeleton-text ${className}`} 
        style={{ width: i === lines - 1 && lines > 1 ? '60%' : '100%' }}
      />
    ))}
  </>
);

// Dashboard Skeleton - Full dashboard loading state
export const DashboardSkeleton = () => (
  <div className="skeleton-dashboard">
    {/* Welcome Skeleton */}
    <div className="skeleton-welcome">
      <div className="skeleton-welcome-title" />
      <div className="skeleton-welcome-subtitle" />
    </div>

    {/* Stats Grid Skeleton */}
    <div className="skeleton-stats-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton-stat-card">
          <div className="skeleton skeleton-stat-icon" />
          <div className="skeleton-stat-info">
            <div className="skeleton skeleton-stat-label" />
            <div className="skeleton skeleton-stat-value" />
          </div>
        </div>
      ))}
    </div>

    {/* Dashboard Row Skeleton */}
    <div className="skeleton-dashboard-row">
      {/* Leaderboard Skeleton */}
      <div className="skeleton-card">
        <div className="skeleton-card-header">
          <div className="skeleton skeleton-card-icon" />
          <div className="skeleton" style={{ width: '40%' }} />
        </div>
        <div className="skeleton-leaderboard-list">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-leaderboard-item">
              <div className="skeleton skeleton-rank" />
              <div className="skeleton skeleton-avatar" style={{ width: 36, height: 36 }} />
              <div className="skeleton skeleton-name" />
              <div className="skeleton skeleton-score" />
            </div>
          ))}
        </div>
      </div>

      {/* Badges Skeleton */}
      <div className="skeleton-card">
        <div className="skeleton-card-header">
          <div className="skeleton skeleton-card-icon" />
          <div className="skeleton" style={{ width: '35%' }} />
        </div>
        <div className="skeleton-badge-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton skeleton-badge" />
          ))}
        </div>
      </div>
    </div>

    {/* Articles Skeleton */}
    <div className="skeleton-article-grid">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-article-card">
          <div className="skeleton skeleton-article-image" />
          <div className="skeleton-article-content">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text short" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Card Skeleton
export const CardSkeleton = ({ count = 1 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton-card">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text medium" />
      </div>
    ))}
  </div>
);

// Table Skeleton
export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    {/* Header */}
    <div style={{ display: 'flex', gap: '12px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="skeleton skeleton-text" style={{ flex: 1 }} />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} style={{ display: 'flex', gap: '12px', padding: '12px' }}>
        {Array.from({ length: cols }).map((_, colIndex) => (
          <div key={colIndex} className="skeleton skeleton-text" style={{ flex: 1 }} />
        ))}
      </div>
    ))}
  </div>
);

// List Skeleton
export const ListSkeleton = ({ count = 5 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'white', borderRadius: '8px' }}>
        <div className="skeleton skeleton-avatar" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="skeleton skeleton-text" style={{ width: '60%' }} />
          <div className="skeleton skeleton-text" style={{ width: '40%', height: '0.75rem' }} />
        </div>
      </div>
    ))}
  </div>
);

// Product Grid Skeleton
export const ProductGridSkeleton = ({ count = 6 }) => (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
    gap: '16px' 
  }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton-article-card">
        <div className="skeleton" style={{ height: '150px', width: '100%' }} />
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton skeleton-text" style={{ width: '80%' }} />
          <div className="skeleton skeleton-text" style={{ width: '50%' }} />
          <div className="skeleton skeleton-button" style={{ marginTop: '8px' }} />
        </div>
      </div>
    ))}
  </div>
);

export default {
  Skeleton,
  SkeletonText,
  DashboardSkeleton,
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  ProductGridSkeleton
};
