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
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Get email from navigation state
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  useEffect(() => {
    if (newPassword && confirmPassword && newPassword === confirmPassword) {
      setError(t("Passwords match!"));
    } else if (newPassword && confirmPassword) {
      setError(t("Passwords do not match"));
    }
  }, [newPassword, confirmPassword, t]);

  const toggleLanguage = () => {
    const newLang = isRTL ? "en" : "ar";
    i18n.changeLanguage(newLang);
    document.body.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isOtpSent) {
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t("Please send OTP first"),
        confirmButtonText: t("OK"),
      });
      return;
    }

    // Reset messages
    setError("");
    setSuccess("");

    // Validation
    if (!email) {
      setError(t("Email is required"));
      return;
    }
    if (!otp) {
      setError(t("OTP is required"));
      return;
    }
    if (otp.length !== 6) {
      setError(t("OTP must be 6 digits"));
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError(t("Please fill in all fields"));
      return;
    }

    if (newPassword.length < 6) {
      setError(t("Password must be at least 6 characters long"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("Passwords do not match"));
      return;
    }

    try {
      // const response = await fetch('https://vmcoservertest-cyf3gyg4hpb9h7ek.southindia-01.azurewebsites.net/api/user/reset-password', {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/user/reset-password`,
        { email, newPassword, otp }
      );

      if (data.status !== "success") {
        // throw new Error(data.message || t('Password reset failed'));
        Swal.fire({
          icon: "error",
          title: t(data?.status),
          text: data.message || t("Password reset failed"),
          confirmButtonText: t("OK"),
        });
        return;
      }

      // setSuccess(t('Password reset successful! Redirecting...'));
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
      setError(err.message || t("An error occurred. Please try again."));
    }
  };
  const handleSendOtp = async () => {
    if (!email) {
      setError(t("Email is required"));
      return;
    }

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/users/reset-password-send-otp`,
        { email }
      );
      if (data.status !== "success") {
        //   throw new Error(data.message || t('Failed to send OTP'));
        Swal.fire({
          icon: "error",
          title: t(data?.status),
          text: data.message || t("Failed to send OTP"),
          confirmButtonText: t("OK"),
        });
      }
      setIsOtpSent(true);
      setError("");
      setSuccess(t("OTP sent successfully"));
    } catch (err) {
      console.error("OTP send error:", err);
      setError(err.message || "Failed to send OTP");
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
      <div className="login-screen">
        <div className="login-component">
          <div className="login-header">{t("Reset Password")}</div>
          <div className="login-container">
            <form onSubmit={handleSubmit}>
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

                    if (value.trim() === "") {
                      setIsOtpSent(false); 
                    }
                  }}
                  readOnly={!!location.state?.email} // Make readonly if passed from login
                />
                
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    style={{
                      marginTop: "10px",
                      padding: "6px 10px",
                      background: "#01594C",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      width: "100px"
                    }}
                  >
                    { !isOtpSent  ? t("Send OTP") :t("Resend OTP") }
                  </button>
              </div>
              {isOtpSent && (
                <div className="form-group">
                  <label htmlFor="otp">{t("Enter OTP")}</label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    placeholder={t("Enter OTP")}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
              )}
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
              {error && <p className="error-message">{error}</p>}
              {success && <p className="success-message">{success}</p>}
            </form>
          </div>
          <div className="onboarding-footer">
            <div>
              <button
                type="submit"
                className="login-button"
                onClick={handleSubmit}
              >
                {t("Confirm")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
