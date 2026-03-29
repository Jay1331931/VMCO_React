import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/NotFound.css";

const NotFound = () => {
  const navigate = useNavigate();
const location = useLocation();

  // ✅ Check if source is d365 from URL or sessionStorage
  const params = new URLSearchParams(location.search);
  const isFromD365 = params.get("source") === "d365" || 
                     sessionStorage.getItem("accessSource") === "d365";

  const handleGoBack = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-code">404</div>
        <h1 className="error-title">Page Not Found</h1>
        <p className="error-message-not-found">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        {!isFromD365 && (<div className="error-actions">
          <Link to="/catalog" className="btn-home">
            Go to Home
          </Link>
          <button onClick={handleGoBack} className="btn-back">
            Go Back
          </button>
        </div>)}
      </div>
    </div>
  );
};

export default NotFound;
