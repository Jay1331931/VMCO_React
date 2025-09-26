import maplibregl from "maplibre-gl";
import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisV,
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import Pagination from "../../components/Pagination";
import ApprovalDialog from "../../components/ApprovalDialog";
import RbacManager from "../../utilities/rbac";
import "../../styles/components.css";
import "../../styles/forms.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import BranchDetailsSection from "./branchDetailsSection";
import ContactSection from "./contactSection";
import OperatingHours from "./operatingHours";
import BranchDetailsForm from "./branchDetailsForm";
import { debounce, set } from "lodash";
import Swal from "sweetalert2";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import axios from "axios";
import Constants from "../../constants";
import LoadingSpinner from "../../components/LoadingSpinner";
const CUSTOMER_APPROVAL_CHECKLIST_URL =
  Constants?.DOCUMENTS_NAME?.BRANCH_APPROVAL_CHECKLIST;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const CUSTOMER_APPROVAL_CHECKLIST =
  Constants?.DOCUMENTS_NAME?.BRANCH_APPROVAL_CHECKLIST;
const BRANCH_UPLOAD_FORMAT = Constants?.DOCUMENTS_NAME?.BRANCH_UPLOAD_FORMAT;
const CustomerBranches = ({ customer, setTabsHeight, mode, inApproval }) => {
  const { t, i18n } = useTranslation();
  const contentRef = useRef(null);
  const actionMenuRef = useRef(null);
  const [isActionMenuOpen, setActionMenuOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [branches, setBranches] = useState([]);
  const [branchChanges, setBranchChanges] = useState({});
  const [transformedBranches, setTransformedBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [temporaryBranches, setTemporaryBranches] = useState([]);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  var inApprovalMode = useRef(false); // Use ref to track approval mode
  const [isApprovalMode, setIsApprovalMode] = useState(false);
  const [nextTempId, setNextTempId] = useState(-1);
  const [isFirstBranch, setIsFirstBranch] = useState(false);
  let search = "";
  const isMobile = false;
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const { token, user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const fileExcelInputRef = useRef(null);
  const [popup, setPopup] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  let customerFormMode;
  if (mode === "edit") {
    customerFormMode = "custDetailsEdit";
  } else {
    customerFormMode = "custDetailsAdd";
  }
  const rbacMgr = new RbacManager(
    user?.userType == "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    customerFormMode
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);
  const handleAddBranch = () => {
    setActionMenuOpen(false);
    if (customer?.isBlocked) {
      Swal.fire({
        title: t("Customer is blocked"),
        text: t("You cannot add branches to a blocked customer."),
        icon: "warning",
        confirmButtonText: t("OK"),
      });
      return;
    }
    if (branches.length === 0) {
      setIsFirstBranch(true); // Set flag for first branch
    }
    if (!customer?.erpCustId) {
      Swal.fire({
        title: t("Customer not synced with ERP"),
        text: t("Please sync the customer with ERP before adding branches."),
        icon: "warning",
        confirmButtonText: t("OK"),
      });
      return; // Stop adding branch if customer is not synced
    }
    const tempId = nextTempId;
    setNextTempId((prev) => prev - 1); // Decrement for next temporary ID
    setIsApprovalMode(false); // Reset approval mode when adding a new branch
    inApprovalMode.current = false;
    const newBranch = {
      id: tempId,
      erp_branch_id: `TEMP_${Math.abs(tempId)}`,
      branch_name_en: "",
      city: "",
      locationType: "",
      region: "",
      branchStatus: "new",
      customerId: customer.id,
      isNew: true,
    };
    setTemporaryBranches((prev) => [newBranch, ...prev]);
    setBranches((prev) => [newBranch, ...prev]);
    setExpandedRows([tempId]); // Expand the new branch row
  };
  const handleSearchChange = debounce((e) => {
    search = e.target.value;
    setCurrentPage(1);
  }, 400);
  // Transform branch data with contacts
  const transformBranchData = (branches, branchContacts) => {
    const branchesArray = Array.isArray(branches) ? branches : [branches];
    const contactsArray = Array.isArray(branchContacts)
      ? branchContacts
      : branchContacts
      ? [branchContacts]
      : [];
    return branchesArray.map((branch) => {
      const branchContacts = contactsArray.filter(
        (contact) => contact.branchId === branch.id
      );
      const contactsMap = branchContacts.reduce((acc, contact) => {
        acc[contact.contactType] = contact;
        return acc;
      }, {});
      return {
        ...branch,
        primaryContactName: contactsMap.primary?.name || "",
        primaryContactDesignation: contactsMap.primary?.designation || "",
        primaryContactEmail: contactsMap.primary?.email || "",
        primaryContactMobile: contactsMap.primary?.mobile || "",
        secondaryContactName: contactsMap.secondary?.name || "",
        secondaryContactDesignation: contactsMap.secondary?.designation || "",
        secondaryContactEmail: contactsMap.secondary?.email || "",
        secondaryContactMobile: contactsMap.secondary?.mobile || "",
        supervisorContactName: contactsMap.supervisor?.name || "",
        supervisorContactDesignation: contactsMap.supervisor?.designation || "",
        supervisorContactEmail: contactsMap.supervisor?.email || "",
        supervisorContactMobile: contactsMap.supervisor?.mobile || "",
        allContacts: branchContacts,
      };
    });
  };
  const checkIfBranchIsInApproval = async (branchId) => {
    console.log("Branch Id", branchId);
    console.log("check approval called");
    let isAppMode = false;
    try {
      const res = await fetch(`${API_BASE_URL}/workflow-instance/check/id`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: branchId,
          module: "branch",
        }),
      });
      console.log("!!!!!!!", res);
      if (res.ok) {
        const responseText = await res.text(); // Get raw response text ('t' or 'f')
        console.log("^^^^^^^", responseText);
        try {
          // Try to parse as JSON first
          const data = responseText ? JSON.parse(responseText) : {};
          console.log("Parsed data:", data);
          isAppMode = data?.exists === "t"; // Convert to boolean
          console.log("is approval mode", isAppMode);
          console.log(
            `Workflow check result for branch ${branchId}:`,
            isAppMode
          );
          setIsApprovalMode(isAppMode);
          inApprovalMode.current = isAppMode;
          return isAppMode;
        } catch (parseError) {
          // If not valid JSON, check if it's a direct 't' or 'f' string
          console.error("Error parsing response as JSON:", parseError);
          isAppMode = responseText.trim() === "t";
          console.log(
            "Using direct string match, is approval mode:",
            isAppMode
          );
          // setIsApprovalMode(isAppMode);
          return isAppMode;
        }
      } else {
        console.log(`Workflow check failed`, res.status);
        return false;
      }
    } catch (err) {
      console.error("Error fetching workflow instance:", err);
      return false;
    }
    // Fallback return - shouldn't reach here, but added for safety
    return false;
  };
  // Fetch contacts for a specific branch
  const fetchBranchContacts = async (branchId) => {
    setError(null);
    const customerId = customer.id;
    try {
      const response = await fetch(
        `${API_BASE_URL}/customer-contacts/branch/${branchId}/customer/${customerId}`,
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
        const transformed = transformBranchData(
          branches.filter((branch) => branch.id === branchId),
          result.data
        );
        if (transformed.length > 0) {
          setTransformedBranches(transformed);
          setBranches((prevBranches) =>
            prevBranches.map((branch) =>
              branch.id === branchId ? { ...branch, ...transformed[0] } : branch
            )
          );
        }
      } else {
        throw new Error(result.message || "Failed to fetch contacts");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching contacts:", err);
    }
  };
  const fetchBranches = useCallback(async () => {
    console.log("~~~~~Fetching branches for customer:", customer);
    setError(null);
    console.log(customer);
    const filters = {
      customer_id: customer?.id,
      id: customer?.workflowId,
    };
    const query = new URLSearchParams({
      page: currentPage,
      pageSize: pageSize,
      sortBy: "id",
      sortOrder: "asc",
      search: search,
      filters: JSON.stringify(filters),
    });
    try {
      const response = await fetch(
        `${API_BASE_URL}/customer-branches/pagination?${query.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch branches");
      }
      const data = await response.json();
      setCurrentPage(data.page);
      setBranches(data.data);
      setTotal(data.totalRecords);
    } catch (err) {
      console.log(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [customer, currentPage]);
  // Toggle row expansion and fetch contacts if expanding
  const toggleRow = async (branchId) => {
    if (!expandedRows.includes(branchId)) {
      await fetchBranchContacts(branchId);
    }
    setExpandedRows((prev) => (prev.includes(branchId) ? [] : [branchId]));
    const isAppMode = await checkIfBranchIsInApproval(branchId);
    // setIsApprovalMode(isAppMode);
  };
  // Update tabs height when expanded rows change
  useEffect(() => {
    const baseRowHeight = 80;
    const collapsedExtraHeight = 100;
    const expandedExtraHeight = 1600;
    const numRows = branches.length || 3;
    const rowHeightTotal = numRows * baseRowHeight;
    const contentHeight =
      rowHeightTotal +
      (expandedRows.length > 0 ? expandedExtraHeight : collapsedExtraHeight);
    setTabsHeight(`${contentHeight}px`);
  }, [expandedRows.length, branches.length]);
  // Fetch branches on mount
  useEffect(() => {
    if (customer?.id) {
      fetchBranches();
    }
  }, [customer?.id, search, currentPage]);
  // Pagination variables
  const itemsPerPage = pageSize;
  const totalPages = Math.ceil(total / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  // const currentItems = branches.slice(startIndex, endIndex);
  const currentItems = [...branches].slice(startIndex, endIndex);
  const isExpanded = (branchId) => expandedRows.includes(branchId);
  const getStatusClass = (status) => {
    switch (status) {
      case "approved":
        return "status-approved";
      case "pending":
        return "status-pending";
      case "rejected":
        return "status-rejected";
      default:
        return "status-default";
    }
  };
  const handleBranchFieldChange = (branchId, fieldName, value) => {
    setBranchChanges((prev) => ({
      ...prev,
      [branchId]: {
        ...prev[branchId],
        [fieldName]: value,
      },
    }));
    console.log("Branch changes:", branchChanges);
  };
  const isArabicText = (text) => {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
  };
  const validateChangedFields = (branchData, checkRequired = false) => {
    const errors = {};
    const mandatoryFields = [
      "branchNameEn",
      "branchNameLc",
      "buildingName",
      "street",
      "city",
      "locationType",
      "region",
      "primaryContactName",
      "primaryContactEmail",
      "primaryContactDesignation",
      "primaryContactMobile",
      "secondaryContactName",
      "secondaryContactEmail",
      "secondaryContactDesignation",
      "secondaryContactMobile",
    ];
    Object.keys(branchData).forEach((fieldName) => {
      //   const field = formsByTab[activeTab].find(f => f.name === fieldName);
      const value = branchData[fieldName];
      if (checkRequired && mandatoryFields.includes(fieldName) && !value) {
        errors[fieldName] = t("This field is required.");
      }
      if (
        fieldName.toLowerCase().includes("arabic") &&
        value &&
        !isArabicText(value)
      ) {
        errors[fieldName] = t("Please enter Arabic text.");
      }
      if (fieldName.toLowerCase().includes("email")) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          errors[fieldName] = t("Invalid email format");
        }
      }
      if (
        fieldName.toLowerCase().includes("phone") ||
        fieldName.toLowerCase().includes("number") ||
        fieldName.toLowerCase().includes("#")
      ) {
        if (value && isNaN(value)) {
          errors[fieldName] = t("Only numeric values are allowed");
        }
      }
    });
    // setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleApprovalSubmit = async (action) => {
    setApprovalAction(action);
    setIsApprovalDialogOpen(true);
  };
  const handleDialogSubmit = async (comment) => {
    const branchId = customer.workflowData.id;
    const branchUpdates = branchChanges[branchId];
    // Check if branchUpdates exists and is iterable
    if (branchUpdates && typeof branchUpdates === "object") {
      Object.keys(branchUpdates).forEach((fieldName) => {
        if (fieldName in customer.workflowData.updates) {
          customer.workflowData.updates[fieldName] = branchUpdates[fieldName];
        }
      });
    }
    const payload = {
      workflowData: customer.workflowData || {},
      approvedStatus: approvalAction === "approve" ? "approved" : "rejected",
      comment: comment,
    };
    try {
      const response = await fetch(
        `${API_BASE_URL}/workflow-instance/id/${customer.workflowInstanceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (response.ok) {
        const result = await response.json();
        navigate("/customers");
      } else {
        throw new Error("Failed to submit approval");
      }
    } catch (error) {
      console.log("Error", error.message);
      console.error(`Error ${approvalAction}ing customer:`, error);
      alert(`Error ${approvalAction}ing customer: ${error.message}`);
    }
  };
  const contactDetailFields = [
    "primaryContactName",
    "primaryContactDesignation",
    "primaryContactEmail",
    "primaryContactMobile",
    "secondaryContactName",
    "secondaryContactDesignation",
    "secondaryContactEmail",
    "secondaryContactMobile",
    "supervisorContactName",
    "supervisorContactDesignation",
    "supervisorContactEmail",
    "supervisorContactMobile",
  ];
  const addBranchDetails = async (id, branchData) => {
    const branchPayload = {};
    Object.keys(branchData).forEach((fieldName) => {
      branchPayload[fieldName] = branchData[fieldName];
      // branchPayload["branchStatus"] = branch["branchStatus"];
      if (fieldName === "region") {
        branchPayload["region"] = branchData["region"]?.toLowerCase();
      }
    });
    const response = await fetch(`${API_BASE_URL}/customer-branches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...branchPayload,
        customer_id: customer.id,
        isDeliveryChargesApplicable: customer.isDeliveryChargesApplicable,
      }),
    });
    const result = await response.json();
    if (response.ok) {
      // Update local state with real ID from server
      setBranches((prev) =>
        prev.map((branch) =>
          branch.id === id
            ? {
                ...branch,
                ...result.data,
                id: result.data.id,
                isNew: false,
              }
            : branch
        )
      );
      // setTemporaryBranches((prev) => prev.filter((b) => b.id !== id));
    }
  };
  const addContactDetails = async (branchId, branchData) => {
    const contactPayload = {};
    Object.keys(branchData).forEach((fieldName) => {
      if (contactDetailFields.includes(fieldName)) {
        contactPayload[fieldName] = branchData[fieldName];
      }
    });
    if (Object.keys(contactPayload).length > 0) {
      await fetch(
        `${API_BASE_URL}/customer-contacts/create/customer/${customer.id}/branch/${branchId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...contactPayload,
            customer_id: customer.id,
            branch_id: branchId,
          }),
        }
      );
    }
  };
  const handleSave = async (id, branch, action) => {
    const isNewBranch = id < 0; // Negative IDs are temporary
    const branchData = branchChanges[id] || {};
    console.log("Branch data to save:", branchData);
    if (action === "save") {
      if (!validateChangedFields(branchData, false)) {
        alert(t("Please correct errors before saving."));
        return;
      }
    }
    if (action === "save changes") {
      if (!validateChangedFields(branchData, true)) {
        alert(t("Please fill all required fields before saving changes."));
        return;
      }
    }
    const branchPayload = {};
    const contactPayload = {};
    if (action === "block") {
      branchPayload["branchStatus"] = "blocked";
      branchPayload["isBlocked"] = true;
    }
    if (action === "unblock") {
      branchPayload["branchStatus"] = "approved";
      branchPayload["isBlocked"] = false;
    }
    // Define contact detail fields
    const contactDetailFields = [
      "primaryContactName",
      "primaryContactDesignation",
      "primaryContactEmail",
      "primaryContactMobile",
      "secondaryContactName",
      "secondaryContactDesignation",
      "secondaryContactEmail",
      "secondaryContactMobile",
      "supervisorContactName",
      "supervisorContactDesignation",
      "supervisorContactEmail",
      "supervisorContactMobile",
    ];
    // Prepare payloads
    if (action === "save" || action === "save changes") {
      Object.keys(branchData).forEach((fieldName) => {
        if (contactDetailFields.includes(fieldName)) {
          contactPayload[fieldName] = branchData[fieldName];
        } else {
          branchPayload[fieldName] = branchData[fieldName];
          // branchPayload['branchStatus'] = branchData['branchStatus'];
          // add branchStatus to branchPayload by default
          branchPayload["branchStatus"] = branch["branchStatus"];
          // branchPayload['customerId'] = customer.id;
          if (fieldName === "region") {
            branchPayload["region"] = branchData["region"]?.toLowerCase();
          }
        }
      });
    }
    try {
      if (isNewBranch) {
        // CREATE new branch
        contactDetailFields.forEach((fieldName) => {
          if (!Object.keys(branchData).includes(fieldName)) {
            contactPayload[fieldName] = "";
          }
        });
        const response = await fetch(`${API_BASE_URL}/customer-branches`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...branchPayload,
            customer_id: customer.id,
            isDeliveryChargesApplicable: customer.isDeliveryChargesApplicable,
          }),
        });
        const result = await response.json();
        if (response.ok) {
          // Update local state with real ID from server
          setBranches((prev) =>
            prev.map((branch) =>
              branch.id === id
                ? {
                    ...branch,
                    ...result.data,
                    id: result.data.id,
                    isNew: false,
                  }
                : branch
            )
          );
          setTemporaryBranches((prev) => prev.filter((b) => b.id !== id));
          console.log(contactPayload);
          // If there are contacts to save
          if (Object.keys(contactPayload).length > 0) {
            await fetch(
              `${API_BASE_URL}/customer-contacts/create/customer/${customer.id}/branch/${result.data.id}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  ...contactPayload,
                  customer_id: customer.id,
                  branch_id: result.data.id,
                }),
              }
            );
          }
        }
      } else {
        // UPDATE existing branch
        console.log("branchPayload:", branchPayload);
        if (Object.keys(branchPayload).length > 0) {
          await fetch(`${API_BASE_URL}/customer-branches/id/${id}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ ...branchPayload, customerId: customer.id }),
          });
        }
        console.log("Contact payload:", contactPayload);
        if (Object.keys(contactPayload).length > 0) {
          await fetch(
            `${API_BASE_URL}/customer-contacts/customer/${customer.id}/branch/${id}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(contactPayload),
            }
          );
        }
      }
      // Clear changes for this branch
      // setBranchChanges(prev => {
      //     const newChanges = { ...prev };
      //     delete newChanges[id];
      //     return newChanges;
      // });
      // Refresh data
      // await fetchBranches();
    } catch (error) {
      console.error("Error saving branch:", error);
    }
  };
  const handleSaveChanges = async (id, branch, action) => {
    // const isNewBranch = id < 0; // Negative IDs are temporary
    const branchData = branchChanges[id] || {};
    console.log("Branch data to save:", branchData);
    if (action === "save") {
      if (!validateChangedFields(branchData, false)) {
        alert(t("Please correct errors before saving."));
        return;
      }
    }
    if (action === "save changes") {
      if (!validateChangedFields(branchData, true)) {
        alert(t("Please fill all required fields before saving changes."));
        return;
      }
    }
    const branchPayload = {};
    const contactPayload = {};
    if (action === "block") {
      branchPayload["branchStatus"] = "blocked";
      branchPayload["isBlocked"] = true;
    }
    if (action === "unblock") {
      branchPayload["branchStatus"] = "approved";
      branchPayload["isBlocked"] = false;
    }
    // Define contact detail fields
    const contactDetailFields = [
      "primaryContactName",
      "primaryContactDesignation",
      "primaryContactEmail",
      "primaryContactMobile",
      "secondaryContactName",
      "secondaryContactDesignation",
      "secondaryContactEmail",
      "secondaryContactMobile",
      "supervisorContactName",
      "supervisorContactDesignation",
      "supervisorContactEmail",
      "supervisorContactMobile",
    ];
    // Prepare payloads
    if (action === "save" || action === "save changes") {
      Object.keys(branchData).forEach((fieldName) => {
        if (contactDetailFields.includes(fieldName)) {
          contactPayload[fieldName] = branchData[fieldName];
        } else {
          branchPayload[fieldName] = branchData[fieldName];
          // branchPayload['branchStatus'] = branchData['branchStatus'];
          // add branchStatus to branchPayload by default
          branchPayload["branchStatus"] = branch["branchStatus"];
          // branchPayload['customerId'] = customer.id;
          if (fieldName === "region") {
            branchPayload["region"] = branchData["region"]?.toLowerCase();
          }
        }
      });
    }
    try {
      // if (isNewBranch) {
      //   // CREATE new branch
      //   contactDetailFields.forEach((fieldName) => {
      //     if (!Object.keys(branchData).includes(fieldName)) {
      //       contactPayload[fieldName] = "";
      //     }
      //   });
      //   const response = await fetch(`${API_BASE_URL}/customer-branches`, {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({
      //       ...branchPayload,
      //       customer_id: customer.id,
      //       isDeliveryChargesApplicable: customer.isDeliveryChargesApplicable,
      //     }),
      //
      //   });
      //   const result = await response.json();
      //   if (response.ok) {
      //     // Update local state with real ID from server
      //     setBranches((prev) =>
      //       prev.map((branch) =>
      //         branch.id === id
      //           ? {
      //               ...branch,
      //               ...result.data,
      //               id: result.data.id,
      //               isNew: false,
      //             }
      //           : branch
      //       )
      //     );
      //     setTemporaryBranches((prev) => prev.filter((b) => b.id !== id));
      //     console.log(contactPayload);
      //     // If there are contacts to save
      //     if (Object.keys(contactPayload).length > 0) {
      //       await fetch(
      //         `${API_BASE_URL}/customer-contacts/create/customer/${customer.id}/branch/${result.data.id}`,
      //         {
      //           method: "POST",
      //           headers: { "Content-Type": "application/json" },
      //           body: JSON.stringify({
      //             ...contactPayload,
      //             customer_id: customer.id,
      //             branch_id: result.data.id,
      //           }),
      //
      //         }
      //       );
      //     }
      //   }
      // } else {
      // UPDATE existing branch
      console.log("branchPayload:", branchPayload);
      if (Object.keys(branchPayload).length > 0) {
        await fetch(`${API_BASE_URL}/customer-branches/id/${id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            branch: { ...branchPayload, customerId: customer.id },
            contacts: { ...contactPayload },
          }),
        });
      }
      // console.log("Contact payload:", contactPayload);
      // if (Object.keys(contactPayload).length > 0) {
      //   await fetch(
      //     `${API_BASE_URL}/customer-contacts/customer/${customer.id}/branch/${id}`,
      //     {
      //       method: "POST",
      //       headers: { "Content-Type": "application/json" },
      //       body: JSON.stringify(contactPayload),
      //
      //     }
      //   );
      // }
      // }
      // Clear changes for this branch
      // setBranchChanges(prev => {
      //     const newChanges = { ...prev };
      //     delete newChanges[id];
      //     return newChanges;
      // });
      // Refresh data
      // await fetchBranches();
    } catch (error) {
      console.error("Error saving branch:", error);
    }
  };
  const handleSubmit = async (id, branchData) => {
    handleSave(id, branchChanges?.[id]);
    if (!validateChangedFields(branchData, true)) {
      alert(t("Please fill all required fields before submitting."));
      return;
    }
    console.log("Submitting branch data:", branchData);
    console.log("Branch Changes:", branchChanges);
    // Branch Payload
    const branchPayload = {};
    const contactPayload = {};
    const contactDetailFields = [
      "primaryContactName",
      "primaryContactDesignation",
      "primaryContactEmail",
      "primaryContactMobile",
      "secondaryContactName",
      "secondaryContactDesignation",
      "secondaryContactEmail",
      "secondaryContactMobile",
      "supervisorContactName",
      "supervisorContactDesignation",
      "supervisorContactEmail",
      "supervisorContactMobile",
    ];
    Object.keys(branchData).forEach((fieldName) => {
      if (contactDetailFields.includes(fieldName)) {
        contactPayload[fieldName] = branchData[fieldName];
      } else {
        if (
          fieldName === "allContacts" ||
          fieldName === "updatedAt" ||
          fieldName === "isNew" ||
          fieldName === "createdAt" ||
          fieldName === "createdBy"
        ) {
        } else {
          branchPayload[fieldName] = branchData[fieldName];
          if (fieldName === "region") {
            branchPayload["region"] = branchData["region"]?.toLowerCase();
          }
        }
      }
    });
    try {
      const response = await fetch(
        `${API_BASE_URL}/customer-branches/id/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...branchPayload,
            branchStatus: "pending",
          }),
        }
      );
      const result = await response.json();
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
      console.error("Error saving branch:", error);
    }
    // Create user if primary contact email exists with default password
    const primaryContactEmail = branchData.primaryContactEmail;
    if (primaryContactEmail) {
      const userPayload = {
        email: primaryContactEmail,
        password: "Pass@123",
        userType: "customer",
        roles: ["branch_primary"],
      };
      try {
        const userResponse = await fetch(
          `${API_BASE_URL}/auth/registration/user`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userPayload),
          }
        );
        if (!userResponse.ok) {
          throw new Error("Failed to create user");
        }
        const userResult = await userResponse.json();
        console.log("User created:", userResult);
      } catch (error) {
        console.error("Error creating user:", error);
      }
    }
  };
  const handleButtonClick = () => {
    if (loading) return;
    if (!customer?.erpCustId) {
      Swal.fire({
        title: t("Customer not synced with ERP"),
        text: t("Please sync the customer with ERP before adding branches."),
        icon: "warning",
        confirmButtonText: t("OK"),
      });
      return; // Stop adding branch if customer is not synced
    }
    setPopup(true);
  };
  const handleSubmitFile = async (file) => {
    if (!file) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("customerId", customer.id);
      formData.append("custSeqId", customer.sequenceId);
      formData.append("erpCustId", customer.erpCustId);
      formData.append(
        "isDeliveryChargesApplicable",
        customer.isDeliveryChargesApplicable
      );
      const response = await axios.post(
        `${API_BASE_URL}/customer-branches/upload-excel`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
          validateStatus: () => true,
        }
      );
      if (
        response?.status === 400 &&
        response.headers["content-type"] !== "application/json"
      ) {
        const blob = new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        Swal.fire({
          title: t("Validation Failed"),
          html: `
    ${t("Some rows contain validation errors.")}<br>
    ${t("The Excel file has been updated with a new column named")} <b>${t(
            "Errors"
          )}</b>.<br>
    ${t("Please open the file, review the")} <b>${t("Errors")}</b> ${t(
            "column, fix the issues, and re-upload the file."
          )}.
  `,
          icon: "warning",
          confirmButtonText: t("Download Error File"),
        }).then(() => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "branch_upload_errors.xlsx";
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        });
        return; // Make sure to return early to prevent success message
      }
      const blob = response?.data;
      const text = await blob.text(); // convert blob to text
      const data = JSON.parse(text); // parse text to JSON
      if (response?.status === 200 && data?.success) {
        setBranches((prev) => [...data?.details, ...prev]);
        setCurrentPage(1); // Reset to first page after upload
        setTotal(data?.details.length); // Update total count based on new data
        Swal.fire({
          title: t("File Uploaded Successfully"),
          text:
            t(data.message) ||
            t("Branches have been updated from the Excel file."),
          icon: "success",
          confirmButtonText: t("OK"),
        });
      } else {
        Swal.fire({
          title: t("File Upload Failed"),
          text:
            t(data.message) || t("An error occurred while uploading the file."),
          icon: "error",
          confirmButtonText: t("OK"),
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      Swal.fire({
        title: t("File Upload Failed"),
        text: t("An error occurred while uploading the file."),
        icon: "error",
        confirmButtonText: t("OK"),
      });
    } finally {
      setPopup(false);
      setLoading(false);
      setSelectedFile(null); // reset file after submit
    }
  };
  //   const handleFileChange = async (e) => {
  //     console.log("File input changed:", e);
  //     const file = e.target.files[0];
  //     if (!file) return;
  //     if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
  //       Swal.fire({
  //         title: t("Invalid File Type"),
  //         text: t("Please upload a valid Excel file (.xlsx or .xls)"),
  //         icon: "error",
  //         confirmButtonText: t("OK"),
  //       });
  //       return;
  //     }
  //     try {
  //        setLoading(true)
  //       const formData =  new FormData();
  //       formData.append("file", file);
  //       formData.append("customerId", customer.id); // assumes customer object is passed as prop
  //       formData.append("erpCustId", customer.erpCustId);
  //       formData.append("isDeliveryChargesApplicable", customer.isDeliveryChargesApplicable);
  //       const response = await axios.post(
  //         `${API_BASE_URL}/customer-branches/upload-excel`, // updated URL
  //         formData,
  //         {
  //           headers: {
  //             "Content-Type": "multipart/form-data",
  //             "Authorization": `Bearer ${token}`,
  //           },
  //            responseType: "blob", // <-- Important to receive Excel file
  //         validateStatus: () => true
  //         }
  //       );
  //    if (
  //   response?.status === 400 &&
  //   response.headers["content-type"] !== "application/json"
  // ) {
  //   const blob = new Blob([response.data], {
  //     type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //   });
  //  Swal.fire({
  //   title: t('Validation Failed'),
  //   html: `
  //     ${t("Some rows contain validation errors.")}<br>
  //     ${t("The Excel file has been updated with a new column named")} <b>${t("Errors")}</b>.<br>
  //     ${t("Please open the file, review the")} <b>${t("Errors")}</b> ${t("column, fix the issues, and re-upload the file.")}.
  //   `,
  //   icon: "warning",
  //   confirmButtonText: t('Download Error File'),
  // }).then(() => {
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = "branch_upload_errors.xlsx";
  //     document.body.appendChild(a);
  //     a.click();
  //     a.remove();
  //     window.URL.revokeObjectURL(url);
  //   });
  //   return; // Make sure to return early to prevent success message
  // }
  // const blob = response?.data;
  // const text = await blob.text(); // convert blob to text
  // const data = JSON.parse(text);  // parse text to JSON
  // if (response?.status === 200 && data?.success) {
  //       setBranches((prev) => [...data?.details, ...prev]);
  //       setCurrentPage(1); // Reset to first page after upload
  //       setTotal(data?.details.length); // Update total count based on new data
  //   Swal.fire({
  //     title: t("File Uploaded Successfully"),
  //     text: t(data.message) || t("Branches have been updated from the Excel file."),
  //     icon: "success",
  //     confirmButtonText: t("OK"),
  //   });
  // } else {
  //   Swal.fire({
  //     title: t("File Upload Failed"),
  //     text: t(data.message) || t("An error occurred while uploading the file."),
  //     icon: "error",
  //     confirmButtonText: t("OK"),
  //   });
  // }
  //     } catch (error) {
  //       console.error("Error uploading file:", error);
  //       Swal.fire({
  //         title: t("File Upload Failed"),
  //         text: t("An error occurred while uploading the file."),
  //         icon: "error",
  //         confirmButtonText: t("OK"),
  //       });
  //     }finally{
  //       setPopup(false);
  //        setLoading(false)
  //     }
  //   };
  const HandleFandOFailBranch = async (branchId) => {
    setSyncLoading(true);
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/customer-branches/fando_sync_branch?branchId=${branchId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data?.success) {
        fetchBranches();
        Swal.fire({
          title: "Success",
          text: data.message,
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#3085d6",
        });
      } else {
        Swal.fire({
          title: "Error",
          text: data.message || "Failed to Sync with FandO.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#dc3545",
        });
      }
    } catch (error) {
      console.error("Error handling FandO fail branch:", error);
      Swal.fire({
        title: "Error",
        text: error.message || "Failed to Sync with FandO.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#dc3545",
      });
    } finally {
      setSyncLoading(false);
    }
  };
  const HandleBranchDocument = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: BRANCH_UPLOAD_FORMAT,
          containerType: "documents",
        }),
      });
      const res = await response.json();
      if (res.status === "Ok") {
        window.open(res.data.url, "_blank", "noopener,noreferrer");
      } else {
        Swal.fire({
          title: "Error",
          text: res.message || "Failed to view checklist.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#dc3545",
        });
      }
    } catch (error) {
      console.error("Error viewing checklist:", error);
    }
  };
  const btnUploadExcel = () => {
    setActionMenuOpen(false);
    if (loading) return;
    if (fileExcelInputRef.current) {
      fileExcelInputRef.current.value = "";
      fileExcelInputRef.current.click();
    }
  };
  const onClose = () => {
    setPopup(false);
    setSelectedFile(null); // reset file after close
    setActionMenuOpen(false);
    if (fileExcelInputRef.current) {
      fileExcelInputRef.current.value = "";
    }
  };
  return (
    <div className="branches-content" ref={contentRef}>
      {/* {isV("customerApprovalChecklist") && (
        <div className="form-main-header">
          <a
            href="#"
            onClick={async (e) => {
              e.preventDefault();
              if (!CUSTOMER_APPROVAL_CHECKLIST_URL) {
                alert(t("No checklist URL configured."));
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
            {t("Customer Branch Approval Checklist")}
          </a>
        </div>
      )} */}
      <div className="branches-page-header">
        <div className="branches-header-controls">
          <input
            type="text"
            placeholder={t("Search...")}
            onChange={handleSearchChange}
            className="branches-search-input"
          />
          {/* <div className="branches-action-buttons">
               <button className="branches-upload-button" onClick={handleButtonClick}>
        <span> {loading ? t("Uploading Excel") : t("Upload Excel")}</span>
        <PiMicrosoftExcelLogoFill size={20} />
                </button>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  ref={fileExcelInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

            {isV("btnBranchAdd") && (
              <button
                className="branches-add-button"
                onClick={handleAddBranch}
                disabled={
                  branches.some((branch) => branch.id < 0)
                }
              >
                {t("+ Add")}
              </button>
            )}
            <div className="action-menu-container" ref={actionMenuRef}>
              <FontAwesomeIcon
                icon={faEllipsisV}
                className="action-menu-icon"
                onClick={() => setActionMenuOpen(!isActionMenuOpen)}
              />
              {isActionMenuOpen && (
                <div className="action-menu">
                  <div className="action-menu-item">{t("Export")}</div>
                  <div className="action-menu-item">{t("Import")}</div>
                  <div className="action-menu-item">{t("Settings")}</div>
                </div>
              )}
            </div>
          </div> */}
          <div className="branches-action-buttons">
            <div className="action-menu-container" ref={actionMenuRef}>
              <FontAwesomeIcon
                icon={faEllipsisV}
                className="action-menu-icon"
                onClick={() => setActionMenuOpen(!isActionMenuOpen)}
              />
              {isActionMenuOpen && (
                <div className="action-menu">
                  {/* <div className="action-menu-item">
          {t("Export")}
        </div> */}
                  {isV("btnUploadExcel") && (
                    <div
                      className="action-menu-item"
                      onClick={handleButtonClick}
                    >
                      {loading ? t("Uploading Excel...") : t("Upload Excel")}
                    </div>
                  )}
                  {isV("btnBranchAdd") && (
                    <div
                      className="action-menu-item"
                      onClick={handleAddBranch}
                      style={{
                        pointerEvents: branches.some((branch) => branch.id < 0)
                          ? "none"
                          : "auto",
                        opacity: branches.some((branch) => branch.id < 0)
                          ? 0.5
                          : 1,
                      }}
                    >
                      {t("Add Branch")}
                    </div>
                  )}
                  {/* <div className="action-menu-item">{t("Import")}</div>
        <div className="action-menu-item">{t("Settings")}</div> */}
                </div>
              )}
            </div>
            {/* Hidden file input stays outside */}
            {/* <input
    type="file"
    accept=".xlsx,.xls"
    ref={fileExcelInputRef}
    onChange={handleFileChange}
    style={{ display: "none" }}
  /> */}
          </div>
        </div>
      </div>
      {isMobile ? (
        <div className="branches-list">
          {currentItems.map((branch) => (
            <div key={branch.id} className="branch-card">
              <div
                className="branch-summary"
                onClick={() => toggleRow(branch.id)}
              >
                <div className="branch-id">
                  {branch.erp_branch_id || branch.id}
                </div>
                <div className="branch-name">{branch.branch_name_en}</div>
                <div className="branch-status">
                  <span
                    className={`branches-status-badge ${getStatusClass(
                      branch.branch_status
                    )}`}
                  >
                    {t(branch.branch_status)}
                  </span>
                </div>
                <button className="branches-toggle-row-btn">
                  {isExpanded(branch.id) ? (
                    <FontAwesomeIcon icon={faChevronDown} />
                  ) : (
                    <FontAwesomeIcon icon={faChevronRight} />
                  )}
                </button>
              </div>
              {isExpanded(branch.id) && (
                <div className="branch-expanded">
                  <BranchDetailsForm
                    branch={branch}
                    branchChanges={branchChanges}
                    handleBranchFieldChange={handleBranchFieldChange}
                  />
                  <ContactSection
                    branch={branch}
                    branchChanges={branchChanges}
                    handleBranchFieldChange={handleBranchFieldChange}
                  />
                  <OperatingHours
                    hoursData={branch.hours}
                    branchId={branch.id}
                    handleBranchFieldChange={handleBranchFieldChange}
                  />
                  <div className="customer-onboarding-form-actions">
                    <div className="action-buttons">
                      {!isApprovalMode && (
                        <button
                          className="save"
                          onClick={() => handleSave(branch.id)}
                        >
                          {t("Save")}
                        </button>
                      )}
                      {<button className="block">{t("Block")}</button>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="branches-table-container">
          <table className="branches-data-table">
            <thead>
              <tr>
                <th className="desktop-only">{t("Branch ID")}</th>
                <th className="desktop-only">{t("ERP ID")}</th>
                <th className="desktop-only">{t("Branch Name")}</th>
                <th className="desktop-only">{t("City")}</th>
                <th className="desktop-only">{t("Location Type")}</th>
                <th className="desktop-only">{t("Region")}</th>
                <th>{t("Status")}</th>
                {/* <th>{t("Actions")}</th> */}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <React.Fragment key={branch.id}>
                  <tr
                    onClick={() => toggleRow(branch.id)}
                    className={
                      isExpanded(branch.id) ? "branches-expanded-row" : ""
                    }
                  >
                    <td
                      className="mobile-only mobile-primary"
                      data-label="Branch"
                    >
                      <div className="mobile-content">
                        <span className="mobile-title">
                          {branch.erpBranchId || branch.id}
                        </span>
                        <br />
                        <span className="mobile-subtitle">
                          {branch.branchNameEn}
                        </span>
                      </div>
                    </td>
                    <td className="mobile-secondary">
                      <span
                        className={`branches-status-badge ${getStatusClass(
                          branch.branchStatus
                        )}`}
                      >
                        {t(branch.branchStatus)}
                      </span>
                    </td>
                    <td className="desktop-only">
                      {branch.erp_branch_id || branch.id}
                    </td>
                    <td className="desktop-only">{branch.erpBranchId}</td>
                    {i18n.language === "en" ? (
                      <td className="desktop-only">{branch.branchNameEn}</td>
                    ) : (
                      <td className="desktop-only">{branch.branchNameLc}</td>
                    )}
                    <td className="desktop-only">{branch.city}</td>
                    <td className="desktop-only">{branch.locationType}</td>
                    <td className="desktop-only">{branch.region}</td>
                    <td className="desktop-only">
                      <span
                        className={`branches-status-badge ${getStatusClass(
                          branch.branch_status
                        )}`}
                      >
                        {t(branch.branchStatus)}
                      </span>
                    </td>
                    <td>
                      {!branch?.erpBranchId &&
                        branch.branchStatus.toLowerCase() === "approved" &&
                        user.designation.toLowerCase() ===
                          "sales executive" && (
                          <button
                            className="action-button pay"
                            disabled={syncLoading}
                            onClick={(e) => {
                              e.stopPropagation();
                              HandleFandOFailBranch(branch.id);
                            }}
                          >
                            {syncLoading ? t("Syncing...") : t("F&O Sync")}
                          </button>
                        )}
                    </td>
                    <td>
                      <button className="branches-toggle-row-btn">
                        {isExpanded(branch.id) ? (
                          <FontAwesomeIcon icon={faChevronDown} />
                        ) : (
                          <FontAwesomeIcon icon={faChevronRight} />
                        )}
                      </button>
                    </td>
                  </tr>
                  {!isMobile && isExpanded(branch.id) && (
                    <tr className="expanded-row">
                      <td colSpan="7">
                        <div className="expanded-form-container">
                          {isApprovalMode &&
                            customerFormMode === "custDetailsAdd" && (
                              <h3>{t("Branch is currently under approval")}</h3>
                            )}
                          <BranchDetailsForm
                            branchId={branch?.id}
                            branch={branch}
                            setBranches={setBranches}
                            customer={customer}
                            branchChanges={branchChanges}
                            handleBranchFieldChange={handleBranchFieldChange}
                            isApprovalMode={
                              isApprovalMode || inApprovalMode.current
                            }
                            mode={mode}
                            setExpandedRows={setExpandedRows}
                            isFirstBranch={isFirstBranch}
                          />
                          {console.log(branch)}
                          <ApprovalDialog
                            isOpen={isApprovalDialogOpen}
                            onClose={() => setIsApprovalDialogOpen(false)}
                            action={approvalAction}
                            onSubmit={handleDialogSubmit}
                            customerName={
                              customer.customerName || "this customer"
                            }
                            title={
                              approvalAction === "approve"
                                ? t("Approve Branch")
                                : t("Reject Branch")
                            }
                            subtitle={
                              approvalAction === "approve"
                                ? t(
                                    "Are you sure you want to approve this branch?"
                                  )
                                : t(
                                    "Are you sure you want to reject this branch?"
                                  )
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {branches && branches.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setExpandedRows([]);
                setCurrentPage(page);
              }}
              startIndex={startIndex}
              endIndex={Math.min(endIndex, branches.length)}
              totalItems={branches.length}
            />
          )}
        </div>
      )}
      {popup && (
        <div>
          <div className="gp-backdrop" onClick={onClose} />
          <div className="gp-modal">
            <div className="gp-header">
              <span className="gp-title">{t("Upload Branch Data")}</span>
              <button className="gp-close-btn" onClick={onClose}>
                {t("Close")}
              </button>
            </div>
            {loading ? (
              <div style={{ padding: 24 }}>
                <LoadingSpinner />
              </div>
            ) : (
              <div style={{ padding: "0 28px 20px 28px" }}>
                <p
                  style={{
                    color: "#dc3545",
                    fontWeight: "500",
                    marginBottom: 12,
                  }}
                >
                  {t("* All branch fields are mandatory")}
                </p>
                <p style={{ marginBottom: 20 }}>
                  {t(
                    "To upload multiple branches at once, please download the Excel template below, fill in all required branch information correctly, and upload the completed file."
                  )}
                </p>
                <div className="popup-buttons-row">
                  <button
                    className="download-btn"
                    onClick={HandleBranchDocument}
                  >
                    📥 {t("Download Excel Template")}
                  </button>
                  <button
                    className="upload-btn"
                    onClick={() => fileExcelInputRef.current.click()}
                  >
                    📤 {t("Choose Excel File")}
                  </button>
                  <input
                    type="file"
                    ref={fileExcelInputRef}
                    accept=".xlsx, .xls"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) setSelectedFile(file); // just store file in state
                    }}
                  />
                </div>
                {/* Show selected file and submit button */}
                {selectedFile && (
                  <div style={{ marginTop: 16 , display: "flex",
      alignItems: "center",
      justifyContent: "space-between", }}>
                    <p style={{ margin: 0 }}>
                      {t("Selected File")}: <b>{selectedFile.name}</b>
                    </p>
                    <button
                      className="submit-btn"
                      onClick={() => handleSubmitFile(selectedFile)}
                    >
                      ✅ {t("Submit File")}
                    </button>
                  </div>
                )}
              </div>
            )}
            <style>{`
        .popup-buttons-row {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }
        .download-btn,
        .upload-btn {
          flex: 1;
          padding: 12px 20px;
          border: none;
          border-radius: 6px;
          color: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .download-btn {
          background:  #00594C;
        }
        .upload-btn {
          background: #00205b;
        }
        .download-btn:hover {
          background:  #044b3fff;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(40, 167, 69, 0.25);
        }
        .upload-btn:hover {
          background: #0b285fff;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.25);
        }
          .gp-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.15);
  z-index: 1000;
}
.gp-modal {
  position: fixed;
  top: 50%; 
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  width: 700px;
  max-width: 95vw;
  z-index: 1001;
  animation: gp-fadein 0.2s;
}
@keyframes gp-fadein {
  from { opacity: 0; transform: translate(-50%, -60%);}
  to { opacity: 1; transform: translate(-50%, -50%);}
}
.gp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 28px 10px 28px;
}
.gp-title {
  font-size: 1.25rem;
  font-weight: 500;
}
.gp-close-btn {
  padding: 7px 18px;
  border-radius: 6px;
  border: 1px solid #bbb;
  background: #fff;
  color: #222;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s;
}
.gp-close-btn:hover {
  background: #f2f2f2;
}
      `}</style>
          </div>
        </div>
      )}
    </div>
  );
};
export default CustomerBranches;