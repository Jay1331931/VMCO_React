import React, { useRef, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const ActionButton = () => {
  const [isActionMenuOpen, setActionMenuOpen] = useState(false);
  const actionMenuRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setActionMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleActionMenu = () => {
    setActionMenuOpen(!isActionMenuOpen);
  };

  return (
    <div className="action-menu-container" ref={actionMenuRef}>
      <FontAwesomeIcon
        icon={faEllipsisV}
        className="action-menu-icon"
        onClick={toggleActionMenu}
      />
      {isActionMenuOpen && (
        <div className="action-menu">
          <div className="action-menu-item">{t('Export')}</div>
          <div className="action-menu-item">{t('Import')}</div>
          <div className="action-menu-item">{t('Settings')}</div>
        </div>
      )}
    </div>
  );
};

export default ActionButton;