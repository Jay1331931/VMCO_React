import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { isMobile } from "../../utilities/isMobile";
import {
  fetchDropdownFromBasicsMaster,
  getOptionsFromEmployeesWithManager,
  getOptionsFromEmployees,
  checkFieldForUpdate,
} from "../../utilities/commonServices";
import "../../styles/forms.css";
import Constants from "../../constants";
import RbacManager from "../../utilities/rbac";
import { useAuth } from "../../context/AuthContext";
import SearchableDropdown from "../../components/SearchableDropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
const CUSTOMER_APPROVAL_CHECKLIST_URL =
  Constants.DOCUMENTS_NAME.CUSTOMER_APPROVAL_CHECKLIST;
const CUSTOMER_APPROVAL_CHECKLIST =
  Constants.DOCUMENTS_NAME.CUSTOMER_APPROVAL_CHECKLIST;

function BusinessDetails({
  customerData = {},
  originalCustomerData = {},
  onChangeCustomerData,
  verifiedData = {},
  onChangeVerifiedData,
  setEntityWiseAssignment,
  mode,
  setTabsHeight,
  setInterCompany,
  formErrors = {},
  logosToUpload = {}, // <-- Pass this from CustomerDetails.js
  completeWorkflowData = {},
}) {
  const { t, i18n } = useTranslation();
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
    "branch",
  ];
  const [basicMasterLists, setBasicMasterLists] = useState({});
  const [employeeListWithManagers, setEmployeeListWithManagers] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [fieldsForUpdate, setFieldsForUpdate] = useState({});
  const fieldList = [
    {field: "companyType", fieldType: "customer"},
    {field: "companyNameEn", fieldType: "customer"},
    {field: "companyNameAr", fieldType: "customer"},
    {field: "crNumber", fieldType: "customer"},
    {field: "vatNumber", fieldType: "customer"},
    {field: "governmentRegistrationNumber", fieldType: "customer"},
    {field: "baladeahLicenseNumber", fieldType: "customer"},
    {field: "deliveryLocations", fieldType: "customer"},
    {field: "typeOfBusiness", fieldType: "customer"},
    {field: "typeOfBusinessOther", fieldType: "customer"},
    {field: "brandNameEn", fieldType: "customer"},
    {field: "brandNameAr", fieldType: "customer"},
    {field: "customerSource", fieldType: "customer"},
    {field: "interCompany", fieldType: "customer"},
    {field: "entity", fieldType: "customer"},
    {field: "primaryBusinessUnit", fieldType: "customer"},
    {field: "branch", fieldType: "customer"},
    {field: "assignedTo", fieldType: "customer"},
    {field: customerData?.assignedToEntityWise?.[Constants.ENTITY.DAR]?.toString(), fieldType: "customer"},
    {field: customerData?.assignedToEntityWise?.[Constants.ENTITY.SHC]?.toString(), fieldType: "customer"},
    {field: customerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI]?.toString(), fieldType: "customer"},
    {field: customerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC]?.toString(), fieldType: "customer"},
    {field: customerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO]?.toString(), fieldType: "customer"},
  ]
  let currentLanguage = i18n.language;
  useEffect(() => {
    const fetchData = async () => {
      const listOfBasicsMaster = await fetchDropdownFromBasicsMaster(
        dropdownFields,
        token
      );
      const listOfEmployeesWithManagers =
        await getOptionsFromEmployeesWithManager(customerData?.branch, token);

      const listOfEmployees = await getOptionsFromEmployees(token);

      setBasicMasterLists(listOfBasicsMaster);
      setEmployeeListWithManagers(listOfEmployeesWithManagers);
      console.log("listOfEmployees",listOfEmployees)
      setEmployeeList(listOfEmployees);
    };
    fetchData();
    setTabsHeight("auto");
  }, [customerData?.branch, currentLanguage]);

  // Example state for conditional fields
  const [typeOfBusiness, setTypeOfBusiness] = useState(
    customerData?.typeOfBusiness || ""
  );
