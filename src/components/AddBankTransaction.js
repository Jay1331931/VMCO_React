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
import { convertToTimezone, TIMEZONES } from "../utilities/convertToTimezone";

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
const AddBankTransaction = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user, logout, loading } = useAuth();
  const currentLanguage = i18n.language;
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    erpCustId: "",
    companyNameEn: "",
    companyNameAr: "",
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
  const [totalamount, setAmount] = useState(0);
  const rbacMgr = new RbacManager(
    user?.userType === "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "BankTransactions"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);
  const generateToken = async () => {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/temporary-token-generation`,
        {
          role: "Guest",
          userId: 0,
          userName: "payment",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Temporary Token Response:", data.details);
    } catch (error) {
      console.error("Error generating temporary token:", error);
    }
  };
  useEffect(() => {
    const cookieToken = getCookie("token");

    if (orderId && !cookieToken) {
      generateToken();
    }
  }, [orderId]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;

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
        const { data } = await axios.post(
          `${API_BASE_URL}/upload-files`,
          formDataUpload,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (data.success) {
          setImageUrls((prev) => [...prev, data.files]);
        }
      } catch (error) {
        console.error("Upload failed", error);
      }
    }
  };

  const handleSubmit = async () => {
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
        setError(t("Please fill all required fields"));
        return;
      }

      const payload = {
        ...formData,
        erpOrderId: formData.erpOrderId
          ? JSON.stringify(formData.erpOrderId)
          : [],
        orderId: formData.orderId ? JSON.stringify(formData.orderId) : [],
        bankDocuments: JSON.stringify(imageUrls),
        // Convert the transaction date to ISO format for storage
        transactionDate: new Date(formData.transactionDate)
          .toISOString()
          .split("T")[0],
      };
      delete payload.entity;

      const response = await axios.post(
        `${API_BASE_URL}/bank-transactions`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (orderIds && response.data.status === "success") {
        Swal.fire({
          title: t("Success"),
          text: t("Transaction created successfully"),
          icon: "success",
          confirmButtonText: t("OK"),
        }).then(() => {
          window.close();
        });
      }

      if (response.data.status === "success" && !orderIds) {
        navigate("/banktransactions");
      }
    } catch (error) {
      if (error?.response?.status === 401 && orderIds) {
        Swal.fire({
          title: t("Session Expired"),
          text: t("Please click Ok Session will be restarted"),
          icon: "warning",
          confirmButtonText: "OK",
          cancelButtonText: "Close",
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              await generateToken();
            } catch (err) {
              console.error("Token regeneration failed:", err);
              window.close();
            }
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            window.close();
          }
        });
      }
      console.error("Submission error:", error);
      const msg =
        error?.response?.data?.message ||
        error.message ||
        t("Failed to submit");
      setError(msg);
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
      customerVmcoRegion: customer?.region || null,
    }));
    setShowCustomerPopup(false);
  };
  const handleUpdate = async (status, id) => {
    try {
      const payload = { status };

      const { data } = await axios.patch(
        `${API_BASE_URL}/bank-transactions/id/${id}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
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
    }
  };

  const fetchTransaction = useCallback(async () => {
    try {
      if (!id) return;
      const { data } = await axios.get(
        `${API_BASE_URL}/bank-transactions/id/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
      const { data } = await axios.get(
        `${API_BASE_URL}/decode-ids?encryptedorderIds=${orderId}&amount=${amount}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrderIds(parseInt(data?.details?.orderIds));
      setAmount(parseFloat(data?.details?.amount));
    } catch (error) {
      console.error("Failed to fetch decoded data", error);
    }
  }, [orderId]);
  useEffect(() => {
    if (!orderId) return;
    fetchDecodeddata();
  }, [fetchDecodeddata]);
  const fetchSaleOrder = useCallback(async () => {
    try {
      if (!orderIds) return;
      const { data } = await axios.get(
        `${API_BASE_URL}/sales-order/id/${orderIds}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Sale Order Data:", amount);
      setFormData((prev) => ({
        ...prev,
        entity: data.data.entity,
        erpCustId: data.data.erpCustId,
        companyNameEn: data.data.companyNameEn,
        companyNameAr: data.data.companyNameAr,
        amountTransferred: totalamount,
        branchVmcoRegion: data?.data?.branchRegion || null,
        erpOrderId: data.data.erpOrderId ? [data.data.erpOrderId] : [],
        orderId: [data.data.id] || [],
      }));
      console.log("Sale Order Data:", data.data);
    } catch (error) {
      console.error("Failed to fetch sales order", error);
    }
  }, [orderIds]);
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
        const { data } = await axios.post(
          `${API_BASE_URL}/get-files`,
          { fileName, containerType: "transactions" },
          {
            headers: { Authorization: `Bearer ${token}` },
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
      const { data } = await axios.post(
        `${API_BASE_URL}/delete-files`,
        {
          fileName: fileName,
          containerType: "transactions",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
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
    navigate("/banktransactions");
  };
  const fileInputRef = useRef(null);

  // const handleFileChange = (e) => {
  //   const files = Array.from(e.target.files);
  //   // Add logic to set fileData or preview as needed
  // };
  const dir = i18n.dir();
  const isRTL = dir === "rtl";
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
                  formData?.amountTransferred ||
                  updateTransaction?.amountTransferred ||
                  ""
                }
                disabled={true}
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
                max={new Date().toISOString().split("T")[0]}
              />
              {fieldErrors.transactionDate && (
                <div className="error-message" style={{ color: "red" }}>
                  {t(fieldErrors.transactionDate)}
                </div>
              )}
            </div>

            {Object.keys(updateTransaction).length === 0 && (
              <div className="form-group">
                <label htmlFor="entity">
                  {t("Entity")} <span style={{ color: "red" }}> *</span>
                </label>
                <select
                  id="entity"
                  name="entity"
                  value={formData.entity}
                  onChange={handleChange}
                  disabled={orderId}
                >
                  <option value="">{t("Select Entity")}</option>
                  <option value="VMCO">VMCO</option>
                  <option value="NAQI">NAQI</option>
                </select>
                {fieldErrors.entity && (
                  <div className="error-message" style={{ color: "red" }}>
                    {t(fieldErrors.entity)}
                  </div>
                )}
              </div>
            )}

            {(formData.entity && formData.erpCustId) ||
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
                    })}
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
            }}
          />
          <GetSalesOrder
            open={showSalesOrderPopup}
            onClose={() => setshowSalesOrderPopup(false)}
            formData={formData}
            API_BASE_URL={API_BASE_URL}
            setFormData={setFormData}
            t={t}
          />
        </div>
        <>
          <div className="form-footer">
            {Object.keys(updateTransaction).length !== 0 ? (
              <button className="status-btn" disabled>
                {t("Status")}: {t(updateTransaction?.status)}
              </button>
            ) : (
              <div></div>
            )}

            <div className="form-actions">
              {!id && (
                <>
                  <button className="submit-btn" onClick={handleSubmit}>
                    {t("Submit")}
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
                  >
                    {t("Verify")}
                  </button>
                )}
              {isE("btnReject") &&
                updateTransaction?.status?.toLowerCase() === "pending" && (
                  <button
                    className="cancel-btn"
                    onClick={() => handleUpdate("rejected", id)}
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
}




`}
        </style>
      </div>
    );
  };
  return orderId ? (
    <div>
      <h1 style={{ textAlign: "center", padding: "10px" }}>Bank Transaction</h1>
      {renderTemplate()}
    </div>
  ) : (
    <Sidebar title={t("Bank Transactions")}>
      {/* <div className="bank-transaction-form"> */}
      {renderTemplate()}
      {/* </div> */}
    </Sidebar>
  );
};

export default AddBankTransaction;
