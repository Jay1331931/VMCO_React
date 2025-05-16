import React, { useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
import CommentPopup from '../components/commentPanel';
import { useLocation } from 'react-router-dom';
import formatDate from '../utilities/dateFormatter'; // Import the date formatter

function SupportDetails() {
  const location = useLocation();
  console.log('Location state#######:', location.state);
  const ticket = location.state?.ticket || {
    id: '00025',
    customer: 'Customer Name',
    branch: 'Branch 1',
    issueType: 'Issue Type',
    issueName: 'Issue Name',
    createdDate: 'May 04, 2025',
    details: 'Issue details',
    images: [''],
    status: 'In Progress',
    assignedBranch: 'Branch 1',
    assignedPerson: 'Person'
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

  return (
    <Sidebar title={`Ticket#${ticket.id}${isCommentPanelOpen ? 'collapsed' : ''}`}>
      <div className="support-details-container">
        <h2 className="support-details-title">{`Ticket#${ticket.id}`}</h2>
        <div className="support-details-section">
          <h3 className="support-details-subtitle">Ticket Details</h3>
          <div className="support-details-grid">
            <div className="support-details-field">
              <label>Customer Name</label>
              <input value={ticket.companyNameEn} disabled />
            </div>
            <div className="support-details-field">
              <label>Branch</label>
              <select value={ticket.branchNameEn} disabled>
                <option>{ticket.branchNameEn}</option> {/* TODO: WE may need to get all the options for employee  if changes is allowed */ }
              </select>
            </div>
            <div className="support-details-field">
              <label>Issue Type</label>
              <select value={ticket.grievanceType} disabled>
                <option>{ticket.grievanceType}</option> {/* TODO: WE may need to get all the options for employee  if changes is allowed */ }
              </select>
            </div>
            <div className="support-details-field">
              <label>Issue Name</label>
              <input value={ticket.grievanceName} disabled /> {/* TODO: There is no Issue Name in DB */}
            </div>
            <div className="support-details-field">
              <label>Created Date</label>
              <input value={formatDate(ticket.updatedAt,'YYYY-MM-DD HH:SS')} disabled />
            </div>
          </div>
          <div className="support-details-field support-details-textarea">
            <label>Issue Details</label>
            <textarea value={ticket.description} disabled />
          </div>
          <div className="maintenance-details-images">
            <label>Images</label>
            <div className="maintenance-images-list">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="maintenance-image-placeholder"
                  style={img ? { backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  onClick={() => img && setPopupImage(img)}
                  title={img ? 'Click to view' : ''}
                />
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
        </div>
      </div>
      <div className="support-details-footer">
        <div className="support-status">
          <span>Order Status:</span>
          <span className={`order-status-badge status-${ticket.status.replace(/\s/g, '').toLowerCase()}`}>{ticket.status}</span>
        </div>
        <div className="support-assign">
          <span>Assign to:</span>
          {/* <select defaultValue={ticket.assignedBranch}>
            <option>Branch 1</option>
            <option>Branch 2</option>
            <option>Branch 3</option>
          </select> */}
          <select defaultValue={ticket.assignedTo}>
            <option>{ticket.assignedTo}</option>
          </select>
        </div>
        <div className="support-details-actions">
          <button className="support-action-btn save">Save</button>
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
      {/* TODO: Comments pannel to be show. Not if this component is complete*/}
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