const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Go' || e.key === 'Search' || e.key === 'Done'  ) {
      if (isMobile) {
        // Close keyboard
        e.target.blur();
        document.body.classList.remove('keyboard-open');
      }
    }
  };
  useEffect(() => {
    setTypeOfBusiness(customerData?.typeOfBusiness || "");
  }, [customerData?.typeOfBusiness]);

  useEffect(() => {
    const checkFieldUpdates = async () => {
      
      try {
        const fieldStatus = {};
        
        // Use for...of loop instead of forEach for async operations
        for (const fieldItem of fieldList) {
          const canUpdate = await checkFieldForUpdate(
            fieldItem.fieldType, 
            completeWorkflowData?.workflowName
          );
          fieldStatus[fieldItem.field] = canUpdate;
        }
        
        setFieldsForUpdate(fieldStatus);
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

    if (completeWorkflowData?.workflowName) {
      checkFieldUpdates();
    }
  }, [completeWorkflowData?.workflowName]); // Add other dependencies if needed

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

  return (
    <div className="customer-onboarding-form-grid">
      {customerData?.customerStatus === "blocked" && mode === "edit" && (
        <h3 className="form-header full-width">{t("Customer Blocked")}</h3>
      )}
      {originalCustomerData?.customerStatus === "blocked" &&
        mode === "edit" && (
          <h3 className="form-header full-width">{t("Customer Unblocked")}</h3>
        )}
      {/* {isV("customerApprovalChecklist") && (
        <div className="form-main-header">
          <a
            href="#"
            onClick={async (e) => {
              e.preventDefault();
              if (!CUSTOMER_APPROVAL_CHECKLIST_URL) {
                Swal.fire({
                  icon: "error",
                  title: t("Error"),
                  text: t("No checklist URL configured."),
                  confirmButtonText: t("OK"),
                });

                return;
              }

              try {
                const response = await fetch(`${API_BASE_URL}/get-files`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    fileName: CUSTOMER_APPROVAL_CHECKLIST,
                    containerType: "documents",
                  }),
                });
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
      {user?.userType.toLowerCase() === "employee" && (
        <div className="form-main-header" style={{ ...(isMobile && {
    margin: "0px 12px",
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    backgroundColor: "#76716926",
    borderRadius: "11px",
    padding: "4px 0px"
  })}}>
          {t("ERP ID")}: {customerData?.erpCustId ?? "-"}
          </div>
      )}
{/* Customer ERP ID */}
      <div className="form-group">
  <label htmlFor="erpCustId">
    {t("Customer ERP ID")}
    {/* <span className="required-field">*</span>
    {originalCustomerData &&
      customerData &&
      originalCustomerData?.companyNameEn !=
        customerData?.companyNameEn &&
      mode === "edit" && (
        <span className="update-badge">{t("Updated")}</span>
      )} */}
  </label>
  <div className="input-with-verification">
    <input
      type="text"
onFocus={() => {
       if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
   
    
  }}
onKeyDown={handleKeyDown}
  onBlur={() => {
   
      document.body.classList.remove('keyboard-open');
       // 👈 show menu again (optional)
  }}
      id="erpCustId"
      name="erpCustId"
      // className={`text-field small 
      //   ${
      //   originalCustomerData &&
      //   customerData &&
      //   originalCustomerData?.companyNameEn !=
      //     customerData?.companyNameEn &&
      //   mode === "edit"
      //     ? "update-field"
      //     : ""
      // }`}
      className={`text-field small `}
      // placeholder={t("Enter company name")}
      value={customerData?.erpCustId || ""}
      // onChange={onChangeCustomerData}
      disabled={true}
      required
    />
    {/* {isV("companyNameEnVerified") &&  (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="companyNameEnVerified"
        name="companyNameEnVerified"
        checked={verifiedData?.companyNameEnVerified || false}
        onChange={onChangeVerifiedData}
      />
      <label htmlFor="companyNameEnVerified">Verified</label>
    </div>)} */}
  </div>
  {/* {originalCustomerData &&
    customerData &&
    originalCustomerData?.companyNameEn != customerData?.companyNameEn &&
    mode === "edit" && (
      <div className="current-value">
        Previous: {originalCustomerData?.companyNameEn || "(empty)"}
      </div>
    )} */}
  {/* {formErrors.companyNameEn && (
    <div className="error">{t(formErrors.companyNameEn)}</div>
  )} */}
      </div>
<div className="form-group"></div>
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
        <div className="input-with-verification">
        <SearchableDropdown
          name="companyType"
          options={(basicMasterLists?.companyType || []).map((item) => ({
            value: item.value,
            name: currentLanguage === "ar" ? item.valueLc : item.value,
          }))}
          value={customerData?.companyType || ""}
          onChange={(e) => {
            onChangeCustomerData({
              target: { name: "companyType", value: e.target.value },
            });
          }}
          disabled={
            checkDisabledStatus("companyType")
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
        { isV("companyTypeVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="companyTypeVerified"
        name="companyTypeVerified"
        checked={verifiedData?.companyTypeVerified || false}
        onChange={onChangeVerifiedData}
      />
      <label htmlFor="companyTypeVerified">Verified</label>
    </div>)}
        </div>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.companyType != customerData?.companyType &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.companyType || "(empty)"}
            </div>
          )}
        {formErrors.companyType && (
          <div className="error">{t(formErrors.companyType)}</div>
        )}
      </div>

      {/* Company Name (English) */}
      {/* <div className="form-group">
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
onFocus={() => {
       if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
   
    
  }}
onKeyDown={handleKeyDown}
  onBlur={() => {
   
      document.body.classList.remove('keyboard-open');
       // 👈 show menu again (optional)
  }}
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
          <div className="error">{t(formErrors.companyNameEn)}</div>
        )}
      </div> */}

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
  <div className="input-with-verification">
    <input
      type="text"
onFocus={() => {
       if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
   
    
  }}
onKeyDown={handleKeyDown}
  onBlur={() => {
   
      document.body.classList.remove('keyboard-open');
       // 👈 show menu again (optional)
  }}
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
            checkDisabledStatus("companyNameEn")
          }
      required
    />
    {isV("companyNameEnVerified") &&  (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="companyNameEnVerified"
        name="companyNameEnVerified"
        checked={verifiedData?.companyNameEnVerified || false}
        onChange={onChangeVerifiedData}
      />
      <label htmlFor="companyNameEnVerified">Verified</label>
    </div>)}
  </div>
  {originalCustomerData &&
    customerData &&
    originalCustomerData?.companyNameEn != customerData?.companyNameEn &&
    mode === "edit" && (
      <div className="current-value">
        Previous: {originalCustomerData?.companyNameEn || "(empty)"}
      </div>
    )}
  {formErrors.companyNameEn && (
    <div className="error">{t(formErrors.companyNameEn)}</div>
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
        <div className="input-with-verification">
        <input
          type="text"
onFocus={() => {
       if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
   
    
  }}
onKeyDown={handleKeyDown}
  onBlur={() => {
   
      document.body.classList.remove('keyboard-open');
       // 👈 show menu again (optional)
  }}
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
            checkDisabledStatus("companyNameAr")
          }
          required
        />
        { isV("companyNameArVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="companyNameArVerified"
        name="companyNameArVerified"
        checked={verifiedData?.companyNameArVerified || false}
        onChange={onChangeVerifiedData}
      />
      <label htmlFor="companyNameArVerified">Verified</label>
      </div>)}
        </div>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.companyNameAr != customerData?.companyNameAr &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.companyNameAr || "(empty)"}
            </div>
          )}
        {formErrors.companyNameAr && (
          <div className="error">{t(formErrors.companyNameAr)}</div>
        )}
      </div>

      {/* Commercial Registration # - Already implemented correctly */}
      <div className="form-group">
        <label htmlFor="crNumber">
          {t("Commercial Registration #")}
          {customerData?.companyType &&
            customerData?.companyType.toLowerCase() === "trading" && (
              <span className="required-field">*</span>
            )}
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.crNumber != customerData?.crNumber &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <div className="input-with-verification">
        <input
          type="text"
