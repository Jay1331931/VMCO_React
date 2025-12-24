import React, { useEffect, useState, useRef } from "react";
import "../styles/sidebar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../i18n";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SaudiTime from "../components/Time";
import RbacManager from "../utilities/rbac";
import usePlatform from "../utilities/platform";
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
  faList,
} from "@fortawesome/free-solid-svg-icons";
import { CustomerProvider } from "../context/CustomerContext";
import { icon } from "@fortawesome/fontawesome-svg-core";
import WorkHistoryIcon from "@mui/icons-material/WorkHistory";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function Sidebar({ children, title, handleGoToCart, MenuName = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(
    window.innerWidth > 768
  );
  const isMobile = usePlatform();

  const [isSidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const { t, i18n } = useTranslation();
  const { token, user, isAuthenticated, logout } = useAuth();
  const [showOrdersSubMenu, setShowOrdersSubMenu] = useState(false);
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
        setShowMenu(false);
      } else if (currentY > dragStartY.current + 10) {
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
      }

      if (transformedCustomer.isApprovalMode) {
        if (transformedCustomer.workflowData?.updates) {
          setFormData((prevFormData) => {
            const newFormData = { ...prevFormData, ...customerData };

            if (!newFormData.current) {
              newFormData.current = { ...prevFormData };
            }

            Object.entries(transformedCustomer.workflowData.updates).forEach(
              ([key, value]) => {
                if (newFormData[key] !== undefined) {
                  if (!newFormData.current[key]) {
                    newFormData.current[key] = newFormData[key];
                  }
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
    console.log("MenuName", MenuName);
    switch (MenuName || path) {
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
      case "Menu":
        setActiveMenu("Menu");
        break;
      case "Orders":
        console.log("Orders");
        setActiveMenu("Orders");
        break;
      default:
        setActiveMenu("Dashboard");
    }
  }, [location.pathname, MenuName]);

  useEffect(() => {
    setActiveMenu(title);
  }, [title]);

  useEffect(() => {
    const mainContent = document.querySelector(".main-content");
    if (mainContent && isMobile) {
      if (showOrdersSubMenu) {
        mainContent.classList.add("has-orders-submenu");
      } else {
        mainContent.classList.remove("has-orders-submenu");
      }
    }

    return () => {
      const mainContent = document.querySelector(".main-content");
      if (mainContent) {
        mainContent.classList.remove("has-orders-submenu");
      }
    };
  }, [showOrdersSubMenu, isMobile]);

  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);
  const handleMobileToggle = () => {
    setSidebarCollapsed(false);
    setSidebarExpanded(!isSidebarExpanded);
  };

  const handleMenuClick = async (label) => {
    if (label === "Menu") {
      setShowOrdersSubMenu(!showOrdersSubMenu);
      return;
    }
    setShowOrdersSubMenu(false);
    setActiveMenu(label);

    if (window.innerWidth <= 768) setSidebarExpanded(false);

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
        navigate("/login",{replace:true});
        break;
      case "Company":
        try {
          const customerData = await fetchApprovedCustomer(user);
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
        break;
    }
  };

  const handleLogout = async () => {
    const userLoggedOut = user;

    logout(true);

    if (userLoggedOut?.userType === "employee") {
      navigate("/login/employee",{replace:true});
    } else {
      navigate("/login",{replace:true});
    }
  };

  const menuItems = [
    { icon: faHouse, label: "Dashboard", default: true, isVisible: true },
    {
      icon: isMobile ? faHouse : faBookOpen,
      label: "Catalog",
      isVisible: true,
    },
    {
      icon: isMobile ? faBoxOpen : faShoppingCart,
      label: "Orders",
      isVisible: true,
    },
    {
      icon: faCodeBranch,
      label: "Branches",
      isVisible: isMobile ? false : true,
    },
    {
      icon: faUsers,
      label: "Customers",
      isVisible: isMobile
        ? activeMenu === t("Catalog") ||
          activeMenu === t("Customers") ||
          activeMenu === t("Company")
          ? true
          : false
        : true,
    },
    {
      icon: faHeadset,
      label: "Support",
      isVisible: true,
    },
    {
      icon: faTools,
      label: "Maintenance",
      isVisible: true,
    },
    {
      icon: faFile,
      label: "Reports",
      isVisible: isMobile ? false : true,
    },
    {
      icon: faBank,
      label: isMobile ? "Bank" : "Bank Transfer",
      permission: "BankTransfer",
      isVisible: true,
    },
    {
      icon: faShoppingCart,
      label: "Your Cart",
      permission: "Cart",
      isVisible: isMobile
        ? activeMenu === t("Catalog") || activeMenu === t("Your Cart")
          ? isV("goToCart")
          : false
        : false,
    },
    {
      icon: isMobile ? faUser : faBuilding,
      label: "Company",
      isVisible: isMobile
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
    {
      icon: faList,
      label: "Menu",
      // UPDATED: Menu visible on all screens in mobile
      isVisible: isMobile,
    },
  ];

  const sidebarOffset = isSidebarCollapsed ? "70px" : "240px";

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
    return key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
      .replace(/^./, (str) => str.toUpperCase());
  };

  const formatValue = (value) => {
    if (Array.isArray(value)) {
      if (value?.length > 0 && typeof value[0] === "object" && value[0]?.name) {
        return value?.map((item) => item?.name).join(", ");
      }
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
            <img
              src="/logos/talab_point_logo.png"
              alt="Talab Point Logo"
              className="logo-collapsed"
              style={{ maxWidth: "100%", maxHeight: "100%" }}
            />
          ) : (
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
          <header className={`header ${showMenu ? "show" : "show"}`}>
            {!isMobile && (
              <button
                className="mobile-menu-btn"
                id="mobileMenuBtn"
                onClick={handleMobileToggle}
              >
                <FontAwesomeIcon icon={faBars} />
              </button>
            )}
            {isMobile && (
              <img
                src="/logos/talab_point_logo.png"
                alt="Talab Point Logo"
                className="logo-collapsed"
                style={{ maxWidth: "100%", maxHeight: "100%" }}
              />
            )}
            <div className="header-title">{t(activeMenu)}</div>
            <div className="user-text-header">
              {!isMobile && (
                <div className="text">
                  {user?.userType?.toLowerCase() === "employee" && (
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
                      <div className="user-details-footer" title={user?.roles}>
                        {t("Role")}: {user?.roles}
                      </div>
                    </div>
                  )}
                  {user?.userType?.toLowerCase() === "customer" &&
                    user?.roles[0] === "customer_primary" && (
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
                        <div
                          className="user-details-footer"
                          title={user?.branchNumber}
                        >
                          {t("Branches")}: {user?.branchNumber}
                        </div>
                      </div>
                    )}
                  {user?.userType?.toLowerCase() === "customer" &&
                    user?.roles[0] === "branch_primary" && (
                      <div className="text">
                        <div
                          className="user-details-footer"
                          title={user?.erpCustomerId}
                        >
                          {t("Customer ID")}: {user?.erpCustomerId}
                        </div>
                        <div
                          className="user-details-footer"
                          title={user?.branchNumberPrimary}
                        >
                          {Number(user?.branchNumberPrimary)
                            ? t("Branch")
                            : t("Branch ID")}
                          : {user?.branchNumberPrimary}
                        </div>
                      </div>
                    )}
                </div>
              )}

              <button className="lang-switch-btn" onClick={toggleLanguage}>
                <FontAwesomeIcon icon={faLanguage} />
                <span>{isRTL ? "EN" : "عربى"}</span>
              </button>
              {isMobile && (
                <>
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
              padding: isMobileDevice ? (activeMenu ? "0 0px 0px" : "0 20px") : "0 20px",
            }}
          >
            {children}
          </div>
          {/* UPDATED: Only show bottom menu on mobile (isMobile check) */}
          {isMobile && isMobile && (
            <div className={`mobile-bottom-menu ${showMenu ? "show" : "show"}`}>
              {menuItems
                .filter(
                  ({ label }) =>
                    ![
                      "support",
                      "maintenance",
                      "bank transfer",
                      "bank",
                    ].includes(label.toLowerCase())
                )
                .map(({ icon, label, permission, isVisible }) => {
                  if (!isV(permission || label) || !isVisible) return null;

                  // UPDATED: Menu item is active only when clicked
                  const isMenuItemActive = () => {
                    if (label === "Menu") {
                      return showOrdersSubMenu;
                    }
                    return activeMenu === t(label);
                  };

                  return (
                    <div
                      key={label}
                      className={`bottom-menu-item ${
                        isMenuItemActive() ? "active" : ""
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
                  );
                })}
            </div>
          )}
          {/* UPDATED: Only show orders submenu on mobile */}
          {isMobile && isMobile && showOrdersSubMenu && (
            <div className={`orders-bottom-bar ${showMenu ? "show" : "show"}`}>
              {(isV("BankTransfer") || isV("Bank Transactions")) && (
                <button
                  className="orders-btn"
                  onClick={() => handleMenuClick("Bank")}
                >
                  {t("Bank")}
                </button>
              )}

              {isV("Support") && (
                <button
                  className="orders-btn"
                  onClick={() => handleMenuClick("Support")}
                >
                  {t("Support")}
                </button>
              )}

              {isV("Maintenance") && (
                <button
                  className="orders-btn"
                  onClick={() => handleMenuClick("Maintenance")}
                >
                  {t("Maintenance")}
                </button>
              )}
            </div>
          )}
        </div>
      </CustomerProvider>
    </div>
  );
}

export default Sidebar;
