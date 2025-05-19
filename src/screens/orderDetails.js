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
import GetProducts from "../components/GetProducts";
import QuantityController from '../components/QuantityController';

const defaultOrder = {
  id: '',
  erpCustId: '',
  erpBranchId: '',
  orderBy: '',
  erp: '',
  entity: '',
  paymentMethod: '',
  totalAmount: '',
  paidAmount: '', // Use the correct field name
  deliveryCharges: '',
  expectedDeliveryDate: '',
  createdAt: '',
  updatedAt: '',
  status: '',
  driver: '',
  vehicleNumber: '',
  images: [],
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
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [backendProducts, setBackendProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  

  // Table columns
  const columns = [
    { key: 'id', header: 'Product ID' },
    { key: 'erpProdId', header: 'Product Name' },
    {
      key: 'quantityOrdered',
      header: 'Quantity',
      render: (row) =>
        addMode ? (
          <QuantityController
            itemId={row.id}
            quantity={row.quantityOrdered || 0}
            onQuantityChange={(itemId, delta) => {
              const idx = formData.products.findIndex(p => p.id === itemId);
              if (idx !== -1) {
                const newQty = Math.max(0, (parseInt(formData.products[idx].quantityOrdered) || 0) + delta);
                handleProductChange(idx, 'quantityOrdered', newQty);
              }
            }}
            onInputChange={(itemId, value) => {
              const idx = formData.products.findIndex(p => p.id === itemId);
              if (idx !== -1) {
                handleProductChange(idx, 'quantityOrdered', value);
              }
            }}
            stopPropagation={true}
          />
        ) : row.quantityOrdered
    },
    { key: 'unit', header: 'Unit' },
    { key: 'unitPrice', header: 'Unit Price (SAR)' },
    { key: 'netAmount', header: 'Net Amount (SAR)' },
    { key: 'salesTaxRate', header: 'Tax (SAR)' },
    // Only add the actions column in addMode, no render property
    ...(addMode ? [{ key: 'actions', header: 'Actions' }] : [])
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
      // Do not add an empty row by default
      setFormData(prev => ({
        ...prev,
        products: []
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

  // Delete product row handler
  const handleDeleteProductRow = (idx) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== idx)
    }));
  };

  // Download invoice
  const handleDownloadInvoice = (orderId) => {
    alert(`Downloading invoice for order ID: ${orderId}`);
    // Implement download logic here
  };

  // Save handler
  const handleSave = async (action = 'save') => {
    if (addMode) {
      // Save changes to products (sales_order_lines)
      try {
        setLoading(true);
        let allSuccess = true;
        let errorMsg = '';
        

        const productsPayload = formData.products.map(product => ({
          ...product,
          order_id: formData.id // assuming backend expects order_id
        }));

        console.log('Submitting products payload:', productsPayload); // <-- Add this line

        const response = await fetch(`${API_BASE_URL}/sales-order-lines`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productsPayload),
          credentials: 'include',
        });
        if (!response.ok) {
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || 'Failed to save product lines';
          } catch {}
          allSuccess = false;
        }
        if (allSuccess) {
          alert(t('Order products saved successfully!'));
          // Optionally, refresh order details or navigate
        } else {
          setError(errorMsg);
          alert(t(errorMsg));
        }
      } catch (err) {
        setError(err.message);
        alert(t(err.message));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Prepare payload for backend
    const payload = {
      ...formData,
      images: Array.isArray(images) ? images : [],
      products: formData.products.map(p => ({
        ...p,
        quantityOrdered: Number(p.quantityOrdered) || 0
      })),
      invoices: [],
      //status by default should be pending
      status: formData.status || 'Pending',
    };

    // Remove fields not needed by backend
    delete payload.id;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.status;

    console.log('Submitting order payload:', payload); // <-- Add this line

    try {
      setLoading(true);
      // 1. Create the order
      const response = await fetch(`${API_BASE_URL}/sales-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMsg = 'Failed to create order';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      const result = await response.json();
      if (result.status === 'Ok' && result.data && result.data.id) {
        // 2. Post products to sales_order_lines with the new order id
        const orderId = result.data.id;
        const productsPayload = formData.products.map(product => ({
          ...product,
          order_id: orderId
        }));
        const linesResponse = await fetch(`${API_BASE_URL}/sales-order-lines`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productsPayload),
          credentials: 'include',
        });
        if (!linesResponse.ok) {
          let errorMsg = 'Failed to save product lines';
          try {
            const errorData = await linesResponse.json();
            errorMsg = errorData.message || errorMsg;
          } catch {}
          throw new Error(errorMsg);
        }
        alert(t('Order and products created successfully!'));
        navigate('/orders');
      } else {
        throw new Error(result.message || 'Failed to create order');
      }
    } catch (err) {
      setError(err.message);
      alert(t(err.message));
    } finally {
      setLoading(false);
    }
  };

  // cancel/Approve/Reject handler
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

 
  // Add selected product to products table
  const handleSelectProduct = (product) => {
    setFormData(prev => ({
      ...prev,
      products: [
        ...prev.products,
        {
          id: product.id,
          erpProdId: product.product_name,
          quantityOrdered: '' || 1,
          unit: product.unit || '',
          unitPrice: product.unit_price || '',
          netAmount: product.net_amount || '',
          salesTaxRate: product.vat_percentage || '',
        }
      ]
    }));
    setShowProductPopup(false);
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
                  <input
                    name="erpCustId"
                    value={formData.erpCustId ?? ''}
                    onChange={handleInputChange}
                    disabled={!addMode}
                  />
                </div>
                <div className="order-details-field">
                  <label>{t('Branch')}</label>
                  <input name="erpBranchId" value={formData.erpBranchId ?? ''} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('Order By')}</label>
                  <input name="orderBy" value={formData.orderBy ?? ''} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('ERP#')}</label>
                  <input name="erp" value={formData.erp ?? ''} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('Entity')}</label>
                  <input name="entity" value={formData.entity ?? ''} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('Payment Method')}</label>
                  <input name="paymentMethod" value={formData.paymentMethod ?? ''} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('Total Amount')}</label>
                  <input name="totalAmount" value={formData.totalAmount ?? ''} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('Amount Paid')}</label>
                  <input name="paidAmount" value={formData.paidAmount ?? ''} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('Delivery Charges')}</label>
                  <input name="deliveryCharges" value={formData.deliveryCharges ?? ''} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('Delivery Date')}</label>
                  <input name="expectedDeliveryDate" value={formData.expectedDeliveryDate ?? ''} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('Created Date')}</label>
                  <input name="createdDate" value={formData.createdAt ?? ''} disabled />
                </div>
                <div className="order-details-field">
                  <label>{t('Updated Date')}</label>
                  <input name="updatedDate" value={formData.updatedAt ?? ''} disabled />
                </div>
                <div className="order-details-field">
                  <label>{t('Driver')}</label>
                  <input name="driver" value={formData.driver ?? ''} onChange={handleInputChange} disabled={!addMode} />
                </div>
                <div className="order-details-field">
                  <label>{t('Vehicle Number')}</label>
                  <input name="vehicleNumber" value={formData.vehicleNumber ?? ''} onChange={handleInputChange} disabled={!addMode} />
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
              {addMode && (
                <button
                  type="button"
                  className="order-action-btn approve"
                  onClick={() => setShowProductPopup(true)}
                  style={{ marginBottom: 8 }}
                >
                  Add products
                </button>
              )}
              {/* Hide table in add mode until products are selected */}
              {(!addMode || (formData.products && formData.products.length > 0)) && (
                <Table
                  columns={columns}
                  data={formData.products.filter(
                    p => p.id || p.erpProdId || p.quantityOrdered || p.unit || p.unitPrice || p.netAmount || p.salesTaxRate
                  )}
                  actionButtons={
                    addMode
                      ? (row) => (
                          <button
                            className="order-action-btn reject"
                            style={{ padding: '4px 10px', fontSize: 14 }}
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteProductRow(formData.products.indexOf(row));
                            }}
                            type="button"
                          >
                            {t('Delete')}
                          </button>
                        )
                      : undefined
                  }
                />
              )}
            </div>
          </div>
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
              <button className="order-action-btn" onClick={() => handleSubmit('cancel order')}>
                {t('Cancel Order')}
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
          </div>
        </div>
        <GetInventory open={showInventory} onClose={() => setShowInventory(false)} />
        <Remarks open={showRemarks} onClose={() => setShowRemarks(false)} />
        <CommentPopup isOpen={isCommentPanelOpen} setIsOpen={setIsCommentPanelOpen} />
        {/* Product Popup */}
        {showProductPopup && (
          <GetProducts
            open={showProductPopup}
            onClose={() => setShowProductPopup(false)}
            onSelectProduct={handleSelectProduct}
            API_BASE_URL={API_BASE_URL}
            token={localStorage.getItem('token')}
            t={t}
          />
        )}
      </div>
    </Sidebar>
  );
}

export default OrderDetails;