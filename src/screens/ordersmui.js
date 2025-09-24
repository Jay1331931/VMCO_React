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
import GetBranches from "../components/GetBranches";
import Constants from "../constants";
import { or } from "ajv/dist/compile/codegen";
import { Chip, Box, Button, Typography, Tooltip } from "@mui/material";
import {
  DataGrid,
  GridFooterContainer,
  GridPagination,
  useGridApiRef,
} from "@mui/x-data-grid";
import { max, min, set } from "date-fns";
import { Height } from "@mui/icons-material";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import IosShareIcon from '@mui/icons-material/IosShare';
import SyncIcon from '@mui/icons-material/Sync';
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
    case "under review":
      return "status-under-review";
    case "pending":
    default:
      return "status-pending";
  }
};

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
  const [syncLoadingId, setSyncLoadingId] = useState(null);
  const [sortModel, setSortModel] = useState([]);
  const [sortField, setSortField] = useState("createdAt");
  const [filterAnchor, setFilterAnchor] = useState(null);
  const gridApiRef = useGridApiRef();

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
    fetchOrders(1, searchQuery, filters, model);
  };
  // Fetch orders from API
  const fetchOrders = useCallback(
    async (page = 1, searchTerm = "", customFilters = {}, sortedModel = []) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page,
          pageSize,
          search: searchTerm,
          sortBy: sortedModel[0]?.field || "createdAt",
          sortOrder: sortedModel[0]?.sort || "desc",
          filters: JSON.stringify(customFilters),
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
    customFilters = {}
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        pageSize,
        search: searchTerm,
        sortBy: "id",
        sortOrder: "asc",
        filters: JSON.stringify(customFilters),
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
          companyNameEn: order.companyNameEn || order.company_name_en || "",
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
        fetchOrders(page, searchQuery, filters);
      }
    }
  }, [page, searchQuery, user, fetchOrders, filters, isApprovalMode]);

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

  const handleRowClick = async (params) => {
    const order = params?.row;
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
              handlePay(order, true, false);
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

  const orderMenuItems = [
    // {
    //   key: "upload orders",
    //   label: t("Upload orders"),
    //   visible: true,
    //   onClick: () => HandleBulkOrderUpload(),
    // },
    // {
    //   key: "download orders",
    //   label: t("Download orders"),
    //   visible: false,
    //   onClick: () =>
    //     Swal.fire({
    //       title: t("Download Orders clicked"),
    //       text: t("Button clicked"),
    //       icon: "success",
    //       confirmButtonText: t("OK"),
    //     }),
    // },
  ];

  const isArabic = i18n.language === "ar";
  const COMMON_RULES = {
    SHC_GMTC: [
      // Approved cases
      {
        paymentMethod: "Pre Payment",
        paymentStatus: "Paid",
        status: "approved",
      },
      { paymentMethod: "Credit", paymentStatus: "Paid", status: "approved" },
      {
        paymentMethod: "Cash on Delivery",
        paymentStatus: "Pending",
        status: "approved",
      },

      // Open cases
      { paymentMethod: "Pre Payment", paymentStatus: "Paid", status: "open" },
      { paymentMethod: "Credit", paymentStatus: "Paid", status: "open" },
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
      { paymentMethod: "Credit", paymentStatus: "Paid", status: "approved" },
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
      maxWidth: 80,
      flex: 1,
    },
    {
      field: "erpOrderId",
      headerName: t("Sales Order ID"),
      include: isV("erpOrderId"),
      searchable: true,
      minWidth: 120,
      maxWidth: 120,
      flex: 1,
    },
    {
      field: isArabic ? "companyNameAr" : "companyNameEn",
      headerName: t("Customer"),
      include: isV("companyName"),
      searchable: true,
      maxWidth: 180,
      flex: 2,
    },
    {
      field: isArabic ? "branchNameLc" : "branchNameEn",
      headerName: t("Branch"),
      include: isV("branchName"),
      searchable: true,
      // minWidth: 100,
      // maxWidth: 180,
      flex: 2,
    },
    {
      field: "entity",
      headerName: t("Entity"),
      include: isV("entity"),
      searchable: true,
      maxWidth: 100,

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
            <Typography align="center">{params.value}</Typography>
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
      maxWidth: 150,
      flex: 1,
    },
    {
      field: "createdByUsername",
      headerName: t("Created By"),
      include: isV("createdBy"),
      searchable: false,
      sortable: false,
      minWidth: 100,
      maxWidth: 120,
      flex: 1,
    },
    {
      field: "createdAt",
      headerName: t("Order Placement Date"),
      include: isV("createdAt"),
      searchable: false,
      minWidth: 100,
      maxWidth: 120,
      flex: 1,
      renderCell: (params) =>
        params?.row?.createdAt ? formatDate( params?.row?.createdAt, "DD/MM/YYYY") : " ",
    },
    {
      field: "totalAmount",
      headerName: t("Total Amount"),
      include: isV("totalAmount"),
      searchable: false,
      minWidth: 100,
      maxWidth: 120,
      renderCell: (params) => parseFloat(params?.row?.totalAmount || 0).toFixed(2),
    },
    {
      field: "paymentStatus",
      headerName: t("Payment Status"),
      include: isV("paymentStatus"),
      searchable: true,
      minWidth: 120,
      maxWidth: 140,
      flex: 1,
      // cellClassName: (params) => getPaymentStatusClass(params.value),
      renderCell: (params) => (
        <label className={getPaymentStatusClass(params.value)}>
          {params.value}
        </label>
      ),
    },
    {
      field: "status",
      headerName: t("Status"),
      include: isV("status"),
      searchable: true,
      minWidth: 120,
      maxWidth: 140,
      flex: 1,
      renderCell: (params) => (
        <label className={getStatusClass(params.value)}>{params.value}</label>
      ),
    },
    {
      field: "pay",
      headerName: t("Action"),
      include: isV("action"),
      searchable: false,
      flex: 2,
         minWidth: 70,
      maxWidth: 80,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          {isV("action") &&
            params?.row?.paymentMethod?.toLowerCase() != "cash on delivery" &&
            params?.row?.paymentStatus?.toLowerCase() !== "paid" &&
            (params?.row?.status?.toLowerCase() === "approved" ||
              (params?.row?.status?.toLowerCase() === "open" &&
                (params?.row?.entity.toLowerCase() ===
                  Constants.ENTITY.DAR.toLowerCase() ||
                  params?.row?.entity.toLowerCase() ===
                    Constants.ENTITY.GMTC.toLowerCase() ||
                  params?.row?.entity.toLowerCase() ===
                    Constants.ENTITY.SHC.toLowerCase())) ||
              (params?.row?.status?.toLowerCase() === "pending" &&
                (params?.row?.entity.toLowerCase() ===
                  Constants.ENTITY.DAR.toLowerCase() ||
                  params?.row?.entity.toLowerCase() ===
                    Constants.ENTITY.NAQI.toLowerCase()))) && (
              <Box
                component="span"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePay(params.row);
                }}
                sx={{
                  color: "primary.main",
                  cursor: "pointer",
                  // textDecoration: "underline",
                  fontSize: "0.875rem",
                  "&:hover": {
                    textDecoration: "none",
                  },
                }}
              >
                {/* {t("Pay")} */}
                      <Tooltip title={t("Pay")} arrow>
                <AccountBalanceWalletIcon/>
                </Tooltip>
              </Box>
            )}
        </Box>
      ),
    },
    {
      field: "sendLink",
      headerName: t("Action"),
      include: isV("sendLink")||isV("FandOSyncSO"),
      searchable: false,
      flex: 2,
        minWidth: 70,
      maxWidth: 80,
      renderCell: (params) =>{
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
                    paymentStatus: "Paid",
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
        <Box sx={{ display: "flex", gap: 1 }}>
          {isV("sendLink") &&
            params?.row?.paymentMethod?.toLowerCase() != "cash on delivery" &&
            params?.row?.paymentStatus?.toLowerCase() !== "paid" &&
            (params?.row?.status?.toLowerCase() === "approved" ||
              (params?.row?.status?.toLowerCase() === "open" &&
                (params?.row?.entity.toLowerCase() ===
                  Constants.ENTITY.DAR.toLowerCase() ||
                  params?.row?.entity.toLowerCase() ===
                    Constants.ENTITY.GMTC.toLowerCase() ||
                  params?.row?.entity.toLowerCase() ===
                    Constants.ENTITY.SHC.toLowerCase())) ||
              (params?.row?.status?.toLowerCase() === "pending" &&
                (params?.row?.entity.toLowerCase() ===
                  Constants.ENTITY.DAR.toLowerCase() ||
                  params?.row?.entity.toLowerCase() ===
                    Constants.ENTITY.NAQI.toLowerCase()))) && (
              <Box
                component="span"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePay(params.row, false, true);
                }}
                sx={{
                  color: "primary.main",
                  cursor: "pointer",
                  // textDecoration: "underline",
                  fontSize: "0.875rem",
                }}
              >
                <Tooltip title= {t("Send Link")} arrow>
                {/* {t("Send Link")} */}
                <IosShareIcon/>
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
                
 <Tooltip title= {syncLoading && syncLoadingId === params.row.id
                  ? t("Syncing...")
                  : t("Sync")}  arrow>
<SyncIcon/>
 </Tooltip>
                  
              </Box>
            )}

            
        </Box>
      )},
    },
