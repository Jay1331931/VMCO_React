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
      
    
    { type: 'dropdownObject',
        name: Constants.ENTITY.VMCO,
        label: t('VMCO'),
        placeholder: t('Select'),
        required: false,
        parentField: 'assignedToEntityWise',
    },
    { type: 'dropdownObject',
        name: Constants.ENTITY.SHC,
        label: t('SHC'),
        placeholder: t('Select'),
        required: false,
        parentField: 'assignedToEntityWise',
    },
    { type: 'dropdownObject',
        name: Constants.ENTITY.NAQI,
        label: t('NAQI'),
        placeholder: t('Select'),
        required: false,
        parentField: 'assignedToEntityWise',
    },
    { type: 'dropdownObject',
        name: Constants.ENTITY.GMTC,
        label: t('GMTC'),
        placeholder: t('Select'),
        required: false,
        parentField: 'assignedToEntityWise',
    },
    { type: 'dropdownObject',
        name: Constants.ENTITY.DAR,
        label: t('DAR'),
        placeholder: t('Select'),
        required: false,
        parentField: 'assignedToEntityWise',
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
  console.log('getBusinessDetailsFormData called with companyType:', companyType);
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
        [Constants.ENTITY.VMCO]: customer?.['assignedToEntityWise']?.[Constants.ENTITY.VMCO] || customer?.workflowData?.updates?.[Constants.ENTITY.VMCO] || '',
        [Constants.ENTITY.SHC]: customer[Constants.ENTITY.SHC] || customer?.workflowData?.updates?.[Constants.ENTITY.SHC] || '',
        [Constants.ENTITY.NAQI]: customer[Constants.ENTITY.NAQI] || customer?.workflowData?.updates?.[Constants.ENTITY.NAQI] || '',
        [Constants.ENTITY.GMTC]: customer[Constants.ENTITY.GMTC] || customer?.workflowData?.updates?.[Constants.ENTITY.GMTC] || '',
        [Constants.ENTITY.DAR]: customer[Constants.ENTITY.DAR] || customer?.workflowData?.updates?.[Constants.ENTITY.DAR] || '',
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
        // credit: customer.credit || false,
        // creditLimit: customer.creditLimit || '',
        // creditPeriod: customer.creditPeriod || '',
        // creditBalance: customer.creditBalance || '',
        creditDar: customer.credit?.[Constants.ENTITY.DAR] || false,
        creditLimitDar: customer.credit?.[Constants.ENTITY.DAR]?.limit || '',
        creditPeriodDar: customer.credit?.[Constants.ENTITY.DAR]?.period || '',
        creditNaqi: customer.credit?.[Constants.ENTITY.NAQI] || false,
        creditLimitNaqi: customer.credit?.[Constants.ENTITY.NAQI]?.limit || '',
        creditPeriodNaqi: customer.credit?.[Constants.ENTITY.NAQI]?.period || '',
        creditGmtc: customer.credit?.[Constants.ENTITY.GMTC] || false,
        creditLimitGmtc: customer.credit?.[Constants.ENTITY.GMTC]?.limit || '',
        creditPeriodGmtc: customer.credit?.[Constants.ENTITY.GMTC]?.period || '',
        creditVmco: customer.credit?.[Constants.ENTITY.VMCO] || false,
        creditLimitVmco: customer.credit?.[Constants.ENTITY.VMCO]?.limit || '',
        creditPeriodVmco: customer.credit?.[Constants.ENTITY.VMCO]?.period || '',
        creditShc: customer.credit?.[Constants.ENTITY.SHC] || false,
        creditLimitShc: customer.credit?.[Constants.ENTITY.SHC]?.limit || '',
        creditPeriodShc: customer.credit?.[Constants.ENTITY.SHC]?.period || '',

        // pricingPolicy: customer.pricingPolicy || '',
        pricingPolicySHC: customer?.pricingPolicy?.[Constants.ENTITY.SHC] || customer?.workflowData?.updates?.pricingPolicy?.[Constants.ENTITY.SHC] || '',
        pricingPolicyNAQI: customer?.pricingPolicy?.[Constants.ENTITY.NAQI] || customer?.workflowData?.updates?.pricingPolicy?.[Constants.ENTITY.NAQI] || '',
        pricingPolicyGMTC: customer?.pricingPolicy?.[Constants.ENTITY.GMTC] || customer?.workflowData?.updates?.pricingPolicy?.[Constants.ENTITY.GMTC] || '',
        pricingPolicyDAR: customer?.pricingPolicy?.[Constants.ENTITY.DAR] || customer?.workflowData?.updates?.pricingPolicy?.[Constants.ENTITY.DAR] || '',
        pricingPolicyVMCO: customer?.pricingPolicy?.[Constants.ENTITY.VMCO] || customer?.workflowData?.updates?.pricingPolicy?.[Constants.ENTITY.VMCO] || '',
        isDeliveryChargesApplicable: customer.isDeliveryChargesApplicable || false,
      },
      'Documents': (companyType === 'trading') ? {
  crCertificate: customer.crCertificate || customer?.workflowData?.updates?.crCertificate,
  vatCertificate: customer.vatCertificate || customer?.workflowData?.updates?.vatCertificate,
  bankLetter: customer.bankLetter || customer?.workflowData?.updates?.bankLetter,
  nationalId: customer.nationalId || customer?.workflowData?.updates?.nationalId,
  nationalAddress: customer.nationalAddress || customer?.workflowData?.updates?.nationalAddress,
  contractAgreement: customer.contractAgreement || customer?.workflowData?.updates?.contractAgreement,
  creditApplication: customer.creditApplication || customer?.workflowData?.updates?.creditApplication,
  acknowledgementSignature: customer.acknowledgementSignature || customer?.workflowData?.updates?.acknowledgementSignature,
  } : {
  acknowledgementSignature: customer.acknowledgementSignature || customer?.workflowData?.updates?.acknowledgementSignature,
  contractAgreement: customer.contractAgreement || customer?.workflowData?.updates?.contractAgreement,
  creditApplication: customer.creditApplication || customer?.workflowData?.updates?.creditApplication,
  nonTradingDocuments: customer?.nonTradingDocuments ||''
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





