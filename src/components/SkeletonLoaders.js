import React from 'react';
import '../styles/skeleton-loader.css';

/**
 * SkeletonCard - Animated skeleton for card layouts (Desktop/Table view)
 */
export const SkeletonCard = ({ count = 4, height = 280 }) => {
  return (
    <div className="skeleton-card-container">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-card" style={{ minHeight: `${height}px` }}>
          <div className="skeleton-line skeleton-line-title"></div>
          <div className="skeleton-line skeleton-line-text"></div>
          <div className="skeleton-line skeleton-line-text-short"></div>
          <div className="skeleton-line skeleton-line-text"></div>
          <div className="skeleton-button"></div>
        </div>
      ))}
    </div>
  );
};

/**
 * SkeletonOrderCard - Animated skeleton specifically for order cards (mobile)
 * Matches the exact layout: teal header with customer info + white body with order details
 */
export const SkeletonOrderCard = ({ count = 4 }) => {
  return (
    <div className="skeleton-order-card-container">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-order-card">
          {/* Header Section - Teal Background */}
          <div className="skeleton-order-header">
            <div className="skeleton-header-left">
              <div className="skeleton-line skeleton-customer-name"></div>
              <div className="skeleton-line skeleton-customer-code"></div>
            </div>
            <div className="skeleton-header-right">
              <div className="skeleton-line skeleton-status-badge"></div>
              <div className="skeleton-line skeleton-timestamp"></div>
            </div>
          </div>
          
          {/* Body Section - White Background */}
          <div className="skeleton-order-body">
            <div className="skeleton-body-top">
              <div className="skeleton-line skeleton-order-title"></div>
              <div className="skeleton-line skeleton-amount"></div>
            </div>
            <div className="skeleton-body-bottom">
              <div className="skeleton-line skeleton-order-info"></div>
              <div className="skeleton-line skeleton-payment-status"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * SkeletonMobileCard - Animated skeleton for mobile horizontal card layouts
 */
export const SkeletonMobileCard = ({ count = 6 }) => {
  return (
    <div className="skeleton-mobile-card-container">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-mobile-card">
          <div className="skeleton-mobile-image"></div>
          <div className="skeleton-mobile-content">
            <div className="skeleton-line skeleton-mobile-title"></div>
            <div className="skeleton-line skeleton-mobile-code"></div>
            <div className="skeleton-line skeleton-mobile-price"></div>
            <div className="skeleton-mobile-buttons">
              <div className="skeleton-line skeleton-mobile-quantity"></div>
              <div className="skeleton-line skeleton-mobile-add-btn"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * SkeletonTable - Animated skeleton for table layouts
 */
export const SkeletonTable = ({ rows = 8, columns = 5, height = 60 }) => {
  return (
    <div className="skeleton-table-wrapper">
      {/* Header */}
      <div className="skeleton-table-row skeleton-table-header">
        {Array.from({ length: columns }).map((_, idx) => (
          <div key={idx} className="skeleton-table-cell">
            <div className="skeleton-line skeleton-line-header"></div>
          </div>
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="skeleton-table-row" style={{ height: `${height}px` }}>
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div key={colIdx} className="skeleton-table-cell">
              <div className="skeleton-line skeleton-line-text"></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * SkeletonPagination - Animated skeleton for pagination
 */
export const SkeletonPagination = ({ height = 40 }) => {
  return (
    <div className="skeleton-pagination-wrapper" style={{ height: `${height}px` }}>
      <div className="skeleton-pagination-button"></div>
      <div className="skeleton-pagination-button"></div>
      <div className="skeleton-pagination-number"></div>
      <div className="skeleton-pagination-button"></div>
      <div className="skeleton-pagination-button"></div>
    </div>
  );
};

/**
 * SkeletonList - Animated skeleton for list layouts
 */
export const SkeletonList = ({ count = 5, height = 80 }) => {
  return (
    <div className="skeleton-list-container">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-list-item" style={{ minHeight: `${height}px` }}>
          <div className="skeleton-avatar"></div>
          <div className="skeleton-list-content">
            <div className="skeleton-line skeleton-line-title"></div>
            <div className="skeleton-line skeleton-line-text-short"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * SkeletonCartList - Animated skeleton for cart list layouts
 */
export const SkeletonCartList = ({ count = 5, height = 80 }) => {
  return (
    <div className="skeleton-list-container">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-list-item" style={{ minHeight: `${height}px` }}>
          <div className="skeleton-list-content" style={{ minWidth: "100%" }}>
            <div className="skeleton-line skeleton-line-title"></div>
            <div className="skeleton-line skeleton-line-text-short"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * SkeletonGrid - Animated skeleton for grid layouts
 */
export const SkeletonGrid = ({ count = 6, height = 200, columns = 3 }) => {
  return (
    <div className="skeleton-grid-container" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-grid-item" style={{ minHeight: `${height}px` }}>
          <div className="skeleton-image"></div>
          <div className="skeleton-content">
            <div className="skeleton-line skeleton-line-title"></div>
            <div className="skeleton-line skeleton-line-text-short"></div>
            <div className="skeleton-line skeleton-line-price"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * SkeletonSearchInput - Animated skeleton for search input
 */
export const SkeletonSearchInput = ({ height = 44 }) => {
  return (
    <div className="skeleton-search-wrapper" style={{ height: `${height}px` }}>
      <div className="skeleton-search-icon"></div>
      <div className="skeleton-search-input"></div>
    </div>
  );
};

/**
 * SkeletonButton - Animated skeleton for buttons
 */
export const SkeletonButton = ({ width = '100px', height = '36px' }) => {
  return (
    <div className="skeleton-button" style={{ width, height, display: 'inline-block' }}></div>
  );
};

/**
 * SkeletonAvatar - Animated skeleton for avatars
 */
export const SkeletonAvatar = ({ size = 'medium' }) => {
  return <div className={`skeleton-avatar skeleton-avatar-${size}`}></div>;
};

/**
 * SkeletonHomeCard - Animated skeleton for home page category cards with images
 */
export const SkeletonHomeCard = ({ count = 7 }) => {
  return (
    <div className="skeleton-home-card-container">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-home-card">
          <div className="skeleton-home-image"></div>
        </div>
      ))}
    </div>
  );
};

/**
 * Generic Skeleton Line
 */
export const SkeletonLine = ({ 
  width = '100%', 
  height = '16px', 
  marginBottom = '8px',
  borderRadius = '4px' 
}) => {
  return (
    <div
      className="skeleton-line"
      style={{
        width,
        height,
        marginBottom,
        borderRadius,
      }}
    />
  );
};

export default {
  SkeletonCard,
  SkeletonOrderCard,
  SkeletonTable,
  SkeletonPagination,
  SkeletonList,
  SkeletonGrid,
  SkeletonSearchInput,
  SkeletonButton,
  SkeletonAvatar,
  SkeletonLine,
};
