import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import SearchableDropdown from "./SearchableDropdown";
import PhoneInput from "react-phone-number-input";
import Swal from "sweetalert2";
import api from "../utilities/api";
import "../styles/addInvites.css";
import { useNavigate } from "react-router-dom";

const AddInvites = () => {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const cookieToken = localStorage.getItem("token");
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();
  const [pageSize] = useState(10);
  const [inviteData, setInviteData] = useState({
    name: "",
    email: "",
    mobile: "",
    company: "",
    region: "",
    primaryBusinessUnit: "",
    source: "salesexecutive",
    comments: "",
  });
  const [geoData, setGeoData] = useState(null);
  const [regionOptions, setRegionOptions] = useState([]); 
  const [entityOptions, setEntityOptions] = useState([]);
  const [inviteErrors, setInviteErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredInvites, setFilteredInvites] = useState([]);
const getOptionsFromBasicsMaster = async (fieldName) => {
    const params = new URLSearchParams({
      filters: JSON.stringify({ master_name: fieldName }), // Properly stringify the filter
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/basics-masters?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json(); // Don't forget 'await' here

      const options = result.data.map((item) => item.value);
      return options;
    } catch (err) {
      console.error("Error fetching options:", err);
      return []; // Return empty array on error
    }
  };
  useEffect(() => {
      getOptionsFromBasicsMaster("entity").then(setEntityOptions);
      const fetchGeoData = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/geoLocation`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });
          if (response.ok) {
            const data = await response.json();
            setGeoData(data.data);
            setRegionOptions(
              geoData
                ? Object.keys(geoData).map((region) => ({
                  value: region,
                  name: region,
                }))
                : []
            );
          }
        } catch (error) {
          console.error("Error fetching geo data:", error);
        }
      };
      fetchGeoData();
    }, []);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInviteData((prev) => ({ ...prev, [name]: value }));
  };

//   const validate = () => {
//     const errors = {};
//     if (!inviteData.name) errors.name = t("Customer name is required");
//     if (!inviteData.email) errors.email = t("Email is required");
//     if (!inviteData.mobile) errors.mobile = t("Phone number is required");
//     if (!inviteData.company) errors.company = t("Company name is required");
//     if (!inviteData.region) errors.region = t("Region is required");
//     if (!inviteData.primaryBusinessUnit)
//       errors.primaryBusinessUnit = t("Primary business unit is required");

//     setInviteErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const handleInviteSubmit = async () => {
//     if (!validate()) return;

//     setIsSubmitting(true);
//     try {
//       const payload = { ...inviteData, userId: user?.id };

//       const { data } = await api.post(`/invite`, payload, {
//         headers: { Authorization: `Bearer ${cookieToken}` },
//       });

//       if (data?.status === "success") {
//         Swal.fire({
//           title: t("Success"),
//           text: t("Invite sent successfully"),
//           icon: "success",
//           confirmButtonText: t("OK"),
//         });
//         clearInviteFields();
//       }
//     } catch (error) {
//       Swal.fire({
//         title: t("Error"),
//         text: error?.response?.data?.message || t("Failed to send invite"),
//         icon: "error",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };
  const fetchInvites = async (
    page = 1,
    searchTerm = "",
    customFilters = {},
    sortedModel = []
  ) => {
    // setLoading(true);
    // setError(null);
    try {
      const params = new URLSearchParams({
        page,
        pageSize,
        search: searchTerm,
        // sortBy: "id",
        // sortOrder: "asc",
        // filters: "{}",
        sortBy: sortedModel[0]?.field || "id",
        sortOrder: sortedModel[0]?.sort || "asc",
        filters: JSON.stringify(customFilters),
      });

      const response = await fetch(
        `${API_BASE_URL}/customer-registration-staging/pagination?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      console.log("API Response:", result);
      if (result.status === "Ok") {
        setFilteredInvites(result.data.data);
        // setPagination(prev => ({
        //   ...prev,
        //   page,
        //   total: result.data.data.length
        // }));
        // setTotal(result.data.totalRecords);
      } else {
        console.log(response?.data?.message || "Failed to fetch invites");
      }
    } catch (err) {
    //   setError(err.message);
      console.error("Error fetching invites:", err);
    } finally {
    //   setLoading(false);
    }
  };
  const validateInviteData = (data) => {
      const errors = {};
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!data.email || !emailRegex.test(data.email)) {
        errors.email = t("Invalid email format");
      }
      // Saudi mobile validation (accepts 05XXXXXXXX or 9665XXXXXXXX)
      const saudiMobileRegex = /^\+?[1-9]\d{7,14}$/;
      if (!data.mobile || !saudiMobileRegex.test(data.mobile)) {
        errors.mobile = t("Invalid mobile number.");
      }
      // Name required
      if (!data.name) errors.name = t("This field is required.");
      // Company required
      if (!data.company) errors.company = t("This field is required.");
      // Region required
      if (!data.region) errors.region = t("This field is required.");
      return errors;
    };
  
    const handleInviteSubmit = async () => {
    //   setIsInviteLoading(true);
  
      // Validate fields
      const errors = validateInviteData(inviteData);
      setInviteErrors(errors);
      if (Object.keys(errors).length > 0) {
        // setIsInviteLoading(false);
        Swal.fire({
          title: "Error",
          text: t("Please fix the errors before sending invite."),
          icon: "error",
          confirmButtonText: "OK",
        });
        return;
      }
  
      // Check for duplicate email in filteredInvites (Registration table)
      const emailExists = filteredInvites.some(
        (invite) =>
          invite.companyEmail?.toLowerCase() ===
          inviteData.email.trim().toLowerCase()
      );
      if (emailExists) {
        Swal.fire({
          title: "Error",
          text: t("This email is already invited. Please use a different email."),
          icon: "error",
          confirmButtonText: "OK",
        });
        // setIsInviteLoading(false); // Stop loading
        return;
      }
  
      if (
        !inviteData.email ||
        !inviteData.name ||
        !inviteData.company ||
        !inviteData.mobile ||
        !inviteData.source ||
        !inviteData.region ||
        !inviteData.primaryBusinessUnit
      ) {
        Swal.fire({
          title: "Error",
          text: t("Please fill in all fields"),
          icon: "error",
          confirmButtonText: "OK",
        });
        // setIsInviteLoading(false); // Stop loading
        return;
      }
      // Add your API call to send the invite
      try {
        const response = await fetch(
          `${API_BASE_URL}/auth/registration/staging`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              companyEmail: inviteData.email,
              leadName: inviteData.name,
              companyName: inviteData.company,
              companyPhone: inviteData.mobile,
              region: inviteData.region,
              source: inviteData.source,
              employeeId: user?.employeeId,
              primaryBusinessUnit: inviteData?.primaryBusinessUnit,
              // submissionDate: new Date(),
              comments: inviteData.comments || "",
              registered: false,
            }),
          }
        );
        const result = await response.json();
        console.log(result);
        if (result.status === "Ok") {
          fetchInvites(); // Refresh the invites list
          try {
            const response = await fetch(
              `${API_BASE_URL}/generate-registration-link`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
  
                body: JSON.stringify({
                  id: result.lead.id,
                }),
              }
            );
            console.log("Response:", response);
            // if (response.status=="Ok") {
            const res = await response.json();
            console.log("Invite link:", res);
            // alert('Invite link: ' + res.data);
            try {
              const result = await fetch(`${API_BASE_URL}/send`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
  
                body: JSON.stringify({
                  eventName: "WELCOME_EMAIL",
                  emailData: {
                    to: inviteData.email,
                    customerName: inviteData.name,
                    lastName: "",
                    activationLink: res.data,
                  },
                }),
              });
            } catch (err) {
              console.error("Error generating invite link:", err);
              Swal.fire({
                title: "Error",
                text: "Failed to generate invite link. Please try again later.",
                icon: "error",
                confirmButtonText: "OK",
                confirmButtonColor: "#dc3545",
              });
              return;
            }
               Swal.fire({
              title: t("Invite Link Sent"),
              html: `
                <p>${t("The invite has been sent successfully.")}</p>
             <div style="display:flex;align-items:center;border:1px solid #ddd;border-radius:4px;overflow:hidden;">
                  <input
                    id="invite-link"
                    type="text"
                    value="${res?.data}"
                    readonly
                    style="flex:1;border:none;padding:10px 12px;font-size:14px;outline:none;"
                  />
                  <button
                    id="copyInviteBtn"
                    style="display:flex;align-items:center;gap:6px;padding:0 12px;height:44px;border:none;border-left:1px solid #ddd;background:#fff;cursor:pointer;transition:all .2s;white-space:nowrap;"
                    title="Copy to clipboard"
                  >
                    <i class="fas fa-copy" style="font-size:14px;color:#666;"></i>
                    <span id="copyInviteText" style="font-size:14px;color:#666;">Copy</span>
                  </button>
                </div>
                  
              `,
              icon: "success",
              showConfirmButton: true,
              confirmButtonText: t("OK"),
            
              didOpen: () => {
                const input = document.getElementById("invite-link");
                const copyBtn = document.getElementById("copyInviteBtn");
                const copyIcon = copyBtn.querySelector("i");
                const copyText = document.getElementById("copyInviteText");
            
                /* Hover effect */
                copyBtn.addEventListener("mouseenter", () => {
                  copyBtn.style.background = "#f5f5f5";
                  copyIcon.style.color = "#333";
                  copyText.style.color = "#333";
                });
            
                copyBtn.addEventListener("mouseleave", () => {
                  copyBtn.style.background = "#fff";
                  copyIcon.style.color = "#666";
                  copyText.style.color = "#666";
                });
            
                /* Copy action */
                copyBtn.addEventListener("click", async () => {
                  input.select();
                  input.setSelectionRange(0, 99999);
            
                  try {
                    await navigator.clipboard.writeText(input.value);
            
                    // success state
                    copyIcon.className = "fas fa-check";
                    copyIcon.style.color = "#28a745";
                    copyText.textContent = t("Copied!");
                    copyText.style.color = "#28a745";
                    copyBtn.style.background = "#e8f5e9";
                    copyBtn.style.borderLeftColor = "#c3e6cb";
            
                    setTimeout(() => {
                      copyIcon.className = "fas fa-copy";
                      copyIcon.style.color = "#666";
                      copyText.textContent = t("Copy");
                      copyText.style.color = "#666";
                      copyBtn.style.background = "#fff";
                      copyBtn.style.borderLeftColor = "#ddd";
                    }, 2000);
                  } catch {
                    // error state
                    copyIcon.className = "fas fa-times";
                    copyIcon.style.color = "#dc3545";
                    copyText.textContent = t("Failed!");
                    copyText.style.color = "#dc3545";
                    copyBtn.style.background = "#f8d7da";
                    copyBtn.style.borderLeftColor = "#f5c6cb";
            
                    setTimeout(() => {
                      copyIcon.className = "fas fa-copy";
                      copyIcon.style.color = "#666";
                      copyText.textContent = t("Copy");
                      copyText.style.color = "#666";
                      copyBtn.style.background = "#fff";
                      copyBtn.style.borderLeftColor = "#ddd";
                    }, 2000);
                  }
                });
              },
            });
  
            // }
          } catch (err) {
            // console.error('Error resending invite:', err);
            console.log("Error sending invite:", err.message);
            Swal.fire({
              title: "Error",
              text: t("Failed to send invite. Please try again later."),
              icon: "error",
              confirmButtonText: "OK",
            });
            // alert('Failed to send invite. Please try again later.');
            return;
          }
        }
      } catch (err) {
        console.error("Error during registration:", err);
      }
    //   setIsInviteLoading(false); // Stop loading after process
      clearInviteFields();
    //   setIsInviteModalOpen(false);
    };

  const clearInviteFields = () => {
    setInviteData({
      name: "",
      email: "",
      mobile: "",
      company: "",
      region: "",
      primaryBusinessUnit: "",
      source: "salesexecutive",
      comments: "",
    });
    setInviteErrors({});
    navigate("/customers", { state: { activeTab: "invites" } });
  };

  return (
    <Sidebar title={t("Invites")}>
      <div className="invite-form-container">
        <h2>{t("Invite")}</h2>

        <div className="invite-grid">
          <div className="form-group">
            <label>{t("Customer Name")} *</label>
            <input
              type="text"
              name="name"
              value={inviteData.name}
              onChange={handleInputChange}
            />
            {inviteErrors.name && <p className="error">{inviteErrors.name}</p>}
          </div>

          <div className="form-group">
            <label>{t("Email")} *</label>
            <input
              type="email"
              name="email"
              value={inviteData.email}
              onChange={handleInputChange}
              style={inviteErrors.email ? { borderColor: "red" } : {}}
            />
            {inviteErrors.email && <p className="error">{inviteErrors.email}</p>}
          </div>

          <div className="form-group">
            <label>{t("Company Name")} *</label>
            <input
              type="text"
              name="company"
              value={inviteData.company}
              onChange={handleInputChange}
            />
            {inviteErrors.company && (
              <p className="error">{inviteErrors.company}</p>
            )}
          </div>

          <div className="form-group">
            <label>{t("Phone Number")} *</label>
            <PhoneInput
              international
              defaultCountry="SA"
              withCountryCallingCode
              countryCallingCodeEditable={false}
              name="mobile"
              value={inviteData.mobile}
              onChange={(value) =>
                handleInputChange({ target: { name: "mobile", value } })
              }
              className={inviteErrors.mobile ? "phone-input-error" : ""}
            />
            {inviteErrors.mobile && <p className="error">{inviteErrors.mobile}</p>}
          </div>

          <div className="form-group">
            <label>{t("Region")} *</label>
            <SearchableDropdown
              name="region"
              options={
                geoData
                  ? Object.keys(geoData).map((region) => ({
                      value: region,
                      name: region,
                    }))
                  : []
              }
              value={inviteData.region}
              onChange={handleInputChange}
              className={"mobile-select-branch location-select"}
              required
            />
            {inviteErrors.region && <p className="error">{inviteErrors.region}</p>}
          </div>

          <div className="form-group">
            <label>{t("Primary Business Unit")} *</label>
            <SearchableDropdown
              name="primaryBusinessUnit"
              options={entityOptions}
              value={inviteData.primaryBusinessUnit}
              onChange={handleInputChange}
              className={"mobile-select-branch location-select"}
              required
            />
            {inviteErrors.primaryBusinessUnit && (
              <p className="error">{inviteErrors.primaryBusinessUnit}</p>
            )}
          </div>

          <div className="form-group">
            <label>{t("Source")} *</label>
            <select
              name="source"
              value={inviteData.source}
              onChange={handleInputChange}
              disabled
            >
              <option value="portal">{t("Portal")}</option>
              <option value="crm">{t("CRM")}</option>
              <option value="salesexecutive">{t("Sales Executive")}</option>
            </select>
          </div>

          <div className="form-group full-width">
            <label>{t("Comments")}</label>
            <textarea
              name="comments"
              value={inviteData.comments}
              onChange={handleInputChange}
              placeholder={t("Comments...")}
            />
          </div>
        </div>

        <div className="action-buttons">
          <button
            className="cancel-btn"
            onClick={clearInviteFields}
            disabled={isSubmitting}
          >
            {isSubmitting ? t("Please wait...") : t("Cancel")}
          </button>
          <button
            className="submit-btn"
            onClick={handleInviteSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? t("Sending...") : t("Send Invite")}
          </button>
        </div>
      </div>
    </Sidebar>
  );
};

export default AddInvites;
