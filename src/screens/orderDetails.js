import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import formatDate from '../utilities/dateFormatter';
import ApprovalDialog from '../components/ApprovalDialog';
import GetPaymentMethods from '../components/GetPaymentMethods'; // Add this import
import Dropdown from '../components/DropDown';

const defaultOrder = {
  id: '',
  erpCustId: '',
  erpBranchId: '',
  orderBy: '',
  erp: '',
  entity: '',
  category: '',
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
  const { user, token, logout } = useAuth();

  // Get form mode from location state (add, edit, view)
  const formMode = location.state?.mode || 'view';
  const orderFromNav = location.state?.order || {};
  // Detect if coming from approval mode
  const fromApproval = location.state?.fromApproval;
  const wfid = location.state?.wfid || null;
  const approvalHistory = location.state?.approvalHistory || [];


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
  const [saving, setSaving] = useState(false); // New saving state
  const [isEditMode, setIsEditMode] = useState(formMode === 'edit'); // Determine edit mode from formMode
  const [products, setProducts] = useState([]);
  const [originalProducts, setOriginalProducts] = useState([]); // Track original products for comparison
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  // Store companyType in state
  const [companyType, setCompanyType] = useState('');

  // Add state for payment method popup and selected method
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [pendingSaveAction, setPendingSaveAction] = useState(null);

  // Remove categoryOptions/products fetching and getFilteredVmcoCategories
  // Hardcode VMCO categories
  const VMCO_CATEGORIES = [
    'VMCO Machines',
    'VMCO Consumables'
  ];

  // Fetch next order ID when in add mode
  useEffect(() => {
    const fetchNextOrderId = async () => {
      if (formMode !== 'add') return;
      try {
        // Fetch all sales order ids (only ids, not full data)
        console.log('Fetching next order ID...');
        const response = await fetch(`${API_BASE_URL}/sales-order/pagination`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        const result = await response.json();
        console.log('Orders', result);
        let newOrderId = 0;
        if (result.status === 'Ok' && result.data && Array.isArray(result.data.data) && result.data.data.length > 0) {
          // Find the max id from the list
          const ids = result.data.data.map(order => parseInt(order.id, 10));
          const maxId = Math.max(...ids);
          console.log('Max order ID found:', maxId);
          newOrderId = maxId + 1;
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

  // Fetch order details from backend
  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Only fetch if not in add mode and id exists
      if (formMode === 'add' || !orderFromNav.id) {
        setLoading(false);
        return;
      }
      const id = orderFromNav.id;
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

  useEffect(() => {
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

          // Store the original product list for comparison when saving
          setOriginalProducts(processedProducts);
          console.log('Stored original products for comparison:', processedProducts);
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
  // Function to handle form submission
  const handleSave = async (action, selectedMethod) => {
     // Perform validation before saving
      if (!formData.customerId) {
        alert(t('Please select a customer'));
        setSaving(false);
        return;
      }
    // Disable save button to prevent multiple submissions
    setSaving(true);

    // Only show popup in add mode and if payment method is not selected
    if (formMode === 'add' && !formData.paymentMethod && !selectedMethod) {
      setPendingSaveAction(action);
      setShowPaymentPopup(true);
      setSaving(false);
      return;
    }

    // Use the selected method if provided, else use from formData
    const paymentMethodToUse = selectedMethod || formData.paymentMethod;

    try {
      // Perform validation before saving
      if (!formData.customerId) {
        alert(t('Please select a customer'));
        setSaving(false);
        return;
      }

      if (!formData.products || formData.products.length === 0) {
        alert(t('Please add at least one product'));
        setSaving(false);
        return;
      }      // Check if we're editing an existing order or creating a new one
      if (formData.id && isEditMode) {
        // Update existing order

        // Include all fields that might need updating
        const fieldsToUpdate = [
          'erpCustId', 'erpBranchId', 'orderBy', 'erp', 'entity',
          'paymentMethod', 'totalAmount', 'paidAmount', 'deliveryCharges',
          'expectedDeliveryDate', 'status', 'driver', 'vehicleNumber'
        ];
        const payload = {};
        fieldsToUpdate.forEach(field => {
          if (formData[field] !== undefined && formData[field] !== null) {
            payload[field] = formData[field];
          }
        });

        // First update the sales order
        const orderResponse = await fetch(`${API_BASE_URL}/sales-order/id/${formData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });

        if (!orderResponse.ok) {
          const errorText = await orderResponse.text();
          console.error('Server response:', errorText);
          throw new Error(`Failed to update order: ${orderResponse.statusText}`);
        }

        // Now check for existing order lines and fetch them
        let existingProductMap = {};
        try {
          const linesResponse = await fetch(`${API_BASE_URL}/sales-order-lines/pagination?filters=${encodeURIComponent(JSON.stringify({ orderId: formData.id }))}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });

          if (!linesResponse.ok) {
            console.warn(`Failed to fetch order lines: ${linesResponse.statusText}`);
          } else {
            const existingLines = await linesResponse.json();
            if (existingLines.data?.data) {
              // Filter to ensure we only get lines for this specific order
              const orderLines = existingLines.data.data.filter(line => line.orderId === formData.id);
              console.log(`Existing order lines for orderId ${formData.id}:`, orderLines);

              orderLines.forEach(line => {
                if (line.productId) {
                  existingProductMap[line.productId] = line;
                  console.log(`Mapped existing line for product ID ${line.productId} to line ID ${line.id}`);
                } else {
                  console.warn(`Found order line without product_id:`, line);
                }
              });
            }
          }
        } catch (err) {
          console.error('Error fetching existing order lines:', err);
        }

        // Now update each product line
        if (formData.products && formData.products.length > 0) {
          console.log('Updating sales order lines');

          const updatePromises = formData.products.map(product => {
            // Extract product data
            const productId = product.id || product.productId;
            const unitPrice = parseFloat(product.unitPrice);
            const quantity = parseInt(product.quantity, 10);
            const netAmount = parseFloat(product.netAmount);
            //const sugarTaxPrice = parseFloat(product.sugarTaxPrice || 0);
            const vatPercentage = parseFloat(product.vatPercentage || 0);

            // Check if product already exists in the order
            const existingLine = existingProductMap[productId];

            if (existingLine) {
              console.log(`Found existing line for product ID ${productId}, updating quantity and amounts`);
              // Update existing line
              return updateSalesOrderLine(
                formData.id,
                productId,
                unitPrice,
                quantity,
                netAmount,
                //sugarTaxPrice,
                vatPercentage
              );
            }
            // Existing products with salesOrderLineId but not found in existingProductMap
            else if (product.salesOrderLineId) {
              console.log(`Product has salesOrderLineId ${product.salesOrderLineId} but not found in existing lines, updating`);
              return updateSalesOrderLine(
                formData.id,
                productId,
                unitPrice,
                quantity,
                netAmount,
                //sugarTaxPrice,
                vatPercentage
              );
            }
            // New products need to be added
            else {
              console.log(`Creating new line for product ID ${productId}`);
              return createSalesOrderLine(
                formData.id,
                productId,
                unitPrice,
                quantity,
                netAmount,
                //sugarTaxPrice,
                vatPercentage
              );
            }
          });

          // Wait for all product line updates to complete
          await Promise.all(updatePromises);
        }

        // Check for deleted products by comparing originalProducts with current products
        if (originalProducts && originalProducts.length > 0) {
          console.log('Checking for deleted products...');

          // Create a map of current products for easy lookup
          const currentProductsMap = {};
          formData.products.forEach(product => {
            const productId = product.id || product.productId;
            if (productId) {
              currentProductsMap[productId] = true;
            }
          });

          // Find products that were in originalProducts but are no longer in formData.products
          const deletePromises = originalProducts
            .filter(product => {
              const productId = product.id || product.productId;
              return productId && !currentProductsMap[productId];
            })
            .map(product => {
              const productId = product.id || product.productId;
              console.log(`Deleting removed product ID ${productId} from order`);
              return deleteSalesOrderLine(formData.id, productId);
            });

          // Wait for all delete operations to complete
          if (deletePromises.length > 0) {
            console.log(`Found ${deletePromises.length} products to delete`);
            await Promise.all(deletePromises);
          } else {
            console.log('No products were removed from the order');
          }
        }

        // Refresh order details after update
        await getOrderById(formData.id);
        setIsEditMode(false);
        alert(t('Order updated successfully!'));
      } else {
        // Create a new order
        // Validation - check if essential fields are filled
        if (!formData.erpCustId || !formData.erpBranchId) {
          alert(t('Customer and Branch are required fields.'));
          setSaving(false);
          return;
        }

        let attempt = 0;
        let maxAttempts = 2;
        let lastError = null;
        // Step 0: If user is employee, fetch empId from employees table using email
        let empId = '0000';
        if (user.userType === 'employee' && user.email) {
          try {
            const empRes = await fetch(`${API_BASE_URL}/employees/email/${encodeURIComponent(user.email)}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            });
            if (empRes.ok) {
              const empResult = await empRes.json();
              if (empResult.status === 'Ok' && empResult.data && empResult.data.empId) {
                empId = empResult.data.empId;
              }
            }
          } catch (empErr) {
            console.warn('Could not fetch empId for employee:', empErr);
          }
        }
        while (attempt < maxAttempts) {
          // Prepare payload for backend - only include defined fields, default to '' for missing optional fields
          const payload = {
            erpOrderId: `SO00${formData.id || nextOrderId}`,
            customerId: formData.customerId || '',
            companyNameEn: formData.selectedCustomerName || formData.companyNameEn || '',
            companyNameAr: formData.companyNameAr || '',
            erpCustId: formData.erpCustId || '',
            branchId: formData.erpBranchId || '',
            erpBranchId: formData.erpBranchIdValue || '',
            branchNameEn: formData.selectedBranchName || formData.branchNameEn || '',
            branchNameLc: formData.selectedBranchName || formData.branchNameLc || '',
            orderBy: formData.orderBy || '',
            paymentMethod: selectedMethod || formData.paymentMethod || '', 
            status: 'Open',
            sales_executive: user.employeeId,
            paymentStatus: (selectedMethod || formData.paymentMethod) === 'Credit' ? 'Paid' : 'Pending', // <-- Use selectedMethod for logic
            entity: formData.entity || '',
            deliveryCharges: formData.deliveryCharges || '0',
            totalAmount: formData.totalAmount || '0',
            pricingPolicy: formData.pricingPolicy || '',
            customerRegion: formData.customerRegion || ''
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
              if (errorText.includes('duplicate key value violates unique constraint')) {
                // Duplicate erpOrderId, fetch latest max id and retry
                attempt++;
                // Fetch latest max id
                const params = new URLSearchParams({
                  page: 1,
                  pageSize: 1,
                  sortBy: 'id',
                  sortOrder: 'desc',
                  fields: 'id'
                });
                const idRes = await fetch(`${API_BASE_URL}/sales-order/pagination?${params.toString()}`, {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include'
                });
                const idResult = await idRes.json();
                let newOrderId = 1;
                if (idResult.status === 'Ok' && idResult.data && Array.isArray(idResult.data.data) && idResult.data.data.length > 0) {
                  const ids = idResult.data.data.map(order => parseInt(order.id, 10)).filter(Boolean);
                  const maxId = ids.length > 0 ? Math.max(...ids) : 0;
                  newOrderId = maxId + 1;
                }
                setNextOrderId(newOrderId.toString());
                setFormData(prev => ({ ...prev, id: newOrderId.toString() }));
                continue; // Retry
              }
              // Handle other errors
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

            // Prepare products payload, set sales_executive to empId if user is employee
            const productsPayload = formData.products.map((product, index) => {
              let vat = product.vatPercentage;
              if (companyType && companyType.toLowerCase() === 'non trading') {
                vat = 0.00;
              }
              return {
                order_id: result.data.id,
                line_number: index + 1, // Generate sequential line numbers
                erp_line_number: index + 1, // Using same as line_number if no specific ERP line number exists
                product_id: product.id || product.product_id,
                product_name: product.productName || product.product_name_en,
                product_name_lc: product.productNameLc,
                erp_prod_id: product.erpProdId || product.erp_prod_id || '',
                quantity: parseInt(product.quantity || 1, 10),
                unit: product.unit || '',
                unit_price: parseFloat(product.unitPrice),
                net_amount: parseFloat(product.netAmount),
                //sugar_tax_price: parseFloat(product.sugarTaxPrice).toFixed(2),
                vat_percentage: Number(vat).toFixed(2),
              };
            });

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
            break; // Exit the loop on success
          } catch (err) {
            lastError = err;
            if (attempt >= maxAttempts - 1) {
              setError(err.message);
              alert(t(err.message));
            }
          } finally {
            setLoading(false);
          } attempt++;
        }
      } // Close the else block from line 458
    } catch (error) {
      console.error('Error saving order:', error);
      alert(t('Failed to save order. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  // cancel handler
  const handleCancelOrder = async () => {
    if (!formData.id) {
      alert(t('Order ID is missing.'));
      return;
    }

    const payload = {
      status: 'Cancelled'
    };

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/sales-order/id/${formData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Failed to cancel order');
        } catch (e) {
          throw new Error(`Failed to cancel order: ${response.status} ${response.statusText}`);
        }
      }

      alert(t('Order status updated to Cancelled!'));
      navigate('/orders'); // or refresh the current view if needed
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(err.message);
      alert(t(err.message));
    } finally {
      setLoading(false);
    }
  };

  // cancel/Approve/Reject handler
  const handleSubmit = async (action) => {
    if (!fromApproval || !wfid) {
      alert(t('Approval action not available.'));
      return;
    }
    let comment = '';
    if (action === 'approve') {
      comment = prompt(t('Please enter your comments for approval:'));
    } else if (action === 'reject') {
      comment = prompt(t('Please enter your comments for rejection:'));
    }
    const payload = {
      workflowData: (action === 'approve' || action === 'reject') ? (location.state?.workflowData || {}) : {},
      approvedStatus: action === 'approve' ? 'approved' : 'rejected',
      comment: comment
    };
    try {
      const res = await fetch(`${API_BASE_URL}/workflow-instance/id/${wfid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (res.ok) {
        alert(t(`${action.charAt(0).toUpperCase() + action.slice(1)} successful!`));
        navigate('/orders');
      } else {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to submit approval');
      }
    } catch (error) {
      console.error(`Error ${action}ing order:`, error);
      alert(t(`Error ${action}ing order: ${error.message}`));
    }
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

    // If pricing policy changes, update product prices
    if (name === 'pricingPolicy' && formData.customerId) {
      updateProductPricesForPricingPolicy(value);
    }
  };

  // Function to update product prices when pricing policy changes
  const updateProductPricesForPricingPolicy = async (pricingPolicy) => {
    if (!formData.products || !formData.products.length || !pricingPolicy || !formData.customerId) {
      return;
    }

    try {
      // For each product in the list
      const updatedProducts = [...formData.products];
      const updatePromises = formData.products.map(async (product, index) => {
        // Call API to get updated price for this product with new pricing policy
        const response = await fetch(`${API_BASE_URL}/product/price`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            productId: product.id,
            customerId: formData.customerId,
            pricingPolicy: pricingPolicy.toLowerCase()
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.status === 'Ok' && result.data) {
            // Update product with new price information
            const unitPrice = parseFloat(result.data.unitPrice || product.unitPrice);
            const quantity = parseInt(product.quantity, 10);
            //const sugarTaxPrice = parseFloat(result.data.sugarTaxPrice || product.sugarTaxPrice || 0);
            const vatPercentage = parseFloat(result.data.vatPercentage || product.vatPercentage || 0);

            // Calculate new net amount with updated price
            const netAmount = ((unitPrice * quantity) + (vatPercentage / 100 * (unitPrice * quantity))).toFixed(2);

            // Update product in array
            updatedProducts[index] = {
              ...product,
              unitPrice: unitPrice.toFixed(2),
              //sugarTaxPrice,
              vatPercentage,
              netAmount
            };

            // In edit mode, we don't immediately update the sales order line in the database
            // We'll only do that when the Save button is clicked
          }
        }
      });

      // Wait for all product updates to complete
      await Promise.all(updatePromises);

      // Update form data with updated products
      setFormData(prev => ({
        ...prev,
        products: updatedProducts
      }));

    } catch (error) {
      console.error('Error updating product prices:', error);
      alert(t('Failed to update prices. Please try again.'));
    }
  };
  // Function to update sales order line
  const updateSalesOrderLine = async (orderId, productId, unitPrice, quantity, netAmount, /*sugarTaxPrice,*/ vatPercentage) => {
    try {
      // Ensure vatPercentage is 0.00 (decimal) for non trading companies
      let finalVat = vatPercentage;
      if (companyType && companyType.toLowerCase() === 'non trading') {
        finalVat = 0.00;
      }
      const response = await fetch(`${API_BASE_URL}/sales-order-lines/${orderId}/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          quantity,
          unitPrice,
          net_amount: netAmount.toFixed(2),
          //sugarTaxPrice: sugarTaxPrice.toFixed(2),
          vatPercentage: Number(finalVat).toFixed(2)
        })
      });

      if (!response.ok) {
        console.error('Failed to update sales order line');
        const errorText = await response.text();
        console.error('Server response:', errorText);
      } else {
        const updatedLine = await response.json();
        console.log('Successfully updated sales order line:', updatedLine);
      }
    } catch (error) {
      console.error('Error updating sales order line:', error);
    }
  };

  // Function to delete sales order line
  const deleteSalesOrderLine = async (orderId, productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sales-order-lines/${orderId}/${productId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        console.error(`Failed to delete sales order line for product ID ${productId}`);
        const errorText = await response.text();
        console.error('Server response:', errorText);
      } else {
        console.log(`Successfully deleted sales order line for product ID ${productId}`);
      }
    } catch (error) {
      console.error(`Error deleting sales order line for product ID ${productId}:`, error);
    }
  };

  // Function to create a new sales order line
  const createSalesOrderLine = async (orderId, productId, unitPrice, quantity, netAmount, /*sugarTaxPrice,*/ vatPercentage) => {
    try {
      // Ensure vatPercentage is 0.00 (decimal) for non trading companies
      let finalVat = vatPercentage;
      if (companyType && companyType.toLowerCase() === 'non trading') {
        finalVat = 0.00;
      }
      const payload = {
        order_id: orderId,
        product_id: productId,
        quantity: parseInt(quantity, 10),
        unit_price: parseFloat(unitPrice),
        net_amount: parseFloat(netAmount),
        //sugar_tax_price: parseFloat(sugarTaxPrice || 0),
        sales_tax_rate: Number(finalVat).toFixed(2)
      };

      const response = await fetch(`${API_BASE_URL}/sales-order-lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error('Failed to create sales order line');
      }
    } catch (error) {
      console.error('Error creating sales order line:', error);
    }
  };

  // Add selected product to products table
  const handleSelectProduct = (product) => {
    // Use MOQ for the product, default to 1 if not set
    const moq = Number(product.moq) || 1;
    const unitPrice = parseFloat(product.unitPrice);
    //const sugarTaxPrice = parseFloat(product.sugarTaxPrice);
    // Determine VAT based on companyType
    let vatPercentage = 0.00;
    if (companyType && companyType.toLowerCase() === 'trading') {
      vatPercentage = parseFloat(product.vatPercentage);
    }
    setFormData(prev => {
      // Check if product already exists in the table
      const existingIdx = prev.products.findIndex(
        p => (p.id || p.product_id) === (product.id || p.product_id)
      );
      if (existingIdx !== -1) {
        // Product exists, increment quantity and update netAmount
        const updatedProducts = [...prev.products];
        const existingProduct = updatedProducts[existingIdx];
        const newQuantity = (parseInt(existingProduct.quantity, 10) || moq) + 1;
        const newNetAmount = ((unitPrice * newQuantity) + (vatPercentage ? (vatPercentage / 100 * (unitPrice * newQuantity)) : 0)).toFixed(2);
        updatedProducts[existingIdx] = {
          ...existingProduct,
          quantity: newQuantity,
          netAmount: newNetAmount,
          moq: moq, // Always keep MOQ for this product
          vatPercentage: vatPercentage // Always update VAT based on companyType
        };
        const updatedFormData = {
          ...prev,
          products: updatedProducts
        };
        console.log('Product selected and updated in order:', updatedFormData.products[existingIdx]);
        return updatedFormData;
      } else {
        // Product does not exist, add as new row with MOQ as quantity
        const netAmount = ((unitPrice * moq) + (vatPercentage ? (vatPercentage / 100 * (unitPrice * moq)) : 0)).toFixed(2);
        const newProduct = {
          id: product.id, // Product ID for identifying the product
          product_id: product.id, // Duplicate for compatibility
          productName: product.productName,
          erpProdId: product.erpProdId || product.erp_prod_id || '',
          quantity: moq,
          unit: product.unit,
          unitPrice: unitPrice.toFixed(2),
          netAmount: netAmount,
          //sugarTaxPrice: sugarTaxPrice,
          vatPercentage: vatPercentage,
          moq: moq // Store MOQ for this product
        };
        const updatedFormData = {
          ...prev,
          products: [
            ...prev.products,
            newProduct
          ]
        };
        console.log('Product selected and added to order:', newProduct);
        return updatedFormData;
      }
    });
    setShowProductPopup(false);
  };
  // Handle customer selection
  const handleSelectCustomer = (customer) => {
    console.log('Selected customer:', customer);
    // Ensure the pricing policy is one of the allowed options and never undefined
    let customerPricingPolicy = customer.pricingPolicy;
    if (!pricingPolicyOptions.includes(customerPricingPolicy)) {
      customerPricingPolicy = '';
    }
    setCompanyType(customer.companyType || (customer.data && customer.data.companyType) || '');
    setFormData(prev => ({
      ...prev,
      erpCustId: customer.erp_cust_id || customer.erpCustId || '', // Handle both property naming formats
      customerId: customer.id, // Use the database ID for the customer
      selectedCustomerName: i18n.language === 'ar' ? (customer.company_name_ar || customer.companyNameAr) : (customer.company_name_en || customer.companyNameEn),
      pricingPolicy: customerPricingPolicy,
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

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      console.log("$$$$$$$$$$$ logging out");
      // // Logout instead of showing loading message
      // logout();
      // navigate('/login');
      // return; // Return while logout is processing
    }

    if (user && user.userType) {
      const fetchData = async () => {
        if (formMode === 'add') {
          setLoading(false);
          return;
        }
        // Always fetch order details by ID, which will also fetch products
        await getOrderById(orderFromNav.id);
      };
      fetchData();
    }
  }, [user, t, token, i18n.language, orderFromNav.id, formMode]
  );


  // Initialize RBAC manager
  const rbacMgr = new RbacManager(
    user?.userType === 'employee' && user?.roles[0] !== 'admin' ? user?.designation : user?.roles[0],
    formMode === 'add' ? 'orderDetailAdd' : 'orderDetailEdit'
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);


  // Table columns
  const columns = [
    { key: 'id', header: () => t('Product ID'), include: isV('productIdCol') },
    {
      key: 'productName',
      header: () => t('Product Name'),
      render: (row) => i18n.language === 'ar' ? (row.productNameLc || row.product_name_lc || row.productName) : (row.productName || row.product_name_en || row.productNameLc),
      include: isV('productNameCol'),
    },
    {
      key: 'quantity',
      header: () => t('Quantity'),
      render: (row) => (
        <div className="quantity-controller" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <QuantityController
            itemId={row.id || row.product_id}
            quantity={row.quantity}
            moq={Number(row.moq) || 1}
            minQuantity={Number(row.moq) || 1}
            disabled={!isE('products')}
            onQuantityChange={(_, delta) => {
              if (!isE('products')) return;
              const idx = formData.products.findIndex(
                p => (p.id || p.product_id) === (row.id || row.product_id)
              );
              if (idx !== -1) {
                const currentQty = parseInt(formData.products[idx].quantity || 1, 10);
                const moq = Number(formData.products[idx].moq) || 1;
                const newQty = Math.max(moq, currentQty + parseInt(delta, 10));
                handleQuantityChange(idx, newQty);
              }
            }}
            onInputChange={(_, value) => {
              if (!isE('products')) return;
              const idx = formData.products.findIndex(
                p => (p.id || p.product_id) === (row.id || row.product_id)
              );
              if (idx !== -1) {
                const moq = Number(formData.products[idx].moq) || 1;
                handleQuantityChange(idx, Math.max(moq, parseInt(value, 10) || moq));
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
                marginRight: '6px',
                cursor: 'pointer'
              }}
              title={row.unit ? `Stock for ${row.unit}` : 'Stock'}
              onClick={() => alert(`Show stock for ${row.productName || row.id}`)}
            >
              {t('Stock')}
            </button>
          </span>)}
        </div>
      ),
      include: isV('quantityCol'),
    },
    {
      key: 'unit',
      header: () => t('Unit'),
      render: (row) => row.unit,
      include: isV('unitCol'),
    },
    {
      key: 'unitPrice',
      header: () => t('Unit Price (SAR)'),
      render: (row) => {
        const price = parseFloat(row.unitPrice);
        return price.toFixed(2);
      },
      include: isV('unitPriceCol'),
    },
    // {
    //   key: 'sugarTaxPrice',
    //   header: () => t('Sugar Tax'),
    //   render: (row) => row.sugarTaxPrice ? parseFloat(row.sugarTaxPrice).toFixed(2) : '0.00',
    //   include: isV('sugarTaxPriceCol'),
    // },
    {
      key: 'vatPercentage',
      header: () => t('VAT'),
      render: (row) => parseFloat(row.vatPercentage).toFixed(2) + "%",
      include: isV('vatPercentageCol'),
    },
    {
      key: 'netAmount',
      header: () => t('Net Amount (SAR)'),
      render: (row) => parseFloat(row.netAmount).toFixed(2),
      include: isV('netAmountCol'),
    },
    ...(isE('products') ? [{ key: 'actions', header: () => t('Actions') }] : [])
  ];

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

  // Calculate totalAmount as the sum of netAmount of all products
  useEffect(() => {
    if (Array.isArray(formData.products) && formData.products.length > 0) {
      const total = formData.products.reduce((sum, p) => {
        const net = parseFloat(p.netAmount) || 0;
        return sum + net;
      }, 0);
      if (formData.totalAmount !== total.toFixed(2)) {
        setFormData(prev => ({ ...prev, totalAmount: total.toFixed(2) }));
      }
    } else if (formData.totalAmount !== '0.00') {
      setFormData(prev => ({ ...prev, totalAmount: '0.00' }));
    }
  }, [formData.products]);

  // Calculate deliveryCharges and totalAmount based on entity and products
  useEffect(() => {
    let deliveryCharges = '0.00';
    let total = 0;
    if (Array.isArray(formData.products) && formData.products.length > 0) {
      total = formData.products.reduce((sum, p) => {
        const net = parseFloat(p.netAmount) || 0;
        return sum + net;
      }, 0);
      // Delivery charges logic
      if (formData.entity && formData.entity.toLowerCase() !== 'vmco') {
        if (total <= 150) {
          deliveryCharges = '20.00';
        }
      }
    }
    // Only update if values have changed
    if (formData.deliveryCharges !== deliveryCharges || formData.totalAmount !== (total + parseFloat(deliveryCharges)).toFixed(2)) {
      setFormData(prev => ({
        ...prev,
        deliveryCharges,
        totalAmount: (total + parseFloat(deliveryCharges)).toFixed(2)
      }));
    }
  }, [formData.products, formData.entity]);



  // Function to fetch order products
  const fetchOrderProducts = async (orderId) => {
    if (!orderId) return;

    try {
      const params = new URLSearchParams({
        page: 1,
        pageSize: 100,
        search: '',
        sortBy: 'id',
        sortOrder: 'asc',
        filters: JSON.stringify({ order_id: orderId })
      });

      const url = `${API_BASE_URL}/sales-order-lines/pagination?${params.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch order products');

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

        // Store the original product list for comparison when saving
        setOriginalProducts(processedProducts);
        console.log('Stored original products for comparison:', processedProducts);
      }
    } catch (err) {
      console.error('Error fetching order products:', err);
    }
  };

  // Function to get order details by ID
  const getOrderById = async (id) => {
    if (!id) return;

    try {
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

        // Also fetch the order lines
        await fetchOrderProducts(id);
      } else {
        throw new Error(result.message || 'Order not found');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.message);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>{t('Loading...')}</div>;
  if (error) return <div className="error">{t(error)}</div>;

  // Pricing policy options
  const pricingPolicyOptions = ['Price A', 'Price B', 'Price C', 'Price D'];

  const handleApprovalSubmit = (action) => {
    setApprovalAction(action);
    setIsApprovalDialogOpen(true);
  };

  // Handle dialog submit for order approval/rejection just like in customersDetails.js
  const handleDialogSubmit = async (comment) => {
    // Build workflowData payload (add updates if needed, similar to customersDetails)
    let updates = { ...((location.state?.workflowData && location.state.workflowData.updates) || {}) };
    // If you need to add more update logic for orders, do it here

    // --- BEGIN: PATCH order lines and order if approving in approval mode and status is pending ---
    if (approvalAction === 'approve' && fromApproval && formData.status && formData.status.toLowerCase() === 'pending') {
      try {
        // 1. Update all sales order lines (quantity, netAmount)
        for (const product of formData.products) {
          const productId = product.id || product.product_id;
          const unitPrice = parseFloat(product.unitPrice);
          const quantity = parseInt(product.quantity, 10);
          const netAmount = parseFloat(product.netAmount);
          const vatPercentage = parseFloat(product.vatPercentage || 0);
          await fetch(`${API_BASE_URL}/sales-order-lines/${formData.id}/${productId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quantity,
              unitPrice,
              net_amount: netAmount.toFixed(2),
              vatPercentage: vatPercentage.toFixed(2)
            }),
            credentials: 'include',
          });
        }
        // 2. Update the sales order's totalAmount
        await fetch(`${API_BASE_URL}/sales-order/id/${formData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ totalAmount: formData.totalAmount }),
          credentials: 'include',
        });
      } catch (err) {
        alert(t('Failed to update order or lines before approval: ') + (err.message || err));
        return;
      }
    }
    // --- END: PATCH order lines and order if approving in approval mode and status is pending ---

    const payload = {
      workflowData: {
        ...(location.state?.workflowData || {}),
        updates
      },
      approvedStatus: approvalAction === 'approve' ? 'approved' : 'rejected',
      comment: comment
    };

    try {
      const res = await fetch(`${API_BASE_URL}/workflow-instance/id/${wfid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (res.ok) {
        alert(t(`${approvalAction.charAt(0).toUpperCase() + approvalAction.slice(1)} successful!`));
        setIsApprovalDialogOpen(false);
        navigate('/orders');
      } else {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to submit approval');
      }
    } catch (error) {
      console.error(`Error ${approvalAction}ing order:`, error);
      alert(t(`Error ${approvalAction}ing order: ${error.message}`));
      setIsApprovalDialogOpen(false);
    }
  };

  // Add this helper function inside your component, before return
  function getTotalAmountForPopup() {
    if (!formData.products || formData.products.length === 0) return 0;
    let sum = 0;
    formData.products.forEach(item => {
      const qty = Number(item.quantity || 1);
      const price = Number(item.unitPrice || 0);
      const vat = Number(item.vatPercentage || 0);
      const base = price * qty;
      const vatAmount = (base * vat) / 100;
      sum += base + vatAmount;
    });
    return sum;
  }

  // Add this handler inside your component, before return
  function handleSelectPaymentMethod(method) {
    setShowPaymentPopup(false);
    setFormData(prev => ({ ...prev, paymentMethod: method }));
    // If a save was pending, continue with save
    if (pendingSaveAction) {
      handleSave(pendingSaveAction, method);
      setPendingSaveAction(null);
    }
  }

  return (
    <Sidebar>
      {isV('orderDetails') && (
        <div className="order-details-container">
          <div className={`order-details-content ${isCommentPanelOpen ? 'collapsed' : ''}`}>
            <div className="order-details-body">
              <h2 className="order-details-title">
                {formMode === 'add'
                  ? `${t('New Order')}`
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
                            defaultValue={i18n.language === 'ar' ? (formData.companyNameAr || formData.selectedCustomerName || '') : (formData.companyNameEn || formData.selectedCustomerName || '')}
                            onClick={() => setShowCustomerPopup(true)}
                            className="customer-input"
                            placeholder={t('Click to select customer')}
                            disabled={!isE('customerName')}
                            autoComplete="off"
                          />
                        </div>) : (
                        <input
                          id="customerField"
                          name="selectedCustomerName"
                          value={i18n.language === 'ar' ? (formData.companyNameAr || formData.selectedCustomerName || '') : (formData.companyNameEn || formData.selectedCustomerName || '')}
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
                            value={formData.selectedBranchName !== undefined && formData.selectedBranchName !== null ? formData.selectedBranchName : ''}
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
                            autoComplete="off"
                          />
                        </div>
                      ) : (
                        <input
                          id="erpBranchIdField"
                          name="erpBranchId"
                          value={formData.erpBranchId !== undefined && formData.erpBranchId !== null ? formData.erpBranchId : ''}
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
                        value={formData.orderBy !== undefined && formData.orderBy !== null ? formData.orderBy : ''}
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
                        value={formData.erp !== undefined && formData.erp !== null ? formData.erp : ''}
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
                          disabled={!isE('entity') || (formData.products && formData.products.length > 0)}
                        >
                          <option value="">{t('Select Entity')}</option>
                          {entityOptions.map((entity, index) => (
                            <option key={index} value={entity}>
                              {t(entity)}
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

                  {isV('category') && (
                    <div className="order-details-field">
                      <label>{t('Category')}</label>
                      {formMode === 'add' ? (
                        <Dropdown
                          name="category"
                          value={formData.category || ''}
                          onChange={handleInputChange}
                          options={
                            formData.entity && formData.entity.toLowerCase() === 'vmco'
                              ? VMCO_CATEGORIES.map(category => ({ value: category, label: category }))
                              : []
                          }
                          className="category-dropdown"
                          placeholder={t('Select Category')}
                          disabled={
                            !isE('category') ||
                            (formData.products && formData.products.length > 0) ||
                            !formData.entity ||
                            formData.entity.toLowerCase() !== 'vmco'
                          }
                        />
                      ) : (
                        <input
                          name="category"
                          value={formData.category || ''}
                          disabled
                        />
                      )}
                    </div>
                  )}

                  {isV('paymentMethod') && (
                    <div className="order-details-field">
                      <label>{t('Payment Method')}</label>
                      {formMode === 'add' ? (
                        <input
                          name="paymentMethod"
                          value={formData.paymentMethod || ''}
                          readOnly
                          placeholder={t('Click Save to select')}
                          style={{ background: '#f9f9f9', cursor: 'not-allowed' }}
                          disabled
                        />
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
                        disabled
                        readOnly
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
                        disabled
                        readOnly
                      />
                    </div>
                  )}

                  {isV('expectedDeliveryDate') && (
                    <div className="order-details-field">
                      <label>{t('Delivery Date')}</label>
                      <input
                        name="expectedDeliveryDate"
                        value={formData.expectedDeliveryDate ? formatDate(formData.expectedDeliveryDate) : ''}
                        onChange={handleInputChange}
                        disabled={!isE('expectedDeliveryDate')}
                      />
                    </div>
                  )}

                  {isV('pricingPolicy') && (
                    <div className="order-details-field">
                      <label>{t('Pricing Policy')}</label>                      <select
                        name="pricingPolicy"
                        value={formData.pricingPolicy || ''}
                        onChange={handleInputChange}
                        className="entity-dropdown"
                        disabled={!isE('pricingPolicy')}
                      >
                        <option value="">{t('Select Pricing Policy')}</option>
                        {pricingPolicyOptions.map((pricingPolicy, index) => (
                          <option key={index} value={pricingPolicy}>
                            {pricingPolicy}
                          </option>
                        ))}
                      </select>
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
                        // In add mode, require customer, branch, and entity selection
                        if (formMode === 'add') {
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
                        }
                        // In edit mode, always use values from formData (order state)
                        setShowProductPopup(true)
                      }}
                      style={{ marginBottom: 8 }}
                    >
                      {t('Add products')}
                    </button>
                  )}
                  {/* Hide table in add mode until products are selected */}                  {((formMode !== 'add') || ((formData.products || []).length > 0)) && (
                    <Table
                      columns={columns}
                      data={(formData.products || []).filter(
                        p => p.id || p.erp_prodd || p.quantity || p.unit || p.unitPrice || /*p.sugarTaxPrice || */p.netAmount || p.vatPercentage
                      )}
                      actionButtons={
                        (row) => (
                          isV('deleteButton') && isE('products') && (
                            <button className="order-action-btn reject"
                              style={{ padding: '4px 10px', fontSize: 14 }}
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteProductRow((formData.products || []).indexOf(row));
                              }}
                              type="button"
                              disabled={!isE('deleteButton') || (formData.status && formData.status.toLowerCase() !== 'open')}
                            >
                              {t('Delete')}
                            </button>
                          )
                        )
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
                    <span className={`order-status-badge status-${formData.status?.toLowerCase() || 'Open'}`}>
                      {t(formData.status) || t('Open')}
                    </span>
                  </div>
                )}

                {isV('btnSave', fromApproval, false) && isE('btnSave') && (
                  <button
                    className="order-action-btn"
                    onClick={() => handleSave('save')}
                    disabled={formData.status && formData.status.toLowerCase() !== 'open'}
                  >
                    {t('Save Changes')}
                  </button>
                )}

                {isV('btnCancel', fromApproval, false) && isE('btnCancel') && (
                  <button
                    className="order-action-btn"
                    onClick={() => handleCancelOrder('cancel order')}
                    disabled={formData.status && formData.status.toLowerCase() !== 'open'}
                  >
                    {t('Cancel Order')}
                  </button>
                )}

                {isV('btnInvoice', fromApproval, false) && isE('btnInvoice') && (
                  <button className="order-action-btn" onClick={() => handleDownloadInvoice(formData.id)}>
                    {t('Download Invoice')}
                  </button>
                )}

                {isV('btnInventory') && isE('btnInventory') && (
                  <button className="order-action-btn" onClick={() => setShowInventory(true)}>
                    {t('Get Inventory')}
                  </button>
                )}

                {isV('btnPay') && isE('btnPay') && (
                  <button className="order-action-btn" onClick={() => handleCheckout()} style={{ width: '160px', backgroundColor: '#005932', color: 'white' }}>
                    {t('Pay')}
                  </button>
                )}
                {isV('actionButtons') && fromApproval && (
                  <div className="order-details-actions">
                    {isV('btnApprove', fromApproval, true) && (
                      <button
                        className="order-action-btn approve"
                        onClick={() => handleApprovalSubmit('approve')}
                        disabled={formData.status === 'approved'}
                      >
                        {t('Approve')}
                      </button>
                    )}

                    {isV('btnReject', fromApproval, true) && (
                      <button
                        className="order-action-btn reject"
                        onClick={() => handleApprovalSubmit('reject')}
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

          {/* Comment Panel Popup */}
          <div>
            <CommentPopup
              isOpen={isCommentPanelOpen}
              setIsOpen={setIsCommentPanelOpen}
              externalComments={approvalHistory ? approvalHistory : []}
              currentUser={user}
              isVisible={fromApproval}
            />
          </div>
          {/* Rest of the component with modals and popups */}
          {isV('btnInventory') && <GetInventory open={showInventory} onClose={() => setShowInventory(false)} />}
          <Remarks open={showRemarks} onClose={() => setShowRemarks(false)} />
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
              category={formData.category}
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

          <ApprovalDialog
            isOpen={isApprovalDialogOpen}
            onClose={() => setIsApprovalDialogOpen(false)}
            action={approvalAction}
            onSubmit={handleDialogSubmit}
            customerName={formData.selectedCustomerName || formData.companyNameEn || 'this order'}
            title={approvalAction === 'approve' ? t('Approve Order') : t('Reject Order')}
            subtitle={approvalAction === 'approve' ? t('Are you sure you want to approve this order?') : t('Are you sure you want to reject this order?')}
          />

          {/* Payment Method Popup */}
          <GetPaymentMethods
            open={showPaymentPopup}
            onClose={() => setShowPaymentPopup(false)}
            onSelectPaymentMethod={handleSelectPaymentMethod}
            API_BASE_URL={API_BASE_URL}
            t={t}
            category={formData.category}
            customerId={formData.customerId}
            totalAmount={formData.totalAmount}
          />
        </div>
      )}
    </Sidebar>
  );
}

export default OrderDetails;
