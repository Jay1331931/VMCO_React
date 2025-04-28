import React, { useState, useRef, useEffect } from 'react';
import Template from './template';
import '../styles/components.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV} from '@fortawesome/free-solid-svg-icons';

const customers = [
  {companyName: 'Company', primaryContact: {name: '99000/XX024', email: 'CUSTOMER@CUSTOMER.COM'}, companyType: 'Trading/Non-Trading', typeOfBusiness: 'Type Of Business', deliveryLocation: 'Jaynagar', status: 'Pending'},
  {companyName: 'Another Company', primaryContact: {name: '12345/XX678', email: 'ANOTHER@CUSTOMER.COM'}, companyType: 'Trading', typeOfBusiness: 'Retail', deliveryLocation: 'Koramangala', status: 'Approved'},
  {companyName: 'Third Company', primaryContact: {name: '54321/YY987', email: 'THIRD@CUSTOMER.COM'}, companyType: 'Non-Trading', typeOfBusiness: 'Wholesale', deliveryLocation: 'Indiranagar', status: 'Rejected'},
  {companyName: 'Fourth Company', primaryContact: {name: '67890/ZZ456', email: 'FOURTH@CUSTOMER.COM'}, companyType: 'Trading', typeOfBusiness: 'E-commerce', deliveryLocation: 'MG Road', status: 'Pending'},
  {companyName: 'Fifth Company', primaryContact: {name: '11111/AA111', email: 'FIFTH@CUSTOMER.COM'}, companyType: 'Trading', typeOfBusiness: 'Manufacturing', deliveryLocation: 'Whitefield', status: 'Approved'},
  
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
                  <th>Company ▲</th>
                  <th>Primary Contact</th>
                  <th>Company Type</th>
                  <th>Type Of Business</th>
                  <th>Delivery Location</th>
                  <th>Status</th>
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
            <div className='header-container'>
                <button className="add-button">+ Invite</button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date ▲</th>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Company Name</th>
                  <th>Region</th>
                  <th>Assign To</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Actions</th>
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
                            Resend
                          </button>
                        )}
                        {invite.status === 'New' && (
                          <button 
                            className="action-button invite"
                            onClick={() => handleInvite(invite)}
                          >
                            Invite
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
    <Template>
      <div className="page-content">
        <div className="customer-content">
          <div className="tab-container">
            <div className="tabs">
              <button 
                className={`tab-button ${activeTab === 'customers' ? 'active' : ''}`}
                onClick={() => setActiveTab('customers')}
              >
                Customers
              </button>
              <button 
                className={`tab-button ${activeTab === 'invites' ? 'active' : ''}`}
                onClick={() => setActiveTab('invites')}
              >
                Invites
              </button>
            </div>
          </div>
          <div className="page-header">
            <div className="header-controls">
            <input type="text" placeholder="Search..." className="search-input" />
            </div>
            <div className="header-actions">
              <div className="action-menu-container" ref={actionMenuRef}>
                <FontAwesomeIcon
                  icon={faEllipsisV}
                  className="action-menu-icon"
                  onClick={toggleActionMenu}
                />
                {isActionMenuOpen && (
                  <div className="action-menu">
                    <div className="action-menu-item">Export</div>
                    <div className="action-menu-item">Import</div>
                    <div className="action-menu-item">Settings</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {renderContent()}
        </div>
      </div>
    </Template>
  );
}

export default Customers;