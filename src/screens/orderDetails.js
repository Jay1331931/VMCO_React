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
import formatDate from '../utilities/dateFormatter';
import ApprovalDialog from '../components/ApprovalDialog';
import GetPaymentMethods from '../components/GetPaymentMethods'; // Add this import
import Dropdown from '../components/DropDown';
import Swal from 'sweetalert2';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';
import Constants from '../constants';

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
  paymentPercentage: '',
  paidAmount: '',
  deliveryCharges: '',
  branchRegion: '',
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

// Helper function to convert payment percentage from decimal to dropdown format
const convertPaymentPercentageToDropdown = (paymentPercentage) => {
  if (!paymentPercentage) return '';

  // Convert string to number for comparison
  const numValue = parseFloat(paymentPercentage);

  if (numValue === 100 || numValue === 100.00) {
    return '100%';
  } else if (numValue === 30 || numValue === 30.00) {
    return '30%';
  }

  // If it's already in percentage format, return as is
  if (typeof paymentPercentage === 'string' && paymentPercentage.includes('%')) {
    return paymentPercentage;
  }

  return '';
};

// Helper function to safely handle date values for API requests
const safeDateValue = (dateValue) => {
  if (!dateValue || (typeof dateValue === 'string' && dateValue.trim() === '')) {
    return null;
  }
  return dateValue;
};

