// ProtectedRoute.js
import React, { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import { isTokenValid } from '../utilities/authUtils';
import Swal from "sweetalert2";

const ProtectedRoute = ({ children, page }) => {
  const { user, isAuthenticated, logout, token, buttonClicked } = useAuth();
  const [isValid, setIsValid] = useState(true);
  const isCheckingRef = useRef(false);
  const backButtonPressedRef = useRef(false);

  useEffect(() => {
    // Check if back button was recently pressed
    if (backButtonPressedRef.current) {
      backButtonPressedRef.current = false;
      return; // Skip auth check if back button was pressed
    }

    const checkAuth = () => {
      if (isCheckingRef.current) return;
      
      isCheckingRef.current = true;
      const tokenFromCookie = localStorage.getItem("token");

      if ((!tokenFromCookie || !isTokenValid(tokenFromCookie)) && !buttonClicked) {
        setIsValid(false);
        Swal.fire({
          icon: 'error',
          title: 'Session Expired',
          text: 'Your session has expired. Please log in again.',
          confirmButtonText: 'OK'
        }).then(() => {
          logout();
        });
      } else {
        setIsValid(true);
      }
      
      isCheckingRef.current = false;
    };

    checkAuth();
    
    // Increase interval to reduce frequency
    const interval = setInterval(checkAuth, 30000); // 30 seconds instead of 5
    
    return () => clearInterval(interval);
  }, [logout, buttonClicked]);

  // RBAC check
  if (user) {
    const rbacMgr = new RbacManager(
      user?.userType === "employee" && user?.roles[0] !== "admin"
        ? user?.designation
        : user?.roles[0],
      "accessPages"
    );

    const isV = rbacMgr.isV.bind(rbacMgr);
    
    if (!isV(page)) {
      return <Navigate to="*" replace />;
    }
  }

  if (!isValid) {
    return (
      <Navigate
        to={user?.userType === "customer" ? "/login" : "/login/employee"}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;