import React, { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import RbacManager from "../../utilities/rbac";

const FinalSubmissionConfirmation = ({
  customerData = {},
  originalCustomerData = {},
  onChangeCustomerData,
  formErrors = {},
  mode,
  signatureToUpload = {},
}) => {
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
    
  const signatureInputRef = useRef();
  const [signaturePreviews, setSignaturePreviews] = useState({
    declarationSignature: null,
  });

  // Handle signature file selection
  const handleSignatureChange = (e, signatureType) => {
    const file = e.target.files[0];
    if (!file) return;
    // Optional: file size check (e.g., 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert(t("File size exceeds 2MB."));
      return;
    }
    signatureToUpload[signatureType] = file;
    // Save file name in customerData for display
    onChangeCustomerData({
      target: { name: signatureType, value: file.name },
    });

    // Generate preview URL
    const previewUrl = URL.createObjectURL(file);
    setSignaturePreviews((prev) => {
      // Clean up previous URL if exists
      if (prev[signatureType]) URL.revokeObjectURL(prev[signatureType]);
      return { ...prev, [signatureType]: previewUrl };
    });
  };

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(signaturePreviews).forEach(
        (url) => url && URL.revokeObjectURL(url)
      );
    };
  }, [signaturePreviews]);

  // Remove signature (clear from state and upload queue)
  const handleSignatureDelete = (signatureType) => {
    onChangeCustomerData({
      target: { name: signatureType, value: originalCustomerData[signatureType] || "" },
    });
    delete signatureToUpload[signatureType];
    // Reset the file input value so the same file can be uploaded again
    if (signatureInputRef.current) {
      signatureInputRef.current.value = "";
    }
  };

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // View signature (same as handleViewFile in documents.js)
  const handleViewSignature = async (customerId, fileName, fileType) => {
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
      );
      const res = await response.json();
      if (res.status === "Ok") {
        fileURL = res.data.url;
        window.open(fileURL, "_blank", "noopener,noreferrer");
      } else {
        throw new Error("Failed to fetch file URL");
      }
    } catch (error) {
      console.error("Error viewing file:", error);
    }
  };
  // Auto-capture date on mount if not set
  useEffect(() => {
    if (!customerData.declarationDate) {
    //   setConfirmationData((prev) => ({
    //     ...prev,
    //     date: new Date().toISOString().slice(0, 10),
    //   }));
    customerData.declarationDate = new Date().toISOString();
    }
    // eslint-disable-next-line
  }, []);

  return (
    <div className="customer-onboarding-form-grid">
      <h3>{t("Final Submission")}</h3>
      <div className="form-header full-width">
        {t(
          "I hereby confirm that all the information provided is accurate and up-to-date. I understand that any discrepancies may result in the rejection of this onboarding application."
        )}
      </div>
      <div className="form-group">
        <label htmlFor="confirmationName">
          {t("Name")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="declarationName"
          name="declarationName"
          value={customerData.declarationName || ""}
          onChange={onChangeCustomerData}
          required
          disabled={mode === "edit" || isE("declarationName")}
        />
        {formErrors?.declarationName && <div className="error">{formErrors.declarationName}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="confirmationDate">{t("Date")}</label>
        <input
          type="date"
          id="confirmationDate"
          name="date"
          value={customerData?.declarationDate?.slice(0, 10) || new Date().toISOString().slice(0, 10)}
          readOnly
          disabled
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirmationSignature">
          {t("Signature")}
          <span className="required-field">*</span>
        </label>
        <input
          type="file"
          id="declarationSignature"
          name="declarationSignature"
          accept="image/*"
          style={{ display: "none" }}
          ref={signatureInputRef}
          onChange={(e) => handleSignatureChange(e, "declarationSignature")}
          required
          disabled={mode === "edit" && customerData?.customerStatus !== "pending"}
        />
        <button
                  type="button"
                  className="custom-file-button"
                  onClick={() => signatureInputRef.current?.click()}
                  disabled={
                    (mode === "edit" && customerData?.customerStatus === "pending") || isE("declarationName")
                  }
                  style={{ width: "100px" }}
                >
                  {t("Upload")}
                </button>
                {/* Show preview if file is selected but not saved */}
                {signaturePreviews.declarationSignature && (
                  <div className="logo-preview">
                    <img
                      src={signaturePreviews.declarationSignature}
                      alt="Signature Preview"
                      style={{
                        maxWidth: 120,
                        maxHeight: 120,
                        marginTop: 8,
                        border: "1px solid #ccc",
                        borderRadius: 4,
                      }}
                    />
                    <button
                      type="button"
                      className="delete-file-button"
                      onClick={() => {
                        setSignaturePreviews((prev) => {
                          if (prev.declarationSignature) URL.revokeObjectURL(prev.declarationSignature);
                          return { ...prev, declarationSignature: null };
                        });
                        handleSignatureDelete("declarationSignature");
                      }}
                      style={{ marginLeft: 8, fontSize: "20px" }}
                    >
                      ×
                    </button>
                  </div>
                )}
                {/* Show uploaded file name as link if present and no preview */}
                {!signaturePreviews.declarationSignature && customerData?.declarationSignature && (
                  <div className="logo-preview">
                    <a
                      href="#"
                      className="file-link"
                      onClick={(e) => {
                        e.preventDefault();
                        handleViewSignature(
                          customerData.id,
                          customerData.declarationSignature,
                          "declarationSignature"
                        );
                      }}
                      style={{ marginRight: 8 }}
                    >
                      {typeof customerData.declarationSignature === "string"
                        ? (() => {
                            const name = customerData.declarationSignature
                              .split("_")
                              .slice(0, 2)
                              .join(" ");
                            const maxLen = 20;
                            return name.length > maxLen
                              ? name.substring(0, maxLen) + "..."
                              : name;
                          })()
                        : "View Document"}
                    </a>
                    {/* <button
                      type="button"
                      className="delete-file-button"
                      onClick={() => handleSignatureDelete("declarationSignature")}
                      style={{ marginLeft: 8, fontSize: "15px" }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button> */}
                  </div>
                )}
                {formErrors?.declarationSignature && (
                  <div className="error">{formErrors.declarationSignature}</div>
                )}
              </div>
            </div>
          );
        };

export default FinalSubmissionConfirmation;