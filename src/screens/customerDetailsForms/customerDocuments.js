import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';


export function getDocumentsForm(t, customer = null) {
  console.log('getDocumentsForm called with customer:', customer);
  return {
    'Documents': 
     customer?.companyType?.toLowerCase() === 'trading' ? 
    [
      { type: 'header', label: t('Documents') },
      { type: 'empty' },
      { type: 'header', label: t('Download terms & conditions and upload duly signed document')},
      { type: 'document', file_type: 'acknowledgement_signature', name: 'acknowledgementSignature', label: t('Upload duly signed document'), required: true },
      { type: 'document', file_type: 'cr_certificate', name: 'crCertificate', label: t('Copy of Commercial Registration'), required: true },
      { type: 'document', file_type: 'vat_certificate', name: 'vatCertificate', label: t('Copy of VAT Certificate'), required: true },
      { type: 'document', file_type: 'national_id', name: 'nationalId', label: t('Copy of national ID/Iqama of the auth. sign..'), required: true },
      { type: 'document', file_type: 'bank_letter', name: 'bankLetter', label: t('Bank details on company letterhead'), required: true },
      { type: 'document', file_type: 'national_address', name: 'nationalAddress', label: t('Copy of National Address'), required: true },
      { type: 'document', file_type: 'contract_agreement', name: 'contractAgreement', label: t('Contract Agreement'), required: true },
      { type: 'document', file_type: 'credit_application', name: 'creditApplication', label: t('Credit Application'), required: true },
    ] :
    [
      { type: 'header', label: t('Documents') },
      { type: 'empty' },
      { type: 'header', label: t('Download terms & conditions and upload duly signed document')},
      { type: 'document', file_type: 'acknowledgement_signature', name: 'acknowledgementSignature', label: t('Upload duly signed document'), required: true },
      { type: 'document', file_type: 'contract_agreement', name: 'contractAgreement', label: t('Contract Agreement'), required: true },
      { type: 'document', file_type: 'credit_application', name: 'creditApplication', label: t('Credit Application'), required: true },
    {
        type: 'multiDocument',
        name: 'nonTradingDocuments',
        label: t('Non-Trading Documents'),
        description: t('Upload additional documents for non-trading companies'),
        accept: '.pdf,.doc,.docx,.jpg,.png',
        required: false,
      },
    ]
  };
};


