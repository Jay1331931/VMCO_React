import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function getContactDetailsForm(t) {
  return {
    'Contact Details': [
      { type: 'header', label: t('Primary Contact Details') },
      { type: 'text', name: 'primaryContactName', label: t('Primary Contact Name'), placeholder: t('Enter name'), required: true },
      { type: 'text', name: 'primaryContactDesignation', label: t('Designation'), placeholder: t('Enter designation'), required: true },
      { type: 'text', name: 'primaryContactEmail', label: t('Email'), placeholder: t('Enter email'), required: true },
      { type: 'text', name: 'primaryContactMobile', label: t('Mobile'), placeholder: t('Enter Mobile number'), required: true },
      { type: 'header', label: t('Business Head') },
      { type: 'checkbox', name: 'businessHeadSameAsPrimary', label: '', options: [t('Same as Primary Contact Details')] , required: false },
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
        name: 'businessHeadMobile', 
        label: t('Mobile'), 
        placeholder: t('Enter Mobile number'),
        required: true
      },
      
      
      { type: 'header', label: t('Finance Head') },
       { type: 'checkbox', name: 'FinanceHeadSameAsPrimary', label: '', options: [t('Same as Primary Contact Details')] , required: false },
      { type: 'empty'},
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
        name: 'financeHeadMobile', 
        label: t('Mobile'), 
        placeholder: t('Enter Mobile number'),
        required: true
      },
   
      { type: 'header', label: t('Purchasing Head') },
         { type: 'checkbox', name: 'PurchasingHeadSameAsPrimary', label: '', options: [t('Same as Primary Contact Details')] , required: false },
      { type: 'empty'},
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
        name: 'purchasingHeadMobile', 
        label: t('Mobile'), 
        placeholder: t('Enter Mobile number'),
        required: true
      },
     
      { type: 'header', label: t('Business Address') },
      { type: 'text', name: 'buildingName', label: t('Building Name'), placeholder: t('Enter building name'), required: true },
      { type: 'text', name: 'street', label: t('Street'), placeholder: t('Enter street'), required: true },
      { type: 'dropdown', name: 'district', label: t('District'), placeholder: t('Enter district'), required: true, options: ['District 1', 'District 2', 'District 3'] },
      { type: 'dropdown', name: 'city', label: t('City'), placeholder: t('Enter city'), options:['Jeddah'], required: true },
      { type: 'dropdown', name: 'region', label: t('Region'), placeholder: t('Enter region'), options:['Region 1', 'Region 2'], required: true },
      { type: 'dropdown', name: 'zone', label: t('Zone'), placeholder: t('Enter zone'), options:['Zone 1', 'Zone 2'], required: true },
      { type: 'text', name: 'pincode', label: t('Pincode'), placeholder: t('Enter pincode'), required: true },
      { type: 'text', name: 'geolocation', label: t('Geolocation'), placeholder: t('Enter geolocation'), required: true, isLocation: true },
      
    ]
  };
}

