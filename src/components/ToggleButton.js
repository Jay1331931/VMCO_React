import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faToggleOff, faToggleOn } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const ToggleButton = ({ isToggled, onToggle }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="toggle-container">
        <label>{t('All')}</label>
        <FontAwesomeIcon
          icon={isToggled ? faToggleOn : faToggleOff}
          className="toggle-icon"
          onClick={onToggle}
          aria-label={isToggled ? t('Switch to All Orders') : t('Switch to My Approvals')}
        />
        <label>{t('My Approval')}</label>
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