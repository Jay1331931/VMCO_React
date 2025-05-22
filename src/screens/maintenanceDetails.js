import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
import CommentPopup from '../components/commentPanel';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import formatDate from '../utilities/dateFormatter'; // Import the date formatter

function MaintenanceDetails() {
const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const location = useLocation();
  const ticket = location.state?.ticket || {};
  
  // State for branches dropdown
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(
    currentLanguage === 'en' ? ticket.branchNameEn : ticket.branchNameAr
  );
  
  // State for employees dropdown
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(ticket.assignedTo || '');
  
  const [isEditing, setIsEditing] = useState(true);

  // Fetch branches when dropdown is clicked
  const fetchBranches = async () => {
    if (branches.length > 0) return; // Don't fetch if we already have branches
    
    setLoadingBranches(true);
    try {
      // Replace with your actual API endpoint URL
      const apiUrl = process.env.REACT_APP_API_BASE_URL 
        ? `${process.env.REACT_APP_API_BASE_URL}/customer-branches/cust-id/${ticket.customerId}`
        : 'http://localhost:3000/api/branches';
        
      const response = await fetch(apiUrl);
      
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
        
      const response = await fetch(apiUrl);
      
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

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle branch click to load options
  const handleBranchClick = () => {
    if (isEditing) {
      fetchBranches();
    }
  };

  // Handle branch selection
  const handleBranchChange = (e) => {
    setSelectedBranch(e.target.value);
  };

  // Handle employee selection
  const handleEmployeeChange = (e) => {
    setSelectedEmployee(e.target.value);
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  // State for image popup
  const [popupImage, setPopupImage] = useState(null);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);

  // Images state (allow dynamic add)
  const [images, setImages] = useState(
    Array.isArray(ticket.images) && ticket.images.length > 0
      ? ticket.images.filter(Boolean)
      : []
  );

  // File input ref
  const fileInputRef = useRef(null);

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


 // State for video popup
  const [popupVideo, setPopupVideo] = useState(null);

  // Videos state (allow dynamic add)
  const [videos, setVideos] = useState([]);

  // File input ref for videos
  const videoInputRef = useRef(null);

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

  // Handle save
  const handleSave = () => {
    // Implement save functionality here
    // This would typically involve an API call to update the ticket
    setIsEditing(false);
    console.log('Saving maintenance ticket with selected branch:', selectedBranch);
    console.log('Assigned to employee:', selectedEmployee);
    // After successful save, you might want to refresh the data
  };

  return (
    <Sidebar title={`Ticket#${ticket.id}`}>
      <div className="maintenance-details-container">
        <h2 className="maintenance-details-title">{`Ticket#${ticket.id}`}</h2>
        <div className="maintenance-details-section">
          <h3 className="maintenance-details-subtitle">Ticket Details</h3>
          <div className="maintenance-details-grid">
            <div className="maintenance-details-field">
              <label>Customer Name</label>
              <input value={currentLanguage === 'en' ? ticket.companyNameEn : ticket.companyNameAr} disabled />
            </div>
            <div className="maintenance-details-field">
              <label>Branch</label>
              <select 
                value={selectedBranch} 
                disabled={!isEditing}
                onChange={handleBranchChange}
                onClick={handleBranchClick}
              >
                {loadingBranches ? (
                  <option>Loading branches...</option>
                ) : branches.length > 0 ? (
                  branches.map(branch => (
                    <option 
                      key={branch.id} 
                      value={currentLanguage === 'en' ? branch.branchNameEn : branch.branchNameLc}
                    >
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
              <label>Issue Type</label>
              <select value={ticket.category} disabled> {/* TODO:Issue types to be read and populaated from basic masters */}
                <option>Issue Type</option>
                <option>Payment</option>
                <option>Delivery</option>
                <option>Product</option>
              </select>
            </div>
            <div className="maintenance-details-field">
              <label>Issue Name</label>
              <input value={ticket.issueName} disabled />
            </div>
            <div className="maintenance-details-field">
              <label>Created Date</label>
              <input value={formatDate(ticket.createdAt,'YYYY-MM-DD HH:MM')} disabled />
            </div>
            <div className="maintenance-details-field">
              <label>Machine Serial Number</label>
              <input value={ticket.machineSerialNumber} disabled />
            </div>
            <div className="maintenance-details-field">
              <label>Warranty Date</label>
              <input value={formatDate(ticket.warrantyEndDate,'YYYY-MM-DD')} disabled />
            </div>
            <div className="maintenance-details-field">
              <label>Maitenance Charges</label>
              <input value={ticket.chargers.maintenance} disabled />
            </div>
          </div>
          <div className="maintenance-details-field maintenance-details-textarea">
            <label>Issue Details</label>
            <textarea value={ticket.issueDetails} disabled />
          </div>
          <div className='attachments'>
          <div className="maintenance-details-images">
            <label>Images</label>
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
              >
                +
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleAddImage}
              />
            </div>
          </div>
          <div className="maintenance-details-videos">
            <label>Videos</label>
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
                title="Add Video"
              >
                +
              </button>
              <input
                type="file"
                accept="video/*"
                ref={videoInputRef}
                style={{ display: 'none' }}
                onChange={handleAddVideo}
              />
            </div>
          </div>
          </div>
        </div>
      </div>
      <div className="support-details-footer">
        <div className="support-status">
          <span>Order Status:</span>
          <span className={`order-status-badge status-${ticket.status.replace(/\s/g, '').toLowerCase()}`}>{ticket.status}</span>
        </div>
        <div className="support-assign">
          <span>Assign to:</span>
          <select 
            value={selectedEmployee} 
            onChange={handleEmployeeChange}
            disabled={!isEditing}
          >
            {loadingEmployees ? (
              <option>Loading employees...</option>
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
        <div className="support-details-actions">
          <button className="support-action-btn save" onClick={handleSave}>Save</button>
          <button className="support-action-btn differ">Differ</button>
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
      <CommentPopup isOpen={isCommentPanelOpen} setIsOpen={setIsCommentPanelOpen} />
    </Sidebar>
  );
}

export default MaintenanceDetails;