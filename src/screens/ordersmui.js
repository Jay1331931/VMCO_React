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
import { Chip, Box, Button } from "@mui/material";
import {
  DataGrid,
  GridFooterContainer,
  GridPagination,
  useGridApiRef,
} from "@mui/x-data-grid";
import { set } from "date-fns";
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
  "companyNameEn",
  "branchNameEn",
  "entity",
  "paymentMethod",
  "createdByUsername",
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

  const handlePay = async (order, email = false) => {
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
      } else if (!email && data?.details?.url) {
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
    {
      key: "upload orders",
      label: t("Upload orders"),
      visible: true,
      onClick: () => HandleBulkOrderUpload(),
    },
    {
      key: "download orders",
      label: t("Download orders"),
      visible: false,
      onClick: () =>
        Swal.fire({
          title: t("Download Orders clicked"),
          text: t("Button clicked"),
          icon: "success",
          confirmButtonText: t("OK"),
        }),
    },
  ];

  const isArabic = i18n.language === "ar";

  const orderColumns = [
    {
      field: "id",
      headerName: t("Order #"),
      include: isV("orderNumber"),
      flex: 1,
    },
    {
      field: "erpOrderId",
      headerName: t("Sales Order ID"),
      include: isV("erpOrderId"),
      flex: 1,
    },
    {
      field: isArabic ? "companyNameAr" : "companyNameEn",
      headerName: t("Customer"),
      include: isV("companyName"),
      flex: 2,
    },
    {
      field: isArabic ? "branchNameLc" : "branchNameEn",
      headerName: t("Branch"),
      include: isV("branchName"),
      flex: 2,
    },
    {
      field: "entity",
      headerName: t("Entity"),
      include: isV("entity"),
      flex: 1,
      renderCell: (params) => {
        let badge = null;
        if (params.value === "VMCO") {
          badge = params.row.isMachine ? (
            <Chip label={t("Machines")} size="small" color="primary" />
          ) : (
            <Chip label={t("Consumables")} size="small" color="primary" />
          );
        } else if (params.value === "SHC") {
          badge = params.row.isFresh ? (
            <Chip label={t("Fresh")} size="small" color="primary" />
          ) : (
            <Chip label={t("Frozen")} size="small" color="primary" />
          );
        }

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <span>{params.value}</span>
            {badge}
          </Box>
        );
      },
    },
    {
      field: "paymentMethod",
      headerName: t("Payment Method"),
      include: isV("paymentMethod"),
      flex: 1,
    },
    {
      field: "createdByUsername",
      headerName: t("Created By"),
      include: isV("createdBy"),
      flex: 1,
    },
    {
      field: "createdAt",
      headerName: t("Order Placement Date"),
      include: isV("createdAt"),
      flex: 1,
      valueFormatter: (params) =>
        params.value ? formatDate(params.value, "DD/MM/YYYY") : " ",
    },
    {
      field: "totalAmount",
      headerName: t("Total Amount"),
      include: isV("totalAmount"),
      flex: 1,
      valueFormatter: (params) => parseFloat(params.value || 0).toFixed(2),
    },
    {
      field: "paymentStatus",
      headerName: t("Payment Status"),
      include: isV("paymentStatus"),
      flex: 1,
      cellClassName: (params) => getPaymentStatusClass(params.value),
    },
    {
      field: "status",
      headerName: t("Status"),
      include: isV("status"),
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value}
          sx={{
            backgroundColor:
              params.value === "Cold"
                ? "skyblue"
                : params.value === "Pending"
                ? "#fff8e1"
                : "#EF0107",
            width: "100%",
          }}
        />
      ),
    },
    {
      field: "actions",
      headerName: t("Actions"),
      include: isV("action") || isV("sendLink") || isV("FandOSyncSO"),
      flex: 2,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          {isV("action") && (
            <Button
              size="small"
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                handlePay(params.row);
              }}
            >
              {t("Pay")}
            </Button>
          )}
          {isV("sendLink") && (
            <Button
              size="small"
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                handlePay(params.row, true);
              }}
            >
              {t("Send Link")}
            </Button>
          )}
          {isV("FandOSyncSO") && (
            <Button
              size="small"
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                handleFandOFailSO(params.row.id);
              }}
              disabled={syncLoading && syncLoadingId === params.row.id}
            >
              {syncLoading && syncLoadingId === params.row.id
                ? t("Syncing...")
                : t("Sync")}
            </Button>
          )}
        </Box>
      ),
    },
  ];

  const approvalColumns = [
    {
      field: "id",
      headerName: t("Order #"),
      include: isV("orderNumber"),
      flex: 1,
    },
    {
      field: "erpOrderId",
      headerName: t("ERP ID"),
      include: isV("erpOrderId"),
      flex: 1,
    },
    {
      field: isArabic ? "companyNameAr" : "companyNameEn",
      headerName: t("Customer"),
      include: isV("companyName"),
      flex: 2,
    },
    {
      field: isArabic ? "branchNameLc" : "branchNameEn",
      headerName: t("Branch"),
      include: isV("branchName"),
      flex: 2,
    },
    {
      field: "workflowName",
      headerName: t("Workflow Name"),
      include: isV("workflowName"),
      flex: 1,
    },
    {
      field: "entity",
      headerName: t("Entity"),
      include: isV("entity"),
      flex: 1,
      renderCell: (params) => {
        let badge = null;
        if (params.value === "VMCO") {
          badge = params.row.isMachine ? (
            <Chip label={t("Machines")} size="small" color="primary" />
          ) : (
            <Chip label={t("Consumables")} size="small" color="primary" />
          );
        } else if (params.value === "SHC") {
          badge = params.row.isFresh ? (
            <Chip label={t("Fresh")} size="small" color="primary" />
          ) : (
            <Chip label={t("Frozen")} size="small" color="primary" />
          );
        }

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <span>{params.value}</span>
            {badge}
          </Box>
        );
      },
    },
    {
      field: "paymentMethod",
      headerName: t("Payment Method"),
      include: isV("paymentMethod"),
      flex: 1,
    },
    {
      field: "createdByUsername",
      headerName: t("Created By"),
      include: isV("createdBy"),
      flex: 1,
    },
    {
      field: "createdAt",
      headerName: t("Order Placement Date"),
      include: isV("createdAt"),
      flex: 1,
      valueFormatter: (params) =>
        params.value ? formatDate(params.value, "DD/MM/YYYY") : " ",
    },
    {
      field: "totalAmount",
      headerName: t("Total Amount"),
      include: isV("totalAmount"),
      flex: 1,
      valueFormatter: (params) => parseFloat(params.value || 0).toFixed(2),
    },
    {
      field: "status",
      headerName: t("Status"),
      include: isV("status"),
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value}
          sx={{
            backgroundColor:
              params.value === "Cold"
                ? "skyblue"
                : params.value === "Pending"
                ? "#fff8e1"
                : "#EF0107",
            width: "100%",
          }}
        />
      ),
    },
  ];

  const visibleColumns = isApprovalMode
    ? approvalColumns.filter((col) => col.include)
    : orderColumns.filter((col) => col.include);

  const handleFandOFailSO = async (id) => {
    setSyncLoading(true);
    setSyncLoadingId(id);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/sales-order/fail-sync/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.status === "Ok") {
        fetchOrders(page, searchQuery, filters);
        Swal.fire({
          title: t("Success"),
          text: t("Order synced successfully."),
          icon: "success",
          confirmButtonText: t("OK"),
        });
      } else {
        throw new Error(response.data.message);
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

  return (
    <Sidebar title={t("Orders")}>
      <div className="orders-content">
        <div className="page-header">
          <div className="header-actions">
            {/* <ToggleButton
              checked={isApprovalMode}
              onChange={toggleApprovalMode}
              label={t("Approval Mode")}
            /> */}
            <AnimatedTabs
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
            />
            {isE("addOrder") && (
              <ActionButton
                label={t("Add Order")}
                onClick={handleAddOrder}
                menuItems={orderMenuItems}
              />
            )}
          </div>
        </div>

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
                    columns={visibleColumns}
                    filters={filters}
                    columnVisibilityModel={columnVisibilityModel}
                    searchPlaceholder="Search orders..."
                    showColumnVisibility={true}
                    showFilters={true}
                    columnsToDisplay={columnsToDisplay}
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
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>{t("Upload Orders")}</h2>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls"
              />
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setBulkUploadPopUp(false)}
                  disabled={excelLoading}
                >
                  {t("Cancel")}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleUpload}
                  disabled={excelLoading}
                >
                  {excelLoading ? t("Uploading...") : t("Upload")}
                </button>
              </div>
            </div>
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
