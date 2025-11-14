import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchDropdownFromBasicsMaster, checkFieldForUpdate, } from "../../utilities/commonServices";
import "../../styles/forms.css";
import Constants from "../../constants";
import RbacManager from "../../utilities/rbac";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import SearchableDropdown from "../../components/SearchableDropdown";
import Swal from "sweetalert2";
import { DataGrid } from "@mui/x-data-grid";
// import { useTranslation } from "react-i18next";
import useMediaQuery from "@mui/material/useMediaQuery";

const CUSTOMER_APPROVAL_CHECKLIST_URL = Constants?.DOCUMENTS_NAME?.CUSTOMER_APPROVAL_CHECKLIST;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const CUSTOMER_APPROVAL_CHECKLIST = Constants?.DOCUMENTS_NAME?.CUSTOMER_APPROVAL_CHECKLIST;
function FinancialInformation({
  customerData = {},
  originalCustomerData = {},
  customerPaymentMethodsData = {},
  originalCustomerPaymentMethodsData = {},
  onChangeCustomerPaymentMethodsData,
  onChangeCustomerData,
  verifiedData = {},
  onChangeVerifiedData,
  setEntityWisePricePlan,
  setCustomerCreditChange,
  setIsDeliveryChargesApplicable,
  mode,
  setTabsHeight,
  formErrors = {},
  completeWorkflowData = {},
}) {
  const { t, i18n } = useTranslation();
  const { token, user, isAuthenticated, logout, loading } = useAuth();
  let currentLanguage = i18n.language;
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
  // const [isDeliveryChargesApplicable, setIsDeliveryChargesApplicable] =
  //   useState(false);
  const [prePayment, setPrePayment] = useState(
    customerPaymentMethodsData?.methodDetails?.prePayment?.isAllowed || false
  );
  const [partialPayment, setPartialPayment] = useState(
    customerPaymentMethodsData?.methodDetails?.partialPayment?.isAllowed ||
    false
  );
  const [COD, setCOD] = useState(
    customerPaymentMethodsData?.methodDetails?.COD?.isAllowed || false
  );
  const [credit, setCredit] = useState(
    customerPaymentMethodsData?.methodDetails?.credit?.isAllowed || false
  );
  const [paymentMethods, setPaymentMethods] = useState(
    customerPaymentMethodsData?.methodDetails || {}
  );
  const [creditBalanceData, setCreditBalanceData] = useState(null);
  const [creditLimitData, setCreditLimitData] = useState(null);
  const [isCreditBalanceData, setIsCreditBalanceData] = useState(false);
  // Example state for conditional fields
  const [bankName, setBankName] = useState(
    customerData?.bankName || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    setBankName(customerData?.bankName || "");
  }, [customerData?.bankName]);

  useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      console.log("isMobile", isMobile);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);
  // Dropdown state for pricingPolicy
  const dropdownFields = ["pricingPolicy", "bankName", "entity"];
  const [basicMasterLists, setBasicMasterLists] = useState({});
const [fieldsForUpdate, setFieldsForUpdate] = useState({});
const [paymentFieldsForUpdate, setPaymentFieldsForUpdate] = useState({});
    const fieldList = [
      {field: "bankName", fieldType: "customer"},
      {field: "bankNameOther", fieldType: "customer"},
      {field: "bankAccountNumber", fieldType: "customer"},
      {field: "iban", fieldType: "customer"},
      {field: "pricingPolicy?." + [Constants.ENTITY.DAR], fieldType: "pricingpolicy"},
      {field: "pricingPolicy?." + [Constants.ENTITY.VMCO], fieldType: "pricingpolicy"},
      {field: "pricingPolicy?." + [Constants.ENTITY.SHC], fieldType: "pricingpolicy"},
      {field: "pricingPolicy?." + [Constants.ENTITY.NAQI], fieldType: "pricingpolicy"},
      {field: "pricingPolicy?." + [Constants.ENTITY.GMTC], fieldType: "pricingpolicy"},
      {field: "isDeliveryChargesApplicable", fieldType: "customer"},
      {field: "financeHeadEmail", fieldType: "customer"},
      {field: "financeHeadMobile", fieldType: "customer"},
      {field: "purchasingHeadName", fieldType: "customer"},
      {field: "purchasingHeadDesignation", fieldType: "customer"},
      {field: "purchasingHeadEmail", fieldType: "customer"},
      {field: "purchasingHeadMobile", fieldType: "customer"},
      {field: "buildingName", fieldType: "customer"},
      {field: "street", fieldType: "customer"},
      {field: "region", fieldType: "customer"},
      {field: "city", fieldType: "customer"},
      {field: "cityOther", fieldType: "customer"},
      {field: "district", fieldType: "customer"},
      {field: "districtOther", fieldType: "customer"},
      {field: "zone", fieldType: "customer"},
      {field: "pincode", fieldType: "customer"},
      {field: "geolocation", fieldType: "customer"},
    ]
    const paymentFieldsList = [
      {field: "prePayment?.isAllowed", fieldType: "payments"},
      {field: "COD?.isAllowed", fieldType: "payments"},
      {field: "COD?.limit", fieldType: "payments"},
      {field: "credit?." + [Constants.ENTITY.DAR] + "?.isAllowed", fieldType: "payments"},
      {field: "credit?." + [Constants.ENTITY.DAR] + "?.limit", fieldType: "payments"},
      {field: "credit?." + [Constants.ENTITY.DAR] + "?.period", fieldType: "payments"},
      {field: "credit?." + [Constants.ENTITY.VMCO] + "?.isAllowed", fieldType: "payments"},
      {field: "credit?." + [Constants.ENTITY.VMCO] + "?.limit", fieldType: "payments"},
      {field: "credit?." + [Constants.ENTITY.VMCO] + "?.period", fieldType: "payments"},
      {field: "credit?." + [Constants.ENTITY.SHC] + "?.isAllowed", fieldType: "payments"},
      {field: "credit?." + [Constants.ENTITY.SHC] + "?.limit", fieldType: "payments"},
      {field: "credit?." + [Constants.ENTITY.SHC] + "?.period", fieldType: "payments"},
      {field: "credit?." + [Constants.ENTITY.NAQI] + "?.isAllowed", fieldType: "payments"},
      {field: "credit?." + [Constants.ENTITY.NAQI] + "?.limit", fieldType: "payments"},
      {field: "credit?." + [Constants.ENTITY.NAQI] + "?.period", fieldType: "payments"},
      {field: "credit?." + [Constants.ENTITY.GMTC] + "?.isAllowed", fieldType: "payments"},
      {field: "credit?." + [Constants.ENTITY.GMTC] + "?.limit", fieldType: "payments"},
      {field: "credit?." + [Constants.ENTITY.GMTC] + "?.period", fieldType: "payments"},
    ]
  useEffect(() => {
    const fetchData = async () => {
      const listOfBasicsMaster = await fetchDropdownFromBasicsMaster(
        dropdownFields, token
      );
      setBasicMasterLists(listOfBasicsMaster);
    };
    fetchData();
    setTabsHeight("auto");
  }, []);
useEffect(() => {
      const checkFieldUpdates = async () => {
        
        try {
          const fieldStatus = {};
          const paymentFieldStatus = {};
          // Use for...of loop instead of forEach for async operations
          for (const fieldItem of fieldList) {
            const canUpdate = await checkFieldForUpdate(
              fieldItem.fieldType, 
              completeWorkflowData?.workflowName
            );
            fieldStatus[fieldItem.field] = canUpdate;
          }

          for (const fieldItem of paymentFieldsList) {
            const canUpdate = await checkFieldForUpdate(
              fieldItem.fieldType, 
              completeWorkflowData?.workflowName
            );
            paymentFieldStatus[fieldItem.field] = canUpdate;
          }
          setFieldsForUpdate(fieldStatus);
          setPaymentFieldsForUpdate(paymentFieldStatus);
        } catch (error) {
          console.error('Error checking field updates:', error);
          // Set all fields to false in case of error
          const errorStatus = {};
          fieldList.forEach(fieldItem => {
            errorStatus[fieldItem.field] = false;
          });
          setFieldsForUpdate(errorStatus);
        } 
      };
  
      // if (completeWorkflowData?.workflowName) {
        checkFieldUpdates();
      // }
    }, []); // Add other dependencies if needed
  

  const handleGetCreditBalance = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/payment-method-balances/id/${customerData?.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data?.status?.toLowerCase() === "ok") {
        setCreditBalanceData(data?.data?.currentBalance || {});
        setIsCreditBalanceData(true);
        // Fix this line - the credit limit data is in methodDetails.credit
        setCreditLimitData(data?.data?.methodDetails?.credit || {});
        setIsLoading(false);
      } else {
        throw new Error(data.message || "Failed to fetch credit balance");
      }
    } catch (error) {
      console.error("Error fetching credit balance:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to fetch credit balance",
      });
    }
  };
  
