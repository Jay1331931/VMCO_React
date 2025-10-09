import React, { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import ActionButton from "../components/ActionButton";
import ToggleButton from "../components/ToggleButton";
import SearchInput from "../components/SearchInput";
import Table from "../components/Table";
import Pagination from "../components/Pagination";
import CustomToolbar from "../components/CustomToolbar";
import AnimatedTabs from "../components/AnimatedTabs";
import "../styles/components.css";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import Swal from "sweetalert2";
import { formatDate } from "../utilities/dateFormatter";
import axios from "axios";
import LoadingSpinner from "../components/LoadingSpinner";
import GetCustomers from "../components/GetCustomers";
import Tabs from "../components/Tabs";
import GetBranches from "../components/GetBranches";
import Constants from "../constants";
import { or } from "ajv/dist/compile/codegen";
import { Chip, Box, Button, Typography, Tooltip } from "@mui/material";
import TableMobile from "../components/TableMobile";
import {
  DataGrid,
  GridFooterContainer,
  GridPagination,
  useGridApiRef,
} from "@mui/x-data-grid";
import { max, min, set } from "date-fns";
import { Height } from "@mui/icons-material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import IosShareIcon from "@mui/icons-material/IosShare";
import SyncIcon from "@mui/icons-material/Sync";
import FileUploadProgress from '../components/FileUploadProgress';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "status-approved";
    case "open":
      return "status-open";
    case "rejected":
      return "status-rejected";
    default:
      return "status-pending";
  }
};

