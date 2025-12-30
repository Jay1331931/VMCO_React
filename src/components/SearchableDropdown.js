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
  placeholder = "Value",
  style = {},
  openUpwards = false,
  branchName=null
}) {
  const allOption = { name: branchName || "Select", value: value || null };
  const mergedOptions = options ? [allOption, ...options] : [allOption];
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const { t, i18n } = useTranslation();
  const [dropdownPosition, setDropdownPosition] = useState({});
  const isMobile = usePlatform();
  const inputRef = useRef(null);
  const isBranchDropdown = className?.includes('branch-location-select');

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (e) => {
      const dropdownEl = document.querySelector(".dropdown-content");

      // If scroll happens inside dropdown, do NOT close it
      if (dropdownEl && dropdownEl.contains(e.target)) return;

      // Otherwise close the dropdown
      setIsOpen(false);
    };

    // Use capture to detect scroll from all parents
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  useEffect(() => {
  if (isOpen && dropdownRef.current) {
    const rect = dropdownRef.current.getBoundingClientRect();
    const dropdownHeight = 200; // estimate dropdown height
    
    // Calculate available space
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    
    let topPosition;
    let openUpward = false;
    
    // Check if we should open upwards
    // If there's not enough space below AND there's more space above
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      // Open upwards - position above the trigger
      topPosition = rect.top + window.scrollY - dropdownHeight;
      openUpward = true;
    } else {
      // Open downwards - position below the trigger
      topPosition = rect.bottom + window.scrollY;
      openUpward = false;
    }
    
    // Ensure dropdown doesn't go above the viewport
    if (topPosition < window.scrollY) {
      topPosition = window.scrollY;
    }
    
    // Ensure dropdown doesn't go below the viewport
    const maxBottom = window.scrollY + window.innerHeight;
    const dropdownBottom = topPosition + dropdownHeight;
    if (dropdownBottom > maxBottom) {
      topPosition = maxBottom - dropdownHeight;
    }
    
    setDropdownPosition({
      position: "absolute",
      top: topPosition,
      left: rect.left + window.scrollX,
      width: rect.width,
      zIndex: 9999,
    });
    
    // Add class for upward opening if needed
    const dropdownContent = document.querySelector('.dropdown-content');
    if (dropdownContent) {
      if (openUpward) {
        dropdownContent.classList.add('open-upwards');
      } else {
        dropdownContent.classList.remove('open-upwards');
      }
    }
  }
}, [isOpen, openUpwards]);

  useEffect(() => {
    //  Only focus on desktop
    if (!isMobile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobile]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const triggerEl = dropdownRef.current;
      const clickedInsideTrigger = triggerEl && triggerEl.contains(event.target);
      const clickedInsidePortal = event.target.closest(".dropdown-content");

      if (!clickedInsideTrigger && !clickedInsidePortal) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = mergedOptions.filter((opt) => {
    const optionText =
      typeof opt === "object" ? opt.name || opt.label || "" : opt || "";
    return optionText.toLowerCase().includes((searchTerm || "").toLowerCase());
  });

  // Handle option selection
  const handleOptionSelect = (opt) => {
    let optValue;
    if (typeof opt === "object") {
      if (Object.prototype.hasOwnProperty.call(opt, "value")) {
        optValue = opt.value;
      } else {
        optValue = opt.employeeId || opt.name;
      }
    } else {
      optValue = opt;
    }
    setIsOpen(false);
    setSearchTerm("");
    onChange({
      target: {
        name: name,
        value: optValue,
      },
    });
  };

  const truncateText = (text, maxLength = 30) => {
    if (!text) return text;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Find display text for current value
  let selectedOption;
  if (value == null) {
    selectedOption = allOption;
  } else {
    selectedOption = mergedOptions.find(
      (opt) =>
        (typeof opt === "object"
          ? opt.employeeId || opt.value || opt.name
          : opt) === value
    );
  }
  const displayText = selectedOption
    ? typeof selectedOption === "object"
      ? t(selectedOption.name)
      : t(selectedOption)
    : placeholder;

  return (
    <div className={`searchable-dropdown ${className || ''}`} ref={dropdownRef}>
      <div
        className={`dropdown-header ${isBranchDropdown ? 'branch-dropdown-header' : ''}`}
        onClick={() => {
          if (disabled) return;

          if (!isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setDropdownPosition({
              position: "absolute",
              top: rect.bottom + window.scrollY,
              left: rect.left + window.scrollX,
              width: rect.width,
              zIndex: 9999,
            });
          }

          setIsOpen(!isOpen);
        }}
        tabIndex={disabled ? -1 : 0}
        style={{
          ...(disabled
            ? { backgroundColor: "#e9ecef", cursor: "not-allowed" }
            : {}),
          ...style,
        }}
      >
        {isBranchDropdown && (
          <FontAwesomeIcon
            icon={faMapMarkerAlt}
            className="branch-location-icon"
          />
        )}
        <span className="selected-value">
          {truncateText(displayText.charAt(0).toUpperCase() + displayText.slice(1), 30)}
        </span>
        {!isBranchDropdown && <span className="dropdown-arrow">▼</span>}
      </div>

      {isOpen && !disabled && createPortal(
        <div
          className={`dropdown-content ${className || isMobile ? "mobile" : ""}`}
          style={dropdownPosition}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            type="text"
            className="dropdown-search"
            placeholder={t("Search...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            autoFocus={window.innerWidth > 768}
          />

          <div className="dropdown-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isOptDisabled = typeof opt === "object" && opt.disabled;

  const optValue =
    typeof opt === "object"
      ? opt.employeeId || opt.value || opt.name
      : opt;

  const selectedValue =
    typeof selectedOption === "object"
      ? selectedOption.employeeId || selectedOption.value || selectedOption.name
      : selectedOption;

  const isChecked = optValue === selectedValue;
                return (
                  <div
                    key={idx}
                    className={`dropdown-option${isOptDisabled ? " disabled" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isOptDisabled) handleOptionSelect(opt);
                    }}
                    style={
                      isOptDisabled
                        ? {
                          color: "#aaa",
                          cursor: "not-allowed",
                          background: "#eae9e9ff",
                        }
                        : {}
                    }
                    aria-disabled={isOptDisabled}
                  >
                    {i18n.language === "en"
                      ? typeof opt === "object"
                        ? truncateText(opt?.name.charAt(0).toUpperCase() + opt?.name.slice(1),40)
                        : truncateText(opt?.charAt(0).toUpperCase() + opt?.slice(1),30)
                      : typeof opt === "object"
                        ? truncateText(opt?.name,30)
                        : truncateText(opt,30)}
                         {/* ✅ Radio Button */}
                         { isMobile &&  <div style={{ float: "right" , color: isChecked ? '#007bff' : '#ccc'}}>
          <input
            type="radio"
            checked={isChecked}
            disabled={isOptDisabled}
            onChange={() => !isOptDisabled && handleOptionSelect(opt)}
            onClick={(e) => e.stopPropagation()}
          />  
          </div>}
                        
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

  
    </div>
  );
}

export default SearchableDropdown;
