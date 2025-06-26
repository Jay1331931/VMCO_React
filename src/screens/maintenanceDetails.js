import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/components.css";
import CommentPopup from "../components/commentPanel";
import GetCustomers from "../components/GetCustomers";
import GetBranches from "../components/GetBranches";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import formatDate from "../utilities/dateFormatter";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

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
    chargers: null,
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
  });

  // State for branches dropdown
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(currentLanguage === "en" ? (ticket.branchNameEn || "") : (ticket.branchNameLc || ""));

  // State for employees dropdown
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(ticket.assignedTo || "");

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

        console.log('Loading existing files from attachment:', attachmentData);

        // Load images
        if (attachmentData.images && Array.isArray(attachmentData.images)) {
          const imagePromises = attachmentData.images.map(async (imageItem) => {
            try {
              // Handle both old format (string) and new format (object)
              const fileName = typeof imageItem === 'string' ? imageItem : imageItem.fileName || imageItem;

              if (!fileName) return null;

              console.log('Loading image:', fileName);

              // Fetch image from backend
              const response = await fetch(`${API_BASE_URL}/maintenance/file/${fileName}`, {
                method: 'GET',
                credentials: 'include'
              });

              if (response.ok) {
                const blob = await response.blob();
                const dataUrl = await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = (e) => resolve(e.target.result);
                  reader.readAsDataURL(blob);
                });

                return {
                  dataUrl,
                  fileName,
                  originalName: typeof imageItem === 'object' ? imageItem.originalName || fileName : fileName,
                  isExisting: true
                };
              } else {
                console.warn(`Failed to load image ${fileName}: ${response.status}`);
              }
            } catch (error) {
              console.error(`Error loading image ${imageItem}:`, error);
            }
            return null;
          });

          const loadedImages = await Promise.all(imagePromises);
          const validImages = loadedImages.filter(img => img !== null);
          console.log('Loaded images:', validImages.length);
          setImages(validImages);
        }

        // Load videos
        if (attachmentData.videos && Array.isArray(attachmentData.videos)) {
          const videoPromises = attachmentData.videos.map(async (videoItem) => {
            try {
              // Handle both old format (string) and new format (object)  
              const fileName = typeof videoItem === 'string' ? videoItem : videoItem.fileName || videoItem;

              if (!fileName) return null;

              console.log('Loading video:', fileName);

              // Fetch video from backend
              const response = await fetch(`${API_BASE_URL}/maintenance/file/${fileName}`, {
                method: 'GET',
                credentials: 'include'
              });

              if (response.ok) {
                const blob = await response.blob();
                const dataUrl = await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = (e) => resolve(e.target.result);
                  reader.readAsDataURL(blob);
                });

                return {
                  dataUrl,
                  fileName,
                  originalName: typeof videoItem === 'object' ? videoItem.originalName || fileName : fileName,
                  isExisting: true
                };
              } else {
                console.warn(`Failed to load video ${fileName}: ${response.status}`);
              }
            } catch (error) {
              console.error(`Error loading video ${videoItem}:`, error);
            }
            return null;
          });

          const loadedVideos = await Promise.all(videoPromises);
          const validVideos = loadedVideos.filter(vid => vid !== null);
          console.log('Loaded videos:', validVideos.length);
          setVideos(validVideos);
        }
      } catch (error) {
        console.error('Error parsing attachment data:', error);
      }
    }
  };

  //NOTE: For fetching the user again after browser refresh - start
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
    }
  }, [user]);

  // Fetch issue type options
  useEffect(() => {
    const fetchIssueTypeOptions = async () => {
      try {
        // Updated URL to include query parameter for maintenanceIssueType master type
        const response = await fetch(`${API_BASE_URL}/basics-masters?filters={"masterName": "maintenanceIssueType"}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to fetch issue type options');

        const result = await response.json();

        if (result.status === 'Ok' && result.data) {
          const options = result.data;
          // Extract issue type values from the response data
          const issueTypeValues = options.map(item => item.value);
          setIssueTypeOptions(issueTypeValues);
        } else if (result.data && Array.isArray(result.data)) {
          const options = result.data;
          // Handle the actual response structure we're seeing in the logs
          const issueTypeValues = options.map(item => item.value);
          setIssueTypeOptions(issueTypeValues);
        } else {
          throw new Error('Unexpected response format for issue type options');
        }
      } catch (err) {
        console.error('Error fetching issue type options:', err);
      }
    };

    fetchIssueTypeOptions();
  }, []);

  // Check loading state first
  if (loading) {
    return <div>{t("msgLoadingUserInfo")}</div>; // Or your loading component
  }

  if (!user) {
    console.log("$$$$$$$$$$$ logging out");
    // Logout instead of showing loading message
    logout();
    navigate("/login");
    return null; // Return null while logout is processing
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

  // Fetch employees from backend
  const fetchEmployees = async () => {
    if (employees.length > 0) return; // Don't fetch if we already have employees
    const maintenanceStaffDesignation = "sales executive";
    setLoadingEmployees(true);
    try {
      // Replace with your actual API endpoint URL
      const apiUrl = process.env.REACT_APP_API_BASE_URL
        ? `${process.env.REACT_APP_API_BASE_URL}/employees/pagination?page=1&pageSize=10&sortOrder=asc&filters={"designation": "${maintenanceStaffDesignation}"}`
        : "http://localhost:3000/api/maintenance/employees";

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const resp = await response.json();
      setEmployees(resp.data.data || []);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
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

  // Handle save
  const handleSave = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!ticket.branchId) {
      alert(t("Please select a branch"));
      return;
    }
    if (!ticket.issueType) {
      alert(t("Please select an issue type"));
      return;
    }
    if (!ticket.issueName?.trim()) {
      alert(t("Please enter an issue name"));
      return;
    }
    if (!ticket.issueDetails?.trim()) {
      alert(t("Please enter issue details"));
      return;
    }

    try {
      // First, create the ticket to get the ID for file uploads
      const ticketData = {
        ...ticket,
        // Ensure customer ID is set correctly
        customerId: user?.userType === 'customer' ? user.customerId : ticket.customerId,
        // Set creation date for new tickets
        createdAt: formMode === "add" ? new Date().toISOString() : ticket.createdAt,
        // Set default status for new tickets
        status: formMode === "add" ? "New" : ticket.status,
        // Ensure comments is properly formatted
        comments: typeof ticket.comments === 'string' ? ticket.comments : JSON.stringify(ticket.comments || [])
      };

      // Remove id and requestId for new tickets (let database auto-generate them)
      if (formMode === "add") {
        delete ticketData.id;
        delete ticketData.requestId;
        // Set initial attachment to "none" for new tickets
        ticketData.attachment = "none";
      }

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
      if (images.length > 0 || videos.length > 0) {
        await uploadFilesAndUpdateAttachment(ticketId);
      }

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

  const handleAddComment = async () => {
    try {
      const endPoint = "/maintenance/id/" + ticket.id;
      const method = "PATCH";

      const apiUrl = process.env.REACT_APP_API_BASE_URL ? `${process.env.REACT_APP_API_BASE_URL}${endPoint}` : null;
      const response = await fetch(apiUrl, {
        method: method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(ticket),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error saving ticket:", error);
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
                    style={{ cursor: isE("branch") ? 'pointer' : 'default' }}
                    onClick={() => isE("branch") && (user?.userType === 'customer' || ticket.customerId) && setShowBranchPopup(true)}
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
              {isV('createdDate') && formMode === "edit" && (
                <div className='maintenance-details-field'>
                  <label>{t("Created Date")}</label>
                  <input value={formatDate(ticket.createdAt, "YYYY-MM-DD HH:SS")} disabled />
                </div>
              )}
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
                      {isV('addImage') && isE('addImage') && (
                        <button type='button' className='maintenance-add-image-btn' onClick={openFileDialog} title='Add Image'>
                          +
                        </button>
                      )}
                      <input type='file' accept='image/*' ref={fileInputRef} style={{ display: "none" }} onChange={handleAddImage} />
                      {images.map((imageData, idx) => (
                        <div key={idx} className='maintenance-image-placeholder' onClick={() => imageData.dataUrl && setPopupImage(imageData.dataUrl)} title={imageData.dataUrl ? "Click to view" : ""}>
                          <img width='100%' height='100%' style={{ objectFit: "cover" }} src={imageData.dataUrl} />
                          {isV("removeImage") && isE("removeImage") && (
                            <button
                              className='maintenance-remove-btn'
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent opening the image
                                handleRemoveImage(idx);
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
                      {isE('addVideo') && (
                        <button type='button' className='maintenance-add-image-btn' onClick={openVideoDialog} title='Add Video'>
                          +
                        </button>
                      )}
                      <input type='file' accept='video/*' ref={videoInputRef} style={{ display: "none" }} onChange={handleAddVideo} />
                      {videos.map((videoData, idx) => (
                        <div key={idx} className='maintenance-video-placeholder' onClick={() => videoData.dataUrl && setPopupVideo(videoData.dataUrl)} title={videoData.dataUrl ? "Click to view" : ""}>
                          <video width='100%' height='100%' style={{ objectFit: "cover" }} src={videoData.dataUrl} />
                          {isV("removeVideo") && isE("removeVideo") && (
                            <button
                              className='maintenance-remove-btn'
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent opening the video
                                handleRemoveVideo(idx);
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
                <select
                  id="assignedTeamMember"
                  name="assignedTeamMember"
                  value={ticket.assignedTeamMember || ""}
                  onChange={handleInputChange}
                  disabled={!isE('assignedTo')}
                >
                  <option value="">{t('Select Assignee')}</option>
                  {loadingEmployees ? (
                    <option>{t("Loading employees...")}</option>
                  ) : employees.length > 0 ? (
                    employees.map(employee => (
                      <option key={employee.id} value={employee.employeeId}>
                        {employee.name}
                      </option>
                    ))
                  ) : (
                    <option value={ticket.assignedTo}>{ticket.assignedTo || "Select Employee"}</option>
                  )}
                </select>
              </div>
            )}
            <div className="support-details-actions" style={{ paddingRight: "20px" }}>
              {isEditing ? (
                <>
                  {isV('btnSave') && isE('btnSave') && <button className="support-action-btn save " onClick={handleSave}>{t("Save")}</button>}
                  {isV('btnCancel') && isE('btnCancel') && <button className="support-action-btn cancel" onClick={handleCancel}>{t("Cancel")}</button>}
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
            externalComments={ticket.comments}
            currentUser={{ userName: user.userName, userId: user.userId }}
            isVisible={formMode !== "add" && isV("commentIcon")}
          />
        )}

        {/* Customer Selection Popup */}
        <GetCustomers
          open={showCustomerPopup}
          onClose={() => setShowCustomerPopup(false)}
          onSelectCustomer={handleSelectCustomer}
          API_BASE_URL={API_BASE_URL}
          t={t}
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
      </Sidebar>
    );
}

export default MaintenanceDetails;
