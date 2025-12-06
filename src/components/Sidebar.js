import React, { useEffect, useState, useRef } from "react";
import "../styles/sidebar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../i18n";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom"; // Add useLocation
import { useAuth } from "../context/AuthContext";
import SaudiTime from "../components/Time";
import RbacManager from "../utilities/rbac";
import { Capacitor } from "@capacitor/core";
// import {isMobile as isMobileDevice} from "../utilities/isMobile";
import {
  faChevronLeft,
  faChevronRight,
  faBars,
  faHouse,
  faBookOpen,
  faBoxOpen,
  faShoppingCart,
  faUsers,
  faCodeBranch,
  faHeadset,
  faTools,
  faBuilding,
  faCog,
  faUser,
  faSignOutAlt,
  faLanguage,
  faBank,
  faFile,
  faUpload,
  faHistory,
} from "@fortawesome/free-solid-svg-icons";
import { CustomerProvider } from "../context/CustomerContext";
import { icon } from "@fortawesome/fontawesome-svg-core";
import WorkHistoryIcon from "@mui/icons-material/WorkHistory";
// import { isMobile } from "../utilities/isMobile";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const isMobileDevice = Capacitor.isNativePlatform();
function Sidebar({ children, title, handleGoToCart }) {
  const navigate = useNavigate();
  const location = useLocation(); // Add this to track current route
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(
    window.innerWidth > 768
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    console.log("isMobile", isMobile);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
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
  const [showPopup, setShowPopup] = useState(false);
 
  const [showMenu, setShowMenu] = useState(true);
  const dragStartY = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e) => {
      dragStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;

      if (currentY < dragStartY.current - 10) {
        // user dragged up
        setShowMenu(false);
      } else if (currentY > dragStartY.current + 10) {
        // user dragged down
        setShowMenu(true);
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);
  const handlePopupToggle = () => {
    setShowPopup(!showPopup);
  };
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
      case "/cart":
        setActiveMenu("Your Cart");
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
    console.log("$$$$activemenu", activeMenu);
    if (window.innerWidth <= 768) setSidebarExpanded(false);

    // Navigate to the corresponding page
    switch (label) {
      case "Orders":
        navigate("/orders");
        break;
      case "Customers":
        navigate("/customers");
        break;
      case "Your Cart":
        handleGoToCart();
        break;
      case "Catalog":
      case "Home":
        navigate("/catalog");
        break;
      case "Support":
        navigate("/support");
        break;
      case "Maintenance":
        navigate("/maintenance");
        break;
      case "Bank Transfer":
      case "Bank":
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
              // activeTabRequired: "Branches",
            },
          });
        } catch (err) {
          console.error("Failed to fetch customer:", err);
        }
        break;
      case "Branches":
        try {
          const customerData = await fetchApprovedCustomer(user);
        
          navigate("/customerDetails", {
            state: {
              customerId: customerData?.id,
              workflowId: customerData?.workflowInstanceId,
              mode: "add",
              activeTabRequired: "Branches",
            },
          });
        } catch (err) {
          console.error("Failed to fetch customer:", err);
        }
        break;
      case "Reports":
        navigate("/reports");
        break;
      case "Approval History":
        navigate("/approvalHistory");
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
    { icon: faHouse, label: "Dashboard", default: true, isVisible: true },
    {
      icon: isMobileDevice ? faHouse : faBookOpen,
      label: "Catalog",
      isVisible: true,
    },
    {
      icon: isMobileDevice ? faBoxOpen : faShoppingCart,
      label: "Orders",
      isVisible: true,
    },
    {
      icon: faCodeBranch,
      label: "Branches",
      isVisible: isMobileDevice ? false : true,
    },
    { icon: faUsers, label: "Customers", isVisible: isMobileDevice
        ? activeMenu === t("Catalog") || activeMenu === t("Customers")
          ? true
          : false
        : true },
    {
      icon: faHeadset,
      label: "Support",
      isVisible: isMobileDevice
        
           ?  true:false
        ,
    },
    {
      icon: faTools,
      label: "Maintenance",
      isVisible: isMobileDevice ?
       true:false,
    },
    {
      icon: faFile,
      label: "Reports",
      isVisible: isMobileDevice ? false : true,
    },
    {
      icon: faBank,
      label: isMobileDevice ? "Bank" : "Bank Transfer",
      permission: "BankTransfer",
      isVisible: isMobileDevice
        ?  true:false
        
    },
    {
      icon: faShoppingCart,
      label: "Your Cart",
      permission: "Cart",
      isVisible: isMobileDevice
        ? activeMenu === t("Catalog") ||
          activeMenu === t("Your Cart")
          ? isV("goToCart")
          : false
        : false,
    },
    {
      icon: isMobileDevice ? faUser : faBuilding,
      label: "Company",
      isVisible: isMobileDevice
        ? activeMenu === t("Catalog") || activeMenu === t("Company")
          ? true
          : false
        : true,
    },
    { icon: faCog, label: "Settings", isVisible: true },
    {
      icon: faUpload,
      label: isMobile ? "" : "General",
      permission: isMobile ? false : "General",
      isVisible: isMobile ? false : true,
    },
    {
      icon: faHistory,
      label: "Approval History",
      permission: "approvalHistory",
      isVisible: isMobile ? false : true,
    },
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

  const formatKey = (key) => {
    // Add space before capital letters and capitalize the first letter
    return key
      .replace(/([a-z])([A-Z])/g, "$1 $2") // insert space before capital letter
      .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2") // handle consecutive caps like ERP
      .replace(/^./, (str) => str.toUpperCase()); // capitalize first letter
  };
  const formatValue = (value) => {
    if (Array.isArray(value)) {
      // Handle array of objects with name property
      if (value?.length > 0 && typeof value[0] === "object" && value[0]?.name) {
        return value?.map((item) => item?.name).join(", ");
      }
      // Handle array of strings or numbers
      return value?.join(", ");
    }

    return value;
  };
  const popupValidKey = (key) => {
    if (
      key.toLowerCase() === "test" ||
      user[key] === null ||
      user[key]?.length === 0
    )
      return false;
    else return true;
  };

  return (
    <div className={`app ${isRTL ? "rtl" : ""}`}>
      <div
        className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""} ${
          isSidebarExpanded ? "expanded" : ""
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
              src={
                isRTL
                  ? "/logos/talab_point_lc.png"
                  : "/logos/talab_point_en.png"
              }
              alt="Talab Point Logo Expanded"
              className="logo-expanded"
              style={{ maxWidth: "100%", maxHeight: "100%", padding: "10px" }}
            />
          )}
        </div>
        <div className="sidebar-menu">
          <div className="main-menu-items">
            {menuItems
              .filter(({ label }) => label.toLowerCase() !== "company")
              .map(
                ({ icon, label, permission, isVisible }) =>
                  isV(permission || label) &&
                  label &&
                  isVisible && (
                    <div
                      key={label}
                      className={`menu-item ${
                        activeMenu === label ? "active" : ""
                      }`}
                      onClick={() => handleMenuClick(label)}
                      style={{
                        display: isV(permission || label) ? "flex" : "none",
                      }}
                    >
                      <FontAwesomeIcon icon={icon} />
                      <span>{t(label)}</span>
                    </div>
                  )
              )}
          </div>

          <div className="bottom-menu-section">
            {menuItems
              .filter(({ label }) => label.toLowerCase() === "company")
              .map(({ icon, label, permission }) => (
                <div
                  key={label}
                  className={`menu-item ${
                    activeMenu === label ? "active" : ""
                  }`}
                  onClick={() => handleMenuClick(label)}
                  style={{
                    display: isV(permission || label) ? "flex" : "none",
                  }}
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
              <div
                className="user-details"
                onClick={handlePopupToggle}
                style={{ cursor: "pointer" }}
              >
                <div className="user-avatar">
                  <FontAwesomeIcon icon={faUser} />
                </div>
                <div className="user-text" style={{ marginLeft: "5px" }}>
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
        {!isMobile && showPopup && (
          <div className="user-popup-overlay" onClick={handlePopupToggle}>
            <div className="user-popup" onClick={(e) => e.stopPropagation()}>
              <div className="user-popup-header">
                <h2>User Details</h2>
              </div>
              <div className="user-popup-content">
                {Object.entries(user).map(([key, value]) =>
                  value
                    ? popupValidKey(key) && (
                        <>
                          <div className="row-detail-row" key={key}>
                            <span className="row-detail-label">
                              {formatKey(key)}:
                            </span>
                            <span className="row-detail-value">
                              {formatValue(value)}
                            </span>
                          </div>
                        </>
                      )
                    : null
                )}
              </div>
              {/* Add more fields as needed */}
              <div className="user-popup-footer">
                <button onClick={handlePopupToggle} className="close-dialog">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
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
            {!isMobileDevice && (
              <button
                className="mobile-menu-btn"
                id="mobileMenuBtn"
                onClick={handleMobileToggle}
              >
                <FontAwesomeIcon icon={faBars} />
              </button>
            )}
            {isMobileDevice && (
              <img
                src="/logos/talab_point_logo.png"
                alt="Talab Point Logo"
                className="logo-collapsed"
                style={{ maxWidth: "100%", maxHeight: "100%" }}
              />
            )}
            <div className="header-title">{t(activeMenu)}</div>
            {/* Saudi time next to language switch */}
            <div className="user-text-header">
              {!isMobile && (
                <div className="text">
                  {user?.userType?.toLowerCase() === "employee" && (
                    // <div className="user-text-header">
                    <div className="text">
                      <div
                        className="user-details-footer"
                        title={user?.employeeId}
                      >
                        {t("Employee ID")}: {user?.employeeId}
                      </div>
                      <div
                        className="user-details-footer"
                        title={user?.designation}
                      >
                        {t("Designation")}: {user?.designation}
                      </div>
                      {/* <div className="user-details-footer">{user?.designation}</div> */}
                      <div className="user-details-footer" title={user?.roles}>
                        {t("Role")}: {user?.roles}
                      </div>
                      {/* </div> */}
                    </div>
                  )}
                  {user?.userType?.toLowerCase() === "customer" &&
                    user?.roles[0] === "customer_primary" && (
                      // <div className="user-text-header">
                      <div className="text">
                        <div
                          className="user-details-footer"
                          title={user?.erpCustomerId}
                        >
                          {t("Customer ID")}: {user?.erpCustomerId}
                        </div>
                        <div
                          className="user-details-footer"
                          title={
                            i18n.language === "en"
                              ? user?.companyNameEn
                              : user?.companyNameAr
                          }
                        >
                          {t("Company")}:{" "}
                          {i18n.language === "en"
                            ? user?.companyNameEn
                            : user?.companyNameAr}
                        </div>
                        {/* <EllipsisToolTip content={i18n.language === "en" ? user?.companyNameEn : user?.companyNameAr}>
      {t("Company")}: {i18n.language === "en" ? user?.companyNameEn : user?.companyNameAr}
    </EllipsisToolTip> */}
                        {/* <div className="user-details-footer">{i18n.language === "en" ? user?.companyNameEn : user?.companyNameAr}</div> */}
                        <div
                          className="user-details-footer"
                          title={user?.branchNumber}
                        >
                          {t("Branches")}: {user?.branchNumber}
                        </div>
                        {/* </div> */}
                      </div>
                    )}
                  {user?.userType?.toLowerCase() === "customer" &&
                    user?.roles[0] === "branch_primary" && (
                      // <div className="user-text-header">
                      <div className="text">
                        <div
                          className="user-details-footer"
                          title={user?.erpCustomerId}
                        >
                          {t("Customer ID")}: {user?.erpCustomerId}
                        </div>
                        {/* <div className="user-details-footer">{t("Company")}:</div> */}
                        {/* <div className="user-details-footer">{i18n.language === "en" ? user?.companyNameEn : user?.companyNameAr}</div> */}
                        <div
                          className="user-details-footer"
                          title={user?.branchNumberPrimary}
                        >
                          {Number(user?.branchNumberPrimary)
                            ? t("Branch")
                            : t("Branch ID")}
                          : {user?.branchNumberPrimary}
                        </div>
                        {/* </div> */}
                      </div>
                    )}
                </div>
              )}

              <button className="lang-switch-btn" onClick={toggleLanguage}>
                <FontAwesomeIcon icon={faLanguage} />
                <span>{isRTL ? "EN" : "عربى"}</span>
              </button>
              {isMobileDevice && (
                <>
                  {console.log("%%%%ismobiledevice", isMobileDevice)}
                  <div className="logout-icon" onClick={handleLogout}>
                    <FontAwesomeIcon icon={faSignOutAlt} />
                  </div>
                </>
              )}
            </div>
          </header>
          <div
            className="content"
            style={{
              padding: isMobileDevice
                ? activeMenu
                  ? "0 0px 0px"
                  : "20px"
                : "20px",
            }}
          >
            {children}
          </div>
          {isMobileDevice && (
            <div className={`mobile-bottom-menu ${showMenu ? "show" : "hide"}`}>
              {menuItems
                .filter(({ label }) => !["support","maintenance","bank transfer","bank"].includes (label.toLowerCase())  )
                .map(
                  ({ icon, label, permission, isVisible }) =>
                    isV(permission || label) &&
                    isVisible && (
                      <div
                        key={label}
                        className={`bottom-menu-item ${
                          activeMenu === t(label) ||
                          ((activeMenu === t("Bank Transactions") || activeMenu === t("Support")  || activeMenu === t("Maintenance")  )  &&
                            label === "Orders")
                            ? "active"
                            : ""
                        }`}
                        onClick={() => handleMenuClick(label)}
                      >
                        <FontAwesomeIcon icon={icon} />
                        <span style={{ fontSize: "11px" }}>
                          {label === t("Catalog")
                            ? t("Home")
                            : label === t("Your Cart")
                            ? t("Cart")
                            : t(label)}
                        </span>
                      </div>
                    )
                )}
            </div>
          )}
          {isMobileDevice && activeMenu === t("Orders") && (
  <div className={`orders-bottom-bar ${showMenu ? "show" : "hide"}`}>

    <div className="orders-icon" onClick={() => handleMenuClick("Bank")}>
      <FontAwesomeIcon icon={faBank} />
      <span>{t("Bank")}</span>
    </div>

    <div className="orders-icon" onClick={() => handleMenuClick("Support")}>
      <FontAwesomeIcon icon={faHeadset} />
      <span>{t("Support")}</span>
    </div>

    <div className="orders-icon" onClick={() => handleMenuClick("Maintenance")}>
      <FontAwesomeIcon icon={faTools} />
      <span>{t("Maintenance")}</span>
    </div>
  </div>
)}

        </div>
      </CustomerProvider>
    </div>
  );
}

export default Sidebar;
