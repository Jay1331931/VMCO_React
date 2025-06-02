import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';


export function getFinancialInformationForm(t) {
  return {
    'Financial Information': [
      { type: 'header', label: t('Bank Details') },
      { type: 'text', name: 'bankName', label: t('Bank Name'), placeholder: t('Enter bank name'), required: true },
      { type: 'text', name: 'accountNumber', label: t('Account Number'), placeholder: t('Enter account number'), required: true },
      { type: 'text', name: 'ibanNumber', label: t('IBAN'), placeholder: t('Enter IBAN'), required: true },
      { type: 'empty' },
      // { type: 'header', label: t('Price Plan')},
      { type: 'dropdown', name: 'pricePlan', label: t('Price Plan'), options: ['Price A', 'Price B', 'Price C'], required: true },
      { type: 'checkbox', name: 'deliveryCost', label: '', options: [t('Delivery Cost')], required: false },

      { type: 'header', label: '' },
      // { type: 'header', label: t('Payment Method (Post Approval)') },
      { type: 'checkbox', name: 'prePayment', label: t('Payment Methods'), options: [t('Pre-Payment')], required: false },
      { type: 'empty' },
      // { type: 'checkbox', name: 'paymentMethodPrePayment', label: '', options: [t('Pre-Payment')] },
      { type: 'checkbox', name: 'partialPayment', label: '', options: [t('Partial Payment')], required: false },
      { type: 'checkbox', name: 'advancePayment', label: '', options: [t('Advance Payment')], required: false },
      { type: 'checkbox', name: 'COD', label: '', options: [t('Cash on Delivery (COD)')], required: false },
      { type: 'checkbox', name: 'credit', label: '', options: [t('Credit')], required: false },
      { type: 'text', name: 'creditLimit', label: '', placeholder: t('Enter credit limit'), required: false },
      { type: 'empty' },
      { type: 'text', name: 'creditPeriod', label: '', placeholder: t('Enter credit period'), required: false },
    ],
  };
}

