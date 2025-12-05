import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createPortal} from "react-dom";
function SearchableDropdown({
  name,
  options,
  value,
  onChange,
  disabled,
  className,
  placeholder = "Value",
  style = {},
}) {
  // Add default 'All' option at the top
  const allOption = { name: "Select", value: null };
  const mergedOptions = options ? [allOption, ...options] : [allOption];
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const { t, i18n } = useTranslation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [dropdownPosition, setDropdownPosition] = useState({});

const inputRef = useRef(null);
useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        console.log("isMobile", isMobile);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    useEffect(() => {
  if (isOpen && dropdownRef.current) {
    const rect = dropdownRef.current.getBoundingClientRect();

    setDropdownPosition({
      position: "absolute",
      top: rect.bottom + window.scrollY,  // just below header
      left: rect.left + window.scrollX,
      width: rect.width,                  // same width as header
      zIndex: 9999,
    });
  }
}, [isOpen]);

  useEffect(() => {
    // ✅ Only focus on desktop
    if (!isMobile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobile]);
  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
  //       setIsOpen(false);
  //     }
  //   };

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => document.removeEventListener("mousedown", handleClickOutside);
  // }, []);
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
  // Get filtered options based on search term
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
    <div className={`searchable-dropdown `} ref={dropdownRef}>
      <div
        className={`dropdown-header ${className || ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        style={{
          ...(disabled
            ? { backgroundColor: "#e9ecef", cursor: "not-allowed" }
            : {}),
          ...style,
        }}
      >
        <span className="selected-value">{displayText.charAt(0).toUpperCase() + displayText.slice(1)}</span>
        <span className="dropdown-arrow">▼</span>
      </div>

      {isOpen && !disabled &&  createPortal(
    <div
  className={`dropdown-content ${className || ""}`}
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
            return (
              <div
                key={idx}
                className={`dropdown-option${isOptDisabled ? " disabled" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();          // 👈 stop bubbling
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
                    ? opt?.name.charAt(0).toUpperCase() + opt?.name.slice(1)
                    : opt?.charAt(0).toUpperCase() + opt?.slice(1)
                  : typeof opt === "object"
                  ? opt?.name
                  : opt}
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