const checkDisabledStatus = (fieldPath) => {
  // Split the field path by dots to handle nested properties
  const fieldParts = fieldPath?.split('?.');
  
  // Helper function to get nested value safely
  const getNestedValue = (obj, path) => {
    console.log('Input object:', obj);
    console.log('Input path:', path);
    
    const result = path?.reduce((current, key) => {
      console.log('Current:', current, 'Key:', key);
      const next = current?.[key];
      console.log('Next value:', next);
      return next;
    }, obj);
    
    console.log('Final result:', result);
    return result;
  };

  const originalValue = getNestedValue(originalCustomerData, fieldParts);
  const currentValue = getNestedValue(customerData, fieldParts);
  
  const commonConditions = originalCustomerData &&
                          customerData &&
                          originalValue === currentValue &&
                          mode === "edit" &&
                          customerData?.customerStatus !== "pending";

  if (user?.designation === Constants.DESIGNATIONS.OPS_COORDINATOR || user?.designation === Constants.DESIGNATIONS.AREA_SALES_MANAGER ||
    user?.designation === Constants.DESIGNATIONS.SALES_EXECUTIVE || user?.designation === Constants.DESIGNATIONS.OPS_MANAGER ||
    user?.roles[0] === Constants.ROLES.SUPER_ADMIN
  ) {
    return commonConditions && !fieldsForUpdate?.[fieldPath];
  }
  
  return commonConditions;
};
    const checkDisabledStatusPayment = (fieldPath) => {
  // Split the field path by dots to handle nested properties
  const fieldParts = fieldPath?.split('?.');
  
  // Helper function to get nested value safely
  const getNestedValue = (obj, path) => {
    // console.log(path.reduce((current, key) => current?.[key], obj))
    // return path.reduce((current, key) => current?.[key], obj);
    console.log('Input object:', obj);
  console.log('Input path:', path);
  
  const result = path?.reduce((current, key) => {
    console.log('Current:', current, 'Key:', key);
    const next = current?.[key];
    console.log('Next value:', next);
    return next;
  }, obj);
  
  console.log('Final result:', result);
  return result;
  };

  const originalValue = getNestedValue(originalCustomerPaymentMethodsData?.methodDetails, fieldParts);
  const currentValue = getNestedValue(paymentMethods, fieldParts);
  
  const commonConditions = originalCustomerPaymentMethodsData &&
                          paymentMethods &&
                          originalValue === currentValue &&
                          mode === "edit";

  if (user?.designation === Constants.DESIGNATIONS.OPS_COORDINATOR || user?.designation === Constants.DESIGNATIONS.AREA_SALES_MANAGER ||
    user?.designation === Constants.DESIGNATIONS.SALES_EXECUTIVE || user?.designation === Constants.DESIGNATIONS.OPS_MANAGER ||
    user?.roles[0] === Constants.ROLES.SUPER_ADMIN
  ) {
    return commonConditions && !paymentFieldsForUpdate?.[fieldPath];
  }
  
  return commonConditions;
};


  return (
    <div className="customer-onboarding-form-grid">
      {/* {isV("customerApprovalChecklist") && (
        <div className="form-main-header">
          <a
            href="#"
            onClick={async (e) => {
              e.preventDefault();
              if (!CUSTOMER_APPROVAL_CHECKLIST_URL) {
                alert(t("No checklist URL configured."));
                return;
              }

              try {
                const response = await fetch(
                  `${API_BASE_URL}/get-files`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      fileName: CUSTOMER_APPROVAL_CHECKLIST,
                      containerType: "documents",
                    }),
                    
                  }
                );
                const res = await response.json();
                if (res.status === "Ok") {
                  window.open(res.data.url, "_blank", "noopener,noreferrer");
                } else {
                  throw new Error("Failed to fetch file URL");
                }
              } catch (error) {
                console.error("Error viewing checklist:", error);

                window.open(
                  CUSTOMER_APPROVAL_CHECKLIST_URL,
                  "_blank",
                  "noopener,noreferrer"
                );
              }
            }}
            style={{ cursor: "pointer" }}
          >
            {t("Customer Approval Checklist")}
          </a>
        </div>
      )} */}
      {/* Bank Details Header */}
      <h3 className="form-header full-width">{t("Bank Details")}</h3>
      {/* <div className="form-group">
        <label htmlFor="bankName">
          {t("Bank Name")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.bankName != customerData?.bankName &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="bankName"
          name="bankName"
          className={`text-field small ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.bankName != customerData?.bankName &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter bank name")}
          value={customerData?.bankName || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.bankName === customerData?.bankName &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.bankName != customerData?.bankName &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.bankName || "(empty)"}
            </div>
          )}
        {formErrors.bankName && (
          <div className="error">{t(formErrors.bankName)}</div>
        )}
      </div> */}

      {/* Type of Business Dropdown */}
      <div className="form-group">
        <label htmlFor="bankName">
          {t("Bank Name")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.bankName != bankName &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <div className="input-with-verification">
          <SearchableDropdown
            name="bankName"
            options={(basicMasterLists?.bankName || []).map((item) => ({
              value: item.value,
              name: currentLanguage === "ar" ? item.valueLc : item.value,
            }))}
            value={bankName}
            onChange={(e) => {
              onChangeCustomerData({
                target: { name: "bankName", value: e.target.value },
              });
            }}
            disabled={
            checkDisabledStatus("bankName")
          }
            className={
              originalCustomerData &&
                customerData &&
                originalCustomerData?.bankName != bankName &&
                mode === "edit"
                ? "update-field"
                : ""
            }
            placeholder={t("Select")}
          />
          {isV("bankNameVerified") && (
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
              <input
                type="checkbox"
                id="bankNameVerified"
                name="bankNameVerified"
                checked={verifiedData?.bankNameVerified || false}
                onChange={onChangeVerifiedData}
              // className="verified-checkbox"
              />
              <label htmlFor="bankNameVerified">Verified</label>
            </div>)}
        </div>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.bankName != bankName &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.bankName || "(empty)"}
            </div>
          )}
        {formErrors.bankName && (
          <div className="error">{t(formErrors.bankName)}</div>
        )}
      </div>

      {/* Type of Business (Other) - Conditional */}
      {bankName === "Others (Specify)" ? (
        <div className="form-group">
          <label htmlFor="bankNameOther">
            {t("Bank Name (Other)")}
            <span className="required-field">*</span>
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.bankNameOther !=
              customerData?.bankNameOther &&
              mode === "edit" && (
                <span className="update-badge">{t("Updated")}</span>
              )}
          </label>
          <div className="input-with-verification">
            <input
              type="text"
              id="bankNameOther"
              name="bankNameOther"
              className={`text-field small ${originalCustomerData &&
                customerData &&
                originalCustomerData?.bankNameOther !=
                customerData?.bankNameOther &&
                mode === "edit"
                ? "update-field"
                : ""
                }`}
              placeholder={t("Enter other bank name")}
              value={customerData?.bankNameOther || ""}
              onChange={onChangeCustomerData}
              disabled={
            checkDisabledStatus("bankNameOther")
          }
            />
            {isV("bankNameOtherVerified") && (
              // (originalCustomerData &&
              //     customerData &&
              //     originalCustomerData?.companyNameEn !==
              //       customerData?.companyNameEn &&
              //     mode === "edit") ||
              (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="bankNameOtherVerified"
                  name="bankNameOtherVerified"
                  checked={verifiedData?.bankNameOtherVerified || false}
                  onChange={onChangeVerifiedData}
                // className="verified-checkbox"
                />
                <label htmlFor="bankNameOtherVerified">Verified</label>
              </div>)}
          </div>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.bankNameOther !=
            customerData?.bankNameOther &&
            mode === "edit" && (
              <div className="current-value">
                Previous:{" "}
                {originalCustomerData?.bankNameOther || "(empty)"}
              </div>
            )}
          {formErrors.bankNameOther && (
            <div className="error">{t(formErrors.bankNameOther)}</div>
          )}
        </div>
      ) : (
        <div className="form-group"></div>
      )}

      <div className="form-group">
        <label htmlFor="bankAccountNumber">
          {t("Account Number")}
          {/* <span className="required-field">*</span> */}
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.bankAccountNumber !=
            customerData?.bankAccountNumber &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <div className="input-with-verification">
          <input
            type="text"
            id="bankAccountNumber"
            name="bankAccountNumber"
            className={`text-field small ${originalCustomerData &&
              customerData &&
              originalCustomerData?.bankAccountNumber !=
              customerData?.bankAccountNumber &&
              mode === "edit"
              ? "update-field"
              : ""
              }`}
            placeholder={t("Enter account number")}
            value={customerData?.bankAccountNumber || ""}
            onChange={onChangeCustomerData}
            disabled={
            checkDisabledStatus("bankAccountNumber")
          }
            required
          />
          {isV("bankAccountNumberVerified") && (
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
              <input
                type="checkbox"
                id="bankAccountNumberVerified"
                name="bankAccountNumberVerified"
                checked={verifiedData?.bankAccountNumberVerified || false}
                onChange={onChangeVerifiedData}
              // className="verified-checkbox"
              />
              <label htmlFor="bankAccountNumberVerified">Verified</label>
            </div>)}
        </div>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.bankAccountNumber !=
          customerData?.bankAccountNumber &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.bankAccountNumber || "(empty)"}
            </div>
          )}
        {formErrors.bankAccountNumber && (
          <div className="error">{t(formErrors.bankAccountNumber)}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="iban">
          {t("IBAN")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.iban != customerData?.iban &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <div className="input-with-verification">
          <input
            type="text"
            id="iban"
            name="iban"
            className={`text-field small ${originalCustomerData &&
              customerData &&
              originalCustomerData?.iban != customerData?.iban &&
              mode === "edit"
              ? "update-field"
              : ""
              }`}
            placeholder={t("Enter IBAN")}
            value={customerData?.iban || ""}
            onChange={onChangeCustomerData}
            disabled={
            checkDisabledStatus("iban")
          }
            required
          />
          {isV("ibanVerified") && (
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
              <input
                type="checkbox"
                id="ibanVerified"
                name="ibanVerified"
                checked={verifiedData?.ibanVerified || false}
                onChange={onChangeVerifiedData}
              // className="verified-checkbox"
              />
              <label htmlFor="ibanVerified">Verified</label>
            </div>)}
        </div>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.iban != customerData?.iban &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.iban || "(empty)"}
            </div>
          )}
        {formErrors.iban && <div className="error">{t(formErrors.iban)}</div>}
      </div>
      <div className="form-group" />

      {isV("assignedToEntityWise") && (
        <>
          {/* Entity Wise Price Plan Assignment Header */}
          <h3 className="form-header full-width">{t("Pricing Plan")}</h3>
          {/* Entity Wise Price Plan Assignment */}
          <div className="form-group">
            <label htmlFor="pricingPolicy">
              {t(Constants.ENTITY.DAR)}
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.DAR] !==
                customerData?.pricingPolicy?.[Constants.ENTITY.DAR] &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
            <select
              id="pricingPolicy"
              name={[Constants.ENTITY.DAR]}
              className={`dropdown ${originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.DAR] !==
                customerData?.pricingPolicy?.[Constants.ENTITY.DAR] &&
                mode === "edit"
                ? "update-field"
                : ""
                }`}
              value={customerData?.pricingPolicy?.[Constants.ENTITY.DAR] || ""}
              onChange={setEntityWisePricePlan}
              disabled={
            checkDisabledStatus("pricingPolicy?." + [Constants.ENTITY.DAR]) || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"
          }
            >
              <option value="" disabled>
                {t("Select")}
              </option>
              {basicMasterLists?.pricingPolicy?.map((type) => (
                <option key={type.value} value={type.value}>
                  {i18n.language === "ar" ? type.valueLc : type.value.charAt(0).toUpperCase() + type.value.slice(1)}
                </option>
              ))}
            </select>
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.pricingPolicy?.[Constants.ENTITY.DAR] !==
              customerData?.pricingPolicy?.[Constants.ENTITY.DAR] &&
              mode === "edit" && (
                <div className="current-value">
                  Previous:{" "}
                  {originalCustomerData?.pricingPolicy?.[
                    Constants.ENTITY.DAR
                  ] || "(empty)"}
                </div>
              )}
          </div>

          <div className="form-group">
            <label htmlFor="pricingPolicy">
              {t(Constants.ENTITY.VMCO)}
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.VMCO] !==
                customerData?.pricingPolicy?.[Constants.ENTITY.VMCO] &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
            <select
              id="pricingPolicy"
              name={[Constants.ENTITY.VMCO]}
              className={`dropdown ${originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.VMCO] !==
                customerData?.pricingPolicy?.[Constants.ENTITY.VMCO] &&
                mode === "edit"
                ? "update-field"
                : ""
                }`}
              value={customerData?.pricingPolicy?.[Constants.ENTITY.VMCO] || ""}
              onChange={setEntityWisePricePlan}
              disabled={
            checkDisabledStatus("pricingPolicy?." + [Constants.ENTITY.VMCO]) || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"
          }
            >
              <option value="" disabled>
                {t("Select")}
              </option>
              {basicMasterLists?.pricingPolicy?.map((type) => (
                <option key={type.value} value={type.value}>
                  {i18n.language === "ar" ? type.valueLc : type.value.charAt(0).toUpperCase() + type.value.slice(1)}
                </option>
              ))}
            </select>
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.pricingPolicy?.[Constants.ENTITY.VMCO] !==
              customerData?.pricingPolicy?.[Constants.ENTITY.VMCO] &&
              mode === "edit" && (
                <div className="current-value">
                  Previous:{" "}
                  {originalCustomerData?.pricingPolicy?.[
                    Constants.ENTITY.VMCO
                  ] || "(empty)"}
                </div>
              )}
          </div>
          {/* Entity Wise Assignment for SHC */}
          <div className="form-group">
            <label htmlFor="pricingPolicy">
              {t(Constants.ENTITY.SHC)}
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.SHC] !==
                customerData?.pricingPolicy?.[Constants.ENTITY.SHC] &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
            <select
              id="pricingPolicy"
              name={[Constants.ENTITY.SHC]}
              className={`dropdown ${originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.SHC] !==
                customerData?.pricingPolicy?.[Constants.ENTITY.SHC] &&
                mode === "edit"
                ? "update-field"
                : ""
                }`}
              value={customerData?.pricingPolicy?.[Constants.ENTITY.SHC] || ""}
              onChange={setEntityWisePricePlan}
              disabled={
            checkDisabledStatus("pricingPolicy?." + [Constants.ENTITY.SHC]) || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"
          }
            >
              <option value="" disabled>
                {t("Select")}
              </option>
              {basicMasterLists?.pricingPolicy?.map((type) => (
                <option key={type.value} value={type.value}>
                  {i18n.language === "ar" ? type.valueLc : type.value.charAt(0).toUpperCase() + type.value.slice(1)}
                </option>
              ))}
            </select>
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.pricingPolicy?.[Constants.ENTITY.SHC] !==
              customerData?.pricingPolicy?.[Constants.ENTITY.SHC] &&
              mode === "edit" && (
                <div className="current-value">
                  Previous:{" "}
                  {originalCustomerData?.pricingPolicy?.[
                    Constants.ENTITY.SHC
                  ] || "(empty)"}
                </div>
              )}
          </div>

          {/* Entity Wise Assignment for NAQI */}
          <div className="form-group">
            <label htmlFor="pricingPolicy">
              {t(Constants.ENTITY.NAQI)}
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.NAQI] !==
                customerData?.pricingPolicy?.[Constants.ENTITY.NAQI] &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
            <select
              id="pricingPolicy"
              name={[Constants.ENTITY.NAQI]}
              className={`dropdown ${originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.NAQI] !==
                customerData?.pricingPolicy?.[Constants.ENTITY.NAQI] &&
                mode === "edit"
                ? "update-field"
                : ""
                }`}
              value={customerData?.pricingPolicy?.[Constants.ENTITY.NAQI] || ""}
              onChange={setEntityWisePricePlan}
              disabled={
            checkDisabledStatus("pricingPolicy?." + [Constants.ENTITY.NAQI]) || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"
          }
            >
              <option value="" disabled>
                {t("Select")}
              </option>
              {basicMasterLists?.pricingPolicy?.map((type) => (
                <option key={type.value} value={type.value}>
                  {i18n.language === "ar" ? type.valueLc : type.value.charAt(0).toUpperCase() + type.value.slice(1)}
                </option>
              ))}
            </select>
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.pricingPolicy?.[Constants.ENTITY.NAQI] !==
              customerData?.pricingPolicy?.[Constants.ENTITY.NAQI] &&
              mode === "edit" && (
                <div className="current-value">
                  Previous:{" "}
                  {originalCustomerData?.pricingPolicy?.[
                    Constants.ENTITY.NAQI
                  ] || "(empty)"}
                </div>
              )}
          </div>

          {/* Entity Wise Assignment for GMTC */}
          <div className="form-group">
            <label htmlFor="pricingPolicy">
              {t(Constants.ENTITY.GMTC)}
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.GMTC] !==
                customerData?.pricingPolicy?.[Constants.ENTITY.GMTC] &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
            <select
              id="pricingPolicy"
              name={[Constants.ENTITY.GMTC]}
              className={`dropdown ${originalCustomerData &&
                customerData &&
                originalCustomerData?.pricingPolicy?.[Constants.ENTITY.GMTC] !==
                customerData?.pricingPolicy?.[Constants.ENTITY.GMTC] &&
                mode === "edit"
                ? "update-field"
                : ""
                }`}
              value={customerData?.pricingPolicy?.[Constants.ENTITY.GMTC] || ""}
              onChange={setEntityWisePricePlan}
              disabled={
            checkDisabledStatus("pricingPolicy?." + [Constants.ENTITY.GMTC]) || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"
          }
            >
              <option value="" disabled>
                {t("Select")}
              </option>
              {basicMasterLists?.pricingPolicy?.map((type) => (
                <option key={type.value} value={type.value}>
                  {i18n.language === "ar" ? type.valueLc : type.value.charAt(0).toUpperCase() + type.value.slice(1)}
                </option>
              ))}
            </select>
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.pricingPolicy?.[Constants.ENTITY.GMTC] !==
              customerData?.pricingPolicy?.[Constants.ENTITY.GMTC] &&
              mode === "edit" && (
                <div className="current-value">
                  Previous:{" "}
                  {originalCustomerData?.pricingPolicy?.[
                    Constants.ENTITY.GMTC
                  ] || "(empty)"}
                </div>
              )}
          </div>
          <div className="form-group" />

          <h3 className="form-header full-width">{t("Delivery Charges")}</h3>
          {/* Delivery Charges Applicable */}
          <div className="form-group">
            <label className="checkbox-group-label">
              <input
                type="checkbox"
                id="isDeliveryChargesApplicable"
                name="isDeliveryChargesApplicable"
                checked={customerData?.isDeliveryChargesApplicable}
                onChange={setIsDeliveryChargesApplicable}
                disabled={
            checkDisabledStatus("isDeliveryChargesApplicable") || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"
          }
              />
              {`\t ${t("Is delivery charges applicable")}`}
              {customerData?.isDeliveryChargesApplicable !==
                originalCustomerData?.isDeliveryChargesApplicable &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
          </div>

          {/* Payment Methods Header */}
          <h3 className="form-header full-width">{t("Payment Methods")}</h3>

          {/* Payment Methods */}
          <div className="form-group">
            <label className="hidden-label" htmlFor="prePayment">
              {t("Payment Methods")}
            </label>
            <label className="checkbox-group-label">
              <input
                type="checkbox"
                id="prePayment"
                name="prePayment"
                checked={paymentMethods?.prePayment?.isAllowed}
                onChange={onChangeCustomerPaymentMethodsData}
                disabled={
                  checkDisabledStatusPayment("prePayment?.isAllowed") || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"
                }
              />
              {`\t ${t("Pre-Payment")}`}
              {paymentMethods?.prePayment?.isAllowed !==
                originalCustomerPaymentMethodsData?.methodDetails?.prePayment
                  ?.isAllowed &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
          </div>
          {/* <div className="form-group" /> */}

          {/* <div className="form-group">
        <label className="checkbox-group-label">
          <input
            type="checkbox"
            id="partialPayment"
            name="partialPayment"
            checked={paymentMethods?.partialPayment?.isAllowed}
            onChange={onChangeCustomerPaymentMethodsData}
          />
          {t("Partial Payment")}
          {paymentMethods?.partialPayment?.isAllowed !== originalCustomerPaymentMethodsData?.methodDetails?.partialPayment?.isAllowed && (
          <span className="update-badge">Updated</span>
        )}
        </label>
      </div> */}
          <div className="form-group" />

          <div className="form-group">
            <label className="checkbox-group-label">
              <input
                type="checkbox"
                id="COD"
                name="COD"
                checked={paymentMethods?.COD?.isAllowed}
                onChange={onChangeCustomerPaymentMethodsData}
                disabled={
                  checkDisabledStatusPayment("COD?.isAllowed") || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"
                }
              />
              {`\t ${t("Cash on Delivery (COD) per Branch")}`}
              {paymentMethods?.COD?.isAllowed !==
                originalCustomerPaymentMethodsData?.methodDetails?.COD
                  ?.isAllowed &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
          </div>
          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.COD?.isAllowed && (
              <>
                <label htmlFor="creditLimit">{t("COD Limit")}</label>
                <input
                  type="text"
                  id="CODLimit"
                  name="CODLimit"
                  className={`text-field small ${customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.COD
                      ?.limit != paymentMethods?.COD?.limit &&
                    mode === "edit"
                    ? "update-field"
                    : ""
                    }`}
                  placeholder={t("Enter COD limit")}
                  value={
                    customerPaymentMethodsData?.methodDetails?.COD?.limit || ""
                  }
                  onChange={onChangeCustomerPaymentMethodsData}
                  disabled={
                  checkDisabledStatusPayment("COD?.limit") || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"
                }
                />
              </>
            )}
          </div>

          {/* Entity Wise Credit Assignment Header */}
          <div className="form-header full-width">{t("Credit")}</div>
          {/* DAR Credit */}
          <div className="form-group">
            <label className="checkbox-group-label">
              <input
                type="checkbox"
                id={Constants.ENTITY.DAR}
                name={Constants.ENTITY.DAR}
                checked={
                  paymentMethods?.credit?.[Constants.ENTITY.DAR]?.isAllowed
                }
                onChange={setCustomerCreditChange}
                disabled={
                  checkDisabledStatusPayment("credit?." + [Constants.ENTITY.DAR] + "?.isAllowed") || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"
                }
              />
              {`\t ${t(Constants.ENTITY.DAR)}`}
              {paymentMethods?.credit?.[Constants.ENTITY.DAR].isAllowed !==
                originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                  Constants.ENTITY.DAR
                ]?.isAllowed &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
          </div>
          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.DAR
            ]?.isAllowed && (
                <>
                  <label htmlFor="creditLimit">{t("Credit Limit")}</label>
                  <input
                    type="text"
                    id="DARCreditLimit"
                    name="DARCreditLimit"
                    className={`text-field small ${customerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.DAR
                      ]?.limit !=
                      paymentMethods?.credit?.[Constants.ENTITY.DAR]?.limit &&
                      mode === "edit"
                      ? "update-field"
                      : ""
                      }`}
                    placeholder={t("Enter credit limit")}
                    value={
                      customerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.DAR
                      ]?.limit || ""
                    }
                    onChange={setCustomerCreditChange}
                    disabled={
                  checkDisabledStatusPayment("credit?." + [Constants.ENTITY.DAR] + "?.limit") || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"
                }
                  />
                  {customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.DAR
                    ]?.limit !=
                    paymentMethods?.credit?.[Constants.ENTITY.DAR]?.limit &&
                    mode === "edit" && (
                      <div className="current-value">
                        Previous:{" "}
                        {originalCustomerPaymentMethodsData?.methodDetails
                          ?.credit?.[Constants.ENTITY.DAR]?.limit || "(empty)"}
                      </div>
                    )}
                  {formErrors.DARCreditLimit && (
                    <div className="error">{formErrors.DARCreditLimit}</div>
                  )}
                </>
              )}
          </div>
          <div className="form-group" />

          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.DAR
            ]?.isAllowed && (
                <>
                  <label htmlFor="creditPeriod">{t("Credit Period")}</label>
                  <input
                    type="text"
                    id="DARCreditPeriod"
                    name="DARCreditPeriod"
                    className={`text-field small ${customerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.DAR
                      ]?.period !=
                      paymentMethods?.credit?.[Constants.ENTITY.DAR]?.period &&
                      mode === "edit"
                      ? "update-field"
                      : ""
                      }`}
                    placeholder={t("Enter credit period")}
                    value={
                      customerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.DAR
                      ]?.period || ""
                    }
                    onChange={setCustomerCreditChange}
                    disabled={
                  checkDisabledStatusPayment("credit?." + [Constants.ENTITY.DAR] + "?.period") || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"
                }
                  />
                  {customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.DAR
                    ]?.period !=
                    paymentMethods?.credit?.[Constants.ENTITY.DAR]?.period &&
                    mode === "edit" && (
                      <div className="current-value">
                        Previous:{" "}
                        {originalCustomerPaymentMethodsData?.methodDetails
                          ?.credit?.[Constants.ENTITY.DAR]?.period || "(empty)"}
                      </div>
                    )}
                  {formErrors.DARCreditPeriod && (
                    <div className="error">{formErrors.DARCreditPeriod}</div>
                  )}
                </>
              )}
          </div>
          {/* VMCO Credit */}
          <div className="form-group">
            <label className="checkbox-group-label">
              <input
                type="checkbox"
                id={Constants.ENTITY.VMCO}
                name={Constants.ENTITY.VMCO}
                checked={
                  paymentMethods?.credit?.[Constants.ENTITY.VMCO]?.isAllowed
                }
                onChange={setCustomerCreditChange}
                disabled={checkDisabledStatusPayment("credit?." + [Constants.ENTITY.VMCO] + "?.isAllowed") || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"}
              />
              {`\t ${t(Constants.ENTITY.VMCO)}`}
              {paymentMethods?.credit?.[Constants.ENTITY.VMCO].isAllowed !==
                originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                  Constants.ENTITY.VMCO
                ]?.isAllowed &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
          </div>
          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.VMCO
            ]?.isAllowed && (
                <>
                  <label htmlFor="creditLimit">{t("Credit Limit")}</label>
                  <input
                    type="text"
                    id="VMCOCreditLimit"
                    name="VMCOCreditLimit"
                    className={`text-field small ${customerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.VMCO
                      ]?.limit !=
                      paymentMethods?.credit?.[Constants.ENTITY.VMCO]?.limit &&
                      mode === "edit"
                      ? "update-field"
                      : ""
                      }`}
                    placeholder={t("Enter credit limit")}
                    value={
                      customerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.VMCO
                      ]?.limit || ""
                    }
                    onChange={setCustomerCreditChange}
                    disabled={checkDisabledStatusPayment("credit?." + [Constants.ENTITY.VMCO] + "?.limit") || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"}
                  />
                  {customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.VMCO
                    ]?.limit !=
                    paymentMethods?.credit?.[Constants.ENTITY.VMCO]?.limit &&
                    mode === "edit" && (
                      <div className="current-value">
                        Previous:{" "}
                        {originalCustomerPaymentMethodsData?.methodDetails
                          ?.credit?.[Constants.ENTITY.VMCO]?.limit || "(empty)"}
                      </div>
                    )}
                  {formErrors.VMCOCreditLimit && (
                    <div className="error">{formErrors.VMCOCreditLimit}</div>
                  )}
                </>
              )}
          </div>
          <div className="form-group" />

          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.VMCO
            ]?.isAllowed && (
                <>
                  <label htmlFor="creditPeriod">{t("Credit Period")}</label>
                  <input
                    type="text"
                    id="VMCOCreditPeriod"
                    name="VMCOCreditPeriod"
                    className={`text-field small ${customerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.VMCO
                      ]?.period !=
                      paymentMethods?.credit?.[Constants.ENTITY.VMCO]?.period &&
                      mode === "edit"
                      ? "update-field"
                      : ""
                      }`}
                    placeholder={t("Enter credit period")}
                    value={
                      customerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.VMCO
                      ]?.period || ""
                    }
                    onChange={setCustomerCreditChange}
                    disabled={checkDisabledStatusPayment("credit?." + [Constants.ENTITY.VMCO] + "?.period") || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"}
                  />
                  {customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.VMCO
                    ]?.period !=
                    paymentMethods?.credit?.[Constants.ENTITY.VMCO]?.period &&
                    mode === "edit" && (
                      <div className="current-value">
                        Previous:{" "}
                        {originalCustomerPaymentMethodsData?.methodDetails
                          ?.credit?.[Constants.ENTITY.VMCO]?.period || "(empty)"}
                      </div>
                    )}
                  {formErrors.VMCOCreditPeriod && (
                    <div className="error">{formErrors.VMCOCreditPeriod}</div>
                  )}
                </>
              )}
          </div>
          {/* SHC Credit */}
          <div className="form-group">
            <label className="checkbox-group-label">
              <input
                type="checkbox"
                id={Constants.ENTITY.SHC}
                name={Constants.ENTITY.SHC}
                checked={
                  paymentMethods?.credit?.[Constants.ENTITY.SHC]?.isAllowed
                }
                onChange={setCustomerCreditChange}
                disabled={checkDisabledStatusPayment("credit?." + [Constants.ENTITY.SHC] + "?.isAllowed") || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"}
              />
              {`\t ${t(Constants.ENTITY.SHC)}`}
              {paymentMethods?.credit?.[Constants.ENTITY.SHC].isAllowed !==
                originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                  Constants.ENTITY.SHC
                ]?.isAllowed &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
          </div>
          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.SHC
            ]?.isAllowed && (
                <>
                  <label htmlFor="creditLimit">{t("Credit Limit")}</label>
                  <input
                    type="text"
                    id="SHCCreditLimit"
                    name="SHCCreditLimit"
                    className={`text-field small ${customerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.SHC
                      ]?.limit !=
                      paymentMethods?.credit?.[Constants.ENTITY.SHC]?.limit &&
                      mode === "edit"
                      ? "update-field"
                      : ""
                      }`}
                    placeholder={t("Enter credit limit")}
                    value={
                      customerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.SHC
                      ]?.limit || ""
                    }
                    onChange={setCustomerCreditChange}
                    disabled={checkDisabledStatusPayment("credit?." + [Constants.ENTITY.SHC] + "?.limit") || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"}
                  />
                  {customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.SHC
                    ]?.limit !=
                    paymentMethods?.credit?.[Constants.ENTITY.SHC]?.limit &&
                    mode === "edit" && (
                      <div className="current-value">
                        Previous:{" "}
                        {originalCustomerPaymentMethodsData?.methodDetails
                          ?.credit?.[Constants.ENTITY.SHC]?.limit || "(empty)"}
                      </div>
                    )}
                  {formErrors.SHCCreditLimit && (
                    <div className="error">{formErrors.SHCCreditLimit}</div>
                  )}
                </>
              )}
          </div>
          <div className="form-group" />

          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.SHC
            ]?.isAllowed && (
                <>
                  <label htmlFor="creditPeriod">{t("Credit Period")}</label>
                  <input
                    type="text"
                    id="SHCCreditPeriod"
                    name="SHCCreditPeriod"
                    className={`text-field small ${customerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.SHC
                      ]?.period !=
                      paymentMethods?.credit?.[Constants.ENTITY.SHC]?.period &&
                      mode === "edit"
                      ? "update-field"
                      : ""
                      }`}
                    placeholder={t("Enter credit period")}
                    value={
                      customerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.SHC
                      ]?.period || ""
                    }
                    onChange={setCustomerCreditChange}
                    disabled={checkDisabledStatusPayment("credit?." + [Constants.ENTITY.SHC] + "?.period") || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"}
                  />
                  {customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.SHC
                    ]?.period !=
                    paymentMethods?.credit?.[Constants.ENTITY.SHC]?.period &&
                    mode === "edit" && (
                      <div className="current-value">
                        Previous:{" "}
                        {originalCustomerPaymentMethodsData?.methodDetails
                          ?.credit?.[Constants.ENTITY.SHC]?.period || "(empty)"}
                      </div>
                    )}
                  {formErrors.SHCCreditPeriod && (
                    <div className="error">{formErrors.SHCCreditPeriod}</div>
                  )}
                </>
              )}
          </div>
          {/* NAQI Credit */}
          <div className="form-group">
            <label className="checkbox-group-label">
              <input
                type="checkbox"
                id={Constants.ENTITY.NAQI}
                name={Constants.ENTITY.NAQI}
                checked={
                  paymentMethods?.credit?.[Constants.ENTITY.NAQI]?.isAllowed
                }
                onChange={setCustomerCreditChange}
                disabled={checkDisabledStatusPayment("credit?." + [Constants.ENTITY.NAQI] + "?.isAllowed") || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"}
              />
              {`\t ${t(Constants.ENTITY.NAQI)}`}
              {paymentMethods?.credit?.[Constants.ENTITY.NAQI].isAllowed !==
                originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                  Constants.ENTITY.NAQI
                ]?.isAllowed &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
          </div>
          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.NAQI
            ]?.isAllowed && (
                <>
                  <label htmlFor="creditLimit">{t("Credit Limit")}</label>
                  <input
                    type="text"
                    id="NAQICreditLimit"
                    name="NAQICreditLimit"
                    className={`text-field small ${customerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.NAQI
                      ]?.limit !=
                      paymentMethods?.credit?.[Constants.ENTITY.NAQI]?.limit &&
                      mode === "edit"
                      ? "update-field"
                      : ""
                      }`}
                    placeholder={t("Enter credit limit")}
                    value={
                      customerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.NAQI
                      ]?.limit || ""
                    }
                    onChange={setCustomerCreditChange}
                    disabled={checkDisabledStatusPayment("credit?." + [Constants.ENTITY.NAQI] + "?.limit") || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"}
                  />
                  {customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.NAQI
                    ]?.limit !=
                    paymentMethods?.credit?.[Constants.ENTITY.NAQI]?.limit &&
                    mode === "edit" && (
                      <div className="current-value">
                        Previous:{" "}
                        {originalCustomerPaymentMethodsData?.methodDetails
                          ?.credit?.[Constants.ENTITY.NAQI]?.limit || "(empty)"}
                      </div>
                    )}
                  {formErrors.NAQICreditLimit && (
                    <div className="error">{formErrors.NAQICreditLimit}</div>
                  )}
                </>
              )}
          </div>
          <div className="form-group" />

          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.NAQI
            ]?.isAllowed && (
                <>
                  <label htmlFor="creditPeriod">{t("Credit Period")}</label>
                  <input
                    type="text"
                    id="NAQICreditPeriod"
                    name="NAQICreditPeriod"
                    className={`text-field small ${customerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.NAQI
                      ]?.period !=
                      paymentMethods?.credit?.[Constants.ENTITY.NAQI]?.period &&
                      mode === "edit"
                      ? "update-field"
                      : ""
                      }`}
                    placeholder={t("Enter credit period")}
                    value={
                      customerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.NAQI
                      ]?.period || ""
                    }
                    onChange={setCustomerCreditChange}
                    disabled={checkDisabledStatusPayment("credit?." + [Constants.ENTITY.NAQI] + "?.period") || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"}
                  />
                  {customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.NAQI
                    ]?.period !=
                    paymentMethods?.credit?.[Constants.ENTITY.NAQI]?.period &&
                    mode === "edit" && (
                      <div className="current-value">
                        Previous:{" "}
                        {originalCustomerPaymentMethodsData?.methodDetails
                          ?.credit?.[Constants.ENTITY.NAQI]?.period || "(empty)"}
                      </div>
                    )}
                  {formErrors.NAQICreditPeriod && (
                    <div className="error">{formErrors.NAQICreditPeriod}</div>
                  )}
                </>
              )}
          </div>
          {/* GMTC Credit */}
          <div className="form-group">
            <label className="checkbox-group-label">
              <input
                type="checkbox"
                id={Constants.ENTITY.GMTC}
                name={Constants.ENTITY.GMTC}
                checked={
                  paymentMethods?.credit?.[Constants.ENTITY.GMTC]?.isAllowed
                }
                onChange={setCustomerCreditChange}
                disabled={checkDisabledStatusPayment("credit?." + [Constants.ENTITY.GMTC] + "?.isAllowed") || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"}
              />
              {`\t ${t(Constants.ENTITY.GMTC)}`}
              {paymentMethods?.credit?.[Constants.ENTITY.GMTC].isAllowed !==
                originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                  Constants.ENTITY.GMTC
                ]?.isAllowed &&
                mode === "edit" && (
                  <span className="update-badge">{t("Updated")}</span>
                )}
            </label>
          </div>
          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.GMTC
            ]?.isAllowed && (
                <>
                  <label htmlFor="creditLimit">{t("Credit Limit")}</label>
                  <input
                    type="text"
                    id="GMTCCreditLimit"
                    name="GMTCCreditLimit"
                    className={`text-field small ${customerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.NAQI
                      ]?.limit !=
                      paymentMethods?.credit?.[Constants.ENTITY.NAQI]?.limit &&
                      mode === "edit"
                      ? "update-field"
                      : ""
                      }`}
                    placeholder={t("Enter credit limit")}
                    value={
                      customerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.GMTC
                      ]?.limit || ""
                    }
                    onChange={setCustomerCreditChange}
                    disabled={checkDisabledStatusPayment("credit?." + [Constants.ENTITY.GMTC] + "?.limit") || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"}
                  />
                  {customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.GMTC
                    ]?.limit !=
                    paymentMethods?.credit?.[Constants.ENTITY.GMTC]?.limit &&
                    mode === "edit" && (
                      <div className="current-value">
                        Previous:{" "}
                        {originalCustomerPaymentMethodsData?.methodDetails
                          ?.credit?.[Constants.ENTITY.GMTC]?.limit || "(empty)"}
                      </div>
                    )}
                  {formErrors.GMTCCreditLimit && (
                    <div className="error">{formErrors.GMTCCreditLimit}</div>
                  )}
                </>
              )}
          </div>
          <div className="form-group" />

          <div className="form-group">
            {customerPaymentMethodsData?.methodDetails?.credit?.[
              Constants.ENTITY.GMTC
            ]?.isAllowed && (
                <>
                  <label htmlFor="creditPeriod">{t("Credit Period")}</label>
                  <input
                    type="text"
                    id="GMTCCreditPeriod"
                    name="GMTCCreditPeriod"
                    className={`text-field small ${customerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData &&
                      originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.GMTC
                      ]?.period !=
                      paymentMethods?.credit?.[Constants.ENTITY.GMTC]?.period &&
                      mode === "edit"
                      ? "update-field"
                      : ""
                      }`}
                    placeholder={t("Enter credit period")}
                    value={
                      customerPaymentMethodsData?.methodDetails?.credit?.[
                        Constants.ENTITY.GMTC
                      ]?.period || ""
                    }
                    onChange={setCustomerCreditChange}
                    disabled={checkDisabledStatusPayment("credit?." + [Constants.ENTITY.GMTC] + "?.period") || customerData?.customerStatus?.toLowerCase() === "new" || customerData?.customerStatus?.toLowerCase() === "pending"}
                  />
                  {customerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData &&
                    originalCustomerPaymentMethodsData?.methodDetails?.credit?.[
                      Constants.ENTITY.GMTC
                    ]?.period !=
                    paymentMethods?.credit?.[Constants.ENTITY.GMTC]?.period &&
                    mode === "edit" && (
                      <div className="current-value">
                        Previous:{" "}
                        {originalCustomerPaymentMethodsData?.methodDetails
                          ?.credit?.[Constants.ENTITY.GMTC]?.period || "(empty)"}
                      </div>
                    )}
                  {formErrors.GMTCCreditPeriod && (
                    <div className="error">{formErrors.GMTCCreditPeriod}</div>
                  )}
                </>
              )}
          </div>

        </>
      )}

      {/* Credit Balance Header */}
      {customerData?.customerStatus.toLowerCase() === "approved" &&
        (<>
          <h3 className="form-header full-width">{t("Credit Balance")}</h3>
          <div>
            <button
              onClick={handleGetCreditBalance}
              className="action-button save"
              disabled={isLoading}
            >
              {isLoading ? t("Loading...") : t("Get Credit Balance")}
            </button>
          </div>
        </>
        )
      }
      {/* {isCreditBalanceData && (
        <div className="gi-backdrop">
          <dialog className="credit-balance-dialog" open>
            <div className="dialog-header">
              <h2>{t("Credit Balance")}</h2>
              <button
                className="close-dialog"
                onClick={() => setIsCreditBalanceData(false)}
              >
                &times;
              </button>
            </div>
            <div className="dialog-content">
              <div className="balance-table-container">
                <table className="balance-table">
                  <thead>
                    <tr>
                      <th>{t("Entity")}</th>
                      <th className="due-to-pay">{t("Due to Pay")}</th>
                      <th className="balance-amount">{t("Remaining Credit")}</th>
                      <th className="credit-limit">{t("Credit Limit")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {basicMasterLists?.entity?.map((item) => {
                      // Calculate due to pay (credit limit - remaining credit)
                      const creditLimit = creditLimitData?.[item.value]?.limit || 0;
                      const remainingCredit = creditBalanceData?.[item.value] || 0;
                      const dueToPay = parseFloat(creditLimit) - parseFloat(remainingCredit);

                      return (
                        <tr key={item.value}>
                          <td>
                            {i18n.language === "en"
                              ? item.description
                              : item.descriptionLc}
                          </td>
                          <td className={`due-to-pay ${dueToPay === 0
                            ? "zero"
                            : dueToPay > 0
                              ? "positive"
                              : "negative"
                            }`}>
                            {dueToPay !== 0
                              ? dueToPay.toLocaleString("en-US", {
                                style: "currency",
                                currency: "SAR",
                                minimumFractionDigits: 2,
                              })
                              : "SAR 0.00"}
                          </td>
                          <td className={`balance-amount ${creditBalanceData?.[item.value] === 0
                            ? "zero"
                            : creditBalanceData?.[item.value] > 0
                              ? "positive"
                              : "negative"
                            }`}>
                            {creditBalanceData?.[item.value]?.toLocaleString("en-US", {
                              style: "currency",
                              currency: "SAR",
                              minimumFractionDigits: 2,
                            }) || "SAR 0.00"}
                          </td>
                          <td className={`balance-amount ${!creditLimitData?.[item.value]?.limit ||
                            creditLimitData[item.value].limit === 0
                            ? "zero"
                            : parseFloat(creditLimitData[item.value].limit) > 0
                              ? "positive"
                              : "negative"
                            }`}>
                            {creditLimitData?.[item.value]?.limit
                              ? parseFloat(creditLimitData[item.value].limit).toLocaleString("en-US", {
                                style: "currency",
                                currency: "SAR",
                                minimumFractionDigits: 2,
                              })
                              : "SAR 0.00"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {(!creditBalanceData || Object.keys(creditBalanceData)?.length === 0) && (
                <p className="no-data">{t("No credit balance data available")}</p>
              )}
            </div>
            <div className="gi-footer">
              <button
                className="gi-close-btn"
                onClick={() => setIsCreditBalanceData(false)}
              >
                {t("Close")}
              </button>
            </div>
          </dialog>
          <style>
            {`
        .gi-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.15);
          z-index: 1000;
        }
        .credit-balance-dialog {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100vw;
          max-width: 900px;
          border: 1px solid #ccc;
          background: #fff;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          border-radius: 12px;
          padding: 0;
          background: #fff;
          z-index: 1001;
          overflow: hidden;
          animation: gi-fadein 0.2s;
        }
        [dir="rtl"] .credit-balance-dialog {
          transform: translate(-25%, -50%);
        }
        @keyframes gi-fadein {
          from {
            opacity: 0;
            transform: translate(-50%, -60%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
        .dialog-header {
          color: #666;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .dialog-header h2 {
          font-size: 1.3rem;
          font-weight: 600;
          margin: 0;
        }
        .close-dialog {
          background: none;
          border: none;
          color: #666;
          font-size: 1.5rem;
          cursor: pointer;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
        }
        .close-dialog:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        .dialog-content {
          padding: 20px;
          max-height: 70vh;
          overflow-y: auto;
        }
        .customer-info {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e9ecef;
        }
        .customer-info p {
          margin: 5px 0;
          color: #6c757d;
        }
        .balance-table-container {
          margin: 10px 28px;
          padding: 6px;
          border: 1.9px solid #eee;
          border-radius: 10px;
        }
        .balance-table {
          width: 100%;
          border-collapse: collapse;
        }
        .balance-table th, .balance-table td {
          padding: 15px 8px;
          text-align: left;
        }
        [dir="rtl"] .balance-table th, [dir="rtl"] .balance-table td {
          text-align: right;
        }
        .balance-table th {
          background: #fff;
          font-weight: 500;
          border-bottom: 1px solid #eee;
        }
        .balance-table tr:not(:last-child) {
          border-bottom: 1px solid #eee;
        }
        .balance-amount, .due-to-pay, .credit-limit {
          text-align: right;
          font-weight: 500;
        }
        .balance-amount.zero, .credit-limit.zero {
          color: #6c757d;
        }
        .balance-amount.positive, .credit-limit.positive {
          color: #6c757d;
        }
        .balance-amount.negative, .credit-limit.negative {
          color: #6c757d;
        }
        .due-to-pay.zero {
          color: #6c757d;
        }
        .due-to-pay.positive {
          color: #dc3545;
        }
        .due-to-pay.negative {
          color: #dc3545;
        }
        .no-data {
          text-align: center;
          padding: 20px;
          color: #6c757d;
          font-style: italic;
        }
        .gi-footer {
          display: flex;
          justify-content: flex-end;
          padding: 16px 28px 22px 28px;
        }
        .gi-close-btn {
          padding: 7px 28px;
          border-radius: 6px;
          border: 1px solid #bbb;
          background: #fff;
          color: #222;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .gi-close-btn:hover {
          background: #f2f2f2;
        }
        @media (max-width: 600px) {
          .credit-balance-dialog {
            width: 95vw;
            max-width: none;
          }
          .dialog-content {
            padding: 15px;
          }
          .balance-table th, .balance-table td {
            padding: 8px 10px;
          }
        }
      `}
          </style>
        </div>
      )} */}


