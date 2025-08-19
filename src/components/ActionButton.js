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

      <style>{`
        .action-menu-container {
          align-self: right;
          justify-self: flex-end;
          padding: 5px;
          position: relative;
          cursor: pointer;
        }
        [dir="rtl"] .action-menu-container {
          position: relative;
          align-self: center;
          margin-right: 0;
          margin-left: 20px;
        }
        .action-menu {
          top: 100%;
          right: 0;
          min-width: 200px;
          position: absolute;
          background-color: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.45);
          z-index: 100;
        }
        [dir="rtl"] .action-menu {
          right: auto;
          left: 0;
        }
        .action-menu-item {
          padding: 12px 16px;
          min-width: 100%;
          font-size: 1rem;
          cursor: pointer;
          font-size: 0.9rem;
          color: #333;
          transition: background 0.2s;
        }
        .action-menu-item:hover {
          background-color: #f9f9f9;
        }
        @media (max-width: 768px) {
          .action-menu-container {
            padding: 5px;
          }
          .action-menu {
            width: 160px;
            min-width: 160px;
          }
          .action-menu-item {
            padding: 12px 16px;
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ActionButton;