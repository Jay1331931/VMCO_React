import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
import { useTranslation } from 'react-i18next';
import ActionButton from '../components/ActionButton';
import ToggleButton from '../components/ToggleButton';
import SearchInput from '../components/SearchInput';
import Pagination from '../components/Pagination';
import Table from '../components/Table';
import Tabs from '../components/Tabs';
import getBusinessDetailsFormData from './customerDetailsForms/customerBusinessDetails';
import { useNavigate } from 'react-router-dom';

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
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [filteredApprovals, setFilteredApprovals] = useState([]);
  const [customerContacts, setCustomerContacts] = useState({});
  const [filteredInvites, setFilteredInvites] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });
  const customerTabs = [
    { value: 'customers', label: 'Customers' },
    { value: 'invites', label: 'Invites' }
  ];
const [isApprovalMode, setApprovalMode] = useState(false);
const toggleApprovalMode = () => {
    setApprovalMode(!isApprovalMode);
    console.log('Approval mode:', isApprovalMode);
    if (!isApprovalMode) {
      fetchApprovals();
    } else {
      fetchCustomers();
    }
  };

  const handleResend = (invite) => {
    console.log('Resend invite:', invite);
    alert('Invite resent successfully!');
  };

  const handleInvite = (invite) => {
    console.log('Send invite:', invite);
    alert('Invite sent successfully!');
  };

  const handleSearch = (searchTerm) => {
    if (activeTab === 'customers') {
      const filtered = filteredCustomers.filter((customer) =>
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
      const filtered = filteredInvites.filter((invite) =>
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

   const approvalColumns = [
    { key: 'companyNameEn', header: 'Company' },
    { key: 'primaryContact', header: 'Primary Contact' },
    { key: 'companyType', header: 'Company Type' },
    { key: 'typeOfBusiness', header: 'Type Of Business' },
    { key: 'city', header: 'Delivery Location' },
    { key: 'customerStatus', header: 'Status' },
    { key: 'name', header: 'Workflow Name' }
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

    const response = await fetch(`${API_BASE_URL}/customers/pagination?${params.toString()}`, {
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
  const fetchApprovals = async (page = 1, searchTerm = '') => {
    setLoading(true);
    setError(null);
    console.log('Fetching approvals');
    try {
      const params = new URLSearchParams({
      page,
      pageSize: pagination.pageSize,
      search: searchTerm,
      sortBy: 'id',
      sortOrder: 'asc',
      filters: '{}'
    });
    const response = await fetch(`${API_BASE_URL}/workflow-instance/pending-customer-approval?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
const result = await response.json();
      console.log('API Response:', result);
      if (result.status === 'Ok') {
        setFilteredApprovals(result.data.data);
        setPagination(prev => ({
          ...prev,
          page,
          total: result.data.data.length
        }));
      } else {
        throw new Error(response.data.message || 'Failed to fetch approvals');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching approvals:', err);
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

    const response = await fetch(`${API_BASE_URL}/customer-registration-staging/pagination?${params.toString()}`, {
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
    // Adding isApprovalMode to indicate if the customer is in approval mode
    isApprovalMode: false,
  };
}

const fetchCustomerPaymentMethods = async (customerId, customer) => {
  console.log('fetching customer payment methods');
  setLoading(true);
  setError(null);
  try {
    const response = await fetch (`${API_BASE_URL}/payment-method/id/${customerId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    const result = await response.json();
    console.log('API Response:', result);
    if(result.status === 'Ok') {
      // if method details values exists Add each method detail field as field name and its value in customer
      if (result.data.methodDetails) {
        Object.keys(result.data.methodDetails).forEach(fieldName => {
          const newValue = result.data.methodDetails[fieldName];
          if (newValue) {
            customer[fieldName] = newValue;
            if(fieldName === 'credit'){
              customer['creditLimit'] = newValue.limit;
              customer['creditPeriod'] = newValue.period;
              customer['creditBalance'] = newValue.balance;
            }
          }
        });
      }
    }
    return customer;
  } catch (err) {
    setError(err.message);
    console.error('Error fetching customer payment methods:', err);
  } finally {
    setLoading(false);
  }
}

  const fetchCustomerContacts = async (customerId, customer) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/customer-contacts/${customerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const result = await response.json();
      console.log('API Response:', result);
      if (result.status === 'Ok') {
        setCustomerContacts(result.data);
        let transformedCustomer = transformCustomerData(customer, result.data);
  transformedCustomer = await fetchCustomerPaymentMethods(customerId, transformedCustomer);
        console.log('Transformed Customer:', transformedCustomer);
        // Navigate to customer details with approval mode if applicable
        if (isApprovalMode) {
          transformedCustomer.isApprovalMode = true;
        } else {
          transformedCustomer.isApprovalMode = false;
        }
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

  
  useEffect(() => {
    if (activeTab === 'customers') {
      fetchCustomers();
    }
    else if (activeTab === 'customers' && isApprovalMode) {
      fetchApprovals();
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
        const customerColumnsToUse = isApprovalMode ? approvalColumns : customerColumns;

        return (
          <Table 
            columns={customerColumnsToUse}
            data={isApprovalMode ? paginatedApprovals : paginatedCustomers}
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
  const paginatedApprovals = filteredApprovals.slice((page - 1) * pageSize, page * pageSize);
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
                <ToggleButton 
              isToggled={isApprovalMode}
              onToggle={toggleApprovalMode}
            />
            <button className='add-button' style={{ visibility: 'hidden' }}></button>
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