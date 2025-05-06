import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
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
                            <td><input type="time" defaultValue="09:00" /> - <input type="time" defaultValue="18:00" /></td>
                            <td><input type="time" defaultValue="09:00" /> - <input type="time" defaultValue="18:00" /></td>
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

    const toggleRow = (orderId) => {
        setExpandedRows((prev) =>
            prev.includes(orderId)
                ? prev.filter((id) => id !== orderId)
                : [...prev, orderId]
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

    return (
        <div className="branches-content">
            <div className="form-main-header">
                <button className="form-main-header-link" onClick={() => handleHeaderClick()}>
                    {t('Customer Approval Checklist')}
                </button>
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
                                {isExpanded(order.id) && (
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
                <div className="pagination-controls large-screen">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>‹</button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => Math.abs(currentPage - page) <= 2 || page === 1 || page === totalPages)
                        .map((page, idx, arr) => (
                            <React.Fragment key={page}>
                                {idx > 0 && page - arr[idx - 1] > 1 && <span className="dots">…</span>}
                                <button
                                    onClick={() => setCurrentPage(page)}
                                    className={page === currentPage ? 'active' : ''}
                                >
                                    {page}
                                </button>
                            </React.Fragment>
                        ))}

                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>›</button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</button>

                    <span className="page-info">
                        {startIndex + 1}-{Math.min(endIndex, branches.length)} of {branches.length} items
                    </span>
                </div>
            </div>

        </div>
    );
}

export default Branches;
