import { faAnchorLock } from "@fortawesome/free-solid-svg-icons";
import { typeOf } from "maplibre-gl";
import Constants from "../../constants";
export function getBusinessDetailsForm(t) {
  return {
    'Business Details': [
      { type: 'text', name: 'companyNameEn', label: t('Company Name'), placeholder: t('Enter company name'), required: true },
      { type: 'text', name: 'companyNameAr', label: t('Company Name (Arabic)'), placeholder: t('أدخل اسم الشركة'), required: true },
      { type: 'text', name: 'crNumber', label: t('Commercial Registration #'), placeholder: t('Enter value'), required: true },
      { type: 'text', name: 'vatNumber', label: t('VAT Registration #'), placeholder: t('Enter value'), required: true },
      { type: 'text', name: 'governmentRegistrationNumber', label: t('Government Registration #'), placeholder: t('Enter value'), required: true },
      { type: 'text', name: 'baladeahLicenseNumber', label: t('Baladeah License #'), placeholder: t('Enter value'), required: true },
      { type: 'dropdown', name: 'companyType', label: t('Company Type'), options: ['Trading', 'Non-Trading'], required: true },
      { type: 'dropdown', name: 'typeOfBusiness', label: t('Type of Business'), options: ['Restaurant', 'Coffee Shop', 'Supermarket', 'E-commerce', 'Quick Commerce', 'Hospital', 'Labor Camp', 'Others'], required: true },
      {
        type: 'conditionalText',
        name: 'typeOfBusinessOther',
        label: t('Type of Business (Other)'),
        placeholder: t('Enter other business type'),
        showWhen: 'typeOfBusiness',
        showValue: 'Others',
        required: false
      },

      { type: 'dropdown', name: 'deliveryLocations', label: t('Delivery Locations'), options: ['Jeddah', 'Riyadh'], required: true },
      { type: 'empty'},
      { type: 'text', name: 'brandNameEn', label: t('Brand Name'), placeholder: t('Enter brand name'), required: false},
      { type: 'text', name: 'brandNameAr', label: t('Brand Name (Arabic)'), placeholder: t('أدخل اسم العلامة التجارية'), required: false},
      { type: 'file', fileType: 'company_logo', name: 'companyLogo', label: t('Company Logo'), required: false },
      { type: 'file', fileType: 'brand_logo', name: 'brandLogo', label: t('Brand Logo'), required: false },
      { type: 'dropdown', name: 'assignedTo', label: t('Assigned To'), options: ['Sales Team', 'Marketing Team', 'Support Team'], required: false },
      // { type: 'dropdown', name: 'entity', label: t('Entity'), options: ['Al Khaleej', 'Al Khaleej Trading'], required: false },
      // { type: 'dropdown', name: 'assignedToEntityWise', label: t('Assigned To (Entity Wise)'), options: ['Al Khaleej', 'Al Khaleej Trading'], required: false },
      { type: 'text', name: 'customerSource', label: t('Customer Source'), placeholder: t('Enter customer source'), required: false },
      
    
    // { type: 'conditionalDropdown',
    //     name: 'naqi',
    //     label: t('Naqi'),
    //     placeholder: t('Select'),
    //     showWhen: 'interCompany',
    //     showValue: true,
    //     required: false,
    // },
    // { type: 'conditionalDropdown',
    //     name: 'greenMart',
    //     label: t('Green Mart'),
    //     placeholder: t('Select'),
    //     showWhen: 'interCompany',
    //     showValue: true,
    //     required: false,
    // },
    // { type: 'conditionalDropdown',
    //     name: 'dar',
    //     label: t('DAR'),
    //     placeholder: t('Select'),
    //     showWhen: 'interCompany',
    //     showValue: true,
    //     required: false,
    // },
    { type: 'dropdownObject',
        name: Constants.ENTITY.VMCO,
        label: t('VMCO'),
        placeholder: t('Select'),
        required: false,
    },
    { type: 'dropdown',
        name: Constants.ENTITY.DIYAFA,
        label: t('Diyafa'),
        placeholder: t('Select'),
        required: false,
    },
    { type: 'dropdown',
        name: Constants.ENTITY.NAQI,
        label: t('Naqi'),
        placeholder: t('Select'),
        required: false,
    },
    { type: 'dropdown',
        name: Constants.ENTITY.GREEN_MAST,
        label: t('Green Mast'),
        placeholder: t('Select'),
        required: false,
    },
    { type: 'dropdown',
        name: Constants.ENTITY.DAR,
        label: t('DAR'),
        placeholder: t('Select'),
        required: false,
    },
    { type: 'empty' },
    { type: 'checkbox', name: 'interCompany', label: t(''), options: [t('Inter-Company')], required: false },
     
      { type: 'conditionalDropdown',
        name: 'entity',
        label: t('Entity'),
        placeholder: t('Select'),
        showWhen: 'interCompany',
        showValue: true,
        required: false,
    },
    
      ]
  };
}

