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
    <>
      <input
        type="text"
        value={searchTerm}
        placeholder={t('Search...')}
        className={className}
        onChange={handleSearchChange}
        style={{ boxSizing: 'border-box' }}
      />
      <style>{`
        .search-input {
          padding: 8px 12px;
          width: 300px;
          border: 1px solid #bababa;
          border-radius: 8px;
          box-shadow: 0 0 0 1px #E5E4E2;
          font-size: 1rem;
          // box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: border 0.2s;
        }
        .search-input:focus {
        border: 1px solid #bababa;
          outline: none;
        }
        @media (max-width: 768px) {
          .search-input {
            width: 120px;
            padding: 8px 10px;
            font-size: 0.98rem;
          }
        }
      `}</style>
    </>
  );
};

export default SearchInput;