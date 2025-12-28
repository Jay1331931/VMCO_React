import React from 'react';
import { useTranslation } from 'react-i18next';

const Tabs = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  variant = 'pc',
  catalog = false
}) => {
  const { t } = useTranslation();

  return (
    <div className={`tab-container ${className}`}>
      <div
        className={`tabs ${catalog && variant === 'pc' ? 'category-tabs' : 'category-tabs-mobile'} ${catalog ? 'with-catalog' : 'without-catalog'}`}
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`
              ${variant === 'mobile' ? 'category-tab-mobile' : 'category-tab'}
              ${catalog ? 'catalog' : ''}
              ${activeTab === tab.value ? 'active' : ''}
              ${tab.disabled ? 'disabled' : ''}
            `}
            onClick={() => onTabChange(tab.value)}
            title={tab.disabled ? 'This tab is currently disabled' : ''}
          >
            {catalog && (
              <div
                className={`${variant === 'mobile' ? 'tab-image-mobile' : 'tab-image'
                  }`}
              >
                <img src={tab.imageUrl} alt={t(tab.label)} />
              </div>
            )}
            <span className="tab-text">{t(tab.label)}</span>
          </button>
        ))}
      </div>

      <style>{`
        .tabs {
          display: flex;
          gap: 2px;
          border-bottom: 2px solid #D9D9D6;
        }

        .tab-button {
          padding: 12px 24px;
          background: none;
          border: none;
          font-size: 1rem;
          color: #6D787D;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .tab-button.active {
          color: #00205B;
          border-bottom: 2px solid #00205B;
          font-weight: 600;
        }

        .tab-button:hover {
          color: #00205B;
        }

        /* PC catalog tabs - with images */
        .category-tabs.with-catalog {
          border-bottom: 1px solid #D9D9D6;
          height: 80px;
          display: flex;
          gap: 20px;
          white-space: nowrap;
        }

        /* Mobile catalog tabs - with images */
        .category-tabs-mobile.with-catalog {
          border-bottom: 1px solid #D9D9D6;
          height: 80px;
          display: flex;
          gap: 16px;
          white-space: nowrap;
        }

        /* Tabs without catalog - no images */
        .category-tabs.without-catalog,
        .category-tabs-mobile.without-catalog {
          border-bottom: 1px solid #D9D9D6;
          height: 48px;
          display: flex;
          gap: 2px;
          white-space: nowrap;
        }

        /* BASE BUTTONS */
        .category-tab,
        .category-tab-mobile {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: none;
          border: none;
          cursor: pointer;
          color: rgb(99, 107, 110);
          transition: all 0.3s ease;
        }

        /* With catalog (has images) - fixed width and smaller font */
        .category-tab.catalog,
        .category-tab-mobile.catalog {
          width: 80px;
          min-width: 80px;
          max-width: 80px;
          min-height: 80px;
          max-height: 80px;
          padding: 4px;
          font-size: 0.55rem;
          font-weight: 600;
          justify-content: flex-start;
        }

        /* Without catalog (no images) - auto width and larger font */
        .category-tab:not(.catalog) {
          width: auto;
          min-width: auto;
          max-width: none;
          padding: 12px 24px;
          min-height: 48px;
          height: 48px;
          font-size: 0.875rem;
          font-weight: 500;
          justify-content: center;
        }

        .category-tab-mobile:not(.catalog) {
          width: auto;
          min-width: auto;
          max-width: none;
          padding: 10px 20px;
          min-height: 48px;
          height: 48px;
          font-size: 0.8rem;
          font-weight: 500;
          justify-content: center;
        }

        .category-tab-mobile.catalog {
          font-size: 0.7rem;
        }

        /* Active states */
        .category-tab.active {
          color: #00205B;
          font-weight: 600;
          border-bottom: 2px solid #00205B;
        }

        .category-tab-mobile.active {
          color: #0b4c45;
          font-weight: 600;
        }

        /* Non-catalog active state */
        .category-tab:not(.catalog).active {
          border-bottom: 2px solid #00205B;
        }

        /* Hover effects */
        .category-tab:hover,
        .category-tab-mobile:hover {
          color: #00205B;
        }

        /* FIXED SQUARE IMAGE AREAS */
        .tab-image,
        .tab-image-mobile {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
          overflow: hidden;
          transition: transform 0.2s ease;
        }

        .tab-image img,
        .tab-image-mobile img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          border-radius: 6px;
        }

        .category-tab.active .tab-image {
          border: 2px solid #00205B;
          border-radius: 8px;
        }

        .category-tab-mobile.active .tab-image-mobile {
          border: 2px solid #0b4c45;
          border-radius: 8px;
        }

        /* TEXT STYLING */
        .tab-text {
          line-height: 1.2;
          text-wrap: auto;
        }

        /* Text for catalog mode - 2 line clamp */
        .catalog .tab-text {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          max-height: calc(1.2em * 2);
        }

        /* Text for non-catalog mode - single line */
        .category-tab:not(.catalog) .tab-text,
        .category-tab-mobile:not(.catalog) .tab-text {
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Disabled state */
        .tab-button.disabled,
        .category-tab.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          color: #999;
        }

        .tab-button.disabled:hover,
        .category-tab.disabled:hover {
          color: #999;
        }

        @media (max-width: 768px) {
          .tabs {
            width: 100%;
            justify-content: center;
            display: flex;
            gap: 10px;
          }

          /* Adjust height for mobile without catalog */
          .category-tabs-mobile.without-catalog {
            height: 44px;
          }

          .tab-button {
            width: 100%;
            padding: 8px 16px;
            font-size: 0.9rem;
            color: #6D787D;
            cursor: pointer;
            transition: color 0.3s ease;
          }

          .category-tab-mobile.catalog {
            padding: 4px;
            font-size: 0.7rem;
            border-radius: 4px;
          }

          .category-tabs-mobile.with-catalog {
            border-bottom: none;
          }

          .category-tab-mobile.catalog .tab-text {
            font-size: 0.55rem;
            font-weight: 600;
          }

          .category-tab-mobile:not(.catalog) {
            min-height: 44px;
            height: 44px;
            padding: 8px 16px;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Tabs;
