import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faToggleOff, faToggleOn } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const ToggleButton = ({ 
  isToggled, 
  onToggle, 
  leftLabel, 
  rightLabel, 
  leftLabelKey = 'All', 
  rightLabelKey = 'My Items' 
}) => {
  const { t } = useTranslation();

  // Use provided labels or fall back to translation keys
  const displayLeftLabel = leftLabel || t(leftLabelKey);
  const displayRightLabel = rightLabel || t(rightLabelKey);

  return (
    <>
      <div className="toggle-container">
        <label>{displayLeftLabel}</label>
        <FontAwesomeIcon
          icon={isToggled ? faToggleOn : faToggleOff}
          className="toggle-icon"
          onClick={onToggle}
          aria-label={isToggled ? t(`Switch to ${displayLeftLabel}`) : t(`Switch to ${displayRightLabel}`)}
        />
        <label>{displayRightLabel}</label>
      </div>
      <style>{`
        .toggle-container {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 10px 0;
        }
        .toggle-icon {
          font-size: 2.1rem;
          color: #0a5640;
          cursor: pointer;
          transition: color 0.2s;
        }
        .toggle-icon:hover {
          color: #084c37;
        }
        .toggle-container label {
          font-size: 1rem;
          color: #222;
          font-weight: 500;
        }
        @media (max-width: 768px) {
          .toggle-icon {
            font-size: 1.5rem;
          }
          .toggle-container label {
            font-size: 0.95rem;
          }
        }
      `}</style>
    </>
  );
};

export default ToggleButton;