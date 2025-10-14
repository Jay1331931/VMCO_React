import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Table from "../components/Table";
import CommentPopup from "../components/commentPanel";
import GetInventory from "../components/GetInventory";
import Remarks from "../components/Remarks";
import "../i18n";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/components.css";
import GetProducts from "../components/GetProducts";
import QuantityController from "../components/QuantityController";
import GetCustomers from "../components/GetCustomers";
import GetBranches from "../components/GetBranches";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac"; // Add this import
import formatDate from "../utilities/dateFormatter";
import ApprovalDialog from "../components/ApprovalDialog";
import GetPaymentMethods from "../components/GetPaymentMethods"; // Add this import
import Dropdown from "../components/DropDown";
import Swal from "sweetalert2";
import LoadingSpinner from "../components/LoadingSpinner";
import axios from "axios";
import Constants from "../constants";
import PdfPopupViewer from "../components/PdfPopupViewer";
import { convertToTimezone, TIMEZONES } from "../utilities/convertToTimezone";
import { Box, Button, Typography, Tooltip, Chip } from "@mui/material";
import {
  DataGrid,
  GridFooterContainer,
  GridPagination,
  useGridApiRef,
} from "@mui/x-data-grid";

const defaultOrder = {
  id: "",
  erpCustId: "",
  erpBranchId: "",
  orderBy: "",
  erp: "",
  entity: "",
  category: "",
  paymentMethod: "",
  totalAmount: "",
  paymentPercentage: "",
  paidAmount: "",
  deliveryCharges: "",
  branchRegion: "",
  expectedDeliveryDate: "",
  createdAt: "",
  updatedAt: "",
  status: "",
  driver: "",
  vehicleNumber: "",
  images: [],
  products: [],
};

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Helper function to convert payment percentage from decimal to dropdown format
const convertPaymentPercentageToDropdown = (paymentPercentage) => {
  if (!paymentPercentage) return "";

  // Convert string to number for comparison
  const numValue = parseFloat(paymentPercentage);

  if (numValue === 100 || numValue === 100.0) {
    return "100%";
  } else if (numValue === 30 || numValue === 30.0) {
    return "30%";
  }

  // If it's already in percentage format, return as is
  if (
    typeof paymentPercentage === "string" &&
    paymentPercentage.includes("%")
  ) {
    return paymentPercentage;
  }

  return "";
};

// Helper function to safely handle date values for API requests
const safeDateValue = (dateValue) => {
  if (
    !dateValue ||
    (typeof dateValue === "string" && dateValue.trim() === "")
  ) {
    return null;
  }
  return dateValue;
};

