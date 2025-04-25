import React, { useEffect, useState } from 'react';
import '../styles/template.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../i18n';
import { useTranslation } from 'react-i18next';

import {
  faChevronLeft,
  faChevronRight,
  faBars,
  faLocationDot,
  faHouse,
  faBookOpen,
  faShoppingCart,
  faUsers,
  faHeadset,
  faTools,
  faBuilding,
  faCog,
  faUser,
  faSignOutAlt,
  faLanguage
} from '@fortawesome/free-solid-svg-icons';

function Template() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth > 768);
  const [isSidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Customers");
  const { t, i18n } = useTranslation();

  const isRTL = i18n.language === 'ar';

  const toggleLanguage = () => {
    const newLang = isRTL ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.body.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    document.body.dir = isRTL ? 'rtl' : 'ltr';

    const handleClickOutside = (event) => {
      if (window.innerWidth <= 768 && !event.target.closest('.sidebar') && !event.target.closest('#mobileMenuBtn')) {
        setSidebarExpanded(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isRTL]);

  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);
  const handleMobileToggle = () => {
    setSidebarCollapsed(false);
    setSidebarExpanded(!isSidebarExpanded);
  };

  const handleMenuClick = (label) => {
    setActiveMenu(label);
    if (window.innerWidth <= 768) setSidebarExpanded(false);
  };

  const menuItems = [
    { icon: faHouse, label: 'Dashboard' },
    { icon: faBookOpen, label: 'Catalog' },
    { icon: faShoppingCart, label: 'Orders' },
    { icon: faUsers, label: 'Customers' },
    { icon: faHeadset, label: 'Support' },
    { icon: faTools, label: 'Maintenance Support' },
    { icon: faBuilding, label: 'Company Profile' },
    { icon: faCog, label: 'Settings' },
  ];

  const sidebarOffset = isSidebarCollapsed ? '70px' : '240px';

  return (
    <div className={`app ${isRTL ? 'rtl' : ''}`}>
      <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isSidebarExpanded ? 'expanded' : ''}`}>
        <div className="sidebar-header">
          <FontAwesomeIcon icon={faLocationDot} size="xl" />
          <h1>{t('Talab Point')}</h1>
        </div>

        <div className="sidebar-menu">
          <div className="main-menu-items">
            {menuItems.slice(0, 6).map(({ icon, label }) => (
              <div
                key={label}
                className={`menu-item ${activeMenu === label ? 'active' : ''}`}
                onClick={() => handleMenuClick(label)}
              >
                <FontAwesomeIcon icon={icon} />
                <span>{t(label)}</span>
              </div>
            ))}
          </div>
          <div className="bottom-menu-section">
            {menuItems.slice(6).map(({ icon, label }) => (
              <div
                key={label}
                className={`menu-item ${activeMenu === label ? 'active' : ''}`}
                onClick={() => handleMenuClick(label)}
              >
                <FontAwesomeIcon icon={icon} />
                <span>{t(label)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-info">
              <div className="user-details">
                <div className="user-avatar">
                  <FontAwesomeIcon icon={faUser} />
                </div>
                <div className="user-text">
                  <div className="user-name">{t('Customer')}</div>
                  <div className="user-email">{t('customer@consumer')}</div>
                </div>
              </div>
              <div className="logout-icon" onClick={() => alert('Logging out...')}>
                <FontAwesomeIcon icon={faSignOutAlt} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="toggle-btn-container"
        style={
          isRTL ? { right: sidebarOffset, left: 'auto' } : { left: sidebarOffset, right: 'auto' }
        }
      >
        <div className="toggle-btn" id="toggleBtn" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={isSidebarCollapsed ? (isRTL ? faChevronLeft : faChevronRight) : (isRTL ? faChevronRight : faChevronLeft)} />
        </div>
      </div>

      <div
        className="main-content"
        style={
          window.innerWidth <= 768
            ? {}
            : isRTL
              ? { marginRight: sidebarOffset, marginLeft: 0 }
              : { marginLeft: sidebarOffset, marginRight: 0 }
        }
      >
        <header className="header">
          <button className="mobile-menu-btn" id="mobileMenuBtn" onClick={handleMobileToggle}>
            <FontAwesomeIcon icon={faBars} />
          </button>
          <div className="header-title">{t(activeMenu)}</div>
          <button className="lang-switch-btn" onClick={toggleLanguage}>
            <FontAwesomeIcon icon={faLanguage} />
            <span>{isRTL ? 'EN' : 'عربى'}</span>
          </button>
        </header>

        <div className="content">
          <h1 className="page-title">{t('Content goes here')}</h1>
        </div>
      </div>
    </div>
  );
}

export default Template;