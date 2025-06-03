import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/forms.css';
import CommentPopup from '../components/commentPanel';
import '../i18n';
import { useTranslation } from 'react-i18next';
import { getBusinessDetailsForm, getBusinessDetailsFormData } from './customerDetailsForms/customerBusinessDetails';
import { getContactDetailsForm } from './customerDetailsForms/customerContactDetails';
import { getFinancialInformationForm } from './customerDetailsForms/customerFinancialInformation';
import { getDocumentsForm } from './customerDetailsForms/customerDocuments';
import CustomerProducts from './customerDetailsForms/customerProducts';
import CustomerBranches from './customerDetailsForms/customerBranches2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faLocationDot, faDownload, faEye } from '@fortawesome/free-solid-svg-icons';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Pagination from '../components/Pagination';
import ApprovalDialog from '../components/ApprovalDialog';
import RbacManager from '../utilities/rbac';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const LocationPicker = ({ onLocationSelect, initialLat, initialLng }) => {
  const mapContainer = useRef(null);
  const markerRef = useRef(null); // Using ref instead of state for the marker
  const [map, setMap] = useState(null);
  const { t, i18n } = useTranslation();
  const [coords, setCoords] = useState('Detecting your location...');
  const [coordsArabic, setCoordsArabic] = useState(t('Detecting your location...'));
  const [defaultCenter] = useState([77.5946, 12.9716]);
  const [zoom] = useState(14);
  const [confirmedLocation, setConfirmedLocation] = useState(null);
  console.log('initialLat:', initialLat);
  console.log('initialLng:', initialLng);

  useEffect(() => {
    let mapInstance;

    const initializeMap = async () => {
      mapInstance = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://api.maptiler.com/maps/streets/style.json?key=NxvpwMoXuYLINUijkWEc',
        center: initialLat && initialLng ? [initialLng, initialLat] : defaultCenter,
        zoom: zoom
      });

      mapInstance.on('load', async () => {
        setMap(mapInstance);
        try {
          const position = initialLat && initialLng ? { coords: { latitude: initialLat, longitude: initialLng } } : await getCurrentPosition();
          console.log('Geolocation position:', position.coords);
          const { latitude, longitude } = position.coords;
          updateMarker(mapInstance, longitude, latitude);
        } catch (error) {
          console.log('Geolocation error:', error);
          setCoords('Click on the map to select a location');
          setCoordsArabic(t('Click on the map to select a location'));
        }
      });

      mapInstance.on('click', (e) => {
        if (!confirmedLocation) {
          const { lng, lat } = e.lngLat;
          updateMarker(mapInstance, lng, lat);
        }
      });

      return () => {
        if (markerRef.current) markerRef.current.remove();
        mapInstance.remove();
      };
    };

    const getCurrentPosition = () => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000
        });
      });
    };

    const updateMarker = (map, lng, lat) => {
      // Remove existing marker if it exists
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      // Create new marker
      const newMarker = new maplibregl.Marker()
        .setLngLat([lng, lat])
        .addTo(map);

      markerRef.current = newMarker;
      setCoords(`Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`);
      setCoordsArabic(`خط العرض: ${lat.toFixed(6)}, خط الطول: ${lng.toFixed(6)}`);

      map.setCenter([lng, lat]);
    };

    initializeMap();

    return () => {
      if (mapInstance) mapInstance.remove();
    };
  }, [confirmedLocation]);

  const handleConfirm = () => {
    if (markerRef.current) {
      const lngLat = markerRef.current.getLngLat();
      onLocationSelect(lngLat.lat, lngLat.lng);
      setConfirmedLocation(lngLat);
    }
  };

  const handleReset = () => {
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    setConfirmedLocation(null);
    setCoords('Click on the map to select a location');
    setCoordsArabic(t('Click on the map to select a location'));
  };

  return (
    <div className="location-picker-container">
      <div ref={mapContainer} className="map-container" />
      <div className="location-coords">{i18n.language === 'ar' ? coordsArabic : coords}</div>
      <div className="location-actions">
        {!confirmedLocation ? (
          <button
            className="confirm-location-button"
            onClick={handleConfirm}
            disabled={!markerRef.current}
          >
            Confirm Location
          </button>
        ) : (
          <>
            <div className="location-confirmed">
              Location confirmed!
            </div>
            <button
              className="reset-location-button"
              onClick={handleReset}
            >
              Change Location
            </button>
          </>
        )}
      </div>
    </div>
  );
};
function CustomersDetails() {
const transformCustomerData = async (customer, customerContacts) => {
  console.log("Inside transform customer data")
    const contacts = Array.isArray(customerContacts)
      ? customerContacts
      : customerContacts ? [customerContacts] : [];

    // Create a map of contactType to contact data (note: using contactType instead of contact_type)
    const contactsMap = contacts.reduce((acc, contact) => {
      acc[contact.contactType] = contact;
      return acc;
    }, {});
      let isAppMode = false;
  
  try {
    const res = await fetch(`${API_BASE_URL}/workflow-instance/check/id/${customer?.id}/module/customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    console.log(res)
    if (res.ok) {
      const responseText = await res.text(); // Get raw response text ('t' or 'f')
      console.log(responseText)
      const data = responseText ? JSON.parse(responseText) : {};
      isAppMode = data?.exists === 't'; // Convert to boolean
      console.log("is approval mode", isAppMode)
      console.log(`Workflow check result for customer ${customer?.id}:`, isAppMode);
    } else {
      console.log(`Workflow check failed for customer ${customer?.id}:`, res.status);
    }
  } catch (err) {
    console.error('Error fetching workflow instance:', err);
  }
    return {
      ...customer,
      // Contact details - each contact type is a separate row in DB
      primaryContactName: contactsMap.primary?.name || '',
      primaryContactDesignation: contactsMap.primary?.designation || '',
      primaryContactEmail: contactsMap.primary?.email || '',
      primaryContactMobile: contactsMap.primary?.mobile || '',  // Changed from phone to mobile

      businessHeadName: contactsMap.business?.name || '',
      businessHeadDesignation: contactsMap.business?.designation || '',
      businessHeadEmail: contactsMap.business?.email || '',
      businessHeadMobile: contactsMap.business?.mobile || '',

      financeHeadName: contactsMap.finance?.name || '',
      financeHeadDesignation: contactsMap.finance?.designation || '',
      financeHeadEmail: contactsMap.finance?.email || '',
      financeHeadMobile: contactsMap.finance?.mobile || '',

      purchasingHeadName: contactsMap.purchasing?.name || '',
      purchasingHeadDesignation: contactsMap.purchasing?.designation || '',
      purchasingHeadEmail: contactsMap.purchasing?.email || '',
      purchasingHeadMobile: contactsMap.purchasing?.mobile || '',

      // Adding operations contact if needed
      operationsHeadName: contactsMap.operations?.name || '',
      operationsHeadDesignation: contactsMap.operations?.designation || '',
      operationsHeadEmail: contactsMap.operations?.email || '',
      operationsHeadMobile: contactsMap.operations?.mobile || '',

      isApprovalMode : isAppMode,
    };
}

  const fetchCustomerContacts = async (customerId, customer) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customer-contacts/${customerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const result = await response.json();
      if (result.status === 'Ok') {
        const transformedData = await transformCustomerData(customer, result.data); 
      console.log("transformedData",transformedData)
      console.log("transformedData",transformedData)
      console.log("transformedData",transformedData)
      console.log("transformedData",transformedData)
      console.log("transformedData",transformedData)
        setCustomer(transformedData);
      } else {
        throw new Error(response.data.message || 'Failed to fetch customer contacts');
      }
    } catch (err) {
      console.error('Error fetching customer contacts:', err);
    }
  };


const fetchApprovedCustomer = async (transformedCustomer) => {
console.log("Fetch Approved Customer Called")
  const customerId = transformedCustomer?.id || transformedCustomer?.customerId;
  try {
    // Fetch basic customer data
    const response = await fetch(`${API_BASE_URL}/customers/id/${customerId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    const result = await response.json();

    if (result.status !== 'Ok') {
      throw new Error(result.data?.message || 'Failed to fetch customer data');
    }

    let customerData = result.data;
    // console.log('Initial Customer Data:', customerData);
    fetchCustomerContacts(customerId, customerData)
    const [contactsResponse, paymentMethodsResponse] = await  Promise.all([
      fetch(`${API_BASE_URL}/customer-contacts/${customerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      }),
      fetch(`${API_BASE_URL}/payment-method/id/${customerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
    ]);

    const contactsResult = await contactsResponse.json();
    if (contactsResult.status === 'Ok') {
      customerData = transformCustomerData(customerData, contactsResult.data);
      console.log('Customer Data with Contacts:', customerData);
    }

    const paymentResult = await paymentMethodsResponse.json();
    if (paymentResult.status === 'Ok') {
      const paymentMethods = Array.isArray(paymentResult.data) 
        ? paymentResult.data 
        : [];
      
      customerData = {
        ...customerData,
        paymentMethods,
        creditLimit: paymentMethods.find(m => m?.methodName === 'Credit')?.creditLimit || 0,
        balance: paymentMethods.find(m => m?.methodName === 'Credit')?.balance || 0
      };
      // console.log('Customer Data with Payment Methods:', customerData);
    }
    // setCustomer(customerData);
    // if(transformedCustomer.isApprovalMode)
    // {
    // // setApprovedCustomer(customerData);
    // if (transformedCustomer.workflowData?.updates) {
    //     // First set all the customer data
    //     setFormData(prevFormData => ({
    //       ...prevFormData,
    //       ...customerData
    //     }));
        
    //     // Then individually set each update field
    //     Object.entries(transformedCustomer.workflowData.updates).forEach(([key, value]) => {
    //       setFormData(prevFormData => ({
    //         ...prevFormData,
    //         [key]: value
    //       }));
    //     });
    //   }
    // }
    if (transformedCustomer.isApprovalMode) {
    if (transformedCustomer.workflowData?.updates) {
    // First, set all customer data while preserving current values
    setFormData(prevFormData => {
      const newFormData = { ...prevFormData, ...customerData };

      // If 'current' doesn't exist, initialize it with the current values
      if (!newFormData.current) {
        newFormData.current = { ...prevFormData };
      }

      // Apply updates while preserving current values
      Object.entries(transformedCustomer.workflowData.updates).forEach(([key, value]) => {
        if (newFormData[key] !== undefined) {
          // Store the current value if not already stored
          if (!newFormData.current[key]) {
            newFormData.current[key] = newFormData[key];
          }
          // Apply the update
          newFormData[key] = value;
        }
      });

      return newFormData;
    });
  }
}
console.log("Approved Customer Data", customerData);
setApprovedCustomer(customerData);

return customerData;
    // console.log("Approved Customer Data", customerData)
    // setApprovedCustomer(customerData)
    // setFormData(customerData)
    // return customerData;

  } catch (err) {
    console.error('Error in fetchCustomer:', err);
    throw err;
  }
}

const fetchCustomerPaymentMethods = async (customerId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/payment-method/id/${customerId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    const result = await response.json();
    return result.status === 'Ok' ? result.data : null;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return null;
  }
};
  const contentRef = useRef(null);
  const [tabsHeight, setTabsHeight] = useState('auto');

  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const location = useLocation();
  const transformedCustomer = location.state?.transformedCustomer;
  console.log("location.state", location.state);
console.log("transformedCustomer", transformedCustomer);
// Extract from location.state
// const rawTransformedCustomer = location.state?.transformedCustomer;

// // Clean it: remove numeric keys like 0,1,2,... that are probably workflow steps
// const transformedCustomer = useMemo(() => {
//   if (!rawTransformedCustomer || typeof rawTransformedCustomer !== 'object') return null;

//   return Object.fromEntries(
//     Object.entries(rawTransformedCustomer).filter(([key]) => isNaN(Number(key)))
//   );
// }, [rawTransformedCustomer]);

  // const [customer, setCustomer] = useState(transformedCustomer);
  // const [approvedCustomer, setApprovedCustomer] = useState(fetchApprovedCustomer(transformedCustomer));
  const [customer, setCustomer] = useState(transformedCustomer);
  const [approvedCustomer, setApprovedCustomer] = useState(null);
  // let approvedCustomer = fetchApprovedCustomer(transformedCustomer);
  const [branchesData, setBranchesData] = useState([]);
  const [branchChanges, setBranchChanges] = useState({});
  const { t, i18n } = useTranslation();
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const formMode = location.state?.mode;

  const { token, user, isAuthenticated, logout } = useAuth();

//   useEffect(() => {
//   if (transformedCustomer?.customerId) {
//     const customerId = transformedCustomer?.customerId;
//     fetchCustomer(customerId)
//       .then(fetchedCustomer => setCustomer(fetchedCustomer))
//       .catch(error => console.error('Error fetching customer:', error));
//   }
  
// }, [transformedCustomer.customerId]);
useEffect(() => {
  const fetchData = async () => {
    await fetchApprovedCustomer(transformedCustomer);
  };

  fetchData();
}, []);

  // useEffect(() => {
  //   console.log(transformedCustomer.id)
  //   const initializeData = async () => {
  //     if (!transformedCustomer) return;
  //     setIsLoading(true);
  //     try {
  //       if (transformedCustomer.id) {
  //         console.log("Fetching Approved Customer")
  //         const fetchedCustomer = await fetchApprovedCustomer(transformedCustomer);
  //         setApprovedCustomer(fetchedCustomer)
  //         // approvedCustomer = fetchedCustomer;
  //       } else {
  //         const customerData = await fetchCustomer(transformedCustomer.customerId);
  //         setCustomer(customerData);
  //         setFormData(customerData);
  //       }
  //     } catch (error) {
  //       console.error('Initialization error:', error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   initializeData();
  // }, [transformedCustomer]);

  let customerFormMode;
  if (formMode === 'edit') {
    customerFormMode = 'custDetailsEdit';
  }
  else {
    if (transformedCustomer.customerStatus === 'New') {
      customerFormMode = 'custDetailsAdd';
    } else if (transformedCustomer.customerStatus === 'Approved' && customer.isApprovalMode) {
      customerFormMode = 'custDetailsEdit';
    } else if (transformedCustomer.customerStatus === 'Approved' && !customer.isApprovalMode){
      customerFormMode = 'custDetailsAdd';
    } else {
      customerFormMode = 'custDetailsAdd';
    }
  }

  const rbacMgr = new RbacManager(user.userType == 'employee' && user.roles[0] !== 'admin' ? user.designation : user.roles[0], customerFormMode);
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  const formsByTab = useMemo(() => ({
    'Business Details': getBusinessDetailsForm(t)['Business Details'],
    'Contact Details': getContactDetailsForm(t)['Contact Details'],
    'Financial Information': getFinancialInformationForm(t)['Financial Information'],
    'Documents': getDocumentsForm(t)['Documents'],
    'Branches': [
      { type: 'text', name: 'branchName', label: t('Branch Name'), placeholder: t('Enter branch name') },
      { type: 'text', name: 'branchLocation', label: t('Branch Location'), placeholder: t('Enter location') },
    ],
    'Products & MoQ': [],
  }), [t]);
  const formDataByTab = useMemo(() => ({
    'Business Details': getBusinessDetailsFormData(t, customer)['Business Details'],
    'Contact Details': getBusinessDetailsFormData(t, customer)['Contact Details'],
    'Financial Information': getBusinessDetailsFormData(t, customer)['Financial Information'],
    'Documents': getBusinessDetailsFormData(t, customer)['Documents'],
  }), [t]);
  const tabs = Object.keys(formsByTab);
  const initialFormData = useMemo(() => {
    const allData = {};
    Object.keys(formsByTab).forEach(tab => {
      const tabData = getBusinessDetailsFormData(t, customer)?.[tab] || {};
      const fields = formsByTab[tab];

      fields.forEach(field => {
        if (!(field.name in allData)) {
          allData[field.name] = tabData[field.name] || (field.type === 'checkbox' ? [] : '');
        }
      });
    });
    return allData;
  }, [t, customer, formsByTab]);

  const isArabicText = (text) => {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
  };
  const [activeTab, setActiveTab] = useState('Business Details');
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
    const fields = formsByTab[activeTab];
    const existingData = formDataByTab[activeTab] || {};

    const newFormData = { ...existingData };
    fields.forEach(field => {
      if (!(field.name in newFormData)) {
        newFormData[field.name] = field.type === 'checkbox' ? [] : '';
      }
    });

  }, [activeTab, formDataByTab, formsByTab]);

  const setFormDataByTab = (tab) => {
    setFormData(prev => ({
      ...prev,
      ...formDataByTab[tab]
    })
    );
  }

  const [changedFields, setChangedFields] = useState(new Set());
  const [savedData, setSavedData] = useState({});


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputVal = type === 'checkbox' ? checked : value;
    setChangedFields(prev => new Set(prev).add(name));
    setFormData(prev => ({ ...prev, [name]: inputVal }));
    console.log(formData)
  };
  const handleLocationSelect = (lat, lng) => {
    setSelectedLocation({ lat, lng });
    setFormData(prev => ({
      ...prev,
      geolocation: { x: lat, y: lng }
    }));
    setChangedFields(prev => {
      const newSet = new Set(prev);
      newSet.add('geolocation');
      return newSet;
    });
    setShowMap(false);
  };
  // const validateChangedFields = (action, changedFields, checkRequired = false) => {
  //   const errors = {};
  //   console.log('Validating changed fields:', changedFields);
  //   changedFields.forEach((fieldName) => {
  //     const field = formsByTab[activeTab].find(f => f.name === fieldName);
  //     const value = formData[fieldName];

  //     if (action === 'save changes' && field.required && !value) {
  //       errors[fieldName] = t('This field is required.');
  //     }

  //     if (checkRequired && field?.type === 'text' && field.required && !value) {
  //       errors[fieldName] = t('This field is required.');
  //     }

  //     if (fieldName.toLowerCase().includes('arabic') && value && !isArabicText(value)) {
  //       errors[fieldName] = t('Please enter Arabic text.');
  //     }

  //     if (fieldName.toLowerCase().includes('email')) {
  //       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //       if (value && !emailRegex.test(value)) {
  //         errors[fieldName] = t('Invalid email format');
  //       }
  //     }

  //     if (fieldName.toLowerCase().includes('phone') || fieldName.toLowerCase().includes('number') || fieldName.toLowerCase().includes('#')) {
  //       if (value && isNaN(value)) {
  //         errors[fieldName] = t('Only numeric values are allowed');
  //       }
  //     }
  //     if (activeTab === 'Contact Details') {
  //       // Primary contact validations
  //       if (checkRequired && fieldName === 'primaryContactName' && !formData[fieldName]) {
  //         errors[fieldName] = t('Primary contact name is required');
  //       }

  //       if (checkRequired && fieldName === 'primaryContactEmail') {
  //         if (!formData[fieldName]) {
  //           errors[fieldName] = t('Primary contact email is required');
  //         }
  //       }

  //       // Unique email validation for finance and purchasing heads
  //       if (fieldName === 'financeHeadEmail' || fieldName === 'purchasingHeadEmail') {
  //         const otherHeadEmail = fieldName === 'financeHeadEmail'
  //           ? formData.purchasingHeadEmail
  //           : formData.financeHeadEmail;

  //         if (formData[fieldName] && formData[fieldName] === otherHeadEmail) {
  //           errors[fieldName] = t('Finance and Purchasing heads must have unique emails');
  //         }

  //         // Check if they're using primary contact email
  //         if (formData[fieldName] && formData[fieldName] === formData.primaryContactEmail) {
  //           errors[fieldName] = t('This email is already used by primary contact');
  //         }
  //       }

  //     }
  //     // Add validation for nonTradingDocuments if needed
  //     if (fieldName === 'nonTradingDocuments' && field.required && (!value || value.length === 0)) {
  //       errors[fieldName] = t('At least one document is required');
  //     }
  //   });

  //   setFormErrors(errors);
  //   return Object.keys(errors).length === 0;
  // };
const validateChangedFields = (action, changedFields, checkRequired = false) => {
  const errors = {};
  console.log('Validating changed fields:', changedFields);

  changedFields.forEach((fieldName) => {
    // Find the field in all tabs if checkRequired, otherwise only in activeTab
    let field;
    if (checkRequired) {
      for (const tab of Object.keys(formsByTab)) {
        field = formsByTab[tab].find(f => f.name === fieldName);
        if (field) break;
      }
    } else {
      field = formsByTab[activeTab].find(f => f.name === fieldName);
    }

    // Skip if field is not found in any tab
    if (!field) return;

    const value = formData[fieldName];

    if (action === 'save changes' && field.required && !value) {
      errors[fieldName] = t('This field is required.');
    }

    if (checkRequired && field.type === 'text' && field.required && !value) {
      errors[fieldName] = t('This field is required.');
    }

    if (fieldName.toLowerCase().includes('arabic') && value && !isArabicText(value)) {
      errors[fieldName] = t('Please enter Arabic text.');
    }

    if (fieldName.toLowerCase().includes('email')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        errors[fieldName] = t('Invalid email format');
      }
    }

    if (
      fieldName.toLowerCase().includes('phone') ||
      fieldName.toLowerCase().includes('number') ||
      fieldName.toLowerCase().includes('#')
    ) {
      if (value && isNaN(value)) {
        errors[fieldName] = t('Only numeric values are allowed');
      }
    }

    if (activeTab === 'Contact Details') {
      if (checkRequired && fieldName === 'primaryContactName' && !formData[fieldName]) {
        errors[fieldName] = t('Primary contact name is required');
      }
      if (checkRequired && fieldName === 'primaryContactEmail') {
        if (!formData[fieldName]) {
          errors[fieldName] = t('Primary contact email is required');
        }
      }
      if (fieldName === 'financeHeadEmail' || fieldName === 'purchasingHeadEmail') {
        const otherHeadEmail = fieldName === 'financeHeadEmail'
          ? formData.purchasingHeadEmail
          : formData.financeHeadEmail;

        if (formData[fieldName] && formData[fieldName] === otherHeadEmail) {
          errors[fieldName] = t('Finance and Purchasing heads must have unique emails');
        }
        if (formData[fieldName] && formData[fieldName] === formData.primaryContactEmail) {
          errors[fieldName] = t('This email is already used by primary contact');
        }
      }
    }

    if (fieldName === 'nonTradingDocuments' && field.required && (!value || value.length === 0)) {
      errors[fieldName] = t('At least one document is required');
    }
  });

  setFormErrors(errors);
  return Object.keys(errors).length === 0;
};
  // function transformCustomerData(customer, customerContacts) {

  //   const contacts = Array.isArray(customerContacts)
  //     ? customerContacts
  //     : customerContacts ? [customerContacts] : [];

  //   // Create a map of contactType to contact data (note: using contactType instead of contact_type)
  //   const contactsMap = contacts.reduce((acc, contact) => {
  //     acc[contact.contactType] = contact;
  //     return acc;
  //   }, {});

  //   return {
  //     ...customer,
  //     // Contact details - each contact type is a separate row in DB
  //     primaryContactName: contactsMap.primary?.name || '',
  //     primaryContactDesignation: contactsMap.primary?.designation || '',
  //     primaryContactEmail: contactsMap.primary?.email || '',
  //     primaryContactMobile: contactsMap.primary?.mobile || '',  // Changed from phone to mobile

  //     businessHeadName: contactsMap.business?.name || '',
  //     businessHeadDesignation: contactsMap.business?.designation || '',
  //     businessHeadEmail: contactsMap.business?.email || '',
  //     businessHeadMobile: contactsMap.business?.mobile || '',

  //     financeHeadName: contactsMap.finance?.name || '',
  //     financeHeadDesignation: contactsMap.finance?.designation || '',
  //     financeHeadEmail: contactsMap.finance?.email || '',
  //     financeHeadMobile: contactsMap.finance?.mobile || '',

  //     purchasingHeadName: contactsMap.purchasing?.name || '',
  //     purchasingHeadDesignation: contactsMap.purchasing?.designation || '',
  //     purchasingHeadEmail: contactsMap.purchasing?.email || '',
  //     purchasingHeadMobile: contactsMap.purchasing?.mobile || '',

  //     // Adding operations contact if needed
  //     operationsHeadName: contactsMap.operations?.name || '',
  //     operationsHeadDesignation: contactsMap.operations?.designation || '',
  //     operationsHeadEmail: contactsMap.operations?.email || '',
  //     operationsHeadMobile: contactsMap.operations?.mobile || '',
  //   };
  // }
  // const fetchCustomerContacts = async (customerId, customer) => {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/customer-contacts/${customerId}`, {
  //       method: 'GET',
  //       headers: { 'Content-Type': 'application/json' },
  //       credentials: 'include'
  //     });
  //     const result = await response.json();
  //     if (result.status === 'Ok') {
  //       setCustomer(transformCustomerData(customer, result.data));
  //     } else {
  //       throw new Error(response.data.message || 'Failed to fetch customer contacts');
  //     }
  //   } catch (err) {
  //     console.error('Error fetching customer contacts:', err);
  //   }
  // };
  const handleSave = async (action) => {
    switch (action) {
      case 'save':
      case 'save changes':

        if (activeTab === 'Contact Details') {
          if (formData.financeHeadEmail && formData.purchasingHeadEmail &&
            formData.financeHeadEmail === formData.purchasingHeadEmail) {
            alert(t('Finance and Purchasing heads must have unique emails'));
            return;
          }

          if ((formData.financeHeadEmail && formData.financeHeadEmail === formData.primaryContactEmail) ||
            (formData.purchasingHeadEmail && formData.purchasingHeadEmail === formData.primaryContactEmail)) {
            alert(t('Finance/Purchasing heads cannot use the same email as primary contact'));
            return;
          }
        }

        if (!validateChangedFields(action, changedFields, false)) {
          alert(t('Please correct errors before submitting.'));
          return;
        }

        break;
      case 'block':
        formData.customerStatus = 'Blocked';
        setChangedFields(prev => new Set(prev).add('customerStatus'));
        break;
    }

    // Define contact detail fields
    const contactDetailFields = [
      'primaryContactName', 'primaryContactDesignation', 'primaryContactEmail', 'primaryContactPhone',
      'financeHeadName', 'financeHeadDesignation', 'financeHeadEmail', 'financeHeadPhone',
      'businessHeadName', 'businessHeadDesignation', 'businessHeadEmail', 'businessHeadPhone',
      'purchasingHeadName', 'purchasingHeadDesignation', 'purchasingHeadEmail', 'purchasingHeadPhone'
    ];

    const paymentDetailFields = [
      'prePayment', 'partialPayment', 'advancePayment', 'COD', 'credit', 'creditLimit', 'creditPeriod', 'creditBalance'
    ]

    const customerPayload = {};
    const contactCreatePayload = {};
    const contactUpdatePayload = {};
    const paymentMethodPayload = {
      method_details: {
        credit: {
          isAllowed: formData.credit.isAllowed,
          limit: formData.creditLimit,
          period: formData.creditPeriod,
          balance: formData.credit.balance
        },
        prePayment: {
          isAllowed: formData.prePayment.isAllowed,
        },
        advancePayment: {
          isAllowed: formData.advancePayment.isAllowed,
          balance: formData.advancePayment.balance
        },
        COD: {
          isAllowed: formData.COD.isAllowed,
          limit: formData.COD.limit,
        }
      }
    };
    const customerData = customer || {};

    changedFields.forEach(fieldName => {
      if (fieldName === 'id') return;

      const newValue = formData[fieldName];
      const oldValue = customerData[fieldName];

      if (newValue !== oldValue) {
        if (contactDetailFields.includes(fieldName)) {
          if (oldValue === undefined || oldValue === null || oldValue === '') {
            contactCreatePayload[fieldName] = newValue;
          } else {
            contactUpdatePayload[fieldName] = newValue;
          }
        } else if (paymentDetailFields.includes(fieldName)) {

        }
        else {
          customerPayload[fieldName] = newValue;
          customerPayload['customerStatus'] = (formData.customerStatus || customerData.customerStatus).toLowerCase();
        }
      }
    });

    // Early return if no changes
    if (Object.keys(customerPayload).length === 0 &&
      Object.keys(contactCreatePayload).length === 0 &&
      Object.keys(contactUpdatePayload).length === 0 &&
      uploadedFiles.length === 0) {
      alert(t('No changes detected to save'));
      return;
    }

    try {
      // 1. Update customer table if needed
      if (Object.keys(customerPayload).length > 0) {
        await fetch(`${API_BASE_URL}/customers/id/${customer.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customerPayload),
          credentials: 'include',
        });
      }

      if (Object.keys(paymentMethodPayload).length > 0) {
        await fetch(`${API_BASE_URL}/payment-method/id/${customer.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentMethodPayload),
          credentials: 'include',
        });
      }

      //   // 2. Create new contact details if needed
      //   if (Object.keys(contactCreatePayload).length > 0) {
      //     await fetch(`http://localhost:3000/api/customers/id/${customer.id}/contact-details`, {
      //       method: 'POST',
      //       headers: { 'Content-Type': 'application/json' },
      //       body: JSON.stringify(contactCreatePayload),
      //       credentials: 'include',
      //     });
      //   }

      // 3. Update existing contact details if needed
      if (Object.keys(contactUpdatePayload).length > 0) {
        await fetch(`${API_BASE_URL}/customer-contacts/${customer.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contactUpdatePayload),
          credentials: 'include',
        });
      }

      //   // Update UI state
      //   setSavedData(prev => ({
      //     ...prev,
      //     [activeTab]: {
      //       ...prev[activeTab],
      //       ...customerPayload,
      //       ...contactCreatePayload,
      //       ...contactUpdatePayload
      //     }
      //   }));

      //   // Clear changed fields
      //   setChangedFields(prev => {
      //     const newSet = new Set(prev);
      //     [
      //       ...Object.keys(customerPayload),
      //       ...Object.keys(contactCreatePayload),
      //       ...Object.keys(contactUpdatePayload)
      //     ].forEach(field => newSet.delete(field));
      //     return newSet;
      //   });
      if (Object.keys(branchChanges).length > 0) {
        await Promise.all(
          Object.entries(branchChanges).map(async ([branchId, changes]) => {
            const response = await fetch(`${API_BASE_URL}/customer-branches/${branchId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(changes),
              credentials: 'include',
            });
            return response.json();
          })
        );
      }
      handleSaveFiles();
      alert(`${action.charAt(0).toUpperCase() + action.slice(1)} successful!`);

    } catch (error) {
      console.error('Update error:', error);
      setFormErrors(error.message || 'Unable to connect to server');
    }

    try {

      const response = await fetch(`${API_BASE_URL}/customers/id/${customer.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const result = await response.json();
      setCustomer(result.data)
      fetchCustomerContacts(customer.id, customer)
    } catch (err) {
      console.error('Error fetching customer:', err);
    }
  };
  const [uploadedFiles, setUploadedFiles] = useState(
    formData
  );
  const handleTabClick = (tab) => {
    setTabsHeight('auto');
    setActiveTab(tab);
    // setFormDataByTab(tab);
    setFormErrors({});
    if (tab === 'Documents') {
      setUploadedFiles(formData);
    }
  };

  const [dropdownOptions, setDropdownOptions] = useState({});

  const getOptionsFromBasicsMaster = async (fieldName) => {
    const params = new URLSearchParams({
      filters: JSON.stringify({ master_name: fieldName }) // Properly stringify the filter
    });

    try {
      const response = await fetch(`${API_BASE_URL}/basics-masters?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json(); // Don't forget 'await' here

      const options = result.data.map(item => item.value);
      return options;

    } catch (err) {
      console.error('Error fetching options:', err);
      return []; // Return empty array on error
    }
  };

  const getOptionsFromEmployees = async (fieldName) => {
    const params = new URLSearchParams({
      filters: { designation: "sales executive" } // Properly stringify the filter
    });
    const supportStaffDesignation = "sales executive";
    try {
      const response = await fetch(`${API_BASE_URL}/employees/pagination?filters={"designation": "${supportStaffDesignation}"}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      const options = result.data.data.map(item => item.name);
      return options;
    } catch (err) {
      console.error('Error fetching employee options:', err);
      return [];
    }
  };

  useEffect(() => {
    const fetchDropdownOptions = async () => {
      const options = {};
      // Find all dropdown fields and fetch their options
      const dropdownFields = formsByTab[activeTab].filter(field => field.type === 'dropdown');

      for (const field of dropdownFields) {

        try {
          let data = await getOptionsFromBasicsMaster(field.name);
          // options[field.name] = data;
          if (field.name === 'assignedTo' || field.name === 'assignedToEntityWise') {
            data = await getOptionsFromEmployees(field.name);
          }
          options[field.name] = data.map(opt =>
            typeof opt === 'string'
              ? opt.charAt(0).toUpperCase() + opt.slice(1)
              : opt // Fallback if not a string
          );
        } catch (err) {
          console.error(`Failed to fetch options for ${field.name}:`, err);
          options[field.name] = []; // Fallback to empty array

        }
      }

      setDropdownOptions(options);
    };

    fetchDropdownOptions();
  }, [formsByTab, activeTab]);
  const [pendingFileUploads, setPendingFileUploads] = useState({});

  const handleFileUpload = async (e, fieldName) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      // Special handling for logo upload
      if (fieldName.includes('Logo')) {
        const file = files[0];
        const fileData = {
          name: file.name,
          file,
          url: URL.createObjectURL(file),
          isNew: true,
        };
        setUploadedFiles(prev => ({
          ...prev,
          [fieldName]: fileData, // Directly assign the object (no array spread)
        }));
        setPendingFileUploads(prev => ({
          ...prev,
          [fieldName]: fileData,
        }));
        return;
      }

      if (fieldName === 'nonTradingDocuments') {
        // Multi-file upload (array)
        const newFiles = files.map(file => ({
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          file,
          url: URL.createObjectURL(file),
          isNew: true,
        }));

        setUploadedFiles(prev => ({
          ...prev,
          [fieldName]: {
            ...prev[fieldName], // Preserve existing object structure
            name: [...(prev[fieldName]?.name || []), ...newFiles], // Update the `name` array
          },
        }));

        setPendingFileUploads(prev => ({
          ...prev,
          [fieldName]: [...(prev[fieldName] || []), ...newFiles],
        }));
      } else {
        // Single file upload (object)
        const file = files[0];
        const fileData = {
          name: file.name,
          file,
          url: URL.createObjectURL(file),
          isNew: true,
        };

        setUploadedFiles(prev => ({
          ...prev,
          [fieldName]: fileData, // Directly assign the object (no array spread)
        }));

        setPendingFileUploads(prev => ({
          ...prev,
          [fieldName]: fileData,
        }));
      }
    } catch (error) {
      console.error('Error handling file:', error);
      alert(`Error handling file: ${error.message}`);
    }
  };
  const handleSaveFiles = async () => {
    try {
      const uploadPromises = [];
      // Process single file uploads
      Object.entries(pendingFileUploads).forEach(([fieldName, fileData]) => {
        if (fieldName !== 'nonTradingDocuments' && fileData?.isNew) {
          const formData = new FormData();
          formData.append('file', fileData.file);
          formData.append('fileType', fieldName);


          fetch(`${API_BASE_URL}/customers/file/${customer.id}`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          }
          );
        }
      });

      // Process multiple documents if needed
      if (pendingFileUploads.nonTradingDocuments) {
        pendingFileUploads.nonTradingDocuments.forEach(fileData => {
          if (fileData.isNew) {
            const formData = new FormData();
            formData.append('file', fileData.file);
            formData.append('fileType', 'nonTradingDocuments');

            uploadPromises.push(
              fetch(`${API_BASE_URL}/customers/file/${customer.id}`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
              })
            );
          }
        });
      }

      // Execute all uploads
      const results = await Promise.all(uploadPromises);
      const allSuccessful = results.every(res => res.ok);

      if (allSuccessful) {
        // alert('All files saved successfully!');
        setPendingFileUploads({}); // Clear pending uploads
      } else {
        throw new Error('Some files failed to upload');
      }
    } catch (error) {
      console.error('Error saving files:', error);
      alert(`Error saving files: ${error.message}`);
    }
  };

  const handleFileDelete = (fieldName, fileId = null) => {
    if (fieldName === 'nonTradingDocuments' && fileId) {
      // Handle deletion from nonTradingDocuments (multi-file upload)
      setUploadedFiles(prev => {
        // Ensure we're working with the correct structure { name: [...] }
        const currentFiles = prev[fieldName]?.name || [];

        return {
          ...prev,
          [fieldName]: {
            ...prev[fieldName], // Preserve other properties if any
            name: currentFiles.filter(file => file.id !== fileId), // Filter out the deleted file
          },
        };
      });

      // Update formData (if needed)
      setFormData(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          name: (prev[fieldName]?.name || []).filter(file => file.id !== fileId),
        },
      }));

      // Revoke object URL (cleanup)
      const fileToDelete = uploadedFiles[fieldName]?.name?.find(file => file.id === fileId);
      if (fileToDelete?.url) {
        URL.revokeObjectURL(fileToDelete.url);
      }

    } else {
      // Handle single file deletion (crCertificate, vatCertificate, etc.)
      setUploadedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[fieldName]; // Remove the entire field for single files
        return newFiles;
      });

      setFormData(prev => {
        // Revoke object URL if it exists
        if (prev[fieldName]?.url?.startsWith('blob:')) {
          URL.revokeObjectURL(prev[fieldName].url);
        }
        return { ...prev, [fieldName]: null }; // Reset to null or empty object
      });
    }
  };

  const handleApprovalSubmit = async (action) => {
    setApprovalAction(action);
    setIsApprovalDialogOpen(true);
  };

  const handleDialogSubmit = async (comment) => {
    const payload = {
      workflowData: customer.workflowData || {},
      approvedStatus: approvalAction === 'approve' ? "Approved" : "Rejected",
      comment: comment
    };

    try {
      const response = await fetch(`${API_BASE_URL}/workflow-instance/id/${customer.workflowInstanceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (response.ok) {
        // Refresh customer data or navigate away
        const result = await response.json();
        // Handle success (maybe refresh the customer data)
      } else {
        throw new Error('Failed to submit approval');
      }
    } catch (error) {
      console.log('Error', error.message)
      console.error(`Error ${approvalAction}ing customer:`, error);
      alert(`Error ${approvalAction}ing customer: ${error.message}`);
    }
  };

  const handleSubmit = (action) => {
    if (!validateChangedFields('save changes', changedFields, true)) {
      alert(t('Please correct errors before submitting.'));
      return;
    }
    if (action === 'approve') {
      console.log('Approving customer:', customer);
      // Open dialog box where user can also add comments
      const comment = prompt(t('Please enter your comments for approval:'));
      console.log('Approval comment:', comment);
      const payload = {
        workflowData: customer.workflowData || {},
        approvedStatus: "approved",
        comment: comment
      }
      try {
        const res = fetch(`${API_BASE_URL}/workflow-instance/id/${customer.workflowInstanceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
        res.then(response => {
          if (response.ok) {
            // alert(`${action.charAt(0).toUpperCase() + action.slice(1)} action triggered.`);
          }
        });
      } catch (error) {
        console.error('Error approving customer:', error);
        alert(`Error approving customer: ${error.message}`);
      }
    }

    if (action === 'reject') {
      // Handle rejection logic
      console.log('Rejecting customer:', customer);
      // Open dialog box where user can also add comments
      const comment = prompt(t('Please enter your comments for rejection:'));
      console.log('Rejection comment:', comment);
      const payload = {
        workflowData: customer.workflowData || {},
        approvedStatus: "rejected",
        comment: comment
      }
      try {
        const res = fetch(`${API_BASE_URL}/workflow-instance/id/${customer.workflowInstanceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
        res.then(response => {
          if (response.ok) {
            // alert(`${action.charAt(0).toUpperCase() + action.slice(1)} action triggered.`);
          }
        });
      } catch (error) {
        console.error('Error rejecting customer:', error);
        alert(`Error rejecting customer: ${error.message}`);
      }
    }

   if (action === 'submit') {
  console.log('Submitting customer');
  console.log('formData', formData);
  
  // 1. First update customer status (if using state, use proper setter)
  const updatedCustomer = { ...customer, customerStatus: 'Pending' };
  
  // 2. Prepare all changed fields at once
  const newChangedFields = new Set();
  newChangedFields.add('customerStatus');
  Object.keys(formData).forEach(field => newChangedFields.add(field));
  
  console.log('Prepared changedFields:', newChangedFields); // Debug
  
  // 3. Run validation against the PREPARED fields (not state)
  if (!validateChangedFields('save changes', newChangedFields, true)) {
    alert(t('Please correct errors before submitting.'));
    return;
  }
  
  // 4. Update state and handle save TOGETHER
  setChangedFields(newChangedFields);
  setCustomer(updatedCustomer); // If using state
  
  // 5. Now handle save with guaranteed updated values
  handleSave('save changes');
  
  // Debug logs
  console.log('State changedFields:', changedFields); // Will still be old value (async)
  console.log('Current customer:', updatedCustomer);
}

  };
  // In your component

  const handleCheckboxChange = (e, fieldName) => {
    const { value, checked } = e.target;

    setFormData((prev) => {
      const updatedData = { ...prev };

      if (fieldName === 'businessHeadSameAsPrimary') {
        if (checked) {
          // Copy primary contact details to business head fields
          updatedData.businessHeadName = prev.primaryContactName;
          updatedData.businessHeadDesignation = prev.primaryContactDesignation;
          updatedData.businessHeadEmail = prev.primaryContactEmail;
          updatedData.businessHeadPhone = prev.primaryContactPhone;
        }
        updatedData[fieldName] = checked ? [value] : [];
      } else {
        // Handle other checkboxes if needed
        let updatedValues = prev[fieldName] || {}
        if (checked) {
          updatedValues = { ...updatedValues, isAllowed: true };
        } else {
          updatedValues = { ...updatedValues, isAllowed: false };
        }
        updatedData[fieldName] = updatedValues;
        setChangedFields(prev => new Set(prev).add(fieldName));
      }

      return updatedData;
    });
  };

  const renderHeaderWithLinks = (label) => {
    const linkMap = {
      'Download terms & conditions': '/path/to/terms.pdf',
    };

    const elements = label.split(new RegExp(`(${Object.keys(linkMap).join('|')})`)).map((part, index) => {
      if (linkMap[part]) {
        return (
          <a
            key={`link-${index}`}
            href={linkMap[part]}
            target="_blank"
            rel="noopener noreferrer"
          >
            {part}
          </a>
        );
      }
      return <span key={`text-${index}`}>{part}</span>;
    });

    return elements;
  };
  const handleViewFile = async (customerId, fileName, fileType) => {
    try {
      if (fileType.includes('Logo')) {
        const logoType = fileType.toLowerCase().includes('company') ? 'company' : 'brand';
        const response = await fetch(`${API_BASE_URL}/customers/getfile/${customerId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileType,
            fileName: 'logo' // Can be undefined since we're using logoType
          }),
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch logo');

        const blob = await response.blob();
        // const blobUrl = URL.createObjectURL(blob);

        // // Open in new tab for viewing
        // window.open(blobUrl, '_blank');
        // Create object URL from the Blob
        const imageUrl = URL.createObjectURL(blob);

        // Create a new window/tab with the image
        const newWindow = window.open('', '_blank');
        newWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${logoType} Logo</title>
        </head>
        <body style="margin:0;padding:0;text-align:center;">
          <img src="${imageUrl}" 
               style="max-width:100%; max-height:100vh;" 
               alt="${logoType} Logo" />
        </body>
      </html>
    `);
        newWindow.document.close();
        // Clean up after delay
        setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/customers/getfile/${customerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileType, fileName }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      if (fileType === 'nonTradingDocuments' || fileName.endsWith('.pdf')) {
        window.open(blobUrl, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      // Clean up
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error viewing file:', error);
      alert('Failed to open file. Please try again.');
    }
  };
const shouldShowDiv = customer?.isApprovalMode && customerFormMode === 'custDetailsAdd';
  return (
    <Sidebar>
      <div className='customers'>
        <div className={`customer-onboarding-content ${isCommentPanelOpen ? 'collapsed' : ''}`}>
          <div className="customer-onboarding-details">
            <div className="customer-onboarding-body">
              {/* Tabs */}
              <div className="customer-onboarding-tabs-vertical" style={!isMobile ? { height: tabsHeight } : {}}>
                <div className="tabs-title">{t('Customer Details')}</div>
                {tabs.map(tab => (
                  <div
                    key={tab}
                    className={`tab ${tab === activeTab ? 'active' : ''}`}
                    onClick={() => {
                      handleTabClick(tab);
                    }}
                  >
                    {t(tab)}
                  </div>
                ))}
              </div>

              {/* Form Grid */}


              {activeTab === 'Products & MoQ' ? (
                <CustomerProducts customer={customer} />
              ) : activeTab === 'Branches' ? (
                <CustomerBranches
                  customer={customer}
                  setTabsHeight={setTabsHeight}
                  branches={branchesData}
                  onBranchesChange={setBranchesData}
                  onBranchChanges={setBranchChanges}
                />

              ) : (
                





                <div className="customer-onboarding-form-grid" ref={contentRef}>
                  {shouldShowDiv && <>{t('This form is currently under approval')}</>}
                  <div className="form-main-header">
                    <a href="#">{t('Customer Approval Checklist')}</a>
                  </div>
                  {formsByTab[activeTab].reduce((acc, field, idx, fields) => {
                    // Conditional logic: if the current field is "businessTypeOther"
                    // and it's NOT supposed to be shown, skip it
                    if (field.type === 'conditionalText') {
                      const show = formData[field.showWhen] === field.showValue;
                      if (!show) return acc;
                    }

                    // Skip the next field if current is 'businessType' and set to 'Others'
                    if (
                      field.name === 'businessType' &&
                      formData['businessType'] === 'Others' &&
                      fields[idx + 1]?.type === 'empty'
                    ) {
                      acc.push(field); // push current 'businessType'
                      return acc; // skip next empty by NOT pushing it
                    }

                    acc.push(field);
                    return acc;
                  }, []).map((field) => {
                  const hasUpdate = transformedCustomer.isApprovalMode && 
                   transformedCustomer?.workflowData?.updates && 
                   field.name in transformedCustomer.workflowData.updates;
  const currentValue = customer?.[field.name] || '';
  const proposedValue = hasUpdate ? transformedCustomer.workflowData.updates[field.name] : null;
                    switch (field.type) {
                      case 'text':
                        const isBusinessHeadField = [
                          'businessHeadName',
                          'businessHeadDesignation',
                          'businessHeadEmail',
                          'businessHeadPhone'
                        ].includes(field.name);

                        const isDisabled = isBusinessHeadField &&
                          formData.businessHeadSameAsPrimary?.includes(t('Same as Primary Contact Details'));

                        return (
                          <div className={`form-group ${hasUpdate ? 'pending-update' : ''}`} key={field.name}>
                            <label htmlFor={`${field.name}-input`} hidden={!isV(field.name)}>
                              {field.label}
                              {field.required && <span className="required-field">*</span>}
                              {hasUpdate && <span className="update-badge">Pending Update</span>}
                            </label>
                            {field.isLocation ? (
                              <div className="location-input-container">
                                <input
                                  value={
                                    formData[field.name]
                                      ? `${formData[field.name].x.toFixed(6)}, ${formData[field.name].y.toFixed(6)}`
                                      : 'Select Location'
                                  }
                                  placeholder={t(field.placeholder)}
                                  className="text-field small"
                                  readOnly
                                />
                                
                                <button
                                  className="location-picker-button"
                                  disabled={!isE(field.name, customer?.isApprovalMode, customer?.workflowData?.updates 
              ? field.name in customer.workflowData.updates 
              : false)}
                                  onClick={() => setShowMap(true)}
                                >
                                  <FontAwesomeIcon icon={faLocationDot} />
                                </button>
                              </div>
                            ) : (
            <>
              <input
                id={`${field.name}-input`}
                type="text"
                name={field.name}
                value={hasUpdate ? formData[field.name] : 
                      (isBusinessHeadField && isDisabled
                        ? formData[`primaryContact${field.name.replace('businessHead', '')}`] || ''
                        : formData[field.name] || '')}
                onChange={handleInputChange}
                disabled={isDisabled || !isE(field.name, customer?.isApprovalMode, (transformedCustomer?.workflowData?.updates && customerFormMode !== 'custDetailsAdd')
              ? field.name in transformedCustomer.workflowData.updates 
              : false)}
                hidden={!isV(field.name)}
                placeholder={field.placeholder}
                className={
                  `text-field ${field.label.toLowerCase().includes('arabic') ? 'arabic' : 'small'} 
                  ${hasUpdate ? 'update-field' : ''}`
                }
              />
              {hasUpdate && (
                <div className="current-value">
                  Current: {currentValue || '(empty)'}
                </div>
              )}
              {/* {console.log(field.name)}
              {console.log(isV(field.name))}
              {console.log(isE(field.name))}
              {console.log("customer",customer)}
              {console.log("formdata",formData)} */}
              {console.log("customer", customer)}
            </>
          )}
          {formErrors[field.name] && (
            <div className="error">{formErrors[field.name]}</div>
          )}
        </div>
      );
                      case 'conditionalText':
                        const shouldShow = formData[field.showWhen] === field.showValue;
                        if (!shouldShow) return null;

                        return (
                          <div className="form-group" key={field.name}>
                            <label htmlFor={`${field.name}-input`}>
                              {field.label}
                              {field.required && <span className="required-field">*</span>}
                            </label>
                            <input
                              id={`${field.name}-input`}
                              type="text"
                              name={field.name}
                              value={formData[field.name] || ''}
                              onChange={handleInputChange}
                              placeholder={field.placeholder}
                              className="text-field small"
                              disabled={!isE(field.name, customer?.isApprovalMode, customer?.workflowData?.updates 
              ? field.name in customer.workflowData.updates 
              : false)}
                            />
                            {formErrors[field.name] && (
                              <div className="error">{formErrors[field.name]}</div>
                            )}
                          </div>
                        );
                      case 'dropdown':
                        return (
                          <div className="form-group" key={field.name}>
                            <label htmlFor={`${field.name}-select`} hidden={!isV(field.name)}>
                              {field.label}
                              {field.required && <span className="required-field">*</span>}
                            </label>
                            <select
                              id={`${field.name}-select`}
                              name={field.name}
                              value={formData[field.name] || ''}
                              onChange={handleInputChange}
                              disabled={!isE(field.name, customer?.isApprovalMode, customer?.workflowData?.updates 
              ? field.name in customer.workflowData.updates 
              : false)}
                hidden={!isV(field.name)}
                              className="dropdown"
                              placeholder="Value"
                              required
                            >
                              <option value="" disabled hidden>
                                Value
                              </option>
                              {
                                dropdownOptions[field.name] ? dropdownOptions[field.name].map((opt, idx) => (
                                  <option key={idx} value={opt}>
                                    {t(opt)}
                                  </option>
                                )
                                ) : []
                              }
                              {/* {field.options.map((opt, idx) => (
                                <option key={idx} value={opt}>
                                  {opt}
                                </option>
                              ))} */}
                            </select>
                            {formErrors[field.name] && (
                              <div className="error">{formErrors[field.name]}</div>
                            )}
                          </div>
                        );
                      case 'file':
                        return (
                          <div className="file-upload" key={field.name}>
                            <label htmlFor={`file-${field.name}`}>
                              {field.label}
                              {field.required && <span className="required-field">*</span>}
                            </label>
                            <div className="upload-row">
                              <input
                                type="file"
                                accept="image/*"
                                id={`file-${field.name}`}
                                onChange={(e) => handleFileUpload(e, field.name)}
                                className="hidden-file-input"
                                disabled={!isE(field.name, customer?.isApprovalMode, customer?.workflowData?.updates 
              ? field.name in customer.workflowData.updates 
              : false)}
                              />
                              <label htmlFor={`file-${field.name}`} className="custom-file-button">
                                {t('Upload')}
                              </label>
                              {uploadedFiles[field.name]?.isNew ? (
                                <span className="file-name">
                                  <button
                                    type="button"
                                    className="file-link-button"
                                    
                                  >
                                    {uploadedFiles[field.name].name}
                                  </button>
                                  <button
                                    type="button"
                                    className="delete-file-button"
                                    onClick={() => handleFileDelete(field.name)}
                                  >
                                    <FontAwesomeIcon icon={faXmark} />
                                  </button>
                                </span>
                              ) : (
                                <span className="file-name">
                                  <button
                                    type="button"
                                    className="view-file-button"
                                    onClick={() => handleViewFile(customer.id, uploadedFiles[field.name].name, field.name)}
                                  >
                                    <FontAwesomeIcon icon={faEye} />
                                  </button>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      case 'document':
                        return (
                          <tr className="document-upload full-width" key={field.name}>
                            {/* First column - Label */}
                            <td className="label-cell" style={{
                              whiteSpace: 'nowrap',
                              paddingRight: '16px',
                              verticalAlign: 'top',
                            }}>
                              <label htmlFor={`file-${field.name}`}>
                                {field.label}
                                {field.required && <span className="required-field">*</span>}
                              </label>
                            </td>

                            {/* Second column - Upload button */}
                            <td className="upload-cell" style={{
                              width: '100px',  /* Fixed width for upload column */
                              paddingRight: '16px',
                              verticalAlign: 'top'
                            }}>
                              <input
                                type="file"
                                accept=".pdf,application/pdf"
                                id={`file-${field.name}`}
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (files.length > 0) {
                                    // Client-side validation
                                    if (files[0].type !== 'application/pdf') {
                                      alert('Please upload only PDF files');
                                      e.target.value = ''; // Clear the input
                                      return;
                                    }
                                    handleFileUpload(e, field.name);
                                  }
                                }}
                                className="hidden-file-input"
                                disabled={!isE(field.name, customer?.isApprovalMode, customer?.workflowData?.updates 
              ? field.name in customer.workflowData.updates 
              : false)}
                              />
                              <label htmlFor={`file-${field.name}`} className="custom-file-button" style={{
                                display: 'inline-block',
                                width: '100%',
                                textAlign: 'center'
                              }}>
                                {t('Upload')}
                              </label>
                            </td>

                            {/* Third column - File display */}
                            <td className="file-display-cell">
                              {uploadedFiles[field.name] && (
                                <div className="file-display">
                                  {Array.isArray(uploadedFiles[field.name]) ? (
                                    uploadedFiles[field.name].map((fileObj, index) => (
                                      <div key={fileObj.id || index} className="file-item">
                                        {fileObj.isNew ? (
                                          <span className="file-name">
                                            <button
                                              type="button"
                                              className="file-link-button"
                                            >
                                              {fileObj.name}
                                            </button>
                                            <button
                                              type="button"
                                              className="delete-file-button"
                                              onClick={() => handleFileDelete(field.name, fileObj.id)}
                                            >
                                              <FontAwesomeIcon icon={faXmark} />
                                            </button>
                                          </span>
                                        ) : (
                                          <span className='file-name'>
                                            {fileObj.name}
                                            <button
                                              type="button"
                                              className="view-file-button"
                                              onClick={() => handleViewFile(customer.id, fileObj.name, field.name)}
                                            >
                                              View <FontAwesomeIcon icon={faEye} />
                                            </button>
                                          </span>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="file-item">
                                      {uploadedFiles[field.name].isNew ? (
                                        <span className="file-name">
                                          <button
                                            type="button"
                                            className="file-link-button"
                                          >
                                            {uploadedFiles[field.name].name}
                                          </button>
                                          <button
                                            type="button"
                                            className="delete-file-button"
                                            onClick={() => handleFileDelete(field.name)}
                                          >
                                            <FontAwesomeIcon icon={faXmark} />
                                          </button>
                                        </span>
                                      ) : (
                                        <span className="file-name">
                                          <button
                                            type="button"
                                            className="view-file-button"
                                            onClick={() => handleViewFile(customer.id, uploadedFiles[field.name].name, field.name)}
                                          >
                                            <FontAwesomeIcon icon={faEye} />
                                          </button>
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );

                      case 'multiDocument':
                        return (
                          <tr className="document-upload full-width" key={field.name}>
                            {/* Label */}
                            <td className="label-cell" style={{ whiteSpace: 'nowrap', paddingRight: '16px', verticalAlign: 'top' }}>
                              <label htmlFor={`file-${field.name}`}>
                                {field.label}
                                {field.required && <span className="required-field">*</span>}
                              </label>
                            </td>

                            {/* Upload Button */}
                            <td className="upload-cell" style={{ width: '100px', paddingRight: '16px', verticalAlign: 'top' }}>
                              <input
                                type="file"
                                accept="pdf/*"
                                id={`file-${field.name}`}
                                onChange={(e) => handleFileUpload(e, field.name)}
                                className="hidden-file-input"
                                disabled={!isE(field.name, customer?.isApprovalMode, customer?.workflowData?.updates 
              ? field.name in customer.workflowData.updates 
              : false)}
                                multiple
                              />
                              <label htmlFor={`file-${field.name}`} className="custom-file-button" style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>
                                {t('Upload')}
                              </label>
                            </td>

                            {/* File Display */}
                            <td className="file-display-cell">
                              {uploadedFiles[field.name]?.name?.length > 0 && (
                                <div className="uploaded-files-list">
                                  {uploadedFiles[field.name].name.map((file, index) => {
                                    const fileObj = typeof file === 'string' ? { name: file } : file;

                                    return ( // <-- Add this return statement
                                      <div
                                        key={fileObj.id || index}
                                        className={`file-display ${fileObj.isNew ? 'new-file' : 'existing-file'}`}
                                      >
                                        <span className="file-name">
                                          {fileObj.isNew !== true && (
                                            <button
                                              type="button"
                                              className="view-file-button"
                                              onClick={() => handleViewFile(customer.id, fileObj.name, field.name)}
                                              title={fileObj.name}
                                            >
                                              <FontAwesomeIcon icon={faEye} />
                                            </button>
                                          )}
                                          {!fileObj.isNew && (
                                            <span className='file-link-button' style={{ marginLeft: fileObj.isNew !== true ? '8px' : 0 }}>
                                              {fileObj.name}
                                            </span>
                                          )}
                                          {fileObj.isNew && (
                                            <span className="file-name">
                                              <button
                                                type="button"
                                                className="file-link-button"
                                              >
                                                {fileObj.name}
                                              </button>
                                              <button
                                                type="button"
                                                className="delete-file-button"
                                                onClick={() => handleFileDelete(field.name, fileObj.id)}
                                              >
                                                <FontAwesomeIcon icon={faXmark} />
                                              </button>
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                            </td>
                          </tr>
                        );

                      case 'checkbox':
                        return (<>
                          <div className='form-header'>
                            <span className="checkbox-group-label" >
                              {field.label}
                              {field.required && <span className="required-field">*</span>}
                            </span>
                          </div>
                          <div className="form-group" key={field.name} >

                            {field.options.map((option, idx) => (
                              <div key={idx} className="checkbox-option">
                                <label htmlFor={`${field.name}-${idx}`} hidden={!isV(field.name)}>
                                  <input
                                    id={`${field.name}-${idx}`}
                                    type="checkbox"
                                    name={field.name}
                                    value={option}
                                    checked={formData[field.name]?.isAllowed}
                                    onChange={(e) => handleCheckboxChange(e, field.name)}
                                    disabled={!isE(field.name, customer?.isApprovalMode, customer?.workflowData?.updates 
              ? field.name in customer.workflowData.updates 
              : false)}
                                  />
                                  {option}
                                </label>
                              </div>
                            ))}
                          </div>
                        </>);
                      case 'empty':
                        return <div key={field.name}></div>;
                      case 'header':
                        return (
                          <div className="form-header" key={field.label} hidden={isV(field.label)}>
                            {renderHeaderWithLinks(field.label)}
                          </div>
                        );
                      default:
                        return null;
                    }
                  })}
                  {showMap && (
                    <div className="map-modal">
                      <div className="map-modal-content">
                        <button
                          className="close-modal-button"
                          onClick={() => setShowMap(false)}
                          
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                        <h3>{t('Select Location')}</h3>
                        <LocationPicker onLocationSelect={handleLocationSelect} initialLat={formData.geolocation?.x}
                          initialLng={formData.geolocation?.y} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Action Buttons */}
          
          {activeTab === 'Products & MoQ' || activeTab === 'Branches' ?
            [] :
            (
              <div className="customer-onboarding-form-actions">
                <div className="status-text">
                  <span className="status-label">{t('Status')}:</span>
                  <span className="status-badge">{t(customer.customerStatus) || t(formData.customerStatus) || t('Pending')}</span>
                </div>
                <div className="action-buttons">
                  {isV('btnSave') && (transformedCustomer.customerStatus === 'New') && <button className="save" onClick={() => handleSave('save')} disabled={!isE('btnSave') || (customerFormMode == 'custDetailsAdd' && customer.isApprovalMode)}>
                    {t('Save')}
                  </button>}
                  {isV('btnSaveChanges') && !(transformedCustomer.customerStatus === 'New') && <button className="savechanges" onClick={() => handleSave('save changes')} disabled={!isE('btnSaveChanges') || (customerFormMode == 'custDetailsAdd' && customer.isApprovalMode)}>
                    {t('Save Changes')}
                  </button>}
                  {isV('btnSubmit') && (transformedCustomer.customerStatus === 'New') && <button className="block" onClick={() => handleSubmit('submit')} disabled={!isE('btnSubmit')}>
                    {t('Submit')}
                  </button>}
                  {console.log(customerFormMode)}
                  {console.log(customer.isApprovalMode)}
                  {(
                    <>
                      {isV('btnBlock') && <button className="block" onClick={() => handleSave('block')} disabled={!isE('btnBlock') || (customerFormMode == 'custDetailsAdd' && customer.isApprovalMode)}>
                        {t('Block')}
                      </button>}
                      {customer.isApprovalMode && user.userType !== 'customer' && customerFormMode!=='custDetailsAdd' && <button className="approve" onClick={() => handleApprovalSubmit('approve')} disabled={!isE('btnApprove')}>
                        {t('Approve')}
                      </button>}
                      {customer.isApprovalMode && user.userType !== 'customer' && customerFormMode!=='custDetailsAdd' && <button className="reject" onClick={() => handleApprovalSubmit('reject')} disabled={!isE('btnReject')}>
                        {t('Reject')}
                      </button>}
                    </>
                  )}
                </div>
              </div>
            )}
        </div>
        {customer.isApprovalMode && (
          <>
            <div>
              <CommentPopup isOpen={isCommentPanelOpen} setIsOpen={setIsCommentPanelOpen} externalComments={customer.approvalHistory ? customer.approvalHistory : []} />
            </div>
          </>
        )}
      </div>
      <ApprovalDialog
        isOpen={isApprovalDialogOpen}
        onClose={() => setIsApprovalDialogOpen(false)}
        action={approvalAction}
        onSubmit={handleDialogSubmit}
        customerName={customer.customerName || 'this customer'}
        title={approvalAction === 'approve' ? t('Approve Customer') : t('Reject Customer')}
        subtitle={approvalAction === 'approve' ? t('Are you sure you want to approve this customer?') : t('Are you sure you want to reject this customer?')}
      />

    </Sidebar>

  );
}

export default CustomersDetails;
