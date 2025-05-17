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
import CustomerBranches from './customerDetailsForms/customerBranches';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Pagination from '../components/Pagination';

const LocationPicker = ({ onLocationSelect }) => {
  const mapContainer = useRef(null);
  const markerRef = useRef(null); // Using ref instead of state for the marker
  const [map, setMap] = useState(null);
  const { t, i18n } = useTranslation();
  const [coords, setCoords] = useState('Detecting your location...');
  const [coordsArabic, setCoordsArabic] = useState(t('Detecting your location...'));
  const [defaultCenter] = useState([77.5946, 12.9716]);
  const [zoom] = useState(14);
  const [confirmedLocation, setConfirmedLocation] = useState(null);

  useEffect(() => {
    let mapInstance;

    const initializeMap = async () => {
      mapInstance = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://api.maptiler.com/maps/streets/style.json?key=NxvpwMoXuYLINUijkWEc',
        center: defaultCenter,
        zoom: zoom
      });

      mapInstance.on('load', async () => {
        setMap(mapInstance);
        try {
          const position = await getCurrentPosition();
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
  const contentRef = useRef(null);
  const [tabsHeight, setTabsHeight] = useState('auto');

  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const location = useLocation();
  const customer = location.state?.transformedCustomer;

  const [branchesData, setBranchesData] = useState([]);
  const [branchChanges, setBranchChanges] = useState({});
  const { t, i18n } = useTranslation();

  useEffect(() => {
    console.log('Customer details:', customer);
  }, [customer]);
  // Define forms per tab
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
    // 'Business Details': getBusinessDetailsFormData(t)['Business Details'],
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
        // Only initialize if not already set (to prevent overwriting)
        if (!(field.name in allData)) {
          allData[field.name] = tabData[field.name] || (field.type === 'checkbox' ? [] : '');
        }
      });
    });
    return allData;
  }, [t, customer, formsByTab]);
  // Arabic text checker
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
    console.log('formDataByTab', formDataByTab);
    console.log('formData', formData);
    console.log('Customer', customer);
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
  };
  const handleLocationSelect = (lat, lng) => {
    setSelectedLocation({ lat, lng });
    setShowMap(false);
  };
  const validateChangedFields = (checkRequired = false) => {
    const errors = {};
    changedFields.forEach((fieldName) => {
      const field = formsByTab[activeTab].find(f => f.name === fieldName);
      const value = formData[fieldName];

      if (checkRequired && field?.type === 'text' && field.required && !value) {
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

      if (fieldName.toLowerCase().includes('phone') || fieldName.toLowerCase().includes('number') || fieldName.toLowerCase().includes('#')) {
        if (value && isNaN(value)) {
          errors[fieldName] = t('Only numeric values are allowed');
        }
      }
      // Add other validation rules as needed (dropdowns, file size, etc.)
      if (activeTab === 'Contact Details') {
        // Primary contact validations
        if (checkRequired && fieldName === 'primaryContactName' && !formData[fieldName]) {
          errors[fieldName] = t('Primary contact name is required');
        }

        if (checkRequired && fieldName === 'primaryContactEmail') {
          if (!formData[fieldName]) {
            errors[fieldName] = t('Primary contact email is required');
          }
        }

        // Unique email validation for finance and purchasing heads
        if (fieldName === 'financeHeadEmail' || fieldName === 'purchasingHeadEmail') {
          const otherHeadEmail = fieldName === 'financeHeadEmail'
            ? formData.purchasingHeadEmail
            : formData.financeHeadEmail;

          if (formData[fieldName] && formData[fieldName] === otherHeadEmail) {
            errors[fieldName] = t('Finance and Purchasing heads must have unique emails');
          }

          // Check if they're using primary contact email
          if (formData[fieldName] && formData[fieldName] === formData.primaryContactEmail) {
            errors[fieldName] = t('This email is already used by primary contact');
          }
        }

      }
      // Add validation for nonTradingDocuments if needed
      if (fieldName === 'nonTradingDocuments' && field.required && (!value || value.length === 0)) {
        errors[fieldName] = t('At least one document is required');
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  // const handleSave = async (action) => {
  //   // Additional validation for contact details
  //   if (activeTab === 'Contact Details') {
  //     if (formData.financeHeadEmail && formData.purchasingHeadEmail &&
  //       formData.financeHeadEmail === formData.purchasingHeadEmail) {
  //       alert(t('Finance and Purchasing heads must have unique emails'));
  //       return;
  //     }

  //     if ((formData.financeHeadEmail && formData.financeHeadEmail === formData.primaryContactEmail) ||
  //       (formData.purchasingHeadEmail && formData.purchasingHeadEmail === formData.primaryContactEmail)) {
  //       alert(t('Finance/Purchasing heads cannot use the same email as primary contact'));
  //       return;
  //     }
  //   }

  //   if (!validateChangedFields(false)) {
  //     alert(t('Please correct errors before submitting.'));
  //     return;
  //   }

  //   // Prepare the update payload with only changed fields
  //   const payload = {};
  //   const customerData = customer || {}; // Fallback to empty object if customer is null

  //   // Compare each changed field with original customer data
  //   changedFields.forEach(fieldName => {
  //     // Skip 'id' field and fields that haven't actually changed
  //     if (fieldName !== 'id' && formData[fieldName] !== customerData[fieldName]) {
  //       payload[fieldName] = formData[fieldName];
  //     }
  //   });

  //   // If no actual changes, show message and return
  //   if (Object.keys(payload).length === 0) {
  //     alert(t('No changes detected to save'));
  //     return;
  //   }

  //   try {
  //     const res = await fetch(`http://localhost:3000/api/customers/id/${customer.id}`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(payload),
  //       credentials: 'include',
  //     });

  //     const data = await res.json();

  //     if (!res.ok) {
  //       setFormErrors(data.message || 'Update failed');
  //       return;
  //     }

  //     // Update saved data with the successfully saved fields
  //     setSavedData(prev => ({
  //       ...prev,
  //       [activeTab]: {
  //         ...prev[activeTab],
  //         ...payload
  //       }
  //     }));

  //     // Clear changed fields for successfully saved data
  //     setChangedFields(prev => {
  //       const newSet = new Set(prev);
  //       Object.keys(payload).forEach(field => newSet.delete(field));
  //       return newSet;
  //     });

  //     alert(`${action.charAt(0).toUpperCase() + action.slice(1)} successful!`);

  //   } catch (error) {
  //     console.error('Update error:', error);
  //     setFormErrors('Unable to connect to server');
  //   }
  // };
  const handleSave = async (action) => {
    // Additional validation for contact details
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

    if (!validateChangedFields(false)) {
      alert(t('Please correct errors before submitting.'));
      return;
    }

    // Define contact detail fields
    const contactDetailFields = [
      'primaryContactName', 'primaryContactDesignation', 'primaryContactEmail', 'primaryContactPhone',
      'financeHeadName', 'financeHeadDesignation', 'financeHeadEmail', 'financeHeadPhone',
      'businessHeadName', 'businessHeadDesignation', 'businessHeadEmail', 'businessHeadPhone',
      'purchasingHeadName', 'purchasingHeadDesignation', 'purchasingHeadEmail', 'purchasingHeadPhone'
    ];

    // Prepare payloads
    const customerPayload = {};
    const contactCreatePayload = {};
    const contactUpdatePayload = {};
    const customerData = customer || {};

    changedFields.forEach(fieldName => {
      if (fieldName === 'id') return;

      const newValue = formData[fieldName];
      const oldValue = customerData[fieldName];

      if (newValue !== oldValue) {
        if (contactDetailFields.includes(fieldName)) {
          // Determine if this is a create or update operation
          if (oldValue === undefined || oldValue === null || oldValue === '') {
            contactCreatePayload[fieldName] = newValue;
          } else {
            contactUpdatePayload[fieldName] = newValue;
          }
        } else {
          customerPayload[fieldName] = newValue;
        }
      }
    });

    // Early return if no changes
    if (Object.keys(customerPayload).length === 0 &&
      Object.keys(contactCreatePayload).length === 0 &&
      Object.keys(contactUpdatePayload).length === 0) {
      alert(t('No changes detected to save'));
      return;
    }

    try {
      // 1. Update customer table if needed
      if (Object.keys(customerPayload).length > 0) {
        await fetch(`http://localhost:3000/api/customers/id/${customer.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customerPayload),
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

      //   // 3. Update existing contact details if needed
      //   if (Object.keys(contactUpdatePayload).length > 0) {
      //     await fetch(`http://localhost:3000/api/customers/id/${customer.id}/contact-details`, {
      //       method: 'POST',
      //       headers: { 'Content-Type': 'application/json' },
      //       body: JSON.stringify(contactUpdatePayload),
      //       credentials: 'include',
      //     });
      //   }

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
            const response = await fetch(`http://localhost:3000/api/customer-branches/${branchId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(changes),
              credentials: 'include',
            });
            return response.json();
          })
        );
      }
      alert(`${action.charAt(0).toUpperCase() + action.slice(1)} successful!`);

    } catch (error) {
      console.error('Update error:', error);
      setFormErrors(error.message || 'Unable to connect to server');
    }
  };
  const [uploadedFiles, setUploadedFiles] = useState(
    formData
  );
  const handleTabClick = (tab) => {
    console.log('Tab clicked:', tab);
    setTabsHeight('auto');
    setActiveTab(tab);
    // setFormDataByTab(tab);
    setFormErrors({});
    if (tab === 'Documents') {
      setUploadedFiles(formData);
    }
    console.log('Uploaded files:', uploadedFiles);
  };


  const handleFileUpload = (e, fieldName) => {
    const files = Array.from(e.target.files);

    if (files.length > 0) {
      if (fieldName === 'nonTradingDocuments') {
        // For multi-document upload
        const newFiles = files.map(file => ({
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          file: file,
          url: URL.createObjectURL(file)
        }));



        setUploadedFiles(prev => ({
          ...prev,
          [fieldName]: [...(prev[fieldName] || []), ...newFiles]
        }));



        setFormData(prev => ({
          ...prev,
          [fieldName]: [
            ...(prev[fieldName] || []),
            ...newFiles.map(file => file.url)
          ]
        }));
      } else {
        // Single file upload
        const file = files[0];
        const fileData = {
          name: file.name,
          file: file,
          url: URL.createObjectURL(file)
        };



        setUploadedFiles(prev => ({
          ...prev,
          [fieldName]: fileData
        }));



        setFormData(prev => ({
          ...prev,
          [fieldName]: fileData.name
        }));
      }
    }
    console.log('Uploaded files:', uploadedFiles);
    console.log('Form data:', formData);
  };



  const handleFileDelete = (fieldName, fileId = null) => {
    if (fieldName === 'nonTradingDocuments' && fileId) {
      // Delete specific document from multi-document upload
      setUploadedFiles(prev => ({
        ...prev,
        [fieldName]: prev[fieldName].filter(file => file.id !== fileId)
      }));

      setFormData(prev => ({
        ...prev,
        [fieldName]: prev[fieldName].filter((_, index) =>
          prev[fieldName][index] !== fileId
        )
      }));

      // Revoke object URL if needed
      const urlToRevoke = formData[fieldName].find(url => url.includes(fileId));
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
      }
    } else {
      // Single file delete (existing logic)
      setUploadedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[fieldName];
        return newFiles;
      });
      setFormData(prev => ({ ...prev, [fieldName]: '' }));

      // if (formData[fieldName] && formData[fieldName].startsWith('blob:')) {
      //   URL.revokeObjectURL(formData[fieldName]);
      // }
    }
  };

  const handleSubmit = (action) => {
    if (!validateChangedFields(true)) {
      alert(t('Please correct errors before submitting.'));
      return;
    }
    alert(`${action.charAt(0).toUpperCase() + action.slice(1)} action triggered.`);
    console.log('Submitted data:', formData);
  };

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
        let updatedValues = prev[fieldName] || [];
        if (checked) {
          updatedValues = [...updatedValues, value];
        } else {
          updatedValues = updatedValues.filter((item) => item !== value);
        }
        updatedData[fieldName] = updatedValues;
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
                <CustomerProducts customer={customer}/>
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

                    // Default push
                    acc.push(field);
                    return acc;
                  }, []).map((field) => {
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
                          <div className="form-group" key={field.name}>
                            <label htmlFor={`${field.name}-input`}>
                              {field.label}
                              {field.required && <span className="required-field">*</span>}
                            </label>
                            {field.isLocation ? (
                              <div className="location-input-container">
                                <input
                                  value={selectedLocation ? `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}` : 'Select Location'}
                                  placeholder={t(field.placeholder)}
                                  className="text-field small"
                                  readOnly
                                />
                                <button
                                  className="location-picker-button"
                                  onClick={() => setShowMap(true)}
                                >
                                  <FontAwesomeIcon icon={faLocationDot} />
                                </button>
                              </div>
                            ) : (<input
                              id={`${field.name}-input`}
                              type="text"
                              name={field.name}
                              value={isBusinessHeadField && isDisabled
                                ? formData[`primaryContact${field.name.replace('businessHead', '')}`] || ''
                                : formData[field.name] || ''}
                              onChange={handleInputChange}
                              disabled={isDisabled}
                              placeholder={field.placeholder}
                              className={
                                field.name.toLowerCase().includes('arabic')
                                  ? 'text-field arabic'
                                  : 'text-field small'
                              }
                            />)}
                            {formErrors[field.name] && (
                              <div className="error">{formErrors[field.name]}</div>
                            )}
                          </div>
                        );
                      // In your form rendering section, add this case:
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
                            />
                            {formErrors[field.name] && (
                              <div className="error">{formErrors[field.name]}</div>
                            )}
                          </div>
                        );
                      case 'dropdown':
                        return (
                          <div className="form-group" key={field.name}>
                            <label htmlFor={`${field.name}-select`}>
                              {field.label}
                              {field.required && <span className="required-field">*</span>}
                            </label>
                            <select
                              id={`${field.name}-select`}
                              name={field.name}
                              value={formData[field.name] || ''}
                              onChange={handleInputChange}
                              onBlur={validateChangedFields}
                              className="dropdown"
                              placeholder="Value"
                              required
                            >
                              <option value="" disabled hidden>
                                Value
                              </option>
                              {field.options.map((opt, idx) => (
                                <option key={idx} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
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
                              />
                              <label htmlFor={`file-${field.name}`} className="custom-file-button">
                                {t('Upload')}
                              </label>
                              {uploadedFiles[field.name] && (
                                <div className="file-display">
                                  <span className="file-name">
                                    {uploadedFiles[field.name].name}
                                    <button
                                      type="button"
                                      className="delete-file-button"
                                      onClick={() => handleFileDelete(field.name)}
                                    >
                                      <FontAwesomeIcon icon={faXmark} />
                                    </button>
                                  </span>

                                </div>
                              )}
                            </div>
                          </div>
                        );

                      case 'document':
                        return (
                          <div className="document-upload full-width" key={field.name}>
                            <label htmlFor={`file-${field.name}`}>
                              {field.label}
                              {field.required && <span className="required-field">*</span>}
                            </label>
                            <div className="upload-row">
                              <input
                                type="file"
                                accept="pdf/*"
                                id={`file-${field.name}`}
                                onChange={(e) => handleFileUpload(e, field.name)}
                                className="hidden-file-input"
                              />
                              <label htmlFor={`file-${field.name}`} className="custom-file-button">
                                {t('Upload')}
                              </label>
                              {uploadedFiles[field.name] && (
                                <div className="file-display">
                                  <span className="file-name">
                                    <button
                                      type="button"
                                      className="file-link-button"
                                      onClick={() => window.open(uploadedFiles[field.name].url, '_blank')}
                                      title={uploadedFiles[field.name].name || formData[field.name]}
                                    >
                                      {uploadedFiles[field.name].name || formData[field.name]}
                                    </button>
                                    <button
                                      type="button"
                                      className="delete-file-button"
                                      onClick={() => handleFileDelete(field.name)}
                                    >
                                      <FontAwesomeIcon icon={faXmark} />
                                    </button>
                                  </span>

                                </div>
                              )}
                            </div>
                          </div>
                        );
                      case 'multiDocument':
                        return (
                          <div className="document-upload full-width" key={field.name}>
                            <label>
                              {field.label}
                              {field.required && <span className="required-field">*</span>}
                            </label>

                            <div className="upload-row">
                              <input
                                type="file"
                                id={`file-${field.name}`}
                                onChange={(e) => handleFileUpload(e, field.name)}
                                className="hidden-file-input"
                                multiple
                                accept={field.accept}
                              />
                              <label htmlFor={`file-${field.name}`} className="custom-file-button">
                                {t('Upload')}
                              </label>

                              {uploadedFiles[field.name]?.length > 0 && (
                                <div className="uploaded-files-list">
                                  {uploadedFiles[field.name].map((file) => (
                                    <div key={file.id} className="file-display">
                                      <span className="file-name">
                                        <button
                                          type="button"
                                          className="file-link-button"
                                          onClick={() => window.open(uploadedFiles[field.name].url, '_blank')}
                                          title={file.name}
                                        >
                                          {file.name}
                                        </button>
                                        <button
                                          type="button"
                                          className="delete-file-button"
                                          onClick={() => handleFileDelete(field.name, file.id)}
                                        >
                                          <FontAwesomeIcon icon={faXmark} />
                                        </button>
                                      </span>


                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      case 'checkbox':
                        return (<>
                          <div className='form-header'>
                            <span className="checkbox-group-label">
                              {field.label}
                              {field.required && <span className="required-field">*</span>}
                            </span>
                          </div>
                          <div className="form-group" key={field.name}>

                            {field.options.map((option, idx) => (
                              <div key={idx} className="checkbox-option">
                                <label htmlFor={`${field.name}-${idx}`}>
                                  <input
                                    id={`${field.name}-${idx}`}
                                    type="checkbox"
                                    name={field.name}
                                    value={option}
                                    checked={formData[field.name]?.includes(option)}
                                    onChange={(e) => handleCheckboxChange(e, field.name)}
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
                          <div className="form-header" key={field.label}>
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
                        <LocationPicker onLocationSelect={handleLocationSelect} />
                      </div>
                    </div>
                  )}
                </div>
              )}


            </div>
          </div>
          {/* Action Buttons */}
          {activeTab === 'Products & MoQ' || activeTab === 'Branches' ?
            (<div className="customer-onboarding-form-actions">
              <div className="status-text">
                <span className="status-label">{t('Status')}:</span>
                <span className="status-badge">{t(formData.status) || t('Pending')}</span>
              </div>
              <div className="action-buttons">
                <button className="save" onClick={() => handleSave('save')}>
                  {t('Save Changes')}
                </button>
                <button className="block" onClick={() => handleSubmit('block')}>
                  {t('Block')}
                </button>
              </div>
            </div>) :
            (<div className="customer-onboarding-form-actions">
              <div className="status-text">
                <span className="status-label">{t('Status')}:</span>
                <span className="status-badge">{t(formData.status) || t('Pending')}</span>
              </div>
              <div className="action-buttons">
                <button className="save" onClick={() => handleSave('save')}>
                  {t('Save Changes')}
                </button>
                <button className="block" onClick={() => handleSubmit('block')}>
                  {t('Block')}
                </button>
                <button className="approve" onClick={() => handleSubmit('approve')}>
                  {t('Approve')}
                </button>
                <button className="reject" onClick={() => handleSubmit('reject')}>
                  {t('Reject')}
                </button>
              </div>
            </div>)}
        </div>
        <div>
          <CommentPopup isOpen={isCommentPanelOpen} setIsOpen={setIsCommentPanelOpen} />
        </div>
      </div>
    </Sidebar>

  );
}

export default CustomersDetails;
