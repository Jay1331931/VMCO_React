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
      { type: 'checkbox', name: 'paymentMethods', label: t('Payment Method (Post Approval)'), options: [t('Pre-Payment'), t('Partial Payment'), t('Advance Payment')] },
      { type: 'empty' },
      { type: 'checkbox', name: 'paymentMethodCOD', label: '', options: [t('Cash on Delivery (COD)')] },
      { type: 'text', name: 'cod', label: '', placeholder: t('Enter COD value') },
      { type: 'checkbox', name: 'paymentMethodCredit', label: '', options: [t('Credit')] },
      { type: 'text', name: 'creditLimit', label: '', placeholder: t('Enter credit limit') },
    ],
  };
}

