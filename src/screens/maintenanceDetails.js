import React, { useState, useRef, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/components.css";
import CommentPopup from "../components/commentPanel";
import GetCustomers from "../components/GetCustomers";
import GetBranches from "../components/GetBranches";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatDate } from "../utilities/dateFormatter";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import SearchableDropdown from "../components/SearchableDropdown";
import axios from "axios";
function MaintenanceDetails() {
  const defaultTicket = {
    id: null,
    requestId: "",
    customerId: null,
    branchId: "",
    issueType: "",
    issueName: "",
    issueDetails: "",
    urgencyLevel: "",
    machineSerialNumber: "",
    warrantyEndDate: null,
    attachment: "",
    status: "",
    assignedTeamMember: "",
    assignedTeamMemberDept: "",
    comments: [],
    charges: null,
    customerRegion: null,
    branchRegion: null,
    maintenanceCharges: null,
  };

  // Ensure these are defined at the top of the component
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n?.language || 'en';
  // RBAC setup
  const location = useLocation();
  const formMode = location.state?.mode;
  const { token, user, isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();

  const ticketRcvd = location.state?.ticket || {};
  const [ticket, setTicket] = useState({
    ...defaultTicket,
    ...ticketRcvd,
    // Ensure all string fields have default empty string values
    requestId: ticketRcvd.requestId || "",
    branchId: ticketRcvd.branchId || "",
    issueType: ticketRcvd.issueType || "",
    issueName: ticketRcvd.issueName || "",
    issueDetails: ticketRcvd.issueDetails || "",
    urgencyLevel: ticketRcvd.urgencyLevel || "",
    machineSerialNumber: ticketRcvd.machineSerialNumber || "",
    assignedTeamMember: ticketRcvd.assignedTeamMember || "",
    assignedTeamMemberDept: ticketRcvd.assignedTeamMemberDept || "",
    status: ticketRcvd.status || "",
    attachment: ticketRcvd.attachment || "",
    // Set customer ID for customer users
    customerId: ticketRcvd.customerId || (user?.userType === 'customer' ? user.customerId : null),
    // Set maintenance charges from backend charges field in edit mode
    maintenanceCharges: ticketRcvd.charges || ticketRcvd.maintenanceCharges || null,
  });

  // State for branches dropdown
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(currentLanguage === "en" ? (ticket.branchNameEn || "") : (ticket.branchNameLc || ""));

  // State for employees dropdown
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(ticket.assignedTo || "");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [popupImage, setPopupImage] = useState(null);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  // Images state (allow dynamic add) - store both data URL and original filename
  const [images, setImages] = useState([]);
  // File input ref
  const fileInputRef = useRef(null);

  // State for video popup
  const [popupVideo, setPopupVideo] = useState(null);

  // Videos state (allow dynamic add) - store both data URL and original filename
  const [videos, setVideos] = useState([]);
 const [videoData, setVideoData] = useState([]);
const [fileData, setFileData] = useState([]);
  // File input ref for videos
  const videoInputRef = useRef(null);

  // State for customer popup
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);

  // State for branch popup
  const [showBranchPopup, setShowBranchPopup] = useState(false);

  // State for issue type options
  const [issueTypeOptions, setIssueTypeOptions] = useState([]);

  

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // Date conversion helper function
  const convertDateFormat = (dateStr, fromFormat, toFormat) => {
    if (!dateStr) return "";

    if (fromFormat === "DD/MM/YYYY" && toFormat === "YYYY-MM-DD") {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    if (fromFormat === "YYYY-MM-DD" && toFormat === "DD/MM/YYYY") {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
    }

    return dateStr;
  };
const handleFileUpload = async (e, type) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (file.size > 30 * 1024 * 1024) {
    Swal.fire({
      title: t("File size exceeds 30MB limit"),
      text: t("Please select a smaller file."),
      icon: "error",
      confirmButtonText: t("OK"),
      confirmButtonColor: "#dc3545"
    });
    return;
  }

  const formDataUpload = new FormData();
  formDataUpload.append("file", file);
  formDataUpload.append("containerType", "maintenance");

  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/upload-files`,
      formDataUpload,
      {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      }
    );

    if (data.success && data.files) {
      if (type === "image") {
        setImages((prev) => [...prev, data.files]);
      } else if (type === "video") {
        setVideos((prev) => [...prev, data.files]);
      }
    }
  } catch (err) {
    console.error("Upload error:", err);
  }

  e.target.value = "";
};

const fetchUploadedFiles = useCallback(async (fileNames, type) => {
  try {
    if (!fileNames || fileNames.length === 0) return;

    const fetched = [];

    for (let fileName of fileNames) {
      const { data } = await axios.post(
        `${API_BASE_URL}/get-files`,
        { fileName, containerType: "maintenance" },
        { withCredentials: true }
      );

      if (data?.status === "Ok" && data.data) {
        fetched.push(data.data);
      }
    }

    if (type === "image") {
      setFileData(fetched);
    } else if (type === "video") {
      setVideoData(fetched);
    }
  } catch (error) {
    console.error(`Error fetching ${type} files:`, error);
  }
}, []);

const handleRemoveFile = async (fileName, type) => {
  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/delete-files`,
      {
        fileName,
        containerType: "maintenance",
      },
      { withCredentials: true }
    );

    if (data.success) {
      if (type === "image") {
        setFileData((prev) =>
          prev.filter((file) => file.fileName !== fileName)
        );
        setImages((prev) => prev.filter((img) => img !== fileName));
      } else if (type === "video") {
        setVideoData((prev) =>
          prev.filter((file) => file.fileName !== fileName)
        );
        setVideos((prev) => prev.filter((vid) => vid !== fileName));
      }
    }
  } catch (error) {
    console.error(`Error deleting ${type}:`, error);
  }
};


