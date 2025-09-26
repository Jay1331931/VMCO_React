import React, { useState, useEffect } from "react";
import "../i18n";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Constants from "../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import RbacManager from "../utilities/rbac";

function Login({ title, userType }) {
  const { login} = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
const [isLogin,setLogin]=useState(false)
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const navigate = useNavigate();
  const API_SERVER_URL = process.env.REACT_APP_API_BASE_URL;
  useEffect(() => {
    document.title = t("Login");
  }, [t]);
if (!isLogin){
  localStorage.removeItem("token")
}
  const handleSubmit = async (e) => {
    setLogin(false)
    e.preventDefault();
    if (email === "" || password === "") {
      setError(t("Please fill in all fields"));
    } else {
      // Handle login logic here
      try {
        setIsLoading(true); // Set loading to true on submit
        const requestBody = {
          email,
          password,
          ...(title === "Customer Login" && { user_type: "customer" }), // 👈 Conditional addition
          ...(title === "Employee Login" && { user_type: "employee" }), // 👈 Conditional addition
        };
        // const res = await fetch('https://vmcoservertest-cyf3gyg4hpb9h7ek.southindia-01.azurewebsites.net/api/user/email-password', {
        const res = await fetch(`${API_SERVER_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        const data = await res.json();

        localStorage.setItem("token", data.token);
        console.log("Login response:", data);
        login(data.token, data.data);

        if (!data?.success) {
          // setError(data.message || 'Login failed');
          setError(data?.message);
          return;
        }
        console.log("data", data);
        const role =
          data?.data?.roles[0] &&
          data.data.roles[0]?.toLowerCase() === "employee"
            ? data?.data?.designation
            : data.data.roles[0];

        RbacManager.loadRbacConfig(role, data.token);
        if (data?.data?.customerStatus === "new") {
          navigate("/customerDetails", {
            state: { customerId: data?.data?.customerId, mode: "add" },
          });
        } else if (
          data?.data?.userType?.toLowerCase() === "employee" &&
          (data?.data?.designation?.toLowerCase() ===
            Constants.DESIGNATIONS.OPS_COORDINATOR.toLowerCase() ||
            data?.data?.designation?.toLowerCase() ===
              Constants.DESIGNATIONS.OPS_MANAGER.toLowerCase() ||
            data?.data?.designation?.toLowerCase() ===
              Constants.DESIGNATIONS.SALES_EXECUTIVE.toLowerCase() ||
            data?.data?.designation?.toLowerCase() ===
              Constants.DESIGNATIONS.AREA_SALES_MANAGER.toLowerCase() ||
            data?.data?.roles[0].toLowerCase() ===
              Constants.ROLES.SUPER_ADMIN.toLowerCase())
        ) {
          navigate("/customers");
        } else if (
          data?.data?.userType?.toLowerCase() === "employee" &&
          (data?.data?.designation?.toLowerCase() ===
            Constants.DESIGNATIONS.MAINTENANCE_HEAD.toLowerCase() ||
            data?.data?.designation?.toLowerCase() ===
              Constants.DESIGNATIONS.MAINTENANCE_TECHNICIAN.toLowerCase() ||
            data?.data?.designation?.toLowerCase() ===
              Constants.DESIGNATIONS.MAINTENANCE_MANAGER.toLowerCase())
        ) {
          navigate("/maintenance");
        } else if (
          data?.data?.userType?.toLowerCase() === "employee" &&
          data?.data?.designation?.toLowerCase() ===
            Constants.DESIGNATIONS.BRANCH_ACCOUNTANT.toLowerCase()
        ) {
          navigate("/bankTransactions");
        }
        else if ( data?.data?.userType?.toLowerCase() === "employee" &&
          data?.data?.designation?.toLowerCase() ===
            Constants.DESIGNATIONS.PRODUCTION_MANAGER.toLowerCase()
        ) {
          navigate("/orders");
        } else {
          navigate("/catalog");
        }

        setMessage(data.message);
        setError("");
      } catch (error) {
        console.error("Login error:", error);
        setError("Unable to connect to server");
      } finally {
        setIsLoading(false); // Reset loading state
        setLogin(true)
      }
      setError("");
    }
  };


  // const getCookie = (name) => {
  //   const cookies = document.cookie
  //     .split(";")
  //     .map((cookie) => cookie.trim())
  //     .reduce((acc, cookie) => {
  //       const [key, value] = cookie.split("=");
  //       acc[key] = decodeURIComponent(value);
  //       return acc;
  //     }, {});

  //   return cookies[name] || null;
  // };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    navigate("/forgotPassword", { state: { email } }); // Pass email as state
  };

  const handleRegister = (e) => {
    e.preventDefault();
    navigate("/customers/registration");
  };
  const handleNavigation = (e) => {
    e.preventDefault();
    navigate("/login/employee");
  };
  return (
    <div className="login-screen">
      {/* {title === 'Customer Login' ?
                (<div className='login-screen-text'>
                    <p>{t('Thank you for completing the invitation.')}</p>
                    <p>{t('Please Login to provide further details')}</p>
                </div>) : []} */}

      <div className="login-component">
        <div className="login-header-container"><div className="login-header">{t("Login")}</div>
                 {title === "Customer Login" &&(  <a className="login-employee-link"
                href="#"
                onClick={isLoading ? (e) => e.preventDefault() : handleNavigation}
                style={{
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.5 : 1,
                  pointerEvents: isLoading ? "none" : "auto",
                      

                }}
              >
                {t("Employee")}
              </a>)}
              </div>
        <form onSubmit={handleSubmit}>
        <div className="login-container">
          
            <div className="form-group">
              <label htmlFor="email">{t("Email")}</label>
              <input
                type="text"
                id="email"
                value={email}
                placeholder={t("Email")}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">{t("Password")}</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  placeholder={t("Password")}
                  onChange={(e) => setPassword(e.target.value)}
                  className="password-input"
                />
                {password && (
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="password-toggle-btn"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                )}
              </div>
            </div>
            {error && <p className="error-message">{t(error)}</p>}
         
        </div>

        <div className="login-footer">
          <div>
          {title === "Customer Login" ? (
            <div className="login-footer-text">
              <a
                href="#"
                onClick={
                  isLoading ? (e) => e.preventDefault() : handleForgotPassword
                }
                style={{
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.5 : 1,
                  pointerEvents: isLoading ? "none" : "auto",
                }}
              >
                {t("Forgot Password?")}
              </a>
              <span> | </span>
              <a
                href="#"
                onClick={isLoading ? (e) => e.preventDefault() : handleRegister}
                style={{
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.5 : 1,
                  pointerEvents: isLoading ? "none" : "auto",
                }}
              >
                {t("Register")}
              </a>
             
            </div>
          ) : (
            <div className="login-footer-text">
              <a
                href="#"
                onClick={
                  isLoading ? (e) => e.preventDefault() : handleForgotPassword
                }
                style={{
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.5 : 1,
                  pointerEvents: isLoading ? "none" : "auto",
                }}
              >
                {t("Forgot Password?")}
              </a>
            </div>
          )}
          </div>
          <div>
            <button
              type="submit"
              className="login-button"
              // onSubmit={handleSubmit}
              disabled={isLoading}
              style={{
                background: isLoading ? "#ccc" : "",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? t("Signing In...") : t("Sign In")}
            </button>
          </div>
        </div>
         </form>
      </div>
      <style>
        {`
        .password-input-wrapper {
  position: relative;
  width: 100%;
}

.password-input {
  width: 100%;
  padding-right: 40px; /* Space for the eye icon */
}

.password-toggle-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 5px;
}
                input:focus {
                    outline: none;
                }
                `}
      </style>
    </div>
  );
}

export default Login;
