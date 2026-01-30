import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for managing loading states with skeleton support
 * 
 * Usage:
 * const { loading, setLoading, startLoading, stopLoading, error, setError } = useLoading();
 * 
 * // In your API call
 * startLoading();
 * try {
 *   const data = await fetchData();
 *   setData(data);
 * } catch (err) {
 *   setError(err.message);
 * } finally {
 *   stopLoading();
 * }
 */
export const useLoading = (initialState = false, initialError = null) => {
  const [loading, setLoading] = useState(initialState);
  const [error, setError] = useState(initialError);
  const loadingTimeoutRef = useRef(null);

  const startLoading = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setLoading(false);
  }, []);

  const setLoadingWithDelay = useCallback((delay = 300) => {
    loadingTimeoutRef.current = setTimeout(() => {
      startLoading();
    }, delay);
    return () => clearTimeout(loadingTimeoutRef.current);
  }, [startLoading]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    setLoading,
    startLoading,
    stopLoading,
    setLoadingWithDelay,
    error,
    setError,
    clearError,
    hasError: !!error,
  };
};

/**
 * Hook for managing multiple loading states (e.g., different API calls)
 * 
 * Usage:
 * const { isLoading, startLoading, stopLoading } = useMultipleLoading(['orders', 'customers']);
 * startLoading('orders');
 * // ... api call ...
 * stopLoading('orders');
 */
export const useMultipleLoading = (keys = []) => {
  const [loadingStates, setLoadingStates] = useState(
    keys.reduce((acc, key) => ({ ...acc, [key]: false }), {})
  );

  const startLoading = useCallback((key) => {
    setLoadingStates((prev) => ({ ...prev, [key]: true }));
  }, []);

  const stopLoading = useCallback((key) => {
    setLoadingStates((prev) => ({ ...prev, [key]: false }));
  }, []);

  const isLoading = useCallback((key) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some((state) => state);
  }, [loadingStates]);

  const stopAllLoading = useCallback(() => {
    setLoadingStates((prev) =>
      Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {})
    );
  }, []);

  return {
    loadingStates,
    startLoading,
    stopLoading,
    isLoading,
    isAnyLoading,
    stopAllLoading,
  };
};

/**
 * Hook for managing paginated data loading
 * 
 * Usage:
 * const { data, loading, page, pageSize, total, fetchData } = usePaginatedLoading(
 *   async (pageNum, size) => {
 *     const response = await api.get(`/orders?page=${pageNum}&size=${size}`);
 *     return response.data;
 *   }
 * );
 */
export const usePaginatedLoading = (fetchFn) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async (pageNum = 1, size = pageSize) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn(pageNum, size);
      
      setData(result.data || []);
      setTotal(result.total || 0);
      setPage(pageNum);
      setPageSize(size);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, pageSize]);

  const goToPage = useCallback((pageNum) => {
    fetchData(pageNum, pageSize);
  }, [fetchData, pageSize]);

  const changePageSize = useCallback((newSize) => {
    fetchData(1, newSize);
  }, [fetchData]);

  return {
    data,
    setData,
    loading,
    error,
    page,
    pageSize,
    total,
    fetchData,
    goToPage,
    changePageSize,
  };
};

/**
 * Hook for managing debounced API calls (useful for search, filters)
 * 
 * Usage:
 * const { value, loading, triggerSearch } = useDebouncedLoading(
 *   async (searchTerm) => {
 *     const response = await api.get(`/search?q=${searchTerm}`);
 *     return response.data;
 *   },
 *   500
 * );
 */
export const useDebouncedLoading = (fetchFn, delay = 500) => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const debounceTimerRef = useRef(null);

  const triggerSearch = useCallback(
    (searchValue) => {
      setValue(searchValue);
      
      clearTimeout(debounceTimerRef.current);
      
      if (!searchValue.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const result = await fetchFn(searchValue);
          setResults(result);
        } catch (err) {
          setError(err.message || 'Search failed');
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, delay);
    },
    [fetchFn, delay]
  );

  return {
    value,
    loading,
    error,
    results,
    triggerSearch,
  };
};

export default useLoading;
