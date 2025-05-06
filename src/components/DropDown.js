import React from 'react';
import { useTranslation } from 'react-i18next';

const Dropdown = ({ 
    id,
    name,
    value,
    onChange,
    options,
    className,
    label,
    placeholder
}) => {
    const { t } = useTranslation();

    return (
        <div className="dropdown-container">
            {label && <span className="dropdown-label">{label}</span>}
            <select
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                className={`dropdown-select ${className || ''}`}
            >
                {placeholder && (
                    <option value="">{t(placeholder)}</option>
                )}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {t(option.label)}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default Dropdown;