const getPaymentStatusClass = (paymentStatus) => {
  switch (paymentStatus?.toLowerCase()) {
    case "paid":
      return "status-paid";
    case "credit":
      return "status-credit";
    case "under review":
      return "status-under-review";
    case "pending":
    default:
      return "status-pending";
  }
};
const initialCategories = [
  {
    value: Constants.ENTITY.VMCO,
    entity: Constants.ENTITY.VMCO,
    label: Constants.ENTITY.VMCO,
  },
  {
    value: Constants.ENTITY.SHC,
    entity: Constants.ENTITY.SHC,
    label: Constants.ENTITY.SHC,
  },
  {
    value: Constants.ENTITY.GMTC,
    entity: Constants.ENTITY.GMTC,
    label: Constants.ENTITY.GMTC,
  },
  {
    value: Constants.ENTITY.NAQI,
    entity: Constants.ENTITY.NAQI,
    label: Constants.ENTITY.NAQI,
  },
  {
    value: Constants.ENTITY.DAR,
    entity: Constants.ENTITY.DAR,
    label: Constants.ENTITY.DAR,
  },
];
function Orders() {
  const [isApprovalMode, setApprovalMode] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({});
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});

  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [bulkUploadPopUp, setBulkUploadPopUp] = useState(false);
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [showBranchPopup, setShowBranchPopup] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const fileInputRef = useRef(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [excelLoading, setExcelLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadComplete, setUploadComplete] = React.useState(false);
  const [syncLoadingId, setSyncLoadingId] = useState(null);
  const [sortModel, setSortModel] = useState([]);
  const [sortField, setSortField] = useState("createdAt");
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showRowPopup, setShowRowPopup] = useState(false);
  const gridApiRef = useGridApiRef();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [entityDescriptions, setEntityDescriptions] = useState([]);
  const [categoryTabs, setCategoryTabs] = useState([]);
  const [filteredCategoryTabs, setFilteredCategoryTabs] =
    useState(categoryTabs);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);

  const [categories] = useState(initialCategories);
  const [activeCategory, setActiveCategory] = useState(
    initialCategories[0].value
  );
  const getLocalizedEntityName = (
    initialCategories,
    currentLanguage,
    entityDescriptions
  ) => {
    console.log("getLocalizedEntityName called with:", {
      initialCategories,
      currentLanguage,
      entityDescriptions,
    });
    const match = entityDescriptions?.find(
      (desc) => desc.value.toLowerCase() === initialCategories.toLowerCase()
    );
    if (!match) return initialCategories;
    return currentLanguage === "ar"
      ? match.descriptionLc || match.description
      : match.description;
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    console.log("isMobile", isMobile);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {
    const fetchEntityDescriptions = async () => {
      try {
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

        if (!response.ok) {
          throw new Error("Failed to fetch entity descriptions");
        }
        const result = await response.json();
        setEntityDescriptions(
          result.data?.map((entity) => ({
            descriptionLc: entity.descriptionLc,
            description: entity.description,
            value: entity.value,
          })) || []
        );
      } catch (error) {
        console.error("Error fetching entity descriptions:", error);
      }
    };
    fetchEntityDescriptions();
  }, [i18n.language, API_BASE_URL, token]);

  // Fetch categories from API when active tab/entity changes
  useEffect(() => {
    const fetchCategories = async () => {
      const selectedCategory = categories.find(
        (cat) => cat.value === activeCategory
      );
      const entity = selectedCategory?.entity;
      if (!entity) {
        setCategoryOptions([]);
        return;
      }
      try {
        // Build query parameters
        const params = new URLSearchParams({
          entity: entity,
        });
        // Add isMachine parameter for VMCO entity tabs
        if (entity === Constants.ENTITY.VMCO) {
          if (activeCategory === Constants.CATEGORY.VMCO_MACHINES) {
            const isMachine = true;
            params.append("isMachine", isMachine);
          } else {
            const isMachine = false;
            params.append("isMachine", isMachine);
          }
        }
        const response = await fetch(
          `${API_BASE_URL}/product-categories?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch categories");
        const result = await response.json();

        const options = Array.isArray(result.data)
          ? result.data.map((cat) => ({
              name: cat.category || cat.name || cat,
              value: cat.category || cat.name || cat,
            }))
          : [];
        setCategoryOptions(options);
      } catch (err) {
        setCategoryOptions([]);
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, [activeCategory, categories, API_BASE_URL]);
  // Fetch subcategories from API when category or active tab/entity changes
  useEffect(() => {
    const fetchSubCategories = async () => {
      const selectedCategoryObj = categories.find(
        (cat) => cat.value === activeCategory
      );
      const entity = selectedCategoryObj?.entity;
      if (!entity || !categoryFilter) {
        setSubCategoryOptions([]);
        return;
      }
      try {
        const params = new URLSearchParams({
          entity: entity,
          category: categoryFilter,
        });
        const response = await fetch(
          `${API_BASE_URL}/product-subcategories?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch subcategories");
        const result = await response.json();

        const options = Array.isArray(result.data)
          ? result.data.map((sub) => ({
              name: sub.subCategory || sub.subcategory || sub.name || sub,
              value: sub.subCategory || sub.subcategory || sub.name || sub,
            }))
          : [];
        setSubCategoryOptions(options);
      } catch (err) {
        setSubCategoryOptions([]);
        console.error("Error fetching subcategories:", err);
      }
    };
    fetchSubCategories();
  }, [activeCategory, categoryFilter, categories, API_BASE_URL, token]); // ✅ Added token

  // Reset subcategory filter when category filter changes or is cleared
  useEffect(() => {
    if (!categoryFilter) {
      setSubCategoryFilter("");
      setSubCategoryOptions([]);
    }
  }, [categoryFilter]);

  useEffect(() => {
    if (!entityDescriptions || entityDescriptions?.length === 0) {
      return;
    }
    if (!user) return;
    const allLocalizedTabs = initialCategories.map((category) => {
      const response = getLocalizedEntityName(
        category.label,
        i18n.language,
        entityDescriptions
      );
      return {
        value: category.value,
        label: category.entity,
      };
    });
    // Filter tabs based on user type and interCompany status
    let tabsToShow = allLocalizedTabs.filter((tab) => {
      const category = initialCategories.find((cat) => cat.value === tab.value);

      if (
        category &&
        (category.value === "FAVORITES" ||
          category.value === "SPECIAL_PRODUCTS")
      ) {
        return user.userType.toLowerCase() === "customer";
      }
      return true;
    });
    // If user is a customer with interCompany set to true, filter out matching entity tabs
    if (
      user.userType === "customer" &&
      user.interCompany === true &&
      user.entity
    ) {
      const customerEntity = user.entity.toLowerCase();
      console.log(
        "Filtering tabs for interCompany customer with entity:",
        customerEntity
      );

      tabsToShow = tabsToShow.filter((tab) => {
        const category = initialCategories.find(
          (cat) => cat.value === tab.value
        );

        if (!category || !category.entity) return true;

        const tabEntityExists = entityDescriptions.some(
          (desc) => desc.value.toLowerCase() === category.entity.toLowerCase()
        );

        if (
          tabEntityExists &&
          category.entity.toLowerCase() === customerEntity
        ) {
          console.log(
            "Excluding tab:",
            tab.label,
            "for entity:",
            category.entity
          );
          return false;
        }

        return true;
      });
      console.log("Filtered tabs for interCompany customer:", tabsToShow);
    }
    setCategoryTabs(tabsToShow);
    setFilteredCategoryTabs(tabsToShow);
    // If current active category is not in filtered tabs, set to first available
    if (
      tabsToShow.length > 0 &&
      !tabsToShow.some((tab) => tab?.value === activeCategory)
    ) {
      setActiveCategory(tabsToShow[0]?.value);
    }
  }, [entityDescriptions, i18n.language, initialCategories, user]);
  const columnsToDisplay = {
    id: "OrderId",
    erpOrderId: "Sales Order ID",
    companyNameEn: "Customer",
    branchNameEn: "Branch",
    entity: "Entity",
    paymentMethod: "Payment Method",
    createdBy: "Created By",
    paymentStatus: "Payment Status",
    orderStatus: "status",
  };
  const searchableFields = [
    "id",
    "erpOrderId",
    "erpCustId",
    "companyNameEn",
    "branchNameEn",
    "entity",
    "paymentMethod",
    "paymentStatus",
    "status",
    "erpBranchId",
  ];

  const toggleApprovalMode = () => {
    setApprovalMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        fetchApprovals(1, searchQuery);
      } else {
        fetchOrders(1, searchQuery);
      }
      return newMode;
    });
  };
  const handleSortModelChange = (model) => {
    console.log("Sort model changed:", model);
    setSortModel(model);

    if (isApprovalMode) {
      fetchApprovals(1, searchQuery, filters, model);
    } else {
      fetchOrders(1, searchQuery, filters, model);
    }
  };

  // Fetch orders from API
  const fetchOrders = useCallback(
    async (page = 1, searchTerm = "", customFilters = {}, sortedModel = []) => {
      setLoading(true);
      setError(null);

      const filtersCopy = { ...customFilters };
      if (
        filtersCopy.paymentMethod &&
        (filtersCopy.paymentMethod.toLowerCase() === "card payment" || filtersCopy.paymentMethod.toLowerCase() === "cardpayment")
      ) {
        filtersCopy.paymentMethod = "Pre payment";
      }
      if (user?.userType === "employee") {
        console.log("Active Category", activeCategory);
        // filtersCopy.entity = activeCategory;
        console.log("Filters Copy", filtersCopy);
      }
      try {
        const params = new URLSearchParams({
          page,
          pageSize,
          search: searchTerm,
          sortBy: sortedModel[0]?.field || "createdAt",
          sortOrder: sortedModel[0]?.sort || "desc",
          filters: JSON.stringify(filtersCopy),
        });

        const response = await fetch(
          `${API_BASE_URL}/sales-order/pagination?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("API did not return JSON. Check API URL and server.");
        }
        const result = await response.json();
        if (result.status === "Ok") {
          const processedOrders = result.data.data.map((order) => ({
            ...order,
            companyNameEn:
              order.companyNameEn ||
              order.company_name_en ||
              order.selectedCustomerName ||
              order.erpCustId ||
              "",
            branchNameEn:
              // order.branchNameEn + " (" + order.branchSequenceId + ")",
              order.branchNameEn,
            branchNameLc:
              // order.branchNameLc + " (" + order.branchSequenceId + ")",
              order.branchNameLc,
          }));

          setFilteredOrders(processedOrders);
          setTotal(result.data.totalRecords);
        } else {
          throw new Error(result.message || "Failed to fetch orders");
        }
      } catch (err) {
        setError(err.message);
        setFilteredOrders([]);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, token]
  );

  // Fetch approvals for orders
  const fetchApprovals = async (
    page = 1,
    searchTerm = "",
    customFilters = {},
    sortedModel = []
  ) => {
    setLoading(true);
    setError(null);
    const filtersCopy = { ...customFilters };
    if (
      filtersCopy.paymentMethod &&
      (filtersCopy.paymentMethod.toLowerCase() === "card payment" || filtersCopy.paymentMethod.toLowerCase() === "cardpayment")
    ) {
      filtersCopy.paymentMethod = "Pre payment";
    }
    try {
      const params = new URLSearchParams({
        page,
        pageSize,
        search: searchTerm,
        sortBy: sortedModel?.[0]?.field || "id",
        sortOrder: sortedModel?.[0]?.sort || "asc",
        filters: JSON.stringify(filtersCopy),
      });

      const response = await fetch(
        `${API_BASE_URL}/workflow-instance/pending-orders-approval?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      if (result.status === "Ok") {
        const processedOrders = result.data.data.map((order) => ({
          ...order,
          companyNameEn: order.companyNameEn || order.companynameen,
          branchNameEn: order.branchNameEn || order.branchSequenceId,
          branchNameLc: order.branchNameLc || order.branchSequenceId,
          workflowName: order.workflowName,
          workflowInstanceId: order.workflowInstanceId,
        }));

        setFilteredOrders(processedOrders);
        setTotal(result.data.totalRecords);
      } else {
        throw new Error(result.message || "Failed to fetch order approvals");
      }
    } catch (err) {
      setError(err.message);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading) {
      return;
    }
    if (user) {
      if (isApprovalMode) {
        fetchApprovals(page, searchQuery, filters);
      } else {
        console.log("ddddd");
        if (user?.userType === "employee") {
          setFilters({ entity: initialCategories[0].entity, ...filters });
          fetchOrders(page, searchQuery, {
            entity: initialCategories[0].entity,
            ...filters,
          });
        } else {
          fetchOrders(page, searchQuery, filters);
        }
      }
    }
  }, [
    page,
    searchQuery,
    user,
    fetchOrders,
    filters,
    isApprovalMode,
    activeCategory,
  ]);

  const rbacMgr = new RbacManager(
    user?.userType === "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "orderList"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  const handleSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
    setPage(1);
  };

  const handleAddOrder = async () => {
    navigate("/orderDetails", { state: { mode: "add" } });
  };

  const handleExportAll = async () => {
    const result = await Swal.fire({
      title: t("Confirm Download?"),
      text: t("Are you sure you want to download orders?"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Yes, download"),
      cancelButtonText: t("No, cancel"),
    });
    if (result.isConfirmed) {
      setLoading(true);
      setError(null);
      const filtersCopy = { ...filters };
      if (
        filtersCopy.paymentMethod &&
        (filtersCopy.paymentMethod.toLowerCase() === "card payment" ||
          filtersCopy.paymentMethod.toLowerCase() === "cardpayment")
      ) {
        filtersCopy.paymentMethod = "Pre payment";
      }
      try {
        const params = new URLSearchParams({
          page,
          pageSize,
          search: searchQuery,
          sortBy: sortModel[0]?.field || "id",
          sortOrder: sortModel[0]?.sort || "asc",
          filters: JSON.stringify(filtersCopy),
        });

        const response = await fetch(
          `${API_BASE_URL}/sales-orders/export-combined?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Export failed: ${response.status} ${response.statusText}`
          );
        }

        // Get the blob from the response
        const blob = await response.blob();

        // Check if blob is valid
        if (!blob || blob.size === 0) {
          throw new Error("Empty file received");
        }

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = "Orders.xlsx";
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) filename = filenameMatch[1];
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return;
      } catch (err) {
        setError(err.message);
        setFilteredOrders([]);
      } finally {
        setLoading(false);
      }
    }
  };
  const handleShowAllDetailsClick = async (order) => {
    try {
      const params = new URLSearchParams({
        page: 1,
        pageSize: 100,
        search: "",
        sortBy: "id",
        sortOrder: "asc",
        filters: JSON.stringify({ order_id: order.id }),
      });
      const response = await fetch(
        `${API_BASE_URL}/sales-order-lines/pagination?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      let salesOrderLines = result.data ? result.data.data : [];
      if (
        result.status === "Ok" &&
        result.data &&
        Array.isArray(result.data.data)
      ) {
        salesOrderLines = result.data.data;
      }
      navigate("/orderDetails", {
        state: {
          order: { ...order, salesOrderLines },
          mode: "edit",
          fromApproval: isApprovalMode,
          wfid: isApprovalMode ? order.workflowInstanceId : undefined,
          workflowName: isApprovalMode ? order.workflowName : undefined,
          workflowData: isApprovalMode ? order.workflowData : undefined,
          approvalHistory: isApprovalMode ? order.approvalHistory : undefined,
        },
      });
    } catch (err) {
      console.error("Failed to fetch sales order lines:", err);
      navigate("/orderDetails", {
        state: {
          order,
          mode: "edit",
          fromApproval: isApprovalMode,
          wfid: isApprovalMode ? order.workflowInstanceId : undefined,
          workflowName: isApprovalMode ? order.workflowName : undefined,
          workflowData: isApprovalMode ? order.workflowData : undefined,
        },
      });
    }
  };

  // Modified function to handle order number click specifically
  const handleOrderNumberClick = async (order) => {
    console.log("----order number clicked");
    console.log(order);
    try {
      const params = new URLSearchParams({
        page: 1,
        pageSize: 100,
        search: "",
        sortBy: "id",
        sortOrder: "asc",
        filters: JSON.stringify({ order_id: order.id }),
      });
      const response = await fetch(
        `${API_BASE_URL}/sales-order-lines/pagination?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      let salesOrderLines = result.data ? result.data.data : [];
      if (
        result.status === "Ok" &&
        result.data &&
        Array.isArray(result.data.data)
      ) {
        salesOrderLines = result.data.data;
      }
      navigate("/orderDetails", {
        state: {
          order: { ...order, salesOrderLines },
          mode: "edit",
          fromApproval: isApprovalMode,
          wfid: isApprovalMode ? order.workflowInstanceId : undefined,
          workflowName: isApprovalMode ? order.workflowName : undefined,
          workflowData: isApprovalMode ? order.workflowData : undefined,
          approvalHistory: isApprovalMode ? order.approvalHistory : undefined,
        },
      });
    } catch (err) {
      console.error("Failed to fetch sales order lines:", err);
      navigate("/orderDetails", {
        state: {
          order,
          mode: "edit",
          fromApproval: isApprovalMode,
          wfid: isApprovalMode ? order.workflowInstanceId : undefined,
          workflowName: isApprovalMode ? order.workflowName : undefined,
          workflowData: isApprovalMode ? order.workflowData : undefined,
        },
      });
    }
  };

  // Modified handleRowClick - removed navigation logic as it's now handled by order number click
  const handleRowClick = async (params) => {
    // Only handle mobile popup functionality here
    const order = params?.row;
    if (isMobile) {
      setSelectedRow(order);
      setShowRowPopup(true);
    }
    // Row click no longer navigates - only order number click does
  };

  const handlePay = async (order, email = false, copyUrl = false) => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/generatePayment-link`,
        {
          id: order.id,
          endPoint: "payment-opations/order",
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
          showCancelButton: false,
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

            copyBtn.addEventListener("click", async () => {
              input.select();
              input.setSelectionRange(0, 99999);
              await navigator.clipboard.writeText(input.value);

              copyBtn.textContent = "Copied!";
              copyBtn.style.background = "#0b4c45";
            });

            sendLinkBtn.addEventListener("click", () => {
              handlePay(order, true, false);
              Swal.close();
            });

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

  const orderMenuItems = [];

  const isArabic = i18n.language === "ar";
  const COMMON_RULES = {
    SHC_GMTC: [
      {
        paymentMethod: "Pre Payment",
        paymentStatus: "Paid",
        status: "approved",
      },
      { paymentMethod: "Credit", paymentStatus: "Credit", status: "approved" },
      {
        paymentMethod: "Cash on Delivery",
        paymentStatus: "Pending",
        status: "approved",
      },
      { paymentMethod: "Pre Payment", paymentStatus: "Paid", status: "open" },
      { paymentMethod: "Credit", paymentStatus: "Credit", status: "open" },
      {
        paymentMethod: "Cash on Delivery",
        paymentStatus: "Pending",
        status: "open",
      },
    ],
    NAQI_DAR: [
      {
        paymentMethod: "Pre Payment",
        paymentStatus: "Paid",
        status: "approved",
      },
      { paymentMethod: "Credit", paymentStatus: "Credit", status: "approved" },
      {
        paymentMethod: "Cash on Delivery",
        paymentStatus: "Pending",
        status: "approved",
      },
    ],
  };

  const orderColumns = [
    {
      field: "id",
      headerName: t("Order #"),
      include: isV("orderNumber"),
      searchable: true,
      flex: 1,
      minWidth: 100,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <span
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click
            handleOrderNumberClick(params.row);
          }}
          style={{
            color: "var(--navy-blue)",
            cursor: "pointer",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.target.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            e.target.style.textDecoration = "none";
          }}
        >
          {t(params.value)}
        </span>
      ),
    },
    {
      field: "erpOrderId",
      headerName: t("Sales Order ID"),
      include: isV("erpOrderId"),
      searchable: true,
      minWidth: 120,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <span
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click
            handleOrderNumberClick(params.row);
          }}
          style={{
            color: "var(--navy-blue)",
            cursor: "pointer",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.target.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            e.target.style.textDecoration = "none";
          }}
        >
          {t(params.value)}
        </span>
      ),
    },
    {
      field: isArabic ? "companyNameAr" : "companyNameEn",
      headerName: t("Company Name"),
      include: isV("companyName"),
      searchable: true,
      flex: 1,
      minWidth: 140,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{t(params.value)}</span>,
    },
    {
      field: isArabic ? "brandNameAr" : "brandNameEn",
      headerName: t("Brand Name"),
      include: isV("brandName"),
      searchable: true,
      flex: 1,
      minWidth: 140,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{t(params.value)}</span>,
    },
    {
      field: isArabic ? "branchNameLc" : "branchNameEn",
      headerName: t("Branch Name"),
      include: isV("branchName"),
      searchable: true,
      flex: 1,
      minWidth: 140,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{t(params.value)}</span>,
    },
    {
      field: "erpBranchId",
      headerName: t("Branch ID"),
      include: isV("erpBranchId"),
      searchable: true,
      minWidth: 120,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <span
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click
            handleOrderNumberClick(params.row);
          }}
          style={{
            color: "var(--navy-blue)",
            cursor: "pointer",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.target.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            e.target.style.textDecoration = "none";
          }}
        >
          {t(params.value)}
        </span>
      ),
    },
    {
      field: "branchRegion",
      headerName: t("Branch Region"),
      include: isV("branchRegion"),
      searchable: true,
      flex: 2,
      minWidth: 140,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{t(params.value)}</span>,
    },
    {
      field: "branchCity",
      headerName: t("Branch City"),
      include: isV("branchCity"),
      searchable: true,
      flex: 1,
      minWidth: 120,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{t(params.value)}</span>,
    },
    {
      field: "entity",
      headerName: t("Entity"),
      include: isV("entity"),
      searchable: true,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => {
        let badge = null;
        if (params.value === "VMCO") {
          badge = params.row.isMachine ? (
            <span className="badge badge-blue">{t("Machines")}</span>
          ) : (
            <span className="badge badge-blue">{t("Consumables")}</span>
          );
        } else if (params.value === "SHC") {
          badge = params.row.isFresh ? (
            <span className="badge badge-blue">{t("Fresh")}</span>
          ) : (
            <span className="badge badge-blue">{t("Frozen")}</span>
          );
        }
        return (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography align="center">
              {params.value?.toUpperCase()}
            </Typography>
            <Typography align="center">{badge}</Typography>
          </Box>
        );
      },
    },
    {
      field: "paymentMethod",
      headerName: t("Payment Method"),
      include: isV("paymentMethod"),
      searchable: true,
      minWidth: 130,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => {
        const value =
          params?.value?.toLowerCase() === "pre payment" ? "Card Payment" : params.value;
        return <span>{t(value)}</span>;
      },
    }
    ,
    {
      field: "createdByUsername",
      headerName: t("Created By"),
      include: isV("createdBy"),
      searchable: false,
      sortable: false,
      minWidth: 100,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{t(params.value)}</span>,
    },
    {
      field: "createdAt",
      headerName: t("Order Placement Date"),
      include: isV("createdAt"),
      searchable: false,
      minWidth: 150,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => {
        if (!params?.row?.createdAt) return <span> </span>;

        const date = new Date(params.row.createdAt);

        // Convert to Riyadh timezone (UTC+3)
        const riyadhDate = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Riyadh",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(date);

        const riyadhTime = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Riyadh",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(date);

        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              lineHeight: "1.2",
            }}
          >
            <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>
              {riyadhDate}
            </span>
            <span style={{ fontSize: "0.8rem", color: "#666" }}>
              {riyadhTime}
            </span>
          </div>
        );
      },
    },
    {
      field: "totalAmount",
      headerName: t("Total Amount"),
      include: isV("totalAmount"),
      searchable: false,
      minWidth: 100,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <span>{parseFloat(params?.row?.totalAmount || 0).toFixed(2)}</span>
      ),
    },
    {
      field: "totalItemQuantity",
      headerName: t("Total Quantity"),
      include: isV("totalItemQuantity"),
      searchable: false,
      sortable: false,
      minWidth: 100,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <span>{params?.row?.totalItemQuantity || 0}</span>
      ),
    },
    {
      field: "salesExecutiveId",
      headerName: t("Sales Executive ID"),
      include: isV("salesExecutiveId"),
      searchable: true,
      sortable: false,
      minWidth: 120,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{t(params.row.salesExecutive || "")}</span>,
    },
    {
      field: "salesExecutiveName",
      headerName: t("Sales Executive Name"),
      include: isV("salesExecutiveName"),
      searchable: true,
      sortable: false,
      minWidth: 120,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <span>{t(params.row.salesExecutiveName || "")}</span>
      ),
    },
    {
      field: "currentApprover",
      headerName: t("Current Approver"),
      include: isV("currentApprover"),
      searchable: true,
      sortable: false,
      minWidth: 120,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <span>{t(params.row.currentApprover || "")}</span>
      ),
    },
    {
      field: "paymentStatus",
      headerName: t("Payment Status"),
      include: isV("paymentStatus"),
      searchable: true,
      minWidth: 120,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <label className={getPaymentStatusClass(params.value)}>
          {t(params.value)}
        </label>
      ),
    },
    {
      field: "status",
      headerName: t("Approval Status"),
      include: isV("status"),
      searchable: true,
      minWidth: 120,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <label className={getStatusClass(params.value)}>
          {t(params.value)}
        </label>
      ),
    },
    {
      field: "pay",
      headerName: t("Action"),
      include: isV("action"),
      searchable: false,
      flex: 2,
      minWidth: 70,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
          {isV("action") &&
            params?.row?.paymentMethod?.toLowerCase() === "pre payment" &&
            params?.row?.paymentStatus?.toLowerCase() === "pending" &&
            params?.row?.status?.toLowerCase() !== "cancelled" && (
              <Box
                component="span"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePay(params.row);
                }}
                sx={{
                  color: "primary.main",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  "&:hover": {
                    textDecoration: "none",
                  },
                }}
              >
                <Tooltip title={t("Pay")} arrow>
                  <AccountBalanceWalletIcon />
                </Tooltip>
              </Box>
            )}
        </Box>
      ),
    },
    {
      field: "sendLink",
      headerName: t("Action"),
      include: isV("sendLink") || isV("FandOSyncSO"),
      searchable: false,
      flex: 2,
      minWidth: 70,
      headerAlign: "center",
      align: isArabic ? "right" : "left",
      renderCell: (params) => {
        const rowdata = params.row;
        const SYNC_RULES = {
          [Constants.ENTITY.VMCO]: (rowdata) =>
            rowdata.isMachine
              ? [
                  {
                    paymentMethod: "Pre Payment",
                    paymentStatus: "Pending",
                    status: "approved",
                  },
                ]
              : [
                  {
                    paymentMethod: "Pre Payment",
                    paymentStatus: "Pending",
                    status: "approved",
                  },
                  {
                    paymentMethod: "Credit",
                    paymentStatus: "Credit",
                    status: "approved",
                  },
                  {
                    paymentMethod: "Cash on Delivery",
                    paymentStatus: "Pending",
                    status: "approved",
                  },
                ],
          [Constants.ENTITY.SHC]: () => COMMON_RULES.SHC_GMTC,
          [Constants.ENTITY.GMTC]: () => COMMON_RULES.SHC_GMTC,
          [Constants.ENTITY.NAQI]: () => COMMON_RULES.NAQI_DAR,
          [Constants.ENTITY.DAR]: () => COMMON_RULES.NAQI_DAR,
        };
        const rules = SYNC_RULES[rowdata.entity]?.(rowdata) || [];
        const isValidForSync = rules.some(
          (rule) =>
            rule?.paymentMethod?.toLowerCase() ===
              rowdata.paymentMethod?.toLowerCase() &&
            rule?.paymentStatus?.toLowerCase() ===
              rowdata.paymentStatus?.toLowerCase() &&
            rule?.status?.toLowerCase() === rowdata.status?.toLowerCase()
        );
        return (
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
            {isV("sendLink") &&
              params?.row?.status?.toLowerCase() !== "cancelled" &&
              params?.row?.paymentMethod?.toLowerCase() === "pre payment" &&
              params?.row?.paymentStatus?.toLowerCase() === "pending" && (
                <Box
                  component="span"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePay(params.row, false, true);
                  }}
                  sx={{
                    color: "primary.main",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  <Tooltip title={t("Send Link")} arrow>
                    <IosShareIcon />
                  </Tooltip>
                </Box>
              )}

            {isV("FandOSyncSO") && !rowdata.erpOrderId && isValidForSync && (
              <Box
                component="span"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!(syncLoading && syncLoadingId === params.row.id)) {
                    handleFandOFailSO(params.row.id);
                  }
                }}
                sx={{
                  color:
                    syncLoading && syncLoadingId === params.row.id
                      ? "text.disabled"
                      : "primary.main",
                  cursor:
                    syncLoading && syncLoadingId === params.row.id
                      ? "default"
                      : "pointer",
                  textDecoration:
                    syncLoading && syncLoadingId === params.row.id
                      ? "none"
                      : "none",
                  fontSize: "0.875rem",
                }}
              >
                <Tooltip
                  title={
                    syncLoading && syncLoadingId === params.row.id
                      ? t("Syncing...")
                      : t("Sync")
                  }
                  arrow
                >
                  <SyncIcon />
                </Tooltip>
              </Box>
            )}
          </Box>
        );
      },
    },
  ];

  const approvalColumns = [
    {
      field: "id",
      headerName: t("Order #"),
      include: isV("orderNumber"),
      searchable: true,
      flex: 1,
      minWidth: 100,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <span
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click
            handleOrderNumberClick(params.row);
          }}
          style={{
            color: "var(--navy-blue)",
            cursor: "pointer",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.target.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            e.target.style.textDecoration = "none";
          }}
        >
          {t(params.value)}
        </span>
      ),
    },
    {
      field: "erpOrderId",
      include: isV("erpOrderId"),
      searchable: false,
      minWidth: 120,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <span
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click
            handleOrderNumberClick(params.row);
          }}
          style={{
            color: "var(--navy-blue)",
            cursor: "pointer",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.target.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            e.target.style.textDecoration = "none";
          }}
        >
          {t(params.value)}
        </span>
      ),
    },
    {
      field: isArabic ? "companyNameAr" : "companyNameEn",
      headerName: t("Customer"),
      include: isV("companyName"),
      searchable: true,
      flex: 1,
      minWidth: 140,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{t(params.value)}</span>,
    },
    {
      field: isArabic ? "branchNameLc" : "branchNameEn",
      headerName: t("Branch"),
      include: isV("branchName"),
      searchable: true,
      minWidth: 140,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{t(params.value)}</span>,
    },
    {
      field: "branchRegion",
      headerName: t("Branch Region"),
      include: isV("branchRegion"),
      searchable: true,
      flex: 2,
      minWidth: 140,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{t(params.value)}</span>,
    },
    {
      field: "branchCity",
      headerName: t("Branch City"),
      include: isV("branchCity"),
      searchable: true,
      flex: 1,
      minWidth: 140,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{t(params.value)}</span>,
    },
    {
      field: "workflowName",
      headerName: t("Workflow Name"),
      include: isV("workflowName"),
      searchable: true,
      minWidth: 140,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{t(params.value)}</span>,
    },
    {
      field: "entity",
      headerName: t("Entity"),
      include: isV("entity"),
      searchable: true,
      flex: 1,
      minWidth: 140,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => {
        let badge = null;
        if (params.value === "VMCO") {
          badge = params.row.isMachine ? (
            <span className="badge badge-blue">{t("Machines")}</span>
          ) : (
            <span className="badge badge-blue">{t("Consumables")}</span>
          );
        } else if (params.value === "SHC") {
          badge = params.row.isFresh ? (
            <span className="badge badge-blue">{t("Fresh")}</span>
          ) : (
            <span className="badge badge-blue">{t("Frozen")}</span>
          );
        }
        return (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography align={isArabic ? "right" : "center"}>
              {params.value?.toUpperCase()}
            </Typography>
            <Typography align={isArabic ? "right" : "center"}>
              {badge}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "paymentMethod",
      headerName: t("Payment Method"),
      include: isV("paymentMethod"),
      searchable: true,
      minWidth: 130,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => {
        const value =
          params?.value?.toLowerCase() === "pre payment" ? "Card Payment" : params.value;
        return <span>{t(value)}</span>;
      },
    }
    ,
    {
      field: "createdByUsername",
      headerName: t("Created By"),
      include: isV("createdBy"),
      searchable: false,
      sortable: false,
      minWidth: 100,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
    },
    {
      field: "createdAt",
      headerName: t("Order Placement Date"),
      include: isV("createdAt"),
      searchable: false,
      minWidth: 140,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => {
        if (!params?.row?.createdAt) return <span> </span>;

        const date = new Date(params.row.createdAt);

        // Convert to Riyadh timezone (UTC+3)
        const riyadhDate = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Riyadh",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(date);

        const riyadhTime = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Riyadh",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(date);

        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              lineHeight: "1.2",
            }}
          >
            <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>
              {riyadhDate}
            </span>
            <span style={{ fontSize: "0.8rem", color: "#666" }}>
              {riyadhTime}
            </span>
          </div>
        );
      },
    },
    {
      field: "totalAmount",
      headerName: t("Total Amount"),
      include: isV("totalAmount"),
      searchable: false,
      sortable: false,
      minWidth: 100,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <span>{parseFloat(params?.row?.totalAmount).toFixed(2)}</span>
      ),
    },
    {
      field: "totalItemQuantity",
      headerName: t("Total Quantity"),
      include: isV("totalItemQuantity"),
      searchable: false,
      sortable: false,
      minWidth: 100,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <span>{params?.row?.totalItemQuantity || 0}</span>
      ),
    },
    {
      field: "salesExecutiveId",
      sortable: false,
      headerName: t("Sales Executive ID"),
      include: isV("salesExecutiveId"),
      searchable: true,
      minWidth: 120,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{t(params.row.salesExecutive || "")}</span>,
    },
    {
      field: "salesExecutiveName",
      sortable: false,
      headerName: t("Sales Executive Name"),
      include: isV("salesExecutiveName"),
      searchable: true,
      minWidth: 120,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <span>{t(params.row.salesExecutiveName || "")}</span>
      ),
    },
    {
      field: "currentApprover",
      sortable: false,
      headerName: t("Current Approver"),
      include: isV("currentApprover"),
      searchable: true,
      minWidth: 120,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <span>{t(params.row.currentApproverType || "")}</span>
      ),
    },
    {
      field: "status",
      headerName: t("Approval Status"),
      include: isV("status"),
      searchable: true,
      minWidth: 120,
      flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <label className={getStatusClass(params.value)}>
          {t(params.value)}
        </label>
      ),
    },
  ];

  const visibleColumns = isApprovalMode
    ? approvalColumns.filter((col) => col.include)
    : orderColumns.filter((col) => col.include);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSelectedBranch(null);
    setShowCustomerPopup(false);
  };

  const handleTemplateDownload = async () => {
    const result = await Swal.fire({
      title: t("Confirm Download?"),
      text: t("Are you sure you want to download the template?"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Yes, download"),
      cancelButtonText: t("No, cancel"),
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_BASE_URL}/get-files`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileName: Constants.DOCUMENTS_NAME.ORDERS_UPLOAD_FORMAT,
            containerType: "documents",
          }),
        });

        const res = await response.json();
        if (res.status === "Ok") {
          window.open(res.data.url, "_blank", "noopener,noreferrer");
        } else {
          await Swal.fire({
            title: t("Error"),
            text: res.message || t("Failed to download template."),
            icon: "error",
            confirmButtonText: t("OK"),
            confirmButtonColor: "#dc3545",
          });
        }
      } catch (error) {
        console.error("Error downloading template:", error);
        await Swal.fire({
          title: t("Error"),
          text: t("Failed to download template."),
          icon: "error",
          confirmButtonText: t("OK"),
          confirmButtonColor: "#dc3545",
        });
      }
    }
  };

  const onClose = () => {
    setBulkUploadPopUp(false);
    setSelectedCustomer(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFandOFailSO = async (id) => {
    setSyncLoading(true);
    setSyncLoadingId(id);
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/sales-order/sync_to_fando?orderId=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (data?.success) {
        fetchOrders(page, searchQuery, filters);
        Swal.fire({
          title: t("Success"),
          text: t("Order synced successfully."),
          icon: "success",
          confirmButtonText: t("OK"),
        });
      } else {
        Swal.fire({
          title: t("Error"),
          text: t(`${data?.message}`),
          icon: "error",
          confirmButtonText: t("OK"),
        });
      }
    } catch (error) {
      console.error("Error syncing order:", error);
      Swal.fire({
        title: t("Error"),
        text: t("Failed to sync order. Please try again later."),
        icon: "error",
        confirmButtonText: t("OK"),
      });
    } finally {
      setSyncLoading(false);
      setSyncLoadingId(null);
    }
  };

  const handleSubmitFile = async (file) => {
    if (!file) return;

    setExcelLoading(true);
    setUploadProgress(0);
    setUploadComplete(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('customerId', selectedCustomer.id);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95; // Stay at 95% until actual completion
          }
          return prev + 5;
        });
      }, 200);

      const response = await axios.post(
        `${API_BASE_URL}/bulk-order/upload-excel`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
          validateStatus: () => true,
        }
      );

      // Clear the interval and set final progress
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Handle validation errors (400 status)
      if (response?.status === 400 && response.headers['content-type'] !== 'application/json') {
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        Swal.fire({
          title: t('Validation Failed'),
          html: t('Some rows contain validation errors.<br />') +
            t(' The Excel file has been updated with a new column named <b>Errors</b>.<br />') +
            t(' Please open the file, review the <b>Errors</b>') +
            t(' column, fix the issues, and re-upload the file.'),
          icon: 'warning',
          confirmButtonText: t('Download Error File'),
        }).then(() => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'salesorder_upload_errors.xlsx';
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        });
        return;
      }

      const blob = response?.data;
      const text = await blob.text();
      const data = JSON.parse(text);

      if (response?.status === 200 && data?.status === 'Ok') {
        // Set completion flag only after successful response
        setUploadComplete(true);
        fetchOrders();

        // Extract order counts from response
        const ordersCreated = data.ordersCreated || 0;
        const ordersUpdated = data.ordersUpdated || 0;
        const branchesProcessed = data.branchesProcessed || 0;

        // Build detailed success message
        let successMessageDetails = '';
        const orderCountDetails = [];

        if (ordersCreated > 0) {
          orderCountDetails.push(`${ordersCreated} order${ordersCreated > 1 ? 's' : ''} created`);
        }

        if (ordersUpdated > 0) {
          orderCountDetails.push(`${ordersUpdated} order${ordersUpdated > 1 ? 's' : ''} updated`);
        }

        if (orderCountDetails.length > 0) {
          successMessageDetails = orderCountDetails.join(' and ');
        }

        // Show detailed success message
        Swal.fire({
          title: t('File Uploaded Successfully'),
          html: `
          <div style="text-align: center; margin: 20px 0;">
            <p><strong>${t('Processing Summary')}</strong></p>
            <ul>
              ${branchesProcessed > 0 ? `<span>${branchesProcessed} branch${branchesProcessed > 1 ? 'es' : ''} processed</span>` : ''}
              <break />
            </ul>
            ${successMessageDetails ? `<p style="margin-top: 15px; font-weight: 500;">${successMessageDetails}</p>` : ''}
          </div>
        `,
          icon: 'success',
          confirmButtonText: t('OK'),
          width: '500px',
        });
        window.location.reload();
      } else {
        Swal.fire({
          title: t('File Upload Failed'),
          text: data.message || t('An error occurred while uploading the file.'),
          icon: 'error',
          confirmButtonText: t('OK'),
        });
        window.location.reload();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      Swal.fire({
        title: t('File Upload Failed'),
        text: t('An error occurred while uploading the file.'),
        icon: 'error',
        confirmButtonText: t('OK'),
      });
      window.location.reload();
    } finally {
      setExcelLoading(false);
      setBulkUploadPopUp(false);
      setSelectedCustomer(null);
      setSelectedBranch(null);
      setSelectedFile(null);
      setUploadProgress(0);
      setUploadComplete(false);
    }
  };

  const totalPages =
    Number.isFinite(total) &&
    Number.isFinite(pageSize) &&
    total > 0 &&
    pageSize > 0
      ? Math.ceil(total / pageSize)
      : 1;

  const paginatedOrders = Array.isArray(filteredOrders)
    ? filteredOrders.slice(0, pageSize)
    : [];
  const HandleBulkOrderUpload = () => {
    setBulkUploadPopUp(true);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Swal.fire({
        title: t("No File Selected"),
        text: t("Please select a file to upload."),
        icon: "warning",
        confirmButtonText: t("OK"),
      });
      return;
    }

    setExcelLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/sales-order/bulk-upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === "Ok") {
        Swal.fire({
          title: t("Success"),
          text: t("File uploaded successfully."),
          icon: "success",
          confirmButtonText: t("OK"),
        });
        setBulkUploadPopUp(false);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        fetchOrders(page, searchQuery, filters);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      Swal.fire({
        title: t("Error"),
        text: t("Failed to upload file. Please try again later."),
        icon: "error",
        confirmButtonText: t("OK"),
      });
    } finally {
      setExcelLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
    setFilterAnchor(null);
  };

  const handleColumnVisibilityChange = (newModel) => {
    setColumnVisibilityModel(newModel);
  };

  function CustomFooter() {
    return (
      <GridFooterContainer>
        <Box sx={{ flexGrow: 1 }} />
        <GridPagination />
      </GridFooterContainer>
    );
  }

  const filteredData = visibleColumns?.filter((item) =>
    searchableFields?.includes(item?.field)
  );

  const handleApproval = (mode) => {
    // setFilters({});
    setApprovalMode(mode === "approval");
    if (mode === "approval") {
      fetchApprovals();
    } else {
      fetchOrders();
    }
  };

  return (
    <Sidebar title={t("Orders")}>
      <div className="orders-content">
        {user?.userType.toLowerCase() === "employee" && (
          <div className="filter-section">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 12,
                overflowX: "auto",
                scrollbarWidth: "none",
              }}
            >
              <Tabs
                tabs={filteredCategoryTabs}
                activeTab={activeCategory}
                onTabChange={(newCategory) => {
                  console.log(
                    "🔄 Tab changing from",
                    activeCategory,
                    "to",
                    newCategory
                  );
                  setActiveCategory(newCategory);
                  setFilters({ entity: newCategory });
                  setApprovalMode(false);
                  fetchOrders(1, searchQuery, { entity: newCategory });
                  setSearchQuery("");
                  setCategoryFilter(""); // Reset category filter
                  setSubCategoryFilter(""); // Reset subcategory filter
                  setSubCategoryOptions([]); // Clear subcategory options immediately
                }}
                variant="category"
              />
            </div>
          </div>
        )}
        {isMobile ? (
          <div className="table-container">
            {loading ? (
              <LoadingSpinner />
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <TableMobile
                columns={visibleColumns}
                allColumns={isApprovalMode ? approvalColumns : orderColumns}
                data={filteredOrders}
                showAllDetails={true}
                handleAllDetailsClick={handleShowAllDetailsClick}
                selectedRow={selectedRow}
                setSelectedRow={setSelectedRow}
                showRowPopup={showRowPopup}
                setShowRowPopup={setShowRowPopup}
                getPaymentStatusClass={getPaymentStatusClass}
                dataGridComponent={
                  <DataGrid
                    apiRef={gridApiRef}
                    rows={filteredOrders}
                    columns={visibleColumns}
                    pageSize={pageSize}
                    rowCount={total}
                    onRowClick={handleRowClick}
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={setColumnVisibilityModel}
                    sortModel={sortModel}
                    onSortModelChange={handleSortModelChange}
                    disableSelectionOnClick
                    disableColumnMenu
                    hideFooter={true}
                    hideFooterPagination={true}
                    disableExtendRowFullWidth={true}
                    pagination={false}
                    autoHeight
                     rowHeight={55}
                    display="flex"
                    textAlign={i18n.language === "ar" ? "right" : "left"}
                    justifyContent={i18n.language === "ar" ? "right" : "left"}
                    showToolbar
                    slots={{
                      toolbar: () => (
                        <CustomToolbar
                          searchQuery={searchQuery}
                          filterAnchor={filterAnchor}
                          onSearch={handleSearch}
                          setSearchQuery={setSearchQuery}
                          setFilterAnchor={setFilterAnchor}
                          handleFilterChange={handleFilterChange}
                          onColumnVisibilityChange={setColumnVisibilityModel}
                          columns={filteredData}
                          filters={filters}
                          columnVisibilityModel={columnVisibilityModel}
                          searchPlaceholder="Search orders..."
                          showColumnVisibility={true}
                          showFilters={true}
                          showExport={false}
                          showUpload={isV("uploadButton")}
                          showAdd={isV("addButton")}
                          buttonName={t("add")}
                          showApproval={
                            isV("approvalButton") &&
                            filters.entity?.toLowerCase() ===
                              Constants.ENTITY.VMCO?.toLowerCase()
                          }
                          handleAddClick={handleAddOrder}
                          handleUploadClick={HandleBulkOrderUpload}
                          columnsToDisplay={columnsToDisplay}
                          handleApproval={handleApproval}
                          isApprovalMode={isApprovalMode}
                        />
                      ),
                    }}
                    sx={{
                      "& .MuiDataGrid-row": {
                        cursor: "default", // Changed from pointer to default since row click no longer navigates
                        "&:hover": {
                          backgroundColor: "rgba(0, 0, 0, 0.04)",
                        },
                      },
                      // Arabic RTL styling for mobile
                      ...(i18n.language === "ar" && {
                        direction: "rtl",
                        "& .MuiDataGrid-cell": {
                          textAlign: "right !important",
                        },
                        "& .MuiDataGrid-columnHeader": {
                          textAlign: "right !important",
                        },
                        "& .MuiDataGrid-columnHeaderTitle": {
                          textAlign: "right !important",
                        },
                        "& .MuiDataGrid-cellContent": {
                          textAlign: "right !important",
                        },
                      }),
                    }}
                  />
                }
              />
            )}
          </div>
        ) : (
          <div className="table-container">
            {loading ? (
              <LoadingSpinner />
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <DataGrid
                rows={filteredOrders}
                columns={visibleColumns}
                pageSize={pageSize}
                rowCount={total}
                onRowClick={handleRowClick}
                columnVisibilityModel={columnVisibilityModel}
                onColumnVisibilityModelChange={setColumnVisibilityModel}
                sortModel={sortModel}
                onSortModelChange={handleSortModelChange}
                disableSelectionOnClick
                disableColumnMenu
                hideFooter={true}
                hideFooterPagination={true}
                disableExtendRowFullWidth={true}
                pagination={false}
                autoHeight
                rowHeight={55}
                display="flex"
                textAlign={i18n.language === "ar" ? "right" : "left"}
                justifyContent={i18n.language === "ar" ? "right" : "left"}
                showToolbar
                slots={{
                  toolbar: () => (
                    <CustomToolbar
                      searchQuery={searchQuery}
                      filterAnchor={filterAnchor}
                      onSearch={handleSearch}
                      setSearchQuery={setSearchQuery}
                      setFilterAnchor={setFilterAnchor}
                      handleFilterChange={handleFilterChange}
                      onColumnVisibilityChange={setColumnVisibilityModel}
                      columns={filteredData}
                      filters={filters}
                      columnVisibilityModel={columnVisibilityModel}
                      searchPlaceholder="Search orders..."
                      showColumnVisibility={true}
                      showFilters={true}
                      showExport={!isApprovalMode}
                      showUpload={isV("uploadButton")}
                      showAdd={isV("addButton")}
                      buttonName={t("add")}
                      showApproval={
                        isV("approvalButton") &&
                        (filters.entity?.toLowerCase() ===
                          Constants.ENTITY.VMCO?.toLowerCase())
                      }
                      handleAddClick={handleAddOrder}
                      handleUploadClick={HandleBulkOrderUpload}
                      columnsToDisplay={columnsToDisplay}
                      handleApproval={handleApproval}
                      isApprovalMode={isApprovalMode}
                      handleExportClick={handleExportAll}
                    />
                  ),
                }}
                sx={{
                  "& .MuiDataGrid-row": {
                    cursor: "default", // Changed from pointer to default since row click no longer navigates
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  },
                  // Arabic RTL styling for desktop
                  ...(i18n.language === "ar" && {
                    direction: "rtl",
                    "& .MuiDataGrid-cell": {
                      textAlign: "right !important",
                    },
                    "& .MuiDataGrid-columnHeader": {
                      textAlign: "right !important",
                    },
                    "& .MuiDataGrid-columnHeaderTitle": {
                      textAlign: "right !important",
                    },
                    "& .MuiDataGrid-cellContent": {
                      textAlign: "right !important",
                    },
                  }),
                }}
              />
            )}
          </div>
        )}

        {bulkUploadPopUp && (
          <div>
            <div className="gp-backdrop" onClick={onClose} />
            {excelLoading ? (
              <div style={{ padding: '24px 28px' }}>
                <FileUploadProgress
                  progress={uploadProgress}
                  isComplete={uploadComplete}
                  onComplete={() => {
                    Swal.fire({
                      title: t('File Uploaded Successfully'),
                      text: t('Bulk orders processed successfully for all branches'),
                      icon: 'success',
                      confirmButtonText: t('OK'),
                    });
                  }}
                  onRowErrors={() => {
                    console.log('Row validation in progress...');
                  }}
                  onOtherErrors={() => {
                    console.log('Final validation in progress...');
                  }}
                />
              </div>
            ) : (
              <div className="gp-modal">
                <div className="gp-header">
                  <span className="gp-title">{t("Upload Orders Data")}</span>
                  <button className="gp-close-btn" onClick={onClose}>
                    {t("Close")}
                  </button>
                </div>

                {loading ? (
                  <div style={{ padding: 24 }}>
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div style={{ padding: "0 28px 20px 28px" }}>
                    <div
                      className="customer-branch-names"
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      {isV("customerName") && (
                        <div className="order-details-field">
                          <label htmlFor="customerField">
                            {t("Company Name")}
                          </label>
                          <div
                            className="customer-input-container"
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            <input
                              style={{ width: "310px" }}
                              id="customerField"
                              name="selectedCustomer"
                              onClick={() => setShowCustomerPopup(true)}
                              className="customer-input"
                              placeholder={t("Click to select company")}
                              value={
                                selectedCustomer
                                  ? isArabic
                                    ? selectedCustomer.companyNameAr
                                    : selectedCustomer.companyNameEn
                                  : ""
                              }
                              disabled={!isE("customerName")}
                              autoComplete="off"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <p style={{ marginTop: 20, marginBottom: 20 }}>
                      {t(
                        "To upload multiple orders at once, please download the Excel template below, fill in all required branch information correctly, and upload the completed file."
                      )}
                    </p>

                    <div className="popup-buttons-row">
                      <button
                        className="download-btn"
                        onClick={() => handleTemplateDownload()}
                        disabled={!selectedCustomer}
                      >
                        📥 {t("Download Excel Template")}
                      </button>
                      <button
                        className="upload-btn"
                        onClick={() => fileInputRef.current.click()}
                        disabled={!selectedCustomer}
                      >
                        📤 {t("Upload Completed Excel File")}
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".xlsx, .xls"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) setSelectedFile(file);
                        }}
                      />
                    </div>
                    {selectedFile && (
                      <div
                        style={{
                          marginTop: 16,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <p style={{ margin: 0 }}>
                          {t("Selected File")}: <b>{selectedFile.name}</b>
                        </p>
                        <button
                          className="submit-btn"
                          onClick={() => handleSubmitFile(selectedFile)}
                        >
                          ✅ {t("Submit File")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
              </div>
            )}
          </div>
        )}

        {showCustomerPopup && (
          <GetCustomers
            onClose={() => setShowCustomerPopup(false)}
            onSelect={(customer) => {
              setSelectedCustomer(customer);
              setShowCustomerPopup(false);
            }}
          />
        )}

        {isV("ordersPagination") && paginatedOrders.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={String(totalPages)}
            onPageChange={setPage}
          />
        )}
      </div>
    </Sidebar>
  );
}

export default Orders;
