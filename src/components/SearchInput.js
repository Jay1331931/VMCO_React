import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const SearchInput = ({ onSearch, className = 'search-input', debounceTime = 300 }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  const debounce = useCallback((func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }, []);

  const debouncedSearch = useCallback((value) => {
    onSearch && onSearch(value);
  }, [onSearch]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debounce(debouncedSearch, debounceTime)(value);
  };

  return (
    <input
      type="text"
      value={searchTerm}
      placeholder={t('Search...')}
      className={className}
      onChange={handleSearchChange}
    />
  );
};

export default SearchInput;