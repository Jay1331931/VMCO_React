import React, { useRef, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const ActionButton = ({ menuItems = [] }) => {
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
          {menuItems.map((item, idx) => (
            <div
              className="action-menu-item"
              key={item.key || idx}
              onClick={() => {
                setActionMenuOpen(false);
                item.onClick && item.onClick();
              }}
            >
              {t(item.label)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionButton;