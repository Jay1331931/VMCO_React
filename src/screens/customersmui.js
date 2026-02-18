import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/components.css";
import { useTranslation } from "react-i18next";
import ActionButton from "../components/ActionButton";
import ToggleButton from "../components/ToggleButton";
import SearchInput from "../components/SearchInput";
import Pagination from "../components/Pagination";
import Table from "../components/Table";
import Tabs from "../components/Tabs";
import RbacManager from "../utilities/rbac";
import getBusinessDetailsFormData from "./customerDetailsForms/customerBusinessDetails";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import Swal from "sweetalert2";
import SearchableDropdown from "../components/SearchableDropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Chip, Box, Button, Typography, Tooltip } from "@mui/material";
import { formatDate } from "../utilities/dateFormatter";
import {
  DataGrid,
  GridFooterContainer,
  GridPagination,
  useGridApiRef,
} from "@mui/x-data-grid";
import CustomToolbar from "../components/CustomToolbar";
import SyncIcon from "@mui/icons-material/Sync";
import IosShareIcon from "@mui/icons-material/IosShare";
import TableMobile from "../components/TableMobile";
import Constants from "../constants";
import CustomerCard from "../components/CustomerCard";
import InviteCard from "../components/InviteCard";
import { faHeartPulse } from "@fortawesome/free-solid-svg-icons";
import AddInvites from "../components/AddInvites";
import SkeletonWrapper from "../components/SkeletonWrapper";
const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "status-approved";
    case "rejected":
      return "status-rejected";
    default:
      return "status-pending";
  }
};

function Customers() {
  const { t, i18n } = useTranslation();
  const gridApiRef = useGridApiRef();
  const location = useLocation();
  const defaultTab = location.state?.activeTab || "customers";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [filteredApprovals, setFilteredApprovals] = useState([]);
  const [customerContacts, setCustomerContacts] = useState({});
  const [filteredInvites, setFilteredInvites] = useState([]);
  const [customersFiltersInitialized, setCustomersFiltersInitialized] = useState(false);
  const [invitesFiltersInitialized, setInvitesFiltersInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token, user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    name: "",
    email: "",
    company: "",
    mobile: "",
    region: "",
    source: "salesexecutive",
    comments: "",
  });
  const [geoData, setGeoData] = useState(null);
  // Add validation and loading states
  const [inviteErrors, setInviteErrors] = useState({});
  const [isInviteLoading, setIsInviteLoading] = useState(false);
  const [syncLoadingId, setSyncLoadingId] = useState(null);
  const customerTabs = [
    { value: "customers", label: "Customers" },
    { value: "invites", label: "Invites" },
  ];
  const [isApprovalMode, setApprovalMode] = useState(false);
  // const { token, user, isAuthenticated, logout } = useAuth();
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [regionOptions, setRegionOptions] = useState([]);
  const [entityOptions, setEntityOptions] = useState([]);
  const [syncLoading, setSyncLoading] = useState(false);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [invitecolumnVisibilityModel, setInviteColumnVisibilityModel] =
    useState({});
  const [sortModel, setSortModel] = useState([]);
  const [inviteSortModel, setInviteSortModel] = useState([]);
  const [filters, setFilters] = useState({});
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showRowPopup, setShowRowPopup] = useState(false);
  const isArabic = i18n.language === "ar";
  const rbacMgr = new RbacManager(
    user?.userType == "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "custDetailsAdd"
  );
  const role = user?.userType === "employee" ? user?.designation : user?.roles[0]
  const pageName = activeTab === "customers" ? (isApprovalMode ? "customersApproval" : "customers") : "invites";
  const columnWidthsKey = `${pageName}_${role}_columnWidths`;
  const [columnDimensions, setColumnDimensions] = useState({});

  console.log("RBAC Manager:", rbacMgr);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  // const [paymentChangesIsThere, setPaymentChangesIsThere] = useState(false);
  const contentRef = useRef(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const dragStartY = useRef(0);

  useEffect(() => {
    if (activeTab === "customers") {
      const savedFilters = localStorage.getItem('customersFilters');
      if (savedFilters) {
        const parsed = JSON.parse(savedFilters);
        if (parsed.filters) setFilters(parsed.filters);
        if (parsed.searchQuery) setSearchQuery(parsed.searchQuery);
        if (parsed.isApprovalMode !== undefined) setApprovalMode(parsed.isApprovalMode);
      }
      setCustomersFiltersInitialized(true);
    } else if (activeTab === "invites") {
      const savedFilters = localStorage.getItem('invitesFilters');
      if (savedFilters) {
        const parsed = JSON.parse(savedFilters);
        if (parsed.filters) setFilters(parsed.filters);
        if (parsed.searchQuery) setSearchQuery(parsed.searchQuery);
      }
      setInvitesFiltersInitialized(true);
    }
  }, [activeTab]);


  // Save customers filters to localStorage
  useEffect(() => {
    if (!customersFiltersInitialized || activeTab !== "customers") return;
    const filtersToSave = { filters, searchQuery, isApprovalMode };
    localStorage.setItem('customersFilters', JSON.stringify(filtersToSave));
  }, [filters, searchQuery, isApprovalMode, customersFiltersInitialized, activeTab]);

  // Save invites filters to localStorage
  useEffect(() => {
    if (!invitesFiltersInitialized || activeTab !== "invites") return;
    const filtersToSave = { filters, searchQuery };
    localStorage.setItem('invitesFilters', JSON.stringify(filtersToSave));
  }, [filters, searchQuery, invitesFiltersInitialized, activeTab]);

  useEffect(() => {
    if (activeTab === "customers") {
      if (!customersFiltersInitialized) return; // Guard clause
      if (isApprovalMode) {
        setFilteredCustomers([]);
        fetchApprovals(page, searchQuery, filters);
      } else {
        setFilteredApprovals([]);
        fetchCustomers(page, searchQuery, filters);
      }
    } else if (activeTab === "invites") {
      if (!invitesFiltersInitialized) return; // Guard clause
      fetchInvites(page, searchQuery, filters);
    }
  }, [activeTab, isApprovalMode, page, searchQuery, filters, customersFiltersInitialized, invitesFiltersInitialized]);



  useEffect(() => {
    const handleTouchStart = (e) => {
      dragStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;

      // Drag up → hide header
      if (currentY < dragStartY.current - 15) {
        setShowHeader(false);
      }

      // Drag down → show header
      if (currentY > dragStartY.current + 15) {
        setShowHeader(true);
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = contentRef.current?.scrollTop || 0;
      setIsAtTop(scrollTop < 20); // detect near top
    };

    const container = contentRef.current;
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    console.log("isMobile", isMobile);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [showTableMobilePopup, setShowTableMobilePopup] = useState(false);
  const columnsToDisplay = {
    id: t("Registration ID"),
    erpCustId: t("ERP ID"),
    companyNameEn: t("Company"),
    companyType: t("Company Type"),
    typeOfBusiness: t("Type Of Business"),
    customerStatus: t("Status"),
  };
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);
  const getOptionsFromBasicsMaster = async (fieldName) => {
    const params = new URLSearchParams({
      filters: JSON.stringify({ master_name: fieldName }), // Properly stringify the filter
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/basics-masters?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json(); // Don't forget 'await' here

      const options = result.data.map((item) => item.value);
      return options;
    } catch (err) {
      console.error("Error fetching options:", err);
      return []; // Return empty array on error
    }
  };
  const handleResend = async (invite) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/generate-registration-link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            id: invite.id,
          }),
        }
      );
      if (response.ok) {
        const result = await response.json();
        try {
          await fetch(`${API_BASE_URL}/send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify({
              eventName: "WELCOME_EMAIL",
              emailData: {
                to: invite?.companyEmail,
                customerName: invite?.companyName,
                activationLink: result?.data,
              },
            }),
          });
          Swal.fire({
            title: t("Invite Resent"),
            html: `
    <p>${t("The invite has been resent successfully.")}</p>

    <div style="display:flex;align-items:center;border:1px solid #ddd;border-radius:4px;overflow:hidden;">
      <input
        id="invite-link"
        type="text"
        value="${result?.data}"
        readonly
        style="flex:1;border:none;padding:10px 12px;font-size:14px;outline:none;"
      />
      <button
        id="copyInviteBtn"
        style="display:flex;align-items:center;gap:6px;padding:0 12px;height:44px;border:none;border-left:1px solid #ddd;background:#fff;cursor:pointer;transition:all .2s;white-space:nowrap;"
        title="Copy to clipboard"
      >
        <i class="fas fa-copy" style="font-size:14px;color:#666;"></i>
        <span id="copyInviteText" style="font-size:14px;color:#666;">Copy</span>
      </button>
    </div>
  `,
            icon: "success",
            showConfirmButton: true,
            confirmButtonText: "OK",

            didOpen: () => {
              const input = document.getElementById("invite-link");
              const copyBtn = document.getElementById("copyInviteBtn");
              const copyIcon = copyBtn.querySelector("i");
              const copyText = document.getElementById("copyInviteText");

              /* Hover effect */
              copyBtn.addEventListener("mouseenter", () => {
                copyBtn.style.background = "#f5f5f5";
                copyIcon.style.color = "#333";
                copyText.style.color = "#333";
              });

              copyBtn.addEventListener("mouseleave", () => {
                copyBtn.style.background = "#fff";
                copyIcon.style.color = "#666";
                copyText.style.color = "#666";
              });

              /* Copy action */
              copyBtn.addEventListener("click", async () => {
                input.select();
                input.setSelectionRange(0, 99999);

                try {
                  await navigator.clipboard.writeText(input.value);

                  copyIcon.className = "fas fa-check";
                  copyIcon.style.color = "#28a745";
                  copyText.textContent = "Copied!";
                  copyText.style.color = "#28a745";
                  copyBtn.style.background = "#e8f5e9";
                  copyBtn.style.borderLeftColor = "#c3e6cb";

                  setTimeout(() => {
                    copyIcon.className = "fas fa-copy";
                    copyIcon.style.color = "#666";
                    copyText.textContent = "Copy";
                    copyText.style.color = "#666";
                    copyBtn.style.background = "#fff";
                    copyBtn.style.borderLeftColor = "#ddd";
                  }, 2000);
                } catch (err) {
                  copyIcon.className = "fas fa-times";
                  copyIcon.style.color = "#dc3545";
                  copyText.textContent = "Failed!";
                  copyText.style.color = "#dc3545";
                  copyBtn.style.background = "#f8d7da";
                  copyBtn.style.borderLeftColor = "#f5c6cb";

                  setTimeout(() => {
                    copyIcon.className = "fas fa-copy";
                    copyIcon.style.color = "#666";
                    copyText.textContent = "Copy";
                    copyText.style.color = "#666";
                    copyBtn.style.background = "#fff";
                    copyBtn.style.borderLeftColor = "#ddd";
                  }, 2000);
                }
              });
            },
          });

        } catch (err) {
          console.error("Error generating invite link:", err);
          // alert('Failed to generate invite link. Please try again later.');
          Swal.fire({
            title: "Error",
            text: t("Failed to generate invite link. Please try again later."),
            icon: "error",
            confirmButtonText: "OK",
          });
          return;
        }
      }
    } catch (err) {
      // console.error('Error resending in  vite:', err);
      console.log("Error resending invite:", err.message);
      Swal.fire({
        title: "Error",
        text: t("Failed to resend invite. Please try again later."),
        icon: "error",
        confirmButtonText: "OK",
      });
      // alert('Failed to resend invite. Please try again later.');
      return;
    }
    // alert('Invite resent successfully!');
  };
  const clearInviteFields = () => {
    setInviteData({
      name: "",
      email: "",
      company: "",
      mobile: "",
      region: "",
      source: "salesexecutive",
      comments: "",
    });
    setInviteErrors({});
    if (isMobile) {
      navigate('/customers');
    }
  };

  const handleInvite = () => {
    setInviteData((prev) => ({
      ...prev,
      source: "salesexecutive",
    }));
    if (isMobile) {
      navigate('/invite/add')
      // <AddInvites
      //   handleInviteSubmit={handleInviteSubmit}
      //   clearInviteFields={clearInviteFields}
      // />
    } else {
      setIsInviteModalOpen(true);
    }
  };

  const validateInviteData = (data) => {
    const errors = {};
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
      errors.email = t("Invalid email format");
    }
    // Saudi mobile validation (accepts 05XXXXXXXX or 9665XXXXXXXX)
    const saudiMobileRegex = /^\+?[1-9]\d{7,14}$/;
    if (!data.mobile || !saudiMobileRegex.test(data.mobile)) {
      errors.mobile = t("Invalid mobile number.");
    }
    // Name required
    if (!data.name) errors.name = t("This field is required.");
    // Company required
    if (!data.company) errors.company = t("This field is required.");
    // Region required
    if (!data.region) errors.region = t("This field is required.");
    return errors;
  };

  const handleInviteSubmit = async () => {
    setIsInviteLoading(true);

    // Validate fields
    const errors = validateInviteData(inviteData);
    setInviteErrors(errors);
    if (Object.keys(errors).length > 0) {
      setIsInviteLoading(false);
      Swal.fire({
        title: "Error",
        text: t("Please fix the errors before sending invite."),
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    // Check for duplicate email in filteredInvites (Registration table)
    const emailExists = filteredInvites.some(
      (invite) =>
        invite.companyEmail?.toLowerCase() ===
        inviteData.email.trim().toLowerCase()
    );
    if (emailExists) {
      Swal.fire({
        title: "Error",
        text: t("This email is already invited. Please use a different email."),
        icon: "error",
        confirmButtonText: "OK",
      });
      setIsInviteLoading(false); // Stop loading
      return;
    }

    if (
      !inviteData.email ||
      !inviteData.name ||
      !inviteData.company ||
      !inviteData.mobile ||
      !inviteData.source ||
      !inviteData.region ||
      !inviteData.primaryBusinessUnit
    ) {
      Swal.fire({
        title: "Error",
        text: t("Please fill in all fields"),
        icon: "error",
        confirmButtonText: "OK",
      });
      setIsInviteLoading(false); // Stop loading
      return;
    }
    // Add your API call to send the invite
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/registration/staging`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            companyEmail: inviteData.email,
            leadName: inviteData.name,
            companyName: inviteData.company,
            companyPhone: inviteData.mobile,
            region: inviteData.region,
            source: inviteData.source,
            employeeId: user?.employeeId,
            primaryBusinessUnit: inviteData?.primaryBusinessUnit,
            // submissionDate: new Date(),
            comments: inviteData.comments || "",
            registered: false,
          }),
        }
      );
      const result = await response.json();
      console.log(result);
      if (result.status === "Ok") {
        fetchInvites(); // Refresh the invites list
        try {
          const response = await fetch(
            `${API_BASE_URL}/generate-registration-link`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },

              body: JSON.stringify({
                id: result.lead.id,
              }),
            }
          );
          console.log("Response:", response);
          // if (response.status=="Ok") {
          const res = await response.json();
          console.log("Invite link:", res);
          // alert('Invite link: ' + res.data);
          try {
            const result = await fetch(`${API_BASE_URL}/send`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },

              body: JSON.stringify({
                eventName: "WELCOME_EMAIL",
                emailData: {
                  to: inviteData.email,
                  customerName: inviteData.name,
                  lastName: "",
                  activationLink: res.data,
                },
              }),
            });
          } catch (err) {
            console.error("Error generating invite link:", err);
            Swal.fire({
              title: "Error",
              text: "Failed to generate invite link. Please try again later.",
              icon: "error",
              confirmButtonText: "OK",
              confirmButtonColor: "#dc3545",
            });
            return;
          }
          Swal.fire({
            title: t("Invite Link Sent1"),
            html: `
    <p>${t("The invite has been sent successfully.")}</p>
 <div style="display:flex;align-items:center;border:1px solid #ddd;border-radius:4px;overflow:hidden;">
      <input
        id="invite-link"
        type="text"
        value="${result?.data}"
        readonly
        style="flex:1;border:none;padding:10px 12px;font-size:14px;outline:none;"
      />
      <button
        id="copyInviteBtn"
        style="display:flex;align-items:center;gap:6px;padding:0 12px;height:44px;border:none;border-left:1px solid #ddd;background:#fff;cursor:pointer;transition:all .2s;white-space:nowrap;"
        title="Copy to clipboard"
      >
        <i class="fas fa-copy" style="font-size:14px;color:#666;"></i>
        <span id="copyInviteText" style="font-size:14px;color:#666;">Copy</span>
      </button>
    </div>
      
  `,
            icon: "success",
            showConfirmButton: true,
            confirmButtonText: t("OK"),

            didOpen: () => {
              const input = document.getElementById("invite-link");
              const copyBtn = document.getElementById("copyInviteBtn");
              const copyIcon = copyBtn.querySelector("i");
              const copyText = document.getElementById("copyInviteText");

              /* Hover effect */
              copyBtn.addEventListener("mouseenter", () => {
                copyBtn.style.background = "#f5f5f5";
                copyIcon.style.color = "#333";
                copyText.style.color = "#333";
              });

              copyBtn.addEventListener("mouseleave", () => {
                copyBtn.style.background = "#fff";
                copyIcon.style.color = "#666";
                copyText.style.color = "#666";
              });

              /* Copy action */
              copyBtn.addEventListener("click", async () => {
                input.select();
                input.setSelectionRange(0, 99999);

                try {
                  await navigator.clipboard.writeText(input.value);

                  // success state
                  copyIcon.className = "fas fa-check";
                  copyIcon.style.color = "#28a745";
                  copyText.textContent = t("Copied!");
                  copyText.style.color = "#28a745";
                  copyBtn.style.background = "#e8f5e9";
                  copyBtn.style.borderLeftColor = "#c3e6cb";

                  setTimeout(() => {
                    copyIcon.className = "fas fa-copy";
                    copyIcon.style.color = "#666";
                    copyText.textContent = t("Copy");
                    copyText.style.color = "#666";
                    copyBtn.style.background = "#fff";
                    copyBtn.style.borderLeftColor = "#ddd";
                  }, 2000);
                } catch {
                  // error state
                  copyIcon.className = "fas fa-times";
                  copyIcon.style.color = "#dc3545";
                  copyText.textContent = t("Failed!");
                  copyText.style.color = "#dc3545";
                  copyBtn.style.background = "#f8d7da";
                  copyBtn.style.borderLeftColor = "#f5c6cb";

                  setTimeout(() => {
                    copyIcon.className = "fas fa-copy";
                    copyIcon.style.color = "#666";
                    copyText.textContent = t("Copy");
                    copyText.style.color = "#666";
                    copyBtn.style.background = "#fff";
                    copyBtn.style.borderLeftColor = "#ddd";
                  }, 2000);
                }
              });
            },
          });


          // }
        } catch (err) {
          // console.error('Error resending invite:', err);
          console.log("Error sending invite:", err.message);
          Swal.fire({
            title: "Error",
            text: t("Failed to send invite. Please try again later."),
            icon: "error",
            confirmButtonText: "OK",
          });
          // alert('Failed to send invite. Please try again later.');
          return;
        }
      }
    } catch (err) {
      console.error("Error during registration:", error);
    }
    setIsInviteLoading(false); // Stop loading after process
    clearInviteFields();
    setIsInviteModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setInviteData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (inviteErrors[name]) {
      setInviteErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };
  const handleSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
    setPage(1);
    if (!searchTerm) {
      // Reset filters if search term is empty
      if (activeTab === "customers") {
        fetchCustomers();
        // setFilteredCustomers(filteredCustomers);
      } else {
        fetchInvites();
        // setFilteredInvites(filteredInvites);
      }
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    if (activeTab === "customers") {
      fetchCustomers(1, searchLower);
    } else {
      fetchInvites(1, searchLower);
    }
  };

  const searchableFields = [
    "id",
    "erpCustId",
    "companyNameAr",
    "companyNameEn",
    "companyType",
    "customerStatus",
    "typeOfBusiness",
    "customerId"
  ];
  const searchableFieldsInvites = [
    "leadName",
    "source",
    "region",
    "companyName",
    "companyPhone",
    "status"
  ];
  const customerColumns = [
    {
      field: "id",
      headerName: isMobile ? t("ID") : t("Registration ID"),
      include: isV("id"),
      searchable: true,
      width: isMobile ? 50 : (columnDimensions["id"]?.width || 100),
      // flex: isMobile ? undefined : 1, // Remove flex when using fixed width on mobile
      align: isArabic ? 'right' : 'left',
      renderCell: (params) => <span>{params.value}</span>
    },
    {
      field: "erpCustId",
      headerName: t("ERP ID"),
      include: isV("erpCustId"),
      searchable: true,
      width: isMobile ? 70 : columnDimensions["erpCustId"]?.width || 120,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
      renderCell: (params) => { <span>{params.value}</span> }
    },
    {
      field: i18n.language === "ar" ? "companyNameAr" : "companyNameEn",
      headerName: t("Company"),
      include: isV("companyName"),
      searchable: true,
      width: isMobile ? 100 : i18n.language === "ar" ? columnDimensions["companyNameAr"]?.width || 100 : columnDimensions["companyNameEn"]?.width || 100,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
      renderCell: (params) => { <span>{params.value}</span> }
    },
    {
      field: "companyType",
      headerName: isMobile ? t("Type") : t("Company Type"),
      include: isV("companyType"),
      searchable: true,
      width: isMobile ? 80 : columnDimensions["companyType"]?.width || 120,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
      renderCell: (params) => { <span>{params.value}</span> }
    },
    {
      field: "branchCount",
      headerName: t("Branches"),
      include: isV("branchCount"),
      searchable: true,
      // flex: 1,
      width: columnDimensions["branchCount"]?.width || 140,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{t(params.value)}</span>,
    },
    {
      field: "typeOfBusiness",
      headerName: t("Type Of Business"),
      include: isMobile ? false : isV("typeOfBusiness"),
      searchable: true,
      width: columnDimensions["typeOfBusiness"]?.width || 140,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
      renderCell: (params) => { <span>{params.value}</span> }
    },
    {
      field: "createdAt",
      headerName: t("Created Date"),
      include: isV("createdAt"),
      searchable: false,
      width: columnDimensions["createdAt"]?.width || 120,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
      renderCell: (params) =>
        params?.row?.createdAt
          ? formatDate(params?.row?.createdAt, "DD/MM/YYYY")
          : " ",

      // valueFormatter: (params) =>
      //   params.value ? formatDate(params.value, "DD/MM/YYYY") : " ",
    },
    {
      field: "assignedTo",
      headerName: t("Sales Executive ID"),
      include: isV("assignedTo"),
      searchable: true,
      sortable: false,
      width: columnDimensions["assignedTo"]?.width || 120,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
      headerAlign: isArabic ? 'right' : 'left',
      renderCell: (params) => (
        <span>{t(params.row.assignedTo || '')}</span>
      ),
    },
    {
      field: "salesExecutiveName",
      headerName: t("Sales Executive Name"),
      include: isV("salesExecutiveName"),
      searchable: true,
      sortable: false,
      width: columnDimensions["salesExecutiveName"]?.width || 120,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
      headerAlign: isArabic ? 'right' : 'left',
      renderCell: (params) => (
        <span>{t(params.row.salesExecutiveName || '')}</span>
      ),
    },
    {
      field: "currentApprover",
      headerName: t("Current Approver"),
      include: isV("currentApprover"),
      searchable: true,
      sortable: false,
      width: columnDimensions["currentApprover"]?.width || 120,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
      headerAlign: isArabic ? 'right' : 'left',
      renderCell: (params) => (
        <span>{t(params.row.currentApprover || '')}</span>
      ),
    },
    {
      field: "customerStatus",
      headerName: t("Approval Status"),
      include: isMobile ? false : isV("customerStatus"),
      searchable: true,
      width: columnDimensions["customerStatus"]?.width || 100,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
      renderCell: (params) => (
        <label className={getStatusClass(params.value)}>{t(params.value)}</label>
      ),
    },
    {
      field: "FandOSync",
      headerName: t("Action"),
      include: true,//isMobile ? false : isV("FandOSync"),
      searchable: false,
      flex: 1,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const rowdata = params.row;



        return (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            {!params?.row?.erpCustId && params?.row?.customerStatus?.toLowerCase() === "approved" && (
              <Box
                component="span"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!(syncLoading && syncLoadingId === rowdata.id)) {
                    HandleFandOFailCustomer(rowdata.id);
                  }
                }}
                sx={{
                  color:
                    syncLoading && syncLoadingId === rowdata.id
                      ? "text.disabled"
                      : "primary.main",
                  cursor:
                    syncLoading && syncLoadingId === rowdata.id
                      ? "default"
                      : "pointer",
                  fontSize: "0.875rem",
                }}
              >
                <Tooltip
                  title={
                    syncLoading && syncLoadingId === rowdata.id
                      ? t("Syncing...")
                      : t("Sync")
                  }
                  arrow
                >
                  <SyncIcon
                    sx={{
                      opacity:
                        syncLoading && syncLoadingId === rowdata.id ? 0.6 : 1,
                    }}
                  />
                </Tooltip>
              </Box>
            )}
          </Box>
        );
      },
    }

  ];

  // Approval Columns
  const approvalColumns = [
    {
      field: "customerId",
      headerName: t("Registration ID"),
      include: isV("id"),
      searchable: true,
      sortable: false,
      width: columnDimensions["customerId"]?.width || 100,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
      renderCell: (params) => { <span>{params.value}</span> }
    },
    {
      field: "erpCustId",
      headerName: t("ERP ID"),
      include: isV("erpCustId"),
      searchable: true,
      width: columnDimensions["erpCustId"]?.width || 120,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
      renderCell: (params) => { <span>{params.value}</span> }
    },
    {
      field: i18n.language === "ar" ? "companyNameAr" : "companyNameEn",
      headerName: t("Company"),
      include: isV("companyName"),
      searchable: true,
      width: columnDimensions["companyName"]?.width || 150,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
      renderCell: (params) => { <span style={{ textAlign: "center", display: "flex", justifyContent: "center" }}>{params.value}</span> }
    },
    {
      field: "branchCount",
      headerName: t("Branches"),
      include: isV("branchCount"),
      searchable: true,
      // flex: 1,
      width: columnDimensions["branchCount"]?.width || 140,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{t(params.value)}</span>,
    },
    {
      field: "workflowName",
      headerName: t("Workflow Name"),
      include: isV("workflowName"),
      searchable: true,
      width: columnDimensions["workflowName"]?.width || 150,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
      renderCell: (params) => { <span>{params.value}</span> }
    },
    {
      field: "createdAt",
      headerName: t("Created Date"),
      include: isV("createdAt"),
      searchable: false,
      width: columnDimensions["createdAt"]?.width || 120,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
      renderCell: (params) =>
        params?.row?.createdAt
          ? formatDate(params?.row?.createdAt, "DD/MM/YYYY")
          : " ",

      // valueFormatter: (params) =>
      //   params.value ? formatDate(params.value, "DD/MM/YYYY") : " ",
    },
    {
      field: "customerStatus",
      headerName: t("Approval Status"),
      include: isV("customerStatus"),
      searchable: true,
      width: columnDimensions["customerStatus"]?.width || 100,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
      renderCell: (params) => (
        <label className={getStatusClass(params.value)}>{params.value}</label>
      ),
    },
    {
      field: "createdByUsername",
      headerName: t("Created By"),
      include: isV("createdBy"),
      searchable: false,
      sortable: false,
      width: columnDimensions["createdBy"]?.width || 120,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
      renderCell: (params) => { <span>{params.value}</span> }
    },
    {
      field: "salesExecutiveName",
      sortable: false,
      headerName: t("Sales Executive Name"),
      include: isV("salesExecutiveName"),
      searchable: true,
      width: columnDimensions["salesExecutiveName"]?.width || 120,
      // flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <span>{t(params.row.salesExecutiveName || "")}</span>
      ),
    },
    {
      field: "ocApprover",
      sortable: false,
      headerName: t("OC Approver"),
      include: isV("ocApprover"),
      searchable: true,
      width: columnDimensions["ocApprover"]?.width || 120,
      // flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <span>
          {t(
            params.row.currentApprover?.[Constants.DESIGNATIONS.OPS_COORDINATOR.toLowerCase()]?.join(", ") || ""
          )}
        </span>
      ),
    },
    {
      field: "approvalStatus",
      headerName: t("Approval Status"),
      include: isV("approvalStatus"),
      searchable: true,
      width: columnDimensions["approvalStatus"]?.width || 120,
      // flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <label className={getStatusClass(params.value)}>
          {t(params.value)}
        </label>
      ),
    },
    {
      field: "currentApprover",
      sortable: false,
      headerName: t("Current Approver"),
      include: isV("currentApprover"),
      searchable: true,
      width: columnDimensions["currentApprover"]?.width || 120,
      // flex: 1,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => (
        <span>{t(params.row.currentApproverType || "")}</span>
      ),
    },

  ];

  // Invite Columns
  const inviteColumns = [
    {
      field: "createdAt",
      headerName: t("Date"),
      include: isV("createdAt"),
      searchable: true,
      width: columnDimensions["createdAt"]?.width || 120,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
      renderCell: (params) =>
        params?.row?.createdAt
          ? formatDate(params?.row?.createdAt, "DD/MM/YYYY")
          : " ",

      // valueFormatter: (params) =>
      //   params.value ? formatDate(params.value, "DD/MM/YYYY") : " ",
    },
    {
      field: "leadName",
      headerName: t("Customer Name"),
      include: isV("leadName"),
      searchable: true,
      width: columnDimensions["leadName"]?.width || 150,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
    },
    {
      field: "companyEmail",
      headerName: t("Email"),
      include: isV("companyEmail"),
      searchable: true,
      width: columnDimensions["companyEmail"]?.width || 150,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
    },
    {
      field: "companyPhone",
      headerName: t("Phone"),
      include: isV("companyPhone"),
      searchable: true,
      width: columnDimensions["companyPhone"]?.width || 120,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
    },
    {
      field: "companyName",
      headerName: t("Company Name"),
      include: isV("companyName"),
      searchable: true,
      width: columnDimensions["companyName"]?.width || 150,
      // flex: 2,
      align: isArabic ? 'right' : 'left'
    },
    {
      field: "region",
      headerName: t("Region"),
      include: isV("region"),
      searchable: true,
      width: columnDimensions["region"]?.width || 120,
      // flex: 1,
      align: isArabic ? 'right' : 'left'
    },
    {
      field: "status",
      headerName: t("Status"),
      include: isV("status"),
      searchable: true,
      width: columnDimensions["status"]?.width || 120,
      // flex: 1,
      align: isArabic ? 'right' : 'left',
      renderCell: (params) => (
        <label className={getStatusClass(params.value)}>{t(params.value)}</label>
      ),
    },
    {
      field: "employeeId",
      headerName: t("Employee ID"),
      include: isV("employeeId"),
      searchable: true,
      width: columnDimensions["employeeId"]?.width || 150,
      // flex: 1,
      align: isArabic ? 'right' : 'left'
    },
    {
      field: "employeeName",
      headerName: t("Employee Name"),
      include: isV("employeeName"),
      searchable: true,
      width: columnDimensions["employeeName"]?.width || 150,
      // flex: 1,
      align: isArabic ? 'right' : 'left'
    },
    {
      field: "source",
      headerName: t("Source"),
      include: isV("source"),
      searchable: true,
      width: columnDimensions["source"]?.width || 120,
      // flex: 1,
      align: isArabic ? 'right' : 'left'
    },
    {
      field: "actions",
      headerName: t("Action"),
      include: isV("actions"),
      searchable: false,
      flex: 1,
      headerAlign: "center",
      renderCell: (params) => {if( params?.row?.status?.toLowerCase()=="invite pending") return(
        <Box sx={{ display: "flex", gap: 1 }}>
          <Box
            component="span"
            onClick={(e) => {
              e.stopPropagation();
              handleResend(params.row);
            }}
            sx={{
              color: "primary.main",
              cursor: "pointer",
              fontSize: "0.875rem",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            <Tooltip title={t("Resend")} arrow>
              <IosShareIcon />
            </Tooltip>
          </Box>
        </Box>
      )},
    },
  ];

  //  const handlePageChange = (newPage) => {
  //   setPagination(prev => ({ ...prev, page: newPage }));
  // };
  const fetchCustomers = async (
    page = 1,
    searchTerm = "",
    customFilters = {},
    sortedModel = []
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        pageSize,
        search: searchTerm,
        sortBy: sortedModel[0]?.field || "id",
        sortOrder: sortedModel[0]?.sort || "asc",
        filters: JSON.stringify(customFilters),
      });

      const response = await fetch(
        `${API_BASE_URL}/customers/pagination?${params.toString()}`,
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
        setFilteredCustomers(result.data.data);
        // setPagination(prev => ({
        //   ...prev,
        //   page,
        //   // total: result.data.data.length
        // }));
        setTotal(result.data.totalRecords);
      } else {
        throw new Error(response.data.message || "Failed to fetch customers");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };
  const fetchApprovals = async (
    page = 1,
    searchTerm = "",
    customFilters = {},
    sortedModel = []
  ) => {
    setLoading(true);
    setError(null);
    console.log("Fetching approvals");
    try {
      const params = new URLSearchParams({
        page,
        pageSize,
        search: searchTerm,
        // // sortBy: "id",
        // sortOrder: "asc",
        // filters: "{}",
        sortBy: sortedModel[0]?.field || "id",
        sortOrder: sortedModel[0]?.sort || "asc",
        filters: JSON.stringify(customFilters),
      });
      const response = await fetch(
        `${API_BASE_URL}/workflow-instance/pending-customer-approval?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      console.log("API Response:", result);
      if (result.status === "Ok") {
        setFilteredApprovals(result.data.data);
        // setPagination(prev => ({
        //   ...prev,
        //   page,
        //   total: result.data.data.length
        // }));
        setTotal(result.data.totalRecords);
      } else {
        throw new Error(response.data.message || "Failed to fetch approvals");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async (
    page = 1,
    searchTerm = "",
    customFilters = {},
    sortedModel = []
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        pageSize,
        search: searchTerm,
        // sortBy: "id",
        // sortOrder: "asc",
        // filters: "{}",
        sortBy: sortedModel[0]?.field || "id",
        sortOrder: sortedModel[0]?.sort || "asc",
        filters: JSON.stringify(customFilters),
      });

      const response = await fetch(
        `${API_BASE_URL}/customer-registration-staging/pagination?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      console.log("API Response:", result);
      if (result.status === "Ok") {
        const updatedInvites = result.data.data.map((invite) => ({
    ...invite,
    status: invite?.registered ? invite?.customerStatus?.toLowerCase() === "new" ? "Incomplete" : invite?.customerStatus?.toLowerCase() === "pending" ? "Pending Approval": invite?.customerStatus?.toLowerCase() === "blocked" ?  "Approved": invite?.customerStatus: "Invite Pending" ,   // default value
  }));
        setFilteredInvites(updatedInvites);
        // }));
        setTotal(result.data.totalRecords);
      } else {
        console.log(response?.data?.message || "Failed to fetch invites");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching invites:", err);
    } finally {
      setLoading(false);
    }
  };

  // Modified transform function
  function transformCustomerData(customer, customerContacts) {
    // Ensure contacts is always an array
    console.log("customerContacts", customerContacts);
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

    console.log("Customer Contacts Map:", contactsMap);

    return {
      ...customer,
      ...customerContacts,
      isApprovalMode: false,
      workflowData: [],
    };
  }

  const fetchCustomerPaymentMethods = async (customerId, customer) => {
    console.log("fetching customer payment methods");
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/payment-method/id/${customerId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      console.log("API Response:", result);
      if (result.status === "Ok") {
        // if method details values exists Add each method detail field as field name and its value in customer
        if (result.data.methodDetails) {
          Object.keys(result.data.methodDetails).forEach((fieldName) => {
            const newValue = result.data.methodDetails[fieldName];
            if (newValue) {
              customer[fieldName] = newValue;
              if (fieldName === "credit") {
                customer["creditLimit"] = newValue.limit;
                customer["creditPeriod"] = newValue.period;
                customer["creditBalance"] = newValue.balance;
              }
            }
          });
        }
      }
      return customer;
    } catch (err) {
      setError(err.message);
      console.error("Error fetching customer payment methods:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerContacts = async (customerId, customer) => {
    setLoading(true);
    setError(null);
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
      console.log("API Response:", result);
      if (result.status === "Ok") {
        setCustomerContacts(result.data);
        let transformedCustomer = transformCustomerData(customer, result.data);
        transformedCustomer = await fetchCustomerPaymentMethods(
          customerId,
          transformedCustomer
        );
        console.log("Transformed Customer:", transformedCustomer);
        // Navigate to customer details with approval mode if applicable
        if (isApprovalMode) {
          transformedCustomer.isApprovalMode = true;
          transformedCustomer.workflowData = customer.workflowData || [];
        } else {
          transformedCustomer.isApprovalMode = false;
        }
        // navigate(`/customersDetails`, { state: { transformedCustomer, mode: isApprovalMode ? 'edit' : 'add' } });
        return transformedCustomer;
      } else {
        throw new Error(
          response.data.message || "Failed to fetch customer contacts"
        );
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching customer contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "customers") {
      if (!customersFiltersInitialized) return;
      if (isApprovalMode) {
        fetchApprovals(page, searchQuery, filters);
      } else {
        fetchCustomers(page, searchQuery, filters);
      }
    } else if (activeTab === "invites") {
      if (!invitesFiltersInitialized) return;
      fetchInvites(page, searchQuery, filters);
    }
  }, [activeTab, isApprovalMode, page, searchQuery, filters, customersFiltersInitialized, invitesFiltersInitialized]);

  useEffect(() => {
    getOptionsFromBasicsMaster("entity").then(setEntityOptions);
    const fetchGeoData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/geoLocation`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        if (response.ok) {
          const data = await response.json();
          setGeoData(data.data);
          setRegionOptions(
            geoData
              ? Object.keys(geoData).map((region) => ({
                value: region,
                name: region,
              }))
              : []
          );
        }
      } catch (error) {
        console.error("Error fetching geo data:", error);
      }
    };
    fetchGeoData();
  }, []);
  const handleShowAllDetailsClick = async (customer) => {
    let transformedCustomer = await fetchCustomerContacts(
      customer.customerId,
      customer
    );
    navigate(`/customerDetails`, {
      state: {
        customerId: customer.customerId,
        workflowId: transformedCustomer?.workflowData?.id,
        workflowInstanceId: transformedCustomer?.workflowInstanceId,
        mode: isApprovalMode ? "edit" : "add",
        activeTabRequired: isApprovalMode && (transformedCustomer?.workflowId === 2 || transformedCustomer?.workflowId === 4 || transformedCustomer?.workflowId === 6) ? "Branches" : ""
      },
    });
  };
  const handleRowClick = async (params) => {
    let customer = params.row;
    let transformedCustomer = await fetchCustomerContacts(
      customer.customerId,
      customer
    );
    if (isMobile) {
      // setShowTableMobilePopup(true);
      setSelectedRow(params?.row);
      setShowRowPopup(true);
    } else {
      navigate(`/customerDetails`, {
        state: {
          customerId: customer.customerId,
          workflowId: transformedCustomer?.workflowData?.id,
          workflowInstanceId: transformedCustomer?.workflowInstanceId,
          mode: isApprovalMode ? "edit" : "add",
          activeTabRequired: isApprovalMode && (transformedCustomer?.workflowId === 2 || transformedCustomer?.workflowId === 4 || transformedCustomer?.workflowId === 6) ? "Branches" : ""
        },
      });

    }

  };

  const customCellRenderer = {
    primaryContact: (item) => (
      <div className="contact-info">
        <div>{item.primaryContactName}</div>
        <div className="email">{item.primaryContactEmail}</div>
      </div>
    ),
  };

  const renderActionButtons = (invite) => (
    <div className="action-buttons">
      {!invite.registered && (
        <button
          className="action-button resend"
          onClick={() => handleResend(invite)}
        >
          {t("Resend")}
        </button>
      )}
    </div>
  );
  const headerMap = {
  // IDs
  id: "Registration ID",
  erpCustId: "ERP ID",
  salesExecutiveName: "Sales Executive Name",
  currentApprover: "Current Approver",
  // Company
  companyNameEn: "Company Name (EN)",
  companyNameAr: "Company Name (AR)",
  companyType: "Company Type",
  crNumber: "CR Number",
  vatNumber: "VAT Number",
  baladeahLicenseNumber: "Baladeah License #",
  governmentRegistrationNumber: "Government Registration #",
  typeOfBusiness: "Type of Business",
  typeOfBusinessOther: "Type Of Business (Other)",
  deliveryLocations: "Delivery Locations",
  // companyLogo: "Company Logo",
  // brandLogo: "Brand Logo",

  // Brand
  brandNameEn: "Brand Name (EN)",
  brandNameAr: "Brand Name (AR)",

  // Address
  buildingName: "Building Name",
  branch: "Branch Region",
  street: "Street",
  city: "City",
  district: "District",
  cityOther: "City Other",
  districtOther: "District Other",
  region: "Region",
  pincode: "Pincode",
  // geolocation: "Geolocation",

  // Banking & docs
  bankName: "Bank Name",
  bankNameOther: "Bank Name (Other)",
  bankAccountNumber: "Bank Account Number",
  iban: "IBAN",
  // crCertificate: "CR Certificate",
  // vatCertificate: "VAT Certificate",
  // nationalId: "nationalId",
  // bankLetter: "bankLetter",
  // nationalAddress: "nationalAddress",

  // Source & contracts
  customerSource: "Customer Source",
  // acknowledgementSignature: "acknowledgementSignature",
  // contractAgreement: "contractAgreement",
  // contractAgreementShc: "contractAgreementShc",
  // contractAgreementNaqi: "contractAgreementNaqi",
  // contractAgreementGmtc: "contractAgreementGmtc",
  // contractAgreementVmco: "contractAgreementVmco",
  // contractAgreementDar: "contractAgreementDar",
  // creditApplicationShc: "creditApplicationShc",
  // creditApplicationNaqi: "creditApplicationNaqi",
  // creditApplicationGmtc: "creditApplicationGmtc",
  // creditApplicationVmco: "creditApplicationVmco",
  // creditApplicationDar: "creditApplicationDar",
  // customerContract: "customerContract",
  // creditApplication: "creditApplication",

  // Declaration
  declarationName: "Declaration Name",
  // declarationSignature: "declarationSignature",
  declarationDate: "Declaration Date",

  // Pricing Policy
  "pricingPolicy - DAR": "Pricing Policy (DAR)",
  "pricingPolicy - SHC": "Pricing Policy (SHC)",
  "pricingPolicy - GMTC": "Pricing Policy (GMTC)",
  "pricingPolicy - NAQI": "Pricing Policy (NAQI)",
  "pricingPolicy - VMCO": "Pricing Policy (VMCO)",

  // Status / flags
  customerStatus: "Status",
  isDeliveryChargesApplicable: "Is Delivery Charges Applicable",
  isBlocked: "Is Blocked",

  // Assignment
  assignedTo: "Assigned To",
  "assignedToEntityWise - DAR": "Assigned To Entity Wise - DAR",
  "assignedToEntityWise - SHC": "Assigned To Entity Wise - SHC",
  "assignedToEntityWise - GMTC": "Assigned To Entity Wise - GMTC",
  "assignedToEntityWise - NAQI": "Assigned To Entity Wise - NAQI",
  "assignedToEntityWise - VMCO": "Assigned To Entity Wise - VMCO",
  // nonTradingDocuments: "Non Trading Documents",
  interCompany: "Inter Company",
  entity: "Entity",
  primaryBusinessUnit: "Primary Business Unit",
  zone: "Zone",
  verifiedBy: "Verified By",

  // Workflow dates
  registration: "Registration Date",
  verified: "Verified Date",
  approved: "Approved Date",
  // onboardTour: "onboardTour",
  // tapCustId: "tapCustId",
  sequenceId: "Sequence ID",
  createdAt: "Created Date",
  updatedAt: "Updated Date",
  createdBy: "Created By",
  modifiedBy: "Modified By",
  // consent: "consent",
  branchCount: "Branch Count",
  // customerId: "customerId",

  // Contacts – Business Head
  businessHeadName: "Business Head Name",
  businessHeadDesignation: "Business Head Designation",
  businessHeadEmail: "Business Head Email",
  businessHeadMobile: "Business Head Mobile",

  // Contacts – Finance Head
  financeHeadName: "Finance Head Name",
  financeHeadDesignation: "Finance Head Designation",
  financeHeadEmail: "Finance Head Email",
  financeHeadMobile: "Finance Head Mobile",

  // Contacts – Purchasing Head
  purchasingHeadName: "Purchasing Head Name",
  purchasingHeadDesignation: "Purchasing Head Designation",
  purchasingHeadEmail: "Purchasing Head Email",
  purchasingHeadMobile: "Purchasing Head Mobile",

  // Contacts – Primary
  primaryContactName: "Primary Contact Name",
  primaryContactDesignation: "Primary Contact Designation",
  primaryContactEmail: "Primary Contact Email",
  primaryContactMobile: "Primary Contact Mobile",

  // Workflow
  // isApprovalMode: "Is Approval Mode",
  // workflowData: "Workflow Data",

  /* ================= PAYMENT ================= */

// COD
codLimit: "COD Limit",
codAllowed: "COD Allowed",

// Prepayment / Partial
prepaymentAllowed: "Prepayment Allowed",
partialpaymentAllowed: "Partial Payment Allowed",

// Credit DAR
creditDarLimit: "DAR Credit Limit",
creditDarPeriod: "DAR Credit Period",
creditDarAllowed: "DAR Credit Allowed",

// Credit SHC
creditShcLimit: "SHC Credit Limit",
creditShcPeriod: "SHC Credit Period",
creditShcAllowed: "SHC Credit Allowed",

// Credit GMTC
creditGmtcLimit: "GMTC Credit Limit",
creditGmtcPeriod: "GMTC Credit Period",
creditGmtcAllowed: "GMTC Credit Allowed",

// Credit NAQI
creditNaqiLimit: "NAQI Credit Limit",
creditNaqiPeriod: "NAQI Credit Period",
creditNaqiAllowed: "NAQI Credit Allowed",

// Credit VMCO
creditVmcoLimit: "VMCO Credit Limit",
creditVmcoPeriod: "VMCO Credit Period",
creditVmcoAllowed: "VMCO Credit Allowed",


  // Geo
  "geolocation - x": "Latitude",
  "geolocation - y": "Longitude",
};

const formatValue = (value) => {
  if ((typeof value === "boolean")
     || (typeof value === "string" && (value.toLowerCase() === "true" || value.toLowerCase() === "false"))) {
    if(typeof value === "boolean")
      return value ? "Yes" : "No";
    else
      return typeof value === "string" && value.toLowerCase() === "true" ? "Yes" : "No";
  }
  return value;
};

const prettifyHeaders = (row) => {
  const output = {};

  Object.keys(headerMap).forEach((key) => {
    if (row[key] !== undefined) {
      output[headerMap[key]] = formatValue(row[key]);
    }
  });

  return output;
};

const flattenObject = (obj, parentKey = "", result = {}) => {
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;

    const newKey = parentKey ? `${parentKey} - ${key}` : key;
    const value = obj[key];

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      flattenObject(value, newKey, result);
    } else {
      result[newKey] =
        value === null || value === undefined ? "" : value;
    }
  }
  return result;
};

const downloadCustomersAsExcel = async () => {
  const confirm = await Swal.fire({
    title: t("Confirm Download?"),
    text: t("Are you sure you want to download customers?"),
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: t("Yes, download"),
    cancelButtonText: t("No, cancel"),
  });

  if (!confirm.isConfirmed) return;

  try {
    setLoading(true);

    /* -------- Show same loading message -------- */
    Swal.fire({
      title: t("Preparing Export"),
      text: t("Fetching customer details, please wait..."),
      icon: "info",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    const params = new URLSearchParams({
      search: searchQuery,
      sortBy: "id",
      sortOrder: "asc",
      filters: JSON.stringify(filters),
    });

    const response = await fetch(
      `${API_BASE_URL}/customers/export?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    /* -------- Receive file as blob -------- */
    const blob = await response.blob();

    if (!blob || blob.size === 0) {
      throw new Error("Empty file received");
    }

    /* -------- Extract filename from header -------- */
    const contentDisposition = response.headers.get("Content-Disposition");

let filename = "customers_export.xlsx";

if (contentDisposition) {
  // RFC 5987 (filename*=)
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) {
    filename = decodeURIComponent(utf8Match[1]);
  } else {
    // Normal filename=
    const asciiMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
    if (asciiMatch) {
      filename = asciiMatch[1];
    }
  }
}


    /* -------- Download file -------- */
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    Swal.fire({
      title: t("Export Successful"),
      text: t("Customers exported successfully."),
      icon: "success",
    });
  } catch (error) {
    console.error(error);
    Swal.fire({
      title: t("Export Failed"),
      text: error.message || t("Failed to export customers."),
      icon: "error",
    });
  } finally {
    setLoading(false);
  }
};



  const customerMenuItems = [
    {
      key: "download customers",
      label: t("Download Customers"),
      onClick: downloadCustomersAsExcel,
      visible: isV("btnDownloadCustomers"),
    },
  ];
  const visibleColumns = isApprovalMode
    ? approvalColumns.filter((col) => col?.include)
    : customerColumns.filter((col) => col?.include);
  const filteredData = visibleColumns?.filter((item) =>
    searchableFields?.includes(item?.field)
  );
  const filertInvites = inviteColumns
    .filter((col) => col.include)
    ?.filter((item) => searchableFieldsInvites?.includes(item?.field));
  const totalPages = Number.isFinite(total) && Number.isFinite(pageSize) && total > 0 && pageSize > 0
    ? Math.ceil(total / pageSize)
    : 1;
  const renderContent = () => {
    const handleSortModelChange = (model) => {
      setSortModel(model);
      if (isApprovalMode) {
        fetchApprovals(page, searchQuery, filters, model);
      } else {
        fetchCustomers(page, searchQuery, filters, model);
      }
    };

    const handleInviteSortModelChange = (model) => {
      setInviteSortModel(model);
      fetchInvites(page, searchQuery, filters, model);
    };

    switch (activeTab) {
      case t("customers"):
        const customerColumnsToUse = visibleColumns;

        return isMobile ?
          (
            <div className="orders-content">
              {
              // loading ? (
              //   <LoadingSpinner />
              // ) : 
              error ? (
                <div className="error-message">{error}</div>
              ) : (
                <>
                  <div
                    className={`card-fixed-header ${showHeader ? "show" : "show"}`}
                  >
                    <Tabs
          tabs={customerTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="page-header">

        </div>
                    <TableMobile
                      columns={customerColumnsToUse}
                      allColumns={isApprovalMode ? approvalColumns : customerColumns}
                      data={isApprovalMode ? paginatedApprovals : paginatedCustomers}
                      showAllDetails={true}
                      handleAllDetailsClick={handleShowAllDetailsClick}
                      selectedRow={selectedRow}
                      setSelectedRow={setSelectedRow}
                      showRowPopup={showRowPopup}
                      setShowRowPopup={setShowRowPopup}
                      disableExtendRowFullWidth={true}
                      dataGridComponent={
                        <DataGrid
                          rows={[]}
                          columns={[]}
                          pageSize={pageSize}
                          rowCount={total}
                          getRowId={(row) => row?.workflowInstanceId || row?.id}
                          onRowClick={handleRowClick}
                          columnVisibilityModel={columnVisibilityModel}
                          onColumnVisibilityModelChange={setColumnVisibilityModel}
                          sortModel={sortModel}
                          onSortModelChange={handleSortModelChange}
                          disableSelectionOnClick
                          disableColumnMenu
                          hideFooter={true}
                          hideFooterPagination={true}
                          disableExtendRowFullWidth={true}
                          pagination={false}
                          autoHeight
                          rowHeight={55}
                          showToolbar
                          slots={{
                            toolbar: () => (
                              <CustomToolbar
                                searchQuery={searchQuery}
                                filterAnchor={filterAnchor}
                                onSearch={handleSearch}
                                setSearchQuery={setSearchQuery}
                                setFilterAnchor={setFilterAnchor}
                                handleFilterChange={handleFilterChange}
                                onColumnVisibilityChange={setColumnVisibilityModel}
                                columns={filteredData}
                                filters={filters}
                                columnVisibilityModel={columnVisibilityModel}
                                searchPlaceholder="Search customers..."
                                showColumnVisibility={false}
                                showFilters={false}
                                showExport={false}
                                showUpload={false}
                                showApproval={true}
                                columnsToDisplay={columnsToDisplay}
                                handleApproval={handleApproval}
                                isApprovalMode={isApprovalMode}
                              />
                            ),
                          }}
                          sx={{
                            border: "none !important",
                            "& .MuiDataGrid-overlay": {
                              display: "none !important", // ✅ hides “No rows” message
                            },
                            "& .MuiDataGrid-row": {
                              display: "none !important",
                            },
                            ".MuiDataGrid-cell": {
                              display: "none !important",
                            },
                            "& .MuiDataGrid-main": {
                              display: "none", // ✅ hides the main grid body
                            },
                            "& .MuiDataGrid-toolbar": {
                              padding: "0px 8px",
                              gap: "10px",
                              border: "none",
                            },

                            "&.catalog-datagrid": {
                              border: "2px solid black",
                              borderRadius: "8px",
                              backgroundColor: "#f8f9fa",
                            },
                          }}
                        />
                      }
                    />
                  </div>
                  <SkeletonWrapper loading={loading} type="order_card" count={4}>
                  <CustomerCard
                    customers={isApprovalMode ? paginatedApprovals : paginatedCustomers}
                    isApprovalMode={isApprovalMode}
                    handleViewDetails={handleShowAllDetailsClick}
                    handleSync={HandleFandOFailCustomer}
                  />
                  </SkeletonWrapper>
                </>
              )}
            </div>
          )
          : (
            <div className="table-container">
              {
              // loading ? (
              //   <div className="loading-container" style={{ position: "absolute", top: "50%", left: "50%" }}>
              //     <LoadingSpinner size="medium" />
              //   </div>
              // ) : 
              error ? (
                <div className="error-message">{error}</div>
              ) : (
                <>
                  {/* Fixed height container with proper toolbar spacing and scrollable rows */}
                  <div style={{
                    //height: '380px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <SkeletonWrapper loading={loading} type="table" rows={10} columns={5}>
                    <DataGrid
                      apiRef={gridApiRef}
                      rows={isApprovalMode ? paginatedApprovals : paginatedCustomers}
                      columns={customerColumnsToUse}
                      pageSize={pageSize}
                      rowCount={total}
                      getRowId={(row) => row?.workflowInstanceId || row?.id}
                      onRowClick={handleRowClick}
                      columnVisibilityModel={columnVisibilityModel}
                      onColumnVisibilityModelChange={handleColumnVisibilityChange}
                      columnDimensions={columnDimensions}
                      onColumnResize={handleColumnResize}
                      sortModel={sortModel}
                      onSortModelChange={handleSortModelChange}
                      disableSelectionOnClick
                      disableColumnMenu
                      hideFooter={true}
                      hideFooterPagination={true}
                      pagination={false}
                      rowHeight={55}
                      showToolbar
                      slots={{
                        toolbar: () => (
                          <CustomToolbar
                            searchQuery={searchQuery}
                            filterAnchor={filterAnchor}
                            onSearch={handleSearch}
                            setSearchQuery={setSearchQuery}
                            setFilterAnchor={setFilterAnchor}
                            handleFilterChange={handleFilterChange}
                            onColumnVisibilityChange={setColumnVisibilityModel}
                            columns={filteredData}
                            filters={filters}
                            columnVisibilityModel={columnVisibilityModel}
                            searchPlaceholder="Search customers..."
                            showColumnVisibility={true}
                            showFilters={true}
                            showExport={isApprovalMode ? true : true}
                            showUpload={false}
                            showApproval={true}
                            columnsToDisplay={columnsToDisplay}
                            handleApproval={handleApproval}
                            handleExportClick={isApprovalMode ? handleExportData : downloadCustomersAsExcel}
                            isApprovalMode={isApprovalMode}
                          />
                        ),
                      }}
                      sx={{
                        // Flex grow to fill available space
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',

                        '& .MuiDataGrid-toolbar': {
                          padding: '0px 8px  !important',
                          minHeight: '56px !important',
                          flexShrink: 0,
                        },

                        '& .MuiDataGrid-main': {
                          flex: 1,
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                        },

                        // Ensure only the virtual scroller (rows) is scrollable
                        '& .MuiDataGrid-virtualScroller': {
                          //overflow: 'auto !important',
                          flex: 1,
                        },

                        // Keep headers sticky and non-scrollable
                        '& .MuiDataGrid-columnHeaders': {
                          //position: 'sticky',
                          top: 0,
                          zIndex: 1,
                          backgroundColor: 'white',
                          borderBottom: '1px solid #e0e0e0',
                          flexShrink: 0, // Prevent header from shrinking
                        },

                        '& .MuiDataGrid-row': {
                          cursor: "pointer",
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.04)",
                          },
                        },

                        // Arabic RTL styling
                        ...(isArabic && {
                          direction: "rtl",
                          "& .MuiDataGrid-cell": {
                            textAlign: "right !important",
                          },
                          "& .MuiDataGrid-columnHeader": {
                            textAlign: "right !important",
                          },
                          "& .MuiDataGrid-columnHeaderTitle": {
                            textAlign: "right !important",
                          },
                          "& .MuiDataGrid-cellContent": {
                            textAlign: "right !important",
                          }
                        }),

                        // Default LTR styling (left alignment)
                        ...(!isArabic && {
                          "& .MuiDataGrid-cell": {
                            textAlign: "left",
                          },
                          "& .MuiDataGrid-columnHeader": {
                            textAlign: "left",
                          },
                          "& .MuiDataGrid-columnHeaderTitle": {
                            textAlign: "left",
                          },
                          "& .MuiDataGrid-cellContent": {
                            textAlign: "left",
                          }
                        })
                      }}
                    />
                    </SkeletonWrapper>
                  </div>
                </>
              )}
            </div>
          );

      case t("invites"):
        return isMobile ?
          (
            <div className="orders-content">
              {
              // loading ? (
              //   <LoadingSpinner />
              // ) : 
              error ? (
                <div className="error-message">{error}</div>
              ) : (
                <>
                  <div
                    className="catalog-fixed-header"
                    style={{
                      top: isAtTop ? "60px" : "0px", // 👈 adjust height of filter-section
                      position: "sticky",
                      zIndex: 20,
                      transition: "top 0.3s ease",
                      background: "#fff",
                    }}
                  >
                    <Tabs
          tabs={customerTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="page-header">

        </div>
                    <TableMobile
                      columns={inviteColumns}
                      allColumns={inviteColumns}
                      data={paginatedInvites}
                      showAllDetails={true}
                      handleAllDetailsClick={handleShowAllDetailsClick}
                      selectedRow={selectedRow}
                      setSelectedRow={setSelectedRow}
                      showRowPopup={showRowPopup}
                      setShowRowPopup={setShowRowPopup}
                      disableExtendRowFullWidth={true}
                      dataGridComponent={
                        <DataGrid
                          apiRef={gridApiRef}
                          rows={[]}
                          columns={[]}
                          pageSize={pageSize}
                          rowCount={total}
                          columnVisibilityModel={invitecolumnVisibilityModel}
                          onColumnVisibilityModelChange={setInviteColumnVisibilityModel}
                          columnDimensions={columnDimensions}
                          onColumnResize={handleColumnResize}
                          sortModel={inviteSortModel}
                          onSortModelChange={handleInviteSortModelChange}
                          disableSelectionOnClick
                          disableColumnMenu
                          hideFooter={true}
                          hideFooterPagination={true}
                          disableExtendRowFullWidth={true}
                          pagination={false}
                          rowHeight={55}
                          showToolbar
                          slots={{
                            toolbar: () => (
                              <CustomToolbar
                                searchQuery={searchQuery}
                                filterAnchor={filterAnchor}
                                onSearch={handleSearch}
                                setSearchQuery={setSearchQuery}
                                setFilterAnchor={setFilterAnchor}
                                handleFilterChange={handleFilterChange}
                                onColumnVisibilityChange={handleColumnVisibilityChange}
                                columns={filertInvites}
                                filters={filters}
                                columnVisibilityModel={columnVisibilityModel}
                                searchPlaceholder="Search invites..."
                                showColumnVisibility={false}
                                showFilters={false}
                                showExport={false}
                                showUpload={false}
                                showApproval={false}
                                showAdd={isV("btnAddInvite")}
                                buttonName={t("invite")}
                                handleAddClick={handleInvite}
                                columnsToDisplay={columnsToDisplay}
                                handleApproval={handleApproval}
                                isApprovalMode={false}
                              />
                            ),
                          }}
                          sx={{
                            border: "none !important",
                            "& .MuiDataGrid-overlay": {
                              display: "none !important", // ✅ hides “No rows” message
                            },
                            "& .MuiDataGrid-row": {
                              display: "none !important",
                            },
                            ".MuiDataGrid-cell": {
                              display: "none !important",
                            },
                            "& .MuiDataGrid-main": {
                              display: "none", // ✅ hides the main grid body
                            },
                            "& .MuiDataGrid-toolbar": {
                              padding: "0px",
                              gap: "10px",
                              border: "none",
                            },

                            "&.catalog-datagrid": {
                              border: "2px solid black",
                              borderRadius: "8px",
                              backgroundColor: "#f8f9fa",
                            },
                          }}
                        />
                      }
                    />
                  </div>
                  <SkeletonWrapper loading={loading} type="order_card" count={4}>
                  <InviteCard
                    invites={paginatedInvites}
                    handleResend={handleResend}
                  />
                  </SkeletonWrapper>
                </>
              )}
            </div>
          )
          :
          (
            <div className="table-container">
              {
              // loading ? (
              //   <div className="loading-container" style={{ position: "absolute", top: "50%", left: "50%" }}>
              //     <LoadingSpinner size="medium" />
              //   </div>
              // ) : 
              error ? (
                <div className="error-message">{error}</div>
              ) : (
                <>
                  {/* Fixed height container with proper toolbar spacing and scrollable rows */}
                  <div style={{
                    //height: '400px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <SkeletonWrapper loading={loading} type="table" rows={10} columns={5}>
                    <DataGrid
                      apiRef={gridApiRef}
                      rows={paginatedInvites}
                      columns={inviteColumns}
                      pageSize={pageSize}
                      rowCount={total}
                      columnVisibilityModel={invitecolumnVisibilityModel}
                      onColumnVisibilityModelChange={setInviteColumnVisibilityModel}
                      columnDimensions={columnDimensions}
                      onColumnResize={handleColumnResize}
                      sortModel={inviteSortModel}
                      onSortModelChange={handleInviteSortModelChange}
                      disableSelectionOnClick
                      disableColumnMenu
                      hideFooter={true}
                      hideFooterPagination={true}
                      disableExtendRowFullWidth={true}
                      pagination={false}
                      rowHeight={55}
                      showToolbar
                      slots={{
                        toolbar: () => (
                          <CustomToolbar
                            searchQuery={searchQuery}
                            filterAnchor={filterAnchor}
                            onSearch={handleSearch}
                            setSearchQuery={setSearchQuery}
                            setFilterAnchor={setFilterAnchor}
                            handleFilterChange={handleFilterChange}
                            onColumnVisibilityChange={handleColumnVisibilityChange}
                            columns={filertInvites}
                            filters={filters}
                            columnVisibilityModel={columnVisibilityModel}
                            searchPlaceholder="Search invites..."
                            showColumnVisibility={true}
                            showFilters={true}
                            showExport={false}
                            showUpload={false}
                            showApproval={false}
                            showAdd={isV("btnAddInvite")}
                            buttonName={t("invite")}
                            handleAddClick={handleInvite}
                            columnsToDisplay={columnsToDisplay}
                            handleApproval={handleApproval}
                            isApprovalMode={false}
                            dropdownColumns = {{status: [
    { value: "new", label: Constants.INVITE_STATUS.INCOMPLETE },
    { value: "pending",  label: Constants.INVITE_STATUS.PENDING_APPROVAL },
    { value: "approved", label: Constants.INVITE_STATUS.APPROVED },
    { value: "notregistered", label: Constants.INVITE_STATUS.INVITE_PENDING },
  ],}}
                            excludeFiltersFromChips = {["status"]}
                          />
                        ),
                      }}
                      sx={{
                        // Flex grow to fill available space
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',

                        '& .MuiDataGrid-toolbar': {
                          padding: '0px 8px  !important',
                          minHeight: '56px !important',
                          flexShrink: 0,
                        },

                        '& .MuiDataGrid-main': {
                          flex: 1,
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                        },

                        // Ensure only the virtual scroller (rows) is scrollable
                        '& .MuiDataGrid-virtualScroller': {
                          //overflow: 'auto !important',
                          flex: 1,
                        },

                        // Keep headers sticky and non-scrollable
                        '& .MuiDataGrid-columnHeaders': {
                          //position: 'sticky',
                          top: 0,
                          zIndex: 1,
                          backgroundColor: 'white',
                          borderBottom: '1px solid #e0e0e0',
                          flexShrink: 0, // Prevent header from shrinking
                        },

                        '& .MuiDataGrid-row': {
                          cursor: "pointer",
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.04)",
                          },
                        },

                        // Arabic RTL styling
                        ...(isArabic && {
                          direction: "rtl",
                          "& .MuiDataGrid-cell": {
                            textAlign: "right !important",
                          },
                          "& .MuiDataGrid-columnHeader": {
                            textAlign: "right !important",
                          },
                          "& .MuiDataGrid-columnHeaderTitle": {
                            textAlign: "right !important",
                          },
                          "& .MuiDataGrid-cellContent": {
                            textAlign: "right !important",
                          }
                        }),

                        // Default LTR styling (left alignment)
                        ...(!isArabic && {
                          "& .MuiDataGrid-cell": {
                            textAlign: "left",
                          },
                          "& .MuiDataGrid-columnHeader": {
                            textAlign: "left",
                          },
                          "& .MuiDataGrid-columnHeaderTitle": {
                            textAlign: "left",
                          },
                          "& .MuiDataGrid-cellContent": {
                            textAlign: "left",
                          }
                        })
                      }}
                    />
                  </SkeletonWrapper>
                  </div>

                </>
              )}
            </div>
          );
      default:
        return null;
    }
  };

  const paginatedCustomers = filteredCustomers;
  const paginatedApprovals = filteredApprovals;
  const paginatedInvites = filteredInvites;
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
    setFilterAnchor(null);
  };
  const HandleFandOFailCustomer = async (customerId) => {
    setSyncLoadingId(customerId);
    setSyncLoading(true);
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/customers/fando_sync_customer?customerId=${customerId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data?.success) {
        fetchCustomers();
        Swal.fire({
          title: t("Success"),
          text: data.message,
          icon: "success",
          confirmButtonText: t("OK"),
          confirmButtonColor: "#3085d6",
        });
      } else {
        Swal.fire({
          title: t("Error"),
          text: data.message || t("Failed to Sync with FandO."),
          icon: "error",
          confirmButtonText: t("OK"),
          confirmButtonColor: "#dc3545",
        });
      }
    } catch (error) {
      console.error("Error handling FandO fail customer:", error);
      Swal.fire({
        title: t("Error"),
        text: error.message || t("Failed to Sync with FandO."),
        icon: "error",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#dc3545",
      });
    } finally {
      setSyncLoading(false);
      setSyncLoadingId(null);
    }
  };

  const handleApproval = (mode) => {
    setFilters({});
    setApprovalMode(mode === "approval");
    if (mode === "approval") {
      fetchApprovals();
    } else {
      fetchCustomers();
    }
  };

  const handleExportData = async () => {
    try {
      const params = new URLSearchParams({
        page: page,
        pageSize: pageSize,
        search: searchQuery,
        sortBy: sortModel[0]?.field || 'id',
        sortOrder: sortModel[0]?.sort || 'asc',
        filters: JSON.stringify(filters),
        isdownload: 'true'
      });

      const apiUrl = `${API_BASE_URL}/customers/get-approval-history?${params.toString()}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate(user?.userType === 'customer' ? '/login' : '/login-employee');
          return;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'approval_history.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('Excel file downloaded successfully');

    } catch (error) {
      console.error('Error downloading approval history:', error);
    }
  };

  const storageKey = `${pageName}_${role}_columns`;
  useEffect(() => {
    const savedModel = localStorage.getItem(storageKey);
    if (savedModel) {
      setColumnVisibilityModel(JSON.parse(savedModel));
    }
  }, [storageKey]);
  const handleColumnVisibilityChange = (newModel) => {
    setColumnVisibilityModel(newModel);
    localStorage.setItem(storageKey, JSON.stringify(newModel));
  };

  useEffect(() => {
    const savedDimensions = localStorage.getItem(columnWidthsKey);
    if (savedDimensions) {
      setColumnDimensions(JSON.parse(savedDimensions));
    }
  }, [columnWidthsKey]);
  const handleColumnResize = (params) => {
    const { colDef } = params;
    setColumnDimensions(prev => {
      const newDimensions = {
        ...prev,
        [colDef.field]: { width: colDef.width }
      };
      localStorage.setItem(columnWidthsKey, JSON.stringify(newDimensions));
      return newDimensions;
    });
  };
  return (
    <Sidebar title={t("Customers")} CardPaddingClass={isMobile}>
      <div className="customer-content">
        {!isMobile && (<><Tabs
          tabs={customerTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="page-header">

        </div></>)}
        {renderContent()}

        {isInviteModalOpen && !isMobile && (
          <dialog className="invite-dialog" open>
            <h2>{t("Invite")}</h2>

            <div className="form-row-1">
              <div className="form-group-1">
                <label
                  style={{ marginBottom: "6px", display: "inline-block" }}
                >
                  {t("Customer Name")}
                </label>
                <span className="required-field">*</span>
                <input
                  type="text"
                  name="name"
                  value={inviteData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group-1">
                <label
                  style={{ marginBottom: "6px", display: "inline-block" }}
                >
                  {t("Email")}
                </label>
                <span className="required-field">*</span>
                <input
                  type="email"
                  name="email"
                  value={inviteData.email}
                  onChange={handleInputChange}
                  required
                  style={inviteErrors.email ? { borderColor: "red" } : {}}
                />
                {inviteErrors.email && (
                  <div style={{ color: "red", fontSize: "0.8em" }}>
                    {inviteErrors.email}
                  </div>
                )}
              </div>

              <div className="form-group-1">
                <label
                  style={{ marginBottom: "6px", display: "inline-block" }}
                >
                  {t("Company Name")}
                </label>
                <span className="required-field">*</span>
                <input
                  type="text"
                  name="company"
                  value={inviteData.company}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div style={{ flex: "1 1 calc(50% - 0.5rem)" }}>
                <label
                  style={{ marginBottom: "6px", display: "inline-block" }}
                >
                  {t("Phone Number")}
                </label>
                <span className="required-field">*</span>
                <PhoneInput
                  international
                  defaultCountry="SA" // Set your preferred default country
                  withCountryCallingCode={true}
                  countryCallingCodeEditable={false}
                  name="mobile"
                  value={inviteData.mobile}
                  onChange={(value) => {
                    handleInputChange({
                      target: {
                        name: "mobile",
                        value: value,
                      },
                    });
                  }}
                  required
                  style={
                    inviteErrors.mobile
                      ? {
                        borderColor: "red",
                        "--PhoneInput-color--error": "red", // Custom CSS variable for error state
                      }
                      : {}
                  }
                  className={
                    inviteErrors.mobile
                      ? "phone-input-error"
                      : "custom-phone-input"
                  }
                />
                {inviteErrors.mobile && (
                  <div style={{ color: "red", fontSize: "0.8em" }}>
                    {inviteErrors.mobile}
                  </div>
                )}
              </div>

              <div className="form-group-1">
                <label
                  style={{ marginBottom: "6px", display: "inline-block" }}
                >
                  {t("Region")}
                </label>
                <span className="required-field">*</span>
                <SearchableDropdown
                  name="region"
                  options={
                    geoData
                      ? Object.keys(geoData).map((region) => ({
                        value: region,
                        name: region,
                      }))
                      : []
                  }
                  value={inviteData.region}
                  onChange={handleInputChange}
                  placeholder={t("Enter Region")}
                  required
                />
              </div>

              <div className="form-group-1">
                <label
                  style={{ marginBottom: "6px", display: "inline-block" }}
                >
                  {t("Primary Business Unit")}
                </label>
                <span className="required-field">*</span>
                <SearchableDropdown
                  name="primaryBusinessUnit"
                  // options={basicMasterLists?.region || []}
                  options={entityOptions}
                  value={inviteData.primaryBusinessUnit}
                  onChange={handleInputChange}
                  placeholder={t("Enter Primary Business Unit")}
                  required
                />
              </div>

              <div className="form-group-1">
                <label
                  style={{ marginBottom: "6px", display: "inline-block" }}
                >
                  {t("Source")}
                </label>
                <span className="required-field">*</span>
                <select
                  name="source"
                  value={inviteData.source}
                  onChange={handleInputChange}
                  disabled
                  required
                >
                  <option value="">{t("Select a source")}</option>
                  <option value="portal">{t("Portal")}</option>
                  <option value="crm">{t("CRM")}</option>
                  <option value="salesexecutive">
                    {t("Sales Executive")}
                  </option>
                </select>
              </div>

              <div className="form-group-1 full-width">
                <label
                  style={{ marginBottom: "6px", display: "inline-block" }}
                >
                  {t("Comments")}
                </label>
                <textarea
                  name="comments"
                  value={inviteData.comments}
                  onChange={handleInputChange}
                  placeholder={t("Comments...")}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => {
                  setIsInviteModalOpen(false);
                  clearInviteFields();
                }}
                disabled={isInviteLoading}
              >
                {isInviteLoading ? t("Please wait...") : t("Cancel")}
              </button>
              <button
                className="invite-button"
                onClick={handleInviteSubmit}
                disabled={isInviteLoading}
              >
                {isInviteLoading ? t("Sending...") : t("Send Invite")}
              </button>
            </div>
          </dialog>
        )}
      </div>
      {((activeTab === "customers" &&
        paginatedCustomers.length > 0 &&
        !isApprovalMode) ||
        (activeTab === "invites" && paginatedInvites.length > 0) ||
        (activeTab === "customers" &&
          isApprovalMode &&
          paginatedApprovals.length > 0)) && !loading && (
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / pageSize)}
            onPageChange={setPage}
          />
        )}
      <style>{`
      .invite-dialog {
        position: fixed;             
        top: 50%;
        left: 50%;
        transform: translate(-50%, -45%);
        width: 95vw;                 
        max-width: 600px;              
        border: none;
        border-radius: 8px;
        padding: 1rem;
        background: #fff;
        box-shadow: 0 4px 10px rgba(0,0,0,.35);
        max-height: 90vh;              
        overflow-y: auto;              
      }

    
      .invite-dialog h2 {
        font-size: 1.3rem;
        font-weight: 600;
        margin: 0 0 1rem;
      }
      .form-row-1 {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .form-group-1 { flex: 1 1 100%; }
.required-field {
  color: red;
  margin-left: 4px;
}
      @media (min-width: 768px) and (max-width: 1000px) {
       .invite-dialog {         top: 60%;         }
        .form-group-1            { flex: 1 1 calc(50% - 0.5rem); }
        .form-group-1.full-width { flex: 1 1 100%;                 }
      }
         @media (min-width: 320px) and (max-width: 700px)
          {
       .invite-dialog
        {         top: 60%;    
    }}
        .form-group-1            { flex: 1 1 calc(50% - 0.5rem); }
        .form-group-1.full-width { flex: 1 1 100%;                 }
      }

      .form-group-1 label {
        display:block;
        margin-bottom:.4rem;
        font-weight:500;
      }
      .form-group-1 input,
      .form-group-1 select,
      .form-group-1 textarea {
      display: flex;
        width:250px;
        padding:.5rem;
        border:1px solid #ccc;
        border-radius:8px;
        font-size:1rem;
        box-sizing:border-box;
      }
      .form-group-1 textarea { width:100%;
        padding:.5rem;
        border:1px solid #ccc;
        border-radius:8px;
        font-size:1rem;
        box-sizing:border-box;min-height:80px; resize:vertical; }

      .modal-actions {
        margin-top:1.5rem;
        display:flex;
        justify-content:flex-end;
        gap:1rem;
      }
      .cancel-button,
      .invite-button {
        padding:.5rem 1rem;
        font-size:1rem;
        border:none;
        border-radius:4px;
        cursor:pointer;
      }
      .cancel-button { background:#ccc; color:#000; }
      .invite-button { background:#03584d; color:#fff; }
    `}</style>
    </Sidebar>
  );
}

export default Customers;
