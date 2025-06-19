import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchDropdownFromBasicsMaster } from "../../utilities/commonServices";
import "../../styles/forms.css";

function ContactDetails({ customerData = {}, customerContactsData = {}, onChangeCustomerContactsData, onChangeCustomerData }) {
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
        </label>
        <input
          type="text"
          id="primaryContactName"
          name="primaryContactName"
          className="text-field small"
          placeholder={t("Enter name")}
          value={customerContactsData?.primaryContactName}
          onChange={onChangeCustomerContactsData}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="primaryContactDesignation">
          {t("Designation")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="primaryContactDesignation"
          name="primaryContactDesignation"
          className="text-field small"
          placeholder={t("Enter designation")}
          value={customerContactsData?.primaryContactDesignation}
          onChange={onChangeCustomerContactsData}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="primaryContactEmail">
          {t("Email")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="primaryContactEmail"
          name="primaryContactEmail"
          className="text-field small"
          placeholder={t("Enter email")}
          value={customerContactsData?.primaryContactEmail}
          onChange={onChangeCustomerContactsData}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="primaryContactMobile">
          {t("Mobile")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="primaryContactMobile"
          name="primaryContactMobile"
          className="text-field small"
          placeholder={t("Enter Mobile number")}
          value={customerContactsData?.primaryContactMobile}
          onChange={onChangeCustomerContactsData}
          required
        />
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
        </label>
        <input
          type="text"
          id="businessHeadName"
          name="businessHeadName"
          className="text-field small"
          placeholder={t("Enter name")}
          value={customerContactsData?.businessHeadName}
          onChange={onChangeCustomerContactsData}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="businessHeadDesignation">
          {t("Designation")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="businessHeadDesignation"
          name="businessHeadDesignation"
          className="text-field small"
          placeholder={t("Enter designation")}
          value={customerContactsData?.businessHeadDesignation}
          onChange={onChangeCustomerContactsData}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="businessHeadEmail">
          {t("Email")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="businessHeadEmail"
          name="businessHeadEmail"
          className="text-field small"
          placeholder={t("Enter email")}
          value={customerContactsData?.businessHeadEmail}
          onChange={onChangeCustomerContactsData}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="businessHeadMobile">
          {t("Mobile")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="businessHeadMobile"
          name="businessHeadMobile"
          className="text-field small"
          placeholder={t("Enter Mobile number")}
          value={customerContactsData?.businessHeadMobile}
          onChange={onChangeCustomerContactsData}
          required
        />
      </div>

      {/* Finance Head Header */}
      <div className="form-header full-width">{t("Finance Head")}</div>
      <div className="form-group">
        <label htmlFor="financeHeadName">
          {t("Finance Head Name")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="financeHeadName"
          name="financeHeadName"
          className="text-field small"
          placeholder={t("Enter name")}
          value={customerContactsData?.financeHeadName}
          onChange={onChangeCustomerContactsData}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="financeHeadDesignation">
          {t("Designation")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="financeHeadDesignation"
          name="financeHeadDesignation"
          className="text-field small"
          placeholder={t("Enter designation")}
          value={customerContactsData?.financeHeadDesignation}
          onChange={onChangeCustomerContactsData}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="financeHeadEmail">
          {t("Email")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="financeHeadEmail"
          name="financeHeadEmail"
          className="text-field small"
          placeholder={t("Enter email")}
          value={customerContactsData?.financeHeadEmail}
          onChange={onChangeCustomerContactsData}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="financeHeadMobile">
          {t("Mobile")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="financeHeadMobile"
          name="financeHeadMobile"
          className="text-field small"
          placeholder={t("Enter Mobile number")}
          value={customerContactsData?.financeHeadMobile}
          onChange={onChangeCustomerContactsData}
          required
        />
      </div>

      {/* Purchasing Head Header */}
      <div className="form-header full-width">{t("Purchasing Head")}</div>
      <div className="form-group">
        <label htmlFor="purchasingHeadName">
          {t("Purchasing Head Name")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="purchasingHeadName"
          name="purchasingHeadName"
          className="text-field small"
          placeholder={t("Enter name")}
          value={customerContactsData?.purchasingHeadName}
          onChange={onChangeCustomerContactsData}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="purchasingHeadDesignation">
          {t("Designation")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="purchasingHeadDesignation"
          name="purchasingHeadDesignation"
          className="text-field small"
          placeholder={t("Enter designation")}
          value={customerContactsData?.purchasingHeadDesignation}
          onChange={onChangeCustomerContactsData}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="purchasingHeadEmail">
          {t("Email")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="purchasingHeadEmail"
          name="purchasingHeadEmail"
          className="text-field small"
          placeholder={t("Enter email")}
          value={customerContactsData?.purchasingHeadEmail}
          onChange={onChangeCustomerContactsData}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="purchasingHeadMobile">
          {t("Mobile")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="purchasingHeadMobile"
          name="purchasingHeadMobile"
          className="text-field small"
          placeholder={t("Enter Mobile number")}
          value={customerContactsData?.purchasingHeadMobile}
          onChange={onChangeCustomerContactsData}
          required
        />
      </div>

      {/* Business Address Header */}
      <div className="form-header full-width">{t("Business Address")}</div>
      <div className="form-group">
        <label htmlFor="buildingName">
          {t("Building Name")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="buildingName"
          name="buildingName"
          className="text-field small"
          placeholder={t("Enter building name")}
          value={customerData?.buildingName}
          onChange={onChangeCustomerData}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="street">
          {t("Street")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="street"
          name="street"
          className="text-field small"
          placeholder={t("Enter street")}
          value={customerData?.street}
          onChange={onChangeCustomerData}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="district">
          {t("District")}
          <span className="required-field">*</span>
        </label>
        <select id="district" name="district" className="dropdown" value={customerData?.district} onChange={onChangeCustomerData} required>
          <option value="" disabled>
            {t("Enter district")}
          </option>
          {basicMasterLists?.district?.map((district) => (
            <option key={district} value={district}>
              {t(district)}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="city">
          {t("City")}
          <span className="required-field">*</span>
        </label>
        <select id="city" name="city" className="dropdown" value={customerData?.city} onChange={onChangeCustomerData} required>
          <option value="" disabled>
            {t("Enter city")}
          </option>
          {basicMasterLists?.city?.map((city) => (
            <option key={city} value={city}>
              {t(city)}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="region">
          {t("Region")}
          <span className="required-field">*</span>
        </label>
        <select id="region" name="region" className="dropdown" value={customerData?.region} onChange={onChangeCustomerData} required>
          <option value="" disabled>
            {t("Enter region")}
          </option>
          {basicMasterLists?.region?.map((region) => (
            <option key={region} value={region}>
              {t(region)}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="zone">
          {t("Zone")}
          <span className="required-field">*</span>
        </label>
        <select id="zone" name="zone" className="dropdown" value={customerData?.zone} onChange={onChangeCustomerData} required>
          <option value="" disabled>
            {t("Enter zone")}
          </option>
          {basicMasterLists?.zone?.map((zone) => (
            <option key={zone} value={zone}>
              {t(zone)}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="pincode">
          {t("Pincode")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="pincode"
          name="pincode"
          className="text-field small"
          placeholder={t("Enter pincode")}
          value={customerData?.pincode}
          onChange={onChangeCustomerData}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="geolocation">
          {t("Geolocation")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="geolocation"
          name="geolocation"
          className="text-field small"
          placeholder={t("Enter geolocation")}
          value={customerData?.geolocation}
          onChange={onChangeCustomerData}
          required
        />
      </div>
    </div>
  );
}

export default ContactDetails;
