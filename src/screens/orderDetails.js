import React, { useState } from 'react';
import GetInventory from '../components/GetInventory';
import Remarks from '../components/Remarks';
import Sidebar from '../components/Sidebar';
import Table from '../components/Table';
import CommentPopup from '../components/commentPanel';
import '../i18n';
import { useTranslation } from 'react-i18next'; // Keep only one

import '../styles/components.css';
import { useLocation } from 'react-router-dom';

const orderProducts = [
    { id: '0001', name: 'Name 01', quantity: 20, unit: 'KG', unitPrice: 12, netAmount: 240, tax: 24 },
    { id: '0002', name: 'Name 02', quantity: 20, unit: 'KG', unitPrice: 20, netAmount: 400, tax: 40 },
    { id: '0003', name: 'Name 03', quantity: 20, unit: 'KG', unitPrice: 20, netAmount: 400, tax: 40 }
];

function OrderDetails() {
    const { t } = useTranslation();
    const location = useLocation();
    const [showInventory, setShowInventory] = useState(false);
    const [showRemarks, setShowRemarks] = useState(false);
      const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);

    // Get order details from navigation state or fallback to defaults
    const order = location.state?.order || {
        id: '0000',
        customer: 'Company Name',
        branch: 'Branch 1',
        orderBy: 'Branch Contact',
        erp: '0x0x0x0',
        entity: 'Diayfa',
        paymentMethod: 'Advance, Credit',
        totalAmount: 1144,
        amountPaid: 0,
        deliveryCost: 40,
        deliveryDate: 'May 10, 2025',
        createdDate: 'May 04, 2025',
        updatedDate: 'NA',
        status: 'Pending'
    };

    const columns = [
        { key: 'id', header: 'Product #' },
        { key: 'name', header: 'Product Name' },
        { key: 'quantity', header: 'Quantity' },
        { key: 'unit', header: 'Unit' },
        { key: 'unitPrice', header: 'Unit Price (SAR)' },
        { key: 'netAmount', header: 'Net Amount (SAR)' },
        { key: 'tax', header: 'Tax (SAR)' }
    ];

    return (
        <Sidebar title={`Order # ${order.id}${isCommentPanelOpen ? 'collapsed' : ''}`}>
            <div className="order-details-container">
                <h2 className="order-details-title">{`Order # ${order.id}`}</h2>
                <div className="order-details-section">
                    <h3 className="order-details-subtitle">{t('Order Details')}</h3>
                    <div className="order-details-grid">
                        <div className="order-details-field">
                            <label>{t('Customer Company Name')}</label>
                            <input value={order.customer} disabled />
                        </div>
                        <div className="order-details-field">
                            <label>{t('Branch')}</label>
                            <select value={order.branch} disabled>
                                <option value="Branch 1">Branch 1</option>
                                <option value="Branch 2">Branch 2</option>
                                <option value="Branch 3">Branch 3</option>
                                <option value="Branch 4">Branch 4</option>
                            </select>
                        </div>
                        <div className="order-details-field">
                            <label>{t('Order By')}</label>
                            <input value={order.orderBy} disabled />
                        </div>
                        <div className="order-details-field">
                            <label>{t('ERP#')}</label>
                            <input value={order.erp} disabled />
                        </div>
                        <div className="order-details-field">
                            <label>{t('Entity')}</label>
                            <select value={order.entity} disabled>
                                <option value="VMCO">VMCO</option>
                                <option value="Diyafa">Diyafa</option>
                                <option value="Green Mast">Green Mast</option>
                                <option value="Naqui">Naqui</option>
                            </select>
                        </div>
                        <div className="order-details-field">
                            <label>{t('Payment Method')}</label>
                            <select value={order.paymentMethod} disabled>
                                <option value="Credit">Credit</option>
                                <option value="Advanced Payment">Advanced Payment</option>
                                <option value="Cash on Delivery">Cash on Delivery</option>
                                <option value="Prepayment">Prepayment</option>
                            </select>
                        </div>
                        <div className="order-details-field">
                            <label>{t('Total Amount')}</label>
                            <input value={order.totalAmount} disabled />
                        </div>
                        <div className="order-details-field">
                            <label>{t('Amount Paid')}</label>
                            <input value={order.amountPaid} disabled />
                        </div>
                        <div className="order-details-field">
                            <label>{t('Delivery Cost')}</label>
                            <input value={order.deliveryCost} disabled />
                        </div>
                        <div className="order-details-field">
                            <label>{t('Delivery Date')}</label>
                            <input value={order.deliveryDate} disabled />
                        </div>
                        <div className="order-details-field">
                            <label>{t('Created Date')}</label>
                            <input value={order.createdDate} disabled />
                        </div>
                        <div className="order-details-field">
                            <label>{t('Updated Date')}</label>
                            <input value={order.updatedDate} disabled />
                        </div>
                    </div>
                </div>
                <div className="order-products-section">
                    <h3 className="order-details-subtitle">{t('Products')}</h3>
                    <Table columns={columns} data={orderProducts} />
                </div>
            </div>
            <div className="order-details-footer">
                <div className="order-status">
                    <span>{t('Order Status:')}</span>
                    <span className={`order-status-badge status-${order.status.toLowerCase()}`}>{t(order.status)}</span>
                </div>
                <div className="order-details-actions">
                    <button className="order-action-btn">{t('Download Invoice')}</button>
                    <button className="order-action-btn" onClick={() => setShowInventory(true)}>
                        {t('Get Inventory')}
                    </button>
                    <button className="order-action-btn approve" onClick={() => setShowRemarks(true)}>
                        {t('Approve')}
                    </button>
                    <button className="order-action-btn reject">{t('Reject')}</button>
                </div>
            </div>
            <GetInventory open={showInventory} onClose={() => setShowInventory(false)} />
            <Remarks open={showRemarks} onClose={() => setShowRemarks(false)} />
            <CommentPopup isOpen={isCommentPanelOpen} setIsOpen={setIsCommentPanelOpen} />
                
        </Sidebar>
    );
}

export default OrderDetails;