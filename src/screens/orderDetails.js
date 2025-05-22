import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Table from '../components/Table';
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
    {
      key: 'productName',
      header: 'Product Name',
      render: (row) =>  row.erpProdId
    },
    {
      key: 'quantityOrdered',
      header: 'Quantity',
      render: (row) =>
        addMode ? (
          <QuantityController
            itemId={row.id || row.product_id}
            quantity={row.quantityOrdered || 0}
            onQuantityChange={(itemId, delta) => {
              const idx = formData.products.findIndex(p => 
                (p.id === itemId || p.product_id === itemId)
              );
              if (idx !== -1) {
                const newQty = Math.max(0, (parseInt(formData.products[idx].quantityOrdered) || 0) + delta);
                handleProductChange(idx, 'quantityOrdered', newQty);
              }
            }}
            onInputChange={(itemId, value) => {
              const idx = formData.products.findIndex(p => 
                (p.id === itemId || p.product_id === itemId)
              );
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
          // Map the product data to ensure we use productName instead of erpProdId
          const processedProducts = result.data.data.map(product => ({
            ...product,
            id: product.productId,
            productName: product.productName || product.product_name || product.erp_prod_id, 
          }));

          setFormData(prev => ({
            ...prev,
            products: processedProducts
          }));
          console.log('Processed order products:', processedProducts);
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
      // Validation - check if essential fields are filled
      if (!formData.erpCustId || !formData.erpBranchId) {
        alert(t('Customer and Branch are required fields.'));
        return;
      }

      // Prepare payload for backend
      const payload = {
        erpCustId: formData.erpCustId,
        erpBranchId: formData.erpBranchId,
        orderBy: formData.orderBy || '',
        erp: formData.erp || '',
        entity: formData.entity || '',
        paymentMethod: formData.paymentMethod || '',
        totalAmount: formData.totalAmount || '0',
        paidAmount: formData.paidAmount || '0',
        deliveryCharges: formData.deliveryCharges || '0',
        expectedDeliveryDate: formData.expectedDeliveryDate || new Date().toISOString().split('T')[0],
        driver: formData.driver || '',
        vehicleNumber: formData.vehicleNumber || '',
        status: 'Pending', // Explicitly set status to Pending for new orders
      };

      try {
        setLoading(true);
        console.log('Submitting order payload:', payload);

        // Step 1: Create the order first
        const response = await fetch(`${API_BASE_URL}/sales-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server response:', errorText);
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || 'Failed to create order');
          } catch (e) {
            throw new Error(`Failed to create order: ${response.status} ${response.statusText}`);
          }
        }

        // Parse the response as JSON to get the inserted row's id
        const result = await response.json();
        console.log('Order creation result:', result);

        if (!result.data || !result.data.id) {
          throw new Error('Order ID not returned from API');
        }



        const productsPayload = formData.products
          .map(products => ({
            order_id: result.data.id,
            product_id: products.id,
            erp_product_id: products.erp_prod_id,
            quantity: products.quantity,
            unit: products.unit,
            unit_price: parseFloat(products.unitPrice),
            net_amount: parseFloat(products.netAmount),
            sales_tax_rate: parseFloat(products.salesTaxRate),
          }));

        console.log('Submitting products payload:', productsPayload);

        if (productsPayload.length === 0) {
          console.warn('No valid products to submit');
          alert(t('Order created successfully, but no products were added.'));
          navigate('/orders');
          return;
        }

        try {
          const linesResponse = await fetch(`${API_BASE_URL}/sales-order-lines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productsPayload),
            credentials: 'include',
          });

          if (!linesResponse.ok) {
            // Handle HTTP error response
            const errorText = await linesResponse.text();
            console.error('Server response for product lines:', errorText);
            try {
              const errorData = JSON.parse(errorText);
              throw new Error(errorData.message || 'Failed to save product lines');
            } catch (e) {
              throw new Error(`Failed to save product lines: ${linesResponse.status} ${linesResponse.statusText}`);
            }
          }

          // If we get here, both order and products were saved successfully
          alert(t('Order and products created successfully!'));
          navigate('/orders');
        } catch (err) {
          console.error('Error saving product lines:', err);
          // Even if product lines failed, the order was created successfully
          alert(t('Order created successfully, but there was an issue adding products: ') + err.message);
          navigate('/orders');
        }
      } catch (err) {
        console.error('Error creating order:', err);

        // Don't treat success messages as errors
        if (err.message && err.message.toLowerCase().includes('successfully')) {
          alert(t('Order created successfully'));
          navigate('/orders');
        } else {
          setError(err.message);
          alert(t(err.message));
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Update existing order
      try {
        setLoading(true);

        // For updating existing orders, only update the fields that have changed
        const payload = {};

        // Only add fields that are editable and have values
        ['erpCustId', 'erpBranchId', 'orderBy', 'erp', 'entity',
          'paymentMethod', 'totalAmount', 'paidAmount', 'deliveryCharges',
          'expectedDeliveryDate', 'driver', 'vehicleNumber'].forEach(field => {
            if (formData[field] !== undefined && formData[field] !== null) {
              payload[field] = formData[field];
            }
          });

        if (Object.keys(payload).length === 0) {
          alert(t('No changes detected to save.'));
          return;
        }

        console.log('Updating order with payload:', payload);

        const response = await fetch(`${API_BASE_URL}/sales-order/id/${formData.id}`, {
          method: 'POST', // Assuming your API uses POST for updates
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server response:', errorText);
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || 'Failed to update order');
          } catch (e) {
            throw new Error(`Failed to update order: ${response.status} ${response.statusText}`);
          }
        }

        alert(t('Order updated successfully!'));

        // Refresh order details
        const id = formData.id;
        const refreshResponse = await fetch(`${API_BASE_URL}/sales-order/id/${id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (refreshResponse.ok) {
          const result = await refreshResponse.json();
          if (result.status === 'Ok' && result.data) {
            setFormData({
              ...result.data,
              products: result.data.products || []
            });
          }
        }
      } catch (err) {
        console.error('Error updating order:', err);
        setError(err.message);
        alert(t(err.message));
      } finally {
        setLoading(false);
      }
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
    // Ensure we have proper numeric values for calculations
    const unitPrice = parseFloat(product.unitPrice || 0);
    const quantity = 1; // Default quantity
    const vatRate = parseFloat(product.vatPercentage || 0);

    // Calculate net amount
    const netAmount = (unitPrice * quantity).toFixed(2);

    setFormData(prev => ({
      ...prev,
      products: [
        ...prev.products,
        {
          id: product.id,
          productName: product.productName || product.product_name || 'Unknown Product',
          quantityOrdered: quantity,
          unit: product.unit ,
          unitPrice: unitPrice.toString(),
          netAmount: netAmount,
          salesTaxRate: vatRate.toString(),
        }
      ]
    }));
    setShowProductPopup(false);
  };

  // Utility function for more robust API error handling
  const handleApiError = async (response, defaultMessage) => {
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      let errorMessage = defaultMessage;

      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || defaultMessage;
        } else {
          const textError = await response.text();
          console.error('API response text:', textError);
        }
      } catch (err) {
        console.error('Error parsing error response:', err);
      }

      throw new Error(errorMessage);
    }
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
                    p => p.id || p.erpProductName || p.quantityOrdered || p.unit || p.unitPrice || p.netAmount || p.salesTaxRate
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