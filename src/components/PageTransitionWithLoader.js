import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/transitions.css';

/**
 * PageTransitionWithLoader Component
 * 
 * Enhanced version of PageTransition that gracefully handles
 * skeleton loaders and smooth transition to actual content.
 * 
 * @param {React.ReactNode} children - The page content to animate
 * @param {string} type - Type of transition: 'fade', 'slide-up', 'slide-right', 'scale', 'flip', 'zoom'
 * @param {boolean} isLoading - Whether content is loading (shows skeleton)
 * @returns {JSX.Element}
 */
const PageTransitionWithLoader = ({ children, type = 'slide-right', isLoading = false }) => {
  const location = useLocation();
  const [isEntering, setIsEntering] = useState(true);
  const [displayLoading, setDisplayLoading] = useState(isLoading);

  useEffect(() => {
    // Reset animation state when location changes
    setIsEntering(false);
    setDisplayLoading(true);
    
    const timer = setTimeout(() => {
      setIsEntering(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Handle loading state changes
  useEffect(() => {
    if (!isLoading) {
      // Fade out loading state after a brief delay
      const timer = setTimeout(() => {
        setDisplayLoading(false);
      }, 200);
      return () => clearTimeout(timer);
    }
    setDisplayLoading(true);
  }, [isLoading]);

  const transitionClass = `page-${type}-${isEntering ? 'enter' : 'exit'}`;
  const loaderOpacity = displayLoading ? 1 : 0;

  return (
    <div className={`page-transition-wrapper ${transitionClass}`} style={{ position: 'relative' }}>
      {/* Loader overlay - fades out when content is ready */}
      <div
        style={{
          position: displayLoading ? 'relative' : 'absolute',
          opacity: loaderOpacity,
          transition: 'opacity 0.2s ease-in-out',
          pointerEvents: displayLoading ? 'auto' : 'none',
        }}
      >
        {/* Skeleton loaders go here - passed via children or separate prop */}
      </div>
      
      {/* Content - displays once loading is complete */}
      <div
        style={{
          opacity: displayLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PageTransitionWithLoader;
