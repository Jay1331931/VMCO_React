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
import { useNavigate } from 'react-router-dom';
import constants from '../constants';
import LoadingSpinner from '../components/LoadingSpinner';
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

  const location = useLocation();
  const transformedCustomer = location.state?.transformedCustomer;

  // concats customer and customer contacts data into a single object
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

      isApprovalMode: isAppMode,
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
        console.log("transformedData", transformedData)
        console.log("transformedData", transformedData)
        console.log("transformedData", transformedData)
        console.log("transformedData", transformedData)
        console.log("transformedData", transformedData)
        setCustomer(transformedData);
      } else {
        throw new Error(response.data.message || 'Failed to fetch customer contacts');
      }
    } catch (err) {
      console.error('Error fetching customer contacts:', err);
    }
  };

  // fetch temp data from workflow and add to form data
  function transformWorkflowData(workflowData) {
    const { methodDetails, ...otherUpdates } = workflowData.updates;

    return {
      ...workflowData, // Keep original ID and other properties
      updates: {
        ...otherUpdates,  // Preserve non-methodDetails updates
        ...methodDetails,  // Spread payment methods directly
        creditLimit: methodDetails?.credit?.limit,
        creditPeriod: methodDetails?.credit?.period,
        creditBalance: methodDetails?.credit?.balance,
      }
    };
  }
  // Fetches customer data and updates form data
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
      const [contactsResponse, paymentMethodsResponse] = await Promise.all([
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
          creditBalance: paymentMethods.find(m => m?.methodName === 'Credit')?.balance || 0
        };
        console.log('Customer Data with Payment Methods:', customerData);
      }

      if (transformedCustomer?.workflowData?.updates?.methodDetails) {
        transformedCustomer.workflowData = transformWorkflowData(transformedCustomer?.workflowData)
      }

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
          console.log("11111111111Form Data after updates", formData);
        }
      }
      console.log("!!!!!!!!!!!Approved Customer Data", customerData);
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

  // const fetchCustomerPaymentMethods = async (customerId) => {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/payment-method/id/${customerId}`, {
  //       method: 'GET',
  //       headers: { 'Content-Type': 'application/json' },
  //       credentials: 'include'
  //     });
  //     const result = await response.json();
  //     return result.status === 'Ok' ? result.data : null;
  //   } catch (error) {
  //     console.error('Error fetching payment methods:', error);
  //     return null;
  //   }
  // };
  const contentRef = useRef(null);
  const [tabsHeight, setTabsHeight] = useState('auto');

  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  console.log("location.state", location.state);
  console.log("@@@@@@@@@@transformedCustomer", transformedCustomer);
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

  const { token, user, isAuthenticated, logout, loading } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (loading) {
      return; // Wait while loading
    }

    if (!user) {
      console.log("$$$$$$$$$$$ logging out - no user");
      logout();
      navigate('/login');
      return;
    }

    if (user && !user.userType) {
      console.log("$$$$$$$$$$$ logging out - no userType");
      logout();
      navigate('/login');
      return;
    }

    // Only fetch data if user is valid
    if (user && user.userType) {
      const fetchData = async () => {
        await fetchApprovedCustomer(transformedCustomer);
      };
      fetchData();
    }
  }, [user, loading]);




  let customerFormMode;
  if (formMode === 'edit') {
    customerFormMode = 'custDetailsEdit';
  }
  else {
    if (transformedCustomer.customerStatus === 'New') {
      customerFormMode = 'custDetailsAdd';
    } else if (transformedCustomer.customerStatus === 'Approved' && customer.isApprovalMode) {
      customerFormMode = 'custDetailsEdit';
    } else if (transformedCustomer.customerStatus === 'Approved' && !customer.isApprovalMode) {
      customerFormMode = 'custDetailsAdd';
    } else {
      customerFormMode = 'custDetailsAdd';
    }
  }

  const rbacMgr = new RbacManager(user?.userType == 'employee' && user?.roles[0] !== 'admin' ? user?.designation : user?.roles[0], customerFormMode);
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  const [companyType, setCompanyType] = useState(transformedCustomer?.companyType?.toLowerCase() || '');
  console.log("Company Type", companyType);
  const formsByTab = useMemo(() => ({
    'Business Details': getBusinessDetailsForm(t)['Business Details'],
    'Contact Details': getContactDetailsForm(t)['Contact Details'],
    'Financial Information': getFinancialInformationForm(t)['Financial Information'],
    'Documents': getDocumentsForm(t, companyType)['Documents'],
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
    'Documents': getBusinessDetailsFormData(t, customer, companyType)['Documents'],
  }), [t]);

  const tabs = useMemo(() => {
    const allTabs = Object.keys(formsByTab);
    // Remove 'Branches' tab if module is 'branch'

    if (customerFormMode === 'custDetailsAdd') {
      if (transformedCustomer?.customerStatus === 'new' || transformedCustomer?.customerStatus === 'pending') {
        return allTabs.filter(tab => tab !== 'Branches' && tab !== 'Products & MoQ');
      } else {
        return allTabs;
      }
    }
    if (customerFormMode === 'custDetailsEdit') {
      if (transformedCustomer?.customerStatus === 'approved' && transformedCustomer?.module === 'branch') {
        return allTabs;
      } else {
        return allTabs.filter(tab => tab !== 'Branches' && tab !== 'Products & MoQ');
      }
    }
  }, [formsByTab, transformedCustomer?.module]);

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
  // const [paymentChangesIsThere, setPaymentChangesIsThere] = useState(false);
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
        newFormData[field.name] = field.type === 'checkbox' ? false : '';
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
    console.log('Input change:', name, value, type, checked);
    if (name === 'companyType') {
      setCompanyType(value.toLowerCase());
      formsByTab['Documents'] = getDocumentsForm(t, value.toLowerCase())['Documents'];
      formDataByTab['Documents'] = getBusinessDetailsFormData(t, customer, value.toLowerCase())['Documents'];
    }
    const conditionalDropdowns = [constants.ENTITY.DIYAFA, constants.ENTITY.NAQI, constants.ENTITY.GREEN_MAST, constants.ENTITY.DAR, constants.ENTITY.VMCO];
    if (conditionalDropdowns.includes(name)) {
      setFormData(prev => ({
        ...prev,
        ['assignedToEntityWise']: {
          ...prev['assignedToEntityWise'],
          [name]: value
        }
      }));
      setChangedFields(prev => new Set(prev).add('assignedToEntityWise'));
      return;
    }
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

      if (action === 'save changes' && field.required && !value && fieldName !== 'nonTradingDocuments' && field.type !== 'document') {
        errors[fieldName] = t('This field is required.');
      }

      if (checkRequired && field.type === 'text' && field.required && !value) {
        errors[fieldName] = t('This field is required.');
      }

      if (checkRequired && field.type === 'document' && field.required && !uploadedFiles[fieldName]) {
        errors[fieldName] = t('This document is required.');
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

      if (checkRequired && fieldName === 'nonTradingDocuments' && (pendingFileUploads[fieldName]?.length === 0 || transformedCustomer?.[fieldName]?.length === 0)) {
        // console.log("Non trading documents", pendingFileUploads[fieldName]?.length)
        errors[fieldName] = t('At least one document is required');
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (action) => {
    switch (action) {
      case 'save':
      case 'save changes':
      case 'submit':
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
        if (action !== 'submit') {
          if (!validateChangedFields(action, changedFields, false)) {
            alert(t('Please correct the errors before saving'));
            return;
          }
        } else {
          console.log('Changed fields in submit', changedFields)
        }

        break;
      case 'block':
      case 'unblock':
        // Simulate checkbox change for isBlocked
        setChangedFields(new Set())
        break;
    }

    // Define contact detail fields
    const contactDetailFields = [
      'primaryContactName', 'primaryContactDesignation', 'primaryContactEmail', 'primaryContactMobile',
      'financeHeadName', 'financeHeadDesignation', 'financeHeadEmail', 'financeHeadMobile',
      'businessHeadName', 'businessHeadDesignation', 'businessHeadEmail', 'businessHeadMobile',
      'purchasingHeadName', 'purchasingHeadDesignation', 'purchasingHeadEmail', 'purchasingHeadMobile'
    ];

    const paymentDetailFields = [
      'prePayment', 'partialPayment', 'COD', 'credit', 'creditLimit', 'creditPeriod'
    ]

    const customerPayload = {};
    const contactCreatePayload = {};
    const contactUpdatePayload = {};
    const paymentMethodPayload = (() => {
      // Check if any payment-related fields actually changed
      const hasPaymentChanges = paymentDetailFields.some(field => {
        const newVal = formData[field] ?? formData[field.split('.')[0]]?.[field.split('.')[1]];
        const oldVal = transformedCustomer[field] ?? transformedCustomer[field.split('.')[0]]?.[field.split('.')[1]];
        if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
          console.log("New Value", newVal, "field", field)
          console.log("Old Value", oldVal, "field", field)
        }
        return JSON.stringify(newVal) !== JSON.stringify(oldVal);
      });

      if (!hasPaymentChanges) return { method_details: {} };
      
      
      return {
        method_details: {
          credit: {
            isAllowed: formData?.credit?.isAllowed,
            limit: formData?.creditLimit,
            period: formData?.creditPeriod,
            balance: formData?.credit?.balance
          },
          prePayment: {
            isAllowed: formData?.prePayment?.isAllowed,
          },
          // advancePayment: {
          //   isAllowed: formData?.advancePayment?.isAllowed,
          //   balance: formData?.advancePayment?.balance
          // },
          COD: {
            isAllowed: formData?.COD?.isAllowed,
            limit: formData?.COD?.limit,
          },
          partialPayment: {
            isAllowed: formData?.partialPayment?.isAllowed
          }
        }
      };
    })();
    let paymentChangesIsThere = false;
    changedFields.forEach(fieldName => {
        if (paymentDetailFields.includes(fieldName)) {
          console.log("********Payment Detail Field", fieldName)
          paymentChangesIsThere = true;
          return;
        }
      });

    if (action === 'block') {
      customerPayload['customerStatus'] = 'blocked';
      customerPayload['isBlocked'] = true;
    }
    if (action === 'unblock') {
      customerPayload['customerStatus'] = 'approved';
      customerPayload['isBlocked'] = false;
    }
    const customerData = customer || {};
    console.log("Changed fields in Save", changedFields)


    changedFields.forEach(fieldName => {
      if (fieldName === 'id' || fieldName === 'undefined' || fieldName === 'pricePlan' || fieldName === 'deliveryCost') return;

      const newValue = formData[fieldName];
      const oldValue = customerData[fieldName];

      if ((newValue !== oldValue) || (action === 'submit')) {

        if (contactDetailFields.includes(fieldName)) {
          // if (oldValue === undefined || oldValue === null || oldValue === '' ) {
          //   contactCreatePayload[fieldName] = newValue;
          // } else {
          contactUpdatePayload[fieldName] = newValue;
          // }
        } else if (paymentDetailFields.includes(fieldName)) {
          if (fieldName === 'creditLimit' || fieldName === 'creditPeriod') {
            // if field name is credit limit update limit
            // if field name is credit period update period
            if(fieldName === 'creditLimit') {
              paymentMethodPayload.method_details.credit.limit = newValue;
            } else if (fieldName === 'creditPeriod') {
              paymentMethodPayload.method_details.credit.period = newValue;
            }
            // paymentMethodPayload.method_details.credit[fieldName] = newValue;
          } else if (fieldName === 'prePayment' || fieldName === 'partialPayment' || fieldName === 'COD') {
            paymentMethodPayload.method_details[fieldName].isAllowed = newValue?.isAllowed;
          } else {
            paymentMethodPayload.method_details[fieldName] = newValue;
          }
        }
        else {
          if (fieldName !== 'undefined' && fieldName !== 'businessHeadSameAsPrimary')
            customerPayload[fieldName] = newValue;
          customerPayload['customerStatus'] = (formData.customerStatus || customerData.customerStatus).toLowerCase();
          if (fieldName === 'interCompany' || fieldName === 'isDeliveryChargesApplicable') {
            customerPayload[fieldName] = newValue?.isAllowed
          }
          if(fieldName === 'region') {
            customerPayload['region'] = newValue?.toLowerCase();
          }
          // if(formData.customerStatus === 'new'){
          //   customerPayload['customerStatus'] = 'pending';
          // }
        }
      }
    });
    console.log("Form Data", formData)
    console.log("Contact Create Payload", contactCreatePayload)
    console.log("Contact Update Payload", contactUpdatePayload)
    console.log("Customer Payload", customerPayload)
    console.log("Payment Method Payload", paymentMethodPayload)
    console.log("Has Payment Changes", paymentChangesIsThere)
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
        if (action === 'save') {
          customerPayload['customerStatus'] = 'new';
        }
        console.log("Customer Payload", customerPayload)
        try {
          const response = await fetch(`${API_BASE_URL}/customers/id/${customer.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customerPayload),
            credentials: 'include',
          });
          console.log("Response", response)
        } catch (error) {
          console.error('Error updating customer:', error.message);

        }
      }

      if (!(transformedCustomer?.customerStatus === 'new') && paymentChangesIsThere && Object.keys(paymentMethodPayload.method_details).length > 0) {
        // console.log(paymentMethodPayload)
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
    formDataByTab['Documents']
  );
  const handleTabClick = (tab) => {
    setTabsHeight('auto');
    setActiveTab(tab);
    setFormErrors({});
    if (tab === 'Documents') {
      setUploadedFiles(formDataByTab[tab]);
    }
  };

  const [dropdownOptions, setDropdownOptions] = useState({});
  const [dropdownEmployeeOptions, setDropdownEmployeeOptions] = useState({});
 
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

  const getManagerFromEmployees = async (region) => {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/random`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designation: "area sales manager", region: region }),
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        console.log("Manager Result", result.data)
        return result.data.employeeId;
      }
    } catch (err) {
      console.error('Error fetching manager:', err);
    }
  }

   const fetchCurrentDataOfCustomer = async (customerId) => {
    console.log("Fetching current data for customer ID:~~~~~~", customerId);
    let customerData = {};
    let contactsData = {};
    let paymentMethodsData = {};
    try {
      const response = await fetch(`${API_BASE_URL}/customers/id/${customerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const customerDataJson = await response.json();
      console.log("Customer Data JSON~~~~~~~~~~~~~", customerDataJson);
      return customerDataJson.data;
      // if (customerDataJson.status === 'Ok') {
      //   customerData = customerDataJson.data;
      //   console.log('Current customer data:', customerDataJson.data);
      // }
      // const responseContacts = await fetch(`${API_BASE_URL}/customer-contacts/${customerId}`, {
      //   method: 'GET',
      //   headers: { 'Content-Type': 'application/json' },
      //   credentials: 'include'
      // });
      // const contactsDataJson = await responseContacts.json();
      // if (contactsDataJson.status === 'Ok') {
      //   contactsData = contactsDataJson.data;
      //   console.log('Current customer contacts data:', contactsDataJson.data);
      //   return { customer: customerData.data, contacts: contactsData.data };
      // } else {
      //   throw new Error(contactsData.data?.message || 'Failed to fetch customer contacts');
      // }
      // const responsePaymentMethods = await fetch(`${API_BASE_URL}/payment-method/id/${customerId}`, {
      //   method: 'GET',
      //   headers: { 'Content-Type': 'application/json' },
      //   credentials: 'include'
      // });
      // const paymentMethodsDataJson = await responsePaymentMethods.json();
      // if (paymentMethodsDataJson.status === 'Ok') {
      //   paymentMethodsData = paymentMethodsDataJson.data;
      //   console.log('Current customer payment methods data:', paymentMethodsDataJson.data);
      //   return { customer: customerData.data, contacts: contactsData.data, paymentMethods: paymentMethodsData.data };
      // } else {
      //   throw new Error(paymentMethodsData.data?.message || 'Failed to fetch customer payment methods');
      // }
      // setFormData(prev => ({
      //   ...prev,
      //   ...customerData,
      //   ...contactsData,
      //   paymentMethods: paymentMethodsData
      // }));
      // console.log('Form data after fetching current data:', formData);
    } catch (error) {
      console.error('Error fetching current customer data:', error);
      throw error;
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
      const options = result.data.data.map(item => { return { name: item.name, employeeId: item.employeeId }; });
      return options;
    } catch (err) {
      console.error('Error fetching employee options:', err);
      return [];
    }
  };

  const getOptionsFromEmployeesWithManager = async () => {
    try {
      console.log("getOptionsFromEmployeesWithManager #############")

      const customerData = await fetchCurrentDataOfCustomer(customer.id);
      console.log("CustomerData region~~~~~~~~~~", customerData.region)
      const response = await fetch(`${API_BASE_URL}/employees/manager-and-employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ region: customerData.region })
      });
      if (!response.ok) {
        console.error(`~~~~~~~~~~~~~~Failed to fetch options for :`, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      const options = result.data.map(item => { return { name: item.name, employeeId: item.employeeId }; });
      console.log("________________$$$$$$$ ", options)
      return options;
    } catch (err) {
      console.error('Error fetching employee options:', err);
      return [];
    }
  };
  const fetchDropdownOptions = async () => {
    const options = {};
    const dropdownFields = formsByTab[activeTab].filter(field => field.type === 'dropdown' || field.type === 'conditionalDropdown');
    console.log("Dropdown Fields", dropdownFields)
    for (const field of dropdownFields) {

      try {
        let data = await getOptionsFromBasicsMaster(field.name);
        if (field.name === 'assignedTo') {
          data = await getOptionsFromEmployees(field.name);
        }
        console.log("Data for field", field.name, data);
        options[field.name] = data.map(opt =>
          typeof opt === 'string'
            ? opt.charAt(0) + opt.slice(1)
            : opt
        );
      } catch (err) {
        console.error(`Failed to fetch options for ${field.name}:`, err);
        options[field.name] = [];

      }
    }

    setDropdownOptions(options);
  };

  const fetchEmployeeDropdownOptions = async () => {
    const options = {};
    const dropdownFields = formsByTab[activeTab].filter(field => field.type === 'dropdownObject');
    // console.log("===============Dropdown Fields", dropdownFields)
    // for (const field of dropdownFields) {

    try {
      // if (field.name === 'assignedTo') {
      //   data = await getOptionsFromEmployees(field.name);
      // } else if (field.name === constants.ENTITY.VMCO || field.name === constants.ENTITY.DIYAFA || field.name === constants.ENTITY.NAQI || field.name === constants.ENTITY.DAR || field.name === constants.ENTITY.GREEN_MAST) {
      let data = await getOptionsFromEmployeesWithManager()
      // }


      // console.log("Data for field fetchEmployeeDropdownOptions", field.name, data);
      for (const field of dropdownFields) {

        options[field.name] = data.map(opt =>
          typeof opt === 'string'
            ? opt.charAt(0) + opt.slice(1)
            : opt
        );
      }
    } catch (err) {
      console.error(`Failed to fetch options for :`, err);
    }
    setDropdownEmployeeOptions(options);
  };

  useEffect(() => {
    fetchDropdownOptions();
    fetchEmployeeDropdownOptions();
    console.log(" $$$$$$$$$$$$$$$$$$$$$$$Employee Dropdown Options", dropdownEmployeeOptions);
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
      setChangedFields(prev => new Set(prev).add(fieldName));
    } catch (error) {
      console.error('Error handling file:', error);
      alert(`Error handling file: ${error.message}`);
    }
  };
  const handleSaveFiles = async () => {
    try {
      const uploadPromises = [];
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

      const results = await Promise.all(uploadPromises);
      const allSuccessful = results.every(res => res.ok);

      if (allSuccessful) {
        setPendingFileUploads({});
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
      setUploadedFiles(prev => {
        const currentFiles = prev[fieldName]?.name || [];

        return {
          ...prev,
          [fieldName]: {
            ...prev[fieldName],
            name: currentFiles.filter(file => file.id !== fileId),
          },
        };
      });

      setFormData(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          name: (prev[fieldName]?.name || []).filter(file => file.id !== fileId),
        },
      }));

      const fileToDelete = uploadedFiles[fieldName]?.name?.find(file => file.id === fileId);
      if (fileToDelete?.url) {
        URL.revokeObjectURL(fileToDelete.url);
      }

    } else {
      setUploadedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[fieldName];
        return newFiles;
      });

      setFormData(prev => {
        if (prev[fieldName]?.url?.startsWith('blob:')) {
          URL.revokeObjectURL(prev[fieldName].url);
        }
        return { ...prev, [fieldName]: null };
      });
    }
  };

  const handleApprovalSubmit = async (action) => {
    if (!validateChangedFields('save changes', changedFields, true)) {
      alert(t('Please fill all required fields. Please Save files before submitting.'));
      return;
    }
    setApprovalAction(action);
    setIsApprovalDialogOpen(true);
  };

  const handleDialogSubmit = async (comment) => {
    // Create a copy of the workflowData updates
    let updates = { ...transformedCustomer.workflowData?.updates || {} };

    // If this is a payment methods workflow, restructure the updates
    if (transformedCustomer?.name === 'payment methods') {
      const paymentMethodFields = ['COD', 'credit', 'prePayment', 'partialPayment'];
      const methodDetails = {};

      // Extract payment method fields from updates
      paymentMethodFields.forEach(method => {
        if (updates[method]) {
          methodDetails[method] = updates[method];
          delete updates[method];
        }
      });

      // Add flat credit fields to credit object if they exist
      if (updates.creditLimit || updates.creditPeriod || updates.creditBalance) {
        methodDetails.credit = methodDetails.credit || {};
        methodDetails.credit.limit = updates.creditLimit || methodDetails.credit?.limit;
        methodDetails.credit.period = updates.creditPeriod || methodDetails.credit?.period;
        methodDetails.credit.balance = updates.creditBalance || methodDetails.credit?.balance;

        delete updates.creditLimit;
        delete updates.creditPeriod;
        delete updates.creditBalance;
      }

      // Only add methodDetails if we found payment method fields
      if (Object.keys(methodDetails).length > 0) {
        updates.methodDetails = methodDetails;
      }
    }

    // Update any changed fields
    changedFields.forEach((fieldName) => {
      if (fieldName in formData) {
        updates[fieldName] = formData[fieldName];
      }
      if (fieldName === 'interCompany' || fieldName === 'isDeliveryChargesApplicable') {
        updates[fieldName] = formData[fieldName]?.isAllowed;
      }
    });

    const payload = {
      workflowData: {
        ...transformedCustomer.workflowData,
        updates
      },
      approvedStatus: approvalAction === 'approve' ? "approved" : "rejected",
      comment: comment
    };

    console.log('Final payload:', payload);

    try {
      const response = await fetch(`${API_BASE_URL}/workflow-instance/id/${transformedCustomer.workflowInstanceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        navigate('/customers');
        // Handle success
      } else {
        throw new Error('Failed to submit approval');
      }
    } catch (error) {
      console.error(`Error ${approvalAction}ing customer:`, error);
      alert(`Error ${approvalAction}ing customer: ${error.message}`);
    }
  };
  const handleSubmit = async (action) => {
    if (!validateChangedFields('save changes', changedFields, true)) {
      alert(t('Please fill all required fields. Please Save files before submitting.'));
      return;
    }
    if (action === 'approve') {
      console.log('Approving customer:', customer);
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
            navigate('/customers');
          }
        });
      } catch (error) {
        console.error('Error approving customer:', error);
        alert(`Error approving customer: ${error.message}`);
      }
    }

    if (action === 'reject') {
      console.log('Rejecting customer:', customer);
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
            navigate('/customers');
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

      const updatedCustomer = { ...customer, customerStatus: 'Pending' };

      const newChangedFields = new Set();
      newChangedFields.add('customerStatus');
      formData.customerStatus = 'pending';
      Object.keys(formData).forEach(field => newChangedFields.add(field));

      console.log('Prepared changedFields:', newChangedFields);

      if (!validateChangedFields('save changes', newChangedFields, true)) {
        alert(t('Please fill all required fields. Please Save files before submitting.'));
        return;
      }


      // setChangedFields(newChangedFields);
      // setCustomer(updatedCustomer);

      // handleSave('submit');

      console.log('State changedFields:', changedFields); // Will still be old value (async)
      console.log('Current customer:', updatedCustomer);
      const contactDetailFields = [
        'primaryContactName', 'primaryContactDesignation', 'primaryContactEmail', 'primaryContactMobile',
        'financeHeadName', 'financeHeadDesignation', 'financeHeadEmail', 'financeHeadMobile',
        'businessHeadName', 'businessHeadDesignation', 'businessHeadEmail', 'businessHeadMobile',
        'purchasingHeadName', 'purchasingHeadDesignation', 'purchasingHeadEmail', 'purchasingHeadMobile'
      ];

      const paymentDetailFields = [
        'prePayment', 'partialPayment', 'advancePayment', 'COD', 'credit', 'creditLimit', 'creditPeriod', 'creditBalance'
      ]

      const areaSalesManager = await getManagerFromEmployees(formData?.region?.toLowerCase()) || '';
      console.log('Area Sales Manager:', areaSalesManager);
      const customerPayload = {};
      const contactCreatePayload = {};
      const contactUpdatePayload = {};
      const paymentMethodPayload = {
        method_details: {
          credit: {
            isAllowed: formData?.credit?.isAllowed,
            limit: formData?.creditLimit,
            period: formData?.creditPeriod,
            balance: formData?.credit.balance
          },
          prePayment: {
            isAllowed: formData?.prePayment?.isAllowed,
          },
          // advancePayment: {
          //   isAllowed: formData?.advancePayment?.isAllowed,
          //   balance: formData?.advancePayment?.balance
          // },
          COD: {
            isAllowed: formData?.COD?.isAllowed,
            limit: formData?.COD?.limit,
          },
          partialPayment: {
            isAllowed: formData?.partialPayment?.isAllowed
          }
        }
      };
      const customerData = customer || {};
      console.log("Changed fields in Save", changedFields)
      newChangedFields.forEach(fieldName => {
        if (fieldName === 'id' || fieldName === 'undefined' || fieldName === 'pricePlan' || fieldName === 'deliveryCost' || fieldName === 'branchName' || fieldName === 'branchLocation' || fieldName === 'pricingPolicy'
          || fieldName === constants.ENTITY.VMCO || fieldName === constants.ENTITY.DIYAFA || fieldName === constants.ENTITY.NAQI || fieldName === constants.ENTITY.DAR || fieldName === constants.ENTITY.GREEN_MAST || fieldName === 'isDeliveryChargesApplicable'
        ) return;

        const newValue = formData[fieldName];
        const oldValue = customerData[fieldName];

        if ((newValue !== oldValue) || (action === 'submit')) {
          if (contactDetailFields.includes(fieldName)) {
            if (oldValue === undefined || oldValue === null || oldValue === '') {
              contactCreatePayload[fieldName] = newValue;
            } else {
              contactUpdatePayload[fieldName] = newValue;
            }
          } else if (paymentDetailFields.includes(fieldName)) {

          }
          else {
            if (fieldName !== 'undefined' && fieldName !== 'businessHeadSameAsPrimary') {
              customerPayload[fieldName] = newValue;
            }
            if (fieldName === 'crCertificate' || fieldName === 'vatCertificate' || fieldName === 'nationalId' || fieldName === 'bankLetter' || fieldName === 'nationalAddress' || fieldName === 'contractAgreement' || fieldName === 'creditApplication' || fieldName === 'acknacknowledgementSignature') {
              customerPayload[fieldName] = uploadedFiles[fieldName];
            }

            customerPayload['customerStatus'] = (formData.customerStatus || customerData.customerStatus).toLowerCase();
            customerPayload['interCompany'] = false;
            customerPayload['assignedToEntityWise'] = {
              [constants.ENTITY.VMCO]: areaSalesManager,
              [constants.ENTITY.DIYAFA]: areaSalesManager,
              [constants.ENTITY.DAR]: areaSalesManager,
              [constants.ENTITY.NAQI]: areaSalesManager,
              [constants.ENTITY.GREEN_MAST]: areaSalesManager,
            }
            if (fieldName === 'region') {
              customerPayload['region'] = newValue.toLowerCase();
            }
            if (customerPayload['nonTradingDocuments']?.length === 0) {
              customerPayload['nonTradingDocuments'] = {};
            } else {
              customerPayload['nonTradingDocuments'] = formData.nonTradingDocuments?.name || [];
            }
            // if(formData.customerStatus === 'new'){
            //   customerPayload['customerStatus'] = 'pending';
            // }
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
          // Destructure to remove pricingPolicy
          const { pricingPolicy, ...payloadToSend } = customerPayload;

          console.log("Customer Payload", payloadToSend);
          await fetch(`${API_BASE_URL}/customers/id/${customer.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadToSend),
            credentials: 'include',
          });
        }

        if ((!customer?.customerStatus === 'new') && Object.keys(paymentMethodPayload).length > 0) {
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


        function showLoadingScreen(message) {
          document.body.innerHTML = `
    <div class="loading-more-container" style="
      padding: 20px; 
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 16px;
    ">
      <div class="loading-spinner" style="
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
      <div class="loading-more-text">${message}</div>
    </div>
    
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
        }

        // Usage:
        showLoadingScreen('Updating...');
        setTimeout(() => window.location.reload(true), 3000);

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
    }

  };

  const handleCheckboxChange = (e, fieldName) => {
    const { value, checked } = e.target;

    setFormData((prev) => {
      const updatedData = { ...prev };

      if (fieldName === 'businessHeadSameAsPrimary') {
        if (checked) {
          updatedData.businessHeadName = prev.primaryContactName;
          updatedData.businessHeadDesignation = prev.primaryContactDesignation;
          updatedData.businessHeadEmail = prev.primaryContactEmail;
          updatedData.businessHeadMobile = prev.primaryContactMobile;
        }
        updatedData[fieldName] = checked ? [value] : [];
        setChangedFields(prev => new Set(prev).add('businessHeadName'));
        setChangedFields(prev => new Set(prev).add('businessHeadDesignation'));
        setChangedFields(prev => new Set(prev).add('businessHeadEmail'));
        setChangedFields(prev => new Set(prev).add('businessHeadMobile'));
      }
      else {
        let updatedValues = prev[fieldName] || false;
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
      // alert('Failed to open file. Please try again.');
    }
  };
  const shouldShowDiv = (transformedCustomer?.isApprovalMode || customer?.isApprovalMode) && customerFormMode === 'custDetailsAdd' && (transformedCustomer.customerStatus !== 'new' || customer?.customerStatus === 'pending');
  const shouldShowBlock = (customerFormMode === 'custDetailsEdit' && transformedCustomer?.name === 'customer block/unblock')
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
                  customer={transformedCustomer}
                  setTabsHeight={setTabsHeight}
                  branches={branchesData}
                  onBranchesChange={setBranchesData}
                  onBranchChanges={setBranchChanges}
                />

              ) : (
                <div className="customer-onboarding-form-grid" ref={contentRef}>
                  {shouldShowDiv && <>{t('This form is currently under approval')}</>}
                  {shouldShowBlock && transformedCustomer?.customerStatus === 'approved' && <>{t('Customer Approval for Blocking Customer')}</>}
                  {shouldShowBlock && transformedCustomer?.customerStatus === 'blocked' && <>{t('Customer Approval for Unblocking Customer')}</>}
                  <div className="form-main-header">
                    <a href="#">{t('Customer Approval Checklist')}</a>
                  </div>
                  {formsByTab[activeTab].reduce((acc, field, idx, fields) => {
                    if (field.type === 'conditionalText') {
                      const show = formData[field.showWhen] === field.showValue;
                      if (!show) return acc;
                    }

                    if (
                      field.name === 'businessType' &&
                      formData['businessType'] === 'Others' &&
                      fields[idx + 1]?.type === 'empty'
                    ) {
                      acc.push(field);
                      return acc;
                    }

                    acc.push(field);
                    return acc;
                  }, []).map((field) => {
                    { console.log(transformedCustomer.module) }
                    const approvalMode = transformedCustomer?.isApprovalMode || (customer?.isApprovalMode && transformedCustomer?.customerStatus !== 'new') || customer?.customerStatus === 'pending';
                    const hasUpdate = approvalMode && transformedCustomer?.module === 'customer' &&
                      transformedCustomer?.workflowData?.updates &&
                      (field.name in transformedCustomer?.workflowData?.updates || (transformedCustomer?.workflowData?.updates?.['assignedToEntityWise'] && field.name in transformedCustomer?.workflowData?.updates?.['assignedToEntityWise']));
                    console.log('HasUpdate', hasUpdate);
                    let currentValue = customer?.[field.name] || '';
                    console.log("---------field name", field.name)
                    console.log("---------current value", currentValue)
                    if (field.name === constants.ENTITY.VMCO || field.name === constants.ENTITY.DIYAFA || field.name === constants.ENTITY.NAQI || field.name === constants.ENTITY.DAR || field.name === constants.ENTITY.GREEN_MAST) {
                      console.log("---------in if field name", field.name)
                      console.log("---------in if current", customer?.assignedToEntityWise?.[field.name])
                      currentValue = customer?.assignedToEntityWise?.[field.name] || '';
                    }
                    const proposedValue = hasUpdate ? transformedCustomer?.workflowData?.updates[field.name] : null;
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
                              {hasUpdate && <span className="update-badge">Updated</span>}
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
                                  disabled={!isE(field.name, approvalMode, hasUpdate && customer?.workflowData?.updates
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
                                  disabled={isDisabled || !isE(field.name, approvalMode, (transformedCustomer?.workflowData?.updates && customerFormMode !== 'custDetailsAdd' && hasUpdate)
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
                                {/* {console.log("customer", customer)} */}
                                {console.log(formErrors)}
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
                              disabled={!isE(field.name, approvalMode, customer?.workflowData?.updates
                                ? field.name in customer.workflowData.updates
                                : false)}
                            />
                            {formErrors[field.name] && (
                              <div className="error">{formErrors[field.name]}</div>
                            )}
                          </div>
                        );

                      case 'conditionalDropdown':
                        const shouldShowDropdown = formData?.[field.showWhen]?.isAllowed === field.showValue;
                        if (!shouldShowDropdown) return null;
                        return (
                          <div className='form-group' key={field.name}>
                            <label htmlFor={`${field.name}-select`} hidden={!isV(field.name)}>
                              {field.label}
                              {field.required && <span className="required-field">*</span>}
                            </label>
                            <select
                              id={`${field.name}-select`}
                              name={field.name}
                              value={formData?.[field.name] || transformedCustomer?.[field.name] || transformedCustomer?.workflowData?.updates?.[field.name] || customer?.assignedToEntityWise?.[field.name] || ''}
                              onChange={handleInputChange}
                              // disabled={!isE(field.name, approvalMode, (transformedCustomer?.workflowData?.updates) ? field.name in transformedCustomer?.workflowData?.updates?.assignedToEntityWise
                              //   : false)}
                              hidden={!isV(field.name)}
                              className="dropdown"
                              placeholder="Value"
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
                            </select>
                          </div>
                        );

                      case 'dropdown':
                        return (
                          <div className={`form-group ${hasUpdate ? 'pending-update' : ''}`} key={field.name}>
                            <label htmlFor={`${field.name}-select`} hidden={!isV(field.name)}>
                              {field.label}
                              {field.required && <span className="required-field">*</span>}
                              {hasUpdate && <span className="update-badge">Updated</span>}
                            </label>
                            <select
                              id={`${field.name}-select`}
                              name={field.name}
                              value={formData?.[field.name] || transformedCustomer?.workflowData?.updates?.[field.name] || currentValue || ''}
                              onChange={handleInputChange}
                              disabled={!isE(field.name, approvalMode, (transformedCustomer?.workflowData?.updates && customerFormMode !== 'custDetailsAdd' && hasUpdate) ? (field.name in transformedCustomer.workflowData.updates || field.name in transformedCustomer.workflowData.updates?.assignedToEntityWise)
                                : false)}
                              hidden={!isV(field.name)}
                              className={
                                `dropdown
                  ${hasUpdate ? 'update-field' : ''}`
                              }
                              placeholder="Value"
                              required
                            >
                              <option value="" disabled hidden>
                                Value
                              </option>
                              {

                                dropdownOptions[field.name] ? dropdownOptions[field.name].map((opt, idx) => {
                                  return (
                                    <option key={idx} value={typeof opt === 'object' ? opt.employeeId : opt}>
                                      {t(typeof opt === 'object' ? opt.name : opt)}
                                    </option>
                                  );
                                }) : []
                              }
                              {/* {field.options.map((opt, idx) => (
                                <option key={idx} value={opt}>
                                  {opt}
                                </option>
                              ))} */}
                            </select>
                            {hasUpdate && (
                              <div className="current-value">
                                Current: {currentValue || '(empty)'}
                              </div>
                            )}

                            {formErrors[field.name] && (
                              <div className="error">{formErrors[field.name]}</div>
                            )}
                          </div>
                        );

                      case 'dropdownObject':
                        return (
                          <div className={`form-group ${hasUpdate ? 'pending-update' : ''}`} key={field.name}>
                            <label htmlFor={`${field.name}-select`} hidden={!isV(field.name)}>
                              {field.label}
                              {field.required && <span className="required-field">*</span>}
                              {hasUpdate && <span className="update-badge">Updated</span>}
                            </label>
                            <select
                              id={`${field.name}-select`}
                              name={field.name}
                              value={formData?.[field.name] || formData?.['assignedToEntityWise']?.[field.name] || transformedCustomer?.workflowData?.updates?.['assignedToEntityWise']?.[field.name] || currentValue || ''}
                              onChange={handleInputChange}
                              disabled={!isE(field.name, approvalMode, (transformedCustomer?.workflowData?.updates && customerFormMode !== 'custDetailsAdd' && hasUpdate) ? (field.name in transformedCustomer.workflowData.updates || field.name in transformedCustomer.workflowData.updates?.assignedToEntityWise)
                                : false)}
                              hidden={!isV(field.name)}
                              className={
                                `dropdown
                  ${hasUpdate ? 'update-field' : ''}`
                              }
                              placeholder="Value"
                              required
                            >
                              <option value="" disabled hidden>
                                Value
                              </option>
                              {

                                dropdownEmployeeOptions[field.name] ? dropdownEmployeeOptions[field.name].map((opt, idx) => {
                                  console.log(transformedCustomer?.workflowData?.updates?.['assignedToEntityWise']?.[field.name])
                                  console.log('dropdownOptions', dropdownOptions);
                                  console.log("+++++++++field", field.name);
                                  console.log("++++++++++++++++++++opt", opt);
                                  // console.log("+++++++++dropdownOptions[field.name]", dropdownOptions[field.name]);
                                  return (
                                    <option key={idx} value={opt.employeeId}>
                                      {t(opt.name)}
                                    </option>
                                  );
                                }) : []
                              }
                              {/* {field.options.map((opt, idx) => (
                                <option key={idx} value={opt}>
                                  {opt}
                                </option>
                              ))} */}
                            </select>
                            {hasUpdate && (
                              <div className="current-value">
                                Current: {currentValue || '(empty)'}
                              </div>
                            )}

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
                                disabled={!isE(field.name, approvalMode, transformedCustomer?.workflowData?.updates
                                  ? field.name in transformedCustomer.workflowData.updates
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
                              {formErrors[field.name] && (
                                <div className="error">{formErrors[field.name]}</div>
                              )}
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
                                    if (files[0].type !== 'application/pdf') {
                                      alert('Please upload only PDF files');
                                      e.target.value = '';
                                      return;
                                    }
                                    handleFileUpload(e, field.name);
                                  }
                                }}
                                className="hidden-file-input"
                                disabled={!isE(field.name, approvalMode, transformedCustomer?.workflowData?.updates
                                  ? field.name in transformedCustomer.workflowData.updates
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
                                            onClick={() => handleViewFile(customer.id, uploadedFiles[field.name], field.name)}
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
                        const multiUploads = uploadedFiles?.[field.name] || transformedCustomer?.[field.name] || { name: [] };
                        return (
                          <tr className="document-upload full-width" key={field.name}>
                            {/* Label */}
                            <td className="label-cell" style={{ whiteSpace: 'nowrap', paddingRight: '16px', verticalAlign: 'top' }}>
                              <label htmlFor={`file-${field.name}`}>
                                {field.label}
                                {field.required && <span className="required-field">*</span>}
                              </label>
                              {formErrors[field.name] && (
                                <div className="error">{formErrors[field.name]}</div>
                              )}
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
                              {multiUploads?.name?.length > 0 && (
                                <div className="uploaded-files-list">
                                  {multiUploads?.name.map((file, index) => {
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
                          {field.label && user.userType === 'employee' && (
                            <div className='form-header'>
                              <span className="checkbox-group-label">
                                {field.label}
                                {field.required && <span className="required-field">*</span>}
                              </span>
                            </div>
                          )}
                          <div className="form-group" key={field.name} >

                            {field.options.map((option, idx) => (
                              <div key={idx} className="checkbox-option">
                                <label htmlFor={`${field.name}-${idx}`} hidden={!isV(field.name)}>
                                  <input
                                    id={`${field.name}-${idx}`}
                                    type="checkbox"
                                    name={field.name}
                                    value={option}
                                    checked={formData[field.name]?.isAllowed || formData[field.name] === true}
                                    onChange={(e) => handleCheckboxChange(e, field.name)}
                                    disabled={!isE(field.name, approvalMode, transformedCustomer?.workflowData?.updates
                                      ? field.name in transformedCustomer.workflowData.updates
                                      : false)}
                                  />
                                  {option} {hasUpdate && <span className="update-badge">Updated</span>}
                                </label>
                              </div>
                            ))}
                          </div>
                        </>);
                      case 'empty':
                        return <div key={field.name}></div>;
                      case 'header':
                        return (
                          <div className="form-header" key={field.label} hidden={!isV(field.label)}>
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
                <div className="action-buttons" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="status-label">{t('Status')}:</span>
                  <span className="status-badge">{t(customer.customerStatus) || t(formData.customerStatus) || t('Pending')}</span>
                </div>
                <div className="action-buttons">
                  {isV('btnSave') && (transformedCustomer.customerStatus === 'new' && customer?.customerStatus !== 'pending') && <button className="save" onClick={() => handleSave('save')} disabled={!isE('btnSave') || (customerFormMode == 'custDetailsAdd' && transformedCustomer?.isApprovalMode)}>
                    {t('Save')}
                  </button>}
                  {isV('btnSaveChanges') && !(transformedCustomer.customerStatus === 'new') && <button className="savechanges" onClick={() => handleSave('save changes')} disabled={(!isE('btnSaveChanges') || (customerFormMode == 'custDetailsAdd' && customer.isApprovalMode)) || transformedCustomer?.isBlocked}>
                    {t('Save Changes')}
                  </button>}
                  {isV('btnSubmit') && (transformedCustomer.customerStatus === 'new' && customer?.customerStatus !== 'pending') && <button className="block" onClick={() => handleSubmit('submit')} disabled={!isE('btnSubmit')}>
                    {t('Submit')}
                  </button>}
                  {console.log(customerFormMode)}
                  {console.log("%%%%%%%%%%%%%%%", customer)}
                  {console.log("^^^^^^^^", customer)}
                  {console.log("&&&&&&&&&&", uploadedFiles)}
                  {console.log("##########", formData)}
                  {(
                    <>
                      {isV('btnBlock') && <button className="block" onClick={() => handleSave('block')} disabled={!isE('btnBlock') || (customerFormMode == 'custDetailsAdd' && customer.isApprovalMode)} hidden={transformedCustomer?.isBlocked || transformedCustomer?.customerStatus === 'new' || transformedCustomer?.customerStatus === 'pending'}>
                        {t('Block')}
                      </button>}
                      {(isV('btnUnblock') && transformedCustomer?.isBlocked && customerFormMode !== 'custDetailsEdit') && <button className="block" onClick={() => handleSave('unblock')} >
                        {t('Unblock')}
                      </button>}
                      {customer.isApprovalMode && user?.userType !== 'customer' && customerFormMode !== 'custDetailsAdd' && <button className="approve" onClick={() => handleApprovalSubmit('approve')} disabled={!isE('btnApprove')}>
                        {t('Approve')}
                      </button>}
                      {customer.isApprovalMode && user?.userType !== 'customer' && customerFormMode !== 'custDetailsAdd' && <button className="reject" onClick={() => handleApprovalSubmit('reject')} disabled={!isE('btnReject')}>
                        {t('Reject')}
                      </button>}
                    </>
                  )}
                </div>
              </div>
            )}
        </div>
        {transformedCustomer.isApprovalMode && (
          <>
            <div>
              <CommentPopup isOpen={isCommentPanelOpen} setIsOpen={setIsCommentPanelOpen} externalComments={transformedCustomer.approvalHistory ? transformedCustomer.approvalHistory : []} isVisible={true} />
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
