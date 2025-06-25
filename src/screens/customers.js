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
import RbacManager from '../utilities/rbac';
import getBusinessDetailsFormData from './customerDetailsForms/customerBusinessDetails';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token, user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: '',
    source: 'salesexecutive' // <-- default value
  });
  const customerTabs = [
    { value: 'customers', label: 'Customers' },
    { value: 'invites', label: 'Invites' }
  ];
  const [isApprovalMode, setApprovalMode] = useState(false);
  // const { token, user, isAuthenticated, logout } = useAuth();
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [regionOptions, setRegionOptions] = useState([]);
  
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
  const toggleApprovalMode = () => {
    setApprovalMode(!isApprovalMode);
    console.log('Approval mode:', isApprovalMode);
    if (!isApprovalMode) {
      fetchApprovals();
    } else {
      fetchCustomers();
    }
  };
  //  const rbacMgr = new RbacManager(user?.userType == 'employee' && user?.roles[0] !== 'admin' ? user?.designation : user?.roles[0], customerFormMode);
  //   const isV = rbacMgr.isV.bind(rbacMgr);
  //   const isE = rbacMgr.isE.bind(rbacMgr);
  const handleResend = async (invite) => {
    console.log('Resend invite:', invite);
    try {
      const response = await fetch(`${API_BASE_URL}/generate-registration-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: invite.id,
        })
      })
      console.log('Response:', response);
      if (response.ok) {
        const result = await response.json();
        console.log('Invite resend link:', result);
        alert('Invite resend link: ' + result.data);
      }
    } catch (err) {
      // console.error('Error resending in  vite:', err);
      console.log('Error resending invite:', err.message);
      alert('Failed to resend invite. Please try again later.');
      return;
    }
    // alert('Invite resent successfully!');
  };

  const handleInvite = () => {
    setInviteData(prev => ({
      ...prev,
      source: 'salesexecutive'
    }));
    setIsInviteModalOpen(true);
  };

  const handleInviteSubmit = async () => {
    // Handle the invite submission here
    console.log('Invite data:', inviteData);
    if (!inviteData.email || !inviteData.name || !inviteData.company || !inviteData.mobile || !inviteData.source || !inviteData.region) {
      alert('Please fill in all fields');
      return;
    }
    // Add your API call to send the invite
    try {
      const response = await fetch('http://localhost:3000/api/auth/registration/staging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyEmail: inviteData.email,
          leadName: inviteData.name,
          companyName: inviteData.company,
          companyPhone: inviteData.mobile,
          region: inviteData.region,
          source: inviteData.source,
          employeeId: user?.employeeId,
          // submissionDate: new Date(),
          comments: inviteData.comments || '',
          registered: false
        }),
        credentials: 'include',
      });
      const result = await response.json();
      console.log(result);
      if (result.status === 'Ok') {
        try {
          const response = await fetch(`${API_BASE_URL}/generate-registration-link`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              id: result.lead.id,
            })
          })
          console.log('Response:', response);
          if (response.ok) {
            const res = await response.json();
            console.log('Invite link:', res);
            alert('Invite link: ' + res.data);
            try {
              const result = await fetch (`${API_BASE_URL}/send`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  eventName: 'WELCOME_EMAIL',
                  emailData: {
                    to: inviteData.email,
                    firstName: inviteData.name,
                    lastName: '',
                    activationLink: res.data,
                  }
                  })
              });
            } catch (err){
              console.error('Error generating invite link:', err);
              alert('Failed to generate invite link. Please try again later.');
              return;
            }
          }
        } catch (err) {
          // console.error('Error resending invite:', err);
          console.log('Error sending invite:', err.message);
          alert('Failed to send invite. Please try again later.');
          return;
        }
      }
    } catch (err) {
      console.error('Error during registration:', error);
    }
    setIsInviteModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInviteData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  // const handleSearch = (searchTerm) => {
  //   if (activeTab === 'customers') {
  //     const filtered = filteredCustomers.filter((customer) =>
  //       Object.values(customer).some((value) =>
  //         typeof value === 'object'
  //           ? Object.values(value).some(v => 
  //               v.toString().toLowerCase().includes(searchTerm.toLowerCase())
  //             )
  //           : value.toString().toLowerCase().includes(searchTerm.toLowerCase())
  //       )
  //     );
  //     setFilteredCustomers(filtered);
  //   } else {
  //     const filtered = filteredInvites.filter((invite) =>
  //       Object.values(invite).some((value) =>
  //         value.toString().toLowerCase().includes(searchTerm.toLowerCase())
  //       )
  //     );
  //     setFilteredInvites(filtered);
  //   }
  // };
  const handleSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
    setPage(1);
    if (!searchTerm) {
      // Reset filters if search term is empty
      if (activeTab === 'customers') {
        fetchCustomers();
        // setFilteredCustomers(filteredCustomers);
      } else {
        fetchInvites();
        // setFilteredInvites(filteredInvites);
      }
      return;
    }

    const searchLower = searchTerm.toLowerCase();

    if (activeTab === 'customers') {
      const filtered = filteredCustomers.filter((customer) => {
        if (!customer) return false; // Skip null/undefined customers

        return Object.values(customer).some((value) => {
          if (value === null || value === undefined) return false;

          if (typeof value === 'object') {
            const nestedValues = Object.values(value || {});
            return nestedValues.some(v =>
              v?.toString().toLowerCase().includes(searchLower)
            );
          }

          return value?.toString().toLowerCase().includes(searchLower);
        });
      });
      setFilteredCustomers(filtered);
    } else {
      const filtered = filteredInvites.filter((invite) => {
        if (!invite) return false; // Skip null/undefined invites

        return Object.values(invite).some((value) =>
          value?.toString().toLowerCase().includes(searchLower)
        );
      });
      setFilteredInvites(filtered);
    }
  };

  const customerColumns = [
    { key: 'id', header: 'Registration ID' },
    { key: 'erp_cust_id', header: 'ERP ID' },
    { key: 'companyNameEn', header: 'Company' },
    { key: 'companyType', header: 'Company Type' },
    { key: 'typeOfBusiness', header: 'Type Of Business' },
    { key: 'customerStatus', header: 'Status' }
  ];

  const approvalColumns = [
    { key: 'id', header: 'Registration ID' },
    { key: 'erp_cust_id', header: 'ERP ID' },
    { key: 'companyNameEn', header: 'Company' },
    { key: 'name', header: 'Workflow Name' },
    { key: 'companyType', header: 'Company Type' },
    { key: 'typeOfBusiness', header: 'Type Of Business' },
    { key: 'customerStatus', header: 'Status' }
  ];
  const inviteColumns = [
    { key: 'createdAt', header: 'Date' },
    { key: 'leadName', header: 'Customer Name' },
    { key: 'companyEmail', header: 'Email' },
    { key: 'companyPhone', header: 'Phone' },
    { key: 'companyName', header: 'Company Name' },
    { key: 'region', header: 'Region' },
    { key: 'employeeId', header: 'Assigned To' },
    { key: 'source', header: 'Source' },
    { key: 'actions', header: '' }
  ];
  //  const handlePageChange = (newPage) => {
  //   setPagination(prev => ({ ...prev, page: newPage }));
  // };
  const fetchCustomers = async (page = 1, searchTerm = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        pageSize,
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
      if (result.status === 'Ok') {
        setFilteredCustomers(result.data.data);
        // setPagination(prev => ({
        //   ...prev,
        //   page,
        //   // total: result.data.data.length
        // }));
        setTotal(result.data.totalRecords);
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
        pageSize,
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
        // setPagination(prev => ({
        //   ...prev,
        //   page,
        //   total: result.data.data.length
        // }));
        setTotal(result.data.totalRecords);
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
        pageSize,
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
        // setPagination(prev => ({
        //   ...prev,
        //   page,
        //   total: result.data.data.length
        // }));
        setTotal(result.data.totalRecords);
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
      workflowData: [],
    };
  }

  const fetchCustomerPaymentMethods = async (customerId, customer) => {
    console.log('fetching customer payment methods');
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/payment-method/id/${customerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const result = await response.json();
      console.log('API Response:', result);
      if (result.status === 'Ok') {
        // if method details values exists Add each method detail field as field name and its value in customer
        if (result.data.methodDetails) {
          Object.keys(result.data.methodDetails).forEach(fieldName => {
            const newValue = result.data.methodDetails[fieldName];
            if (newValue) {
              customer[fieldName] = newValue;
              if (fieldName === 'credit') {
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
          transformedCustomer.workflowData = customer.workflowData || [];
        } else {
          transformedCustomer.isApprovalMode = false;
        }
        // navigate(`/customersDetails`, { state: { transformedCustomer, mode: isApprovalMode ? 'edit' : 'add' } });
        navigate(`/customerDetails`, { state: { customerId: customerId, workflowId: transformedCustomer?.workflowInstanceId, mode: isApprovalMode ? 'edit' : 'add' } });
      } else {
        throw new Error(response.data.message || 'Failed to fetch customer contacts');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching customer contacts:', err);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    if (activeTab === 'customers') {
      if (isApprovalMode) {
        fetchApprovals(page, searchQuery);
      } else {
        fetchCustomers(page, searchQuery);
      }
    } else if (activeTab === 'invites') {
      fetchInvites(page, searchQuery);
    }
  }, [activeTab, isApprovalMode, page, searchQuery]);

  useEffect(() => {
    getOptionsFromBasicsMaster('region').then(setRegionOptions);
  }, []);

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
      {!invite.registered && (
        <button
          className="action-button resend"
          onClick={() => handleResend(invite)}
        >
          {t('Resend')}
        </button>
      )}
      {/* {!invite.registered && (
        <button
          className="action-button invite"
          onClick={() => handleInvite(invite)}
        >
          {t('Invite')}
        </button>
      )} */}
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
            data={paginatedInvites}
            getStatusClass={getStatusClass}
            actionButtons={renderActionButtons}
          />
        );
      default:
        return null;
    }
  };
  // Paginate the filtered orders
  // const paginatedCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);
  // const paginatedApprovals = filteredApprovals.slice((page - 1) * pageSize, page * pageSize);
  const paginatedCustomers = filteredCustomers;
  const paginatedApprovals = filteredApprovals;
  const paginatedInvites = filteredInvites;

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
                {<button className="add-button" onClick={handleInvite}>{t('+ Invite')}</button>}
                <ActionButton menuItems={customerMenuItems} />
              </>
            )}
            {/* Invite Modal/Popup */}
            {isInviteModalOpen && (
              <div className="modal-overlay">
                
                <div className="modal-content">
                  <h2>{t('New Invite')}</h2>
                  <div className="onboarding-container">

                    <div className="form-group">
                      <label>{t('Customer Name')}</label>
                      <input
                        type="text"
                        name="name"
                        value={inviteData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('Email')}</label>
                      <input
                        type="email"
                        name="email"
                        value={inviteData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>


                    <div className="form-group">
                      <label>{t('Company Name')}</label>
                      <input
                        type="text"
                        name="company"
                        value={inviteData.company}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('Phone Number')}</label>
                      <input
                        type="text"
                        name="mobile"
                        value={inviteData.mobile}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>{t('Region')}</label>
                      <select
                        name="region"
                        value={inviteData.region}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">{t('Select a region')}</option>
                        {regionOptions.map(option => (
                          <option key={option} value={option}>
                            {t(option)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>{t('Source')}</label>
                      <select
                        name="source"
                        value={inviteData.source}
                        onChange={handleInputChange}
                        disabled={true}
                        required
                      >
                        <option value="">{t('Select a source')}</option>
                        <option value="portal">{t('Portal')}</option>
                        <option value="crm">{t('CRM')}</option>
                        <option value="salesexecutive">{t('Sales Executive')}</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>{t('Comments')}</label>
                      <textarea
                        name="comments"
                        value={inviteData.comments}
                        onChange={handleInputChange}
                        placeholder={t(' Comments...')}
                        style={{ height: '50px', width: '205%' }}
                      />
                    </div>

                    {/* Add more fields as needed */}


                  </div>
                  <div className="modal-actions">
                    <button
                      className="cancel-button"
                      onClick={() => setIsInviteModalOpen(false)}
                    >
                      {t('Cancel')}
                    </button>
                    <button
                      className="invite-button"
                      onClick={handleInviteSubmit}
                    >
                      {t('Send Invite')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {renderContent()}
        </div>
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(total / pageSize)}
          // onPageChange={setPage}
          onPageChange={setPage}
        />
      </div>
    </Sidebar>
  );
}

export default Customers;
