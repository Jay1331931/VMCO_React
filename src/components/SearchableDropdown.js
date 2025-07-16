import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";



function SearchableDropdown({
  name,
  options,
  value,
  onChange,
  disabled,
  className,
  placeholder = "Value",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const { t, i18n } = useTranslation(); 

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get filtered options based on search term
  const filteredOptions = options
    ? options.filter((opt) => {
        const optionText = typeof opt === "object" ? (opt.name || opt.label || "") : (opt || "");
        return optionText.toLowerCase().includes((searchTerm || "").toLowerCase());
      })
    : [];

  // Handle option selection
  const handleOptionSelect = (opt) => {
    const optValue = typeof opt === "object" ? opt.employeeId || opt.value || opt.name : opt;
    setIsOpen(false);
    setSearchTerm("");
    onChange({
      target: {
        name: name,
        value: optValue,
      },
    });
  };

  // Find display text for current value
  const selectedOption = options?.find(
    (opt) => (typeof opt === "object" ? opt.employeeId || opt.value || opt.name : opt) === value
  );
  const displayText = selectedOption
    ? typeof selectedOption === "object"
      ? selectedOption.name
      : selectedOption
    : placeholder;

  return (
    <div className={`searchable-dropdown `} ref={dropdownRef} >
      <div
        className={`dropdown-header ${className || ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        style={
          disabled
            ? { backgroundColor: "#e9ecef", cursor: "not-allowed" }
            : {}
        }
      >
        <span className="selected-value">{displayText}</span>
        <span className="dropdown-arrow">▼</span>
      </div>

      {isOpen && !disabled && (
        <div className="dropdown-content">
          <input
            type="text"
            className="dropdown-search"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />

          <div className="dropdown-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isOptDisabled = typeof opt === 'object' && opt.disabled;
                return (
                  <div
                    key={idx}
                    className={`dropdown-option${isOptDisabled ? ' disabled' : ''}`}
                    onClick={() => {
                      if (!isOptDisabled) handleOptionSelect(opt);
                    }}
                    style={isOptDisabled ? { color: '#aaa', cursor: 'not-allowed', background: '#eae9e9ff' } : {}}
                    aria-disabled={isOptDisabled}
                  >
                    {typeof opt === "object" ? t(opt.name) : t(opt)}
                  </div>
                );
              })
            ) : (
              <div className="no-options">{t("No matches found")}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableDropdown;
