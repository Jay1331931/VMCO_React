import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
import '../i18n';
import { useTranslation } from 'react-i18next';

function CustomersOnboarding() {
    const { t } = useTranslation();
    const fields = [
      { type: 'text', name: 'customerName', label: t('Customer Name'), placeholder: t('Customer Name') },
      { type: 'empty'},
      { type: 'text', name: 'email', label: t('Email (Username)'), placeholder: t('Email (Username)') },
      { type: 'text', name: 'phoneNumber', label: t('Phone Number'), placeholder: t('Phone Number') },
      { type: 'text', name: 'companyName', label: t('Company Name'), placeholder: t('Company Name') },
      { type: 'text', name: 'region', label: t('Region'), placeholder: t('Region') },
      { type: 'password', name: 'password', label: t('Password'), placeholder: t('Password')},
      { type: 'password', name: 'confirmpassword', label: t('Confirm Password'), placeholder: t('Confirm Password')}
    ]
    
  return (
    <Sidebar>
    <div className='onboarding-component'>
            <div className="onboarding-header">{t('Customer Onboarding')}</div>
            <div className="onboarding-container">
                {fields.map((field, index) => (
                    <div key={index} className="form-group">
                        <label htmlFor={field.name}>{field.label}</label>
                        {field.type === 'text' && (
                            <input
                                type="text"
                                id={field.name}
                                placeholder={field.placeholder}
                            />
                        )}
                        {field.type === 'dropdown' && (
                            <select id={field.name}>
                                {field.options.map((option, index) => (
                                    <option key={index} value={option}>{option}</option>
                                ))}
                            </select>
                        )}
                        {field.type === 'file' && (
                            <input
                                type="file"
                                id={field.name}
                            />
                        )}
                        {field.type === 'empty' && (
                          <></>
                        )}
                        {field.type === 'password' && (
                            <input
                                type='password'
                                id={field.name}
                                placeholder={field.placeholder}
                            />
                        )}
                    </div>
                ))}

            </div>
            <div className='onboarding-footer'>
        <button type="submit" className="login-button">{t('Submit')}</button>
    </div>

        </div>
    </Sidebar>
);
}

export default CustomersOnboarding;
