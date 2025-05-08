import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/forms.css';
import CommentPopup from './commentPanel';
import '../i18n';
import { useTranslation } from 'react-i18next';
import { getBusinessDetailsForm, getBusinessDetailsFormData } from './customerDetailsForms/customerBusinessDetails';
import { getContactDetailsForm } from './customerDetailsForms/customerContactDetails';
import { getFinancialInformationForm } from './customerDetailsForms/customerFinancialInformation';
import { getDocumentsForm } from './customerDetailsForms/customerDocuments';
import CustomerProducts from './customerDetailsForms/customerProducts';
import CustomerBranches from './customerDetailsForms/customerBranches';
function CustomersDetails() {
  const contentRef = useRef(null);
  const [tabsHeight, setTabsHeight] = useState('auto');
  
  
  const { t, i18n } = useTranslation();
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
    'Business Details': getBusinessDetailsFormData(t)['Business Details'],
  }), [t]);

  const tabs = Object.keys(formsByTab);
  // Arabic text checker
  const isArabicText = (text) => {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
  };
  const [activeTab, setActiveTab] = useState('Business Details');
  const [formData, setFormData] = useState(formDataByTab['Business Details']);
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
  
  useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.clientHeight;
      const adjustment = 50; // your constant value
      setTabsHeight(`${contentHeight - adjustment}px`);
    }
  }, [activeTab, formData]);

  const setFormDataByTab = (tab) => {
    setFormData(formDataByTab[tab] || {});
  }

  const [changedFields, setChangedFields] = useState(new Set());
  const [savedData, setSavedData] = useState({});


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputVal = type === 'checkbox' ? checked : value;
    setChangedFields(prev => new Set(prev).add(name));
    setFormData(prev => ({ ...prev, [name]: inputVal }));
  };

  const validateChangedFields = () => {
    const errors = {};
    changedFields.forEach((fieldName) => {
      const field = formsByTab[activeTab].find(f => f.name === fieldName);
      const value = formData[fieldName];
  
      if (field?.type === 'text' && field.required && !value) {
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
    });
  
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (action) => {
    if (!validateChangedFields()) {
      alert(t('Please correct errors before submitting.'));
      return;
    }

    setSavedData(prev => ({
      ...prev,
      [activeTab]: formData
    }));
  
    alert(`${action.charAt(0).toUpperCase() + action.slice(1)} action triggered.`);
    console.log('Submitted data:', formData);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setFormErrors({});
  };
  
  const [uploadedFiles, setUploadedFiles] = useState({});

  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFiles(prev => ({ ...prev, [fieldName]: file.name }));
      setFormData(prev => ({ ...prev, [fieldName]: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = (action) => {
    alert(`${action.charAt(0).toUpperCase() + action.slice(1)} action triggered.`);
    console.log('Submitted data:', formData);
  };

  const handleCheckboxChange = (e, fieldName) => {
    const { value, checked } = e.target;

    setFormData((prev) => {
      let updatedValues = prev[fieldName] || [];

      if (checked) {
        updatedValues = [...updatedValues, value];
      } else {
        updatedValues = updatedValues.filter((item) => item !== value);
      }

      return {
        ...prev,
        [fieldName]: updatedValues,
      };
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
              <div className="customer-onboarding-tabs-vertical"  style={!isMobile ? { height: tabsHeight } : {}}>
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
                  <CustomerProducts />
                ) : activeTab === 'Branches' ? (
                  <CustomerBranches />
                ) : (
                  <div className="customer-onboarding-form-grid" ref={contentRef}>
                <div className="form-main-header">
                  <a href="#">{t('Customer Approval Checklist')}</a>
                </div>
                  {formsByTab[activeTab].map((field) => {
                    switch (field.type) {
                      case 'text':
                        return (
                          <div className="form-group" key={field.name}>
                            <label htmlFor={`${field.name}-input`}>{field.label}</label>
                            <input
                              id={`${field.name}-input`}
                              type="text"
                              name={field.name}
                              value={formData[field.name] || ''}
                              onChange={handleInputChange}
                              onBlur={validateChangedFields}
                              placeholder={field.placeholder}
                              className={
                                field.name.toLowerCase().includes('arabic')
                                  ? 'text-field arabic'
                                  : 'text-field small'
                              }
                            />
                            {formErrors[field.name] && (
                              <div className="error">{formErrors[field.name]}</div>
                            )}
                          </div>
                        );
                      case 'dropdown':
                        return (
                          <div className="form-group" key={field.name}>
                            <label htmlFor={`${field.name}-select`}>{field.label}</label>
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
                            <label htmlFor={`file-${field.name}`}>{field.label}</label>
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
                                <span className="file-name">{uploadedFiles[field.name]}</span>
                              )}
                            </div>
                          </div>
                        );
                      case 'document':
                        return (
                          <div className="document-upload full-width" key={field.name}>
                            <label htmlFor={`file-${field.name}`}>{field.label}</label>
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
                                <span className="file-name">{uploadedFiles[field.name]}</span>
                              )}
                            </div>
                          </div>
                        );
                      case 'checkbox':
                        return (
                          <div className="form-group" key={field.name}>
                            <span className="checkbox-group-label">{field.label}</span>
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
                        );
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
              <button className="branches-save-button" onClick={() => handleSave('save')}>
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
