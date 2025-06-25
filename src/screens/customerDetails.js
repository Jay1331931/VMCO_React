import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/forms.css";
import CommentPopup from "../components/commentPanel";
import "../i18n";
import { useTranslation } from "react-i18next";
import { getBusinessDetailsForm, getBusinessDetailsFormData } from "./customerDetailsForms/customerBusinessDetails";
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
import { faXmark, faLocationDot, faDownload, faEye } from "@fortawesome/free-solid-svg-icons";
import maplibregl from "maplibre-gl";
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

  const responseContacts = await fetch(`${API_BASE_URL}/customer-contacts/${customerId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  const contactsDataJson = await responseContacts.json();
  console.log(contactsDataJson);
  if (contactsDataJson.status === "Ok") {
    contactsData = contactsDataJson.data;
    console.log("Current customer contacts data:", contactsDataJson.data);
    return contactsData;
  } else {
    throw new Error(contactsData.data?.message || "Failed to fetch customer contacts");
  }
};

const fetchCurrentPaymentMetods = async (customerId) => {
  let paymentMethodsData = {};
  const responsePaymentMethods = await fetch(`${API_BASE_URL}/payment-method/id/${customerId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  const paymentMethodsDataJson = await responsePaymentMethods.json();
  if (paymentMethodsDataJson.status === "Ok") {
    paymentMethodsData = paymentMethodsDataJson.data;
    console.log("Current customer payment methods data:", paymentMethodsDataJson.data);
    return paymentMethodsDataJson.data;
  } else {
    throw new Error(paymentMethodsData.data?.message || "Failed to fetch customer payment methods");
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
const fetchWorkflowDataOfCustomer = async (workflowId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/workflow-instance/id/${workflowId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const workflowDataJson = await response.json();
    console.log("Workflow Data JSON~~~~~~~~~~~~~", workflowDataJson);
    return workflowDataJson?.data?.workflowData?.updates;
  } catch (error) {
    console.error("Error fetching workflow data:", error);
    throw error;
  }
};

const checkInApproval = async (customerId) => {
  let isAppMode = false;
  try {
    const response = await fetch(`${API_BASE_URL}/workflow-instance/check/id`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: customerId, module: "customer" }),
      credentials: "include",
    });
    if (response.ok) {
        const responseText = await response.text(); // Get raw response text ('t' or 'f')
        console.log(responseText);
        const data = responseText ? JSON.parse(responseText) : {};
        isAppMode = data?.exists === "t"; // Convert to boolean
        return isAppMode;
      }} catch (err) {
      console.error("Error fetching workflow instance:", err);
    }
};

function CustomerDetails() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("Business Details");
  const [tabsHeight, setTabsHeight] = useState("auto");
  const tabs = useMemo(() => {
    return ["Business Details", "Contact Details", "Financial Information", "Documents", "Products", "Branches"];
  }, []);
  const [customerData, setCustomerData] = useState({});
  const [customerContactsData, setCustomerContactsData] = useState({});
  const [customerPaymentMethodsData, setCustomerPaymentMethodsData] = useState({});
  const [tradingFilesToUpload, setTradingFilesToUpload] = useState([]);
  const [nonTradingFilesToUpload, setNonTradingFilesToUpload] = useState([]);
  var updatedCustomerData = useRef({});
  var updatedCustomerContactsData = useRef({});
  var updatedCustomerPaymentMethodsData = useRef({});
  //TODO - set it appropriately based  workflow thingy - WF
  const [inApproval, setInApproval] = useState(true);
  const [originalCustomerData, setOriginalCustomerData] = useState(null); //WF
  const [originalCustomerContactsData, setOriginalCustomerContactsData] = useState(null); //WF
  // var wfCustomerData = null; //WF
  const [wfCustomerData, setWfCustomerData] = useState(null); //WF
  const { token, user, isAuthenticated, logout, loading } = useAuth();
  const location = useLocation();
  const customerId = location?.state?.customerId;
  const workflowId = location?.state?.workflowId;
  const mode = location?.state?.mode;
