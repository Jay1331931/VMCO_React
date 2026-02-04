import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/transitions.css';

/**
 * PageTransition Component
 * 
 * Wraps page content to provide smooth entrance/exit animations
 * when navigating between routes.
 * 
 * @param {React.ReactNode} children - The page content to animate
 * @param {string} type - Type of transition: 'fade', 'slide-up', 'slide-right', 'scale', 'flip', 'zoom'
 * @returns {JSX.Element}
 */
const PageTransition = ({ children, type = 'slide-right' }) => {
  const location = useLocation();
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    // Reset animation state when location changes
    setIsEntering(false);
    
    const timer = setTimeout(() => {
      setIsEntering(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const transitionClass = `page-${type}-${isEntering ? 'enter' : 'exit'}`;

  return (
    <div className={`page-transition-wrapper ${transitionClass}`}>
      {children}
    </div>
  );
};

export default PageTransition;
