import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import usePlatform from "../utilities/platform";

function SearchableDropdown({
  name,
  options,
  value,
  onChange,
  disabled,
  className,
  placeholder,
  style = {},
  branchName = null
}) {
  const allOption = { name: placeholder || "Select", value: null };
  const mergedOptions = options ? [allOption, ...options] : [allOption];
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const dropdownContentRef = useRef(null);
  const { t, i18n } = useTranslation();
  const [dropdownPosition, setDropdownPosition] = useState({});
  const isMobile = usePlatform();
  const inputRef = useRef(null);
  const isBranchDropdown = className?.includes('branch-location-select');
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Position Calculation
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const updatePosition = () => {
        const rect = dropdownRef.current.getBoundingClientRect();
        const dropdownHeight = 250; 
        const isRTL = document.dir === 'rtl' || i18n.language === 'ar';
        
        const spaceAbove = rect.top;
        const spaceBelow = window.innerHeight - rect.bottom;
        
        let topPosition;
        // Logic: If not enough space below, open upward
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          topPosition = rect.top + window.scrollY - dropdownHeight;
        } else {
          topPosition = rect.bottom + window.scrollY;
        }

        let horizontalStyles = {};
        if (isRTL) {
          horizontalStyles = {
            right: window.innerWidth - (rect.right + window.scrollX),
            left: 'auto',
          };
        } else {
          horizontalStyles = {
            left: rect.left + window.scrollX,
            right: 'auto',
          };
        }

        setDropdownPosition({
          position: "absolute",
          top: topPosition,
          width: rect.width,
          maxHeight: `${dropdownHeight}px`,
          // zIndex: 999999,
          ...horizontalStyles
        });
      };

      updatePosition();
      // Recalculate on window resize/scroll for stability
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }
  }, [isOpen, i18n.language]);

  // Handle Option Selection (Fix for iOS selection capture)
  const handleOptionSelect = (e, opt) => {
    // Prevent event from bubbling or triggering background clicks
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const optValue = typeof opt === "object" ? (opt.value !== undefined ? opt.value : opt.employeeId || opt.name) : opt;
    
    // 1. Trigger the change first
    onChange({ target: { name, value: optValue } });
    setSearchTerm("");
    
    // 2. Small delay before closing to ensure the webview processes the state change
    // This fixes the issue where the dropdown closes before the click registers
    setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };

  const handleToggle = (e) => {
    if (disabled) return;
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(!isOpen);
  };

  // Click Outside logic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isOpen) return;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          dropdownContentRef.current && !dropdownContentRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredOptions = mergedOptions.filter((opt) => {
    const optionText = typeof opt === "object" ? opt.name || "" : opt || "";
    return optionText.toLowerCase().includes((searchTerm || "").toLowerCase());
  });

  const selectedOption = mergedOptions.find(opt => {
    const optVal = typeof opt === "object" ? (opt.value !== undefined ? opt.value : opt.employeeId || opt.name) : opt;
    return optVal === value;
  }) || allOption;

  const displayText = t(typeof selectedOption === "object" ? selectedOption.name : selectedOption) || placeholder;

  return (
    <div className={`searchable-dropdown ${className || ''}`} ref={dropdownRef} style={{ position: 'relative' }}>
      <div
        className={`dropdown-header mobile ${isBranchDropdown ? 'branch-dropdown-header' : ''}`}
        onClick={handleToggle}
        style={{
          backgroundColor: disabled ? "#e9ecef" : "white",
          cursor: disabled ? "not-allowed" : "pointer",
          ...style,
          userSelect: 'none'
        }}
      >
        {isBranchDropdown && <FontAwesomeIcon icon={faMapMarkerAlt} className="branch-location-icon" />}
        <span className="selected-value">
          {displayText.charAt(0).toUpperCase() + displayText.slice(1)}
        </span>
        {!isBranchDropdown && <span className="dropdown-arrow">▼</span>}
      </div>

      {isOpen && !disabled && createPortal(
        <>
          {/* Transparent Backdrop to capture clicks outside on mobile/iOS */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              // zIndex: 999998,
              backgroundColor: 'transparent'
            }}
            onClick={() => setIsOpen(false)}
          />
          
          <div
            className={`dropdown-content ${className || ''} ${isIOS ? "ios-dropdown" : ""}`}
            style={{ 
              ...dropdownPosition, 
              display: 'flex', 
              flexDirection: 'column',
              backgroundColor: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderRadius: '4px'
            }}
            ref={dropdownContentRef}
          >
            {/* <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
              <input
                ref={inputRef}
                type="text"
                className="dropdown-search"
                // autoFocus
                placeholder={t("Search...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px', // Prevents iOS auto-zoom
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  WebkitAppearance: 'none'
                }}
              />
            </div> */}
<div
  style={{
    padding: "8px",
    borderBottom: "1px solid #eee",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  }}
>
  <input
    ref={inputRef}
    type="text"
    className="dropdown-search"
    placeholder={t("Search...")}
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    style={{
      flex: 1,
      padding: "10px",
      fontSize: "16px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      WebkitAppearance: "none",
    }}
  />

  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setIsOpen(false); // close dropdown
    }}
    style={{
      padding: "8px 8px",
      fontSize: "14px",
      borderRadius: "4px",
      border: "1px solid #ccc",
      backgroundColor: "#f8f9fa",
      cursor: "pointer",
      whiteSpace: "nowrap",
    }}
  >
    {t("Close")}
  </button>
</div>


            <div 
              className="dropdown-options" 
              style={{ 
                overflowY: 'auto', 
                flex: 1,
                WebkitOverflowScrolling: 'touch' 
              }}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const isOptDisabled = typeof opt === "object" && opt.disabled;
                  const optValue = typeof opt === "object" ? (opt.value !== undefined ? opt.value : opt.employeeId || opt.name) : opt;
                  const isChecked = optValue === (typeof selectedOption === 'object' ? selectedOption.value : selectedOption);

                  return (
                    <div
                      key={idx}
                      className={`dropdown-option ${isOptDisabled ? "disabled" : ""}`}
                      // Use onMouseDown/onClick for iOS stability
                      onClick={(e) => !isOptDisabled && handleOptionSelect(e, opt)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        minHeight: '48px', // Larger touch target
                        cursor: isOptDisabled ? 'not-allowed' : 'pointer',
                        backgroundColor: isChecked ? '#f0f7ff' : 'transparent',
                        opacity: isOptDisabled ? 0.5 : 1,
                        borderBottom: '1px solid #fafafa'
                      }}
                    >
                      <span 
                      // style={{ pointerEvents: 'none' }}
                      >
                        {t(typeof opt === "object" ? opt.name : opt)}
                      </span>
                      {isMobile && (
                        <input
                          type="radio"
                          checked={isChecked}
                          readOnly
                          style={{ accentColor: '#007bff', 
                            // pointerEvents: 'none' 
                          }}
                        />
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                  {t("No matches found")}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      <style jsx="true">{`
        .dropdown-option:active {
          background-color: #e9ecef !important;
        }
        .ios-dropdown {
          -webkit-overflow-scrolling: touch;
        }
        .dropdown-search:focus {
          outline: none;
          border-color: #007bff;
        }
      `}</style>
    </div>
  );
}

export default SearchableDropdown;
