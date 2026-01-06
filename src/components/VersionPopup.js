import React, { useState, useEffect } from 'react';
import '../styles/VersionPopup.css';

const VersionPopup = ({ currentVersion, latestVersion, onUpdate, appVersion, onClose }) => {
  const [isMandatory, setIsMandatory] = useState(appVersion?.is_mandatory || false);
  const [hasSkipped, setHasSkipped] = useState(false);


  const handleUpdateClick = () => {
    if (appVersion?.version_number) {
      localStorage.removeItem(`last_skipped_version`);
    }
    
    // Call the update function
    if (onUpdate) {
      onUpdate();
    }
  };

  const handleLaterClick = () => {
    if (appVersion?.version_number) {
     localStorage.setItem('last_skipped_version', appVersion.version_number);
     
      // Mark as skipped
      setHasSkipped(true);
    }
    
    // Close the popup
    if (onClose) {
      onClose();
    }
  };

  // Don't show popup if user already skipped this non-mandatory version
  if (!isMandatory && hasSkipped) {
    return null;
  }

  return (
    <div className="update-popup-overlay">
      <div className="update-popup">
        <div className="update-popup-header">
          <h2>{isMandatory ? '🔄 Update Required' : '📱 Update Available'}</h2>
          {/* Optional close button (only for non-mandatory updates) */}
          {/* {onClose && !isMandatory && (
            <button 
              className="close-btn" 
              onClick={onClose}
              aria-label="Close update popup"
            >
              ×
            </button>
          )} */}
        </div>
        
        <div className="update-popup-content">
          <div className="version-info">
            <div className="version-item">
              <span className="version-label">Current Version:</span>
              <span className="version-value current">{currentVersion}</span>
            
              <span className="version-label">Latest Version:</span>
              <span className="version-value latest">{latestVersion}</span>
            </div>
          </div>
          
          {appVersion?.whats_new && appVersion.whats_new.length > 0 && (
            <div className="whats-new">
              <h3>What's new in version {latestVersion}:</h3>
              <ul>
                {appVersion.whats_new.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="update-actions">
            <button 
              className={`update-btn ${isMandatory ? 'primary mandatory' : 'primary'}`}
              onClick={handleUpdateClick}
              autoFocus={isMandatory}
            >
              Update Now
            </button>
            
            { !isMandatory && (
              <button 
                className="update-btn secondary"
                onClick={handleLaterClick}
              >
                Remind Me Later
              </button>
            )}
          </div>
          
          {!isMandatory && (
            <div className="skip-note">
              <small>You won't be reminded about this version again.</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionPopup;