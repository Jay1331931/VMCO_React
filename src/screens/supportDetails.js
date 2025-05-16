import React, { useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
import CommentPopup from '../components/commentPanel';
import { useLocation } from 'react-router-dom';

function SupportDetails() {
  const location = useLocation();
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

  return (
    <Sidebar title={`Ticket#${ticket.id}${isCommentPanelOpen ? 'collapsed' : ''}`}>
      <div className="support-details-container">
        <h2 className="support-details-title">{`Ticket#${ticket.id}`}</h2>
        <div className="support-details-section">
          <h3 className="support-details-subtitle">Ticket Details</h3>
          <div className="support-details-grid">
            <div className="support-details-field">
              <label>Customer Name</label>
              <input value={ticket.customer} disabled />
            </div>
            <div className="support-details-field">
              <label>Branch</label>
              <select value={ticket.branch} disabled>
                <option>Branch 1</option>
                <option>Branch 2</option>
                <option>Branch 3</option>
                <option>Branch 4</option>
              </select>
            </div>
            <div className="support-details-field">
              <label>Issue Type</label>
              <select value={ticket.issueType} disabled>
                <option>Issue Type</option>
                <option>Payment</option>
                <option>Delivery</option>
                <option>Product</option>
              </select>
            </div>
            <div className="support-details-field">
              <label>Issue Name</label>
              <input value={ticket.issueName} disabled />
            </div>
            <div className="support-details-field">
              <label>Created Date</label>
              <input value={ticket.createdDate} disabled />
            </div>
          </div>
          <div className="support-details-field support-details-textarea">
            <label>Issue Details</label>
            <textarea value={ticket.details} disabled />
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
          <span className={`order-status-badge status-${ticket.status.replace(/\s/g, '').toLowerCase()}`}>{ticket.status}</span>
        </div>
        <div className="support-assign">
          <span>Assign to:</span>
          <select defaultValue={ticket.assignedBranch}>
            <option>Branch 1</option>
            <option>Branch 2</option>
            <option>Branch 3</option>
          </select>
          <select defaultValue={ticket.assignedPerson}>
            <option>Person</option>
            <option>Employee 1</option>
            <option>Employee 2</option>
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
            <img src={popupImage} controls style={{ maxWidth: '100%', maxHeight: '100%' }} />
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