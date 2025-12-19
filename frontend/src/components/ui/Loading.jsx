import './Loading.css';

// Skeleton Card Loader
export const SkeletonCard = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-header">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-text-group">
              <div className="skeleton-text skeleton-title"></div>
              <div className="skeleton-text skeleton-subtitle"></div>
            </div>
          </div>
          <div className="skeleton-body">
            <div className="skeleton-text"></div>
            <div className="skeleton-text"></div>
            <div className="skeleton-text short"></div>
          </div>
        </div>
      ))}
    </>
  );
};

// Skeleton List Loader
export const SkeletonList = ({ count = 5 }) => {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-list-item">
          <div className="skeleton-avatar small"></div>
          <div className="skeleton-text-group flex-1">
            <div className="skeleton-text"></div>
            <div className="skeleton-text short"></div>
          </div>
          <div className="skeleton-badge"></div>
        </div>
      ))}
    </div>
  );
};

// Skeleton Table Loader
export const SkeletonTable = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="skeleton-text skeleton-table-header-cell"></div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="skeleton-text skeleton-table-cell"></div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Skeleton Stats Grid
export const SkeletonStats = ({ count = 4 }) => {
  return (
    <div className="skeleton-stats-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-stat-card">
          <div className="skeleton-text skeleton-stat-label"></div>
          <div className="skeleton-text skeleton-stat-value"></div>
        </div>
      ))}
    </div>
  );
};

// Spinner Loader
export const Spinner = ({ size = 'medium', className = '' }) => {
  return (
    <div className={`spinner spinner-${size} ${className}`}>
      <svg className="spinner-svg" viewBox="0 0 50 50">
        <circle className="spinner-circle" cx="25" cy="25" r="20" />
      </svg>
    </div>
  );
};

// Full Page Loader
export const PageLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="page-loader">
      <Spinner size="large" />
      {message && <p className="page-loader-message">{message}</p>}
    </div>
  );
};

// Inline Loader
export const InlineLoader = ({ message = '' }) => {
  return (
    <div className="inline-loader">
      <Spinner size="small" />
      {message && <span className="inline-loader-message">{message}</span>}
    </div>
  );
};

// Content Placeholder
export const ContentPlaceholder = ({ 
  icon = '📦', 
  title = 'No data available',
  description = '',
  action = null 
}) => {
  return (
    <div className="content-placeholder">
      <div className="placeholder-icon">{icon}</div>
      <h3 className="placeholder-title">{title}</h3>
      {description && <p className="placeholder-description">{description}</p>}
      {action && <div className="placeholder-action">{action}</div>}
    </div>
  );
};
