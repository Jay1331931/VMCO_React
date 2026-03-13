import React, { useState } from 'react';
import '../styles/VersionPopup.css';

const VersionPopup = ({ currentVersion, latestVersion, onUpdate, appVersion, onClose }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const isMandatory = appVersion?.is_mandatory || false;

  const handleUpdateClick = () => {
    setIsUpdating(true);
    setTimeout(() => {
      localStorage.removeItem('last_skipped_version');
      if (onUpdate) onUpdate();
      if (!isMandatory && onClose) onClose();
    }, 800);
  };

  const handleLaterClick = () => {
    if (appVersion?.version_number) {
      localStorage.setItem('last_skipped_version', appVersion.version_number);
    }
    if (onClose) onClose();
  };

  return (
    <div className="update-popup-overlay">
      <div className="update-popup">
        <div className="update-popup-header">
          <div className="update-icon-circle">
            <img
              src="/favicon.ico"
              alt="App Icon"
              className={`update-app-logo ${isUpdating ? 'spinning' : ''}`}
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
          <h2>{isMandatory ? 'Update Required' : 'New Version Available'}</h2>
        </div>

        <div className="update-popup-content">
          <div className="version-row">
            <span className="version-pill old">{currentVersion}</span>
            <span className="version-pill arrow">→</span>
            <span className="version-pill new">{latestVersion}</span>
          </div>

          {appVersion?.whats_new && (
            <div className="whats-new">
              <h3>What's Improved</h3>
              <ul>
                {appVersion.whats_new.map((item, index) => (
                  <li key={index}>
                    <span className="check-icon">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="update-actions">
            <button
              className={`update-btn primary ${isMandatory ? 'mandatory' : ''}`}
              onClick={handleUpdateClick}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : `Update to ${latestVersion}`}
            </button>

            {!isMandatory && !isUpdating && (
              <button className="update-btn secondary" onClick={handleLaterClick}>
                Maybe Later
              </button>
            )}
          </div>

          {!isMandatory && (
            <p className="skip-note">We won't ask about version {latestVersion} again.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionPopup;