import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/NotFound.css";

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-code">404</div>
        <h1 className="error-title">Page Not Found</h1>
        <p className="error-message">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        <div className="error-actions">
          <Link to="/" className="btn-home">
            Go to Home
          </Link>
          <button onClick={handleGoBack} className="btn-back">
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
