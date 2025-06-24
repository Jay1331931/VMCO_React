import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';


export function getFinancialInformationForm(t) {
  return {
    'Financial Information': [
      { type: 'header', label: t('Bank Details') },
      { type: 'text', name: 'bankName', label: t('Bank Name'), placeholder: t('Enter bank name'), required: true },
      { type: 'text', name: 'bankAccountNumber', label: t('Account Number'), placeholder: t('Enter account number'), required: true },
      { type: 'text', name: 'iban', label: t('IBAN'), placeholder: t('Enter IBAN'), required: true },
      { type: 'empty' },
      { type: 'header', label: t('Price Plan')},
      // { type: 'dropdown', name: 'pricingPolicy', label: t('Price Plan'), options: ['Price A', 'Price B', 'Price C'], required: false },
      { type: 'dropdownObject', name: 'pricingPolicySHC', label: t('Price Plan SHC'), options: ['Price A', 'Price B', 'Price C'], parentField: 'pricingPolicy', required: false },
      { type: 'dropdownObject', name: 'pricingPolicyNAQI', label: t('Price Plan NAQI'), options: ['Price A', 'Price B', 'Price C'], parentField: 'pricingPolicy', required: false },
      { type: 'dropdownObject', name: 'pricingPolicyGMTC', label: t('Price Plan GMTC'), options: ['Price A', 'Price B', 'Price C'], parentField: 'pricingPolicy', required: false },
      { type: 'dropdownObject', name: 'pricingPolicyDAR', label: t('Price Plan DAR'), options: ['Price A', 'Price B', 'Price C'], parentField: 'pricingPolicy', required: false },
      { type: 'dropdownObject', name: 'pricingPolicyVMCO', label: t('Price Plan VMCO'), options: ['Price A', 'Price B', 'Price C'], parentField: 'pricingPolicy', required: false },

      { type: 'empty' },
      { type: 'checkbox', name: 'isDeliveryChargesApplicable', label: '', options: [t('Is delivery charges applicable')], required: false },

      { type: 'header', label: '' },
      // { type: 'header', label: t('Payment Method (Post Approval)') },
      { type: 'checkbox', name: 'prePayment', label: t('Payment Methods'), className: 'hidden-label', options: [t('Pre-Payment')], required: false },
      { type: 'empty' },
      // { type: 'checkbox', name: 'paymentMethodPrePayment', label: '', options: [t('Pre-Payment')] },
      { type: 'checkbox', name: 'partialPayment', label: '', options: [t('Partial Payment')], required: false },
      { type: 'empty' },
      { type: 'checkbox', name: 'COD', label: '', options: [t('Cash on Delivery (COD)')], required: false },
      { type: 'empty' },
      { type: 'checkbox', name: 'credit', label: '', options: [t('Credit')], required: false },
      { type: 'text', name: 'creditLimit', label: t('Credit Limit'), placeholder: t('Enter credit limit'), required: false },
      { type: 'empty' },
      { type: 'text', name: 'creditPeriod', label: t('Credit Period'), placeholder: t('Enter credit period'), required: false },
    ],
  };
}