export function getBusinessDetailsFormData(t, customer = null, companyType = null) {
  console.log('getBusinessDetailsFormData called with customer:', customer);
  if (customer) {
    return {
      'Business Details': {
        companyNameEn: customer.companyNameEn,
        companyNameAr: customer.companyNameAr || '',
        crNumber: customer.crNumber || '',
        vatNumber: customer.vatNumber || '',
        governmentRegistrationNumber: customer.governmentRegistrationNumber || '',
        baladeahLicenseNumber: customer.baladeahLicenseNumber || '',
        companyType: customer.companyType || '',
        typeOfBusiness: customer.typeOfBusiness || '',
        typeOfBusinessOther: customer.typeOfBusinessOther || '',
        deliveryLocations: customer.deliveryLocations || '',
        brandNameEn: customer.brandNameEn || '',
        brandNameAr: customer.brandNameAr || '',
        companyLogo: customer.companyLogo || '',
        brandLogo: customer.brandLogo || '',
        interCompany: customer.interCompany || false,
        assignedTo: customer.assignedTo || '',
        assignedToEntityWise: customer.assignedToEntityWise || '',
        entity: customer.entity || '',
        status: customer.customerStatus || '',
        customerSource: customer.customerSource || '',
        [Constants.ENTITY.VMCO]: customer?.['assignedToEntityWise']?.[Constants.ENTITY.VMCO] || '',
        [Constants.ENTITY.DIYAFA]: customer[Constants.ENTITY.DIYAFA] || '',
        [Constants.ENTITY.NAQI]: customer[Constants.ENTITY.NAQI] || '',
        [Constants.ENTITY.GREEN_MAST]: customer[Constants.ENTITY.GREEN_MAST] || '',
        [Constants.ENTITY.DAR]: customer[Constants.ENTITY.DAR] || '',
        region: customer.region || '',
      },
      'Contact Details': {
        primaryContactName: customer.primaryContactName || '',
        primaryContactDesignation: customer.primaryContactDesignation || '',
        primaryContactEmail: customer.primaryContactEmail || '',
        primaryContactMobile: customer.primaryContactMobile || '',
        financeHeadName: customer.financeHeadName || '',
        financeHeadDesignation: customer.financeHeadDesignation || '',
        financeHeadEmail: customer.financeHeadEmail || '',
        financeHeadMobile: customer.financeHeadMobile || '',
        businessHeadName: customer.businessHeadName || '',
        businessHeadDesignation: customer.businessHeadDesignation || '',
        businessHeadEmail: customer.businessHeadEmail || '',
        businessHeadMobile: customer.businessHeadMobile || '',
        purchasingHeadName: customer.purchasingHeadName || '',
        purchasingHeadDesignation: customer.purchasingHeadDesignation || '',
        purchasingHeadEmail: customer.purchasingHeadEmail || '',
        purchasingHeadMobile: customer.purchasingHeadMobile || '',
        buildingName: customer.buildingName || '',
        street: customer.street || '',
        district: customer.district || '',
        city: customer.city || '',
        region: customer.region || '',
        zone: customer.zone || '',
        geolocation: customer.geolocation || '',
        pincode: customer.pincode || ''
      },
      'Financial Information': {
        bankName: customer.bankName || '',
        bankAccountNumber: customer.bankAccountNumber || '',
        iban: customer.iban || '',
        prePayment: customer.prePayment || false,
        partialPayment: customer.partialPayment || false,
        COD: customer.COD || false,
        credit: customer.credit || false,
        creditLimit: customer.creditLimit || '',
        creditPeriod: customer.creditPeriod || '',
        creditBalance: customer.creditBalance || '',
        pricingPolicy: customer.pricingPolicy || '',
        isDeliveryChargesApplicable: customer.isDeliveryChargesApplicable || false,
      },
      'Documents': (companyType === 'trading') ? {
  crCertificate: customer.crCertificate ? { name: customer.crCertificate } : '',
  vatCertificate: customer.vatCertificate ? { name: customer.vatCertificate } : '',
  bankLetter: customer.bankLetter ? { name: customer.bankLetter } : '',
  nationalId: customer.nationalId ? { name: customer.nationalId } : '',
  nationalAddress: customer.nationalAddress ? { name: customer.nationalAddress } : '',
  contractAgreement: customer.contractAgreement ? { name: customer.contractAgreement } : '',
  creditApplication: customer.creditApplication ? { name: customer.creditApplication } : '',
  acknowledgementSignature: customer.acknowledgementSignature ? { name: customer.acknowledgementSignature } : '',
  } : {
  acknowledgementSignature: customer.acknowledgementSignature ? { name: customer.acknowledgementSignature } : '',
  contractAgreement: customer.contractAgreement ? { name: customer.contractAgreement } : '',
  creditApplication: customer.creditApplication ? { name: customer.creditApplication } : '',
  nonTradingDocuments: customer.nonTradingDocuments ? { name: customer.nonTradingDocuments } : ''
}
    }

    // Default data if no customer provided
    return {
      'Business Details': {
        companyName: '',
        companyNameArabic: '',
        commercialRegistrationNumber: '',
        vatRegistrationNumber: '',
        baladeahLicense: '',
        companyType: '',
        businessType: '',
        businessTypeOther: '',
        deliveryLocations: '',
        brandName: '',
        brandNameArabic: '',
        companyLogo: '',
        brandLogo: ''
      }
    }
  }
}





