import React, { useState, useRef, useEffect } from 'react';
import '../../styles/components.css';
import '../../styles/forms.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faToggleOff, faToggleOn, faEllipsisV, faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const orders = [
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
        case 'Approved':
            return 'status-approved';
        case 'Rejected':
            return 'status-rejected';
        default:
            return 'status-pending';
    }
};

function Orders() {
    const [isApprovalMode, setApprovalMode] = useState(false);
    const [isActionMenuOpen, setActionMenuOpen] = useState(false);
    const actionMenuRef = useRef(null);
    const { t } = useTranslation();

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

    const toggleApprovalMode = () => {
        setApprovalMode(!isApprovalMode);
    };

    const toggleActionMenu = () => {
        setActionMenuOpen(!isActionMenuOpen);
    };

    const handleSubmit = (action) => {
        // Handle the submit action based on the action type (save, block, approve, reject)
        console.log(`Action: ${action}`);
    }
    const [expandedRows, setExpandedRows] = useState([]);
    const toggleRow = (orderId) => {
        setExpandedRows((prev) =>
            prev.includes(orderId)
                ? prev.filter((id) => id !== orderId)
                : [...prev, orderId]
        );
    };

    const isExpanded = (orderId) => expandedRows.includes(orderId);

    return (
        <div className="branches-content">
            <div className="form-main-header">
                <a href="#">{t('Customer Approval Checklist')}</a>
            </div>
                <div className='branches-page-header '>
                    <div className='branches-header-controls'>
                        <input type="text" placeholder={t('Search...')} className="branches-search-input" />
                        <button className='branches-approve-button'>{t('Approve')}</button>
                        <button className='branches-reject-button'>{t('Reject')}</button>
                        <button className="add-button">{t('+ Add')}</button>
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
            
            <div className="branches-table-container">
                <table className="branches-data-table">
                    <thead>
                        <tr>
                            <th scope="col">{t('Branch')}</th>
                            <th scope="col">{t('City')}</th>
                            <th scope="col">{t('Location Type')}</th>
                            <th scope="col">{t('Geolocation')}</th>
                            <th scope="col">{t('Region')}</th>
                            <th scope="col">{t('Pincode')}</th>
                            <th scope="col">{t('Status')}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) =>
                        (<tr
                            key={order.id}
                            className={isExpanded(order.id) ? 'branches-expanded-row' : ''}
                          >
                                <td>{order.id}</td>
                                <td>{order.customer}</td>
                                <td>{order.branch}</td>
                                <td>{order.entity}</td>
                                <td>{order.paymentMethod}</td>
                                <td>{order.deliveryDate}</td>
                                <td>
                                    <span className={`branches-status-badge ${getStatusClass(order.status)}`}>
                                        {t(order.status)}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className="branches-toggle-row-btn"
                                        onClick={() => toggleRow(order.id)}
                                        aria-label="Toggle Row"
                                    >
                                        {isExpanded(order.id) ? <FontAwesomeIcon icon={faChevronDown} /> : <FontAwesomeIcon icon={faChevronRight} />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Orders;