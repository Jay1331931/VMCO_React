import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const customers = [
  {companyName: 'Company', primaryContact: {name: '99000/XX024', email: 'CUSTOMER@CUSTOMER.COM'}, companyType: 'Trading/Non-Trading', typeOfBusiness: 'Type Of Business', deliveryLocation: 'Jaynagar', status: 'Pending'},
  {companyName: 'Another Company', primaryContact: {name: '12345/XX678', email: 'ANOTHER@CUSTOMER.COM'}, companyType: 'Trading', typeOfBusiness: 'Retail', deliveryLocation: 'Koramangala', status: 'Approved'},
  {companyName: 'Third Company', primaryContact: {name: '54321/YY987', email: 'THIRD@CUSTOMER.COM'}, companyType: 'Non-Trading', typeOfBusiness: 'Wholesale', deliveryLocation: 'Indiranagar', status: 'Rejected'},
  {companyName: 'Fourth Company', primaryContact: {name: '67890/ZZ456', email: 'FOURTH@CUSTOMER.COM'}, companyType: 'Trading', typeOfBusiness: 'E-commerce', deliveryLocation: 'MG Road', status: 'Pending'},
  {companyName: 'Fifth Company', primaryContact: {name: '11111/AA111', email: 'FIFTH@CUSTOMER.COM'}, companyType: 'Trading', typeOfBusiness: 'Manufacturing', deliveryLocation: 'Whitefield', status: 'Approved'},
  {companyName: 'Sixth Company', primaryContact: {name: '22222/BB222', email: 'SIXTH@CUSTOMER.COM'}, companyType: 'Non-Trading', typeOfBusiness: 'Services', deliveryLocation: 'Electronic City', status: 'Rejected'},
  {companyName: 'Seventh Company', primaryContact: {name: '33333/CC333', email: 'SEVEN@CUSTOMER.COM'}, companyType: 'Trading', typeOfBusiness: 'Retail', deliveryLocation: 'BTM Layout', status: 'Pending'},
  {companyName: 'Eighth Company', primaryContact: {name: '44444/DD444', email: 'EIGHT@CUSTOMER.COM'}, companyType: 'Non-Trading', typeOfBusiness: 'Wholesale', deliveryLocation: 'Jayanagar', status: 'Approved'},
  {companyName: 'Ninth Company', primaryContact: {name: '55555/EE555', email: 'NINE@CUSTOMER.COM'}, companyType: 'Trading', typeOfBusiness: 'E-commerce', deliveryLocation: 'Koramangala', status: 'Rejected'},
  {companyName: 'Tenth Company', primaryContact: {name: '66666/FF666', email: 'TEN@CUSTOMER.COM'}, companyType: 'Non-Trading', typeOfBusiness: 'Retail', deliveryLocation: 'Indiranagar', status: 'Pending'},
  
  // Add more customer data as needed
];

const invites = [
  {
    date: '15 Apr 2025',
    customerName: 'FULL NAME',
    email: 'customer1@customer.com',
    phone: '99000/XX024',
    companyName: 'Company Name',
    region: 'Asia',
    assignTo: 'Name',
    source: 'Source',
    status: 'Pending'
  },
  {
    date: '15 Apr 2025',
    customerName: 'FULL NAME',
    email: 'customer1@customer.com',
    phone: '99000/XX024',
    companyName: 'Company Name',
    region: 'Asia',
    assignTo: 'Name',
    source: 'CRM',
    status: 'New'
  }
];

const getStatusClass = (status) => {
  switch (status) {
    case 'Approved':
      return 'status-approved';
    case 'Rejected':
      return 'status-rejected';
    default:
      return 'status-pending';
  }
};

function Customers() {
  const { t } = useTranslation();
  const [isActionMenuOpen, setActionMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('customers');
  const actionMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setActionMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleActionMenu = () => {
    setActionMenuOpen(!isActionMenuOpen);
  };

  const handleResend = (invite) => {
    console.log('Resend invite:', invite);
    // Add your resend logic here
  };

  const handleInvite = (invite) => {
    console.log('Send invite:', invite);
    // Add your invite logic here
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'customers':
        return (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Company')}</th>
                  <th>{t('Primary Contact')}</th>
                  <th>{t('Company Type')}</th>
                  <th>{t('Type Of Business')}</th>
                  <th>{t('Delivery Location')}</th>
                  <th>{t('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => (
                  <tr key={index}>
                    <td>{customer.companyName}</td>
                    <td>
                      <div className="contact-info">
                        <div>{customer.primaryContact.name}</div>
                        <div className="email">{customer.primaryContact.email}</div>
                      </div>
                    </td>
                    <td>{customer.companyType}</td>
                    <td>{customer.typeOfBusiness}</td>
                    <td>{customer.deliveryLocation}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(customer.status)}`}>
                        {customer.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'invites':
        return (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Date')}</th>
                  <th>{t('Customer Name')}</th>
                  <th>{t('Email')}</th>
                  <th>{t('Phone')}</th>
                  <th>{t('Company Name')}</th>
                  <th>{t('Region')}</th>
                  <th>{t('Assign To')}</th>
                  <th>{t('Source')}</th>
                  <th>{t('Status')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite, index) => (
                  <tr key={index}>
                    <td>{invite.date}</td>
                    <td>{invite.customerName}</td>
                    <td>{invite.email}</td>
                    <td>{invite.phone}</td>
                    <td>{invite.companyName}</td>
                    <td>{invite.region}</td>
                    <td>{invite.assignTo}</td>
                    <td>{invite.source}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(invite.status)}`}>
                        {invite.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {invite.status === 'Pending' && (
                          <button 
                            className="action-button resend"
                            onClick={() => handleResend(invite)}
                          >
                            {t('Resend')}
                          </button>
                        )}
                        {invite.status === 'New' && (
                          <button 
                            className="action-button invite"
                            onClick={() => handleInvite(invite)}
                          >
                            {t('Invite')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Sidebar title={t('Customers')}>
      <div className="page-content">
        <div className="customer-content">
          <div className="tab-container">
            <div className="tabs">
              <button 
                className={`tab-button ${activeTab === 'customers' ? 'active' : ''}`}
                onClick={() => setActiveTab('customers')}
              >
                {t('Customers')}
              </button>
              <button 
                className={`tab-button ${activeTab === 'invites' ? 'active' : ''}`}
                onClick={() => setActiveTab('invites')}
              >
                {t('Invites')}
              </button>
            </div>
          </div>
          <div className="page-header">
            <div className="header-controls">
              <input type="text" placeholder={t('Search...')} className="search-input" />
            </div>
            <div className="header-actions">
              {activeTab === 'invites' && (
                <button className="add-button">{t('+ Invite')}</button>
              )}
              <div className="action-menu-container" ref={actionMenuRef}>
                <FontAwesomeIcon
                  icon={faEllipsisV}
                  className="action-menu-icon"
                  onClick={toggleActionMenu}
                />
                {isActionMenuOpen && (
                  <div className="action-menu">
                    <div className="action-menu-item">{t('Export')}</div>
                    <div className="action-menu-item">{t('Import')}</div>
                    <div className="action-menu-item">{t('Settings')}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {renderContent()}
        </div>
      </div>
    </Sidebar>
  );
}

export default Customers;