onFocus={() => {
       if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
   
    
  }}
onKeyDown={handleKeyDown}
  onBlur={() => {
   
      document.body.classList.remove('keyboard-open');
       // 👈 show menu again (optional)
  }}
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
            checkDisabledStatus("crNumber")
          }
          required
        />
        {isV("crNumberVerified") &&   (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="crNumberVerified"
        name="crNumberVerified"
        checked={verifiedData?.crNumberVerified || false}
        onChange={onChangeVerifiedData}
      />
      <label htmlFor="crNumberVerified">Verified</label>
      </div>)}
        </div>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.crNumber != customerData?.crNumber &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.crNumber || "(empty)"}
            </div>
          )}
        {formErrors.crNumber && (
          <div className="error">{t(formErrors.crNumber)}</div>
        )}
      </div>

      {/* VAT Registration # */}
      <div className="form-group">
        <label htmlFor="vatNumber">
          {t("VAT Registration #")}
          {customerData?.companyType &&
            customerData?.companyType.toLowerCase() === "trading" && (
              <span className="required-field">*</span>
            )}
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.vatNumber != customerData?.vatNumber &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <div className="input-with-verification">
        <input
          type="text"
onFocus={() => {
       if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
   
    
  }}
onKeyDown={handleKeyDown}
  onBlur={() => {
   
      document.body.classList.remove('keyboard-open');
       // 👈 show menu again (optional)
  }}
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
            checkDisabledStatus("vatNumber")
          }
          required
        />
        {isV("vatNumberVerified") &&   (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="vatNumberVerified"
        name="vatNumberVerified"
        checked={verifiedData?.vatNumberVerified || false}
        onChange={onChangeVerifiedData}
      />
      <label htmlFor="vatNumberVerified">Verified</label>
      </div>)}
        </div>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.vatNumber != customerData?.vatNumber &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.vatNumber || "(empty)"}
            </div>
          )}
        {formErrors.vatNumber && (
          <div className="error">{t(formErrors.vatNumber)}</div>
        )}
      </div>

      {/* Government Registration # */}
      <div className="form-group">
        <label htmlFor="governmentRegistrationNumber">
          {t("Government Registration #")}
          {/* <span className="required-field">*</span> */}
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.governmentRegistrationNumber !=
              customerData?.governmentRegistrationNumber &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
         <div className="input-with-verification">
        <input
          type="text"
