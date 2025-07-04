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
    amountTransferred: "",
    transactionDate: "",
    erpOrderId: "",
    description: "",
    bankDocuments: [],
  });
  const { id } = useParams();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [updateTransaction, setUpdateTransaction] = useState({});
  const [showSalesOrderPopup, setshowSalesOrderPopup] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);
  const [fileData, setFileData] = useState([]);
  const rbacMgr = new RbacManager(
    user?.userType === "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "BankTransactions"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    const formDataUpload = new FormData();

    for (let file of files) {
      formDataUpload.append("files", file);
    }

    formDataUpload.append("containerType", "transactions");

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/upload-multiple-files`,
        formDataUpload,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (data.success) {
        setImageUrls([...imageUrls, ...data.files.flat()]);
      }
    } catch (error) {
      console.error("Upload failed", error);
    }
  };
  const handleSubmit = async () => {
    try {
      if (
        !formData.erpCustId ||
        !formData.entity ||
        !formData.transactionDate ||
        imageUrls?.length == 0 ||
        !formData.amountTransferred
      ) {
        setError(t("Please fill all required fields"));
        return;
      }
      const payload = {
        ...formData,
        bankDocuments: JSON.stringify(imageUrls),
        transactionDate: new Date(formData.transactionDate)
          .toISOString()
          .split("T")[0],
      };
      delete payload.entity;
      const response = await axios.post(
        `${API_BASE_URL}/bank-transactions`,
        payload,
        { withCredentials: true }
      );

      if (response.data.status === "success") {
        navigate("/banktransactions");
      }
    } catch (error) {
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
          },
          withCredentials: true,
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
          withCredentials: true,
        }
      );
      setImageUrls(data.data.bankDocuments ? data.data.bankDocuments : []);
      setUpdateTransaction({
        ...data.data,
        transactionDate: data.data.transactionDate.split("T")[0],
      });
    } catch (error) {
      console.error("Failed to fetch transaction", error);
    }
  }, [id]);
  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  const fetchFiles = useCallback(async () => {
    try {
      console.log("Fetching files for imageUrls:", imageUrls);
      if (imageUrls.length === 0) return;
      const { data } = await axios.post(
        `${API_BASE_URL}/bank-transactions/getFiles`,
        { fileNames: imageUrls },

        { withCredentials: true }
      );
      console.log("Fetched files:", data.files);
      setFileData(data.files);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  }, [imageUrls]);
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);
  const handleRemoveImage = (fileName) => {
    setFileData((prev) => prev.filter((file) => file.fileName !== fileName));
    setImageUrls((prev) => prev.filter((img) => img !== fileName));
  };
  console.log("Disabled?", !Boolean(updateTransaction?.erpOrderId));

  const dir = i18n.dir();
  const isRTL = dir === "rtl";
  return (
    <Sidebar title={t("Bank Transactions")}>
      {isV("BankContent") && (
        <div className="bank-add-container">
          <div className="bank-add-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="erpCustId">{t("ERP Customer ID *")}</label>
                <input
                  id="erpCustId"
                  name="erpCustId"
                  placeholder={t("ERP Customer ID")}
                  value={
                    formData?.erpCustId || updateTransaction?.erpCustId || ""
                  }
                  onClick={() => setShowCustomerPopup(true)}
                  disabled={!!updateTransaction?.erpCustId}
                />
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
                      formData?.companyNameEn ||
                      updateTransaction?.companyNameEn
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
                      formData?.companyNameAr ||
                      updateTransaction?.companyNameAr
                    )
                  }
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="amountTransferred">
                  {t("Amount Transferred *")}
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
                  disabled={!!updateTransaction?.amountTransferred}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="transactionDate">
                  {t("Transaction Date *")}
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
              </div>

              {Object.keys(updateTransaction).length === 0 && (
                <div className="form-group">
                  <label htmlFor="entity">{t("Entity *")}</label>
                  <select
                    id="entity"
                    name="entity"
                    value={formData.entity}
                    onChange={handleChange}
                  >
                    <option value="">{t("Select Entity")}</option>
                    <option value="VMCO">VMCO</option>
                    <option value="NAQI">NAQI</option>
                  </select>
                </div>
              )}

              {(formData.entity && formData.erpCustId) ||
              Object.keys(updateTransaction).length > 0 ? (
                <>
                  <div className="form-group">
                    <label htmlFor="erpOrderId">{t("ERP Order ID ")}</label>
                    <input
                      id="erpOrderId"
                      name="erpOrderId"
                      placeholder={t("ERP Order ID")}
                      value={
                        formData?.erpOrderId || updateTransaction?.erpOrderId
                      }
                      disabled={!!updateTransaction?.erpOrderId}
                      onClick={() => setshowSalesOrderPopup(true)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="orderId">{t("Order ID")}</label>
                    <input
                      id="orderId"
                      name="orderId"
                      type="number"
                      placeholder={t("Order Id")}
                      min={0}
                      value={
                        formData?.orderId || updateTransaction?.orderId || ""
                      }
                      disabled={!!updateTransaction?.orderId}
                      onChange={handleChange}
                    />
                  </div>
                </>
              ) : null}

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
              </div>
              <div className="form-group">
                <div className="image-grid">
                  {fileData?.map((file, index) => {
                    const fileUrl = `${API_BASE_URL}/${file.fileName}`;
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
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">{t("Description")}</label>
                <textarea
                  id="description"
                  name="description"
                  placeholder={t("Description")}
                  rows={3}
                  value={
                    formData?.description ||
                    updateTransaction?.description ||
                    ""
                  }
                  disabled={!!updateTransaction?.description}
                  onChange={handleChange}
                />
              </div>

              {error && (
                <div
                  className="error-message full-width"
                  style={{ color: "red" }}
                >
                  {error}
                </div>
              )}
            </div>

            <GetCustomers
              open={showCustomerPopup}
              onClose={() => setShowCustomerPopup(false)}
              onSelectCustomer={handleSelectCustomer}
              API_BASE_URL={API_BASE_URL}
              t={t}
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
                {Object.keys(updateTransaction).length === 0 ? (
                  <>
                    <button className="submit-btn" onClick={handleSubmit}>
                      {t("Submit")}
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={() => navigate("/banktransactions")}
                    >
                      {t("Cancel")}
                    </button>
                  </>
                ) : (
                  <>
                    {updateTransaction &&
                      updateTransaction.status === "pending" && (
                        <>
                          <button
                            className="submit-btn"
                            onClick={() => handleUpdate("verified", id)}
                          >
                            {t("Verify")}
                          </button>
                          <button
                            className="cancel-btn"
                            onClick={() => handleUpdate("rejected", id)}
                          >
                            {t("Reject")}
                          </button>
                        </>
                      )}
                  </>
                )}
              </div>
            </div>
          </>
      
        </div>
      )}
    </Sidebar>
  );
};

export default AddBankTransaction;
