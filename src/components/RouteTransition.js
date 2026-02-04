import React from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/transitions.css';

/**
 * RouteTransition Component
 * 
 * Higher-order component that wraps Routes to apply page transitions.
 * This component manages the animation state based on route changes.
 * 
 * @param {React.ReactNode} children - Route elements
 * @param {string} transitionType - Type of transition animation
 * @returns {JSX.Element}
 */
const RouteTransition = ({ children, transitionType = 'fade' }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = React.useState(location);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  React.useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setIsTransitioning(true);
      
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setIsTransitioning(false);
      }, 200); // Half of animation duration

      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  const transitionClass = isTransitioning 
    ? `page-${transitionType}-exit`
    : `page-${transitionType}-enter`;

  return (
    <div key={displayLocation.pathname} className={`page-transition-wrapper ${transitionClass}`}>
      {children}
    </div>
  );
};

export default RouteTransition;