onFocus={() => {
       if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
   
    
  }}
onKeyDown={handleKeyDown}
  onBlur={() => {
   
      document.body.classList.remove('keyboard-open');
       // 👈 show menu again (optional)
  }}
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
            checkDisabledStatus("governmentRegistrationNumber")
          }
          required
        />
        {isV("governmentRegistrationNumberVerified") &&   (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="governmentRegistrationNumberVerified"
        name="governmentRegistrationNumberVerified"
        checked={verifiedData?.governmentRegistrationNumberVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="governmentRegistrationNumberVerified">Verified</label>
      </div>)}
        </div>
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
          <div className="error">
            {t(formErrors.governmentRegistrationNumber)}
          </div>
        )}
      </div>

      {/* Baladeah License # */}
      <div className="form-group">
        <label htmlFor="baladeahLicenseNumber">
          {t("Baladeah License #")}
          {/* <span className="required-field">*</span> */}
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.baladeahLicenseNumber !=
              customerData?.baladeahLicenseNumber &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
         <div className="input-with-verification">
        <input
          type="text"
onFocus={() => {
       if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
   
    
  }}
onKeyDown={handleKeyDown}
  onBlur={() => {
   
      document.body.classList.remove('keyboard-open');
       // 👈 show menu again (optional)
  }}
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
            checkDisabledStatus("baladeahLicenseNumber")
          }
          required
        />
        { isV("baladeahLicenseNumberVerified") &&  (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="baladeahLicenseNumberVerified"
        name="baladeahLicenseNumberVerified"
        checked={verifiedData?.baladeahLicenseNumberVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="baladeahLicenseNumberVerified">Verified</label>
      </div>)}
        </div>
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
          <div className="error">{t(formErrors.baladeahLicenseNumber)}</div>
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
        <div className="input-with-verification">
        <SearchableDropdown
          name="deliveryLocations"
          options={(basicMasterLists?.deliveryLocations || []).map((item) => ({
            value: item.value,
            name: currentLanguage === "ar" ? item.valueLc : item.value,
          }))}
          value={customerData?.deliveryLocations || ""}
          onChange={(e) => {
            // e.target.value will be the actual value, not the localized label
            onChangeCustomerData({
              target: { name: "deliveryLocations", value: e.target.value },
            });
          }}
          disabled={
            checkDisabledStatus("deliveryLocations")
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
        { isV("deliveryLocationsVerified") &&  (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="deliveryLocationsVerified"
        name="deliveryLocationsVerified"
        checked={verifiedData?.deliveryLocationsVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="deliveryLocationsVerified">Verified</label>
      </div>)}
        </div>
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
          <div className="error">{t(formErrors.deliveryLocations)}</div>
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
        <div className="input-with-verification">
        <SearchableDropdown
          name="typeOfBusiness"
          options={(basicMasterLists?.typeOfBusiness || []).map((item) => ({
            value: item.value,
            name: currentLanguage === "ar" ? item.valueLc : item.value,
          }))}
          value={typeOfBusiness}
          onChange={(e) => {
            onChangeCustomerData({
              target: { name: "typeOfBusiness", value: e.target.value },
            });
          }}
          disabled={
            checkDisabledStatus("typeOfBusiness")
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
        { isV("typeOfBusinessVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="typeOfBusinessVerified"
        name="typeOfBusinessVerified"
        checked={verifiedData?.typeOfBusinessVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="typeOfBusinessVerified">Verified</label>
      </div>)}
        </div>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.typeOfBusiness != typeOfBusiness &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.typeOfBusiness || "(empty)"}
            </div>
          )}
        {formErrors.typeOfBusiness && (
          <div className="error">{t(formErrors.typeOfBusiness)}</div>
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
          <div className="input-with-verification">
          <input
            type="text"
onFocus={() => {
       if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
   
    
  }}
onKeyDown={handleKeyDown}
  onBlur={() => {
   
      document.body.classList.remove('keyboard-open');
       // 👈 show menu again (optional)
  }}
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
            checkDisabledStatus("typeOfBusinessOther")
          }
          />
          {isV("typeOfBusinessOtherVerified") &&  (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="typeOfBusinessOtherVerified"
        name="typeOfBusinessOtherVerified"
        checked={verifiedData?.typeOfBusinessOtherVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="typeOfBusinessOtherVerified">Verified</label>
      </div>)}
          </div>
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
            <div className="error">{t(formErrors.typeOfBusinessOther)}</div>
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
        <div className="input-with-verification">
        <input
          type="text"
onFocus={() => {
       if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
   
    
  }}
onKeyDown={handleKeyDown}
  onBlur={() => {
   
      document.body.classList.remove('keyboard-open');
       // 👈 show menu again (optional)
  }}
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
          value={customerData?.brandNameEn || customerData?.companyNameEn || ""}
          onChange={onChangeCustomerData}
          disabled={
            checkDisabledStatus("brandNameEn")
          }
        />
        { isV("brandNameEnVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="brandNameEnVerified"
        name="brandNameEnVerified"
        checked={verifiedData?.brandNameEnVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="brandNameEnVerified">Verified</label>
      </div>)}
        </div>
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
        <div className="input-with-verification">
        <input
          type="text"
onFocus={() => {
       if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
   
    
  }}
onKeyDown={handleKeyDown}
  onBlur={() => {
   
      document.body.classList.remove('keyboard-open');
       // 👈 show menu again (optional)
  }}
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
          value={customerData?.brandNameAr || customerData?.companyNameAr || ""}
          onChange={onChangeCustomerData}
          disabled={
            checkDisabledStatus("brandNameAr")
          }
        />
        {isV("brandNameArVerified") &&  (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="brandNameArVerified"
        name="brandNameArVerified"
        checked={verifiedData?.brandNameArVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="brandNameArVerified">Verified</label>
      </div>)}
        </div>
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
        <div className="input-with-verification">
        <input
          type="file"
          id="companyLogo"
          name="companyLogo"
          accept="image/*"
          style={{ display: "none" }}
          ref={companyLogoInputRef}
          onChange={(e) => {e.preventDefault(); handleLogoChange(e, "companyLogo")}}
          disabled={
            mode === "edit" && customerData?.customerStatus !== "pending" && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
          }
        />
        <button
          type="button"
          className="custom-file-button"
          onClick={() => companyLogoInputRef.current?.click()}
          disabled={
            mode === "edit" && customerData?.customerStatus === "pending" && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
          }
          style={{ width: "100px" }}
        >
          {t("Upload")}
        </button>
        { isV("companyLogoVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="companyLogoVerified"
        name="companyLogoVerified"
        checked={verifiedData?.companyLogoVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="companyLogoVerified">Verified</label>
      </div>)}
        </div>
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
        <div className="input-with-verification">
        <input
          type="file"
          id="brandLogo"
          name="brandLogo"
          accept="image/*"
          style={{ display: "none" }}
          ref={brandLogoInputRef}
          onChange={(e) => handleLogoChange(e, "brandLogo")}
          disabled={
            mode === "edit" && customerData?.customerStatus !== "pending" && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
          }
        />
        <button
          type="button"
          className="custom-file-button"
          onClick={() => brandLogoInputRef.current?.click()}
          disabled={
            mode === "edit" && customerData?.customerStatus === "pending" && user?.designation !== Constants.DESIGNATIONS.OPS_COORDINATOR
          }
          style={{ width: "100px" }}
        >
          {t("Upload")}
        </button>
        {isV("brandLogoVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="brandLogoVerified"
        name="brandLogoVerified"
        checked={verifiedData?.brandLogoVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="brandLogoVerified">Verified</label>
      </div>)}
        </div>
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
          <div className="input-with-verification">
          <input
            type="text"
onFocus={() => {
       if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
   
    
  }}
onKeyDown={handleKeyDown}
  onBlur={() => {
   
      document.body.classList.remove('keyboard-open');
       // 👈 show menu again (optional)
  }}
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
            checkDisabledStatus("customerSource") || true
          }
          />
          {isV("customerSourceVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="customerSourceVerified"
        name="customerSourceVerified"
        checked={verifiedData?.customerSourceVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="customerSourceVerified">Verified</label>
      </div>)}
          </div>
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
              <div className="input-with-verification">
              <label className="checkbox-group-label">
                <input
                  type="checkbox"
                  id="interCompany"
                  name="interCompany"
                  checked={customerData?.interCompany}
                  onChange={setInterCompany}
                  disabled={
            checkDisabledStatus("interCompany") || customerData?.customerStatus === "new"
          }
                />
                {`\t ${t("Inter Company")}`}
              </label>
              {isV("interCompanyVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="interCompanyVerified"
        name="interCompanyVerified"
        checked={verifiedData?.interCompanyVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="interCompanyVerified">Verified</label>
      </div>)}
              </div>
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
              <div className="input-with-verification">
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
            checkDisabledStatus("entity") || customerData?.customerStatus === "new"
          }
                required
              >
                <option value="" disabled>
                  {t("Select")}
                </option>
                {basicMasterLists?.entity?.map((loc) => (
                  <option key={loc.value} value={loc.value}>
                    {loc.value}
                  </option>
                ))}
              </select>
              {isV("entityVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="entityVerified"
        name="entityVerified"
        checked={verifiedData?.entityVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="entityVerified">Verified</label>
      </div>)}
              </div>
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.entity != customerData?.entity &&
                mode === "edit" && (
                  <div className="current-value">
                    Previous: {originalCustomerData?.entity || "(empty)"}
                  </div>
                )}
              {formErrors.entity && (
                <div className="error">{t(formErrors.entity)}</div>
              )}
            </div>
          )}

          {isV("assignedToEntityWise") && (
            <div className="form-group">
              <label htmlFor="primaryBusinessUnit">
                {t("Primary Business Unit")}
                <span className="required-field">*</span>
                {originalCustomerData &&
                  customerData &&
                  originalCustomerData?.primaryBusinessUnit !=
                    customerData?.primaryBusinessUnit &&
                  mode === "edit" && (
                    <span className="update-badge">{t("Updated")}</span>
                  )}
              </label>
             <div className="input-with-verification">
  <SearchableDropdown
    name="primaryBusinessUnit"
    options={(basicMasterLists?.entity || []).map((item) => ({
      value: item.value,
      name: currentLanguage === "ar" ? item.valueLc : item.value,
    }))}
    value={customerData?.primaryBusinessUnit || ""}
    onChange={(e) => {
      onChangeCustomerData({
        target: { name: "primaryBusinessUnit", value: e.target.value },
      });
    }}
    disabled={checkDisabledStatus("primaryBusinessUnit") || customerData?.customerStatus === "new"}
    className={
      originalCustomerData &&
      customerData &&
      originalCustomerData?.primaryBusinessUnit !== customerData?.primaryBusinessUnit &&
      mode === "edit"
        ? "update-field"
        : ""
    }
    placeholder={t("Select")}
    required
  />
  {isV("primaryBusinessUnitVerified") && (
    (mode === "edit" && customerData?.customerStatus === "pending")) && (
    <div className="verification-checkbox">
      <input
        type="checkbox"
        id="primaryBusinessUnitVerified"
        name="primaryBusinessUnitVerified"
        checked={verifiedData?.primaryBusinessUnitVerified || false}
        onChange={onChangeVerifiedData}
      />
      <label htmlFor="primaryBusinessUnitVerified">Verified</label>
    </div>
  )}
</div>
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.primaryBusinessUnit !=
                  customerData?.primaryBusinessUnit &&
                mode === "edit" && (
                  <div className="current-value">
                    Previous:{" "}
                    {originalCustomerData?.primaryBusinessUnit || "(empty)"}
                  </div>
                )}
              {formErrors.primaryBusinessUnit && (
                <div className="error">{t(formErrors.primaryBusinessUnit)}</div>
              )}
            </div>
          )}

          {/* VMCO Branch Assignment Header */}
          <h3 className="form-header full-width">{t("Branch Regions")}</h3>
          {/* branch dropdown */}
          {isV("assignedToEntityWise") && (
            <div className="form-group">
              <label htmlFor="branch">
                {t("Branch Region")}
                <span className="required-field">*</span>
                {originalCustomerData &&
                  customerData &&
                  originalCustomerData?.branch != customerData?.branch &&
                  mode === "edit" && (
                    <span className="update-badge">{t("Updated")}</span>
                  )}
              </label>
              <div className="input-with-verification">
              <SearchableDropdown
                name="branch"
                options={(basicMasterLists?.branch || []).map((item) => ({
                  value: item.value,
                  name: currentLanguage === "ar" ? item.valueLc : item.value,
                }))}
                value={customerData?.branch || ""}
                onChange={(e) => {
                  onChangeCustomerData({
                    target: { name: "branch", value: e.target.value },
                  });
                }}
                disabled={
            checkDisabledStatus("branch") || customerData?.customerStatus === "new"
          }
                className={
                  originalCustomerData &&
                  customerData &&
                  originalCustomerData?.branch != customerData?.branch &&
                  mode === "edit"
                    ? "update-field"
                    : ""
                }
                placeholder={t("Enter branch")}
                required
              />
              {isV("branchVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="branchVerified"
        name="branchVerified"
        checked={verifiedData?.branchVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="branchVerified">Verified</label>
      </div>)}
              </div>
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.branch != customerData?.branch &&
                mode === "edit" && (
                  <div className="current-value">
                    Previous: {originalCustomerData?.branch || "(empty)"}
                  </div>
                )}
              {formErrors.branch && (
                <div className="error">{t(formErrors.branch)}</div>
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
              <div className="input-with-verification">
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
            checkDisabledStatus("assignedTo") || customerData?.customerStatus === "new"
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
              {isV("assignedToVerified") && (
    // (originalCustomerData &&
    //     customerData &&
    //     originalCustomerData?.companyNameEn !==
    //       customerData?.companyNameEn &&
    //     mode === "edit") ||
        (mode === "edit" && customerData?.customerStatus === "pending")) && (<div className="verification-checkbox">
      <input
        type="checkbox"
        id="assignedToVerified"
        name="assignedToVerified"
        checked={verifiedData?.assignedToVerified || false}
        onChange={onChangeVerifiedData}
        // className="verified-checkbox"
      />
      <label htmlFor="assignedToVerified">Verified</label>
      </div>)}
              </div>
              {originalCustomerData &&
                customerData &&
                originalCustomerData?.assignedTo != customerData?.assignedTo &&
                mode === "edit" && (
                  <div className="current-value">
                    Previous: {originalCustomerData?.assignedTo || "(empty)"}
                  </div>
                )}
              {formErrors.assignedTo && (
                <div className="error">{t(formErrors.assignedTo)}</div>
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
                customerData?.assignedToEntityWise?.[Constants.ENTITY.DAR]?.toString() || ""
              }
              onChange={setEntityWiseAssignment}
              disabled={
            checkDisabledStatus(customerData?.assignedToEntityWise?.[Constants.ENTITY.DAR]?.toString()) || customerData?.customerStatus === "new"
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
                {t(formErrors[`assignedToEntityWise.${Constants.ENTITY.DAR}`])}
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
                customerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO]?.toString()||
                ""
              }
              onChange={setEntityWiseAssignment}
              disabled={
            checkDisabledStatus(customerData?.assignedToEntityWise?.[Constants.ENTITY.VMCO]?.toString()) || customerData?.customerStatus === "new"
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
              openUpwards={true}
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
                {t(formErrors[`assignedToEntityWise.${Constants.ENTITY.VMCO}`])}
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
                customerData?.assignedToEntityWise?.[Constants.ENTITY.SHC]?.toString() || ""
              }
              onChange={setEntityWiseAssignment}
              disabled={
            checkDisabledStatus(customerData?.assignedToEntityWise?.[Constants.ENTITY.SHC]?.toString()) || customerData?.customerStatus === "new"
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
              openUpwards={true}
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
                {t(formErrors[`assignedToEntityWise.${Constants.ENTITY.SHC}`])}
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
                customerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI]?.toString() ||
                ""
              }
              onChange={setEntityWiseAssignment}
              disabled={
            checkDisabledStatus(customerData?.assignedToEntityWise?.[Constants.ENTITY.NAQI]?.toString()) || customerData?.customerStatus === "new"
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
              openUpwards={true}
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
                {t(formErrors[`assignedToEntityWise.${Constants.ENTITY.NAQI}`])}
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
                customerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC]?.toString()  ||
                ""
              }
              onChange={setEntityWiseAssignment}
              disabled={
            checkDisabledStatus(customerData?.assignedToEntityWise?.[Constants.ENTITY.GMTC]?.toString()) || customerData?.customerStatus === "new"
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
              openUpwards={true}
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
                {t(formErrors[`assignedToEntityWise.${Constants.ENTITY.GMTC}`])}
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
