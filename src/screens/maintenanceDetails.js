import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/components.css";
import CommentPopup from "../components/commentPanel";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import formatDate from "../utilities/dateFormatter";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import { useNavigate } from "react-router-dom";
import MaintenanceCharges from "../components/maintenanceCharges";

function MaintenanceDetails() {
  // All hooks at the top
  const { token, user, isAuthenticated, logout, loading } = useAuth();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const location = useLocation();
  const formMode = location.state?.mode;
  const navigate = useNavigate();

  const defaultTicket = {
    id: null,
    requestId: null,
    customerId: null,
    branchId: null,
    category: null,
    issueName: null,
    issueDetails: null,
    urgencyLevel: null,
    machineSerialNumber: null,
    warrantyEndDate: null,
    attachment: null,
    status: null,
    assignedTeamMember: null,
    assignedTeamMemberDept: null,
    comments: [],
    chargers: null,
    customerRegion: null,
    branchRegion: null,
  };

  // All useState hooks
  const [ticket, setTicket] = useState(location.state?.ticket || defaultTicket);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  //const [selectedBranch, setSelectedBranch] = useState(currentLanguage === "en" ? ticket.branchNameEn : ticket.branchNameAr);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  //const [selectedEmployee, setSelectedEmployee] = useState(ticket.assignedTo || "");
  const [isEditing, setIsEditing] = useState(true);
  const [popupImage, setPopupImage] = useState(null);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const [images, setImages] = useState(ticket.attachment?.images || []);
  const fileInputRef = useRef(null);
  const [popupVideo, setPopupVideo] = useState(null);
  const [videos, setVideos] = useState(ticket.attachment?.videos || []);
  const videoInputRef = useRef(null);
  // const [maintenanceCharges, setMaintenanceCharges] = useState({
  //   serviceCharges: ticket.charges?.serviceCharges || 0,
  //   partsCharges: ticket.charges?.partsCharges || [{ partName: "", qty: 1, amount: 0 }],
  // });

  // Use useEffect for fetching data
  useEffect(() => {
    if (user) {
      fetchEmployees();
      fetchBranches();
    }
  }, [user]);

  // Check loading state first
  if (loading) {
    return <div>{t("msgLoadingUserInfo")}</div>; // Or your loading component
  }

  if (!user) {
    logout();
    navigate("/login");
    return null;
  }

  const companyNameToShow =
    currentLanguage === "en"
      ? ticket.companyNameEn
        ? ticket.companyNameEn
        : user.customerCompanyNameEn
      : ticket.companyNameAr
      ? ticket.companyNameAr
      : user.customerCompanyNameLc;

  // RBAC - only after we confirm user exists
  console.log("RRRRRRRRR:", JSON.stringify(user));
  const rbacMgr = new RbacManager(
    user.userType === "employee" && user.roles[0] !== "admin" ? user.designation : user.roles[0],
    formMode === "add" ? "maintDetailAdd" : "maintDetailEdit"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  // Fetch branches when dropdown is clicked
  const fetchBranches = async () => {
    if (branches.length > 0) return; // Don't fetch if we already have branches

    setLoadingBranches(true);
    try {
      const apiUrl = process.env.REACT_APP_API_BASE_URL
        ? `${process.env.REACT_APP_API_BASE_URL}/customer-branches/cust-id/${ticket.customerId ? ticket.customerId : user.customerId}`
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
      console.error("Failed to fetch branches:", err);
    } finally {
      setLoadingBranches(false);
    }
  };

  // Fetch employees from backend
  const fetchEmployees = async () => {
    if (employees.length > 0) return; // Don't fetch if we already have employees

    setLoadingEmployees(true);
    try {
      const supportStaffDesignation = "sales executive";

      const apiUrl = process.env.REACT_APP_API_BASE_URL
        ? `${process.env.REACT_APP_API_BASE_URL}/employees/pagination?page=1&pageSize=10&sortOrder=asc&filters={"designation": "${supportStaffDesignation}"}`
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

  // Handle branch click to load options
  const handleBranchClick = () => {
    if (isEditing) {
      //fetchBranches();
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log("3####################### name, value:" + name + "+" + value);
    setTicket((prev) => ({ ...prev, [name]: value }));

    // Special handling for customer selection
    if (name === "customerId" && value) {
      fetchBranches(value);
      // Reset branch when customer changes
      setTicket((prev) => ({ ...prev, branchId: "" }));
    }

    console.log("The ticket upon change:", JSON.stringify(ticket));
  };
  // Handle branch selection
  // const handleBranchChange = (e) => {
  //   setSelectedBranch(e.target.value);
  // };

  // // Handle employee selection
  // const handleEmployeeChange = (e) => {
  //   setSelectedEmployee(e.target.value);
  // };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  // Handle image add
  const handleAddImage = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages((prev) => [...prev, ev.target.result]);
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
        setVideos((prev) => [...prev, ev.target.result]);
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

  // Handle save functionality
  const handleSave = async () => {
    try {
      setIsEditing(false);

      // Prepare files for upload
      const imageFiles = images
        .map((dataUrl, index) => {
          const fileName = getUniqueFileName("image", dataUrl, index);
          return fileName ? dataURLtoFile(dataUrl, fileName) : null;
        })
        .filter(Boolean); // Filter out null values (already uploaded images)

      const videoFiles = videos
        .map((dataUrl, index) => {
          const fileName = getUniqueFileName("video", dataUrl, index);
          return fileName ? dataURLtoFile(dataUrl, fileName) : null;
        })
        .filter(Boolean); // Filter out null values (already uploaded videos)

      // Only upload if there are new files
      let uploadedFiles = [];
      if (imageFiles.length > 0 || videoFiles.length > 0) {
        uploadedFiles = await uploadFilesToBlobStorage(imageFiles, videoFiles);
      }
      uploadedFiles = uploadedFiles.files || [];
      // Prepare updated ticket with file URLs
      const updatedImages = images.map((img, idx) =>
        img.startsWith("data:") && uploadedFiles[idx] && uploadedFiles[idx].originalName.startsWith("image_") ? uploadedFiles[idx].url : img
      );

      const updatedVideos = videos.map((vid, idx) =>
        vid.startsWith("data:") && uploadedFiles[images.length + idx] && uploadedFiles[images.length + idx].originalName.startsWith("video_")
          ? uploadedFiles[images.length + idx].url
          : vid
      );

      if (formMode === "add" && !ticket.id) {
        const attachments = {
          images: updatedImages,
          videos: updatedVideos,
        };

        ticket.customerId = user.customerId;
        ticket.attachment = attachments;
        ticket.comments = "[]";
        ticket.status = "New";
      }

      // Update ticket with file URLs and other fields
      const ticketToSave = {
        ...ticket,
      };

      const endPoint = formMode === "add" ? "/maintenance" : "/maintenance/id/" + ticket.id;
      const method = formMode === "add" ? "POST" : "PATCH";

      const apiUrl = process.env.REACT_APP_API_BASE_URL ? `${process.env.REACT_APP_API_BASE_URL}${endPoint}` : null;

      const response = await fetch(apiUrl, {
        method: method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(ticketToSave),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Update local state with saved ticket data
      const savedTicket = await response.json();
      setTicket(savedTicket);
      setImages(savedTicket.attachment?.images || []);
      setVideos(savedTicket.attachment?.videos || []);

      // Navigate back to maintenance page after successful save
      navigate("/maintenance");
    } catch (error) {
      console.error("Error saving maintenance ticket:", error);
      // Re-enable editing if save fails
      setIsEditing(true);
    }
  };

  // Handle cancel operation
  const handleCancel = () => {
    // Navigate back to maintenance page
    navigate("/maintenance");
  };

  // Handle comment updates
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

      // Update local state with the updated ticket that includes new comments
      const updatedTicket = await response.json();
      setTicket(updatedTicket);
    } catch (error) {
      console.error("Error updating ticket comments:", error);
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

  // Convert data URL to File object
  const dataURLtoFile = (dataUrl, filename) => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  };

  // Generate a unique filename for Azure Blob Storage
  const getUniqueFileName = (prefix, dataUrl, index) => {
    if (!dataUrl.startsWith("data:")) return null;

    // Extract file extension from MIME type
    const fileExt = dataUrl.split(";")[0].split("/")[1];

    // Generate unique components
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const userId = user.userId || "unknown";

    // Create format: prefix_userId_timestamp_randomString_index.extension
    return `${prefix}_${userId}_${timestamp}_${randomString}_${index}.${fileExt}`;
  };

  // Upload files to Azure Blob Storage
  const uploadFilesToBlobStorage = async (imageFiles, videoFiles) => {
    try {
      const formData = new FormData();

      formData.append("uploadModule", "maintenance");
      // Add image files to formData
      imageFiles.forEach((file) => {
        formData.append("files", file, file.name);
      });

      // Add video files to formData
      videoFiles.forEach((file) => {
        formData.append("files", file, file.name);
      });

      const apiUrl = process.env.REACT_APP_API_BASE_URL
        ? `${process.env.REACT_APP_API_BASE_URL}/upload-multiple`
        : "http://localhost:3000/api/blob-storage/upload";

      const response = await fetch(apiUrl, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error uploading files:", error);
      throw error;
    }
  };

  return (
    <Sidebar title={`${formMode === "add" ? t("New Request") : `${t("Request# ")}${ticket.requestId}`}${isCommentPanelOpen ? "collapsed" : ""}`}>
      <div className='maintenance-details-container'>
        <h2 className='maintenance-details-title'>{formMode === "add" ? t("New Request") : `${t("Request# ")}${ticket.requestId}`}</h2>
        <div className='maintenance-details-section'>
          <h3 className='maintenance-details-subtitle'>{t("Ticket Details")}</h3>
          <div className='maintenance-details-grid'>
            
            {isV("customerName") && (
              <div className='maintenance-details-field'>
                <label>{t("Customer Name")}</label>
                <input value={companyNameToShow} disabled />
              </div>
            )}
            {isV('branchName') && (
              <div className='maintenance-details-field'>
                <label htmlFor='branchId'>{t("Branch")} *</label>
                <select id='branchId' name='branchId' value={ticket.branchId} disabled={!isE("branch")} onChange={handleInputChange}>
                  <option value=''>{t("Select Branch")}</option>
                  {loadingBranches ? (
                    <option disabled>{t("loading")}</option>
                  ) : branches.length > 0 ? (
                    branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {currentLanguage === "en" ? branch.branchNameEn : branch.branchNameLc}
                      </option>
                    ))
                  ) : (
                    <option>{currentLanguage === "en" ? ticket.branchNameEn : ticket.branchNameLc}</option>
                  )}
                </select>
              </div>
            )}
            {isV('issueType') && (
              <div className='maintenance-details-field'>
                <label htmlFor='issueType'>{t("Issue Type")} *</label>
                <select id='category' name='category' onChange={handleInputChange} value={ticket.category} disabled={!isE("issueType")}>
                  <option value=''>{t("Select Issue Type")}</option>
                  <option>Payment</option>
                  <option>Delivery</option>
                  <option>Product</option>
                </select>
              </div>
            )}
            {isV('issueName') && (
              <div className='maintenance-details-field'>
                <label htmlFor='issueName'>{t("Issue Name")} *</label>
                <input id='issueName' name='issueName' onChange={handleInputChange} value={ticket.issueName} disabled={!isE("issueName")} />
              </div>
            )}
            {isV('urgencyLevel') && (
              <div className='maintenance-details-field'>
                <label>{t("Criticality")} *</label>
                <select id='urgencyLevel' name='urgencyLevel' onChange={handleInputChange} value={ticket.urgencyLevel} disabled={!isE("urgencyLevel")}>
                  <option value=''>{t("Select Criticality")}</option>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            )}
            {isV("createdDate") && formMode === "edit" && (
              <div className='maintenance-details-field'>
                <label htmlFor='createdDate'>{t("Created Date")} *</label>
                <input value={formatDate(ticket.createdAt, "YYYY-MM-DD HH:MM")} disabled />
              </div>
            )}
            {isV('machineSerialNumber') && (
              <div className='maintenance-details-field'>
                <label htmlFor='machineSerialNumber'>{t("Machine Serial Number")} </label>
                <input
                  id='machineSerialNumber'
                  name='machineSerialNumber'
                  onChange={handleInputChange}
                  value={ticket.machineSerialNumber}
                  disabled={!isE("machineSerialNumber")}
                />
              </div>
            )}
            {isV("warrantyEndDate") && (
              <div className='maintenance-details-field'>
                <label>{t("Warranty Date")} *</label>
                <input value={formatDate(ticket.warrantyEndDate, "YYYY-MM-DD")} disabled />
              </div>
            )}
          </div>
          {isV('issueDetails') && (
            <div className='maintenance-details-field maintenance-details-textarea'>
              <label>{t("Issue Details")}</label>
              <textarea id='issueDetails' name='issueDetails' onChange={handleInputChange} value={ticket.issueDetails} disabled={!isE("issueDetails")} />
            </div>
          )}
          {isV('attachments') && (
            <div className='attachments'>
              {isV('images') && (
                <div className='maintenance-details-images'>
                  <label>{t("Images")}</label>
                  <div className='maintenance-images-list'>
                    {/* Add Image Button */}
                    {isE("addImage") && (
                      <button type='button' className='maintenance-add-image-btn' onClick={openFileDialog} title='Add Image'>
                        +
                      </button>
                    )}
                    <input type='file' accept='image/*' ref={fileInputRef} style={{ display: "none" }} onChange={handleAddImage} />
                    {images.map((img, idx) => (
                      <div key={idx} className='maintenance-image-placeholder' onClick={() => img && setPopupImage(img)} title={img ? "Click to view" : ""}>
                        <img width='100%' height='100%' style={{ objectFit: "cover" }} src={img} alt={`Uploaded image ${idx + 1}`} />
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
                    {isE("addVideo") && (
                      <button type='button' className='maintenance-add-image-btn' onClick={openVideoDialog} title={t("Add Video")}>
                        +
                      </button>
                    )}
                    <input type='file' accept='video/*' ref={videoInputRef} style={{ display: "none" }} onChange={handleAddVideo} />
                    {videos.map((vid, idx) => (
                      <div key={idx} className='maintenance-video-placeholder' onClick={() => vid && setPopupVideo(vid)} title={vid ? "Click to view" : ""}>
                        <video width='100%' height='100%' style={{ objectFit: "cover" }} src={vid} preload='metadata' />
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
              {isV("maintenanceCharges") && (
                <div className='maintenance-details-field'>
                  <label>{t("Charges")}</label>
                  <input
                    id='charges'
                    name='charges'
                    type='number'
                    step='1'
                    min='0'
                    placeholder='0.00'
                    onChange={handleInputChange}
                    value={ticket.charges || ""}
                    disabled={!isE("maintenanceCharges")}
                    onInput={(e) => {
                      // Ensure only decimal values are entered
                      e.target.value = e.target.value.replace(/[^0-9.]/g, "");
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className='support-details-footer'>
        {isV("status") && (
          <div className='support-status'>
            <span>{t("Status")}:</span>
            <span className={`order-status-badge status-${(ticket.status || "New").replace(/\s/g, "").toLowerCase()}`}>{t(ticket.status || "New")}</span>
          </div>
        )}
        <div className='support-details-container-right'>
          {isV("assignedTo") && (
            <div className='support-assign'>
              <span>{t("Assign To")}:</span>
              <select
                id='assignedTeamMember'
                name='assignedTeamMember'
                value={ticket.assignedTeamMember}
                onChange={handleInputChange}
                disabled={!isE("assignedTo")}>
                <option value=''>{t("Select Assignee")}</option>
                {loadingEmployees ? (
                  <option>{t("Loading employees...")}</option>
                ) : employees.length > 0 ? (
                  employees.map((employee) => (
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
          <div className='support-details-actions'>
            {isV("btnSave") && isE("btnSave") && (
              <button className='support-action-btn save' onClick={handleSave}>
                {t("Save")}
              </button>
            )}
            {isV("btnCancel") && isE("btnCancel") && (
              <button className='support-action-btn differ' onClick={handleCancel}>
                {t("Cancel")}
              </button>
            )}
          </div>
        </div>
      </div>
      {isV('imagePopup') && popupImage && (
        <div className='image-popup-overlay' onClick={() => setPopupImage(null)}>
          <div className='image-popup-content' onClick={(e) => e.stopPropagation()}>
            <img src={popupImage} alt='Ticket' />
            <button className='image-popup-close' onClick={() => setPopupImage(null)}>
              ×
            </button>
          </div>
        </div>
      )}
      {isV('videoPopup') && popupVideo && (
        <div className='video-popup-overlay' onClick={() => setPopupVideo(null)}>
          <div className='video-popup-content' onClick={(e) => e.stopPropagation()}>
            <video src={popupVideo} controls autoPlay className='video-player' onError={(e) => console.error("Video error:", e)} />
            <button className='video-popup-close' onClick={() => setPopupVideo(null)}>
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
          showCommentForm={isE("commentIcon")}
          externalComments={ticket.comments}
          currentUser={{ userName: user.userName, userId: user.userId }}
          isVisible={formMode !== "add" && isV("commentIcon")}
        />
      )}
    </Sidebar>
  );
}

export default MaintenanceDetails;
