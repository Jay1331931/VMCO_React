import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Table from '../components/Table';
import CommentPopup from '../components/commentPanel';
import GetInventory from '../components/GetInventory';
import Remarks from '../components/Remarks';
import '../i18n';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import '../styles/components.css';

const defaultOrder = {
  erpOrderId: '',
  erpCustId: '',
  erpBranchId: '',
  orderBy: '',
  erp: '',
  entity: '',
  paymentMethod: '',
  totalAmount: '',
  amountPaid: '',
  deliveryCost: '',
  deliveryDate: '',
  createdDate: '',
  updatedDate: '',
  status: '',
  products: []
};

function OrderDetails() {
  const { t } = useTranslation();
  const location = useLocation();
  const orderFromNav = location.state?.order || {};
  const [formData, setFormData] = useState(defaultOrder);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showRemarks, setShowRemarks] = useState(false);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);

  // Table columns
  const columns = [
    { key: 'id', header: 'Product #' },
    { key: 'name', header: 'Product Name' },
    { key: 'quantity', header: 'Quantity' },
    { key: 'unit', header: 'Unit' },
    { key: 'unitPrice', header: 'Unit Price (SAR)' },
    { key: 'netAmount', header: 'Net Amount (SAR)' },
    { key: 'tax', header: 'Tax (SAR)' }
  ];

  // Fetch order details from backend
  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use erpOrderId from navigation state or fallback
        const id = orderFromNav.id || orderFromNav.id;
        if (!id) {
          setError('Order ID not found.');
          setLoading(false);
          return;
        }
        const response = await fetch(`http://localhost:3000/api/sales-order/id/${id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch order details');
        const result = await response.json();
        if (result.status === 'Ok' && result.data) {
          setFormData({
            ...result.data,
            products: result.data.products || []
          });
        } else {
          throw new Error(result.message || 'Order not found');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
    // eslint-disable-next-line
  }, [orderFromNav.erpOrderId, orderFromNav.id]);

  // Download invoice
  const handleDownloadInvoice = (orderId) => {
    alert(`Downloading invoice for order ID: ${orderId}`);
    // Implement download logic here
  };

  // Save handler
  const handleSave = (action = 'save') => {
    alert(`${t(action.charAt(0).toUpperCase() + action.slice(1))} action triggered.`);
    // Add your save logic here
  };

  // Block/Approve/Reject handler
  const handleSubmit = (action) => {
    alert(`${t(action.charAt(0).toUpperCase() + action.slice(1))} action triggered.`);
    // Add your logic here
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>{t('Loading...')}</div>;
  if (error) return <div className="error">{t(error)}</div>;

  return (
    <Sidebar>
      <div className="order-details-container">
        <div className={`order-details-content ${isCommentPanelOpen ? 'collapsed' : ''}`}>
          <div className="order-details-body">
            <h2 className="order-details-title">{`${t('Order #')} ${formData.erpOrderId}`}</h2>
            <div className="order-details-section">
              <div className="order-details-grid">
                <div className="order-details-field">
                  <label>{t('Customer Company Name')}</label>
                  <input name="erpCustId" value={formData.erpCustId} disabled />
                </div>
                <div className="order-details-field">
                  <label>{t('Branch')}</label>
                  <input name="erpBranchId" value={formData.erpBranchId} disabled />
                </div>
                <div className="order-details-field">
                  <label>{t('Order By')}</label>
                  <input name="orderBy" value={formData.orderBy} disabled />
                </div>
                <div className="order-details-field">
                  <label>{t('ERP#')}</label>
                  <input name="erp" value={formData.erpCustId} disabled />
                </div>
                <div className="order-details-field">
                  <label>{t('Entity')}</label>
                  <input name="entity" value={formData.entity} disabled />
                </div>
                <div className="order-details-field">
                  <label>{t('Payment Method')}</label>
                  <input name="paymentMethod" value={formData.paymentMethod} disabled />
                </div>
                <div className="order-details-field">
                  <label>{t('Total Amount')}</label>
                  <input name="totalAmount" value={formData.totalAmount} disabled />
                </div>
                <div className="order-details-field">
                  <label>{t('Amount Paid')}</label>
                  <input name="amountPaid" value={formData.paidAmount} disabled />
                </div>
                <div className="order-details-field">
                  <label>{t('Delivery Cost')}</label>
                  <input name="deliveryCost" value={formData.deliveryCost} disabled />
                </div>
                <div className="order-details-field">
                  <label>{t('Delivery Date')}</label>
                  <input
    name="deliveryDate"
    value={
      formData.expectedDeliveryDate ? new Date(formData.expectedDeliveryDate).toLocaleDateString() : ''}    disabled
  />
                </div>
                <div className="order-details-field">
                  <label>{t('Created Date')}</label>
                  <input name="createdDate" value={formData.createdAt} disabled />
                </div>
                <div className="order-details-field">
                  <label>{t('Updated Date')}</label>
                  <input name="updatedDate" value={formData.updatedAt} disabled />
                </div>
              </div>
            </div>
            <div className="order-products-section">
              <h3 className="order-details-subtitle">{t('Products')}</h3>
              <Table columns={columns} data={formData.products} />
            </div>
          </div>
          {/* Action Buttons */}
          <div className="order-details-footer">
            <div className="order-status">
              <span className="status-label">{t('Status')}:</span>
              <span className={`order-status-badge status-${formData.status?.toLowerCase() || 'pending'}`}>
                {t(formData.status) || t('Pending')}
              </span>
            </div>
            
              <button className="order-action-btn" onClick={() => handleSave('save')}>
                {t('Save Changes')}
              </button>
              <button className="order-action-btn" onClick={() => handleSubmit('block')}>
                {t('Block')}
              </button>
              
              <button className="order-action-btn" onClick={() => handleDownloadInvoice(formData.erpOrderId)}>
                {t('Download Invoice')}
              </button>
              <button className="order-action-btn" onClick={() => setShowInventory(true)}>
                {t('Get Inventory')}
              </button>
              <div className="order-details-actions">
              <button className="order-action-btn approve" onClick={() => handleSubmit('approve')}>
                {t('Approve')}
              </button>
              <button className="order-action-btn reject" onClick={() => handleSubmit('reject')}>
                {t('Reject')}
              </button>
            </div>
          </div>
        </div>
        <GetInventory open={showInventory} onClose={() => setShowInventory(false)} />
        <Remarks open={showRemarks} onClose={() => setShowRemarks(false)} />
        <CommentPopup isOpen={isCommentPanelOpen} setIsOpen={setIsCommentPanelOpen} />
      </div>
    </Sidebar>
  );
}

export default OrderDetails;