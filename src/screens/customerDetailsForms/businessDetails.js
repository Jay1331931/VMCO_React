import React, { useEffect, useState } from "react";
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
function BusinessDetails({
  customerData = {},
  originalCustomerData = {},
  onChangeCustomerData,
  setEntityWiseAssignment,
  mode,
  setTabsHeight,
  setInterCompany,
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
        await getOptionsFromEmployeesWithManager(customerData?.region);

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

  // Add state for logo files and previews
  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState(null);
  const [brandLogoFile, setBrandLogoFile] = useState(null);
  const [brandLogoPreview, setBrandLogoPreview] = useState(null);

  const handleCompanyLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCompanyLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        // Save base64 string (without prefix) to customerData
        const base64String = reader.result.split(",")[1];
        onChangeCustomerData({
          target: { name: "companyLogo", value: base64String },
        });
        setCompanyLogoPreview(reader.result); // data URL for preview
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBrandLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBrandLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(",")[1];
        onChangeCustomerData({
          target: { name: "brandLogo", value: base64String },
        });
        setBrandLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCompanyLogo = () => {
    setCompanyLogoFile(null);
    setCompanyLogoPreview(null);
    onChangeCustomerData({
      target: { name: "companyLogo", value: "" },
    });
  };

  const removeBrandLogo = () => {
    setBrandLogoFile(null);
    setBrandLogoPreview(null);
    onChangeCustomerData({
      target: { name: "brandLogo", value: "" },
    });
  };

  function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // useEffect(() => {
  //   // Helper function to handle logo data
  //   const handleLogoData = (logoData, setPreview) => {
  //     if (!logoData) return null;

  //     if (typeof logoData === "string") {
  //       return logoData.startsWith("data:")
  //         ? logoData
  //         : `data:image/png;base64,${logoData}`;
  //     } else if (Array.isArray(logoData)) {
  //       const uint8 = new Uint8Array(logoData);
  //       const base64 = arrayBufferToBase64(uint8);
  //       return `data:${logoData.type};base64,${base64}`;
  //     } else if (
  //       typeof logoData === "object" &&
  //       logoData.data &&
  //       logoData.type
  //     ) {
  //       // Handle object case where data might be in a specific format
  //       // Example: { data: Uint8Array or array, type: "image/png" }
  //       const dataArray = Array.isArray(logoData.data)
  //         ? logoData.data
  //         : Object.values(logoData.data);
  //       const uint8 = new Uint8Array(dataArray);
  //       const base64 = arrayBufferToBase64(uint8);
  //       return `data:${logoData.type};base64,${base64}`;
  //     }
  //     return null;
  //   };

  //   // Company Logo
  //   if (!companyLogoFile && customerData?.companyLogo) {
  //     console.log("customerData.companyLogo:", customerData.companyLogo);
  //     const preview = handleLogoData(
  //       { data: customerData.companyLogo, type: "image/png" },
  //       setCompanyLogoPreview
  //     );
  //     setCompanyLogoPreview(preview);
  //   } else if (!customerData?.companyLogo && !companyLogoFile) {
  //     setCompanyLogoPreview(null);
  //   }

  //   // Brand Logo
  //   if (!brandLogoFile && customerData?.brandLogo) {
  //     const preview = handleLogoData(
  //       customerData.brandLogo,
  //       setBrandLogoPreview
  //     );
  //     setBrandLogoPreview(preview);
  //   } else if (!customerData?.brandLogo && !brandLogoFile) {
  //     setBrandLogoPreview(null);
  //   }
  // }, [
  //   customerData?.companyLogo,
  //   customerData?.brandLogo,
  //   companyLogoFile,
  //   brandLogoFile,
  // ]);

  return (
    <div className="customer-onboarding-form-grid">
      {isV("customerApprovalChecklist") && (
        <div className="form-main-header">
          <a href="#">{t("Customer Approval Checklist")}</a>
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
            mode === "edit" && <span className="update-badge">Updated</span>}
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
            mode === "edit" && <span className="update-badge">Updated</span>}
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
            mode === "edit" && <span className="update-badge">Updated</span>}
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
            mode === "edit" && <span className="update-badge">Updated</span>}
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
            mode === "edit" && <span className="update-badge">Updated</span>}
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
            mode === "edit" && <span className="update-badge">Updated</span>}
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
            mode === "edit" && <span className="update-badge">Updated</span>}
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

      {/* Type of Business Dropdown */}
      <div className="form-group">
        <label htmlFor="typeOfBusiness">
          {t("Type of Business")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.typeOfBusiness != typeOfBusiness &&
            mode === "edit" && <span className="update-badge">Updated</span>}
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
      {typeOfBusiness === "Others" && (
        <div className="form-group">
          <label htmlFor="typeOfBusinessOther">
            {t("Type of Business (Other)")}
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.typeOfBusinessOther !=
                customerData?.typeOfBusinessOther &&
              mode === "edit" && <span className="update-badge">Updated</span>}
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
      )}

      {/* Delivery Locations Dropdown */}
      <div className="form-group">
        <label htmlFor="deliveryLocations">
          {t("Delivery Locations")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.deliveryLocations !=
              customerData?.deliveryLocations &&
            mode === "edit" && <span className="update-badge">Updated</span>}
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
      {/*Empty div*/}
      <div className="form-group"></div>

      {/* Brand Name (English) */}
      <div className="form-group">
        <label htmlFor="brandNameEn">
          {t("Brand Name")}
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.brandNameEn != customerData?.brandNameEn &&
            mode === "edit" && <span className="update-badge">Updated</span>}
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
            mode === "edit" && <span className="update-badge">Updated</span>}
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

      {/* Company Logo Upload
      <div className="form-group file-upload">
        <label htmlFor="companyLogo">
          {t("Company Logo")}
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.companyLogo !== customerData?.companyLogo &&
            customerData?.companyLogo &&
            mode === "edit" && <span className="update-badge">Updated</span>}
        </label>
        <input
          type="file"
          id="companyLogo"
          name="companyLogo"
          accept="image/*"
          className="hidden-file-input"
          onChange={handleCompanyLogoChange}
          disabled={
            mode === "edit" && customerData?.customerStatus !== "pending"
          }
        />
        <label
          htmlFor="companyLogo"
          className="custom-file-button"
          style={{
            display: "inline-block",
            width: "30%",
            textAlign: "center",
          }}
        >
          {t("Upload")}
        </label>
        {companyLogoPreview && (
          <div style={{ marginTop: 8, display: "flex" }}>
            <img
              src={companyLogoPreview}
              alt="Company Logo Preview"
              style={{ maxWidth: 150, maxHeight: 120, display: "block" }}
            />
            <button
              type="button"
              className="delete-file-button"
              style={{ marginTop: 100 }}
              onClick={removeCompanyLogo}
            >
              ×
            </button>
          </div>
        )}
        {formErrors.companyLogo && (
          <div className="error">{formErrors.companyLogo}</div>
        )}
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.companyLogo !== customerData?.companyLogo &&
          customerData?.companyLogo &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.companyLogo || "(no file)"}
            </div>
          )}
      </div>

      {/* Brand Logo Upload */}
      {/* <div className="form-group file-upload">
        <label htmlFor="brandLogo">
          {t("Brand Logo")}
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.brandLogo !== customerData?.brandLogo &&
            customerData?.brandLogo &&
            mode === "edit" && <span className="update-badge">Updated</span>}
        </label>
        <input
          type="file"
          id="brandLogo"
          name="brandLogo"
          accept="image/*"
          className="hidden-file-input"
          onChange={handleBrandLogoChange}
          disabled={
            mode === "edit" && customerData?.customerStatus !== "pending"
          }
        />
        <label
          htmlFor="brandLogo"
          className="custom-file-button"
          style={{
            display: "inline-block",
            width: "30%",
            textAlign: "center",
          }}
        >
          {t("Upload")}
        </label>
        {brandLogoPreview && (
          <div style={{ marginTop: 8, display: "flex" }}>
            <img
              src={brandLogoPreview}
              alt="Brand Logo Preview"
              style={{ maxWidth: 150, maxHeight: 120, display: "block" }}
            />
            <button
              type="button"
              className="delete-file-button"
              style={{ marginTop: 100 }}
              onClick={removeBrandLogo}
            >
              ×
            </button>
          </div>
        )}
        {formErrors.brandLogo && (
          <div className="error">{formErrors.brandLogo}</div>
        )}
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.brandLogo !== customerData?.brandLogo &&
          customerData?.brandLogo &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.brandLogo || "(no file)"}
            </div>
          )}
      </div>  */}


      {/* Customer Source */}
      {isV("customerSource") && (
        <div className="form-group">
          <label htmlFor="customerSource">
            {t("Customer Source")}
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.customerSource !=
                customerData?.customerSource &&
              mode === "edit" && <span className="update-badge">Updated</span>}
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
              customerData?.customerStatus !== "pending"
      ) || true}
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
        <div className="form-header full-width">
            {t("Inter Company Account")}
          </div>
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
            {t("Inter Company")}
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
              mode === "edit" && <span className="update-badge">Updated</span>}
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
          <div className="form-header full-width">
            {t("Sales Person Assignment")}
          </div>
{/* Assigned To Dropdown */}
{isV("assignedTo") && (
  <div className="form-group">
    <label htmlFor="assignedTo">
      {t("Assigned To")}
      {originalCustomerData &&
        customerData &&
        originalCustomerData?.assignedTo != customerData?.assignedTo &&
        mode === "edit" && <span className="update-badge">Updated</span>}
    </label>
    <SearchableDropdown
      name="assignedTo"
      options={
        employeeList?.map((employee) => ({
          value: employee.employeeId,
          // Use 'name' property for label, since SearchableDropdown expects 'name'
          name: employee.name || employee.label || employee.employeeId,
        })) || []
      }
      value={customerData?.assignedTo || ""}
      onChange={onChangeCustomerData}
      disabled={
        originalCustomerData &&
        customerData &&
        originalCustomerData?.assignedTo === customerData?.assignedTo &&
        mode === "edit" &&
        customerData?.customerStatus !== "pending"
      }
      className={
        originalCustomerData &&
        customerData &&
        originalCustomerData?.assignedTo != customerData?.assignedTo &&
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
      originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] !==
        customerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] &&
      mode === "edit" && (
        <span className="update-badge">Updated</span>
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
    value={customerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] || ""}
    onChange={setEntityWiseAssignment}
    disabled={
      originalCustomerData &&
      customerData &&
      originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] ===
        customerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] &&
      mode === "edit" &&
      customerData?.customerStatus !== "pending"
    }
    className={
      originalCustomerData &&
      customerData &&
      originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] !==
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
    originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] !==
      customerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] &&
    mode === "edit" && (
      <div className="current-value">
        Previous:{" "}
        {originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] ||
          "(empty)"}
      </div>
    )}
