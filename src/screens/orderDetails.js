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
import GetCustomers from '../components/GetCustomers';
import GetBranches from '../components/GetBranches';
import { useAuth } from '../context/AuthContext';
import RbacManager from '../utilities/rbac'; // Add this import

const defaultOrder = {
  id: '',
  erpCustId: '',
  erpBranchId: '',
  orderBy: '',
  erp: '',
  entity: '',
  paymentMethod: '',
  totalAmount: '',
  paidAmount: '',
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
  // Existing code...
  const { i18n } = useTranslation();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get form mode from location state (add, edit, view)
  const formMode = location.state?.mode || 'view';
  const orderFromNav = location.state?.order || {};

  // Initialize RBAC manager
  const rbacMgr = new RbacManager(
    user.userType === 'employee' && user.roles[0] !== 'admin' ? user.designation : user.roles[0],
    formMode === 'add' ? 'orderDetailAdd' : 'orderDetailEdit'
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  // Initialize form data
  const [formData, setFormData] = useState({
    ...defaultOrder,
    ...orderFromNav,
    id: orderFromNav.id || ''
  });

  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showRemarks, setShowRemarks] = useState(false);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [showBranchPopup, setShowBranchPopup] = useState(false);
  const [popupImage, setPopupImage] = useState(null);
  const [nextOrderId, setNextOrderId] = useState('');

  // Fetch next order ID when in add mode
  useEffect(() => {
    const fetchNextOrderId = async () => {
      if (formMode !== 'add') return;

      try {
        const params = new URLSearchParams({
          page: 1,
          pageSize: 1,
          sortBy: 'id',
          sortOrder: 'desc'
        });

        const response = await fetch(`${API_BASE_URL}/sales-order/pagination?${params.toString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        const result = await response.json();
        let newOrderId = 1;

        if (result.status === 'Ok' && result.data.data.length > 0) {
          newOrderId = (parseInt(result.data.data[0].id, 10) || 0) + 1;
        }

        setNextOrderId(newOrderId.toString());
        setFormData(prev => ({
          ...prev,
          id: newOrderId.toString()
        }));
      } catch (err) {
        console.error('Failed to get next order number:', err);
        setError('Failed to get next order number');
      }
    };

    fetchNextOrderId();
  }, [formMode]);

  // Table columns
  const columns = [
    { key: 'id', header: 'Product ID', include: isV('productIdCol') },
    {
      key: 'productName',
      header: 'Product Name',
      render: (row) => row.productName,
      include: isV('productNameCol'),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (row) => (
        <div className="quantity-controller" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <QuantityController
            itemId={row.id || row.product_id}
            quantity={row.quantity}
            disabled={!isE('products')}
            onQuantityChange={(_, delta) => {
              if (!isE('products')) return;
              const idx = formData.products.findIndex(
                p => (p.id || p.product_id) === (row.id || row.product_id)
              );
              if (idx !== -1) {
                const currentQty = parseInt(formData.products[idx].quantity || 1, 10);
                const newQty = currentQty + parseInt(delta, 10);
                handleQuantityChange(idx, Math.max(1, newQty));
              }
            }}
            onInputChange={(_, value) => {
              if (!isE('products')) return;
              const idx = formData.products.findIndex(
                p => (p.id || p.product_id) === (row.id || row.product_id)
              );
              if (idx !== -1) {
                handleQuantityChange(idx, Math.max(1, parseInt(value, 10) || 1));
              }
            }}
          />
          {isV('stock') && (<span>
            <button
              type="button"
              style={{
                background: '#e6f2ef', color: '#0a5640', border: '1px solid #0a5640',
                borderRadius: '4px',
                fontSize: '12px',
                padding: '2px 8px',
                marginLeft: '6px',
                cursor: 'pointer'
              }}
              title={row.unit ? `Stock for ${row.unit}` : 'Stock'}
              onClick={() => alert(`Show stock for ${row.productName || row.id}`)}
            >
              Stock
            </button>
          </span>)}
        </div>
      ),
      include: isV('quantityCol'),
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (row) => row.unit,
      include: isV('unitCol'),
    },
    {
      key: 'unitPrice',
      header: 'Unit Price (SAR)',
      render: (row) => {
        const price = parseFloat(row.unitPrice);
        return price.toFixed(2);
      },
      include: isV('unitPriceCol'),
    },
    {
      key: 'sugarTaxPrice',
      header: 'Sugar Tax',
      render: (row) => row.sugarTaxPrice ? parseFloat(row.sugarTaxPrice).toFixed(2) : '0.00',
      include: isV('sugarTaxPriceCol'),
    },
    {
      key: 'vatPercentage',
      header: 'VAT',
      render: (row) => parseFloat(row.vatPercentage).toFixed(2)+"%",
      include: isV('vatPercentageCol'),
    },
    {
      key: 'netAmount',
      header: 'Net Amount (SAR)',
      render: (row) => parseFloat(row.netAmount).toFixed(2),
      include: isV('netAmountCol'),
    },
    ...(isE('products') ? [{ key: 'actions', header: 'Actions' }] : [])
  ];

  // Fetch order details from backend
  useEffect(() => {
    if (formMode === 'add') {
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
            products: result.data.products
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
  }, [orderFromNav.id, formMode]);

  // Fetch order product details
  useEffect(() => {
    if (formMode === 'add') return;
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
            quantity: product.quantity,
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
  }, [orderFromNav.id, formMode]);

  // Add a default product row in add mode
  useEffect(() => {
    if (formMode === 'add' && formData.products.length === 0) {
      // Do not add an empty row by default
      setFormData(prev => ({
        ...prev,
        products: []
      }));
    }
    // eslint-disable-next-line
  }, [formMode]);

  // quantity change handler
  const handleQuantityChange = (idx, value) => {
    setFormData(prev => {
      const updatedProducts = [...prev.products];
      // Make sure we store the value as a number
      updatedProducts[idx].quantity = parseInt(value, 10);

      // Update the net amount based on the new quantity
      const unitPrice = parseFloat(updatedProducts[idx].unitPrice || 0);
      updatedProducts[idx].netAmount = (unitPrice * value).toFixed(2);

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
  const handleSave = async () => {
    if (formMode === 'add') {
      // Validation - check if essential fields are filled
      if (!formData.erpCustId || !formData.erpBranchId) {
        alert(t('Customer and Branch are required fields.'));
        return;
      }

      // Prepare payload for backend - correctly map database IDs and ERP IDs
      const payload = {
        erpCustId: formData.erp, // Include the ERP customer ID
        erpBranchId: formData.erpBranchIdValue || '', // Include the ERP branch ID if available
        orderBy: formData.orderBy || '',
        erp: formData.erp || '',
        entity: formData.entity || '',
        paymentMethod: formData.paymentMethod || '',
        totalAmount: formData.totalAmount,
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



        const productsPayload = formData.products.map((product, index) => ({
          order_id: result.data.id,
          line_number: index + 1, // Generate sequential line numbers
          erp_line_number: index + 1, // Using same as line_number if no specific ERP line number exists
          product_id: product.id || product.product_id,
          erp_prod_id: product.erpProdId || product.erp_prod_id || '',
          quantity: parseInt(product.quantity || 1, 10),
          unit: product.unit || '',
          unit_price: parseFloat(product.unitPrice),
          net_amount: parseFloat(product.netAmount),
          sugar_tax_price: parseFloat(product.sugarTaxPrice),
          sales_tax_rate: parseFloat(product.vatPercentage),
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

  const handleCheckout = (order) => {
    navigate('/checkout', { state: { order } });
  };


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
    const unitPrice = parseFloat(product.unitPrice);
    const quantity = 1; // Default to 1 when adding a product
    const sugarTaxPrice =parseFloat(product.sugarTaxPrice);
    const vatPercentage = parseFloat(product.vatPercentage);

    // Calculate net amount (unit price * quantity)
    const netAmount = (unitPrice * quantity).toFixed(2);

    setFormData(prev => ({
      ...prev,
      products: [
        ...prev.products,
        {
          id: product.id, // Product ID for identifying the product
          product_id: product.id, // Duplicate for compatibility with different naming conventions
          productName: product.productName,
          erpProdId: product.erpProdId || product.erp_prod_id || '', // ERP product ID
          quantity: quantity,
          unit: product.unit,
          unitPrice: unitPrice.toFixed(2),
          netAmount: netAmount,
          sugarTaxPrice: sugarTaxPrice,
          vatPercentage:vatPercentage
          // Include any other properties needed for display/calculations
        }
      ]
    }));
    setShowProductPopup(false);
  };

  // Handle customer selection
  const handleSelectCustomer = (customer) => {
    setFormData(prev => ({
      ...prev,
      erpCustId: customer.erpCustId,
      customerId: customer.id, // Use the database ID for the customer
      selectedCustomerName: customer.company_name_en || customer.companyNameEn || '',
      // Populate the ERP# field with the customer's erp_cust_id

    }));
    setShowCustomerPopup(false);
  };

  // Handle branch selection
  const handleSelectBranch = (branch) => {
    setFormData(prev => ({
      ...prev,
      erpBranchId: branch.id, // Database branch ID
      erpBranchIdValue: branch.erp_branch_id || branch.erpBranchId || '', // Store ERP branch ID
      selectedBranchName: branch.branch_name_en || branch.branchNameEn || ''
    }));
    setShowBranchPopup(false);
  };

  // Add this to your existing state declarations
  const [entityOptions, setEntityOptions] = useState([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = useState([]);

  // Add this useEffect to fetch entity options
  useEffect(() => {
    const fetchEntityOptions = async () => {
      try {
        // Updated URL to include query parameter for entity master type
        const response = await fetch(`${API_BASE_URL}/basics-masters?filters={"masterName": "entity"}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to fetch entity options');

        const result = await response.json();

        if (result.status === 'Ok' && result.data) {
          const options = result.data;
          // Extract entity values from the response data
          const entityValues = options.map(item => item.value);
          setEntityOptions(entityValues);
        } else if (result.data && Array.isArray(result.data)) {
          const options = result.data;
          // Handle the actual response structure we're seeing in the logs
          const entityValues = options.map(item => item.value);
          setEntityOptions(entityValues);
        } else {
          throw new Error('Unexpected response format for entity options');
        }
      } catch (err) {
        console.error('Error fetching entity options:', err);
      }
    };

    fetchEntityOptions();
  }, []);

  // Add this to your existing state declarations
  // eslint-disable-next-line
  const [customerOptions, setCustomerOptions] = useState([]);

  // Add this useEffect to fetch customer options when the GetCustomers component is opened
  useEffect(() => {
    // This function only needs to be kept if you want to pass it to a child component
    const fetchCustomerOptions = async () => {
      try {
        const params = new URLSearchParams({
          page: 1,
          pageSize: 100, // Fetch a reasonable number of customers
          sortBy: (i18n.language === 'ar' ? 'company_name_ar' : 'company_name_en'),
          sortOrder: 'asc'
        });

        const response = await fetch(`${API_BASE_URL}/customers/pagination?${params.toString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to fetch customer options');

        const result = await response.json();
        if (result.status === 'Ok' && result.data && Array.isArray(result.data.data)) {
          setCustomerOptions(result.data.data);
        } else {
          throw new Error('Unexpected response format for customer options');
        }
      } catch (err) {
        console.error('Error fetching customer options:', err);
        // Fallback to empty array if the API call fails
        setCustomerOptions([]);
      }
    };

    // Only fetch if the popup is open
    if (showCustomerPopup) {
      fetchCustomerOptions();
    }
  }, [showCustomerPopup, i18n.language]);

  // Add this useEffect to fetch payment method options
  useEffect(() => {
    const fetchPaymentMethodOptions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/basics-masters?filters={"masterName": "paymentMethod"}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to fetch payment method options');

        const result = await response.json();

        if (result.status === 'Ok' && result.data) {
          const options = result.data;
          // Extract payment method values from the response data
          const paymentMethodValues = options.map(item => item.value);
          setPaymentMethodOptions(paymentMethodValues);
        } else if (result.data && Array.isArray(result.data)) {
          const options = result.data;
          // Handle the actual response structure we're seeing in the logs
          const paymentMethodValues = options.map(item => item.value);
          setPaymentMethodOptions(paymentMethodValues);
        } else {
          throw new Error('Unexpected response format for payment method options');
        }
      } catch (err) {
        console.error('Error fetching payment method options:', err);
      }
    };

    fetchPaymentMethodOptions();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>{t('Loading...')}</div>;
  if (error) return <div className="error">{t(error)}</div>;

  return (
    <Sidebar>
      {isV('orderDetails') && (
        <div className="order-details-container">
          <div className={`order-details-content ${isCommentPanelOpen ? 'collapsed' : ''}`}>
            <div className="order-details-body">
              <h2 className="order-details-title">
                {formMode === 'add'
                  ? `${t('New Order')} #${nextOrderId}`
                  : `${t('Order #')} ${formData.id}`}
              </h2>
              <div className="order-details-section">
                <div className="order-details-grid">
                  {isV('customerName') && (
                    <div className="order-details-field">
                      <label htmlFor="customerField">{t('Customer Company Name')}</label>
                      {formMode === 'add' ? (
                        <div className="customer-input-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input
                            id="customerField"
                            name="selectedCustomerName"
                            value={formData.selectedCustomerName}
                            onClick={() => setShowCustomerPopup(true)}
                            className="customer-input"
                            placeholder={t('Click to select customer')}
                            disabled={!isE('customerName')}
                          />
                        </div>
                      ) : (
                        <input
                          id="erpCustIdField"
                          name="erpCustId"
                          value={formData.erpCustId ?? ''}
                          disabled={isE('customerName')}
                          readOnly
                        />
                      )}
                    </div>
                  )}

                  {isV('branchName') && (
                    <div className="order-details-field">
                      <label>{t('Branch')}</label>
                      {formMode === 'add' ? (
                        <div className="customer-input-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input
                            id="branchField"
                            name="selectedBranchName"
                            value={formData.selectedBranchName || ''}
                            onClick={() => {
                              if (!formData.erpCustId) {
                                alert(t('Please select a customer first'));
                                return;
                              }
                              if (isE('branchName')) setShowBranchPopup(true);
                            }}
                            className="customer-input"
                            placeholder={t('Click to select branch')}
                            readOnly
                            disabled={!isE('branchName')}
                          />
                        </div>
                      ) : (
                        <input
                          id="erpBranchIdField"
                          name="erpBranchId"
                          value={formData.erpBranchId ?? ''}
                          disabled
                          readOnly
                        />
                      )}
                    </div>
                  )}

                  {isV('orderBy') && (
                    <div className="order-details-field">
                      <label>{t('Order By')}</label>
                      <input
                        name="orderBy"
                        value={formData.orderBy ?? ''}
                        onChange={handleInputChange}
                        disabled={!isE('orderBy')}
                      />
                    </div>
                  )}

                  {isV('erpId') && (
                    <div className="order-details-field">
                      <label>{t('ERP#')}</label>
                      <input
                        name="erp"
                        value={formData.erp ?? ''}
                        onChange={handleInputChange}
                        disabled={!isE('erpId')}
                        placeholder={t('ERP ID')}
                      />
                    </div>
                  )}

                  {isV('entity') && (
                    <div className="order-details-field">
                      <label>{t('Entity')}</label>
                      {formMode === 'add' ? (
                        <select
                          name="entity"
                          value={formData.entity || ''}
                          onChange={handleInputChange}
                          className="entity-dropdown"
                          disabled={!isE('entity')}
                        >
                          <option value="">{t('Select Entity')}</option>
                          {entityOptions.map((entity, index) => (
                            <option key={index} value={entity}>
                              {entity}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          name="entity"
                          value={formData.entity || ''}
                          disabled
                        />
                      )}
                    </div>
                  )}

                  {isV('paymentMethod') && (
                    <div className="order-details-field">
                      <label>{t('Payment Method')}</label>
                      {formMode === 'add' ? (
                        <select
                          name="paymentMethod"
                          value={formData.paymentMethod || ''}
                          onChange={handleInputChange}
                          className="entity-dropdown"
                          disabled={!isE('paymentMethod')}
                        >
                          <option value="">{t('Select Payment Method')}</option>
                          {paymentMethodOptions.map((paymentMethod, index) => (
                            <option key={index} value={paymentMethod}>
                              {paymentMethod}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          name="paymentMethod"
                          value={formData.paymentMethod || ''}
                          disabled
                        />
                      )}
                    </div>
                  )}

                  {isV('totalAmount') && (
                    <div className="order-details-field">
                      <label>{t('Total Amount')}</label>
                      <input
                        name="totalAmount"
                        value={formData.totalAmount ?? ''}
                        onChange={handleInputChange}
                        disabled={!isE('totalAmount')}
                      />
                    </div>
                  )}

                  {isV('paidAmount') && (
                    <div className="order-details-field">
                      <label>{t('Amount Paid')}</label>
                      <input
                        name="paidAmount"
                        value={formData.paidAmount ?? ''}
                        onChange={handleInputChange}
                        disabled={!isE('paidAmount')}
                      />
                    </div>
                  )}

                  {isV('deliveryCharges') && (
                    <div className="order-details-field">
                      <label>{t('Delivery Charges')}</label>
                      <input
                        name="deliveryCharges"
                        value={formData.deliveryCharges ?? ''}
                        onChange={handleInputChange}
                        disabled={!isE('deliveryCharges')}
                      />
                    </div>
                  )}

                  {isV('expectedDeliveryDate') && (
                    <div className="order-details-field">
                      <label>{t('Delivery Date')}</label>
                      <input
                        name="expectedDeliveryDate"
                        value={formData.expectedDeliveryDate ?? ''}
                        onChange={handleInputChange}
                        disabled={!isE('expectedDeliveryDate')}
                      />
                    </div>
                  )}

                  {isV('createdDate') && (
                    <div className="order-details-field">
                      <label>{t('Created Date')}</label>
                      <input
                        name="createdDate"
                        value={formData.createdAt ?? ''}
                        disabled
                      />
                    </div>
                  )}

                  {isV('updatedDate') && (
                    <div className="order-details-field">
                      <label>{t('Updated Date')}</label>
                      <input
                        name="updatedDate"
                        value={formData.updatedAt ?? ''}
                        disabled
                      />
                    </div>
                  )}

                  {isV('driver') && (
                    <div className="order-details-field">
                      <label>{t('Driver')}</label>
                      <input
                        name="driver"
                        value={formData.driver ?? ''}
                        onChange={handleInputChange}
                        disabled={!isE('driver')}
                      />
                    </div>
                  )}

                  {isV('vehicleNumber') && (
                    <div className="order-details-field">
                      <label>{t('Vehicle Number')}</label>
                      <input
                        name="vehicleNumber"
                        value={formData.vehicleNumber ?? ''}
                        onChange={handleInputChange}
                        disabled={!isE('vehicleNumber')}
                      />
                    </div>
                  )}
                </div>

                {isV('images') && (
                  <>
                    <label>{t('Delivery images')}</label>
                    <div className="maintenance-images-list">
                      {isV('addImages') && (
                        <>
                          <button
                            type="button"
                            className="maintenance-add-image-btn"
                            onClick={openFileDialog}
                            title="Add Image"
                            disabled={!isE('vehicleNumber')}
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
                        </>
                      )}
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
                  </>
                )}
              </div>

              {isV('products') && (
                <div className="order-products-section">
                  <h3 className="order-details-subtitle">{t('Products')}</h3>
                  {((formMode === 'add') || (formMode === 'edit' && isE('products'))) && (
                    <button
                      type="button"
                      className="order-action-btn approve"
                      onClick={() => {
                              if (!formData.erpCustId) {
                                alert(t('Please select a customer first'));
                                return;
                              }
                              else if (!formData.erpBranchId) {
                                alert(t('Please select a Branch'));
                                return;
                              }
                              else if (!formData.entity) {
                                alert(t('Please select Entity'));
                                return;
                              }
                        setShowProductPopup(true)}}
                      style={{ marginBottom: 8 }}
                    >
                      {t('Add products')}
                    </button>
                  )}
                  {/* Hide table in add mode until products are selected */}
                  {(!formMode === 'add' || (formData.products && formData.products.length > 0)) && (
                    <Table
                      columns={columns}
                      data={formData.products.filter(
                        p => p.id || p.erp_prodd || p.quantity || p.unit || p.unitPrice || p.sugarTaxPrice || p.netAmount || p.vatPercentage
                      )}
                      actionButtons={
                        formMode === 'add' && isE('products')
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
              )}
            </div>

            {isV('orderFooter') && (
              <div className="order-details-footer">
                {isV('orderStatus') && (
                  <div className="order-status">
                    <span className="status-label">{t('Status')}:</span>
                    <span className={`order-status-badge status-${formData.status?.toLowerCase() || 'pending'}`}>
                      {t(formData.status) || t('Pending')}
                    </span>
                  </div>
                )}

                {isV('btnSave') && isE('btnSave') && (
                  <button className="order-action-btn" onClick={() => handleSave('save')}>
                    {t('Save Changes')}
                  </button>
                )}

                {isV('btnCancel') && isE('btnCancel') && (
                  <button className="order-action-btn" onClick={() => handleSubmit('cancel order')}>
                    {t('Cancel Order')}
                  </button>
                )}

                {isV('btnInvoice') && isE('btnInvoice') && (
                  <button className="order-action-btn" onClick={() => handleDownloadInvoice(formData.id)}>
                    {t('Download Invoice')}
                  </button>
                )}

                {isV('btnPay') && isE('btnPay') && (
                  <button className="order-action-btn" onClick={() => handleCheckout()} style={{ width: '160px', backgroundColor:'#005932', color: 'white' }}>
                    {t('Checkout')}
                  </button>
                )}

                {isV('btnInventory') && isE('btnInventory') && (
                  <button className="order-action-btn" onClick={() => setShowInventory(true)}>
                    {t('Get Inventory')}
                  </button>
                )}

                {isV('actionButtons') && (
                  <div className="order-details-actions">
                    {isV('btnApprove') && isE('btnApprove') && (
                      <button
                        className="order-action-btn approve"
                        onClick={() => handleSubmit('approve')}
                        disabled={formData.status === 'approved'}
                      >
                        {t('Approve')}
                      </button>
                    )}

                    {isV('btnReject') && isE('btnReject') && (
                      <button
                        className="order-action-btn reject"
                        onClick={() => handleSubmit('reject')}
                        disabled={formData.status === 'approved'}
                      >
                        {t('Reject')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rest of the component with modals and popups */}
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
              customerId={formData.customerId}
              entity={formData.entity}
              t={t}
            />
          )}

          {/* Customer Popup */}
          {showCustomerPopup && (
            <GetCustomers
              open={showCustomerPopup}
              onClose={() => setShowCustomerPopup(false)}
              onSelectCustomer={handleSelectCustomer}
              API_BASE_URL={API_BASE_URL}
              t={t}
            />
          )}

          {/* Branch Popup */}
          {showBranchPopup && (
            <GetBranches
              open={showBranchPopup}
              onClose={() => setShowBranchPopup(false)}
              onSelectBranch={handleSelectBranch}
              customerId={formData.customerId}
              API_BASE_URL={API_BASE_URL}
              t={t}
            />
          )}

          {/* Image Popup */}
          {popupImage && (
            <div
              className="image-popup-overlay"
              onClick={() => setPopupImage(null)}
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}
            >
              <img
                src={popupImage}
                alt="Preview"
                style={{ maxHeight: '80vh', maxWidth: '90vw', borderRadius: 8, background: '#fff' }}
                onClick={e => e.stopPropagation()}
              />
              <button
                onClick={() => setPopupImage(null)}
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 40,
                  fontSize: 24,
                  background: 'transparent',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer'
                }}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
          )}
        </div>
      )}
    </Sidebar>
  );
}

export default OrderDetails;