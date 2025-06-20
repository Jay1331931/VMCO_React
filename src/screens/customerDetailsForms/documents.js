import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/forms.css";
import { not } from "ajv/dist/compile/codegen";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
function Documents({
  isTrading = true,
  tradingFilesToUpload = {},
  nonTradingFilesToUpload = {},
  customerData = {},
}) {
  const { t } = useTranslation();
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
      nonTradingFilesToUpload["others"] = [...newFiles, ...nonTradingFiles];
      console.log("Updated nonTradingFilesToUpload:", nonTradingFilesToUpload);
    }
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
      ).then((res) => res.json())
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
      window.open(fileURL, "_blank");

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
      {/* Documents Header */}
      <div className="form-header full-width">{t("Documents")}</div>
      <div className="form-group" />
      <div className="form-header full-width">
        {t("Download terms & conditions and upload duly signed document")}
      </div>

      {/* Common Fields */}
      <div className="form-group file-upload">
        <label htmlFor="acknowledgementSignature">
          {t("Upload duly signed document")}
          <span className="required-field">*</span>
        </label>
        <input
          type="file"
          id="acknowledgementSignature"
          name="acknowledgementSignature"
          className="text-field small"
          onChange={(e) =>
            handleTradingDocumentChange(e, "acknowledgementSignature")
          }
          accept=".pdf,.doc,.docx,.jpg,.png"
          required
        />
        {customerData?.acknowledgementSignature && (
          <div className="file-actions">
            {tradingDocuments.acknowledgementSignature && (
              <a
                href="#"
                className="file-link"
                // onClick={(e) => {
                //   e.preventDefault();
                //   viewFile("acknowledgementSignature");
                // }}
              >
                {tradingDocuments.acknowledgementSignature.name}
              </a>
            )}

            {!tradingDocuments.acknowledgementSignature &&
              customerData?.acknowledgementSignature && (
                <a
                  href="#"
                  className="file-link"
                  onClick={() =>
                    handleViewFile(
                      customerData.id,
                      customerData.acknowledgementSignature,
                      "acknowledgementSignature"
                    )
                  }
                >
                  {/* Extract filename from path if needed */}
                  {typeof customerData.acknowledgementSignature === "string"
                    ? customerData.acknowledgementSignature
                        .split("_")
                        .slice(0, 2)
                        .join(" ")
                    : "View Document"}
                </a>
              )}
          </div>
        )}
      </div>

      {isTrading ? (
        <>
          <div className="form-group file-upload">
            <label htmlFor="crCertificate">
              {t("Copy of Commercial Registration")}
              <span className="required-field">*</span>
            </label>
            <input
              type="file"
              id="crCertificate"
              name="crCertificate"
              className="text-field small"
              onChange={(e) => handleTradingDocumentChange(e, "crCertificate")}
              required
            />
          </div>
          <div className="form-group file-upload">
            <label htmlFor="vatCertificate">
              {t("Copy of VAT Certificate")}
              <span className="required-field">*</span>
            </label>
            <input
              type="file"
              id="vatCertificate"
              name="vatCertificate"
              className="text-field small"
              onChange={(e) => handleTradingDocumentChange(e, "vatCertificate")}
              required
            />
          </div>
          <div className="form-group file-upload">
            <label htmlFor="nationalId">
              {t("Copy of national ID/Iqama of the auth. sign..")}
              <span className="required-field">*</span>
            </label>
            <input
              type="file"
              id="nationalId"
              name="nationalId"
              className="text-field small"
              onChange={(e) => handleTradingDocumentChange(e, "nationalId")}
              required
            />
          </div>
          <div className="form-group file-upload">
            <label htmlFor="bankLetter">
              {t("Bank details on company letterhead")}
              <span className="required-field">*</span>
            </label>
            <input
              type="file"
              id="bankLetter"
              name="bankLetter"
              className="text-field small"
              onChange={(e) => handleTradingDocumentChange(e, "bankLetter")}
              required
            />
          </div>
          <div className="form-group file-upload">
            <label htmlFor="nationalAddress">
              {t("Copy of National Address")}
              <span className="required-field">*</span>
            </label>
            <input
              type="file"
              id="nationalAddress"
              name="nationalAddress"
              className="text-field small"
              onChange={(e) =>
                handleTradingDocumentChange(e, "nationalAddress")
              }
              required
            />
          </div>
          <div className="form-group file-upload">
            <label htmlFor="contractAgreement">
              {t("Contract Agreement")}
              <span className="required-field">*</span>
            </label>
            <input
              type="file"
              id="contractAgreement"
              name="contractAgreement"
              className="text-field small"
              onChange={(e) =>
                handleTradingDocumentChange(e, "contractAgreement")
              }
              required
            />
          </div>
          <div className="form-group file-upload">
            <label htmlFor="creditApplication">
              {t("Credit Application")}
              <span className="required-field">*</span>
            </label>
            <input
              type="file"
              id="creditApplication"
              name="creditApplication"
              className="text-field small"
              onChange={(e) =>
                handleTradingDocumentChange(e, "creditApplication")
              }
              required
            />
          </div>
        </>
      ) : (
        <>
          <div className="form-group file-upload">
            <label htmlFor="contractAgreement">
              {t("Contract Agreement")}
              <span className="required-field">*</span>
            </label>
            <input
              type="file"
              id="contractAgreement"
              name="contractAgreement"
              className="text-field small"
              onChange={(e) =>
                handleTradingDocumentChange(e, "contractAgreement")
              }
              required
            />
          </div>
          <div className="form-group file-upload">
            <label htmlFor="creditApplication">
              {t("Credit Application")}
              <span className="required-field">*</span>
            </label>
            <input
              type="file"
              id="creditApplication"
              name="creditApplication"
              className="text-field small"
              onChange={(e) =>
                handleTradingDocumentChange(e, "creditApplication")
              }
              required
            />
          </div>
          <div className="form-group file-upload">
            <label htmlFor="nonTradingDocuments">
              {t("Non-Trading Documents")}
              <span style={{ color: "#aaa", marginLeft: 4 }}>
                ({t("Upload additional documents for non-trading companies")})
              </span>
            </label>
            <input
              type="file"
              id="nonTradingDocuments"
              name="nonTradingDocuments"
              className="text-field small"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.png"
              onChange={handleNonTradingDocumentsChange}
            />

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
          </div>
        </>
      )}
    </div>
  );
}

export default Documents;
