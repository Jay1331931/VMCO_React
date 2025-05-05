import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';


export function getContactDetailsForm(t) {
  return {
    'Contact Details': [
      { type: 'header', label: t('Primary Contact Details') },
      { type: 'text', name: 'primaryContactName', label: t('Primary Contact Name'), placeholder: t('Enter name') },
      { type: 'text', name: 'designation', label: t('Designation'), placeholder: t('Enter designation') },
      { type: 'text', name: 'email', label: t('Email'), placeholder: t('Enter email') },
      { type: 'text', name: 'phone', label: t('Phone'), placeholder: t('Enter phone number') },
      { type: 'header', label: t('Business Head') },
      { type: 'checkbox', name: 'businessHead', label: '', options: [t('Same as Primary Contact Details')] },
      { type: 'empty' },
      { type: 'header', label: t('Finance Head') },
      { type: 'checkbox', name: 'financeHead', label: '', options: [t('Same as Primary Contact Details')] },
      { type: 'empty' },
      { type: 'header', label: t('Purchasing Head') },
      { type: 'checkbox', name: 'purchasingHead', label: '', options: [t('Same as Primary Contact Details')] },
      { type: 'empty' },
      { type: 'header', label: t('Business Address') },
      { type: 'text', name: 'buildingName', label: t('Building Name'), placeholder: t('Enter building name') },
      { type: 'text', name: 'street', label: t('Street'), placeholder: t('Enter street') },
      { type: 'text', name: 'city', label: t('City'), placeholder: t('Enter city') },
      { type: 'text', name: 'region', label: t('Region'), placeholder: t('Enter region') },
      { type: 'text', name: 'geolocation', label: t('Geolocation'), placeholder: t('Enter geolocation') },
      { type: 'text', name: 'pincode', label: t('Pincode'), placeholder: t('Enter pincode') },
    ]
  };
}

