import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';


export function getDocumentsForm(t) {
  return {
    'Documents': [
      { type: 'header', label: t('Documents') },
      { type: 'empty' },
      { type: 'header', label: t('Download terms & conditions and upload duly signed document') },
      { type: 'document', name: 'dulySigned', label: t('Upload duly signed document'), required: true },
      { type: 'document', name: 'crCertificate', label: t('Copy of Commercial Registration'), required: true },
      { type: 'document', name: 'vatCertificate', label: t('Copy of VAT Certificate'), required: true },
      { type: 'document', name: 'nationalID', label: t('Copy of national ID/Iqama of the auth. sign..'), required: true },
      { type: 'document', name: 'bankLetter', label: t('Bank details on company letterhead'), required: true },
      {
        type: 'multiDocument',
        name: 'nonTradingDocuments',
        label: t('Non-Trading Documents'),
        description: t('Upload additional documents for non-trading companies'),
        accept: '.pdf,.doc,.docx,.jpg,.png'
      },
    ],
  };
};

