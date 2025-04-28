import React, { useState, useRef, useEffect } from 'react';
import Template from './template';
import '../styles/components.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faToggleOff, faToggleOn, faEllipsisV } from '@fortawesome/free-solid-svg-icons';

const orders = [
  { id: '0001', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
  { id: '0002', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
  { id: '0003', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
  { id: '0004', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Approved' },
  { id: '0005', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Rejected' },
  { id: '0006', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
  { id: '0007', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
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
    <Template>
      <div className="page-content">
        <div className="page-header">
          <div className="header-controls">
            <input type="text" placeholder="Search..." className="search-input" />
            <div className="toggle-container">
              <label>All</label>
              <FontAwesomeIcon
                icon={isApprovalMode ? faToggleOn : faToggleOff}
                className="toggle-icon"
                onClick={toggleApprovalMode}
                aria-label={isApprovalMode ? "Switch to All Orders" : "Switch to My Approvals"}
              />
              <label>My Approval</label>
            </div>
          </div>
          <div className="header-actions">
            <button className="add-button">+ Add</button>
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
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Order #</th>
                <th scope="col">Customer</th>
                <th scope="col">Branch</th>
                <th scope="col">Entity</th>
                <th scope="col">Payment Method</th>
                <th scope="col">Delivery Date</th>
                <th scope="col">Total Amount</th>
                <th scope="col">Status</th>
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
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Template>
  );
}

export default Orders;