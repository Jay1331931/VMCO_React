import React, { useState, useRef, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/components.css";
import CommentPopup from "../components/commentPanel";
import GetCustomers from "../components/GetCustomers";
import GetBranches from "../components/GetBranches";
import LoadingSpinner from "../components/LoadingSpinner";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import formatDate from "../utilities/dateFormatter"; // Import the date formatter
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import SearchableDropdown from "../components/SearchableDropdown";
import Constants from "../constants";
import axios from "axios";
import ApprovalDialog from '../components/ApprovalDialog';

function SupportDetails() {
  const defaultTicket = {
    id: null,
    ticketId: "",
    customerId: null,
    branchId: "",
    grievanceType: "",
    grievanceName: "",
    description: "",
    dateOfComplaint: null,
    assignedTeamMember: "",
    assignedTeamMemberDept: "",
    status: "",
    attachment: "",
    slaDueDate: null,
    criticalLevel: "",
    comments: [],
    feedbackRating: null,
    feedbackComment: null,
    customerRegion: null,
    branchRegion: null,
  };

  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const location = useLocation();
  const formMode = location.state?.mode;
  const { token, user, isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();

  const ticketRcvd = location.state?.ticket || {};
  const [ticket, setTicket] = useState({
    ...defaultTicket,
    ...ticketRcvd,
    // Ensure all string fields have default empty string values
    ticketId: ticketRcvd.ticketId || "",
    branchId: ticketRcvd.branchId || "",
    grievanceType: ticketRcvd.grievanceType || "",
    grievanceName: ticketRcvd.grievanceName || "",
    description: ticketRcvd.description || "",
    assignedTeamMember: ticketRcvd.assignedTeamMember || "",
    assignedTeamMemberDept: ticketRcvd.assignedTeamMemberDept || "",
    status: ticketRcvd.status || "",
    attachment: ticketRcvd.attachment || "",
    criticalLevel: ticketRcvd.criticalLevel || "",
    branchRegion: ticketRcvd.branchRegion || "",
    // Set customer ID for customer users
    customerId: ticketRcvd.customerId || (user?.userType === 'customer' ? user.customerId : null),
  });
  // State for branches dropdown
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(currentLanguage === "en" ? (ticket.branchNameEn || "") : (ticket.branchNameLc || ""));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  // State for entity dropdown
  const [entityOptions, setEntityOptions] = useState([
    { value: Constants.ENTITY.VMCO, displayText: t("VMCO") },
    { value: Constants.ENTITY.SHC, displayText: t("SHC") },
    { value: Constants.ENTITY.NAQI, displayText: t("NAQI") },
    { value: Constants.ENTITY.GMTC, displayText: t("GMTC") },
    { value: Constants.ENTITY.DAR, displayText: t("DAR") },
  ]);
  // State for employees dropdown
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(ticket.assignedTo || "");

  // State for departments dropdown
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(ticket.assignedTeamMemberDept || "");

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
  const [fileData, setFileData] = useState([]); // State to hold fetched file data
  // File input ref for videos
  const videoInputRef = useRef(null);

  // State for customer popup
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);

  // State for branch popup
  const [showBranchPopup, setShowBranchPopup] = useState(false);

  // State for file upload loading
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // State for issue type options
  const [issueTypeOptions, setIssueTypeOptions] = useState([]);

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // State for saving
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false); // Track closing state

  // State for Approval Dialog box
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogSubTitle, setDialogSubTitle] = useState('');
  const [approvalAction, setApprovalAction] = useState(null);
  const [dialogPlaceholder, setDialogPlaceholder] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    console.log("isMobile", isMobile);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // Handle image add
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
    formDataUpload.append("containerType", "support");

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
          { fileName, containerType: "support" },
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
          containerType: "support",
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

  // Function to load existing images and videos from attachment field
  const loadExistingFiles = async () => {
    if (formMode === 'edit' && ticket.attachment && ticket.attachment !== 'none') {
      try {
        let attachmentData = {};

        // Parse attachment field - it can be string or object
        if (typeof ticket.attachment === 'string') {
          attachmentData = JSON.parse(ticket.attachment);
        } else {
          attachmentData = ticket.attachment;
        }
        setImages(attachmentData.images || []);
        setVideos(attachmentData.videos || []);
      } catch (error) {
        console.error('Error parsing attachment data:', error);
      }
    }
  };

  //NOTE: For fetching the user again after browser refersh - start
  useEffect(() => {
    if (user) {
      // First fetch departments
      fetchDepartments();

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
    }
  }, [user]);

  // Separate useEffect to handle department selection and employee fetching
  useEffect(() => {
    if (departments.length > 0 && ticket.assignedTeamMemberDept) {
      // Set the selected department from ticket data
      setSelectedDepartment(ticket.assignedTeamMemberDept);

      // Fetch employees for this department
      fetchEmployees(ticket.assignedTeamMemberDept);
    }
  }, [departments, ticket.assignedTeamMemberDept]);

  // Fetch issue type options
  useEffect(() => {
    const fetchIssueTypeOptions = async () => {
      try {
        // Updated URL to include query parameter for supportIssueType master type
        const response = await fetch(`${API_BASE_URL}/basics-masters?filters={"masterName": "supportIssueType"}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${token}`
          },

        });

        if (!response.ok) throw new Error('Failed to fetch issue type options');

        const result = await response.json();

        if (result.status === 'Ok' && result.data) {
          const options = result.data;
          // Extract issue type values from the response data and make them language-aware
          const issueTypeValues = options.map(item => ({
            value: item.value,
            displayText: currentLanguage === "ar" ? item.valueLc : item.value
          }));
          setIssueTypeOptions(issueTypeValues);
        } else if (result.data && Array.isArray(result.data)) {
          const options = result.data;
          // Handle the actual response structure and make them language-aware
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

    fetchIssueTypeOptions();
  }, [currentLanguage, t]);

  // Check loading state first
  if (loading) {
    return <div>{t("msgLoadingUserInfo")}</div>; // Or your loading component
  }

  if (!user) {
    console.log("$$$$$$$$$$$ logging out");
    // Logout instead of showing loading message
    logout();
    navigate("/login", { replace: true });
    return null; // Return null while logout is processing
  }
  //For fetching the user again after browser refersh - End

  //Rbac and other access based on user object to follow below lik this
  const companyNameToShow =
    currentLanguage === "en"
      ? ticket.companyNameEn || (user?.customerCompanyNameEn || "")
      : ticket.companyNameAr || (user?.customerCompanyNameLc || "");
  const rbacMgr = new RbacManager(
    user.userType == "employee" && user.roles[0] !== "admin" ? user.designation : user.roles[0],
    formMode == "add" ? "supDetailAdd" : "supDetailEdit"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  // Check if ticket is in read-only state (closed or cancelled)
  const isReadOnly = !ticket.isOpen && formMode === 'edit';

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

  // Fetch employees from backend
  const fetchEmployees = async (department = null) => {
    const targetDepartment = department || selectedDepartment;
    if (!targetDepartment) {
      setEmployees([]);
      return;
    }

    setLoadingEmployees(true);
    try {
      // Replace with your actual API endpoint URL
      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/employees/pagination?page=1&pageSize=50000&sortOrder=asc&filters={"department": "${targetDepartment}"}`;
      console.log('Fetching employees for department:', targetDepartment);
      console.log('API URL:', apiUrl);

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
      console.log('Employees API response:', resp);
      setEmployees(resp.data.data || []);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Fetch departments from backend
  const fetchDepartments = async () => {
    if (departments.length > 0) return; // Don't fetch if we already have departments

    setLoadingDepartments(true);
    try {
      // Use employees API to get all departments
      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/employees/pagination?page=1&pageSize=5000&sortOrder=asc`;

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

      const result = await response.json();

      if (result.data && result.data.data && Array.isArray(result.data.data)) {
        const employees = result.data.data;
        // Extract unique departments from employees
        const uniqueDepartments = [...new Set(employees
          .map(employee => employee.department)
          .filter(department => department && department.trim() !== '')
        )];

        console.log('Extracted departments:', uniqueDepartments);
        setDepartments(uniqueDepartments);
      } else {
        throw new Error('Unexpected response format for employees');
      }
    } catch (err) {
      console.error("Failed to fetch departments:", err);
    } finally {
      setLoadingDepartments(false);
    }
  };



  // Rest of your existing state variables...
  // State for image popup

  const handleKeyDown = (e) => {
    // These keys indicate user is done with keyboard
    if (
      e.key === "Enter" ||
      e.key === "Go" ||
      e.key === "Search" ||
      e.key === "Done"
    ) {
      if (window.innerWidth <= 768) {
        // Blur the input to close keyboard
        e.target.blur();
        // Remove keyboard class immediately
        document.body.classList.remove("keyboard-open");
      }
    }
  };


  // Open file dialog
  const openFileDialog = () => {
    if (fileInputRef.current) fileInputRef.current.click();
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
      erpCustId: customer.erp_cust_id || customer.erpCustId,
      branchId: "", // Reset branchId when customer changes
      branchNameEn: "", // Optionally reset branch name fields
      branchNameLc: ""
    }));
    setShowCustomerPopup(false);

    setBranches([]); // Clear branches list
    setSelectedBranch(""); // Reset selected branch UI field
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
      erpBranchId: branch.erp_branch_id || branch.erpBranchId,
      branchRegion: branch.region || branch.branchRegion
    }));
    setSelectedBranch(currentLanguage === "en" ? (branch.branch_name_en || branch.branchNameEn) : (branch.branch_name_lc || branch.branchNameLc));
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

  // Handle save
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); // Start saving

    // Basic validation
    if (!ticket.branchId) {
      Swal.fire({
        title: t("Validation Error"),
        text: t("Please select a branch"),
        icon: "warning",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#3085d6",
      });
      setSaving(false);
      return;
    }

    // Add entity validation - make it mandatory
    if (!ticket.entity) {
      Swal.fire({
        title: t("Validation Error"),
        text: t("Please select a business unit"),
        icon: "warning",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#3085d6",
      });
      setSaving(false);
      return;
    }

    if (!ticket.grievanceType) {
      Swal.fire({
        title: t("Validation Error"),
        text: t("Please select an issue type"),
        icon: "warning",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#3085d6",
      });
      setSaving(false);
      return;
    }

    if (!ticket.grievanceName?.trim()) {
      Swal.fire({
        title: t("Validation Error"),
        text: t("Please enter an issue name"),
        icon: "warning",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#3085d6",
      });
      setSaving(false);
      return;
    }

    if (!ticket.description?.trim()) {
      Swal.fire({
        title: t("Validation Error"),
        text: t("Please enter issue details"),
        icon: "warning",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#3085d6",
      });
      setSaving(false);
      return;
    }

    try {
      // Ensure comments is always an array of plain objects and filter out invalid entries
      const commentsArray = Array.isArray(ticket.comments)
        ? ticket.comments.filter((c) => c && typeof c === "object" && !Array.isArray(c))
        : typeof ticket.comments === "string" && ticket.comments.trim().startsWith("[")
          ? (() => {
            try {
              return JSON.parse(ticket.comments).filter(
                (c) => c && typeof c === "object" && !Array.isArray(c)
              );
            } catch {
              return [];
            }
          })()
          : [];

      // Convert dateOfComplaint to ISO string if it's a Date object or object
      let dateOfComplaintValue = ticket.dateOfComplaint;
      if (ticket.dateOfComplaint instanceof Date) {
        dateOfComplaintValue = ticket.dateOfComplaint.toISOString();
      } else if (
        typeof ticket.dateOfComplaint === "object" &&
        ticket.dateOfComplaint !== null &&
        ticket.dateOfComplaint.toISOString
      ) {
        dateOfComplaintValue = ticket.dateOfComplaint.toISOString();
      } else if (
        typeof ticket.dateOfComplaint === "object" &&
        ticket.dateOfComplaint !== null
      ) {
        // If it's an object but not a Date, set to null or empty string
        dateOfComplaintValue = "";
      }

      // Only send required fields
      const ticketData = {
        customerId:
          user?.userType === "customer" ? user.customerId : ticket.customerId,
        branchId: ticket.branchId,
        entity: ticket.entity, // Include entity field
        grievanceType: ticket.grievanceType,
        grievanceName: ticket.grievanceName,
        description: ticket.description,
        dateOfComplaint:
          formMode === "add" ? new Date().toISOString() : dateOfComplaintValue,
        assignedTeamMember: ticket.assignedTeamMember || "",
        assignedTeamMemberDept: ticket.assignedTeamMemberDept || selectedDepartment || "",
        status: formMode === "add" ? "New" : ticket.status,
        attachment:
          formMode === "add"
            ? { images: images || [], videos: videos || [] }
            : ticket.attachment,
        comments: commentsArray,
        branchRegion: ticket.branchRegion,
        isOpen: formMode === "add" ? true : ticket.isOpen,
      };

      if (
        ticketData.assignedTeamMember &&
        ticketData.assignedTeamMember.trim() !== ""
      ) {
        ticketData.status = "In Progress";
      }

      const endPoint =
        formMode === "add" ? "/grievances" : `/grievances/id/${ticket.id}`;
      const method = formMode === "add" ? "POST" : "PATCH";

      const apiUrl = process.env.REACT_APP_API_BASE_URL
        ? `${process.env.REACT_APP_API_BASE_URL}${endPoint}`
        : null;

      if (!apiUrl) {
        throw new Error("API base URL is not configured");
      }

      // Double check: comments must be an array, not a string
      if (!Array.isArray(ticketData.comments)) {
        ticketData.comments = [];
      }

      const { createdAt, ...filterdata } = ticketData;

      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(filterdata),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Save successful:", result);

      const savedTicketId = formMode === "add" ? result.grievance.id : ticket.id;

      // Upload files if there are any images or videos

      // Show success message with SweetAlert and navigate after OK
      await Swal.fire({
        title: t("Success!"),
        text:
          formMode === "add"
            ? t("Ticket created successfully!")
            : t("Ticket updated successfully!"),
        icon: "success",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#28a745",
      });

      // Set editing to false and redirect to support page
      setIsEditing(false);
      navigate("/support");
    } catch (error) {
      console.error("Error saving ticket:", error);

      // Show error message with SweetAlert
      await Swal.fire({
        title: t("Error!"),
        text: t("Failed to save ticket. Please try again."),
        icon: "error",
        confirmButtonText: t("OK"),
        confirmButtonColor: "#dc3545",
      });

      // Keep editing mode active on error
      setIsEditing(true);
    } finally {
      setSaving(false); // End saving
    }
    console.log("Ticket data before save:", images);
  };

  // Handle close ticket
  const handleCloseTicket = () => {
    setDialogTitle('Close Ticket');
    setDialogSubTitle('Are you sure you want to close this ticket? Please provide closing comments.');
    setDialogPlaceholder('Enter closing comment');
    setApprovalAction('close');
    setIsApprovalDialogOpen(true);
  };

  const handleRejectTicket = () => {
    setDialogTitle('Reject Ticket');
    setDialogSubTitle('Do you want to reject this ticket? Please provide a reason.');
    setDialogPlaceholder('Enter rejection reason');
    setApprovalAction('reject');
    setIsApprovalDialogOpen(true);
  };

  const handleCancelTicket = () => {
    setDialogTitle('Cancel Ticket');
    setDialogSubTitle('Are you sure you want to cancel this ticket? Please provide a reason.');
    setDialogPlaceholder('Enter cancellation reason');
    setApprovalAction('cancel');
    setIsApprovalDialogOpen(true);
  };

  const handleCancel = async () => {
    if (formMode === "add") {
      // In add mode, just clean up and navigate
      for (let file of images) {
        await handleRemoveFile(file, "image");
      }
      for (let video of videos) {
        await handleRemoveFile(video, "video");
      }
      navigate("/support");
    } else {
      // In edit mode, call the cancel ticket dialog
      handleCancelTicket();
    }
  };

  const handleApprovalDialogSubmit = async (commentText) => {
    setIsApprovalDialogOpen(false);

    if (!commentText?.trim()) {
      Swal.fire({
        icon: 'error',
        title: t('Error'),
        text: t('Please provide a reason.'),
        confirmButtonText: t('OK'),
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    const newComment = {
      date: formatDate(new Date(), 'DD/MM/YYYY HH:MM'),
      action: approvalAction,
      close: approvalAction === 'close',
      reject: approvalAction === 'reject',
      cancel: approvalAction === 'cancel',
      userId: String(user.userId),
      message: commentText,
      userName: user.userName,
      status: approvalAction === 'close' ? 'Closed' :
        approvalAction === 'reject' ? 'Rejected' :
          approvalAction === 'cancel' ? 'Cancelled' : ticket.status,
    };

    try {
      setClosing(true);

      const updatedComments = Array.isArray(ticket.comments)
        ? [...ticket.comments, newComment]
        : [newComment];

      const newStatus = approvalAction === 'close' ? 'Closed' :
        approvalAction === 'reject' ? 'Rejected' :
          approvalAction === 'cancel' ? 'Cancelled' : ticket.status;

      const ticketUpdatePayload = {
        status: newStatus,
        isOpen: (approvalAction === 'close' || approvalAction === 'reject' || approvalAction === 'cancel') ? false : true,
        comments: updatedComments,
      };

      const apiUrl = `${API_BASE_URL}/grievances/id/${ticket.id}`;
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
      console.log('Ticket updated successfully:', responseResult);

      setTicket(prev => ({
        ...prev,
        status: newStatus,
        comments: updatedComments,
      }));

      await Swal.fire({
        icon: 'success',
        title: t('Success'),
        text: approvalAction === 'close'
          ? t('Ticket closed successfully!')
          : approvalAction === 'reject'
            ? t('Ticket rejected successfully!')
            : t('Ticket cancelled successfully!'),
        confirmButtonText: t('OK'),
        confirmButtonColor: '#28a745'
      });

      navigate('/support');
    } catch (error) {
      console.error('Failed to update ticket:', error);
      await Swal.fire({
        icon: 'error',
        title: t('Error'),
        text: t('Failed to update ticket. Please try again.'),
        confirmButtonText: t('OK'),
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setClosing(false);
    }
  };


  // Add comment to ticket.comments in correct format and save to backend immediately
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
        const apiUrl = `${API_BASE_URL}/grievances/id/${ticket.id}`;

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

      const apiUrl = `${API_BASE_URL}/grievances/id/${ticket.id}`;

      const response = await fetch(apiUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          feedbackComment: ticket.feedback.trim() // Ensure it's trimmed
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

  // Handle department selection
  const handleDepartmentChange = (e) => {
    const department = e.target.value;
    console.log('Department selected:', department);
    setSelectedDepartment(department);
    setTicket(prev => ({
      ...prev,
      assignedTeamMemberDept: department,
      assignedTeamMember: "" // Reset selected employee when department changes
    }));
    setSelectedEmployee("");
    setEmployees([]); // Clear current employees

    if (department) {
      console.log('Fetching employees for department:', department);
      fetchEmployees(department);
    }
  };

  return (
    // <Sidebar title={`${formMode === "add" ? t("New Ticket") : `${t("Ticket# ")}${ticket.ticketId}`}`} >

    <Sidebar title={t("Support")} >
      <div className='support-details-container'>
        <h2 className='support-details-title'>{formMode === "add" ? t("New Ticket") : `${t("Ticket#")}${ticket.ticketId}`}</h2>
        <div className='support-details-section'>
          <h3 className='support-details-subtitle'>{t("Ticket Details")}</h3>
          <div className='support-details-grid'>
            {isV('customerName') && (
              <div className='support-details-field'>
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
              <div className='support-details-field'>
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
            {/* {isV('entity') && (
              <div className='support-details-field'>
                <label>{t("Business Unit")} *</label>
                <select
                  id='entity'
                  name='entity'
                  value={ticket.entity || ""}
                  onChange={handleInputChange}
                  disabled={!isE("entity") || isReadOnly}
                  style={{
                    color: '#999',
                  }}
                >
                  <option value="" style={{ color: '#000000ff' }}>
                    {t("Select Business Unit")}
                  </option>
                  {entityOptions.map((entity, index) => (
                    <option
                      key={index}
                      value={entity.value || entity}
                      style={{ color: '#000' }}
                    >
                      {entity.displayText || entity}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {isV('issueType') && (
              <div className='support-details-field'>
                <label>{t("Issue Type")} *</label>
                <select
                  id='grievanceType'
                  name='grievanceType'
                  value={ticket.grievanceType || ""}
                  onChange={handleInputChange}
                  disabled={!isE("issueType") || isReadOnly}
                  style={{
                    color: '#999',
                  }}
                >
                  <option value="" style={{ color: '#000000ff' }}>{t("Select Issue Type")}</option>
                  {issueTypeOptions.map((issueType, index) => (
                    <option key={index} value={issueType.value || issueType} style={{ color: '#000' }}>
                      {issueType.displayText || issueType}
                    </option>
                  ))}
                </select>
              </div>
            )} */}
            {isV("entity") && (
              <div className="support-details-field">
                <label>{t("Business Unit")} *</label>

                <SearchableDropdown
                  name="entity"
                  options={entityOptions.map((entity) =>
                    typeof entity === "object"
                      ? { name: entity.displayText, value: entity.value }
                      : { name: entity, value: entity }
                  )}
                  value={ticket.entity || null}
                  onChange={handleInputChange}
                  disabled={!isE("entity") || isReadOnly}
                  placeholder={t("Select Business Unit")}
                  className="entity-dropdown"
                />
              </div>
            )}
            {isV("issueType") && (
              <div className="support-details-field">
                <label>{t("Issue Type")} *</label>

                <SearchableDropdown
                  name="grievanceType"
                  options={issueTypeOptions.map((issueType) =>
                    typeof issueType === "object"
                      ? { name: issueType.displayText, value: issueType.value }
                      : { name: issueType, value: issueType }
                  )}
                  value={ticket.grievanceType || null}
                  onChange={handleInputChange}
                  disabled={!isE("issueType") || isReadOnly}
                  placeholder={t("Select Issue Type")}
                  className="issue-type-dropdown"
                />
              </div>
            )}

            {isV('issueName') && (
              <div className='support-details-field'>
                <label>{t("Issue Name")} *</label>
                <input id='grievanceName' name='grievanceName' onChange={handleInputChange} value={ticket.grievanceName || ""} disabled={!isE("issueName") || isReadOnly} />
              </div>
            )}
            {isV('createdDate') ? (
              <div className='support-details-field'>
                <label>{t("Created Date")}</label>
                <input value={formatDate(ticket.updatedAt, "DD/MM/YYYY")} disabled />
              </div>
            ) : null}
          </div>
          {isV('issueDetails') && (
            <div className='support-details-field support-details-textarea'>
              <label>{t("Issue Details")} *</label>
              <textarea
                id='description'
                name='description'
                onChange={handleInputChange}
                value={ticket.description || ""}
                disabled={!isE("issueDetails") || isReadOnly}
                onFocus={() => {
                  if (window.innerWidth <= 768) {
                    // This could trigger hiding the bottom menu
                    document.body.classList.add("keyboard-open");
                  }
                }}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  document.body.classList.remove("keyboard-open");
                  // 👈 show menu again (optional)
                }} />
            </div>
          )}

          {isV('attachments') && (
            <div className='attachments'>
              {isV('images') && (
                <div className='maintenance-details-images'>
                  <label>{t("Images")}</label>
                  <div className='maintenance-images-list'>
                    {isV('addImage') && isE('addImage') && !isReadOnly && images.length <= 6 && (
                      <button type='button' className='maintenance-add-image-btn' onClick={openFileDialog} title='Add Image'>
                        +
                      </button>
                    )}
                    {images.length <= 6 && <input type='file' accept='image/png,image/jpg,image/jpeg' ref={fileInputRef} style={{ display: "none" }} onChange={(e) => handleFileUpload(e, "image")} />}
                    <div className="scrollable-image-row">
                      {/* Loading spinner for image upload */}
                      {uploadingImage && (
                        <div className='maintenance-image-placeholder upload-loading'>
                          <LoadingSpinner size="small" />
                        </div>
                      )}
                      {fileData.map((imageData, idx) => (
                        <div
                          key={idx}
                          className="maintenance-image-placeholder"
                          onClick={() => imageData.url && setPopupImage(imageData.url)}
                          title={imageData.url ? "Click to view" : ""}
                        >
                          <img
                            width="100%"
                            height="100%"
                            style={{ objectFit: "cover" }}
                            src={imageData.url}
                            alt={`file-${idx}`}
                          />
                          {isV("removeImage") && isE("removeImage") && !isReadOnly && (
                            <button
                              className="maintenance-remove-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(imageData.fileName, "image");
                              }}
                              title={t("Remove Image")}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
              )}
              {isV('videos') && (
                <div className='maintenance-details-videos'>
                  <label>{t("Videos")}</label>
                  <div className='maintenance-images-list'>
                    {/* Add Video Button */}
                    {isE('addVideo') && !isReadOnly && videos?.length <= 6 && (
                      <button type='button' className='maintenance-add-image-btn' onClick={openVideoDialog} title='Add Video'>
                        +
                      </button>
                    )}
                    {videos?.length <= 6 && <input type='file' accept='video/*' ref={videoInputRef} style={{ display: "none" }} onChange={(e) => handleFileUpload(e, "video")} />}
                    <div className="scrollable-image-row">
                      {/* Loading spinner for video upload */}
                      {uploadingVideo && (
                        <div className='maintenance-video-placeholder upload-loading'>
                          <LoadingSpinner size="small" />
                        </div>
                      )}
                      {videoData.map((videoData, idx) => (
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
                </div>
              )}
            </div>
          )}

          {isV('feedback') && ticket.status?.toLowerCase() === 'closed' && (
            <div className='support-details-field support-details-textarea'>
              <label>{t("Customer Feedback")}</label>
              <textarea
                id='feedback'
                name='feedback'
                onChange={handleInputChange}
                value={ticket?.feedbackComment}
                disabled={!isE("feedback") || ticket?.feedbackComment}
                onFocus={() => {
                  if (window.innerWidth <= 768) {
                    // This could trigger hiding the bottom menu
                    document.body.classList.add("keyboard-open");
                  }
                }}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  document.body.classList.remove("keyboard-open");
                  // 👈 show menu again (optional)
                }}
              />
              {isV('feedbackButton') && !ticket.feedbackComment && (
                <button className='feedback-btn' style={{
                  backgroundColor: "var(--logo-deep-green)",
                  color: "var(--bg-white)",
                  border: "none",
                  width: isMobile ? "100%" : "140px",
                  padding: "10px 16px",
                  borderRadius: "var(--border-radius)",
                  cursor: "pointer",
                  marginTop: "10px",
                  marginLeft: "auto",
                  /* Default for LTR */
                  marginRight: "10px"
                }} onClick={handleAddFeedback} disabled={!!ticket?.feedbackComment}>
                  {t("Submit Feedback")}
                </button>
              )}
            </div>
          )}

        </div>
      </div>
      <div className='support-details-footer' style={{ alignItems: 'center' }}>
        {isV('ticketStatus') && (
          <div className='support-status'>
            <span>{t("Ticket Status :")}</span>
            <span className={`order-status-badge status-${ticket.status?.replace(/\s/g, "").toLowerCase()}`}>{t(ticket.status)}</span>
          </div>
        )}
        <div className='support-details-container-center'  >
          {isV('assignedTo') && (
            <div className="support-assign">
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: '6px' }}>
                {/* Assigned to Label */}
                <span>{formMode === "add" ? t("Assign To:") : t("Assigned To:")}</span>

                {/* Department Selection */}
                <div>
                  <span>{t("Department:")}</span>
                  <SearchableDropdown
                    name="assignedTeamMemberDept"
                    options={departments}
                    value={selectedDepartment || ""}
                    onChange={(e) => handleDepartmentChange({ target: { value: e.target.value } })}
                    disabled={!isEditing || loadingDepartments || isReadOnly || !isE('assignedTo')}
                    placeholder={t('Select Department')}
                    className={!isMobile ? "" : "mobile-select-branch location-select"}
                    openUpwards={true}
                  />
                </div>

                {/* Assignee Selection */}
                <div>
                  <span>{t("Employee:")}</span>
                  <SearchableDropdown
                    name="assignedTeamMember"
                    options={employees.map(emp => ({ name: emp.name, employeeId: emp.employeeId }))}
                    value={ticket.assignedTeamMember || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing || !selectedDepartment || isReadOnly || !isE('assignedTo')}
                    placeholder={!selectedDepartment ? t('Select department first') : t('Select Assignee')}
                    className={!isMobile ? "" : "mobile-select-branch location-select"}
                    openUpwards={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className='support-details-container-right'>
          <div className="support-details-actions" style={{ display: 'flex', gap: '10px', height: '60px' }}>
            {isEditing ? (
              <>
                {isV('btnSave') && isE('btnSave') && (
                  <button
                    className="support-action-btn save"
                    onClick={handleSave}
                    disabled={saving || closing || isReadOnly}
                  >
                    {saving ? t("Saving...") : t("Save")}
                  </button>
                )}
                {/* Close Ticket Button - only show for existing tickets that are not already closed */}
                {formMode === "edit" && !isReadOnly && isV('btnCloseTicket') && isE('btnCloseTicket') && (
                  <button
                    className="support-action-btn close"
                    onClick={handleCloseTicket}
                    disabled={closing || saving}
                    style={{ backgroundColor: "#28a745", padding: isMobile ? "10px 24px" : "0px 24px" }}
                  >
                    {closing ? t("Closing...") : t("Close Ticket")}
                  </button>
                )}

                {/* Reject Ticket Button - for edit mode */}
                {formMode === "edit" && !isReadOnly && isV('btnReject') && isE('btnReject') && (
                  <button
                    className="support-action-btn reject"
                    onClick={handleRejectTicket}
                    disabled={closing || saving}
                    style={{ backgroundColor: "#dc3545" }}
                  >
                    {t("Reject")}
                  </button>
                )}

                {/* Cancel Button */}
                {isV('btnCancel') && isE('btnCancel') && (
                  <button
                    className="support-action-btn cancel"
                    onClick={handleCancel}
                    disabled={isReadOnly || saving || closing}
                  >
                    {t("Cancel")}
                  </button>
                )}
              </>
            ) : null}
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

      {isV('commentPanel') && formMode === 'edit' && (
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
          isVisible={user?.userType === 'employee' && formMode === 'edit' && isV('commentPanel')}
        />
      )}

      {/* Customer Selection Popup */}
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

      {/* Branch Selection Popup */}
      <GetBranches
        open={showBranchPopup}
        onClose={() => setShowBranchPopup(false)}
        onSelectBranch={handleSelectBranch}
        customerId={user?.userType === 'customer' ? user.customerId : ticket.customerId}
        API_BASE_URL={API_BASE_URL}
        t={t}
      />

      {/* Approval Dialog box Popup */}
      <ApprovalDialog
        action={approvalAction}
        isOpen={isApprovalDialogOpen}
        onClose={() => setIsApprovalDialogOpen(false)}
        onSubmit={handleApprovalDialogSubmit}
        title={dialogTitle}
        subtitle={dialogSubTitle}
        placeholder={dialogPlaceholder}
      />

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
}`
        }
      </style>
    </Sidebar>
  );
}

export default SupportDetails;

