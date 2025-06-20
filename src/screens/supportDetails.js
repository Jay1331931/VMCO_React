import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/components.css";
import CommentPopup from "../components/commentPanel";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import formatDate from "../utilities/dateFormatter"; // Import the date formatter
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import { useNavigate } from "react-router-dom";

function SupportDetails() {
  const defaultTicket = {
    id: null,
    ticketId: "",
    customerId: null,
    branchId: null,
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
  const [ticket, setTicket] = useState(ticketRcvd || defaultTicket);
  // State for branches dropdown
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(currentLanguage === "en" ? ticket.branchNameEn : ticket.branchNameLc);

  // State for employees dropdown
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(ticket.assignedTo || "");

  const [isEditing, setIsEditing] = useState(true);
  const [popupImage, setPopupImage] = useState(null);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  // Images state (allow dynamic add)
  const [images, setImages] = useState(Array.isArray(ticket.images) && ticket.images.length > 0 ? ticket.images.filter(Boolean) : []);
  // File input ref
  const fileInputRef = useRef(null);

  // State for video popup
  const [popupVideo, setPopupVideo] = useState(null);

  // Videos state (allow dynamic add)
  const [videos, setVideos] = useState([]);

  // File input ref for videos
  const videoInputRef = useRef(null);

  //NOTE: For fetching the user again after browser refersh - start
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
    console.log("$$$$$$$$$$$ logging out");
    // Logout instead of showing loading message
    logout();
    navigate("/login");
    return null; // Return null while logout is processing
  }
  //For fetching the user again after browser refersh - End

  //Rbac and other access based on user object to follow below lik this
  const companyNameToShow =
    currentLanguage === "en"
      ? ticket.companyNameEn
        ? ticket.companyNameEn
        : user.customerCompanyNameEn
      : ticket.companyNameAr
      ? ticket.companyNameAr
      : user.customerCompanyNameLc;
  const rbacMgr = new RbacManager(
    user.userType == "employee" && user.roles[0] !== "admin" ? user.designation : user.roles[0],
    formMode == "add" ? "supDetailAdd" : "supDetailEdit"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  // Fetch branches when dropdown is clicked
  const fetchBranches = async () => {
    if (branches.length > 0) return; // Don't fetch if we already have branches

    setLoadingBranches(true);
    try {
      // Replace with your actual API endpoint URL
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
    const supportStaffDesignation = "sales executive";
    setLoadingEmployees(true);
    try {
      // Replace with your actual API endpoint URL
      const apiUrl = process.env.REACT_APP_API_BASE_URL
        ? `${process.env.REACT_APP_API_BASE_URL}/employees/pagination?page=1&pageSize=10&sortOrder=asc&filters={"designation": "${supportStaffDesignation}"}`
        : "http://localhost:3000/api/grievances/employees";

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

  // Fetch employees on component mount

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const handleCancel = () => {
    // Navigate back to maintenance page
    navigate("/maintenance");
  };

  // Rest of your existing state variables...
  // State for image popup

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

  // Handle save
  const handleSave = async (e) => {
    //TODO: onSave validaations

    setIsEditing(false);
    if (formMode == "add" && !ticket.id) {
      ticket.customerId = user.customerId;
      ticket.dateOfComplaint = new Date().toISOString();
      ticket.attachment = "none"; //TODO: in DB is is not null. Need to be nullaable
      ticket.comments = "[]"; //assign an empty array
    }
    try {
      const endPoint = formMode == "add" ? "/grievances" : "/grievances/id/" + ticket.id;
      const method = formMode == "add" ? "POST" : "PATCH";

      const apiUrl = process.env.REACT_APP_API_BASE_URL ? `${process.env.REACT_APP_API_BASE_URL}${endPoint}` : null;
      const response = await fetch(apiUrl, {
        method: method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(ticket),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      // Add redirect to the supports page after successful save
      navigate("/support");
    } catch (error) {
      console.error("Error saving ticket:", error);
    }
  };

  const handleAddComment = async () => {
    try {
      const endPoint = "/grievances/id/" + ticket.id;
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

  return (
    <Sidebar title={`${t("Ticket# ")}${ticket.ticketId}${isCommentPanelOpen ? "collapsed" : ""}`}>
      <div className='support-details-container'>
        <h2 className='support-details-title'>{`${t("Ticket# ")}${ticket.ticketId}`}</h2>
        <div className='support-details-section'>
          <h3 className='support-details-subtitle'>{t("Ticket Details")}</h3>
          <div className='support-details-grid'>
            <div className='support-details-field'>
              <label>{t("Customer Name")}</label>
              <input value={companyNameToShow} disabled={true} />
            </div>
            <div className='support-details-field'>
              <label>{t("Issue Name")}</label>
              <input id='grievanceName' name='grievanceName' onChange={handleInputChange} value={ticket.grievanceName} disabled={!isE("issueName")} />
            </div>
            {/** Branch Section */}
            <div className='support-details-field'>
              <label htmlFor='branchId'>{t("Branch")} *</label>
              <select id='branchId' name='branchId' value={ticket.branchId} onChange={handleInputChange} disabled={!isE("branch")}>
                <option value=''>{t("Select Branch")}</option>
                {loadingBranches ? (
                  <option disabled>{t("loading")}</option>
                ) : (
                  branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {currentLanguage === "en" ? branch.branchNameEn : branch.branchNameLc}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className='support-details-field'>
              <label>{t("Issue Type")}</label>
              <select id='grievanceType' name='grievanceType' value={ticket.grievanceType} onChange={handleInputChange} disabled={!isE("issueType")}>
                <option>{ticket.grievanceType}</option>
                {isEditing && (
                  <>
                    <option>Machine Issue</option>
                    <option>Product Quality</option>
                    <option>Service Complaint</option>
                    <option>Payment Problem</option>
                    <option>Other</option>
                  </>
                )}
              </select>
            </div>
            {formMode == "edit" ? (
              <div className='support-details-field'>
                <label>{t("Created Date")}</label>
                <input value={formatDate(ticket.updatedAt, "YYYY-MM-DD HH:SS")} disabled />
              </div>
            ) : null}
          </div>
          <div className='support-details-field support-details-textarea'>
            <label>{t("Issue Details")}</label>
            <textarea id='description' name='description' onChange={handleInputChange} value={ticket.description} disabled={!isE("issueDetails")} />
          </div>

          <div className='attachments'>
            <div className='maintenance-details-images'>
              <label>{t("Images")}</label>
              <div className='maintenance-images-list'>
                {/* Add Image Button */}
                <button type='button' className='maintenance-add-image-btn' onClick={openFileDialog} title='Add Image'>
                  +
                </button>
                <input type='file' accept='image/*' ref={fileInputRef} style={{ display: "none" }} onChange={handleAddImage} />
                {images.map((img, idx) => (
                  <div key={idx} className='maintenance-image-placeholder' onClick={() => img && setPopupImage(img)} title={img ? "Click to view" : ""}>
                    <img width='100%' height='100%' style={{ objectFit: "cover" }} src={img} />
                  </div>
                ))}
              </div>
            </div>
            <div className='maintenance-details-videos'>
              <label>{t("Videos")}</label>
              <div className='maintenance-videos-list'>
                {/* Add Video Button */}
                <button type='button' className='maintenance-add-image-btn' onClick={openVideoDialog} title='Add Video'>
                  +
                </button>
                <input type='file' accept='video/*' ref={videoInputRef} style={{ display: "none" }} onChange={handleAddVideo} />
                {videos.map((vid, idx) => (
                  <div key={idx} className='maintenance-video-placeholder' onClick={() => vid && setPopupVideo(vid)} title={vid ? "Click to view" : ""}>
                    <video width='100%' height='100%' style={{ objectFit: "cover" }} src={vid} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='support-details-footer'>
        <div className='support-status'>
          <span>{t("Order Status:")}</span>
          <span className={`order-status-badge status-${ticket.status?.replace(/\s/g, "").toLowerCase()}`}>{t(ticket.status)}</span>
        </div>
        <div className='support-details-container-right'>
            { isV('assignedTo') &&(
              <div className="support-assign">
                <span>{t("Assign to:")}</span>
                <select 
                  id="assignedTeamMember"
                  name="assignedTeamMember"            
                  value={ticket.assignedTeamMember}
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
            <div className="support-details-actions" style={{paddingRight:"20px"}}>
              {isEditing ? (
                <>
                  {isV('btnSave') && <button className="support-action-btn save " onClick={handleSave}>{t("Save")}</button>}
                  <button className="support-action-btn cancel" onClick={toggleEditMode}>{t("Cancel")}</button>
                </>
              ) : (
                <>
                  <button className="support-action-btn edit" onClick={toggleEditMode}>{t("Edit")}</button>
                  <button className="support-action-btn differ">{t("Differ")}</button>
                </>
              )}
            </div>
        </div>
      </div>

      {popupImage && (
        <div className='image-popup-overlay' onClick={() => setPopupImage(null)}>
          <div className='image-popup-content' onClick={(e) => e.stopPropagation()}>
            <img src={popupImage} style={{ maxWidth: "100%", maxHeight: "100%" }} />
            <button className='image-popup-close' onClick={() => setPopupImage(null)}>
              ×
            </button>
          </div>
        </div>
      )}

      {popupVideo && (
        <div className='image-popup-overlay' onClick={() => setPopupVideo(null)}>
          <div className='image-popup-content' onClick={(e) => e.stopPropagation()}>
            <video src={popupVideo} controls style={{ maxWidth: "100%", maxHeight: "100%" }} />
            <button className='image-popup-close' onClick={() => setPopupVideo(null)}>
              ×
            </button>
          </div>
        </div>
      )}
      {/*TODO: part of params like currentUser Details must be dynamic */}
      <CommentPopup
        isOpen={isCommentPanelOpen}
        setIsOpen={setIsCommentPanelOpen}
        onAddComment={handleAddComment}
        showCommentForm={true}
        externalComments={ticket.comments}
        currentUser={{ userName: user.userName, userId: user.userId }}
      />
    </Sidebar>
  );
}

export default SupportDetails;

/** the object structure for ticket
     {
                "id": 1,
                "ticketId": "TKT-000000001",
                "customerId": 1,
                "branchId": 1,
                "grievanceType": "Machine Issue",
                "description": "Coffee machine not dispensing correctly",
                "dateOfComplaint": {},
                "assignedTeamMember": 1,
                "assignedTeamMemberDept": "Technical",
                "status": "Open",
                "attachment": "issue_photo.jpg",
                "slaDueDate": null,
                "criticalLevel": "High",
                "comments": [
                    {
                        "action": "Approved",
                        "userid": 1,
                        "message": "Technician assigned",
                        userName: "SE1",
                        "userId": 1,
                        "createdAt": "2025-04-01T10:00:00Z"
                    }
                ],
                "feedbackRating": null,
                "feedbackComment": null,
                "createdAt": "2025-05-12T09:40:35.699Z",
                "updatedAt": "2025-05-12T09:40:35.699Z",
                "createdBy": 1,
                "modifiedBy": 1,
                "companyNameEn": "Al Khaleej Trading",
                "companyNameAr": "الخليج التجارية",
                "branchNameEn": "Khaleej Riyadh Branch",
                "branchNameLc": "فرع الخليج الرياض",
                "assignedTo": "SE1"
            }
     */
