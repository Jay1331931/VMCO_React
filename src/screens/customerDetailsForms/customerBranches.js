import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { faToggleOff, faToggleOn, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from 'react-i18next';
import Pagination from '../../components/Pagination';
import '../../styles/pagination.css';
import '../../styles/forms.css';



const branches = [
    { id: '0001', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0002', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0003', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0004', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Approved' },
    { id: '0005', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Rejected' },
    { id: '0006', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0007', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0008', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Approved' },
    { id: '0009', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Rejected' },
    { id: '0010', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0011', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0012', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Approved' },
];


const getStatusClass = (status) => {
    switch (status) {
        case 'Approved': return 'status-approved';
        case 'Rejected': return 'status-rejected';
        default: return 'status-pending';
    }
};

// ========== Form Components ==========
const BranchDetailsForm = ({ order }) => {
    const fields = [
        { label: 'Branch', value: order.branch, placeholder: 'Branch' },
        { label: 'City', value: 'Bengaluru', placeholder: 'City' },
        { label: 'Location Type', value: 'Metro', placeholder: 'Location Type' },
        { label: 'Geolocation', value: 'URL', placeholder: 'Geolocation' },
        { label: 'Region', value: 'Region', placeholder: 'Region' },
        { label: 'Pincode', value: order.deliveryDate, placeholder: 'Pincode' },
    ];

    return (
        <div className="form-section">
            <h3>Branch Details</h3>
            <div className="form-row">
                {fields.map((field, index) => (
                    <div className="form-group" key={index}>
                        <label>{field.label}</label>
                        <input value={field.value} placeholder={field.placeholder} />
                    </div>
                ))}
            </div>
        </div>
    );
};


const ContactRow = ({ label }) => (
    <div className="form-row">
        <div className='form-group'>
            <input placeholder={`${label} Name`} />
        </div>
        <div className='form-group'>
            <input placeholder="Designation" />
        </div>
        <div className='form-group'>
            <input placeholder="Email" />
        </div>
        <div className='form-group'>
            <input placeholder="Phone" />
        </div>
    </div>
);

const ContactSection = () => {
    const contactLabels = ['Primary Contact', 'Secondary Contact', 'Supervisor Contact'];

    return (
        <div className="form-section">
            <h3>Personal Details</h3>
            {contactLabels.map((label, index) => (
                <div className='form row'>
                    <div className='form-group'>
                        <label>{label}</label>
                        <ContactRow key={index} label={label} />
                    </div>
                </div>
            ))}
        </div>
    );
};


const OperatingHours = () => {
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const [isInputFocused, setIsInputFocused] = useState(false);
    return (
        <div className="form-section">
            <h3>Operating And Delivery Hours For Each Week Day (Mon To Sun)</h3>
            <table className="hours-table">
                <thead>
                    <tr>
                        <th>Day</th>
                        <th>Operating Hours (From - To)</th>
                        <th>Delivery Hours (From - To)</th>
                    </tr>
                </thead>
                <tbody>
                    {weekdays.map((day) => (
                        <tr key={day}>
                            <td>{day}</td>

                            <td><div className="input-with-icons">
                                <input type="time" defaultValue="09:00" onFocus={() => setIsInputFocused(true)}
                                    onBlur={() => setIsInputFocused(false)} /> - <input type="time" defaultValue="18:00" onFocus={() => setIsInputFocused(true)}
                                        onBlur={() => setIsInputFocused(false)} />{isInputFocused && (
                                            <>
                                                <button className="icon-button"><FontAwesomeIcon icon={faCheck} /></button>
                                                <button className="icon-button"><FontAwesomeIcon icon={faXmark} /></button>
                                            </>
                                        )}</div></td>
                            <td><div className="input-with-icons">
                                <input type="time" defaultValue="09:00" onFocus={() => setIsInputFocused(true)}
                                    onBlur={() => setIsInputFocused(false)} /> - <input type="time" defaultValue="18:00" onFocus={() => setIsInputFocused(true)}
                                        onBlur={() => setIsInputFocused(false)} />{isInputFocused && (
                                            <>
                                                <button className="icon-button"><FontAwesomeIcon icon={faCheck} /></button>
                                                <button className="icon-button"><FontAwesomeIcon icon={faXmark} /></button>
                                            </>
                                        )}</div></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
// ========== End Form Components ==========

function Branches() {
    const [expandedRows, setExpandedRows] = useState([]);
    const { t } = useTranslation();
    const actionMenuRef = useRef(null);
    const [isActionMenuOpen, setActionMenuOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(branches.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = branches.slice(startIndex, endIndex);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
     const [tabsHeight, setTabsHeight] = useState('auto');
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleRow = (orderId) => {
        setExpandedRows((prev) =>
            prev.includes(orderId) ? [] : [orderId]
        );
    };
    

    const isExpanded = (orderId) => expandedRows.includes(orderId);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
                setActionMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if(expandedRows.length > 0) {
            const contentHeight = 1200;
            setTabsHeight(`${contentHeight}px`);
        } else if(expandedRows.length === 0) {
            setTabsHeight('auto');
        }
    }, [isExpanded]);
    return (
        <div className="branches-content" style={{height: tabsHeight}}>
            <div className="form-main-header">
                <a href="#">{t('Customer Approval Checklist')}</a>
            </div>
            <div className="branches-page-header">
                <div className="branches-header-controls">
                    <input type="text" placeholder={t('Search...')} className="branches-search-input" />
                    <div className="branches-action-buttons">
                        <button className='branches-approve-button'>{t('Approve')}</button>
                        <button className='branches-reject-button'>{t('Reject')}</button>
                        <button className="branches-add-button">{t('+ Add')}</button>
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
                {currentItems.map((order) => (
                  <div key={order.id} className="branch-card">
                    <div className="branch-summary" onClick={() => toggleRow(order.id)}>
                      <div className="branch-id">{order.id}</div>
                      <div className="branch-id">{order.branch}</div>
                      <div className="branch-status">
                        <span className={`branches-status-badge ${getStatusClass(order.status)}`}>
                          {t(order.status)}
                        </span>
                      </div>
                      <button className="branches-toggle-row-btn">
                                                {isExpanded(order.id)
                                                    ? <FontAwesomeIcon icon={faChevronDown} />
                                                    : <FontAwesomeIcon icon={faChevronRight} />}
                                            </button>
                    </div>
                    {isExpanded(order.id) && (
                      <div className="branch-expanded">
                        <BranchDetailsForm order={order} />
                        <ContactSection />
                        <OperatingHours />
                      </div>
                    )}
                    
                  </div>
                  
                ))}
                {/* Pagination */}
                <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => setCurrentPage(page)}
                        startIndex={startIndex}
                        endIndex={Math.min(endIndex, branches.length)}
                        totalItems={branches.length}
                    />
              </div>
            ) : (
                // Keep your existing table layout for desktop here

                <div className="branches-table-container">
                    <table className="branches-data-table">
                        <thead>
                            <tr>
                                <th className="desktop-only">{t('Branch')}</th>
                                <th className="desktop-only">{t('City')}</th>
                                <th className="desktop-only">{t('Location Type')}</th>
                                <th className="desktop-only">{t('Geolocation')}</th>
                                <th className="desktop-only">{t('Region')}</th>
                                <th className="desktop-only">{t('Pincode')}</th>
                                <th>{t('Status')}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((order) => (
                                <React.Fragment key={order.id}>
                                    <tr onClick={() => toggleRow(order.id)} className={isExpanded(order.id) ? 'branches-expanded-row' : ''}>
                                        <td className="mobile-only mobile-primary" data-label="Branch ID">
                                            <div className="mobile-content">
                                                <span className="mobile-title">{order.id}</span>
                                                <span className="mobile-subtitle">{order.branch}</span>
                                            </div>
                                        </td>
                                        <td className="mobile-secondary">
                                            <span className={`branches-status-badge ${getStatusClass(order.status)}`}>
                                                {t(order.status)}
                                            </span>
                                        </td>
                                        {/* Hidden columns for desktop data */}
                                        <td className="desktop-only">{order.id}</td>
                                        <td className="desktop-only">{order.branch}</td>
                                        <td className="desktop-only">{order.customer}</td>
                                        <td className="desktop-only">{order.entity}</td>
                                        <td className="desktop-only">{order.paymentMethod}</td>
                                        <td className="desktop-only">{order.deliveryDate}</td>
                                        <td className='desktop-only'>
                                            <span className={`branches-status-badge ${getStatusClass(order.status)}`}>
                                                {t(order.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="branches-toggle-row-btn">
                                                {isExpanded(order.id)
                                                    ? <FontAwesomeIcon icon={faChevronDown} />
                                                    : <FontAwesomeIcon icon={faChevronRight} />}
                                            </button>
                                        </td>
                                    </tr>
                                    {!isMobile && isExpanded(order.id) && (
                                        <tr className="expanded-row">
                                            <td colSpan="8">
                                                <div className="expanded-form-container">
                                                    <BranchDetailsForm order={order} />
                                                    <ContactSection />
                                                    <OperatingHours />
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => setCurrentPage(page)}
                        startIndex={startIndex}
                        endIndex={Math.min(endIndex, branches.length)}
                        totalItems={branches.length}
                    />

                </div>
            )}

        </div>
    );
}

export default Branches;
