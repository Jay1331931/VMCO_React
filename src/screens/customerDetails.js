import React, { useState, useEffect, useMemo, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/forms.css";
import CommentPopup from "../components/commentPanel";
import "../i18n";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
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
import maplibregl, { setWorkerCount, validate } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Pagination from "../components/Pagination";
import ApprovalDialog from "../components/ApprovalDialog";
import RbacManager from "../utilities/rbac";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import constants from "../constants";
import LoadingSpinner from "../components/LoadingSpinner";
import FinalSubmissionConfirmation from "./customerDetailsForms/finalSubmissionConfirmation";
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

function countUpdatedFields(original = {}, current = {}, fields = []) {
  let count = 0;
  fields.forEach((field) => {
    if (
      original?.[field] !== undefined &&
      current?.[field] !== undefined &&
      original?.[field] !== current?.[field]
    ) {
      count++;
    }
  });
  return count;
}
const businessDetailsFields = [
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
  "companyLogo",
  "brandLogo",
  "brandNameEn",
  "brandNameAr",
  "customerSource",
  "interCompany",
  "entity",
  "assignedTo",
  "assignedToEntityWise",
  // "pricingPolicy",
  "zone",
  // ...add more as needed
];

// Fields from customerContactsData
const contactDetailsFields = [
  "primaryContactName",
  "primaryContactDesignation",
  "primaryContactEmail",
  "primaryContactMobile",
  "businessHeadName",
  "businessHeadDesignation",
  "businessHeadEmail",
  "businessHeadMobile",
  "financeHeadName",
  "financeHeadDesignation",
  "financeHeadEmail",
  "financeHeadMobile",
  "purchasingHeadName",
  "purchasingHeadDesignation",
  "purchasingHeadEmail",
  "purchasingHeadMobile",
  // ...add more if needed
];

// Fields from customerData used in ContactDetails form
const contactDetailsCustomerFields = [
  "buildingName",
  "street",
  "city",
  "district",
  "region",
  "pincode",
  "geolocation",
  "zone",
  "branch",
  // ...add more if needed
];

// Fields from customerData for Financial Information
const financialInfoCustomerFields = [
  "bankName",
  "bankAccountNumber",
  "iban",
  "isDeliveryChargesApplicable",
  // ...add more if needed
];

// Pricing policy fields (these are keys inside pricingPolicy object)
const pricingPolicyEntities = ["DAR", "VMCO", "SHC", "NAQI", "GMTC"];

// Fields from customerPaymentMethodsData for Financial Information
const financialInfoPaymentFields = [
  // Payment methods
  "prePayment",
  "partialPayment",
  "COD",
  // Credit for each entity
  "DARCreditLimit",
  "DARCreditPeriod",
  "VMCOCreditLimit",
  "VMCOCreditPeriod",
  "SHCCreditLimit",
  "SHCCreditPeriod",
  "NAQICreditLimit",
  "NAQICreditPeriod",
  "GMTCreditLimit",
  "GMTCreditPeriod",
  // ...add more if needed
];

// Helper to count pricing policy updates
function countPricingPolicyUpdates(original = {}, current = {}, entities = []) {
  let count = 0;
  entities.forEach((entity) => {
    if (
      original?.pricingPolicy?.[entity] !== undefined &&
      current?.pricingPolicy?.[entity] !== undefined &&
      original?.pricingPolicy?.[entity] !== current?.pricingPolicy?.[entity]
    ) {
      count++;
    }
  });
  return count;
}

// Helper to count payment method updates (checkboxes and limits/periods)
function countPaymentMethodUpdates(original = {}, current = {}) {
  let count = 0;
  // PrePayment, PartialPayment, COD
  ["prePayment", "partialPayment", "COD"].forEach((method) => {
    if (
      original?.methodDetails?.[method]?.isAllowed !== undefined &&
      current?.methodDetails?.[method]?.isAllowed !== undefined &&
      original?.methodDetails?.[method]?.isAllowed !==
        current?.methodDetails?.[method]?.isAllowed
    ) {
      count++;
    }
    // For COD, check limit
    if (method === "COD") {
      if (
        original?.methodDetails?.COD?.limit !== undefined &&
        current?.methodDetails?.COD?.limit !== undefined &&
        original?.methodDetails?.COD?.limit !==
          current?.methodDetails?.COD?.limit
      ) {
        count++;
      }
    }
  });
  // Credit for each entity
  ["DAR", "VMCO", "SHC", "NAQI", "GMTC"].forEach((entity) => {
    if (
      original?.methodDetails?.credit?.[entity]?.isAllowed !== undefined &&
      current?.methodDetails?.credit?.[entity]?.isAllowed !== undefined &&
      original?.methodDetails?.credit?.[entity]?.isAllowed !==
        current?.methodDetails?.credit?.[entity]?.isAllowed
    ) {
      count++;
    }
    if (
      original?.methodDetails?.credit?.[entity]?.limit !== undefined &&
      current?.methodDetails?.credit?.[entity]?.limit !== undefined &&
      original?.methodDetails?.credit?.[entity]?.limit !==
        current?.methodDetails?.credit?.[entity]?.limit
    ) {
      count++;
    }
    if (
      original?.methodDetails?.credit?.[entity]?.period !== undefined &&
      current?.methodDetails?.credit?.[entity]?.period !== undefined &&
      original?.methodDetails?.credit?.[entity]?.period !==
        current?.methodDetails?.credit?.[entity]?.period
    ) {
      count++;
    }
  });
  return count;
}

// Add this array for assignedToEntityWise entities
const assignedToEntityWiseEntities = ["DAR", "VMCO", "SHC", "NAQI", "GMTC"];

// Helper to count assignedToEntityWise updates
function countAssignedToEntityWiseUpdates(
  original = {},
  current = {},
  entities = []
) {
  let count = 0;
  entities.forEach((entity) => {
    if (
      original?.assignedToEntityWise?.[entity] !== undefined &&
      current?.assignedToEntityWise?.[entity] !== undefined &&
      original?.assignedToEntityWise?.[entity] !==
        current?.assignedToEntityWise?.[entity]
    ) {
      count++;
    }
  });
  return count;
}

// Document fields to track for updates
const documentFields = [
  "acknowledgementSignature",
  "crCertificate",
  "vatCertificate",
  "nationalId",
  "bankLetter",
  "nationalAddress",
  "contractAgreement",
  "creditApplication",
];

// Helper to count updated document fields (excluding nonTradingDocuments)
function countUpdatedDocumentFields(original = {}, current = {}, fields = []) {
  let count = 0;
  fields.forEach((field) => {
    if (
      original?.[field] !== undefined &&
      current?.[field] !== undefined &&
      original?.[field] !== current?.[field]
    ) {
      count++;
    }
  });
  return count;
}

// Helper to count updates in nonTradingDocuments array
function countNonTradingDocumentsUpdates(original = [], current = []) {
  if (!Array.isArray(original)) original = [];
  if (!Array.isArray(current)) current = [];
  // Count as updated if the arrays are different in length or content
  if (original.length !== current.length) return 1;
  // Compare contents (order-insensitive)
  const originalSorted = [...original].sort();
  const currentSorted = [...current].sort();
  for (let i = 0; i < originalSorted.length; i++) {
    if (originalSorted[i] !== currentSorted[i]) return 1;
  }
  return 0;
}

function CustomerDetails() {
  const { t } = useTranslation();
  const [tabsHeight, setTabsHeight] = useState("auto");
  const { token, user, isAuthenticated, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(
    user?.roles[0] === "branch_primary" ? "Branches" : "Business Details"
  );
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
  // Add this state for logo uploads (similar to tradingFilesToUpload)
  const [logosToUpload, setLogosToUpload] = useState({});
  const [signatureToUpload, setSignatureToUpload] = useState({});
  const [businessDetailsUpdateCount, setBusinessDetailsUpdateCount] =
    useState(0);
  const [contactDetailsUpdateCount, setContactDetailsUpdateCount] = useState(0);
  // State for update count
  const [financialInformationUpdateCount, setFinancialInformationUpdateCount] =
    useState(0);
  // State for update count
  const [documentsUpdateCount, setDocumentsUpdateCount] = useState(0);
  const [confirmationData, setConfirmationData] = useState({});

  var updatedCustomerData = useRef({});
  var updatedCustomerContactsData = useRef({});
  var updatedCustomerPaymentMethodsData = useRef({});
  //TODO - set it appropriately based  workflow thingy - WF
  const [inApproval, setInApproval] = useState(true);
  const [originalCustomerData, setOriginalCustomerData] = useState(null); //WF
  const [originalCustomerContactsData, setOriginalCustomerContactsData] =
    useState(null); //WF
  const [
    originalCustomerPaymentMethodsData,
    setOriginalCustomerPaymentMethodsData,
  ] = useState(null); //WF
  // var wfCustomerData = null; //WF
  const [wfCustomerData, setWfCustomerData] = useState(null); //WF
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const navigate = useNavigate();
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
        if (wfData?.customer?.nonTradingDocuments) {
          wfData.customer.nonTradingDocuments = JSON.parse(
            wfData.customer.nonTradingDocuments
          );
        }

        temp = wfData;
      } else if (workflowInstanceId) {
        fetchWorkflowDataOfCustomer(workflowInstanceId);
      }
      setCustomerData(isUnderApproval ? { ...resp, ...temp?.customer } : resp);
      setOriginalCustomerData(resp);
      const conRes = await fetchCurrentDataOfCustomerContacts(customerId);
      setCustomerContactsData(
        isUnderApproval ? { ...conRes, ...temp?.contacts } : conRes
      );
      setOriginalCustomerContactsData(conRes);
      const paymentMethodsRes = await fetchCurrentPaymentMetods(customerId);
      setCustomerPaymentMethodsData(
        isUnderApproval && temp?.methodDetails
          ? { methodDetails: temp?.methodDetails }
          : paymentMethodsRes
      );
      setOriginalCustomerPaymentMethodsData(paymentMethodsRes);
    };
    fetchData();
  }, [customerId]);

  useEffect(() => {
    const businessDetailsUpdateCount = countUpdatedFields(
      originalCustomerData,
      customerData,
      businessDetailsFields
    );
    const countAssigned = countAssignedToEntityWiseUpdates(
      originalCustomerData,
      customerData,
      assignedToEntityWiseEntities
    );
    setBusinessDetailsUpdateCount(businessDetailsUpdateCount + countAssigned);
  }, [customerData, originalCustomerData]);
  useEffect(() => {
    const countContacts = countUpdatedFields(
      originalCustomerContactsData,
      customerContactsData,
      contactDetailsFields
    );
    const countCustomer = countUpdatedFields(
      originalCustomerData,
      customerData,
      contactDetailsCustomerFields
    );
    setContactDetailsUpdateCount(countContacts + countCustomer);
  }, [
    customerContactsData,
    originalCustomerContactsData,
    customerData,
    originalCustomerData,
  ]);
  // Count updates in customerData and customerPaymentMethodsData for Financial Information tab
  useEffect(() => {
    // Count simple fields in customerData
    const countCustomer = countUpdatedFields(
      originalCustomerData,
      customerData,
      financialInfoCustomerFields
    );
    // Count pricing policy updates
    const countPricing = countPricingPolicyUpdates(
      originalCustomerData,
      customerData,
      pricingPolicyEntities
    );
    // Count payment method updates
    const countPayment = countPaymentMethodUpdates(
      originalCustomerPaymentMethodsData,
      customerPaymentMethodsData
    );
    setFinancialInformationUpdateCount(
      countCustomer + countPricing + countPayment
    );
  }, [
    customerData,
    originalCustomerData,
    customerPaymentMethodsData,
    originalCustomerPaymentMethodsData,
  ]);
  // Count updates in customerData for Documents tab
  useEffect(() => {
    const countDocs = countUpdatedDocumentFields(
      originalCustomerData,
      customerData,
      documentFields
    );
    const countNonTrading = countNonTradingDocumentsUpdates(
      originalCustomerData?.nonTradingDocuments,
      customerData?.nonTradingDocuments
    );
    setDocumentsUpdateCount(countDocs + countNonTrading);
  }, [customerData, originalCustomerData]);

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
    const allowedPaymentMethods = ["DAR", "VMCO", "NAQI", "GMTC", "SHC"];
    let paymentMethods = customerPaymentMethodsData.methodDetails.credit;
    if (allowedPaymentMethods.includes(name)) {
      paymentMethods[name].isAllowed = e.target.checked;
    }

    if (name.includes("CreditLimit")) {
      const methodName = name.replace("CreditLimit", "");
      paymentMethods[methodName].limit = value;
    }
    if (name.includes("CreditPeriod")) {
      const methodName = name.replace("CreditPeriod", "");
      paymentMethods[methodName].period = value;
    }
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
  };

  const setGeoLocation = (location) => {
    updatedCustomerData.current.geolocation = location;
    setCustomerData((prev) => ({ ...prev, geolocation: location }));
    console.log("^^^^^^^^", customerData);
  };

  const setEntityWiseAssignment = (e) => {
    const { name, value } = e.target;
    updatedCustomerData.current["assignedToEntityWise"] =
      customerData.assignedToEntityWise;
    updatedCustomerData.current.assignedToEntityWise[name] = value;
    setCustomerData((prev) => ({
      ...prev,
      assignedToEntityWise: {
        ...prev.assignedToEntityWise,
        [name]: value,
      },
    }));
  };
  const setEntityWisePricePlan = (e) => {
    const { name, value } = e.target;
    updatedCustomerData.current["pricingPolicy"] = customerData.pricingPolicy;
    updatedCustomerData.current.pricingPolicy[name] = value;
    setCustomerData((prev) => ({
      ...prev,
      pricingPolicy: {
        ...prev.pricingPolicy,
        [name]: value,
      },
    }));
  };
  const setBusinessHeadSameAsPrimary = (isSame) => {
    updatedCustomerContactsData.current.businessHeadName =
      customerContactsData.primaryContactName;
    updatedCustomerContactsData.current.businessHeadEmail =
      customerContactsData.primaryContactEmail;
    updatedCustomerContactsData.current.businessHeadMobile =
      customerContactsData.primaryContactMobile;
    updatedCustomerContactsData.current.businessHeadDesignation =
      customerContactsData.primaryContactDesignation;
    setCustomerContactsData((prev) => ({
      ...prev,
      businessHeadName: customerContactsData.primaryContactName,
      businessHeadEmail: customerContactsData.primaryContactEmail,
      businessHeadMobile: customerContactsData.primaryContactMobile,
      businessHeadDesignation: customerContactsData.primaryContactDesignation,
    }));
  };
  const setInterCompany = (e) => {
    const { name } = e.target;
    const value = e.target.checked;
    updatedCustomerData.current["interCompany"] = value;
    setCustomerData((prev) => ({
      ...prev,
      interCompany: value,
    }));
  };
  const setIsDeliveryChargesApplicable = (e) => {
    const { name } = e.target;
    const value = e.target.checked;
    updatedCustomerData.current["isDeliveryChargesApplicable"] = value;
    setCustomerData((prev) => ({
      ...prev,
      isDeliveryChargesApplicable: value,
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
    // "typeOfBusinessOther",
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
    // "crCertificate",
    // "vatCertificate",
    // "nationalId",
    // "bankLetter",
    // "nationalAddress",
    // "customerSource",
    // "acknowledgementSignature",
    // "contractAgreement",
    // "customerContract",
    // "creditApplication",
    "declarationName",
    "declarationSignature",
    // "declarationDate",
    "pricingPolicy",
    // "customerStatus",
    // "isDeliveryChargesApplicable",
    // "isBlocked",
    // "assignedTo",
    // "assignedToEntityWise",
    // "nonTradingDocuments",
    // "interCompany",
    // "entity",
    "zone",
    "primaryContactName",
    "primaryContactEmail",
    "primaryContactMobile",
    "primaryContactDesignation",
    "businessHeadName",
    "businessHeadEmail",
    "businessHeadMobile",
    "businessHeadDesignation",
    "financeHeadName",
    "financeHeadEmail",
    "financeHeadMobile",
    "financeHeadDesignation",
    "purchasingHeadName",
    "purchasingHeadEmail",
    "purchasingHeadMobile",
    "purchasingHeadDesignation",
  ];

  const mandatoryFieldsForApproval = [
    "companyNameEn",
    "companyNameAr",
    "companyType",
    "crNumber",
    "vatNumber",
    "baladeahLicenseNumber",
    "governmentRegistrationNumber",
    "typeOfBusiness",
    // "typeOfBusinessOther",
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
    // "crCertificate",
    // "vatCertificate",
    // "nationalId",
    // "bankLetter",
    // "nationalAddress",
    // "customerSource",
    // "acknowledgementSignature",
    // "contractAgreement",
    // "customerContract",
    // "creditApplication",
    "declarationName",
    "declarationSignature",
    // "declarationDate",
    "pricingPolicy",
    // "customerStatus",
    // "isDeliveryChargesApplicable",
    // "isBlocked",
    "assignedTo",
    "assignedToEntityWise",
    // "nonTradingDocuments",
    // "interCompany",
    // "entity",
    "zone",
    "primaryContactName",
    "primaryContactEmail",
    "primaryContactMobile",
    "primaryContactDesignation",
    "businessHeadName",
    "businessHeadEmail",
    "businessHeadMobile",
    "businessHeadDesignation",
    "financeHeadName",
    "financeHeadEmail",
    "financeHeadMobile",
    "financeHeadDesignation",
    "purchasingHeadName",
    "purchasingHeadEmail",
    "purchasingHeadMobile",
    "purchasingHeadDesignation",
  ];

  const isArabicText = (text) => {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
  };
  const validateData = async (
    dataToValidate,
    mandatoryCheckRequired = false,
    mandatoryFields = mandatoryFields
  ) => {
    const errors = {};
    const arabicList = ["companyNameAr", "brandNameAr"];
    const tradingDocumentList = [
      "acknowledgementSignature",
      "crCertificate",
      "vatCertificate",
      "nationalId",
      "bankLetter",
      "nationalAddress",
      "contractAgreement",
      "creditApplication",
    ];
    const nonTradingDocumentList = [
      "acknowledgementSignature",
      "customerContract",
      "creditApplication",
    ];
    const documentList =
      customerData?.companyType === "trading"
        ? tradingDocumentList
        : nonTradingDocumentList;
    const uniqueFieldsList = [
      "crNumber",
      "vatNumber",
      "baladeahLicenseNumber",
      "governmentRegistrationNumber",
      "bankAccountNumber",
    ];
    // If mandatoryCheckReguired is true, check all mandatory fields
    console.log("check mandtaory fields has assigned to entity wise", mandatoryFields.includes("assignedToEntityWise"));
    if (mandatoryCheckRequired) {
      mandatoryFields?.forEach((field) => {
        if (field === "assignedToEntityWise") {
          // Skip here, handle below
          return;
        }
        if (field in dataToValidate && !dataToValidate[field]) {
          if (documentList.includes(field)) {
            errors[field] = t("This document is required.");
          } else {
            errors[field] = t("This field is required.");
          }
        }
      });

      // Special check for assignedToEntityWise
      if (mandatoryFields.includes("assignedToEntityWise") &&
        dataToValidate.assignedToEntityWise &&
        typeof dataToValidate.assignedToEntityWise === "object"
      ) {
        assignedToEntityWiseEntities.forEach((entity) => {
          if (
            !dataToValidate.assignedToEntityWise[entity] ||
            dataToValidate.assignedToEntityWise[entity] === ""
          ) {
            // Set error for each missing entity assignment
            errors[`assignedToEntityWise.${entity}`] = t(
              `Sales person for ${entity} is required.`
            );
          }
        });
      } else if (mandatoryFields.includes("assignedToEntityWise")) {
        // If the whole object is missing
        assignedToEntityWiseEntities.forEach((entity) => {
          errors[`assignedToEntityWise.${entity}`] = t(
            `Sales person for ${entity} is required.`
          );
        });
      }
    }
    for (const field in dataToValidate) {
      const value = dataToValidate[field];
      if (arabicList.includes(field) && value && !isArabicText(value)) {
        errors[field] = t("Please enter Arabic text.");
      }

      if (field.toLowerCase().includes("email")) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          errors[field] = t("Invalid email format");
        }
      }

      if (
        field.toLowerCase().includes("mobile") ||
        field.toLowerCase().includes("phone")
      ) {
        const saudiMobileRegex = /^(00966|966|\+966|0)?5\d{8}$/;
        if (value && !saudiMobileRegex.test(value)) {
          errors[field] = t(
            "Invalid format! 05XXXXXXXX or 9665XXXXXXXX accepted"
          );
        }
      }

      if (field.toLowerCase().includes("iban")) {
        const saudiIbanRegex = /^SA\d{22}$/;
        if (value && !saudiIbanRegex.test(value)) {
          errors[field] = t("Invalid format! SAXXXXXXXXXXXXXX accepted");
        }
      }

      if (field.toLowerCase().includes("bankaccountnumber")) {
        const saudiBankAccountRegex = /^\d{15,20}$/;
        if (value && !saudiBankAccountRegex.test(value)) {
          errors[field] = t("Invalid format! 15 to 20 digits accepted");
        }
      }

      if (field.toLowerCase().includes("baladeahlicensenumber")) {
        const baladeahLicenseRegex = /^\d{9,10}$/;
        if (value && !baladeahLicenseRegex.test(value)) {
          errors[field] = t("Invalid format! 9 to 10 digits accepted");
        }
      }

      if (field.toLowerCase().includes("vatnumber")) {
        const saudiVatRegex = /^\d{15}$/;
        if (value && !saudiVatRegex.test(value)) {
          errors[field] = t("Invalid format! 15 digits required");
        }
      }

      if (field.toLowerCase().includes("crnumber")) {
        const crNumberRegex = /^[1-9]\d{9}$/;
        if (value && !crNumberRegex.test(value)) {
          errors[field] = t("Invalid format! 10 digits required");
        }
      }
      if (field.toLowerCase().includes("governmentregistrationnumber")) {
        const govRegNumberRegex = /^[1-9]\d{8,9}$/;
        if (value && !govRegNumberRegex.test(value)) {
          errors[field] = t("Invalid format! 8 to 9 digits accepted");
        }
      }

      if (field.toLowerCase().includes("pincode")) {
        const saudiPincodeRegex = /^\d{5}$/;
        if (value && !saudiPincodeRegex.test(value)) {
          errors[field] = t("Invalid format! 5 digits required");
        }
      }
      if (
        field.toLowerCase().includes("financeheademail") ||
        field.toLowerCase().includes("purchasingheademail")
      ) {
        for (const f in dataToValidate) {
          if (
            f.toLowerCase().includes("email") &&
            f !== field &&
            dataToValidate[f] === value
          ) {
            errors[field] = t("This email is already used.");
            break;
          }
        }
        for (const f in customerContactsData) {
          if (
            f.toLowerCase().includes("email") &&
            f !== field &&
            customerContactsData[f] === value
          ) {
            errors[field] = t("This email is already used.");
            break;
          }
        }
      }
      if (
        field.toLowerCase().includes("financeheadmobile") ||
        field.toLowerCase().includes("purchasingheadmobile")
      ) {
        for (const f in dataToValidate) {
          if (
            f.toLowerCase().includes("mobile") &&
            f !== field &&
            dataToValidate[f] === value
          ) {
            errors[field] = t("This mobile number is already used.");
            break;
          }
        }
        for (const f in customerContactsData) {
          if (
            f.toLowerCase().includes("mobile") &&
            f !== field &&
            customerContactsData[f] === value
          ) {
            errors[field] = t("This mobile number is already used.");
            break;
          }
        }
      }
      if (uniqueFieldsList.includes(field)) {
        const res = await fetch(`${API_BASE_URL}/customers/checkUniqueField`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ customerId, field, value }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data.isUnique) {
            // Field is valid
          } else {
            errors[field] = t("This number is registered.");
          }
        }
      }
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
  const uploadDocuments = async (
    tradingFilesToUpload,
    nonTradingFilesToUpload,
    logosToUpload,
    signatureToUpload // <-- Add this param
  ) => {
    const uploadedFiles = {};
    try {
      // Trading files
      for (const fieldName of Object.keys(tradingFilesToUpload)) {
        const file = tradingFilesToUpload[fieldName];
        const uploadedFile = await uploadFile(fieldName, file, customerId);
        if (uploadedFile && uploadedFile.fileName) {
          uploadedFiles[fieldName] = uploadedFile.fileName;
          delete tradingFilesToUpload[fieldName];
        }
      }
      // Non-trading files
      for (const fieldName of Object.keys(nonTradingFilesToUpload)) {
        const file = nonTradingFilesToUpload[fieldName];
        if (fieldName !== "others") {
          uploadFile(fieldName, file, customerId);
        } else if (Array.isArray(file)) {
          uploadedFiles["nonTradingDocuments"] = [
            ...(customerData?.nonTradingDocuments || []),
          ];
          for (const f of file) {
            const uploadedFile = await uploadFile(
              "nonTradingDocuments",
              f,
              customerId
            );
            if (uploadedFile && uploadedFile.fileName) {
              uploadedFiles["nonTradingDocuments"].push(uploadedFile.fileName);
              // const index = nonTradingFilesToUpload["others"].indexOf(f);
              // if (index > -1) {
              //   nonTradingFilesToUpload["others"].splice(index, 1);
              // }
              nonTradingFilesToUpload["others"] = nonTradingFilesToUpload[
                "others"
              ].filter((file) => file !== f);
            }
          }
        }
      }
      // --- Handle logo uploads ---
      for (const logoField of ["companyLogo", "brandLogo"]) {
        if (logosToUpload[logoField]) {
          const uploadedLogo = await uploadFile(
            logoField,
            logosToUpload[logoField],
            customerId
          );
          if (uploadedLogo && uploadedLogo.fileName) {
            uploadedFiles[logoField] = uploadedLogo.fileName;
            // Remove from upload queue
            setLogosToUpload((prev) => {
              const copy = { ...prev };
              delete copy[logoField];
              return copy;
            });
          }
        }
      }

      // --- Handle signature upload ---
      if (signatureToUpload.declarationSignature) {
        const uploadedSignature = await uploadFile(
          "declarationSignature",
          signatureToUpload.declarationSignature,
          customerId
        );
        if (uploadedSignature && uploadedSignature.fileName) {
          uploadedFiles["declarationSignature"] = uploadedSignature.fileName;
          // Remove from upload queue
          setSignatureToUpload((prev) => {
            const copy = { ...prev };
            delete copy.declarationSignature;
            return copy;
          });
        }
      }

      if (uploadedFiles?.["nonTradingDocuments"])
        uploadedFiles["nonTradingDocuments"] = JSON.stringify(
          uploadedFiles["nonTradingDocuments"]
        );

      return uploadedFiles;
    } catch (error) {
      console.error("Error uploading files:", error.message);
    }
  };
  const handleSave = async (action) => {
    console.log("^^^^^Saving customer data:", updatedCustomerData.current);
    console.log(nonTradingFilesToUpload);
    // if(action === "submit") {
    //   customerData["declarationDate"] = new Date().toISOString();
    // }
    try {
      const uploadedFiles = await uploadDocuments(
        tradingFilesToUpload,
        nonTradingFilesToUpload,
        logosToUpload,
        signatureToUpload // <-- pass here
      );
      updatedCustomerData.current = {
        ...updatedCustomerData.current,
        ...uploadedFiles,
      };
      setCustomerData((prev) => ({
        ...prev,
        ...updatedCustomerData.current,
        ...uploadedFiles,
      }));
      updatedCustomerData.current["customerStatus"] =
        customerData.customerStatus;
      const errors = await validateData(
        {
          ...updatedCustomerData.current,
          ...updatedCustomerContactsData.current,
        },
        false,
        []
      );
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) {
        // Handle errors (e.g., show error messages)
        if (action !== "submit") {
          Swal.fire({
            icon: "error",
            title: t("Error"),
            text: t("Please fix the errors before saving."),
            confirmButtonText: t("OK"),
          });
          // alert("Please fix the errors before saving.");
        }
        return;
      }
      const response = await fetch(
        `${API_BASE_URL}/customers/id/${customerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: updatedCustomerData.current,
            contacts: {},
          }),
          credentials: "include",
        }
      );
      if (response.ok) {
        const result = await response.json();
        setCustomerData(result.data);
        setOriginalCustomerData(result.data);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t(`Error updating customer data. ${error.message}`),
        confirmButtonText: t("OK"),
      });
      // alert("Error updating customer data:", error.message);
      console.error("Error updating customer:", error.message);
      return false;
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
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t(`Error updating customer data. ${error.message}`),
        confirmButtonText: t("OK"),
      });
      // alert("Error updating customer data:", error.message);
      console.error("Error updating customer:", error.message);
      return false;
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
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t(`Error updating customer data. ${error.message}`),
        confirmButtonText: t("OK"),
      });
      // alert("Error updating customer data:", error.message);
      console.error("Error updating customer payment methods:", error.message);
      return false;
    }
    Swal.fire({
      icon: "success",
      title: t("Success"),
      text: t("Customer data saved successfully."),
      confirmButtonText: t("OK"),
    });
    // alert("Customer data saved successfully.");
    return true;
  };

  const handleSaveChanges = async (action) => {
    console.log("^^^^^Saving customer data:", updatedCustomerData.current);
    console.log(nonTradingFilesToUpload);

    try {
      updatedCustomerData.current["customerStatus"] =
        customerData.customerStatus;
      const uploadedFiles = await uploadDocuments(
        tradingFilesToUpload,
        nonTradingFilesToUpload,
        logosToUpload,
        signatureToUpload // <-- pass here
      );
      updatedCustomerData.current = {
        ...updatedCustomerData.current,
        ...uploadedFiles,
      };
      const errors = await validateData(
        { ...customerData, ...customerContactsData },
        true,
        mandatoryFields
      );
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) {
        // Handle errors (e.g., show error messages)
        Swal.fire({
          icon: "error",
          title: t("Error"),
          text: t("Please fix the errors before saving."),
          confirmButtonText: t("OK"),
        });
        // alert("Please fix the errors before saving.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/customers/id/${customerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: updatedCustomerData.current,
            contacts: updatedCustomerContactsData.current,
          }),
          credentials: "include",
        }
      );
      console.log("Response", response);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t(`Error updating customer data. ${error.message}`),
        confirmButtonText: t("OK"),
      });
      // alert("Error updating customer data:", error.message);
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
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t(`Error updating customer data. ${error.message}`),
        confirmButtonText: t("OK"),
      });
      // alert("Error updating customer data:", error.message);
      console.error("Error updating customer payment methods:", error.message);
    }
    Swal.fire({
      icon: "success",
      title: t("Success"),
      text: t("Customer data saved successfully."),
      confirmButtonText: t("OK"),
    }).then(() => {
      window.location.reload();
    });
    // alert("Customer data saved successfully.");
    // window.location.reload();
  };

  const handleApprovalClick = (action) => {
    setApprovalAction(action);
    setIsApprovalDialogOpen(true);
  };

  const handleApprovalDialogSubmit = async (comment) => {
    try {
      if (wfCustomerData?.customer?.nonTradingDocuments) {
        wfCustomerData.customer.nonTradingDocuments = JSON.stringify(
          wfCustomerData.customer.nonTradingDocuments
        );
      }
      if (customerData?.nonTradingDocuments) {
        wfCustomerData.customer.nonTradingDocuments = JSON.stringify(
          customerData.nonTradingDocuments
        );
      }
      const mergedData = {
        updates: {
          ...wfCustomerData,
          ...updatedCustomerPaymentMethodsData.current,
          customer: {
            ...wfCustomerData?.customer,
            ...updatedCustomerData.current,
          },
          contacts: {
            ...wfCustomerData?.contacts,
            ...updatedCustomerContactsData.current,
          },
        },
        id: customerId,
      };
      var dataToBeValidated = {};
      if(customerData?.customerStatus === "pending") {
        dataToBeValidated = {...customerData,...customerContactsData}
      }
      else {
        dataToBeValidated = {
          ...mergedData?.updates?.customer,
          ...mergedData?.updates?.contacts,
        };
      }
      console.log("Data to be validated:", dataToBeValidated);
      const errors = await validateData(
        dataToBeValidated,
        true,
        mandatoryFieldsForApproval
      );
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) {
        Swal.fire({
          icon: "error",
          title: t("Error"),
          text: t("Please fix the errors before saving."),
          confirmButtonText: t("OK"),
        });
        // alert("Please fix the errors before saving.");
        return;
      }
      const response = await fetch(
        `${API_BASE_URL}/workflow-instance/id/${workflowInstanceId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approvedStatus:
              approvalAction === "approve" ? "approved" : "rejected",
            comment,
            workflowData: mergedData,
          }),
          credentials: "include",
        }
      );
      console.log("Response", response);
      setIsApprovalDialogOpen(false);
      navigate("/customers");
    } catch (error) {
      console.error("Error approving/rejecting customer:", error.message);
      setIsApprovalDialogOpen(false);
    }
  };

  const handleApprove = async (action) => {
    try {
      if (wfCustomerData?.customer?.nonTradingDocuments) {
        wfCustomerData.customer.nonTradingDocuments = JSON.stringify(
          wfCustomerData.customer.nonTradingDocuments
        );
      }
      if (customerData?.nonTradingDocuments) {
        wfCustomerData.customer.nonTradingDocuments = JSON.stringify(
          customerData.nonTradingDocuments
        );
      }
      const mergedData = {
        updates: {
          ...wfCustomerData,
          customer: { ...updatedCustomerData.current },
          contacts: { ...updatedCustomerContactsData.current },
        },
        id: customerId,
      };

      const errors = await validateData(
        { ...mergedData?.updates?.customer, ...mergedData?.updates?.contacts },
        true,
        mandatoryFieldsForApproval
      );
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) {
        // Handle errors (e.g., show error messages)
        Swal.fire({
          icon: "error",
          title: t("Error"),
          text: t("Please fix the errors before saving."),
          confirmButtonText: t("OK"),
        });
        // alert("Please fix the errors before saving.");
        return;
      }
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
      if (wfCustomerData?.customer?.nonTradingDocuments) {
        wfCustomerData.customer.nonTradingDocuments = JSON.stringify(
          wfCustomerData.customer.nonTradingDocuments
        );
      }
      if (customerData?.nonTradingDocuments) {
        wfCustomerData.customer.nonTradingDocuments = JSON.stringify(
          customerData.nonTradingDocuments
        );
      }
      const mergedData = {
        updates: {
          ...wfCustomerData,
          customer: { ...updatedCustomerData.current },
          contacts: { ...updatedCustomerContactsData.current },
        },
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
      customerData["declarationDate"] = new Date().toISOString();
      updatedCustomerData.current = {
        ...updatedCustomerData.current,
        declarationDate: customerData.declarationDate,
      };
      const saved = await handleSave("submit");
      const errors = await validateData(
        {
          ...customerData,
          ...customerContactsData,
          ...updatedCustomerData.current,
          ...updatedCustomerContactsData.current,
        },
        true,
        mandatoryFields
      );
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) {
        // Handle errors (e.g., show error messages)
        Swal.fire({
          icon: "error",
          title: t("Error"),
          text: t("Please fix the errors before saving."),
          confirmButtonText: t("OK"),
        });
        // alert("Please fix the errors before submitting.");
        return;
      }
      customerData["customerStatus"] = "pending";

      const response = await fetch(
        `${API_BASE_URL}/customers/id/${customerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: { customerStatus: customerData.customerStatus },
            contacts: {},
          }),
          credentials: "include",
        }
      );
      console.log("Response", response);
      function showLoadingScreen(message) {
        document.body.innerHTML = `
    <div class="loading-more-container" style="
      padding: 20px; 
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 16px;
    ">
      <div class="loading-spinner" style="
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
      <div class="loading-more-text">${message}</div>
    </div>
    
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
      }

      // Usage:
      showLoadingScreen("Updating...");
      setTimeout(() => window.location.reload(true), 3000);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t(`Error updating customer data. ${error.message}`),
        confirmButtonText: t("OK"),
      });
      // alert("Error updating customer data:", error.message);
      console.error("Error updating customer:", error.message);
    }
  };

  const handleBlock = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/customers/id/${customerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: { customerStatus: "blocked", isBlocked: true },
            contacts: {},
          }),
          credentials: "include",
        }
      );
      console.log("Response", response);
      window.location.reload();
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
            customer: {
              customerStatus: "approved",
              isBlocked: false,
            },
            contacts: {},
          }),
          credentials: "include",
        }
      );
      console.log("Response", response);
      window.location.reload();
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

                {isV("businessDetailsTab") && (
                  <div
                    key={"Business Details"}
                    className={`tab ${
                      activeTab === "Business Details" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("Business Details")}
                  >
                    {t("Business Details")}
                    {businessDetailsUpdateCount > 0 && mode === "edit" && (
                      <span className="update-badge" style={{ marginLeft: 8 }}>
                        {businessDetailsUpdateCount}
                      </span>
                    )}
                  </div>
                )}

                {isV("contactDetailsTab") && (
                  <div
                    key={"Contact Details"}
                    className={`tab ${
                      activeTab === "Contact Details" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("Contact Details")}
                  >
                    {t("Contact Details")}
                    {contactDetailsUpdateCount > 0 && mode === "edit" && (
                      <span className="update-badge" style={{ marginLeft: 8 }}>
                        {contactDetailsUpdateCount}
                      </span>
                    )}
                  </div>
                )}

                {isV("financialInformationTab") && (
                  <div
                    key={"Financial Information"}
                    className={`tab ${
                      activeTab === "Financial Information" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("Financial Information")}
                  >
                    {t("Financial Information")}
                    {financialInformationUpdateCount > 0 && mode === "edit" && (
                      <span className="update-badge" style={{ marginLeft: 8 }}>
                        {financialInformationUpdateCount}
                      </span>
                    )}
                  </div>
                )}

                {isV("documentsTab") && (
                  <div
                    key={"Documents"}
                    className={`tab ${
                      activeTab === "Documents" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("Documents")}
                  >
                    {t("Documents")}
                    {documentsUpdateCount > 0 && mode === "edit" && (
                      <span className="update-badge" style={{ marginLeft: 8 }}>
                        {documentsUpdateCount}
                      </span>
                    )}
                  </div>
                )}

                {(isV("finalSubmissionTab") || (customerData?.customerStatus === "new" || customerData?.customerStatus === "pending")) && (
                  <div
                    key={"Final Submission"}
                    className={`tab ${
                      activeTab === "Final Submission" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("Final Submission")}
                  >
                    {t("Final Submission")}
                  </div>
                )}

                {isV("productsTab") &&
                  customerData?.customerStatus !== "new" && (
                    <div
                      key={"Products"}
                      className={`tab ${
                        activeTab === "Products" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("Products")}
                    >
                      {t("Products")}
                    </div>
                  )}

                {isV("branchesTab") &&
                  customerData?.customerStatus !== "new" && (
                    <div
                      key={"Branches"}
                      className={`tab ${
                        activeTab === "Branches" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("Branches")}
                    >
                      {t("Branches")}
                    </div>
                  )}
                
              </div>

              {activeTab === "Business Details" &&
                isV("businessDetailsTab") && (
                  <BusinessDetails
                    customerData={customerData}
                    originalCustomerData={originalCustomerData}
                    onChangeCustomerData={handleCustomerDataChange}
                    setEntityWiseAssignment={setEntityWiseAssignment}
                    mode={mode}
                    setTabsHeight={setTabsHeight}
                    setInterCompany={setInterCompany}
                    formErrors={formErrors}
                    logosToUpload={logosToUpload} // <-- pass to BusinessDetails
                  />
                )}
              {activeTab === "Contact Details" && isV("contactDetailsTab") && (
                <ContactDetails
                  customerData={customerData}
                  originalCustomerData={originalCustomerData}
                  customerContactsData={customerContactsData}
                  originalCustomerContactsData={originalCustomerContactsData}
                  onChangeCustomerData={handleCustomerDataChange}
                  onChangeCustomerContactsData={
                    handleCustomerContactsDataChange
                  }
                  setGeoLocation={setGeoLocation}
                  setBusinessHeadSameAsPrimary={setBusinessHeadSameAsPrimary}
                  mode={mode}
                  setTabsHeight={setTabsHeight}
                  formErrors={formErrors}
                />
              )}
              {activeTab === "Financial Information" &&
                isV("financialInformationTab") && (
                  <FinancialInformation
                    customerData={customerData}
                    originalCustomerData={originalCustomerData}
                    customerPaymentMethodsData={customerPaymentMethodsData}
                    originalCustomerPaymentMethodsData={
                      originalCustomerPaymentMethodsData
                    }
                    onChangeCustomerData={handleCustomerDataChange}
                    onChangeCustomerPaymentMethodsData={
                      handleCustomerPaymentMethodsDataChange
                    }
                    setEntityWisePricePlan={setEntityWisePricePlan}
                    setCustomerCreditChange={handleCustomerCreditChange}
                    setIsDeliveryChargesApplicable={
                      setIsDeliveryChargesApplicable
                    }
                    mode={mode}
                    setTabsHeight={setTabsHeight}
                    formErrors={formErrors}
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
                  formErrors={formErrors}
                />
              )}
              {activeTab === "Branches" && isV("branchesTab") && (
                <CustomerBranches
                  customer={{
                    ...customerData,
                    ...customerContactsData,
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
                  customerId={customerId}
                  customer={customerData}
                  setTabsHeight={setTabsHeight}
                />
              )}
              {activeTab === "Final Submission" && (
                <FinalSubmissionConfirmation
                  customerData={customerData}
                  originalCustomerData={originalCustomerData}
                  onChangeCustomerData={handleCustomerDataChange}
                  formErrors={formErrors}
                  mode={mode}
                  signatureToUpload={signatureToUpload}
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
              "Final Submission",
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
                        (mode === "add" && inApproval) ||
                        customerData?.isBlocked
                      }
                    >
                      {t("Save Changes")}
                    </button>
                  )}
                {isV("btnApprove") && inApproval && (
                  <button
                    className="approve"
                    onClick={() => handleApprovalClick("approve")}
                    disabled={false}
                  >
                    {t("Approve")}
                  </button>
                )}
                {isV("btnReject") && inApproval && (
                  <button
                    className="reject"
                    onClick={() => handleApprovalClick("reject")}
                    disabled={false}
                  >
                    {t("Reject")}
                  </button>
                )}
                {isV("btnBlock") && !customerData?.isBlocked && (
                  <button
                    className="block"
                    onClick={() => handleBlock()}
                    disabled={mode === "add" && inApproval}
                  >
                    {t("Block")}
                  </button>
                )}
                {isV("btnUnblock") && customerData?.isBlocked && (
                  <button
                    className="unblock"
                    onClick={() => handleUnblock()}
                    disabled={mode === "add" && inApproval}
                  >
                    {t("Unblock")}
                  </button>
                )}
              </div>
            )}
          </div>
          {mode === "edit" && (
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
      <ApprovalDialog
        isOpen={isApprovalDialogOpen}
        onClose={() => setIsApprovalDialogOpen(false)}
        action={approvalAction}
        onSubmit={handleApprovalDialogSubmit}
        customerName={customerData?.customerName || "this customer"}
        title={
          approvalAction === "approve"
            ? t("Approve Customer")
            : t("Reject Customer")
        }
        subtitle={
          approvalAction === "approve"
            ? t("Are you sure you want to approve this customer?")
            : t("Are you sure you want to reject this customer?")
        }
      />
    </Sidebar>
  );
}

export default CustomerDetails;
