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
        </div>
    );
};

export default Tabs;