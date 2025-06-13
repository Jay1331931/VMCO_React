import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
import CommentPopup from '../components/commentPanel';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import formatDate from '../utilities/dateFormatter';
import { useAuth } from '../context/AuthContext';
import RbacManager from '../utilities/rbac';
import { useNavigate } from 'react-router-dom';

function MaintenanceDetails() {
  // All hooks at the top
  const { token, user, isAuthenticated, logout, loading } = useAuth();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const location = useLocation();
  const formMode = location.state?.mode;
  const navigate = useNavigate();
  

  const defaultTicket = {
    "id": null,
    "requestId": null,
    "customerId": null,
    "branchId": null,
    "category": null,
    "issueName": null,
    "issueDetails": null,
    "urgencyLevel": null,
    "machineSerialNumber": null,
    "warrantyEndDate": null,
    "attachment": null,
    "status": null,
    "assignedTeamMember": null,
    "assignedTeamMemberDept": null,
    "comments": [],
    "chargers": null,
    "customerRegion": null,
    "branchRegion": null,
  };

  // All useState hooks
  const [ticket, setTicket] = useState(location.state?.ticket || defaultTicket);
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(
    currentLanguage === 'en' ? ticket.branchNameEn : ticket.branchNameAr
  );
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(ticket.assignedTo || '');
  const [isEditing, setIsEditing] = useState(true);
  const [popupImage, setPopupImage] = useState(null);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const [images, setImages] = useState(
    Array.isArray(ticket.images) && ticket.images.length > 0
      ? ticket.images.filter(Boolean)
      : []
  );
  const fileInputRef = useRef(null);
  const [popupVideo, setPopupVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const videoInputRef = useRef(null);

  // Use useEffect for fetching data
  useEffect(() => {
    if (user) {
      fetchEmployees();
      fetchBranches();
    }
  }, [user]);

  // Check loading state first
  if (loading) {
    return <div>{t('msgLoadingUserInfo')}</div>; // Or your loading component
  }

  if (!user) {
    console.log("$$$$$$$$$$$ logging out");
    logout();
    navigate('/login');
    return null;
  }
  
  const companyNameToShow = currentLanguage === 'en' ? (ticket.companyNameEn ? ticket.companyNameEn : user.customerCompanyNameEn) : (ticket.companyNameAr ? ticket.companyNameAr : user.customerCompanyNameLc);

  // RBAC - only after we confirm user exists
  console.log("RRRRRRRRR:",JSON.stringify(user));
  const rbacMgr = new RbacManager(
    user.userType === 'employee' && user.roles[0] !== 'admin' 
      ? user.designation 
      : user.roles[0], 
    formMode === 'add' ? 'maintDetailAdd' : 'maintDetailEdit'
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  console.log("9090909090909 ",rbacMgr.currentRole);
  // Fetch branches when dropdown is clicked
  const fetchBranches = async () => {
    if (branches.length > 0) return; // Don't fetch if we already have branches
    
    setLoadingBranches(true);
    try {
      const apiUrl = process.env.REACT_APP_API_BASE_URL 
        ? `${process.env.REACT_APP_API_BASE_URL}/customer-branches/cust-id/${ticket.customerId? ticket.customerId : user.customerId}`
        : 'http://localhost:3000/api/branches';
        
      const response = await fetch(apiUrl,{
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'          
        });

      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched branches:', data);
      setBranches(data || []);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
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
        : 'http://localhost:3000/api/maintenance/employees';
        
      const response = await fetch(apiUrl,{
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'          
        });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const resp = await response.json();
      console.log('Fetched employees:', resp.data.data);
      setEmployees(resp.data.data || []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
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
    setTicket(prev => ({ ...prev, [name]: value }));
    
    // Special handling for customer selection
    if (name === 'customerId' && value) {
      fetchBranches(value);
      // Reset branch when customer changes
      setTicket(prev => ({ ...prev, branchId: '' }));
    }

    console.log("The ticket :", JSON.stringify(ticket));
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
    e.target.value = '';
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
    e.target.value = '';
  };

  // Open file dialog for videos
  const openVideoDialog = () => {
    if (videoInputRef.current) videoInputRef.current.click();
  };

  // Handle save functionality
  const handleSave = async () => {
    setIsEditing(false);
    if(formMode=='add' && !ticket.id){
      ticket.customerId = user.customerId;
      ticket.attachment = 'none'; // TODO: in DB is is not null. Need to be nullaable
      ticket.comments = '[]'; // assign an empty array
    }
    
    // Update ticket with selected employee and branch
    const updatedTicket = {
      ...ticket,
      //assignedTo: selectedEmployee,
      //branchId: selectedBranch
    };
    
    try {
      const endPoint = formMode=='add' ? '/maintenance' : '/maintenance/id/'+ticket.id;
      const method = formMode=='add' ? 'POST' : 'PATCH';

      const apiUrl = process.env.REACT_APP_API_BASE_URL
        ? `${process.env.REACT_APP_API_BASE_URL}${endPoint}`
        : null;
      console.log("~~~~~~~ the url+"+apiUrl);
      console.log("~~~~~~~ the updated ticket+"+JSON.stringify(updatedTicket));
      const response = await fetch(apiUrl, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedTicket)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Update local state with saved ticket data
      const savedTicket = await response.json();
      setTicket(savedTicket);
      
    } catch (error) {
      console.error('Error saving maintenance ticket:', error);
    }
  };

  // Handle comment updates
  const handleAddComment = async () => {
    try {
      const endPoint = '/maintenance/id/'+ticket.id;
      const method = 'PATCH';

      const apiUrl = process.env.REACT_APP_API_BASE_URL
        ? `${process.env.REACT_APP_API_BASE_URL}${endPoint}`
        : null;
      
      const response = await fetch(apiUrl, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(ticket)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Update local state with the updated ticket that includes new comments
      const updatedTicket = await response.json();
      setTicket(updatedTicket);
      
    } catch (error) {
      console.error('Error updating ticket comments:', error);
    }
  };

  return (
    <Sidebar title={`${t("Ticket#")}${ticket.id}${isCommentPanelOpen ? 'collapsed' : ''}`}>
      <div className="maintenance-details-container">
        <h2 className="maintenance-details-title">{`${t("Ticket#")}${ticket.id}`}</h2>
        <div className="maintenance-details-section">
          <h3 className="maintenance-details-subtitle">{t("Ticket Details")}</h3>
          <div className="maintenance-details-grid">
            <div className="maintenance-details-field">
              <label>{t("Customer Name")}</label>
              <input value={companyNameToShow} disabled />
            </div>
            <div className="maintenance-details-field">
              <label htmlFor="branchId">{t('Branch')} *</label>
              <select
                id="branchId"
                name="branchId"
                value={ticket.branchId}
                disabled={!isE('branch')}
                onChange={handleInputChange}
              >
                <option value="">{t('Select Branch')}</option>
                {loadingBranches ? (
                  <option disabled>{t('loading')}</option>
                ) : branches.length > 0 ? (
                  branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {currentLanguage === 'en' ? branch.branchNameEn : branch.branchNameLc}
                    </option>
                  ))
                ) : (
                  <option>
                    {currentLanguage === 'en' ? ticket.branchNameEn : ticket.branchNameLc}
                  </option>
                )}
              </select>
            </div>
            <div className="maintenance-details-field">
              <label htmlFor="issueType">{t('Issue Type')} *</label>
              <select 
                id='category' 
                name='category' 
                onChange={handleInputChange} 
                value={ticket.category}
                disabled={!isE('issueType')}
              > 
                <option value="">{t('Select Issue Type')}</option>
                <option>Payment</option>
                <option>Delivery</option>
                <option>Product</option>
              </select>
            </div>
            <div className="maintenance-details-field">
              <label htmlFor="issueName">{t('Issue Name')} *</label>
              <input 
                id='issueName' 
                name='issueName' 
                onChange={handleInputChange} 
                value={ticket.issueName}
                disabled={!isE('issueName')}
              />
            </div>
            {isV('createdDate') && (           
               <div className="maintenance-details-field">
                <label htmlFor="createdDate">{t('Created Date')} *</label>
                <input value={formatDate(ticket.createdAt,'YYYY-MM-DD HH:MM')} disabled />
              </div>
          )}
            <div className="maintenance-details-field">
              <label htmlFor="machineSerialNumber">{t('Machine Serial Number')} </label>
              <input 
                id='machineSerialNumber' 
                name='machineSerialNumber' 
                onChange={handleInputChange} 
                value={ticket.machineSerialNumber}
                disabled={!isE('machineSerialNumber')}
              />
            </div>
            {isV('warrantyEndDate') &&(
              <div className="maintenance-details-field">
                <label>{t('Warranty Date')} *</label>
                <input 
                  value={formatDate(ticket.warrantyEndDate,'YYYY-MM-DD')}
                  disabled 
                />
              </div>
            )}
            {isV('maintenanceCharges') && (
              <div className="maintenance-details-field">
                <label>{t('Maintenance Charges')} *</label>
                <input 
                  id='maintenanceCharges' 
                  name='maintenanceCharges' 
                  onChange={handleInputChange} 
                  value={ticket.chargers?.maintenance}
                  disabled={!isE('maintenanceCharges')}
                />
              </div>
            )}
          </div>
          <div className="maintenance-details-field maintenance-details-textarea">
            <label>{t('Issue Details')}</label>
            <textarea 
              id='issueDetails' 
              name='issueDetails' 
              onChange={handleInputChange} 
              value={ticket.issueDetails}
              disabled={!isE('issueDetails')}
            />
          </div>
          <div className='attachments'>
          <div className="maintenance-details-images">
            <label>{t('Images')}</label>
            <div className="maintenance-images-list">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="maintenance-image-placeholder"
                  onClick={() => img && setPopupImage(img)}
                  title={img ? 'Click to view' : ''}
                >
                  <image width="100" height="100" style={{ objectFit: 'cover' }} src={img} />
                </div>
              ))}
              {/* Add Image Button */}
              <button
                type="button"
                className="maintenance-add-image-btn"
                onClick={openFileDialog}
                title="Add Image"
                disabled={!isE('btnAddimages')}
              >
                +
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleAddImage}
                disabled={false}
              />
            </div>
          </div>
          <div className="maintenance-details-videos">
            <label>{t('Videos')}</label>
            <div className="maintenance-videos-list">
              {videos.map((vid, idx) => (
                <div
                  key={idx}
                  className="maintenance-video-placeholder"
                  onClick={() => vid && setPopupVideo(vid)}
                  title={vid ? 'Click to view' : ''}
                >
                  <video width="100" height="100" style={{ objectFit: 'cover' }} src={vid} />
                </div>
              ))}
              {/* Add Video Button */}
              <button
                type="button"
                className="maintenance-add-image-btn"
                onClick={openVideoDialog}
                title={t("Add Video")}
                disabled={!isE('btnAddvideos')}
              >
                +
              </button>
              <input
                type="file"
                accept="video/*"
                ref={videoInputRef}
                style={{ display: 'none' }}
                onChange={handleAddVideo}
                disabled={!isE('videos')}
              />
            </div>
          </div>
          </div>
        </div>
      </div>
      <div className="support-details-footer">
        {isV('status') && (
          <div className="support-status">
            <span>{t('Status')}:</span>
            <span className={`order-status-badge status-${ticket.status?.replace(/\s/g, '').toLowerCase()}`}>{t(ticket.status)}</span>
          </div>
        )}
        {isV('assignedTo') &&(
          <div className="support-assign">
            <span>{t('Assign To')}:</span>
            <select
              id="assignedTo"
              name="assignedTo"
              value={selectedEmployee} 
              onChange={handleInputChange}
              disabled={!isE('assignedTo')}
            >
              <option value="">{t('Select Assignee')}</option>
              {loadingEmployees ? (
                <option>{t('Loading employees...')}</option>
              ) : employees.length > 0 ? (
                employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))
              ) : (
                <option value={ticket.assignedTo}>{ticket.assignedTo || "Select Employee"}</option>
              )}
            </select>
          </div>
        )}
        <div className="support-details-actions">
          {isV('btnSave') && <button className="support-action-btn save" onClick={handleSave} disabled={!isE('btnSave')}>{t("Save")}</button>}
          {isV('btnDiffer') && <button className="support-action-btn differ" disabled={!isE('btnDiffer')}>{t("Differ")}</button>}
        </div>
      </div>
      {popupImage && (
        <div className="image-popup-overlay" onClick={() => setPopupImage(null)}>
          <div className="image-popup-content" onClick={e => e.stopPropagation()}>
            <img src={popupImage} alt="Ticket" />
            <button className="image-popup-close" onClick={() => setPopupImage(null)}>×</button>
          </div>
        </div>
      )}
      <CommentPopup 
        isOpen={isCommentPanelOpen} 
        setIsOpen={setIsCommentPanelOpen} 
        onAddComment={handleAddComment}
        showCommentForm={true}
        externalComments={ticket.comments}
        currentUser={{userName:user.userName, userId:user.userId}}
      />
    </Sidebar>
  );
}

export default MaintenanceDetails;