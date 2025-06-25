import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchDropdownFromBasicsMaster } from "../../utilities/commonServices";
import "../../styles/forms.css";

function BusinessDetails({
  customerData = {},
  originalCustomerData = {},
  onChangeCustomerData,
  mode
}) {
  const { t } = useTranslation();

  // Dropdown fields as per your business logic
  const dropdownFields = [
    "companyType",
    "typeOfBusiness",
    "deliveryLocations",
    "customerSource",
  ];
  const [basicMasterLists, setBasicMasterLists] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const listOfBasicsMaster = await fetchDropdownFromBasicsMaster(
        dropdownFields
      );
      setBasicMasterLists(listOfBasicsMaster);
    };
    fetchData();
  }, []);

  // Example state for conditional fields
  const [typeOfBusiness, setTypeOfBusiness] = useState(
    customerData?.typeOfBusiness || ""
  );

  useEffect(() => {
    setTypeOfBusiness(customerData?.typeOfBusiness || "");
  }, [customerData?.typeOfBusiness]);

  return (
    <div className="customer-onboarding-form-grid">
      {/* Company Name (English) */}
      <div className="form-group">
        <label htmlFor="companyNameEn">
          {t("Company Name")}
          <span className="required-field">*</span>
          {originalCustomerData?.companyNameEn !=
            customerData?.companyNameEn && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="companyNameEn"
          name="companyNameEn"
          className={`text-field small ${
            originalCustomerData?.companyNameEn != customerData?.companyNameEn && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter company name")}
          value={customerData?.companyNameEn || ""}
          onChange={onChangeCustomerData}
          required
        />
        {originalCustomerData?.companyNameEn != customerData?.companyNameEn && mode === "edit" && (
          <div className="current-value">
            Previous: {originalCustomerData?.companyNameEn || "(empty)"}
          </div>
        )}
      </div>

      {/* Company Name (Arabic) */}
      <div className="form-group">
        <label htmlFor="companyNameAr">
          {t("Company Name (Arabic)")}
          <span className="required-field">*</span>
          {originalCustomerData?.companyNameAr !=
            customerData?.companyNameAr && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="companyNameAr"
          name="companyNameAr"
          className={`text-field small arabic ${
            originalCustomerData?.companyNameAr != customerData?.companyNameAr && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("أدخل اسم الشركة")}
          value={customerData?.companyNameAr || ""}
          onChange={onChangeCustomerData}
          required
        />
        {originalCustomerData?.companyNameAr != customerData?.companyNameAr && mode === "edit" && (
          <div className="current-value">
            Previous: {originalCustomerData?.companyNameAr || "(empty)"}
          </div>
        )}
      </div>

      {/* Commercial Registration # - Already implemented correctly */}
      <div className="form-group">
        <label htmlFor="crNumber">
          {t("Commercial Registration #")}
          <span className="required-field">*</span>
          {originalCustomerData?.crNumber != customerData?.crNumber && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="crNumber"
          name="crNumber"
          className={`text-field small ${
            originalCustomerData?.crNumber != customerData?.crNumber && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter value")}
          value={customerData?.crNumber || ""}
          onChange={onChangeCustomerData}
          required
        />
        {originalCustomerData?.crNumber != customerData?.crNumber && mode === "edit" && (
          <div className="current-value">
            Previous: {originalCustomerData?.crNumber || "(empty)"}
          </div>
        )}
      </div>

      {/* VAT Registration # */}
      <div className="form-group">
        <label htmlFor="vatNumber">
          {t("VAT Registration #")}
          <span className="required-field">*</span>
          {originalCustomerData?.vatNumber != customerData?.vatNumber && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="vatNumber"
          name="vatNumber"
          className={`text-field small ${
            originalCustomerData?.vatNumber != customerData?.vatNumber && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter value")}
          value={customerData?.vatNumber || ""}
          onChange={onChangeCustomerData}
          required
        />
        {originalCustomerData?.vatNumber != customerData?.vatNumber && mode === "edit" && (
          <div className="current-value">
            Previous: {originalCustomerData?.vatNumber || "(empty)"}
          </div>
        )}
      </div>

      {/* Government Registration # */}
      <div className="form-group">
        <label htmlFor="governmentRegistrationNumber">
          {t("Government Registration #")}
          <span className="required-field">*</span>
          {originalCustomerData?.governmentRegistrationNumber !=
            customerData?.governmentRegistrationNumber && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="governmentRegistrationNumber"
          name="governmentRegistrationNumber"
          className={`text-field small ${
            originalCustomerData?.governmentRegistrationNumber !=
            customerData?.governmentRegistrationNumber && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter value")}
          value={customerData?.governmentRegistrationNumber || ""}
          onChange={onChangeCustomerData}
          required
        />
        {originalCustomerData?.governmentRegistrationNumber !=
          customerData?.governmentRegistrationNumber && mode === "edit" && (
          <div className="current-value">
            Previous:{" "}
            {originalCustomerData?.governmentRegistrationNumber || "(empty)"}
          </div>
        )}
      </div>

      {/* Baladeah License # */}
      <div className="form-group">
        <label htmlFor="baladeahLicenseNumber">
          {t("Baladeah License #")}
          <span className="required-field">*</span>
          {originalCustomerData?.baladeahLicenseNumber !=
            customerData?.baladeahLicenseNumber && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="baladeahLicenseNumber"
          name="baladeahLicenseNumber"
          className={`text-field small ${
            originalCustomerData?.baladeahLicenseNumber !=
            customerData?.baladeahLicenseNumber && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter value")}
          value={customerData?.baladeahLicenseNumber || ""}
          onChange={onChangeCustomerData}
          required
        />
        {originalCustomerData?.baladeahLicenseNumber !=
          customerData?.baladeahLicenseNumber && mode === "edit" && (
          <div className="current-value">
            Previous: {originalCustomerData?.baladeahLicenseNumber || "(empty)"}
          </div>
        )}
      </div>

      {/* Company Type Dropdown */}
      <div className="form-group">
        <label htmlFor="companyType">
          {t("Company Type")}
          <span className="required-field">*</span>
          {originalCustomerData?.companyType != customerData?.companyType && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <select
          id="companyType"
          name="companyType"
          className={`dropdown ${
            originalCustomerData?.companyType != customerData?.companyType && mode === "edit"
              ? "update-field"
              : ""
          }`}
          value={customerData?.companyType || ""}
          onChange={onChangeCustomerData}
          required
        >
          <option value="" disabled>
            {t("Select")}
          </option>
          {basicMasterLists?.companyType?.map((type) => (
            <option key={type} value={type}>
              {t(type)}
            </option>
          ))}
        </select>
        {originalCustomerData?.companyType != customerData?.companyType && mode === "edit" && (
          <div className="current-value">
            Previous: {originalCustomerData?.companyType || "(empty)"}
          </div>
        )}
      </div>

      {/* Type of Business Dropdown */}
      <div className="form-group">
        <label htmlFor="typeOfBusiness">
          {t("Type of Business")}
          <span className="required-field">*</span>
          {originalCustomerData?.typeOfBusiness != typeOfBusiness && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <select
          id="typeOfBusiness"
          name="typeOfBusiness"
          className={`dropdown ${
            originalCustomerData?.typeOfBusiness != typeOfBusiness && mode === "edit"
              ? "update-field"
              : ""
          }`}
          value={typeOfBusiness}
          onChange={onChangeCustomerData}
          required
        >
          <option value="" disabled>
            {t("Select")}
          </option>
          {basicMasterLists?.typeOfBusiness?.map((type) => (
            <option key={type} value={type}>
              {t(type)}
            </option>
          ))}
        </select>
        {originalCustomerData?.typeOfBusiness != typeOfBusiness && mode === "edit" && (
          <div className="current-value">
            Previous: {originalCustomerData?.typeOfBusiness || "(empty)"}
          </div>
        )}
      </div>

      {/* Type of Business (Other) - Conditional */}
      {typeOfBusiness === "Others" && (
        <div className="form-group">
          <label htmlFor="typeOfBusinessOther">
            {t("Type of Business (Other)")}
            {originalCustomerData?.typeOfBusinessOther !=
              customerData?.typeOfBusinessOther && mode === "edit" && (
              <span className="update-badge">Updated</span>
            )}
          </label>
          <input
            type="text"
            id="typeOfBusinessOther"
            name="typeOfBusinessOther"
            className={`text-field small ${
              originalCustomerData?.typeOfBusinessOther !=
              customerData?.typeOfBusinessOther && mode === "edit"
                ? "update-field"
                : ""
            }`}
            placeholder={t("Enter other business type")}
            value={customerData?.typeOfBusinessOther || ""}
            onChange={onChangeCustomerData}
          />
          {originalCustomerData?.typeOfBusinessOther !=
            customerData?.typeOfBusinessOther && mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.typeOfBusinessOther || "(empty)"}
            </div>
          )}
        </div>
      )}

      {/* Delivery Locations Dropdown */}
      <div className="form-group">
        <label htmlFor="deliveryLocations">
          {t("Delivery Locations")}
          <span className="required-field">*</span>
          {originalCustomerData?.deliveryLocations !=
            customerData?.deliveryLocations && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <select
          id="deliveryLocations"
          name="deliveryLocations"
          className={`dropdown ${
            originalCustomerData?.deliveryLocations !=
            customerData?.deliveryLocations && mode === "edit"
              ? "update-field"
              : ""
          }`}
          value={customerData?.deliveryLocations || ""}
          onChange={onChangeCustomerData}
          required
        >
          <option value="" disabled>
            {t("Select")}
          </option>
          {basicMasterLists?.deliveryLocations?.map((loc) => (
            <option key={loc} value={loc}>
              {t(loc)}
            </option>
          ))}
        </select>
        {originalCustomerData?.deliveryLocations !=
          customerData?.deliveryLocations && mode === "edit" && (
          <div className="current-value">
            Previous: {originalCustomerData?.deliveryLocations || "(empty)"}
          </div>
        )}
      </div>

      {/* Brand Name (English) */}
      <div className="form-group">
        <label htmlFor="brandNameEn">
          {t("Brand Name")}
          {originalCustomerData?.brandNameEn != customerData?.brandNameEn && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="brandNameEn"
          name="brandNameEn"
          className={`text-field small ${
            originalCustomerData?.brandNameEn != customerData?.brandNameEn && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter brand name")}
          value={customerData?.brandNameEn || ""}
          onChange={onChangeCustomerData}
        />
        {originalCustomerData?.brandNameEn != customerData?.brandNameEn && mode === "edit" && (
          <div className="current-value">
            Previous: {originalCustomerData?.brandNameEn || "(empty)"}
          </div>
        )}
      </div>

      {/* Brand Name (Arabic) */}
      <div className="form-group">
        <label htmlFor="brandNameAr">
          {t("Brand Name (Arabic)")}
          {originalCustomerData?.brandNameAr != customerData?.brandNameAr && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="brandNameAr"
          name="brandNameAr"
          className={`text-field small arabic ${
            originalCustomerData?.brandNameAr != customerData?.brandNameAr && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("أدخل اسم العلامة التجارية")}
          value={customerData?.brandNameAr || ""}
          onChange={onChangeCustomerData}
        />
        {originalCustomerData?.brandNameAr != customerData?.brandNameAr && mode === "edit" && (
          <div className="current-value">
            Previous: {originalCustomerData?.brandNameAr || "(empty)"}
          </div>
        )}
      </div>

      {/* Company Logo - File inputs need special handling */}
      <div className="form-group file-upload">
        <label htmlFor="companyLogo">
          {t("Company Logo")}
          {originalCustomerData?.companyLogo != customerData?.companyLogo &&
            customerData?.companyLogo && mode === "edit" && (
              <span className="update-badge">Updated</span>
            )}
        </label>
        <input
          type="file"
          id="companyLogo"
          name="companyLogo"
          className={`text-field small ${
            originalCustomerData?.companyLogo != customerData?.companyLogo &&
            customerData?.companyLogo && mode === "edit"
              ? "update-field"
              : ""
          }`}
        />
        {originalCustomerData?.companyLogo != customerData?.companyLogo &&
          customerData?.companyLogo && mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.companyLogo || "(no file)"}
            </div>
          )}
      </div>

      {/* Brand Logo */}
      <div className="form-group file-upload">
        <label htmlFor="brandLogo">
          {t("Brand Logo")}
          {originalCustomerData?.brandLogo != customerData?.brandLogo &&
            customerData?.brandLogo && mode === "edit" && (
              <span className="update-badge">Updated</span>
            )}
        </label>
        <input
          type="file"
          id="brandLogo"
          name="brandLogo"
          className={`text-field small ${
            originalCustomerData?.brandLogo != customerData?.brandLogo &&
            customerData?.brandLogo && mode === "edit"
              ? "update-field"
              : ""
          }`}
        />
        {originalCustomerData?.brandLogo != customerData?.brandLogo &&
          customerData?.brandLogo && mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.brandLogo || "(no file)"}
            </div>
          )}
      </div>

      {/* Assigned To Dropdown */}
      <div className="form-group">
        <label htmlFor="assignedTo">
          {t("Assigned To")}
          {originalCustomerData?.assignedTo != customerData?.assignedTo && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <select
          id="assignedTo"
          name="assignedTo"
          className={`dropdown ${
            originalCustomerData?.assignedTo != customerData?.assignedTo && mode === "edit"
              ? "update-field"
              : ""
          }`}
          value={customerData?.assignedTo || ""}
          onChange={onChangeCustomerData}
        >
          <option value="" disabled>
            {t("Select")}
          </option>
          {basicMasterLists?.assignedTo?.map((team) => (
            <option key={team} value={team}>
              {t(team)}
            </option>
          ))}
        </select>
        {originalCustomerData?.assignedTo != customerData?.assignedTo && mode === "edit" && (
          <div className="current-value">
            Previous: {originalCustomerData?.assignedTo || "(empty)"}
          </div>
        )}
      </div>

      {/* Customer Source */}
      <div className="form-group">
        <label htmlFor="customerSource">
          {t("Customer Source")}
          {originalCustomerData?.customerSource !=
            customerData?.customerSource && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="customerSource"
          name="customerSource"
          className={`text-field small ${
            originalCustomerData?.customerSource != customerData?.customerSource && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter customer source")}
          value={customerData?.customerSource || ""}
          onChange={onChangeCustomerData}
        />
        {originalCustomerData?.customerSource !=
          customerData?.customerSource && mode === "edit" && (
          <div className="current-value">
            Previous: {originalCustomerData?.customerSource || "(empty)"}
          </div>
        )}
      </div>
    </div>
  );
}

export default BusinessDetails;
