import React, { useState, useEffect } from "react";
import "../styles/components.css";
import "../i18n";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate, useLocation } from "react-router-dom";
import { faLanguage, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import axios from "axios";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
function ForgotPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false); // New state for OTP verification
  const [previousVerifiedEmail, setPreviousVerifiedEmail] = useState("");

  // Add loading states
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Get email from navigation state
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const toggleLanguage = () => {
    const newLang = isRTL ? "en" : "ar";
    i18n.changeLanguage(newLang);
    document.body.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  // Update handleSubmit with loading state:

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset messages at the start
    setError("");
    setSuccess("");

    if (!isOtpSent) {
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t("Please send OTP first"),
        confirmButtonText: t("OK"),
      });
      return;
    }

    // Validation - only show errors after submit
    if (!email) {
      setError("Email is required");
      return;
    }
    if (!otp) {
      setError("OTP is required");
      return;
    }
    if (otp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    // Password validation - same as customersOnboarding.js
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      setError(
      
          "Password must contain at least one uppercase, one lowercase, one number and one special character"
        
      );
      return;
    }

    // Only check password matching after submit
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitLoading(true); // Start loading

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/user/reset-password`,
        { email, newPassword, otp }
      );

      if (data.status !== "success") {
        Swal.fire({
          icon: "error",
          title: t(data?.status),
          text: t(data.message) || t("Password reset failed"),
          confirmButtonText: t("OK"),
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: t("Success"),
        text: t("Password reset successful! Redirecting..."),
        confirmButtonText: t("OK"),
      });
      console.log("Password reset successful:", data);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Password reset error:", err);
       setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitLoading(false); // Stop loading
    }
  };

  // Update handleSendOtp with loading state:

  const handleSendOtp = async () => {
    // Email validation regex (same as customersOnboarding.js)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      setError("Email is required");
      return;
    }

    // Check email format before sending OTP
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsOtpLoading(true); // Start loading

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/users/reset-password-send-otp`,
        { email }
      );

      if (data.status !== "success") {
        Swal.fire({
          icon: "error",
          title: t(data?.status || "Error"),
          text: t(data.message) || t("Failed to send OTP"),
          confirmButtonText: t("OK"),
        });
        return;
      }

      setIsOtpSent(true);
      setError(""); // Clear any previous error messages
      setSuccess(""); // Clear any previous success messages

      // Show success alert
      Swal.fire({
        icon: "success",
        title: t("Success"),
        text: t("OTP sent successfully"),
        confirmButtonText: t("OK"),
      });
    } catch (err) {
      console.error("OTP send error:", err);
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: err.message || t("Failed to send OTP"),
        confirmButtonText: t("OK"),
      });
    } finally {
      setIsOtpLoading(false); // Stop loading
    }
  };

  // Update the OTP verification success logic:
  const handleVerifyOtp = async () => {
    setIsVerifyLoading(true); // Start loading

    try {
      // Your OTP verification API call here
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/users/verify-reset-otp`,
        { email, otp }
      );

      if (data.status === "success") {
        setIsOtpVerified(true);
        setPreviousVerifiedEmail(email); // Store the verified email
        setError("");

        Swal.fire({
          icon: "success",
          title: t("Success"),
          text: t("OTP verified successfully"),
          confirmButtonText: t("OK"),
        });
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      Swal.fire({
        icon: "error",
        title: t("Error"),
        // text: err.message || t("OTP verification failed"),
        text: t("Invalid OTP"),
        confirmButtonText: t("OK"),
      });
    } finally {
      setIsVerifyLoading(false); // Stop loading
    }
  };

  return (
    <div>
      <div className={`app ${isRTL ? "rtl" : ""}`}>
        <header className="header">
          <div className="sidebar-header">
            <FontAwesomeIcon icon={faLocationDot} size="xl" />
            <h1>{t("Talab Point")}</h1>
          </div>
          <button className="lang-switch-btn" onClick={toggleLanguage}>
            <FontAwesomeIcon icon={faLanguage} />
            <span>{isRTL ? "EN" : "عربى"}</span>
          </button>
        </header>
      </div>
      <div className="onboarding-screen">
        <div className="onboarding-component">
          <div className="onboarding-header">{t("Reset Password")}</div>

          <form onSubmit={handleSubmit} className="onboarding-container">
            <div className="form-group">
              <label htmlFor="email">{t("Email")}</label>
              <input
                type="email"
                id="email"
                value={email}
                placeholder={t("Email")}
                onChange={(e) => {
                  const value = e.target.value;
                  setEmail(value);

                  // Reset OTP states when email changes
                  if (value.trim() === "") {
                    setIsOtpSent(false);
                    setIsOtpVerified(false); // Add this state if not already present
                  } else {
                    // If email is changed from a previously verified email, reset verification
                    if (value !== previousVerifiedEmail) {
                      setIsOtpSent(false);
                      setIsOtpVerified(false);
                    }
                  }
                }}
                readOnly={!!location.state?.email}
              />

              {/* Only show Send OTP button when email is entered */}
              {email && !isOtpSent && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isOtpLoading}
                  style={{
                    marginTop: "10px",
                    padding: "6px 10px",
                    background: isOtpLoading ? "#ccc" : "#01594C",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: isOtpLoading ? "not-allowed" : "pointer",
                    width: "100px",
                  }}
                >
                  {isOtpLoading ? t("Sending...") : t("Send OTP")}
                </button>
              )}

              {/* Show Resend OTP button when OTP is already sent */}
              {email && isOtpSent && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isOtpLoading}
                  style={{
                    marginTop: "10px",
                    padding: "6px 10px",
                    background: isOtpLoading ? "#ccc" : "#01594C",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: isOtpLoading ? "not-allowed" : "pointer",
                    width: "100px",
                  }}
                >
                  {isOtpLoading ? t("Sending...") : t("Resend OTP")}
                </button>
              )}
            </div>
            {/* OTP field - always present in grid, only visible when OTP is sent */}
            <div className="form-group">
              {isOtpSent && (
                <>
                  <label htmlFor="otp">{t("Enter OTP")}</label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    placeholder={t("Enter OTP")}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  {/* Add Verify OTP button */}
                  {/* <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isVerifyLoading || !otp}
                    style={{
                      marginTop: "10px",
                      padding: "6px 10px",
                      background: isVerifyLoading || !otp ? "#ccc" : "#01594C",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor:
                        isVerifyLoading || !otp ? "not-allowed" : "pointer",
                      width: "100px",
                    }}
                  >
                    {isVerifyLoading ? t("Verifying...") : t("Verify OTP")}
                  </button> */}
                </>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="password">{t("New Password")}</label>
              <input
                type="password"
                id="password"
                value={newPassword}
                placeholder={t("New Password")}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmpassword">{t("Confirm Password")}</label>
              <input
                type="password"
                id="confirmpassword"
                value={confirmPassword}
                placeholder={t("Confirm Password")}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && <p className="error-message">{t(error)}</p>}
          </form>

          <div className="onboarding-footer">
            <div className="onboarding-footer-text">
              <span>{t("Remember password?")}</span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/login");
                }}
              >
                {`\t ${t("Login")}`}
              </a>
            </div>
            <div>
              <button
                type="submit"
                className="login-button"
                onClick={handleSubmit}
                disabled={isSubmitLoading}
                style={{
                  background: isSubmitLoading ? "#ccc" : "#01594C",
                  cursor: isSubmitLoading ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitLoading ? t("Processing...") : t("Confirm")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
