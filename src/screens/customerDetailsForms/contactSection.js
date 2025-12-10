import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/forms.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import axios from "axios";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import EditIcon from "@mui/icons-material/Edit";
import { useAuth } from "../../context/AuthContext";
import RbacManager from "../../utilities/rbac";
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
      isRequired: true,
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
    <div className="form-section">
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
    </div>
  );
};

export default ContactSection;
