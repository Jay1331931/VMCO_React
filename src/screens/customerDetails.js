import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/forms.css";
import CommentPopup from "../components/commentPanel";
import "../i18n";
import { useTranslation } from "react-i18next";
import {
  getBusinessDetailsForm,
  getBusinessDetailsFormData,
} from "./customerDetailsForms/customerBusinessDetails";
import { getContactDetailsForm } from "./customerDetailsForms/customerContactDetails";
import { getFinancialInformationForm } from "./customerDetailsForms/customerFinancialInformation";
import { getDocumentsForm } from "./customerDetailsForms/customerDocuments";
import CustomerProducts from "./customerDetailsForms/customerProducts";
import CustomerBranches from "./customerDetailsForms/customerBranches2";
import BusinessDetails from "./customerDetailsForms/businessDetails";
import ContactDetails from "./customerDetailsForms/contactDetails";
import FinancialInformation from "./customerDetailsForms/financialInformation";
import Documents from "./customerDetailsForms/documents";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faLocationDot,
  faDownload,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import maplibregl, { setWorkerCount } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Pagination from "../components/Pagination";
import ApprovalDialog from "../components/ApprovalDialog";
import RbacManager from "../utilities/rbac";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import constants from "../constants";
import LoadingSpinner from "../components/LoadingSpinner";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const fetchCurrentDataOfCustomerContacts = async (customerId) => {
  let contactsData = {};

  const responseContacts = await fetch(
    `${API_BASE_URL}/customer-contacts/${customerId}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    }
  );
  const contactsDataJson = await responseContacts.json();
  console.log(contactsDataJson);
  if (contactsDataJson.status === "Ok") {
    contactsData = contactsDataJson.data;
    console.log("Current customer contacts data:", contactsDataJson.data);
    return contactsData;
  } else {
    throw new Error(
      contactsData.data?.message || "Failed to fetch customer contacts"
    );
  }
};

const fetchCurrentPaymentMetods = async (customerId) => {
  let paymentMethodsData = {};
  const responsePaymentMethods = await fetch(
    `${API_BASE_URL}/payment-method/id/${customerId}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    }
  );
  const paymentMethodsDataJson = await responsePaymentMethods.json();
  if (paymentMethodsDataJson.status === "Ok") {
    paymentMethodsData = paymentMethodsDataJson.data;
    console.log(
      "Current customer payment methods data:",
      paymentMethodsDataJson.data
    );
    return paymentMethodsDataJson.data;
  } else {
    throw new Error(
      paymentMethodsData.data?.message ||
        "Failed to fetch customer payment methods"
    );
  }
};

