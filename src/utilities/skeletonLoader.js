/**
 * Skeleton Loader Utility
 * Detects component type and returns appropriate skeleton configuration
 */

export const SKELETON_TYPES = {
  CARD: 'card',
  TABLE: 'table',
  PAGINATION: 'pagination',
  LIST: 'list',
  GRID: 'grid',
  SEARCH_INPUT: 'search_input',
  BUTTON: 'button',
  AVATAR: 'avatar',
  DEFAULT: 'default',
};

/**
 * Analyzes component structure to determine skeleton type
 * @param {HTMLElement} containerRef - Reference to the container element
 * @param {string} hint - Optional hint about the component type
 * @returns {string} - Skeleton type
 */
export const detectSkeletonType = (containerRef, hint = '') => {
  if (!containerRef) return SKELETON_TYPES.DEFAULT;

  const classList = containerRef.className || '';
  const innerHTML = containerRef.innerHTML || '';

  // Check for specific class patterns
  if (classList.includes('table') || innerHTML.includes('<table')) {
    return SKELETON_TYPES.TABLE;
  }
  if (classList.includes('card') || classList.includes('order-card')) {
    return SKELETON_TYPES.CARD;
  }
  if (classList.includes('pagination')) {
    return SKELETON_TYPES.PAGINATION;
  }
  if (classList.includes('grid') || classList.includes('product-grid')) {
    return SKELETON_TYPES.GRID;
  }
  if (classList.includes('list')) {
    return SKELETON_TYPES.LIST;
  }
  if (classList.includes('search') || classList.includes('input-field')) {
    return SKELETON_TYPES.SEARCH_INPUT;
  }

  // Check for hint
  if (hint) {
    return hint;
  }

  return SKELETON_TYPES.DEFAULT;
};

/**
 * Get skeleton configuration based on type
 * @param {string} type - Skeleton type
 * @param {object} options - Additional options
 * @returns {object} - Skeleton configuration
 */
export const getSkeletonConfig = (type, options = {}) => {
  const configs = {
    [SKELETON_TYPES.CARD]: {
      count: options.count || 4,
      height: options.height || 280,
      lines: [
        { height: '16px', width: '60%', marginBottom: '12px' },
        { height: '14px', width: '100%', marginBottom: '8px' },
        { height: '14px', width: '85%', marginBottom: '16px' },
        { height: '12px', width: '40%' },
      ],
    },
    [SKELETON_TYPES.TABLE]: {
      rows: options.rows || 8,
      columns: options.columns || 5,
      height: options.height || 60,
    },
    [SKELETON_TYPES.PAGINATION]: {
      count: options.count || 1,
      height: options.height || 40,
    },
    [SKELETON_TYPES.GRID]: {
      count: options.count || 6,
      height: options.height || 200,
    },
    [SKELETON_TYPES.LIST]: {
      count: options.count || 5,
      height: options.height || 80,
      lines: [
        { height: '16px', width: '70%', marginBottom: '8px' },
        { height: '12px', width: '50%', marginBottom: '8px' },
      ],
    },
    [SKELETON_TYPES.SEARCH_INPUT]: {
      count: options.count || 1,
      height: options.height || 44,
    },
    [SKELETON_TYPES.DEFAULT]: {
      count: options.count || 3,
      height: options.height || 100,
      lines: [
        { height: '16px', width: '80%', marginBottom: '12px' },
        { height: '14px', width: '100%', marginBottom: '8px' },
        { height: '12px', width: '60%' },
      ],
    },
  };

  return configs[type] || configs[SKELETON_TYPES.DEFAULT];
};

/**
 * Calculate grid columns based on window width
 * @returns {number} - Number of columns
 */
export const getGridColumns = () => {
  const width = window.innerWidth;
  if (width < 640) return 1;
  if (width < 1024) return 2;
  if (width < 1280) return 3;
  return 4;
};
