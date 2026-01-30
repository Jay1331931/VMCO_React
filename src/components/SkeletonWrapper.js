import React, { useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import LoadingSpinner from './LoadingSpinner';
import { detectSkeletonType, getSkeletonConfig } from '../utilities/skeletonLoader';
import {
  SkeletonCard,
  SkeletonOrderCard,
  SkeletonMobileCard,
  SkeletonHomeCard,
  SkeletonTable,
  SkeletonPagination,
  SkeletonList,
  SkeletonGrid,
  SkeletonSearchInput,
} from './SkeletonLoaders';
import '../styles/skeleton-loader.css';

/**
 * SkeletonWrapper Component
 * Automatically detects content type and displays appropriate skeleton loader
 * 
 * Usage:
 * <SkeletonWrapper loading={isLoading} type="card" count={4}>
 *   <YourContent />
 * </SkeletonWrapper>
 * 
 * OR auto-detect:
 * <SkeletonWrapper loading={isLoading}>
 *   <div className="card">
 *     <YourContent />
 *   </div>
 * </SkeletonWrapper>
 */
const SkeletonWrapper = ({
  loading = false,
  children,
  type = null,
  count = null,
  rows = null,
  columns = null,
  height = null,
  className = '',
  style = {},
  showOverlay = false,
  autoDetect = true,
}) => {
  const containerRef = useRef(null);
  const [detectedType, setDetectedType] = React.useState(type);

  useEffect(() => {
    if (autoDetect && !type && containerRef.current && !loading) {
      const detected = detectSkeletonType(containerRef.current);
      setDetectedType(detected);
    }
  }, [autoDetect, type, loading]);

  const skeletonType = detectedType || type;

  const getSkeleton = () => {
    // Use LoadingSpinner for iOS/Capacitor as fallback since CSS animations may not work properly
    // if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
    //   return <LoadingSpinner />;
    // }

    const config = getSkeletonConfig(skeletonType, {
      count: count || undefined,
      rows: rows || undefined,
      columns: columns || undefined,
      height: height || undefined,
    });

    switch (skeletonType) {
      case 'card':
        return <SkeletonCard count={config.count} height={config.height} />;
      case 'order_card':
        return <SkeletonOrderCard count={config.count} />;
      case 'mobile_card':
        return <SkeletonMobileCard count={config.count} />;
      case 'home_card':
        return <SkeletonHomeCard count={config.count} />;
      case 'table':
        return <SkeletonTable rows={config.rows} columns={config.columns} height={config.height} />;
      case 'pagination':
        return <SkeletonPagination height={config.height} />;
      case 'list':
        return <SkeletonList count={config.count} height={config.height} />;
      case 'grid':
        return <SkeletonGrid count={config.count} columns={columns || 3} height={config.height} />;
      case 'search_input':
        return <SkeletonSearchInput height={config.height} />;
      default:
        return <SkeletonCard count={config.count} height={config.height} />;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`skeleton-loading-container ${className}`}
      style={style}
    >
      {loading && !showOverlay ? (
        getSkeleton()
      ) : loading && showOverlay ? (
        <>
          <div style={{ opacity: 0.5 }}>{children}</div>
          <div className="skeleton-loading-overlay">{getSkeleton()}</div>
        </>
      ) : (
        children
      )}
    </div>
  );
};

export default SkeletonWrapper;
