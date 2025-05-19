import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
import CommentPopup from '../components/commentPanel';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import formatDate from '../utilities/dateFormatter'; // Import the date formatter

function SupportDetails() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const location = useLocation();
  const ticket = location.state?.ticket || {};
  
  // State for branches dropdown
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(
    currentLanguage === 'en' ? ticket.branchNameEn : ticket.branchNameLc
  );
  const [isEditing, setIsEditing] = useState(true);

  // Fetch branches when dropdown is clicked
  const fetchBranches = async () => {
    console.log('Fetching size...'+branches.length);
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
      //iterate data object to collect branchNameEn vles in array

      const branchNames = data;

      setBranches(branchNames || []);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    } finally {
      setLoadingBranches(false);
    }
  };

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

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  // Rest of your existing state variables...
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
    console.log('Saving ticket with selected branch:', selectedBranch);
    // After successful save, you might want to refresh the data
  };

  return (
    <Sidebar title={`Ticket#${ticket.id}${isCommentPanelOpen ? 'collapsed' : ''}`}>
      <div className="support-details-container">
        <h2 className="support-details-title">{`Ticket#${ticket.id}`}</h2>
        <div className="support-details-section">
          <h3 className="support-details-subtitle">Ticket Details</h3>
          <div className="support-details-grid">
            <div className="support-details-field">
              <label>Customer Name</label>
              <input 
                value={currentLanguage=='en' ? ticket.companyNameEn : ticket.companyNameAr} 
                disabled 
              />
            </div>
            <div className="support-details-field">
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
            <div className="support-details-field">
              <label>Issue Type</label>
              <select value={ticket.grievanceType} disabled={!isEditing}>
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
            <div className="support-details-field">
              <label>Issue Name</label>
              <input value={ticket.grievanceName} disabled={!isEditing} />
            </div>
            <div className="support-details-field">
              <label>Created Date</label>
              <input value={formatDate(ticket.updatedAt,'YYYY-MM-DD HH:SS')} disabled />
            </div>
          </div>
          <div className="support-details-field support-details-textarea">
            <label>Issue Details</label>
            <textarea value={ticket.description} disabled={!isEditing} />
          </div>
          
          <div className='attachments'>
            <div className="maintenance-details-images">
              <label>Images</label>
              <div className="maintenance-images-list">
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
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="maintenance-image-placeholder"
                    onClick={() => img && setPopupImage(img)}
                    title={img ? 'Click to view' : ''}
                  >
                    <img
                      width="100%"
                      height="100%"
                      style={{ objectFit: 'cover' }}
                      src={img}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="maintenance-details-videos">
              <label>Videos</label>
              <div className="maintenance-videos-list">
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
                {videos.map((vid, idx) => (
                  <div
                    key={idx}
                    className="maintenance-video-placeholder"
                    onClick={() => vid && setPopupVideo(vid)}
                    title={vid ? 'Click to view' : ''}
                  >
                    <video width="100%" height="100%" style={{ objectFit: 'cover' }} src={vid} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="support-details-footer">
        <div className="support-status">
          <span>Order Status:</span>
          <span className={`order-status-badge status-${ticket.status?.replace(/\s/g, '').toLowerCase()}`}>
            {ticket.status}
          </span>
        </div>
        <div className="support-assign">
          <span>Assign to:</span>
          <select defaultValue={ticket.assignedTo} disabled={!isEditing}>
            <option>{ticket.assignedTo}</option>
            {isEditing && (
              <>
                <option>SE1</option>
                <option>SE2</option>
                <option>SE3</option>
              </>
            )}
          </select>
        </div>
        <div className="support-details-actions">
          {isEditing ? (
            <>
              <button className="support-action-btn save" onClick={handleSave}>Save</button>
              <button className="support-action-btn cancel" onClick={toggleEditMode}>Cancel</button>
            </>
          ) : (
            <>
              <button className="support-action-btn edit" onClick={toggleEditMode}>Edit</button>
              <button className="support-action-btn differ">Differ</button>
            </>
          )}
        </div>
      </div>
      
      {popupImage && (
        <div className="image-popup-overlay" onClick={() => setPopupImage(null)}>
          <div className="image-popup-content" onClick={e => e.stopPropagation()}>
            <img src={popupImage} style={{ maxWidth: '100%', maxHeight: '100%' }} />
            <button className="image-popup-close" onClick={() => setPopupImage(null)}>×</button>
          </div>
        </div>
      )}
      
      {popupVideo && (
        <div className="image-popup-overlay" onClick={() => setPopupVideo(null)}>
          <div className="image-popup-content" onClick={e => e.stopPropagation()}>
            <video src={popupVideo} controls style={{ maxWidth: '100%', maxHeight: '100%' }} />
            <button className="image-popup-close" onClick={() => setPopupVideo(null)}>×</button>
          </div>
        </div>
      )}
      
      <CommentPopup isOpen={isCommentPanelOpen} setIsOpen={setIsCommentPanelOpen} />
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
                        "userid": 1,
                        "comment": "Technician assigned",
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
