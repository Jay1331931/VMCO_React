import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  fetchDropdownFromBasicsMaster,
  getOptionsFromEmployeesWithManager,
  getOptionsFromEmployees,
} from "../../utilities/commonServices";
import "../../styles/forms.css";
import Constants from "../../constants";
import RbacManager from "../../utilities/rbac";
import { useAuth } from "../../context/AuthContext";
import SearchableDropdown from "../../components/SearchableDropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
const CUSTOMER_APPROVAL_CHECKLIST_URL =
  process.env.REACT_APP_CUSTOMER_APPROVAL_CHECKLIST_URL;

function BusinessDetails({
  customerData = {},
  originalCustomerData = {},
  onChangeCustomerData,
  setEntityWiseAssignment,
  mode,
  setTabsHeight,
  setInterCompany,
  formErrors = {},
  logosToUpload = {}, // <-- Pass this from CustomerDetails.js
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
  // Dropdown fields as per your business logic
  const dropdownFields = [
    "companyType",
    "typeOfBusiness",
    "deliveryLocations",
    "customerSource",
    "entity",
  ];
  const [basicMasterLists, setBasicMasterLists] = useState({});
  const [employeeListWithManagers, setEmployeeListWithManagers] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const listOfBasicsMaster = await fetchDropdownFromBasicsMaster(
        dropdownFields
      );
      const listOfEmployeesWithManagers =
        await getOptionsFromEmployeesWithManager(customerData?.branch);

      const listOfEmployees = await getOptionsFromEmployees();
      setBasicMasterLists(listOfBasicsMaster);
      setEmployeeListWithManagers(listOfEmployeesWithManagers);
      setEmployeeList(listOfEmployees);
    };
    fetchData();
    setTabsHeight("auto");
  }, [customerData?.region]);

  // Example state for conditional fields
  const [typeOfBusiness, setTypeOfBusiness] = useState(
    customerData?.typeOfBusiness || ""
  );

  useEffect(() => {
    setTypeOfBusiness(customerData?.typeOfBusiness || "");
  }, [customerData?.typeOfBusiness]);

  // Refs for file inputs
  const companyLogoInputRef = useRef();
  const brandLogoInputRef = useRef();

  // Add preview state for logos
  const [logoPreviews, setLogoPreviews] = useState({
    companyLogo: null,
    brandLogo: null,
  });

  // Handle logo file selection (similar to documents.js)
  const handleLogoChange = (e, logoType) => {
    const file = e.target.files[0];
    if (!file) return;
    // Optional: file size check (e.g., 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert(t("File size exceeds 2MB."));
      return;
    }
    logosToUpload[logoType] = file;
    // Save file name in customerData for display
    onChangeCustomerData({
      target: { name: logoType, value: file.name },
    });

    // Generate preview URL
    const previewUrl = URL.createObjectURL(file);
    setLogoPreviews((prev) => {
      // Clean up previous URL if exists
      if (prev[logoType]) URL.revokeObjectURL(prev[logoType]);
      return { ...prev, [logoType]: previewUrl };
    });
  };

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(logoPreviews).forEach(
        (url) => url && URL.revokeObjectURL(url)
      );
    };
  }, [logoPreviews]);

  // Remove logo (clear from state and upload queue)
  const handleLogoDelete = (logoType) => {
    onChangeCustomerData({
      target: { name: logoType, value: originalCustomerData[logoType] || "" },
    });
    delete logosToUpload[logoType];
    // Reset the file input value so the same file can be uploaded again
    if (logoType === "companyLogo" && companyLogoInputRef.current) {
      companyLogoInputRef.current.value = "";
    }
    if (logoType === "brandLogo" && brandLogoInputRef.current) {
      brandLogoInputRef.current.value = "";
    }
  };

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // View logo (same as handleViewFile in documents.js)
  const handleViewLogo = async (customerId, fileName, fileType) => {
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

  return (
    <div className="customer-onboarding-form-grid">
      {customerData?.customerStatus === "blocked" && mode === "edit" && (
        <h3 className="form-header full-width">{t("Customer Blocked")}</h3>
      )}
      {originalCustomerData?.customerStatus === "blocked" &&
        mode === "edit" && (
          <h3 className="form-header full-width">{t("Customer Unblocked")}</h3>
        )}
      {isV("customerApprovalChecklist") && (
        <div className="form-main-header">
          <a
            href={CUSTOMER_APPROVAL_CHECKLIST_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!CUSTOMER_APPROVAL_CHECKLIST_URL) {
                e.preventDefault();
                alert(t("No checklist URL configured."));
              }
            }}
          >
            {t("Customer Approval Checklist")}
          </a>
        </div>
      )}
      {/* Company Name (English) */}
      <div className="form-group">
        <label htmlFor="companyNameEn">
          {t("Company Name")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.companyNameEn !=
              customerData?.companyNameEn &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="companyNameEn"
          name="companyNameEn"
          className={`text-field small ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.companyNameEn !=
              customerData?.companyNameEn &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter company name")}
          value={customerData?.companyNameEn || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.companyNameEn ===
              customerData?.companyNameEn &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.companyNameEn != customerData?.companyNameEn &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.companyNameEn || "(empty)"}
            </div>
          )}
        {formErrors.companyNameEn && (
          <div className="error">{formErrors.companyNameEn}</div>
        )}
      </div>

      {/* Company Name (Arabic) */}
      <div className="form-group">
        <label htmlFor="companyNameAr">
          {t("Company Name (Arabic)")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.companyNameAr !=
              customerData?.companyNameAr &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="companyNameAr"
          name="companyNameAr"
          className={`text-field small arabic ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.companyNameAr !=
              customerData?.companyNameAr &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("أدخل اسم الشركة")}
          value={customerData?.companyNameAr || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.companyNameAr ===
              customerData?.companyNameAr &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.companyNameAr != customerData?.companyNameAr &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.companyNameAr || "(empty)"}
            </div>
          )}
        {formErrors.companyNameAr && (
          <div className="error">{formErrors.companyNameAr}</div>
        )}
      </div>

      {/* Commercial Registration # - Already implemented correctly */}
      <div className="form-group">
        <label htmlFor="crNumber">
          {t("Commercial Registration #")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.crNumber != customerData?.crNumber &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="crNumber"
          name="crNumber"
          className={`text-field small ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.crNumber != customerData?.crNumber &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter value")}
          value={customerData?.crNumber || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.crNumber === customerData?.crNumber &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.crNumber != customerData?.crNumber &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.crNumber || "(empty)"}
            </div>
          )}
        {formErrors.crNumber && (
          <div className="error">{formErrors.crNumber}</div>
        )}
      </div>

      {/* VAT Registration # */}
      <div className="form-group">
        <label htmlFor="vatNumber">
          {t("VAT Registration #")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.vatNumber != customerData?.vatNumber &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="vatNumber"
          name="vatNumber"
          className={`text-field small ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.vatNumber != customerData?.vatNumber &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter value")}
          value={customerData?.vatNumber || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.vatNumber === customerData?.vatNumber &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.vatNumber != customerData?.vatNumber &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.vatNumber || "(empty)"}
            </div>
          )}
        {formErrors.vatNumber && (
          <div className="error">{formErrors.vatNumber}</div>
        )}
      </div>

      {/* Government Registration # */}
      <div className="form-group">
        <label htmlFor="governmentRegistrationNumber">
          {t("Government Registration #")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.governmentRegistrationNumber !=
              customerData?.governmentRegistrationNumber &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="governmentRegistrationNumber"
          name="governmentRegistrationNumber"
          className={`text-field small ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.governmentRegistrationNumber !=
              customerData?.governmentRegistrationNumber &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter value")}
          value={customerData?.governmentRegistrationNumber || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.governmentRegistrationNumber ===
              customerData?.governmentRegistrationNumber &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.governmentRegistrationNumber !=
            customerData?.governmentRegistrationNumber &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerData?.governmentRegistrationNumber || "(empty)"}
            </div>
          )}
        {formErrors.governmentRegistrationNumber && (
          <div className="error">{formErrors.governmentRegistrationNumber}</div>
        )}
      </div>

      {/* Baladeah License # */}
      <div className="form-group">
        <label htmlFor="baladeahLicenseNumber">
          {t("Baladeah License #")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.baladeahLicenseNumber !=
              customerData?.baladeahLicenseNumber &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="baladeahLicenseNumber"
          name="baladeahLicenseNumber"
          className={`text-field small ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.baladeahLicenseNumber !=
              customerData?.baladeahLicenseNumber &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter value")}
          value={customerData?.baladeahLicenseNumber || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.baladeahLicenseNumber ===
              customerData?.baladeahLicenseNumber &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.baladeahLicenseNumber !=
            customerData?.baladeahLicenseNumber &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerData?.baladeahLicenseNumber || "(empty)"}
            </div>
          )}
        {formErrors.baladeahLicenseNumber && (
          <div className="error">{formErrors.baladeahLicenseNumber}</div>
        )}
      </div>

      {/* Company Type Dropdown */}
      <div className="form-group">
        <label htmlFor="companyType">
          {t("Company Type")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.companyType != customerData?.companyType &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <SearchableDropdown
          name="companyType"
          options={basicMasterLists?.companyType || []}
          value={customerData?.companyType || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.companyType === customerData?.companyType &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          className={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.companyType != customerData?.companyType &&
            mode === "edit"
              ? "update-field"
              : ""
          }
          placeholder={t("Select")}
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.companyType != customerData?.companyType &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.companyType || "(empty)"}
            </div>
          )}
        {formErrors.companyType && (
          <div className="error">{formErrors.companyType}</div>
        )}
      </div>
      {/* Delivery Locations Dropdown */}
      <div className="form-group">
        <label htmlFor="deliveryLocations">
          {t("Delivery Locations")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.deliveryLocations !=
              customerData?.deliveryLocations &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <SearchableDropdown
          name="deliveryLocations"
          options={basicMasterLists?.deliveryLocations || []}
          value={customerData?.deliveryLocations || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.deliveryLocations ===
              customerData?.deliveryLocations &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          className={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.deliveryLocations !=
              customerData?.deliveryLocations &&
            mode === "edit"
              ? "update-field"
              : ""
          }
          placeholder={t("Select")}
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.deliveryLocations !=
            customerData?.deliveryLocations &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.deliveryLocations || "(empty)"}
            </div>
          )}
        {formErrors.deliveryLocations && (
          <div className="error">{formErrors.deliveryLocations}</div>
        )}
      </div>
      {/* Type of Business Dropdown */}
      <div className="form-group">
        <label htmlFor="typeOfBusiness">
          {t("Type of Business")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.typeOfBusiness != typeOfBusiness &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <SearchableDropdown
          name="typeOfBusiness"
          options={basicMasterLists?.typeOfBusiness || []}
          value={typeOfBusiness}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.typeOfBusiness ===
              customerData?.typeOfBusiness &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          className={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.typeOfBusiness != typeOfBusiness &&
            mode === "edit"
              ? "update-field"
              : ""
          }
          placeholder={t("Select")}
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.typeOfBusiness != typeOfBusiness &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.typeOfBusiness || "(empty)"}
            </div>
          )}
        {formErrors.typeOfBusiness && (
          <div className="error">{formErrors.typeOfBusiness}</div>
        )}
      </div>

      {/* Type of Business (Other) - Conditional */}
      {typeOfBusiness === "Others (Specify)" ? (
        <div className="form-group">
          <label htmlFor="typeOfBusinessOther">
            {t("Type of Business (Other)")}
            <span className="required-field">*</span>
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.typeOfBusinessOther !=
                customerData?.typeOfBusinessOther &&
              mode === "edit" && (
                <span className="update-badge">{t("Updated")}</span>
              )}
          </label>
          <input
            type="text"
            id="typeOfBusinessOther"
            name="typeOfBusinessOther"
            className={`text-field small ${
              originalCustomerData &&
              customerData &&
              originalCustomerData?.typeOfBusinessOther !=
                customerData?.typeOfBusinessOther &&
              mode === "edit"
                ? "update-field"
                : ""
            }`}
            placeholder={t("Enter other business type")}
            value={customerData?.typeOfBusinessOther || ""}
            onChange={onChangeCustomerData}
            disabled={
              originalCustomerData &&
              customerData &&
              originalCustomerData?.typeOfBusinessOther ===
                customerData?.typeOfBusinessOther &&
              mode === "edit" &&
              customerData?.customerStatus !== "pending"
            }
          />
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.typeOfBusinessOther !=
              customerData?.typeOfBusinessOther &&
            mode === "edit" && (
              <div className="current-value">
                Previous:{" "}
                {originalCustomerData?.typeOfBusinessOther || "(empty)"}
              </div>
            )}
          {formErrors.typeOfBusinessOther && (
            <div className="error">{formErrors.typeOfBusinessOther}</div>
          )}
        </div>
      ) : (
        <div className="form-group"></div>
      )}

      {/* Brand Name (English) */}
      <div className="form-group">
        <label htmlFor="brandNameEn">
          {t("Brand Name")}
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.brandNameEn != customerData?.brandNameEn &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="brandNameEn"
          name="brandNameEn"
          className={`text-field small ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.brandNameEn != customerData?.brandNameEn &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter brand name")}
          value={customerData?.brandNameEn || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.brandNameEn === customerData?.brandNameEn &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.brandNameEn != customerData?.brandNameEn &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.brandNameEn || "(empty)"}
            </div>
          )}
      </div>

      {/* Brand Name (Arabic) */}
      <div className="form-group">
        <label htmlFor="brandNameAr">
          {t("Brand Name (Arabic)")}
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.brandNameAr != customerData?.brandNameAr &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="brandNameAr"
          name="brandNameAr"
          className={`text-field small arabic ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.brandNameAr != customerData?.brandNameAr &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("أدخل اسم العلامة التجارية")}
          value={customerData?.brandNameAr || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.brandNameAr === customerData?.brandNameAr &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.brandNameAr != customerData?.brandNameAr &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.brandNameAr || "(empty)"}
            </div>
          )}
      </div>

      {/* Company Logo Upload */}
      <div className="form-group">
        <label htmlFor="companyLogo">
          {t("Company Logo")}
          {originalCustomerData?.companyLogo !== customerData?.companyLogo &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="file"
          id="companyLogo"
          name="companyLogo"
          accept="image/*"
          style={{ display: "none" }}
          ref={companyLogoInputRef}
          onChange={(e) => handleLogoChange(e, "companyLogo")}
          disabled={
            mode === "edit" && customerData?.customerStatus !== "pending"
          }
        />
        <button
          type="button"
          className="custom-file-button"
          onClick={() => companyLogoInputRef.current?.click()}
          disabled={
            mode === "edit" && customerData?.customerStatus === "pending"
          }
          style={{ width: "100px" }}
        >
          {t("Upload")}
        </button>
        {/* Show preview if file is selected but not saved */}
        {logoPreviews.companyLogo && (
          <div className="logo-preview">
            <img
              src={logoPreviews.companyLogo}
              alt="Company Logo Preview"
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
                setLogoPreviews((prev) => {
                  if (prev.companyLogo) URL.revokeObjectURL(prev.companyLogo);
                  return { ...prev, companyLogo: null };
                });
                handleLogoDelete("companyLogo");
              }}
              style={{ marginLeft: 8, fontSize: "20px" }}
            >
              ×
            </button>
          </div>
        )}
        {/* Show uploaded file name as link if present and no preview */}
        {!logoPreviews.companyLogo && customerData?.companyLogo && (
          <div className="logo-preview">
            <a
              href="#"
              className="file-link"
              onClick={(e) => {
                e.preventDefault();
                handleViewLogo(
                  customerData.id,
                  customerData.companyLogo,
                  "companyLogo"
                );
              }}
              style={{ marginRight: 8 }}
            >
              {typeof customerData.companyLogo === "string"
                ? (() => {
                    const name = customerData.companyLogo
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
            <button
              type="button"
              className="delete-file-button"
              onClick={() => handleLogoDelete("companyLogo")}
              style={{ marginLeft: 8, fontSize: "15px" }}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        )}
      </div>

      {/* Brand Logo Upload */}
      <div className="form-group">
        <label htmlFor="brandLogo">
          {t("Brand Logo")}
          {originalCustomerData?.brandLogo !== customerData?.brandLogo &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="file"
          id="brandLogo"
          name="brandLogo"
          accept="image/*"
          style={{ display: "none" }}
          ref={brandLogoInputRef}
          onChange={(e) => handleLogoChange(e, "brandLogo")}
          disabled={
            mode === "edit" && customerData?.customerStatus !== "pending"
          }
        />
        <button
          type="button"
          className="custom-file-button"
          onClick={() => brandLogoInputRef.current?.click()}
          disabled={
            mode === "edit" && customerData?.customerStatus === "pending"
          }
          style={{ width: "100px" }}
        >
          {t("Upload")}
        </button>
        {/* Show preview if file is selected but not saved */}
        {logoPreviews.brandLogo && (
          <div className="logo-preview">
            <img
              src={logoPreviews.brandLogo}
              alt="Brand Logo Preview"
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
                setLogoPreviews((prev) => {
                  if (prev.brandLogo) URL.revokeObjectURL(prev.brandLogo);
                  return { ...prev, brandLogo: null };
                });
                handleLogoDelete("brandLogo");
              }}
              style={{ marginLeft: 8, fontSize: "20px" }}
            >
              ×
            </button>
          </div>
        )}
        {/* Show uploaded file name as link if present and no preview */}
        {!logoPreviews.brandLogo && customerData?.brandLogo && (
          <div className="logo-preview">
            <a
              href="#"
              className="file-link"
              onClick={(e) => {
                e.preventDefault();
                handleViewLogo(
                  customerData.id,
                  customerData.brandLogo,
                  "brandLogo"
                );
              }}
              style={{ marginRight: 8 }}
            >
              {typeof customerData.brandLogo === "string"
                ? (() => {
                    const name = customerData.brandLogo
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
            <button
              type="button"
              className="delete-file-button"
              onClick={() => handleLogoDelete("brandLogo")}
              style={{ marginLeft: 8, fontSize: "15px" }}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        )}
      </div>

      {/* Customer Source */}
      {isV("customerSource") && (
        <div className="form-group">
          <label htmlFor="customerSource">
            {t("Customer Source")}
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.customerSource !=
                customerData?.customerSource &&
              mode === "edit" && (
                <span className="update-badge">{t("Updated")}</span>
              )}
          </label>
          <input
            type="text"
            id="customerSource"
            name="customerSource"
            className={`text-field small ${
              originalCustomerData &&
              customerData &&
              originalCustomerData?.customerSource !=
                customerData?.customerSource &&
              mode === "edit"
                ? "update-field"
                : ""
            }`}
            placeholder={t("Enter customer source")}
            value={customerData?.customerSource || ""}
            onChange={onChangeCustomerData}
            disabled={
              (originalCustomerData &&
                customerData &&
                originalCustomerData?.customerSource ===
                  customerData?.customerSource &&
                mode === "edit" &&
                customerData?.customerStatus !== "pending") ||
              true
            }
          />
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.customerSource !=
              customerData?.customerSource &&
            mode === "edit" && (
              <div className="current-value">
                Previous: {originalCustomerData?.customerSource || "(empty)"}
              </div>
            )}
        </div>
      )}

      {isV("assignedToEntityWise") && (
        <>
          <h3 className="form-header full-width">
            {t("Inter Company Account")}
          </h3>
          {isV("assignedToEntityWise") && (
            <div className="form-group">
              <label className="checkbox-group-label">
                <input
                  type="checkbox"
                  id="interCompany"
                  name="interCompany"
                  checked={customerData?.interCompany}
                  onChange={setInterCompany}
                  disabled={
                    originalCustomerData &&
                    customerData &&
                    originalCustomerData?.interCompany ===
                      customerData?.interCompany &&
                    mode === "edit" &&
                    customerData?.customerStatus !== "pending"
                  }
                />
                {`\t ${t("Inter Company")}`}
              </label>
            </div>
          )}

          {isV("assignedToEntityWise") && customerData?.interCompany && (
            <div className="form-group">
              <label htmlFor="entity">
                {t("Entity")}
                <span className="required-field">*</span>
                {originalCustomerData &&
                  customerData &&
                  originalCustomerData?.entity != customerData?.entity &&
                  mode === "edit" && (
                    <span className="update-badge">{t("Updated")}</span>
                  )}
              </label>
              <select
                id="entity"
                name="entity"
                className={`dropdown ${
                  originalCustomerData &&
                  customerData &&
                  originalCustomerData?.entity != customerData?.entity &&
                  mode === "edit"
                    ? "update-field"
                    : ""
                }`}
                value={customerData?.entity || ""}
                onChange={onChangeCustomerData}
                disabled={
                  originalCustomerData &&
                  customerData &&
                  originalCustomerData?.entity === customerData?.entity &&
                  mode === "edit" &&
                  customerData?.customerStatus !== "pending"
                }
                required
              >
                <option value="" disabled>
                  {t("Select")}
                </option>
                {basicMasterLists?.entity?.map((loc) => (
                  <option key={loc} value={loc}>
                    {t(loc)}
                  </option>
                ))}
              </select>
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.entity != customerData?.entity &&
                mode === "edit" && (
                  <div className="current-value">
                    Previous: {originalCustomerData?.entity || "(empty)"}
                  </div>
                )}
              {formErrors.entity && (
                <div className="error">{formErrors.entity}</div>
              )}
            </div>
          )}
          {/* Entity Wise Employee Assignment Header */}
          <h3 className="form-header full-width">
            {t("Sales Person Assignment")}
          </h3>

          {/* Assigned To Dropdown */}
          {isV("assignedTo") && (
            <div className="form-group">
              <label htmlFor="assignedTo">
                {t("Primary Sales Person")}
                {originalCustomerData &&
                  customerData &&
                  originalCustomerData?.assignedTo !=
                    customerData?.assignedTo &&
                  mode === "edit" && (
                    <span className="update-badge">{t("Updated")}</span>
                  )}
              </label>
              <SearchableDropdown
                name="assignedTo"
                options={
                  employeeList?.map((employee) => ({
                    value: employee.employeeId,
                    // Use 'name' property for label, since SearchableDropdown expects 'name'
                    name:
                      employee.name || employee.label || employee.employeeId,
                  })) || []
                }
                value={customerData?.assignedTo || ""}
                onChange={onChangeCustomerData}
                disabled={
                  originalCustomerData &&
                  customerData &&
                  originalCustomerData?.assignedTo ===
                    customerData?.assignedTo &&
                  mode === "edit" &&
                  customerData?.customerStatus !== "pending"
                }
                className={
                  originalCustomerData &&
                  customerData &&
                  originalCustomerData?.assignedTo !=
                    customerData?.assignedTo &&
                  mode === "edit"
                    ? "update-field"
                    : ""
                }
                placeholder={t("Select")}
                required
              />
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.assignedTo != customerData?.assignedTo &&
                mode === "edit" && (
                  <div className="current-value">
                    Previous: {originalCustomerData?.assignedTo || "(empty)"}
                  </div>
                )}
              {formErrors.assignedTo && (
                <div className="error">{formErrors.assignedTo}</div>
              )}
            </div>
          )}

          {/* Entity Wise Employee Assignment */}

          {/* Dar dropdown */}
          <div className="form-group">
            <label htmlFor="assignedToEntityWise">
              {t(Constants.ENTITY.DAR)}
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.assignedToEntityWise?.[
                  Constants.ENTITY.DAR
                ] !==
                  customerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
            <SearchableDropdown
              name={Constants.ENTITY.DAR}
              options={
                employeeListWithManagers?.map((employee) => ({
                  value: employee.employeeId,
                  name: employee.name || employee.label || employee.employeeId,
                })) || []
              }
              value={
                customerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] || ""
              }
              onChange={setEntityWiseAssignment}
              disabled={
                originalCustomerData &&
                customerData &&
                originalCustomerData?.assignedToEntityWise?.[
                  Constants.ENTITY.DAR
                ] ===
                  customerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] &&
                mode === "edit" &&
                customerData?.customerStatus !== "pending"
              }
              className={
                originalCustomerData &&
                customerData &&
                originalCustomerData?.assignedToEntityWise?.[
                  Constants.ENTITY.DAR
                ] !==
                  customerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] &&
                mode === "edit"
                  ? "update-field"
                  : ""
              }
              placeholder={t("Select")}
              required
            />
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.assignedToEntityWise?.[
                Constants.ENTITY.DAR
              ] !==
                customerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] &&
              mode === "edit" && (
                <div className="current-value">
                  Previous:{" "}
                  {originalCustomerData?.assignedToEntityWise?.[
                    Constants.ENTITY.DAR
                  ] || "(empty)"}
                </div>
              )}
            {formErrors[`assignedToEntityWise.${Constants.ENTITY.DAR}`] && (
              <div className="error">
                {formErrors[`assignedToEntityWise.${Constants.ENTITY.DAR}`]}
              </div>
            )}
          </div>

          {/* VMCO dropdown */}
          <div className="form-group">
            <label htmlFor="assignedToEntityWise">
              {t(Constants.ENTITY.VMCO)}
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.assignedToEntityWise?.[
                  Constants.ENTITY.VMCO
                ] !==
                  customerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
            <SearchableDropdown
              name={Constants.ENTITY.VMCO}
              options={
                employeeListWithManagers?.map((employee) => ({
                  value: employee.employeeId,
                  name: employee.name || employee.label || employee.employeeId,
                })) || []
              }
              value={
                customerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] ||
                ""
              }
              onChange={setEntityWiseAssignment}
              disabled={
                originalCustomerData &&
                customerData &&
                originalCustomerData?.assignedToEntityWise?.[
                  Constants.ENTITY.VMCO
                ] ===
                  customerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] &&
                mode === "edit" &&
                customerData?.customerStatus !== "pending"
              }
              className={
                originalCustomerData &&
                customerData &&
                originalCustomerData?.assignedToEntityWise?.[
                  Constants.ENTITY.VMCO
                ] !==
                  customerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] &&
                mode === "edit"
                  ? "update-field"
                  : ""
              }
              placeholder={t("Select")}
              required
            />
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.assignedToEntityWise?.[
                Constants.ENTITY.VMCO
              ] !==
                customerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] &&
              mode === "edit" && (
                <div className="current-value">
                  Previous:{" "}
                  {originalCustomerData?.assignedToEntityWise?.[
                    Constants.ENTITY.VMCO
                  ] || "(empty)"}
                </div>
              )}
            {formErrors[`assignedToEntityWise.${Constants.ENTITY.VMCO}`] && (
              <div className="error">
                {formErrors[`assignedToEntityWise.${Constants.ENTITY.VMCO}`]}
              </div>
            )}
          </div>

          {/* Entity Wise Assignment for SHC */}
          <div className="form-group">
            <label htmlFor="assignedToEntityWise">
              {t(Constants.ENTITY.SHC)}
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.assignedToEntityWise?.[
                  Constants.ENTITY.SHC
                ] !==
                  customerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
            <SearchableDropdown
              name={Constants.ENTITY.SHC}
              options={
                employeeListWithManagers?.map((employee) => ({
                  value: employee.employeeId,
                  name: employee.name || employee.label || employee.employeeId,
                })) || []
              }
              value={
                customerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] || ""
              }
              onChange={setEntityWiseAssignment}
              disabled={
                originalCustomerData &&
                customerData &&
                originalCustomerData?.assignedToEntityWise?.[
                  Constants.ENTITY.SHC
                ] ===
                  customerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] &&
                mode === "edit" &&
                customerData?.customerStatus !== "pending"
              }
              className={
                originalCustomerData &&
                customerData &&
                originalCustomerData?.assignedToEntityWise?.[
                  Constants.ENTITY.SHC
                ] !==
                  customerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] &&
                mode === "edit"
                  ? "update-field"
                  : ""
              }
              placeholder={t("Select")}
              required
            />
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.assignedToEntityWise?.[
                Constants.ENTITY.SHC
              ] !==
                customerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] &&
              mode === "edit" && (
                <div className="current-value">
                  Previous:{" "}
                  {originalCustomerData?.assignedToEntityWise?.[
                    Constants.ENTITY.SHC
                  ] || "(empty)"}
                </div>
              )}
            {formErrors[`assignedToEntityWise.${Constants.ENTITY.SHC}`] && (
              <div className="error">
                {formErrors[`assignedToEntityWise.${Constants.ENTITY.SHC}`]}
              </div>
            )}
          </div>
          {/* Entity Wise Assignment for NAQI */}
          <div className="form-group">
            <label htmlFor="assignedToEntityWise">
              {t(Constants.ENTITY.NAQI)}
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.assignedToEntityWise?.[
                  Constants.ENTITY.NAQI
                ] !==
                  customerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
            <SearchableDropdown
              name={Constants.ENTITY.NAQI}
              options={
                employeeListWithManagers?.map((employee) => ({
                  value: employee.employeeId,
                  name: employee.name || employee.label || employee.employeeId,
                })) || []
              }
              value={
                customerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] ||
                ""
              }
              onChange={setEntityWiseAssignment}
              disabled={
                originalCustomerData &&
                customerData &&
                originalCustomerData?.assignedToEntityWise?.[
                  Constants.ENTITY.NAQI
                ] ===
                  customerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] &&
                mode === "edit" &&
                customerData?.customerStatus !== "pending"
              }
              className={
                originalCustomerData &&
                customerData &&
                originalCustomerData?.assignedToEntityWise?.[
                  Constants.ENTITY.NAQI
                ] !==
                  customerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] &&
                mode === "edit"
                  ? "update-field"
                  : ""
              }
              placeholder={t("Select")}
              required
            />
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.assignedToEntityWise?.[
                Constants.ENTITY.NAQI
              ] !==
                customerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] &&
              mode === "edit" && (
                <div className="current-value">
                  Previous:{" "}
                  {originalCustomerData?.assignedToEntityWise?.[
                    Constants.ENTITY.NAQI
                  ] || "(empty)"}
                </div>
              )}
            {formErrors[`assignedToEntityWise.${Constants.ENTITY.NAQI}`] && (
              <div className="error">
                {formErrors[`assignedToEntityWise.${Constants.ENTITY.NAQI}`]}
              </div>
            )}
          </div>

          {/* Entity Wise Assignment for GMTC */}
          <div className="form-group">
            <label htmlFor="assignedToEntityWise">
              {t(Constants.ENTITY.GMTC)}
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.assignedToEntityWise?.[
                  Constants.ENTITY.GMTC
                ] !==
                  customerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
            <SearchableDropdown
              name={Constants.ENTITY.GMTC}
              options={
                employeeListWithManagers?.map((employee) => ({
                  value: employee.employeeId,
                  name: employee.name || employee.label || employee.employeeId,
                })) || []
              }
              value={
                customerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] ||
                ""
              }
              onChange={setEntityWiseAssignment}
              disabled={
                originalCustomerData &&
                customerData &&
                originalCustomerData?.assignedToEntityWise?.[
                  Constants.ENTITY.GMTC
                ] ===
                  customerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] &&
                mode === "edit" &&
                customerData?.customerStatus !== "pending"
              }
              className={
                originalCustomerData &&
                customerData &&
                originalCustomerData?.assignedToEntityWise?.[
                  Constants.ENTITY.GMTC
                ] !==
                  customerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] &&
                mode === "edit"
                  ? "update-field"
                  : ""
              }
              placeholder={t("Select")}
              required
            />
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.assignedToEntityWise?.[
                Constants.ENTITY.GMTC
              ] !==
                customerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] &&
              mode === "edit" && (
                <div className="current-value">
                  Previous:{" "}
                  {originalCustomerData?.assignedToEntityWise?.[
                    Constants.ENTITY.GMTC
                  ] || "(empty)"}
                </div>
              )}
            {formErrors[`assignedToEntityWise.${Constants.ENTITY.GMTC}`] && (
              <div className="error">
                {formErrors[`assignedToEntityWise.${Constants.ENTITY.GMTC}`]}
              </div>
            )}
          </div>
        </>
      )}

      {/* ...rest of your form... */}
    </div>
  );
}

export default BusinessDetails;
