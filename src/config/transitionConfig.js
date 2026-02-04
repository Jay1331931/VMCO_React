/**
 * Page Transition Configuration
 * 
 * Configure different transition types for different routes and sections of the app.
 * Customize animations based on user preferences and device capabilities.
 */

export const TRANSITION_TYPES = {
  FADE: 'fade',
  SLIDE_UP: 'slide-up',
  SLIDE_RIGHT: 'slide-right',
  SCALE: 'scale',
  FLIP: 'flip',
  ZOOM: 'zoom',
};

/**
 * Route-specific transition mappings
 * Define which transition type should be used for specific routes
 */
export const ROUTE_TRANSITIONS = {
  // Auth routes - fade
  // '/login': TRANSITION_TYPES.FADE,
  // '/login/employee': TRANSITION_TYPES.FADE,
  // '/forgotPassword': TRANSITION_TYPES.FADE,
  
  // // Main navigation - slide-right (LTR) / slide-left (RTL)
  // '/orders': TRANSITION_TYPES.SLIDE_RIGHT,
  // '/customers': TRANSITION_TYPES.SLIDE_RIGHT,
  // '/support': TRANSITION_TYPES.SLIDE_RIGHT,
  // '/maintenance': TRANSITION_TYPES.SLIDE_RIGHT,
  // '/catalog': TRANSITION_TYPES.SLIDE_RIGHT,
  // '/home': TRANSITION_TYPES.SLIDE_RIGHT,
  
  // // Detail pages - scale
  // '/orderDetails': TRANSITION_TYPES.SCALE,
  // '/supportDetails': TRANSITION_TYPES.SCALE,
  // '/maintenanceDetails': TRANSITION_TYPES.SCALE,
  // '/customerDetails': TRANSITION_TYPES.SCALE,
  // '/customersDetails': TRANSITION_TYPES.SCALE,
  
  // // Cart and checkout - slide-up
  // '/cart': TRANSITION_TYPES.SLIDE_UP,
  // '/checkout': TRANSITION_TYPES.SLIDE_UP,
  // '/payment': TRANSITION_TYPES.SLIDE_UP,
  
  // // Modals and dialogs - zoom
  // '/bankTransactions': TRANSITION_TYPES.SLIDE_RIGHT,
  // '/bankTransactions/add': TRANSITION_TYPES.ZOOM,
  // '/invite/add': TRANSITION_TYPES.ZOOM,
  // '/customers/registration': TRANSITION_TYPES.SLIDE_UP,
};

/**
 * Get transition type for a given pathname
 * Falls back to default if no specific mapping exists
 * 
 * @param {string} pathname - Current route pathname
 * @param {string} defaultType - Default transition type if no match found
 * @returns {string} - Transition type to use
 */
export const getTransitionForRoute = (pathname, defaultType = TRANSITION_TYPES.SLIDE_UP) => {
  // Check exact route first
  if (ROUTE_TRANSITIONS[pathname]) {
    return ROUTE_TRANSITIONS[pathname];
  }

  // Check prefix matches
  const matchedRoute = Object.keys(ROUTE_TRANSITIONS).find(
    route => pathname.startsWith(route)
  );

  return matchedRoute ? ROUTE_TRANSITIONS[matchedRoute] : defaultType;
};

/**
 * Animation timing configuration
 * Customize animation durations for different scenarios
 */
export const ANIMATION_TIMINGS = {
  FAST: 20000,      // 20s - Quick transitions
  NORMAL: 20000,    // 20s - Standard transitions
  SLOW: 25000,      // 25s - Slow transitions (flip)
  EXIT: 15000,      // 15s - Exit animation duration
};

/**
 * Device-specific animation preferences
 * Adjust timings based on device capabilities
 */
export const DEVICE_ANIMATION_CONFIG = {
  MOBILE: {
    enterDuration: 20000,
    exitDuration: 15000,
    enableAll: true,
  },
  TABLET: {
    enterDuration: 20000,
    exitDuration: 15000,
    enableAll: true,
  },
  DESKTOP: {
    enterDuration: 20000,
    exitDuration: 15000,
    enableAll: true,
  },
};

/**
 * Get animation config based on device width
 * 
 * @returns {Object} - Animation configuration for current device
 */
export const getDeviceAnimationConfig = () => {
  const width = window.innerWidth;

  if (width < 768) {
    return DEVICE_ANIMATION_CONFIG.MOBILE;
  } else if (width < 1024) {
    return DEVICE_ANIMATION_CONFIG.TABLET;
  } else {
    return DEVICE_ANIMATION_CONFIG.DESKTOP;
  }
};

/**
 * Check if user prefers reduced motion
 * Respects accessibility preferences
 * 
 * @returns {boolean} - True if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export default {
  TRANSITION_TYPES,
  ROUTE_TRANSITIONS,
  ANIMATION_TIMINGS,
  DEVICE_ANIMATION_CONFIG,
  getTransitionForRoute,
  getDeviceAnimationConfig,
  prefersReducedMotion,
};
