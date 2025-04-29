import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faBan, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import Template from './template';
import '../styles/forms.css';
import CommentPopup from './commentPanel';
import '../i18n';
import { useTranslation } from 'react-i18next';

// Define forms per tab
const formsByTab = {
  'Business Details': [
    { type: 'text', name: 'companyName', label: 'Company Name', placeholder: 'Value' },
    { type: 'text', name: 'companyNameArabic', label: 'Company Name (Arabic)', placeholder: 'أدخل اسم الشركة' },
    { type: 'text', name: 'commercialRegistration', label: 'Commercial Registration #', placeholder: 'Value' },
    { type: 'text', name: 'vatRegistration', label: 'VAT Registration #', placeholder: 'Value' },
    { type: 'text', name: 'baladeahLicense', label: 'Baladeah License #', placeholder: 'Value' },
    { type: 'dropdown', name: 'businessType', label: 'Type of Business', options: [] },
    { type: 'dropdown', name: 'deliveryLocations', label: 'Delivery Locations', options: [] },
    { type: 'empty'},
    { type: 'text', name: 'brandName', label: 'Brand Name', placeholder: 'Value' },
    { type: 'text', name: 'brandNamearabic', label: 'Brand Name (Arabic)', placeholder: 'أدخل اسم الشركة' },
    { type: 'file', name: 'companyLogo', label: 'Company Logo' },
    { type: 'file', name: 'brandLogo', label: 'Brand Logo' },
    ],
  'Contact Details': [
    { type: 'header', label: 'Primary Contact Details' },
    { type: 'text', name: 'primaryContactName', label: 'Primary Contact Name', placeholder: 'Value' },
    { type: 'text', name: 'designation', label: 'Designation', placeholder: 'Value' },
    { type: 'text', name: 'email', label: 'Email', placeholder: 'Value' },
    { type: 'text', name: 'phone', label: 'Phone', placeholder: 'Value' },
    { type: 'header', label: 'Business Head' },
    { type: 'checkbox', name: 'businessHead', label: '', options: ['Same as Primary Contact Details'] },
    { type: 'empty'},
    { type: 'text', name: 'primaryContactName', label: 'Primary Contact Name', placeholder: 'Value' },
    { type: 'text', name: 'designation', label: 'Designation', placeholder: 'Value' },
    { type: 'text', name: 'email', label: 'Email', placeholder: 'Value' },
    { type: 'text', name: 'phone', label: 'Phone', placeholder: 'Value' },
    { type: 'header', label: 'Finance Head' },
    { type: 'checkbox', name: 'financeHead', label: '', options: ['Same as Primary Contact Details'] },
    { type: 'empty'},
    { type: 'text', name: 'primaryContactName', label: 'Primary Contact Name', placeholder: 'Value' },
    { type: 'text', name: 'designation', label: 'Designation', placeholder: 'Value' },
    { type: 'text', name: 'email', label: 'Email', placeholder: 'Value' },
    { type: 'text', name: 'phone', label: 'Phone', placeholder: 'Value' },
    { type: 'header', label: 'Purchasing Head' },
    { type: 'checkbox', name: 'purchasingHead', label: '', options: ['Same as Primary Contact Details'] },
    { type: 'empty'},
    { type: 'text', name: 'primaryContactName', label: 'Primary Contact Name', placeholder: 'Value' },
    { type: 'text', name: 'designation', label: 'Designation', placeholder: 'Value' },
    { type: 'text', name: 'email', label: 'Email', placeholder: 'Value' },
    { type: 'text', name: 'phone', label: 'Phone', placeholder: 'Value' },
    { type: 'header', label: 'Business Address'},
    { type: 'text', name: 'buildingName', label: 'Building Name', placeholder: 'Value' },
    { type: 'text', name: 'street', label: 'Street', placeholder: 'Value' },
    { type: 'text', name: 'city', label: 'City', placeholder: 'Value' },
    { type: 'text', name: 'region', label: 'Region', placeholder: 'Value' },
    { type: 'text', name: 'geolocation', label: 'Geolocation', placeholder: 'Value' },
    { type: 'text', name: 'pincode', label: 'Pincode', placeholder: 'Value' },
  ],
  'Financial Information': [
    { type: 'header', label: 'Bank Details' },
    { type: 'text', name: 'bankName', label: 'Bank Name', placeholder: 'Value' },
    { type: 'text', name: 'accountNumber', label: 'Account Number', placeholder: 'Value' },
    { type: 'text', name: 'ibanNumber', label: 'IBAN', placeholder: 'Value' },
    { type: 'empty'},
    { type: 'checkbox', name: 'paymentMethods', label: 'Payment Method (Post Approval)', options: ['Pre-Payment', 'Partial Payment', 'Advance Payment'] },
    { type: 'empty'},

    { type: 'checkbox', name: 'paymentMethodCOD', label: '', options: ['Cash on Delivery (COD)'] },
    { type: 'text', name: 'cod', label: '', placeholder: 'Value' },
    { type: 'checkbox', name: 'paymentMethodCredit', label: '', options: ['Credit'] },
    { type: 'text', name: 'creditLimit', label: '', placeholder: 'Value' },
    ],
  'Documents': [
    { type: 'header', label: 'Documents' },
    { type: 'empty'},
    { type: 'header', label: 'Download terms & conditions and upload duly signed document' },
    { type: 'document', name: 'dulySigned', label: 'Upload duly signed document' },
    { type: 'document', name: 'commercialRegistration', label: 'Copy of Commercial Registration' },
    { type: 'document', name: 'vatCertificate', label: 'Copy of VAT Certificate' },
    { type: 'document', name: 'nationalID', label: 'Copy of national ID/Iqama of the auth. sign..' },
    { type: 'document', name: 'bankDetails', label: 'Bank details on company letterhead' },
  ],
  'Branches': [
    { type: 'text', name: 'branchName', label: 'Branch Name', placeholder: 'Enter branch name' },
    { type: 'text', name: 'branchLocation', label: 'Branch Location', placeholder: 'Enter location' },
  ],
};

