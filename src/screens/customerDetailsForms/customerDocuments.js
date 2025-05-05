import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';


export function getDocumentsForm(t) {
  return {
    'Documents': [
      { type: 'header', label: t('Documents') },
      { type: 'empty' },
      { type: 'header', label: t('Download terms & conditions and upload duly signed document') },
      { type: 'document', name: 'dulySigned', label: t('Upload duly signed document') },
      { type: 'document', name: 'commercialRegistration', label: t('Copy of Commercial Registration') },
      { type: 'document', name: 'vatCertificate', label: t('Copy of VAT Certificate') },
      { type: 'document', name: 'nationalID', label: t('Copy of national ID/Iqama of the auth. sign..') },
      { type: 'document', name: 'bankDetails', label: t('Bank details on company letterhead') },
    ],
  };
};

