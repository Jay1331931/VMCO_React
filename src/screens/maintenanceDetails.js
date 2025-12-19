import React, { useState, useRef, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/components.css";
import CommentPopup from "../components/commentPanel";
import GetCustomers from "../components/GetCustomers";
import GetBranches from "../components/GetBranches";
import LoadingSpinner from "../components/LoadingSpinner";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatDate } from "../utilities/dateFormatter";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import SearchableDropdown from "../components/SearchableDropdown";
import axios from "axios";
import Constants from "../constants";
import ApprovalDialog from "../components/ApprovalDialog";
import GetProducts from '../components/GetProducts';
import GetSpareParts from '../components/GetSpareParts';

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
    erpCustId: user?.userType === 'customer' ? user.erpCustomerId : null
  });
  const serialNumberDebounceRef = useRef(null);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(currentLanguage === "en" ? (ticket.branchNameEn || "") : (ticket.branchNameLc || ""));
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(ticket.assignedTo || "");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [popupImage, setPopupImage] = useState(null);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    console.log("isMobile", isMobile);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // Images state (allow dynamic add) - store both data URL and original filename
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);
  const [popupVideo, setPopupVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [videoData, setVideoData] = useState([]);
  const [fileData, setFileData] = useState([]);
  const videoInputRef = useRef(null);
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [showBranchPopup, setShowBranchPopup] = useState(false);
  const [issueTypeOptions, setIssueTypeOptions] = useState([]);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogSubTitle, setDialogSubTitle] = useState('');
  const [approvalAction, setApprovalAction] = useState(null);
  const [showGetProducts, setShowGetProducts] = useState(false);
  const [showSparePartsPopup, setShowSparePartsPopup] = useState(false);
  const [selectedSpareParts, setSelectedSpareParts] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [manualMachineName, setManualMachineName] = useState('');
  const [allowManualMachineInput, setAllowManualMachineInput] = useState(false);

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const handleFileUpload = async (e, type) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        title: t("File size exceeds 10MB limit"),
        text: t("Please select a smaller file."),
        icon: "error",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#dc3545"
      });
      return;
    }

    // Set loading state based on file type
    if (type === "image") {
      setUploadingImage(true);
    } else if (type === "video") {
      setUploadingVideo(true);
    }

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("containerType", "maintenance");

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/upload-files`,
        formDataUpload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`
          },

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
      Swal.fire({
        title: t("Upload Error"),
        text: t("Failed to upload file. Please try again."),
        icon: "error",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#dc3545"
      });
    } finally {
      // Reset loading state
      if (type === "image") {
        setUploadingImage(false);
      } else if (type === "video") {
        setUploadingVideo(false);
      }
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
          {

            headers: {
              "Authorization": `Bearer ${token}`
            }
          }
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
        {

          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
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
    if (images.length == 0) return; // Avoid fetching if no images{
    fetchUploadedFiles(images, "image");
  }, [images, fetchUploadedFiles]);

  useEffect(() => {
    if (videos.length == 0) return; // Avoid fetching if no videos
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

  const calculateMaintenanceCharges = async (city, warrantyEndDate) => {
    try {
      const response = await fetch(`${API_BASE_URL}/calculate/maintenance-charges?city=${city}&warrantyEndDate=${warrantyEndDate || ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);

      const result = await response.json();

      if (result.status === 'Ok' && result.data?.success) {
        setTicket(prev => ({
          ...prev,
          maintenanceCharges: result.data.maintenanceCharge.toFixed(2)
        }));
      } else {
        setTicket(prev => ({ ...prev, maintenanceCharges: null }));
      }
    } catch (error) {
      console.error('Error calculating maintenance charges:', error);
      setTicket(prev => ({ ...prev, maintenanceCharges: null }));
    }
  };

  useEffect(() => {
    const fetchIssueTypeOptions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/basics-masters?filters={"masterName": "maintenanceIssueType"}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', "Authorization": `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch issue type options');
        const result = await response.json();
        if (result.status === 'Ok' && result.data) {
          const options = result.data;
          const issueTypeValues = options.map(item => ({
            value: item.value,
            displayText: currentLanguage === "ar" ? item.valueLc : item.value
          }));
          setIssueTypeOptions(issueTypeValues);
        } else if (result.data && Array.isArray(result.data)) {
          const options = result.data;
          const issueTypeValues = options.map(item => ({
            value: item.value,
            displayText: currentLanguage === "ar" ? item.valueLc : item.value
          }));
          setIssueTypeOptions(issueTypeValues);
        } else {
          throw new Error('Unexpected response format for issue type options');
        }
      } catch (err) {
        console.error('Error fetching issue type options:', err);
      }
    };

    const calculateChargesIfNeeded = () => {
      if (
        formMode === 'add' &&
        ticket.warrantyEndDate &&
        ticket.branchId &&
        branches.length > 0
      ) {
        calculateMaintenanceCharges();
      }
    };

    const parseSparePartsIfNeeded = () => {
      if (ticket.spareParts) {
        try {
          let sparePartsArray = [];
          if (typeof ticket.spareParts === "string") {
            sparePartsArray = JSON.parse(ticket.spareParts);
          } else if (Array.isArray(ticket.spareParts)) {
            sparePartsArray = ticket.spareParts;
          }
          const mappedSpareParts = sparePartsArray.map(({ itemId, nameEn, nameAr, description }) => ({
            itemId,
            nameEn,
            nameAr,
            description,
          }));
          setSelectedSpareParts(mappedSpareParts);
        } catch (error) {
          console.error("Error parsing spareParts JSON", error);
          setSelectedSpareParts([]);
        }
      }
    };

    if (user) {
      fetchEmployees();
      const customerIdToUse = user?.userType === 'customer' ? user.customerId : (ticket.customerId || user.customerId);
      if (customerIdToUse) {
        fetchBranches();
      }
      if (user.userType === 'customer' && !ticket.customerId) {
        setTicket(prev => ({
          ...prev,
          customerId: user.customerId,
          companyNameEn: user.customerCompanyNameEn,
          companyNameAr: user.customerCompanyNameLc
        }));
      }
      if (formMode === 'edit') {
        loadExistingFiles();
      }
    }

    fetchIssueTypeOptions();
    calculateChargesIfNeeded();
    parseSparePartsIfNeeded();

    if (ticket.machine) {
      setSelectedMachine(ticket.machine);
    }

  }, [
    user,
    formMode,
    branches,
    ticket.warrantyEndDate,
    ticket.branchId,
    ticket.spareParts,
    ticket.customerId,
    ticket.machine,
    currentLanguage,
    t
  ]);

  const getCustomerRegion = async (customerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/id/${customerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },

      });
      if (!response.ok) throw new Error('Failed to fetch customer details');
      const customer = await response.json();
      return customer.ustomerRegion || '';
    } catch (error) {
      console.error('Error fetching customer region:', error);
      return '';
    }
  };

  const getBranchRegion = () => {
    const branch = branches.find(b => b.id === ticket.branchId);
    return branch ? (branch.city || branch.cityName || "") : '';
  };

  if (loading) {
    return <div>{t("msgLoadingUserInfo")}</div>; // Or your loading component
  }
  if (!user) {
    console.log("$$$$$$$$$$$ logging out");
    logout();
    navigate("/login",{replace:true});
    return null;
  }

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

  // Check if ticket is in read-only state (closed or cancelled)
  const isReadOnly = ticket.status === "Closed" || ticket.status === "Cancelled" || ticket.status === "Rejected";

  console.log("~~~~~~~~~~~~~User Data:~~~~~~~~~~~~~~~~~~~\n", user);

  const columns = [
    { key: "requestId", header: "Request #", include: isV('requestIdCol') },
    { key: currentLanguage === "en" ? "companyNameEn" : "companyNameAr", header: "Customer", include: isV('customerCol') },
    { key: currentLanguage === "en" ? "branchNameEn" : "branchNameAr", header: "Branch", include: isV('branchCol') },
    //{ key: "issueName", header: "Issue Name", include: isV('issueNameCol') },
    { key: "issueType", header: "Issue Type", include: isV('issueTypeCol') },
    //{ key: "urgencyLevel", header: "Urgency Level", include: isV('urgencyLevelCol') },
    { key: "assignedTo", header: "Assigned To", include: isV('assignedToCol') },
    { key: "status", header: "Status", include: isV('statusCol') },
  ];

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
      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/customer-branches/cust-id/${customerIdToUse}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },

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

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      // Use the same API pattern as in SupportDetails, but for maintenance
      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/employees/pagination?page=1&pageSize=50000&sortOrder=asc&filters={"designation": "maintenance technician"}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },

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

  const handleCancel = async () => {
    if (formMode === "add") {
      // In add mode, just reload the page
      for (let file of images) {
        await handleRemoveFile(file, "image");
      }
      for (let video of videos) {
        await handleRemoveFile(video, "video");
      }
      navigate("/maintenance");
      // window.location.reload();
    }
    else {
      // In edit mode, update the status to "Cancelled"
      try {
        // Show confirmation dialog
        const result = await Swal.fire({
          title: t("Cancel Ticket?"),
          text: t("Are you sure you want to cancel this maintenance request? This action cannot be undone."),
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: t("Yes, Cancel Request"),
          cancelButtonText: t("No, Go Back"),
          confirmButtonColor: "#dc3545",
          cancelButtonColor: "#6c757d"
        });

        if (!result.isConfirmed) {
          return; // User cancelled
        }

        const endPoint = `/maintenance/id/${ticket.id}`;
        const apiUrl = `${API_BASE_URL}${endPoint}`;

        const response = await fetch(apiUrl, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },

          body: JSON.stringify({
            status: "Cancelled",
            isOpen: false,
            comments: ticket.comments // Explicitly preserve comments
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", errorText);
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const responseResult = await response.json();
        console.log("Cancel ticket successful:", responseResult);

        // Show success message
        await Swal.fire({
          title: t("Success!"),
          text: t("Maintenance request cancelled successfully!"),
          icon: "success",
          confirmButtonText: t("OK"),
          confirmButtonColor: "#28a745"
        });

        // Update local state and redirect
        setTicket(prev => ({
          ...prev,
          status: "Cancelled"
        }));
        setIsEditing(false);
        navigate("/maintenance");
      } catch (error) {
        console.error("Error cancelling maintenance request:", error);

        // Show error message
        await Swal.fire({
          title: t("Error!"),
          text: t("Failed to cancel maintenance request. Please try again."),
          icon: "error",
          confirmButtonText: t("OK"),
          confirmButtonColor: "#dc3545"
        });
      }
    }
  };

  const handleApprovalDialogSubmit = async (commentText) => {
    setIsApprovalDialogOpen(false);
    if (!commentText?.trim()) {
      Swal.fire({
        icon: 'error',
        title: t('Error'),
        text: t('Please add a comment.'),
      });
      return setClosing(true);
    }

    const newComment = {
      date: formatDate(new Date(), 'DDMMYYYY HHmm'),
      action: approvalAction,
      close: approvalAction === 'close',
      reject: approvalAction === 'reject',
      reassign: approvalAction === 'reassign',
      userId: String(user.userId),
      message: commentText,
      userName: user.userName,
      status: approvalAction === 'close' ? 'Closed' : approvalAction === 'reject' ? 'Rejected' : 'Reassign',
    };

    try {
      const updatedComments = Array.isArray(ticket.comments)
        ? [...ticket.comments, newComment]
        : [newComment];

      const newStatus = approvalAction === 'close' ? 'Closed' : approvalAction === 'reject' ? 'Rejected' : 'Reassign';

      const ticketUpdatePayload = {
        status: newStatus,
        isOpen: approvalAction === 'close' || approvalAction === 'reject' ? false : true,
        comments: updatedComments,
        spareParts: JSON.stringify(selectedSpareParts.map(({ itemId, nameEn, nameAr, description }) => ({
          itemId,
          nameEn,
          nameAr,
          description,
        }))),
      };

      const apiUrl = `${API_BASE_URL}/maintenance/id/${ticket.id}`;
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ticketUpdatePayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      const responseResult = await response.json();

      setTicket(prev => ({
        ...prev,
        status: newStatus,
        comments: updatedComments,
      }));

      Swal.fire({
        icon: 'success',
        title: t('Success'),
        text:
          approvalAction === 'close'
            ? t('Ticket closed successfully!')
            : approvalAction === 'reject'
              ? t('Ticket rejected successfully!')
              : t('Request sent successfully!'),
      });
    } catch (error) {
      console.error('Failed to update ticket:', error);
      Swal.fire({
        icon: 'error',
        title: t('Error'),
        text: t('Failed to update ticket. Please try again.'),
      });
    } finally {
      setClosing(false);
    }
  };

  const handleMachineInputClick = () => {
    setShowGetProducts(true);
  };

  const handleSelectProduct = (products) => {
    if (products.length === 0) return;
    const selected = products[0];

    if (selected.productName.toLowerCase() === 'others') {
      setSelectedMachine('Others');
      setAllowManualMachineInput(true);
      setManualMachineName('');
    } else {
      setSelectedMachine(selected.productName || '');
      setAllowManualMachineInput(false);
      setManualMachineName('');
    }
    setShowGetProducts(false);
  };

  const openFileDialog = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const openVideoDialog = () => {
    if (videoInputRef.current) videoInputRef.current.click();
  };

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

  const fetchBranchesForCustomer = async (customerId) => {
    if (!customerId) {
      console.log("No customer ID provided for fetching branches");
      return;
    }

    setLoadingBranches(true);
    try {
      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/customer-branches/cust-id/${customerId}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },

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

  const formatDateInput = (dateStr, returnType = 'date') => {
    if (!dateStr) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr) && returnType === 'date') {
      return dateStr;
    }

    const normalized = dateStr.replace(/\//g, "-");

    if (!/^\d{2}-\d{2}-\d{4}$/.test(normalized)) return "";

    const [day, month, year] = normalized.split("-");
    const isoBase = `${year}-${month}-${day}`;
    const dateObj = new Date(isoBase);

    if (isNaN(dateObj)) return "";

    if (returnType === 'iso') {
      if (
        dateObj.toISOString().endsWith("T00:00:00.000Z") &&
        /^\d{2}-\d{2}-\d{4}$/.test(normalized)
      ) {
        return isoBase;
      }
      return dateObj.toISOString();
    }

    return isoBase;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); // Start saving process

    // Basic validation
    if (!ticket.branchId) {
      Swal.fire({
        title: t("Validation Error"),
        text: t("Please select a branch"),
        icon: "warning",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#3085d6"
      });
      setSaving(false); // End saving if validation fails
      return;
    }
    if (!ticket.issueType) {
      Swal.fire({
        title: t("Validation Error"),
        text: t("Please select an issue type"),
        icon: "warning",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#3085d6"
      });
      setSaving(false); // End saving if validation fails
      return;
    }
    if (!ticket.issueDetails?.trim()) {
      Swal.fire({
        title: t("Validation Error"),
        text: t("Please enter issue details"),
        icon: "warning",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#3085d6"
      });
      setSaving(false); // End saving if validation fails
      return;
    }
    if (!ticket.maintenanceCharges) {
      Swal.fire({
        title: t("Validation Error"),
        text: t("Please enter a machine serial number to get maintenance Charges"),
        icon: "warning",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#3085d6"
      });
      setSaving(false); // End saving if validation fails
      return;
    }
    if (!ticket.machine && !selectedMachine) {
      Swal.fire({
        title: t("Validation Error"),
        text: t("Please select a machine"),
        icon: "warning",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#3085d6"
      });
      setSaving(false);
      return;
    }
    if (selectedMachine.toLowerCase() === "others" && (!manualMachineName || manualMachineName.trim() === '')) {
      Swal.fire({
        title: t("Validation Error"),
        text: t("Please select a machine"),
        icon: "warning",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#3085d6"
      });
      setSaving(false);
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
        customerId: customerIdToUse,
        createdAt: formMode === "add" ? new Date().toISOString() : formatDateInput(ticket?.createdAt, "iso"),
        comments: Array.isArray(ticket.comments)
          ? ticket.comments
          : (typeof ticket.comments === 'string' && ticket.comments.trim().startsWith('['))
            ? (() => { try { return JSON.parse(ticket.comments); } catch { return []; } })()
            : [],
        warrantyEndDate: ticket.warrantyEndDate || null,
        maintenanceCharges: ticket.maintenanceCharges || null,
        charges: ticket.maintenanceCharges || null,
        customerRegion: customerRegion,
        branchRegion: branchRegion,
        machine: selectedMachine,
        machineOthers: selectedMachine.toLowerCase() === "others" ? manualMachineName.trim() : "",
      };

      if (ticketData.assignedTeamMember && ticketData.assignedTeamMember.trim() !== "") {
        ticketData.status = "In Progress";
      } else {
        ticketData.status = "New";
      }

      // Remove id and requestId for new tickets (let database auto-generate them)
      if (formMode === "add") {
        ticketData.id = undefined;
        ticketData.requestId = undefined;
        // Set initial attachment to "none" for new tickets
        ticketData.attachment = { images: images || [], videos: videos || [] };
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
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },

        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Save successful:", result);

      const ticketId = formMode === "add" ? result.maintenance.id : ticket.id

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

  const handleCloseTicket = () => {
    setDialogTitle(t('Close ticket'));
    setDialogSubTitle(t('Add closing comment.'));
    setApprovalAction(t('close'));
    setIsApprovalDialogOpen(true);
  };

  const handleRejectTicket = () => {
    setDialogTitle(t('Reject ticket'));
    setDialogSubTitle(t('Do you want to reject the ticket?'));
    setApprovalAction(t('reject'));
    setIsApprovalDialogOpen(true);
  };

  const handleReassignTicket = () => {
    setDialogTitle(t('Request to Reassign'));
    setDialogSubTitle(t('Add reason for reassignment.'));
    setApprovalAction(t('reassign'));
    setIsApprovalDialogOpen(true);
  };

  const handleSelectSpareparts = (newSpareparts) => {
    setSelectedSpareParts((prevSelected) => {
      const existingIds = new Set(prevSelected.map((sp) => sp.itemId));
      const uniqueNewParts = newSpareparts.filter(sp => !existingIds.has(sp.itemId));
      return [...prevSelected, ...uniqueNewParts];
    });
  };

  const handleRemoveSparepart = (itemIdToRemove) => {
    setSelectedSpareParts((prevSelected) =>
      prevSelected.filter((sp) => sp.itemId !== itemIdToRemove)
    );
  };

  const handleAddComment = async (commentText, newCommentObj) => {
    if (!commentText || !user || isReadOnly) return;

    // Create the new comment object
    const newComment = {
      date: formatDate(new Date(), "DD/MM/YYYY HH:MM"),
      action: newCommentObj?.action || "New",
      userId: String(user.userId),
      message: commentText,
      userName: user.userName
    };

    // Update local state first for immediate UI feedback
    const updatedComments = Array.isArray(ticket.comments)
      ? [...ticket.comments]
      : [newComment];

    setTicket(prev => ({
      ...prev,
      comments: updatedComments
    }));

    try {
      // Only attempt to save to backend if we're in edit mode and have a ticket ID
      if (formMode === "edit" && ticket.id) {
        const apiUrl = `${API_BASE_URL}/maintenance/id/${ticket.id}`;

        const response = await fetch(apiUrl, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },

          body: JSON.stringify({
            comments: updatedComments
          })
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        // Optional: show a small success notification
        console.log("Comment saved successfully to backend");
      }
    } catch (error) {
      console.error("Failed to save comment to backend:", error);

      // Optional: show error notification to user
      Swal.fire({
        title: t("Error"),
        text: t("Failed to save comment. The comment will be saved when you save the ticket."),
        icon: "warning",
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 3000
      });
    }
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

  const handleSerialNumberChange = async (SNo) => {
    const serialValue = SNo ?? (SNo?.trim() || "000000");
    setTicket(prev => ({
      ...prev,
      machineSerialNumber: serialValue,
    }));

    if (!ticket.branchId || branches.length === 0) {
      console.log("No branch selected");
      Swal.fire({
        title: t("Validation Error"),
        text: t("Please select a branch"),
        icon: "warning",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#3085d6"
      });
      return;
    }

    const selectedBranch = branches.find(b => b.id === ticket.branchId);
    if (!selectedBranch?.city) {
      console.warn('Branch city not found');
      return;
    }

    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/warranty-end-date/${ticket?.erpCustId}/${SNo}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },

        }
      );
      const rawDate = data?.details?.warrantdate || "";
      if (data?.success) {
        setTicket((prev) => ({
          ...prev,
          warrantyEndDate: formatDateInput(rawDate, "date") || "",
        }));
      } 
      // else {
      //   Swal.fire({
      //     title: t("Error"),
      //     text: t(data?.message) || t("Please enter erpSerialNo Correct"),
      //     icon: "warning",
      //     confirmButtonText: t("OK"),
      //     confirmButtonColor: "#3085d6"
      //   });
      // }
    } catch (error) {
      console.error("Error handling serial number change:", error);
    }
    const city = selectedBranch.city.toLowerCase();
    const warrantyEndDate = ticket.warrantyEndDate || null;

    await calculateMaintenanceCharges(city, warrantyEndDate);

  };

  const handleAddFeedback = async () => {
    try {
      // More robust validation
      if (!ticket.feedback || !ticket.feedback.trim()) {
        Swal.fire({
          title: t("Validation Error"),
          text: t("Please enter feedback before submitting"),
          icon: "warning",
          confirmButtonText: t("OK"),
          confirmButtonColor: "#3085d6"
        });
        return;
      }

      if (!ticket.id) {
        console.error("No ticket ID available");
        return;
      }

      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/maintenance/id/${ticket.id}`;

      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          feedbackComment: ticket.feedback.trim()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Feedback submitted successfully:", result);

      await Swal.fire({
        title: t("Success!"),
        text: t("Feedback submitted successfully!"),
        icon: "success",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#28a745"
      });

      setTicket(prev => ({
        ...prev,
        feedbackComment: ticket.feedback.trim()
      }));

    } catch (error) {
      console.error("Failed to submit feedback:", error);

      await Swal.fire({
        title: t("Error!"),
        text: t("Failed to submit feedback. Please try again."),
        icon: "error",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#dc3545"
      });
    }
  };


  return (
    // <Sidebar title={`${formMode === "add" ? t("New Request") : `${t("Request# ")}${ticket.requestId}`}`}>
     <Sidebar title={`Maintenance`}>
     
      <div className='maintenance-details-container'>
        <h2 className='maintenance-details-title'>{formMode === "add" ? t("New Request") : `${t("Request# ")}${ticket.requestId}`}</h2>
        <div className='maintenance-details-section'>
          <h3 className='maintenance-details-subtitle'>{t("Ticket Details")}</h3>
          <div className='maintenance-details-grid'>
            {isV('customerName') && (
              <div className='maintenance-details-field'>
                <label>{t("Customer Name")} *</label>
                <input
                  value={companyNameToShow || ""}
                  readOnly
                  style={{ cursor: (isE("customerName") && user?.userType !== 'customer' && !isReadOnly) ? 'pointer' : 'default' }}
                  onClick={() => (isE("customerName") && user?.userType !== 'customer' && !isReadOnly) && setShowCustomerPopup(true)}
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
                  style={{ cursor: (isE("branchName") && !isReadOnly) ? 'pointer' : 'default' }}
                  onClick={() => (isE("branchName") && !isReadOnly) && (user?.userType === 'customer' || ticket.customerId) && setShowBranchPopup(true)}
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
                <label>{t("Issue Type")} *</label>
                <select
                  id='issueType'
                  name='issueType'
                  value={ticket.issueType || ""}
                  onChange={handleInputChange}
                  disabled={!isE("issueType") || isReadOnly}
                  style={{
                    color: ticket.issueType ? 'inherit' : '#999',
                  }}
                >
                  <option value="" style={{ color: '#999' }}>{t("Select Issue Type")}</option>
                  {issueTypeOptions.map((issueType, index) => (
                    <option key={index} value={issueType.value || issueType} style={{ color: 'inherit' }}>
                      {issueType.displayText || issueType}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {isV('machine') && (
              <div className='maintenance-details-field'>
                <label>{t("Machine")} *</label>
                <input
                  id="machineInput"
                  type="text"
                  placeholder={t("Select a machine")}
                  readOnly={!allowManualMachineInput}
                  value={ticket.machine ? ticket.machine : selectedMachine}
                  onClick={handleMachineInputClick}
                  onChange={allowManualMachineInput ? (e) => setManualMachineName(e.target.value) : undefined}
                  style={{ cursor: allowManualMachineInput ? 'text' : 'pointer' }}
                />
              </div>
            )}
            {isV('machineOthers') && allowManualMachineInput && (
              <div className='maintenance-details-field'>
                <label>{t("Machine (Others)")}</label>
                <input
                  id='machineOthers'
                  name='machineOthers'
                  onChange={allowManualMachineInput ? (e) => setManualMachineName(e.target.value) : undefined}
                  value={manualMachineName || ""}
                  disabled={!isE("machineOthers") || isReadOnly}
                />
              </div>
            )}
            {isV('machineSerialNumber') && (
              <div className='maintenance-details-field'>
                <label>{t("Machine Serial Number")} *</label>
                <input
                  id="machineSerialNumber"
                  name="machineSerialNumber"
                  value={ticket.machineSerialNumber || ''}
                  onChange={(e) => {
                    setTicket({ ...ticket, "machineSerialNumber": e.target.value })
                  }}
                  disabled={!isE('machineSerialNumber') || isReadOnly}
                />
                {!ticket?.warrantyEndDate && formMode === "add" && (
                  <button
                    type="button"
                    className="machine-button"
                    //disabled={!ticket.machineSerialNumber}
                    onClick={() => {
                      const serialNumber = ticket.machineSerialNumber?.trim() || "000000";
                      handleSerialNumberChange(serialNumber);
                    }}
                  >
                    {t("Get Maintenance Charges")}
                  </button>
                )}
              </div>
            )}
            {isV('warrantyEndDate') && (
              <div className='maintenance-details-field'>
                <label>{t("Warranty End Date")}</label>
                <input
                  id='warrantyEndDate'
                  name='warrantyEndDate'
                  type='text'
                  placeholder={t("Auto-populated")}
                  // onChange={handleInputChange}
                  value={formatDate(ticket?.warrantyEndDate, 'DD/MM/YYYY') || ""}
                  disabled
                />
              </div>
            )}
            {isV('maintenanceCharges') && (
              <div className='maintenance-details-field'>
                <label>{t("Maintenance Charges With VAT")}</label>
                <input
                  id='maintenanceCharges'
                  name='maintenanceCharges'
                  type='string'
                  onChange={handleInputChange}
                  value={ticket.maintenanceCharges || ''}
                  disabled={!isE("maintenanceCharges") || isReadOnly}
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
              <label>{t("Issue Details")} *</label>
              <textarea id='issueDetails' name='issueDetails' onChange={handleInputChange} value={ticket.issueDetails || ""} disabled={!isE("issueDetails") || isReadOnly} />
            </div>
          )}

          {isV('attachments') && (
            <div className='attachments'>
              {isV('images') && (
                <div className='maintenance-details-images'>
                  <label>{t("Images")}</label>
                  <div className='maintenance-images-list'>
                    {/* Add Image Button */}
                    {isV('addImage') && isE('addImage') && !isReadOnly && images.length <= 6 && (
                      <button type='button' className='maintenance-add-image-btn' onClick={openFileDialog} title='Add Image'>
                        +
                      </button>
                    )}
                    {images.length <= 6 && <input type='file' accept='image/*' ref={fileInputRef} style={{ display: "none" }} onChange={(e) => handleFileUpload(e, "image")} />}
                    {/* Loading spinner for image upload */}
                    {uploadingImage && (
                      <div className='maintenance-image-placeholder upload-loading'>
                        <LoadingSpinner size="small" />
                      </div>
                    )}
                    {fileData?.map((imageData, idx) => (
                      <div key={idx} className='maintenance-image-placeholder' onClick={() => imageData.url && setPopupImage(imageData.url)} title={imageData.url ? "Click to view" : ""}>
                        <img width='100%' height='100%' style={{ objectFit: "cover" }} src={imageData.url} />
                        {isV("removeImage") && isE("removeImage") && !isReadOnly && (
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
                  <div className='maintenance-images-list'>
                    {/* Add Video Button */}
                    {isV('addVideo') && isE('addVideo') && !isReadOnly && videos?.length <= 6 && (
                      <button type='button' className='maintenance-add-image-btn' onClick={openVideoDialog} title='Add Video'>
                        +
                      </button>
                    )}
                    {videos?.length <= 6 && <input type='file' accept='video/*' ref={videoInputRef} style={{ display: "none" }} onChange={(e) => handleFileUpload(e, "video")} />}
                    {/* Loading spinner for video upload */}
                    {uploadingVideo && (
                      <div className='maintenance-video-placeholder upload-loading'>
                        <LoadingSpinner size="small" />
                      </div>
                    )}
                    {videoData?.map((videoData, idx) => (
                      <div key={idx} className='maintenance-image-placeholder' onClick={() => videoData.url && setPopupVideo(videoData.url)} title={videoData.url ? "Click to view" : ""}>
                        <video width='100%' height='100%' style={{ objectFit: "cover" }} src={videoData.url} />
                        {isV("removeVideo") && isE("removeVideo") && !isReadOnly && (
                          <button
                            className='maintenance-remove-btn'
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening the video
                              handleRemoveFile(videoData.fileName, "video");
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
          {selectedSpareParts && selectedSpareParts.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <h4 style={{ marginBottom: "8px" }}>
                {t("Spare Parts")}
              </h4>
              <table
                style={{
                  width: "48%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  backgroundColor: "#fff",
                  boxShadow: "inset 0 1px 3px rgb(0 0 0 / 0.1)",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        borderBottom: "1px solid #ddd",
                        padding: "8px 12px",
                        textAlign: currentLanguage === "ar" ? "right" : "left",
                        backgroundColor: "#f9f9f9",
                        borderTopLeftRadius: "6px",
                      }}
                    >
                      {t("Item ID")}
                    </th>
                    <th
                      style={{
                        borderBottom: "1px solid #ddd",
                        padding: "8px 12px",
                        textAlign: currentLanguage === "ar" ? "right" : "left",
                        backgroundColor: "#f9f9f9",
                        borderTopRightRadius: "6px",
                      }}
                    >
                      {t("Item Name")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSpareParts.map(({ itemId, nameEn, nameAr }) => (
                    <tr key={itemId} style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "8px 12px" }}>{itemId}</td>
                      <td style={{ padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>
                          {currentLanguage === "ar" ? nameAr || nameEn : nameEn}
                        </span>
                        {ticket.status.toLowerCase() !=="closed" &&
                          <button
                          onClick={() => handleRemoveSparepart(itemId)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#c00",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "1.4rem",
                            lineHeight: "1",
                            padding: 0,
                          }}
                          aria-label="Remove spare part"
                          title="Remove"
                          disabled={saving || closing || isReadOnly}
                        >
                          ×
                        </button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {isV('feedback') && ticket.status?.toLowerCase() === 'closed' && (
            <div className='maintenance-details-field maintenance-details-textarea'>
              <label>{t("Customer Feedback")}</label>
              <textarea
                id='feedback'
                name='feedback'
                onChange={handleInputChange}
                value={ticket?.feedbackComment}
                disabled={!isE("feedback") || ticket?.feedbackComment}
              />
              {isV('feedbackButton') && !ticket.feedbackComment && (
                <button className='feedback-btn' onClick={handleAddFeedback} disabled={!!ticket?.feedbackComment}>
                  {t("Submit Feedback")}
                </button>
              )}
            </div>
          )}

        </div>
      </div>
      <div className='support-details-footer' style={{ alignItems: 'center' }}>
        <div className='support-status '>
          {isV('ticketStatus') && (
            <div className='support-status'>
              <span>{t("Ticket Status")}:</span>
              <span className={`order-status-badge status-${ticket.status?.replace(/\s/g, "").toLowerCase()}`}>{t(ticket.status)}</span>
            </div>
          )}
        </div>
        <div className='support-details-container-right'>
          {isV('assignedTo') && (
            <div className="support-assign">
              <span>{formMode === "add" ? t("Assign to") : t("Assigned to")}:</span>
              <SearchableDropdown
                id="assignedTeamMember"
                name="assignedTeamMember"
                value={ticket.assignedTeamMember ? String(ticket.assignedTeamMember) : ""}
                onChange={handleInputChange}
                disabled={!isE('assignedTo') || isReadOnly}
                options={employees.map(emp => ({ name: emp.name, employeeId: emp.employeeId }))}
                placeholder={t('Select Employee')}
                loading={loadingEmployees}
                className={!isMobile ? "" : "mobile-select-branch location-select"}
                openUpwards={true}
              />
            </div>
          )}
          <div className='support-details-container-right'>
            <div className="support-details-actions">
              {isEditing ? (
                <>
                  {isV('btnAddSpareParts') &&
                    user.userType.toLowerCase() === "employee" &&
                    ticket.status.toLowerCase() === "in progress" && (
                      <button
                        className="support-action-btn AddSpareParts"
                        onClick={() => setShowSparePartsPopup(true)}
                        disabled={saving || closing || isReadOnly}
                      >
                        {t('Add Spare Parts')}
                      </button>
                    )}
                  {isV('btnSave') &&
                    <button className="support-action-btn save" onClick={handleSave} disabled={saving || closing || isReadOnly}>
                      {saving ? t('Saving...') : t('Save')}
                    </button>}

                  {isV('btnCancel') &&
                    <button className="support-action-btn cancel" onClick={handleCancel} disabled={isReadOnly || saving || closing}>
                      {t('Cancel')}
                    </button>}

                  {isV('btnReject') && formMode === 'edit' &&
                    <button className="support-action-btn reject" onClick={handleRejectTicket} disabled={saving || closing || isReadOnly}>
                      {t('Reject')}
                    </button>}

                  {isV('btnClose') &&
                    <button className="support-action-btn close" onClick={handleCloseTicket} disabled={closing || saving || isReadOnly}>
                      {closing ? t('Closing...') : t('Close Ticket')}
                    </button>}

                  {isV('btnReassign') &&
                    <button
                      className="support-action-btn reassign"
                      onClick={handleReassignTicket}
                      disabled={closing || saving || isReadOnly}
                    >
                      {t('Request to Reassign')}
                    </button>}
                </>
              ) : null}
            </div>
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
          showCommentForm={!isReadOnly}
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
      <ApprovalDialog
        action={approvalAction}
        isOpen={isApprovalDialogOpen}
        onClose={() => setIsApprovalDialogOpen(false)}
        onSubmit={handleApprovalDialogSubmit}
        title={dialogTitle}
        subTitle={dialogSubTitle}
        placeholder={approvalAction === 'close' ? t('Enter closing comment') : approvalAction === 'reject' ? t('Enter rejection reason') : t('Enter reacon for re-assignment')}
      />
      {showGetProducts && (
        <GetProducts
          open={true}
          onClose={() => setShowGetProducts(false)}
          onSelectProduct={handleSelectProduct}
          API_BASE_URL={API_BASE_URL}
          token={token}
          customerId={user?.userType === 'customer' ? user.customerId : ticket.customerId}
          entity={Constants.ENTITY.VMCO}
          category={Constants.CATEGORY.VMCO_MACHINES}
          machineMode={true}
        />
      )}
      {showSparePartsPopup && (
        <GetSpareParts
          open={showSparePartsPopup}
          onClose={() => setShowSparePartsPopup(false)}
          onSelectSpareparts={handleSelectSpareparts}
          API_BASE_URL={API_BASE_URL}
          token={token}
        />
      )}
      <style>
        {
          `
          .maintenance-details-images,
          .maintenance-details-videos {
            flex: 1;
            max-width: 48%;
          }
          .image-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: fadeIn 0.2s ease-in-out;
          }

          .image-popup-content {
            position: relative;
            max-width: 50%;
            
            background: #fff;
            padding: 10px;
            border-radius: 10px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
            animation: scaleIn 0.25s ease;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .image-popup-content img {
            width: 100%;
            max-width: 400px;
            max-height: 400px;
            height: auto;
            border-radius: 8px;
            object-fit: contain;
          }

          .image-popup-close {
            position: absolute;
            top: -10px;
            right: -10px;
            background: red;
            color: white;
            border: none;
            font-size: 20px;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
            transition: background 0.2s;
          }

          .image-popup-close:hover {
            background: #c00;
          }

          .upload-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
            border: 2px dashed #ccc;
            text-align: center;
            cursor: default;
          }

          .upload-loading .loading-spinner-outer {
            background: transparent;
            margin-bottom: 0;
            
          }
          .machine-button {
            padding: 8px 14px;
            margin-top: 10px;
            font-size: 14px;
            font-weight: 600;
            color: #fff;
            background-color: #2563eb; /* blue */
            border: none;
            border-radius: 6px;
            cursor: pointer;
            transition: background-color 0.2s, opacity 0.2s;
          }

          }`
        }
      </style>
    </Sidebar>
  );
}

export default MaintenanceDetails;
