import React, { useState, useEffect } from "react";
import "../styles/components.css";
import "../i18n";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLanguage,
  faLocationDot,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import constants from "../constants";
import Constants from "../constants";
import axios from "axios";
import Swal from "sweetalert2";
import SearchableDropdown from "../components/SearchableDropdown";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function CustomersOnboarding() {
  const { id } = useParams();
  // console.log(id)
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [formData, setFormData] = useState({
    leadName: "",
    companyEmail: "",
    companyPhone: "",
    companyName: "",
    region: "",
    password: "",
    confirmpassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [regionOptions, setRegionOptions] = useState([]);
  const navigate = useNavigate();

  const [leadData, setLeadData] = useState(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerify, setIsOtpVerify] = useState(false);

  // Add loading states
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);

  const toggleLanguage = () => {
    const newLang = isRTL ? "en" : "ar";
    i18n.changeLanguage(newLang);
    document.body.dir = newLang === "ar" ? "rtl" : "ltr";
  };
  const fields = [
    // { type: 'empty' },
    {
      type: "text",
      name: "companyEmail",
      label: t("Email (Username)"),
      placeholder: t("Email (Username)"),
      required: true,
    },
    {
      type: "text",
      name: "otp",
      label: t("OTP"),
      placeholder: t("Enter OTP"),
      required: false,
    },
    { type: "empty", name: "empty" },

    {
      type: "text",
      name: "leadName",
      label: t("Customer Name"),
      placeholder: t("Customer Name"),
      required: true,
    },
    {
      type: "text",
      name: "companyPhone",
      label: t("Phone Number"),
      placeholder: t("Phone Number"),
      required: true,
    },
    {
      type: "text",
      name: "companyName",
      label: t("Company Name"),
      placeholder: t("Company Name"),
      required: true,
    },
    {
      type: "dropdown",
      name: "region",
      label: t("Region"),
      placeholder: t("Region"),
      required: true,
    },
    {
      type: "password",
      name: "password",
      label: t("Password"),
      placeholder: t("Password"),
      required: true,
    },
    {
      type: "password",
      name: "confirmpassword",
      label: t("Confirm Password"),
      placeholder: t("Confirm Password"),
      required: true,
    },
  ];

  useEffect(() => {
    if (id) {
      const fetchInvitationData = async () => {
        try {
          // const response = await axios.get(`/customer-registration-staging/onboarding/${id}`);
          // const res = await fetch('https://vmcoservertest-cyf3gyg4hpb9h7ek.southindia-01.azurewebsites.net/api/user/email-password', {
          const response = await fetch(
            `${API_BASE_URL}/auth/registration/getById/${id}`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
            }
          );
          // Check if response is JSON
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error(
              "Server did not return JSON. Check API endpoint and server logs."
            );
          }

          const result = await response.json();
          console.log(response);
          console.log(result);
          if (result?.data?.registered) {
            navigate("/login");
            return;
          }
          if (result.status === "Ok") {
            // setFormData(prev => ({
            //     ...prev,
            //     ...result.data
            // }));
            setFormData({
              leadName: result.data.leadName,
              companyEmail: result.data.companyEmail,
              companyPhone: result.data.companyPhone,
              companyName: result.data.companyName,
              region: result.data.region,
              companyName: result.data.companyName,
            });
            console.log("Fetched lead data:", result.data);
            setLeadData(result.data);

            if (result.data.registered) {
              setIsRegistered(true);
            }

            // setInvitationValid(true);
          }
          console.log(formData);
        } catch (error) {
          console.log("Error fetching invitation data:", error.message);
          console.error("Error fetching invitation data:", error);
          // setInvitationValid(false);
        } finally {
          // setIsLoading(false);
        }
      };

      fetchInvitationData();
    }
  }, [id]);
  const getManagerFromEmployees = async (region) => {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/random`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designation: "area sales manager",
          region: region,
        }),
        credentials: "include",
      });
      if (response.ok) {
        const result = await response.json();
        console.log("Manager Result", result.data);
        return result.data.employeeId;
      }
    } catch (err) {
      console.error("Error fetching manager:", err);
    }
  };
  const getOptionsFromBasicsMaster = async (fieldName) => {
    const params = new URLSearchParams({
      filters: JSON.stringify({ master_name: fieldName }), // Properly stringify the filter
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/basics-masters?${params.toString()}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json(); // Don't forget 'await' here

      const options = result.data
        .map((item) => item.value)
        .map((opt) => opt.charAt(0).toUpperCase() + opt.slice(1));

      return options;
    } catch (err) {
      console.error("Error fetching options:", err);
      return []; // Return empty array on error
    }
  };
  useEffect(() => {
    // Fetch region options on mount
    // getOptionsFromBasicsMaster("region").then(setRegionOptions);
    const fetchGeoData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/geoLocation`,
          {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    }
        );
        if (response.ok) {
          const data = await response.json();
          setGeoData(data.data);
          setRegionOptions(geoData ? Object.keys(geoData).map(region => ({
          value: region,
          name: region
          })) : [])
        }
      } catch (error) {
        console.error('Error fetching geo data:', error);
      }
    };
    fetchGeoData();
  }, []);

  const validateForm = async () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(00966|966|\+966|0)?5\d{8}$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    // Check all required fields are filled
    fields.forEach((field) => {
      if (field.required && !formData[field.name]?.trim()) {
        newErrors["password"] = t("Please fill out all required fields");
      }
    });

    // Only proceed with additional validation if fields are filled
    if (
      !newErrors.companyEmail &&
      formData.companyEmail &&
      !emailRegex.test(formData.companyEmail)
    ) {
      newErrors.companyEmail = t("Please enter a valid email address");
    }

    // --- Unique email check (refer customerDetails.js validateData) ---
    if (
      !newErrors.companyEmail &&
      formData.companyEmail &&
      emailRegex.test(formData.companyEmail)
    ) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/customer-contacts/uniqueField/checkUniqueField`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              field: "email",
              value: formData.companyEmail,
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (!data.data.isUnique) {
            newErrors.companyEmail = t("This email is already registered.");
          }
        }
      } catch (err) {
        // Optionally handle API error
      }
    }

    if (
      !newErrors.companyPhone &&
      formData.companyPhone &&
      !phoneRegex.test(formData.companyPhone)
    ) {
      newErrors.companyPhone = t("Please enter a valid phone number");
    }

    if (!newErrors.password && formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = t("Password must be at least 8 characters");
      } else if (!passwordRegex.test(formData.password)) {
        newErrors.password = t(
          "Password must contain at least one uppercase, one lowercase, one number and one special character"
        );
      }
    }

    if (
      !newErrors.confirmpassword &&
      formData.confirmpassword &&
      formData.password !== formData.confirmpassword
    ) {
      newErrors.confirmpassword = t("Passwords do not match");
    }

    setErrors(newErrors);
    let validForm = Object.keys(newErrors).length === 0;
    return validForm;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // If email is being changed, reset OTP verification states
    if (name === "companyEmail") {
      // Reset OTP states when email changes
      setIsOtpSent(false);
      setIsOtpVerify(false);
      // Also clear OTP field
      setFormData({
        ...formData,
        [name]: value,
        otp: "", // Clear OTP when email changes
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isOtpVerify) {
      // Swal.fire({
      //   title: t("Please verify the Email"),
      //     text: t("Please verify the email by clicking on the Verify Otp button."),
      //     icon: "warning",
      //     confirmButtonText: t("OK"),
      // });
      setErrors(
        t("Please verify the email by clicking on the Verify Otp button.")
      );
      return;
    }
    // Validate form only on submit
    let isValid = await validateForm();
    if (isValid) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/registration/user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.companyEmail,
            password: formData.password,
            userType: "customer",
            roles: ["customer_primary"],
          }),
          credentials: "include",
        });
        if (!response.ok) {
          const errorData = await response.json();
          console.log("Error during registration:", errorData);
          console.error("Error during registration:", errorData);
          setErrors({ companyEmail: errorData.details });
          isValid = false;
          setIsSubmitting(false);
        }
        const result = await response.json();
        console.log(result);
      } catch (error) {
        console.error("Error during registration:", error);
      }
    }

    if (isValid) {
      setIsSubmitting(true);
      const areaSalesManager =
        (await getManagerFromEmployees(formData?.region)) || "";
      if (!isRegistered) {
        const { password, confirmpassword, ...stagingData } = formData;

        try {
          console.log("Lead Data:", leadData);
          const response = await fetch(
            `${API_BASE_URL}/auth/registration/customer`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                companyNameEn: formData.companyName,
                region: formData.region,
                customerStatus: "new",
                pricingPolicy: {
                  [constants.ENTITY.VMCO]: "price A",
                  [constants.ENTITY.SHC]: "price A",
                  [constants.ENTITY.DAR]: "price A",
                  [constants.ENTITY.NAQI]: "price A",
                  [constants.ENTITY.GMTC]: "price A",
                },
                customerSource: leadData?.source || "portal",
                assignedTo: leadData?.employeeId,
                assignedToEntityWise: {
                  [constants.ENTITY.VMCO]: areaSalesManager,
                  [constants.ENTITY.SHC]: areaSalesManager,
                  [constants.ENTITY.DAR]: areaSalesManager,
                  [constants.ENTITY.NAQI]: areaSalesManager,
                  [constants.ENTITY.GMTC]: areaSalesManager,
                },
              }),
              credentials: "include",
            }
          );
          const result = await response.json();

          console.log(result);
          const contactTypesPrimary = ["primary"];
          const contactTypes = ["finance", "business", "purchasing"];

          contactTypesPrimary.forEach(async (type) => {
            const res = await fetch(`${API_BASE_URL}/auth/customer-contacts`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customerId: result.data.id,
                contactType: type,
                email: formData.companyEmail,
                name: formData.leadName,
                mobile: formData.companyPhone,
              }),
              credentials: "include",
            });
          });

          contactTypes.forEach(async (type) => {
            const res = await fetch(`${API_BASE_URL}/auth/customer-contacts`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customerId: result.data.id,
                contactType: type,
              }),
              credentials: "include",
            });
          });

          const res = await fetch(`${API_BASE_URL}/auth/payment-method`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerId: result.data.id,
              methodDetails: {
                prePayment: { isAllowed: true },
                COD: { isAllowed: true, limit: "5000" },
                credit: {
                  [constants.ENTITY.VMCO]: {
                    isAllowed: false,
                    limit: "0",
                    period: "0",
                  },
                  [constants.ENTITY.SHC]: {
                    isAllowed: false,
                    limit: "0",
                    period: "0",
                  },
                  [constants.ENTITY.DAR]: {
                    isAllowed: false,
                    limit: "0",
                    period: "0",
                  },
                  [constants.ENTITY.NAQI]: {
                    isAllowed: false,
                    limit: "0",
                    period: "0",
                  },
                  [constants.ENTITY.GMTC]: {
                    isAllowed: false,
                    limit: "0",
                    period: "0",
                  },
                },
                // partialPayment: { isAllowed: true }
              },
            }),
            credentials: "include",
          });
        } catch (error) {
          console.error("Error during registration:", error);
        }
        if (id) {
          try {
            // delete otp from staging data
            const { otp, ...registrationPayload } = stagingData;
            const response = await fetch(
              `${API_BASE_URL}/auth/registration/staging/id/${id}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...registrationPayload,
                  registered: true,
                }),
                credentials: "include",
              }
            );
            const result = await response.json();
            console.log(result);
            if (result.status === "Ok") {
              setIsRegistered(true);
            }
            navigate("/login");
          } catch (error) {
            console.error("Error during registration:", error);
          }
        } else {
          try {
            const response = await fetch(
              `${API_BASE_URL}/auth/registration/staging`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...stagingData,
                  registered: true,
                  source: "portal",
                }),
                credentials: "include",
              }
            );
            const result = await response.json();
            console.log(result);
            navigate("/login");
          } catch (error) {
            console.error("Error during registration:", error);
          }
        }
      }
    }
    if (isSubmitting) {
      try {
        console.log("Form submitted:", formData);
        // Reset form after successful submission
        setFormData({
          leadName: "",
          companyEmail: "",
          companyPhone: "",
          companyName: "",
          region: "",
          password: "",
          confirmpassword: "",
        });
        setErrors({});
        setIsSubmitting(false);
      } catch (error) {
        console.error("Submission error:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleOtp = async (type, email, otpType) => {
    // Email validation regex (same as in submit validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check if email is provided
    if (!email) {
      setErrors({ companyEmail: t("Email is required") });
      return;
    }

    // Check email format before sending OTP (same as in submit validation)
    if (!emailRegex.test(email)) {
      setErrors({ companyEmail: t("Please enter a valid email address") });
      return;
    }

    setIsOtpLoading(true); // Start loading

    const Reqbody = {};
    Reqbody.contact_type = type;
    Reqbody.contact_info = email;

    try {
      let path = "";
      if (otpType === "sendotp") {
        path = `${API_BASE_URL}/auth/registration/send-otp`;
      } else if (otpType === "resendotp") {
        path = `${API_BASE_URL}/auth/registration/resend-otp`;
      }

      const { data } = await axios.post(path, Reqbody);

      if (data?.status == "success") {
        setIsOtpSent(true);
        setErrors({});
      }
      if (data?.status == "verified") {
        setIsOtpVerify(true);
        setIsOtpSent(true);
        setErrors({});
      }

      Swal.fire({
        title: t(data.status),
        text: t(data.message),
        icon: data.status,
        confirmButtonText: t("OK"),
      });
    } catch (error) {
      console.error(
        "Error sending OTP:",
        error.response?.data || error?.message
      );
      Swal.fire({
        title: t(error.response?.data?.status || "Error"),
        text: t(
          error.response?.data?.message ||
            "An error occurred while sending OTP."
        ),
        icon: "error",
        confirmButtonText: t("OK"),
      });
    } finally {
      setIsOtpLoading(false); // Stop loading
    }
  };
  const handleVerifyOtp = async (type, email, otp) => {
    setIsVerifyLoading(true); // Start loading

    const Reqbody = {};
    Reqbody.contact_type = type;
    Reqbody.contact_info = email;
    Reqbody.otp = otp;

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/registration/verify-otp`,
        Reqbody
      );
      if (data?.status === "success") {
        setIsOtpVerify(true);
        setErrors({});
        Swal.fire({
          title: t(data.status),
          text: t(data.message),
          icon: data.status,
          confirmButtonText: t("OK"),
        });
      } else {
        // Show error if status is not success
        setErrors({ otp: t(data.message || "Invalid OTP") });
      }
    } catch (error) {
      // Show error if request fails or OTP is wrong
      setErrors({
        otp: t(
          error.response?.data?.message || "Invalid OTP. Please try again."
        ),
      });
      Swal.fire({
        title: t(error.response?.data?.status || "Error"),
        text: t(
          error.response?.data?.message ||
            "An error occurred while verifying OTP."
        ),
        icon: "error",
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
          {isRegistered && (
            <div className="registration-status-message">
              {t("This customer has already been registered.")}
            </div>
          )}
          <div className="onboarding-header">{t("Customer Onboarding")}</div>

          <form
            onSubmit={handleSubmit}
            className="onboarding-container"
            noValidate
          >
            {fields.map((field, index) => {
              if (field.name === "empty" && isOtpSent) return null;
              if (field.name === "otp" && !isOtpSent) return null;
              return (
                <div key={index} className="form-group">
                  {!(field.name === "otp" && isOtpVerify) && (
                    <label htmlFor={field.name}>
                      {field.label}
                      {field.required && (
                        <span className="required-field">*</span>
                      )}
                      {console.log("Field:", formData[field.name])}
                    </label>
                  )}

                  {field.type === "text" && (
                    <>
                      {field.name === "otp" && isOtpVerify ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            margin: "35px 0",
                          }}
                        >
                          <FontAwesomeIcon icon={faCheckCircle} color="green" />
                          <span style={{ color: "green", fontWeight: "bold" }}>
                            Email Verified
                          </span>
                        </div>
                      ) : (
                        <>
                          {" "}
                          <input
                            type="text"
                            id={field.name}
                            name={field.name}
                            placeholder={field.placeholder}
                            value={formData[field.name]}
                            onChange={handleChange}
                            className={errors[field.name] ? "error" : ""}
                            disabled={
                              isRegistered ||
                              (field.name === "companyEmail" &&
                                id &&
                                isOtpVerify) // Only disable if verified and has ID
                            }
                          />
                          {field.name === "companyEmail" &&
                            formData?.companyEmail &&
                            !isOtpVerify && (
                              <button
                                type="button"
                                style={{
                                  padding: "8px 12px",
                                  margin: "10px 0",
                                  backgroundColor: isOtpLoading
                                    ? "#ccc"
                                    : "#01594C",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: isOtpLoading
                                    ? "not-allowed"
                                    : "pointer",
                                  whiteSpace: "nowrap",
                                  width: "100px",
                                }}
                                onClick={() =>
                                  handleOtp(
                                    "email",
                                    formData?.companyEmail,
                                    !isOtpSent ? "sendotp" : "resendotp"
                                  )
                                }
                                disabled={isOtpLoading}
                              >
                                {isOtpLoading
                                  ? t("Sending...")
                                  : !isOtpSent
                                  ? t("Send Otp")
                                  : t("Resend Otp")}
                              </button>
                            )}
                          {field.name === "otp" && !isOtpVerify && (
                            <button
                              type="button"
                              style={{
                                padding: "8px 12px",
                                margin: "10px 0",
                                backgroundColor:
                                  isVerifyLoading || !formData?.otp
                                    ? "#ccc"
                                    : "#01594C",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor:
                                  isVerifyLoading || !formData?.otp
                                    ? "not-allowed"
                                    : "pointer",
                                whiteSpace: "nowrap",
                                width: "100px",
                              }}
                              onClick={() =>
                                handleVerifyOtp(
                                  "email",
                                  formData?.companyEmail,
                                  formData?.otp
                                )
                              }
                              disabled={isVerifyLoading || !formData?.otp}
                            >
                              {isVerifyLoading
                                ? t("Verifying...")
                                : t("Verify Otp")}
                            </button>
                          )}
                          {errors[field.name] && (
                            <span className="error-message">
                              {errors[field.name]}
                            </span>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {field.type === "password" && (
                    <>
                      <input
                        type="password"
                        id={field.name}
                        name={field.name}
                        placeholder={field.placeholder}
                        value={formData[field.name]}
                        onChange={handleChange}
                        className={errors[field.name] ? "error" : ""}
                        disabled={isRegistered}
                      />
                      {errors[field.name] && (
                        <span className="error-message">
                          {errors[field.name]}
                        </span>
                      )}
                    </>
                  )}
                  {field.type === "dropdown" && (
                    <>
                      {/* <select
                        id={field.name}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        className={errors[field.name] ? "error" : ""}
                        disabled={isRegistered}
                        required={field.required}
                      >
                        <option value="">{t("Select a region")}</option>
                        {regionOptions.map((option, idx) => (
                          <option key={idx} value={option}>
                            {t(option)}
                          </option>
                        ))}
                      </select> */}
                      
                      <SearchableDropdown
                            name={field.name}
                            // options={basicMasterLists?.region || []}
                            options={geoData ? Object.keys(geoData).map(region => ({
                            value: region,
                            name: region
                            })) : []}
                            value={formData[field.name]}
                            onChange={handleChange}
                            placeholder="Enter Region"
                            required
                          />
                          
                      {errors[field.name] && (
                        <span className="error-message">
                          {errors[field.name]}
                        </span>
                      )}
                    </>
                  )}
                  {field.type === "empty" && <></>}
                </div>
              );
            })}
          </form>
          <div className="onboarding-footer">
            <div className="onboarding-footer-text">
              <span>{t("Already have an account?")}</span>
              <a href="#" onClick={handleLogin}>
                {`\t ${t("Login")}`}
              </a>
            </div>
            <div>
              <button
                type="submit"
                className="login-button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                style={{
                  background: isSubmitting ? "#ccc" : "#01594C",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? t("Submitting...") : t("Submit")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomersOnboarding;
