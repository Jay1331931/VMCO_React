export function getBusinessDetailsForm(t) {
  return {
    'Business Details': [
      { type: 'text', name: 'companyName', label: t('Company Name'), placeholder: t('Enter company name'), required: true },
      { type: 'text', name: 'companyNameArabic', label: t('Company Name (Arabic)'), placeholder: t('أدخل اسم الشركة'), required: true },
      { type: 'text', name: 'commercialRegistrationNumber', label: t('Commercial Registration #'), placeholder: t('Enter value'), required: true },
      { type: 'text', name: 'vatRegistrationNumber', label: t('VAT Registration #'), placeholder: t('Enter value'), required: true },
      { type: 'text', name: 'baladeahLicense', label: t('Baladeah License #'), placeholder: t('Enter value'), required: true },
      { type: 'dropdown', name: 'companyType', label: t('Company Type'), options: ['Trading', 'Non-Trading'], required: true },
      { type: 'dropdown', name: 'businessType', label: t('Type of Business'), options: ['Restaurant', 'Coffee Shop', 'Supermarket', 'E-commerce', 'Quick Commerce', 'Hospital', 'Labor Camp', 'Others'], required: true },

      { 
        type: 'conditionalText', 
        name: 'businessTypeOther', 
        label: t('Type of Business (Other)'), 
        placeholder: t('Enter other business type'),
        showWhen: 'businessType',
        showValue: 'Others',
        required: true
      },
      { type: 'dropdown', name: 'deliveryLocations', label: t('Delivery Locations'), options: ['Jeddah', 'Riyadh'], required: true },
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



