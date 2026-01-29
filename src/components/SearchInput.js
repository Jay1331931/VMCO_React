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

  // Add focus/blur handlers to detect keyboard
  const handleFocus = () => {
    // Optionally notify parent about keyboard state
    if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
  };

  const handleBlur = () => {
    if (window.innerWidth <= 768) {
      document.body.classList.remove('keyboard-open');
    }
  };
const handleKeyDown = (e) => {
    // These keys indicate user is done with keyboard
    if (e.key === 'Enter' || e.key === 'Go' || e.key === 'Search' || e.key === 'Done' ) {
      if (window.innerWidth <= 768) {
        // Blur the input to close keyboard
        e.target.blur();
        // Remove keyboard class immediately
        document.body.classList.remove('keyboard-open');
      }
    }
  };
  return (
    <>
      <input
        type="text"
        value={searchTerm}
        placeholder={t('Search...')}
        className={className}
        onChange={handleSearchChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{ boxSizing: 'border-box' }}
        inputMode="search" 
      enterKeyHint="search"
      />
      <style>{`
        .search-input {
          padding: 8px 12px;
          width: 300px;
          border: 1px solid #bababa;
          border-radius: 8px;
          box-shadow: 0 0 0 1px #E5E4E2;
          font-size: 1rem;
          transition: border 0.2s;
          position: relative;
          z-index: 10; /* Ensure it's above other elements */
        }
        
        .search-input:focus {
          border: 1px solid #bababa;
          outline: none;
        }
        
        /* When keyboard is open on mobile */
        body.keyboard-open .mobile-bottom-menu {
          display: none !important;
        }
        
        @media (max-width: 768px) {
          .search-input {
            width: 100%;
            padding: 8px 10px;
            font-size: 0.98rem;
            position: relative;
            z-index: 1000; /* Higher z-index for mobile */
          }
          
          /* Special handling for Samsung devices */
          @media (max-height: 500px) {
            .search-input {
              z-index: 9999;
            }
          }
        }
        
        /* Android/Samsung specific fixes */
        @supports (-webkit-touch-callout: none) {
          .search-input:focus {
            position: relative;
            z-index: 9998;
          }
        }
      `}</style>
    </>
  );
};

export default SearchInput;