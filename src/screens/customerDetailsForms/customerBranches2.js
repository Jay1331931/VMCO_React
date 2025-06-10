
import maplibregl from 'maplibre-gl';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faChevronDown, faChevronRight, faLocationDot, faXmark } from '@fortawesome/free-solid-svg-icons';
import { faToggleOff, faToggleOn, faCheck } from '@fortawesome/free-solid-svg-icons';
// import Pagination from '../../components/Pagination';
import Pagination from '../../components/Pagination';
import ApprovalDialog from '../../components/ApprovalDialog';
import RbacManager from '../../utilities/rbac';
import '../../styles/components.css';
import '../../styles/forms.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
const CustomerBranches = ({ customer, setTabsHeight }) => {
    const { t } = useTranslation();
    const contentRef = useRef(null);
    const actionMenuRef = useRef(null);
    const [isActionMenuOpen, setActionMenuOpen] = useState(false);
    const [expandedRows, setExpandedRows] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [branches, setBranches] = useState([]);
    const [branchChanges, setBranchChanges] = useState({});
    const [transformedBranches, setTransformedBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [temporaryBranches, setTemporaryBranches] = useState([]);
    const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
    const [approvalAction, setApprovalAction] = useState(null);
    // let isApprovalMode = false;
    const [isApprovalMode, setIsApprovalMode] = useState(false);
    const [nextTempId, setNextTempId] = useState(-1);
    const isMobile = false;
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const { token, user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    let customerFormMode;
    if (customer?.isApprovalMode) {
        customerFormMode = 'custDetailsEdit';
    } else {
        customerFormMode = 'custDetailsAdd';
    }
    const handleAddBranch = () => {
        const tempId = nextTempId;
        setNextTempId(prev => prev - 1); // Decrement for next temporary ID
        setIsApprovalMode(false); // Reset approval mode when adding a new branch
        const newBranch = {
            id: tempId,
            erp_branch_id: `TEMP_${Math.abs(tempId)}`,
            branch_name_en: '',
            city: '',
            locationType: '',
            branch_status: 'pending',
            customerId: customer.id,
            isNew: true,
        };

        setTemporaryBranches(prev => [newBranch, ...prev]);
        setBranches(prev => [newBranch, ...prev]);
        setExpandedRows(prev => [tempId]);
    };
    const rbacMgr = new RbacManager(user?.userType == 'employee' && user?.roles[0] !== 'admin' ? user?.designation : user?.roles[0], customerFormMode);
    const isV = rbacMgr.isV.bind(rbacMgr);
    const isE = rbacMgr.isE.bind(rbacMgr);
    // Transform branch data with contacts
    const transformBranchData = (branches, branchContacts) => {
        const branchesArray = Array.isArray(branches) ? branches : [branches];
        const contactsArray = Array.isArray(branchContacts) ? branchContacts : (branchContacts ? [branchContacts] : []);

        return branchesArray.map(branch => {
            const branchContacts = contactsArray.filter(contact => contact.branchId === branch.id);
            const contactsMap = branchContacts.reduce((acc, contact) => {
                acc[contact.contactType] = contact;
                return acc;
            }, {});

            return {
                ...branch,
                primaryContactName: contactsMap.primary?.name || '',
                primaryContactDesignation: contactsMap.primary?.designation || '',
                primaryContactEmail: contactsMap.primary?.email || '',
                primaryContactMobile: contactsMap.primary?.mobile || '',
                secondaryContactName: contactsMap.secondary?.name || '',
                secondaryContactDesignation: contactsMap.secondary?.designation || '',
                secondaryContactEmail: contactsMap.secondary?.email || '',
                secondaryContactMobile: contactsMap.secondary?.mobile || '',
                supervisorContactName: contactsMap.supervisor?.name || '',
                supervisorContactDesignation: contactsMap.supervisor?.designation || '',
                supervisorContactEmail: contactsMap.supervisor?.email || '',
                supervisorContactMobile: contactsMap.supervisor?.mobile || '',
                allContacts: branchContacts
            };
        });
    };

    const checkApproval = async (branchId) => {
        console.log("Branch Id", branchId)
        console.log("check approval called")
        let isAppMode = false;

        try {
            const res = await fetch(`${API_BASE_URL}/workflow-instance/check/id/${branchId}/module/branch`, {
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
                console.log(isAppMode)
                return isAppMode;
                console.log("is approval mode", isAppMode)
                console.log(`Workflow check result for customer ${customer?.id}:`, isAppMode);
            } else {
                console.log(`Workflow check failed`, res.status);
            }
        } catch (err) {
            console.error('Error fetching workflow instance:', err);
        }
    }

    // Fetch contacts for a specific branch
    const fetchBranchContacts = async (branchId) => {
        setLoading(true);
        setError(null);
        const customerId = branches.find(branch => branch.id === branchId)?.customerId;

        try {
            const response = await fetch(`${API_BASE_URL}/customer-contacts/branch/${branchId}/customer/${customerId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            const result = await response.json();

            if (result.status === 'Ok') {
                const transformed = transformBranchData(
                    branches.filter(branch => branch.id === branchId),
                    result.data
                );

                if (transformed.length > 0) {
                    setTransformedBranches(transformed);
                    setBranches(prevBranches =>
                        prevBranches.map(branch =>
                            branch.id === branchId ? { ...branch, ...transformed[0] } : branch
                        )
                    );
                }
            } else {
                throw new Error(result.message || 'Failed to fetch contacts');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching contacts:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = useCallback(async () => {
        setLoading(true);
        setError(null);
        console.log(customer)
        const filters = {
            customer_id: customer.id,
            id: customer?.workflowData?.id,
        };

        const query = new URLSearchParams({
            page: currentPage,
            pageSize: 20,
            sortBy: "id",
            sortOrder: "asc",
            filters: JSON.stringify(filters)
        });

        try {
            const response = await fetch(`${API_BASE_URL}/customer-branches/pagination?${query.toString()}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch branches');
            }

            const data = await response.json();
            setBranches(data.data);
        } catch (err) {
            console.log(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [customer.id]);

    // Toggle row expansion and fetch contacts if expanding
    const toggleRow = async (branchId) => {
        if (!expandedRows.includes(branchId)) {
            await fetchBranchContacts(branchId);
        }
        setExpandedRows((prev) =>
            prev.includes(branchId) ? [] : [branchId]
        );
        // setIsApprovalMode(checkApproval(branchId));
        // isApprovalMode = await checkApproval(branchId);
        const isAppMode = await checkApproval(branchId);
        setIsApprovalMode(isAppMode);
    };

    // Get the current branch data (merged with transformed data if available)
    const getCurrentBranch = (branchId) => {
        const transformedBranch = transformedBranches.find(b => b.id === branchId);
        return transformedBranch || branches.find(b => b.id === branchId);
    };

    // Update tabs height when expanded rows change
    useEffect(() => {
        const baseRowHeight = 80;
        const collapsedExtraHeight = 40;
        const expandedExtraHeight = 1100;
        const numRows = branches.length;
        const rowHeightTotal = numRows * baseRowHeight;
        const contentHeight = rowHeightTotal + (expandedRows.length > 0 ? expandedExtraHeight : collapsedExtraHeight);
        setTabsHeight(`${contentHeight}px`);
    }, [expandedRows.length, branches.length]);

    // Fetch branches on mount
    useEffect(() => {
        if (customer?.id) {
            fetchBranches();
        }
    }, [customer?.id, fetchBranches]);

    // Pagination variables
    const itemsPerPage = 5;
    const totalPages = Math.ceil(branches.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    // const currentItems = branches.slice(startIndex, endIndex);
    const currentItems = [...branches].slice(startIndex, endIndex);
    const isExpanded = (branchId) => expandedRows.includes(branchId);

    const getStatusClass = (status) => {
        switch (status) {
            case 'approved': return 'status-approved';
            case 'pending': return 'status-pending';
            case 'rejected': return 'status-rejected';
            default: return 'status-default';
        }
    };

    const handleBranchFieldChange = (branchId, fieldName, value) => {
        setBranchChanges(prev => ({
            ...prev,
            [branchId]: {
                ...prev[branchId],
                [fieldName]: value
            }
        }));

        console.log('Branch changes:', branchChanges);
    };
    const isArabicText = (text) => {
        return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
    };
    const validateChangedFields = (branchData, checkRequired = false) => {
        const errors = {};
        const mandatoryFields = ['branchNameEn', 'branchNameLc', 'buildingName', 'street', 'city', 'locationType',
            'primaryContactName', 'primaryContactEmail', 'primaryContactDesignation', 'primaryContactMobile', 'secondaryContactName', 'secondaryContactEmail', 'secondaryContactDesignation', 'secondaryContactMobile'];
        Object.keys(branchData).forEach((fieldName) => {
            //   const field = formsByTab[activeTab].find(f => f.name === fieldName);
            const value = branchData[fieldName];

            //   if (checkRequired && field?.type === 'text' && field.required && !value) {
            //     errors[fieldName] = t('This field is required.');
            //   }
            if (checkRequired && mandatoryFields.includes(fieldName) && !value) {
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

        });

        // setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleApprovalSubmit = async (action) => {
        setApprovalAction(action);
        setIsApprovalDialogOpen(true);
    };

    const handleDialogSubmit = async (comment) => {
        //     const branchId = customer.workflowData.id;
        //    branchChanges[branchId]?.forEach((fieldName) => {
        //   if (fieldName in customer.workflowData.updates) {
        //     customer.workflowData.updates[fieldName] = branchChanges[branchId].fieldName;
        //   }
        // });
        //     const payload = {
        //       workflowData: customer.workflowData || {},
        //       approvedStatus: approvalAction === 'approve' ? "approved" : "rejected",
        //       comment: comment
        //     };
        const branchId = customer.workflowData.id;
        const branchUpdates = branchChanges[branchId];

        // Check if branchUpdates exists and is iterable
        if (branchUpdates && typeof branchUpdates === 'object') {
            Object.keys(branchUpdates).forEach((fieldName) => {
                if (fieldName in customer.workflowData.updates) {
                    customer.workflowData.updates[fieldName] = branchUpdates[fieldName];
                }
            });
        }

        const payload = {
            workflowData: customer.workflowData || {},
            approvedStatus: approvalAction === 'approve' ? "approved" : "rejected",
            comment: comment
        };
        try {
            const response = await fetch(`${API_BASE_URL}/workflow-instance/id/${customer.workflowInstanceId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include',
            });

            if (response.ok) {
                const result = await response.json();
                navigate('/customers');
            } else {
                throw new Error('Failed to submit approval');
            }
        } catch (error) {
            console.log('Error', error.message)
            console.error(`Error ${approvalAction}ing customer:`, error);
            alert(`Error ${approvalAction}ing customer: ${error.message}`);
        }
    };

    const handleSave = async (id, branch, action) => {
        const isNewBranch = id < 0; // Negative IDs are temporary
        const branchData = branchChanges[id] || {};
        console.log('Branch data to save:', branchData);
        if (action === 'save') {
            if (!validateChangedFields(branchData, false)) {
                alert(t('Please correct errors before saving.'));
                return;
            }
        }
        if (action === 'save changes') {
            if (!validateChangedFields(branchData, true)) {
                alert(t('Please fill all required fields before saving changes.'));
                return;
            }
        }

        const branchPayload = {};
        const contactPayload = {};
        if (action === 'block') {
            branchPayload['branchStatus'] = 'blocked';
            branchPayload['isBlocked'] = true;

        }
        if (action === 'unblock') {
          branchPayload['branchStatus'] = 'approved';
          branchPayload['isBlocked'] = false;
        }

        // Define contact detail fields
        const contactDetailFields = [
            'primaryContactName', 'primaryContactDesignation', 'primaryContactEmail', 'primaryContactMobile',
            'secondaryContactName', 'secondaryContactDesignation', 'secondaryContactEmail', 'secondaryContactMobile',
            'supervisorContactName', 'supervisorContactDesignation', 'supervisorContactEmail', 'supervisorContactMobile'
        ];

        // Prepare payloads
        
if(action === 'save' || action === 'save changes') {
        Object.keys(branchData).forEach((fieldName) => {
            if (contactDetailFields.includes(fieldName)) {
                contactPayload[fieldName] = branchData[fieldName];
            } else {
                branchPayload[fieldName] = branchData[fieldName];
                // branchPayload['branchStatus'] = branchData['branchStatus'];
                // add branchStatus to branchPayload by default
                branchPayload['branchStatus'] = branch['branchStatus'];
                // branchPayload['customerId'] = customer.id;

            }
        });
    }
        try {
            if (isNewBranch) {
                // CREATE new branch
                contactDetailFields.forEach((fieldName) => {
            if (!Object.keys(branchData).includes(fieldName)) {
                contactPayload[fieldName] = '';
            }
        });
                const response = await fetch(`${API_BASE_URL}/customer-branches`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...branchPayload,
                        customer_id: customer.id,
                         isDeliveryChargesApplicable: customer.isDeliveryChargesApplicable
                    }),
                    credentials: 'include'
                });

                const result = await response.json();
                
                if (response.ok) {
                    // Update local state with real ID from server
                    setBranches(prev =>
                        prev.map(branch =>
                            branch.id === id ? { ...branch, ...result.data, id: result.data.id, isNew: false } : branch
                        )
                    );
                    setTemporaryBranches(prev => prev.filter(b => b.id !== id));
                    console.log(contactPayload)
                    // If there are contacts to save
                    if (Object.keys(contactPayload).length > 0) {
                        await fetch(`${API_BASE_URL}/customer-contacts/create/customer/${customer.id}/branch/${result.data.id}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...contactPayload, customer_id: customer.id, branch_id: result.data.id }),
                            credentials: 'include'
                        });
                    }
                }
            } else {
                // UPDATE existing branch
                console.log('branchPayload:', branchPayload);
                if (Object.keys(branchPayload).length > 0) {
                    await fetch(`${API_BASE_URL}/customer-branches/id/${id}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...branchPayload, customerId: customer.id }),
                        credentials: 'include'
                    });
                }
                console.log('Contact payload:', contactPayload);
                if (Object.keys(contactPayload).length > 0) {
                    await fetch(`${API_BASE_URL}/customer-contacts/customer/${customer.id}/branch/${id}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(contactPayload),
                        credentials: 'include'
                    });
                }
            }

            // Clear changes for this branch
            // setBranchChanges(prev => {
            //     const newChanges = { ...prev };
            //     delete newChanges[id];
            //     return newChanges;
            // });

            // Refresh data
            // await fetchBranches();

        } catch (error) {
            console.error('Error saving branch:', error);
        }
    };

    const handleSubmit = async (id, branchData) => {
        handleSave(id, branchChanges?.[id]);
        if (!validateChangedFields(branchData, true)) {
            alert(t('Please fill all required fields before submitting.'));
            return;
        }


        console.log('Submitting branch data:', branchData);
        console.log('Branch Changes:', branchChanges);
        // Branch Payload
        const branchPayload = {};
        const contactPayload = {};
        const contactDetailFields = [
            'primaryContactName', 'primaryContactDesignation', 'primaryContactEmail', 'primaryContactMobile',
            'secondaryContactName', 'secondaryContactDesignation', 'secondaryContactEmail', 'secondaryContactMobile',
            'supervisorContactName', 'supervisorContactDesignation', 'supervisorContactEmail', 'supervisorContactMobile'
        ];
        Object.keys(branchData).forEach((fieldName) => {
            if (contactDetailFields.includes(fieldName)) {
                contactPayload[fieldName] = branchData[fieldName];
            } else {
                if (fieldName === 'allContacts' || fieldName === 'updatedAt') {

                } else {
                    branchPayload[fieldName] = branchData[fieldName];
                }
            }
        });
        try {
            const response = await fetch(`${API_BASE_URL}/customer-branches/id/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...branchPayload,
                    branchStatus: 'pending'
                }),
                credentials: 'include'
            });

            const result = await response.json();
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
            console.error('Error saving branch:', error);
        }
    };


    return (
        <div className="branches-content" ref={contentRef}>

            <div className="form-main-header">
                <a href="#">{t('Customer Approval Checklist')}</a>
            </div>
            <div className="branches-page-header">

                <div className="branches-header-controls">
                    <input type="text" placeholder={t('Search...')} className="branches-search-input" />
                    <div className="branches-action-buttons">
                        {(isV('btnBranchAdd')) && <button className="branches-add-button" onClick={handleAddBranch}>{t('+ Add')}</button>}
                        <div className="action-menu-container" ref={actionMenuRef}>
                            <FontAwesomeIcon icon={faEllipsisV} className="action-menu-icon" onClick={() => setActionMenuOpen(!isActionMenuOpen)} />
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
            </div>
            {isMobile ? (
                <div className="branches-list">
                    {currentItems.map((branch) => (
                        <div key={branch.id} className="branch-card">
                            <div className="branch-summary" onClick={() => toggleRow(branch.id)}>
                                <div className="branch-id">{branch.erp_branch_id || branch.id}</div>
                                <div className="branch-name">{branch.branch_name_en}</div>
                                <div className="branch-status">
                                    <span className={`branches-status-badge ${getStatusClass(branch.branch_status)}`}>
                                        {t(branch.branch_status)}
                                    </span>
                                </div>
                                <button className="branches-toggle-row-btn">
                                    {isExpanded(branch.id)
                                        ? <FontAwesomeIcon icon={faChevronDown} />
                                        : <FontAwesomeIcon icon={faChevronRight} />}
                                </button>
                            </div>
                            {isExpanded(branch.id) && (
                                <div className="branch-expanded">
                                    <BranchDetailsForm
                                        branch={branch}
                                        branchChanges={branchChanges}
                                        handleBranchFieldChange={handleBranchFieldChange}
                                    />
                                    <ContactSection
                                        branch={branch}
                                        branchChanges={branchChanges}
                                        handleBranchFieldChange={handleBranchFieldChange}
                                    />
                                    <OperatingHours
                                        hoursData={branch.hours}
                                        branchId={branch.id}
                                        handleBranchFieldChange={handleBranchFieldChange}
                                    />

                                    <div className='customer-onboarding-form-actions'>
                                        <div className="action-buttons">
                                            {(!isApprovalMode) && <button className="save" onClick={() => handleSave(branch.id)} >
                                                {t('Save')}
                                            </button>}
                                            <button className="block" >
                                                {t('Block')}
                                            </button>



                                        </div>
                                    </div>


                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="branches-table-container">
                    <table className="branches-data-table">
                        <thead>
                            <tr>
                                <th className="desktop-only">{t('Branch ID')}</th>
                                <th className="desktop-only">{t('Branch Name')}</th>
                                <th className="desktop-only">{t('City')}</th>
                                <th className="desktop-only">{t('Location Type')}</th>
                                <th>{t('Status')}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((branch) => (
                                <React.Fragment key={branch.id}>
                                    <tr onClick={() => toggleRow(branch.id)} className={isExpanded(branch.id) ? 'branches-expanded-row' : ''}>
                                        <td className="mobile-only mobile-primary" data-label="Branch">
                                            <div className="mobile-content">
                                                <span className="mobile-title">{branch.erp_branch_id || branch.id}</span>
                                                <span className="mobile-subtitle">{branch.branch_name_en}</span>
                                            </div>
                                        </td>
                                        <td className="mobile-secondary">
                                            <span className={`branches-status-badge ${getStatusClass(branch.branch_status)}`}>
                                                {t(branch.branch_status)}
                                            </span>
                                        </td>
                                        <td className="desktop-only">{branch.erp_branch_id || branch.id}</td>
                                        <td className="desktop-only">{branch.branchNameEn}</td>
                                        <td className="desktop-only">{branch.city}</td>
                                        <td className="desktop-only">{branch.locationType}</td>
                                        <td className='desktop-only'>
                                            <span className={`branches-status-badge ${getStatusClass(branch.branch_status)}`}>
                                                {t(branch.branchStatus)}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="branches-toggle-row-btn">
                                                {isExpanded(branch.id)
                                                    ? <FontAwesomeIcon icon={faChevronDown} />
                                                    : <FontAwesomeIcon icon={faChevronRight} />}
                                            </button>
                                        </td>
                                    </tr>
                                    {!isMobile && isExpanded(branch.id) && (
                                        <tr className="expanded-row">
                                            <td colSpan="6">
                                                <div className="expanded-form-container">
                                                    {(isApprovalMode && customerFormMode === 'custDetailsAdd') && <h3>{t('Branch is currently under approval')}</h3>}
                                                    <BranchDetailsForm
                                                        branch={branch}
                                                        customer={customer}
                                                        branchChanges={branchChanges}
                                                        handleBranchFieldChange={handleBranchFieldChange}
                                                        isUnderApproval={checkApproval(branch.id)}
                                                    />
                                                    <ContactSection
                                                        branch={branch}
                                                        customer={customer}
                                                        branchChanges={branchChanges}
                                                        handleBranchFieldChange={handleBranchFieldChange}
                                                    />
                                                    <OperatingHours
                                                        hoursData={branch.hours}
                                                        customer={customer}
                                                        branchId={branch.id}
                                                        handleBranchFieldChange={handleBranchFieldChange}
                                                    />
                                                    {console.log(branch)}
                                                    <div className='expanded-form-container-footer'>
                                                        <div className='customer-onboarding-form-actions'>
                                                            <div className="action-buttons">
                                                                {isV('btnBranchSave') && (branch?.branchStatus === 'new' || branch.isNew) && <button className="save" onClick={() => handleSave(branch.id, branch, 'save')}>
                                                                    {t('Save')}
                                                                </button>}
                                                                {isV('btnBranchSubmit') && (branch?.branchStatus === 'new' || branch.isNew) && <button className="save" onClick={() => handleSubmit(branch.id, branch)} disabled={branch.id < 0}>
                                                                    {t('Submit')}
                                                                </button>}
                                                                {isV('btnBranchSaveChanges') && (branch?.branchStatus !== 'new' && branch?.branchStatus !== 'pending') && (!branch?.isNew) && <button className="save changes" onClick={() => handleSave(branch.id, branch, 'save changes')} disabled={isApprovalMode || branch?.branchStatus === 'blocked'}>
                                                                    {t('Save Changes')}
                                                                </button>}
                                                                {isV('btnBranchBlock') && (branch?.branchStatus !== 'new' && branch?.branchStatus !== 'pending' && branch?.branchStatus !== 'blocked') && (!branch?.isNew) && <button className="block" disabled={isApprovalMode} onClick={() => handleSave(branch.id, branch, 'block')}>
                                                                    {t('Block')}
                                                                </button>}
                                                                {isV('btnBranchUnblock') && (branch?.branchStatus !== 'new' && branch?.branchStatus !== 'pending' && branch?.branchStatus === 'blocked') && (!branch?.isNew) && <button className="block" disabled={isApprovalMode} onClick={() => handleSave(branch.id, branch, 'unblock')}>
                                                                    {t('Unblock')}
                                                                </button>}
                                                                <div className="branches-action-buttons">
                                                                    {isV('btnBranchApprove') && <button className='branches-approve-button' onClick={() => handleApprovalSubmit('approve')}>{t('Approve')}</button>}
                                                                    {isV('btnBranchReject') && <button className='branches-reject-button' onClick={() => handleApprovalSubmit('reject')}>{t('Reject')}</button>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <ApprovalDialog
                                                        isOpen={isApprovalDialogOpen}
                                                        onClose={() => setIsApprovalDialogOpen(false)}
                                                        action={approvalAction}
                                                        onSubmit={handleDialogSubmit}
                                                        customerName={customer.customerName || 'this customer'}
                                                        title={approvalAction === 'approve' ? t('Approve Branch') : t('Reject Branch')}
                                                        subtitle={approvalAction === 'approve' ? t('Are you sure you want to approve this branch?') : t('Are you sure you want to reject this branch?')}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => {
                                setExpandedRows([]);
                                setCurrentPage(page);
                            }}
                            startIndex={startIndex}
                            endIndex={Math.min(endIndex, branches.length)}
                            totalItems={branches.length}
                        />
                    </div>

                
            )}

            
        </div>
    );
};
const BranchDetailsForm = ({ branch, customer, branchChanges, handleBranchFieldChange, isUnderApproval }) => {
    const { t } = useTranslation();
    const [showMap, setShowMap] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    // LocationPicker component
    const { token, user, isAuthenticated, logout } = useAuth();
    let customerFormMode;
    if (customer?.isApprovalMode) {
        customerFormMode = 'custDetailsEdit';
    } else {
        customerFormMode = 'custDetailsAdd';
    }
    const rbacMgr = new RbacManager(user?.userType == 'employee' && user?.roles[0] !== 'admin' ? user?.designation : user?.roles[0], customerFormMode);
    const isV = rbacMgr.isV.bind(rbacMgr);
    const isE = rbacMgr.isE.bind(rbacMgr);
    const [dropdownOptions, setDropdownOptions] = useState({});

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
    useEffect(() => {
        const fetchDropdownOptions = async () => {
            const options = {};
            console.log('branch', branch)
            // Find all dropdown fields and fetch their options
            const dropdownFields = ['city', 'locationType']
            console.log('dropdownFields', dropdownFields)
            for (const field of dropdownFields) {
                try {
                    const data = await getOptionsFromBasicsMaster(field);
                    // options[field.name] = data;
                    options[field] = data.map(opt =>
                        typeof opt === 'string'
                            ? opt.charAt(0).toUpperCase() + opt.slice(1).toLowerCase()
                            : opt // Fallback if not a string
                    );
                } catch (err) {
                    console.error(`Failed to fetch options for ${field}:`, err);
                    options[field] = []; // Fallback to empty array
                }
            }

            setDropdownOptions(options);
            console.log('dropdown options', dropdownOptions)
        };

        fetchDropdownOptions();
    }, [branch]);
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
        console.log('Initial Lat:', initialLat);
        console.log('Initial Lng:', initialLng);
        useEffect(() => {
            let mapInstance;

            const initializeMap = async () => {
                mapInstance = new maplibregl.Map({
                    container: mapContainer.current,
                    style: 'https://api.maptiler.com/maps/streets/style.json?key=NxvpwMoXuYLINUijkWEc',
                    center: initialLat && initialLng ? [initialLat, initialLng] : defaultCenter,
                    zoom: zoom
                });

                mapInstance.on('load', async () => {
                    setMap(mapInstance);
                    try {
                        const position = initialLat && initialLng ? { coords: { latitude: initialLat, longitude: initialLng } } : await getCurrentPosition();
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
    // Get current values from branchChanges or fall back to branch data
    // const getFieldValue = (fieldName) => {
    //     // return branchChanges?.[branch.id]?.[fieldName] ?? branch[fieldName] ?? '';
    //     return branchChanges?.[branch.id]?.[fieldName] ? branchChanges[branch.id][fieldName] : branch[fieldName];
    // };
    const getFieldValue = (fieldName) => {
        if (fieldName === 'isDeliveryChargesApplicable') {
            if (branchChanges?.[branch.id]?.hasOwnProperty(fieldName)) {
                return branchChanges[branch.id][fieldName];
            } else {
                return branch?.[fieldName];
            }
        }
        if (branchChanges?.[branch.id]?.hasOwnProperty(fieldName)) {
            return branchChanges[branch.id][fieldName];
        }
        return branch[fieldName] ?? '';
    };

    // Handle checkbox changes
    const [sameAsCustomer, setSameAsCustomer] = useState(
        getFieldValue('sameAsCustomer') || false
    );
    const [approvalRequired, setApprovalRequired] = useState(
        getFieldValue('approvalRequiredForOrdering') || false
    );

    // Use useCallback to memoize the handler
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        console.log('Input changed:', name, value);
        handleBranchFieldChange(branch.id, name, value);
    }, [branch.id, handleBranchFieldChange]);

    const handleCheckboxChange = useCallback((e) => {
        const { name, checked } = e.target;
        if (name === 'sameAsCustomer') {
            setSameAsCustomer(checked);
        } else if (name === 'approvalRequiredForOrdering') {
            setApprovalRequired(checked);
        }
        handleBranchFieldChange(branch.id, name, checked);
    }, [branch.id, handleBranchFieldChange]);

    const handleLocationSelect = useCallback((lat, lng) => {
        setSelectedLocation({ lat, lng });
        setShowMap(false);
        // Store as object for display but convert to string for backend
        handleBranchFieldChange(branch.id, 'geolocation', { x: lat, y: lng });
    }, [branch.id, handleBranchFieldChange]);

    const getLocationDisplay = (location) => {
        if (!location) return 'Select Location';

        if (typeof location === 'object' && location.x !== undefined && location.y !== undefined) {
            const x = parseFloat(location.x);
            const y = parseFloat(location.y);

            if (!isNaN(x) && !isNaN(y)) {
                return `${x.toFixed(6)}, ${y.toFixed(6)}`;
            }
        }

        return 'Select Location';
    };

    const fields = useMemo(() => [
        { type: 'text', label: 'Branch', name: 'branchNameEn', placeholder: 'Branch', required: true },
        { type: 'text', label: 'Branch (Arabic)', name: 'branchNameLc', placeholder: 'Branch (Arabic)', required: true },
        { type: 'text', label: 'Building Name', name: 'buildingName', placeholder: 'Building Name', required: true },
        { type: 'text', label: 'Street', name: 'street', placeholder: 'Street', required: true },
        { type: 'dropdown', label: 'City', name: 'city', placeholder: 'City', required: true, options: ['Jeddah', 'Riyadh', 'Dammam'] },
        { type: 'dropdown', label: 'Location Type', name: 'locationType', placeholder: 'Location Type', required: true, options: ['Office', 'Warehouse', 'Showroom'] },
        {
            label: 'Geolocation',
            name: 'geolocation',
            placeholder: 'Geolocation',
            isLocation: true,
            required: true
        }
    ], []);
    console.log('customer', customer);
const hasCheckboxUpdate = customer.isApprovalMode && customer.module === 'branch' &&
                        customer?.workflowData?.updates &&
                        'isDeliveryChargesApplicable' in customer.workflowData.updates;
    return (
        <div className="form-section">
            {console.log(isUnderApproval)}
            {/* {(isUnderApproval) && <h2>{t('Branch is currently under Approval')}</h2>} */}
            <h3>{t('Branch Details')}</h3>

            <div className="form-group">

                {/* <label>
                    <input
                        type="checkbox"
                        name="sameAsCustomer"
                        checked={sameAsCustomer}
                        onChange={handleCheckboxChange}
                    />
                    {'\t' + t('Same as Customer Details')}
                </label> */}

                {isV('isDeliveryChargesApplicable') && (<div className="form-group">
                    <label>
                        <input
                            type="checkbox"
                            name="isDeliveryChargesApplicable"
                            checked={getFieldValue('isDeliveryChargesApplicable') || false}
                            onChange={handleCheckboxChange}
                            disabled={customerFormMode === 'custDetailsEdit' && !hasCheckboxUpdate}
                        // hidden={!isV('isDeliveryChargesApplicable')}
                        />
                        {'\t' + t('Is Delivery Charges Applicable')}
                        {hasCheckboxUpdate && <span className="update-badge"> Pending Update</span>}
                    </label>
                </div>)}
            </div>

            <div className="form-row">
                {fields.map((field, index) => {

                    const hasUpdate = customer.isApprovalMode && customer.module === 'branch' &&
                        customer?.workflowData?.updates &&
                        field.name in customer.workflowData.updates;
                    const currentValue = branch?.[field.name] || '';
                    const value = hasUpdate ? customer?.workflowData?.updates[field.name] : getFieldValue(field.name);
                    console.log('Branch field value:', branch[field.name], typeof branch[field.name]);

                    return (
                        <div className={`form-group ${hasUpdate ? 'pending-update' : ''}`} key={index}>
                            
                            
                            <label>
                                {t(field.label)}
                                {field.required && <span className="required-field">*</span>}
                            </label>

                            {field.isLocation ? (
                                <div className="location-input-container">
                                    <input
                                          value={
                                            value
                                              ? `${value.x.toFixed(6)}, ${value.y.toFixed(6)}`
                                              : 'Select Location'
                                          }
                                        // value={getLocationDisplay(branch[field.name])}
                                        placeholder={t(field.placeholder)}
                                        disabled={customerFormMode === 'custDetailsEdit' && !hasUpdate}
                                        readOnly
                                    />

                                    <button
                                        className="location-picker-button"
                                        //   disabled={!isE(field.name, transformedCustomer?.isApprovalMode, hasUpdate && customer?.workflowData?.updates
                                        //     ? field.name in customer.workflowData.updates
                                        //     : false)}
                                        disabled={customerFormMode === 'custDetailsEdit' && !hasUpdate}
                                        onClick={() => setShowMap(true)}
                                    >
                                        <FontAwesomeIcon icon={faLocationDot} />
                                    </button>
                                </div>
                            ) : (
                                <div className='form-row'>
                                    {(() => {

                                        switch (field.type) {

                                            case 'text':
                                                return (
                                                    <input
                                                        type="text"
                                                        name={field.name}
                                                        value={value}
                                                        placeholder={t(field.placeholder)}
                                                        onChange={handleInputChange}
                                                        style={hasUpdate ? {
                                                            backgroundColor: '#fff8e1',
                                                        } : {}}
                                                        disabled={customerFormMode==='custDetailsEdit' && !hasUpdate}
                                                    />

                                                );
                                            case 'dropdown':
                                                return (
                                                    <select
                                                        name={field.name}
                                                        value={value}
                                                        onChange={handleInputChange}
                                                        disabled={customerFormMode==='custDetailsEdit' && !hasUpdate}
                                                    >
                                                        <option value="">{t(field.placeholder)}</option>
                                                        {
                                                            dropdownOptions[field.name] ? dropdownOptions[field.name].map((opt, idx) => (
                                                                <option key={idx} value={opt}>
                                                                    {t(opt)}
                                                                </option>
                                                            )
                                                            ) : []
                                                        }
                                                    </select>
                                                );
                                            default:
                                                return null;
                                        }

                                    })()}

                                </div>
                            )}
                            {hasUpdate && (
                                <div className="current-value">
                                    Current:{' '}
                                    {field.isLocation
                                        ? getLocationDisplay(currentValue)
                                        : currentValue || '(empty)'}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

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
                        <LocationPicker onLocationSelect={handleLocationSelect} initialLat={getFieldValue('geolocation')?.x}
                            initialLng={getFieldValue('geolocation')?.y} />
                    </div>
                </div>
            )}
        </div>
    );
};
const ContactRow = ({ label, isRequired, onChange }) => {
    const { t } = useTranslation();
    return (
        <div className="form-row">
            <div className='form-group'>
                <label></label>
                <input
                    placeholder={t(`${label} Name`)}
                    required={isRequired}
                    onChange={onChange}
                />
            </div>
            <div className='form-group'>
                <label></label>
                <input
                    placeholder={t("Designation")}
                    required={isRequired}
                    onChange={onChange}
                />
            </div>
            <div className='form-group'>
                <label></label>
                <input
                    placeholder={t("Email")}
                    required={isRequired}
                    onChange={onChange}
                />
            </div>
            <div className='form-group'>
                <label></label>
                <input
                    placeholder={t("Phone")}
                    required={isRequired}
                    onChange={onChange}
                />
            </div>
        </div>
    );
};

const ContactSection = ({ branch, customer, branchChanges, handleBranchFieldChange }) => {
    const { t } = useTranslation();
let customerFormMode;
    if (customer?.isApprovalMode) {
        customerFormMode = 'custDetailsEdit';
    } else {
        customerFormMode = 'custDetailsAdd';
    }
    // Get current values from branchChanges or fall back to branch data
    // const getFieldValue = (fieldName) => {
    //     return branchChanges?.[branch.id]?.[fieldName] ?? branch[fieldName] ?? '';
    // };
    const getFieldValue = (fieldName) => {
        if (branchChanges?.[branch.id]?.hasOwnProperty(fieldName)) {
            return branchChanges[branch.id][fieldName];
        }
        return branch[fieldName] ?? '';
    }

    // Contact types we want to display
    const contactTypes = [
        {
            type: 'primary',
            label: 'Primary Contact',
            isRequired: true,
            fields: [
                { name: 'Name', field: 'primaryContactName' },
                { name: 'Designation', field: 'primaryContactDesignation' },
                { name: 'Email', field: 'primaryContactEmail' },
                { name: 'Phone', field: 'primaryContactMobile' }
            ]
        },
        {
            type: 'secondary',
            label: 'Secondary Contact',
            isRequired: true,
            fields: [
                { name: 'Name', field: 'secondaryContactName' },
                { name: 'Designation', field: 'secondaryContactDesignation' },
                { name: 'Email', field: 'secondaryContactEmail' },
                { name: 'Phone', field: 'secondaryContactMobile' }
            ]
        },
        {
            type: 'supervisor',
            label: 'Supervisor Contact',
            isRequired: false,
            fields: [
                { name: 'Name', field: 'supervisorContactName' },
                { name: 'Designation', field: 'supervisorContactDesignation' },
                { name: 'Email', field: 'supervisorContactEmail' },
                { name: 'Phone', field: 'supervisorContactMobile' }
            ]
        }
    ];

    const handleContactChange = (fieldName, value) => {
        handleBranchFieldChange(branch.id, fieldName, value);
    };

    return (
        <div className="form-section">
            <h3>{t('Personal Details')}</h3>
            {contactTypes.map(({ type, label, isRequired, fields }, index) => (
                <div className='form row' key={index}>
                    <div className='form-group'>
                        <label>
                            {t(label)}
                            {isRequired && <span className="required-field">*</span>}
                        </label>
                        <div className="form-row">
                            {fields.map(({ name, field }) => (
                                <div className='form-group' key={field}>
                                    <input
                                        placeholder={t(name)}
                                        value={getFieldValue(field)}
                                        required={isRequired}
                                        onChange={(e) => handleContactChange(field, e.target.value)}
                                        disabled={customerFormMode === 'custDetailsEdit'}
                                    />
                                </div>
                            ))}

                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

};
const parseTimeRange = (timeRange) => {
    if (typeof timeRange === 'object') return timeRange;
    const [from, to] = timeRange.split('-');
    return { from, to };
};
const OperatingHours = ({ hoursData, customer, branchId, handleBranchFieldChange }) => {
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const { t } = useTranslation();
let customerFormMode;
    if (customer?.isApprovalMode) {
        customerFormMode = 'custDetailsEdit';
    } else {
        customerFormMode = 'custDetailsAdd';
    }
    // Helper function to parse time range strings
    const parseTimeRange = (timeRange) => {
        if (!timeRange) return { from: '09:00', to: '18:00' };
        const [from, to] = timeRange.split('-');
        return { from: from || '09:00', to: to || '18:00' };
    };

    // Helper function to stringify hours for storage
    const stringifyHours = (hoursData) => {
        const result = {
            operatingHours: {},
            deliveryHours: {}
        };

        weekdays.forEach(day => {
            result.operatingHours[day] =
                `${hoursData[day].operating.from}-${hoursData[day].operating.to}`;
            result.deliveryHours[day] =
                `${hoursData[day].delivery.from}-${hoursData[day].delivery.to}`;
        });

        return JSON.stringify(result);
    };

    // Initialize state with parsed hours or defaults
    const [hours, setHours] = useState(() => {
        const defaultHours = weekdays.reduce((acc, day) => ({
            ...acc,
            [day]: {
                operating: { from: '09:00', to: '18:00' },
                delivery: { from: '09:00', to: '18:00' }
            }
        }), {});

        if (!hoursData) return defaultHours;

        try {
            const parsedData = typeof hoursData === 'string' ? JSON.parse(hoursData) : hoursData;
            return weekdays.reduce((acc, day) => ({
                ...acc,
                [day]: {
                    operating: parseTimeRange(parsedData.operatingHours?.[day]),
                    delivery: parseTimeRange(parsedData.deliveryHours?.[day])
                }
            }), {});
        } catch (e) {
            console.error('Error parsing hours data:', e);
            return defaultHours;
        }
    });

    const [modifiedDays, setModifiedDays] = useState({});
    const [activeField, setActiveField] = useState(null);
    const [originalValues, setOriginalValues] = useState({});

    const handleHoursChange = (day, type, field, value) => {
        const updatedHours = {
            ...hours,
            [day]: {
                ...hours[day],
                [type]: {
                    ...hours[day][type],
                    [field]: value
                }
            }
        };

        setHours(updatedHours);
        setModifiedDays(prev => ({ ...prev, [day]: true }));
        handleBranchFieldChange(branchId, 'hours', stringifyHours(updatedHours));
    };

    const applyAllHours = (sourceDay, type) => {
        const timeToApply = hours[sourceDay][type];
        const updatedHours = {
            ...hours,
            ...weekdays.reduce((acc, day) => ({
                ...acc,
                [day]: {
                    ...hours[day],
                    [type]: timeToApply
                }
            }), {})
        };

        setHours(updatedHours);
        setModifiedDays({});
        handleBranchFieldChange(branchId, 'hours', stringifyHours(updatedHours));
    };

    const handleCancel = () => {
        if (activeField) {
            const [day, type, field] = activeField.split('-');
            const originalValue = originalValues[activeField];

            const updatedHours = {
                ...hours,
                [day]: {
                    ...hours[day],
                    [type]: {
                        ...hours[day][type],
                        [field]: originalValue
                    }
                }
            };

            setHours(updatedHours);
            setActiveField(null);
            handleBranchFieldChange(branchId, 'hours', stringifyHours(updatedHours));
        }
    };

    const formatDayName = (day) => day.charAt(0).toUpperCase() + day.slice(1);

    return (
        <div className="form-section">
            <h3>
                {t('Operating And Delivery Hours')}
                <span className="required-field">*</span>
            </h3>
            <table className="hours-table">
                <thead>
                    <tr>
                        <th>{t('Day')}</th>
                        <th>{t('Operating Hours')}</th>
                        <th>{t('Delivery Hours')}</th>
                    </tr>
                </thead>
                <tbody>
                    {weekdays.map((day) => (
                        <tr key={day} className={day === 'friday' ? 'friday-row' : ''}>
                            <td>{t(formatDayName(day))}</td>

                            {/* Operating Hours */}
                            <td>
                                <TimeInputGroup
                                    day={day}
                                    type="operating"
                                    time={hours[day].operating}
                                    isActive={activeField}
                                    isModified={modifiedDays[day]}
                                    onChange={handleHoursChange}
                                    onFocus={(field, value) => {
                                        setActiveField(`${day}-operating-${field}`);
                                        setOriginalValues(prev => ({
                                            ...prev,
                                            [`${day}-operating-${field}`]: value
                                        }));
                                    }}
                                    onApplyAll={() => applyAllHours(day, 'operating')}
                                    customerFormMode={customerFormMode}
                                />
                            </td>

                            {/* Delivery Hours */}
                            <td>
                                <TimeInputGroup
                                    day={day}
                                    type="delivery"
                                    time={hours[day].delivery}
                                    isActive={activeField}
                                    isModified={modifiedDays[day]}
                                    onChange={handleHoursChange}
                                    onFocus={(field, value) => {
                                        setActiveField(`${day}-delivery-${field}`);
                                        setOriginalValues(prev => ({
                                            ...prev,
                                            [`${day}-delivery-${field}`]: value
                                        }));
                                    }}
                                    onApplyAll={() => applyAllHours(day, 'delivery')}
                                    customerFormMode={customerFormMode}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
const TimeInputGroup = ({ day, type, time, isActive, isModified, onChange, onFocus, onApplyAll, customerFormMode }) => {
    return (
        <div className={`time-input-group ${day === 'friday' ? 'friday-time-input-group' : ''}`}>
            <input
                type="time"
                value={time.from}
                onChange={(e) => onChange(day, type, 'from', e.target.value)}
                onFocus={() => onFocus('from', time.from)}
                onBlur={() => { }}
                 disabled={customerFormMode === 'custDetailsEdit'}
            />
            <span>-</span>
            <input
                type="time"
                value={time.to}
                onChange={(e) => onChange(day, type, 'to', e.target.value)}
                onFocus={() => onFocus('to', time.to)}
                onBlur={() => { }}
                disabled={customerFormMode === 'custDetailsEdit'}
            />

            {(isActive === `${day}-${type}-from` || isActive === `${day}-${type}-to`) && (
                <div className="time-action-buttons">
                    <button className="time-confirm-button" /*onClick={onConfirm}*/>
                        <FontAwesomeIcon icon={faCheck} />
                    </button>
                    <button className="time-cancel-button" /*onClick={onCancel}*/>
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
            )}

            {isModified && (
                <button
                    className="apply-row-button"
                    onClick={onApplyAll}
                    title="Apply to all days"
                >
                    Apply All
                </button>
            )}
        </div>
    );
};
export default CustomerBranches;