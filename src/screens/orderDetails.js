import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Table from '../components/Table';
import Dropdown from '../components/DropDown';
import CommentPopup from '../components/commentPanel';
import GetInventory from '../components/GetInventory';
import Remarks from '../components/Remarks';
import '../i18n';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/components.css';

const defaultOrder = {
  id: '',
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
  driver: '',
  vehicleNumber: '',
  images: '',
  products: []
};

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Example product options (replace with your actual product list)
const productOptions = [
  { id: 'P001', name: 'Product A' },
  { id: 'P002', name: 'Product B' },
  { id: 'P003', name: 'Product C' }
];

// Example quantity options
const quantityOptions = [1, 2, 3, 4, 5];

function OrderDetails() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const orderFromNav = location.state?.order || {};
  const addMode = location.state?.addMode || false;
  const [formData, setFormData] = useState({
    ...defaultOrder,
    ...orderFromNav,
    id: orderFromNav.id || ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showRemarks, setShowRemarks] = useState(false);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);

  // Table columns
  const columns = [
    { key: 'id', header: 'Product #' },
    { key: 'erpProdId', header: 'Product Name' },
    { key: 'quantityOrdered', header: 'Quantity' },
    { key: 'unit', header: 'Unit' },
    { key: 'unitPrice', header: 'Unit Price (SAR)' },
    { key: 'netAmount', header: 'Net Amount (SAR)' },
    { key: 'salesTaxRate', header: 'Tax (SAR)' }
  ];

  // Fetch order details from backend
  useEffect(() => {
    if (addMode) {
      setLoading(false);
      return;
    }
    const fetchOrderDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const id = orderFromNav.id || orderFromNav.id;
        if (!id) {
          setError('Order ID not found.');
          setLoading(false);
          return;
        }
        const response = await fetch(`${API_BASE_URL}/sales-order/id/${id}`, {
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
  }, [orderFromNav.id, addMode]);

  // Fetch order product details
  useEffect(() => {
    if (addMode) return;
    const fetchOrderProducts = async () => {
      if (!orderFromNav.id) return;
      try {
        const params = new URLSearchParams({
          page: 1,
          pageSize: 100,
          search: '',
          sortBy: 'id',
          sortOrder: 'asc',
          filters: JSON.stringify({ order_id: orderFromNav.id })
        });

        const url = `${API_BASE_URL}/sales-order-lines/pagination?${params.toString()}`;
        console.log('Fetching order products:', url);
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('API did not return JSON. Check API URL and server.');
        }

        const result = await response.json();
        if (result.status === 'Ok' && result.data && Array.isArray(result.data.data)) {
          setFormData(prev => ({
            ...prev,
            products: result.data.data
          }));
        } else {
          throw new Error(result.message || 'Failed to fetch order products');
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchOrderProducts();
    // eslint-disable-next-line
  }, [orderFromNav.id, addMode]);

  // Add a default product row in add mode
  useEffect(() => {
    if (addMode && formData.products.length === 0) {
      setFormData(prev => ({
        ...prev,
        products: [{
          id: '',
          erpProdId: '',
          quantityOrdered: '',
          unit: '',
          unitPrice: '',
          netAmount: '',
          salesTaxRate: ''
        }]
      }));
    }
    // eslint-disable-next-line
  }, [addMode]);

  // Handle product row changes
  const handleProductChange = (idx, field, value) => {
    setFormData(prev => {
      const updatedProducts = [...prev.products];
      updatedProducts[idx][field] = value;
      return { ...prev, products: updatedProducts };
    });
  };

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

  // State for image popup
  const [popupImage, setPopupImage] = useState(null);

  // Images state (allow dynamic add)
  const [images, setImages] = useState(
    Array.isArray(defaultOrder.images) && defaultOrder.images.length > 0
      ? defaultOrder.images.filter(Boolean)
      : []
  );

  // File input ref
  const fileInputRef = useRef(null);

  // Handle image add
  const handleAddImage = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages((prev) => [...prev, ev.target.result]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Open file dialog
  const openFileDialog = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Handler for input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>{t('Loading...')}</div>;
  if (error) return <div className="error">{t(error)}</div>;

  return (
    <Sidebar>
      <div className="order-details-container">
        <div className={`order-details-content ${isCommentPanelOpen ? 'collapsed' : ''}`}>
          <div className="order-details-body">
            <h2 className="order-details-title">{`${t('Order #')} ${formData.id}`}</h2>
            <div className="order-details-section">
              <div className="order-details-grid">
                <div className="order-details-field">
                  <label>{t('Customer Company Name')}</label>
                  <input name="erpCustId" value={formData.erpCustId} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('Branch')}</label>
                  <input name="erpBranchId" value={formData.erpBranchId} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('Order By')}</label>
                  <input name="orderBy" value={formData.orderBy} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('ERP#')}</label>
                  <input name="erp" value={formData.erpCustId} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('Entity')}</label>
                  <input name="entity" value={formData.entity} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('Payment Method')}</label>
                  <input name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('Total Amount')}</label>
                  <input name="totalAmount" value={formData.totalAmount} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('Amount Paid')}</label>
                  <input name="amountPaid" value={formData.paidAmount} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('Delivery Cost')}</label>
                  <input name="deliveryCost" value={formData.deliveryCost} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('Delivery Date')}</label>
                  <input
                    name="deliveryDate"
                    value={
                      addMode
                        ? formData.deliveryDate
                        : formData.expectedDeliveryDate
                        ? new Date(formData.expectedDeliveryDate).toLocaleDateString()
                        : ''
                    }
                    onChange={handleInputChange}
                    disabled={!addMode}
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
                <div className="order-details-field">
                  <label>{t('Driver')}</label>
                  <input name="driverName" value={formData.driverName} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('Vehicle Number')}</label>
                  <input name="vehicleNumber" value={formData.vehicleNumber} onChange={handleInputChange} disabled={!addMode} />
                </div>
              </div>
              <label>{t('Delivery images')}</label>
              <div className="maintenance-images-list">
                <button
                  type="button"
                  className="maintenance-add-image-btn"
                  onClick={openFileDialog}
                  title="Add Image"
                >
                  +
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleAddImage}
                />
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="maintenance-image-placeholder"
                    style={img ? { backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                    onClick={() => img && setPopupImage(img)}
                    title={img ? 'Click to view' : ''}
                  />
                ))}
              </div>
            </div>
            <div className="order-products-section">
              <h3 className="order-details-subtitle">{t('Products')}</h3>
              <Table
                columns={columns}
                data={formData.products}
                renderCell={(row, col, rowIndex) => {
                  // Show dropdowns for all rows in add mode
                  if (addMode) {
                    if (col.key === 'erpProdId') {
                      return (
                        <select
                          value={row.erpProdId}
                          onChange={e => handleProductChange(rowIndex, 'erpProdId', e.target.value)}
                          className="product-name-dropdown"
                        >
                          <option value="">Select Product</option>
                          {productOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                          ))}
                        </select>
                      );
                    }
                    if (col.key === 'quantityOrdered') {
                      return (
                        <select
                          value={row.quantityOrdered}
                          onChange={e => handleProductChange(rowIndex, 'quantityOrdered', e.target.value)}
                          className="quantity-dropdown"
                        >
                          <option value="">Select Quantity</option>
                          {quantityOptions.map(q => (
                            <option key={q} value={q}>{q}</option>
                          ))}
                        </select>
                      );
                    }
                  }
                  // Default rendering
                  return row[col.key];
                }}
              />
            </div>
          </div>
          <div className="order-details-footer">
            <div className="order-status">
              <span className="status-label">{t('Status')}:</span>
              <span className={`order-status-badge status-${formData.status?.toLowerCase() || 'pending'}`}>
                {t(formData.status) || t('Pending')}
              </span>
            </div>
            
              <>
                <button className="order-action-btn" onClick={() => handleSave('save')}>
                  {t('Save Changes')}
                </button>
                <button className="order-action-btn" onClick={() => handleSubmit('block')}>
                  {t('Block')}
                </button>
                <button className="order-action-btn" onClick={() => handleDownloadInvoice(formData.id)}>
                  {t('Download Invoice')}
                </button>
                <button className="order-action-btn" onClick={() => setShowInventory(true)}>
                  {t('Get Inventory')}
                </button>
                <div className="order-details-actions">
                  <button className="order-action-btn approve" onClick={() => handleSubmit('approve')} disabled={formData.status === 'approved'}>
                    {t('Approve')}
                  </button>
                  <button className="order-action-btn reject" onClick={() => handleSubmit('reject')} disabled={formData.status === 'approved'}>
                    {t('Reject')}
                  </button>
                </div>
              </>
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