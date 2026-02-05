import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/transitions.css';

/**
 * PageTransition Component
 * 
 * Wraps page content to provide smooth entrance/exit animations
 * when navigating between routes. Optimized for iOS Capacitor apps.
 * 
 * @param {React.ReactNode} children - The page content to animate
 * @param {string} type - Type of transition: 'fade', 'slide-up', 'slide-right', 'scale', 'flip', 'zoom'
 * @returns {JSX.Element}
 */
const PageTransition = ({ children, type = 'slide-right' }) => {
  const location = useLocation();
  const [isEntering, setIsEntering] = useState(true);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // Reset animation state when location changes
    setIsEntering(false);
    
    // Force layout recalculation for iOS
    if (wrapperRef.current) {
      // Trigger a reflow to ensure iOS applies animations
      void wrapperRef.current.offsetHeight;
    }
    
    const timer = setTimeout(() => {
      setIsEntering(true);
      // Force another reflow after state change
      if (wrapperRef.current) {
        void wrapperRef.current.offsetHeight;
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const transitionClass = `page-${type}-${isEntering ? 'enter' : 'exit'}`;

  return (
    <div 
      ref={wrapperRef}
      className={`page-transition-wrapper ${transitionClass}`}
      style={{
        // Ensure proper rendering in production builds
        willChange: 'opacity, transform',
        WebkitWillChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
};

export default PageTransition;
