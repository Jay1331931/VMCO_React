import React, { useEffect, useState } from "react";
import "../styles/sidebar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../i18n";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom"; // Add useLocation
import { useAuth } from "../context/AuthContext";
import SaudiTime from "../components/Time";
import RbacManager from "../utilities/rbac";
import {
  faChevronLeft,
  faChevronRight,
  faBars,
  faHouse,
  faBookOpen,
  faShoppingCart,
  faUsers,
  faHeadset,
  faTools,
  faBuilding,
  faCog,
  faUser,
  faSignOutAlt,
  faLanguage,
  faBank,
  faFile,
  faUpload
} from "@fortawesome/free-solid-svg-icons";
import { CustomerProvider } from "../context/CustomerContext";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function Sidebar({ children, title }) {
  const navigate = useNavigate();
  const location = useLocation(); // Add this to track current route
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(
    window.innerWidth > 768
  );
  const [isSidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const { t, i18n } = useTranslation();
  const { token, user, isAuthenticated, logout } = useAuth();
  const rbacMgr = new RbacManager(
    user?.userType == "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "SidebarList"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  const isRTL = i18n.language === "ar";

  const toggleLanguage = () => {
    const newLang = isRTL ? "en" : "ar";
    i18n.changeLanguage(newLang);
    document.body.dir = newLang === "ar" ? "rtl" : "ltr";
  };
  const [customer, setCustomer] = useState();
  let transformedCustomer;
  const [formData, setFormData] = useState();
  const [approvedCustomer, setApprovedCustomer] = useState();
  function transformCustomerData(customer, customerContacts) {
    const contacts = Array.isArray(customerContacts)
      ? customerContacts
      : customerContacts
        ? [customerContacts]
        : [];

    // Create a map of contactType to contact data (note: using contactType instead of contact_type)
    const contactsMap = contacts.reduce((acc, contact) => {
      acc[contact.contactType] = contact;
      return acc;
    }, {});
    let isApprovalMode;
    try {
      const res = fetch(`${API_BASE_URL}/workflow-instance/check/id`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: customer?.id, module: "customer" }),
      });
      if (res.ok) {
        isApprovalMode = true;
      }
    } catch (err) {
      console.error("Error fetching workflow instance:", err);
    }
    return {
      ...customer,
      // Contact details - each contact type is a separate row in DB
      // primaryContactName: contactsMap.primary?.name || '',
      // primaryContactDesignation: contactsMap.primary?.designation || '',
      // primaryContactEmail: contactsMap.primary?.email || '',
      // primaryContactMobile: contactsMap.primary?.mobile || '',  // Changed from phone to mobile

      // businessHeadName: contactsMap.business?.name || '',
      // businessHeadDesignation: contactsMap.business?.designation || '',
      // businessHeadEmail: contactsMap.business?.email || '',
      // businessHeadMobile: contactsMap.business?.mobile || '',

      // financeHeadName: contactsMap.finance?.name || '',
      // financeHeadDesignation: contactsMap.finance?.designation || '',
      // financeHeadEmail: contactsMap.finance?.email || '',
      // financeHeadMobile: contactsMap.finance?.mobile || '',

      // purchasingHeadName: contactsMap.purchasing?.name || '',
      // purchasingHeadDesignation: contactsMap.purchasing?.designation || '',
      // purchasingHeadEmail: contactsMap.purchasing?.email || '',
      // purchasingHeadMobile: contactsMap.purchasing?.mobile || '',

      // // Adding operations contact if needed
      // operationsHeadName: contactsMap.operations?.name || '',
      // operationsHeadDesignation: contactsMap.operations?.designation || '',
      // operationsHeadEmail: contactsMap.operations?.email || '',
      // operationsHeadMobile: contactsMap.operations?.mobile || '',
      ...customerContacts,
      isApprovalMode: isApprovalMode,
    };
  }

  const fetchCustomerContacts = async (customerId, customer) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/customer-contacts/${customerId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      if (result.status === "Ok") {
        setCustomer(transformCustomerData(customer, result.data));
      } else {
        throw new Error(
          response.data.message || "Failed to fetch customer contacts"
        );
      }
    } catch (err) {
      console.error("Error fetching customer contacts:", err);
    }
  };
  const fetchApprovedCustomer = async (transformedCustomer) => {
    console.log("Fetch Approved Customer Called");
    const customerId =
      transformedCustomer?.id || transformedCustomer?.customerId;
    try {
      // Fetch basic customer data
      const response = await fetch(
        `${API_BASE_URL}/customers/id/${customerId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      const result = await response.json();

      if (result.status !== "Ok") {
        throw new Error(
          result.data?.message || "Failed to fetch customer data"
        );
      }

      let customerData = result.data;
      // console.log('Initial Customer Data:', customerData);

      const [contactsResponse, paymentMethodsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/customer-contacts/${customerId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE_URL}/payment-method/id/${customerId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const contactsResult = await contactsResponse.json();
      if (contactsResult.status === "Ok") {
        customerData = transformCustomerData(customerData, contactsResult.data);
        console.log("Customer Data with Contacts:", customerData);
      }

      const paymentResult = await paymentMethodsResponse.json();
      if (paymentResult.status === "Ok") {
        const paymentMethods = Array.isArray(paymentResult.data)
          ? paymentResult.data
          : [];

        customerData = {
          ...customerData,
          paymentMethods,
          creditLimit:
            paymentMethods.find((m) => m?.methodName === "Credit")
              ?.creditLimit || 0,
          balance:
            paymentMethods.find((m) => m?.methodName === "Credit")?.balance ||
            0,
        };
        // console.log('Customer Data with Payment Methods:', customerData);
      }
      // setCustomer(customerData);
      // if(transformedCustomer.isApprovalMode)
      // {
      // // setApprovedCustomer(customerData);
      // if (transformedCustomer.workflowData?.updates) {
      //     // First set all the customer data
      //     setFormData(prevFormData => ({
      //       ...prevFormData,
      //       ...customerData
      //     }));

      //     // Then individually set each update field
      //     Object.entries(transformedCustomer.workflowData.updates).forEach(([key, value]) => {
      //       setFormData(prevFormData => ({
      //         ...prevFormData,
      //         [key]: value
      //       }));
      //     });
      //   }
      // }
      if (transformedCustomer.isApprovalMode) {
        if (transformedCustomer.workflowData?.updates) {
          // First, set all customer data while preserving current values
          setFormData((prevFormData) => {
            const newFormData = { ...prevFormData, ...customerData };

            // If 'current' doesn't exist, initialize it with the current values
            if (!newFormData.current) {
              newFormData.current = { ...prevFormData };
            }

            // Apply updates while preserving current values
            Object.entries(transformedCustomer.workflowData.updates).forEach(
              ([key, value]) => {
                if (newFormData[key] !== undefined) {
                  // Store the current value if not already stored
                  if (!newFormData.current[key]) {
                    newFormData.current[key] = newFormData[key];
                  }
                  // Apply the update
                  newFormData[key] = value;
                }
              }
            );

            return newFormData;
          });
        }
      }
      console.log("Approved Customer Data", customerData);
      setApprovedCustomer(customerData);

      return customerData;
      // console.log("Approved Customer Data", customerData)
      // setApprovedCustomer(customerData)
      // setFormData(customerData)
      // return customerData;
    } catch (err) {
      console.error("Error in fetchCustomer:", err);
      throw err;
    }
  };
  useEffect(() => {
    document.body.dir = isRTL ? "rtl" : "ltr";

    const handleClickOutside = (event) => {
      if (
        window.innerWidth <= 768 &&
        !event.target.closest(".sidebar") &&
        !event.target.closest("#mobileMenuBtn")
      ) {
        setSidebarExpanded(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isRTL]);

  useEffect(() => {
    const path = location.pathname;
    switch (path) {
      case "/orders":
        setActiveMenu("Orders");
        break;
      case "/customers":
        setActiveMenu("Customers");
        break;
      case "/catalog":
        setActiveMenu("Catalog");
        break;
      case "/admin/upload":
        setActiveMenu("General");
        break;
      default:
        setActiveMenu("Dashboard");
    }
  }, [location.pathname]);

  useEffect(() => {
    // Update the active menu based on the title prop
    setActiveMenu(title);
  }, [title]);

  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);
  const handleMobileToggle = () => {
    setSidebarCollapsed(false);
    setSidebarExpanded(!isSidebarExpanded);
  };

  const handleMenuClick = async (label) => {
    setActiveMenu(label);
    if (window.innerWidth <= 768) setSidebarExpanded(false);

    // Navigate to the corresponding page
    switch (label) {
      case "Orders":
        navigate("/orders");
        break;
      case "Customers":
        navigate("/customers");
        break;
      case "Catalog":
        navigate("/catalog");
        break;
      case "Support":
        navigate("/support");
        break;
      case "Maintenance":
        navigate("/maintenance");
        break;
      case "Bank Transfer":
        navigate("/bankTransactions");
        break;
      case "General":
        navigate("/admin/upload");
        break;
      case "Dashboard":
        navigate("/login");
        break;
      // case 'Company Profile': navigate('/customersDetails', { state: { transformedCustomer: fetchApprovedCustomer(user)}}); break;
      case "Company":
        try {
          const customerData = await fetchApprovedCustomer(user);
          // navigate('/customersDetails', {
          //   state: {
          //     transformedCustomer: JSON.parse(JSON.stringify(customerData))
          //   }
          // });
          navigate("/customerDetails", {
            state: {
              customerId: customerData?.id,
              workflowId: customerData?.workflowInstanceId,
              mode: "add",
            },
          });
        } catch (err) {
          console.error("Failed to fetch customer:", err);
        }
        break;

        case "Reports":
          navigate("/reports");
          break;

      default:
        // If no match is found, stay on current page
        break;
    }
  };

  const handleLogout = async () => {
    const userLoggedOut = user;

    logout(true); // Pass true to indicate button was clicked

    // Logout successful, redirect to login page
    if (userLoggedOut?.userType === "employee") {
      navigate("/login/employee");
    } else {
      navigate("/login");
    }
  };

  const menuItems = [
    { icon: faHouse, label: "Dashboard", default: true },
    { icon: faBookOpen, label: "Catalog" },
    { icon: faShoppingCart, label: "Orders" },
    { icon: faUsers, label: "Customers" },
    { icon: faHeadset, label: "Support" },
    { icon: faTools, label: "Maintenance" },
    { icon: faFile, label: "Reports" },
    { icon: faBank, label: "Bank Transfer" },
    { icon: faBuilding, label: "Company" },
    { icon: faCog, label: "Settings" },
    { icon: faUpload, label: "General" },
  ];

  const sidebarOffset = isSidebarCollapsed ? "70px" : "240px";

  // Add this function to refresh customer data
  const refreshCustomerData = async () => {
    try {
      const customerData = await fetchApprovedCustomer(user);
      navigate("/customersDetails", {
        state: {
          transformedCustomer: JSON.parse(JSON.stringify(customerData)),
        },
      });
    } catch (err) {
      console.error("Failed to refresh customer:", err);
    }
  };
  return (
    <div className={`app ${isRTL ? "rtl" : ""}`}>
      <div
        className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""} ${isSidebarExpanded ? "expanded" : ""
          }`}
      >
        <div className="sidebar-header">
          {isSidebarCollapsed ? (
            // Collapsed logo
            <img
              src="/logos/talab_point_logo.png"
              alt="Talab Point Logo"
              className="logo-collapsed"
              style={{ maxWidth: "100%", maxHeight: "100%" }}
            />
          ) : (
            // Expanded logo: show different image based on RTL
            <img
              src={isRTL ? "/logos/talab_point_lc.png" : "/logos/talab_point_en.png"}
              alt="Talab Point Logo Expanded"
              className="logo-expanded"
              style={{ maxWidth: "100%", maxHeight: "100%", padding: "10px" }}
            />
          )}
        </div>
        <div className="sidebar-menu">
          <div className="main-menu-items">
            {menuItems.slice(0, 7).map(({ icon, label }) => (
              <div
                key={label}
                className={`menu-item ${activeMenu === label ? "active" : ""}`}
                onClick={() => handleMenuClick(label)}
                style={{ display: isV(label) ? "flex" : "none" }}
              >
                <FontAwesomeIcon icon={icon} />
                <span>{t(label)}</span>
              </div>
            ))}
          </div>
          <div className="bottom-menu-section">
            {menuItems.slice(7).map(({ icon, label }) => (
              <div
                key={label}
                className={`menu-item ${activeMenu === label ? "active" : ""}`}
                onClick={() => handleMenuClick(label)}
                style={{ display: isV(label) ? "flex" : "none" }}
              >
                <FontAwesomeIcon icon={icon} />
                <span>{t(label)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-info">
              <div className="user-details">
                <div className="user-avatar">
                  <FontAwesomeIcon icon={faUser} />
                </div>
                <div className="user-text">
                  <div className="user-name">{user?.userName}</div>
                  <div className="user-email">{user?.email}</div>
                </div>
              </div>
              <div className="logout-icon" onClick={handleLogout}>
                <FontAwesomeIcon icon={faSignOutAlt} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="toggle-btn-container"
        style={
          isRTL
            ? { right: sidebarOffset, left: "auto" }
            : { left: sidebarOffset, right: "auto" }
        }
      >
        <div className="toggle-btn" id="toggleBtn" onClick={toggleSidebar}>
          <FontAwesomeIcon
            icon={
              isSidebarCollapsed
                ? isRTL
                  ? faChevronLeft
                  : faChevronRight
                : isRTL
                  ? faChevronRight
                  : faChevronLeft
            }
          />
        </div>
      </div>

      <CustomerProvider value={{ refreshCustomerData }}>
        <div
          className="main-content"
          style={
            window.innerWidth <= 768
              ? {}
              : isRTL
                ? { marginRight: sidebarOffset, marginLeft: 0 }
                : { marginLeft: sidebarOffset, marginRight: 0 }
          }
        >
          <header className="header">
            <button
              className="mobile-menu-btn"
              id="mobileMenuBtn"
              onClick={handleMobileToggle}
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
            <div className="header-title">{t(activeMenu)}</div>
            {/* Saudi time next to language switch */}
            <button className="lang-switch-btn" onClick={toggleLanguage}>
              <FontAwesomeIcon icon={faLanguage} />
              <span>{isRTL ? "EN" : "عربى"}</span>
            </button>
          </header>
          <div className="content">{children}</div>
        </div>
      </CustomerProvider>
    </div>
  );
}

export default Sidebar;
