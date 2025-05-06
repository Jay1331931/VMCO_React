import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faToggleOff, faToggleOn } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const ToggleButton = ({ isToggled, onToggle }) => {
  const { t } = useTranslation();

  return (
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
  );
};

export default ToggleButton;