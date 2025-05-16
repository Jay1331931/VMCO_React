import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
import { useTranslation } from 'react-i18next';
import ActionButton from '../components/ActionButton';
import SearchInput from '../components/SearchInput';
import Pagination from '../components/Pagination';
import Table from '../components/Table';
import Tabs from '../components/Tabs';
import getBusinessDetailsFormData from './customerDetailsForms/customerBusinessDetails';
import { useNavigate } from 'react-router-dom';

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
  const [customerContacts, setCustomerContacts] = useState({});
  const [filteredInvites, setFilteredInvites] = useState(invites);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });
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
    { key: 'companyNameEn', header: 'Company' },
    { key: 'primaryContact', header: 'Primary Contact' },
    { key: 'companyType', header: 'Company Type' },
    { key: 'typeOfBusiness', header: 'Type Of Business' },
    { key: 'city', header: 'Delivery Location' },
    { key: 'customerStatus', header: 'Status' }
  ];

  const inviteColumns = [
    { key: 'date', header: 'Date' },
    { key: 'leadName', header: 'Customer Name' },
    { key: 'companyEmail', header: 'Email' },
    { key: 'companyPhone', header: 'Phone' },
    { key: 'companyName', header: 'Company Name' },
    { key: 'region', header: 'Region' },
    { key: 'assignedTo', header: 'Assign To' },
    { key: 'source', header: 'Source' },
    { key: 'status', header: 'Status' },
    { key: 'actions', header: '' }
  ];
 const fetchCustomers = async (page = 1, searchTerm = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
      page,
      pageSize: pagination.pageSize,
      search: searchTerm,
      sortBy: 'id',
      sortOrder: 'asc',
      filters: '{}'
    });

    const response = await fetch(`http://localhost:3000/api/customers/pagination?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
const result = await response.json();
      console.log('API Response:', result);
      if (result.status === 'Ok') {
        setFilteredCustomers(result.data.data);
        setPagination(prev => ({
          ...prev,
          page,
          total: result.data.data.length
        }));
      } else {
        throw new Error(response.data.message || 'Failed to fetch customers');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async (page = 1, searchTerm = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
      page,
      pageSize: pagination.pageSize,
      search: searchTerm,
      sortBy: 'id',
      sortOrder: 'asc',
      filters: '{}'
    });

    const response = await fetch(`http://localhost:3000/api/customer-registration-staging/pagination?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
const result = await response.json();
      console.log('API Response:', result);
      if (result.status === 'Ok') {
        setFilteredInvites(result.data.data);
        setPagination(prev => ({
          ...prev,
          page,
          total: result.data.data.length
        }));
      } else {
        throw new Error(response.data.message || 'Failed to fetch invites');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching invites:', err);
    } finally {
      setLoading(false);
    }
  };
// function transformCustomerData(customer, customerContacts) {
//   // Ensure contacts is always an array
//   console.log('customerContacts', customerContacts);
//   const contacts = Array.isArray(customerContacts) 
//     ? customerContacts 
//     : customerContacts ? [customerContacts] : [];

//   // Create a map of contact_type to contact data for easier lookup
//   const contactsMap = contacts.reduce((acc, contact) => {
//     acc[contact.contact_type] = contact;
//     return acc;
//   }, {});

//   console.log('Customer Contacts:', contactsMap);

//   return {
//     ...customer,
//     // Contact details - each contact type is a separate row in DB
//     primaryContactName: contactsMap.primary?.name || '',
//     primaryContactDesignation: contactsMap.primary?.designation || '',
//     primaryContactEmail: contactsMap.primary?.email || '',
//     primaryContactMobile: contactsMap.primary?.phone || '',
    
//     businessHeadName: contactsMap.business?.name || '',
//     businessHeadDesignation: contactsMap.business?.designation || '',
//     businessHeadEmail: contactsMap.business?.email || '',
//     businessHeadMobile: contactsMap.business?.phone || '',
    
//     financeHeadName: contactsMap.finance?.name || '',
//     financeHeadDesignation: contactsMap.finance?.designation || '',
//     financeHeadEmail: contactsMap.finance?.email || '',
//     financeHeadMobile: contactsMap.finance?.phone || '',
    