useEffect(() => {
  if(images.length ==0) return; // Avoid fetching if no images{
  fetchUploadedFiles(images, "image");
}, [images, fetchUploadedFiles]);

useEffect(() => {
  if(videos.length ==0) return; // Avoid fetching if no videos
  fetchUploadedFiles(videos, "video");
}, [videos, fetchUploadedFiles]);
  // State for closing ticket (MOVED UP to fix React Hooks order)
  const [closing, setClosing] = useState(false); // Track closing state

  // Function to load existing images and videos from attachment field
  const loadExistingFiles = async () => {
    if (formMode === 'edit' && ticket.attachment && ticket.attachment !== 'none') {
      try {
        let attachmentData = {};

        // Parse attachment field - it can be string or object
        if (typeof ticket.attachment === 'string') {
          attachmentData = ticket.attachment
        } else {
          attachmentData = ticket.attachment;
        }
        setImages([...attachmentData.images || []]);
        setVideos([...attachmentData.videos || []]);
       
      } catch (error) {
        console.error('Error parsing attachment data:', error);
      }
    }
  };

  // Utility: fetch regions from basics master
  const fetchRegions = async () => {
    try {
      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/basics-masters?filters={"masterName": "region"}`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch regions');
      const result = await response.json();
      // Assume result.data is an array of region objects with a 'value' property
      return Array.isArray(result.data) ? result.data.map(r => r.value.toLowerCase()) : [];
    } catch (err) {
      console.error('Error fetching regions:', err);
      return [];
    }
  };

  // Utility: get city of selected branch (from branches array)
  const getSelectedBranchCity = () => {
    const branch = branches.find(b => b.id === ticket.branchId);
    // Try both city and cityName fields, fallback to empty string
    return branch ? (branch.city || branch.cityName || '').toLowerCase() : '';
  };

  // Logic to calculate maintenance charges
  const calculateMaintenanceCharges = async () => {
    if (formMode !== 'add') {
      console.log('[Charges] Not in add mode, skipping calculation');
      return; // Only in add mode
    }
    if (!ticket.warrantyEndDate) {
      console.log('[Charges] Missing warrantyEndDate, skipping calculation');
      return;
    }
    if (!ticket.branchId || branches.length === 0) {
      console.log('[Charges] Missing branchId or branches not loaded, skipping calculation');
      return;
    }

    // Use current date for comparison in add mode
    const currentDate = new Date();
    const currentDateFormatted = formatDate(currentDate.toISOString(), "DD/MM/YYYY");
    
    // Convert warranty end date to DD/MM/YYYY format for comparison
    const warrantyDateFormatted = formatDate(ticket.warrantyEndDate, "DD/MM/YYYY");

    // Parse dates for comparison (DD/MM/YYYY format)
    const warrantyDateParts = warrantyDateFormatted.split('/');
    const currentDateParts = currentDateFormatted.split('/');

    const warrantyDate = new Date(warrantyDateParts[2], warrantyDateParts[1] - 1, warrantyDateParts[0]);
    const todayDate = new Date(currentDateParts[2], currentDateParts[1] - 1, currentDateParts[0]);

    console.log('[Charges] warrantyEndDate (DD/MM/YYYY):', warrantyDateFormatted, 'currentDate (DD/MM/YYYY):', currentDateFormatted);
    console.log('[Charges] warrantyDate >= currentDate?', warrantyDate >= todayDate);
    
    const regions = await fetchRegions();
    console.log('[Charges] Regions from basics master:', regions);
    
    const branchCity = getSelectedBranchCity();
    console.log('[Charges] Branch city:', branchCity);
    
    const cityMatchesRegion = regions.includes(branchCity);
    console.log('[Charges] City matches region?', cityMatchesRegion);
    
    let charges = 0;
    if (warrantyDate >= todayDate) {
      // Warranty is still valid (not expired)
      charges = cityMatchesRegion ? 0.00 : 200.00;
      console.log('[Charges] Warranty valid, charges:', charges);
    } else {
      // Warranty has expired
      charges = cityMatchesRegion ? 200.00 : 300.00;
      console.log('[Charges] Warranty expired, charges:', charges);
    }
    
    setTicket(prev => ({ ...prev, maintenanceCharges: charges.toFixed(2) }));
    console.log('[Charges] Final maintenanceCharges set:', charges.toFixed(2));
  };

  // Single function to check and calculate maintenance charges
  const handleMaintenanceChargesCalculation = async () => {
    if (
      formMode === 'add' &&
      ticket.warrantyEndDate &&
      ticket.branchId &&
      branches.length > 0
    ) {
      await calculateMaintenanceCharges();
    }
  };

  // All hooks must be before any early return!
  useEffect(() => {
    if (user) {
      fetchEmployees();
      // Only fetch branches if we have a customer ID
      const customerIdToUse = user?.userType === 'customer' ? user.customerId : (ticket.customerId || user.customerId);
      if (customerIdToUse) {
        fetchBranches();
      }
      // Set customer ID for customer users if not already set
      if (user.userType === 'customer' && !ticket.customerId) {
        setTicket(prev => ({
          ...prev,
          customerId: user.customerId,
          companyNameEn: user.customerCompanyNameEn,
          companyNameAr: user.customerCompanyNameLc
        }));
      }
      // Load existing files if in edit mode
      if (formMode === 'edit') {
        loadExistingFiles();
      }
      // Calculate maintenance charges if in add mode and all required fields are present
      if (
        formMode === 'add' &&
        ticket.warrantyEndDate &&
        ticket.branchId &&
        branches.length > 0
      ) {
        calculateMaintenanceCharges();
      }
    }
  }, [user, formMode, ticket.warrantyEndDate, ticket.branchId, branches]);

  useEffect(() => {
    const fetchIssueTypeOptions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/basics-masters?filters={"masterName": "maintenanceIssueType"}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch issue type options');
        const result = await response.json();
        if (result.status === 'Ok' && result.data) {
          const options = result.data;
          const issueTypeValues = options.map(item => item.value);
          setIssueTypeOptions(issueTypeValues);
        } else if (result.data && Array.isArray(result.data)) {
          const options = result.data;
          const issueTypeValues = options.map(item => item.value);
          setIssueTypeOptions(issueTypeValues);
        } else {
          throw new Error('Unexpected response format for issue type options');
        }
        // Calculate maintenance charges if in add mode and all required fields are present
        if (
          formMode === 'add' &&
          ticket.warrantyEndDate &&
          ticket.branchId &&
          branches.length > 0
        ) {
          calculateMaintenanceCharges();
        }
      } catch (err) {
        console.error('Error fetching issue type options:', err);
      }
    };
    fetchIssueTypeOptions();
  }, [API_BASE_URL, formMode, ticket.warrantyEndDate, ticket.branchId, branches]);

  // Add a separate useEffect to trigger calculation when warranty end date changes
  useEffect(() => {
    if (
      formMode === 'add' &&
      ticket.warrantyEndDate &&
      ticket.branchId &&
      branches.length > 0
    ) {
      calculateMaintenanceCharges();
    }
  }, [ticket.warrantyEndDate]);

  // Add helper functions to get customer and branch regions
  const getCustomerRegion = async (customerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/id/${customerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch customer details');
      const customer = await response.json();
      return customer.city || customer.cityName || '';
    } catch (error) {
      console.error('Error fetching customer region:', error);
      return '';
    }
  };

  const getBranchRegion = () => {
    const branch = branches.find(b => b.id === ticket.branchId);
    return branch ? (branch.city || branch.cityName || '') : '';
  };

  // Early returns must come after all hooks
  if (loading) {
    return <div>{t("msgLoadingUserInfo")}</div>; // Or your loading component
  }
  if (!user) {
    console.log("$$$$$$$$$$$ logging out");
    logout();
    navigate("/login");
    return null;
  }
  //For fetching the user again after browser refresh - End

  //Rbac and other access based on user object to follow below like this
  const companyNameToShow =
    currentLanguage === "en"
      ? ticket.companyNameEn || (user?.customerCompanyNameEn || "")
      : ticket.companyNameAr || (user?.customerCompanyNameLc || "");
  const rbacMgr = new RbacManager(
    user.userType == "employee" && user.roles[0] !== "admin" ? user.designation : user.roles[0],
    formMode == "add" ? "maintDetailAdd" : "maintDetailEdit"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  
  console.log("~~~~~~~~~~~~~User Data:~~~~~~~~~~~~~~~~~~~\n", user);

  // Place columns definition here, after isV/currentLanguage are defined
  const columns = [
    { key: "requestId", header: "Request #", include: isV('requestIdCol') },
    { key: currentLanguage === "en" ? "companyNameEn" : "companyNameAr", header: "Customer", include: isV('customerCol') },
    { key: currentLanguage === "en" ? "branchNameEn" : "branchNameAr", header: "Branch", include: isV('branchCol') },
    { key: "issueName", header: "Issue Name", include: isV('issueNameCol') },
    { key: "issueType", header: "Issue Type", include: isV('issueTypeCol') },
    { key: "urgencyLevel", header: "Urgency Level", include: isV('urgencyLevelCol') },
    { key: "assignedTo", header: "Assigned To", include: isV('assignedToCol') },
    { key: "status", header: "Status", include: isV('statusCol') },
  ];

  // Fetch branches when dropdown is clicked
  const fetchBranches = async () => {
    if (branches.length > 0) return; // Don't fetch if we already have branches

    // Use customer ID from ticket or user (for customer users)
    const customerIdToUse = user?.userType === 'customer' ? user.customerId : (ticket.customerId || user.customerId);

    // Don't fetch branches if no customer ID is available
    if (!customerIdToUse) {
      console.log("No customer ID available for fetching branches");
      return;
    }

    setLoadingBranches(true);
    try {
      // Replace with your actual API endpoint URL
      const apiUrl = process.env.REACT_APP_API_BASE_URL
        ? `${process.env.REACT_APP_API_BASE_URL}/customer-branches/cust-id/${customerIdToUse}`
        : "http://localhost:3000/api/branches";

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      //iterate data object to collect branchNameEn vles in array

      const branchNames = data;

      setBranches(branchNames || []);
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    } finally {
      setLoadingBranches(false);
    }
  };

  // Fetch employees from backend (fetch all, set names as options for dropdown)
  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      // Use the same API pattern as in SupportDetails, but for maintenance
      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/employees/pagination?page=1&pageSize=50000&sortOrder=asc&filters={"designation": "maintenance technician"}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const resp = await response.json();
      // Set employees as array of objects with name and employeeId
      setEmployees(resp.data.data);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const handleCancel = () => {
    // Reload the page to reset all changes
    window.location.reload();
  };

  // Handle image add
  const handleAddImage = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const baseFileName = file.name.split('.').slice(0, -1).join('.') || 'image';
        const newFileName = `${baseFileName}_${timestamp}.${fileExtension}`;

        setImages((prev) => [...prev, {
          dataUrl: ev.target.result,
          originalName: file.name,
          fileName: newFileName
        }]);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again if needed
    e.target.value = "";
  };

  // Open file dialog
  const openFileDialog = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Handle video add
  const handleAddVideo = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop() || 'mp4';
        const baseFileName = file.name.split('.').slice(0, -1).join('.') || 'video';
        const newFileName = `${baseFileName}_${timestamp}.${fileExtension}`;

        setVideos((prev) => [...prev, {
          dataUrl: ev.target.result,
          originalName: file.name,
          fileName: newFileName
        }]);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again if needed
    e.target.value = "";
  };

  // Open file dialog for videos
  const openVideoDialog = () => {
    if (videoInputRef.current) videoInputRef.current.click();
  };

  // Handle customer selection
  const handleSelectCustomer = (customer) => {
    setTicket(prev => ({
      ...prev,
      customerId: customer.id,
      companyNameEn: customer.company_name_en || customer.companyNameEn,
      companyNameAr: customer.company_name_ar || customer.companyNameAr,
      erpCustId: customer.erp_cust_id || customer.erpCustId
    }));
    setShowCustomerPopup(false);

    // Reset branch when customer changes and fetch new branches
    setTicket(prev => ({ ...prev, branchId: "" }));
    setBranches([]);
    if (customer.id) {
      fetchBranchesForCustomer(customer.id);
    }
  };

  // Handle branch selection
  const handleSelectBranch = (branch) => {
    setTicket(prev => ({
      ...prev,
      branchId: branch.id,
      branchNameEn: branch.branch_name_en || branch.branchNameEn,
      branchNameLc: branch.branch_name_lc || branch.branchNameLc,
      erpBranchId: branch.erp_branch_id || branch.erpBranchId
    }));
    setShowBranchPopup(false);
  };

  // Fetch branches for a specific customer
  const fetchBranchesForCustomer = async (customerId) => {
    if (!customerId) {
      console.log("No customer ID provided for fetching branches");
      return;
    }

    setLoadingBranches(true);
    try {
      const apiUrl = process.env.REACT_APP_API_BASE_URL
        ? `${process.env.REACT_APP_API_BASE_URL}/customer-branches/cust-id/${customerId}`
        : "http://localhost:3000/api/branches";

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setBranches(data || []);
    } catch (err) {
      console.error("Error fetching branches:", err);
    } finally {
      setLoadingBranches(false);
    }
  };

  // Track saving state
  

  // Handle save
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); // Start saving process

    // Basic validation
    if (!ticket.branchId) {
      alert(t("Please select a branch"));
      setSaving(false); // End saving if validation fails
      return;
    }
    if (!ticket.issueType) {
      alert(t("Please select an issue type"));
      setSaving(false); // End saving if validation fails
      return;
    }
    if (!ticket.issueName?.trim()) {
      alert(t("Please enter an issue name"));
      setSaving(false); // End saving if validation fails
      return;
    }
    if (!ticket.issueDetails?.trim()) {
      alert(t("Please enter issue details"));
      setSaving(false); // End saving if validation fails
      return;
    }

    try {
      // Get customer and branch regions
      const customerIdToUse = user?.userType === 'customer' ? user.customerId : ticket.customerId;
      const customerRegion = await getCustomerRegion(customerIdToUse);
      const branchRegion = getBranchRegion();

      // First, create the ticket to get the ID for file uploads
      const ticketData = {
        ...ticket,
        // Ensure customer ID is set correctly
        customerId: customerIdToUse,
        // Set creation date for new tickets
        createdAt: formMode === "add" ? new Date().toISOString() : ticket.createdAt,
        // Set default status for new tickets
        status: formMode === "add" ? "New" : ticket.status,
        // Ensure comments is properly formatted and normalized
        comments: Array.isArray(ticket.comments)
          ? ticket.comments
          : (typeof ticket.comments === 'string' && ticket.comments.trim().startsWith('['))
            ? (() => { try { return JSON.parse(ticket.comments); } catch { return []; } })()
            : [],
        // Always include warrantyEndDate in the payload
        warrantyEndDate: ticket.warrantyEndDate || null,
        // Include maintenance charges in both maintenanceCharges and charges fields
        maintenanceCharges: ticket.maintenanceCharges || null,
        charges: ticket.maintenanceCharges || null,
        customerRegion: customerRegion,
        branchRegion: branchRegion
      };

      // Update status to "In Progress" if an employee is assigned
      if (ticketData.assignedTeamMember && ticketData.assignedTeamMember.trim() !== "") {
        ticketData.status = "In Progress";
      }

      // Remove id and requestId for new tickets (let database auto-generate them)
      if (formMode === "add") {
        ticketData.id = undefined;
        ticketData.requestId = undefined;
        // Set initial attachment to "none" for new tickets
        ticketData.attachment = { images: images || [], videos:videos|| [] };
      }

      console.log('Ticket data being sent:', {
        ...ticketData,
        customerRegion: customerRegion,
        branchRegion: branchRegion,
        charges: ticketData.charges // Log the charges field specifically
      });

      const endPoint = formMode === "add" ? "/maintenance" : `/maintenance/id/${ticket.id}`;
      const method = formMode === "add" ? "POST" : "PATCH";

      const apiUrl = process.env.REACT_APP_API_BASE_URL ? `${process.env.REACT_APP_API_BASE_URL}${endPoint}` : null;

      if (!apiUrl) {
        throw new Error("API base URL is not configured");
      }

      const response = await fetch(apiUrl, {
        method: method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Save successful:", result);

      const ticketId = formMode === "add" ? result.maintenance.id : ticket.id;

      // Upload files if there are any images or videos
      // if (images.length > 0 || videos.length > 0) {
      //   await uploadFilesAndUpdateAttachment(ticketId);
      // }

      // Show success message with SweetAlert and navigate after OK
      await Swal.fire({
        title: t("Success!"),
        text: formMode === "add" ? t("Ticket created successfully!") : t("Ticket updated successfully!"),
        icon: "success",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#28a745"
      });

      // Set editing to false and redirect to maintenance page
      setIsEditing(false);
      navigate("/maintenance");
    } catch (error) {
      console.error("Error saving ticket:", error);

      // Show error message with SweetAlert
      await Swal.fire({
        title: t("Error!"),
        text: t("Failed to save ticket. Please try again."),
        icon: "error",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#dc3545"
      });

      // Keep editing mode active on error
      setIsEditing(true);
    } finally {
      setSaving(false); // End saving process regardless of outcome
    }
  };

  // Function to upload files and update attachment field
  const uploadFilesAndUpdateAttachment = async (ticketId) => {
    try {
      // Only upload new files (not existing ones)
      const newImages = images.filter(img => !img.isExisting);
      const newVideos = videos.filter(vid => !vid.isExisting);

      if (newImages.length === 0 && newVideos.length === 0) {
        console.log('No new files to upload');
        return;
      }

      // Create array of all files to upload
      const filesToUpload = [];

      newImages.forEach(imageData => {
        const imageFile = dataURLtoFile(imageData.dataUrl, imageData.fileName);
        filesToUpload.push(imageFile);
      });

      newVideos.forEach(videoData => {
        const videoFile = dataURLtoFile(videoData.dataUrl, videoData.fileName);
        filesToUpload.push(videoFile);
      });

      // Upload all files in one request
      if (filesToUpload.length > 0) {
        const formData = new FormData();
        filesToUpload.forEach(file => {
          formData.append('file', file);
        });
        formData.append('fileType', 'attachment');

        const uploadResponse = await fetch(`${API_BASE_URL}/maintenance/${ticketId}/file`, {
          method: "PATCH",
          credentials: "include",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload files');
        }

        const uploadResult = await uploadResponse.json();
        console.log('Files uploaded successfully:', uploadResult);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  };

  // Helper function to convert data URL to File object
  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Handle close ticket
  const handleCloseTicket = async () => {
    if (!ticket.status || ticket.status === 'Closed') {
      Swal.fire({
        icon: 'info',
        title: t('Ticket already closed'),
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }
    const result = await Swal.fire({
      title: t('Are you sure you want to close this ticket?'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('Yes, close it!'),
      cancelButtonText: t('Cancel')
    });
    if (result.isConfirmed) {
      setClosing(true);
      try {
        // Use PATCH to update ticket status to Closed
        const apiUrl = process.env.REACT_APP_API_BASE_URL
          ? `${process.env.REACT_APP_API_BASE_URL}/maintenance/id/${ticket.id}`
          : `http://localhost:3000/api/maintenance/id/${ticket.id}`;
        const response = await fetch(apiUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'Closed' })
        });
        if (!response.ok) throw new Error('Failed to close ticket');
        Swal.fire({
          icon: 'success',
          title: t('Ticket closed successfully'),
          timer: 2000,
          showConfirmButton: false
        });
        setTicket(prev => ({ ...prev, status: 'Closed' }));
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: t('Failed to close ticket'),
          text: err.message
        });
      } finally {
        setClosing(false);
      }
    }
  };

  // Add comment to ticket.comments in correct format (avoid duplicates)
  const handleAddComment = (commentText, newCommentObj) => {
    if (!commentText || !user) return;
    const newComment = {
      date: new Date().toISOString(),
      action: newCommentObj?.action || "New",
      userId: String(user.userId),
      message: commentText,
      userName: user.userName
    };
    setTicket(prev => ({
      ...prev,
      comments: Array.isArray(prev.comments)
        ? [...prev.comments, newComment]
        : [newComment]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTicket((prev) => ({ ...prev, [name]: value }));

    // Special handling for customer selection
    if (name === "customerId" && value) {
      fetchBranches(value);
      // Reset branch when customer changes
      setTicket((prev) => ({ ...prev, branchId: "" }));
    }
  };

  // Handle image removal
  const handleRemoveImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  // Handle video removal
  const handleRemoveVideo = (indexToRemove) => {
    setVideos(videos.filter((_, index) => index !== indexToRemove));
  };

  return (
    <Sidebar title={`${formMode === "add" ? t("New Request") : `${t("Request# ")}${ticket.requestId}`}${isCommentPanelOpen ? "collapsed" : ""}`}>
      <div className='maintenance-details-container'>
        <h2 className='maintenance-details-title'>{formMode === "add" ? t("New Request") : `${t("Request# ")}${ticket.requestId}`}</h2>
        <div className='maintenance-details-section'>
          <h3 className='maintenance-details-subtitle'>{t("Ticket Details")}</h3>
          <div className='maintenance-details-grid'>
            {isV('customerName') && (
              <div className='maintenance-details-field'>
                <label>{t("Customer Name")}</label>
                <input
                  value={companyNameToShow || ""}
                  readOnly
                  style={{ cursor: (isE("customerName") && user?.userType !== 'customer') ? 'pointer' : 'default' }}
                  onClick={() => (isE("customerName") && user?.userType !== 'customer') && setShowCustomerPopup(true)}
                  placeholder={user?.userType === 'customer' ? "" : t("Click to select customer")}
                />
              </div>
            )}
            {isV('branchName') && (
              <div className='maintenance-details-field'>
                <label htmlFor='branchId'>{t("Branch")} *</label>
                <input
                  value={currentLanguage === "en" ? (ticket.branchNameEn || "") : (ticket.branchNameLc || "")}
                  readOnly
                  style={{ cursor: isE("branchName") ? 'pointer' : 'default' }}
                  onClick={() => isE("branchName") && (user?.userType === 'customer' || ticket.customerId) && setShowBranchPopup(true)}
                  placeholder={
                    user?.userType === 'customer'
                      ? t("Click to select branch")
                      : ticket.customerId
                        ? t("Click to select branch")
                        : t("Please select a customer first")
                  }
                  disabled={user?.userType === 'customer' ? false : !ticket.customerId}
                />
              </div>
            )}
            {isV('issueType') && (
              <div className='maintenance-details-field'>
                <label>{t("Issue Type")}</label>
                <select
                  id='issueType'
                  name='issueType'
                  value={ticket.issueType || ""}
                  onChange={handleInputChange}
                  disabled={!isE("issueType")}
                  style={{
                    color: ticket.issueType ? 'inherit' : '#999',
                  }}
                >
                  <option value="" style={{ color: '#999' }}>{t("Select Issue Type")}</option>
                  {issueTypeOptions.map((issueType, index) => (
                    <option key={index} value={issueType} style={{ color: 'inherit' }}>
                      {issueType}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {isV('issueName') && (
              <div className='maintenance-details-field'>
                <label>{t("Issue Name")}</label>
                <input id='issueName' name='issueName' onChange={handleInputChange} value={ticket.issueName || ""} disabled={!isE("issueName")} />
              </div>
            )}
            {isV('urgencyLevel') && (
              <div className='maintenance-details-field'>
                <label>{t("Urgency Level")}</label>
                <select
                  id='urgencyLevel'
                  name='urgencyLevel'
                  value={ticket.urgencyLevel || ""}
                  onChange={handleInputChange}
                  disabled={!isE("urgencyLevel")}
                  style={{
                    color: ticket.urgencyLevel ? 'inherit' : '#999',
                  }}
                >
                  <option value="" style={{ color: '#999' }}>{t("Select Urgency Level")}</option>
                  <option value="Low" style={{ color: 'inherit' }}>Low</option>
                  <option value="Medium" style={{ color: 'inherit' }}>Medium</option>
                  <option value="High" style={{ color: 'inherit' }}>High</option>
                </select>
              </div>
            )}
            {isV('machineSerialNumber') && (
              <div className='maintenance-details-field'>
                <label>{t("Machine Serial Number")}</label>
                <input
                  id='machineSerialNumber'
                  name='machineSerialNumber'
                  onChange={handleInputChange}
                  value={ticket.machineSerialNumber || ""}
                  disabled={!isE("machineSerialNumber")}
                />
              </div>
            )}
            {isV('warrantyEndDate') && (
              <div className='maintenance-details-field'>
                <label>{t("Warranty End Date")}</label>
                <input
                  id='warrantyEndDate'
                  name='warrantyEndDate'
                  type='date'
                  onChange={handleInputChange}
                  value={ticket.warrantyEndDate ? (
                    // For date inputs, we need YYYY-MM-DD format
                    ticket.warrantyEndDate.includes('-') && ticket.warrantyEndDate.match(/^\d{4}-\d{2}-\d{2}$/) ?
                      ticket.warrantyEndDate :
                      convertDateFormat(formatDate(ticket.warrantyEndDate, "DD/MM/YYYY"), "DD/MM/YYYY", "YYYY-MM-DD")
                  ) : ""}
                  disabled={!isE("warrantyEndDate")}
                />
              </div>
            )}
            {isV('maintenanceCharges') && (
              <div className='maintenance-details-field'>
                <label>{t("Maintenance Charges")}</label>
                <input
                  id='maintenanceCharges'
                  name='maintenanceCharges'
                  type='string'
                  onChange={handleInputChange}
                  value={ticket.maintenanceCharges || ''}
                  disabled={!isE("maintenanceCharges")}
                  placeholder={formMode === 'add' ? t("Auto-calculated") : ""}
                />
              </div>
            )}
            {isV('createdDate') ? (
              <div className='maintenance-details-field'>
                <label>{t("Created Date")}</label>
                <input value={formatDate(ticket.updatedAt, "DD/MM/YYYY")} disabled />
              </div>
            ) : null}
          </div>
          {isV('issueDetails') && (
            <div className='maintenance-details-field maintenance-details-textarea'>
              <label>{t("Issue Details")}</label>
              <textarea id='issueDetails' name='issueDetails' onChange={handleInputChange} value={ticket.issueDetails || ""} disabled={!isE("issueDetails")} />
            </div>
          )}

          {isV('attachments') && (
            <div className='attachments'>
              {isV('images') && (
                <div className='maintenance-details-images'>
                  <label>{t("Images")}</label>
                  <div className='maintenance-images-list'>
                    {/* Add Image Button */}
                    {isV('addImage') && isE('addImage') && images.length<=6 &&  (
                      <button type='button' className='maintenance-add-image-btn' onClick={openFileDialog} title='Add Image'>
                        +
                      </button>
                    )}
                    {images.length<=6 && <input type='file' accept='image/*' ref={fileInputRef} style={{ display: "none" }} onChange={(e)=>handleFileUpload(e,"image")}  />}
                    {fileData?.map((imageData, idx) => (
                      <div key={idx} className='maintenance-image-placeholder' onClick={() => imageData.url && setPopupImage(imageData.url)} title={imageData.url ? "Click to view" : ""}>
                        <img width='100%' height='100%' style={{ objectFit: "cover" }} src={imageData.url} />
                        {isV("removeImage") && isE("removeImage") && (
                          <button
                            className='maintenance-remove-btn'
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening the image
                             handleRemoveFile(imageData.fileName, "image");
                            }}
                            title={t("Remove Image")}>
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {isV('videos') && (
                <div className='maintenance-details-videos'>
                  <label>{t("Videos")}</label>
                  <div className='maintenance-videos-list'>
                    {/* Add Video Button */}
                    {isV('addVideo') && isE('addVideo') && videos?.length<=6 &&  (
                      <button type='button' className='maintenance-add-image-btn' onClick={openVideoDialog} title='Add Video'>
                        +
                      </button>
                    )}
                    { videos?.length<=6 && <input type='file' accept='video/*' ref={videoInputRef} style={{ display: "none" }} onChange={(e)=>handleFileUpload(e,"video")}  />}
                    {videoData?.map((videoData, idx) => (
                      <div key={idx} className='maintenance-video-placeholder' onClick={() => videoData.url && setPopupVideo(videoData.url)} title={videoData.url ? "Click to view" : ""}>
                        <video width='100%' height='100%' style={{ objectFit: "cover" }} src={videoData.url} />
                        {isV("removeVideo") && isE("removeVideo") && (
                          <button
                            className='maintenance-remove-btn'
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening the video
                            handleRemoveFile(videoData.fileName,"video");
                            }}
                            title={t("Remove Video")}>
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className='support-details-footer'>
        {isV('ticketStatus') && (
          <div className='support-status'>
            <span>{t("Ticket Status:")}</span>
            <span className={`order-status-badge status-${ticket.status?.replace(/\s/g, "").toLowerCase()}`}>{t(ticket.status)}</span>
          </div>
        )}
        <div className='support-details-container-right'>
          {isV('assignedTo') && (
            <div className="support-assign">
              <span>{formMode === "add" ? t("Assign to:") : t("Assigned to:")}</span>
              <SearchableDropdown
                id="assignedTeamMember"
                name="assignedTeamMember"
                value={ticket.assignedTeamMember ? String(ticket.assignedTeamMember) : ""}
                onChange={handleInputChange}
                disabled={!isE('assignedTo')}
                options={employees.map(emp => ({ name: emp.name, employeeId: emp.employeeId }))}
                placeholder={t('Select Employee')}
                loading={loadingEmployees}
              />
            </div>
          )}
          <div className="support-details-actions" style={{ paddingRight: "20px" }}>
            {isEditing ? (
              <>
                {isV('btnSave') && isE('btnSave') && 
                  <button 
                    className="support-action-btn save" 
                    onClick={handleSave}
                    disabled={saving || closing || ticket.status === "Closed"}
                  >
                    {saving ? t("Saving...") : t("Save")}
                  </button>
                }
                {isV('btnCancel') && isE('btnCancel') && 
                  <button 
                    className="support-action-btn cancel" 
                    onClick={handleCancel}
                    disabled={ticket.status === "In Progress" || saving || closing}
                  >
                    {t("Cancel")}
                  </button>
                }
                {isV('btnClose') && isE('btnClose') && 
                  <button 
                    className="support-action-btn close" 
                    onClick={handleCloseTicket} 
                    disabled={closing || saving || ticket.status === 'Closed'}
                  >
                    {closing ? t("Closing...") : t("Close Ticket")}
                  </button>
                }
              </>
            ) : (
              <>
              </>
            )}
          </div>
        </div>
      </div>
      {isV('imagePopup') && popupImage && (
        <div className='image-popup-overlay' onClick={() => setPopupImage(null)}>
          <div className='image-popup-content' onClick={(e) => e.stopPropagation()}>
            <img src={popupImage} style={{ maxWidth: "100%", maxHeight: "100%" }} />
            <button className='image-popup-close' onClick={() => setPopupImage(null)}>
              ×
            </button>
          </div>
        </div>
      )}
      {isV('videoPopup') && popupVideo && (
        <div className='image-popup-overlay' onClick={() => setPopupVideo(null)}>
          <div className='image-popup-content' onClick={(e) => e.stopPropagation()}>
            <video src={popupVideo} controls style={{ maxWidth: "100%", maxHeight: "100%" }} />
            <button className='image-popup-close' onClick={() => setPopupVideo(null)}>
              ×
            </button>
          </div>
        </div>
      )}
      {isV('commentPanel') && (
        <CommentPopup
          isOpen={isCommentPanelOpen}
          setIsOpen={setIsCommentPanelOpen}
          onAddComment={handleAddComment}
          showCommentForm={true}
          externalComments={
            Array.isArray(ticket.comments)
              ? ticket.comments
              : (typeof ticket.comments === 'string' && ticket.comments.trim().startsWith('['))
                ? (() => { try { return JSON.parse(ticket.comments); } catch { return []; } })()
                : []
          }
          currentUser={{ userName: user.userName, userId: user.userId }}
          isVisible={formMode !== "add" && isV("commentIcon")}
        />
      )}
      <GetCustomers
        open={showCustomerPopup}
        onClose={() => setShowCustomerPopup(false)}
        onSelectCustomer={handleSelectCustomer}
        API_BASE_URL={API_BASE_URL}
        t={t}
        apiEndpoint="/customers/pagination"
        apiParams={{
          page: 1,
          pageSize: 10,
          sortBy: 'id',
          sortOrder: 'asc'
        }}
      />
      <GetBranches
        open={showBranchPopup}
        onClose={() => setShowBranchPopup(false)}
        onSelectBranch={handleSelectBranch}
        customerId={user?.userType === 'customer' ? user.customerId : ticket.customerId}
        API_BASE_URL={API_BASE_URL}
        t={t}
      />
    </Sidebar>
  );
}

export default MaintenanceDetails;
