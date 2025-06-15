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
    placeholder,
    disabled
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
                className={`dropdown-select ${className || ''} ${disabled ? 'disabled' : ''}`}
                disabled={disabled}
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
            <style>{`
                .dropdown-container {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 10px; 
                // margin-bottom: 12px;
                }

                .dropdown-label {
                    font-size: 1rem;
                    color: #222;
                    margin-bottom: 2px;
                    font-weight: 400;
                }
                .dropdown-select {
                    padding: 10px 14px;
                    border-radius: 8px;
                    border: 1.5px solid #ddd;
                    background: #fff;
                    font-size: 1rem;
                    color: #222;
                    outline: none;
                    transition: border 0.2s;
                }
                .dropdown-select option {
                    font-size: 1rem;
                }
                @media (max-width: 768px) {
                    .dropdown-select {
                        font-size: 0.95rem;
                        padding: 9px 10px;
                    }
                    .dropdown-label {
                        font-size: 0.98rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default Dropdown;