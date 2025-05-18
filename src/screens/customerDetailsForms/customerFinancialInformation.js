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
      { type: 'header', label: '' },
      // { type: 'header', label: t('Payment Method (Post Approval)') },
      { type: 'checkbox', name: 'paymentMethods', label: t('Payment Method (Post Approval)'), options: [t('Pre-Payment')] },
      { type: 'empty' },
      // { type: 'checkbox', name: 'paymentMethodPrePayment', label: '', options: [t('Pre-Payment')] },
      { type: 'checkbox', name: 'paymentMethodPartialPayment', label: '', options: [t('Partial Payment')] },
      { type: 'checkbox', name: 'paymentMethodAdvancePayment', label: '', options: [t('Advance Payment')] },
      { type: 'checkbox', name: 'paymentMethodCOD', label: '', options: [t('Cash on Delivery (COD)')] },
      { type: 'checkbox', name: 'paymentMethodCredit', label: '', options: [t('Credit')] },
      { type: 'text', name: 'creditLimit', label: '', placeholder: t('Enter credit limit') },
      { type: 'empty' },
      { type: 'text', name: 'creditPeriod', label: '', placeholder: t('Enter credit period') },
    ],
  };
}

