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
  openUpwards = false,
  branchName = null
}) {
  const allOption = { name: placeholder || "Select", value: null };
  const mergedOptions = options ? [allOption, ...options] : [allOption];
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const { t, i18n } = useTranslation();
  const [dropdownPosition, setDropdownPosition] = useState({});
  const isMobile = usePlatform();
  const inputRef = useRef(null);
  const isBranchDropdown = className?.includes('branch-location-select');

  // Handle Scroll to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (e) => {
      const dropdownEl = document.querySelector(".dropdown-content");
      if (dropdownEl && dropdownEl.contains(e.target)) return;
      setIsOpen(false);
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isOpen]);

  // Position Calculation Fix
// Position Calculation Fix
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const dropdownHeight = 200; 
      const isRTL = document.dir === 'rtl' || i18n.language === 'ar';
      
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      let topPosition;
      let actualOpenUpward = false;

      // Vertical Logic
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        topPosition = rect.top + window.scrollY - dropdownHeight;
        actualOpenUpward = true;
      } else {
        topPosition = rect.bottom + window.scrollY;
      }

      topPosition = Math.max(window.scrollY, topPosition);

      // Horizontal Positioning Logic
      let horizontalStyles = {};
      if (isRTL) {
        // Aligns the right edge of the dropdown with the right edge of the input
        const rightOffset = window.innerWidth - (rect.right + window.scrollX);
        horizontalStyles = {
          right: rightOffset,
          left: 'auto', // Ensure left doesn't interfere
          direction: 'rtl'
        };
      } else {
        // Standard English/LTR alignment
        horizontalStyles = {
          left: rect.left + window.scrollX,
          right: 'auto',
          direction: 'ltr'
        };
      }

      let  position={
        position: "absolute",
        top: topPosition,
        width: rect.width,
        maxHeight: `${dropdownHeight}px`,
        zIndex: 9999,
        ...horizontalStyles // Inject RTL or LTR styles
      };
      // if(actualOpenUpward){
      //   position.bottom=0
      // }
      setDropdownPosition(position)
      

      const dropdownContent = document.querySelector('.dropdown-content');
      if (dropdownContent) {
        dropdownContent.classList.toggle('open-upwards', actualOpenUpward);
      }
    }
  }, [isOpen, i18n.language]);

  // Click Outside logic
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          !event.target.closest(".dropdown-content")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = mergedOptions.filter((opt) => {
    const optionText = typeof opt === "object" ? opt.name || "" : opt || "";
    return optionText.toLowerCase().includes((searchTerm || "").toLowerCase());
  });

  const handleOptionSelect = (opt) => {
    const optValue = typeof opt === "object" ? (opt.value !== undefined ? opt.value : opt.employeeId || opt.name) : opt;
    setIsOpen(false);
    setSearchTerm("");
    onChange({ target: { name, value: optValue } });
  };

  const truncateText = (text, maxLength = 30) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const selectedOption = mergedOptions.find(opt => {
    const optVal = typeof opt === "object" ? (opt.value !== undefined ? opt.value : opt.employeeId || opt.name) : opt;
    return optVal?.toLowerCase() === value?.toLowerCase();
  }) || allOption;

  const displayText = t(typeof selectedOption === "object" ? selectedOption.name : selectedOption) || placeholder;

  return (
    <div className={`searchable-dropdown ${className || ''}`} ref={dropdownRef} style={{ position: 'relative' }}>
      <div
        className={`dropdown-header ${isBranchDropdown ? 'branch-dropdown-header' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          backgroundColor: disabled ? "#e9ecef" : "white",
          cursor: disabled ? "not-allowed" : "pointer",
          ...style,
        }}
      >
        {isBranchDropdown && <FontAwesomeIcon icon={faMapMarkerAlt} className="branch-location-icon" />}
        <span className="selected-value">
          {truncateText(displayText.charAt(0).toUpperCase() + displayText.slice(1), 30)}
        </span>
        {!isBranchDropdown && <span className="dropdown-arrow">▼</span>}
      </div>

      {isOpen && !disabled && createPortal(
        <div
          className={`dropdown-content ${className || ''} ${isMobile ? "mobile" : ""}`}
          style={{ ...dropdownPosition,  flexDirection: 'column' }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            type="text"
            className="dropdown-search"
            placeholder={t("Search...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />

          <div className="dropdown-options" style={{ overflowY: 'auto', flex: 1 }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isOptDisabled = typeof opt === "object" && opt.disabled;
                const optValue = typeof opt === "object" ? (opt.value !== undefined ? opt.value : opt.employeeId || opt.name) : opt;
                const isChecked = optValue === (typeof selectedOption === 'object' ? selectedOption.value : selectedOption);

                return (
                  <div
                    key={idx}
                    className={`dropdown-option ${isOptDisabled ? "disabled" : ""}`}
                    onClick={() => !isOptDisabled && handleOptionSelect(opt)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: isOptDisabled ? "#eae9e9ff" : "transparent"
                    }}
                  >
                    <span>
                      {t(typeof opt === "object" ? opt.name : opt)}
                    </span>
                    {isMobile && (
                      <input
                        type="radio"
                        checked={isChecked}
                        readOnly
                        style={{ accentColor: '#007bff' }}
                      />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="no-options">{t("No matches found")}</div>
            )}
          </div>
        </div>,
        document.body
      )}

      <style>
        {`/* Apply this to your dropdown-content class */
.dropdown-content {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  padding:10px;
}

/* Ensure internal text follows the direction */
.dropdown-content[style*="direction: rtl"] {
  text-align: right;
}

.dropdown-content[style*="direction: ltr"] {
  text-align: left;
}

.dropdown-search {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: none;
  border-bottom: 1px solid #eee;
}

/* Fix for the scrollbar appearing on the wrong side in RTL */
.dropdown-options {
  overflow-y: auto;
  scrollbar-gutter: stable;
}`}
      </style>
    </div>
  );
}

export default SearchableDropdown;