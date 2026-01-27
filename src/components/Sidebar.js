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
import Constants from "../../src/constants"
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
import SearchableDropdown from "./SearchableDropdown";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Swal from "sweetalert2";
const isMobileResponsive = /iPhone|Android/i.test(navigator.userAgent)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const isIOSsMobile= /iPhone/i.test(navigator.userAgent);
 const isAndroidMobile = /Android/i.test(navigator.userAgent);
function Sidebar({ children, title = null, MenuName = null,searchable=false ,setSelectedBranchLocation,goToCart=false ,selectBranch=false ,homePage="",PaddingClass=false, CardPaddingClass=false}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(
    window.innerWidth > 768
  );
  //const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const isMobile = usePlatform();
  const [cartbranchData, setCartBranchData] = useState(null);

  const [isSidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeMenu, setActiveMenu] = useState(title || "Dashboard");
  const { t, i18n } = useTranslation();
  const { token, user, isAuthenticated, logout } = useAuth();
  const [showOrdersSubMenu, setShowOrdersSubMenu] = useState(false);
  const [selectedBranchRegion, setSelectedBranchRegion] = useState("");
  const [selectedBranchCity, setSelectedBranchCity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [branches, setBranches] = useState([]);
  const rbacMgr = new RbacManager(
    user?.userType == "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "SidebarList"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);
  const customerId = user?.customerId;
  const custSequenceId = user?.sequenceId;
  const userId = user?.userId;
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
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const dragStartY = useRef(0);

  useEffect(() => {
    // Get initial cart items count from localStorage
    const cartItems = localStorage.getItem("cartItems");
    if (cartItems) {
      setCartItemsCount(parseInt(cartItems, 10) || 0);
    }

    // Listen for storage changes (when cartItems is updated from other tabs/windows)
    const handleStorageChange = (e) => {
      if (e.key === "cartItems") {
        setCartItemsCount(parseInt(e.newValue, 10) || 0);
      }
    };

    // Listen for custom event triggered when localStorage is updated in the same tab
    const handleCartUpdate = (e) => {
      setCartItemsCount(e.detail || 0);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cartItemsUpdated", handleCartUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartItemsUpdated", handleCartUpdate);
    };
  }, []);

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
  const fetchCart = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/cart/get-cart-by-userId?id=${user?.userId}`,
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
        setCartBranchData(result.data);
        return result.data;
      } else {
        return null;
        // console.error(
        //   result?.result?.message || "Failed to fetch customer contacts"
        // );
      }
    } catch (err) {
      console.error("Error fetching cart :", err);
      return null;
    }
  };
  // useEffect(()=>{
  //   if(!user?.userId) return;

  //   fetchCart()
  // },[user])
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

  const handleGoToCart = async () => {
    const cartData = await fetchCart();
    console.log("cartData",cartData)
    if (cartData?.id) {
      navigate("/Cart", {
        state: {
          selectedCustomerId: user?.customerId,
          selectedCustomerStatus: user?.customerStatus,
          selectedBranchId: cartData?.branchId || null,
          selectedBranchName:
            i18n.language === "en"
              ? cartData?.branchNameEn
              : cartData?.branchNameLc,
          selectedBranchNameLc: cartData?.branchNameLc || "",
          selectedBranchNameEn: cartData?.branchNameEn || "",
          selectedBranchErpId: cartData?.erpBranchId || "",
          selectedBranchRegion: cartData?.branchRegion || cartData?.region
 || "",
          selectedBranchCity: cartData?.city || "",
          selectedBranchStatus: cartData?.branchStatus || "",
          selectedCustSequenceId: user?.sequenceId || "",
          selectedBranchSequenceId: cartData?.sequenceId || "",
        },
      });
    } else {
      navigate("/Cart");
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
    setActiveMenu(title);
  }, [title]);
  const handleMenuClick = async (label) => {
    if (label === "Others") {
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
      // case "Catalog":
      //    navigate("/catalog");
      case "Home":
        navigate("/home");
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
        navigate("/login", { replace: true });
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

  const handleLogout = async () => {
    const userLoggedOut = user;

    logout(true);

    if (userLoggedOut?.userType === "employee") {
      navigate("/login/employee", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  };

  const baseMenuItems = [
    { icon: faHouse, label: "Dashboard", default: true, isVisible: true },
    {
      icon: faHouse,//isMobile ? faHouse : faBookOpen,
      label: "Home", //Catalog
      isVisible: true,
    },
    {
      icon: isMobile ? faBoxOpen : faShoppingCart,
      label: "Orders",
      isVisible: isMobile ? true : true,
    },
    {
      icon: faCodeBranch,
      label: "Branches",
      isVisible: isMobile ? false : true,
    },
    {
      icon: faUsers,
      label: "Customers",
      isVisible: isMobile ? true : true,
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
      isVisible: isMobile ? isV("goToCart") : false,
    },
    {
      icon: isMobile ? faUser : faBuilding,
      label: "Company",
      isVisible: isMobile ? true : true,
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
      label: "Others",
      // UPDATED: Menu visible on all screens in mobile
      isVisible: isMobile,
    },
  ];
  const menuItems = isMobile
    ? [
        // baseMenuItems.find((item) => item.label === "Dashboard"),
        baseMenuItems.find((item) => item.label === "Home"),

        // 🔥 3rd position
        baseMenuItems.find((item) => item.label === "Your Cart"),

        // 🔥 4th position
        baseMenuItems.find((item) => item.label === "Orders"),

        ...baseMenuItems.filter(
          (item) =>
            !["Dashboard", "Home", "Your Cart", "Orders"].includes(
              item.label
            )
        ),
      ]
    : baseMenuItems;

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
  useEffect(() => {
    const path = location.pathname;
    switch (MenuName || path) {
      case "/orders":
        setActiveMenu("Orders");
        break;
      case "/customers":
        setActiveMenu("Customers");
        break;
      case "/catalog":
        setActiveMenu("catalog");
        break;
      case "/admin/upload":
        setActiveMenu("General");
        break;
      case "/cart":
        setActiveMenu("Your Cart");
        break;
      // case "Others":
      //   setActiveMenu("Others");
      //   break;
      case "Orders":
        console.log("Orders");
        setActiveMenu("Orders");
        break;
      // default:
      //   setActiveMenu("Dashboard");
    }
  }, [location.pathname, MenuName]);
  const catalogId = React.useId();
  const handleBranchSelect = async (e) => {
    const newBranchId = e.target.value;
    const currentBranchId = selectedLocation;
    if (newBranchId === currentBranchId) return;
    const selectedBranch = branches.find(
      (b) => String(b.value) === String(newBranchId)
    );
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: 1,
        pageSize: 100,
        sortBy: "id",
        sortOrder: "asc",
        filters: JSON.stringify({
          user_id: userId,
          customer_id: customerId,
        }),
      });
      const response = await fetch(
        `${API_BASE_URL}/cart/pagination?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch cart items");
      const result = await response.json();
      const cartItems = result?.data?.data || [];
      const cartBranchIds = [
        ...new Set(
          cartItems.map((item) => String(item.branch_id || item.branchId))
        ),
      ];

      if (
        cartBranchIds.length === 0 ||
        (cartBranchIds.length === 1 && cartBranchIds[0] === newBranchId)
      ) {
        setSelectedLocation(newBranchId);
        setSelectedBranchLocation(newBranchId)
        if (selectedBranch) {
          setSelectedBranchRegion(selectedBranch.branchRegion || "");
          setSelectedBranchCity(selectedBranch.branchCity || "");
        }
        return;
      }

      const otherBranchId = cartBranchIds.find((id) => id !== newBranchId);
      if (otherBranchId) {
        const otherBranch = branches.find(
          (branch) => String(branch.value) === String(otherBranchId)
        );
        const otherBranchLabel = otherBranch
          ? otherBranch.label
          : otherBranchId;

        const { isConfirmed } = await Swal.fire({
          icon: "warning",
          title: t("Discard items?"),
          html: `${t(
            "There are items in the cart for branch"
          )} <strong>${otherBranchLabel}</strong>.<br>${t(
            "Do you want to discard them?"
          )}`,
          showCancelButton: true,
          focusCancel: true,
          confirmButtonText: t("Yes, discard"),
          cancelButtonText: t("No, keep"),
          reverseButtons: true,
        });

        if (isConfirmed) {
          try {
            await fetch(
              `${API_BASE_URL}/cart/delete?customer_id=${customerId}&branch_id=${otherBranchId}`,
              {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            setSelectedLocation(newBranchId);
            setSelectedBranchLocation(newBranchId)
            if (selectedBranch) {
              setSelectedBranchRegion(selectedBranch.branchRegion || "");
              setSelectedBranchCity(selectedBranch.branchCity || "");
            }
            await Swal.fire({
              icon: "success",
              title: t("Success"),
              text: t(
                `Items discarded from the cart for branch ${otherBranchLabel}`
              ),
              confirmButtonText: t("OK"),
            });
          } catch (deleteError) {
            await Swal.fire({
              icon: "error",
              title: t("Error"),
              text: t(
                "Failed to discard items from the cart. Please try again."
              ),
              confirmButtonText: t("OK"),
            });
          }
        }
      }
    } catch (error) {
      console.error("Error during branch change:", error);
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t("Error checking cart. Branch change may not work correctly."),
        confirmButtonText: t("OK"),
      });
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/customer-branches/pagination?pageSize=10000`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch branches");
        }
        const result = await response.json();
        let branchData = [];
        if (Array.isArray(result)) {
          branchData = result;
        } else if (result.status === "Ok" && Array.isArray(result.data)) {
          branchData = result.data;
        } else if (result && Array.isArray(result.data)) {
          branchData = result.data;
        }

        const branchOptions = branchData.map((branch) => {
          const status = branch.branchStatus.toLowerCase();
          const isApproved = status === "approved";
          return {
            value: String(branch.id || branch.branch_id),
            label:
              i18n.language === "en"
                ? branch.branch_name_en || branch.branchNameEn
                : branch.branch_name_lc ||
                  branch.branchNameLc ||
                  branch.branch_name_en ||
                  branch.branchNameEn,
            erpBranchId: branch.erpBranchId || branch.erp_branch_id,
            branchRegion: branch.region || branch.region,
            branchCity: branch.city || branch.branchCity || branch.branch_city,
            raw: branch,
            disabled: !isApproved || !branch.erpBranchId,
            branch_name_en: branch.branch_name_en || branch.branchNameEn,
            branch_name_lc: branch.branch_name_lc || branch.branchNameLc,
          };
        });
        setBranches(branchOptions);
      } catch (error) {
        console.error("Error fetching branches:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBranches();
  }, [API_BASE_URL, i18n.language]);
  const handleback =()=>{
    navigate(-1)
  }
 
const handleLogoClick=()=>{
  console.log("user",user)
  if (user?.customerStatus === "new") {
          navigate("/customerDetails", {
            state: { customerId:user?.customerId, mode: "add" },
          });
        } else if (
         user?.userType?.toLowerCase() === "employee" &&
          (user?.designation?.toLowerCase() ===
            Constants.DESIGNATIONS.OPS_COORDINATOR.toLowerCase() ||
           user?.designation?.toLowerCase() ===
              Constants.DESIGNATIONS.OPS_MANAGER.toLowerCase() ||
           user?.designation?.toLowerCase() ===
              Constants.DESIGNATIONS.SALES_EXECUTIVE.toLowerCase() ||
           user?.designation?.toLowerCase() ===
              Constants.DESIGNATIONS.AREA_SALES_MANAGER.toLowerCase() ||
           user?.roles[0].toLowerCase() ===
              Constants.ROLES.SUPER_ADMIN.toLowerCase())
        ) {
          navigate("/customers",{replace:true});
        } else if (
         user?.userType?.toLowerCase() === "employee" &&
          (user?.designation?.toLowerCase() ===
            Constants.DESIGNATIONS.MAINTENANCE_HEAD.toLowerCase() ||
           user?.designation?.toLowerCase() ===
              Constants.DESIGNATIONS.MAINTENANCE_TECHNICIAN.toLowerCase() ||
           user?.designation?.toLowerCase() ===
              Constants.DESIGNATIONS.MAINTENANCE_MANAGER.toLowerCase())
        ) {
          navigate("/maintenance",{replace:true});
        } else if (
         user?.userType?.toLowerCase() === "employee" &&
         user?.designation?.toLowerCase() ===
            Constants.DESIGNATIONS.BRANCH_ACCOUNTANT.toLowerCase()
        ) {
          navigate("/bankTransactions",{replace:true});
        }
        else if (user?.userType?.toLowerCase() === "employee" &&
         user?.designation?.toLowerCase() ===
            Constants.DESIGNATIONS.PRODUCTION_MANAGER.toLowerCase()
        ) {
          navigate("/orders",{replace:true});
        } else {
          // navigate("/catalog",{replace:true});
          navigate("/home",{replace:true});
        }
}



const isMenuLabelActive = (label) => {
  const currentActive = activeMenu?.toLowerCase();
  const currentLabel = label?.toLowerCase();
console.log("currentActive",currentActive)
console.log("currentLabel",currentLabel)
  if (currentLabel === "home" && t(currentActive) === t("catalog")) {
    return true;
  }
 const otherSubItems = ["support", "maintenance", "bank transfer", "bank"];
  if (isMobile && currentLabel === "others" && otherSubItems.includes(currentActive)) {
    return true;
  }

  // Otherwise, use standard direct match
  return currentLabel === currentActive;
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
              onClick={()=>handleLogoClick()}
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
               onClick={()=>handleLogoClick()}
            />
          )}
        </div>
        <div className="sidebar-menu">
          <div className="main-menu-items">
            {menuItems?.filter(({ label }) => label?.toLowerCase() !== "company")
              .map(
                ({ icon, label, permission, isVisible }) =>
                  isV(permission || label) &&
                  label &&
                  isVisible && (
                    <div
                      key={label}
                      className={`menu-item ${
                        isMenuLabelActive(label) ? "active" : ""
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
                      activeMenu ==label ? "active" : ""
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
                  {!isAndroidMobile &&isMobile&& (
i18n.language === "ar" ? <span  className="nav-btn" onClick={()=>handleback()}><ArrowForwardIcon/></span>
:<span className="nav-btn " onClick={()=>handleback()}><ArrowBackIcon/> </span>
                  )}
            {isMobile && (
              <img
                src="/logos/talab_point_logo.png"
                alt="Talab Point Logo"
                className="logo-collapsed"
                style={{ maxWidth: "100%", maxHeight: "100%" }}
                onClick={()=>handleLogoClick()}
              />
            )}

            <div className="header-title">{t(activeMenu)}</div>

            {!isMobile &&searchable && !isMobileResponsive&& <><div 
              style={{
                display: "flex",
                // justifyContent: "space-between",
                gap: "10px",
                width: "100%",
                alignItems:"center"
              }}
            >
                {selectBranch && (<div className="location-selector">
              <SearchableDropdown
                  id={`location-select-${catalogId}`}
                  name="locationSelect"
                  value={selectedLocation}
                  onChange={handleBranchSelect}
                  options={branches?.map((b) => ({
                    ...b,
                    name: b.label || b.name || b.value,
                    disabled: b.disabled,
                  }))}
                  className="location-select"
                  placeholder={t("Select Branch")}
                  disabled={branches?.length === 0}
                />
                {/* {isBranchesLoading && branches.length === 0 && (
                                                <div className="dropdown-loading">
                                                    <LoadingSpinner size="small" />
                                                </div>
                                            )} */}
                {branches?.length === 0 && (
                  <div className="no-branches-message">
                    {t("No branches available")}
                  </div>
                )}
              </div>)}
              {(user?.userType?.toLowerCase() !== "employee" ||
                user?.userType?.toLowerCase() !== "admin") &&goToCart&& (
                <button
                  className={`go-to-cart-btn ${
                    !selectedLocation ? "disabled" : ""
                  }`}
                  style={{
                    opacity: !selectedLocation ? 0.6 : 1,
                    cursor: !selectedLocation ? "not-allowed" : "pointer",
                    position: "relative",
                  }}
                  onClick={handleGoToCart}
                  disabled={!selectedLocation}
                >
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <FontAwesomeIcon
                      icon={faShoppingCart}
                      className="cart-icon"
                    />
                    {cartItemsCount > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-8px",
                          right: "-12px",
                          backgroundColor: "var(--logo-red)",
                          color: "white",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {cartItemsCount}
                      </span>
                    )}
                  </div>
                  {window.innerWidth >= 350 && <span>{t("Go to Cart")}</span>}
                </button>
              )}
            </div></>}
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
                  {/* {user?.userType?.toLowerCase() === "customer" &&
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
                    )} */}
                  {/* {user?.userType?.toLowerCase() === "customer" &&
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
                    )} */}
                </div>
              )}

              <button className="lang-switch-btn" onClick={toggleLanguage} style={{marginRight: t(activeMenu?.toLowerCase()) === t("catalog") ? "60px" : "20px"}}>
                <FontAwesomeIcon icon={faLanguage} />
                <span>{isRTL ? "EN" : "عربى"}</span>
              </button>
            </div>
          </header>
          <div
            className={`content ${homePage ? homePage : ""} ${PaddingClass ? "catalog-padding-removing":""} ${CardPaddingClass ? "card-padding-removing":""}`}
            style={{
              padding: isMobile ? (activeMenu ? "0 0px 0px" : "0 20px") : "20px",
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
                    if (label === "Others") {
                      return showOrdersSubMenu;
                    }
                    return activeMenu === t(label);
                  };

                  return (
                    <div
                      key={label}
                      className={`bottom-menu-item ${
                        isMenuItemActive() ? "active" : ""  
                      }   ${isMenuLabelActive(label) ? "active" : ""}`}
                      onClick={() => handleMenuClick(label)}
                      style={{ position: "relative" }}
                    >
                      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <FontAwesomeIcon icon={icon} />
                        {label === "Your Cart" && cartItemsCount > 0 && (
                          <span
                            style={{
                              position: "absolute",
                              top: "-8px",
                              right: "-12px",
                              backgroundColor: "var(--logo-red)",
                              color: "white",
                              borderRadius: "50%",
                              width: "20px",
                              height: "20px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            {cartItemsCount}
                          </span>
                        )}
                      </div>
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
              {isV("BankTransfer") && (
                <button
                  className="orders-btn"
                  onClick={() => handleMenuClick("Bank")}
                >
                  {t("Bank")} {isV("BankTransfer")}
                </button>
              )}
              <div className="orders-btn" onClick={handleLogout}>
                {/* <FontAwesomeIcon icon={faSignOutAlt} /> */}
                {t("Logout")}
              </div>
            </div>
          )}
        </div>
      </CustomerProvider>
    </div>
  );
}

export default Sidebar;