const fetchCurrentDataOfCustomer = async (customerId) => {
  console.log("Fetching current data for customer ID:~~~~~~", customerId);
  let customerData = {};
  let contactsData = {};
  let paymentMethodsData = {};
  try {
    const response = await fetch(`${API_BASE_URL}/customers/id/${customerId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const customerDataJson = await response.json();
    console.log("Customer Data JSON~~~~~~~~~~~~~", customerDataJson);
    return customerDataJson.data;
  } catch (error) {
    console.error("Error fetching current customer data:", error);
    throw error;
  }
};

//TODO: Implement this function to fetch workflow data of a customer from server --WF


const checkInApproval = async (customerId) => {
  let isAppMode = false;
  try {
    const response = await fetch(`${API_BASE_URL}/workflow-instance/check/id`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: customerId, module: "customer" }),
      credentials: "include",
    });

    console.log("!!!!!!!!", response);

    if (response.ok) {
      const responseText = await response.text();
      console.log("^^^^^^^", responseText);

      // Debug the response format
      try {
        const data = responseText ? JSON.parse(responseText) : {};
        console.log("Parsed data:", data);
        isAppMode = data?.exists === "t";
        console.log("is approval mode", isAppMode);
        return isAppMode;
      } catch (parseError) {
        console.error("Error parsing response as JSON:", parseError);
        // If not JSON, check if it's a direct 't' or 'f' string
        isAppMode = responseText.trim() === "t";
        console.log("Using direct string match, is approval mode:", isAppMode);
        return isAppMode;
      }
    }
  } catch (err) {
    console.error("Error fetching workflow instance:", err);
    return false;
  }
};

function CustomerDetails() {
  const { t } = useTranslation();
  const [tabsHeight, setTabsHeight] = useState("auto");
  const { token, user, isAuthenticated, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(user?.roles[0] === "branch_primary" ? "Branches" : "Business Details");
  const location = useLocation();
  const customerId = location?.state?.customerId;
  const workflowId = location?.state?.workflowId;
  const workflowInstanceId = location?.state?.workflowInstanceId;
  const mode = location?.state?.mode;
  const [customerData, setCustomerData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const [workflowHistory, setWorkflowHistory] = useState([]);
  const [customerContactsData, setCustomerContactsData] = useState({});
  const [customerPaymentMethodsData, setCustomerPaymentMethodsData] = useState(
    {}
  );
  const [tradingFilesToUpload, setTradingFilesToUpload] = useState([]);
  const [nonTradingFilesToUpload, setNonTradingFilesToUpload] = useState([]);
  var updatedCustomerData = useRef({});
  var updatedCustomerContactsData = useRef({});
  var updatedCustomerPaymentMethodsData = useRef({});
  //TODO - set it appropriately based  workflow thingy - WF
  const [inApproval, setInApproval] = useState(true);
  const [originalCustomerData, setOriginalCustomerData] = useState(null); //WF
  const [originalCustomerContactsData, setOriginalCustomerContactsData] =
    useState(null); //WF
    const [originalCustomerPaymentMethodsData, setOriginalCustomerPaymentMethodsData] =
    useState(null); //WF
  // var wfCustomerData = null; //WF
  const [wfCustomerData, setWfCustomerData] = useState(null); //WF
  const fetchWorkflowDataOfCustomer = async (workflowId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/workflow-instance/id/${workflowId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
    const workflowDataJson = await response.json();
    console.log("Workflow Data JSON~~~~~~~~~~~~~", workflowDataJson);
    setWorkflowHistory(workflowDataJson?.data?.approvalHistory);
    return workflowDataJson?.data?.workflowData?.updates;
  } catch (error) {
    console.error("Error fetching workflow data:", error);
    throw error;
  }
};
  
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
  useEffect(() => {
    const fetchData = async () => {
      const resp = await fetchCurrentDataOfCustomer(customerId);
      const customerContacts = await fetchCurrentDataOfCustomerContacts(
        customerId
      );
      console.log("#####???????Fetched customer data:", JSON.stringify(resp));
      console.log("@@@@@@customerId:", customerId);
      console.log("@@@@@workflowId:", workflowId);
      console.log("@@@@@mode:", mode);
      const isUnderApproval = await checkInApproval(customerId);
      setInApproval(isUnderApproval);
      var temp;
      if (isUnderApproval) {
        //WF
        setOriginalCustomerData(resp);
        setOriginalCustomerContactsData(customerContacts);
        const wfData = await fetchWorkflowDataOfCustomer(workflowInstanceId);
        setWfCustomerData(wfData);
        // setWorkflowHistory(wfHistory);
        if(wfData?.customer?.nonTradingDocuments) {
          wfData.customer.nonTradingDocuments = JSON.parse(
            wfData.customer.nonTradingDocuments
          );
        }

        temp = wfData ;

       } else if(workflowInstanceId) {
        fetchWorkflowDataOfCustomer(workflowInstanceId);
       }
      setCustomerData(isUnderApproval ? {...resp, ...temp?.customer} : resp);
      setOriginalCustomerData(resp);
      const conRes = await fetchCurrentDataOfCustomerContacts(customerId);
      setCustomerContactsData(isUnderApproval ? {...conRes, ...temp?.contacts} : conRes);
      setOriginalCustomerContactsData(conRes);
      const paymentMethodsRes = await fetchCurrentPaymentMetods(customerId);
      setCustomerPaymentMethodsData(isUnderApproval && temp?.methodDetails ? {methodDetails : temp?.methodDetails} : paymentMethodsRes);
      setOriginalCustomerPaymentMethodsData(paymentMethodsRes);
    };
    fetchData();
  }, [customerId]);
  const handleCustomerDataChange = (e) => {
    const { name, value } = e.target;
    updatedCustomerData.current[name] = value;
    setCustomerData((prev) => ({ ...prev, [name]: value }));
  };
  const handleCustomerContactsDataChange = (e) => {
    const { name, value } = e.target;
    updatedCustomerContactsData.current[name] = value;
    setCustomerContactsData((prev) => ({ ...prev, [name]: value }));
  };
  const handleCustomerPaymentMethodsDataChange = (e) => {
    const { name, value } = e.target;
    console.log("##########$$$$$$$$$$", e.target.checked);
    const allowedPaymentMethods = [
      "prePayment",
      "partialPayment",
      "COD",
      // "credit",
    ];
    let paymentMethods = customerPaymentMethodsData.methodDetails;

    if (allowedPaymentMethods.includes(name)) {
      paymentMethods[name].isAllowed = e.target.checked;
    }

    if (name === "CODLimit") {
      paymentMethods["COD"].limit = value;
    }

    setCustomerPaymentMethodsData((prev) => ({
      ...prev,
      methodDetails: paymentMethods,
    }));
    updatedCustomerPaymentMethodsData.current = {
      ...updatedCustomerPaymentMethodsData.current,
      methodDetails: paymentMethods,
    };

    console.log(
      "Updated payment methods data:",
      updatedCustomerPaymentMethodsData.current
    );
  };
  const handleCustomerCreditChange = (e) => {
    const { name, value } = e.target;
    const allowedPaymentMethods = [
      "DAR",
      "VMCO",
      "NAQI",
      "GMTC",
      "SHC"
    ];
    let paymentMethods = customerPaymentMethodsData.methodDetails.credit;
    if (allowedPaymentMethods.includes(name)) {
      paymentMethods[name].isAllowed = e.target.checked;
    }

    if( name.includes("CreditLimit")) {
      const methodName = name.replace("CreditLimit", "");
      paymentMethods[methodName].limit = value;
    };
    if( name.includes("CreditPeriod")) {
      const methodName = name.replace("CreditPeriod", "");
      paymentMethods[methodName].period = value;
    };
    setCustomerPaymentMethodsData((prev) => ({
      ...prev,
      methodDetails: {
        ...prev.methodDetails,
        credit: paymentMethods,
      },
    }));
    updatedCustomerPaymentMethodsData.current = {
      ...updatedCustomerPaymentMethodsData.current,
      methodDetails: {
        ...customerPaymentMethodsData.methodDetails,
        credit: paymentMethods,
      },
    };
  }

  const setGeoLocation = (location) => {
    updatedCustomerData.current.geolocation = location;
    setCustomerData((prev) => ({ ...prev, geolocation: location }));
    console.log("^^^^^^^^", customerData);
  };

  const setEntityWiseAssignment = (e) => {
    const {name, value} = e.target;
    updatedCustomerData.current["assignedToEntityWise"] = customerData.assignedToEntityWise;
    updatedCustomerData.current.assignedToEntityWise[name] = value;
    setCustomerData((prev) => ({
      ...prev,
      assignedToEntityWise: {
        ...prev.assignedToEntityWise,
        [name]: value,
      },
    }));
  }
const setEntityWisePricePlan = (e) => {
    const {name, value} = e.target;
    updatedCustomerData.current["pricingPolicy"] = customerData.pricingPolicy;
    updatedCustomerData.current.pricingPolicy[name] = value;
    setCustomerData((prev) => ({
      ...prev,
      pricingPolicy: {
        ...prev.pricingPolicy,
        [name]: value,
      },
    }));
  }
  const setBusinessHeadSameAsPrimary = (isSame) => {
    updatedCustomerContactsData.current.businessHeadName = customerContactsData.primaryContactName;
    updatedCustomerContactsData.current.businessHeadEmail =
      customerContactsData.primaryContactEmail;
    updatedCustomerContactsData.current.businessHeadPhone =
      customerContactsData.primaryContactPhone;
      updatedCustomerContactsData.current.businessHeadDesignation =
      customerContactsData.primaryContactDesignation;
    setCustomerContactsData((prev) => ({
      ...prev,
      businessHeadName: customerContactsData.primaryContactName,
      businessHeadEmail: customerContactsData.primaryContactEmail,
      businessHeadPhone: customerContactsData.primaryContactPhone,
      businessHeadDesignation: customerContactsData.primaryContactDesignation,
    }));
  };
const setInterCompany = (e) => {
  const {name} = e.target;
  const value = e.target.checked;
  updatedCustomerData.current["interCompany"] = value;
  setCustomerData((prev) => ({
    ...prev,
    interCompany: value
  }));
};
const mandatoryFields = [
  "companyNameEn",
  "companyNameAr",
  "companyType",
  "crNumber",
  "vatNumber",
  "baladeahLicenseNumber",
  "governmentRegistrationNumber",
  "typeOfBusiness",
  "typeOfBusinessOther",
  "deliveryLocations",
  // "companyLogo",
  // "brandLogo",
  // "brandNameEn",
  // "brandNameAr",
  "buildingName",
  "street",
  "city",
  "district",
  "region",
  "pincode",
  "geolocation",
  "bankName",
  "bankAccountNumber",
  "iban",
  "crCertificate",
  "vatCertificate",
  "nationalId",
  "bankLetter",
  "nationalAddress",
  "customerSource",
  "acknowledgementSignature",
  "contractAgreement",
  "customerContract",
  "creditApplication",
  // "declarationName",
  // "declarationSignature",
  // "declarationDate",
  "pricingPolicy",
  // "customerStatus",
  // "isDeliveryChargesApplicable",
  // "isBlocked",
  "assignedTo",
  "assignedToEntityWise",
  // "nonTradingDocuments",
  // "interCompany",
  "entity",
  "zone"
];

// const validateChangedFields = (
//     action,
//     changedFields,
//     checkRequired = false
//   ) => {
//     const errors = {};
//     console.log("Validating changed fields:", changedFields);

//     changedFields.forEach((fieldName) => {
//       // Find the field in all tabs if checkRequired, otherwise only in activeTab
//       let field;
//       if (checkRequired) {
//         for (const tab of Object.keys(formsByTab)) {
//           field = formsByTab[tab].find((f) => f.name === fieldName);
//           if (field) break;
//         }
//       } else {
//         field = formsByTab[activeTab].find((f) => f.name === fieldName);
//       }

//       // Skip if field is not found in any tab
//       if (!field) return;

//       const value = formData[fieldName];

//       if (
//         action === "save changes" &&
//         field.required &&
//         !value &&
//         fieldName !== "nonTradingDocuments" &&
//         field.type !== "document"
//       ) {
//         errors[fieldName] = t("This field is required.");
//       }

//       if (checkRequired && field.type === "text" && field.required && !value) {
//         errors[fieldName] = t("This field is required.");
//       }

//       if (
//         checkRequired &&
//         field.type === "document" &&
//         field.required &&
//         !uploadedFiles[fieldName]
//       ) {
//         errors[fieldName] = t("This document is required.");
//       }

//       if (
//         fieldName.toLowerCase().includes("arabic") &&
//         value &&
//         !isArabicText(value)
//       ) {
//         errors[fieldName] = t("Please enter Arabic text.");
//       }

//       if (fieldName.toLowerCase().includes("email")) {
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (value && !emailRegex.test(value)) {
//           errors[fieldName] = t("Invalid email format");
//         }
//       }

//       if (
//         fieldName.toLowerCase().includes("phone") ||
//         fieldName.toLowerCase().includes("number") ||
//         fieldName.toLowerCase().includes("#")
//       ) {
//         if (value && isNaN(value)) {
//           errors[fieldName] = t("Only numeric values are allowed");
//         }
//       }

//       if (activeTab === "Contact Details") {
//         if (
//           checkRequired &&
//           fieldName === "primaryContactName" &&
//           !formData[fieldName]
//         ) {
//           errors[fieldName] = t("Primary contact name is required");
//         }
//         if (checkRequired && fieldName === "primaryContactEmail") {
//           if (!formData[fieldName]) {
//             errors[fieldName] = t("Primary contact email is required");
//           }
//         }
//         if (
//           fieldName === "financeHeadEmail" ||
//           fieldName === "purchasingHeadEmail"
//         ) {
//           const otherHeadEmail =
//             fieldName === "financeHeadEmail"
//               ? formData.purchasingHeadEmail
//               : formData.financeHeadEmail;

//           if (formData[fieldName] && formData[fieldName] === otherHeadEmail) {
//             errors[fieldName] = t(
//               "Finance and Purchasing heads must have unique emails"
//             );
//           }
//           if (
//             formData[fieldName] &&
//             formData[fieldName] === formData.primaryContactEmail
//           ) {
//             errors[fieldName] = t(
//               "This email is already used by primary contact"
//             );
//           }
//         }
//       }

//       if (
//         checkRequired &&
//         fieldName === "nonTradingDocuments" &&
//         (pendingFileUploads[fieldName]?.length === 0 ||
//           transformedCustomer?.[fieldName]?.length === 0)
//       ) {
//         // console.log("Non trading documents", pendingFileUploads[fieldName]?.length)
//         errors[fieldName] = t("At least one document is required");
//       }
//     });

//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

  const validateData = (dataToValidate, mandatoryCheckRequired = false) => {
    const errors = {};    // If mandatoryCheckReguired is true, check all mandatory fields
    if (mandatoryCheckRequired) {
      mandatoryFields.forEach((field) => {
        if (field in dataToValidate && !dataToValidate[field]) {
          errors[field] = t("This field is required.");
        }
      });
    }
    return errors;
  };

  const uploadFile = async (fieldName, fileData, customerId) => {
    try {
      const formData = new FormData();
      formData.append("file", fileData);
      formData.append("fileType", fieldName);

      const res = await fetch(`${API_BASE_URL}/customers/file/${customerId}`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (res.ok) {
        const responseData = await res.json();
        // return responseData;
        if (fieldName === "nonTradingDocuments") {
          updatedCustomerData.current[fieldName] = [
            ...(customerData?.nonTradingDocuments || []),
            responseData.fileName,
          ];
        } else {
          updatedCustomerData.current[fieldName] = responseData.fileName;
      }
      return responseData;
    }
    } catch (error) {
      console.error("Error uploading files:", error.message);
    }
  };
  const uploadDocuments = async (tradingFilesToUpload, nonTradingFilesToUpload) => {
    const uploadedFiles = {};
    try {
      // Object.entries(tradingFilesToUpload).forEach(async ([fieldName, file]) => {
      //   const uploadedFile = await uploadFile(fieldName, file, customerId);
      //   updatedCustomerData.current[fieldName] = uploadedFile.fileName;
      // });
      for (const fieldName of Object.keys(tradingFilesToUpload)) {
  const file = tradingFilesToUpload[fieldName];
  const uploadedFile = await uploadFile(fieldName, file, customerId);
  // if (uploadedFile && uploadedFile.fileName) {
  //   updatedCustomerData.current[fieldName] = uploadedFile.fileName;
  // }
  if( uploadedFile && uploadedFile.fileName) {
    uploadedFiles[fieldName] = uploadedFile.fileName;
  }
}
      for (const fieldName of Object.keys(nonTradingFilesToUpload)) {
          const file = nonTradingFilesToUpload[fieldName];
          if (fieldName !== "others") {
            uploadFile(fieldName, file, customerId);
          } else if (Array.isArray(file)) {
            // file.forEach((f) => {
               uploadedFiles["nonTradingDocuments"] = [
                  ...(customerData?.nonTradingDocuments || [])
                ];
              for (const f of file) {
              const uploadedFile = await uploadFile("nonTradingDocuments", f, customerId);
              if (uploadedFile && uploadedFile.fileName) {
               
                uploadedFiles["nonTradingDocuments"].push(uploadedFile.fileName);
                }
            }
            // updatedCustomerData.current["nonTradingDocuments"] = [
            //   ...(customerData?.nonTradingDocuments || []),
            //   ...(nonTradingFilesToUpload?.others || [])
            // ];
          }
        }
        if(uploadedFiles?.["nonTradingDocuments"])
      uploadedFiles["nonTradingDocuments"] = JSON.stringify(uploadedFiles["nonTradingDocuments"]);
      return uploadedFiles;
    } catch (error) {
      console.error("Error uploading files:", error.message);
    }
  };
  const handleSave = async (action) => {
    console.log("^^^^^Saving customer data:", updatedCustomerData.current);
    console.log(nonTradingFilesToUpload);

    try {
      uploadDocuments(tradingFilesToUpload, nonTradingFilesToUpload);
      updatedCustomerData.current["customerStatus"] =
        customerData.customerStatus;

      const response = await fetch(
        `${API_BASE_URL}/customers/id/${customerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: updatedCustomerData.current,
            contacts: {}
          }),
          credentials: "include",
        }
      );
      console.log("Response", response);
    } catch (error) {
      console.error("Error updating customer:", error.message);
    }

    try {
      //TODO:Merge workflow data with updatedcustomerData.current if inApproval is true and save. This could happen only during
      //  approval the data is changed
      // updatedCustomerData.current["customerStatus"] = customerData.customerStatus;

      const response = await fetch(
        `${API_BASE_URL}/customer-contacts/${customerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedCustomerContactsData.current),
          credentials: "include",
        }
      );
      console.log("Response", response);
    } catch (error) {
      console.error("Error updating customer:", error.message);
    }

    try {
      // updatedCustomerPaymentMethodsData.current["customerStatus"] = customerData.customerStatus;

      const response = await fetch(
        `${API_BASE_URL}/payment-method/id/${customerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedCustomerPaymentMethodsData.current),
          credentials: "include",
        }
      );
      console.log("Response", response);
    } catch (error) {
      console.error("Error updating customer payment methods:", error.message);
    }
  };

  const handleSaveChanges = async (action) => {
    console.log("^^^^^Saving customer data:", updatedCustomerData.current);
    console.log(nonTradingFilesToUpload);

    try {
      updatedCustomerData.current["customerStatus"] =
        customerData.customerStatus;
      const uploadedFiles = await uploadDocuments(tradingFilesToUpload, nonTradingFilesToUpload);
      updatedCustomerData.current = {
        ...updatedCustomerData.current,
        ...uploadedFiles,
      };
      // const errors = validateData(customerData, true);
      // setFormErrors(errors);
      // if (Object.keys(errors).length > 0) {
      //   // Handle errors (e.g., show error messages)
      //   return;
      // }
      
      // if(Object.keys(nonTradingFilesToUpload?.others) > 0) {
      //   updatedCustomerData.current["nonTradingDocuments"] = [
      //     ...(customerData?.nonTradingDocuments || []),
      //     ...(nonTradingFilesToUpload?.others || [])
      //   ];
      // }
      const response = await fetch(
        `${API_BASE_URL}/customers/id/${customerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({customer: updatedCustomerData.current, contacts: updatedCustomerContactsData.current }),
          credentials: "include",
        }
      );
      console.log("Response", response);
    } catch (error) {
      console.error("Error updating customer:", error.message);
    }

    // try {
    //   //TODO:Merge workflow data with updatedcustomerData.current if inApproval is true and save. This could happen only during
    //   //  approval the data is changed
    //   // updatedCustomerData.current["customerStatus"] = customerData.customerStatus;

    //   const response = await fetch(
    //     `${API_BASE_URL}/customer-contacts/${customerId}`,
    //     {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify(updatedCustomerContactsData.current),
    //       credentials: "include",
    //     }
    //   );
    //   console.log("Response", response);
    // } catch (error) {
    //   console.error("Error updating customer:", error.message);
    // }

    try {
      // updatedCustomerPaymentMethodsData.current["customerStatus"] = customerData.customerStatus;

      const response = await fetch(
        `${API_BASE_URL}/payment-method/id/${customerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedCustomerPaymentMethodsData.current),
          credentials: "include",
        }
      );
      console.log("Response", response);
    } catch (error) {
      console.error("Error updating customer payment methods:", error.message);
    }
  };

  const handleApprove = async (action) => {
    try {
      if(wfCustomerData?.customer?.nonTradingDocuments) {
        wfCustomerData.customer.nonTradingDocuments = JSON.stringify(
          wfCustomerData.customer.nonTradingDocuments
        );
      }
      if(customerData?.nonTradingDocuments) {
        wfCustomerData.customer.nonTradingDocuments = JSON.stringify(
          customerData.nonTradingDocuments
        );
      }
      const mergedData = {
        updates: { ...wfCustomerData, ...updatedCustomerData.current },
        id: customerId,
      };
      const response = await fetch(
        `${API_BASE_URL}/workflow-instance/id/${workflowInstanceId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approvedStatus: "approved",
            comment: "comment",
            workflowData: mergedData,
          }),
          credentials: "include",
        }
      );
      console.log("Response", response);
    } catch (error) {
      console.error("Error approving customer:", error.message);
    }
  };

  const handleReject = async (action) => {
    try {
      if(wfCustomerData?.customer?.nonTradingDocuments) {
        wfCustomerData.customer.nonTradingDocuments = JSON.stringify(
          wfCustomerData.customer.nonTradingDocuments
        );
      }
      if(customerData?.nonTradingDocuments) {
        wfCustomerData.customer.nonTradingDocuments = JSON.stringify(
          customerData.nonTradingDocuments
        );
      }
      const mergedData = {
        updates: { ...wfCustomerData, ...updatedCustomerData.current },
        id: customerId,
      };
      const response = await fetch(
        `${API_BASE_URL}/workflow-instance/id/${workflowInstanceId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approvedStatus: "rejected",
            comment: "comment",
            workflowData: mergedData,
          }),
          credentials: "include",
        }
      );
      console.log("Response", response);
    } catch (error) {
      console.error("Error approving customer:", error.message);
    }
  };

  const handleSubmit = async (action) => {
    try {
      // uploadDocuments(tradingFilesToUpload, nonTradingFilesToUpload);
      handleSave();
      customerData["customerStatus"] = "pending";

      const response = await fetch(
        `${API_BASE_URL}/customers/id/${customerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customerData.customerStatus),
          credentials: "include",
        }
      );
      console.log("Response", response);
    } catch (error) {
      console.error("Error updating customer:", error.message);
    }

    // try {
    //   //TODO:Merge workflow data with updatedcustomerData.current if inApproval is true and save. This could happen only during
    //   //  approval the data is changed
    //   // updatedCustomerData.current["customerStatus"] = customerData.customerStatus;

    //   const response = await fetch(
    //     `${API_BASE_URL}/customer-contacts/${customerId}`,
    //     {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify(customerContactsData),
    //       credentials: "include",
    //     }
    //   );
    //   console.log("Response", response);
    // } catch (error) {
    //   console.error("Error updating customer:", error.message);
    // }
  };

  const handleBlock = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/customers/id/${customerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerStatus: "blocked", isBlocked: true }),
          credentials: "include",
        }
      );
      console.log("Response", response);
    } catch (error) {
      console.error("Error blocking customer:", error.message);
    }
  };

  const handleUnblock = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/customers/id/${customerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerStatus: "approved",
            isBlocked: false,
          }),
          credentials: "include",
        }
      );
      console.log("Response", response);
    } catch (error) {
      console.error("Error unblocking customer:", error.message);
    }
  };

  return (
    <Sidebar>
      <div className="customers">
        <div
          className={`customer-onboarding-content ${
            isCommentPanelOpen ? "collapsed" : ""
          }`}
        >
        <div className="customer-onboarding-details">
          <div className="customer-onboarding-body">
            <div
              className="customer-onboarding-tabs-vertical"
              style={{ height: tabsHeight }}
            >
              <div className="tabs-title">{t("Customer Details")}</div>
              
              {isV("businessDetailsTab") && (<div
                key={"Business Details"}
                className={`tab ${activeTab === "Business Details" ? "active" : ""}`}
                onClick={() => setActiveTab("Business Details")}
                >
                  {t("Business Details")}
              </div>)}

              {isV("contactDetailsTab") && (<div
                key={"Contact Details"}
                className={`tab ${activeTab === "Contact Details" ? "active" : ""}`}
                onClick={() => setActiveTab("Contact Details")}
                >
                  {t("Contact Details")}
              </div>)}

              {isV("financialInformationTab") && (<div
                key={"Financial Information"}
                className={`tab ${activeTab === "Financial Information" ? "active" : ""}`}
                onClick={() => setActiveTab("Financial Information")}
                >
                  {t("Financial Information")}
              </div>)}

              {isV("documentsTab") && (<div
                key={"Documents"}
                className={`tab ${activeTab === "Documents" ? "active" : ""}`}
                onClick={() => setActiveTab("Documents")}
                >
                  {t("Documents")}
              </div>)}

              {isV("productsTab") && (<div
                key={"Products"}
                className={`tab ${activeTab === "Products" ? "active" : ""}`}
                onClick={() => setActiveTab("Products")}
                >
                  {t("Products")}
              </div>)}

              {isV("branchesTab") && (<div
                key={"Branches"}
                className={`tab ${activeTab === "Branches" ? "active" : ""}`}
                onClick={() => setActiveTab("Branches")}
                >
                  {t("Branches")}
              </div>)}
            </div>
            {activeTab === "Business Details" && isV("businessDetailsTab") && (
              <BusinessDetails
                customerData={customerData}
                originalCustomerData={originalCustomerData}
                onChangeCustomerData={handleCustomerDataChange}
                setEntityWiseAssignment={setEntityWiseAssignment}
                mode={mode}
                setTabsHeight={setTabsHeight}
                setInterCompany={setInterCompany}
                formErrors={formErrors}
              />
            )}
            {activeTab === "Contact Details" && isV("contactDetailsTab") && (
              <ContactDetails
                customerData={customerData}
                originalCustomerData={originalCustomerData}
                customerContactsData={customerContactsData}
                originalCustomerContactsData={originalCustomerContactsData}
                onChangeCustomerData={handleCustomerDataChange}
                onChangeCustomerContactsData={handleCustomerContactsDataChange}
                setGeoLocation={setGeoLocation}
                setBusinessHeadSameAsPrimary={setBusinessHeadSameAsPrimary}
                mode={mode}
                setTabsHeight={setTabsHeight}
              />
            )}
            {activeTab === "Financial Information" && isV("financialInformationTab") && (
              <FinancialInformation
                customerData={customerData}
                originalCustomerData={originalCustomerData}
                customerPaymentMethodsData={customerPaymentMethodsData}
                originalCustomerPaymentMethodsData={originalCustomerPaymentMethodsData}
                onChangeCustomerData={handleCustomerDataChange}
                onChangeCustomerPaymentMethodsData={
                  handleCustomerPaymentMethodsDataChange
                }
                setEntityWisePricePlan={setEntityWisePricePlan}
                setCustomerCreditChange={handleCustomerCreditChange}
                mode={mode}
                setTabsHeight={setTabsHeight}
              />
            )}
            {activeTab === "Documents" && isV("documentsTab") && (
              <Documents
                isTrading={customerData?.companyType === "trading"}
                tradingFilesToUpload={tradingFilesToUpload}
                nonTradingFilesToUpload={nonTradingFilesToUpload}
                customerData={customerData}
                originalCustomerData={originalCustomerData}
                setTabsHeight={setTabsHeight}
                mode={mode}
              />
            )}
            {activeTab === "Branches" && isV("branchesTab") && (
              <CustomerBranches
                customer={{
                  ...customerData,
                  workflowId: workflowId,
                  workflowInstanceId: workflowInstanceId,
                }}
                setTabsHeight={setTabsHeight}
                mode={mode}
                inApproval={false}
              />
            )}
            {activeTab === "Products" && isV("productsTab") && (
              <CustomerProducts
                customer={customerData}
                setTabsHeight={setTabsHeight}
              />
            )}
          </div>
        </div>
        <div className="customer-onboarding-form-actions">
          <div
            className="action-buttons"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <span className="status-label">{t("Status")}:</span>
            <span className="status-badge">
              {t(customerData.customerStatus) || t("Pending")}
            </span>
          </div>
          {[
            "Business Details",
            "Contact Details",
            "Financial Information",
            "Documents",
          ].includes(activeTab) && (
            <div className="action-buttons">
              {isV("btnSave") && customerData?.customerStatus === "new" && (
                <button
                  className="save"
                  onClick={() => handleSave("save")}
                  disabled={false}
                >
                  {t("Save")}
                </button>
              )}
              {isV("btnSubmit") && customerData?.customerStatus === "new" && (
                <button
                  className="save"
                  onClick={() => handleSubmit("save")}
                  disabled={false}
                >
                  {t("Submit")}
                </button>
              )}
              {isV("btnSaveChanges") &&
                customerData?.customerStatus !== "new" && (
                  <button
                    className="save"
                    onClick={() => handleSaveChanges("save")}
                    disabled={
                      (mode === "add" && inApproval) || customerData?.isBlocked
                    }
                  >
                    {t("Save Changes")}
                  </button>
                )}
              {isV("btnApprove") && inApproval && (
                <button
                  className="approve"
                  onClick={() => handleApprove("approve")}
                  disabled={false}
                >
                  {t("Approve")}
                </button>
              )}
              {isV("btnReject") && inApproval && (
                <button
                  className="reject"
                  onClick={() => handleReject("reject")}
                  disabled={false}
                >
                  {t("Reject")}
                </button>
              )}
              {isV("btnBlock") && !customerData?.isBlocked && (
                <button
                  className="block"
                  onClick={() => handleBlock()}
                  disabled={false}
                >
                  {t("Block")}
                </button>
              )}
              {isV("btnUnblock") && customerData?.isBlocked && (
                <button
                  className="unblock"
                  onClick={() => handleUnblock()}
                  disabled={false}
                >
                  {t("Unblock")}
                </button>
              )}
            </div>
          )}
        </div>
        {mode==="edit" && (
          <>
            <div>
              <CommentPopup
                isOpen={isCommentPanelOpen}
                setIsOpen={setIsCommentPanelOpen}
                externalComments={workflowHistory}
                isVisible={true}
                showCommentForm={false}
              />
            </div>
          </>
        )}
      </div>
      </div>
    </Sidebar>
  );
}

export default CustomerDetails;
