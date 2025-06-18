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

const fetchCurrentDataOfCutomerContacts = async (customerId) => {
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
    return contactsDataJson;
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
    // if (customerDataJson.status === 'Ok') {
    //   customerData = customerDataJson.data;
    //   console.log('Current customer data:', customerDataJson.data);
    // }
    // const responseContacts = await fetch(`${API_BASE_URL}/customer-contacts/${customerId}`, {
    //   method: 'GET',
    //   headers: { 'Content-Type': 'application/json' },
    //   credentials: 'include'
    // });
    // const contactsDataJson = await responseContacts.json();
    // if (contactsDataJson.status === 'Ok') {
    //   contactsData = contactsDataJson.data;
    //   console.log('Current customer contacts data:', contactsDataJson.data);
    //   return { customer: customerData.data, contacts: contactsData.data };
    // } else {
    //   throw new Error(contactsData.data?.message || 'Failed to fetch customer contacts');
    // }
    // const responsePaymentMethods = await fetch(`${API_BASE_URL}/payment-method/id/${customerId}`, {
    //   method: 'GET',
    //   headers: { 'Content-Type': 'application/json' },
    //   credentials: 'include'
    // });
    // const paymentMethodsDataJson = await responsePaymentMethods.json();
    // if (paymentMethodsDataJson.status === 'Ok') {
    //   paymentMethodsData = paymentMethodsDataJson.data;
    //   console.log('Current customer payment methods data:', paymentMethodsDataJson.data);
    //   return { customer: customerData.data, contacts: contactsData.data, paymentMethods: paymentMethodsData.data };
    // } else {
    //   throw new Error(paymentMethodsData.data?.message || 'Failed to fetch customer payment methods');
    // }
    // setFormData(prev => ({
    //   ...prev,
    //   ...customerData,
    //   ...contactsData,
    //   paymentMethods: paymentMethodsData
    // }));
    // console.log('Form data after fetching current data:', formData);
  } catch (error) {
    console.error("Error fetching current customer data:", error);
    throw error;
  }
};
function CustomerDetails() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("Business Details");
  const tabs = useMemo(() => {
    return [
      "Business Details",
      "Contact Details",
      "Financial Information",
      "Documents",
      "Products",
      "Branches",
    ];
  }, []);
  const [customerData, setCustomerData] = useState({});
  const [customerContactsData, setCustomerContactsData] = useState({});
  const [customerPaymentMethodsData, setCustomerPaymentMethodsData] = useState(
    {}
  );
  var updatedCustomerData = useRef({});
  var updatedCustomerContactsData = useRef({});
  var updatedCustomerPaymentMethodsData = useRef({});

  const location = useLocation();
  const customerId = location?.state?.customerId;

  useEffect(() => {
    const fetchData = async () => {
      const resp = await fetchCurrentDataOfCustomer(customerId);
      console.log("#####Fetched customer data:", resp);
      setCustomerData(resp);
      const conRes = await fetchCurrentDataOfCutomerContacts(customerId);
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
    let paymentMethods = customerPaymentMethodsData.methodDetails;
    paymentMethods[name].isAllowed = e.target.checked;
    //paymentMethods[name].isAllowed = false;

    setCustomerPaymentMethodsData((prev) => ({
      ...prev,
      methodDetails: paymentMethods,
    }));
    updatedCustomerPaymentMethodsData.current[name] = value;
    console.log(
      "Updated payment methods data:",
      updatedCustomerPaymentMethodsData.current
    );
  };
  const handleSave = async (action) => {
    console.log("^^^^^Saving customer data:", updatedCustomerData.current);

    try {
      updatedCustomerData.current["customerStatus"] =
        customerData.customerStatus;

      const response = await fetch(
        `${API_BASE_URL}/customers/id/${customerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedCustomerData.current),
          credentials: "include",
        }
      );
      console.log("Response", response);
    } catch (error) {
      console.error("Error updating customer:", error.message);
    }
  };
  return (
    <Sidebar>
      <div className="customers">
        <div className="customer-onboarding-details">
          <div className="customer-onboarding-body">
            <div className="customer-onboarding-tabs-vertical">
              <div className="tabs-title">{t("Customer Details")}</div>
              {tabs.map((tab) => (
                <div
                  key={tab}
                  className={`tab ${tab === activeTab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {t(tab)}
                </div>
              ))}
            </div>
            <div className="customer-onboarding-form-grid">
              {activeTab === "Business Details" && (
                <BusinessDetails
                  customerData={customerData}
                  onChangeCustomerData={handleCustomerDataChange}
                />
              )}
              {activeTab === "Contact Details" && (
                <ContactDetails
                  customerData={customerData}
                  customerContactsData={customerContactsData}
                  onChangeCustomerData={handleCustomerDataChange}
                  onChangeCustomerContactsData={
                    handleCustomerContactsDataChange
                  }
                />
              )}
              {activeTab === "Financial Information" && (
                <FinancialInformation
                  customerData={customerData}
                  customerPaymentMethodsData={customerPaymentMethodsData}
                  onChangeCustomerData={handleCustomerDataChange}
                  onChangeCustomerPaymentMethodsData={
                    handleCustomerPaymentMethodsDataChange
                  }
                />
              )}
              {activeTab === "Documents" && <Documents />}
            </div>
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
          <div className="action-buttons">
            {
              <button
                className="save"
                onClick={() => handleSave("save")}
                disabled={false}
              >
                {t("Save")}
              </button>
            }
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

export default CustomerDetails;