function OrderDetails() {
  // Existing code...
  const { i18n } = useTranslation();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();  // Get form mode from location state (add, edit, view)
  const formMode = location.state?.mode || 'view';
  const orderFromNav = location.state?.order || {};
  // Get pre-fetched sales order lines from navigation state with safety check
  const salesOrderLinesFromNav = (orderFromNav && orderFromNav.salesOrderLines && Array.isArray(orderFromNav.salesOrderLines))
    ? orderFromNav.salesOrderLines
    : [];
  // Detect if coming from approval mode
  const fromApproval = location.state?.fromApproval;
  const wfid = location.state?.wfid || null;
  const approvalHistory = location.state?.approvalHistory || [];  // Initialize form data
  const [formData, setFormData] = useState({
    ...defaultOrder,
    ...orderFromNav,
    id: orderFromNav.id || '',
    // Convert payment percentage from decimal to dropdown format if needed
    paymentPercentage: convertPaymentPercentageToDropdown(orderFromNav.paymentPercentage) || orderFromNav.paymentPercentage || '',
    // Don't set products initially - let useEffect handle it to avoid race conditions
    products: []
  });
  // Effect to keep orderId in sync with formData.id
  useEffect(() => {
    setOrderId(formData.id || '');
  }, [formData.id]);

  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showRemarks, setShowRemarks] = useState(false);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [orderId, setOrderId] = useState(orderFromNav.id || '');
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [showBranchPopup, setShowBranchPopup] = useState(false);
  const [popupImage, setPopupImage] = useState(null);
  const [nextOrderId, setNextOrderId] = useState(''); const [saving, setSaving] = useState(false); // New saving state
  const [isEditMode, setIsEditMode] = useState(formMode === 'edit'); // Determine edit mode from formMode
  const [originalProducts, setOriginalProducts] = useState([]); // Track original products for comparison
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const [InventoryData, setInventoryData] = useState([]);
  const [InventoryLoading, setInventoryLoading] = useState(false);
  const [productName, setProductName] = useState('');
  const [sampleMode, setSampleMode] = useState(false); // Add this line
  // Store companyType in state
  const [companyType, setCompanyType] = useState('');

  // Add state for payment method popup and selected method
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [pendingSaveAction, setPendingSaveAction] = useState(null);  // Remove categoryOptions/products fetching and getFilteredVmcoCategories
  // Use VMCO categories from constants
  const VMCO_CATEGORIES = [
    Constants.CATEGORY.VMCO_MACHINES,
    Constants.CATEGORY.VMCO_CONSUMABLES
  ]; const paymentPercentageOptions = [
    { label: '100%', value: '100%' },
    { label: '30%', value: '30%' },
  ];

  // Pricing policy options
  const pricingPolicyOptions = ['Price A', 'Price B', 'Price C', 'Price D'];

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
  useEffect(() => {
    if (formMode === 'add') return;

    console.log('Loading sales order lines - orderFromNav.id:', orderFromNav.id);
    console.log('Pre-fetched salesOrderLinesFromNav:', salesOrderLinesFromNav);
    // If sales order lines were already provided from navigation, use them and skip fetching
    if (salesOrderLinesFromNav && Array.isArray(salesOrderLinesFromNav) && salesOrderLinesFromNav.length > 0) {
      console.log('Using pre-fetched sales order lines:', salesOrderLinesFromNav.length, 'items');
      const processedProducts = salesOrderLinesFromNav.map(product => ({
        ...product,
        id: product.productId || product.id,
        productName: product.productName || product.product_name || product.erp_prod_id,
        isMachine: product.isMachine,
        quantity: product.quantity,
      }));

      // Update formData with pre-fetched products
      setFormData(prev => ({
        ...prev,
        products: processedProducts
      }));

      setOriginalProducts(processedProducts);
      console.log('Successfully loaded pre-fetched sales order lines:', processedProducts);
      return;
    }

    // If no pre-fetched data, fetch from API
    const fetchOrderProducts = async () => {
      if (!orderFromNav.id) {
        console.log('No order ID available, skipping sales order lines fetch');
        return;
      }

      console.log('Fetching sales order lines from API for order ID:', orderFromNav.id);
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
        console.log('Fetching order products from URL:', url);
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
        console.log('Sales order lines API response:', result);

        if (result.status === 'Ok' && result.data && Array.isArray(result.data.data)) {
          // Map the product data to ensure we use productName instead of erpProdId
          const processedProducts = result.data.data.map(product => ({
            ...product,
            id: product.productId,
            productName: product.productName || product.product_name || product.erp_prod_id,
            isMachine: product.isMachine,
            quantity: product.quantity,
          }));

          console.log('Processed products from API:', processedProducts);

          setFormData(prev => ({
            ...prev,
            products: processedProducts
          }));

          // Store the original product list for comparison when saving
          setOriginalProducts(processedProducts);
          console.log('Successfully loaded sales order lines from API:', processedProducts.length, 'items');
        } else {
          console.warn('No sales order lines found in API response or invalid response structure');
          // Set empty products array if no data found
          setFormData(prev => ({
            ...prev,
            products: []
          }));
          setOriginalProducts([]);
        }
      } catch (err) {
        console.error('Error fetching sales order lines:', err);
        setError(err.message);
        // Set empty products array on error
        setFormData(prev => ({
          ...prev,
          products: []
        }));
        setOriginalProducts([]);
      }
    }; fetchOrderProducts();
    // eslint-disable-next-line
  }, [orderFromNav.id, formMode, (salesOrderLinesFromNav ? salesOrderLinesFromNav.length : 0)]); // Use length with safety check

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
      if (sampleMode) {
        updatedProducts[idx].netAmount = "0.00";
      } else {
        const unitPrice = parseFloat(updatedProducts[idx].unitPrice || 0);
        updatedProducts[idx].netAmount = (unitPrice * value).toFixed(2);
      }

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
    Swal.fire({
      title: t('Download Invoice'),
      text: `Are you sure you want to download the invoice for order ID:${orderId}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('OK')
    })
  };

  const handleSave = async (action, selectedMethod) => {
    // Prevent EDITING if payment method is Pre Payment (only applies to existing orders)
    if (formMode !== 'add' && formData.paymentMethod === 'Pre Payment') {
      alert(t('The payment method is Pre Payment. The order cannot be altered.'));
      setSaving(false);
      return;
    }

    // Perform validation before saving
    if (!formData.customerId) {
      alert(t('Please select a customer'));
      setSaving(false);
      return;
    }

    // Disable save button to prevent multiple submissions
    setSaving(true);    // For VMCO Machines category, automatically set payment method to "Pre Payment"
    const isVmcoMachinesCategory = formData.category && formData.category.toLowerCase() === Constants.CATEGORY.VMCO_MACHINES.toLowerCase();

    if (isVmcoMachinesCategory && formMode === 'add') {
       selectedMethod = 'Pre Payment';
    }  
     if (formMode === 'add' && !formData.paymentMethod && !selectedMethod) {
       const isCreditAllowed = await isCreditPaymentAllowed(formData.customerId);

      if (isCreditAllowed) {
       console.log('Auto-selecting Credit payment method as it is allowed for customer');
       selectedMethod = 'Credit';
      } else {
        setPendingSaveAction(action);
        setShowPaymentPopup(true);
        setSaving(false);
        return;
      }
    }

    // Validate product list
    if (!formData.products || formData.products.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: t('Validation Error'),
        text: t('Please add at least one product'),
      });
      // alert(t('Please add at least one product'));
      setSaving(false);
      return;
    }
    // Check if we're editing an existing order or creating a new one
    if (formData.id && isEditMode) {
      const fieldsToUpdate = [
        'erpCustId', 'erpBranchId', 'orderBy', 'entity',
        'paymentMethod', 'paymentPercentage', 'totalAmount', 'paidAmount', 'deliveryCharges',
        'expectedDeliveryDate', 'status', 'driver', 'vehicleNumber', 'branchRegion'];

      const payload = {};    // Check if category is VMCO Machines
      const isVmcoMachinesCategory = formData.category && formData.category.toLowerCase() === Constants.CATEGORY.VMCO_MACHINES.toLowerCase(); fieldsToUpdate.forEach(field => {
        if (formData[field] !== undefined && formData[field] !== null) {
          if (field === 'paymentPercentage') {
            payload[field] = formData[field] ?
              (formData[field] === '100%' ? '100.00' :
                formData[field] === '30%' ? '30.00' : '0.00') : '0.00';
          } else if (field === 'paymentMethod' && isVmcoMachinesCategory) {
            // Always set payment method to 'Pre Payment' for VMCO Machines category
            payload[field] = 'Pre Payment';
          } else if (field === 'status' && formData.entity && formData.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()) {
            // Set status to 'Pending' for vmco entity
            payload[field] = 'Pending';
          } else if (field === 'expectedDeliveryDate') {
            // Handle date fields - convert empty strings to null to avoid database errors
            payload[field] = safeDateValue(formData[field]);
          } else {
            payload[field] = formData[field];
          }
        }
      });

      // First update the sales order
      const orderResponse = await fetch(`${API_BASE_URL}/sales-order/id/${formData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      }); if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Server response:', errorData);

        // Show user-friendly error message
        Swal.fire({
          icon: 'error',
          title: t('Error'),
          text: errorData.details || errorData.message || `Failed to update order: ${orderResponse.statusText}`,
        });

        setSaving(false);
        return;
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
          const isMachine = product.isMachine;
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
        });        // Wait for all product line updates to complete
        await Promise.all(updatePromises);
      }

      // Track if any products were deleted for success message
      let productsDeleted = false;

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
          productsDeleted = true;
        } else {
          console.log('No products were removed from the order');
        }
      }
      // Refresh order details after update
      // await getOrderById(formData.id);
      // Check if this is a VMCO Machines order that needs discount workflow approval
      if ((formData.entity && formData.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()) &&
        (formData.productCategory && formData.productCategory.toLowerCase() === Constants.CATEGORY.VMCO_MACHINES.toLowerCase()) &&
        formData.customerId) {
        // Directly trigger the discount workflow without checking if it already exists
        console.log(`Directly triggering discount workflow for order ${formData.id}`);
        console.log(`- formData.entity: "${formData.entity}"`);
        console.log(`- formData.productCategory: "${formData.productCategory}"`);
        console.log(`- formData.customerId: ${formData.customerId}`);

        await triggerDiscountWorkflow(formData.id, formData.customerId);
      } else {
        console.log('Skipping discount workflow creation in order update because conditions failed:');
        console.log(`- entity is vmco (case insensitive): ${formData.entity && formData.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()}`);
        console.log(`- productCategory is vmco machines (case insensitive): ${formData.productCategory && formData.productCategory.toLowerCase() === Constants.CATEGORY.VMCO_MACHINES.toLowerCase()}`);
        console.log(`- has customerID: ${Boolean(formData.customerId)}`);
      }

      setIsEditMode(false);

      // Show specific success message based on whether products were deleted
      if (productsDeleted) {
        Swal.fire({
          icon: 'success',
          title: t('Order Updated Successfully'),
          text: t('The order has been successfully updated with product changes!'),
          confirmButtonText: t('OK')
        }).then(() => {
          window.location.reload();
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: t('Order Updated'),
          text: t('Order updated successfully!'),
          confirmButtonText: t('OK')
        }).then(() => {
          window.location.reload();
        });
      }
      // alert(t('Order updated successfully!'));
      return; // Exit function after successful update
    }

    // Create a new order if not in edit mode
    // Create a new order
    // Validation - check if essential fields are filled
    if (!formData.selectedCustomerName || !formData.selectedBranchName) {
      Swal.fire({
        icon: 'warning',
        title: t('Validation Error'),
        text: t('Customer and Branch are required fields.'),
      });
      setSaving(false);
      return;
    } if (!formData.entity) {
      Swal.fire({
        icon: 'warning',
        title: t('Validation Error'),
        text: t('Entity is a required field.'),
        confirmButtonText: t('OK')
      });
      setSaving(false);
      return;
    }
    console.log('Starting order creation process with data:', {
      customerId: formData.customerId,
      branchId: formData.branchId,
      entity: formData.entity,
      category: formData.category,
      paymentMethod: selectedMethod || formData.paymentMethod
    });

    // Skip existing order check if payment method is Pre Payment
    const isPrePayment = (selectedMethod || formData.paymentMethod) === 'Pre Payment';

    // IMPORTANT: Pre Payment orders can be created regardless of existing orders 
    // for the same customer/branch/entity. This allows multiple Pre Payment orders
    // which is the desired behavior for immediate payments.
    if (isPrePayment) {
      console.log('Payment method is Pre Payment - skipping existing order check');
    } else {
      // Check if there is an existing order with the same customer, branch, entity and status = 'Open'
      // For VMCO entity, also check the category
      // Make sure to use branchId field as it's being used in the API
      const branchIdForFilter = formData.branchId || formData.erpBranchId;

      const orderFiltersObj = formData.entity && formData.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()
        ? {
          customerId: formData.customerId,
          branchId: branchIdForFilter,
          entity: formData.entity,
          status: 'Open',
          productCategory: formData.category
        }
        : {
          customerId: formData.customerId,
          branchId: branchIdForFilter,
          entity: formData.entity,
          status: 'Open'
        };

      console.log('Order filter object created:', orderFiltersObj);
      const orderFilters = new URLSearchParams({
        filters: JSON.stringify(orderFiltersObj)
      });

      console.log('Checking for existing orders with filters:', orderFiltersObj);

      try {
        const existingOrderResponse = await fetch(`${API_BASE_URL}/sales-order/pagination?${orderFilters}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        console.log('Existing order response status:', existingOrderResponse.status);

        if (!existingOrderResponse.ok) {
          throw new Error(`Failed to check existing orders: ${existingOrderResponse.statusText}`);
        }

        const existingOrderResult = await existingOrderResponse.json();
        console.log('Existing order search results:', existingOrderResult);

        if (existingOrderResult.data?.data?.length > 0) {
          console.log('Found existing order(s):', existingOrderResult.data.data);
          const entityName = formData.entity.charAt(0).toUpperCase() + formData.entity.slice(1).toLowerCase();
          Swal.fire({
            icon: 'warning',
            title: t('Order Already Exists'),
            text: t(`An open order already exists for this ${entityName} with the same customer, branch, and entity. Please check the existing orders before creating a new one.`),
            confirmButtonText: t('OK')
          });
          navigate('/orders');
          setSaving(false);
          return;
        } else {
          console.log('No existing orders found with these criteria, proceeding with order creation');
        }
      } catch (error) {
        console.error('Error checking for existing orders:', error);
        // Continue with order creation even if checking fails
      }
    }

    let attempt = 0;
    let maxAttempts = 2;
    // Step 0: If user is employee, fetch empId from employees table using email
    let orderByName = '';
    const userEmail = user?.email;
    if (userEmail) {
      try {
        if (user?.userType === 'employee') {
          const empRes = await fetch(`http://localhost:3000/api/employees/email/${encodeURIComponent(userEmail)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
          if (empRes.ok) {
            const empResult = await empRes.json();
            if (empResult && empResult.data && empResult.data.name) {
              orderByName = empResult.data.name;
            }
          }
        } else if (user?.userType === 'customer') {
          const response = await fetch(`http://localhost:3000/api/customer-contacts/email/${encodeURIComponent(userEmail)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
          if (response.ok) {
            const result = await response.json();
            if (result && result.data && result.data.name) {
              orderByName = result.data.name;
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch orderBy name:', error);
      }
    }
    while (attempt < maxAttempts) {
      // Prepare payload for backend - only include defined fields, default to '' for missing optional fields
      const payload = {
        customerId: formData.customerId || '',
        companyNameEn: formData.companyNameEn || '', // Always use value from formData
        companyNameAr: formData.companyNameAr || '', // Always use value from formData
        erpCustId: formData.erpCustId,
        branchId: formData.branchId || '',
        erpBranchId: formData.erpBranchId || '',
        branchNameEn: formData.branchNameEn || '', // Always use value from formData      
        branchNameLc: formData.branchNameLc || '', // Always use value from formData        
        branchRegion: formData.branchRegion || '', // Include branch region
        branchCity: formData.branchCity || '', // Include branch city        
        orderBy: orderByName, // <-- Use fetched employee name here
        paymentMethod: formData.category && formData.category.toLowerCase() === Constants.CATEGORY.VMCO_MACHINES.toLowerCase()
          ? 'Pre Payment'
          : (selectedMethod || formData.paymentMethod || ''),
        paymentPercentage: '100.00', // Always set to 100.00 when creating sales orders
        //status: formData.entity && formData.entity.toLowerCase() === 'vmco' ? 'Pending' : 'Open',
        status: sampleMode ? 'approved' : 'Open',
        sales_executive: user.employeeId,
        paymentStatus: (selectedMethod || formData.paymentMethod) === 'Credit' ? 'Paid' : 'Pending', // <-- Use selectedMethod for logic
        entity: formData.entity || '',
        deliveryCharges: formData.deliveryCharges || '0',
        totalAmount: formData.totalAmount || '0',
        pricingPolicy: formData.pricingPolicy || '',
        customerRegion: formData.customerRegion || '',
        productCategory: formData.category || '',
        sample_order: sampleMode
      };
      try {
        setLoading(true);
        console.log('Submitting order payload:', payload);
        console.log('Branch-related fields in payload:', {
          branchId: payload.branchId,
          erpBranchId: payload.erpBranchId,
          branchNameEn: payload.branchNameEn,
          branchNameLc: payload.branchNameLc
        });
        console.log('Proceeding to create a new order - no duplicates found');

        // Step 1: Create the order first
        console.log('Making API call to create sales order');
        const response = await fetch(`${API_BASE_URL}/sales-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
        console.log('Sales order API response status:', response.status);
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
              sortOrder: 'asc',
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
        }            // Parse the response as JSON to get the inserted row's id
        const result = await response.json();
        console.log('Order creation result:', result);
        console.log('Sales order created successfully with ID:', result.data?.id);

        if (!result.data || !result.data.id) {
          console.error('No order ID returned from API - cannot proceed');
          throw new Error('Order ID not returned from API');
        }
        console.log('Preparing to create order line items for products');

        // Prepare products payload, set sales_executive to empId if user is employee
        const productsPayload = formData.products.map((product, index) => {
          let vat = product.vatPercentage;
          if (companyType && companyType.toLowerCase() === 'non trading') {
            vat = 0.00;
          }
          return {
            order_id: result.data.id,
            line_number: index + 1,
            erp_line_number: index + 1,
            product_id: product.id || product.product_id,
            product_name: product.productName || product.product_name_en,
            product_name_lc: product.productNameLc || product.product_name_lc || '', // <-- post productNameLc
            erp_prod_id: product.erpProdId || product.erp_prod_id || '',
            is_machine: product.isMachine || product.is_machine,
            quantity: parseInt(product.quantity || 1, 10),
            unit: product.unit || '',
            unit_price: parseFloat(product.unitPrice),
            net_amount: parseFloat(product.netAmount),
            vat_percentage: Number(vat).toFixed(2),
          };
        });

        console.log('Submitting products payload:', productsPayload); 
        if (productsPayload.length === 0) {
          console.warn('No valid products to submit');
          Swal.fire({
            icon: 'info',
            title: t('Order Created'),
            html: `<div style="text-align: center;">
                    <p style="font-size: 16px; margin-bottom: 10px;">${t('Order created successfully, but no products were added.')}</p>
                    <p style="font-size: 18px; font-weight: bold; color: #17a2b8; margin: 10px 0;">
                        ${t('Order Number')}: #${result.data.id}
                    </p>
                    <p style="font-size: 14px; color: #666;">${t('Order placed using')} ${payload.paymentMethod}</p>
                  </div>`,
            confirmButtonText: t('OK')
          });
          // alert(t('Order created successfully, but no products were added.'));
          navigate('/orders');
          return;
        }

        console.log(`Prepared ${productsPayload.length} product line items for submission`); try {
          console.log('Making API call to create sales order line items');
         // productsPayload[0].is_machine=true
          const linesResponse = await fetch(`${API_BASE_URL}/sales-order-lines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productsPayload),
            credentials: 'include',
          });
          console.log('Sales order lines API response status:', linesResponse.status);

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

          console.log('Sales order line items created successfully');              // If we get here, both order and products were saved successfully
          console.log('Complete order creation process finished successfully');          // Check if this is a VMCO Machines order that needs discount workflow approval
          if ((formData.entity && formData.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()) &&
            (formData.productCategory && formData.productCategory.toLowerCase() === Constants.CATEGORY.VMCO_MACHINES.toLowerCase()) &&
            formData.customerId) {
            // Directly trigger the discount workflow without checking if it already exists
            console.log(`Directly triggering discount workflow for order ${result.data.id}`);
            console.log(`- formData.entity: "${formData.entity}"`);
            console.log(`- formData.productCategory: "${formData.productCategory}"`);
            console.log(`- formData.customerId: ${formData.customerId}`);

            await triggerDiscountWorkflow(result.data.id, formData.customerId);
          } else {
            console.log('Skipping discount workflow creation in order creation because conditions failed:');
            console.log(`- entity is vmco (case insensitive): ${formData.entity && formData.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()}`);
            console.log(`- productCategory is vmco machines (case insensitive): ${formData.productCategory && formData.productCategory.toLowerCase() === Constants.CATEGORY.VMCO_MACHINES.toLowerCase()}`);
            console.log(`- has customerID: ${Boolean(formData.customerId)}`);
          }          // If we get here, both order and products were saved successfully
          Swal.fire({
            icon: 'success',
            title: t('Order Created Successfully!'),
            html: `<div style="text-align: center;">
                    <p style="font-size: 16px; margin-bottom: 10px;">${t('Order and products created successfully!')}</p>
                    <p style="font-size: 18px; font-weight: bold; color: #28a745; margin: 10px 0;">
                        ${t('Order Number')}: #${result.data.id}
                    </p>
                    <p style="font-size: 14px; color: #666;">${t('Please save this order number for your records.')}</p>
                  </div>`,
            confirmButtonText: t('OK'),
            confirmButtonColor: '#28a745'
          });
          navigate('/orders');
        } catch (err) {
          console.error('Error saving product lines:', err);
          console.log('Product line items creation failed, but order was created successfully');
          // Even if product lines failed, the order was created successfully
          Swal.fire({
            icon: 'warning',
            title: t('Order Created with Issues'),
            html: `<div style="text-align: center;">
                    <p style="font-size: 16px; margin-bottom: 10px;">${t('Order created successfully, but there was an issue adding products: ') + err.message}</p>
                    <p style="font-size: 18px; font-weight: bold; color: #ff9500; margin: 10px 0;">
                        ${t('Order Number')}: #${result.data.id}
                    </p>
                    <p style="font-size: 14px; color: #666;">${t('Please save this order number for your records.')}</p>
                  </div>`,
            confirmButtonText: t('OK')
          });
          // alert(t('Order created successfully, but there was an issue adding products: ') + err.message);
          navigate('/orders');
        }
        break; // Exit the loop on success
      } catch (err) {
        if (attempt >= maxAttempts - 1) {
          setError(err.message);
          Swal.fire({
            icon: 'error',
            title: t('Error Saving Order'),
            text: t(err.message),
          })
          // alert(t(err.message));
        }
      } finally {
        setLoading(false);
      } attempt++;
    }    // Always reset saving state at the end
    setSaving(false);
  };

  // cancel handler
  const handleCancelOrder = async () => {
    if (!formData.id) {
      Swal.fire({
        icon: 'warning',
        title: t('Validation Error'),
        text: t('Order ID is missing.'),
        confirmButtonText: t('OK')
      });
      // alert(t('Order ID is missing.'));
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
      Swal.fire({
        icon: 'success',
        title: t('Order Cancelled'),
        text: t('Order status updated to Cancelled!'),
        confirmButtonText: t('OK')
      });
      // alert(t('Order status updated to Cancelled!'));
      navigate('/orders'); // or refresh the current view if needed
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(err.message);
      Swal.fire({
        icon: 'error',
        title: t('Error Cancelling Order'),
        text: err.message || t('Failed to cancel order: '),
        confirmButtonText: t('OK')
      });
      // alert(t(err.message));
    } finally {
      setLoading(false);
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

    if (name === 'entity' && formMode === 'add') {
      // If entity changes in add mode, update payment percentage accordingly
      // Set payment percentage to 100% if entity is not vmco
      const isVmco = value.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase();

      setFormData((prev) => ({
        ...prev,
        [name]: value,
        // Set payment percentage to 100% for any entity other than vmco
        paymentPercentage: !isVmco ? '100%' : (prev.paymentPercentage || '30%')
      }));
    } else if (name === 'category' && formMode === 'add') {      // If category changes in add mode, update payment percentage accordingly
      // and set payment method to "Pre Payment" for "VMCO Machines" category
      const isVmcoMachines = value === Constants.CATEGORY.VMCO_MACHINES;

      setFormData((prev) => ({
        ...prev,
        [name]: value,      // Set payment percentage based on category
        paymentPercentage: !isVmcoMachines ? '100%' : (prev.paymentPercentage || '30%'),
        // Automatically set paymentMethod to "Pre Payment" for VMCO Machines category
        paymentMethod: isVmcoMachines ? 'Pre Payment' : prev.paymentMethod
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }

    // If pricing policy changes, update product prices
    if (name === 'pricingPolicy' && formData.customerId) {
      updateProductPricesForPricingPolicy(value);
    }
  };

  const handleEntityChange = (e) => {
    // Check if customer is selected
    if (!formData.customerId && !formData.selectedCustomerName) {
      // No customer selected, show alert
      Swal.fire({
        icon: 'warning',
        title: t('Select Customer First'),
        text: t('Please select a customer before choosing an entity.'),
        confirmButtonText: t('OK')
      });
      // Reset the dropdown to empty value
      e.target.value = '';
      return;
    }

    // Customer is selected, proceed with normal input handling
    handleInputChange(e);
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
            const isMachine = result.data.isMachine || product.isMachine;
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
      Swal.fire({
        icon: 'error',
        title: t('Error Updating Prices'),
        text: t('Failed to update product prices. Please try again.'),
        confirmButtonText: t('OK')
      });
      // alert(t('Failed to update prices. Please try again.'));
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
      // Find the product object to get productName, productNameLc, unit
      const productObj = formData.products.find(
        p => (p.id || p.product_id) === productId
      );
      const payload = {
        order_id: orderId,
        product_id: productId,
        isMachine: productObj?.isMachine || productObj?.is_machine,
        quantity: parseInt(quantity, 10),
        unit_price: parseFloat(unitPrice),
        net_amount: parseFloat(netAmount),
        sales_tax_amount: Number(finalVat).toFixed(2),
        product_name: productObj?.productName || productObj?.product_name_en || '',
        product_name_lc: productObj?.productNameLc || productObj?.product_name_lc || '',
        unit: productObj?.unit || '',
        vat_percentage: Number(finalVat).toFixed(2),
        //salesExecutive: salesExecutive
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
    // In sample mode, set price to 0, otherwise use the actual price
    const unitPrice = sampleMode ? 0 : parseFloat(product.unitPrice);
    // Determine VAT based on companyType and sample mode
    let vatPercentage = 0.00;
    if (!sampleMode && companyType && companyType.toLowerCase() === 'trading') {
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
        // In sample mode, netAmount is always 0
        const newNetAmount = sampleMode ? "0.00" :
          ((unitPrice * newQuantity) + (vatPercentage ? (vatPercentage / 100 * (unitPrice * newQuantity)) : 0)).toFixed(2);

        updatedProducts[existingIdx] = {
          ...existingProduct,
          quantity: newQuantity,
          netAmount: newNetAmount,
          moq: moq,
          vatPercentage: vatPercentage,
          // In sample mode, unitPrice is always 0
          unitPrice: sampleMode ? "0.00" : existingProduct.unitPrice,
          // Keep both names updated
          productName: product.productName,
          productNameLc: product.productNameLc
        };
        return {
          ...prev,
          products: updatedProducts
        };
      } else {
        // Product does not exist, add as new row with MOQ as quantity
        // In sample mode, netAmount is always 0
        const netAmount = sampleMode ? "0.00" :
          ((unitPrice * moq) + (vatPercentage ? (vatPercentage / 100 * (unitPrice * moq)) : 0)).toFixed(2);

        const newProduct = {
          id: product.id,
          product_id: product.id,
          productName: product.productName,
          productNameLc: product.productNameLc,
          erpProdId: product.erpProdId || product.erp_prod_id || '',
          quantity: moq,
          unit: product.unit,
          // In sample mode, unitPrice is always 0
          unitPrice: sampleMode ? "0.00" : unitPrice.toFixed(2),
          netAmount: netAmount,
          vatPercentage: vatPercentage,
          moq: moq
        };
        return {
          ...prev,
          products: [
            ...prev.products,
            newProduct
          ]
        };
      }
    });
    setShowProductPopup(false);
  };
  // Handle customer selection
  const handleSelectCustomer = (customer) => {
    console.log('Selected customer:', customer);

    // Handle assignedToEntityWise which could be an object or a JSON string
    let assignedToEntityWise = {};
    if (customer.assignedToEntityWise) {
      try {
        // Check if it's already an object
        if (typeof customer.assignedToEntityWise === 'object' && customer.assignedToEntityWise !== null) {
          assignedToEntityWise = customer.assignedToEntityWise;
        } else {
          // It's a string, try to parse it
          assignedToEntityWise = JSON.parse(customer.assignedToEntityWise);
        }
        console.log('Processed assignedToEntityWise:', assignedToEntityWise);
      } catch (error) {
        console.error('Error processing assignedToEntityWise:', error);
        assignedToEntityWise = {};
      }
    }

    // Format the current user's employee ID to match the format in assignedToEntityWise
    const currentEmployeeId = formatEmployeeId(user?.employeeId);
    console.log('Current formatted employee ID:', currentEmployeeId);

    const userAllowedEntities = [];
    if (currentEmployeeId && assignedToEntityWise) {
      // Find entities where this employee is assigned
      Object.entries(assignedToEntityWise).forEach(([entity, empId]) => {
        if (empId === currentEmployeeId) {
          userAllowedEntities.push(entity);
        }
      });
    }

    console.log('User allowed entities:', userAllowedEntities);
    setAllowedEntities(userAllowedEntities);

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
      pricingPolicy: customer.pricingPolicy,
      companyNameEn: customer.company_name_en || customer.companyNameEn || '', // Set companyNameEn
      companyNameAr: customer.company_name_ar || customer.companyNameAr || '', // Set companyNameAr
      salesExecutive: customer.assignedToEntityWise,
      assignedToEntityWise: assignedToEntityWise,
      customerRegion: customer.region || ''
    }));

    setShowCustomerPopup(false);
  };
  // Handle branch selection
  const handleSelectBranch = (branch) => {
    console.log('Selected branch data:', branch);
    setFormData(prev => ({
      ...prev,
      branchId: branch.id, // Set branchId (important for API calls)
      erpBranchId: branch.erp_branch_id || branch.erpBranchId,
      selectedBranchName: branch.branch_name_en || branch.branchNameEn || '',
      branchNameEn: branch.branch_name_en || branch.branchNameEn || '', // Set branchNameEn
      branchNameLc: branch.branch_name_lc || branch.branchNameLc || '', // Set branchNameLc
      branchRegion: branch.region, // Set branchRegion
      branchCity: branch.city // Set branchCity
    }));
    console.log('Updated form data with branch information');
    setShowBranchPopup(false);
  };

  // Add this to your state declarations section near the top of the component
  const [allowedEntities, setAllowedEntities] = useState([]);

  // Add this function inside the OrderDetails component, before the return statement
  // Function to format employee ID to match assignedToEntityWise format
  const formatEmployeeId = (id) => {
    if (!id) return '';
    // If it already has the format emp_XXXX, return as is
    if (typeof id === 'string' && id.startsWith('emp_')) return id;
    // Otherwise, add the prefix
    return `emp_${id}`;
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
  }, [user, t, token, i18n.language, orderFromNav.id, formMode, loading]
  );


  // Initialize RBAC manager
  const rbacMgr = new RbacManager(
    user?.userType === 'employee' && user?.roles[0] !== 'admin' ? user?.designation : user?.roles[0],
    formMode === 'add' ? 'orderDetailAdd' : 'orderDetailEdit'
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  // Function to handle Product Stock Availability
  const handleStock = async (productId, productName) => {
    try {
      setInventoryLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/product-inventory-avalability/${productId}`,
        { withCredentials: true });

      setProductName(productName);
      setInventoryData(data?.details || []);
      setInventoryLoading(false);
      setShowInventory(true);
    }
    catch (error) {
      console.error('Error fetching stock information:', error);
      Swal.fire({
        icon: 'error',
        title: t('Error Fetching Stock'),
        text: t('Failed to fetch stock information for the product.'),
        confirmButtonText: t('OK')
      });
    }
    finally {
      setInventoryLoading(false);
    }

  }
  // Table columns
  const columns = [
    { key: 'id', header: () => t('Product ID'), include: isV('productIdCol') },
    {
      key: 'productName',
      header: () => t('Product Name'),
      render: (row) =>
        i18n.language === 'ar'
          ? (row.productNameLc || row.product_name_lc || row.productName)
          : (row.productName || row.product_name_en || row.productNameLc),
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
          {isV('stock') &&
            formData.entity &&
            formData.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase() &&
            row.isMachine === true && (
              <span>
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
                  onClick={() => handleStock(row.id, i18n.language === 'ar'
                    ? (row.productNameLc || row.product_name_lc || row.productName)
                    : (row.productName || row.product_name_en || row.productNameLc))
                  }
                >
                  {t('Stock')}
                </button>
              </span>
            )}
          {InventoryLoading && <LoadingSpinner />}
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
    ...(isE('deleteCol') ? [{ key: 'actions', header: () => t('Actions') }] : [])
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
          sortOrder: 'asc',
          purpose: 'order creation'
        });
        console.log('Fetching customer options with params:', params.toString());
        const response = await fetch(`${API_BASE_URL}/customers/pagination?${params.toString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to fetch customer options');

        const result = await response.json();
        console.log('Customer options response:', result);
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
    // If it's a sample order, always set totalAmount to 0.00
    if (sampleMode || formData.sample_order) {
      if (formData.totalAmount !== '0.00') {
        setFormData(prev => ({ ...prev, totalAmount: '0.00' }));
      }
      return;
    }

    // For non-sample orders, calculate the total as before
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
  }, [formData.products, formData.totalAmount, formData.deliveryCharges, sampleMode, formData.sample_order]);

  // Calculate deliveryCharges and totalAmount based on entity and products
  useEffect(() => {
    if (sampleMode || formData.sample_order) {
      // In sample mode, delivery charges and total amount are always 0
      setFormData(prev => ({
        ...prev,
        deliveryCharges: '0.00',
        totalAmount: '0.00'
      }));
      return;
    }

    let deliveryCharges = '0.00';
    let total = 0;
    if (Array.isArray(formData.products) && formData.products.length > 0) {
      total = formData.products.reduce((sum, p) => {
        const net = parseFloat(p.netAmount) || 0;
        return sum + net;
      }, 0);      // Delivery charges logic
      if (formData.entity && formData.entity.toLowerCase() !== Constants.ENTITY.VMCO.toLowerCase()) {
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
  }, [formData.products, formData.entity, formData.deliveryCharges, formData.totalAmount, sampleMode, formData.sample_order]);

  // Set payment percentage based on category
  useEffect(() => {
    // Only auto-set payment percentage in add mode
    if (formMode === 'add') {
      // For initial load or when category changes
      if (formData.category && formData.category !== 'VMCO Machines') {
        // For non-VMCO Machines categories, set default to 100%
        setFormData(prev => ({
          ...prev,
          paymentPercentage: 100
        }));
      }
    }
  }, [formMode, formData.category]);

  // Fetch order products
  useEffect(() => {
    async function fetchOrderProducts() {
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
            isMachine: product.isMachine,
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
    }

    if (orderId) {
      fetchOrderProducts();
    }
  }, [orderId]);

  // Function to get order details by ID
  const getOrderById = async (id) => {
    if (!id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/sales-order/id/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch order details'); const result = await response.json();
      if (result.status === 'Ok' && result.data) {
        console.log("Order details received in getOrderById:", result.data);
        setFormData({
          ...result.data,
          expectedDeliveryDate: result.data.expectedDeliveryDate || '',
          products: result.data.products || []
        });      // Also fetch the order lines by updating orderId which triggers useEffect
        setOrderId(id);
      } else {
        throw new Error(result.message || 'Order not found');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.message);
    }
  };

  // Note: checkWorkflowInstance function removed as we're now directly creating workflow instances
  // Function to directly create a discount workflow instance regardless of whether one already exists
  const triggerDiscountWorkflow = async (orderId, customerId) => {
    try {      // Validate inputs with detailed checking
      if (!orderId || orderId === null || orderId === undefined) {
        console.error("Missing or invalid orderId in triggerDiscountWorkflow:", orderId);
        return false;
      }

      if (!customerId || customerId === null || customerId === undefined) {
        console.error("Missing or invalid customerId in triggerDiscountWorkflow:", customerId);
        return false;
      }

      // Validate required environment variables and auth
      if (!API_BASE_URL) {
        console.error("API_BASE_URL is not defined. Check your environment variables.");
        return false;
      }

      if (!token) {
        console.error("Authentication token is not available. User may not be logged in.");
        return false;
      }

      // Ensure values are properly converted to strings and are valid
      let orderIdStr, customerIdStr;

      try {
        orderIdStr = String(orderId).trim();
        customerIdStr = String(customerId).trim();
      } catch (err) {
        console.error("Error converting IDs to strings:", err);
        return false;
      }

      // Final validation of string conversion
      if (!orderIdStr || orderIdStr === 'null' || orderIdStr === 'undefined') {
        console.error("OrderId converted to invalid string:", orderIdStr);
        return false;
      }

      if (!customerIdStr || customerIdStr === 'null' || customerIdStr === 'undefined') {
        console.error("CustomerId converted to invalid string:", customerIdStr);
        return false;
      } const payload = {
        customerId: customerIdStr,
        salesOrderId: orderIdStr
      };

      // Final payload validation
      console.log('Final payload validation:');
      console.log('- payload:', JSON.stringify(payload));
      console.log('- customerId length:', customerIdStr.length);
      console.log('- salesOrderId length:', orderIdStr.length);

      // Ensure payload values are not empty strings
      if (!payload.customerId || !payload.salesOrderId) {
        console.error("Payload contains empty strings:", payload);
        return false;
      }

      console.log('Directly creating discount workflow with payload:', payload);
      console.log(`API URL: ${API_BASE_URL}/workflow-instance/create/vmco/machines/discount`);
      console.log('Token available:', !!token);

      // Note: The backend should handle duplicate workflow instances gracefully
      const response = await fetch(`${API_BASE_URL}/workflow-instance/create/vmco/machines/discount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Adding Authorization header with token
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      console.log('Discount workflow API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error triggering discount workflow (status: ${response.status}):`, errorText);
        try {
          // Try to parse the error as JSON for more details
          const errorJson = JSON.parse(errorText);
          console.error('Error details:', errorJson);
        } catch (e) {
          // If parsing fails, just log the raw text
          console.error('Raw error response:', errorText);
        }
        return false;
      }

      const result = await response.json();
      console.log('Discount workflow triggered successfully:', result);
      return true;
    } catch (err) {
      console.error('Error triggering discount workflow (exception):', err);
      console.error(err.stack || 'No stack trace available');
      return false;
    }
  };

  //discount approval code block end -----------------------------------------------------------------------------------------------------

  const handleApprovalSubmit = (action) => {
    setApprovalAction(action);
    setIsApprovalDialogOpen(true);
  };  // Handle dialog submit for order approval/rejection just like in customersDetails.js
  const handleDialogSubmit = async (comment) => {
    // Build workflowData payload (add updates if needed, similar to customersDetails)
    let updates = { ...((location.state?.workflowData && location.state.workflowData.updates) || {}) };
    // If you need to add more update logic for orders, do it here

    try {
      // Ensure we have the latest order data
      console.log("Getting latest order data before proceeding with approval");
      await getOrderById(formData.id);

      // STEP 1: First update sales order lines and sales order if needed
      // --- BEGIN: PATCH order lines and order if approving in approval mode and status is pending ---
      if (approvalAction === 'approve' && fromApproval && formData.status && formData.status.toLowerCase() === 'pending') {
        try {
          console.log("Updating sales order lines and sales order before approval");

          // 1. Update existing sales order lines and create new ones
          for (const product of formData.products) {
            const productId = product.id || product.product_id;
            const unitPrice = parseFloat(product.unitPrice);
            const isMachine = product.isMachine;
            const quantity = parseInt(product.quantity, 10);
            const netAmount = parseFloat(product.netAmount);
            const vatPercentage = parseFloat(product.vatPercentage || 0);

            // Check if this product exists in the original products (was part of the original order)
            const existsInOriginal = originalProducts.some(originalProduct =>
              (originalProduct.id || originalProduct.product_id) === productId
            );
            if (existsInOriginal) {
              // Product exists in original order - PATCH to update it
              console.log(`Updating existing product line: ${productId}`);
              const patchResponse = await fetch(`${API_BASE_URL}/sales-order-lines/${formData.id}/${productId}`, {
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

              if (!patchResponse.ok) {
                const errorText = await patchResponse.text();
                throw new Error(`Failed to update product line ${productId}: ${errorText}`);
              }
            } else {
              // Product is new - POST to create it
              console.log(`Creating new product line: ${productId}`);
              const postResponse = await fetch(`${API_BASE_URL}/sales-order-lines`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: formData.id,
                  productId: productId,
                  productName: product.productName || product.product_name_en || '',
                  productNameLc: product.productNameLc || product.product_name_lc || '',
                  isMachine: product.isMachine || product.is_machine,
                  quantity,
                  unitPrice,
                  net_amount: netAmount.toFixed(2),
                  vatPercentage: product.vatPercentage.toFixed(2),
                  erpProdId: product.erpProdId || product.erp_prod_id || '',
                  unit: product.unit || ''
                }),
                credentials: 'include',
              });

              if (!postResponse.ok) {
                const errorText = await postResponse.text();
                throw new Error(`Failed to create new product line ${productId}: ${errorText}`);
              }
            }
          }

          // 2. Update the sales order's totalAmount and payment percentage
          // Prepare the payload for PATCH
          const patchPayload = {
            totalAmount: formData.totalAmount,
            paymentPercentage: formData.paymentPercentage ?
              (formData.paymentPercentage === '100%' ? '100.00' :
                formData.paymentPercentage === '30%' ? '30.00' : '0.00') : '0.00'
          };
          // If pricingPolicy is present, include it in the update
          if (formData.pricingPolicy) {
            patchPayload.pricingPolicy = formData.pricingPolicy;
          }

          console.log("Updating sales order with payload:", patchPayload);
          const orderUpdateResponse = await fetch(`${API_BASE_URL}/sales-order/id/${formData.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patchPayload),
            credentials: 'include',
          });

          if (!orderUpdateResponse.ok) {
            const errorText = await orderUpdateResponse.text();
            throw new Error(`Failed to update sales order: ${errorText}`);
          }

          console.log("Successfully updated sales order lines and sales order");
        } catch (err) {

          Swal.fire({
            icon: 'error',
            title: t('Error Updating Order'),
            text: t('Failed to update order or lines before approval: ') + (err.message || err),
            confirmButtonText: t('OK')
          });
          return;
        }
      }

      // --- END: PATCH order lines and order if approving in approval mode and status is pending ---      // STEP 2: Directly create discount workflow without checking if it exists
      console.log("Creating discount workflow instance...");
      console.log("formData:", {
        id: formData.id,
        entity: formData.entity,
        productCategory: formData.productCategory,
        customerId: formData.customerId
      });

      // Additional debugging for the IDs
      console.log("Detailed formData validation:");
      console.log(`- formData.id type: ${typeof formData.id}, value: ${formData.id}`);
      console.log(`- formData.customerId type: ${typeof formData.customerId}, value: ${formData.customerId}`);      // Use case-insensitive comparison for entity
      if ((formData.entity && formData.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()) &&
        (formData.productCategory && formData.productCategory.toLowerCase() === Constants.CATEGORY.VMCO_MACHINES.toLowerCase()) &&
        formData.customerId && formData.id) {

        // Additional validation before calling the workflow
        if (formData.id && formData.customerId &&
          formData.id !== null && formData.id !== undefined &&
          formData.customerId !== null && formData.customerId !== undefined) {

          console.log(`Directly triggering discount workflow for order ${formData.id} with customer ${formData.customerId}`);
          const workflowTriggered = await triggerDiscountWorkflow(formData.id, formData.customerId);
          console.log(`Discount workflow triggered: ${workflowTriggered}`);
        } else {
          console.error("Cannot trigger discount workflow - invalid ID values:");
          console.error(`- orderId: ${formData.id} (type: ${typeof formData.id})`);
          console.error(`- customerId: ${formData.customerId} (type: ${typeof formData.customerId})`);
        }
      } else {
        console.log("Skipping discount workflow - not a VMCO Machines order or missing customer ID");
        console.log(`- entity: ${formData.entity}`);
        console.log(`- entity.toLowerCase() === 'vmco': ${formData.entity && formData.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()}`);
        console.log(`- productCategory: ${formData.productCategory}`);
        console.log(`- productCategory.toLowerCase() === 'vmco machines': ${formData.productCategory && formData.productCategory.toLowerCase() === Constants.CATEGORY.VMCO_MACHINES.toLowerCase()}`);
        console.log(`- customerId: ${Boolean(formData.customerId)}`);
      }


      // STEP 3: Submit the approval for the sales order
      const payload = {
        workflowData: {
          ...(location.state?.workflowData || {}),
          updates
        },
        approvedStatus: approvalAction === 'approve' ? 'approved' : 'rejected',
        comment: comment
      };

      console.log("Submitting sales order approval with payload:", payload);

      const res = await fetch(`${API_BASE_URL}/workflow-instance/id/${wfid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: t('Approved Successfully'),
          text: t(`${approvalAction.charAt(0).toUpperCase() + approvalAction.slice(1)} successful!`),
          confirmButtonText: t('OK')
        });
        // alert(t(`${approvalAction.charAt(0).toUpperCase() + approvalAction.slice(1)} successful!`));
        setIsApprovalDialogOpen(false);
        navigate('/orders');
      } else {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to submit approval');
      }
    } catch (error) {
      console.error(`Error ${approvalAction}ing order:`, error);
      Swal.fire({
        icon: 'error',
        title: t('Error Submitting Approval'),
        text: t(`Error ${approvalAction}ing order: ${error.message}`),
        confirmButtonText: t('OK')
      });
      // alert(t(`Error ${approvalAction}ing order: ${error.message}`));
      setIsApprovalDialogOpen(false);
    }
  };

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
  // Debug effect to monitor products loading
  useEffect(() => {
    console.log('formData.products changed:', {
      count: (formData.products && formData.products.length) ? formData.products.length : 0,
      products: formData.products,
      mode: formMode,
      fromApproval,
      orderId: orderFromNav.id
    });
  }, [(formData.products ? formData.products.length : 0), formMode, fromApproval, orderFromNav.id]);
  // Safety effect to handle late-arriving pre-fetched data
  useEffect(() => {
    if (formMode === 'add') return;

    // If we have pre-fetched data but no products loaded yet, load them
    if (salesOrderLinesFromNav && salesOrderLinesFromNav.length > 0 && formData.products && formData.products.length === 0) {
      console.log('Late-loading pre-fetched sales order lines');
      const processedProducts = salesOrderLinesFromNav.map(product => ({
        ...product,
        id: product.productId || product.id,
        productName: product.productName || product.product_name || product.erp_prod_id,
        isMachine: product.isMachine,
        quantity: product.quantity,
      }));

      setFormData(prev => ({
        ...prev,
        products: processedProducts
      }));

      setOriginalProducts(processedProducts);
      console.log('Late-loaded pre-fetched sales order lines:', processedProducts);
    }
  }, [salesOrderLinesFromNav, (formData.products ? formData.products.length : 0), formMode]);

  // Function to check if credit payment is allowed for the customer (without balance check)
  const isCreditPaymentAllowed = async (customerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment-method/id/${customerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('Failed to fetch payment method details');
        return false;
      }

      const result = await response.json();
      console.log('Payment method details response:', result);

      if (result.status === 'Ok' && result.data && result.data.methodDetails) {
        const methodDetails = result.data.methodDetails;
        // Check if credit is allowed (without balance validation)
        if (methodDetails.credit && methodDetails.credit.isAllowed === true) {
          console.log('Credit payment is allowed for customer');
          return true;
        }
      }

      console.log('Credit payment is not allowed for customer');
      return false;
    } catch (error) {
      console.error('Error checking credit payment allowance:', error);
      return false;
    }
  };

  // Auto-select credit payment method when customer is selected and credit is allowed
  useEffect(() => {
    const autoSelectCreditPayment = async () => {
      // Only auto-select in add mode and when no payment method is already selected
      if (formMode === 'add' && formData.customerId && !formData.paymentMethod) {        // Skip auto-selection for VMCO Machines category as it should use Pre Payment
        const isVmcoMachinesCategory = formData.category && formData.category.toLowerCase() === Constants.CATEGORY.VMCO_MACHINES.toLowerCase();
        if (isVmcoMachinesCategory) {
          return;
        }

        try {
          const isCreditAllowed = await isCreditPaymentAllowed(formData.customerId);
          if (isCreditAllowed) {
            console.log('Auto-selecting Credit payment method for customer:', formData.customerId);
            setFormData(prev => ({ ...prev, paymentMethod: 'Credit' }));
          }
        } catch (error) {
          console.error('Error checking credit payment allowance for auto-selection:', error);
        }
      }
    };

    autoSelectCreditPayment();
  }, [formData.customerId, formData.category, formMode, formData.paymentMethod]);

  return (
    <Sidebar>
      {isV('orderDetails') && (

        <div  >
          <div className="order-details-container">
            <div className={`order-details-content ${isCommentPanelOpen ? 'collapsed' : ''}`}>
              <div className="order-details-body">
                <h2 className="order-details-title">
                  {formMode === 'add'
                    ? `${t('New Order')}`
                    : `${t('Order #')} ${formData.id}`}
                </h2>
                <h4 style={{ color: "#525b6d" }}> {t("Order Details")}</h4>
                <div className="order-details-section">
                  <div className="order-details-grid " style={{ marginTop: '20px' }}>
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
                                if (!formData.selectedCustomerName) {
                                  Swal.fire({
                                    icon: 'warning',
                                    title: t('No Customer Selected'),
                                    text: t('Please select a customer first'),
                                    confirmButtonText: t('OK')
                                  });
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
                            id="branchNameField"
                            name="branchName"
                            value={
                              i18n.language === 'ar'
                                ? (formData.branchNameLc || formData.selectedBranchName || '')
                                : (formData.branchNameEn || formData.selectedBranchName || '')
                            }
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
                            onClick={handleEntityChange}
                            onChange={handleInputChange}
                            className="entity-dropdown"
                            disabled={!isE('entity') || (formData.products && formData.products.length > 0)}
                          >
                            <option value="">{t('Select Entity')}</option>
                            {entityOptions.map((entity, index) => {
                              // Check if this entity is in the allowed list (case-insensitive)
                              const isEntityAllowed = allowedEntities.length === 0 ||
                                allowedEntities.some(allowedEntity =>
                                  allowedEntity.toLowerCase() === entity.toLowerCase()
                                );

                              return (
                                <option
                                  key={index}
                                  value={entity}
                                  disabled={!isEntityAllowed}
                                  style={!isEntityAllowed ? { color: '#aaa', backgroundColor: '#f5f5f5' } : {}}
                                >
                                  {t(entity)}
                                </option>
                              );
                            })}
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
                            onChange={handleInputChange} options={
                              formData.entity && formData.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()
                                ? VMCO_CATEGORIES.map(category => ({ value: category, label: category }))
                                : []
                            }
                            className="category-dropdown"
                            placeholder={t('Select Category')}
                            disabled={
                              !isE('category') ||
                              (formData.products && formData.products.length > 0) ||
                              !formData.entity ||
                              formData.entity.toLowerCase() !== Constants.ENTITY.VMCO.toLowerCase()
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
                    )}                    {isV('paymentPercentage', fromApproval, true) && fromApproval && (
                      <div className="order-details-field">
                        <label>{t('Payment Percentage')}</label>
                        {formMode === 'add' ? (
                          <select
                            name="paymentPercentage"
                            value={formData.paymentPercentage ?? ''}
                            onChange={handleInputChange}
                            disabled={fromApproval ? false : formData.category !== Constants.CATEGORY.VMCO_MACHINES}
                          >
                            <option value="">{t('Select Payment Percentage')}</option>
                            {paymentPercentageOptions.map((option, index) => (
                              <option key={index} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            name="paymentPercentage"
                            value={formData.paymentPercentage ?? ''}
                            onChange={handleInputChange}
                            disabled={fromApproval ? false : true}
                          >
                            <option value="">{t('Select Payment Percentage')}</option>
                            {paymentPercentageOptions.map((option, index) => (
                              <option key={index} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}
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
                    )}                    {isV('expectedDeliveryDate') && (
                      <div className="order-details-field">
                        <label>{t('Delivery Date')}</label>
                        {formMode === 'add' ? (
                          <input
                            type="text"
                            name="expectedDeliveryDate"
                            value="Delivery Date will be updated later"
                            disabled
                            readOnly
                            style={{ background: '#f9f9f9', color: '#999', cursor: 'not-allowed' }}
                          />
                        ) : fromApproval ? (
                          <input
                            type="text"
                            name="expectedDeliveryDate"
                            value={formData.expectedDeliveryDate ? formatDate(formData.expectedDeliveryDate, 'DD/MM/YYYY') : 'Delivery date will be updated soon'}
                            disabled
                            readOnly
                            style={{ background: '#f9f9f9', color: formData.expectedDeliveryDate ? '#000' : '#999' }}
                          />
                        ) : (
                          formData.expectedDeliveryDate ? (
                            <input
                              type="date"
                              name="expectedDeliveryDate"
                              value={formatDate(formData.expectedDeliveryDate, 'YYYY-MM-DD')}
                              onChange={handleInputChange}
                              disabled={!isE('expectedDeliveryDate')}
                            />
                          ) : (
                            <input
                              type="text"
                              name="expectedDeliveryDate"
                              value="Delivery date will be updated soon"
                              disabled
                              readOnly
                              style={{ background: '#f9f9f9', color: '#999', cursor: 'not-allowed' }}
                            />
                          )
                        )}
                      </div>
                    )}
                    {isV('pricingPolicy', fromApproval, true) && fromApproval && (
                      <div className="order-details-field">
                        <label>{t('Pricing Policy')}</label>
                        <select
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
                  <>
                    <h3 className="order-details-subtitle">{t('Products')}</h3>
                    {((formMode === 'add') || (formMode === 'edit' && isE('products'))) && (
                      <div style={{ display: 'flex', gap: '10px', marginBottom: 8 }}>
                        {isV('addProducts') && (
                          <button
                            type="button"
                            className="order-action-btn approve"
                            onClick={() => {
                              // In add mode, require customer, branch, and entity selection
                              if (formMode === 'add') {
                                if (!formData.selectedCustomerName) {
                                  Swal.fire({
                                    title: t('Select Customer'),
                                    text: t('Please select a customer first'),
                                    icon: 'warning',
                                    confirmButtonText: t('OK'),
                                  });
                                  return;
                                }
                                else if (!formData.selectedBranchName) {
                                  Swal.fire({
                                    title: t('Select Branch'),
                                    text: t('Please select a branch first'),
                                    icon: 'warning',
                                    confirmButtonText: t('OK'),
                                  });
                                  return;
                                }
                                else if (!formData.entity) {
                                  Swal.fire({
                                    title: t('Select Entity'),
                                    text: t('Please select an entity first'),
                                    icon: 'warning',
                                    confirmButtonText: t('OK')
                                  });
                                  return;
                                }
                              }
                              // In edit mode, always use values from formData (order state)
                              setShowProductPopup(true)
                            }}
                            disabled={!isE('addProducts')}
                            style={{
                              cursor: !isE('addProducts') ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {t('Add products')}
                          </button>
                        )}
                        {isV('sampleOrder') && (
                          <button
                            type="button"
                            className="order-action-btn"
                            onClick={() => setSampleMode(!sampleMode)}
                            disabled={!isE('sampleOrder') || (formData.products && formData.products.length > 0)}
                            style={{
                              backgroundColor: sampleMode ? '#ffeb3b' : 'white',
                              color: sampleMode ? 'black' : '#333',
                              border: '1px solid #ccc',
                              cursor: (!isE('sampleOrder') || (formData.products && formData.products.length > 0)) ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {t('Sample Order')}
                          </button>
                        )}
                      </div>
                    )}
                    {((formMode !== 'add') || ((formData.products || []).length > 0)) && (
                      <div className="order-products-section" style={{ boxShadow: '0 0 10px rgba(0,0,0,0.1)', padding: '16px 0px', borderRadius: '8px' }}>


                        {/* Hide table in add mode until products are selected */}

                        <Table
                          columns={columns}
                          data={(formData.products || []).filter(
                            p => p.id || p.erp_prodd || p.quantity || p.unit || p.unitPrice || /*p.sugarTaxPrice || */p.netAmount || p.vatPercentage
                          )}
                          actionButtons={
                            (row) => (
                              isV('deleteButton') && isE('deleteCol') && (
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

                      </div>
                    )}
                  </>
                )}
              </div>


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

            <GetInventory open={showInventory} onClose={() => setShowInventory(false)} InventoryData={InventoryData} productName={productName} />
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
                apiEndpoint="/customers/pagination"
                apiParams={{
                  page: 1,
                  pageSize: 10,
                  sortBy: 'id',
                  sortOrder: 'asc',
                  purpose: 'order creation'
                }}
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
              <div className="" style={{ display: "flex", gap: "10px" }}>
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
            </div>
          )}
        </div>
      )}
    </Sidebar>
  );
}

export default OrderDetails;