const tabs = Object.keys(formsByTab);
// Arabic text checker
const isArabicText = (text) => {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
};

function CustomersOnboarding() {
  const [activeTab, setActiveTab] = useState('Business Details');
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const { t, i18n } = useTranslation();
  useEffect(() => {
    const fields = formsByTab[activeTab];
    const newFormData = {};
    fields.forEach(field => {
      newFormData[field.name] = field.type === 'checkbox' ? [] : ''; // Initialize checkboxes as empty arrays
    });
    setFormData(prev => ({ ...prev, ...newFormData }));
    setFormErrors({});
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputVal = type === 'checkbox' ? checked : value;

    // Arabic field validation
    if (name.toLowerCase().includes('arabic') && value && !isArabicText(value)) {
      setFormErrors(prev => ({ ...prev, [name]: 'Please enter Arabic text.' }));
    } else {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    setFormData(prev => ({ ...prev, [name]: inputVal }));
  };

  const handleFileUpload = (e, name) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, [name]: URL.createObjectURL(file) }));
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
        // Add the selected option to the array
        updatedValues = [...updatedValues, value];
      } else {
        // Remove the unselected option from the array
        updatedValues = updatedValues.filter((item) => item !== value);
      }
  
      return {
        ...prev,
        [fieldName]: updatedValues,
      };
    });
  };

  const renderHeaderWithLinks = (label) => {
    // Define all phrases you want to hyperlink and their URLs
    const linkMap = {
      'Download terms & conditions': '/path/to/terms.pdf',
      // Add more if needed
    };
  
    let elements = [label];
  
    // Replace matched phrases in the label with <a> tags
    Object.entries(linkMap).forEach(([phrase, url]) => {
      elements = elements.flatMap((part) =>
        typeof part === 'string' && part.includes(phrase)
          ? [
              ...part.split(phrase).flatMap((chunk, idx, arr) =>
                idx < arr.length - 1
                  ? [chunk, <a key={phrase + idx} href={url} target="_blank" rel="noopener noreferrer">{phrase}</a>]
                  : [chunk]
              ),
            ]
          : [part]
      );
    });
  
    return elements;
  };

  return (
    <Template>
      <div className={`customer-onboarding-content ${isCommentPanelOpen ? 'collapsed' : ''}`}>
        <div className="customer-onboarding-details">
          <div className="customer-onboarding-body">
            {/* Tabs */}
            <div className="customer-onboarding-tabs-vertical">
              <div className="tabs-title">{t('Customer Details')}</div>
              {tabs.map(tab => (
                <div
                  key={tab}
                  className={`tab ${tab === activeTab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </div>
              ))}
            </div>

            {/* Form Grid */}
            <div className="customer-onboarding-form-grid">
              <div className="form-main-header">
                <a href="#">Customer Approval Checklist</a>
              </div>

              {formsByTab[activeTab].map((field) => {
                switch (field.type) {
                  case 'text':
                    return (
                      <div className="form-group" key={field.name}>
                        <label htmlFor={field.name}>{field.label}</label>
                        <input
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
                        <label htmlFor={field.name}>{field.label}</label>
                        <select
                          name={field.name}
                          value={formData[field.name] || ''}
                          onChange={handleInputChange}
                          className="dropdown"
                          placeholder="Value"
                          required
                        >
                          <option value="" disabled hidden>Value</option>
                          {field.options.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    );
                  case 'file':
                    return (
                      <div className="file-upload" key={field.name}>
                        <label htmlFor={field.name}>{field.label}</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, field.name)}
                        />
                      </div>
                    );
                    case 'document':
                    return (
                      <div className="document-upload full-width" key={field.name}>
                        <label htmlFor={field.name}>{field.label}</label>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <input
                          type="file"
                          accept="pdf/*"
                          onChange={(e) => handleFileUpload(e, field.name)}
                        />
                      </div>
                    );
                    case 'checkbox':
                        return (
                          <div className="form-group" key={field.name}>
                            <label>{field.label}</label>
                            {field.options.map((option, idx) => (
                              <div key={idx} className="checkbox-option">
                                <label>
                                  <input
                                    type="checkbox"
                                    name={field.name}
                                    value={option}
                                    checked={formData[field.name]?.includes(option)} // Check if the option is selected
                                    onChange={(e) => handleCheckboxChange(e, field.name)}
                                  />
                                  {option}
                                </label>
                              </div>
                            ))}
                          </div>
                        );

                    case 'empty':
                    return (
                      <div>
                      </div>
                    );

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
          </div>
        </div>

        {/* Action Buttons */}
        <div className="customer-onboarding-form-actions">
          <div className="status-text">
            <span className="status-label">Status:</span>
            <span className="status-badge">{formData.status || 'Pending'}</span>
          </div>
          <button className="save" onClick={() => handleSubmit('save')}>
            <FontAwesomeIcon icon={faSave} /> Save Changes
          </button>
          <button className="block" onClick={() => handleSubmit('block')}>
            <FontAwesomeIcon icon={faBan} /> Block
          </button>
          <button className="approve" onClick={() => handleSubmit('approve')}>
            <FontAwesomeIcon icon={faCheck} /> Approve
          </button>
          <button className="reject" onClick={() => handleSubmit('reject')}>
            <FontAwesomeIcon icon={faTimes} /> Reject
          </button>
        </div>
      </div>
        <div>
            <CommentPopup isOpen={isCommentPanelOpen} setIsOpen={setIsCommentPanelOpen} />
        </div>
    </Template>
    
  );
}

export default CustomersOnboarding;