//     purchasingHeadName: contactsMap.purchasing?.name || '',
//     purchasingHeadDesignation: contactsMap.purchasing?.designation || '',
//     purchasingHeadEmail: contactsMap.purchasing?.email || '',
//     purchasingHeadMobile: contactsMap.purchasing?.phone || '',
//   };
// }
// Modified transform function
function transformCustomerData(customer, customerContacts) {
  // Ensure contacts is always an array
  console.log('customerContacts', customerContacts);
  const contacts = Array.isArray(customerContacts) 
    ? customerContacts 
    : customerContacts ? [customerContacts] : [];

  // Create a map of contactType to contact data (note: using contactType instead of contact_type)
  const contactsMap = contacts.reduce((acc, contact) => {
    acc[contact.contactType] = contact;
    return acc;
  }, {});

  console.log('Customer Contacts Map:', contactsMap);

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
  };
}
  const fetchCustomerContacts = async (customerId, customer) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3000/api/customer-contacts/${customerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const result = await response.json();
      console.log('API Response:', result);
      if (result.status === 'Ok') {
        setCustomerContacts(result.data);
        const transformedCustomer = transformCustomerData(customer, result.data);
  console.log('Transformed Customer:', transformedCustomer);
   navigate(`/customersDetails`, { state: { transformedCustomer } });

      } else {
        throw new Error(response.data.message || 'Failed to fetch customer contacts');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching customer contacts:', err);
    } finally {
      setLoading(false);
    }
  };

//   function transformCustomerData(customer, customerContacts) {
//   const contacts = Array.isArray(customerContacts) 
//     ? customerContacts 
//     : customerContacts ? [customerContacts] : [];
//   console.log('Customer Contacts:', contacts);
//   return {
//     ...customer,
//     // Contact details
//     primaryContactName: contacts.find(c => c.contact_type === 'primary')?.name || '',
//     primaryContactDesignation: contacts.find(c => c.contact_type === 'primary')?.designation || '',
//     primaryContactEmail: contacts.find(c => c.contact_type === 'primary')?.email || '',
//     primaryContactMobile: contacts.find(c => c.contact_type === 'primary')?.phone || '',
    
//     businessHeadName: contacts.find(c => c.contact_type === 'business')?.name || '',
//     businessHeadDesignation: contacts.find(c => c.contact_type === 'business')?.designation || '',
//     businessHeadEmail: contacts.find(c => c.contact_type === 'business')?.email || '',
//     businessHeadMobile: contacts.find(c => c.contact_type === 'business')?.phone || '',
    
//     financeHeadName: contacts.find(c => c.contact_type === 'finance')?.name || '',
//     financeHeadDesignation: contacts.find(c => c.contact_type === 'finance')?.designation || '',
//     financeHeadEmail: contacts.find(c => c.contact_type === 'finance')?.email || '',
//     financeHeadMobile: contacts.find(c => c.contact_type === 'finance')?.phone || '',
    
//     purchasingHeadName: contacts.find(c => c.contact_type === 'purchasing')?.name || '',
//     purchasingHeadDesignation: contacts.find(c => c.contact_type === 'purchasing')?.designation || '',
//     purchasingHeadEmail: contacts.find(c => c.contact_type === 'purchasing')?.email || '',
//     purchasingHeadMobile: contacts.find(c => c.contact_type === 'purchasing')?.phone || '',
//   };
// }


  useEffect(() => {
    if (activeTab === 'customers') {
      fetchCustomers();
    }
    if (activeTab === 'invites') {
      fetchInvites();
    }
    
  }, [activeTab]);

const handleRowClick = (customer) => {
   fetchCustomerContacts(customer.id, customer);
  // console.log('Customer ID:', customer.id);
  // console.log('Customer Contacts:', customerContacts);
  // const transformedCustomer = transformCustomerData(customer, customerContacts);
  // console.log('Transformed Customer:', transformedCustomer);
  //  navigate(`/customersDetails`, { state: { transformedCustomer } });
};

  const customCellRenderer = {
    primaryContact: (item) => (
      <div className="contact-info">
        <div>{item.primaryContactName}</div>
        <div className="email">{item.primaryContactEmail}</div>
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
            data={paginatedCustomers}
            getStatusClass={getStatusClass}
            customCellRenderer={customCellRenderer}
            onRowClick={handleRowClick}
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
// Paginate the filtered orders
  const paginatedCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);

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
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </Sidebar>
  );
}

export default Customers;