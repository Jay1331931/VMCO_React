import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/forms.css";
import { not } from "ajv/dist/compile/codegen";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import RbacManager from "../../utilities/rbac";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
function Documents({
  isTrading = true,
  tradingFilesToUpload = {},
  nonTradingFilesToUpload = {},
  customerData = {},
  originalCustomerData = {},
  setTabsHeight,
  mode,
  formErrors = {},
}) {
  const { t } = useTranslation();
  const { token, user, isAuthenticated, logout, loading } = useAuth();
      
    const rbacMgr = new RbacManager(
        user?.userType == "employee" && user?.roles[0] !== "admin"
          ? user?.designation
          : user?.roles[0],
        mode === "add" || customerData?.customerStatus === "new"
          ? "custDetailsAdd"
          : "custDetailsEdit"
      );
      console.log("RBAC Manager:", rbacMgr);
    
      const isV = rbacMgr.isV.bind(rbacMgr);
      const isE = rbacMgr.isE.bind(rbacMgr);
  const [nonTradingFiles, setNonTradingFiles] = useState([]);
  const [tradingDocuments, setTradingDocuments] = useState({
    acknowledgementSignature: null,
    crCertificate: null,
    vatCertificate: null,
    nationalId: null,
    bankLetter: null,
    nationalAddress: null,
    contractAgreement: null,
    creditApplication: null,
  });
  useEffect(() => {
    setTabsHeight("auto");
  }, []);
  // Handle file upload for specific document types
  const handleTradingDocumentChange = (e, documentType) => {
    const docListToUpload = isTrading
      ? tradingFilesToUpload
      : nonTradingFilesToUpload;
    // Check if the file input has files
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Update the specific document in state
      setTradingDocuments((prevDocs) => ({
        ...prevDocs,
        [documentType]: file,
      }));
      docListToUpload[documentType] = file; // Update the passed object
      tradingFilesToUpload[documentType] = file; // Update the local state
    }
  };
  // Handle multiple file uploads
  const handleNonTradingDocumentsChange = (e) => {
    const fileList = e.target.files;
    if (fileList.length > 0) {
      // Convert FileList to array and append to existing files
      const newFiles = Array.from(fileList);
      setNonTradingFiles((prevFiles) => [...prevFiles, ...newFiles]);
      // Assign a new array containing all files in state to nonTradingFilesToUpload["others"]
      const previousOthers = nonTradingFilesToUpload?.["others"] || [];
      nonTradingFilesToUpload["others"] = [...newFiles, ...previousOthers];
      console.log("Updated nonTradingFilesToUpload:", nonTradingFilesToUpload);
    }
  };

  const removeTradingFile = (documentType) => {
    setTradingDocuments((prevDocs) => ({
      ...prevDocs,
      [documentType]: null, // Set the specific document to null
    }));
    // Remove the file from tradingFilesToUpload
    delete tradingFilesToUpload[documentType];
    // console.log("Updated tradingFilesToUpload:", tradingFilesToUpload);
  };

  // Remove a specific file
  const removeFile = (index) => {
    setNonTradingFiles((prevFiles) =>
      prevFiles.filter((_, fileIndex) => fileIndex !== index)
    );
    // Remove the file from nonTradingFilesToUpload["others"] as well
    const updatedFiles = nonTradingFiles.filter(
      (_, fileIndex) => fileIndex !== index
    );
    // If file exits in customerData, remove it from there as well
    if (Array.isArray(customerData?.nonTradingDocuments)) {
      const fileName = customerData.nonTradingDocuments[index];
      customerData.nonTradingDocuments = customerData.nonTradingDocuments.filter(
      (file) => file !== fileName
      );
    }
    nonTradingFilesToUpload["others"] = updatedFiles;
    console.log("Updated nonTradingFilesToUpload:", nonTradingFilesToUpload);
  };

  const handleViewFile = async (customerId, fileName, fileType) => {
    let fileURL = "";
    try {
      const response = await fetch(
        `${API_BASE_URL}/customers/getfile/${customerId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fileType, fileName }),
          credentials: "include",
        }
      )
        .then((res) => res.json())
        .then((res) => {
          if (res.status == "Ok") {
            fileURL = res.data.url;
          } else {
            throw new Error("Failed to fetch file URL");
          }
        });
      // if (response.status !== "Ok") {
      //   throw new Error("Failed to fetch file");
      // }

      // const blob = await response.blob();
      // const blobUrl = URL.createObjectURL(blob);

      // // Open the file in a new tab
      window.open(fileURL, "_blank", "noopener,noreferrer");

      // if (fileType === "nonTradingDocuments" || fileName.endsWith(".pdf")) {
      //   window.open(blobUrl, "_blank");
      // } else {
      //   const a = document.createElement("a");
      //   a.href = blobUrl;
      //   a.download = fileName;
      //   document.body.appendChild(a);
      //   a.click();
      //   document.body.removeChild(a);
      // }

      // Clean up
      //URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error viewing file:", error);
      // alert('Failed to open file. Please try again.');
    }
  };

  return (
    <div className="customer-onboarding-form-grid">
      {isV("customerApprovalChecklist") && (
                          <div className="form-main-header">
                            <a href="#">{t("Customer Approval Checklist")}</a>
                          </div>
                        )}
      {/* Documents Header */}
      <div className="form-header full-width">{t("Documents")}</div>
      <div className="form-group" />
      <div className="form-header full-width">
        {t("Download terms & conditions and upload duly signed document")}
      </div>
    
      {/* Common Fields */}
     {/* Acknowledgement Signature (already present) */}
        <tr className="document-upload full-width" key="acknowledgementSignature">
          <td className="label-cell" style={{ whiteSpace: "nowrap", paddingRight: "16px", verticalAlign: "top" }}>
            <label htmlFor="acknowledgementSignature">
              {t("Upload duly signed document")}
              <span className="required-field">*</span>
              {customerData?.acknowledgementSignature !== originalCustomerData?.acknowledgementSignature && (
                <span className="update-badge">
                  Updated
                </span>
              )}
            </label>
           { formErrors?.acknowledgementSignature && (<div className="error">{formErrors.acknowledgementSignature}</div>)}
          </td>
          <td className="upload-cell" style={{ width: "100px", paddingRight: "16px", verticalAlign: "top" }} hidden={mode === "edit"}>
            <input
              type="file"
              id="acknowledgementSignature"
              name="acknowledgementSignature"
              className="hidden-file-input"
              onChange={(e) => handleTradingDocumentChange(e, "acknowledgementSignature")}
              accept=".pdf,.doc,.docx,.jpg,.png"
              required
              disabled={mode === "edit"}
            />
            <label
              htmlFor="acknowledgementSignature"
              className="custom-file-button"
              style={{ display: "inline-block", width: "100%", textAlign: "center" }}
            >
              {t("Upload")}
            </label>
          </td>
          <td className="file-display-cell">
            {tradingFilesToUpload?.acknowledgementSignature && (
              <li key={tradingFilesToUpload.acknowledgementSignature.name} className="uploaded-file-item">
                <span className="file-name">{tradingFilesToUpload.acknowledgementSignature.name}</span>
                <button
                  type="button"
                  className="delete-file-button"
                  onClick={() => removeTradingFile("acknowledgementSignature")}
                >
                  ×
                </button>
              </li>
            )}

            {customerData?.acknowledgementSignature && (
              <div className="file-actions">
                
                {!tradingDocuments.acknowledgementSignature &&
                  customerData?.acknowledgementSignature && (
                    <a
                      href="#"
                      className="file-link"
                      onClick={(e) => {
                        e.preventDefault();
                        handleViewFile(
                          customerData.id,
                          customerData.acknowledgementSignature,
                          "acknowledgementSignature"
                        )
                      }}
                    >
                      {typeof customerData.acknowledgementSignature === "string"
                        ? customerData.acknowledgementSignature.split("_").slice(0, 2).join(" ")
                        : "View Document"}
                    </a>
                  )}
              </div>
            )}
          </td>
        </tr>


      {isTrading ? (
        <>
        {/* Copy of Commercial Registration */}
        <tr className="document-upload full-width" key="crCertificate">
          <td className="label-cell" style={{ whiteSpace: "nowrap", paddingRight: "16px", verticalAlign: "top" }}>
            <label htmlFor="crCertificate">
              {t("Copy of Commercial Registration")}
              <span className="required-field">*</span>
              {customerData?.crCertificate !== originalCustomerData?.crCertificate && (
                <span className="update-badge">
                  Updated
                </span>
              )}
            </label>
            {formErrors?.crCertificate && (
              <div className="error">{formErrors.crCertificate}</div>
            )}
          </td>
          <td className="upload-cell" style={{ width: "100px", paddingRight: "16px", verticalAlign: "top" }} hidden={mode === "edit"}>
            <input
              type="file"
              id="crCertificate"
              name="crCertificate"
              className="hidden-file-input"
              onChange={(e) => handleTradingDocumentChange(e, "crCertificate")}
              required
              disabled={mode === "edit"}
            />
            <label
              htmlFor="crCertificate"
              className="custom-file-button"
              style={{ display: "inline-block", width: "100%", textAlign: "center" }}
            >
              {t("Upload")}
            </label>
          </td>
          <td className="file-display-cell">
            {tradingFilesToUpload?.crCertificate && (
              <li key={tradingFilesToUpload.crCertificate.name} className="uploaded-file-item">
                <span className="file-name">{tradingFilesToUpload.crCertificate.name}</span>
                <button
                  type="button"
                  className="delete-file-button"
                  onClick={() => removeTradingFile("crCertificate")}
                >
                        ×
                      </button>
                    </li>
                  )}
            {customerData?.crCertificate && (
              <div className="file-actions">
                
                {!tradingDocuments.crCertificate && customerData?.crCertificate && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.crCertificate,
                        "crCertificate"
                      );
                    }}
                  >
                    {typeof customerData.crCertificate === "string"
                      ? customerData.crCertificate.split("_").slice(0, 2).join(" ")
                      : "View Document"}
                  </a>
                )}
              </div>
            )}
          </td>
        </tr>

        {/* Copy of VAT Certificate */}
        <tr className="document-upload full-width" key="vatCertificate">
          <td className="label-cell" style={{ whiteSpace: "nowrap", paddingRight: "16px", verticalAlign: "top" }}>
            <label htmlFor="vatCertificate">
              {t("Copy of VAT Certificate")}
              <span className="required-field">*</span>
              {customerData?.vatCertificate !== originalCustomerData?.vatCertificate && (
                <span className="update-badge">
                  Updated
                </span>
              )}
            </label>
            {formErrors?.vatCertificate && (
              <div className="error">{formErrors.vatCertificate}</div>
            )}
          </td>
          <td className="upload-cell" style={{ width: "100px", paddingRight: "16px", verticalAlign: "top" }} hidden={mode === "edit"}>
            <input
              type="file"
              id="vatCertificate"
              name="vatCertificate"
              className="hidden-file-input"
              onChange={(e) => handleTradingDocumentChange(e, "vatCertificate")}
              required
              disabled={mode === "edit"}
            />
            <label
              htmlFor="vatCertificate"
              className="custom-file-button"
              style={{ display: "inline-block", width: "100%", textAlign: "center" }}
            >
              {t("Upload")}
            </label>
          </td>
          <td className="file-display-cell">
            {tradingFilesToUpload?.vatCertificate && (
              <li key={tradingFilesToUpload.vatCertificate.name} className="uploaded-file-item">
                <span className="file-name">{tradingFilesToUpload.vatCertificate.name}</span>
                <button
                  type="button"
                  className="delete-file-button"
                  onClick={() => removeTradingFile("vatCertificate")}
                >
                        ×
                      </button>
                    </li>
                  )}
            {customerData?.vatCertificate && (
              <div className="file-actions">
                
                {!tradingDocuments.vatCertificate && customerData?.vatCertificate && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.vatCertificate,
                        "vatCertificate"
                      );
                    }}
                    
                  >
                    {typeof customerData.vatCertificate === "string"
                      ? customerData.vatCertificate.split("_").slice(0, 2).join(" ")
                      : "View Document"}
                  </a>
                )}
              </div>
            )}
          </td>
        </tr>

        {/* Copy of national ID/Iqama */}
        <tr className="document-upload full-width" key="nationalId">
          <td className="label-cell" style={{ whiteSpace: "nowrap", paddingRight: "16px", verticalAlign: "top" }}>
            <label htmlFor="nationalId">
              {t("Copy of national ID/Iqama of the auth. sign..")}
              <span className="required-field">*</span>
              {customerData?.nationalId !== originalCustomerData?.nationalId && (
                <span className="update-badge">
                  Updated
                </span>
              )}
            </label>
            { formErrors?.nationalId && (
              <div className="error">{formErrors.nationalId}</div>
            )}
          </td>
          <td className="upload-cell" style={{ width: "100px", paddingRight: "16px", verticalAlign: "top" }} hidden={mode === "edit"}>
            <input
              type="file"
              id="nationalId"
              name="nationalId"
              className="hidden-file-input"
              onChange={(e) => handleTradingDocumentChange(e, "nationalId")}
              required
              disabled={mode === "edit"}
            />
            <label
              htmlFor="nationalId"
              className="custom-file-button"
              style={{ display: "inline-block", width: "100%", textAlign: "center" }}
            >
              {t("Upload")}
            </label>
          </td>
          <td className="file-display-cell">
            {tradingFilesToUpload?.nationalId && (
              <li key={tradingFilesToUpload.nationalId.name} className="uploaded-file-item">
                <span className="file-name">{tradingFilesToUpload.nationalId.name}</span>
                <button
                  type="button"
                  className="delete-file-button"
                  onClick={() => removeTradingFile("nationalId")}
                >
                  ×
                </button>
              </li>
            )}
            {customerData?.nationalId && (
              <div className="file-actions">
                
                {!tradingDocuments.nationalId && customerData?.nationalId && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.nationalId,
                        "nationalId"
                      );
                    }}
                  >
                    {typeof customerData.nationalId === "string"
                      ? customerData.nationalId.split("_").slice(0, 2).join(" ")
                      : "View Document"}
                  </a>
                )}
              </div>
            )}
          </td>
        </tr>

        {/* Bank details on company letterhead */}
        <tr className="document-upload full-width" key="bankLetter">
          <td className="label-cell" style={{ whiteSpace: "nowrap", paddingRight: "16px", verticalAlign: "top" }}>
            <label htmlFor="bankLetter">
              {t("Bank details on company letterhead")}
              <span className="required-field">*</span>
              {customerData?.bankLetter !== originalCustomerData?.bankLetter && (
                <span className="update-badge">
                  Updated
                </span>
              )}
            </label>
            {formErrors?.bankLetter && (
              <div className="error">{formErrors.bankLetter}</div>
            )}
          </td>
          <td className="upload-cell" style={{ width: "100px", paddingRight: "16px", verticalAlign: "top" }} hidden={mode === "edit"}>
            <input
              type="file"
              id="bankLetter"
              name="bankLetter"
              className="hidden-file-input"
              onChange={(e) => handleTradingDocumentChange(e, "bankLetter")}
              required
              disabled={mode === "edit"}
            />
            <label
              htmlFor="bankLetter"
              className="custom-file-button"
              style={{ display: "inline-block", width: "100%", textAlign: "center" }}
            >
              {t("Upload")}
            </label>
          </td>
          <td className="file-display-cell">
            {tradingFilesToUpload?.bankLetter && (
              <li key={tradingFilesToUpload.bankLetter.name} className="uploaded-file-item">
                <span className="file-name">{tradingFilesToUpload.bankLetter.name}</span>
                <button
                  type="button"
                  className="delete-file-button"
                  onClick={() => removeTradingFile("bankLetter")}
                >
                  ×
                </button>
              </li>
            )}
            {customerData?.bankLetter && (
              <div className="file-actions">
                
                {!tradingDocuments.bankLetter && customerData?.bankLetter && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.bankLetter,
                        "bankLetter"
                      );
                    }}
                  >
                    {typeof customerData.bankLetter === "string"
                      ? customerData.bankLetter.split("_").slice(0, 2).join(" ")
                      : "View Document"}
                  </a>
                )}
              </div>
            )}
          </td>
        </tr>

        {/* Copy of National Address */}
        <tr className="document-upload full-width" key="nationalAddress">
          <td className="label-cell" style={{ whiteSpace: "nowrap", paddingRight: "16px", verticalAlign: "top" }}>
            <label htmlFor="nationalAddress">
              {t("Copy of National Address")}
              <span className="required-field">*</span>
              {customerData?.nationalAddress !== originalCustomerData?.nationalAddress && (
                <span className="update-badge">
                  Updated
                </span>
              )}
            </label>
            {formErrors?.nationalAddress && (
              <div className="error">{formErrors.nationalAddress}</div>
            )}
          </td>
          <td className="upload-cell" style={{ width: "100px", paddingRight: "16px", verticalAlign: "top" }} hidden={mode === "edit"}>
            <input
              type="file"
              id="nationalAddress"
              name="nationalAddress"
              className="hidden-file-input"
              onChange={(e) => handleTradingDocumentChange(e, "nationalAddress")}
              required
              disabled={mode === "edit"}
            />
            <label
              htmlFor="nationalAddress"
              className="custom-file-button"
              style={{ display: "inline-block", width: "100%", textAlign: "center" }}
            >
              {t("Upload")}
            </label>
          </td>
          <td className="file-display-cell">
            {tradingFilesToUpload?.nationalAddress && (
              <li key={tradingFilesToUpload.nationalAddress.name} className="uploaded-file-item">
                <span className="file-name">{tradingFilesToUpload.nationalAddress.name}</span>
                <button
                  type="button"
                  className="delete-file-button"
                  onClick={() => removeTradingFile("nationalAddress")}
                >
                  ×
                </button>
              </li>
            )}
            {customerData?.nationalAddress && (
              <div className="file-actions">
               
                {!tradingDocuments.nationalAddress && customerData?.nationalAddress && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.nationalAddress,
                        "nationalAddress"
                      );
                    }}
                  >
                    {typeof customerData.nationalAddress === "string"
                      ? customerData.nationalAddress.split("_").slice(0, 2).join(" ")
                      : "View Document"}
                  </a>
                )}
              </div>
            )}
          </td>
        </tr>

        {/* Contract Agreement */}
        <tr className="document-upload full-width" key="contractAgreement">
          <td className="label-cell" style={{ whiteSpace: "nowrap", paddingRight: "16px", verticalAlign: "top" }}>
            <label htmlFor="contractAgreement">
              {t("Contract Agreement")}
              <span className="required-field">*</span>
              {customerData?.contractAgreement !== originalCustomerData?.contractAgreement && (
                <span className="update-badge">
                  Updated
                </span>
              )}
            </label>
            {formErrors?.contractAgreement && (
              <div className="error">{formErrors.contractAgreement}</div>
            )}
          </td>
          <td className="upload-cell" style={{ width: "100px", paddingRight: "16px", verticalAlign: "top" }} hidden={mode === "edit"}>
            <input
              type="file"
              id="contractAgreement"
              name="contractAgreement"
              className="hidden-file-input"
              onChange={(e) => handleTradingDocumentChange(e, "contractAgreement")}
              required
              disabled={mode === "edit"}
            />
            <label
              htmlFor="contractAgreement"
              className="custom-file-button"
              style={{ display: "inline-block", width: "100%", textAlign: "center" }}
            >
              {t("Upload")}
            </label>
          </td>
          <td className="file-display-cell">
            {tradingFilesToUpload?.contractAgreement && (
              <li key={tradingFilesToUpload.contractAgreement.name} className="uploaded-file-item">
                <span className="file-name">{tradingFilesToUpload.contractAgreement.name}</span>
                <button
                  type="button"
                  className="delete-file-button"
                  onClick={() => removeTradingFile("contractAgreement")}
                >
                  ×
                </button>
              </li>
            )}
            {customerData?.contractAgreement && (
              <div className="file-actions">
                
                {!tradingDocuments.contractAgreement && customerData?.contractAgreement && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.contractAgreement,
                        "contractAgreement"
                      );
                    }}
                  >
                    {typeof customerData.contractAgreement === "string"
                      ? customerData.contractAgreement.split("_").slice(0, 2).join(" ")
                      : "View Document"}
                  </a>
                )}
              </div>
            )}
          </td>
        </tr>

        {/* Credit Application */}
        <tr className="document-upload full-width" key="creditApplication">
          <td className="label-cell" style={{ whiteSpace: "nowrap", paddingRight: "16px", verticalAlign: "top" }}>
            <label htmlFor="creditApplication">
              {t("Credit Application")}
              <span className="required-field">*</span>
              {customerData?.creditApplication !== originalCustomerData?.creditApplication && (
                <span className="update-badge">
                  Updated
                </span>
              )}
            </label>
            {formErrors?.creditApplication && (
              <div className="error">{formErrors.creditApplication}</div>
            )}
          </td>
          <td className="upload-cell" style={{ width: "100px", paddingRight: "16px", verticalAlign: "top" }} hidden={mode === "edit"}>
            <input
              type="file"
              id="creditApplication"
              name="creditApplication"
              className="hidden-file-input"
              onChange={(e) => handleTradingDocumentChange(e, "creditApplication")}
              required
              disabled={mode === "edit"}
            />
            <label
              htmlFor="creditApplication"
              className="custom-file-button"
              style={{ display: "inline-block", width: "100%", textAlign: "center" }}
            >
              {t("Upload")}
            </label>
          </td>
          <td className="file-display-cell">
            {tradingFilesToUpload?.creditApplication && (
              <li key={tradingFilesToUpload.creditApplication.name} className="uploaded-file
-item">
                <span className="file-name">{tradingFilesToUpload.creditApplication.name}</span>
                <button
                  type="button"
                  className="delete-file-button"
                  onClick={() => removeTradingFile("creditApplication")}
                >
                  ×
                </button>
              </li>
            )}
            {customerData?.creditApplication && (
              <div className="file-actions">
                
                {!tradingDocuments.creditApplication && customerData?.creditApplication && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.creditApplication,
                        "creditApplication"
                      )
                    }}
                  >
                    {typeof customerData.creditApplication === "string"
                      ? customerData.creditApplication.split("_").slice(0, 2).join(" ")
                      : "View Document"}
                  </a>
                )}
              </div>
            )}
          </td>
        </tr>
        </>
      ) : (
        <>
          {/* Contract Agreement */}
        <tr className="document-upload full-width" key="contractAgreement">
          <td className="label-cell" style={{ whiteSpace: "nowrap", paddingRight: "16px", verticalAlign: "top" }}>
            <label htmlFor="contractAgreement">
              {t("Contract Agreement")}
              <span className="required-field">*</span>
              {customerData?.contractAgreement !== originalCustomerData?.contractAgreement && (
                <span className="update-badge">
                  Updated
                </span>
              )}
            </label>
            {formErrors?.contractAgreement && (
              <div className="error">{formErrors.contractAgreement}</div>
            )}
          </td>
          <td className="upload-cell" style={{ width: "100px", paddingRight: "16px", verticalAlign: "top" }} hidden={mode === "edit"}>
            <input
              type="file"
              id="contractAgreement"
              name="contractAgreement"
              className="hidden-file-input"
              onChange={(e) => handleTradingDocumentChange(e, "contractAgreement")}
              required
              disabled={mode === "edit"}
            />
            <label
              htmlFor="contractAgreement"
              className="custom-file-button"
              style={{ display: "inline-block", width: "100%", textAlign: "center" }}
            >
              {t("Upload")}
            </label>
            {formErrors?.contractAgreement && (
              <div className="error">{formErrors.contractAgreement}</div>
            )}
          </td>
          <td className="file-display-cell">
            {tradingFilesToUpload?.contractAgreement && (
              <li key={tradingFilesToUpload.contractAgreement.name} className="uploaded-file-item">
                <span className="file-name">{tradingFilesToUpload.contractAgreement.name}</span>
                <button
                  type="button"
                  className="delete-file-button"
                  onClick={() => removeTradingFile("contractAgreement")}
                >
                  ×
                </button>
              </li>
            )}
            {customerData?.contractAgreement && (
              <div className="file-actions">
                
                {!tradingDocuments.contractAgreement && customerData?.contractAgreement && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.contractAgreement,
                        "contractAgreement"
                      )
                    }}
                  >
                    {typeof customerData.contractAgreement === "string"
                      ? customerData.contractAgreement.split("_").slice(0, 2).join(" ")
                      : "View Document"}
                  </a>
                )}
              </div>
            )}
          </td>
        </tr>

        {/* Credit Application */}
        <tr className="document-upload full-width" key="creditApplication">
          <td className="label-cell" style={{ whiteSpace: "nowrap", paddingRight: "16px", verticalAlign: "top" }}>
            <label htmlFor="creditApplication">
              {t("Credit Application")}
              <span className="required-field">*</span>
              {customerData?.creditApplication !== originalCustomerData?.creditApplication && (
                <span className="update-badge">
                  Updated
                </span>
              )}
            </label>
          </td>
          <td className="upload-cell" style={{ width: "100px", paddingRight: "16px", verticalAlign: "top" }} hidden={mode === "edit"}>
            <input
              type="file"
              id="creditApplication"
              name="creditApplication"
              className="hidden-file-input"
              onChange={(e) => handleTradingDocumentChange(e, "creditApplication")}
              required
              disabled={mode === "edit"}
            />
            <label
              htmlFor="creditApplication"
              className="custom-file-button"
              style={{ display: "inline-block", width: "100%", textAlign: "center" }}
            >
              {t("Upload")}
            </label>
          </td>
          <td className="file-display-cell">
            {tradingFilesToUpload?.creditApplication && (
              <li key={tradingFilesToUpload.creditApplication.name} className="uploaded-file-item">
                <span className="file-name">{tradingFilesToUpload.creditApplication.name}</span>
                <button
                  type="button"
                  className="delete-file-button"
                  onClick={() => removeTradingFile("creditApplication")}
                >
                  ×
                </button>
              </li>
            )}
            {customerData?.creditApplication && (
              <div className="file-actions">
                
                {!tradingDocuments.creditApplication && customerData?.creditApplication && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.creditApplication,
                        "creditApplication"
                      )
                    }}
                  >
                    {typeof customerData.creditApplication === "string"
                      ? customerData.creditApplication.split("_").slice(0, 2).join(" ")
                      : "View Document"}
                  </a>
                )}
              </div>
            )}
          </td>
        </tr>
           <tr
                              className="document-upload full-width"
                              key={"nonTradingDocuments"}
                            >
                              {/* Label */}
                              <td
                                className="label-cell"
                                style={{
                                  whiteSpace: "nowrap",
                                  paddingRight: "16px",
                                  verticalAlign: "top",
                                }}
                              >
            <label htmlFor="nonTradingDocuments">
              {t("Non-Trading Documents")}
              {customerData?.nonTradingDocuments?.length !== originalCustomerData?.nonTradingDocuments?.length && (
                <span className="update-badge">
                  Updated
                </span>
              )}
            </label>
            </td>
            <td
                                className="upload-cell"
                                style={{
                                  width: "100px",
                                  paddingRight: "16px",
                                  verticalAlign: "top",
                                }}
                                hidden={mode === "edit"}
                              >
            <input
              type="file"
              id="nonTradingDocuments"
              name="nonTradingDocuments"
              className="hidden-file-input"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.png"
              onChange={handleNonTradingDocumentsChange}
              disabled={mode === "edit"}
            />
            <label
                                  htmlFor={"nonTradingDocuments"}
                                  className="custom-file-button"
                                  style={{
                                    display: "inline-block",
                                    width: "100%",
                                    textAlign: "center",
                                  }}
                                >
                                  {t("Upload")}
                                </label>
                              </td>
<td className="file-display-cell">
            {/* Display uploaded files with delete option */}
            {nonTradingFiles.length > 0 && (
              <div className="uploaded-files-container">
                <h4>{t("Uploaded Files")}:</h4>
                <ul className="uploaded-files-list">
                  {nonTradingFiles.map((file, index) => (
                    <li key={index} className="uploaded-file-item">
                      <span className="file-name">{file.name}</span>
                      <button
                        type="button"
                        className="delete-file-button"
                        onClick={() => removeFile(index)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

</td>
          </tr>
          <tr>
            <td
                                className="label-cell"
                                style={{
                                  whiteSpace: "nowrap",
                                  paddingRight: "50px",
                                  verticalAlign: "top",
                                }}
                              > </td>
            <td
                                className="label-cell"
                                style={{
                                  width: "500px",
                                  paddingRight: "500px",
                                  verticalAlign: "top",
                                }}> </td>
            <td className="file-display-cell">

            {/* Display already uploaded files from customerData */}
            {Array.isArray(customerData?.nonTradingDocuments) &&
              customerData.nonTradingDocuments.length > 0 && (
                <div className="uploaded-files-container">
                  <ul className="uploaded-files-list">
                    {customerData.nonTradingDocuments.filter(fileName => !originalCustomerData?.nonTradingDocuments?.includes(fileName))
                    .map((fileName, idx) => (
                      <li key={idx} className="uploaded-file-item">
                        {/* <span className="file-name">{t("New Upload:")}</span> */}
                        <h4>{t("New Upload:")}</h4>
                        <a
                          href="#"
                          className="file-link"
                          onClick={(e) => {
                            e.preventDefault();
                            handleViewFile(
                              customerData.id,
                              fileName,
                              "nonTradingDocuments"
                            )
                          }}
                        >
                          {typeof fileName === "string"
                            ? fileName.split("_").slice(0, 2).join(" ")
                            : "View Document"}
                        </a>
                      </li>
                    ))}
                  </ul>
                  <h4>{t("Previously Uploaded Files")}:</h4>
                  <ul className="uploaded-files-list">
                    {customerData.nonTradingDocuments.filter(fileName => originalCustomerData?.nonTradingDocuments?.includes(fileName))
                    .map((fileName, idx) => (
                      <li key={idx} className="uploaded-file-item">
                        
                        <a
                          href="#"
                          className="file-link"
                          onClick={(e) => {
                            e.preventDefault();
                            handleViewFile(
                              customerData.id,
                              fileName,
                              "nonTradingDocuments"
                            )
                          }}
                        >
                          {typeof fileName === "string"
                            ? fileName.split("_").slice(0, 2).join(" ")
                            : "View Document"}
                        </a>
                        {mode === "edit" && (<button
                        type="button"
                        className="delete-file-button"
                        onClick={() => removeFile(idx)}
                      >
                        ×
                      </button>)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </td>

            </tr>
        </>
      )}
    </div>
  );
}

export default Documents;
