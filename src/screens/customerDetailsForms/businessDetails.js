import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchDropdownFromBasicsMaster } from "../../utilities/commonServices";
import "../../styles/forms.css";
import { Tooltip } from "react-tooltip";

function BusinessDetails({ customerData = {}, originalCustomerData = {}, onChangeCustomerData }) {
  const { t } = useTranslation();

  // Dropdown fields as per your business logic
  const dropdownFields = ["companyType", "typeOfBusiness", "deliveryLocations", "customerSource"];
  const [basicMasterLists, setBasicMasterLists] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const listOfBasicsMaster = await fetchDropdownFromBasicsMaster(dropdownFields);
      setBasicMasterLists(listOfBasicsMaster);
    };
    fetchData();
  }, []);

  // Example state for conditional fields
  const [typeOfBusiness, setTypeOfBusiness] = useState(customerData?.typeOfBusiness || "");

  useEffect(() => {
    setTypeOfBusiness(customerData?.typeOfBusiness || "");
  }, [customerData?.typeOfBusiness]);

  return (
    <div className='customer-onboarding-form-grid'>
      {/* Company Name (English) */}
      <div className='form-group'>
        <label htmlFor='companyNameEn'>
          {t("Company Name")}
          <span className='required-field'>*</span>
        </label>
        <input
          type='text'
          id='companyNameEn'
          name='companyNameEn'
          className='text-field small'
          placeholder={t("Enter company name")}
          value={customerData?.companyNameEn || ""}
          onChange={onChangeCustomerData}
          required
        />
      </div>
      {/* Company Name (Arabic) */}
      <div className='form-group'>
        <label htmlFor='companyNameAr'>
          {t("Company Name (Arabic)")}
          <span className='required-field'>*</span>
        </label>
        <input
          type='text'
          id='companyNameAr'
          name='companyNameAr'
          className='text-field small arabic'
          placeholder={t("أدخل اسم الشركة")}
          value={customerData?.companyNameAr || ""}
          onChange={onChangeCustomerData}
          required
        />
      </div>
      {/* Commercial Registration # */}
      <div className='form-group'>
        <label htmlFor='crNumber'>
          {t("Commercial Registration #")}
          <span className='required-field'>*</span>
        </label>
        <input
          type='text'
          id='crNumber'
          name='crNumber'
          className='text-field small'
          placeholder={t("Enter value")}
          value={customerData?.crNumber || ""}
          onChange={onChangeCustomerData}
          required
          data-tooltip-id='crNumber-tooltip'
          data-tooltip-content={originalCustomerData?.crNumber != customerData?.crNumber ? t("Previous: ") + originalCustomerData?.crNumber : ""}
        />
        <Tooltip id='crNumber-tooltip' />
      </div>
      {/* VAT Registration # */}
      <div className='form-group'>
        <label htmlFor='vatNumber'>
          {t("VAT Registration #")}
          <span className='required-field'>*</span>
        </label>
        <input
          type='text'
          id='vatNumber'
          name='vatNumber'
          className='text-field small'
          placeholder={t("Enter value")}
          value={customerData?.vatNumber || ""}
          onChange={onChangeCustomerData}
          required
          data-tooltip-id='vatNumber-tooltip'
          data-tooltip-content={originalCustomerData?.vatNumber != customerData?.vatNumber ? t("Previous: ") + originalCustomerData?.vatNumber : ""}
        />
        <Tooltip id='vatNumber-tooltip' />
      </div>
      {/* Government Registration # */}
      <div className='form-group'>
        <label htmlFor='governmentRegistrationNumber'>
          {t("Government Registration #")}
          <span className='required-field'>*</span>
        </label>
        <input
          type='text'
          id='governmentRegistrationNumber'
          name='governmentRegistrationNumber'
          className='text-field small'
          placeholder={t("Enter value")}
          value={customerData?.governmentRegistrationNumber || ""}
          onChange={onChangeCustomerData}
          required
          data-tooltip-id='governmentRegistrationNumber-tooltip'
          data-tooltip-content={
            originalCustomerData?.governmentRegistrationNumber != customerData?.governmentRegistrationNumber
              ? t("Previous: ") + originalCustomerData?.governmentRegistrationNumber
              : ""
          }
        />
        <Tooltip id='governmentRegistrationNumber-tooltip' />
      </div>
      {/* Baladeah License # */}
      <div className='form-group'>
        <label htmlFor='baladeahLicenseNumber'>
          {t("Baladeah License #")}
          <span className='required-field'>*</span>
        </label>
        <input
          type='text'
          id='baladeahLicenseNumber'
          name='baladeahLicenseNumber'
          className='text-field small'
          placeholder={t("Enter value")}
          value={customerData?.baladeahLicenseNumber || ""}
          onChange={onChangeCustomerData}
          required
          data-tooltip-id='baladeahLicenseNumber-tooltip'
          data-tooltip-content={
            originalCustomerData?.baladeahLicenseNumber != customerData?.baladeahLicenseNumber
              ? t("Previous: ") + originalCustomerData?.baladeahLicenseNumber
              : ""
          }
        />
        <Tooltip id='baladeahLicenseNumber-tooltip' />
      </div>
      {/* Company Type Dropdown */}
      <div className='form-group'>
        <label htmlFor='companyType'>
          {t("Company Type")}
          <span className='required-field'>*</span>
        </label>
        <select
          id='companyType'
          name='companyType'
          className='dropdown'
          value={customerData?.companyType || ""}
          onChange={onChangeCustomerData}
          required
          data-tooltip-id='companyType-tooltip'
          data-tooltip-content={originalCustomerData?.companyType != customerData?.companyType ? t("Previous: ") + originalCustomerData?.companyType : ""}>
          <option value='' disabled>
            {t("Select")}
          </option>
          {basicMasterLists?.companyType?.map((type) => (
            <option key={type} value={type}>
              {t(type)}
            </option>
          ))}
        </select>
        <Tooltip id='companyType-tooltip' />
      </div>
      {/* Type of Business Dropdown */}
      <div className='form-group'>
        <label htmlFor='typeOfBusiness'>
          {t("Type of Business")}
          <span className='required-field'>*</span>
        </label>
        <select
          id='typeOfBusiness'
          name='typeOfBusiness'
          className='dropdown'
          value={typeOfBusiness}
          onChange={onChangeCustomerData}
          required
          data-tooltip-id='typeOfBusiness-tooltip'
          data-tooltip-content={originalCustomerData?.typeOfBusiness != typeOfBusiness ? t("Previous: ") + originalCustomerData?.typeOfBusiness : ""}>
          <option value='' disabled>
            {t("Select")}
          </option>
          {basicMasterLists?.typeOfBusiness?.map((type) => (
            <option key={type} value={type}>
              {t(type)}
            </option>
          ))}
        </select>
        <Tooltip id='typeOfBusiness-tooltip' />
      </div>
      {/* Type of Business (Other) - Conditional */}
      {typeOfBusiness === "Others" && (
        <div className='form-group'>
          <label htmlFor='typeOfBusinessOther'>{t("Type of Business (Other)")}</label>
          <input
            type='text'
            id='typeOfBusinessOther'
            name='typeOfBusinessOther'
            className='text-field small'
            placeholder={t("Enter other business type")}
            value={customerData?.typeOfBusinessOther || ""}
            onChange={onChangeCustomerData}
          />
        </div>
      )}
      {/* Delivery Locations Dropdown */}
      <div className='form-group'>
        <label htmlFor='deliveryLocations'>
          {t("Delivery Locations")}
          <span className='required-field'>*</span>
        </label>
        <select
          id='deliveryLocations'
          name='deliveryLocations'
          className='dropdown'
          value={customerData?.deliveryLocations || ""}
          onChange={onChangeCustomerData}
          required>
          <option value='' disabled>
            {t("Select")}
          </option>
          {basicMasterLists?.deliveryLocations?.map((loc) => (
            <option key={loc} value={loc}>
              {t(loc)}
            </option>
          ))}
        </select>
      </div>
      {/* Brand Name (English) */}
      <div className='form-group'>
        <label htmlFor='brandNameEn'>{t("Brand Name")}</label>
        <input
          type='text'
          id='brandNameEn'
          name='brandNameEn'
          className='text-field small'
          placeholder={t("Enter brand name")}
          value={customerData?.brandNameEn || ""}
          onChange={onChangeCustomerData}
        />
      </div>
      {/* Brand Name (Arabic) */}
      <div className='form-group'>
        <label htmlFor='brandNameAr'>{t("Brand Name (Arabic)")}</label>
        <input
          type='text'
          id='brandNameAr'
          name='brandNameAr'
          className='text-field small arabic'
          placeholder={t("أدخل اسم العلامة التجارية")}
          value={customerData?.brandNameAr || ""}
          onChange={onChangeCustomerData}
        />
      </div>
      {/* Company Logo */}
      <div className='form-group file-upload'>
        <label htmlFor='companyLogo'>{t("Company Logo")}</label>
        <input
          type='file'
          id='companyLogo'
          name='companyLogo'
          className='text-field small'
          // value not set for file input
        />
      </div>
      {/* Brand Logo */}
      <div className='form-group file-upload'>
        <label htmlFor='brandLogo'>{t("Brand Logo")}</label>
        <input
          type='file'
          id='brandLogo'
          name='brandLogo'
          className='text-field small'
          // value not set for file input
        />
      </div>
      {/* Assigned To Dropdown */}
      <div className='form-group'>
        <label htmlFor='assignedTo'>{t("Assigned To")}</label>
        <select id='assignedTo' name='assignedTo' className='dropdown' value={customerData?.assignedTo || ""} onChange={onChangeCustomerData}>
          <option value='' disabled>
            {t("Select")}
          </option>
          {basicMasterLists?.assignedTo?.map((team) => (
            <option key={team} value={team}>
              {t(team)}
            </option>
          ))}
        </select>
      </div>
      {/* Customer Source */}
      <div className='form-group'>
        <label htmlFor='customerSource'>{t("Customer Source")}</label>
        <input
          type='text'
          id='customerSource'
          name='customerSource'
          className='text-field small'
          placeholder={t("Enter customer source")}
          value={customerData?.customerSource || ""}
          onChange={onChangeCustomerData}
        />
      </div>
      {/* Add other dropdowns and fields as needed, following the same pattern */}
    </div>
  );
}

export default BusinessDetails;