function OrderDetails() {
  const gridApiRef = useGridApiRef();
  const { i18n } = useTranslation();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth(); // Get form mode from location state (add, edit, view)
  const formMode = location.state?.mode || "view";
  const orderFromNav = location.state?.order || {};
  const salesOrderLinesFromNav =
    orderFromNav &&
    orderFromNav.salesOrderLines &&
    Array.isArray(orderFromNav.salesOrderLines)
      ? orderFromNav.salesOrderLines
      : [];
  const fromApproval = location.state?.fromApproval;
  const wfid = location.state?.wfid || null;
  const approvalHistory = location.state?.approvalHistory || []; // Initialize form data
  const [formData, setFormData] = useState({
    ...defaultOrder,
    ...orderFromNav,
    id: orderFromNav.id || "",
    paymentPercentage:
      convertPaymentPercentageToDropdown(orderFromNav.paymentPercentage) ||
      orderFromNav.paymentPercentage ||
      "",
    products: [],
  });
  // Effect to keep orderId in sync with formData.id
  useEffect(() => {
    setOrderId(formData.id || "");
  }, [formData.id]);

  // State variables
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showRemarks, setShowRemarks] = useState(false);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [orderId, setOrderId] = useState(orderFromNav.id || "");
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [showBranchPopup, setShowBranchPopup] = useState(false);
  const [popupImage, setPopupImage] = useState(null);
  const [nextOrderId, setNextOrderId] = useState("");
  const [saving, setSaving] = useState(false);
  const [checkedSave, setCheckedSave] = useState(false);
  const [isEditMode, setIsEditMode] = useState(formMode === "edit"); // Determine edit mode from formMode
  const [originalProducts, setOriginalProducts] = useState([]); // Track original products for comparison
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const [InventoryData, setInventoryData] = useState([]);
  const [InventoryLoading, setInventoryLoading] = useState(false);
  const [productName, setProductName] = useState("");
  const [sampleMode, setSampleMode] = useState(false);
  const [companyType, setCompanyType] = useState("");
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [pendingSaveAction, setPendingSaveAction] = useState(null); // Remove categoryOptions/products fetching and getFilteredVmcoCategories
  const [showModal, setShowModal] = useState(false);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [deliveryImages, setDeliveryImages] = useState([]);
  const [loadingProductId, setLoadingProductId] = useState(null);
  // Use VMCO categories from constants
  const VMCO_CATEGORIES = [
    Constants.CATEGORY.VMCO_MACHINES,
    Constants.CATEGORY.VMCO_CONSUMABLES,
  ];
  const paymentPercentageOptions = [
    { label: "100%", value: "100%" },
    { label: "30%", value: "30%" },
  ];
  const pricingPolicyOptions = ["Price A", "Price B", "Price C", "Price D"];

  useEffect(() => {
    if (formMode === "add") return;

    if (
      salesOrderLinesFromNav &&
      Array.isArray(salesOrderLinesFromNav) &&
      salesOrderLinesFromNav.length > 0
    ) {
      console.log(
        "Using pre-fetched sales order lines:",
        salesOrderLinesFromNav.length,
        "formData?s"
      );
      const processedProducts = salesOrderLinesFromNav.map((product) => ({
        ...product,
        id: product.productId || product.id,
        productName:
          product.productName || product.product_name || product.erp_prod_id,
        isMachine: product.isMachine,
        isFresh: product.isFresh,
        quantity: product.quantity,
      }));

      setFormData((prev) => ({
        ...prev,
        products: processedProducts,
      }));

      setOriginalProducts(processedProducts);
      console.log(
        "Successfully loaded pre-fetched sales order lines:",
        processedProducts
      );
      return;
    }

    const fetchOrderProducts = async () => {
      if (!orderFromNav.id) {
        console.log("No order ID available, skipping sales order lines fetch");
        return;
      }

      console.log(
        "Fetching sales order lines from API for order ID:",
        orderFromNav.id
      );
      try {
        const params = new URLSearchParams({
          page: 1,
          pageSize: 10000,
          search: "",
          sortBy: "id",
          sortOrder: "asc",
          filters: JSON.stringify({ order_id: orderFromNav.id }),
        });

        const url = `${API_BASE_URL}/sales-order-lines/pagination?${params.toString()}`;
        console.log("Fetching order products from URL:", url);
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("API did not return JSON. Check API URL and server.");
        }

        const result = await response.json();
        console.log("Sales order lines API response:", result);

        if (
          result.status === "Ok" &&
          result.data &&
          Array.isArray(result.data.data)
        ) {
          // Map the product data to ensure we use productName instead of erpProdId
          const processedProducts = result.data.data.map((product) => ({
            ...product,
            id: product.productId,
            productName:
              product.productName ||
              product.product_name ||
              product.erp_prod_id,
            isMachine: product.isMachine,
            isFresh: product.isFresh, // Add isFresh field if present
            quantity: product.quantity,
          }));

          console.log("Processed products from API:", processedProducts);

          setFormData((prev) => ({
            ...prev,
            products: processedProducts,
          }));

          // Store the original product list for comparison when saving
          setOriginalProducts(processedProducts);
          console.log(
            "Successfully loaded sales order lines from API:",
            processedProducts.length,
            "items"
          );
        } else {
          console.warn(
            "No sales order lines found in API response or invalid response structure"
          );
          // Set empty products array if no data found
          setFormData((prev) => ({
            ...prev,
            products: [],
          }));
          setOriginalProducts([]);
        }
      } catch (err) {
        console.error("Error fetching sales order lines:", err);
        setError(err.message);
        // Set empty products array on error
        setFormData((prev) => ({
          ...prev,
          products: [],
        }));
        setOriginalProducts([]);
      }
    };
    fetchOrderProducts();
    // eslint-disable-next-line
  }, [
    orderFromNav.id,
    formMode,
    salesOrderLinesFromNav ? salesOrderLinesFromNav.length : 0,
  ]); // Use length with safety check

  // Refactored isCreditPaymentAllowed to include COD limit logic
  const isCreditPaymentAllowed = async (
    customerId,
    entity,
    totalAmount = formData.totalAmount
  ) => {
    try {
      // 1. Check if credit is allowed (simulate API call)
      const creditUrl = `${API_BASE_URL}/payment-method-balances/id/${customerId}`;
      const creditRes = await fetch(creditUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!creditRes.ok) {
        console.warn(
          "Failed to fetch credit eligibility:",
          creditRes.statusText
        );
        return false;
      }
      const creditResult = await creditRes.json();
      const isCreditUser =
        creditResult?.data?.methodDetails?.credit?.[entity]?.isAllowed;
      if (!isCreditUser) {
        let codLimit = creditResult?.data?.methodDetails?.COD?.limit || 0;
        if (totalAmount > codLimit) {
          console.log(`Total amount exceeds COD limit.`);
          return false;
        } else {
          console.log(
            `Total amount is within COD limit. Showing payment popup.`
          );
          setShowPaymentPopup(true);
          setPendingSaveAction(true);
          return "Payment popup"; // Indicate that payment popup should be shown
        }
      } else {
        console.log(
          `Credit is allowed for customer. checking for current balance`
        );
        const currentCreditBalance =
          creditResult?.data?.currentBalance?.[entity] || 0;
        if (totalAmount > currentCreditBalance) {
          Swal.fire({
            icon: "warning",
            title: t("Insuffiecient Credit balance"),
            text: t(`Your credit balance is ${currentCreditBalance}.`),
          });
          return "Insufficient balance";
        } else {
          return true;
        }
      }
    } catch (err) {
      console.error("Error in isCreditPaymentAllowed:", err);
      return false;
    }
  };

  // Add a default product row in add mode
  useEffect(() => {
    if (formMode === "add" && formData.products.length === 0) {
      // Do not add an empty row by default
      setFormData((prev) => ({
        ...prev,
        products: [],
      }));
    }
    // eslint-disable-next-line
  }, [formMode]);

  // quantity change handler
  // Quantity change handler
  const handleQuantityChange = (idx, value) => {
    setFormData((prev) => {
      const updatedProducts = [...prev.products];

      // Handle both numeric and string values (for partial input states)
      if (typeof value === "string" && value !== "") {
        // For string inputs, store as-is to allow user typing
        updatedProducts[idx].quantity = value;
      } else if (typeof value === "number") {
        // For numeric inputs, ensure it's a valid number
        updatedProducts[idx].quantity = Math.max(0, parseInt(value, 10) || 0);
      } else if (value === "" || value === undefined) {
        // For empty values, store as empty string
        updatedProducts[idx].quantity = "";
      } else {
        // Fallback to 0 for any other case
        updatedProducts[idx].quantity = 0;
      }

      // Only calculate net amount for valid numeric quantities
      const numericQuantity =
        typeof value === "number" ? value : parseInt(value, 10);
      if (!isNaN(numericQuantity) && numericQuantity >= 0) {
        // Update the net amount based on the new quantity
        if (sampleMode) {
          updatedProducts[idx].netAmount = "0.00";
        } else {
          const unitPrice = parseFloat(updatedProducts[idx].unitPrice) || 0;
          const vatPercentage =
            parseFloat(updatedProducts[idx].vatPercentage) || 0;
          const baseAmount = unitPrice * numericQuantity;
          const vatAmount = baseAmount * (vatPercentage / 100);
          updatedProducts[idx].netAmount = (baseAmount + vatAmount).toFixed(2);
        }
      }

      return {
        ...prev,
        products: updatedProducts,
      };
    });
  };

  // Delete product row handler
  const handleDeleteProductRow = (idx) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== idx),
    }));
  };

  // Download invoice
  const handleDownloadInvoice = (orderId) => {
    Swal.fire({
      title: t("Download Invoice"),
      text: `Are you sure you want to download the invoice for order ID:${orderId}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("OK"),
    });
  };

  const handleSave = async (action, selectedMethod) => {
    const itemsWithInvalidMOQ = [];
    const updatedProducts = [...formData.products];

    for (let i = 0; i < formData.products.length; i++) {
      const product = formData.products[i];
      const currentQuantity = Number(product.quantity) || 0;
      const moq = Number(product.moq) || 1;

      // Check if quantity is below MOQ
      if (currentQuantity < moq) {
        itemsWithInvalidMOQ.push({
          name: product.productName,
          currentQuantity,
          moq,
          index: i,
        });

        // Update the quantity to MOQ
        updatedProducts[i] = {
          ...product,
          quantity: moq,
        };
      }
    }

    // If there are items with invalid MOQ, show warning and update quantities
    if (itemsWithInvalidMOQ.length > 0) {
      // Update the formData with MOQ values
      setFormData((prev) => ({
        ...prev,
        products: updatedProducts,
      }));

      // Recalculate net amounts after MOQ correction
      const finalUpdatedProducts = updatedProducts.map((product) => {
        const unitPrice = parseFloat(product.unitPrice) || 0;
        const quantity = parseInt(product.quantity) || 0;
        const vatPercentage = parseFloat(product.vatPercentage) || 0;
        const baseAmount = unitPrice * quantity;
        const vatAmount = baseAmount * (vatPercentage / 100);

        return {
          ...product,
          netAmount: (baseAmount + vatAmount).toFixed(2),
        };
      });

      // Final update with recalculated amounts
      setFormData((prev) => ({
        ...prev,
        products: finalUpdatedProducts,
      }));

      return;
    }
    setSaving(true);
    // Basic validations first
    if (!formData.customerId) {
      alert(t("Please select a customer"));
      setSaving(false);
      return;
    }

    if (!formData.products || formData.products.length === 0) {
      Swal.fire({
        icon: "warning",
        title: t("Validation Error"),
        text: t("Please add at least one product"),
      });
      setSaving(false);
      return;
    }

    // Check if editing Pre Payment order
    if (formMode !== "add" && formData.paymentMethod === "Pre Payment") {
      Swal.fire({
        icon: "warning",
        title: t("No Updates Allowed"),
        text: t(
          "The payment method is Pre Payment. The order cannot be altered."
        ),
      });
      setSaving(false);
      return;
    }

    // Determine payment method first if not provided and not in edit mode
    if (formMode === "add" && !selectedMethod) {
      const isVmcoEntity =
        formData.entity &&
        formData.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase();
      if (isVmcoEntity) {
        const machineProducts =
          formData.products.length > 0 &&
          formData.products.every((product) => product.isMachine === true);
        if (machineProducts) {
          selectedMethod = "Pre Payment";
        } else {
          const totalAmount = parseFloat(formData.totalAmount);
          const isCreditAllowed = await isCreditPaymentAllowed(
            formData.customerId,
            formData.entity,
            totalAmount,
            action
          );
          if (isCreditAllowed === "Payment popup") {
            setSaving(false);
            return;
          } else if (isCreditAllowed === "Insufficient balance") {
            setSaving(false);
            return;
          } else if (!isCreditAllowed) {
            selectedMethod = "Pre Payment";
          } else {
            selectedMethod = "Credit";
          }
        }
      } else {
        const totalAmount = parseFloat(formData.totalAmount);
        const isCreditAllowed = await isCreditPaymentAllowed(
          formData.customerId,
          formData.entity,
          totalAmount,
          action
        );
        if (isCreditAllowed === "Payment popup") {
          setSaving(false);
          return;
        } else if (isCreditAllowed === "Insufficient balance") {
          setSaving(false);
          return;
        } else if (!isCreditAllowed) {
          selectedMethod = "Pre Payment";
        } else {
          selectedMethod = "Credit";
        }
      }
    }

    // Use existing payment method in edit mode if not changing it
    if (formMode !== "add" && !selectedMethod) {
      selectedMethod = formData.paymentMethod;
    }

    // Check COD limits if payment method is Cash on Delivery
    if (selectedMethod && selectedMethod.toLowerCase() === "cash on delivery") {
      try {
        // Calculate current order total amount
        let currentOrderTotal = formData.totalAmount || 0;

        // Check for existing open COD orders
        const orderFilters = new URLSearchParams({
          filters: JSON.stringify({
            customerId: formData.customerId,
            entity: formData.entity,
            status: "Open",
            paymentMethod: "Cash on Delivery",
          }),
        });
        console.log(`Fetching existing orders with filters: ${orderFilters}`);
        const existingOrdersResponse = await fetch(
          `${API_BASE_URL}/sales-order/pagination?${orderFilters}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!existingOrdersResponse.ok) {
          throw new Error("Failed to fetch existing COD orders");
        }

        const existingOrdersResult = await existingOrdersResponse.json();

        // Calculate total amount of existing COD orders
        let existingCODTotal = 0;
        if (existingOrdersResult.data?.data) {
          existingOrdersResult.data.data.forEach((order) => {
            // Skip current order if we're editing
            if (order.id !== formData.id) {
              existingCODTotal += Number(order.totalAmount) || 0;
            }
          });
        }

        // Get customer's COD limit
        const customerResponse = await fetch(
          `${API_BASE_URL}/payment-method-balances/id/${formData.customerId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!customerResponse.ok) {
          throw new Error("Failed to fetch customer COD limit");
        }

        const customerData = await customerResponse.json();
        console.log("Customer COD limit data:", customerData);
        const codLimit =
          Number(customerData?.data?.methodDetails?.COD?.limit) || 0;

        // Compare total with COD limit
        if (existingCODTotal + Number(currentOrderTotal) >= codLimit) {
          console.log(
            `COD limit reached: existing=${existingCODTotal}, Sum=${
              existingCODTotal + Number(currentOrderTotal)
            }, current=${currentOrderTotal}, limit=${codLimit}`
          );
          Swal.fire({
            icon: "warning",
            title: t("COD Limit Reached"),
            text: t(
              "The COD Limit of the customer has been reached. Please choose a different payment method."
            ),
            confirmButtonText: t("OK"),
          });
          setSaving(false);
          return;
        }
        console.log("COD limit check passed. Continuing with order placement.");
      } catch (error) {
        console.error("Error checking COD limits:", error);
        Swal.fire({
          icon: "error",
          title: t("Error"),
          text: t("Failed to verify COD limits. Please try again."),
          confirmButtonText: t("OK"),
        });
        setSaving(false);
        return;
      }
    }

    if (formMode !== "add" && formData.paymentMethod === "Pre Payment") {
      // alert(t('The payment method is Pre Payment. The order cannot be altered.'));
      Swal.fire({
        icon: "warning",
        title: t("No Updations Allowed"),
        text: t(
          "The payment method is Pre Payment. The order cannot be altered."
        ),
      });
      setSaving(false);
      return;
    }

    if (!formData.customerId) {
      alert(t("Please select a customer"));
      setSaving(false);
      return;
    }
    setSaving(true);

    if (!formData.products || formData.products.length === 0) {
      Swal.fire({
        icon: "warning",
        title: t("Validation Error"),
        text: t("Please add at least one product"),
      });
      setSaving(false);
      return;
    }

    // Enhanced payment method determination logic
    if (formMode === "add" && !formData.paymentMethod && !selectedMethod) {
      // Check entity type and product composition
      const isVmcoEntity =
        formData.entity &&
        formData.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase();

      if (isVmcoEntity) {
        // For VMCO entity, check if all products are machines
        const machineProducts =
          formData.products.length > 0 &&
          formData.products.every((product) => product.isMachine === true);

        if (machineProducts) {
          // All products are machines - use Pre Payment
          console.log("All products are VMCO machines - using Pre Payment");
          selectedMethod = "Pre Payment";
        } else {
          // Non-machine products: check credit user and COD limit
          console.log(
            "VMCO entity with non-machine products - determining payment method"
          );
          const totalAmount = parseFloat(formData.totalAmount);
          const isCreditAllowed = await isCreditPaymentAllowed(
            formData.customerId,
            formData.entity,
            totalAmount,
            action
          );
          if (isCreditAllowed === "Payment popup") {
            setSaving(false);
            return;
          }
          if (isCreditAllowed === "Insufficient balance") {
            console.log("Credit not allowed - insufficient balance");
            setSaving(false);
            return;
          } else if (isCreditAllowed === false) {
            selectedMethod = "Pre Payment";
          } else {
            selectedMethod = "Credit"; // Default to Credit if allowed
          }
        }
      } else {
        console.log("Other entity - determining payment method");
        const totalAmount = parseFloat(formData.totalAmount);
        const isCreditAllowed = await isCreditPaymentAllowed(
          formData.customerId,
          formData.entity,
          totalAmount,
          action
        );
        if (isCreditAllowed === "Payment popup") {
          setSaving(false);
          return;
        } else if (isCreditAllowed === "Insufficient balance") {
          console.log("Credit not allowed - insufficient balance");
          setSaving(false);
          return;
        } else if (!isCreditAllowed) {
          selectedMethod = "Pre Payment";
        } else {
          selectedMethod = "Credit"; // Default to Credit if allowed
        }
      }
    }

    // Always check and determine payment method before proceeding
    if (!selectedMethod) {
      if (
        formData.category &&
        formData.category.toLowerCase() ===
          Constants.CATEGORY.VMCO_MACHINES.toLowerCase()
      ) {
        selectedMethod = "Pre Payment";
      } else if (formData.paymentMethod) {
        selectedMethod = formData.paymentMethod;
      } else {
        // Check entity type and product composition
        const isVmcoEntity =
          formData.entity &&
          formData.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase();
        if (isVmcoEntity) {
          // For VMCO entity, check if all products are machines
          const machineProducts =
            formData.products.length > 0 &&
            formData.products.every((product) => product.isMachine === true);
          if (machineProducts) {
            selectedMethod = "Pre Payment";
          }
        }
      }
    }

    // If still no payment method determined, show error
    if (!selectedMethod) {
      Swal.fire({
        icon: "warning",
        title: t("Payment Method Required"),
        text: t("Please select a payment method before saving the order."),
        confirmButtonText: t("OK"),
      });
      setSaving(false);
      return;
    }

    // Check if we're editing an existing order or creating a new one
    if (formData.id && isEditMode) {
      const fieldsToUpdate = [
        "erpCustId",
        "erpBranchId",
        "orderBy",
        "entity",
        "sampleOrder",
        "paymentMethod",
        "paymentPercentage",
        "totalAmount",
        "paidAmount",
        "deliveryCharges",
        "expectedDeliveryDate",
        "status",
        "driver",
        "vehicleNumber",
        "branchRegion",
        "branchCity",
      ];

      const payload = {}; // Check if category is VMCO Machines
      const isVmcoMachinesCategory =
        formData.category &&
        formData.category.toLowerCase() ===
          Constants.CATEGORY.VMCO_MACHINES.toLowerCase();
      fieldsToUpdate.forEach((field) => {
        if (formData[field] !== undefined && formData[field] !== null) {
          if (field === "paymentPercentage") {
            payload[field] = formData[field]
              ? formData[field] === "100%"
                ? "100.00"
                : formData[field] === "30%"
                ? "30.00"
                : "0.00"
              : "0.00";
          } else if (field === "paymentMethod" && isVmcoMachinesCategory) {
            // Always set payment method to 'Pre Payment' for VMCO Machines category
            payload[field] = "Pre Payment";
          } else if (
            field === "status" &&
            formData.entity &&
            formData.entity.toLowerCase() ===
              Constants.ENTITY.VMCO.toLowerCase()
          ) {
            // Set status to 'Pending' for vmco entity
            payload[field] = "Pending";
          } else if (field === "expectedDeliveryDate") {
            // Handle date fields - convert empty strings to null to avoid database errors
            payload[field] = safeDateValue(formData[field]);
          } else {
            payload[field] = formData[field];
          }
        }
      });

      // First update the sales order
      const orderResponse = await fetch(
        `${API_BASE_URL}/sales-order/id/${formData.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!orderResponse.ok) {
        const errorData = await orderResponse
          .json()
          .catch(() => ({ message: "Unknown error" }));
        console.error("Server response:", errorData);
        // Show user-friendly error message
        Swal.fire({
          icon: "error",
          title: t("Error"),
          text:
            errorData.details ||
            errorData.message ||
            `Failed to update order: ${orderResponse.statusText}`,
        });

        setSaving(false);
        return;
      }

      // Now check for existing order lines and fetch them
      let existingProductMap = {};
      try {
        const linesResponse = await fetch(
          `${API_BASE_URL}/sales-order-lines/pagination?filters=${encodeURIComponent(
            JSON.stringify({ orderId: formData.id })
          )}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!linesResponse.ok) {
          console.warn(
            `Failed to fetch order lines: ${linesResponse.statusText}`
          );
        } else {
          const existingLines = await linesResponse.json();
          if (existingLines.data?.data?.length > 0) {
            // Filter to ensure we only get lines for this specific order
            const orderLines = existingLines.data.data.filter(
              (line) => line.orderId === formData.id
            );
            console.log(
              `Existing order lines for orderId ${formData.id}:`,
              orderLines
            );

            orderLines.forEach((line) => {
              if (line.productId) {
                existingProductMap[line.productId] = line;
                console.log(
                  `Mapped existing line for product ID ${line.productId} to line ID ${line.id}`
                );
              } else {
                console.warn(`Found order line without product_id:`, line);
              }
            });
          }
        }
      } catch (err) {
        console.error("Error fetching existing order lines:", err);
      }

      // Now update each product line
      if (formData.products && formData.products.length > 0) {
        console.log("Updating sales order lines");

        const updatePromises = formData.products.map((product) => {
          // Extract product data
          const productId = product.id || product.productId;
          const unitPrice = parseFloat(product.unitPrice);
          const quantity = parseInt(product.quantity, 10);
          const netAmount = parseFloat(product.netAmount);
          const vatPercentage = parseFloat(product.vatPercentage || 0);

          // Check if product already exists in the order
          const existingLine = existingProductMap[productId];

          if (existingLine) {
            console.log(
              `Found existing line for product ID ${productId}, updating quantity and amounts`
            );
            // Update existing line
            return updateSalesOrderLine(
              formData.id,
              productId,
              unitPrice,
              quantity,
              netAmount,
              vatPercentage
            );
          }
          // Existing products with salesOrderLineId but not found in existingProductMap
          else if (product.salesOrderLineId) {
            console.log(
              `Product has salesOrderLineId ${product.salesOrderLineId} but not found in existing lines, updating`
            );
            return updateSalesOrderLine(
              formData.id,
              productId,
              unitPrice,
              quantity,
              netAmount,
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
              vatPercentage
            );
          }
        });
        await Promise.all(updatePromises);

        // After updating sales order lines, calculate and update totalSalesTaxAmount
        let totalSalesTaxAmount = 0;
        formData.products.forEach((product) => {
          const unitPrice = parseFloat(product.unitPrice || 0);
          const quantity = parseInt(product.quantity || 0, 10);
          const vatPercentage = parseFloat(product.vatPercentage || 0);
          const baseAmount = unitPrice * quantity;
          const vatAmount = (baseAmount * vatPercentage) / 100;
          totalSalesTaxAmount += vatAmount;
        });

        console.log(
          "Total sales tax amount for updated order:",
          totalSalesTaxAmount
        );

        // Check if any product is a machine (isMachine = true)
        const hasAnyMachine =
          formData.products.length > 0 &&
          formData.products.some((product) => product.isMachine === true);

        // Check if any product is fresh (isFresh = true)
        const hasAnyFresh =
          formData.products.length > 0 &&
          formData.products.some((product) => product.isFresh === true);

        console.log("Product analysis:", {
          totalProducts: formData.products.length,
          hasAnyMachine,
          hasAnyFresh,
          sampleOrder: sampleMode ? true : false,
          productFlags: formData.products.map((p) => ({
            id: p.id,
            isMachine: p.isMachine,
            isFresh: p.isFresh,
          })),
        });

        // Update the sales order with the total sales tax amount and product flags
        const orderUpdatePayload = {
          total_sales_tax_amount: totalSalesTaxAmount.toFixed(2),
          isMachine: hasAnyMachine,
          isFresh: hasAnyFresh,
        };

        const updateOrderResponse = await fetch(
          `${API_BASE_URL}/sales-order/id/${formData.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(orderUpdatePayload),
          }
        );

        if (!updateOrderResponse.ok) {
          console.warn(
            "Failed to update order with total sales tax amount and product flags"
          );
        } else {
          console.log(
            "Successfully updated order with total sales tax amount and product flags:",
            {
              totalSalesTaxAmount,
              isMachine: hasAnyMachine,
              isFresh: hasAnyFresh,
            }
          );
        }
      }

      // Track if any products were deleted for success message
      let productsDeleted = false;

      // Check for deleted products by comparing originalProducts with current products
      if (originalProducts && originalProducts.length > 0) {
        console.log("Checking for deleted products...");

        // Create a map of current products for easy lookup
        const currentProductsMap = {};
        formData.products.forEach((product) => {
          const productId = product.id || product.productId;
          if (productId) {
            currentProductsMap[productId] = true;
          }
        });

        // Find products that were in originalProducts but are no longer in formData.products
        const deletePromises = originalProducts
          .filter((product) => {
            const productId = product.id || product.productId;
            return productId && !currentProductsMap[productId];
          })
          .map((product) => {
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
          console.log("No products were removed from the order");
        }
      }
      // // Check if this is a VMCO Machines order that needs discount workflow approval
      // if ((formData.entity && formData.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()) &&
      //   (formData.isMachine && formData.isMachine === true) &&
      //   formData.customerId) {
      //   // Directly trigger the discount workflow without checking if it already exists
      //   console.log(`Directly triggering discount workflow for order ${formData.id}`);
      //   console.log(`- formData.entity: "${formData.entity}"`);
      //   console.log(`- formData.isMachine: "${formData.isMachine}"`);
      //   console.log(`- formData.customerId: ${formData.customerId}`);

      //   await triggerDiscountWorkflow(formData.id, formData.customerId);
      // } else {
      //   console.log('Skipping discount workflow creation in order update because conditions failed:');
      //   console.log(`- entity is vmco (case insensitive): ${formData.entity && formData.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()}`);
      //   console.log(`- isMachine is true: ${formData.isMachine && formData.isMachine === true}`);
      //   console.log(`- has customerID: ${Boolean(formData.customerId)}`);
      // }

      setIsEditMode(false);

      // Show specific success message based on whether products were deleted
      if (productsDeleted) {
        Swal.fire({
          icon: "success",
          title: t("Order Updated Successfully"),
          text: t(
            "The order has been successfully updated with product changes!"
          ),
          confirmButtonText: t("OK"),
        }).then(() => {
          window.location.reload();
        });
      } else {
        Swal.fire({
          icon: "success",
          title: t("Order Updated"),
          text: t("Order updated successfully!"),
          confirmButtonText: t("OK"),
        }).then(() => {
          window.location.reload();
        });
      }
      return; // Exit function after successful update
    }

    // Validation - check if essential fields are filled
    if (!formData.selectedCustomerName || !formData.selectedBranchName) {
      Swal.fire({
        icon: "warning",
        title: t("Validation Error"),
        text: t("Customer and Branch are required fields."),
      });
      setSaving(false);
      return;
    }
    if (!formData.entity) {
      Swal.fire({
        icon: "warning",
        title: t("Validation Error"),
        text: t("Entity is a required field."),
        confirmButtonText: t("OK"),
      });
      setSaving(false);
      return;
    }
    console.log("Starting order creation process with data:", {
      customerId: formData.customerId,
      branchId: formData.branchId,
      entity: formData.entity,
      category: formData.category,
      paymentMethod: selectedMethod,
    });

    // Skip existing order check if payment method is Pre Payment
    const isPrePayment =
      (selectedMethod || formData.paymentMethod).toLowerCase() ===
      "pre payment";
    if (!isPrePayment) {
      console.log(
        "Payment method is Pre Payment - skipping existing order check"
      );
      const branchIdForFilter = formData.branchId || formData.erpBranchId;

      // Determine the status to check for existing orders based on entity
      const statusToCheck =
        formData.entity &&
        formData.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()
          ? "Pending" // VMCO orders use Pending status
          : "Open"; // Other entities use Open status

      const freshOrder =
        Array.isArray(formData.products) &&
        formData.products.length > 0 &&
        formData.products.every((product) => product.isFresh === true);

      const orderFiltersObj =
        formData.entity &&
        formData.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()
          ? {
              customerId: formData.customerId,
              branchId: branchIdForFilter,
              entity: formData.entity,
              status: statusToCheck,
              productCategory: formData.category,
            }
          : formData.entity &&
            formData.entity.toLowerCase() === Constants.ENTITY.SHC.toLowerCase()
          ? {
              customerId: formData.customerId,
              branchId: branchIdForFilter,
              entity: formData.entity,
              status: statusToCheck,
              isFresh: freshOrder, // or set this based on your logic if needed
            }
          : {
              customerId: formData.customerId,
              branchId: branchIdForFilter,
              entity: formData.entity,
              status: statusToCheck,
            };

      console.log("Order filter object created:", orderFiltersObj);

      // Always include status: 'Open' in the filters for existing order check
      const orderFiltersObjWithOpenStatus = {
        ...orderFiltersObj,
        status: "Open",
      };
      const orderFilters = new URLSearchParams({
        filters: JSON.stringify(orderFiltersObjWithOpenStatus),
      });

      console.log(
        "Checking for existing orders with filters:",
        orderFiltersObj
      );

      try {
        const existingOrderResponse = await fetch(
          `${API_BASE_URL}/sales-order/pagination?${orderFilters}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log(
          "Existing order response status:",
          existingOrderResponse.status
        );

        if (!existingOrderResponse.ok) {
          throw new Error(
            `Failed to check existing orders: ${existingOrderResponse.statusText}`
          );
        }

        const existingOrderResult = await existingOrderResponse.json();
        console.log("Existing order search results:", existingOrderResult);

        if (existingOrderResult.data?.data?.length > 0) {
          console.log(
            "Found existing order(s):",
            existingOrderResult.data.data
          );
          const entityName =
            formData.entity.charAt(0).toUpperCase() +
            formData.entity.slice(1).toLowerCase();
          Swal.fire({
            icon: "warning",
            title: t("Order Already Exists"),
            text: t(
              `An active order already exists for ${entityName} with the same customer, branch, and entity. Please check the existing orders before creating a new one.`
            ),
            confirmButtonText: t("OK"),
          });
          navigate("/orders");
          setSaving(false);
          return;
        } else {
          console.log(
            "No existing orders found with these criteria, proceeding with order creation"
          );
        }
      } catch (error) {
        console.error("Error checking for existing orders:", error);
        // Continue with order creation even if checking fails
      }
    }

    let attempt = 0;
    let maxAttempts = 2;
    let orderByName = "";
    const userId = user?.userId;
    let usernameApiUrl = `/user/get-username-by-id/${userId}`;
    const usernameRes = await fetch(`${API_BASE_URL}${usernameApiUrl}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (usernameRes.ok) {
      const contentType = usernameRes.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const usernameResult = await usernameRes.json();
        if (
          usernameResult &&
          (usernameResult.userName || usernameResult.username)
        ) {
          orderByName = usernameResult.userName || usernameResult.username;
        } else {
          console.warn(
            "Username API did not return userName field:",
            usernameResult
          );
        }
      }
    } else {
      console.error("Failed to fetch username: HTTP", usernameRes.status);
    }

    while (attempt < maxAttempts) {
      let orderStatus = ""; // Default status
      let paymentStatus = "Pending"; // Default payment status

      const finalPaymentMethod =
        formData.category &&
        formData.category.toLowerCase() ===
          Constants.CATEGORY.VMCO_MACHINES.toLowerCase()
          ? "Pre Payment"
          : selectedMethod || formData.paymentMethod || "";

      // Determine status based on entity and payment method
      if (
        formData.entity &&
        formData.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()
      ) {
        orderStatus = "Pending";
        if (finalPaymentMethod.toLowerCase() === "pre payment") {
          // For VMCO entity with Pre Payment
          paymentStatus = "Pending";
        } else if (finalPaymentMethod.toLowerCase() === "credit") {
          orderStatus = "Pending";
          paymentStatus = "Credit";
        }
      } else if (
        formData.entity &&
        formData.entity.toLowerCase() === Constants.ENTITY.SHC.toLowerCase()
      ) {
        // For other entities (SHC)
        orderStatus = "Open";
        paymentStatus = finalPaymentMethod === "Credit" ? "Credit" : "Pending";
      } else if (
        formData.entity &&
        formData.entity.toLowerCase() === Constants.ENTITY.GMTC.toLowerCase()
      ) {
        // For other entities (GMTC)
        orderStatus = "Open";
        paymentStatus = finalPaymentMethod === "Credit" ? "Credit" : "Pending";
      } else {
        // For NAQI and DAR entities
        if (finalPaymentMethod.toLowerCase() === "pre payment") {
          orderStatus = "Pending";
          paymentStatus = "Pending";
        } else if (
          finalPaymentMethod.toLowerCase() === "credit" ||
          finalPaymentMethod.toLowerCase() === "cash on delivery"
        ) {
          orderStatus = "Approved";
          paymentStatus =
            finalPaymentMethod.toLowerCase() === "credit"
              ? "Credit"
              : "Pending";
        } else {
          orderStatus = "Approved";
          paymentStatus = "Pending";
        }
      }

      // Prepare payload for backend - only include defined fields, default to '' for missing optional fields
      const payload = {
        customerId: formData.customerId || "",
        companyNameEn: formData.companyNameEn || "",
        companyNameAr: formData.companyNameAr || "",
        brandNameEn: formData.brandNameEn || "",
        brandNameAr: formData.brandNameAr || "",
        erpCustId: formData.erpCustId,
        branchId: formData.branchId || "",
        erpBranchId: formData.erpBranchId || "",
        branchNameEn: formData.branchNameEn || "", // Always use value from formData
        branchNameLc: formData.branchNameLc || "", // Always use value from formData
        branchRegion: formData.branchRegion || "", // Include branch region
        branchCity: formData.branchCity || "", // Include branch city
        orderBy: orderByName, // <-- Use fetched employee name here
        isMachine:
          formData.category.toLowerCase() ===
          Constants.CATEGORY.VMCO_MACHINES.toLowerCase()
            ? true
            : false,
        paymentMethod: finalPaymentMethod,
        paymentPercentage: "100.00", // Always set to 100.00 when creating sales orders
        status: sampleMode ? "Approved" : orderStatus,
        salesExecutive: user.employeeId,
        paymentStatus: sampleMode ? "Paid" : paymentStatus,
        entity: formData.entity || "",
        deliveryCharges: formData.deliveryCharges || "0",
        totalAmount: formData.totalAmount || "0",
        paidAmount: sampleMode
          ? 0.0
          : finalPaymentMethod.toLowerCase() === "credit"
          ? formData.totalAmount
          : 0.0,
        pricingPolicy: formData.pricingPolicy?.[formData.entity],
        customerRegion: formData.customerRegion || "",
        productCategory: formData.category || "",
        sampleOrder: sampleMode,
      };
      try {
        setLoading(true);
        console.log("Submitting order payload:", payload);
        console.log("Branch-related fields in payload:", {
          branchId: payload.branchId,
          erpBranchId: payload.erpBranchId,
          branchNameEn: payload.branchNameEn,
          branchNameLc: payload.branchNameLc,
        });
        console.log("Proceeding to create a new order - no duplicates found");

        // Step 1: Create the order first
        console.log("Making API call to create sales order");
        const response = await fetch(`${API_BASE_URL}/sales-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        console.log("Sales order API response status:", response.status);
        if (!response.ok) {
          const errorText = await response.text();
          if (
            errorText.includes("duplicate key value violates unique constraint")
          ) {
            // Duplicate erpOrderId, fetch latest max id and retry
            attempt++;
            // Fetch latest max id
            const params = new URLSearchParams({
              page: 1,
              pageSize: 1,
              sortBy: "id",
              sortOrder: "asc",
              fields: "id",
            });
            const idRes = await fetch(
              `${API_BASE_URL}/sales-order/pagination?${params.toString()}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            const idResult = await idRes.json();
            let newOrderId = 1;
            if (
              idResult.status === "Ok" &&
              idResult.data &&
              Array.isArray(idResult.data.data) &&
              idResult.data.data.length > 0
            ) {
              const ids = idResult.data.data
                .map((order) => parseInt(order.id, 10))
                .filter(Boolean);
              const maxId = ids.length > 0 ? Math.max(...ids) : 0;
              newOrderId = maxId + 1;
            }
            setNextOrderId(newOrderId.toString());
            setFormData((prev) => ({ ...prev, id: newOrderId.toString() }));
            continue; // Retry
          }
          // Handle other errors
          console.error("Server response:", errorText);
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || "Failed to create order");
          } catch (e) {
            throw new Error(
              `Failed to create order: ${response.status} ${response.statusText}`
            );
          }
        } // Parse the response as JSON to get the inserted row's id
        const result = await response.json();
        console.log("Order creation result:", result);
        console.log(
          "Sales order created successfully with ID:",
          result.data?.id
        );

        if (!result.data || !result.data.id) {
          console.error("No order ID returned from API - cannot proceed");
          throw new Error("Order ID not returned from API");
        }
        console.log("Preparing to create order line items for products");

        // Prepare products payload, set sales_executive to empId if user is employee
        const productsPayload = formData.products.map((product, index) => {
          let vat = product.vatPercentage;
          if (companyType && companyType.toLowerCase() === "non trading") {
            vat = 0.0;
          }

          // Calculate vatAmount (salesTaxAmount)
          const baseAmount =
            parseFloat(product.unitPrice) * parseInt(product.quantity || 1, 10);
          const vatAmount = (baseAmount * vat) / 100;

          return {
            orderId: result.data.id,
            lineNumber: index + 1,
            erpLineNumber: index + 1,
            productId: product.id || product.product_id,
            productName: product.productName || product.product_name_en,
            productNameLc:
              product.productNameLc || product.product_name_lc || "",
            erpProdId: product.erpProdId || product.erp_prod_id || "",
            isMachine: product.isMachine || product.is_machine,
            isFresh: product.isFresh,
            quantity: parseInt(product.quantity || 1, 10),
            unit: product.unit || "",
            unitPrice: parseFloat(product.unitPrice),
            netAmount: parseFloat(product.netAmount),
            salesTaxAmount: vatAmount.toFixed(2),
            vatPercentage: Number(vat).toFixed(2),
          };
        });

        console.log("Submitting products payload:", productsPayload);
        if (productsPayload.length === 0) {
          console.warn("No valid products to submit");
          Swal.fire({
            icon: "info",
            title: t("Order Created"),
            html: `<div style="text-align: center;">
                    <p style="font-size: 16px; margin-bottom: 10px;">${t(
                      "Order created successfully, but no products were added."
                    )}</p>
                    <p style="font-size: 18px; font-weight: bold; color: #17a2b8; margin: 10px 0;">
                        ${t("Order Number")}: #${result.data.id}
                    </p>
                    <p style="font-size: 14px; color: #666;">${t(
                      "Order placed using"
                    )} ${payload.paymentMethod}</p>
                  </div>`,
            confirmButtonText: t("OK"),
          });
          // alert(t('Order created successfully, but no products were added.'));
          navigate("/orders");
          return;
        }

        console.log(
          `Prepared ${productsPayload.length} product line items for submission`
        );
        try {
          console.log("Making API call to create sales order line items");
          // productsPayload[0].is_machine=true
          const linesResponse = await fetch(
            `${API_BASE_URL}/sales-order-lines`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(productsPayload),
            }
          );
          console.log(
            "Sales order lines API response status:",
            linesResponse.status
          );

          if (!linesResponse.ok) {
            // Handle HTTP error response
            const errorText = await linesResponse.text();
            console.error("Server response for product lines:", errorText);
            try {
              const errorData = JSON.parse(errorText);
              throw new Error(
                errorData.message || "Failed to save product lines"
              );
            } catch (e) {
              throw new Error(
                `Failed to save product lines: ${linesResponse.status} ${linesResponse.statusText}`
              );
            }
          }

          console.log("Sales order line items created successfully");

          // After successfully creating sales order lines, calculate and update totalSalesTaxAmount
          const totalSalesTaxAmount = productsPayload.reduce((sum, product) => {
            return sum + parseFloat(product.sales_tax_amount || 0);
          }, 0);

          console.log("Total sales tax amount:", totalSalesTaxAmount);

          // Check if any product is a machine (is_machine = true)
          const hasAnyMachine = Array.isArray(productsPayload)
            ? productsPayload.some(
                (product) =>
                  product.is_machine === true || product.isMachine === true
              )
            : productsPayload.is_machine === true ||
              productsPayload.isMachine === true;

          // Check if any product is fresh (is_fresh = true)
          const hasAnyFresh = Array.isArray(productsPayload)
            ? productsPayload.some(
                (product) =>
                  product.is_fresh === true || product.isFresh === true
              )
            : productsPayload.is_fresh === true ||
              productsPayload.isFresh === true;

          // Update formData with isMachine flag for future use
          setFormData((prev) => ({
            ...prev,
            isMachine: hasAnyMachine,
          }));

          console.log("Product analysis for new order:", {
            totalProducts: productsPayload.length,
            hasAnyMachine,
            hasAnyFresh,
            productFlags: productsPayload.map((p) => ({
              id: p.product_id,
              isMachine: p.isMachine,
              isFresh: p.isFresh,
            })),
          });

          // Update the sales order with the total sales tax amount and product flags
          const orderUpdatePayload = {
            total_sales_tax_amount: totalSalesTaxAmount.toFixed(2),
            isMachine: hasAnyMachine,
            isFresh: hasAnyFresh,
            sampleOrder: sampleMode ? true : false,
            status: sampleMode ? "Approved" : orderStatus,
          };

          const updateOrderResponse = await fetch(
            `${API_BASE_URL}/sales-order/id/${result.data.id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(orderUpdatePayload),
            }
          );

          if (!updateOrderResponse.ok) {
            console.warn(
              "Failed to update order with total sales tax amount and product flags"
            );
          } else {
            console.log(
              "Successfully updated order with total sales tax amount and product flags:",
              {
                totalSalesTaxAmount,
                isMachine: hasAnyMachine,
                isFresh: hasAnyFresh,
              }
            );
          } // If we get here, both order and products were saved successfully
          console.log("Complete order creation process finished successfully"); // Check if this is a VMCO Machines order that needs discount workflow approval
          if (
            formData.entity &&
            formData.entity.toLowerCase() ===
              Constants.ENTITY.VMCO.toLowerCase() &&
            formData.productCategory &&
            formData.productCategory.toLowerCase() ===
              Constants.CATEGORY.VMCO_MACHINES.toLowerCase() &&
            formData.customerId
          ) {
            // Directly trigger the discount workflow without checking if it already exists
            console.log(
              `Directly triggering discount workflow for order ${result.data.id}`
            );
            console.log(`- formData.entity: "${formData.entity}"`);
            console.log(
              `- formData.productCategory: "${formData.productCategory}"`
            );
            console.log(`- formData.customerId: ${formData.customerId}`);

            await triggerDiscountWorkflow(result.data.id, formData.customerId);
          } else {
            console.log(
              "Skipping discount workflow creation in order creation because conditions failed:"
            );
            console.log(
              `- entity is vmco (case insensitive): ${
                formData.entity &&
                formData.entity.toLowerCase() ===
                  Constants.ENTITY.VMCO.toLowerCase()
              }`
            );
            console.log(
              `- productCategory is vmco machines (case insensitive): ${
                formData.productCategory &&
                formData.productCategory.toLowerCase() ===
                  Constants.CATEGORY.VMCO_MACHINES.toLowerCase()
              }`
            );
            console.log(`- has customerID: ${Boolean(formData.customerId)}`);
          } // If we get here, both order and products were saved successfully
          Swal.fire({
            icon: "success",
            title: t("Order Created Successfully!"),
            html: `<div style="text-align: center;">
                    <p style="font-size: 16px; margin-bottom: 10px;">${t(
                      "Order and products created successfully!"
                    )}</p>
                    <p style="font-size: 18px; font-weight: bold; color: #28a745; margin: 10px 0;">
                        ${t("Order Number")}: #${result.data.id}
                    </p>
                    <p style="font-size: 14px; color: #666;">${t(
                      "Please save this order number for your records."
                    )}</p>
                  </div>`,
            confirmButtonText: t("OK"),
            confirmButtonColor: "#28a745",
          });
          navigate("/orders");
        } catch (err) {
          console.error("Error saving product lines:", err);
          console.log(
            "Product line items creation failed, but order was created successfully"
          );
          // Even if product lines failed, the order was created successfully
          Swal.fire({
            icon: "warning",
            title: t("Order Created with Issues"),
            html: `<div style="text-align: center;">
                    <p style="font-size: 16px; margin-bottom: 10px;">${
                      t(
                        "Order created successfully, but there was an issue adding products: "
                      ) + err.message
                    }</p>
                    <p style="font-size: 18px; font-weight: bold; color: #ff9500; margin: 10px 0;">
                        ${t("Order Number")}: #${result.data.id}
                    </p>
                    <p style="font-size: 14px; color: #666;">${t(
                      "Please save this order number for your records."
                    )}</p>
                  </div>`,
            confirmButtonText: t("OK"),
          });
          // alert(t('Order created successfully, but there was an issue adding products: ') + err.message);
          navigate("/orders");
        }
        break; // Exit the loop on success
      } catch (err) {
        if (attempt >= maxAttempts - 1) {
          setError(err.message);
          Swal.fire({
            icon: "error",
            title: t("Error Saving Order"),
            text: t(err.message),
          });
          // alert(t(err.message));
        }
      } finally {
        setLoading(false);
      }
      attempt++;
    } // Always reset saving state at the end
    setSaving(false);
  };

  // cancel handler
  const handleCancelOrder = async (orderId) => {
    console.log("Cancelling order");
    if (!orderId) {
      Swal.fire({
        icon: "warning",
        title: t("Validation Error"),
        text: t("Order ID is missing."),
        confirmButtonText: t("OK"),
      });
      return;
    }

    const payload = {
      status: "Cancelled",
    };

    try {
      setCancelling(true);

      const response = await fetch(
        `${API_BASE_URL}/sales-order/id/${formData.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || "Failed to cancel order");
        } catch (e) {
          throw new Error(
            `Failed to cancel order: ${response.status} ${response.statusText}`
          );
        }
      }
      Swal.fire({
        icon: "success",
        title: t("Order Cancelled"),
        text: t("Order cancelled successfully!"),
        confirmButtonText: t("OK"),
      });
      navigate("/orders"); // or refresh the current view if needed
    } catch (err) {
      console.error("Error cancelling order:", err);
      setError(err.message);
      Swal.fire({
        icon: "error",
        title: t("Error Cancelling Order"),
        text: err.message || t("Failed to cancel order: "),
        confirmButtonText: t("OK"),
      });
    } finally {
      setCancelling(false);
    }
  };

    const handleCheckout = async (orderId, email = false, copyUrl = false) => {
        try {
            const { data } = await axios.post(
                `${API_BASE_URL}/generatePayment-link`,
                {
                    id: orderId,
                    endPoint: "payment-options/order",
                    IsEmail: email,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

      if (email) {
        Swal.fire({
          title: t("Payment Link Generated"),
          text: t("A payment link has been sent to the customer's email."),
          icon: "success",
          confirmButtonText: t("OK"),
        });
      } else if (copyUrl) {
        Swal.fire({
          title: t(`Payment Link`),
          html: `
      <div style="display:flex;align-items:center;">
        <input id="payment-link"
               class="swal2-input"
               style="flex:1;margin:0 8px 0 0;"
               type="text"
               value="${data.details.url}"
               readonly />
        <button id="copyBtn"
                style="padding:10px 16px; border-radius:5px; background:#32a19f; color:#fff; border:none; cursor:pointer;">
          Copy
        </button>
      </div>
    `,
          showConfirmButton: false,
          showCancelButton: false, // we’ll add our own Close button in footer
          allowOutsideClick: false,
          allowEscapeKey: false,
          footer: `
      <div style="display:flex; justify-content:flex-end; gap:10px; width:100%;">
        <button id="sendLinkBtn" class="swal2-confirm swal2-styled" style=" background:#009345">Send Link</button>
        <button id="closeBtn" class="swal2-cancel swal2-styled">Close</button>
      </div>
    `,
          didOpen: () => {
            const input = document.getElementById("payment-link");
            const copyBtn = document.getElementById("copyBtn");
            const sendLinkBtn = document.getElementById("sendLinkBtn");
            const closeBtn = document.getElementById("closeBtn");

            // Copy button
            copyBtn.addEventListener("click", async () => {
              input.select();
              input.setSelectionRange(0, 99999); // for mobile
              await navigator.clipboard.writeText(input.value);

              copyBtn.textContent = "Copied!";
              copyBtn.style.background = "#0b4c45";
            });

            // Send Link button
            sendLinkBtn.addEventListener("click", () => {
              handleCheckout(orderId, true, false);
              Swal.close();
            });

            // Close button
            closeBtn.addEventListener("click", () => {
              Swal.close();
            });
          },
        });
      } else if (!email && !copyUrl && data?.details?.url) {
        window.open(data.details.url, "_blank");
      }
    } catch (error) {
      console.error("Error generating payment link:", error);
      Swal.fire({
        title: t("Error"),
        text: t("Failed to generate payment link. Please try again later."),
        icon: "error",
        confirmButtonText: t("OK"),
      });
    }
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
    e.target.value = "";
  };

  // Open file dialog
  const openFileDialog = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Handler for input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "entity" && formMode === "add") {
      // If entity changes in add mode, update payment percentage accordingly
      // Set payment percentage to 100% if entity is not vmco
      const isVmco =
        value.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase();

      setFormData((prev) => ({
        ...prev,
        [name]: value,
        // Set payment percentage to 100% for any entity other than vmco
        paymentPercentage: !isVmco ? "100%" : prev.paymentPercentage || "30%",
      }));
    } else if (name === "category" && formMode === "add") {
      // If category changes in add mode, update payment percentage accordingly
      // and set payment method to "Pre Payment" for "VMCO Machines" category
      const isVmcoMachines = value === Constants.CATEGORY.VMCO_MACHINES;

      setFormData((prev) => ({
        ...prev,
        [name]: value, // Set payment percentage based on category
        paymentPercentage: !isVmcoMachines
          ? "100%"
          : prev.paymentPercentage || "30%",
        // Automatically set paymentMethod to "Pre Payment" for VMCO Machines category
        paymentMethod: isVmcoMachines ? "Pre Payment" : prev.paymentMethod,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // If pricing policy changes, update product prices
    if (name === "pricingPolicy" && formData.customerId) {
      updateProductPricesForPricingPolicy(value);
    }
  };

  const handleEntityChange = (e) => {
    // Check if customer is selected
    if (!formData.customerId && !formData.selectedCustomerName) {
      // No customer selected, show alert
      Swal.fire({
        icon: "warning",
        title: t("Select Customer First"),
        text: t("Please select a customer before choosing an entity."),
        confirmButtonText: t("OK"),
      });
      // Reset the dropdown to empty value
      e.target.value = "";
      return;
    }

    // Customer is selected, proceed with normal input handling
    handleInputChange(e);
  };

  // Function to update product prices when pricing policy changes
  const updateProductPricesForPricingPolicy = async (pricingPolicy) => {
    if (
      !formData.products ||
      !formData.products.length ||
      !pricingPolicy ||
      !formData.customerId
    ) {
      return;
    }

    try {
      // For each product in the list
      const updatedProducts = [...formData.products];
      const updatePromises = formData.products.map(async (product, index) => {
        // Call API to get updated price for this product with new pricing policy
        const response = await fetch(`${API_BASE_URL}/product/price`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            productId: product.id,
            customerId: formData.customerId,
            entity: formData.entity,
            pricingPolicy: pricingPolicy.toLowerCase(),
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.status === "Ok" && result.data) {
            // Update product with new price information
            const unitPrice = parseFloat(
              result.data.unitPrice || product.unitPrice
            );
            const quantity = parseInt(product.quantity, 10);
            const vatPercentage = parseFloat(
              result.data.vatPercentage || product.vatPercentage || 0
            );

            // Calculate new net amount with updated price
            const netAmount = (
              unitPrice * quantity +
              (vatPercentage / 100) * (unitPrice * quantity)
            ).toFixed(2);

            // Update product in array
            updatedProducts[index] = {
              ...product,
              unitPrice: unitPrice.toFixed(2),
              vatPercentage,
              netAmount,
            };

            // In edit mode, we don't immediately update the sales order line in the database
            // We'll only do that when the Save button is clicked
          }
        }
      });

      // Wait for all product updates to complete
      await Promise.all(updatePromises);

      // Update form data with updated products
      setFormData((prev) => ({
        ...prev,
        products: updatedProducts,
      }));
    } catch (error) {
      console.error("Error updating product prices:", error);
      Swal.fire({
        icon: "error",
        title: t("Error Updating Prices"),
        text: t("Failed to update product prices. Please try again."),
        confirmButtonText: t("OK"),
      });
      // alert(t('Failed to update prices. Please try again.'));
    }
  };
  // Function to update sales order line
  const updateSalesOrderLine = async (
    orderId,
    productId,
    unitPrice,
    quantity,
    netAmount,
    vatPercentage
  ) => {
    try {
      // Ensure vatPercentage is 0.00 (decimal) for non trading companies
      let finalVat = vatPercentage;
      if (companyType && companyType.toLowerCase() === "non trading") {
        finalVat = 0.0;
      }

      // Calculate vatAmount (salesTaxAmount)
      const baseAmount = unitPrice * quantity;
      const vatAmount = (baseAmount * finalVat) / 100;

      const response = await fetch(
        `${API_BASE_URL}/sales-order-lines/${orderId}/${productId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            quantity,
            unitPrice,
            net_amount: netAmount.toFixed(2),
            sales_tax_amount: vatAmount.toFixed(2),
            vatPercentage: Number(finalVat).toFixed(2),
          }),
        }
      );

      if (!response.ok) {
        console.error("Failed to update sales order line");
        const errorText = await response.text();
        console.error("Server response:", errorText);
      } else {
        const updatedLine = await response.json();
        console.log("Successfully updated sales order line:", updatedLine);
      }
    } catch (error) {
      console.error("Error updating sales order line:", error);
    }
  };

  // Function to delete sales order line
  const deleteSalesOrderLine = async (orderId, productId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/sales-order-lines/${orderId}/${productId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error(
          `Failed to delete sales order line for product ID ${productId}`
        );
        const errorText = await response.text();
        console.error("Server response:", errorText);
      } else {
        console.log(
          `Successfully deleted sales order line for product ID ${productId}`
        );
      }
    } catch (error) {
      console.error(
        `Error deleting sales order line for product ID ${productId}:`,
        error
      );
    }
  };

  // Function to create a new sales order line
  const createSalesOrderLine = async (
    orderId,
    productId,
    unitPrice,
    quantity,
    netAmount,
    vatPercentage
  ) => {
    try {
      // Ensure vatPercentage is 0.00 (decimal) for non trading companies
      let finalVat = vatPercentage;
      if (companyType && companyType.toLowerCase() === "non trading") {
        finalVat = 0.0;
      }

      // Calculate vatAmount (salesTaxAmount)
      const baseAmount = unitPrice * quantity;
      const vatAmount = (baseAmount * finalVat) / 100;

      // Find the product object to get productName, productNameLc, unit
      const productObj = formData.products.find(
        (p) => (p.id || p.product_id) === productId
      );
      const payload = {
        order_id: orderId,
        product_id: productId,
        isMachine: productObj?.isMachine || productObj?.is_machine,
        quantity: parseInt(quantity, 10),
        unit_price: parseFloat(unitPrice),
        net_amount: parseFloat(netAmount),
        sales_tax_amount: vatAmount.toFixed(2),
        product_name:
          productObj?.productName || productObj?.product_name_en || "",
        product_name_lc:
          productObj?.productNameLc || productObj?.product_name_lc || "",
        unit: productObj?.unit || "",
        vat_percentage: Number(finalVat).toFixed(2),
      };
      const response = await fetch(`${API_BASE_URL}/sales-order-lines`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("Failed to create sales order line");
      }
    } catch (error) {
      console.error("Error creating sales order line:", error);
    }
  };

  // Update the handleSelectProduct function to handle multiple products
  const handleSelectProduct = (products) => {
    // If products is an array (multiple selection), handle each product
    if (Array.isArray(products)) {
      setFormData((prev) => {
        const updatedProducts = [...prev.products];

        products.forEach((product) => {
          // Use MOQ for the product, default to 1 if not set
          const moq = Number(product.moq) || 1;
          // In sample mode, set price to 0, otherwise use the actual price
          const unitPrice = sampleMode ? 0 : parseFloat(product.unitPrice);
          // Determine VAT based on companyType and sample mode
          let vatPercentage = 0.0;
          if (
            !sampleMode &&
            companyType &&
            companyType.toLowerCase() === "trading"
          ) {
            vatPercentage = parseFloat(product.vatPercentage);
          }

          // Check if product already exists in the table
          const existingIdx = updatedProducts.findIndex(
            (p) => (p.id || p.product_id) === (product.id || product.product_id)
          );

          if (existingIdx !== -1) {
            // Product exists, increment quantity and update netAmount
            const existingProduct = updatedProducts[existingIdx];
            const newQuantity =
              (parseInt(existingProduct.quantity, 10) || moq) + moq;
            // In sample mode, netAmount is always 0
            const newNetAmount = sampleMode
              ? "0.00"
              : (
                  unitPrice * newQuantity +
                  (vatPercentage
                    ? (vatPercentage / 100) * (unitPrice * newQuantity)
                    : 0)
                ).toFixed(2);

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
              productNameLc: product.productNameLc,
              isMachine: product.isMachine || product.is_machine || false,
              isFresh: product.isFresh || false,
            };
          } else {
            // Product does not exist, add as new row with MOQ as quantity
            // In sample mode, netAmount is always 0
            const netAmount = sampleMode
              ? "0.00"
              : (
                  unitPrice * moq +
                  (vatPercentage
                    ? (vatPercentage / 100) * (unitPrice * moq)
                    : 0)
                ).toFixed(2);

            const newProduct = {
              id: product.id,
              product_id: product.id,
              productName: product.productName,
              productNameLc: product.productNameLc,
              erpProdId: product.erpProdId || product.erp_prod_id || "",
              quantity: moq,
              unit: product.unit,
              isMachine: product.isMachine || product.is_machine || false,
              isFresh: product.isFresh || false,
              // In sample mode, unitPrice is always 0
              unitPrice: sampleMode ? "0.00" : unitPrice.toFixed(2),
              netAmount: netAmount,
              vatPercentage: vatPercentage,
              moq: moq,
            };
            updatedProducts.push(newProduct);
          }
        });

        return {
          ...prev,
          products: updatedProducts,
        };
      });
    } else {
      // Handle single product selection (existing logic)
      // ... keep your existing single product logic here
    }

    setShowProductPopup(false);
  };

  // Handle customer selection
  const handleSelectCustomer = (customer) => {
    console.log("Selected customer:", customer);

    // Handle assignedToEntityWise which could be an object or a JSON string
    let assignedToEntityWise = {};
    if (customer.assignedToEntityWise) {
      try {
        // Check if it's already an object
        if (
          typeof customer.assignedToEntityWise === "object" &&
          customer.assignedToEntityWise !== null
        ) {
          assignedToEntityWise = customer.assignedToEntityWise;
        } else {
          // It's a string, try to parse it
          assignedToEntityWise = JSON.parse(customer.assignedToEntityWise);
        }
        console.log("Processed assignedToEntityWise:", assignedToEntityWise);
      } catch (error) {
        console.error("Error processing assignedToEntityWise:", error);
        assignedToEntityWise = {};
      }
    }

    // Format the current user's employee ID to match the format in assignedToEntityWise
    const currentEmployeeId = formatEmployeeId(user?.employeeId);
    console.log("Current formatted employee ID:", currentEmployeeId);

    const userAllowedEntities = [];
    if (currentEmployeeId && assignedToEntityWise) {
      // Find entities where this employee is assigned
      Object.entries(assignedToEntityWise).forEach(([entity, empId]) => {
        if (empId === currentEmployeeId) {
          userAllowedEntities.push(entity);
        }
      });
    }

    console.log("User allowed entities:", userAllowedEntities);
    setAllowedEntities(userAllowedEntities);

    // Ensure the pricing policy is one of the allowed options and never undefined
    let customerPricingPolicy = customer.pricingPolicy;
    if (!pricingPolicyOptions.includes(customerPricingPolicy)) {
      customerPricingPolicy = "";
    }

    setCompanyType(
      customer.companyType || (customer.data && customer.data.companyType) || ""
    );
    setFormData((prev) => ({
      ...prev,
      erpCustId: customer.erp_cust_id || customer.erpCustId || "", // Handle both property naming formats
      customerId: customer.id, // Use the database ID for the customer
      selectedCustomerName:
        i18n.language === "ar"
          ? customer.company_name_ar || customer.companyNameAr
          : customer.company_name_en || customer.companyNameEn,
      pricingPolicy: customer.pricingPolicy,
      companyNameEn: customer.company_name_en || customer.companyNameEn || "",
      companyNameAr: customer.company_name_ar || customer.companyNameAr || "",
      brandNameEn: customer.brand_name_en || customer.brandNameEn || "",
      brandNameAr: customer.brand_name_ar || customer.brandNameAr || "",
      salesExecutive: customer.assignedToEntityWise,
      assignedToEntityWise: assignedToEntityWise,
      customerRegion: customer.region || "",
    }));
    setFormData((prev) => ({
      ...prev,
      branchId: null, // Set branchId (important for API calls)
      erpBranchId: null,
      selectedBranchName: null,
      branchNameEn: null, // Set branchNameEn
      branchNameLc: null, // Set branchNameLc
      branchRegion: null, // Set branchRegion
      branchCity: null, // Set branchCity
    }));

    setShowCustomerPopup(false);
  };
  // Handle branch selection
  const handleSelectBranch = (branch) => {
    console.log("Selected branch data:", branch);
    setFormData((prev) => ({
      ...prev,
      branchId: branch.id, // Set branchId (important for API calls)
      erpBranchId: branch.erp_branch_id || branch.erpBranchId,
      selectedBranchName: branch.branch_name_en || branch.branchNameEn || "",
      branchNameEn: branch.branch_name_en || branch.branchNameEn || "", // Set branchNameEn
      branchNameLc: branch.branch_name_lc || branch.branchNameLc || "", // Set branchNameLc
      branchRegion: branch.region, // Set branchRegion
      branchCity: branch.city, // Set branchCity
    }));
    console.log("Updated form data with branch information");
    setShowBranchPopup(false);
  };

  // Add this to your state declarations section near the top of the component
  const [allowedEntities, setAllowedEntities] = useState([]);

  // Add this function inside the OrderDetails component, before the return statement
  // Function to format employee ID to match assignedToEntityWise format
  const formatEmployeeId = (id) => {
    if (!id) return "";
    // If it already has the format emp_XXXX, return as is
    if (typeof id === "string" && id.startsWith("emp_")) return id;
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
        if (formMode === "add") {
          setLoading(false);
          return;
        }
        // Always fetch order details by ID, which will also fetch products
        await getOrderById(orderFromNav.id);
      };
      fetchData();
    }
  }, [user, t, token, i18n.language, orderFromNav.id, formMode, loading]);

  // Initialize RBAC manager
  const rbacMgr = new RbacManager(
    user?.userType === "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    formMode === "add" ? "orderDetailAdd" : "orderDetailEdit"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  // Function to handle Product Stock Availability
  const handleStock = async (productId, productName) => {
    setLoadingProductId(productId);
    try {
      setInventoryLoading(true);
      const { data } = await axios.get(
        `${API_BASE_URL}/product-inventory-avalability/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProductName(productName);
      setInventoryData(data?.details || []);
      setInventoryLoading(false);
      setShowInventory(true);
    } catch (error) {
      console.error("Error fetching stock information:", error);
      Swal.fire({
        icon: "error",
        title: t("Error Fetching Stock"),
        text: t("Failed to fetch stock information for the product."),
        confirmButtonText: t("OK"),
      });
    } finally {
      setInventoryLoading(false);
    }
  };
  // Define columns for the products DataGrid
  const productColumns = [
    {
      field: "id",
      headerName: t("Product ID"),
      include: isV("productIdCol"),
      minWidth: 80,
      flex: 1,
    },
    {
      field: "productName",
      headerName: t("Product Name"),
      include: isV("productNameCol"),
      minWidth: 140,
      flex: 2,
      renderCell: (params) => {
        const row = params.row;
        return i18n.language === "ar"
          ? row.productNameLc || row.product_name_lc || row.productName
          : row.productName || row.product_name_en || row.productNameLc;
      },
    },
    {
      field: "quantity",
      headerName: t("Quantity"),
      include: isV("quantityCol"),
      minWidth: 180,
      flex: 1,
      renderCell: (params) => {
        const row = params.row;
        const idx = formData.products.findIndex(
          (p) => (p.id || p.productid) === (row.id || row.productid)
        );

        return (
          <div
            className="quantity-controller"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QuantityController
              itemId={row.id || row.productid}
              quantity={row.quantity}
              moq={Number(row.moq) || 1}
              minQuantity={Number(row.moq) || 1}
              disabled={!isE("quantityCol")}
              onQuantityChange={(itemId, delta) => {
                if (!isE("quantityCol")) return;

                if (idx !== -1) {
                  const currentQty =
                    parseInt(formData.products[idx].quantity) || 0;
                  const newQty = Math.max(0, currentQty + delta);
                  handleQuantityChange(idx, newQty);
                }
              }}
              onInputChange={(itemId, value) => {
                if (!isE("products")) return;

                if (idx !== -1) {
                  // Allow any input value - let QuantityController handle validation
                  handleQuantityChange(idx, value === "" ? "" : value);
                }
              }}
            />
            {/* Stock button for VMCO entity */}
            {isV("stock") &&
              formData.entity &&
              formData.entity.toLowerCase() ===
                Constants.ENTITY.VMCO.toLowerCase() && (
                <span>
                  <button
                    type="button"
                    style={{
                      background: "#e6f2ef",
                      color: "#0a5640",
                      border: "1px solid #0a5640",
                      borderRadius: "4px",
                      fontSize: "12px",
                      padding: "2px 8px",
                      marginLeft: "6px",
                      marginRight: "6px",
                      cursor: "pointer",
                    }}
                    title={row.unit ? `Stock for ${row.unit}` : "Stock"}
                    onClick={() =>
                      handleStock(
                        row.id,
                        i18n.language === "ar"
                          ? row.productNameLc ||
                              row.productnamelc ||
                              row.productName
                          : row.productName ||
                              row.productnameen ||
                              row.productNameLc
                      )
                    }
                  >
                    {t("Stock")}
                  </button>
                </span>
              )}
            {InventoryLoading && loadingProductId === row.id && (
              <LoadingSpinner />
            )}
          </div>
        );
      },
    },
    {
      field: "unit",
      headerName: t("Unit"),
      include: isV("unitCol"),
      minWidth: 80,
      flex: 1,
    },
    {
      field: "unitPrice",
      headerName: t("Unit Price (SAR)"),
      include: isV("unitPriceCol"),
      minWidth: 120,
      flex: 1,
      renderCell: (params) => {
        const price = parseFloat(params.value || 0);
        return price.toFixed(2);
      },
    },
    {
      field: "vatPercentage",
      headerName: t("VAT"),
      include: isV("vatPercentageCol"),
      minWidth: 50,
      flex: 1,
      renderCell: (params) => {
        return parseFloat(params.value || 0).toFixed(2) + "%";
      },
    },
    {
      field: "netAmount",
      headerName: t("Net Amount (SAR)"),
      include: isV("netAmountCol"),
      minWidth: 150,
      flex: 1,
      renderCell: (params) => {
        return parseFloat(params.value || 0).toFixed(2);
      },
    },
    ...(isE("deleteCol")
      ? [
          {
            field: "actions",
            headerName: t("Actions"),
            include: isV("deleteButton"),
            minWidth: 100,
            flex: 1,
            sortable: false,
            disableColumnMenu: true,
            renderCell: (params) => {
              const row = params.row;
              const idx = formData.products.findIndex(
                (p) => (p.id || p.productid) === (row.id || row.productid)
              );

              return (
                isV("deleteButton") &&
                isE("deleteCol") && (
                  <button
                    className="order-action-btn reject"
                    style={{ padding: "4px 10px", fontSize: 14 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProductRow(idx);
                    }}
                    type="button"
                    disabled={
                      !isE("deleteButton") ||
                      (formData.status &&
                        !["open"].includes(formData.status.toLowerCase()))
                    }
                  >
                    {t("Delete")}
                  </button>
                )
              );
            },
          },
        ]
      : []),
  ];

  // Filter visible columns
  const visibleProductColumns = productColumns.filter(
    (col) => col.include !== false
  );

  // Add this useEffect to fetch entity options
  useEffect(() => {
    const fetchEntityOptions = async () => {
      try {
        // Updated URL to include query parameter for entity master type
        const response = await fetch(
          `${API_BASE_URL}/basics-masters?filters={"masterName": "entity"}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch entity options");

        const result = await response.json();

        if (result.status === "Ok" && result.data) {
          const options = result.data;
          // Extract entity values from the response data
          const entityValues = options.map((item) => item.value);
          setEntityOptions(entityValues);
        } else if (result.data && Array.isArray(result.data)) {
          const options = result.data;
          // Handle the actual response structure we're seeing in the logs
          const entityValues = options.map((item) => item.value);
          setEntityOptions(entityValues);
        } else {
          throw new Error("Unexpected response format for entity options");
        }
      } catch (err) {
        console.error("Error fetching entity options:", err);
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
          pageSize: 10, // Fetch a reasonable number of customers
          sortBy:
            i18n.language === "ar" ? "company_name_ar" : "company_name_en",
          sortOrder: "asc",
          purpose: "order creation",
        });
        console.log(
          "Fetching customer options with params:",
          params.toString()
        );
        const response = await fetch(
          `${API_BASE_URL}/customers/pagination?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch customer options");

        const result = await response.json();
        console.log("Customer options response:", result);
        if (
          result.status === "Ok" &&
          result.data &&
          Array.isArray(result.data.data)
        ) {
          setCustomerOptions(result.data.data);
        } else {
          throw new Error("Unexpected response format for customer options");
        }
      } catch (err) {
        console.error("Error fetching customer options:", err);
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
        const response = await fetch(
          `${API_BASE_URL}/basics-masters?filters={"masterName": "paymentMethod"}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok)
          throw new Error("Failed to fetch payment method options");

        const result = await response.json();

        if (result.status === "Ok" && result.data) {
          const options = result.data;
          // Extract payment method values from the response data
          const paymentMethodValues = options.map((item) => item.value);
          setPaymentMethodOptions(paymentMethodValues);
        } else if (result.data && Array.isArray(result.data)) {
          const options = result.data;
          // Handle the actual response structure we're seeing in the logs
          const paymentMethodValues = options.map((item) => item.value);
          setPaymentMethodOptions(paymentMethodValues);
        } else {
          throw new Error(
            "Unexpected response format for payment method options"
          );
        }
      } catch (err) {
        console.error("Error fetching payment method options:", err);
      }
    };

    fetchPaymentMethodOptions();
  }, []);

  // Calculate totalAmount as the sum of netAmount plus VAT for all products
  useEffect(() => {
    // If it's a sample order, always set values to 0.00
    if (sampleMode || formData.sample_order) {
      setFormData((prev) => ({
        ...prev,
        deliveryCharges: "0.00",
        totalAmount: "0.00",
      }));
      return;
    }

    // Calculate totals for non-sample orders
    if (Array.isArray(formData.products) && formData.products.length > 0) {
      // Since netAmount already includes VAT, just sum the netAmount values
      const netTotalWithVAT = formData.products.reduce((sum, p) => {
        const net = parseFloat(p.netAmount) || 0;
        return sum + net;
      }, 0);

      // Calculate delivery charges based on net amount (this should use base amount without VAT if available)
      // For delivery calculation, we might need base amount without VAT
      const netTotalForDelivery = formData.products.reduce((sum, p) => {
        const net = parseFloat(p.netAmount) || 0;
        const vatPercentage = parseFloat(p.vatPercentage) || 0;
        // Calculate base amount by removing VAT from netAmount
        const baseAmount =
          vatPercentage > 0 ? net / (1 + vatPercentage / 100) : net;
        return sum + baseAmount;
      }, 0);

      // Calculate delivery charges based on base amount (without VAT)
      let deliveryCharges = "0.00";
      if (
        formData.entity &&
        formData.entity.toLowerCase() !== Constants.ENTITY.VMCO.toLowerCase()
      ) {
        if (netTotalForDelivery <= 150) {
          deliveryCharges = "20.00";
        }
      }

      // Final total = net with VAT + delivery charges
      const finalTotal = netTotalWithVAT + parseFloat(deliveryCharges);

      // Update only if values have changed
      if (
        formData.deliveryCharges !== deliveryCharges ||
        formData.totalAmount !== finalTotal.toFixed(2)
      ) {
        setFormData((prev) => ({
          ...prev,
          deliveryCharges,
          totalAmount: finalTotal.toFixed(2),
        }));
      }
    } else {
      // No products, set everything to 0
      if (
        formData.totalAmount !== "0.00" ||
        formData.deliveryCharges !== "0.00"
      ) {
        setFormData((prev) => ({
          ...prev,
          deliveryCharges: "0.00",
          totalAmount: "0.00",
        }));
      }
    }
  }, [formData.products, formData.entity, sampleMode, formData.sample_order]);

  // Set payment percentage based on category
  useEffect(() => {
    // Only auto-set payment percentage in add mode
    if (formMode === "add") {
      // For initial load or when category changes
      if (formData.category && formData.category !== "VMCO Machines") {
        // For non-VMCO Machines categories, set default to 100%
        setFormData((prev) => ({
          ...prev,
          paymentPercentage: 100,
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
          pageSize: 10,
          search: "",
          sortBy: "id",
          sortOrder: "asc",
          filters: JSON.stringify({ order_id: orderId }),
        });

        const url = `${API_BASE_URL}/sales-order-lines/pagination?${params.toString()}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch order products");

        const result = await response.json();
        if (
          result.status === "Ok" &&
          result.data &&
          Array.isArray(result.data.data)
        ) {
          // Map the product data to ensure we use productName instead of erpProdId
          const processedProducts = result.data.data.map((product) => ({
            ...product,
            id: product.productId,
            productName:
              product.productName ||
              product.product_name ||
              product.erp_prod_id,
            isMachine: product.isMachine,
            isFresh: product.isFresh,
            quantity: product.quantity,
          }));

          setFormData((prev) => ({
            ...prev,
            products: processedProducts,
          }));

          // Store the original product list for comparison when saving
          setOriginalProducts(processedProducts);
          console.log(
            "Stored original products for comparison:",
            processedProducts
          );
        }
      } catch (err) {
        console.error("Error fetching order products:", err);
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
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch order details");
      const result = await response.json();
      if (result.status === "Ok" && result.data) {
        console.log("Order details received in getOrderById:", result.data);
        setFormData({
          ...result.data,
          expectedDeliveryDate: result.data.expectedDeliveryDate || "",
          products: result.data.products || [],
        }); // Also fetch the order lines by updating orderId which triggers useEffect
        setOrderId(id);
      } else {
        throw new Error(result.message || "Order not found");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError(err.message);
    }
  };

  // Note: checkWorkflowInstance function removed as we're now directly creating workflow instances
  // Function to directly create a discount workflow instance regardless of whether one already exists
  const triggerDiscountWorkflow = async (orderId, customerId) => {
    try {
      // Validate inputs with detailed checking
      if (!orderId || orderId === null || orderId === undefined) {
        console.error(
          "Missing or invalid orderId in triggerDiscountWorkflow:",
          orderId
        );
        return false;
      }

      if (!customerId || customerId === null || customerId === undefined) {
        console.error(
          "Missing or invalid customerId in triggerDiscountWorkflow:",
          customerId
        );
        return false;
      }

      // Validate required environment variables and auth
      if (!API_BASE_URL) {
        console.error(
          "API_BASE_URL is not defined. Check your environment variables."
        );
        return false;
      }

      if (!token) {
        console.error(
          "Authentication token is not available. User may not be logged in."
        );
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
      if (!orderIdStr || orderIdStr === "null" || orderIdStr === "undefined") {
        console.error("OrderId converted to invalid string:", orderIdStr);
        return false;
      }

      if (
        !customerIdStr ||
        customerIdStr === "null" ||
        customerIdStr === "undefined"
      ) {
        console.error("CustomerId converted to invalid string:", customerIdStr);
        return false;
      }
      const payload = {
        customerId: customerIdStr,
        salesOrderId: orderIdStr,
      };

      // Final payload validation
      console.log("Final payload validation:");
      console.log("- payload:", JSON.stringify(payload));
      console.log("- customerId length:", customerIdStr.length);
      console.log("- salesOrderId length:", orderIdStr.length);

      // Ensure payload values are not empty strings
      if (!payload.customerId || !payload.salesOrderId) {
        console.error("Payload contains empty strings:", payload);
        return false;
      }

      console.log("Directly creating discount workflow with payload:", payload);
      console.log(
        `API URL: ${API_BASE_URL}/workflow-instance/create/vmco/machines/discount`
      );
      console.log("Token available:", !!token);

      // Note: The backend should handle duplicate workflow instances gracefully
      const response = await fetch(
        `${API_BASE_URL}/workflow-instance/create/vmco/machines/discount`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Adding Authorization header with token
          },
          body: JSON.stringify(payload),
        }
      );

      console.log("Discount workflow API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Error triggering discount workflow (status: ${response.status}):`,
          errorText
        );
        try {
          // Try to parse the error as JSON for more details
          const errorJson = JSON.parse(errorText);
          console.error("Error details:", errorJson);
        } catch (e) {
          // If parsing fails, just log the raw text
          console.error("Raw error response:", errorText);
        }
        return false;
      }

      const result = await response.json();
      console.log("Discount workflow triggered successfully:", result);
      return true;
    } catch (err) {
      console.error("Error triggering discount workflow (exception):", err);
      console.error(err.stack || "No stack trace available");
      return false;
    }
  };

  //discount approval code block end -----------------------------------------------------------------------------------------------------

  const handleApprovalSubmit = (action) => {
    setApprovalAction(action);
    setIsApprovalDialogOpen(true);
  }; // Handle dialog submit for order approval/rejection just like in customersDetails.js
  const handleDialogSubmit = async (comment) => {
    // Build workflowData payload (add updates if needed, similar to customersDetails)
    let updates = {
      ...((location.state?.workflowData &&
        location.state.workflowData.updates) ||
        {}),
    };

    try {
      // Ensure we have the latest order data
      console.log("Getting latest order data before proceeding with approval");
      await getOrderById(formData.id);

      // STEP 1: First update sales order lines and sales order if needed
      // --- BEGIN: PATCH order lines and order if approving in approval mode and status is pending ---
      if (
        approvalAction === "approve" &&
        fromApproval &&
        formData.status &&
        formData.status.toLowerCase() === "pending"
      ) {
        try {
          console.log(
            "Updating sales order lines and sales order before approval"
          );

          // 1. Update existing sales order lines and create new ones
          for (const product of formData.products) {
            const productId = product.id || product.product_id;
            const unitPrice = parseFloat(product.unitPrice);
            const quantity = parseInt(product.quantity, 10);
            const netAmount = parseFloat(product.netAmount);
            const vatPercentage = parseFloat(product.vatPercentage || 0);

            // Check if this product exists in the original products (was part of the original order)
            const existsInOriginal = originalProducts.some(
              (originalProduct) =>
                (originalProduct.id || originalProduct.product_id) === productId
            );
            if (existsInOriginal) {
              // Product exists in original order - PATCH to update it
              console.log(`Updating existing product line: ${productId}`);
              const patchResponse = await fetch(
                `${API_BASE_URL}/sales-order-lines/${formData.id}/${productId}`,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    quantity,
                    unitPrice,
                    net_amount: netAmount.toFixed(2),
                    vatPercentage: vatPercentage.toFixed(2),
                  }),
                }
              );

              if (!patchResponse.ok) {
                const errorText = await patchResponse.text();
                throw new Error(
                  `Failed to update product line ${productId}: ${errorText}`
                );
              }
            } else {
              // Product is new - POST to create it
              console.log(`Creating new product line: ${productId}`);
              const postResponse = await fetch(
                `${API_BASE_URL}/sales-order-lines`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    orderId: formData.id,
                    productId: productId,
                    productName:
                      product.productName || product.product_name_en || "",
                    productNameLc:
                      product.productNameLc || product.product_name_lc || "",
                    isMachine: product.isMachine || product.is_machine,
                    isFresh: product.isFresh || product.is_fresh,
                    quantity,
                    unitPrice,
                    net_amount: netAmount.toFixed(2),
                    vatPercentage: product.vatPercentage.toFixed(2),
                    erpProdId: product.erpProdId || product.erp_prod_id || "",
                    unit: product.unit || "",
                  }),
                }
              );

              if (!postResponse.ok) {
                const errorText = await postResponse.text();
                throw new Error(
                  `Failed to create new product line ${productId}: ${errorText}`
                );
              }
            }
          }

          // 2. Update the sales order's totalAmount and payment percentage
          // Prepare the payload for PATCH
          const patchPayload = {
            totalAmount: formData.totalAmount,
            paymentPercentage: formData.paymentPercentage
              ? formData.paymentPercentage === "100%"
                ? "100.00"
                : formData.paymentPercentage === "30%"
                ? "30.00"
                : "0.00"
              : "0.00",
          };
          // If pricingPolicy is present, include it in the update
          if (formData.pricingPolicy) {
            patchPayload.pricingPolicy = formData.pricingPolicy;
          }

          console.log("Updating sales order with payload:", patchPayload);
          const orderUpdateResponse = await fetch(
            `${API_BASE_URL}/sales-order/id/${formData.id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(patchPayload),
            }
          );

          if (!orderUpdateResponse.ok) {
            const errorText = await orderUpdateResponse.text();
            throw new Error(`Failed to update sales order: ${errorText}`);
          }

          console.log("Successfully updated sales order lines and sales order");
        } catch (err) {
          Swal.fire({
            icon: "error",
            title: t("Error Updating Order"),
            text:
              t("Failed to update order or lines before approval: ") +
              (err.message || err),
            confirmButtonText: t("OK"),
          });
          return;
        }
      }

      // --- END: PATCH order lines and order if approving in approval mode and status is pending ---
      // STEP 2: Directly create discount workflow without checking if it exists
      console.log("Creating discount workflow instance...");
      console.log("formData:", {
        id: formData.id,
        entity: formData.entity,
        productCategory: formData.productCategory,
        customerId: formData.customerId,
      });

      // Additional debugging for the IDs
      console.log("Detailed formData validation:");
      console.log(
        `- formData.id type: ${typeof formData.id}, value: ${formData.id}`
      );
      console.log(
        `- formData.customerId type: ${typeof formData.customerId}, value: ${
          formData.customerId
        }`
      ); // Use case-insensitive comparison for entity
      if (
        formData.entity &&
        formData.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase() &&
        formData.isMachine &&
        formData.isMachine === true &&
        formData.customerId &&
        formData.id
      ) {
        // Additional validation before calling the workflow
        if (
          formData.id &&
          formData.customerId &&
          formData.id !== null &&
          formData.id !== undefined &&
          formData.customerId !== null &&
          formData.customerId !== undefined
        ) {
          console.log(
            `Directly triggering discount workflow for order ${formData.id} with customer ${formData.customerId}`
          );
          const workflowTriggered = await triggerDiscountWorkflow(
            formData.id,
            formData.customerId
          );
          console.log(`Discount workflow triggered: ${workflowTriggered}`);
        } else {
          console.error(
            "Cannot trigger discount workflow - invalid ID values:"
          );
          console.error(
            `- orderId: ${formData.id} (type: ${typeof formData.id})`
          );
          console.error(
            `- customerId: ${
              formData.customerId
            } (type: ${typeof formData.customerId})`
          );
        }
      } else {
        console.log(
          "Skipping discount workflow - not a VMCO Machines order or missing customer ID"
        );
        console.log(`- entity: ${formData.entity}`);
        console.log(
          `- entity.toLowerCase() === 'vmco': ${
            formData.entity &&
            formData.entity.toLowerCase() ===
              Constants.ENTITY.VMCO.toLowerCase()
          }`
        );
        console.log(`- isMachine is: ${formData.isMachine}`);
        console.log(`- customerId: ${Boolean(formData.customerId)}`);
      }

      // STEP 3: Submit the approval for the sales order
      const payload = {
        workflowData: {
          ...(location.state?.workflowData || {}),
          updates,
        },
        approvedStatus: approvalAction === "approve" ? "Approved" : "Rejected",
        comment: comment,
      };

      console.log("Submitting sales order approval with payload:", payload);

      const res = await fetch(`${API_BASE_URL}/workflow-instance/id/${wfid}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: t(
            approvalAction === "approve"
              ? "Approved Successfully"
              : "Rejected Successfully"
          ),
          confirmButtonText: t("OK"),
        });
        // alert(t(`${approvalAction.charAt(0).toUpperCase() + approvalAction.slice(1)} successful!`));
        setIsApprovalDialogOpen(false);
        navigate("/orders");
      } else {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to submit approval");
      }
    } catch (error) {
      console.error(`Error ${approvalAction}ing order:`, error);
      Swal.fire({
        icon: "error",
        title: t("Error Submitting Approval"),
        text: t(`Error ${approvalAction}ing order: ${error.message}`),
        confirmButtonText: t("OK"),
      });
      // alert(t(`Error ${approvalAction}ing order: ${error.message}`));
      setIsApprovalDialogOpen(false);
    }
  };

  // Add this handler inside your component, before return
  function handleSelectPaymentMethod(method) {
    setShowPaymentPopup(false);
    setFormData((prev) => {
      // If Cash on Delivery is selected and entity is VMCO, set status to Pending
      if (
        method &&
        method.toLowerCase() === "cash on delivery" &&
        prev.entity &&
        prev.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()
      ) {
        return { ...prev, paymentMethod: method, status: "Pending" };
      }
      return { ...prev, paymentMethod: method };
    });
    // If a save was pending, continue with save
    if (pendingSaveAction) {
      handleSave(pendingSaveAction, method);
      setPendingSaveAction(null);
    }
  }

  // Debug effect to monitor products loading
  useEffect(() => {
    console.log("formData.products changed:", {
      count:
        formData.products && formData.products.length
          ? formData.products.length
          : 0,
      products: formData.products,
      mode: formMode,
      fromApproval,
      orderId: orderFromNav.id,
    });
  }, [
    formData.products ? formData.products.length : 0,
    formMode,
    fromApproval,
    orderFromNav.id,
  ]);
  // Safety effect to handle late-arriving pre-fetched data
  useEffect(() => {
    if (formMode === "add") return;

    // If we have pre-fetched data but no products loaded yet, load them
    if (
      salesOrderLinesFromNav &&
      salesOrderLinesFromNav.length > 0 &&
      formData.products &&
      formData.products.length === 0
    ) {
      console.log("Late-loading pre-fetched sales order lines");
      const processedProducts = salesOrderLinesFromNav.map((product) => ({
        ...product,
        id: product.productId || product.id,
        productName:
          product.productName || product.product_name || product.erp_prod_id,
        isMachine: product.isMachine,
        isFresh: product.isFresh,
        quantity: product.quantity,
      }));

      setFormData((prev) => ({
        ...prev,
        products: processedProducts,
      }));

      setOriginalProducts(processedProducts);
      console.log(
        "Late-loaded pre-fetched sales order lines:",
        processedProducts
      );
    }
  }, [
    salesOrderLinesFromNav,
    formData.products ? formData.products.length : 0,
    formMode,
  ]);

  const handleViewSignature = async (orderId, customerId, Invoices) => {
    setShowModal(true);
    try {
      // Reset PDF files before loading new ones
      setPdfFiles([]); // Optional but recommended to avoid stacking from previous view

      for (let file of Invoices) {
        const { data } = await axios.post(
          `${API_BASE_URL}/get-files`,
          {
            fileName: file,
            containerType: "invoices",
            id: customerId, // replaced hardcoded id:64
            orderId: orderId, // replaced hardcoded orderId:3
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (data?.status === "Ok" && data.data) {
          setPdfFiles((prevFiles) => [...prevFiles, data.data]);
        }
      }
    } catch (error) {
      console.error("Error fetching signature files:", error);
    }
  };
  const handleClose = () => {
    setShowModal(false);
    setPdfFiles([]);
  };
  console.log("formMode111111111", formMode, orderFromNav);
  const getDeliveryFiles = async (erpOrderId) => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/get-delivery-files`,
        {
          containerType: "delivery",
          erpOrderId: erpOrderId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return data?.data;
    } catch (error) {
      console.error("Error fetching delivery files:", error);
      throw error;
    }
  };
  useEffect(() => {
    if (formMode === "add") return;

    const fetchImages = async () => {
      if (
        orderFromNav &&
        orderFromNav?.erpOrderId &&
        orderFromNav?.status?.toLowerCase() === "delivered"
      ) {
        try {
          const result = await getDeliveryFiles(orderFromNav?.erpOrderId);
          setDeliveryImages(result || []);
          console.log("Fetched delivery images:", result.data || []);
        } catch (error) {
          console.error("Failed to fetch delivery images:", error);
        }
      }
    };

    fetchImages();
  }, [formMode, orderFromNav]);

  return (
    <Sidebar>
      {isV("orderDetails") && (
        <div>
          <div className="order-details-container">
            <div
              className={`order-details-content ${
                isCommentPanelOpen ? "collapsed" : ""
              }`}
            >
              <div className="order-details-body">
                <h2 className="order-details-title">
                  {formMode === "add"
                    ? `${t("New Order")}`
                    : `${t("Order #")} ${formData.id}`}
                </h2>
                <h4 style={{ color: "#525b6d" }}> {t("Order Details")}</h4>
                <div className="order-details-section">
                  <div
                    className="order-details-grid "
                    style={{ marginTop: "20px" }}
                  >
                    {isV("customerName") && (
                      <div className="order-details-field">
                        <label htmlFor="customerField">
                          {t("Customer Company Name")}
                        </label>
                        {formMode === "add" ? (
                          <div
                            className="customer-input-container"
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            <input
                              id="customerField"
                              name="selectedCustomerName"
                              defaultValue={
                                i18n.language === "ar"
                                  ? formData.companyNameAr ||
                                    formData.selectedCustomerName ||
                                    ""
                                  : formData.companyNameEn ||
                                    formData.selectedCustomerName ||
                                    ""
                              }
                              onClick={() => setShowCustomerPopup(true)}
                              className="customer-input"
                              placeholder={t("Click to select customer")}
                              disabled={!isE("customerName")}
                              autoComplete="off"
                            />
                          </div>
                        ) : (
                          <input
                            id="customerField"
                            name="selectedCustomerName"
                            value={
                              i18n.language === "ar"
                                ? formData.companyNameAr ||
                                  formData.selectedCustomerName ||
                                  ""
                                : formData.companyNameEn ||
                                  formData.selectedCustomerName ||
                                  ""
                            }
                            disabled={isE("customerName")}
                            readOnly
                          />
                        )}
                      </div>
                    )}
                    {isV("branchName") && (
                      <div className="order-details-field">
                        <label>{t("Branch")}</label>
                        {formMode === "add" ? (
                          <div
                            className="customer-input-container"
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            <input
                              id="branchField"
                              name="selectedBranchName"
                              value={
                                formData.selectedBranchName !== undefined &&
                                formData.selectedBranchName !== null
                                  ? formData.selectedBranchName
                                  : ""
                              }
                              onClick={() => {
                                if (!formData.selectedCustomerName) {
                                  Swal.fire({
                                    icon: "warning",
                                    title: t("No Customer Selected"),
                                    text: t("Please select a customer first"),
                                    confirmButtonText: t("OK"),
                                  });
                                  return;
                                }
                                if (isE("branchName")) setShowBranchPopup(true);
                              }}
                              className="customer-input"
                              placeholder={t("Click to select branch")}
                              readOnly
                              disabled={!isE("branchName")}
                              autoComplete="off"
                            />
                          </div>
                        ) : (
                          <input
                            id="branchNameField"
                            name="branchName"
                            value={
                              i18n.language === "ar"
                                ? formData.branchNameLc ||
                                  formData.selectedBranchName ||
                                  ""
                                : formData.branchNameEn ||
                                  formData.selectedBranchName ||
                                  ""
                            }
                            disabled
                            readOnly
                          />
                        )}
                      </div>
                    )}
                    {isV("orderBy") && (
                      <div className="order-details-field">
                        <label>{t("Order By")}</label>
                        <input
                          name="orderBy"
                          value={
                            formData.orderBy !== undefined &&
                            formData.orderBy !== null
                              ? formData.orderBy
                              : ""
                          }
                          onChange={handleInputChange}
                          disabled={!isE("orderBy")}
                        />
                      </div>
                    )}
                    {isV("erpOrderId") && (
                      <div className="order-details-field">
                        <label>{t("Sales Order ID")}</label>
                        <input
                          name="erpOrderId"
                          value={
                            formData.erpOrderId !== undefined &&
                            formData.erpOrderId !== null
                              ? formData.erpOrderId
                              : ""
                          }
                          onChange={handleInputChange}
                          disabled={!isE("erpOrderId")}
                          placeholder={t("ERP#")}
                        />
                      </div>
                    )}
                    {isV("entity") && (
                      <div className="order-details-field">
                        <label>{t("Entity")}</label>
                        {formMode === "add" ? (
                          <select
                            name="entity"
                            value={formData.entity || ""}
                            onClick={handleEntityChange}
                            onChange={handleInputChange}
                            className="entity-dropdown"
                            disabled={
                              !isE("entity") ||
                              (formData.products &&
                                formData.products.length > 0)
                            }
                          >
                            <option value="">{t("Select Entity")}</option>
                            {entityOptions.map((entity, index) => {
                              // Check if this entity is in the allowed list (case-insensitive)
                              const isEntityAllowed =
                                allowedEntities.length === 0 ||
                                allowedEntities.some(
                                  (allowedEntity) =>
                                    allowedEntity.toLowerCase() ===
                                    entity.toLowerCase()
                                );

                              return (
                                <option
                                  key={index}
                                  value={entity}
                                  disabled={!isEntityAllowed}
                                  style={
                                    !isEntityAllowed
                                      ? {
                                          color: "#aaa",
                                          backgroundColor: "#f5f5f5",
                                        }
                                      : {}
                                  }
                                >
                                  {entity}
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          <input
                            name="entity"
                            value={formData.entity || ""}
                            disabled
                          />
                        )}
                      </div>
                    )}
                    {isV("category") && (
                      <div className="order-details-field">
                        <label>{t("VMCO Category")}</label>
                        {formMode === "add" ? (
                          <Dropdown
                            name="category"
                            value={formData.category || ""}
                            onChange={handleInputChange}
                            options={
                              formData.entity &&
                              formData.entity.toLowerCase() ===
                                Constants.ENTITY.VMCO.toLowerCase()
                                ? VMCO_CATEGORIES.map((category) => ({
                                    value: category,
                                    label: category,
                                  }))
                                : []
                            }
                            className="category-dropdown"
                            placeholder={t("Applicable for VMCO products")}
                            disabled={
                              !isE("category") ||
                              (formData.products &&
                                formData.products.length > 0) ||
                              !formData.entity ||
                              formData.entity.toLowerCase() !==
                                Constants.ENTITY.VMCO.toLowerCase()
                            }
                          />
                        ) : (
                          <input
                            name="category"
                            value={formData.category || ""}
                            disabled
                          />
                        )}
                      </div>
                    )}
                    {isV("paymentMethod") && (
                      <div className="order-details-field">
                        <label>{t("Payment Method")}</label>
                        <input
                          name="paymentMethod"
                          value={t(
                            formData.paymentMethod?.toLowerCase() ===
                              "pre payment"
                              ? "Card Payment"
                              : formData.paymentMethod
                          )}
                          disabled
                        />
                      </div>
                    )}
                    {isV("totalAmount") && (
                      <div className="order-details-field">
                        <label>{t("Total Amount")}</label>
                        <input
                          name="totalAmount"
                          value={formData.totalAmount}
                          disabled
                          readOnly
                        />
                      </div>
                    )}{" "}
                    {isV("paymentPercentage", fromApproval, true) &&
                      fromApproval && (
                        <div className="order-details-field">
                          <label>{t("Payment Percentage")}</label>
                          {formMode === "add" ? (
                            <select
                              name="paymentPercentage"
                              value={formData.paymentPercentage ?? ""}
                              onChange={handleInputChange}
                              disabled={
                                fromApproval
                                  ? false
                                  : formData.category !==
                                    Constants.CATEGORY.VMCO_MACHINES
                              }
                            >
                              <option value="">
                                {t("Select Payment Percentage")}
                              </option>
                              {paymentPercentageOptions.map((option, index) => (
                                <option key={index} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <select
                              name="paymentPercentage"
                              value={formData.paymentPercentage ?? ""}
                              onChange={handleInputChange}
                              disabled={fromApproval ? false : true}
                            >
                              <option value="">
                                {t("Select Payment Percentage")}
                              </option>
                              {paymentPercentageOptions.map((option, index) => (
                                <option key={index} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    {isV("paidAmount") && (
                      <div className="order-details-field">
                        <label>{t("Amount Paid")}</label>
                        <input
                          name="paidAmount"
                          value={
                            parseFloat(formData.paidAmount).toFixed(2)
                              ? parseFloat(formData.paidAmount).toFixed(2)
                              : 0.0
                          }
                          onChange={handleInputChange}
                          disabled={!isE("paidAmount")}
                        />
                      </div>
                    )}
                    {isV("deliveryCharges") && (
                      <div className="order-details-field">
                        <label>{t("Delivery Charges")}</label>
                        <input
                          name="deliveryCharges"
                          value={formData.deliveryCharges ?? ""}
                          disabled
                          readOnly
                        />
                      </div>
                    )}
                    {isV("expectedDeliveryDate") && (
                      <div className="order-details-field">
                        <label>{t("Delivery Date")}</label>
                        {formMode === "add" ? (
                          <input
                            type="text"
                            name="expectedDeliveryDate"
                            value={t("Delivery Date will be updated later")}
                            disabled
                            readOnly
                            style={{
                              background: "#f9f9f9",
                              color: "#999",
                              cursor: "not-allowed",
                            }}
                          />
                        ) : fromApproval ? (
                          <input
                            type="text"
                            name="expectedDeliveryDate"
                            value={
                              formData.expectedDeliveryDate
                                ? convertToTimezone(
                                    formData.expectedDeliveryDate,
                                    TIMEZONES.SAUDI_ARABIA,
                                    "DD/MM/YYYY"
                                  )
                                : "Delivery date will be updated soon"
                            }
                            disabled
                            readOnly
                            style={{
                              background: "#f9f9f9",
                              color: formData.expectedDeliveryDate
                                ? "#000"
                                : "#999",
                            }}
                          />
                        ) : formData.expectedDeliveryDate ? (
                          <input
                            type="date"
                            name="expectedDeliveryDate"
                            value={convertToTimezone(
                              formData.expectedDeliveryDate,
                              TIMEZONES.SAUDI_ARABIA,
                              "YYYY-MM-DD"
                            )}
                            onChange={handleInputChange}
                            disabled={!isE("expectedDeliveryDate")}
                          />
                        ) : (
                          <input
                            type="text"
                            name="expectedDeliveryDate"
                            value={t("Delivery date will be updated soon")}
                            disabled
                            readOnly
                            style={{
                              background: "#f9f9f9",
                              color: "#999",
                              cursor: "not-allowed",
                            }}
                          />
                        )}
                      </div>
                    )}
                    {isV("pricingPolicy", fromApproval, true) &&
                      fromApproval && (
                        <div className="order-details-field">
                          <label>{t("Pricing Policy")}</label>
                          <select
                            name="pricingPolicy"
                            value={formData.pricingPolicy || ""}
                            onChange={handleInputChange}
                            className="entity-dropdown"
                            disabled={!isE("pricingPolicy")}
                          >
                            {pricingPolicyOptions.map(
                              (pricingPolicy, index) => (
                                <option key={index} value={pricingPolicy}>
                                  {pricingPolicy}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      )}
                    {/* Reservation Status field - visible only in edit mode for VMCO entity with machines */}
                    {isV("reservationStatus") &&
                      isEditMode &&
                      formData.entity &&
                      formData.entity.toLowerCase() ===
                        Constants.ENTITY.VMCO.toLowerCase() &&
                      (formData.isMachine === true ||
                        (formData.products &&
                          formData.products.length > 0 &&
                          formData.products.some(
                            (product) => product.isMachine === true
                          ))) &&
                      (user?.roles?.[0] === Constants.ROLES.CUSTOMER_PRIMARY ||
                        user?.roles?.[0] === Constants.ROLES.BRANCH_PRIMARY ||
                        (user?.userType === "employee" &&
                          user?.designation ===
                            Constants.DESIGNATIONS.SALES_EXECUTIVE) ||
                        user?.roles?.[0] === Constants.ROLES.SUPER_ADMIN) && (
                        <div className="order-details-field">
                          <label>{t("Reservation Status")}</label>
                          <input
                            name="reservationStatus"
                            value={
                              formData.reserved === true
                                ? t("Reserved")
                                : t("Unreserved")
                            }
                            disabled={!isE("reservationStatus")}
                            style={
                              !isE("reservationStatus")
                                ? {
                                    background: "#f9f9f9",
                                    color: "#999",
                                    cursor: "not-allowed",
                                  }
                                : {}
                            }
                            readOnly
                          />
                        </div>
                      )}
                    {isV("createdDate") && (
                      <div className="order-details-field">
                        <label>{t("Order Placement Date")}</label>
                        <input
                          name="createdDate"
                          value={
                            formData.createdAt
                              ? convertToTimezone(
                                  formData.createdAt,
                                  TIMEZONES.SAUDI_ARABIA,
                                  "DD/MM/YYYY HH:MM"
                                )
                              : ""
                          }
                          disabled
                        />
                      </div>
                    )}
                    {isV("updatedDate") && (
                      <div className="order-details-field">
                        <label>{t("Updated Date")}</label>
                        <input
                          name="updatedDate"
                          value={
                            formData.updatedAt
                              ? convertToTimezone(
                                  formData.updatedAt,
                                  TIMEZONES.SAUDI_ARABIA,
                                  "DD/MM/YYYY HH:MM"
                                )
                              : ""
                          }
                          disabled
                        />
                      </div>
                    )}
                    {isV("driver") && (
                      <div className="order-details-field">
                        <label>{t("Driver")}</label>
                        <input
                          name="driver"
                          value={formData.driver ?? ""}
                          onChange={handleInputChange}
                          disabled={!isE("driver")}
                        />
                      </div>
                    )}
                    {isV("vehicleNumber") && (
                      <div className="order-details-field">
                        <label>{t("Vehicle Number")}</label>
                        <input
                          name="vehicleNumber"
                          value={formData.vehicleNumber ?? ""}
                          onChange={handleInputChange}
                          disabled={!isE("vehicleNumber")}
                        />
                      </div>
                    )}
                  </div>

                  {isV("images") && (
                    <>
                      <label>{t("Delivery images")}</label>
                      <div className="maintenance-images-list">
                        {/* {isV('addImages') && (
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
                        )} */}
                        {deliveryImages?.map((img, idx) => {
                          const fileUrl = img.url;
                          const fileName =
                            img.filename || img.fileName || `file-${idx}`;
                          const extension = fileName
                            .split(".")
                            .pop()
                            .toLowerCase();

                          const isImage = [
                            "png",
                            "jpg",
                            "jpeg",
                            "gif",
                            "webp",
                          ].includes(extension);
                          const isPdf = extension === "pdf";
                          const isExcel = ["xls", "xlsx", "csv"].includes(
                            extension
                          );

                          return (
                            <div
                              key={idx}
                              className="maintenance-image-placeholder"
                              style={
                                isImage && fileUrl
                                  ? {
                                      backgroundImage: `url(${fileUrl})`,
                                      backgroundSize: "cover",
                                      backgroundPosition: "center",
                                    }
                                  : {}
                              }
                              onClick={() =>
                                isImage && fileUrl && setPopupImage(fileUrl)
                              }
                              title={isImage && fileUrl ? "Click to view" : ""}
                            >
                              {!isImage && fileUrl && (
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="file-link-button"
                                >
                                  {isPdf
                                    ? "📄 View PDF"
                                    : isExcel
                                    ? "📊 Open Excel"
                                    : "📁 Download File"}
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Products Section with DataGrid */}
                {isV("products") && (
                  <>
                    <h3 className="order-details-subtitle">{t("Products")}</h3>
                    {(formMode === "add" ||
                      (formMode === "edit" && isE("products"))) && (
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginBottom: 8,
                        }}
                      >
                        {isV("addProducts") && (
                          <button
                            type="button"
                            className="order-action-btn approve"
                            onClick={() => {
                              // In add mode, require customer, branch, and entity selection
                              if (formMode === "add") {
                                if (!formData.selectedCustomerName) {
                                  Swal.fire({
                                    title: t("Select Customer"),
                                    text: t("Please select a customer first"),
                                    icon: "warning",
                                    confirmButtonText: t("OK"),
                                  });
                                  return;
                                } else if (!formData.selectedBranchName) {
                                  Swal.fire({
                                    title: t("Select Branch"),
                                    text: t("Please select a branch first"),
                                    icon: "warning",
                                    confirmButtonText: t("OK"),
                                  });
                                  return;
                                } else if (!formData.entity) {
                                  Swal.fire({
                                    title: t("Select Entity"),
                                    text: t("Please select an entity first"),
                                    icon: "warning",
                                    confirmButtonText: t("OK"),
                                  });
                                  return;
                                }
                              }
                              // In edit mode, always use values from formData (order state)
                              setShowProductPopup(true);
                            }}
                            disabled={!isE("addProducts")}
                            style={{
                              cursor: !isE("addProducts")
                                ? "not-allowed"
                                : "pointer",
                            }}
                          >
                            {t("Add products")}
                          </button>
                        )}
                        {isV("sampleOrder") && (
                          <button
                            type="button"
                            className="order-action-btn"
                            onClick={() => setSampleMode(!sampleMode)}
                            disabled={
                              !isE("sampleOrder") ||
                              (formData.products &&
                                formData.products.length > 0)
                            }
                            style={{
                              backgroundColor: sampleMode ? "#ffeb3b" : "white",
                              color: sampleMode ? "black" : "#333",
                              border: "1px solid #ccc",
                              cursor:
                                !isE("sampleOrder") ||
                                (formData.products &&
                                  formData.products.length > 0)
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {t("Sample Order")}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Products DataGrid */}
                    {(formMode !== "add" ||
                      (formData.products || []).length > 0) && (
                      <div
                        className="order-products-section"
                        style={{
                          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                          padding: "16px",
                          borderRadius: "8px",
                        }}
                      >
                        <DataGrid
                          apiRef={gridApiRef}
                          rows={(formData.products || []).filter(
                            (p) =>
                              p.id ||
                              p.erp_prodd ||
                              p.quantity ||
                              p.unit ||
                              p.unitPrice ||
                              p.netAmount ||
                              p.vatPercentage
                          )}
                          columns={visibleProductColumns}
                          disableSelectionOnClick
                          disableColumnMenu
                          disableColumnSorting
                          hideFooter={true}
                          hideFooterPagination={true}
                          disableExtendRowFullWidth={true}
                          pagination={false}
                          autoHeight
                          rowHeight={55}
                          getRowId={(row) => row.id || row.productId}
                          sx={{
                            "& .MuiDataGrid-cell": {
                              display: "flex",
                              alignItems: "center",
                            },
                            "& .MuiDataGrid-columnHeaders": {
                              backgroundColor: "#f5f5f5",
                              fontWeight: "bold",
                            },
                            "& .MuiDataGrid-row:hover": {
                              backgroundColor: "rgba(0, 0, 0, 0.04)",
                            },
                          }}
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
                showCommentForm={!fromApproval}
                externalComments={(() => {
                  const comments = [...(approvalHistory || [])];
                  if (formData.feedback) {
                    try {
                      const feedbackObj =
                        typeof formData.feedback === "string"
                          ? JSON.parse(formData.feedback)
                          : formData.feedback;

                      if (Array.isArray(feedbackObj)) {
                        // Handle array of feedback comments
                        feedbackObj.forEach((feedback) => {
                          if (feedback.comment) {
                            comments.unshift({
                              action: "Feedback",
                              date: formatDate(
                                feedback.createdAt || new Date(),
                                "YYYY-MM-DD HH:MM"
                              ),
                              message: feedback.comment,
                              userName: feedback.createdBy || t("Feedback"),
                              userId: feedback.userId || "system",
                            });
                          }
                        });
                      } else if (feedbackObj.comment) {
                        // Handle single feedback object for backward compatibility
                        comments.unshift({
                          action: "Feedback",
                          date: formatDate(
                            feedbackObj.createdAt ||
                              formData.updatedAt ||
                              new Date(),
                            "YYYY-MM-DD HH:MM"
                          ),
                          message: feedbackObj.comment,
                          userName: feedbackObj.createdBy || t("Feedback"),
                          userId: feedbackObj.userId || "system",
                        });
                      }
                    } catch (e) {
                      console.error("Error parsing feedback:", e);
                    }
                  }
                  return comments;
                })()}
                currentUser={user}
                isVisible={fromApproval || formData.sampleOrder}
                onAddComment={async (comment) => {
                  if (
                    !comment ||
                    !user ||
                    !(fromApproval || formData.sampleOrder)
                  )
                    return;

                  // Create new feedback object
                  const newFeedback = {
                    comment,
                    createdBy: user.userName,
                    userId: user.userId,
                    createdAt: new Date().toISOString(),
                  };

                  // Update local state first
                  const currentFeedback = formData.feedback
                    ? typeof formData.feedback === "string"
                      ? JSON.parse(formData.feedback)
                      : formData.feedback
                    : [];

                  const updatedFeedback = Array.isArray(currentFeedback)
                    ? [newFeedback, ...currentFeedback]
                    : [newFeedback];

                  setFormData((prev) => ({
                    ...prev,
                    feedback: updatedFeedback,
                  }));

                  try {
                    // Save to backend
                    const response = await fetch(
                      `${process.env.REACT_APP_API_BASE_URL}/orders/id/${formData.id}`,
                      {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },

                        body: JSON.stringify({
                          feedback: updatedFeedback,
                        }),
                      }
                    );

                    if (!response.ok) {
                      throw new Error("Failed to save feedback");
                    }

                    console.log("Feedback saved successfully");
                  } catch (error) {
                    console.error("Error saving feedback:", error);
                    // Optionally show error notification
                    Swal.fire({
                      title: t("Error"),
                      text: t("Failed to save feedback. Please try again."),
                      icon: "warning",
                      toast: true,
                      position: "bottom-end",
                      showConfirmButton: false,
                      timer: 3000,
                    });
                  }
                  if (formData.sampleOrder) {
                    const feedbackObject = {
                      comment: comment,
                      createdBy: user.name,
                    };

                    try {
                      const response = await fetch(
                        `${API_BASE_URL}/sales-order/id/${formData.id}`,
                        {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            feedback: JSON.stringify(feedbackObject),
                          }),
                        }
                      );

                      if (!response.ok) {
                        throw new Error("Failed to update feedback");
                      }

                      // Update local state
                      setFormData((prev) => ({
                        ...prev,
                        feedback: JSON.stringify(feedbackObject),
                      }));

                      // Show success message
                      Swal.fire({
                        icon: "success",
                        title: t("Comment Added"),
                        text: t("Feedback updated successfully"),
                        confirmButtonText: t("OK"),
                      });
                    } catch (error) {
                      console.error("Error updating feedback:", error);
                      Swal.fire({
                        icon: "error",
                        title: t("Error"),
                        text: t("Failed to update feedback: ") + error.message,
                        confirmButtonText: t("OK"),
                      });
                    }
                  }
                }}
              />
            </div>
            {/* Rest of the component with modals and popups */}

            <GetInventory
              open={showInventory}
              onClose={() => setShowInventory(false)}
              InventoryData={InventoryData}
              productName={productName}
            />
            <Remarks open={showRemarks} onClose={() => setShowRemarks(false)} />
            {/* Product Popup */}
            {showProductPopup && (
              <GetProducts
                open={showProductPopup}
                onClose={() => setShowProductPopup(false)}
                onSelectProduct={handleSelectProduct}
                API_BASE_URL={API_BASE_URL}
                token={localStorage.getItem("token")}
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
                  sortBy: "id",
                  sortOrder: "asc",
                  purpose: "order creation",
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
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0,0,0,0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                }}
              >
                <img
                  src={popupImage}
                  alt="Preview"
                  style={{
                    maxHeight: "80vh",
                    maxWidth: "90vw",
                    borderRadius: 8,
                    background: "#fff",
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={() => setPopupImage(null)}
                  style={{
                    position: "absolute",
                    top: 20,
                    right: 40,
                    fontSize: 24,
                    background: "transparent",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
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
              customerName={
                formData.selectedCustomerName ||
                formData.companyNameEn ||
                "this order"
              }
              title={
                approvalAction === "approve"
                  ? t("Approve Order")
                  : t("Reject Order")
              }
              subtitle={
                approvalAction === "approve"
                  ? t("Are you sure you want to approve this order?")
                  : t("Are you sure you want to reject this order?")
              }
            />

            {/* Payment Method Popup */}
            <GetPaymentMethods
              open={showPaymentPopup}
              onClose={() => setShowPaymentPopup(false)}
              onSelectPaymentMethod={handleSelectPaymentMethod}
              API_BASE_URL={API_BASE_URL}
              t={t}
            />
          </div>
          {isV("orderFooter") && (
            <div className="order-details-footer">
              {isV("orderStatus") && (
                <div className="order-status">
                  <span className="status-label">{t("Status")}:</span>
                  <span
                    className={`status-badge status-${
                      formData.status?.toLowerCase() || "open"
                    }`}
                  >
                    {t(formData.status) || t("Open")}
                  </span>
                </div>
              )}
              <div className="" style={{ display: "flex", gap: "10px" }}>
                {isV("btnSave", fromApproval, false) && isE("btnSave") && (
                  <button
                    className="order-action-btn"
                    onClick={() => handleSave("save")}
                    disabled={
                      saving ||
                      (formData.status &&
                        !["open"].includes(formData.status.toLowerCase()))
                    }
                  >
                    {saving ? t("Saving...") : t("Save Changes")}
                  </button>
                )}

                {isV("btnCancel", fromApproval, false) && isE("btnCancel") && (
                  <button
                    className="order-action-btn"
                    onClick={() => handleCancelOrder("cancel order")}
                    disabled={
                      cancelling ||
                      (formData.status &&
                        !["open"].includes(formData.status.toLowerCase()))
                    }
                  >
                    {cancelling ? t("Cancelling...") : t("Cancel Order")}
                  </button>
                )}

                {isV("btnInvoice", fromApproval, false) &&
                  isE("btnInvoice") &&
                  ["invoiced", "delivered"].includes(
                    formData?.status?.toLowerCase()
                  ) && (
                    <button
                      className="order-action-btn"
                      onClick={() =>
                        handleViewSignature(
                          formData.id,
                          formData.customerId,
                          formData.invoices
                        )
                      }
                    >
                      {t("Download Invoice")}
                    </button>
                  )}

                {isV("btnInventory") && isE("btnInventory") && (
                  <button
                    className="order-action-btn"
                    onClick={() => setShowInventory(true)}
                  >
                    {t("Get Inventory")}
                  </button>
                )}

                {(isV("btnPay") &&
                  isE("btnPay") &&
                   formData?.status?.toLowerCase() !== "cancelled" &&formData?.status?.toLowerCase() !== "rejected"&&
                 formData?.paymentMethod?.toLowerCase() != "cash on delivery" &&
                 formData?.paymentMethod?.toLowerCase() !== "credit" &&
                 formData?.paymentStatus?.toLowerCase() !== "paid" &&
                 (
                   (formData?.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase() &&
                    formData?.status?.toLowerCase() === "approved") ||
                   (
                   formData?.status?.toLowerCase() === "open" &&
                     (
                       formData?.entity.toLowerCase() === Constants.ENTITY.DAR.toLowerCase() ||
                       formData?.entity.toLowerCase() === Constants.ENTITY.GMTC.toLowerCase() ||
                       formData?.entity.toLowerCase() === Constants.ENTITY.SHC.toLowerCase()
                     )
                   ) ||
                   (formData?.status?.toLowerCase() === "pending" &&
                     (
                       formData?.entity.toLowerCase() === Constants.ENTITY.DAR.toLowerCase() ||
                       formData?.entity.toLowerCase() === Constants.ENTITY.GMTC.toLowerCase() ||
                       formData?.entity.toLowerCase() === Constants.ENTITY.SHC.toLowerCase()
                     )
                   )
                 ) && (
                    <button
                      className="order-action-btn"
                      onClick={() => handleCheckout(orderId)}
                      style={{
                        width: "160px",
                        backgroundColor: "#005932",
                        color: "white",
                      }}
                    >
                      {t("Pay")}
                    </button>
                  ))}
                {(isV("btnSendLink") &&
                  isE("btnSendLink") &&
                formData?.status?.toLowerCase() !== "cancelled" &&formData?.status?.toLowerCase() !== "rejected"&&
                 formData?.paymentMethod?.toLowerCase() != "cash on delivery" &&
                 formData?.paymentMethod?.toLowerCase() !== "credit" &&
                 formData?.paymentStatus?.toLowerCase() !== "paid" &&
                 (
                   (formData?.entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase() &&
                    formData?.status?.toLowerCase() === "approved") ||
                   (
                   formData?.status?.toLowerCase() === "open" &&
                     (
                       formData?.entity.toLowerCase() === Constants.ENTITY.DAR.toLowerCase() ||
                       formData?.entity.toLowerCase() === Constants.ENTITY.GMTC.toLowerCase() ||
                       formData?.entity.toLowerCase() === Constants.ENTITY.SHC.toLowerCase()
                     )
                   ) ||
                   (formData?.status?.toLowerCase() === "pending" &&
                     (
                       formData?.entity.toLowerCase() === Constants.ENTITY.DAR.toLowerCase() ||
                       formData?.entity.toLowerCase() === Constants.ENTITY.GMTC.toLowerCase() ||
                       formData?.entity.toLowerCase() === Constants.ENTITY.SHC.toLowerCase()
                     )
                   )
                 )&& (
                    <button
                      className="order-action-btn"
                      onClick={() => handleCheckout(orderId, false, true)}
                      style={{
                        width: "160px",
                        backgroundColor: "#005932",
                        color: "white",
                      }}
                    >
                      {t("Send Link")}
                    </button>
                  ))}

                {isV("actionButtons") && fromApproval && (
                  <div className="order-details-actions">
                    {isV("btnApprove", fromApproval, true) && (
                      <button
                        className="order-action-btn approve"
                        onClick={() => handleApprovalSubmit("approve")}
                        disabled={formData.status === "approved"}
                      >
                        {t("Approve")}
                      </button>
                    )}

                    {isV("btnReject", fromApproval, true) && (
                      <button
                        className="order-action-btn reject"
                        onClick={() => handleApprovalSubmit("reject")}
                        disabled={formData.status === "approved"}
                      >
                        {t("Reject")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          <PdfPopupViewer
            pdfFiles={pdfFiles}
            showModal={showModal}
            onClose={() => handleClose()}
            t={t}
          />
        </div>
      )}
    </Sidebar>
  );
}
export default OrderDetails;