</div>

          {/* VMCO dropdown */}
<div className="form-group">
  <label htmlFor="assignedToEntityWise">
    {t(Constants.ENTITY.VMCO)}
    {originalCustomerData &&
      customerData &&
      originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] !==
        customerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] &&
      mode === "edit" && (
        <span className="update-badge">Updated</span>
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
    value={customerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] || ""}
    onChange={setEntityWiseAssignment}
    disabled={
      originalCustomerData &&
      customerData &&
      originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] ===
        customerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] &&
      mode === "edit" &&
      customerData?.customerStatus !== "pending"
    }
    className={
      originalCustomerData &&
      customerData &&
      originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] !==
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
    originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] !==
      customerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] &&
    mode === "edit" && (
      <div className="current-value">
        Previous:{" "}
        {originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] ||
          "(empty)"}
      </div>
    )}
</div>
         
{/* Entity Wise Assignment for SHC */}
<div className="form-group">
  <label htmlFor="assignedToEntityWise">
    {t(Constants.ENTITY.SHC)}
    {originalCustomerData &&
      customerData &&
      originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] !==
        customerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] &&
      mode === "edit" && (
        <span className="update-badge">Updated</span>
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
    value={customerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] || ""}
    onChange={setEntityWiseAssignment}
    disabled={
      originalCustomerData &&
      customerData &&
      originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] ===
        customerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] &&
      mode === "edit" &&
      customerData?.customerStatus !== "pending"
    }
    className={
      originalCustomerData &&
      customerData &&
      originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] !==
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
    originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] !==
      customerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] &&
    mode === "edit" && (
      <div className="current-value">
        Previous:{" "}
        {originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] ||
          "(empty)"}
      </div>
    )}
