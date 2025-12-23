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
  const isCatalogMode = catalog && variant === 'pc';

  return (
    <div className={`tab-container ${className}`}>
      <div
        className={`tabs ${ isCatalogMode && variant === 'pc' ? 'category-tabs' : 'category-tabs-mobile' }`}
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
            {(
              <div
                className={`${
                  variant === 'mobile' ? 'tab-image-mobile' : 'tab-image'
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

        /* PC catalog tabs */
        .category-tabs {
          border-bottom: 1px solid #D9D9D6;
          height: 80px;
          display: flex;
          gap: 20px;
          white-space: nowrap;
        }

        /* Mobile catalog tabs */
        .category-tabs-mobile {
          border-bottom: 1px solid #D9D9D6;
          height: 80px;
          display: flex;
          gap: 16px;
          white-space: nowrap;
        }

        /* BASE BUTTONS – fixed width 80px */
        .category-tab,
        .category-tab-mobile {
          width: 80px;
          min-width: 80px;
          max-width: 80px;
          min-height: 80px;
          max-height: 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          text-align: center;
          padding: 4px;
          background: none;
          border: none;
          cursor: pointer;
          color: rgb(99, 107, 110);
        }

        .category-tab {
          font-size: 0.55rem;
          font-weight: 600;
        }

        .category-tab-mobile {
          font-size: 0.7rem;
        }

        .category-tab.active {
          color: #00205B;
          font-weight: 600;
          border-bottom: 2px solid #00205B;
        }

        .category-tab-mobile.active {
          color: #0b4c45;
          font-weight: 600;
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

        /* TEXT: wrap to max 2 lines */
        .tab-text {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.1;
          max-height: calc(1.1em * 2);
          text-wrap: auto;
        }

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

          .tab-button {
            width: 100%;
            padding: 8px 16px;
            font-size: 0.9rem;
            color: #6D787D;
            cursor: pointer;
            transition: color 0.3s ease;
          }

          .category-tab-mobile {
            padding: 4px;
            font-size: 0.7rem;
            border-radius: 4px;
          }

          .category-tabs-mobile {
            border-bottom: none;
          }

          .category-tab-mobile .tab-text {
            font-size: 0.55rem;
            font-weight: 600;
          }
        }
      `}</style>
    </div>
  );
};

export default Tabs;