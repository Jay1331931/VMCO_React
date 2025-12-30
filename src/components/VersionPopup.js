import React from 'react';
import '../styles/VersionPopup.css';

const VersionPopup = ({ currentVersion, latestVersion, onUpdate }) => {
  return (
    <div className="update-popup-overlay">
      <div className="update-popup">
        <div className="update-popup-header">
          <h2>🔄 Update Required</h2>
          {/* Removed close button */}
        </div>
        
        <div className="update-popup-content">
          <div className="version-info">
            <div className="version-item">
              <span className="version-label">Current Version:</span>
              <span className="version-value current">{currentVersion}</span>
            </div>
            <div className="version-item">
              <span className="version-label">Latest Version:</span>
              <span className="version-value latest">{latestVersion}</span>
            </div>
          </div>
          
          {/* <div className="update-message">
            <p><strong>Important Update Required</strong></p>
            <p>This version is no longer supported. You must update the app to continue using all features.</p>
          </div>
          
          <div className="whats-new">
            <h3>What's new in version {latestVersion}:</h3>
            <ul>
              <li>Critical security updates</li>
              <li>Bug fixes and performance improvements</li>
              <li>Enhanced user experience</li>
              <li>New features added</li>
            </ul>
          </div> */}
          
          <div className="update-actions">
            <button 
              className="update-btn primary"
              onClick={onUpdate}
              autoFocus // Automatically focus on update button
            >
              Update Now
            </button>
            {/* Removed "Remind Me Later" button */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionPopup;