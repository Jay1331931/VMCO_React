import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
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
    images: ['https://shopatshams.com.pk/cdn/shop/products/1117826-1_73225306-dd8e-4b6c-88b0-52e394d10172.jpg?v=1634903061', 'https://driftbasket.com/wp-content/uploads/2024/04/pepsi-BLUE-TITAN-0_33L-SRB_600_600px-e1713358658329.jpg', '', ''],
    status: 'In Progress',
    assignedBranch: 'Branch 1',
    assignedPerson: 'Person'
  };

  // State for image popup
  const [popupImage, setPopupImage] = useState(null);

  // Helper: get images array (fallback to placeholders if not present)
  const images = Array.isArray(ticket.images) && ticket.images.length > 0
    ? ticket.images
    : ['', '', '', ''];

  return (
    <Sidebar title={`Ticket#${ticket.id}`}>
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
          <div className="support-details-images">
            <label>Images</label>
            <div className="support-images-list">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="support-image-placeholder"
                  style={img ? { backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  onClick={() => img && setPopupImage(img)}
                  title={img ? 'Click to view' : ''}
                />
              ))}
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
      </div>
      {popupImage && (
        <div className="image-popup-overlay" onClick={() => setPopupImage(null)}>
          <div className="image-popup-content" onClick={e => e.stopPropagation()}>
            <img src={popupImage} alt="Ticket" />
            <button className="image-popup-close" onClick={() => setPopupImage(null)}>×</button>
          </div>
        </div>
      )}
    </Sidebar>
  );
}

export default SupportDetails;