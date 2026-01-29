import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/forms.css";
import { isMobile } from "../../utilities/isMobile";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBriefcase, faCheck, faCheckCircle, faEdit, faEnvelope, faExclamationTriangle, faHistory, faPaperPlane, faPhone, faRedo, faSpinner, faTimes, faUser, faUserFriends, faUsers, faUserTie } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import axios from "axios";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import EditIcon from "@mui/icons-material/Edit";
import { useAuth } from "../../context/AuthContext";
import RbacManager from "../../utilities/rbac";
import constants from "../../constants";
import {  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
} from "@mui/material";
const ContactRow = ({ label, isRequired, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="form-row">
      <div className="form-group">
        <label></label>
        <input
          placeholder={t(`${label} Name`)}
          required={isRequired}
          onChange={onChange}
        />
      </div>
      <div className="form-group">
        <label></label>
        <input
          placeholder={t("Designation")}
          required={isRequired}
          onChange={onChange}
        />
      </div>
      <div className="form-group">
        <label></label>
        <input
          placeholder={t("Email")}
          required={isRequired}
          onChange={onChange}
        />
      </div>
      <div className="form-group">
        <label></label>
        <input
          placeholder={t("Phone")}
          required={isRequired}
          onChange={onChange}
        />
      </div>
    </div>
  );
};

const ContactSection = ({
  branch,
  setBranchContacts,
  originalBranchContacts,
  branchDetails,
  customer,
  originalCustomerPaymentMethodsData,
  branchChanges,
  handleBranchFieldChange,
  inApproval,
  mode,
  workflowInstanceId,
  formErrors = {},
}) => {
  const { t } = useTranslation();
  const [workflowData, setWorkflowData] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const token = localStorage.getItem("token");
  // Add OTP verification states
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  // const [isMobile, setIsMobile] = useState(window.innerWidth < 500);
  // Add state to track verified emails from database
  const [verifiedEmails, setVerifiedEmails] = useState(new Set());
  const [currentEmail, setcurrentEmail] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [error, setError] = useState("");
const [popup, setPopup] = useState(false);
const { user, isAuthenticated, logout } = useAuth();
  let customerFormMode;
  if (mode === "edit") {
    customerFormMode = "custDetailsEdit";
  } else {
    customerFormMode = "custDetailsAdd";
  }
  // Get current values from branchChanges or fall back to branch data
  // const getFieldValue = (fieldName) => {
  //     return branchChanges?.[branch.id]?.[fieldName] ?? branch[fieldName] ?? '';
  // };
  const rbacMgr = new RbacManager(
      user?.userType == "employee" && user?.roles[0] !== "admin"
        ? user?.designation
        : user?.roles[0],
      customerFormMode
    );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);
  const getFieldValue = (fieldName) => {
    if (branchChanges?.[branch.id]?.hasOwnProperty(fieldName)) {
      return branchChanges[branch.id][fieldName];
    }
    return branch[fieldName] ?? "";
  };
const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Go' || e.key === 'Search' || e.key === 'Done'  ) {
      if (isMobile) {
        // Close keyboard
        e.target.blur();
        document.body.classList.remove('keyboard-open');
      }
    }
  };
  // Add OTP handling functions
  const handleSendOtp = async (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      Swal.fire({
        title: t("Error"),
        text: t("Email is required"),
        icon: "error",
        confirmButtonText: t("OK"),
      });
      return;
    }

    if (!emailRegex.test(email)) {
      Swal.fire({
        title: t("Error"),
        text: t("Please enter a valid email address"),
        icon: "error",
        confirmButtonText: t("OK"),
      });
      return;
    }

    setIsOtpLoading(true);

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/registration/send-otp`,
        {
          contact_type: "email",
          contact_info: email,
        }
      );

      if (data?.status === "success") {
        setIsOtpSent(true);
        Swal.fire({
          title: t("OTP Sent"),
          text: t("OTP has been sent to your email"),
          icon: "success",
          confirmButtonText: t("OK"),
        });
      }
      if (data?.status === "verified") {
        setIsOtpVerified(true);
        setIsOtpSent(true);
        Swal.fire({
          title: t("Already Verified"),
          text: t("This email is already verified"),
          icon: "success",
          confirmButtonText: t("OK"),
        });
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      Swal.fire({
        title: t("Error"),
        text: t("Failed to send OTP. Please try again."),
        icon: "error",
        confirmButtonText: t("OK"),
      });
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (email, otp) => {
    if (!otp) {
      Swal.fire({
        title: t("Error"),
        text: t("Please enter OTP"),
        icon: "error",
        confirmButtonText: t("OK"),
      });
      return;
    }

    setIsVerifyLoading(true);

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/registration/verify-otp`,
        {
          contact_type: "email",
          contact_info: email,
          otp: otp,
        }
      );

      if (data?.status === "success") {
        setIsOtpVerified(true);
        setIsOtpSent(false);
        setOtpValue("");
        Swal.fire({
          title: t("Email Verified"),
          text: t("Email has been successfully verified"),
          icon: "success",
          confirmButtonText: t("OK"),
        });
      } else {
        Swal.fire({
          title: t("Error"),
          text: t("Invalid OTP. Please try again."),
          icon: "error",
          confirmButtonText: t("OK"),
        });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      Swal.fire({
        title: t("Error"),
        text: t("Failed to verify OTP. Please try again."),
        icon: "error",
        confirmButtonText: t("OK"),
      });
    } finally {
      setIsVerifyLoading(false);
    }
  };

  // Reset OTP states when email changes
  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    if (name === "primaryContactEmail") {
      setIsOtpSent(false);
      setIsOtpVerified(false);
      setOtpValue("");
    }
    handleBranchFieldChange(e);
  };
const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  const handleNewEmailChange = (e) => {
      const value = e.target.value;
      setNewEmail(value);
  
      if (value && !validateEmail(value)) {
        setError("Invalid email format");
      } else {
        setError("");
      }
    };
    const handleSubmit = async () => {
      try {
        const payload = {
          branchId: branchDetails?.id,
          oldEmail: currentEmail,
          email: newEmail,
          customerId: branchDetails?.customerId,
          sequenceId: branchDetails?.sequenceId
        };
  
        const { data } = await axios.post(
          `${API_BASE_URL}/branch-contact-primary-email-update`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      //   console.log("data", data);
  
        if (data.success) {
      //     navigate("/customers");
          setPopup(false);
      //     setSuccess(data.message);
  
          Swal.fire({
            icon: "success",
            title: t("Updated Email "),
            text: t(data.message),
            confirmButtonText: t("OK"),
          });
          setError("");
          setBranchContacts({...branch, primaryContactEmail: newEmail})
        } else {
          setError(data.message);
        }
      } catch (error) {
      //   console.error("Error updating email:", error?.response?.data?.message);
      //   setError(
      //     error?.response?.data?.message ||
      //       "Something went wrong while updating email"
      //   );
      }
    };

  // Contact types we want to display
  const contactTypes = [
    {
      type: "primary",
      label: "Primary Contact",
      isRequired: true,
      fields: [
        { name: "Name", field: "primaryContactName" },
        { name: "Designation", field: "primaryContactDesignation" },
        { name: "Email", field: "primaryContactEmail" },
        { name: "Phone", field: "primaryContactMobile" },
      ],
    },
    {
      type: "secondary",
      label: "Secondary Contact",
      // isRequired: originalCustomerPaymentMethodsData?.methodDetails?.credit?.[constants.ENTITY.SHC]
      //             ?.isAllowed || 
      //           originalCustomerPaymentMethodsData?.methodDetails?.credit?.[constants.ENTITY.VMCO]
      //             ?.isAllowed ||
      //           originalCustomerPaymentMethodsData?.methodDetails?.credit?.[constants.ENTITY.DAR]
      //             ?.isAllowed ||
      //           originalCustomerPaymentMethodsData?.methodDetails?.credit?.[constants.ENTITY.NAQI]
      //             ?.isAllowed ||
      //           originalCustomerPaymentMethodsData?.methodDetails?.credit?.[constants.ENTITY.GMTC]
      //             ?.isAllowed ? true : false,
      isRequired: false,
      fields: [
        { name: "Name", field: "secondaryContactName" },
        { name: "Designation", field: "secondaryContactDesignation" },
        { name: "Email", field: "secondaryContactEmail" },
        { name: "Phone", field: "secondaryContactMobile" },
      ],
    },
    {
      type: "supervisor",
      label: "Supervisor Contact",
      isRequired: false,
      fields: [
        { name: "Name", field: "supervisorContactName" },
        { name: "Designation", field: "supervisorContactDesignation" },
        { name: "Email", field: "supervisorContactEmail" },
        { name: "Phone", field: "supervisorContactMobile" },
      ],
    },
  ];

  // const handleContactChange = (fieldName, value) => {
  //   handleBranchFieldChange(branch.id, fieldName, value);
  // };
  const fetchWorkflowDataOfBranch = async (workflowId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/workflow-instance/id/${workflowId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json",
                                'Authorization': `Bearer ${token}` },
          
        }
      );
      const workflowDataJson = await response.json();
      console.log("Workflow Data JSON~~~~~~~~~~~~~", workflowDataJson);
      return workflowDataJson?.data?.workflowData?.updates;
    } catch (error) {
      console.error("Error fetching workflow data:", error);
      throw error;
    }
  };
  useEffect(() => {
    const fetchWorkflowData = async () => {
      if (inApproval && workflowInstanceId) {
        const wfData = await fetchWorkflowDataOfBranch(workflowInstanceId);
        setWorkflowData(wfData?.contacts);
      }
    };
    fetchWorkflowData();
  }, [workflowInstanceId, inApproval]);

  // Add function to check email verification status
  const checkEmailVerificationStatus = async (email) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/registration/check-email?email=${email}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      const data = await response.json();
      return data?.status === "verified";
    } catch (error) {
      console.error("Error checking verification status:", error);
      return false;
    }
  };

  // Add useEffect to check verification status when component mounts
  useEffect(() => {
    const checkExistingVerifications = async () => {
      if (branch?.primaryContactEmail) {
        const isVerified = await checkEmailVerificationStatus(
          branch.primaryContactEmail
        );
        if (isVerified) {
          setVerifiedEmails((prev) =>
            new Set(prev).add(branch.primaryContactEmail)
          );
          setIsOtpVerified(true);
        }
      }
    };
    checkExistingVerifications();
  }, [branch?.primaryContactEmail]);

  // Add email validation function

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email && emailRegex.test(email);
  };

  return (
    !isMobile ? <div className="form-section">
      <h3>{t("Personal Details")}</h3>
      {contactTypes.map(({ type, label, isRequired, fields }, index) => (
        <div className="form row" key={index}>
          <div className="form-group">
            <label>
              {t(label)}
              {isRequired && <span className="required-field">*</span>}
            </label>
            <div className="form-row">
              {fields.map(({ name, field }) => {
                // const hasUpdate = (inApproval && workflowData ? field.name in workflowData : false) || (inApproval && branchDetails.branchStatus === "pending");
                const hasUpdate =
                  (mode === "edit" &&
                    inApproval &&
                    branch?.[field] !== originalBranchContacts?.[field]) ||
                  (mode === "edit" &&
                    inApproval &&
                    branchDetails?.branchStatus === "pending");
                return (
                  <div className="form-group" key={field}>
                    {!field.toLowerCase().includes("mobile") ? 
                    (<div className="input-with-verification"><input
                      type={field === "primaryContactEmail" ? "email" : "text"}
                      placeholder={t(name)}
                      name={field}
                      value={branch?.[field]}
                      required={isRequired}
                      onChange={
                        field === "primaryContactEmail"
                          ? handleEmailChange
                          : handleBranchFieldChange
                      }
                      style={
                        hasUpdate
                          ? {
                              backgroundColor: "#fff8e1",
                            }
                          : {}
                      }
                      disabled={
                        // (customerFormMode === "custDetailsEdit" &&
                        //   !hasUpdate) ||
                        (branchDetails?.branchStatus !== "new" &&
                          field === "primaryContactEmail")
                      }
                    />
                    {field === "primaryContactEmail" && branchDetails?.branchStatus?.toLowerCase() === "approved" &&
                                isE("branchEmailEdit") &&
                                isV("branchEmailEdit") && 
                                (
                                  <IconButton
                                    onClick={() => {
                                      setcurrentEmail(branch?.[field]);
                                      setPopup(true);
                                    }}
                                    sx={{ padding: "5px" }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                )}
                                </div>
                  ) : (
                      <PhoneInput
          international
          defaultCountry="SA"
          countryCallingCodeEditable={false}
          placeholder={t("Phone")}
          name={field}
          value={branch?.[field]}
          onChange={(value) => handleBranchFieldChange({
            target: {
              name: field,
              value: value
            }
          })}
          style={
                        hasUpdate
                          ? {
                              backgroundColor: "#fff8e1",
                            }
                          : {}
                      }
          required={isRequired}
          disabled={
                        // (customerFormMode === "custDetailsEdit" &&
                        //   !hasUpdate) ||
                        (branchDetails?.branchStatus !== "new" &&
                          field === "primaryContactEmail")
                      }
          className="branch-phone-input"
        />
                    ) }

                    {/* Email verification section for primary contact email */}
                    {field === "primaryContactEmail" &&
                      branch?.[field] &&
                      isValidEmail(branch[field]) && (
                        <div style={{ marginTop: "8px" }}>
                          {!isOtpVerified &&
                          !verifiedEmails.has(branch[field]) ? (
                            <div>
                              {!isOtpSent ? (
                                <a
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();

                                    handleSendOtp(branch[field]);
                                  }}
                                  style={{
                                    fontSize: "11px",
                                    color: isOtpLoading ? "#ccc" : "darkblue",
                                    textDecoration: "underline",
                                    cursor: isOtpLoading
                                      ? "not-allowed"
                                      : "pointer",
                                    pointerEvents: isOtpLoading
                                      ? "none"
                                      : "auto",
                                  }}
                                >
                                  {isOtpLoading
                                    ? t("Sending...")
                                    : t("Send Otp")}
                                </a>
                              ) : (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "5px",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <input
                                    type="text"
onFocus={() => {
       if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
   
    
  }}
onKeyDown={handleKeyDown}
  onBlur={() => {
   
      document.body.classList.remove('keyboard-open');
       // 👈 show menu again (optional)
  }}
    
                                    placeholder={t("Enter OTP")}
                                    value={otpValue}
                                    onChange={(e) =>
                                      setOtpValue(e.target.value)
                                    }
                                    style={{
                                      padding: "3px 6px",
                                      fontSize: "11px",
                                      width: "80px",
                                      border: "1px solid #ccc",
                                      borderRadius: "3px",
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleVerifyOtp(branch[field], otpValue)
                                    }
                                    disabled={isVerifyLoading || !otpValue}
                                    style={{
                                      padding: "4px 10px",
                                      fontSize: "11px",
                                      backgroundColor:
                                        isVerifyLoading || !otpValue
                                          ? "#ccc"
                                          : "#28a745",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: "3px",
                                      cursor:
                                        isVerifyLoading || !otpValue
                                          ? "not-allowed"
                                          : "pointer",
                                    }}
                                  >
                                    {isVerifyLoading
                                      ? t("Verifying...")
                                      : t("Verify")}
                                  </button>
                                  <a
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleSendOtp(branch[field]);
                                    }}
                                    style={{
                                      fontSize: "11px",
                                      color: isOtpLoading ? "#ccc" : "#6c757d",
                                      textDecoration: "underline",
                                      cursor: isOtpLoading
                                        ? "not-allowed"
                                        : "pointer",
                                      pointerEvents: isOtpLoading
                                        ? "none"
                                        : "auto",
                                    }}
                                  >
                                    {t("Resend")}
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faCheckCircle}
                                color="green"
                                size="sm"
                              />
                              <span
                                style={{
                                  color: "green",
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                }}
                              >
                                {t("Email Verified")}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                    {hasUpdate && (
                      <div className="current-value">
                        {t("Previous")}:{" "}
                        {originalBranchContacts?.[field] || "(empty)"}
                      </div>
                    )}
                    {formErrors[field] && (
                      <div className="current-value">
                        <span
                          className="error-message"
                          style={{ fontSize: "12px" }}
                        >
                          {t(formErrors[field])}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
      <Dialog
              open={popup}
              onClose={() => setPopup(false)}
              fullWidth
              maxWidth="sm"
            >
              <DialogTitle>Edit Email</DialogTitle>
              <DialogContent
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                {/* Current Email (disabled) */}
                <TextField
                  label="Current Email"
                  value={currentEmail}
                  disabled
                  fullWidth
                />
      
                <TextField
                  label="New Email"
                  value={newEmail}
                  onChange={handleNewEmailChange}
                  error={!!error}
                  helperText={error}
                  fullWidth
                />
              </DialogContent>
      
              <DialogActions>
                <Button onClick={() => setPopup(false)}>Cancel</Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!newEmail}
                >
                  Submit
                </Button>
              </DialogActions>
            </Dialog>
    </div>:<div className="personal-details-section-mobile">
  {/* Section Header */}
  <div className="section-header-mobile">
    <div className="section-title-wrapper">
      <FontAwesomeIcon icon={faUserFriends} className="section-icon" />
      <h3 className="section-title-mobile">{t("Personal Details")}</h3>
    </div>
    <div className="section-subtitle-mobile">
      Contact information for branch personnel
    </div>
  </div>

  {/* Contact Cards */}
  <div className="contact-cards-container-mobile">
    {contactTypes.map(({ type, label, isRequired, fields }, index) => (
      <div className={`contact-card-mobile ${type}-contact`} key={index}>
        {/* Card Header */}
        <div className="contact-card-header-mobile">
          <div className="contact-type-badge">
            <FontAwesomeIcon 
              icon={
                type === "primary" ? faUser
                 : 
                type === "secondary" ? faUsers : 
                faUserTie
              } 
              className="contact-type-icon" 
            />
            <span className="contact-type-label">{t(label)}</span>
            {isRequired && <span className="required-badge">{t("Required")}</span>}
          </div>
          <div className="contact-status-dot"></div>
        </div>

        {/* Contact Fields */}
        <div className="contact-fields-grid-mobile">
          {fields.map(({ name, field }) => {
            const hasUpdate =
              (mode === "edit" &&
                inApproval &&
                branch?.[field] !== originalBranchContacts?.[field]) ||
              (mode === "edit" &&
                inApproval &&
                branchDetails?.branchStatus === "pending");

            return (
              <div className={`contact-field-mobile ${hasUpdate ? "field-updated" : ""}`} key={field}>
                {/* Field Label */}
                <div className="field-label-row-mobile">
                  <label className="field-label-mobile">
                    <FontAwesomeIcon 
                      icon={
                        field.includes("Name") ? faUser : 
                        field.includes("Designation") ? faBriefcase : 
                        field.includes("Email") ? faEnvelope : 
                        faPhone
                      } 
                      className="field-label-icon" 
                    />
                    {t(name)}
                  </label>
                  {hasUpdate && (
                    <span className="update-indicator-mobile">
                      <span className="update-dot"></span>
                      <span className="update-text">Updated</span>
                    </span>
                  )}
                </div>

                {/* Field Input */}
                <div className="field-input-wrapper-mobile">
                  {!field.toLowerCase().includes("mobile") ? (
                    <div className={`input-group-mobile ${field === "primaryContactEmail" ? "email-input" : ""}`}>
                      <div className="input-container-mobile">
                        <input
                          type={field === "primaryContactEmail" ? "email" : "text"}
                          placeholder={t(name)}
                          name={field}
                          value={branch?.[field] || ""}
                          required={isRequired}
                          onChange={
                            field === "primaryContactEmail"
                              ? handleEmailChange
                              : handleBranchFieldChange
                          }
                          className={`contact-input-mobile ${hasUpdate ? "input-update" : ""}`}
                          disabled={
                            (branchDetails?.branchStatus !== "new" &&
                              field === "primaryContactEmail")
                          }
                        />
                        {/* Email Edit Button */}
                        {field === "primaryContactEmail" && 
                          branchDetails?.branchStatus?.toLowerCase() === "approved" &&
                          isE("branchEmailEdit") &&
                          isV("branchEmailEdit") && (
                          <button 
                            className="edit-email-btn-mobile"
                            onClick={() => {
                              setcurrentEmail(branch?.[field]);
                              setPopup(true);
                            }}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                        )}
                      </div>
                      
                      {/* Email Verification Section */}
                      {field === "primaryContactEmail" &&
                        branch?.[field] &&
                        isValidEmail(branch[field]) && (
                        <div className="email-verification-section-mobile">
                          {!isOtpVerified && !verifiedEmails.has(branch[field]) ? (
                            <div className="verification-actions-mobile">
                              {!isOtpSent ? (
                                <button
                                  className="send-otp-btn-mobile"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleSendOtp(branch[field]);
                                  }}
                                  disabled={isOtpLoading}
                                >
                                  <FontAwesomeIcon icon={faPaperPlane} />
                                  {isOtpLoading ? t("Sending...") : t("Send OTP")}
                                </button>
                              ) : (
                                <div className="otp-verification-mobile">
                                  <div className="otp-input-group-mobile">
                                    <input
                                      type="text"
onFocus={() => {
       if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
   
    
  }}
onKeyDown={handleKeyDown}
  onBlur={() => {
   
      document.body.classList.remove('keyboard-open');
       // 👈 show menu again (optional)
  }}
    
                                      placeholder={t("Enter OTP")}
                                      value={otpValue}
                                      onChange={(e) => setOtpValue(e.target.value)}
                                      className="otp-input-mobile"
                                      maxLength="6"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleVerifyOtp(branch[field], otpValue)}
                                      disabled={isVerifyLoading || !otpValue}
                                      className="verify-otp-btn-mobile"
                                    >
                                      {isVerifyLoading ? (
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                      ) : (
                                        <>
                                          <FontAwesomeIcon icon={faCheck} />
                                          {t("Verify")}
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <button
                                    className="resend-otp-btn-mobile"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleSendOtp(branch[field]);
                                    }}
                                    disabled={isOtpLoading}
                                  >
                                    <FontAwesomeIcon icon={faRedo} />
                                    {t("Resend")}
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="verified-badge-mobile">
                              <FontAwesomeIcon icon={faCheckCircle} />
                              <span>{t("Email Verified")}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="phone-input-wrapper-mobile">
                      <PhoneInput
                        international
                        defaultCountry="SA"
                        countryCallingCodeEditable={false}
                        placeholder={t("Phone")}
                        name={field}
                        value={branch?.[field]}
                        onChange={(value) => handleBranchFieldChange({
                          target: {
                            name: field,
                            value: value
                          }
                        })}
                        className={`phone-input-mobile ${hasUpdate ? "input-update" : ""}`}
                        required={isRequired}
                        disabled={
                          (branchDetails?.branchStatus !== "new" &&
                            field === "primaryContactEmail")
                        }
                      />
                      <div className="phone-input-icon-mobile">
                        <FontAwesomeIcon icon={faPhone} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Previous Value for Updated Fields */}
                {hasUpdate && originalBranchContacts?.[field] && (
                  <div className="previous-value-mobile">
                    <FontAwesomeIcon icon={faHistory} />
                    <span className="previous-label">Previous:</span>
                    <span className="previous-text">{originalBranchContacts[field]}</span>
                  </div>
                )}

                {/* Error Message */}
                {formErrors[field] && (
                  <div className="error-message-mobile">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{t(formErrors[field])}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ))}
  </div>

  {/* Edit Email Dialog */}
  <Dialog
    open={popup}
    onClose={() => setPopup(false)}
    fullWidth
    maxWidth="sm"
    className="email-edit-dialog-mobile"
  >
    <div className="dialog-header-mobile">
      <FontAwesomeIcon icon={faEnvelope} />
      <DialogTitle>Edit Email</DialogTitle>
    </div>
    <DialogContent>
      <div className="dialog-fields-mobile">
        {/* Current Email */}
        <div className="dialog-field-group-mobile">
          <label className="dialog-label-mobile">
            <FontAwesomeIcon icon={faEnvelope} />
            Current Email
          </label>
          <div className="current-email-display-mobile">
            {currentEmail}
          </div>
        </div>

        {/* New Email */}
        <div className="dialog-field-group-mobile">
          <label className="dialog-label-mobile">
            <FontAwesomeIcon icon={faEnvelope} />
            New Email
          </label>
          <TextField
            value={newEmail}
            onChange={handleNewEmailChange}
            error={!!error}
            helperText={error}
            fullWidth
            variant="outlined"
            size="small"
            className="new-email-input-mobile"
          />
        </div>
      </div>
    </DialogContent>
    <DialogActions className="dialog-actions-mobile">
      <Button 
        onClick={() => setPopup(false)} 
        className="cancel-btn-mobile"
        startIcon={<FontAwesomeIcon icon={faTimes} />}
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={!newEmail}
        className="submit-btn-mobile"
        startIcon={<FontAwesomeIcon icon={faCheck} />}
      >
        Submit
      </Button>
    </DialogActions>
  </Dialog>

  {/* Custom Styles */}
  <style jsx>{`
    .phone-input-mobile .PhoneInputInput {
      padding: 12px;
      border: none;
      background: transparent;
      font-size: 14px;
      width: 100%;
    }
    
    .phone-input-mobile .PhoneInputCountrySelect {
      padding: 8px;
    }
    
    .phone-input-mobile .PhoneInputCountryIcon {
      width: 20px;
      height: 20px;
    }

    /* Personal Details Mobile Section */
.personal-details-section-mobile {
  padding: 20px;
  // background: linear-gradient(135deg, #ffffff, #f8f9fa);
  border-radius: 16px;
  margin: 16px 0;
  box-shadow: 0 4px 20px rgba(0, 89, 76, 0.08);
  border: 1px solid rgba(0, 89, 76, 0.1);
}

/* Section Header */
.section-header-mobile {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(0, 89, 76, 0.1);
}

.section-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.section-icon {
  font-size: 24px;
  color: #00594C;
}

.section-title-mobile {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin: 0;
  background: linear-gradient(135deg, #00594C, #007B6B);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-subtitle-mobile {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
  font-weight: 500;
}

/* Contact Cards */
.contact-cards-container-mobile {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.contact-card-mobile {
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.contact-card-mobile:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 89, 76, 0.15);
}

.primary-contact {
  border-color: #00594C;
  background: linear-gradient(135deg, #ffffff, rgba(0, 89, 76, 0.03));
}

.secondary-contact {
  border-color: #32A19F;
  background: linear-gradient(135deg, #ffffff, rgba(50, 161, 159, 0.03));
}

.supervisor-contact {
  border-color: #F6921E;
  background: linear-gradient(135deg, #ffffff, rgba(246, 146, 30, 0.03));
}

/* Contact Card Header */
.contact-card-header-mobile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 89, 76, 0.1);
}

.contact-type-badge {
  display: flex;
  align-items: center;
  gap: 10px;
}

.contact-type-icon {
  width: 24px;
  height: 24px;
  padding: 6px;
  border-radius: 8px;
  color: white;
}

.primary-contact .contact-type-icon {
  background: linear-gradient(135deg, #00594C, #007B6B);
}

.secondary-contact .contact-type-icon {
  background: linear-gradient(135deg, #32A19F, #4CB5B3);
}

.supervisor-contact .contact-type-icon {
  background: linear-gradient(135deg, #F6921E, #FFA94D);
}

.contact-type-label {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.required-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  background: linear-gradient(135deg, #ff4757, #ff6b81);
  color: white;
  border-radius: 10px;
  margin-left: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.contact-status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #28a745;
  box-shadow: 0 0 8px rgba(40, 167, 69, 0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* Contact Fields Grid */
.contact-fields-grid-mobile {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 768px) {
  .contact-fields-grid-mobile {
    grid-template-columns: repeat(2, 1fr);
  }
}

.contact-field-mobile {
  position: relative;
}

.contact-field-mobile.field-updated {
  background: linear-gradient(135deg, #fff8e1, #fff3cd);
  padding: 12px;
  border-radius: 12px;
  border-left: 4px solid #00594C;
}

/* Field Label Row */
.field-label-row-mobile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.field-label-mobile {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #444;
  margin: 0;
}

.field-label-icon {
  color: #00594C;
  font-size: 14px;
  width: 16px;
}

.update-indicator-mobile {
  display: flex;
  align-items: center;
  gap: 6px;
}

.update-dot {
  width: 8px;
  height: 8px;
  background: #00594C;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.update-text {
  font-size: 11px;
  font-weight: 600;
  color: #00594C;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Field Input Wrapper */
.field-input-wrapper-mobile {
  margin-bottom: 8px;
}

/* Input Group */
.input-group-mobile {
  position: relative;
}

.input-container-mobile {
  display: flex;
  align-items: center;
  gap: 8px;
}

.contact-input-mobile {
  flex: 1;
  padding: 12px 40px 12px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  color: #333;
  background: #f8f9fa;
  transition: all 0.3s ease;
  min-height: 44px;
}

.contact-input-mobile:focus {
  outline: none;
  border-color: #00594C;
  box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
  background: white;
}

.contact-input-mobile.input-update {
  background: #fff8e1;
  border-color: #ffd700;
}

.edit-email-btn-mobile {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #32A19F, #4CB5B3);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.edit-email-btn-mobile:hover {
  background: linear-gradient(135deg, #4CB5B3, #66C9C7);
  transform: scale(1.1);
}

/* Email Verification Section */
.email-verification-section-mobile {
  margin-top: 12px;
}

.verification-actions-mobile {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.send-otp-btn-mobile {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #00594C, #007B6B);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.send-otp-btn-mobile:hover:not(:disabled) {
  background: linear-gradient(135deg, #007B6B, #009380);
  transform: translateY(-2px);
}

.send-otp-btn-mobile:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.otp-verification-mobile {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.otp-input-group-mobile {
  display: flex;
  gap: 8px;
}

.otp-input-mobile {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  letter-spacing: 4px;
  background: #f8f9fa;
  transition: all 0.3s ease;
}

.otp-input-mobile:focus {
  outline: none;
  border-color: #00594C;
  box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
}

.verify-otp-btn-mobile {
  padding: 12px 20px;
  background: linear-gradient(135deg, #28a745, #34c759);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 100px;
}

.verify-otp-btn-mobile:hover:not(:disabled) {
  background: linear-gradient(135deg, #34c759, #40e267);
  transform: translateY(-2px);
}

.verify-otp-btn-mobile:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.resend-otp-btn-mobile {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: flex-start;
}

.resend-otp-btn-mobile:hover:not(:disabled) {
  background: #f8f9fa;
  color: #00594C;
  border-color: #00594C;
}

.resend-otp-btn-mobile:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.verified-badge-mobile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  color: #155724;
  font-size: 13px;
  font-weight: 600;
}

.verified-badge-mobile svg {
  color: #28a745;
}

/* Phone Input */
.phone-input-wrapper-mobile {
  position: relative;
}

.phone-input-mobile {
  width: 100%;
  padding: 12px 40px 12px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  background: #f8f9fa;
  transition: all 0.3s ease;
}

.phone-input-mobile:focus-within {
  border-color: #00594C;
  box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
  background: white;
}

.phone-input-mobile.input-update {
  background: #fff8e1;
  border-color: #ffd700;
}

.phone-input-icon-mobile {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  color: #00594C;
  font-size: 16px;
  pointer-events: none;
}

/* Previous Value */
.previous-value-mobile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 89, 76, 0.05);
  border-radius: 8px;
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

.previous-value-mobile svg {
  color: #00594C;
  font-size: 12px;
}

.previous-label {
  font-weight: 600;
  color: #444;
}

.previous-text {
  color: #333;
  font-weight: 500;
}

/* Error Message */
.error-message-mobile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid rgba(255, 71, 87, 0.2);
  border-radius: 8px;
  font-size: 12px;
  color: #ff4757;
  margin-top: 8px;
}

.error-message-mobile svg {
  font-size: 14px;
}

/* Email Edit Dialog Mobile */
.email-edit-dialog-mobile .MuiDialog-paper {
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
}

.dialog-header-mobile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 0 24px;
  background: linear-gradient(135deg, #00594C, #007B6B);
  color: white;
}

.dialog-header-mobile svg {
  font-size: 24px;
}

.dialog-header-mobile .MuiDialogTitle-root {
  color: white;
  padding: 0;
  margin: 0;
}

.dialog-fields-mobile {
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dialog-field-group-mobile {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dialog-label-mobile {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #444;
}

.dialog-label-mobile svg {
  color: #00594C;
}

.current-email-display-mobile {
  padding: 12px;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.new-email-input-mobile .MuiOutlinedInput-root {
  border-radius: 10px;
}

.new-email-input-mobile .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
  border-color: #00594C;
}

.new-email-input-mobile .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
  border-color: #00594C;
  border-width: 2px;
}

.dialog-actions-mobile {
  padding: 20px 24px;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn-mobile {
  color: #666;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px 20px;
  text-transform: none;
}

.cancel-btn-mobile:hover {
  background: #f8f9fa;
  border-color: #666;
}

.submit-btn-mobile {
  background: linear-gradient(135deg, #00594C, #007B6B);
  color: white;
  border-radius: 8px;
  padding: 10px 24px;
  text-transform: none;
  font-weight: 600;
}

.submit-btn-mobile:hover {
  background: linear-gradient(135deg, #007B6B, #009380);
  box-shadow: 0 4px 12px rgba(0, 89, 76, 0.3);
}

.submit-btn-mobile.Mui-disabled {
  background: #e0e0e0;
  color: #999;
}

/* Responsive */
@media (max-width: 480px) {
  .personal-details-section-mobile {
    padding: 16px;
  }
  
  .contact-card-mobile {
    padding: 16px;
  }
  
  .section-title-mobile {
    font-size: 18px;
  }
  
  .contact-type-label {
    font-size: 15px;
  }
  
  .contact-input-mobile,
  .phone-input-mobile {
    min-height: 42px;
    padding: 10px 36px 10px 10px;
  }
  
  .otp-input-group-mobile {
    flex-direction: column;
  }
  
  .verify-otp-btn-mobile {
    width: 100%;
  }
}
  `}</style>
</div>
  );
};

export default ContactSection;