const rbacMgr = new RbacManager(
    user?.userType == "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    mode === "add" || customerData?.customerStatus === "new" ? "custDetailsAdd" : "custDetailsEdit",
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);
  useEffect(() => {
    const fetchData = async () => {
      const resp = await fetchCurrentDataOfCustomer(customerId);
      const customerContacts = await fetchCurrentDataOfCustomerContacts(customerId);
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
        const wfData = await fetchWorkflowDataOfCustomer(workflowId);
        setWfCustomerData(wfData);
        temp = { ...resp, ...wfData };
      }
      setCustomerData(isUnderApproval ? temp : resp);
      const conRes = await fetchCurrentDataOfCustomerContacts(customerId);
      setCustomerContactsData(conRes);
      const paymentMethodsRes = await fetchCurrentPaymentMetods(customerId);
      setCustomerPaymentMethodsData(paymentMethodsRes);
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
    const allowedPaymentMethods = ["prePayment", "partialPayment", "COD", "credit"];
    let paymentMethods = customerPaymentMethodsData.methodDetails;

    if (allowedPaymentMethods.includes(name)) {
      paymentMethods[name].isAllowed = e.target.checked;
    }

    if (name === "creditLimit") {
      paymentMethods["credit"].limit = value;
    }
    if (name === "creditPeriod") {
      paymentMethods["credit"].period = value;
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

    console.log("Updated payment methods data:", updatedCustomerPaymentMethodsData.current);
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
    } catch (error) {
      console.error("Error uploading files:", error.message);
    }
  };
  const uploadDocuments = (tradingFilesToUpload, nonTradingFilesToUpload) => {
    try {
      tradingFilesToUpload?.map((fieldName, file) => {
        uploadFile(fieldName, file, customerId);
      });
      Object.entries(nonTradingFilesToUpload || {}).forEach(([fieldName, file]) => {
        if (fieldName !== "others") {
          uploadFile(fieldName, file, customerId);
        } else if (Array.isArray(file)) {
          file.forEach((f) => {
            uploadFile("nonTradingDocuments", f, customerId);
          });
        }
      });
    } catch (error) {
      console.error("Error uploading files:", error.message);
    }
  };
  const handleSave = async (action) => {
    console.log("^^^^^Saving customer data:", updatedCustomerData.current);
    console.log(nonTradingFilesToUpload);

    try {
      uploadDocuments(tradingFilesToUpload, nonTradingFilesToUpload);
      updatedCustomerData.current["customerStatus"] = customerData.customerStatus;

      const response = await fetch(`${API_BASE_URL}/customers/id/${customerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCustomerData.current),
        credentials: "include",
      });
      console.log("Response", response);
    } catch (error) {
      console.error("Error updating customer:", error.message);
    }

    try {
      //TODO:Merge workflow data with updatedcustomerData.current if inApproval is true and save. This could happen only during
      //  approval the data is changed
      // updatedCustomerData.current["customerStatus"] = customerData.customerStatus;

      const response = await fetch(`${API_BASE_URL}/customer-contacts/${customerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCustomerContactsData.current),
        credentials: "include",
      });
      console.log("Response", response);
    } catch (error) {
      console.error("Error updating customer:", error.message);
    }

    try {
      // updatedCustomerPaymentMethodsData.current["customerStatus"] = customerData.customerStatus;

      const response = await fetch(`${API_BASE_URL}/payment-method/id/${customerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCustomerPaymentMethodsData.current),
        credentials: "include",
      });
      console.log("Response", response);
    } catch (error) {
      console.error("Error updating customer payment methods:", error.message);
    }
  };

  const handleApprove = async(action) => {
    try {
      
      const mergedData = { updates: {...wfCustomerData, ...updatedCustomerData.current}, id: customerId };
      const response = await fetch(
        `${API_BASE_URL}/workflow-instance/id/${workflowId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approvedStatus: "approved", comment: "comment", workflowData: mergedData }),
          credentials: "include",
        }
      );
      console.log("Response", response);
    } catch (error) {
      console.error("Error approving customer:", error.message);
    }
  }

  const handleReject = async(action) => {
    try {
      
      const mergedData = { updates: {...wfCustomerData, ...updatedCustomerData.current}, id: customerId };
      const response = await fetch(
        `${API_BASE_URL}/workflow-instance/id/${workflowId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approvedStatus: "rejected", comment: "comment", workflowData: mergedData }),
          credentials: "include",
        }
      );
      console.log("Response", response);
    } catch (error) {
      console.error("Error approving customer:", error.message);
    }
  }

  const handleSubmit = async (action) => {
    try {
      uploadDocuments(tradingFilesToUpload, nonTradingFilesToUpload);
      customerData["customerStatus"] = "pending";
      
      const response = await fetch(`${API_BASE_URL}/customers/id/${customerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
        credentials: "include",
      });
      console.log("Response", response);
    } catch (error) {
      console.error("Error updating customer:", error.message);
    }

    try {
      //TODO:Merge workflow data with updatedcustomerData.current if inApproval is true and save. This could happen only during
      //  approval the data is changed
      // updatedCustomerData.current["customerStatus"] = customerData.customerStatus;

      const response = await fetch(`${API_BASE_URL}/customer-contacts/${customerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerContactsData),
        credentials: "include",
      });
      console.log("Response", response);
    } catch (error) {
      console.error("Error updating customer:", error.message);
    }
  };

  return (
    <Sidebar>
      <div className='customers'>
        <div className='customer-onboarding-details'>
          <div className='customer-onboarding-body'>
            <div className='customer-onboarding-tabs-vertical' style={{ height: tabsHeight }}>
              <div className='tabs-title'>{t("Customer Details")}</div>
              {tabs.map((tab) => (
                <div key={tab} className={`tab ${tab === activeTab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                  {t(tab)}
                </div>
              ))}
            </div>
            {activeTab === "Business Details" && (
              <BusinessDetails 
              customerData={customerData} 
              originalCustomerData={originalCustomerData} 
              onChangeCustomerData={handleCustomerDataChange}  
              mode={mode}
              />
            )}
            {activeTab === "Contact Details" && (
              <ContactDetails
                customerData={customerData}
                originalCustomerData={originalCustomerData}
                customerContactsData={customerContactsData}
                originalCustomerContactsData={originalCustomerContactsData}
                onChangeCustomerData={handleCustomerDataChange}
                onChangeCustomerContactsData={handleCustomerContactsDataChange}
                mode={mode}
              />
            )}
            {activeTab === "Financial Information" && (
              <FinancialInformation
                customerData={customerData}
                customerPaymentMethodsData={customerPaymentMethodsData}
                onChangeCustomerData={handleCustomerDataChange}
                onChangeCustomerPaymentMethodsData={handleCustomerPaymentMethodsDataChange}
              />
            )}
            {activeTab === "Documents" && (
              <Documents
                isTrading={customerData?.companyType === "trading"}
                tradingFilesToUpload={tradingFilesToUpload}
                nonTradingFilesToUpload={nonTradingFilesToUpload}
                customerData={customerData}
              />
            )}
            {activeTab === "Branches" && <CustomerBranches customer={customerData} setTabsHeight={setTabsHeight} inApproval={false} />}
            {activeTab === "Products" && <CustomerProducts customer={customerData} />}
          </div>
        </div>
        <div className='customer-onboarding-form-actions'>
          <div className='action-buttons' style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className='status-label'>{t("Status")}:</span>
            <span className='status-badge'>{t(customerData.customerStatus) || t("Pending")}</span>
          </div>
          <div className='action-buttons'>
            {isV("btnSave") && customerData?.customerStatus === "new" && (
              <button className='save' onClick={() => handleSave("save")} disabled={false}>
                {t("Save")}
              </button>
            )}
            {isV("btnSubmit") && customerData?.customerStatus === "new" && (
              <button className='save' onClick={() => handleSubmit("save")} disabled={false}>
                {t("Submit")}
              </button>
            )}
            {isV("btnSaveChanges") && customerData?.customerStatus !== "new" && (
              <button className='save' onClick={() => handleSave("save")} disabled={mode === "add" && inApproval}>
                {t("Save Changes")}
              </button>
            )}
            {isV("btnApprove") && (
              <button className='approve' onClick={() => handleApprove("approve")} disabled={false}>
                {t("Approve")}
              </button>
            )}
            {isV("btnReject") && (
              <button className='reject' onClick={() => handleReject("reject")} disabled={false}>
                {t("Reject")}
              </button>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

export default CustomerDetails;

/*
{
  "id": 4,
  "erpCustId": "ERP004",
  "companyNameEn": "cust 4",
  "companyNameAr": "العميل 4",
  "companyType": "trading",
  "crNumber": "CR0000000004",
  "vatNumber": "VAT0000000004",
  "baladeahLicenseNumber": "BL000004",
  "governmentRegistrationNumber": "GRN000004",
  "typeOfBusiness": "Coffee Shop",
  "typeOfBusinessOther": null,
  "deliveryLocations": "Riyadh, Jeddah, Dubai",
  "companyLogo": null,
  "brandLogo": null,
  "brandNameEn": "Cust4Brand",
  "brandNameAr": "كاست4",
  "buildingName": "Plaza 4",
  "street": "Main Street",
  "city": "Khamis Mushait",
  "district": null,
  "region": "kamis mushait",
  "pincode": null,
  "geolocation": {
    "x": 18.3,
    "y": 42.7333
  },
  "bankName": "Alinma Bank",
  "bankAccountNumber": "SA4567890123456789012346",
  "iban": "SA4567890123456789012345",
  "crCertificate": "cr_cert_004.pdf",
  "vatCertificate": "vat_cert_004.pdf",
  "nationalId": "NID4567890123",
  "bankLetter": "bank_letter_004.pdf",
  "nationalAddress": "78901 Khamis Mushait",
  "customerSource": "Business Conference",
  "acknowledgementSignature": "signature_004.png",
  "contractAgreement": null,
  "customerContract": null,
  "creditApplication": null,
  "declarationName": "Sara Abdullah",
  "declarationSignature": "decl_sig_004.png",
  "declarationDate": {},
  "pricingPolicy": "Price C",
  "customerStatus": "Active",
  "isDeliveryChargesApplicable": false,
  "isBlocked": false,
  "assignedTo": "emp_1004",
  "assignedToEntityWise": {
    "naqi": "emp_1004",
    "vmco": "emp_1001",
    "diyafa": "emp_1002",
    "green mast": "emp_1003"
  },
  "nonTradingDocuments": null,
  "interCompany": true,
  "entity": null,
  "zone": null,
  "createdAt": "2025-06-20T16:39:08.223Z",
  "updatedAt": "2025-06-20T16:39:08.223Z",
  "createdBy": 1,
  "modifiedBy": 1
}

 */