//     {
//       field: "orderSync",
//       headerName: t("Sync"),
//       include: isV("FandOSyncSO"),
//       searchable: false,
//      minWidth: 70,
//       maxWidth: 80,
//       flex: 2,
//       renderCell: (params) => {
//         const rowdata = params.row;
//         const SYNC_RULES = {
//           [Constants.ENTITY.VMCO]: (rowdata) =>
//             rowdata.isMachine
//               ? [
//                   {
//                     paymentMethod: "Pre Payment",
//                     paymentStatus: "Pending",
//                     status: "approved",
//                   },
//                 ]
//               : [
//                   {
//                     paymentMethod: "Pre Payment",
//                     paymentStatus: "Pending",
//                     status: "approved",
//                   },
//                   {
//                     paymentMethod: "Credit",
//                     paymentStatus: "Paid",
//                     status: "approved",
//                   },
//                   {
//                     paymentMethod: "Cash on Delivery",
//                     paymentStatus: "Pending",
//                     status: "approved",
//                   },
//                 ],

//           [Constants.ENTITY.SHC]: () => COMMON_RULES.SHC_GMTC,
//           [Constants.ENTITY.GMTC]: () => COMMON_RULES.SHC_GMTC,
//           [Constants.ENTITY.NAQI]: () => COMMON_RULES.NAQI_DAR,
//           [Constants.ENTITY.DAR]: () => COMMON_RULES.NAQI_DAR,
//         };
//         const rules = SYNC_RULES[rowdata.entity]?.(rowdata) || [];
//         const isValidForSync = rules.some(
//           (rule) =>
//             rule?.paymentMethod?.toLowerCase() ===
//               rowdata.paymentMethod?.toLowerCase() &&
//             rule?.paymentStatus?.toLowerCase() ===
//               rowdata.paymentStatus?.toLowerCase() &&
//             rule?.status?.toLowerCase() === rowdata.status?.toLowerCase()
//         );
//         return (
//           <Box sx={{ display: "flex", gap: 1 }}>
//             {isV("FandOSyncSO") && !rowdata.erpOrderId && isValidForSync && (
//               <Box
//                 component="span"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   if (!(syncLoading && syncLoadingId === params.row.id)) {
//                     handleFandOFailSO(params.row.id);
//                   }
//                 }}
//                 sx={{
//                   color:
//                     syncLoading && syncLoadingId === params.row.id
//                       ? "text.disabled"
//                       : "primary.main",
//                   cursor:
//                     syncLoading && syncLoadingId === params.row.id
//                       ? "default"
//                       : "pointer",
//                   textDecoration:
//                     syncLoading && syncLoadingId === params.row.id
//                       ? "none"
//                       : "none",
//                   fontSize: "0.875rem",
//                 }}
//               >
                
