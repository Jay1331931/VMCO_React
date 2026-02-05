import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom Hook: usePageTransition
 * 
 * Manages page transition state and provides utilities for controlling
 * entrance/exit animations based on route changes.
 * 
 * @param {string} transitionType - Type of transition ('fade', 'slide-up', etc.)
 * @returns {Object} - { isEntering, transitionClass, pathname }
 */
export const usePageTransition = (transitionType = 'fade') => {
  const location = useLocation();
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    setIsEntering(false);
    
    const timer = setTimeout(() => {
      setIsEntering(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const transitionClass = `page-${transitionType}-${isEntering ? 'enter' : 'exit'}`;

  return {
    isEntering,
    transitionClass,
    pathname: location.pathname,
  };
};

/**
 * Hook to get recommended transition type based on route hierarchy
 * 
 * @param {string} currentRoute - Current route path
 * @param {string} previousRoute - Previous route path
 * @returns {string} - Recommended transition type
 */
export const getTransitionTypeForRoute = (currentRoute, previousRoute) => {
  // Default transition
  let transitionType = 'fade';

  // Customize transitions based on route patterns
  if (currentRoute?.includes('/cart') || currentRoute?.includes('/checkout')) {
    transitionType = 'slide-up';
  } else if (currentRoute?.includes('/details')) {
    transitionType = 'scale';
  } else if (currentRoute?.includes('/payment')) {
    transitionType = 'slide-right';
  }

  return transitionType;
};

/**
 * Hook for managing complex page transitions with timing
 * 
 * @param {number} enterDuration - Entrance animation duration in ms
 * @param {number} exitDuration - Exit animation duration in ms
 * @returns {Object} - Control object for transitions
 */
export const useAdvancedPageTransition = (enterDuration = 400, exitDuration = 300) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setIsTransitioning(true);

      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setIsTransitioning(false);
      }, exitDuration);

      return () => clearTimeout(timer);
    }
  }, [location, displayLocation, exitDuration]);

  return {
    displayLocation,
    isTransitioning,
    currentLocation: location,
  };
};

export default usePageTransition;
