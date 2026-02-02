import React, { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { isMobile } from "../../utilities/isMobile";
import "../../styles/forms.css";
import "../../styles/components.css";
import { not } from "ajv/dist/compile/codegen";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import RbacManager from "../../utilities/rbac";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2"; // Add this import at the top if not already present
import Constants from "../../constants";
import SearchableDropdown from "../../components/SearchableDropdown";
import i18n from "../../i18n";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const CUSTOMER_APPROVAL_CHECKLIST_URL = Constants?.DOCUMENTS_NAME?.CUSTOMER_APPROVAL_CHECKLIST;
const CUSTOMER_APPROVAL_CHECKLIST = Constants?.DOCUMENTS_NAME?.CUSTOMER_APPROVAL_CHECKLIST;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
function Documents({
  isTrading = true,
  tradingFilesToUpload = {},
  nonTradingFilesToUpload = {},
  customerData = {},
  customerPaymentMethodsData={},
  originalCustomerData = {},
  verifiedData = {},
  onChangeVerifiedData,
  setTabsHeight,
  mode,
  formErrors = {},
}) {
  const { t } = useTranslation();
  const { token, user, isAuthenticated, logout, loading } = useAuth();
  const TERMS_AND_CONDITIONS = i18n.language === "en" ? Constants.DOCUMENTS_NAME.TERMS_AND_CONDITIONS_EN : Constants.DOCUMENTS_NAME.TERMS_AND_CONDITIONS_AR;
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
    // acknowledgementSignature: null,
    crCertificate: null,
    vatCertificate: null,
    nationalId: null,
    bankLetter: null,
    nationalAddress: null,
    contractAgreement: null,
    contractAgreementShc: null,
    contractAgreementVmco: null,
    contractAgreementDar: null,
    contractAgreementGmtc: null,
    contractAgreementNaqi: null,
    creditApplication: null,
  });
  const [tradingFilePreviews, setTradingFilePreviews] = useState({});
  const [nonTradingFilePreviews, setNonTradingFilePreviews] = useState({});
  const [popupUrl, setPopupUrl] = useState(null);
  const fileInputRefs = {
    // acknowledgementSignature: useRef(),
    crCertificate: useRef(),
    vatCertificate: useRef(),
    nationalId: useRef(),
    bankLetter: useRef(),
    nationalAddress: useRef(),
    contractAgreement: useRef(),
    contractAgreementShc: useRef(),
    contractAgreementVmco: useRef(),
    contractAgreementDar: useRef(),
    contractAgreementGmtc: useRef(),
    contractAgreementNaqi: useRef(),
    creditApplication: useRef(),
    nonTradingDocuments: useRef(),
  };
  const nonTradingDocumentTypes = [
  "Freelance Work Certificate",
  "Passport",
  "Others (Specify)"
];
const [selectedDocType, setSelectedDocType] = useState("");
const [customDocName, setCustomDocName] = useState("");
  useEffect(() => {
    setTabsHeight("auto");
  }, []);
  const ALLOWED_FILE_TYPES = ['.pdf'];
   const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === 'Go' || e.key === 'Search' || e.key === 'Done'  ) {
        if (isMobile) {
          // Close keyboard
          e.target.blur();
          document.body.classList.remove('keyboard-open');
        }
      }
    };
  function getCenteredOptions(width, height) {
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  
  // Calculate centered position
  const left = Math.max(0, (screenWidth - width) / 2);
  const top = Math.max(0, (screenHeight - height) / 2);
  
  return {
    left: Math.round(left),
    top: Math.round(top)
  };
}
const openUrlSmart = (url) => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    // if (window.cordova && window.cordova.InAppBrowser) {
    //   const width = 400;
    //   const height = 500;
    //   const centeredPosition = getCenteredOptions(width, height);

    //   const options =
    //     'toolbar=yes,' +
    //     'hideurlbar=yes,' +
    //     'zoom=no,' +
    //     'hardwareback=yes,' +
    //     'clearsessioncache=yes,' +
    //     'clearcache=yes,' +
    //     `width=${width},` +
    //     `height=${height},` +
    //     `left=${centeredPosition.left},` +
    //     `top=${centeredPosition.top}`;

    //   window.cordova.InAppBrowser.open(url, '_blank', options);
    // } else {
    //   // iOS Safari fallback
    //   window.open(url, '_blank');
    // }
    setPopupUrl(url);
  } else {
    // Desktop
    window.open(url, '_blank');
  }
};

  // Handle file upload for specific document types
  const handleTradingDocumentChange = (e, documentType) => {
    const docListToUpload = isTrading
      ? tradingFilesToUpload
      : nonTradingFilesToUpload;
    // Check if the file input has files
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        Swal.fire({
          icon: "error",
          title: t("Error"),
          text: t(
            "The following files exceed the maximum size of {{size}} MB: {{files}}",
            {
              size: MAX_FILE_SIZE / (1024 * 1024),
              files: file.name,
            }
          ),
          confirmButtonText: t("OK"),
        });
        return;
      }

      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t(
          "Invalid file type. Please upload only PDF files."
        ),
        confirmButtonText: t("OK"),
      });
      // Clear the file input
      e.target.value = '';
      return;
    }

      // Update the specific document in state
      setTradingDocuments((prevDocs) => ({
        ...prevDocs,
        [documentType]: file,
      }));
      docListToUpload[documentType] = file; // Update the passed object
      tradingFilesToUpload[documentType] = file; // Update the local state
      // Generate preview URL
      const previewUrl = URL.createObjectURL(file);
      setTradingFilePreviews((prev) => ({
        ...prev,
        [documentType]: previewUrl,
      }));
    }
  };

  const handleNonTradingDropdownChange = (e) => {
    setSelectedDocType(e.target.value);
    if (e.target.value !== "Others (Specify)") {
      setCustomDocName("");
    }
  };
  // Handle multiple file uploads
  const handleNonTradingDocumentsChange = (e) => {
    const fileList = e.target.files;
    if (fileList.length > 0) {
      const files = Array.from(fileList);

      // Check if any file exceeds the size limit
      const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
        Swal.fire({
          icon: "error",
          title: t("Error"),
          text: t(
            "The following files exceed the maximum size of {{size}} MB: {{files}}",
            {
              size: MAX_FILE_SIZE / (1024 * 1024),
              files: oversizedFiles.map((file) => file.name).join(", "),
            }
          ),
          confirmButtonText: t("OK"),
        });
        return;
      }

      const invalidFiles = files.filter(file => {
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      return !ALLOWED_FILE_TYPES.includes(fileExtension);
    });

    if (invalidFiles.length > 0) {
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t(
          "The following files have invalid format. Please upload only PDF files: {{files}}",
          {
            files: invalidFiles.map((file) => file.name).join(", "),
          }
        ),
        confirmButtonText: t("OK"),
      });
      // Clear the file input
      e.target.value = '';
      return;
    }

      // Add a fileName property in files which holds custDocType
      files.forEach((file) => {
        file.originalname = customDocName || selectedDocType;
      });

      // Convert FileList to array and append to existing files
      const newFiles = files;
      setNonTradingFiles((prevFiles) => [...prevFiles, ...newFiles]);
      // Assign a new array containing all files in state to nonTradingFilesToUpload["others"]
      const previousOthers = nonTradingFilesToUpload?.["others"] || [];
      nonTradingFilesToUpload["others"] = [...newFiles, ...previousOthers];
      // Generate previews for each file
      const newPreviews = {};
      newFiles.forEach((file) => {
        const previewUrl = URL.createObjectURL(file);
        newPreviews[file.name] = previewUrl;
      });
      setNonTradingFilePreviews((prev) => ({
        ...prev,
        ...newPreviews,
      }));
      console.log("Updated nonTradingFilesToUpload:", nonTradingFilesToUpload);
    }
  };

  const removeTradingFile = (documentType) => {
    setTradingDocuments((prevDocs) => ({
      ...prevDocs,
      [documentType]: null,
    }));
    delete tradingFilesToUpload[documentType];
    setTradingFilePreviews((prevPreviews) => {
      const updatedPreviews = { ...prevPreviews };
      delete updatedPreviews[documentType];
      return updatedPreviews;
    });
    // Reset the file input value so the same file can be uploaded again
    if (fileInputRefs[documentType]?.current) {
      fileInputRefs[documentType].current.value = "";
    }
  };

  // Remove a specific file
  const removeFile = (index) => {
    setNonTradingFiles((prevFiles) =>
      prevFiles.filter((_, fileIndex) => fileIndex !== nonTradingFiles.length - 1 - index)
    );
    // Remove the file from nonTradingFilesToUpload["others"] as well
    const updatedFiles = nonTradingFiles.filter(
      (_, fileIndex) => fileIndex !== nonTradingFiles.length - 1 - index
    );
    // If file exits in customerData, remove it from there as well
    if (Array.isArray(customerData?.nonTradingDocuments) && mode === "edit") {
      const fileName = customerData.nonTradingDocuments[index];
      customerData.nonTradingDocuments =
        customerData.nonTradingDocuments.filter((file) => file !== fileName);
    }
    nonTradingFilesToUpload["others"] = updatedFiles;
    console.log("Updated nonTradingFilesToUpload:", nonTradingFilesToUpload);
    // Reset the file input value
    if (fileInputRefs.nonTradingDocuments?.current) {
      fileInputRefs.nonTradingDocuments.current.value = "";
    }
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
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ fileType, fileName }),
          
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
      // window.open(fileURL, "_blank", "noopener,noreferrer");
        openUrlSmart(fileURL);
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
       {/* {isV("customerApprovalChecklist") && (
        <div className="form-main-header">
          <a
            href="#"
            onClick={async (e) => {
              e.preventDefault();
              if (!CUSTOMER_APPROVAL_CHECKLIST_URL) {
                alert(t("No checklist URL configured."));
                return;
              }

              try {
                const response = await fetch(
                  `${API_BASE_URL}/get-files`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      fileName: CUSTOMER_APPROVAL_CHECKLIST,
                      containerType: "documents",
                    }),
                    
                  }
                );
                const res = await response.json();
                if (res.status === "Ok") {
                  window.open(res.data.url, "_blank", "noopener,noreferrer");
                } else {
                  throw new Error("Failed to fetch file URL");
                }
              } catch (error) {
                console.error("Error viewing checklist:", error);

                window.open(
                  CUSTOMER_APPROVAL_CHECKLIST_URL,
                  "_blank",
                  "noopener,noreferrer"
                );
              }
            }}
            style={{ cursor: "pointer" }}
          >
            {t("Customer Approval Checklist")}
          </a>
        </div>
      )} */}
      {user?.userType.toLowerCase() === "employee" && (
        <div className="form-main-header" style={{ ...(isMobile && {
    margin: "0px 12px",
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    backgroundColor: "#76716926",
    borderRadius: "11px",
    padding: "4px 0px"
  })}}>
          {t("ERP ID")}: {customerData?.erpCustId ?? "-"}
          </div>
      )}
      {/* Documents Header */}
      <h3 className="form-header full-width">{t("Documents")}</h3>
      <div className="form-group" />
      {/* <div className="form-header full-width">
        {t("Download ")}
        {(
          <a
            href="#"
            onClick={async (e) => {
              e.preventDefault();
              if (!TERMS_AND_CONDITIONS) {
                alert(t("No checklist URL configured."));
                return;
              }

              try {
                const response = await fetch(
                  `${API_BASE_URL}/get-files`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      fileName: TERMS_AND_CONDITIONS,
                      containerType: "documents",
                    }),
                    
                  }
                );
                const res = await response.json();
                if (res.status === "Ok") {
                  // window.open(res.data.url, "_blank", "noopener,noreferrer");
                  openUrlSmart(res.data.url);
                } else {
                  throw new Error("Failed to fetch file URL");
                }
              } catch (error) {
                console.error("Error viewing checklist:", error);

                // window.open(
                //   TERMS_AND_CONDITIONS,
                //   "_blank",
                //   "noopener,noreferrer"
                // );
                openUrlSmart(TERMS_AND_CONDITIONS);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            {t("Terms & Conditions")}
          </a>
        
      )}
      {t(" and upload duly signed document.")}
      </div> */}

      {/* Common Fields */}
      {/* Acknowledgement Signature (already present) */}
      {/* <tr className="document-upload full-width" key="acknowledgementSignature"> */}
        {/* <td
          className="label-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        >
          <label htmlFor="acknowledgementSignature">
            {t("Terms and Conditions")}
            <span className="required-field">*</span>
            {customerData?.acknowledgementSignature !==
              originalCustomerData?.acknowledgementSignature && mode === "edit" && (
              <span className="update-badge">Updated</span>
            )}
          </label>

      <button
        type="button"
        className="download-icon-button"
        onClick={async (e) => {
          e.preventDefault();
          if (!TERMS_AND_CONDITIONS) {
            alert(t("No checklist URL configured."));
            return;
          }

          try {
            const response = await fetch(
              `${API_BASE_URL}/get-files`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                  fileName: TERMS_AND_CONDITIONS,
                  containerType: "documents",
                }),
              }
            );
            const res = await response.json();
            if (res.status === "Ok") {
              // window.open(res.data.url, "_blank", "noopener,noreferrer");
              openUrlSmart(res.data.url);
            } else {
              throw new Error("Failed to fetch file URL");
            }
          } catch (error) {
            console.error("Error downloading terms:", error);
            // window.open(
            //   TERMS_AND_CONDITIONS,
            //   "_blank",
            //   "noopener,noreferrer"
            // );
            openUrlSmart(TERMS_AND_CONDITIONS);
          }
        }}
        title={t("Download Terms & Conditions")}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

          {formErrors?.acknowledgementSignature && (
            <div className="error">{t(formErrors.acknowledgementSignature)}</div>
          )}
        </td> */}
        {/* <div className="input-with-verification">
          
          { isV("acknowledgementSignatureVerified") && (
    
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="acknowledgementSignatureVerified"
        name="acknowledgementSignatureVerified"
        checked={verifiedData?.acknowledgementSignatureVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="acknowledgementSignatureVerified">Verified</label>
      </div>)}
        </div> */}
        {/* <td
          className="upload-cell"
          style={{ width: "100px", paddingRight: "16px", verticalAlign: "top" }}
          hidden={mode === "edit"}
        >
          <input
            type="file"
            accept=".pdf"
            id="acknowledgementSignature"
            name="acknowledgementSignature"
            className="hidden-file-input"
            ref={fileInputRefs.acknowledgementSignature}
            onChange={(e) =>
              handleTradingDocumentChange(e, "acknowledgementSignature")
            }
            required
            disabled={mode === "edit"
              && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
            }
          />
          <label
            htmlFor="acknowledgementSignature"
            className="custom-file-button"
            style={{
              display: "inline-block",
              width: "100%",
              textAlign: "center",
            }}
          >
            {t("Upload")}
          </label>
        </td> */}
        {/* <td className="file-display-cell">
          {tradingFilesToUpload?.acknowledgementSignature && (
            <li
              key={tradingFilesToUpload.acknowledgementSignature.name}
              className="uploaded-file-item"
            >
              {tradingFilePreviews?.acknowledgementSignature && (
                <a
                  href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.acknowledgementSignature);
  }}
                >
                  {tradingFilesToUpload.acknowledgementSignature.name}
                </a>
              )}
              <button
                type="button"
                className="delete-file-button"
                onClick={() => removeTradingFile("acknowledgementSignature")}
              >
                ×
              </button>
            </li>
          )}

          {tradingFilePreviews?.acknowledgementSignature &&
            !tradingFilesToUpload?.acknowledgementSignature && (
              <a
                href="#"
                className="file-link"
                onClick={(e) => {
                  e.preventDefault();
                  handleViewFile(
                    customerData.id,
                    customerData.acknowledgementSignature,
                    "acknowledgementSignature"
                  );
                }}
              >
                {typeof customerData.acknowledgementSignature === "string"
                  ? customerData.acknowledgementSignature
                      .split("_")
                      .slice(0, 2)
                      .join(" ")
                  : "View Document"}
              </a>
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
                      );
                    }}
                  >
                    {typeof customerData?.acknowledgementSignature === "string"
                      ? customerData?.acknowledgementSignature
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
            </div>
          )}
        </td> */}
      {/* </tr> */}

          {/* Bank details on company letterhead */}
          <tr className="document-upload full-width" key="bankLetter">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="bankLetter">
                {t("Bank details on company letterhead")}
                <span className="required-field">*</span>
                {customerData?.bankLetter !==
                  originalCustomerData?.bankLetter && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.bankLetter && (
                <div className="error">{t(formErrors.bankLetter)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("bankLetterVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="bankLetterVerified"
        name="bankLetterVerified"
        checked={verifiedData?.bankLetterVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="bankLetterVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="bankLetter"
                name="bankLetter"
                className="hidden-file-input"
                ref={fileInputRefs.bankLetter}
                onChange={(e) => handleTradingDocumentChange(e, "bankLetter")}
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="bankLetter"
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
              {tradingFilesToUpload?.bankLetter && (
                <li
                  key={tradingFilesToUpload.bankLetter.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.bankLetter && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.bankLetter);
  }}
                    >
                      {tradingFilesToUpload.bankLetter.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("bankLetter")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.bankLetter &&
                !tradingFilesToUpload?.bankLetter && (
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
                        ? customerData.bankLetter
                            .split("_")
                            .slice(0, 2)
                            .join(" ")
                        : "View Document"}
                    </a>
                  )}
                </div>
              )}
            </td>
          </tr>

          {/* Copy of National Address */}
          <tr className="document-upload full-width" key="nationalAddress">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="nationalAddress">
                {t("Copy of National Address")}
                <span className="required-field">*</span>
                {customerData?.nationalAddress !==
                  originalCustomerData?.nationalAddress && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.nationalAddress && (
                <div className="error">{t(formErrors.nationalAddress)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("nationalAddressVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="nationalAddressVerified"
        name="nationalAddressVerified"
        checked={verifiedData?.nationalAddressVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="nationalAddressVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="nationalAddress"
                name="nationalAddress"
                className="hidden-file-input"
                ref={fileInputRefs.nationalAddress}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "nationalAddress")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="nationalAddress"
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
              {tradingFilesToUpload?.nationalAddress && (
                <li
                  key={tradingFilesToUpload.nationalAddress.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.nationalAddress && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.nationalAddress);
  }}
                    >
                      {tradingFilesToUpload.nationalAddress.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("nationalAddress")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.nationalAddress &&
                !tradingFilesToUpload?.nationalAddress && (
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
                      ? customerData.nationalAddress
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.nationalAddress && (
                <div className="file-actions">
                  {!tradingDocuments.nationalAddress &&
                    customerData?.nationalAddress && (
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
                          ? customerData.nationalAddress
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Copy of national ID/Iqama */}
          <tr className="document-upload full-width" key="nationalId">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="nationalId">
                {t("Copy of national ID/Iqama of the auth. sign..")}
                {/* <span className="required-field">*</span> */}
                {customerData?.nationalId !==
                  originalCustomerData?.nationalId && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.nationalId && (
                <div className="error">{t(formErrors.nationalId)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          { isV("nationalIdVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="nationalIdVerified"
        name="nationalIdVerified"
        checked={verifiedData?.nationalIdVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="nationalIdVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="nationalId"
                name="nationalId"
                className="hidden-file-input"
                ref={fileInputRefs.nationalId}
                onChange={(e) => handleTradingDocumentChange(e, "nationalId")}
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="nationalId"
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
              {tradingFilesToUpload?.nationalId && (
                <li
                  key={tradingFilesToUpload.nationalId.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.nationalId && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.nationalId);
  }}
                    >
                      {tradingFilesToUpload.nationalId.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("nationalId")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.nationalId &&
                !tradingFilesToUpload?.nationalId && (
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
                        ? customerData.nationalId
                            .split("_")
                            .slice(0, 2)
                            .join(" ")
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
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="crCertificate">
                {t("Copy of Commercial Registration")}
                <span className="required-field">*</span>
                {customerData?.crCertificate !==
                  originalCustomerData?.crCertificate && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.crCertificate && (
                <div className="error">{t(formErrors.crCertificate)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("crCertificateVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="crCertificateVerified"
        name="crCertificateVerified"
        checked={verifiedData?.crCertificateVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="crCertificateVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="crCertificate"
                name="crCertificate"
                className="hidden-file-input"
                ref={fileInputRefs.crCertificate}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "crCertificate")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="crCertificate"
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
              {tradingFilesToUpload?.crCertificate && (
                <li
                  key={tradingFilesToUpload.crCertificate.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.crCertificate && (
                    <a
                     href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.crCertificate);
  }}
                    >
                      {tradingFilesToUpload.crCertificate.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("crCertificate")}
                  >
                    ×
                  </button>
                </li>
              )}

              {tradingFilePreviews?.crCertificate &&
                !tradingFilesToUpload?.crCertificate && (
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
                      ? customerData.crCertificate
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.crCertificate && (
                <div className="file-actions">
                  {!tradingDocuments.crCertificate &&
                    customerData?.crCertificate && (
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
                          ? customerData.crCertificate
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Copy of VAT Certificate */}
          <tr className="document-upload full-width" key="vatCertificate">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="vatCertificate">
                {t("Copy of VAT Certificate")}
                <span className="required-field">*</span>
                {customerData?.vatCertificate !==
                  originalCustomerData?.vatCertificate && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.vatCertificate && (
                <div className="error">{t(formErrors.vatCertificate)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("vatCertificateVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="vatCertificateVerified"
        name="vatCertificateVerified"
        checked={verifiedData?.vatCertificateVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="vatCertificateVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="vatCertificate"
                name="vatCertificate"
                className="hidden-file-input"
                ref={fileInputRefs.vatCertificate}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "vatCertificate")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="vatCertificate"
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
              {tradingFilesToUpload?.vatCertificate && (
                <li
                  key={tradingFilesToUpload.vatCertificate.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.vatCertificate && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.vatCertificate);
  }}
                    >
                      {tradingFilesToUpload.vatCertificate.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("vatCertificate")}
                  >
                    ×
                  </button>
                </li>
              )}

              {tradingFilePreviews?.vatCertificate &&
                !tradingFilesToUpload?.vatCertificate && (
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
                      ? customerData.vatCertificate
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.vatCertificate && (
                <div className="file-actions">
                  {!tradingDocuments.vatCertificate &&
                    customerData?.vatCertificate && (
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
                          ? customerData.vatCertificate
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>
          
          {isV("assignedToEntityWise") && (
            <>
            

          {/* Contract Agreement SHC */}
          <tr className="document-upload full-width" key="contractAgreementShc">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="contractAgreementShc">
                {t("Contract Agreement SHC")}
                {/* <span className="required-field">*</span> */}
                {customerData?.contractAgreementShc !==
                  originalCustomerData?.contractAgreementShc && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.contractAgreementShc && (
                <div className="error">{t(formErrors.contractAgreementShc)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("contractAgreementShcVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="contractAgreementShcVerified"
        name="contractAgreementShcVerified"
        checked={verifiedData?.contractAgreementShcVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="contractAgreementShcVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="contractAgreementShc"
                name="contractAgreementShc"
                className="hidden-file-input"
                ref={fileInputRefs.contractAgreementShc}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "contractAgreementShc")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="contractAgreementShc"
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
              {tradingFilesToUpload?.contractAgreementShc && (
                <li
                  key={tradingFilesToUpload.contractAgreementShc.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.contractAgreementShc && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.contractAgreementShc);
  }}
                    >
                      {tradingFilesToUpload.contractAgreementShc.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("contractAgreementShc")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.contractAgreementShc &&
                !tradingFilesToUpload?.contractAgreementShc && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.contractAgreementShc,
                        "contractAgreementShc"
                      );
                    }}
                  >
                    {typeof customerData.contractAgreementShc === "string"
                      ? customerData.contractAgreementShc
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.contractAgreementShc && (
                <div className="file-actions">
                  {!tradingDocuments.contractAgreementShc &&
                    customerData?.contractAgreementShc && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.contractAgreementShc,
                            "contractAgreementShc"
                          );
                        }}
                      >
                        {typeof customerData.contractAgreementShc === "string"
                          ? customerData.contractAgreementShc
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Contract Agreement NAQI */}
          <tr className="document-upload full-width" key="contractAgreementNaqi">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="contractAgreementNaqi">
                {t("Contract Agreement NAQI")}
                {/* <span className="required-field">*</span> */}
                {customerData?.contractAgreementNaqi !==
                  originalCustomerData?.contractAgreementNaqi && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.contractAgreementNaqi && (
                <div className="error">{t(formErrors.contractAgreementNaqi)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("contractAgreementNaqiVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="contractAgreementNaqiVerified"
        name="contractAgreementNaqiVerified"
        checked={verifiedData?.contractAgreementNaqiVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="contractAgreementNaqiVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="contractAgreementNaqi"
                name="contractAgreementNaqi"
                className="hidden-file-input"
                ref={fileInputRefs.contractAgreementNaqi}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "contractAgreementNaqi")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="contractAgreementNaqi"
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
              {tradingFilesToUpload?.contractAgreementNaqi && (
                <li
                  key={tradingFilesToUpload.contractAgreementNaqi.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.contractAgreementNaqi && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.contractAgreementNaqi);
  }}
                    >
                      {tradingFilesToUpload.contractAgreementNaqi.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("contractAgreementNaqi")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.contractAgreementNaqi &&
                !tradingFilesToUpload?.contractAgreementNaqi && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.contractAgreementNaqi,
                        "contractAgreementNaqi"
                      );
                    }}
                  >
                    {typeof customerData.contractAgreementNaqi === "string"
                      ? customerData.contractAgreementNaqi
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.contractAgreementNaqi && (
                <div className="file-actions">
                  {!tradingDocuments.contractAgreementNaqi &&
                    customerData?.contractAgreementNaqi && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.contractAgreementNaqi,
                            "contractAgreementNaqi"
                          );
                        }}
                      >
                        {typeof customerData.contractAgreementNaqi === "string"
                          ? customerData.contractAgreementNaqi
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Contract Agreement GMTC */}
          <tr className="document-upload full-width" key="contractAgreementGmtc">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="contractAgreementGmtc">
                {t("Contract Agreement GMTC")}
                {/* <span className="required-field">*</span> */}
                {customerData?.contractAgreementGmtc !==
                  originalCustomerData?.contractAgreementGmtc && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.contractAgreementGmtc && (
                <div className="error">{t(formErrors.contractAgreementGmtc)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("contractAgreementGmtcVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="contractAgreementGmtcVerified"
        name="contractAgreementGmtcVerified"
        checked={verifiedData?.contractAgreementGmtcVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="contractAgreementGmtcVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="contractAgreementGmtc"
                name="contractAgreementGmtc"
                className="hidden-file-input"
                ref={fileInputRefs.contractAgreementGmtc}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "contractAgreementGmtc")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="contractAgreementGmtc"
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
              {tradingFilesToUpload?.contractAgreementGmtc && (
                <li
                  key={tradingFilesToUpload.contractAgreementGmtc.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.contractAgreementGmtc && (
                    <a
                     href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.contractAgreementGmtc);
  }}
                    >
                      {tradingFilesToUpload.contractAgreementGmtc.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("contractAgreementGmtc")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.contractAgreementGmtc &&
                !tradingFilesToUpload?.contractAgreementGmtc && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.contractAgreementGmtc,
                        "contractAgreementGmtc"
                      );
                    }}
                  >
                    {typeof customerData.contractAgreementGmtc === "string"
                      ? customerData.contractAgreementGmtc
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.contractAgreementGmtc && (
                <div className="file-actions">
                  {!tradingDocuments.contractAgreementGmtc &&
                    customerData?.contractAgreementGmtc && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.contractAgreementGmtc,
                            "contractAgreementGmtc"
                          );
                        }}
                      >
                        {typeof customerData.contractAgreementGmtc === "string"
                          ? customerData.contractAgreementGmtc
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Contract Agreement DAR */}
          <tr className="document-upload full-width" key="contractAgreementDar">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="contractAgreementDar">
                {t("Contract Agreement DAR")}
                {/* <span className="required-field">*</span> */}
                {customerData?.contractAgreementDar !==
                  originalCustomerData?.contractAgreementDar && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.contractAgreementDar && (
                <div className="error">{t(formErrors.contractAgreementDar)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("contractAgreementDarVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="contractAgreementDarVerified"
        name="contractAgreementDarVerified"
        checked={verifiedData?.contractAgreementDarVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="contractAgreementDarVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="contractAgreementDar"
                name="contractAgreementDar"
                className="hidden-file-input"
                ref={fileInputRefs.contractAgreementDar}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "contractAgreementDar")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="contractAgreementDar"
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
              {tradingFilesToUpload?.contractAgreementDar && (
                <li
                  key={tradingFilesToUpload.contractAgreementDar.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.contractAgreementDar && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.contractAgreementDar);
  }}
                    >
                      {tradingFilesToUpload.contractAgreementDar.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("contractAgreementDar")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.contractAgreementDar &&
                !tradingFilesToUpload?.contractAgreementDar && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.contractAgreementDar,
                        "contractAgreementDar"
                      );
                    }}
                  >
                    {typeof customerData.contractAgreementDar === "string"
                      ? customerData.contractAgreementDar
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.contractAgreementDar && (
                <div className="file-actions">
                  {!tradingDocuments.contractAgreementDar &&
                    customerData?.contractAgreementDar && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.contractAgreementDar,
                            "contractAgreementDar"
                          );
                        }}
                      >
                        {typeof customerData.contractAgreementDar === "string"
                          ? customerData.contractAgreementDar
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Contract Agreement VMCO */}
          <tr className="document-upload full-width" key="contractAgreementVmco">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="contractAgreementVmco">
                {t("Contract Agreement VMCO")}
                {/* <span className="required-field">*</span> */}
                {customerData?.contractAgreementVmco !==
                  originalCustomerData?.contractAgreementVmco && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.contractAgreementVmco && (
                <div className="error">{t(formErrors.contractAgreementVmco)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("contractAgreementVmcoVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="contractAgreementVmcoVerified"
        name="contractAgreementVmcoVerified"
        checked={verifiedData?.contractAgreementVmcoVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="contractAgreementVmcoVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="contractAgreementVmco"
                name="contractAgreementVmco"
                className="hidden-file-input"
                ref={fileInputRefs.contractAgreementVmco}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "contractAgreementVmco")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="contractAgreementVmco"
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
              {tradingFilesToUpload?.contractAgreementVmco && (
                <li
                  key={tradingFilesToUpload.contractAgreementVmco.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.contractAgreementVmco && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.contractAgreementVmco);
  }}
                    >
                      {tradingFilesToUpload.contractAgreementVmco.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("contractAgreementVmco")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.contractAgreementVmco &&
                !tradingFilesToUpload?.contractAgreementVmco && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.contractAgreementVmco,
                        "contractAgreementVmco"
                      );
                    }}
                  >
                    {typeof customerData.contractAgreementVmco === "string"
                      ? customerData.contractAgreementVmco
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.contractAgreementVmco && (
                <div className="file-actions">
                  {!tradingDocuments.contractAgreementVmco &&
                    customerData?.contractAgreementVmco && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.contractAgreementVmco,
                            "contractAgreementVmco"
                          );
                        }}
                      >
                        {typeof customerData.contractAgreementVmco === "string"
                          ? customerData.contractAgreementVmco
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Credit Application SHC */}
          <tr className="document-upload full-width" key="creditApplicationShc">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="creditApplicationShc">
                {t("Credit Application SHC")}
                {customerPaymentMethodsData?.methodDetails?.credit?.[Constants.ENTITY.SHC]?.isAllowed && (<span className="required-field">*</span>)}
                {customerData?.creditApplicationShc !==
                  originalCustomerData?.creditApplicationShc && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.creditApplicationShc && (
                <div className="error">{t(formErrors.creditApplicationShc)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("creditApplicationShcVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="creditApplicationShcVerified"
        name="creditApplicationShcVerified"
        checked={verifiedData?.creditApplicationShcVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="creditApplicationShcVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="creditApplicationShc"
                name="creditApplicationShc"
                className="hidden-file-input"
                ref={fileInputRefs.creditApplicationShc}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "creditApplicationShc")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="creditApplicationShc"
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
              {tradingFilesToUpload?.creditApplicationShc && (
                <li
                  key={tradingFilesToUpload.creditApplicationShc.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.creditApplicationShc && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.creditApplicationShc);
  }}
                    >
                      {tradingFilesToUpload.creditApplicationShc.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("creditApplicationShc")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.creditApplicationShc &&
                !tradingFilesToUpload?.creditApplicationShc && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.creditApplicationShc,
                        "creditApplicationShc"
                      );
                    }}
                  >
                    {typeof customerData.creditApplicationShc === "string"
                      ? customerData.creditApplicationShc
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.creditApplicationShc && (
                <div className="file-actions">
                  {!tradingDocuments.creditApplicationShc &&
                    customerData?.creditApplicationShc && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.creditApplicationShc,
                            "creditApplicationShc"
                          );
                        }}
                      >
                        {typeof customerData.creditApplicationShc === "string"
                          ? customerData.creditApplicationShc
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Credit Application NAQI */}
          <tr className="document-upload full-width" key="creditApplicationNaqi">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="creditApplicationNaqi">
                {t("Credit Application NAQI")}
                {customerPaymentMethodsData?.methodDetails?.credit?.[Constants.ENTITY.NAQI]?.isAllowed && (<span className="required-field">*</span>)}
                {customerData?.creditApplicationNaqi !==
                  originalCustomerData?.creditApplicationNaqi && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.creditApplicationNaqi && (
                <div className="error">{t(formErrors.creditApplicationNaqi)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("creditApplicationNaqiVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="creditApplicationNaqiVerified"
        name="creditApplicationNaqiVerified"
        checked={verifiedData?.creditApplicationNaqiVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="creditApplicationNaqiVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="creditApplicationNaqi"
                name="creditApplicationNaqi"
                className="hidden-file-input"
                ref={fileInputRefs.creditApplicationNaqi}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "creditApplicationNaqi")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="creditApplicationNaqi"
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
              {tradingFilesToUpload?.creditApplicationNaqi && (
                <li
                  key={tradingFilesToUpload.creditApplicationNaqi.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.creditApplicationNaqi && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.creditApplicationNaqi);
  }}
                    >
                      {tradingFilesToUpload.creditApplicationNaqi.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("creditApplicationNaqi")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.creditApplicationNaqi &&
                !tradingFilesToUpload?.creditApplicationNaqi && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.creditApplicationNaqi,
                        "creditApplicationNaqi"
                      );
                    }}
                  >
                    {typeof customerData.creditApplicationNaqi === "string"
                      ? customerData.creditApplicationNaqi
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.creditApplicationNaqi && (
                <div className="file-actions">
                  {!tradingDocuments.creditApplicationNaqi &&
                    customerData?.creditApplicationNaqi && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.creditApplicationNaqi,
                            "creditApplicationNaqi"
                          );
                        }}
                      >
                        {typeof customerData.creditApplicationNaqi === "string"
                          ? customerData.creditApplicationNaqi
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Credit Application GMTC */}
          <tr className="document-upload full-width" key="creditApplicationGmtc">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="creditApplicationGmtc">
                {t("Credit Application GMTC")}
                {customerPaymentMethodsData?.methodDetails?.credit?.[Constants.ENTITY.GMTC]?.isAllowed && (<span className="required-field">*</span>)}
                {customerData?.creditApplicationGmtc !==
                  originalCustomerData?.creditApplicationGmtc && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.creditApplicationGmtc && (
                <div className="error">{t(formErrors.creditApplicationGmtc)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("creditApplicationGmtcVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="creditApplicationGmtcVerified"
        name="creditApplicationGmtcVerified"
        checked={verifiedData?.creditApplicationGmtcVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="creditApplicationGmtcVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="creditApplicationGmtc"
                name="creditApplicationGmtc"
                className="hidden-file-input"
                ref={fileInputRefs.creditApplicationGmtc}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "creditApplicationGmtc")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="creditApplicationGmtc"
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
              {tradingFilesToUpload?.creditApplicationGmtc && (
                <li
                  key={tradingFilesToUpload.creditApplicationGmtc.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.creditApplicationGmtc && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.creditApplicationGmtc);
  }}
                    >
                      {tradingFilesToUpload.creditApplicationGmtc.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("creditApplicationGmtc")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.creditApplicationGmtc &&
                !tradingFilesToUpload?.creditApplicationGmtc && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.creditApplicationGmtc,
                        "creditApplicationGmtc"
                      );
                    }}
                  >
                    {typeof customerData.creditApplicationGmtc === "string"
                      ? customerData.creditApplicationGmtc
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.creditApplicationGmtc && (
                <div className="file-actions">
                  {!tradingDocuments.creditApplicationGmtc &&
                    customerData?.creditApplicationGmtc && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.creditApplicationGmtc,
                            "creditApplicationGmtc"
                          );
                        }}
                      >
                        {typeof customerData.creditApplicationGmtc === "string"
                          ? customerData.creditApplicationGmtc
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Credit Application DAR */}
          <tr className="document-upload full-width" key="creditApplicationDar">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="creditApplicationDar">
                {t("Credit Application DAR")}
                {customerPaymentMethodsData?.methodDetails?.credit?.[Constants.ENTITY.DAR]?.isAllowed && (<span className="required-field">*</span>)}
                {customerData?.creditApplicationDar !==
                  originalCustomerData?.creditApplicationDar && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.creditApplicationDar && (
                <div className="error">{t(formErrors.creditApplicationDar)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("creditApplicationDarVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="creditApplicationDarVerified"
        name="creditApplicationDarVerified"
        checked={verifiedData?.creditApplicationDarVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="creditApplicationDarVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="creditApplicationDar"
                name="creditApplicationDar"
                className="hidden-file-input"
                ref={fileInputRefs.creditApplicationDar}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "creditApplicationDar")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="creditApplicationDar"
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
              {tradingFilesToUpload?.creditApplicationDar && (
                <li
                  key={tradingFilesToUpload.creditApplicationDar.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.creditApplicationDar && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.creditApplicationDar);
  }}
                    >
                      {tradingFilesToUpload.creditApplicationDar.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("creditApplicationDar")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.creditApplicationDar &&
                !tradingFilesToUpload?.creditApplicationDar && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.creditApplicationDar,
                        "creditApplicationDar"
                      );
                    }}
                  >
                    {typeof customerData.creditApplicationDar === "string"
                      ? customerData.creditApplicationDar
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.creditApplicationDar && (
                <div className="file-actions">
                  {!tradingDocuments.creditApplicationDar &&
                    customerData?.creditApplicationDar && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.creditApplicationDar,
                            "creditApplicationDar"
                          );
                        }}
                      >
                        {typeof customerData.creditApplicationDar === "string"
                          ? customerData.creditApplicationDar
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Credit Application VMCO */}
          <tr className="document-upload full-width" key="creditApplicationVmco">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="creditApplicationVmco">
                {t("Credit Application VMCO")}
                {customerPaymentMethodsData?.methodDetails?.credit?.[Constants.ENTITY.VMCO]?.isAllowed && (<span className="required-field">*</span>)}
                {customerData?.creditApplicationVmco !==
                  originalCustomerData?.creditApplicationVmco && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.creditApplicationVmco && (
                <div className="error">{t(formErrors.creditApplicationVmco)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("creditApplicationVmcoVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="creditApplicationVmcoVerified"
        name="creditApplicationVmcoVerified"
        checked={verifiedData?.creditApplicationVmcoVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="creditApplicationVmcoVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="creditApplicationVmco"
                name="creditApplicationVmco"
                className="hidden-file-input"
                ref={fileInputRefs.creditApplicationVmco}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "creditApplicationVmco")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="creditApplicationVmco"
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
              {tradingFilesToUpload?.creditApplicationVmco && (
                <li
                  key={tradingFilesToUpload.creditApplicationVmco.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.creditApplicationVmco && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.creditApplicationVmco);
  }}
                    >
                      {tradingFilesToUpload.creditApplicationVmco.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("creditApplicationVmco")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.creditApplicationVmco &&
                !tradingFilesToUpload?.creditApplicationVmco && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.creditApplicationVmco,
                        "creditApplicationVmco"
                      );
                    }}
                  >
                    {typeof customerData.creditApplicationVmco === "string"
                      ? customerData.creditApplicationVmco
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.creditApplicationVmco && (
                <div className="file-actions">
                  {!tradingDocuments.creditApplicationVmco &&
                    customerData?.creditApplicationVmco && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.creditApplicationVmco,
                            "creditApplicationVmco"
                          );
                        }}
                      >
                        {typeof customerData.creditApplicationVmco === "string"
                          ? customerData.creditApplicationVmco
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>
          </>
        
          )}
        </>
      ) : (
        <>
          {isV("assignedToEntityWise") && (
            <>
            

          {/* Contract Agreement SHC */}
          <tr className="document-upload full-width" key="contractAgreementShc">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="contractAgreementShc">
                {t("Contract Agreement SHC")}
                {/* <span className="required-field">*</span> */}
                {customerData?.contractAgreementShc !==
                  originalCustomerData?.contractAgreementShc && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.contractAgreementShc && (
                <div className="error">{t(formErrors.contractAgreementShc)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("contractAgreementShcVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="contractAgreementShcVerified"
        name="contractAgreementShcVerified"
        checked={verifiedData?.contractAgreementShcVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="contractAgreementShcVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="contractAgreementShc"
                name="contractAgreementShc"
                className="hidden-file-input"
                ref={fileInputRefs.contractAgreementShc}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "contractAgreementShc")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="contractAgreementShc"
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
              {tradingFilesToUpload?.contractAgreementShc && (
                <li
                  key={tradingFilesToUpload.contractAgreementShc.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.contractAgreementShc && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.contractAgreementShc);
  }}
                    >
                      {tradingFilesToUpload.contractAgreementShc.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("contractAgreementShc")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.contractAgreementShc &&
                !tradingFilesToUpload?.contractAgreementShc && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.contractAgreementShc,
                        "contractAgreementShc"
                      );
                    }}
                  >
                    {typeof customerData.contractAgreementShc === "string"
                      ? customerData.contractAgreementShc
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.contractAgreementShc && (
                <div className="file-actions">
                  {!tradingDocuments.contractAgreementShc &&
                    customerData?.contractAgreementShc && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.contractAgreementShc,
                            "contractAgreementShc"
                          );
                        }}
                      >
                        {typeof customerData.contractAgreementShc === "string"
                          ? customerData.contractAgreementShc
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Contract Agreement NAQI */}
          <tr className="document-upload full-width" key="contractAgreementNaqi">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="contractAgreementNaqi">
                {t("Contract Agreement NAQI")}
                {/* <span className="required-field">*</span> */}
                {customerData?.contractAgreementNaqi !==
                  originalCustomerData?.contractAgreementNaqi && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.contractAgreementNaqi && (
                <div className="error">{t(formErrors.contractAgreementNaqi)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("contractAgreementNaqiVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="contractAgreementNaqiVerified"
        name="contractAgreementNaqiVerified"
        checked={verifiedData?.contractAgreementNaqiVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="contractAgreementNaqiVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="contractAgreementNaqi"
                name="contractAgreementNaqi"
                className="hidden-file-input"
                ref={fileInputRefs.contractAgreementNaqi}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "contractAgreementNaqi")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="contractAgreementNaqi"
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
              {tradingFilesToUpload?.contractAgreementNaqi && (
                <li
                  key={tradingFilesToUpload.contractAgreementNaqi.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.contractAgreementNaqi && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.contractAgreementNaqi);
  }}
                    >
                      {tradingFilesToUpload.contractAgreementNaqi.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("contractAgreementNaqi")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.contractAgreementNaqi &&
                !tradingFilesToUpload?.contractAgreementNaqi && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.contractAgreementNaqi,
                        "contractAgreementNaqi"
                      );
                    }}
                  >
                    {typeof customerData.contractAgreementNaqi === "string"
                      ? customerData.contractAgreementNaqi
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.contractAgreementNaqi && (
                <div className="file-actions">
                  {!tradingDocuments.contractAgreementNaqi &&
                    customerData?.contractAgreementNaqi && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.contractAgreementNaqi,
                            "contractAgreementNaqi"
                          );
                        }}
                      >
                        {typeof customerData.contractAgreementNaqi === "string"
                          ? customerData.contractAgreementNaqi
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Contract Agreement GMTC */}
          <tr className="document-upload full-width" key="contractAgreementGmtc">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="contractAgreementGmtc">
                {t("Contract Agreement GMTC")}
                {/* <span className="required-field">*</span> */}
                {customerData?.contractAgreementGmtc !==
                  originalCustomerData?.contractAgreementGmtc && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.contractAgreementGmtc && (
                <div className="error">{t(formErrors.contractAgreementGmtc)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("contractAgreementGmtcVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="contractAgreementGmtcVerified"
        name="contractAgreementGmtcVerified"
        checked={verifiedData?.contractAgreementGmtcVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="contractAgreementGmtcVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="contractAgreementGmtc"
                name="contractAgreementGmtc"
                className="hidden-file-input"
                ref={fileInputRefs.contractAgreementGmtc}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "contractAgreementGmtc")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="contractAgreementGmtc"
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
              {tradingFilesToUpload?.contractAgreementGmtc && (
                <li
                  key={tradingFilesToUpload.contractAgreementGmtc.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.contractAgreementGmtc && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.contractAgreementGmtc);
  }}
                    >
                      {tradingFilesToUpload.contractAgreementGmtc.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("contractAgreementGmtc")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.contractAgreementGmtc &&
                !tradingFilesToUpload?.contractAgreementGmtc && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.contractAgreementGmtc,
                        "contractAgreementGmtc"
                      );
                    }}
                  >
                    {typeof customerData.contractAgreementGmtc === "string"
                      ? customerData.contractAgreementGmtc
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.contractAgreementGmtc && (
                <div className="file-actions">
                  {!tradingDocuments.contractAgreementGmtc &&
                    customerData?.contractAgreementGmtc && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.contractAgreementGmtc,
                            "contractAgreementGmtc"
                          );
                        }}
                      >
                        {typeof customerData.contractAgreementGmtc === "string"
                          ? customerData.contractAgreementGmtc
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Contract Agreement DAR */}
          <tr className="document-upload full-width" key="contractAgreementDar">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="contractAgreementDar">
                {t("Contract Agreement DAR")}
                {/* <span className="required-field">*</span> */}
                {customerData?.contractAgreementDar !==
                  originalCustomerData?.contractAgreementDar && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.contractAgreementDar && (
                <div className="error">{t(formErrors.contractAgreementDar)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("contractAgreementDarVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="contractAgreementDarVerified"
        name="contractAgreementDarVerified"
        checked={verifiedData?.contractAgreementDarVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="contractAgreementDarVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="contractAgreementDar"
                name="contractAgreementDar"
                className="hidden-file-input"
                ref={fileInputRefs.contractAgreementDar}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "contractAgreementDar")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="contractAgreementDar"
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
              {tradingFilesToUpload?.contractAgreementDar && (
                <li
                  key={tradingFilesToUpload.contractAgreementDar.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.contractAgreementDar && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.contractAgreementDar);
  }}
                    >
                      {tradingFilesToUpload.contractAgreementDar.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("contractAgreementDar")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.contractAgreementDar &&
                !tradingFilesToUpload?.contractAgreementDar && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.contractAgreementDar,
                        "contractAgreementDar"
                      );
                    }}
                  >
                    {typeof customerData.contractAgreementDar === "string"
                      ? customerData.contractAgreementDar
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.contractAgreementDar && (
                <div className="file-actions">
                  {!tradingDocuments.contractAgreementDar &&
                    customerData?.contractAgreementDar && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.contractAgreementDar,
                            "contractAgreementDar"
                          );
                        }}
                      >
                        {typeof customerData.contractAgreementDar === "string"
                          ? customerData.contractAgreementDar
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Contract Agreement VMCO */}
          <tr className="document-upload full-width" key="contractAgreementVmco">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="contractAgreementVmco">
                {t("Contract Agreement VMCO")}
                {/* <span className="required-field">*</span> */}
                {customerData?.contractAgreementVmco !==
                  originalCustomerData?.contractAgreementVmco && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.contractAgreementVmco && (
                <div className="error">{t(formErrors.contractAgreementVmco)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("contractAgreementVmcoVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="contractAgreementVmcoVerified"
        name="contractAgreementVmcoVerified"
        checked={verifiedData?.contractAgreementVmcoVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="contractAgreementVmcoVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="contractAgreementVmco"
                name="contractAgreementVmco"
                className="hidden-file-input"
                ref={fileInputRefs.contractAgreementVmco}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "contractAgreementVmco")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="contractAgreementVmco"
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
              {tradingFilesToUpload?.contractAgreementVmco && (
                <li
                  key={tradingFilesToUpload.contractAgreementVmco.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.contractAgreementVmco && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.contractAgreementVmco);
  }}
                    >
                      {tradingFilesToUpload.contractAgreementVmco.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("contractAgreementVmco")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.contractAgreementVmco &&
                !tradingFilesToUpload?.contractAgreementVmco && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.contractAgreementVmco,
                        "contractAgreementVmco"
                      );
                    }}
                  >
                    {typeof customerData.contractAgreementVmco === "string"
                      ? customerData.contractAgreementVmco
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.contractAgreementVmco && (
                <div className="file-actions">
                  {!tradingDocuments.contractAgreementVmco &&
                    customerData?.contractAgreementVmco && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.contractAgreementVmco,
                            "contractAgreementVmco"
                          );
                        }}
                      >
                        {typeof customerData.contractAgreementVmco === "string"
                          ? customerData.contractAgreementVmco
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Credit Application SHC */}
          <tr className="document-upload full-width" key="creditApplicationShc">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="creditApplicationShc">
                {t("Credit Application SHC")}
                {customerPaymentMethodsData?.methodDetails?.credit?.[Constants.ENTITY.SHC]?.isAllowed && (<span className="required-field">*</span>)}
                {customerData?.creditApplicationShc !==
                  originalCustomerData?.creditApplicationShc && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.creditApplicationShc && (
                <div className="error">{t(formErrors.creditApplicationShc)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("creditApplicationShcVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="creditApplicationShcVerified"
        name="creditApplicationShcVerified"
        checked={verifiedData?.creditApplicationShcVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="creditApplicationShcVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="creditApplicationShc"
                name="creditApplicationShc"
                className="hidden-file-input"
                ref={fileInputRefs.creditApplicationShc}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "creditApplicationShc")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="creditApplicationShc"
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
              {tradingFilesToUpload?.creditApplicationShc && (
                <li
                  key={tradingFilesToUpload.creditApplicationShc.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.creditApplicationShc && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.creditApplicationShc);
  }}
                    >
                      {tradingFilesToUpload.creditApplicationShc.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("creditApplicationShc")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.creditApplicationShc &&
                !tradingFilesToUpload?.creditApplicationShc && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.creditApplicationShc,
                        "creditApplicationShc"
                      );
                    }}
                  >
                    {typeof customerData.creditApplicationShc === "string"
                      ? customerData.creditApplicationShc
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.creditApplicationShc && (
                <div className="file-actions">
                  {!tradingDocuments.creditApplicationShc &&
                    customerData?.creditApplicationShc && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.creditApplicationShc,
                            "creditApplicationShc"
                          );
                        }}
                      >
                        {typeof customerData.creditApplicationShc === "string"
                          ? customerData.creditApplicationShc
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Credit Application NAQI */}
          <tr className="document-upload full-width" key="creditApplicationNaqi">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="creditApplicationNaqi">
                {t("Credit Application NAQI")}
                {customerPaymentMethodsData?.methodDetails?.credit?.[Constants.ENTITY.NAQI]?.isAllowed && (<span className="required-field">*</span>)}
                {customerData?.creditApplicationNaqi !==
                  originalCustomerData?.creditApplicationNaqi && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.creditApplicationNaqi && (
                <div className="error">{t(formErrors.creditApplicationNaqi)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("creditApplicationNaqiVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="creditApplicationNaqiVerified"
        name="creditApplicationNaqiVerified"
        checked={verifiedData?.creditApplicationNaqiVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="creditApplicationNaqiVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="creditApplicationNaqi"
                name="creditApplicationNaqi"
                className="hidden-file-input"
                ref={fileInputRefs.creditApplicationNaqi}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "creditApplicationNaqi")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="creditApplicationNaqi"
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
              {tradingFilesToUpload?.creditApplicationNaqi && (
                <li
                  key={tradingFilesToUpload.creditApplicationNaqi.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.creditApplicationNaqi && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.creditApplicationNaqi);
  }}
                    >
                      {tradingFilesToUpload.creditApplicationNaqi.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("creditApplicationNaqi")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.creditApplicationNaqi &&
                !tradingFilesToUpload?.creditApplicationNaqi && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.creditApplicationNaqi,
                        "creditApplicationNaqi"
                      );
                    }}
                  >
                    {typeof customerData.creditApplicationNaqi === "string"
                      ? customerData.creditApplicationNaqi
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.creditApplicationNaqi && (
                <div className="file-actions">
                  {!tradingDocuments.creditApplicationNaqi &&
                    customerData?.creditApplicationNaqi && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.creditApplicationNaqi,
                            "creditApplicationNaqi"
                          );
                        }}
                      >
                        {typeof customerData.creditApplicationNaqi === "string"
                          ? customerData.creditApplicationNaqi
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Credit Application GMTC */}
          <tr className="document-upload full-width" key="creditApplicationGmtc">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="creditApplicationGmtc">
                {t("Credit Application GMTC")}
                {customerPaymentMethodsData?.methodDetails?.credit?.[Constants.ENTITY.GMTC]?.isAllowed && (<span className="required-field">*</span>)}
                {customerData?.creditApplicationGmtc !==
                  originalCustomerData?.creditApplicationGmtc && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.creditApplicationGmtc && (
                <div className="error">{t(formErrors.creditApplicationGmtc)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("creditApplicationGmtcVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="creditApplicationGmtcVerified"
        name="creditApplicationGmtcVerified"
        checked={verifiedData?.creditApplicationGmtcVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="creditApplicationGmtcVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="creditApplicationGmtc"
                name="creditApplicationGmtc"
                className="hidden-file-input"
                ref={fileInputRefs.creditApplicationGmtc}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "creditApplicationGmtc")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="creditApplicationGmtc"
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
              {tradingFilesToUpload?.creditApplicationGmtc && (
                <li
                  key={tradingFilesToUpload.creditApplicationGmtc.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.creditApplicationGmtc && (
                    <a
                     href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.creditApplicationGmtc);
  }}
                    >
                      {tradingFilesToUpload.creditApplicationGmtc.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("creditApplicationGmtc")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.creditApplicationGmtc &&
                !tradingFilesToUpload?.creditApplicationGmtc && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.creditApplicationGmtc,
                        "creditApplicationGmtc"
                      );
                    }}
                  >
                    {typeof customerData.creditApplicationGmtc === "string"
                      ? customerData.creditApplicationGmtc
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.creditApplicationGmtc && (
                <div className="file-actions">
                  {!tradingDocuments.creditApplicationGmtc &&
                    customerData?.creditApplicationGmtc && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.creditApplicationGmtc,
                            "creditApplicationGmtc"
                          );
                        }}
                      >
                        {typeof customerData.creditApplicationGmtc === "string"
                          ? customerData.creditApplicationGmtc
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Credit Application DAR */}
          <tr className="document-upload full-width" key="creditApplicationDar">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="creditApplicationDar">
                {t("Credit Application DAR")}
                {customerPaymentMethodsData?.methodDetails?.credit?.[Constants.ENTITY.DAR]?.isAllowed && (<span className="required-field">*</span>)}
                {customerData?.creditApplicationDar !==
                  originalCustomerData?.creditApplicationDar && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.creditApplicationDar && (
                <div className="error">{t(formErrors.creditApplicationDar)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("creditApplicationDarVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="creditApplicationDarVerified"
        name="creditApplicationDarVerified"
        checked={verifiedData?.creditApplicationDarVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="creditApplicationDarVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="creditApplicationDar"
                name="creditApplicationDar"
                className="hidden-file-input"
                ref={fileInputRefs.creditApplicationDar}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "creditApplicationDar")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="creditApplicationDar"
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
              {tradingFilesToUpload?.creditApplicationDar && (
                <li
                  key={tradingFilesToUpload.creditApplicationDar.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.creditApplicationDar && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.creditApplicationDar);
  }}
                    >
                      {tradingFilesToUpload.creditApplicationDar.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("creditApplicationDar")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.creditApplicationDar &&
                !tradingFilesToUpload?.creditApplicationDar && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.creditApplicationDar,
                        "creditApplicationDar"
                      );
                    }}
                  >
                    {typeof customerData.creditApplicationDar === "string"
                      ? customerData.creditApplicationDar
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.creditApplicationDar && (
                <div className="file-actions">
                  {!tradingDocuments.creditApplicationDar &&
                    customerData?.creditApplicationDar && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.creditApplicationDar,
                            "creditApplicationDar"
                          );
                        }}
                      >
                        {typeof customerData.creditApplicationDar === "string"
                          ? customerData.creditApplicationDar
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>

          {/* Credit Application VMCO */}
          <tr className="document-upload full-width" key="creditApplicationVmco">
            <td
              className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
            >
              <label htmlFor="creditApplicationVmco">
                {t("Credit Application VMCO")}
                {customerPaymentMethodsData?.methodDetails?.credit?.[Constants.ENTITY.VMCO]?.isAllowed && (<span className="required-field">*</span>)}
                {customerData?.creditApplicationVmco !==
                  originalCustomerData?.creditApplicationVmco && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
              </label>
              {formErrors?.creditApplicationVmco && (
                <div className="error">{t(formErrors.creditApplicationVmco)}</div>
              )}
            </td>
            <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("creditApplicationVmcoVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="creditApplicationVmcoVerified"
        name="creditApplicationVmcoVerified"
        checked={verifiedData?.creditApplicationVmcoVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="creditApplicationVmcoVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
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
                accept=".pdf"
                id="creditApplicationVmco"
                name="creditApplicationVmco"
                className="hidden-file-input"
                ref={fileInputRefs.creditApplicationVmco}
                onChange={(e) =>
                  handleTradingDocumentChange(e, "creditApplicationVmco")
                }
                required
                disabled={mode === "edit"
                  && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
                }
              />
              <label
                htmlFor="creditApplicationVmco"
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
              {tradingFilesToUpload?.creditApplicationVmco && (
                <li
                  key={tradingFilesToUpload.creditApplicationVmco.name}
                  className="uploaded-file-item"
                >
                  {tradingFilePreviews?.creditApplicationVmco && (
                    <a
                      href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(tradingFilePreviews.creditApplicationVmco);
  }}
                    >
                      {tradingFilesToUpload.creditApplicationVmco.name}
                    </a>
                  )}
                  <button
                    type="button"
                    className="delete-file-button"
                    onClick={() => removeTradingFile("creditApplicationVmco")}
                  >
                    ×
                  </button>
                </li>
              )}
              {tradingFilePreviews?.creditApplicationVmco &&
                !tradingFilesToUpload?.creditApplicationVmco && (
                  <a
                    href="#"
                    className="file-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewFile(
                        customerData.id,
                        customerData.creditApplicationVmco,
                        "creditApplicationVmco"
                      );
                    }}
                  >
                    {typeof customerData.creditApplicationVmco === "string"
                      ? customerData.creditApplicationVmco
                          .split("_")
                          .slice(0, 2)
                          .join(" ")
                      : "View Document"}
                  </a>
                )}
              {customerData?.creditApplicationVmco && (
                <div className="file-actions">
                  {!tradingDocuments.creditApplicationVmco &&
                    customerData?.creditApplicationVmco && (
                      <a
                        href="#"
                        className="file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewFile(
                            customerData.id,
                            customerData.creditApplicationVmco,
                            "creditApplicationVmco"
                          );
                        }}
                      >
                        {typeof customerData.creditApplicationVmco === "string"
                          ? customerData.creditApplicationVmco
                              .split("_")
                              .slice(0, 2)
                              .join(" ")
                          : "View Document"}
                      </a>
                    )}
                </div>
              )}
            </td>
          </tr>
          </>
        
          )}
          {/* Non-Trading Documents */}
          <div className="form-header full-width">
                {t("Non-Trading Documents")}
                {customerData?.nonTradingDocuments?.length !==
                  originalCustomerData?.nonTradingDocuments?.length && mode === "edit" && (
                  <span className="update-badge">Updated</span>
                )}
                </div>
          <tr className="document-upload full-width"
            key={"nonTradingDocuments"}>
  <td className="label-cell"
              style={{
                whiteSpace: "nowrap",
                paddingRight: "16px",
                verticalAlign: "top",
              }}
              hidden={mode === "edit"}>
                
    <SearchableDropdown
      options={nonTradingDocumentTypes}
      value={selectedDocType}
      onChange={handleNonTradingDropdownChange}
      placeholder={t("Select document type")}
    />
    
    {selectedDocType === "Others (Specify)" && (
      <input
        type="text"
onFocus={() => {
       if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
   
    
  }}
onKeyDown={handleKeyDown}
  onBlur={() => {
   
      document.body.classList.remove('keyboard-open');
       // 👈 show menu again (optional)
  }}
    
        value={customDocName}
        onChange={(e) => setCustomDocName(e.target.value)}
        placeholder="Enter document name"
        style={{
          padding: "8px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          width: "250px",
          marginTop: "2px",
        }}
      />
    )}
  </td>
              <div className="input-with-verification">
          {/* <td
          className="upload-cell"
          style={{
            whiteSpace: "nowrap",
            paddingRight: "16px",
            verticalAlign: "top",
          }}
        > */}
          {isV("nonTradingDocumentsVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="nonTradingDocumentsVerified"
        name="nonTradingDocumentsVerified"
        checked={verifiedData?.nonTradingDocumentsVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="nonTradingDocumentsVerified">Verified</label>
      </div>)}
        {/* </td> */}
        </div>
            {mode !== "edit" && (<td
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
                ref={fileInputRefs.nonTradingDocuments}
                onChange={handleNonTradingDocumentsChange}
                disabled={user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR && mode === "edit" || !selectedDocType || (selectedDocType === "Others (Specify)" && !customDocName)}
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
            </td>)}
            <td className="file-display-cell">
              {/* Display uploaded files with delete option */}
              {nonTradingFilesToUpload?.["others"]?.length > 0 && (
                <div className="uploaded-files-container">
                  <h4>{t("Uploaded Files")}:</h4>
                  <ul className="uploaded-files-list">
                    {nonTradingFilesToUpload["others"].map((file, index) => (
                      <li key={index} className="uploaded-file-item">
                        <a
                          href="#"
                  // target="_blank"
                  // rel="noopener noreferrer"
                  className="file-link"
                  style={{ marginLeft: 8 }}
                  onClick={(e) => {
    e.preventDefault();
    openUrlSmart(nonTradingFilePreviews[file.name]);
  }}
                        >
                          {file.name}
                        </a>

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
            >
              {" "}
            </td>
            {mode !== "edit" && (<td
              className="label-cell"
              style={{
                width: "500px",
                paddingRight: "500px",
                verticalAlign: "top",
              }}
            >
              {" "}
            </td>)}
            <td className="file-display-cell">
              {/* Display already uploaded files from customerData */}
              {Array.isArray(customerData?.nonTradingDocuments) &&
                customerData.nonTradingDocuments.length > 0 && (
                  <div className="uploaded-files-container">
                    <ul className="uploaded-files-list">
                      {customerData.nonTradingDocuments
                        .filter(
                          (fileName) =>
                            !originalCustomerData?.nonTradingDocuments?.includes(
                              fileName
                            )
                        )
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
                                );
                              }}
                            >
                              {typeof fileName === "string"
                                ? fileName.split("_").slice(0, fileName.split("_").length - 1).join(" ")
                                : "View Document"}
                            </a>
                          </li>
                        ))}
                    </ul>
                    <h4>{t("Previously Uploaded Files")}:</h4>
                    <ul className="uploaded-files-list">
                      {customerData.nonTradingDocuments
                        .filter((fileName) =>
                          originalCustomerData?.nonTradingDocuments?.includes(
                            fileName
                          )
                        )
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
                                );
                              }}
                            >
                              {typeof fileName === "string"
                                ? fileName.split("_").slice(0, fileName.split("_").length - 1).join(" ")
                                : "View Document"}
                            </a>
                            {mode === "edit" && (
                              <button
                                type="button"
                                className="delete-file-button"
                                onClick={() => removeFile(idx)}
                              >
                                ×
                              </button>
                            )}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
            </td>
          </tr>
        </>
      )}
      {popupUrl && (
  <div
    className="image-popup-overlay"
    onClick={() => setPopupUrl(null)}
  >
    <div
      className="image-popup-content"
      onClick={(e) => e.stopPropagation()}
    >
      <iframe
        src={popupUrl}
        title="Popup Browser"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
      />

      <button
        className="image-popup-close"
        onClick={() => setPopupUrl(null)}
      >
        ×
      </button>
    </div>
  </div>
)}

    </div>
  );
}

export default Documents;
