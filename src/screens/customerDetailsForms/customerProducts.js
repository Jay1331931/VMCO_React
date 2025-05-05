import React, { useState, useRef, useEffect } from 'react';
import Template from '../template';
import '../../styles/components.css';
import '../../styles/forms.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faToggleOff, faToggleOn, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
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

  return (
      <div className="orders-content">
        <div className="page-header">
          <div className="header-controls">
            <input type="text" placeholder={t('Search...')} className="product-search-input" />
            <div className="toggle-container">
              <label>{t('All')}</label>
              <FontAwesomeIcon
                icon={isApprovalMode ? faToggleOn : faToggleOff}
                className="product-toggle-icon"
                onClick={toggleApprovalMode}
                aria-label={isApprovalMode ? t('Switch to All Orders') : t('Switch to My Approvals')}
              />
              <label>{t('Selected')}</label>
            </div>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">{t('Order #')}</th>
                <th scope="col">{t('Customer')}</th>
                <th scope="col">{t('Branch')}</th>
                <th scope="col">{t('Entity')}</th>
                <th scope="col">{t('Payment Method')}</th>
                <th scope="col">{t('Delivery Date')}</th>
                <th scope="col">{t('Total Amount')}</th>
                <th scope="col">{t('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{order.branch}</td>
                  <td>{order.entity}</td>
                  <td>{order.paymentMethod}</td>
                  <td>{order.deliveryDate}</td>
                  <td>{order.totalAmount}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {t(order.status)}
                    </span>
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