{isCreditBalanceData && (
  <div className="gi-backdrop">
    <dialog className="credit-balance-dialog" open>
      <div className="dialog-header">
        <h2>{t("Credit Balance")}</h2>
        <button
          className="close-dialog"
          onClick={() => setIsCreditBalanceData(false)}
        >
          &times;
        </button>
      </div>

      <div className="dialog-content">
        {/* Detect mobile screen */}
        {(() => {
          // const isMobile = useMediaQuery("(max-width: 600px)");

          // Prepare data rows
          const rows =
            basicMasterLists?.entity?.map((item, index) => {
              const creditLimit = creditLimitData?.[item.value]?.limit || 0;
              const remainingCredit = creditBalanceData?.[item.value] || 0;
              const dueToPay = parseFloat(creditLimit) - parseFloat(remainingCredit);

              return {
                id: index + 1,
                entity:
                  i18n.language === "en"
                    ? item.description
                    : item.descriptionLc,
                dueToPay,
                remainingCredit,
                creditLimit,
              };
            }) || [];

          // Define columns for DataGrid
          const columns = [
            { field: "entity", headerName: t("Entity"), flex: 1 },
            {
              field: "dueToPay",
              headerName: t("Due to Pay"),
              flex: 1,
              renderCell: (params) => (
                <span
                  style={{
                    color:
                      params.value === 0
                        ? "#6c757d"
                        : params.value > 0
                        ? "#dc3545"
                        : "#dc3545",
                  }}
                >
                  {params.value.toLocaleString("en-US", {
                    style: "currency",
                    currency: "SAR",
                    minimumFractionDigits: 2,
                  })}
                </span>
              ),
            },
            {
              field: "remainingCredit",
              headerName: t("Remaining Credit"),
              flex: 1,
              renderCell: (params) => (
                <span
                  style={{
                    color:
                      params.value === 0
                        ? "#6c757d"
                        : params.value > 0
                        ? "#6c757d"
                        : "#6c757d",
                  }}
                >
                  {params.value.toLocaleString("en-US", {
                    style: "currency",
                    currency: "SAR",
                    minimumFractionDigits: 2,
                  })}
                </span>
              ),
            },
            {
              field: "creditLimit",
              headerName: t("Credit Limit"),
              flex: 1,
              renderCell: (params) => (
                <span style={{ color: "#6c757d" }}>
                  {params.value.toLocaleString("en-US", {
                    style: "currency",
                    currency: "SAR",
                    minimumFractionDigits: 2,
                  })}
                </span>
              ),
            },
          ];

          if (isMobile) {
            // 📱 Render MUI DataGrid for Mobile
            return (
              <div style={{ height: "auto", width: "100%" }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  pageSize={5}
                  rowsPerPageOptions={[5]}
                  disableSelectionOnClick
                  disableColumnFilter
                  hideFooter
                  sx={{
                    border: "1.5px solid #eee",
                    borderRadius: "10px",
                    "& .MuiDataGrid-cell": {
                      fontSize: "0.9rem",
                    },
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: "#fafafa",
                      fontWeight: 600,
                    },
                  }}
                />
              </div>
            );
          }

          // 💻 Render classic table for desktop
          return (
            <div className="balance-table-container">
              <table className="balance-table">
                <thead>
                  <tr>
                    <th>{t("Entity")}</th>
                    <th className="due-to-pay">{t("Due to Pay")}</th>
                    <th className="balance-amount">{t("Remaining Credit")}</th>
                    <th className="credit-limit">{t("Credit Limit")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.entity}</td>
                      <td
                        className={`due-to-pay ${
                          row.dueToPay === 0
                            ? "zero"
                            : row.dueToPay > 0
                            ? "positive"
                            : "negative"
                        }`}
                      >
                        {row.dueToPay.toLocaleString("en-US", {
                          style: "currency",
                          currency: "SAR",
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="balance-amount">
                        {row.remainingCredit.toLocaleString("en-US", {
                          style: "currency",
                          currency: "SAR",
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="credit-limit">
                        {row.creditLimit.toLocaleString("en-US", {
                          style: "currency",
                          currency: "SAR",
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}

        {(!creditBalanceData ||
          Object.keys(creditBalanceData)?.length === 0) && (
          <p className="no-data">{t("No credit balance data available")}</p>
        )}
      </div>

      <div className="gi-footer">
        <button
          className="gi-close-btn"
          onClick={() => setIsCreditBalanceData(false)}
        >
          {t("Close")}
        </button>

      </div>
    </dialog>
    <style>
            {`
        .gi-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.15);
          z-index: 1000;
        }
        .credit-balance-dialog {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100vw;
          max-width: 900px;
          border: 1px solid #ccc;
          background: #fff;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          border-radius: 12px;
          padding: 0;
          background: #fff;
          z-index: 1001;
          overflow: hidden;
          animation: gi-fadein 0.2s;
        }
        [dir="rtl"] .credit-balance-dialog {
          transform: translate(-25%, -50%);
        }
        @keyframes gi-fadein {
          from {
            opacity: 0;
            transform: translate(-50%, -60%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
        .dialog-header {
          color: #666;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .dialog-header h2 {
          font-size: 1.3rem;
          font-weight: 600;
          margin: 0;
        }
        .close-dialog {
          background: none;
          border: none;
          color: #666;
          font-size: 1.5rem;
          cursor: pointer;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
        }
        .close-dialog:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        .dialog-content {
          padding: 20px;
          max-height: 70vh;
          overflow-y: auto;
        }
        .customer-info {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e9ecef;
        }
        .customer-info p {
          margin: 5px 0;
          color: #6c757d;
        }
        .balance-table-container {
          margin: 10px 28px;
          padding: 6px;
          border: 1.9px solid #eee;
          border-radius: 10px;
        }
        .balance-table {
          width: 100%;
          border-collapse: collapse;
        }
        .balance-table th, .balance-table td {
          padding: 15px 8px;
          text-align: left;
        }
        [dir="rtl"] .balance-table th, [dir="rtl"] .balance-table td {
          text-align: right;
        }
        .balance-table th {
          background: #fff;
          font-weight: 500;
          border-bottom: 1px solid #eee;
        }
        .balance-table tr:not(:last-child) {
          border-bottom: 1px solid #eee;
        }
        .balance-amount, .due-to-pay, .credit-limit {
          text-align: right;
          font-weight: 500;
        }
        .balance-amount.zero, .credit-limit.zero {
          color: #6c757d;
        }
        .balance-amount.positive, .credit-limit.positive {
          color: #6c757d;
        }
        .balance-amount.negative, .credit-limit.negative {
          color: #6c757d;
        }
        .due-to-pay.zero {
          color: #6c757d;
        }
        .due-to-pay.positive {
          color: #dc3545;
        }
        .due-to-pay.negative {
          color: #dc3545;
        }
        .no-data {
          text-align: center;
          padding: 20px;
          color: #6c757d;
          font-style: italic;
        }
        .gi-footer {
          display: flex;
          justify-content: flex-end;
          padding: 16px 28px 22px 28px;
        }
        .gi-close-btn {
          padding: 7px 28px;
          border-radius: 6px;
          border: 1px solid #bbb;
          background: #fff;
          color: #222;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .gi-close-btn:hover {
          background: #f2f2f2;
        }
        @media (max-width: 600px) {
          .credit-balance-dialog {
            width: 95vw;
            max-width: none;
          }
          .dialog-content {
            padding: 15px;
          }
          .balance-table th, .balance-table td {
            padding: 8px 10px;
          }
        }
      `}
          </style>
  </div>
)}

    </div>
  );
}

export default FinancialInformation;
