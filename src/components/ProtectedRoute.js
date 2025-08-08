import React, {useEffect, useState} from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import { isTokenValid } from '../utilities/authUtils';
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
// const ProtectedRoute = ({ children }) => {
//   const { isAuthenticated, logout } = useAuth();

//   // if (!isAuthenticated) {
//   //   logout && logout();
//   //   return <Navigate to="/login" replace />;
//   // }

//   return children;
// };

// export default ProtectedRoute;

const ProtectedRoute = ({ children, allowedRoles, page }) => {
  const { user, isAuthenticated, logout, token } = useAuth();
  const rbacMgr = new RbacManager(
    user?.userType == "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "accessPages"
  );
  console.log("RBAC Manager:", rbacMgr);

  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);
  const [isValid, setIsValid] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const checkAuth = () => {
      const tokenFromCookie = localStorage.getItem("token");

      if (!tokenFromCookie || !isTokenValid(tokenFromCookie)) {
        setIsValid(false);
        Swal.fire({
          icon: 'error',
          title: 'Session Expired',
          text: 'Your session has expired. Please log in again.',
          confirmButtonText: 'OK'
        }).then(() => {
          logout();
        });

      }
    };

    checkAuth();
    
    // Check every 5 seconds (adjust as needed)
    const interval = setInterval(checkAuth, 5000);
    return () => clearInterval(interval);
  }, [logout]);

  if (!isValid) {
    navigate(user?.userType === "customer" ? "/login" : "/login/employee");
    return;
  }
  // if (allowedRoles && user && !allowedRoles.includes(user?.designation)) {
  //     return <Navigate to="*" replace />; // or to a "not authorized" page
  //   }
if (!isV(page)) {
      return <Navigate to="*" replace />; // or to a "not authorized" page
    }
  return children;
};

export default ProtectedRoute;