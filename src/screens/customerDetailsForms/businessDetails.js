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
            mode === "edit"
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
            mode === "edit"
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
            mode === "edit"
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
            mode === "edit"
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
            mode === "edit"
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
            mode === "edit"
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
        <select
          id="companyType"
          name="companyType"
          className={`dropdown ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.companyType != customerData?.companyType &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          value={customerData?.companyType || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.companyType === customerData?.companyType &&
            mode === "edit"
          }
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
        <select
          id="typeOfBusiness"
          name="typeOfBusiness"
          className={`dropdown ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.typeOfBusiness != typeOfBusiness &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          value={typeOfBusiness}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.typeOfBusiness ===
              customerData?.typeOfBusiness &&
            mode === "edit"
          }
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
              mode === "edit"
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
        <select
          id="deliveryLocations"
          name="deliveryLocations"
          className={`dropdown ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.deliveryLocations !=
              customerData?.deliveryLocations &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          value={customerData?.deliveryLocations || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.deliveryLocations ===
              customerData?.deliveryLocations &&
            mode === "edit"
          }
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
            mode === "edit"
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
            mode === "edit"
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

      {/* Company Logo - File inputs need special handling */}
      <div className="form-group file-upload">
        <label htmlFor="companyLogo">
          {t("Company Logo")}
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.companyLogo != customerData?.companyLogo &&
            customerData?.companyLogo &&
            mode === "edit" && <span className="update-badge">Updated</span>}
        </label>
        <input
          type="file"
          id="companyLogo"
          name="companyLogo"
          className={`text-field small ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.companyLogo != customerData?.companyLogo &&
            customerData?.companyLogo &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.companyLogo != customerData?.companyLogo &&
          customerData?.companyLogo &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.companyLogo || "(no file)"}
            </div>
          )}
      </div>

      {/* Brand Logo */}
      <div className="form-group file-upload">
        <label htmlFor="brandLogo">
          {t("Brand Logo")}
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.brandLogo != customerData?.brandLogo &&
            customerData?.brandLogo &&
            mode === "edit" && <span className="update-badge">Updated</span>}
        </label>
        <input
          type="file"
          id="brandLogo"
          name="brandLogo"
          className={`text-field small ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.brandLogo != customerData?.brandLogo &&
            customerData?.brandLogo &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.brandLogo != customerData?.brandLogo &&
          customerData?.brandLogo &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.brandLogo || "(no file)"}
            </div>
          )}
      </div>

      {/* Assigned To Dropdown */}
      {isV("assignedTo") && (<div className="form-group">
        <label htmlFor="assignedTo">
          {t("Assigned To")}
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.assignedTo != customerData?.assignedTo &&
            mode === "edit" && <span className="update-badge">Updated</span>}
        </label>
        <select
          id="assignedTo"
          name="assignedTo"
          className={`dropdown ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.assignedTo != customerData?.assignedTo &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          value={customerData?.assignedTo || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.assignedTo ===
              customerData?.assignedTo &&
            mode === "edit"
          }
        >
          <option value="" disabled>
            {t("Select")}
          </option>
          {employeeList?.map((employee) => (
            <option key={employee.employeeId} value={employee.employeeId}>
              {t(employee.name)}
            </option>
          ))}
        </select>
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
      </div>)}

      {/* Customer Source */}
      {isV("customerSource") && (<div className="form-group">
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
            originalCustomerData &&
            customerData &&
            originalCustomerData?.customerSource ===
              customerData?.customerSource &&
            mode === "edit"
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
      </div>)}

      {isV("assignedToEntityWise") && (
        <>
        {/* Entity Wise Employee Assignment Header */}
      <div className="form-header full-width">
        {t("Entity Wise Employee Assignment")}
      </div>
      {/* Entity Wise Employee Assignment */}
      <div className="form-group">
        <label htmlFor="assignedToEntityWise">
          {t(Constants.ENTITY.DAR)}
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.assignedToEntityWise?.[
              Constants.ENTITY.DAR
            ] !== customerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] &&
            mode === "edit" && <span className="update-badge">Updated</span>}
        </label>
        <select
          id="assignedToEntityWise"
          name={[Constants.ENTITY.DAR]}
          className={`dropdown ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.assignedToEntityWise?.[
              Constants.ENTITY.DAR
            ] !== customerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          value={
            customerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] || ""
          }
          onChange={setEntityWiseAssignment}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] ===
              customerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] &&
            mode === "edit"
          }
        >
          <option value="" disabled>
            {t("Select")}
          </option>
          {employeeListWithManagers?.map((employee) => (
            <option key={employee.employeeId} value={employee.employeeId}>
              {t(employee.name)}
            </option>
          ))}
        </select>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] !==
            customerData?.assignedToEntityWise?.[Constants.ENTITY.DAR] &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerData?.assignedToEntityWise?.[
                Constants.ENTITY.DAR
              ] || "(empty)"}
            </div>
          )}
      </div>

      <div className="form-group">
        <label htmlFor="assignedToEntityWise">
          {t(Constants.ENTITY.VMCO)}
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.assignedToEntityWise?.[
              Constants.ENTITY.VMCO
            ] !== customerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] &&
            mode === "edit" && <span className="update-badge">Updated</span>}
        </label>
        <select
          id="assignedToEntityWise"
          name={[Constants.ENTITY.VMCO]}
          className={`dropdown ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.assignedToEntityWise?.[
              Constants.ENTITY.VMCO
            ] !== customerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          value={
            customerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] || ""
          }
          onChange={setEntityWiseAssignment}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] ===
              customerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] &&
            mode === "edit"
          }
        >
          <option value="" disabled>
            {t("Select")}
          </option>
          {employeeListWithManagers?.map((employee) => (
            <option key={employee.employeeId} value={employee.employeeId}>
              {t(employee.name)}
            </option>
          ))}
        </select>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.assignedToEntityWise?.[
            Constants.ENTITY.VMCO
          ] !== customerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO] &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerData?.assignedToEntityWise?.[
                Constants.ENTITY.VMCO
              ] || "(empty)"}
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
            ] !== customerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] &&
            mode === "edit" && <span className="update-badge">Updated</span>}
        </label>
        <select
          id="assignedToEntityWise"
          name={[Constants.ENTITY.SHC]}
          className={`dropdown ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.assignedToEntityWise?.[
              Constants.ENTITY.SHC
            ] !== customerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          value={
            customerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] || ""
          }
          onChange={setEntityWiseAssignment}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] ===
              customerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] &&
            mode === "edit"
          }
        >
          <option value="" disabled>
            {t("Select")}
          </option>
          {employeeListWithManagers?.map((employee) => (
            <option key={employee.employeeId} value={employee.employeeId}>
              {t(employee.name)}
            </option>
          ))}
        </select>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] !==
            customerData?.assignedToEntityWise?.[Constants.ENTITY.SHC] &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerData?.assignedToEntityWise?.[
                Constants.ENTITY.SHC
              ] || "(empty)"}
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
            ] !== customerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] &&
            mode === "edit" && <span className="update-badge">Updated</span>}
        </label>
        <select
          id="assignedToEntityWise"
          name={[Constants.ENTITY.NAQI]}
          className={`dropdown ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.assignedToEntityWise?.[
              Constants.ENTITY.NAQI
            ] !== customerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          value={
            customerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] || ""
          }
          onChange={setEntityWiseAssignment}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] ===
              customerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] &&
            mode === "edit"
          }
        >
          <option value="" disabled>
            {t("Select")}
          </option>
          {employeeListWithManagers?.map((employee) => (
            <option key={employee.employeeId} value={employee.employeeId}>
              {t(employee.name)}
            </option>
          ))}
        </select>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] !==
            customerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI] &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerData?.assignedToEntityWise?.[
                Constants.ENTITY.NAQI
              ] || "(empty)"}
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
            ] !== customerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] &&
            mode === "edit" && <span className="update-badge">Updated</span>}
        </label>
        <select
          id="assignedToEntityWise"
          name={[Constants.ENTITY.GMTC]}
          className={`dropdown ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.assignedToEntityWise?.[
              Constants.ENTITY.GMTC
            ] !== customerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          value={
            customerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] || ""
          }
          onChange={setEntityWiseAssignment}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] ===
              customerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] &&
            mode === "edit"
          }
        >
          <option value="" disabled>
            {t("Select")}
          </option>
          {employeeListWithManagers?.map((employee) => (
            <option key={employee.employeeId} value={employee.employeeId}>
              {t(employee.name)}
            </option>
          ))}
        </select>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] !==
            customerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC] &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerData?.assignedToEntityWise?.[
                Constants.ENTITY.GMTC
              ] || "(empty)"}
            </div>
          )}
      </div>
      </>)}
          <div className="form-group"></div>
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
              mode === "edit"
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
            originalCustomerData?.entity !=
              customerData?.entity &&
            mode === "edit" && <span className="update-badge">Updated</span>}
        </label>
        <select
          id="entity"
          name="entity"
          className={`dropdown ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.entity !=
              customerData?.entity &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          value={customerData?.entity || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.entity ===
              customerData?.entity &&
            mode === "edit"
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
          originalCustomerData?.entity !=
            customerData?.entity &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.entity || "(empty)"}
            </div>
          )}
        {formErrors.entity && (
          <div className="error">{formErrors.entity}</div>
        )}
      </div>)}
    </div>
  );
}

export default BusinessDetails;
