import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function getContactDetailsForm(t) {
  return {
    'Contact Details': [
      { type: 'header', label: t('Primary Contact Details') },
      { type: 'text', name: 'primaryContactName', label: t('Primary Contact Name'), placeholder: t('Enter name'), required: true },
      { type: 'text', name: 'primaryContactDesignation', label: t('Designation'), placeholder: t('Enter designation'), required: true },
      { type: 'text', name: 'primaryContactEmail', label: t('Email'), placeholder: t('Enter email'), required: true },
      { type: 'text', name: 'primaryContactPhone', label: t('Phone'), placeholder: t('Enter phone number'), required: true },
      { type: 'header', label: t('Business Head') },
      { type: 'checkbox', name: 'businessHeadSameAsPrimary', label: '', options: [t('Same as Primary Contact Details')] },
      { type: 'empty'},
      { 
        type: 'text', 
        name: 'businessHeadName', 
        label: t('Business Head Name'), 
        placeholder: t('Enter name'),
        required: true
      },
      { 
        type: 'text', 
        name: 'businessHeadDesignation', 
        label: t('Designation'), 
        placeholder: t('Enter designation'),
        required: true
      },
      { 
        type: 'text', 
        name: 'businessHeadEmail', 
        label: t('Email'), 
        placeholder: t('Enter email'),
        required: true
      },
      { 
        type: 'text', 
        name: 'businessHeadPhone', 
        label: t('Phone'), 
        placeholder: t('Enter phone number'),
        required: true
      },
      
      { type: 'empty' },
      { type: 'header', label: t('Finance Head') },
      { 
        type: 'text', 
        name: 'financeHeadName', 
        label: t('Finance Head Name'), 
        placeholder: t('Enter name'),
        required: true
      },
      { 
        type: 'text', 
        name: 'financeHeadDesignation', 
        label: t('Designation'), 
        placeholder: t('Enter designation'),
        required: true
      },
      { 
        type: 'text', 
        name: 'financeHeadEmail', 
        label: t('Email'), 
        placeholder: t('Enter email'),
        required: true
      },
      { 
        type: 'text', 
        name: 'financeHeadPhone', 
        label: t('Phone'), 
        placeholder: t('Enter phone number'),
        required: true
      },
      { type: 'empty' },
      { type: 'header', label: t('Purchasing Head') },
      { 
        type: 'text', 
        name: 'purchasingHeadName', 
        label: t('Purchasing Head Name'), 
        placeholder: t('Enter name'),
        required: true
      },
      { 
        type: 'text', 
        name: 'purchasingHeadDesignation', 
        label: t('Designation'), 
        placeholder: t('Enter designation'),
        required: true
      },
      { 
        type: 'text', 
        name: 'purchasingHeadEmail', 
        label: t('Email'), 
        placeholder: t('Enter email'),
        required: true
      },
      { 
        type: 'text', 
        name: 'purchasingHeadPhone', 
        label: t('Phone'), 
        placeholder: t('Enter phone number'),
        required: true
      },
      { type: 'empty' },
      { type: 'header', label: t('Business Address') },
      { type: 'text', name: 'buildingName', label: t('Building Name'), placeholder: t('Enter building name'), required: true },
      { type: 'text', name: 'street', label: t('Street'), placeholder: t('Enter street'), required: true },
      { type: 'text', name: 'district', label: t('District'), placeholder: t('Enter district'), required: true },
      { type: 'dropdown', name: 'city', label: t('City'), placeholder: t('Enter city'), options:['Jeddah'], required: true },
      { type: 'text', name: 'region', label: t('Region'), placeholder: t('Enter region'), required: true },
      { type: 'text', name: 'geolocation', label: t('Geolocation'), placeholder: t('Enter geolocation'), required: true, isLocation: true },
      { type: 'text', name: 'pincode', label: t('Pincode'), placeholder: t('Enter pincode'), required: true },
    ]
  };
}

