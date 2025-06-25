import { faAnchorLock } from "@fortawesome/free-solid-svg-icons";
import { typeOf } from "maplibre-gl";
import Constants from "../../constants";

export function businessDetails() {
  return (
    <div className="customer-onboarding-form-grid">
      <div className="form-main-header">
        <a href="#">{t("Customer Approval Checklist")}</a>
      </div>
      <div className="form-group">
        <label htmlFor="companyNameEn">
          {t("Company Name")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="companyNameEn"
          name="companyNameEn"
          className="text-field small"
          placeholder={t("Enter company name")}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="companyNameAr">
          {t("Company Name (Arabic)")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="companyNameAr"
          name="companyNameAr"
          className="text-field small arabic"
          placeholder={t("أدخل اسم الشركة")}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="crNumber">
          {t("Commercial Registration #")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="crNumber"
          name="crNumber"
          className="text-field small"
          placeholder={t("Enter value")}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="vatNumber">
          {t("VAT Registration #")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="vatNumber"
          name="vatNumber"
          className="text-field small"
          placeholder={t("Enter value")}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="governmentRegistrationNumber">
          {t("Government Registration #")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="governmentRegistrationNumber"
          name="governmentRegistrationNumber"
          className="text-field small"
          placeholder={t("Enter value")}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="baladeahLicenseNumber">
          {t("Baladeah License #")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          id="baladeahLicenseNumber"
          name="baladeahLicenseNumber"
          className="text-field small"
          placeholder={t("Enter value")}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="companyType">
          {t("Company Type")}
          <span className="required-field">*</span>
        </label>
        <select
          id="companyType"
          name="companyType"
          className="dropdown"
          required
        >
          <option value="" disabled>
            {t("Select")}
          </option>
          <option value="Trading">{t("Trading")}</option>
          <option value="Non-Trading">{t("Non-Trading")}</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="typeOfBusiness">
          {t("Type of Business")}
          <span className="required-field">*</span>
        </label>
        <select
          id="typeOfBusiness"
          name="typeOfBusiness"
          className="dropdown"
          required
          onChange={handleTypeOfBusinessChange} // Add this handler in your component
          value={typeOfBusiness}
        >
          <option value="" disabled>
            {t("Select")}
          </option>
          <option value="Restaurant">{t("Restaurant")}</option>
          <option value="Coffee Shop">{t("Coffee Shop")}</option>
          <option value="Supermarket">{t("Supermarket")}</option>
          <option value="E-commerce">{t("E-commerce")}</option>
          <option value="Quick Commerce">{t("Quick Commerce")}</option>
          <option value="Hospital">{t("Hospital")}</option>
          <option value="Labor Camp">{t("Labor Camp")}</option>
          <option value="Others">{t("Others")}</option>
        </select>
      </div>

      {typeOfBusiness === "Others" && (
        <div className="form-group">
          <label htmlFor="typeOfBusinessOther">
            {t("Type of Business (Other)")}
          </label>
          <input
            type="text"
            id="typeOfBusinessOther"
            name="typeOfBusinessOther"
            className="text-field small"
            placeholder={t("Enter other business type")}
          />
        </div>
      )}

      <div className="form-group">
        <label htmlFor="deliveryLocations">
          {t("Delivery Locations")}
          <span className="required-field">*</span>
        </label>
        <select
          id="deliveryLocations"
          name="deliveryLocations"
          className="dropdown"
          required
        >
          <option value="" disabled>
            {t("Select")}
          </option>
          <option value="Jeddah">{t("Jeddah")}</option>
          <option value="Riyadh">{t("Riyadh")}</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="brandNameEn">
          {t("Brand Name")}
        </label>
        <input
          type="text"
          id="brandNameEn"
          name="brandNameEn"
          className="text-field small"
          placeholder={t("Enter brand name")}
        />
      </div>

      <div className="form-group">
        <label htmlFor="brandNameAr">
          {t("Brand Name (Arabic)")}
        </label>
        <input
          type="text"
          id="brandNameAr"
          name="brandNameAr"
          className="text-field small arabic"
          placeholder={t("أدخل اسم العلامة التجارية")}
        />
      </div>

      <div className="form-group file-upload">
        <label htmlFor="companyLogo">{t("Company Logo")}</label>
        <input
          type="file"
          id="companyLogo"
          name="companyLogo"
          className="text-field small"
          accept="image/*"
        />
      </div>

      <div className="form-group file-upload">
        <label htmlFor="brandLogo">{t("Brand Logo")}</label>
        <input
          type="file"
          id="brandLogo"
          name="brandLogo"
          className="text-field small"
          accept="image/*"
        />
      </div>

      <div className="form-group">
        <label htmlFor="assignedTo">{t("Assigned To")}</label>
        <select id="assignedTo" name="assignedTo" className="dropdown">
          <option value="" disabled>
            {t("Select")}
          </option>
          <option value="Sales Team">{t("Sales Team")}</option>
          <option value="Marketing Team">{t("Marketing Team")}</option>
          <option value="Support Team">{t("Support Team")}</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="customerSource">{t("Customer Source")}</label>
        <input
          type="text"
          id="customerSource"
          name="customerSource"
          className="text-field small"
          placeholder={t("Enter customer source")}
        />
      </div>

      <div className="form-group">
        <label htmlFor={Constants.ENTITY.VMCO}>{t("VMCO")}</label>
        <select id={Constants.ENTITY.VMCO} name={Constants.ENTITY.VMCO} className="dropdown">
          <option value="" disabled>
            {t("Select")}
          </option>
          {/* Add options dynamically */}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor={Constants.ENTITY.DIYAFA}>{t("Diyafa")}</label>
        <select id={Constants.ENTITY.DIYAFA} name={Constants.ENTITY.DIYAFA} className="dropdown">
          <option value="" disabled>
            {t("Select")}
          </option>
          {/* Add options dynamically */}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor={Constants.ENTITY.NAQI}>{t("Naqi")}</label>
        <select id={Constants.ENTITY.NAQI} name={Constants.ENTITY.NAQI} className="dropdown">
          <option value="" disabled>
            {t("Select")}
          </option>
          {/* Add options dynamically */}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor={Constants.ENTITY.GMTC}>{t("GMTC")}</label>
        <select id={Constants.ENTITY.GMTC} name={Constants.ENTITY.GMTC} className="dropdown">
          <option value="" disabled>
            {t("Select")}
          </option>
          {/* Add options dynamically */}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor={Constants.ENTITY.DAR}>{t("DAR")}</label>
        <select id={Constants.ENTITY.DAR} name={Constants.ENTITY.DAR} className="dropdown">
          <option value="" disabled>
            {t("Select")}
          </option>
          {/* Add options dynamically */}
        </select>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            id="interCompany"
            name="interCompany"
            checked={interCompany}
            onChange={handleInterCompanyChange}
          />
          {t("Inter-Company")}
        </label>
      </div>

      {interCompany && (
        <div className="form-group">
          <label htmlFor="entity">{t("Entity")}</label>
          <select id="entity" name="entity" className="dropdown">
            <option value="" disabled>
              {t("Select")}
            </option>
            <option value="Al Khaleej">{t("Al Khaleej")}</option>
            <option value="Al Khaleej Trading">{t("Al Khaleej Trading")}</option>
          </select>
        </div>
      )}
    </div>
  );
}
