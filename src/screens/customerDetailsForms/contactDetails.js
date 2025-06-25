import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchDropdownFromBasicsMaster } from "../../utilities/commonServices";
import "../../styles/forms.css";

function ContactDetails({
  customerData = {},
  customerContactsData = {},
  originalCustomerData = {},
  originalCustomerContactsData = {},
  onChangeCustomerContactsData,
  onChangeCustomerData,
  mode
}) {
  // Now you can access both objects
  const { t } = useTranslation();
  const [businessHeadSameAsPrimary, setBusinessHeadSameAsPrimary] =
    useState(false);

  // Dropdown state
  const dropdownFields = ["district", "city", "region", "zone"];
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
  const getBindingValue = (contactType, fieldname) => {
    if (Array.isArray(customerContactsData.data)) {
      const contact = customerContactsData.data.find(
        (item) => item.contactType === contactType
      );
      return contact ? contact[fieldname] || "" : "";
    }
    return "";
  };
  return (
    <div className="customer-onboarding-form-grid">
      {/* Primary Contact Details Header */}
      <div className="form-header full-width">
        {t("Primary Contact Details")}
      </div>
      <div className="form-group">
        <label htmlFor="primaryContactName">
          {t("Primary Contact Name")}
          <span className="required-field">*</span>
          {originalCustomerContactsData?.primaryContactName !=
            customerContactsData?.primaryContactName && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="primaryContactName"
          name="primaryContactName"
          className={`text-field small ${
            originalCustomerContactsData?.primaryContactName !=
            customerContactsData?.primaryContactName && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter name")}
          value={customerContactsData?.primaryContactName || ""}
          onChange={onChangeCustomerContactsData}
          required
        />
        {originalCustomerContactsData?.primaryContactName !=
          customerContactsData?.primaryContactName && mode === "edit" && (
          <div className="current-value">
            Previous:{" "}
            {originalCustomerContactsData?.primaryContactName || "(empty)"}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="primaryContactDesignation">
          {t("Designation")}
          <span className="required-field">*</span>
          {originalCustomerContactsData?.primaryContactDesignation !=
            customerContactsData?.primaryContactDesignation && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="primaryContactDesignation"
          name="primaryContactDesignation"
          className={`text-field small ${
            originalCustomerContactsData?.primaryContactDesignation !=
            customerContactsData?.primaryContactDesignation && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter designation")}
          value={customerContactsData?.primaryContactDesignation || ""}
          onChange={onChangeCustomerContactsData}
          required
        />
        {originalCustomerContactsData?.primaryContactDesignation !=
          customerContactsData?.primaryContactDesignation && mode === "edit" && (
          <div className="current-value">
            Previous:{" "}
            {originalCustomerContactsData?.primaryContactDesignation ||
              "(empty)"}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="primaryContactEmail">
          {t("Email")}
          <span className="required-field">*</span>
          {originalCustomerContactsData?.primaryContactEmail !=
            customerContactsData?.primaryContactEmail && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="primaryContactEmail"
          name="primaryContactEmail"
          className={`text-field small ${
            originalCustomerContactsData?.primaryContactEmail !=
            customerContactsData?.primaryContactEmail && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter email")}
          value={customerContactsData?.primaryContactEmail || ""}
          onChange={onChangeCustomerContactsData}
          required
        />
        {originalCustomerContactsData?.primaryContactEmail !=
          customerContactsData?.primaryContactEmail && mode === "edit" && (
          <div className="current-value">
            Previous:{" "}
            {originalCustomerContactsData?.primaryContactEmail || "(empty)"}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="primaryContactMobile">
          {t("Mobile")}
          <span className="required-field">*</span>
          {originalCustomerContactsData?.primaryContactMobile !=
            customerContactsData?.primaryContactMobile && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="primaryContactMobile"
          name="primaryContactMobile"
          className={`text-field small ${
            originalCustomerContactsData?.primaryContactMobile !=
            customerContactsData?.primaryContactMobile && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter Mobile number")}
          value={customerContactsData?.primaryContactMobile || ""}
          onChange={onChangeCustomerContactsData}
          required
        />
        {originalCustomerContactsData?.primaryContactMobile !=
          customerContactsData?.primaryContactMobile && mode === "edit" && (
          <div className="current-value">
            Previous:{" "}
            {originalCustomerContactsData?.primaryContactMobile || "(empty)"}
          </div>
        )}
      </div>

      {/* Business Head Header */}
      <div className="form-header full-width">{t("Business Head")}</div>
      <div className="form-group">
        <label className="checkbox-group-label">
          <input
            type="checkbox"
            id="businessHeadSameAsPrimary"
            name="businessHeadSameAsPrimary"
            checked={businessHeadSameAsPrimary}
            onChange={(e) => setBusinessHeadSameAsPrimary(e.target.checked)}
          />
          {t("Same as Primary Contact Details")}
        </label>
      </div>
      <div className="form-group" />
      <div className="form-group">
        <label htmlFor="businessHeadName">
          {t("Business Head Name")}
          <span className="required-field">*</span>
          {originalCustomerContactsData?.businessHeadName !=
            customerContactsData?.businessHeadName && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="businessHeadName"
          name="businessHeadName"
          className={`text-field small ${
            originalCustomerContactsData?.businessHeadName !=
            customerContactsData?.businessHeadName && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter name")}
          value={customerContactsData?.businessHeadName || ""}
          onChange={onChangeCustomerContactsData}
          required
        />
        {originalCustomerContactsData?.businessHeadName !=
          customerContactsData?.businessHeadName && mode === "edit" && (
          <div className="current-value">
            Previous:{" "}
            {originalCustomerContactsData?.businessHeadName || "(empty)"}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="businessHeadDesignation">
          {t("Designation")}
          <span className="required-field">*</span>
          {originalCustomerContactsData?.businessHeadDesignation !=
            customerContactsData?.businessHeadDesignation && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="businessHeadDesignation"
          name="businessHeadDesignation"
          className={`text-field small ${
            originalCustomerContactsData?.businessHeadDesignation !=
            customerContactsData?.businessHeadDesignation && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter designation")}
          value={customerContactsData?.businessHeadDesignation || ""}
          onChange={onChangeCustomerContactsData}
          required
        />
        {originalCustomerContactsData?.businessHeadDesignation !=
          customerContactsData?.businessHeadDesignation && mode === "edit" && (
          <div className="current-value">
            Previous:{" "}
            {originalCustomerContactsData?.businessHeadDesignation || "(empty)"}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="businessHeadEmail">
          {t("Email")}
          <span className="required-field">*</span>
          {originalCustomerContactsData?.businessHeadEmail !=
            customerContactsData?.businessHeadEmail && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="businessHeadEmail"
          name="businessHeadEmail"
          className={`text-field small ${
            originalCustomerContactsData?.businessHeadEmail !=
            customerContactsData?.businessHeadEmail && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter email")}
          value={customerContactsData?.businessHeadEmail || ""}
          onChange={onChangeCustomerContactsData}
          required
        />
        {originalCustomerContactsData?.businessHeadEmail !=
          customerContactsData?.businessHeadEmail && mode === "edit" && (
          <div className="current-value">
            Previous:{" "}
            {originalCustomerContactsData?.businessHeadEmail || "(empty)"}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="businessHeadMobile">
          {t("Mobile")}
          <span className="required-field">*</span>
          {originalCustomerContactsData?.businessHeadMobile !=
            customerContactsData?.businessHeadMobile && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="businessHeadMobile"
          name="businessHeadMobile"
          className={`text-field small ${
            originalCustomerContactsData?.businessHeadMobile !=
            customerContactsData?.businessHeadMobile && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter Mobile number")}
          value={customerContactsData?.businessHeadMobile || ""}
          onChange={onChangeCustomerContactsData}
          required
        />
        {originalCustomerContactsData?.businessHeadMobile !=
          customerContactsData?.businessHeadMobile && mode === "edit" && (
          <div className="current-value">
            Previous:{" "}
            {originalCustomerContactsData?.businessHeadMobile || "(empty)"}
          </div>
        )}
      </div>

      {/* Finance Head Header */}
      <div className="form-header full-width">{t("Finance Head")}</div>
      <div className="form-group">
        <label htmlFor="financeHeadName">
          {t("Finance Head Name")}
          <span className="required-field">*</span>
          {originalCustomerContactsData?.financeHeadName !=
            customerContactsData?.financeHeadName && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="financeHeadName"
          name="financeHeadName"
          className={`text-field small ${
            originalCustomerContactsData?.financeHeadName !=
            customerContactsData?.financeHeadName && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter name")}
          value={customerContactsData?.financeHeadName || ""}
          onChange={onChangeCustomerContactsData}
          required
        />
        {originalCustomerContactsData?.financeHeadName !=
          customerContactsData?.financeHeadName && mode === "edit" && (
          <div className="current-value">
            Previous:{" "}
            {originalCustomerContactsData?.financeHeadName || "(empty)"}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="financeHeadDesignation">
          {t("Designation")}
          <span className="required-field">*</span>
          {originalCustomerContactsData?.financeHeadDesignation !=
            customerContactsData?.financeHeadDesignation && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="financeHeadDesignation"
          name="financeHeadDesignation"
          className={`text-field small ${
            originalCustomerContactsData?.financeHeadDesignation !=
            customerContactsData?.financeHeadDesignation && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter designation")}
          value={customerContactsData?.financeHeadDesignation || ""}
          onChange={onChangeCustomerContactsData}
          required
        />
        {originalCustomerContactsData?.financeHeadDesignation !=
          customerContactsData?.financeHeadDesignation && mode === "edit" && (
          <div className="current-value">
            Previous:{" "}
            {originalCustomerContactsData?.financeHeadDesignation || "(empty)"}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="financeHeadEmail">
          {t("Email")}
          <span className="required-field">*</span>
          {originalCustomerContactsData?.financeHeadEmail !=
            customerContactsData?.financeHeadEmail && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="financeHeadEmail"
          name="financeHeadEmail"
          className={`text-field small ${
            originalCustomerContactsData?.financeHeadEmail !=
            customerContactsData?.financeHeadEmail && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter email")}
          value={customerContactsData?.financeHeadEmail || ""}
          onChange={onChangeCustomerContactsData}
          required
        />
        {originalCustomerContactsData?.financeHeadEmail !=
          customerContactsData?.financeHeadEmail && mode === "edit" && (
          <div className="current-value">
            Previous:{" "}
            {originalCustomerContactsData?.financeHeadEmail || "(empty)"}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="financeHeadMobile">
          {t("Mobile")}
          <span className="required-field">*</span>
          {originalCustomerContactsData?.financeHeadMobile !=
            customerContactsData?.financeHeadMobile && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="financeHeadMobile"
          name="financeHeadMobile"
          className={`text-field small ${
            originalCustomerContactsData?.financeHeadMobile !=
            customerContactsData?.financeHeadMobile && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter Mobile number")}
          value={customerContactsData?.financeHeadMobile || ""}
          onChange={onChangeCustomerContactsData}
          required
        />
        {originalCustomerContactsData?.financeHeadMobile !=
          customerContactsData?.financeHeadMobile && mode === "edit" && (
          <div className="current-value">
            Previous:{" "}
            {originalCustomerContactsData?.financeHeadMobile || "(empty)"}
          </div>
        )}
      </div>

      {/* Purchasing Head Header */}
      <div className="form-header full-width">{t("Purchasing Head")}</div>
      <div className="form-group">
        <label htmlFor="purchasingHeadName">
          {t("Purchasing Head Name")}
          <span className="required-field">*</span>
          {originalCustomerContactsData?.purchasingHeadName !=
            customerContactsData?.purchasingHeadName && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="purchasingHeadName"
          name="purchasingHeadName"
          className={`text-field small ${
            originalCustomerContactsData?.purchasingHeadName !=
            customerContactsData?.purchasingHeadName && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter name")}
          value={customerContactsData?.purchasingHeadName || ""}
          onChange={onChangeCustomerContactsData}
          required
        />
        {originalCustomerContactsData?.purchasingHeadName !=
          customerContactsData?.purchasingHeadName && mode === "edit" && (
          <div className="current-value">
            Previous:{" "}
            {originalCustomerContactsData?.purchasingHeadName || "(empty)"}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="purchasingHeadDesignation">
          {t("Designation")}
          <span className="required-field">*</span>
          {originalCustomerContactsData?.purchasingHeadDesignation !=
            customerContactsData?.purchasingHeadDesignation && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="purchasingHeadDesignation"
          name="purchasingHeadDesignation"
          className={`text-field small ${
            originalCustomerContactsData?.purchasingHeadDesignation !=
            customerContactsData?.purchasingHeadDesignation && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter designation")}
          value={customerContactsData?.purchasingHeadDesignation || ""}
          onChange={onChangeCustomerContactsData}
          required
        />
        {originalCustomerContactsData?.purchasingHeadDesignation !=
          customerContactsData?.purchasingHeadDesignation && mode === "edit" && (
          <div className="current-value">
            Previous:{" "}
            {originalCustomerContactsData?.purchasingHeadDesignation ||
              "(empty)"}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="purchasingHeadEmail">
          {t("Email")}
          <span className="required-field">*</span>
          {originalCustomerContactsData?.purchasingHeadEmail !=
            customerContactsData?.purchasingHeadEmail && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="purchasingHeadEmail"
          name="purchasingHeadEmail"
          className={`text-field small ${
            originalCustomerContactsData?.purchasingHeadEmail !=
            customerContactsData?.purchasingHeadEmail && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter email")}
          value={customerContactsData?.purchasingHeadEmail || ""}
          onChange={onChangeCustomerContactsData}
          required
        />
        {originalCustomerContactsData?.purchasingHeadEmail !=
          customerContactsData?.purchasingHeadEmail && mode === "edit" && (
          <div className="current-value">
            Previous:{" "}
            {originalCustomerContactsData?.purchasingHeadEmail || "(empty)"}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="purchasingHeadMobile">
          {t("Mobile")}
          <span className="required-field">*</span>
          {originalCustomerContactsData?.purchasingHeadMobile !=
            customerContactsData?.purchasingHeadMobile && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="purchasingHeadMobile"
          name="purchasingHeadMobile"
          className={`text-field small ${
            originalCustomerContactsData?.purchasingHeadMobile !=
            customerContactsData?.purchasingHeadMobile && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter Mobile number")}
          value={customerContactsData?.purchasingHeadMobile || ""}
          onChange={onChangeCustomerContactsData}
          required
        />
        {originalCustomerContactsData?.purchasingHeadMobile !=
          customerContactsData?.purchasingHeadMobile && mode === "edit" && (
          <div className="current-value">
            Previous:{" "}
            {originalCustomerContactsData?.purchasingHeadMobile || "(empty)"}
          </div>
        )}
      </div>

      {/* Business Address Header */}
      <div className="form-header full-width">{t("Business Address")}</div>
      <div className="form-group">
        <label htmlFor="buildingName">
          {t("Building Name")}
          <span className="required-field">*</span>
          {originalCustomerData?.buildingName != customerData?.buildingName &&  mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="buildingName"
          name="buildingName"
          className={`text-field small ${
            originalCustomerData?.buildingName != customerData?.buildingName && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter building name")}
          value={customerData?.buildingName || ""}
          onChange={onChangeCustomerData}
          required
        />
        {originalCustomerData?.buildingName != customerData?.buildingName && mode === "edit" && (
          <div className="current-value">
            Previous: {originalCustomerData?.buildingName || "(empty)"}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="street">
          {t("Street")}
          <span className="required-field">*</span>
          {originalCustomerData?.street != customerData?.street &&  mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="street"
          name="street"
          className={`text-field small ${
            originalCustomerData?.street != customerData?.street && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter street")}
          value={customerData?.street || ""}
          onChange={onChangeCustomerData}
          required
        />
        {originalCustomerData?.street != customerData?.street && mode === "edit" && (
          <div className="current-value">
            Previous: {originalCustomerData?.street || "(empty)"}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="district">
          {t("District")}
          <span className="required-field">*</span>
          {originalCustomerData?.district != customerData?.district && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <select
          id="district"
          name="district"
          className={`dropdown ${
            originalCustomerData?.district != customerData?.district && mode === "edit"
              ? "update-field"
              : ""
          }`}
          value={customerData?.district || ""}
          onChange={onChangeCustomerData}
          required
        >
          <option value="" disabled>
            {t("Enter district")}
          </option>
          {basicMasterLists?.district?.map((district) => (
            <option key={district} value={district}>
              {t(district)}
            </option>
          ))}
        </select>
        {originalCustomerData?.district != customerData?.district && mode === "edit" && (
          <div className="current-value">
            Previous: {originalCustomerData?.district || "(empty)"}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="city">
          {t("City")}
          <span className="required-field">*</span>
          {originalCustomerData?.city != customerData?.city && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <select
          id="city"
          name="city"
          className={`dropdown ${
            originalCustomerData?.city != customerData?.city && customerData?.city && mode === "edit"
              ? "update-field"
              : ""
          }`}
          value={customerData?.city || ""}
          onChange={onChangeCustomerData}
          required
        >
          <option value="" disabled>
            {t("Enter city")}
          </option>
          {basicMasterLists?.city?.map((city) => (
            <option key={city} value={city}>
              {t(city)}
            </option>
          ))}
        </select>
        {originalCustomerData?.city != customerData?.city &&  mode === "edit" && (
          <div className="current-value">
            Previous: {originalCustomerData?.city || "(empty)"}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="region">
          {t("Region")}
          <span className="required-field">*</span>
          {originalCustomerData?.region != customerData?.region && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <select
          id="region"
          name="region"
          className={`dropdown ${
            originalCustomerData?.region != customerData?.region && mode === "edit"
              ? "update-field"
              : ""
          }`}
          value={customerData?.region || ""}
          onChange={onChangeCustomerData}
          required
        >
          <option value="" disabled>
            {t("Enter region")}
          </option>
          {basicMasterLists?.region?.map((region) => (
            <option key={region} value={region}>
              {t(region)}
            </option>
          ))}
        </select>
        {originalCustomerData?.region != customerData?.region &&  mode === "edit" && (
          <div className="current-value">
            Previous: {originalCustomerData?.region || "(empty)"}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="zone">
          {t("Zone")}
          <span className="required-field">*</span>
          {originalCustomerData?.zone != customerData?.zone && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <select
          id="zone"
          name="zone"
          className={`dropdown ${
            originalCustomerData?.zone != customerData?.zone && mode === "edit"
              ? "update-field"
              : ""
          }`}
          value={customerData?.zone || ""}
          onChange={onChangeCustomerData}
          required
        >
          <option value="" disabled>
            {t("Enter zone")}
          </option>
          {basicMasterLists?.zone?.map((zone) => (
            <option key={zone} value={zone}>
              {t(zone)}
            </option>
          ))}
        </select>
        {originalCustomerData?.zone != customerData?.zone && mode === "edit" && (
          <div className="current-value">
            Previous: {originalCustomerData?.zone || "(empty)"}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="pincode">
          {t("Pincode")}
          <span className="required-field">*</span>
          {originalCustomerData?.pincode != customerData?.pincode && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="pincode"
          name="pincode"
          className={`text-field small ${
            originalCustomerData?.pincode != customerData?.pincode && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter pincode")}
          value={customerData?.pincode || ""}
          onChange={onChangeCustomerData}
          required
        />
        {originalCustomerData?.pincode != customerData?.pincode && mode === "edit" && (
          <div className="current-value">
            Previous: {originalCustomerData?.pincode || "(empty)"}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="geolocation">
          {t("Geolocation")}
          <span className="required-field">*</span>
          {originalCustomerData?.geolocation != customerData?.geolocation && mode === "edit" && (
            <span className="update-badge">Updated</span>
          )}
        </label>
        <input
          type="text"
          id="geolocation"
          name="geolocation"
          className={`text-field small ${
            originalCustomerData?.geolocation != customerData?.geolocation && mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter geolocation")}
          value={
            typeof customerData?.geolocation === 'object' 
              ? JSON.stringify(customerData?.geolocation) 
              : (customerData?.geolocation || "")
          }
          onChange={onChangeCustomerData}
          required
        />
        {originalCustomerData?.geolocation != customerData?.geolocation && mode === "edit" && (
          <div className="current-value">
            Previous:{" "}
            {typeof originalCustomerData?.geolocation === 'object'
              ? JSON.stringify(originalCustomerData?.geolocation)
              : (originalCustomerData?.geolocation || "(empty)")}
          </div>
        )}
      </div>
    </div>
  );
}

export default ContactDetails;
