import React, { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import ActionButton from "../components/ActionButton";
import ToggleButton from "../components/ToggleButton";
import SearchInput from "../components/SearchInput";
import Table from "../components/Table";
import Pagination from "../components/Pagination";
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

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const getStatusClass = (status) => {
  //get the status from the order

  switch (status.toLowerCase()) {
    case "approved": return "status-approved";
    case "open": return "status-open";
    case "rejected": return "status-rejected";
    default: return "status-pending";
  }
};

const getPaymentStatusClass = (paymentStatus) => {
  switch (paymentStatus?.toLowerCase()) {
    case "paid": return "status-paid";
    case "under review": return "status-under-review";
    case "pending":
    default: return "status-pending";
  }
};

function Orders() {
  // const { user } = useAuth();
  const [isApprovalMode, setApprovalMode] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

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

  // Fetch orders from API
  const fetchOrders = useCallback(
    async (page = 1, searchTerm = "") => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page,
          pageSize,
          search: searchTerm,
          sortBy: "createdAt",
          sortOrder: "desc",
          filters: "{}",
        });

        const response = await fetch(
          `${API_BASE_URL}/sales-order/pagination?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },

          }
        );

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("API did not return JSON. Check API URL and server.");
        }
        const result = await response.json();
        if (result.status === "Ok") {
          // Ensure we have the companyNameEn field for each order
          console.log("API Response:", result);
          const processedOrders = result.data.data.map((order) => ({
            ...order,
            // If companyNameEn is not present in the data, use the company name or erpCustId as fallback
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
    [pageSize]
  );

  // Fetch approvals for orders (similar to customers page)
  const fetchApprovals = async (page = 1, searchTerm = "") => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        pageSize,
        search: searchTerm,
        sortBy: "id",
        sortOrder: "asc",
        filters: "{}",
      });
      console.log("Fetching approvals with params:", params.toString());
      const response = await fetch(
        `${API_BASE_URL}/workflow-instance/pending-orders-approval?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },

        }
      );
      const result = await response.json();
      console.log("API Response:", result);
      if (result.status === "Ok") {
        // Ensure we have the companyNameEn field for each order in approvals
        const processedOrders = result.data.data.map((order) => ({
          ...order,
          // If companyNameEn is not present in the data, use the company name or erpCustId as fallback
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

  //NOTE: For fetching the user again after browser refersh - start
  useEffect(() => {
    if (loading) {
      return; // Wait while loading
    }

    console.log("$$$$$$$$$$$ user in orders page", user);
    if (user) {
      if (isApprovalMode) {
        fetchApprovals(page, searchQuery); // <-- Call approval API
      } else {
        fetchOrders(page, searchQuery);    // <-- Call sales orders API
      }
    }

    if (!user) {
      console.log("$$$$$$$$$$$ logging out");
      // Logout instead of showing loading message
      //logout();
      //navigate('/login');
      //return null; // Return null while logout is processing
    }
  }, [page, searchQuery, user, fetchOrders]);

  //For fetching the user again after browser refersh - End
  //RBAC
  //use formMode to decide if it is editform or add form
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
    // No need to fetch next orderId, just navigate to add mode
    navigate("/orderDetails", { state: { mode: "add" } });
  };

  const handleRowClick = async (order) => {
    console.log("Row clicked, navigating to order details with:", order);
    try {
      // Fetch sales order lines for this order
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
            "Authorization": `Bearer ${token}`
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
      console.log("Fetched sales order :", order);
      navigate("/orderDetails", {
        state: {
          order: { ...order, salesOrderLines },
          mode: "edit",
          fromApproval: isApprovalMode,
          wfid: isApprovalMode ? order.workflowInstanceId : undefined,
          workflowName: isApprovalMode ? order.workflowName : undefined,
          workflowData: isApprovalMode ? order.workflowData : undefined, // Pass workflowData if in approval mode
          approvalHistory: isApprovalMode ? order.approvalHistory : undefined,
        },
      });
    } catch (err) {
      console.error("Failed to fetch sales order lines:", err);
      // Fallback: navigate without salesOrderLines if fetch fails
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
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (email) {
        Swal.fire({
          title: t("Payment Link Generated"),
          text: t("A payment link has been sent to the customer's email."),
          icon: t("success"),
          confirmButtonText: t("OK"),
        });
      }
      else if (!email && data?.details?.url) {
        window.open(data.details.url, "_blank");
      }
    } catch (error) {
      console.error("Error generating payment link:", error);
      Swal.fire({
        title: t("Error"),
        text: t("Failed to generate payment link. Please try again later."),
        icon: t("error"),
        confirmButtonText: t("OK"),
      });
    }


  };

  // Action menu for Orders page
  const orderMenuItems = [
    {
      key: "upload orders",
      label: t("Upload orders"),
      visible: true,
      onClick: () => HandleBulkOrderUpload(),
      visible: true
    },
    {
      key: "download orders",
      label: t("Download orders"),
      visible: true,
      onClick: () => Swal.fire({
        title: t("Download Orders clicked"),
        text: t("Button clicked"),
        icon: "success",
        confirmButtonText: t("OK"),
      }),
      visible: false
    },
  ];

  const isArabic = i18n.language === "ar"; // or use your language state
  const orderColumns = [
    { key: "id", header: () => t("Order #"), include: isV("orderNumber") },
    { key: "erpOrderId", header: () => t("Sales Order ID"), include: isV("erpOrderId") },
    { key: isArabic ? "companyNameAr" : "companyNameEn", header: () => t("Customer"), include: isV("companyName") },
    { key: isArabic ? "branchNameLc" : "branchNameEn", header: () => t("Branch"), include: isV("branchName") },
    {
      key: "entity",
      header: () => t("Entity"),
      include: isV("entity"),
      render: (item) => {
        let badge = null;

        if (item.entity === "VMCO") {
          badge = item.isMachine
            ? <span className="badge badge-blue">{t("Machines")}</span>
            : <span className="badge badge-blue">{t("Consumables")}</span>;
        } else if (item.entity === "SHC") {
          badge = item.isFresh
            ? <span className="badge badge-blue">{t("Fresh")}</span>
            : <span className="badge badge-blue">{t("Frozen")}</span>;
        }

        return (
          <div>
            {item.entity} {badge && <span style={{ marginLeft: "8px" }}>{badge}</span>}
          </div>
        );
      },
    },
    { key: "paymentMethod", header: () => t("Payment Method"), include: isV("paymentMethod") },
    { key: "createdByUsername", header: () => t("Created By"), include: isV("createdBy") },
    {
      key: "createdAt", header: () => t("Order Placement Date"), include: isV("createdAt"),
      render: (item) => item.createdAt ? formatDate(item.createdAt, "DD/MM/YYYY") : " ",
    },
    // {
    //   key: "deliveryDate", header: () => t("Delivery Date"), include: isV("expectedDeliveryDate"),
    //   render: (item) =>
    //     item.expectedDeliveryDate
    //       ? formatDate(item.expectedDeliveryDate, "DD/MM/YYYY")
    //       : " ",
    // },
    {key: "totalAmount", header: () => t("Total Amount"), include: isV("totalAmount"),
      render: (item) => parseFloat(item.totalAmount).toFixed(2),},
    { key: "paymentStatus", header: () => t("Payment Status"), include: isV("paymentStatus")},
    { key: "status", header: () => t("Status"), include: isV("status") },
    { key: "pay", header: () => t("Action"), include: isV("action") },
    { key: "sendLink", header: () => t("Action"), include: isV("sendLink") },
    { key: "orderSync", header: () => t("Sync"), include: isV("FandOSyncSO") }
  ];
  const approvalColumns = [
    { key: "id", header: () => t("Order #"), include: isV("orderNumber") },
    { key: "erpOrderId", header: () => t("ERP ID"), include: isV("erpOrderId") },
    { key: isArabic ? "companyNameAr" : "companyNameEn", header: () => t("Customer"), include: isV("companyName"), },
    { key: isArabic ? "branchNameLc" : "branchNameEn", header: () => t("Branch"), include: isV("branchName"), },
    { key: "workflowName", header: () => t("Workflow Name"), include: isV("workflowName"), },
    { key: "entity", header: () => t("Entity"), include: isV("entity"), render: (item) => { let badge = null; 
        if (item.entity === "VMCO") {
          badge = item.isMachine
            ? <span className="badge badge-blue">{t("Machines")}</span>
            : <span className="badge badge-blue">{t("Consumables")}</span>;
        } else if (item.entity === "SHC") {
          badge = item.isFresh
            ? <span className="badge badge-blue">{t("Fresh")}</span>
            : <span className="badge badge-blue">{t("Frozen")}</span>;
        }

        return (
          <div>
            {item.entity} {badge && <span style={{ marginLeft: "8px" }}>{badge}</span>}
          </div>
        );
      },
    },
    {
      key: "paymentMethod",
      header: () => t("Payment Method"),
      include: isV("paymentMethod"),
    },
    {
      key: "createdByUsername",
      header: () => t("Created By"),
      include: isV("createdBy"),
    },
    {
      key: "createdAt",
      header: () => t("Order Placement Date"),
      include: isV("createdAt"),
      render: (item) => item.createdAt ? formatDate(item.createdAt, "DD/MM/YYYY") : " ",
    },
    {
      key: "deliveryDate",
      header: () => t("Delivery Date"),
      include: isV("expectedDeliveryDate"),
      render: (item) =>
        item.expectedDeliveryDate
          ? formatDate(item.expectedDeliveryDate, "DD/MM/YYYY")
          : " ",
    },
    {
      key: "totalAmount",
      header: () => t("Total Amount"),
      include: isV("totalAmount"),
      render: (item) => parseFloat(item.totalAmount).toFixed(2),
    },
    {
      key: "paymentStatus",
      header: () => t("Payment Status"),
      include: isV("paymentStatus")
    },
    { key: "status", header: () => t("Status"), include: isV("status") },
    { key: "pay", header: () => t("Pay"), include: isV("action") },

  ];

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

  const HandleBulkOrderUpload = async () => {
    setBulkUploadPopUp(true);

  }

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Handle file upload
      console.log("Selected file:", file);
    }
  };

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

  // bulk-order/upload-excel
  const handleFandOFailSO = async (orderId) => {
    setSyncLoading(true);
    setSyncLoadingId(orderId);
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/sales-order/sync_to_fando?orderId=${orderId}`,

        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.success) {
        setSyncLoading(false);
        fetchOrders();
        Swal.fire({
          title: "Success",
          text: data.message,
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#3085d6",
        });
      } else {
        setSyncLoading(false);
        Swal.fire({
          title: "Error",
          text: data.message || "Failed to Sync with FandO.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#dc3545",
        });
      }
    } catch (error) {
      setSyncLoading(false);
      console.error("Error handling FandO fail Sales Order:", error);
      Swal.fire({
        title: "Error",
        text: error.message || "Failed to Sync with FandO.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#dc3545",
      });
    }
  };
  const handleSubmitFile = async (file) => {

    if (!file) return;
    setExcelLoading(true)
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
        fetchOrders()


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
  return (
    <Sidebar title={t("Orders")}>
      {isV("ordersContent") && (
        <div className="orders-content">
          <div className="page-header">
            <div className="header-controls">
              <SearchInput onSearch={handleSearch} />
            </div>
            <div className="header-actions">
              {isV("approvalButton") && (
                <ToggleButton
                  className="toggle-button"
                  isToggled={isApprovalMode}
                  onToggle={toggleApprovalMode}
                  leftLabel={t("All")}
                  rightLabel={t("My Approval")}
                />
              )}
              {isV("addButton") && (
                <button className="add-button" onClick={handleAddOrder}>
                  {t("+ Add")}
                </button>
              )}
              {isV("actionMenu") && <ActionButton menuItems={orderMenuItems} />}
            </div>
          </div>{" "}
          {isV("ordersTable") && (
            <Table
              columns={(isApprovalMode ? approvalColumns : orderColumns).filter(
                (col) => col.include !== false
              )}
              data={paginatedOrders}
              getStatusClass={getStatusClass}
              getPaymentStatusClass={getPaymentStatusClass}
              onRowClick={handleRowClick}
              onPay={handlePay}
              onsync={handleFandOFailSO}
              syncLoading={syncLoading}
              syncLoadingId={syncLoadingId}
            />
          )}

          {isV("ordersPagination") && paginatedOrders.length > 0 && (
            <Pagination
              currentPage={page}
              totalPages={String(totalPages)}
              onPageChange={setPage}
            />
          )}
          {loading && (
            <div className="loading-container">
              <LoadingSpinner size="medium" />
            </div>
          )}
          {error && <div className="error">{error}</div>}
          {bulkUploadPopUp && (
            <div>
              <div className="gp-backdrop" onClick={onClose} />
              {
                excelLoading ? <div><LoadingSpinner /></div> : <div className="gp-modal">
                  <div className="gp-header">
                    <span className="gp-title">{t("Upload Orders Data")}</span>
                    <button className="gp-close-btn" onClick={onClose}>
                      {t("Close")}
                    </button>
                  </div>

                  {loading ? (
                    <div style={{ padding: 24 }}><LoadingSpinner /></div>
                  ) : (
                    <div style={{ padding: "0 28px 20px 28px" }}>
                      <div className="customer-branch-names" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                        {isV('customerName') && (
                          <div className="order-details-field">
                            <label htmlFor="customerField">{t('Company Name')}</label>
                            <div className="customer-input-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <input style={{ width: '310px' }}
                                id="customerField"
                                name="selectedCustomer"
                                onClick={() => setShowCustomerPopup(true)}
                                className="customer-input"
                                placeholder={t('Click to select company')}
                                value={selectedCustomer
                                  ? (isArabic ? selectedCustomer.companyNameAr : selectedCustomer.companyNameEn)
                                  : ''
                                }
                                disabled={!isE('customerName')}
                                autoComplete="off"
                              />
                            </div>
                          </div>
                        )}
                        {isV('branchName') && (
                          <div className="order-details-field">
                            <label>{t('Branch')}</label>
                            <div className="customer-input-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <input style={{ width: '310px' }}
                                id="branchField"
                                name="selectedBranchName"
                                onClick={() => {
                                  if (!selectedCustomer) {
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
                                value={selectedBranch
                                  ? (isArabic ? selectedBranch.branchNameAr : selectedBranch.branchNameEn)
                                  : ''
                                }
                                readOnly
                                disabled={!isE('branchName')}
                                autoComplete="off"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <p style={{ marginTop: 20, marginBottom: 20 }}>
                        {t("To upload multiple orders at once, please download the Excel template below, fill in all required branch information correctly, and upload the completed file.")}
                      </p>

                      <div className="popup-buttons-row">
                        <button className="download-btn"
                          onClick={() => handleTemplateDownload()}
                          disabled={!selectedCustomer || !selectedBranch}
                        >
                          📥 {t("Download Excel Template")}
                        </button>
                        <button className="upload-btn"
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
                        <div style={{
                          marginTop: 16, display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}>
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
                      customerId={selectedCustomer?.id}
                      API_BASE_URL={API_BASE_URL}
                      t={t}
                    />
                  )}
                </div>
              }

            </div>
          )}
        </div>

      )}
    </Sidebar>
  );
}

export default Orders;
