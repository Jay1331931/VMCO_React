import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';


export function getBusinessDetailsForm(t) {
  return {
    'Business Details': [
      { type: 'text', name: 'companyName', label: t('Company Name'), placeholder: t('Enter company name') },
      { type: 'text', name: 'companyNameArabic', label: t('Company Name (Arabic)'), placeholder: t('أدخل اسم الشركة') },
      { type: 'text', name: 'commercialRegistrationNumber', label: t('Commercial Registration #'), placeholder: t('Enter value') },
      { type: 'text', name: 'vatRegistrationNumber', label: t('VAT Registration #'), placeholder: t('Enter value') },
      { type: 'text', name: 'baladeahLicense', label: t('Baladeah License #'), placeholder: t('Enter value') },
      { type: 'dropdown', name: 'businessType', label: t('Type of Business'), options: ['Hotel', 'Cafe'] },
      { type: 'dropdown', name: 'deliveryLocations', label: t('Delivery Locations'), options: ['Jeddah', 'Riyadh'] },
      { type: 'empty' },
      { type: 'text', name: 'brandName', label: t('Brand Name'), placeholder: t('Enter brand name') },
      { type: 'text', name: 'brandNameArabic', label: t('Brand Name (Arabic)'), placeholder: t('أدخل اسم العلامة التجارية') },
      { type: 'file', name: 'companyLogo', label: t('Company Logo') },
      { type: 'file', name: 'brandLogo', label: t('Brand Logo') },
    ]
  };
}

export function getBusinessDetailsFormData(t) {
  return {
    'Business Details':
    {
      companyName: 'ABCD',
      companyNameArabic: 'أدخل اسم الشركة',
      commercialRegistration: '123456789',
    }

  }
}