</div>
          {/* Entity Wise Assignment for NAQI */}
<div className="form-group">
  <label htmlFor="assignedToEntityWise">
    {t(Constants.ENTITY.NAQI)}
    {originalCustomerData &&
      customerData &&
      originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] !==
        customerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] &&
      mode === "edit" && (
        <span className="update-badge">Updated</span>
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
    value={customerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] || ""}
    onChange={setEntityWiseAssignment}
    disabled={
      originalCustomerData &&
      customerData &&
      originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] ===
        customerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] &&
      mode === "edit" &&
      customerData?.customerStatus !== "pending"
    }
    className={
      originalCustomerData &&
      customerData &&
      originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] !==
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
    originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] !==
      customerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] &&
    mode === "edit" && (
      <div className="current-value">
        Previous:{" "}
        {originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] ||
          "(empty)"}
      </div>
    )}
</div>

          {/* Entity Wise Assignment for GMTC */}
<div className="form-group">
  <label htmlFor="assignedToEntityWise">
    {t(Constants.ENTITY.GMTC)}
    {originalCustomerData &&
      customerData &&
      originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] !==
        customerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] &&
      mode === "edit" && (
        <span className="update-badge">Updated</span>
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
    value={customerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] || ""}
    onChange={setEntityWiseAssignment}
    disabled={
      originalCustomerData &&
      customerData &&
      originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] ===
        customerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] &&
      mode === "edit" &&
      customerData?.customerStatus !== "pending"
    }
    className={
      originalCustomerData &&
      customerData &&
      originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] !==
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
    originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] !==
      customerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] &&
    mode === "edit" && (
      <div className="current-value">
        Previous:{" "}
        {originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] ||
          "(empty)"}
      </div>
    )}
</div>
        </>
      )}
      <div className="form-group"></div>
      
    </div>
  );
}

export default BusinessDetails;
