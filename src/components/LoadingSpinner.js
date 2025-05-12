import React from 'react';

const LoadingSpinner = ({ size = 'medium' }) => {
  return (
    <div className={`loading-spinner-outer`}>
      <div className={`loading-spinner-container ${size}`}>
        <div className="loading-spinner"></div>
      </div>
      <style>
        {`
          .loading-spinner-outer {
            position: relative;
            width: 100%;
            top: 0; left: 0; right: 0; bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            background: rgba(255,255,255,0.2);
          }
          .loading-spinner-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 60px;
          }
          .loading-spinner {
            border: 4px solid #e6e6e6;
            border-top: 4px solid #0a5640;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          .loading-spinner-container.small .loading-spinner {
            width: 28px;
            height: 28px;
            border-width: 3px;
          }
          .loading-spinner-container.medium .loading-spinner {
            width: 44px;
            height: 44px;
            border-width: 4px;
          }
          .loading-spinner-container.large .loading-spinner {
            width: 64px;
            height: 64px;
            border-width: 6px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;