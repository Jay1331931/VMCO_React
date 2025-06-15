import React from 'react';
import { useTranslation } from 'react-i18next';

const Tabs = ({
    tabs,
    activeTab,
    onTabChange,
    className = '',
    variant = 'default' // 'default' or 'category'
}) => {
    const { t } = useTranslation();

    return (
        <div className={`tab-container ${className}`}>
            <div className={`tabs ${variant === 'category' ? 'category-tabs' : ''}`}>
                {tabs.map((tab) => (
                    <button
                        key={tab.value}
                        className={`
                            ${variant === 'category' ? 'category-tab' : 'tab-button'}
                            ${activeTab === tab.value ? 'active' : ''}
                        `}
                        onClick={() => onTabChange(tab.value)}
                    >
                        {t(tab.label)}
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
                /* Category tabs optimization */
                .category-tabs {
                    grid-template-columns: repeat(5, 1fr);
                    border-bottom: 1px solid #D9D9D6;
                    height: 32px;
                    display: flex;
                    gap: 2px;
                    white-space: nowrap;
                }
                .category-tab {
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 12px 12px;
                    background: none;
                    border: none;
                    font-size: 0.9rem;
                    color: #6D787D;
                    cursor: pointer;
                }
                .category-tab.active {
                    color: #00205B;
                    font-weight: 600;
                    border-bottom: 2px solid #00205B;
                }
                @media (max-width: 768px) {
                    .tabs {
                        width: 100%;
                        justify-content: center;
                        display: flex;
                        gap: 2px;
                        border-bottom: 2px solid #D9D9D6;
                    }
                    .tab-button {
                        width: 100%;
                        padding: 8px 16px;
                        font-size: 0.9rem;
                        color: #6D787D;
                        cursor: pointer;
                        transition: color 0.3s ease;
                    }
                    .category-tab {
                        padding: 4px;
                        width: max-content;
                        font-size: 0.73rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default Tabs;