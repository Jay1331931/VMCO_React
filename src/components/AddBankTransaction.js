import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Sidebar from "./Sidebar";
import RbacManager from "../utilities/rbac";
import { useAuth } from "../context/AuthContext";
import i18n from "../i18n";
import GetCustomers from "./GetCustomers";
import axios from "axios";
import GetSalesOrder from "./GetSalesOrder";
import formatDate from "../utilities/dateFormatter";
import Swal from "sweetalert2";
import "../styles/addBankTransaction.css";
import "../styles/components.css"
import { convertToTimezone, TIMEZONES } from "../utilities/convertToTimezone";
import api from "../utilities/api";
import Constants from "../constants";
import LoadingSpinner from "./LoadingSpinner";
import SearchableDropdown from "./SearchableDropdown";
import usePlatform from "../utilities/platform";
const getCookie = (name) => {
  // const cookies = document.cookie
  //   .split(";")
  //   .map((cookie) => cookie.trim())
  //   .reduce((acc, cookie) => {
  //     const [key, ...rest] = cookie.split("=");
  //     acc[key] = decodeURIComponent(rest.join("="));
  //     return acc;
  //   }, {});
  // return cookies[name] || null;
  return localStorage.getItem(name);
};
const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "status-approved";
    case "open":
      return "status-open";
    case "rejected":
      return "status-rejected";
    case "cancelled":
      return "status-cancelled";
    default:
      return "status-pending";
  }
};
const AddBankTransaction = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user, logout, loading } = useAuth();
  const currentLanguage = i18n.language;
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    erpCustId: user?.userType === 'customer' ? user?.erpCustomerId: "",
    companyNameEn:user?.userType === 'customer' ? user?.companyNameEn: "",
    companyNameAr: user?.userType === 'customer' ? user?.companyNameAr: "",
    amountTransferred: 0,
    transactionDate: "",
    erpOrderId: [],
    description: "",
    bankDocuments: [],
    orderId: [],
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const { id, orderId, amount } = useParams();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [updateTransaction, setUpdateTransaction] = useState({});
  const [showSalesOrderPopup, setshowSalesOrderPopup] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);
  const [fileData, setFileData] = useState([]);
  const [popupImage, setPopupImage] = useState(null);
  const [orderIds, setOrderIds] = useState();
  const [TemporderIds, setTempOrderIds] = useState();
  const [totalamount, setAmount] = useState(0);
  const [isSubmitting, setisSubmitting] = useState(null);
  const [isUploading,setIsUploading]=useState(null)
   const [maxDate, setMaxDate] = useState('');
  const isMobile=usePlatform()
  const rbacMgr = new RbacManager(
    user?.userType === "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "BankTransactions"
  );
  console.log("user",user)
  const cookieToken = getCookie("token");
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);
  // const generateToken = async () => {
  //   try {
  //     const { data } = await axios.post(
  //       `/auth/temporary-token-generation`,
  //       {
  //         role: "Guest",
  //         userId: 0,
  //         userName: "payment",
  //       },
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );
  //     console.log("Temporary Token Response:", data.details);
  //     const newToken = data?.details?.token;
  //   if (newToken) {
  //     localStorage.setItem("token", newToken);

  //     return newToken;
  //   }
  //   } catch (error) {
  //     console.error("Error generating temporary token:", error);
  //   }
  // };
  // useEffect(() => {
  //   if (orderId && !cookieToken) {
  //     generateToken();
  //   }
  // }, [orderId]);
  const handleChange = (e) => {
   
    const { name, value } = e.target;
     if(name==="entity"){
        setFormData((prev) => ({ ...prev, orderId:[],erpOrderId:[],amountTransferred:0}));
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    
setIsUploading(true)
    for (let file of files) {
      //file Size less than 30MB
      if (file.size > 10 * 1024 * 1024) {
        setError(t("File size exceeds 10MB limit"));
        continue;
      }
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("containerType", "transactions");

      try {
        const { data } = await api.post(`/upload-files`, formDataUpload, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${cookieToken}`,
          },
        });

        if (data.success) {
          setImageUrls((prev) => [...prev, data.files]);
        }
      } catch (error) {
        console.error("Upload failed", error);
      }
    }
    setIsUploading(false)
  };

  useEffect(() => {
    const fetchCurrentDate = async () => {
      try {
        const response = await api.get(`/get-current-date`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const parts = response.data.date.split("/");
        const formattedDate = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`; // YYYY-MM-DD
        setFormData((prev) => ({
          ...prev,
          transactionDate: prev.transactionDate || formattedDate,
        }));
      } catch (error) {
        console.error("Failed to fetch date from API", error);
      }
    };

    fetchCurrentDate();
  }, []);

  const handleSubmit = async () => {
    setisSubmitting(true);
    try {
      const errors = {};
      if (!formData.erpCustId) errors.erpCustId = "ERP Customer ID is required";
      if (!formData.entity) errors.entity = "Entity is required";
      if (!formData.transactionDate)
        errors.transactionDate = "Transaction Date is required";
      if (imageUrls?.length === 0)
        errors.bankDocuments = "Bank Documents are required";
      if (!formData.amountTransferred)
        errors.amountTransferred = "Amount Transferred is required";

      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        if(isMobile){
            Swal.fire({
              title: t("Validation Error"),
              text: t("Please fill all required fields"),
              icon: "error",
              confirmButtonText: t("OK"),
            });
        }
       
        setError(t("Please fill all required fields"));
        return;
      }

      const payload = {
        ...formData,
        erpOrderId: formData.erpOrderId ? JSON.stringify(formData.erpOrderId) : [],
        orderId: formData.orderId ? JSON.stringify(formData.orderId) : [],
        bankDocuments: JSON.stringify(imageUrls),
        transactionDate: new Date(formData.transactionDate).toISOString().split("T")[0],
        entity: formData.entity,
      };

      const response = await api.post(`/bank-transactions`, payload, {
        headers: { Authorization: `Bearer ${cookieToken}` },
      });

      if (response.data.status === "success") {
        Swal.fire({
          title: t("Success"),
          text: t("Transaction created successfully"),
          icon: "success",
          confirmButtonText: t("OK"),
        });
        const URL = `${window.location.protocol}//${window.location.host}/bankTransactions`;
        window.location.replace(URL);
      }
    } catch (error) {
      console.error("Submission error:", error);
      const msg =
        error?.response?.data?.message ||
        error.message ||
        t("Failed to submit");
      setError(msg);
    } finally {
      setisSubmitting(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    setFormData((prev) => ({
      ...prev,
      companyNameEn: customer.company_name_en || customer?.companyNameEn,
      companyNameAr: customer.company_name_ar || customer?.companyNameAr,
      erpCustId: customer.erp_cust_id || customer.erpCustId,
      amountTransferred: 0,
      transactionDate: "",
      erpOrderId: [],
      description: "",
      bankDocuments: [],
      orderId: [],
      customerVmcoRegion: customer?.branch || null
    }));
    setShowCustomerPopup(false);
  };
  const handleUpdate = async (status, id) => {
    setisSubmitting(true)
    try {
      const payload = { status };

      const { data } = await api.patch(`/bank-transactions/id/${id}`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookieToken}`,
        },
      });
      if (data.status === "success") {
        Swal.fire({
          title: t("Success"),
          text: t("Transaction updated successfully"),
          icon: "success",
          confirmButtonText: t("OK"),
        });
        navigate("/banktransactions");
      }
    } catch (error) {
      Swal.fire({
        title: t("Error"),
        text: t("Failed to update transaction"),
        icon: "error",
        confirmButtonText: t("OK"),
      });
      console.error("Update failed:", error);
    } finally {
      setisSubmitting(false)
    }
  };

  const fetchTransaction = useCallback(async () => {
    try {
      if (!id) return;
      const { data } = await api.get(`/bank-transactions/id/${id}`, {
        headers: { Authorization: `Bearer ${cookieToken}` },
      });
      setImageUrls(data.data.bankDocuments ? data.data.bankDocuments : []);
      setUpdateTransaction({
        ...data.data,
        // Convert transaction date to Saudi Arabia timezone and format for input
        transactionDate: convertToTimezone(
          data.data.transactionDate,
          TIMEZONES.SAUDI_ARABIA,
          "YYYY-MM-DD"
        ),
      });
    } catch (error) {
      console.error("Failed to fetch transaction", error);
    }
  }, [id]);
  const fetchDecodeddata = useCallback(async () => {
    try {
      const { data } = await api.get(
        `/decode-ids?encryptedorderIds=${orderId}&amount=${amount}`,
        {
          headers: { Authorization: `Bearer ${cookieToken}` },
        }
      );
      data?.details?.orderIds?.split(",")?.forEach((id) => {
        const trimmed = id.trim();
        if (trimmed.startsWith("TEMP")) {
          setTempOrderIds(trimmed);
        } else if (trimmed) {
          const parsed = parseInt(trimmed);

          if (!isNaN(parsed)) setOrderIds(parsed);
        }
      });
      // setOrderIds(parseInt(data?.details?.orderIds));
      setAmount(parseFloat(data?.details?.amount));
    } catch (error) {
      console.error("Failed to fetch decoded data", error);
    }
  }, [orderId]);
  useEffect(() => {
    setAmount(null);
    if (!orderId) return;
    fetchDecodeddata();
  }, [fetchDecodeddata]);
  const fetchSaleOrder = useCallback(async () => {
    try {
      if (!orderIds) return;
      const { data } = await api.get(`/sales-order/id/${orderIds}`, {
        headers: { Authorization: `Bearer ${cookieToken}` },
      });
      console.log("Sale Order Data:", amount);
      setFormData((prev) => ({
        ...prev,
        entity: data.data.entity,
        erpCustId: data.data.erpCustId,
        companyNameEn: data.data.companyNameEn,
        companyNameAr: data.data.companyNameAr,
        amountTransferred: parseFloat(totalamount),
        branchVmcoRegion: data?.data?.branchRegion || null,
        erpOrderId: data.data.erpOrderId ? [data.data.erpOrderId] : [],
        orderId: [data.data.id] || [],
      }));
      console.log("Sale Order Data:", data.data);
    } catch (error) {
      console.error("Failed to fetch sales order", error);
    }
  }, [orderIds]);

  const fetchtempSaleOrder = useCallback(async () => {
    try {
      if (!TemporderIds) return;

      const token = localStorage.getItem("token"); // always use latest
      const ids = TemporderIds.toString().split(",");
      console.log("Decoded Order ID(s):", ids);

      const results = await Promise.all(
        ids.map((id) =>
          api.get(`/temp-sales-order/id/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );

      const allOrders = results.map((res) => res.data.data);
      console.log("allOrders", allOrders);
      setFormData((prev) => ({
        ...prev,
        entity: allOrders[0].entity,
        erpCustId: allOrders[0]?.orderDetails?.erpCustId,
        companyNameEn: allOrders[0]?.orderDetails?.companyNameEn,
        companyNameAr: allOrders[0]?.orderDetails?.companyNameAr,
        amountTransferred: parseFloat(totalamount),
        branchVmcoRegion: allOrders[0]?.orderDetails?.branchRegion || null,
        erpOrderId: [],
        orderId: [allOrders[0]?.id] || [],
      }));
      console.log("Sale Order Data:", allOrders);
    } catch (error) {
      console.error("Failed to fetch sale order", error);
    }
  }, [TemporderIds]);
  useEffect(() => {
    if (TemporderIds) {
      fetchtempSaleOrder();
    }
  }, [fetchtempSaleOrder]);
  useEffect(() => {
    if (orderIds) {
      fetchSaleOrder();
    }
  }, [fetchSaleOrder]);
  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  const fetchFiles = useCallback(async () => {
    try {
      console.log("Fetching files for imageUrls:", imageUrls);
      if (imageUrls.length === 0) return;

      const fetched = [];

      for (let fileName of imageUrls) {
        const { data } = await api.post(
          `/get-files`,
          { fileName, containerType: "transactions" },
          {
            headers: { Authorization: `Bearer ${cookieToken}` },
          }
        );

        if (data?.status === "Ok" && data.data) {
          fetched.push(data.data);
        }
      }

      setFileData(fetched);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  }, [imageUrls]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);
  const handleRemoveImage = async (fileName) => {
    try {
      const { data } = await api.post(
        `/delete-files`,
        {
          fileName: fileName,
          containerType: "transactions",
        },
        {
          headers: { Authorization: `Bearer ${cookieToken}` },
        }
      );

      if (data.success) {
        // Update local state only after successful delete
        setFileData((prev) =>
          prev.filter((file) => file.fileName !== fileName)
        );
        setImageUrls((prev) => prev.filter((img) => img !== fileName));
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const handleCancel = () => {
    for (let fileName of imageUrls) {
      handleRemoveImage(fileName);
    }
    if (orderIds) {
      Swal.fire({
        title: t("Cancelled"),
        text: t("Transaction cancelled successfully"),
        icon: "info",
        confirmButtonText: t("OK"),
      }).then(() => {
        window.close();
      });
    }
    if (TemporderIds?.length > 0) {
      navigate("/orders");
    } else {
      navigate("/banktransactions");
    }
  };
  const fileInputRef = useRef(null);

  // const handleFileChange = (e) => {
  //   const files = Array.from(e.target.files);
  //   // Add logic to set fileData or preview as needed
  // };
  const dir = i18n.dir();
  const isRTL = dir === "rtl";
 const fetchSystemDate = useCallback(
    async () => {
     
      try {

        const { data } = await api.get(
          `${API_BASE_URL}/server-date`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if(data?.status?.toLowerCase()==="success"){
          console.log("data?.data",data?.data)
 setMaxDate(data?.data);
        }
       
      } catch (err) {
        console.error("Error fetching date:", err);
       
      } 
    },
    []
  );
  useEffect(()=>{
fetchSystemDate()
  },[])
  const renderTemplate = () => {
    return (
      <div className="bank-add-container">
        <div className="bank-add-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="erpCustId">
                {t("ERP Customer ID")}
                <span style={{ color: "red" }}> *</span>
              </label>
              <input
                id="erpCustId"
                name="erpCustId"
                placeholder={t("ERP Customer ID")}
                value={
                  formData?.erpCustId || updateTransaction?.erpCustId || ""
                }
                onClick={() => setShowCustomerPopup(true)}
                disabled={!!updateTransaction?.erpCustId || orderId}
              />
              {fieldErrors.erpCustId && (
                <div className="error-message" style={{ color: "red" }}>
                  {t(fieldErrors.erpCustId)}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="companyNameEn">{t("Company Name (EN)")}</label>
              <input
                id="companyNameEn"
                name="companyNameEn"
                placeholder={t("Company Name (EN)")}
                value={
                  formData?.companyNameEn ||
                  updateTransaction?.companyNameEn ||
                  ""
                }
                disabled={
                  !!(
                    formData?.companyNameEn || updateTransaction?.companyNameEn
                  )
                }
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="companyNameAr">{t("Company Name (AR)")}</label>
              <input
                id="companyNameAr"
                name="companyNameAr"
                placeholder={t("Company Name (AR)")}
                value={
                  formData?.companyNameAr ||
                  updateTransaction?.companyNameAr ||
                  ""
                }
                disabled={
                  !!(
                    formData?.companyNameAr || updateTransaction?.companyNameAr
                  )
                }
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="amountTransferred">
                {t("Amount Transferred")}
                <span style={{ color: "red" }}> *</span>
              </label>
              <input
                id="amountTransferred"
                name="amountTransferred"
                type="number"
                placeholder={t("Amount")}
                min={0}
                value={
                  formData?.amountTransferred ??
                  updateTransaction?.amountTransferred ??
                  ""
                }
                disabled={
                  !!(
                    formData?.orderId?.length ||
                    updateTransaction?.orderId?.length
                  )
                }
                onChange={handleChange}
              />

              {fieldErrors.amountTransferred && (
                <div className="error-message" style={{ color: "red" }}>
                  {t(fieldErrors.amountTransferred)}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="transactionDate">
                {t("Transaction Date")}
                <span style={{ color: "red" }}> *</span>
              </label>
              <input
                id="transactionDate"
                name="transactionDate"
                type="date"
                value={
                  formData?.transactionDate ||
                  updateTransaction?.transactionDate ||
                  ""
                }
                onChange={handleChange}
                disabled={!!updateTransaction?.transactionDate}
                max={maxDate}
              />
              {fieldErrors.transactionDate && (
                <div className="error-message" style={{ color: "red" }}>
                  {t(fieldErrors.transactionDate)}
                </div>
              )}
            </div>

            { !isMobile ? 
            Object.keys(updateTransaction)?.length === 0 && (
              <div className="form-group">
                <label htmlFor="entity">
                  {t("Entity")} <span style={{ color: "red" }}> *</span>
                </label>
                <select
                  id="entity"
                  name="entity"
                  value={formData.entity || updateTransaction?.entity || ""}
                  onChange={handleChange}
                  disabled={orderId}
                >
                  <option value="">{t("Select Entity")}</option>
                  <option value="VMCO">VMCO</option>
                  <option value="NAQI">NAQI</option>
                  <option value="SHC">SHC</option>
                  <option value="DAR">DAR</option>
                  <option value="GMTC">GMTC</option>
                </select>
                {fieldErrors.entity && (
                  <div className="error-message" style={{ color: "red" }}>
                    {t(fieldErrors.entity)}
                  </div>
                )}
              </div>
             ) :      Object.keys(updateTransaction)?.length === 0 && (
  <div className="form-group">
    <label htmlFor="entity">
      {t("Entity")} <span style={{ color: "red" }}> *</span>
    </label>
    <SearchableDropdown
      id="entity"
      name="entity"
      className="dropdown-mobile-bank "
      value={formData.entity || updateTransaction?.entity || ""}
      onChange={(e) => {
        handleChange({
          target: { 
            name: "entity", 
            value: e.target.value 
          }
        });
      }}
      disabled={orderId}
      options={[
        { value: "", name: t("Select Entity") },
        { value: "VMCO", name: "VMCO" },
        { value: "NAQI", name: "NAQI" },
        { value: "SHC", name: "SHC" },
        { value: "DAR", name: "DAR" },
        { value: "GMTC", name: "GMTC" }
      ]}
    />
    {fieldErrors.entity && (
      <div className="error-message" style={{ color: "red" }}>
        {t(fieldErrors.entity)}
      </div>
    )}
  </div>
)}

            {([Constants.ENTITY.NAQI?.toLowerCase(),Constants.ENTITY.VMCO.toLowerCase()].includes(formData.entity?.toLowerCase()) && formData.erpCustId) ||
              Object.keys(updateTransaction).length > 0 ? (
              <>
                <div className="form-group">
                  <label htmlFor="erpOrderId">{t("ERP Order ID")} </label>
                  <input
                    id="erpOrderId"
                    name="erpOrderId"
                    placeholder={t("ERP Order ID")}
                    value={
                      formData?.erpOrderId?.join(", ") ||
                      updateTransaction?.erpOrderId?.join(", ") ||
                      ""
                    }
                    style={{ cursor: "pointer" }}
                    disabled={!!updateTransaction?.erpOrderId || orderId}
                    onClick={() => setshowSalesOrderPopup(true)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="orderId">{t("Order ID")}</label>
                  <input
                    id="orderId"
                    name="orderId"
                    type="text"
                    style={{ cursor: "pointer" }}
                    placeholder={t("Order Id")}
                    min={0}
                    // value={
                    //   formData?.orderId || updateTransaction?.orderId || ""
                    // }
                    value={
                      formData?.orderId?.join(", ") ||
                      updateTransaction?.orderId?.join(", ") ||
                      ""
                    }
                    disabled={!!updateTransaction?.orderId || orderId}
                    onClick={() => setshowSalesOrderPopup(true)}
                    onChange={handleChange}
                  />
                </div>
              </>
            ) : null}
            {/* {Object.keys(updateTransaction).length === 0  &&
              <div className="form-group">
                <label htmlFor="bankDocuments">
                  {t("Upload Bank Documents *")}
                </label>
                <input
                  id="bankDocuments"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  disabled={!!updateTransaction?.bankDocuments}
                />
              </div>}
              <div className="form-group">
                <div className="image-grid">
                  {fileData?.map((file, index) => {
                    const fileUrl = file.url;
                    const extension = file.fileName
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
                    const isExcel = ["xls", "xlsx", "csv"].includes(extension);

                    return (
                      <div key={index} className="image-item">
                        {isImage ? (
                          <img
                            src={fileUrl}
                            alt={file.fileName}
                            className="preview-image"
                          />
                        ) : isPdf ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="file-link-button"
                          >
                            📄 View PDF
                          </a>
                        ) : isExcel ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="file-link-button"
                          >
                            📊 Open Excel File
                          </a>
                        ) : (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="file-link-button"
                          >
                            📁 Download File
                          </a>
                        )}

                        {Object.keys(updateTransaction).length === 0 && (
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => handleRemoveImage(file.fileName)}
                          >
                            ✖
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div> */}
            <div className="form-group full-width">
              <label htmlFor="bankDocuments">
                {t("Upload Bank Documents")}
                <span style={{ color: "red" }}> *</span>
              </label>
              <div
                // className="form-group  full-width"
                style={{
                  border: "1px solid #ccc",
                  padding: "10px",
                  borderRadius: "6px",
                  backgroundColor: "#f7f8fa",
                }}
              >
                <div className="bank-doc-upload-wrapper">
                  {Object.keys(updateTransaction).length === 0 && (
                    <>
                      <button
                        type="button"
                        className="maintenance-add-image-btn"
                        onClick={() => fileInputRef.current.click()}
                        title="Upload Documents"
                      >
                        +
                      </button>
                      <input
                        id="bankDocuments"
                        type="file"
                        multiple
                        accept="image/*,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                        disabled={!!updateTransaction?.bankDocuments}
                      />
                    </>
                  )}
                  <div className="scrollable-preview-container">
                    {isUploading ? <LoadingSpinner/>:<>{fileData?.map((file, index) => {
                      const fileUrl = file.url;
                      const extension = file.fileName
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
                          key={index}
                          className="image-item"
                          onClick={() => isImage && setPopupImage(fileUrl)}
                          title={isImage ? "Click to view" : ""}
                        >
                          {isImage ? (
                            <img
                              src={fileUrl}
                              alt={file.fileName}
                              className="preview-image"
                            />
                          ) : isPdf ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="file-link-button"
                            >
                              📄 {t("View PDF")}
                            </a>
                          ) : isExcel ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="file-link-button"
                            >
                              📊 {t("Open Excel File")}
                            </a>
                          ) : (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="file-link-button"
                            >
                              📁 {t("Download File")}
                            </a>
                          )}

                          {Object.keys(updateTransaction).length === 0 && (
                            <button
                              type="button"
                              className="remove-image-btn"
                              onClick={(e) => {
                                e.stopPropagation(); // prevent image popup
                                handleRemoveImage(file.fileName);
                              }}
                              title="Remove File"
                            >
                              ✖
                            </button>
                          )}
                        </div>
                      );
                    })}</>}
                  </div>
                </div>
              </div>
              {fieldErrors.bankDocuments && (
                <div className="error-message" style={{ color: "red" }}>
                  {t(fieldErrors.bankDocuments)}
                </div>
              )}
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">{t("Description")}</label>
              <textarea
                id="description"
                name="description"
                className="description"
                placeholder={t("Description")}
                rows={3}
                value={
                  formData?.description || updateTransaction?.description || ""
                }
                disabled={!!updateTransaction?.description}
                onChange={handleChange}
              />
            </div>

            {/* {error && (
              <div
                className="error-message full-width"
                style={{ color: "red" }}
              >
                {error}
              </div>
            )} */}
          </div>
          {popupImage && (
            <div
              className="image-popup-overlay"
              onClick={() => setPopupImage(null)}
            >
              <div
                className="image-popup-content"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={popupImage}
                  style={{ maxWidth: "100%", maxHeight: "100%" }}
                />
                <button
                  className="image-popup-close"
                  onClick={() => setPopupImage(null)}
                >
                  ×
                </button>
              </div>
            </div>
          )}
          {user?.userType !== 'customer' && (<GetCustomers
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
            }}
          />)}
          <GetSalesOrder
            open={showSalesOrderPopup}
            onClose={() => setshowSalesOrderPopup(false)}
            formData={formData}
            API_BASE_URL={API_BASE_URL}
            setFormData={setFormData}
            t={t}
            token={cookieToken}
          />
        </div>
        <>
          <div className="form-footer">
            {Object.keys(updateTransaction).length !== 0 ? (
              <p disabled>
                {t("Status")}: <span className={`${getStatusClass(updateTransaction?.status)}`} >{t(updateTransaction?.status)}</span>
              </p>
            ) : (
              <div></div>
            )}

            <div className="form-actions">
              {!id && (
                <>
                  <button className="submit-btn" onClick={handleSubmit} disabled={isSubmitting || isUploading}
                  >
                    {isSubmitting ? t("Submitting...") : t("Submit")}
                  </button>
                  <button className="cancel-btn" onClick={() => handleCancel()}>
                    {t("Cancel")}
                  </button>{" "}
                </>
              )}

              {isE("btnVerify") &&
                updateTransaction?.status?.toLowerCase() === "pending" && (
                  <button
                    className="submit-btn"
                    onClick={() => handleUpdate("verified", id)}
                    disabled={isSubmitting}
                  >

                    {isSubmitting ? t("Verifing...") : t("Verify")}

                    { }
                  </button>
                )}
              {isE("btnReject") &&
                updateTransaction?.status?.toLowerCase() === "pending" && (
                  <button
                    className="cancel-btn"
                    onClick={() => handleUpdate("rejected", id)}
                    disabled={isSubmitting}
                  >
                    {t("Reject")}
                  </button>
                )}
            </div>
          </div>
        </>
        <style>
          {`.full-width {
  width: 100%;
}
.description{
  border: 1px solid #ccc;
}
.bank-doc-upload-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.scrollable-preview-container {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 0;
 scrollbar-width: none; 
  -ms-overflow-style: none;
}

.scrollable-preview-container::-webkit-scrollbar {
  display: none;
}
.image-item {
  position: relative;
  flex: 0 0 auto;
  width: 100px;
  height: 100px;
  border: 1px solid #ccc;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.remove-image-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(255, 0, 0, 0.7);
  color: #fff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  padding: 2px 6px;
}

.file-link-button {
  display: inline-block;
  text-align: center;
  padding: 6px 10px;
  background: #e8e8e8;
  border-radius: 4px;
  font-size: 12px;
  text-decoration: none;
  white-space: nowrap;
}
.image-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease-in-out;
}

.image-popup-content {
  position: relative;
  max-width: 50%;
  
  background: #fff;
  padding: 10px;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  animation: scaleIn 0.25s ease;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-popup-content img {
  width: 100%;
  max-width: 400px;
  max-height: 400px;
  height: auto;
  border-radius: 8px;
  object-fit: contain;
}

.image-popup-close {
  position: absolute;
  top: -10px;
  right: -10px;
  background: red;
  color: white;
  border: none;
  font-size: 20px;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  transition: background 0.2s;
}

.image-popup-close:hover {
  background: #c00;
},
.submit-btn:hover{
  background: #004d43;
  color: #fff;
}

// .dropdown-mobile-bank{
// width:100% !important;
// }


`}
        </style>
      </div>
    );
  };
  // return orderId ? (
  //   <div>
  //     <h1 style={{ textAlign: "center", padding: "10px" }}>Bank Transaction</h1>
  //     {renderTemplate()}
  //   </div>
  // ) : (
    return(<Sidebar title={t("Bank Transactions")}>
      {/* <div className="bank-transaction-form"> */}
      {renderTemplate()}
      {/* </div> */}
    </Sidebar>
  );
};

export default AddBankTransaction;