//  <Tooltip title= {syncLoading && syncLoadingId === params.row.id
//                   ? t("Syncing...")
//                   : t("Sync")}  arrow>
// <SyncIcon/>
//  </Tooltip>
                  
//               </Box>
//             )}
//           </Box>
//         );
//       },
//     },
  ];

  const approvalColumns = [
    {
      field: "id",
      headerName: t("Order #"),
      include: isV("orderNumber"),
      searchable: true,
      maxWidth: 80,
      flex: 1,
    },
    {
      field: "erpOrderId",
      headerName: t("ERP ID"),
      include: isV("erpOrderId"),
      searchable: true,
      minWidth: 120,
      maxWidth: 120,
      flex: 1,
    },
    {
      field: isArabic ? "companyNameAr" : "companyNameEn",
      headerName: t("Customer"),
      include: isV("companyName"),
      searchable: true,
      maxWidth: 180,
      flex: 2,
    },
    {
      field: isArabic ? "branchNameLc" : "branchNameEn",
      headerName: t("Branch"),
      include: isV("branchName"),
      searchable: true,
      minWidth: 80,
      maxWidth: 80,
      flex: 2,
    },
    {
      field: "workflowName",
      headerName: t("Workflow Name"),
      include: isV("workflowName"),
      searchable: true,
      maxWidth: 100,
      flex: 1,
    },
    {
      field: "entity",
      headerName: t("Entity"),
      include: isV("entity"),
      searchable: true,
      maxWidth: 100,
      flex: 1,
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
            <Typography align="center">{params.value}</Typography>
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
      maxWidth: 150,
      flex: 1,
    },
    {
      field: "createdByUsername",
      headerName: t("Created By"),
      include: isV("createdBy"),
      searchable: false,
      sortable: false,
      minWidth: 100,
      maxWidth: 120,
      flex: 1,
    },
    {
      field: "createdAt",
      headerName: t("Order Placement Date"),
      include: isV("createdAt"),
      searchable: false,
      minWidth: 100,
      maxWidth: 120,
      flex: 1,
      renderCell: (params) =>
        params?.row?.createdAt? formatDate( params?.row?.createdAt, "DD/MM/YYYY") : " ",
    },
    {
      field: "totalAmount",
      headerName: t("Total Amount"),
      include: isV("totalAmount"),
      searchable: false,
      minWidth: 100,
      maxWidth: 120,
      renderCell: (params) => parseFloat(params?.row?.totalAmount || 0).toFixed(2),
    },
    {
      field: "status",
      headerName: t("Status"),
      include: isV("status"),
      searchable: true,
       minWidth: 120,
      maxWidth: 140,
      flex: 1,
      renderCell: (params) => (
        <label className={getStatusClass(params.value)}>{params.value}</label>
      ),
    },
  ];

  const visibleColumns = isApprovalMode
    ? approvalColumns.filter((col) => col.include)
    : orderColumns.filter((col) => col.include);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerPopup(false);
  };

  const handleSelectBranch = (branch) => {
    setSelectedBranch(branch);
    setShowBranchPopup(false);
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
    setSelectedBranch(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFandOFailSO = async (id) => {
    setSyncLoading(true);
    setSyncLoadingId(id);
    try {
      const {data} = await axios.get(
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
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("customerId", selectedCustomer.id);
      formData.append("branchId", selectedBranch.id);

      const response = await axios.post(
        `${API_BASE_URL}/bulk-order/upload-excel`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
          validateStatus: () => true,
        }
      );

      if (
        response?.status === 400 &&
        response.headers["content-type"] !== "application/json"
      ) {
        const blob = new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        Swal.fire({
          title: t("Validation Failed"),
          html: `
    ${t("Some rows contain validation errors.")}<br>
    ${t("The Excel file has been updated with a new column named")} <b>${t(
            "Errors"
          )}</b>.<br>
    ${t("Please open the file, review the")} <b>${t("Errors")}</b> ${t(
            "column, fix the issues, and re-upload the file."
          )}.
  `,
          icon: "warning",
          confirmButtonText: t("Download Error File"),
        }).then(() => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "sales_order_upload_errors.xlsx";
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        });

        return; // Make sure to return early to prevent success message
      }
      const blob = response?.data;
      const text = await blob.text(); // convert blob to text
      const data = JSON.parse(text); // parse text to JSON
      console.log(response?.status, data?.response?.success);
      if (response?.status === 200 && data?.response?.success) {
        fetchOrders();

        Swal.fire({
          title: t("File Uploaded Successfully"),
          text:
            t(data.message) ||
            t("Sales have been updated from the Excel file."),
          icon: "success",
          confirmButtonText: t("OK"),
        });
      } else {
        Swal.fire({
          title: t("File Upload Failed"),
          text:
            t(data.message) || t("An error occurred while uploading the file."),
          icon: "error",
          confirmButtonText: t("OK"),
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      Swal.fire({
        title: t("File Upload Failed"),
        text: t("An error occurred while uploading the file."),
        icon: "error",
        confirmButtonText: t("OK"),
      });
    } finally {
      setBulkUploadPopUp(false);
      setSelectedCustomer(null);
      setSelectedBranch(null);
      setSelectedFile(null); // reset file after submit
      setExcelLoading(false);
    }
  };
  // Paginate the filtered orders
  const totalPages =
    Number.isFinite(total) &&
    Number.isFinite(pageSize) &&
    total > 0 &&
    pageSize > 0
      ? Math.ceil(total / pageSize)
      : 1;
  // Always pass totalPages as a string to Pagination to avoid NaN warning
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
     setFilterAnchor(null)
  };

  const handleColumnVisibilityChange = (newModel) => {
    setColumnVisibilityModel(newModel);
  };

  function CustomFooter() {
    return (
      <GridFooterContainer>
        {/* Empty space above pagination */}
        <Box sx={{ flexGrow: 1 }} />
        <GridPagination />
      </GridFooterContainer>
    );
  }
  const filteredData = visibleColumns?.filter((item) =>
    searchableFields?.includes(item?.field)
  );
  const handleApproval = (mode) => {
    setFilters({})
    setApprovalMode(mode === "approval");
    // Refresh data based on mode
    if (mode === "approval") {
      fetchApprovals();
    } else {
      fetchOrders();
    }
  };

  return (
    <Sidebar title={t("Orders")}>
      <div className="orders-content">
        {/* <div className="page-header">
          <div className="header-actions"> */}
            {/* <ToggleButton
              checked={isApprovalMode}
              onChange={toggleApprovalMode}
              label={t("Approval Mode")}
            /> */}
            {/* <AnimatedTabs
              toggleMode={true}
              value={isApprovalMode ? "approval" : "all"}
              onChange={(mode) => {
                setApprovalMode(mode === "approval");
                // Refresh data based on mode
                if (mode === "approval") {
                  fetchApprovals();
                } else {
                  fetchOrders();
                }
              }}
            /> */}
            {/* {isE("addOrder") && (
              <ActionButton
                label={t("Add Order")}
                onClick={handleAddOrder}
                menuItems={orderMenuItems}
              />
            )} */}
          {/* </div>
        </div> */}

        {/* <CustomToolbar
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          columns={isApprovalMode ? approvalColumns : orderColumns}
          searchPlaceholder={t("Search orders...")}
          showColumnVisibility={true}
          showFilters={false}
          filters={filters}
          columnVisibilityModel={columnVisibilityModel}
        /> */}

        <div className="table-container">
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
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
              rowHeight={70}
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
                    showUpload={true}
                    showAdd={isV("addButton")}
                    buttonName={t("add")}
                    showApproval={isV("approvalButton") }
                    // showAdd={true}
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
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                },
              }}
            />
          )}
        </div>

        {bulkUploadPopUp && (
          <div>
            <div className="gp-backdrop" onClick={onClose} />
            {excelLoading ? (
              <div>
                <LoadingSpinner />
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
                      {isV("branchName") && (
                        <div className="order-details-field">
                          <label>{t("Branch")}</label>
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
                              id="branchField"
                              name="selectedBranchName"
                              onClick={() => {
                                if (!selectedCustomer) {
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
                              value={
                                selectedBranch
                                  ? isArabic
                                    ? selectedBranch.branchNameAr
                                    : selectedBranch.branchNameEn
                                  : ""
                              }
                              readOnly
                              disabled={!isE("branchName")}
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
                        disabled={!selectedCustomer || !selectedBranch}
                      >
                        📥 {t("Download Excel Template")}
                      </button>
                      <button
                        className="upload-btn"
                        onClick={() => fileInputRef.current.click()}
                        disabled={!selectedCustomer || !selectedBranch}
                      >
                        📤 {t("Upload Completed Excel File")}
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".xlsx, .xls"
                        style={{ display: "none" }}
                        // onChange={handleFileChange}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) setSelectedFile(file); // just store file in state
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

                {/* Branch Popup */}
                {showBranchPopup && (
                  <GetBranches
                    open={showBranchPopup}
                    onClose={() => setShowBranchPopup(false)}
                    onSelectBranch={handleSelectBranch}
                    customerId={selectedCustomer?.id}
                    API_BASE_URL={API_BASE_URL}
                    t={t}
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

        {showBranchPopup && (
          <GetBranches
            customerId={selectedCustomer?.id}
            onClose={() => setShowBranchPopup(false)}
            onSelect={(branch) => {
              setSelectedBranch(branch);
              setShowBranchPopup(false);
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
