import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
import { useTranslation } from 'react-i18next';
import ActionButton from '../components/ActionButton';
import SearchInput from '../components/SearchInput';
import Table from '../components/Table';
import Tabs from '../components/Tabs';

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
    email: 'customer2@customer.com',
    phone: '99000/XX024',
    companyName: 'Company Name',
    region: 'Asia',
    assignTo: 'Name',
    source: 'CRM',
    status: 'New'
  },
  {
    date: '15 Apr 2025',
    customerName: 'FULL NAME',
    email: 'customer3@customer.com',
    phone: '12345/YY678',
    companyName: 'Another Company',
    region: 'Europe',
    assignTo: 'Another Name',
    source: 'Email',
    status: 'Pending'
  },
  {
    date: '15 Apr 2025',
    customerName: 'FULL NAME',
    email: 'customer4@customer.com',
    phone: '54321/YY987',
    companyName: 'Third Company',
    region: 'North America',
    assignTo: 'Third Name',
    source: 'Web',
    status: 'Pending'
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
  const [activeTab, setActiveTab] = useState('customers');
  const [filteredCustomers, setFilteredCustomers] = useState(customers);
  const [filteredInvites, setFilteredInvites] = useState(invites);

  const customerTabs = [
    { value: 'customers', label: 'Customers' },
    { value: 'invites', label: 'Invites' }
  ];

  const handleResend = (invite) => {
    console.log('Resend invite:', invite);
    alert('Invite resent successfully!');
    // Add your resend logic here
  };

  const handleInvite = (invite) => {
    console.log('Send invite:', invite);
    alert('Invite sent successfully!');
    // Add your invite logic here
  };

  const handleSearch = (searchTerm) => {
    if (activeTab === 'customers') {
      const filtered = customers.filter((customer) =>
        Object.values(customer).some((value) =>
          typeof value === 'object'
            ? Object.values(value).some(v => 
                v.toString().toLowerCase().includes(searchTerm.toLowerCase())
              )
            : value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredCustomers(filtered);
    } else {
      const filtered = invites.filter((invite) =>
        Object.values(invite).some((value) =>
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredInvites(filtered);
    }
  };

  const customerColumns = [
    { key: 'companyName', header: 'Company' },
    { key: 'primaryContact', header: 'Primary Contact' },
    { key: 'companyType', header: 'Company Type' },
    { key: 'typeOfBusiness', header: 'Type Of Business' },
    { key: 'deliveryLocation', header: 'Delivery Location' },
    { key: 'status', header: 'Status' }
  ];

  const inviteColumns = [
    { key: 'date', header: 'Date' },
    { key: 'customerName', header: 'Customer Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'companyName', header: 'Company Name' },
    { key: 'region', header: 'Region' },
    { key: 'assignTo', header: 'Assign To' },
    { key: 'source', header: 'Source' },
    { key: 'status', header: 'Status' },
    { key: 'actions', header: '' }
  ];

  const customCellRenderer = {
    primaryContact: (item) => (
      <div className="contact-info">
        <div>{item.primaryContact.name}</div>
        <div className="email">{item.primaryContact.email}</div>
      </div>
    )
  };

  const renderActionButtons = (invite) => (
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
  );

  const customerMenuItems = [
    {
      key: 'select customers',
      label: 'Select Customers',
      onClick: () => alert('Select Customers clicked')
    },
    {
      key: 'add customers',
      label: 'Add Customers',
      onClick: () => alert('Add Customers clicked')
    },
    {
      key: 'remove customers',
      label: 'Remove Customers',
      onClick: () => alert('Remove Customers clicked')
    },
    {
      key: 'export customers',
      label: 'Export Customers',
      onClick: () => alert('Export Customers clicked')
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case t('customers'):
        return (
          <Table 
            columns={customerColumns}
            data={filteredCustomers}
            getStatusClass={getStatusClass}
            customCellRenderer={customCellRenderer}
          />
        );
      case t('invites'):
        return (
          <Table 
            columns={inviteColumns}
            data={filteredInvites}
            getStatusClass={getStatusClass}
            actionButtons={renderActionButtons}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Sidebar title={t('Customers')}>
      <div className="page-content">
        <div className="customer-content">
          <Tabs
            tabs={customerTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <div className="page-header">
            {activeTab === t('customers') && (
              <div className="header-controls" style={{ width: '100%' }}>
              <SearchInput onSearch={handleSearch} />
              <div className='header-actions'>
              <ActionButton menuItems={customerMenuItems} />
              </div>
              </div>
            )}
            
            {activeTab === t('invites') && (
              <>
                <button className="add-button" onClick={handleInvite}>{t('+ Invite')}</button>
                <ActionButton menuItems={customerMenuItems} />
              </>
            )}
          </div>
          {renderContent()}
        </div>
      </div>
    </Sidebar>
  );
}

export default Customers;