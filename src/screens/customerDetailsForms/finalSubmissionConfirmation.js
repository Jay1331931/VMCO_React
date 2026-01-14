import React, { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPen } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import RbacManager from "../../utilities/rbac";
import SignatureCanvas from "react-signature-canvas";
import Swal from "sweetalert2";
import usePlatform from "../../utilities/platform";


const FinalSubmissionConfirmation = ({
  customerData = {},
  originalCustomerData = {},
  onChangeCustomerData,
  verifiedData = {},
  onChangeVerifiedData,
  formErrors = {},
  setTabsHeight,
  mode,
  signatureToUpload = {},
}) => {
  const { t } = useTranslation();
  const { token, user, isAuthenticated, logout, loading } = useAuth();
  const isMobile = usePlatform();

  const rbacMgr = new RbacManager(
    user?.userType == "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    mode === "add" || customerData?.customerStatus === "new"
      ? "custDetailsAdd"
      : "custDetailsEdit"
  );

  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  const sigCanvasRef = useRef();
  const [signaturePreviews, setSignaturePreviews] = useState({
    declarationSignature: null,
  });

  useEffect(() => {
    setTabsHeight("auto");
  }, []);

  // Add this useEffect to track mouse movement
  useEffect(() => {
    const canvas = sigCanvasRef.current.getCanvas();
    const cursor = document.querySelector(".fa-cursor");

    const handleMouseMove = (e) => {
      if (!cursor) return;
      const offsetX = 10;
      const offsetY = 18;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left + offsetX;
      const y = e.clientY - rect.top + offsetY;

      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
    };

    const handleMouseEnter = () => {
      cursor.style.display = "block";
    };

    const handleMouseLeave = () => {
      cursor.style.display = "none";
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseenter", handleMouseEnter);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseenter", handleMouseEnter);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Handle signature save
  // const handleSaveSignature = () => {
  //   if (sigCanvasRef.current.isEmpty()) {
  //     alert(t("Please provide a signature first"));
  //     return;
  //   }

  //   // Convert canvas to blob
  //   sigCanvasRef.current.getTrimmedCanvas().toBlob((blob) => {
  //     // Generate a filename
  //     const fileName = `signature_${Date.now()}.png`;

  //     // Add to signatureToUpload
  //     signatureToUpload.declarationSignature = new File([blob], fileName, { type: "image/png" });

  //     // Save file name in customerData for display
  //     onChangeCustomerData({
  //       target: { name: "declarationSignature", value: fileName },
  //     });

  //     // Generate preview URL
  //     const previewUrl = URL.createObjectURL(blob);
  //     setSignaturePreviews((prev) => {
  //       // Clean up previous URL if exists
  //       if (prev.declarationSignature) URL.revokeObjectURL(prev.declarationSignature);
  //       return { ...prev, declarationSignature: previewUrl };
  //     });
  //   }, "image/png");
  // };
  const handleSaveSignature = () => {
    if (sigCanvasRef.current.isEmpty()) {
      // alert(t("Please provide a signature first"));
      Swal.fire({
        // title: "Error",
        text: "Please provide a signature first",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Get the canvas element directly
    const canvas = sigCanvasRef.current.getCanvas();

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL("image/png");

    // Convert data URL to blob
    fetch(dataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        // Generate a filename
        const fileName = `signature_${Date.now()}.png`;

        // Add to signatureToUpload
        signatureToUpload.declarationSignature = new File([blob], fileName, {
          type: "image/png",
        });

        // Save file name in customerData for display
        onChangeCustomerData({
          target: { name: "declarationSignature", value: fileName },
        });

        // Use data URL directly for preview (no need to revoke as it's not an object URL)
        setSignaturePreviews((prev) => ({
          ...prev,
          declarationSignature: dataUrl,
        }));
      })
      .catch((error) => {
        console.error("Error saving signature:", error);
        alert(t("Failed to save signature. Please try again."));
      });
  };
  // Clear signature
  const handleClearSignature = () => {
    sigCanvasRef.current.clear();
    setSignaturePreviews((prev) => {
      if (prev.declarationSignature)
        URL.revokeObjectURL(prev.declarationSignature);
      return { ...prev, declarationSignature: null };
    });
    handleSignatureDelete("declarationSignature");
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
      target: {
        name: signatureType,
        value: originalCustomerData[signatureType] || "",
      },
    });
    delete signatureToUpload[signatureType];
  };

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // View signature
  const handleViewSignature = async (customerId, fileName, fileType) => {
    let fileURL = "";
    try {
      const response = await fetch(
        `${API_BASE_URL}/customers/getfile/${customerId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fileType, fileName }),
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
      customerData.declarationDate = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
    }
    // eslint-disable-next-line
  }, []);

  return (
    <>
      <div className="customer-onboarding-form-grid">
        {user?.userType.toLowerCase() === "employee" && (
          <div className="form-main-header">
            {t("ERP ID")}: {customerData?.erpCustId ?? "-"}
          </div>
        )}
        <h3 style={isMobile ? { textAlign: "center" } : {}}>{t("Final Submission")}</h3>
        <div className="form-header full-width" style={isMobile ? { textAlign: "justify" } : {}}>
          {t(
            "I hereby confirm that all the information provided is accurate and up-to-date. I understand that any discrepancies may result in the rejection of this onboarding application."
          )}
        </div>
        <div className="form-group">
          <label htmlFor="confirmationName">
            {t("Name")}
            <span className="required-field">*</span>
          </label>
          <div className="input-with-verification">
            <input
              type="text"
              id="declarationName"
              name="declarationName"
              style={{ width: "100%" }}
              value={customerData.declarationName || ""}
              onChange={onChangeCustomerData}
              required
              disabled={mode === "edit" || isE("declarationName")}
              className={isMobile ? "text-field small" : ""}
            />
            {isV("declarationNameVerified") &&
              // (originalCustomerData &&
              //     customerData &&
              //     originalCustomerData?.companyNameEn !==
              //       customerData?.companyNameEn &&
              //     mode === "edit") ||
              mode === "edit" &&
              customerData?.customerStatus === "pending" && (
                <div className="verification-checkbox">
                  <input
                    type="checkbox"
                    id="declarationNameVerified"
                    name="declarationNameVerified"
                    checked={verifiedData?.declarationNameVerified || false}
                    onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                  />
                  <label htmlFor="declarationNameVerified">Verified</label>
                </div>
              )}
          </div>
          {formErrors?.declarationName && (
            <div className="error">{t(formErrors.declarationName)}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmationDate">{t("Date")}</label>
          <div className="input-with-verification">
            <input
              type="date"
              id="confirmationDate"
              name="date"
              style={{ width: "100%" }}
              value={
                customerData?.declarationDate
                  ? new Date(customerData.declarationDate).toLocaleDateString(
                    "en-CA"
                  )
                  : new Date().toLocaleDateString("en-CA")
              }
              className={isMobile ? "text-field small" : ""}
              readOnly
              disabled
            />
            {isV("confirmationDateVerified") &&
              // (originalCustomerData &&
              //     customerData &&
              //     originalCustomerData?.companyNameEn !==
              //       customerData?.companyNameEn &&
              //     mode === "edit") ||
              mode === "edit" &&
              customerData?.customerStatus === "pending" && (
                <div className="verification-checkbox">
                  <input
                    type="checkbox"
                    id="confirmationDateVerified"
                    name="confirmationDateVerified"
                    checked={verifiedData?.confirmationDateVerified || false}
                    onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                  />
                  <label htmlFor="confirmationDateVerified">Verified</label>
                </div>
              )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmationSignature">
            {t("Signature")}
            {/* <span className="required-field">*</span> */}
          </label>

          {/* Signature Canvas */}
          {/* <div className="signature-container">
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: "#f8f8f8",
              marginBottom: "10px",
            }}
          >
            <SignatureCanvas
              ref={sigCanvasRef}
              penColor="blue"
              canvasProps={{
                width: 400,
                height: 150,
                className: "signature-canvas",
              }}
            />
          </div>

          <div className="signature-buttons">
            <button
              type="button"
              onClick={handleSaveSignature}
              disabled={
                (mode === "edit" &&
                  customerData?.customerStatus === "pending") ||
                isE("declarationName")
              }
              className="custom-file-button"
            >
              {t("Save Signature")}
            </button>
            <button
              type="button"
              onClick={handleClearSignature}
              disabled={
                (mode === "edit" &&
                  customerData?.customerStatus === "pending") ||
                isE("declarationName")
              }
              style={{ marginLeft: "10px" }}
              className="custom-file-button"
            >
              {t("Clear")}
            </button>
          </div>
        </div> */}

          <div className="signature-container">
            <div className="signature-wrapper">
              <p className="signature-hint">{t("Click and drag to sign")}</p>
              <SignatureCanvas
                ref={sigCanvasRef}
                penColor="black"
                minWidth={0.5}
                maxWidth={1.5}
                dotSize={0.2}
                canvasProps={{
                  width: 400,
                  height: 150,
                  className: "signature-canvas-fa",
                }}
              />
              <div className="fa-cursor">
                <FontAwesomeIcon icon={faPen} />
              </div>
            </div>

            <div className="signature-buttons">
              <button
                type="button"
                onClick={handleSaveSignature}
                disabled={
                  (mode === "edit" &&
                    customerData?.customerStatus === "pending") ||
                  isE("declarationName")
                }
                style={isMobile ? { width: "100%" } : {}}
                className="custom-file-button"
              >
                {t("Confirm Signature")}
              </button>
              <button
                type="button"
                onClick={handleClearSignature}
                disabled={
                  (mode === "edit" &&
                    customerData?.customerStatus === "pending") ||
                  isE("declarationName")
                }
                style={isMobile ? { width: "100%" } : {}}
                className="custom-file-button"
              >
                {t("Clear")}
              </button>
            </div>
          </div>

          {/* Show preview if signature is saved but not yet submitted */}
          {signaturePreviews.declarationSignature && (
            <div className="signature-preview">
              <img
                src={signaturePreviews.declarationSignature}
                alt="Signature Preview"
                style={{
                  maxWidth: 200,
                  maxHeight: 80,
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
                    if (prev.declarationSignature)
                      URL.revokeObjectURL(prev.declarationSignature);
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

          {/* Show uploaded signature as link if present and no preview */}
          {!signaturePreviews.declarationSignature &&
            customerData?.declarationSignature && (
              <div className="signature-preview">
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
                    : "View Signature"}
                </a>
                <button
                  type="button"
                  className="delete-file-button"
                  onClick={() => handleSignatureDelete("declarationSignature")}
                  style={{ marginLeft: 8, fontSize: "15px" }}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
                <div className="input-with-verification">
                  {isV("declarationSignatureVerified") &&
                    // (originalCustomerData &&
                    //     customerData &&
                    //     originalCustomerData?.companyNameEn !==
                    //       customerData?.companyNameEn &&
                    //     mode === "edit") ||
                    mode === "edit" &&
                    customerData?.customerStatus === "pending" && (
                      <div className="verification-checkbox">
                        <input
                          type="checkbox"
                          id="declarationSignatureVerified"
                          name="declarationSignatureVerified"
                          checked={
                            verifiedData?.declarationSignatureVerified || false
                          }
                          onChange={onChangeVerifiedData}
                        // className="verified-checkbox"
                        />
                        <label htmlFor="declarationSignatureVerified">
                          Verified
                        </label>
                      </div>
                    )}
                </div>
              </div>
            )}
          {formErrors?.declarationSignature && (
            <div className="error">{t(formErrors.declarationSignature)}</div>
          )}
        </div>

        {isV("assignedToEntityWise") && (
          <>
            <div className="form-header full-width">
              {t(
                "I hereby verify all customer information and declare that the details provided by the customer have been verified."
              )}
            </div>
            <div className="form-group">
              <label htmlFor="confirmationName">
                {t("Name")}
                <span className="required-field">*</span>
              </label>
              <div className="input-with-verification">
                <input
                  type="text"
                  id="verifiedBy"
                  name="verifiedBy"
                  value={customerData.verifiedBy || user?.userName}
                  onChange={onChangeCustomerData}
                  required
                  disabled={isE("declarationName")}
                  className={isMobile ? "text-field small" : ""}
                />
                {/* {isV("declarationNameVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="declarationNameVerified"
        name="declarationNameVerified"
        checked={verifiedData?.declarationNameVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="declarationNameVerified">Verified</label>
      </div>)} */}
              </div>
              {formErrors?.verifiedBy && (
                <div className="error">{t(formErrors.verifiedBy)}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmationDate">{t("Date")}</label>
              <div className="input-with-verification">
                <input
                  type="date"
                  id="confirmationDate"
                  name="date"
                  value={
                    customerData?.verified
                      ? new Date(customerData.verified).toLocaleDateString(
                        "en-CA"
                      )
                      : new Date().toLocaleDateString("en-CA")
                  }
                  className={isMobile ? "text-field small" : ""}
                  readOnly
                  disabled
                />
                {/* {isV("confirmationDateVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="confirmationDateVerified"
        name="confirmationDateVerified"
        checked={verifiedData?.confirmationDateVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="confirmationDateVerified">Verified</label>
      </div>)} */}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default FinalSubmissionConfirmation;
