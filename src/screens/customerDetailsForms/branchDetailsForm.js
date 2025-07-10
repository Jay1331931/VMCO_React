import React, { useEffect, useState, useRef, use } from "react";
import { useTranslation } from "react-i18next";
import BranchDetailsSection from "./branchDetailsSection";
import ContactSection from "./contactSection";
import OperatingHours from "./operatingHours";
import ApprovalDialog from "../../components/ApprovalDialog";
import "../../styles/forms.css";
import "../../styles/components.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const BranchDetailsForm = ({
  branchId, // required
  branch,
  customer, // required
  branchChanges,
  handleBranchFieldChange,
  isApprovalMode,
  mode,
  setExpandedRows,
  isFirstBranch,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [branchDetails, setBranchDetails] = useState({...branch});
  const [originalBranchDetails, setOriginalBranchDetails] = useState({});
  const [branchContacts, setBranchContacts] = useState([]);
  const [originalBranchContacts, setOriginalBranchContacts] = useState([]);
  const [hoursDetails, setHoursDetails] = useState({});
  const [originalHoursData, setOriginalHoursData] = useState({});
  const [workflowData, setWorkflowData] = useState({});
  // const [isApprovalMode, setIsApprovalMode] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const weekdays = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  var updatedBranchData = useRef({});
  var updatedBranchContactsData = useRef({});
  const fetchBranchDetails = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/customer-branches/id/${branchId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch branches");
      }

      const data = await response.json();
      //   setBranchDetails(data);
      return data;
    } catch (err) {
      console.log(err);
    }
  };

  const fetchBranchContacts = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/customer-contacts/branch/${branchId}/customer/${customer?.id}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      const result = await response.json();

      if (result.status === "Ok") {
        // setBranchContacts(result.data);
        return result.data;
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
    }
  };
  const fetchWorkflowDataOfBranch = async (workflowId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/workflow-instance/id/${workflowId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
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
  const checkIfBranchIsInApproval = async (branchId) => {
    console.log("Branch Id", branchId);
    console.log("check approval called");
    let isAppMode = false;

    try {
      const res = await fetch(`${API_BASE_URL}/workflow-instance/check/id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: branchId,
          module: "branch",
        }),
        credentials: "include",
      });

      console.log("!!!!!!!", res);

      if (res.ok) {
        const responseText = await res.text(); // Get raw response text ('t' or 'f')
        console.log("^^^^^^^", responseText);

        try {
          // Try to parse as JSON first
          const data = responseText ? JSON.parse(responseText) : {};
          console.log("Parsed data:", data);
          isAppMode = data?.exists === "t"; // Convert to boolean
          console.log("is approval mode", isAppMode);
          console.log(
            `Workflow check result for branch ${branchId}:`,
            isAppMode
          );
          return isAppMode;
        } catch (parseError) {
          // If not valid JSON, check if it's a direct 't' or 'f' string
          console.error("Error parsing response as JSON:", parseError);
          isAppMode = responseText.trim() === "t";
          console.log(
            "Using direct string match, is approval mode:",
            isAppMode
          );
          return isAppMode;
        }
      } else {
        console.log(`Workflow check failed`, res.status);
        return false;
      }
    } catch (err) {
      console.error("Error fetching workflow instance:", err);
      return false;
    }

    // Fallback return - shouldn't reach here, but added for safety
    return false;
  };

  // Helper function to parse time range strings
  const parseTimeRange = (timeRange) => {
    if (!timeRange) return { from: "09:00", to: "18:00" };
    const [from, to] = timeRange.split("-");
    return { from: from || "09:00", to: to || "18:00" };
  };
  // Helper function to stringify hours for storage
  const stringifyHours = (hoursData) => {
    const result = {
      operatingHours: {},
      deliveryHours: {},
    };

    weekdays.forEach((day) => {
      result.operatingHours[
        day
      ] = `${hoursData[day].operating.from}-${hoursData[day].operating.to}`;
      result.deliveryHours[
        day
      ] = `${hoursData[day].delivery.from}-${hoursData[day].delivery.to}`;
    });

    return JSON.stringify(result);
  };

  const getDefaultTimeSlotsInStringHours = () => {
    return weekdays.reduce((acc, day) => {
      acc[day] = {
        operating: { from: "09:00", to: "18:00" },
        delivery: { from: "09:00", to: "18:00" },
      };
      return acc;
    }, {});
  };

  const getBranchTimeSlotsInStringHours = (hoursData) => {
    console.log("#### Enter");
    try {
      if (hoursData !== null && hoursData !== undefined) {
        const parsedData =
          typeof hoursData === "string" ? JSON.parse(hoursData) : hoursData;
        let convertedData = {};
        weekdays.forEach((day) => {
          convertedData[day] = {
            operating: parseTimeRange(parsedData.operatingHours?.[day]),
            delivery: parseTimeRange(parsedData.deliveryHours?.[day]),
          };
        });
        console.log("#### Exit" + JSON.stringify(convertedData));
        return convertedData;
      }
      return getDefaultTimeSlotsInStringHours();
    } catch (e) {
      console.error("Error parsing hours data:", e);
    }
  };

  const handleHoursChange = (day, type, field, value) => {
    // const {day, type, field, value} = e.target;
    const updatedHours = {
      ...hoursDetails,
      [day]: {
        ...hoursDetails[day],
        [type]: {
          ...hoursDetails[day][type],
          [field]: value,
        },
      },
    };

    setHoursDetails(updatedHours);
    updatedBranchData.current.hours = stringifyHours(updatedHours);
    // setModifiedDays((prev) => ({ ...prev, [day]: true }));
    // handleBranchFieldChange(branchId, "hours", stringifyHours(updatedHours));
  };

  const applyAllHours = (sourceDay, type) => {
    const timeToApply = hoursDetails[sourceDay][type];
    const updatedHours = {
      ...hoursDetails,
      ...weekdays.reduce(
        (acc, day) => ({
          ...acc,
          [day]: {
            ...hoursDetails[day],
            [type]: timeToApply,
          },
        }),
        {}
      ),
    };

    setHoursDetails(updatedHours);
    updatedBranchData.current.hours = stringifyHours(updatedHours);
    // setModifiedDays({});
    // handleBranchFieldChange(branchId, "hours", stringifyHours(updatedHours));
  };
  const handleDeliveryChargesChange = (e) => {
    const { name } = e.target;
    const value = e.target.checked;
    updatedBranchData.current["isDeliveryChargesApplicable"] = value;
    setBranchDetails((prev) => ({
      ...prev,
      isDeliveryChargesApplicable: value,
    }));
  };

  const setSameAsCustomer = (e) => {
    updatedBranchData.current.street = customer?.street || "";
    updatedBranchData.current.buildingName = customer?.buildingName || "";
    updatedBranchData.current.city = customer?.city || "";
    updatedBranchData.current.region = customer?.region || "";
    updatedBranchData.current.locationType = customer?.locationType || "";
    updatedBranchData.current.geolocation = customer?.geolocation || "";
    updatedBranchContactsData.current.primaryContactName = customer?.primaryContactName || "";
    updatedBranchContactsData.current.primaryContactDesignation =
      customer?.primaryContactDesignation || "";
    updatedBranchContactsData.current.primaryContactEmail =
      customer?.primaryContactEmail || "";
    updatedBranchContactsData.current.primaryContactMobile =
      customer?.primaryContactMobile || "";
    updatedBranchContactsData.current.secondaryContactName =
      customer?.businessHeadName || "";
    updatedBranchContactsData.current.secondaryContactDesignation =
      customer?.businessHeadDesignation || "";
    updatedBranchContactsData.current.secondaryContactEmail =
      customer?.businessHeadEmail || "";
    updatedBranchContactsData.current.secondaryContactMobile =
      customer?.businessHeadMobile || "";
    setBranchDetails((prev) => ({
      ...prev,
      street: customer?.street || "",
      buildingName: customer?.buildingName || "",
      city: customer?.city || "",
      region: customer?.region || "",
      geolocation: customer?.geolocation || "",
    }));
    setBranchContacts((prev) => ({
      ...prev,
      primaryContactName: customer?.primaryContactName || "",
      primaryContactDesignation: customer?.primaryContactDesignation || "",
      primaryContactEmail: customer?.primaryContactEmail || "",
      primaryContactMobile: customer?.primaryContactMobile || "",
      secondaryContactName: customer?.businessHeadName || "",
      secondaryContactDesignation: customer?.businessHeadDesignation || "",
      secondaryContactEmail: customer?.businessHeadEmail || "",
      secondaryContactMobile: customer?.businessHeadMobile || "",
    }));
  };
  useEffect(() => {
    const fetchData = async () => {
      // if (branchId > 0) {
      // Existing code for fetching data for existing branches
      const branchData = await fetchBranchDetails() || branch;
      const hoursData = getBranchTimeSlotsInStringHours(
        branchData?.hours || {}
      );
      const contactsData = await fetchBranchContacts();
      const isAppMode = await checkIfBranchIsInApproval(branchId);
      var temp;
      if (isAppMode && customer?.workflowInstanceId) {
        const wfData = await fetchWorkflowDataOfBranch(
          customer?.workflowInstanceId
        );
        setWorkflowData(wfData);
        temp = { ...branchData, ...wfData };
        // setIsApprovalMode(isAppMode);
      }

      setBranchDetails(
        isAppMode && temp && Object.keys(temp?.branch).length > 0
          ? { ...branchData, ...temp?.branch }
          : branchData
      );
      setOriginalBranchDetails(branchData);
      setBranchContacts(
        isAppMode && temp && Object.keys(temp?.contacts).length > 0
          ? { ...contactsData, ...temp?.contacts }
          : contactsData
      );
      setOriginalBranchContacts(contactsData);
      setHoursDetails(
        temp && temp?.branch?.hours
          ? getBranchTimeSlotsInStringHours(temp?.branch?.hours)
          : hoursData
      );
      setOriginalHoursData(hoursData);
      // } else if (branchId < 0) {
      //   // For new branches (negative IDs), use the branch prop directly
      //   console.log("Initializing new branch with ID:", branchId);
      //   setBranchDetails(branch || {});
      //   setOriginalBranchDetails({});
      //   setBranchContacts([]);
      //   setOriginalBranchContacts([]);
      //   setHoursDetails({});
      //   setIsApprovalMode(false);

      //   // Initialize updatedBranchData with basic branch info
      //   updatedBranchData.current = {
      //     ...branch,
      //     branchNameEn: branch?.branchNameEn || "",
      //     branch_name_en: branch?.branch_name_en || "",
      //     customerId: customer?.id,
      //     customer_id: customer?.id
      //   };
      // }
    };
    fetchData();
  }, [branchId, branch, customer]); // Add dependencies to re-run effect when they change
  const handleBranchDataChange = (e) => {
    const { name, value } = e.target;
    console.log("#####handleBranchDataChange called", branchDetails);
    updatedBranchData.current[name] = value;
    setBranchDetails((prev) => ({ ...prev, [name]: value }));
    console.log("#####handleBranchDataChange called", e.target);
  };
  const setGeoLocation = (location) => {
    updatedBranchData.current.geolocation = location;
    setBranchDetails((prev) => ({ ...prev, geolocation: location }));
    console.log("^^^^^^^^", branchDetails);
  };

  const handleBranchContactsDataChange = (e) => {
    console.log("#####handleBranchContactsDataChange called", e.target);
    const { name, value } = e.target;
    console.log("#####handleBranchContactsDataChange name, value", name, value);
    updatedBranchContactsData.current[name] = value;
    setBranchContacts((prev) => ({ ...prev, [name]: value }));
  };

  const mandatoryFields = [
    "branchNameEn",
    "branchNameLc",
    "buildingName",
    "street",
    "city",
    "locationType",
    "region",
    "geolocation",
    "primaryContactName",
    "primaryContactDesignation",
    "primaryContactEmail",
    "primaryContactMobile",
    "secondaryContactName",
    "secondaryContactDesignation",
    "secondaryContactEmail",
    "secondaryContactMobile",
    // "supervisorContactName",
    // "supervisorContactDesignation",
    // "supervisorContactEmail",
    // "supervisorContactMobile",
  ];
  const mandatoryFieldsForApproval = [
    "branchNameEn",
    "branchNameLc",
    "buildingName",
    "street",
    "city",
    "locationType",
    "region",
    "geolocation",
    "primaryContactName",
    "primaryContactDesignation",
    "primaryContactEmail",
    "primaryContactMobile",
    "secondaryContactName",
    "secondaryContactDesignation",
    "secondaryContactEmail",
    "secondaryContactMobile",
    "branch",
    // "supervisorContactName",
    // "supervisorContactDesignation",
    // "supervisorContactEmail",
    // "supervisorContactMobile",
  ];
  const isArabicText = (text) => {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
  };
  const validateData = async (
    dataToValidate,
    mandatoryCheckRequired = false,
    mandatoryFields = mandatoryFields
  ) => {
    const errors = {};
    const arabicList = ["branchNameLc"];

    // If mandatoryCheckReguired is true, check all mandatory fields

    if (mandatoryCheckRequired) {
      mandatoryFields.forEach((field) => {
        if (field in dataToValidate && !dataToValidate[field]) {
          errors[field] = t("This field is required");
        }
      });
    }
    for (const field in dataToValidate) {
      const value = dataToValidate[field];
      if (arabicList.includes(field) && value && !isArabicText(value)) {
        errors[field] = t("Please enter Arabic text.");
      }

      if (field.toLowerCase().includes("email")) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          errors[field] = t("Invalid email format");
        }
      }

      if (
        field.toLowerCase().includes("mobile") ||
        field.toLowerCase().includes("phone")
      ) {
        const saudiMobileRegex = /^(00966|966|\+966|0)?5\d{8}$/;
        if (value && !saudiMobileRegex.test(value)) {
          errors[field] = t("Invalid mobile number format");
        }
      }
    }
    return errors;
  };

  const handleSubmit = async (id) => {
    handleSave(id);

    const errors = await validateData(
      { ...branchDetails, ...branchContacts },
      true,
      mandatoryFields
    );
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      // Handle errors (e.g., show error messages)
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/customer-branches/id/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branch: {
              branchStatus: "pending",
              customerId: customer?.id,
            },
            contacts: {},
          }),
          credentials: "include",
        }
      );

      const result = await response.json();
      function showLoadingScreen(message) {
        document.body.innerHTML = `
    <div class="loading-more-container" style="
      padding: 20px; 
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 16px;
    ">
      <div class="loading-spinner" style="
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
      <div class="loading-more-text">${message}</div>
    </div>
    
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
      }

      // Usage:
      showLoadingScreen("Updating...");
      setTimeout(() => window.location.reload(true), 3000);
    } catch (error) {
      console.error("Error saving branch:", error);
    }

    // Create user if primary contact email exists with default password
    const primaryContactEmail = branchContacts.primaryContactEmail;
    if (primaryContactEmail) {
      const userPayload = {
        email: primaryContactEmail,
        password: "Pass@123",
        userType: "customer",
        roles: ["branch_primary"],
      };

      try {
        const userResponse = await fetch(
          `${API_BASE_URL}/auth/registration/user`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userPayload),
            credentials: "include",
          }
        );

        if (!userResponse.ok) {
          throw new Error("Failed to create user");
        }

        const userResult = await userResponse.json();
        console.log("User created:", userResult);
      } catch (error) {
        console.error("Error creating user:", error);
      }
    }
  };

  const handleSave = async (id) => {
    const isNewBranch = id < 0; // Negative IDs are temporary
    const errors = await validateData(
      { ...updatedBranchData.current, ...updatedBranchContactsData.current },
      false,
      []
    );
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      // Handle errors (e.g., show error messages)
      return;
    }
    if (isNewBranch) {
      try {
        const response = await fetch(`${API_BASE_URL}/customer-branches`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...updatedBranchData.current,
            customer_id: customer?.id, // Set initial status to 'new'
            isDeliveryChargesApplicable: customer?.isDeliveryChargesApplicable,
          }),
          credentials: "include",
        });

        const result = await response.json();

        if (response.ok) {
          console.log(
            "$$$$ updatedBranchContactsData:",
            updatedBranchContactsData.current
          );
          try {
            const res = await fetch(
              `${API_BASE_URL}/customer-contacts/create/customer/${customer.id}/branch/${result.data.id}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...updatedBranchContactsData.current,
                  customer_id: customer.id,
                  branch_id: result.data.id,
                }),
                credentials: "include",
              }
            );
            if (res.ok) {
              const contactResult = await res.json();
              Swal.fire({
                          icon: "success",
                          title: t("Success"),
                          text: t(
                            "Branch saved successfully."
                          ),
                          confirmButtonText: t("OK"),
                        });
              // alert(
              //   "Branch saved successfully"
              // );
            }
          } catch (error) {
            console.error("Error saving contacts for new branch:", error);
          }
        }
      } catch (error) {
        console.error("Error creating new branch:", error);
      }
    } else {
      // UPDATE existing branch
      // console.log("branchPayload:", branchPayload);
      try {
        // if (Object.keys(branchPayload).length > 0) {
        const response = await fetch(
          `${API_BASE_URL}/customer-branches/id/${id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              branch: {
                ...updatedBranchData.current,
                customerId: customer.id,
                branchStatus: branchDetails?.branchStatus,
              },
              contacts: {},
            }),
            credentials: "include",
          }
        );
      } catch (error) {
        console.error("Error updating branch:", error);
      }
      // console.log("Contact payload:", contactPayload);
      // if (Object.keys(contactPayload).length > 0) {
      console.log(
        "$$$$ updatedBranchContactsData:",
        updatedBranchContactsData.current
      );
      try {
        const response = await fetch(
          `${API_BASE_URL}/customer-contacts/customer/${customer.id}/branch/${id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...updatedBranchContactsData.current }),
            credentials: "include",
          }
        );
      } catch (error) {
        console.error("Error saving contacts for updated branch:", error);
      }
      Swal.fire({
                  icon: "success",
                  title: t("Success"),
                  text: t(
                    "Branch saved successfully."
                  ),
                  confirmButtonText: t("OK"),
                });
      //  alert("Branch saved successfully.");
    }
   
  };
  const handleSaveChanges = async (id) => {
    const errors = await validateData(
      { ...branchDetails, ...branchContacts },
      true,
      mandatoryFields
    );
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      // Handle errors (e.g., show error messages)
      return;
    }
    try {
      // if (Object.keys(branchPayload).length > 0) {
      const response = await fetch(
        `${API_BASE_URL}/customer-branches/id/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branch: {
              ...updatedBranchData.current,
              customerId: customer.id,
              branchStatus: branchDetails?.branchStatus,
            },
            contacts: {
              ...updatedBranchContactsData.current,
            },
          }),
          credentials: "include",
        }
      );
      if (response.ok) {
        const result = await response.json();
        Swal.fire({
                    icon: "success",
                    title: t("Success"),
                    text: t(
                      "Branch updated successfully."
                    ),
                    confirmButtonText: t("OK"),
                  });
        // alert("Branch updated successfully.");
        // setExpandedRows((prev) => ({
        //   ...prev,
        //   [id]: false, // Collapse the row after saving
        // }));
        setExpandedRows([])
      }

    } catch (error) {
      console.error("Error updating branch:", error);
    }
  };

  const handleBlock = async (id) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/customer-branches/id/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branch: {
              branchStatus: "blocked",
              customerId: customer?.id,
              isBlocked: true,
            },
          }),
          credentials: "include",
        }
      );
      if (response.ok) {
        const result = await response.json();
        Swal.fire({
                    icon: "success",
                    title: t("Success"),
                    text: t(
                      "Branch blocked successfully."
                    ),
                    confirmButtonText: t("OK"),
                  });
        // alert("Branch blocked successfully.");
        setExpandedRows([]);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error blocking branch:", error);
    }
  };

  const handleUnblock = async (id) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/customer-branches/id/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branch: {
              branchStatus: "approved",
              customerId: customer?.id,
              isBlocked: false,
            },
          }),
          credentials: "include",
        }
      );
      if (response.ok) {
        const result = await response.json();
        Swal.fire({
                    icon: "success",
                    title: t("Success"),
                    text: t(
                      "Branch unblocked successfully."
                    ),
                    confirmButtonText: t("OK"),
                  });
        // alert("Branch unblocked successfully.");
        setExpandedRows([]);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error unblocking branch:", error);
    }
  };

  const handleApprove = async () => {
    const mergedData = {
      updates: {
        branch: { ...workflowData.branch, ...updatedBranchData.current },
        contacts: {
          ...workflowData.contacts,
          ...updatedBranchContactsData.current,
        },
      },
      id: branchId,
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/workflow-instance/id/${customer?.workflowInstanceId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approvedStatus: "approved",
            comment: "comment",
            workflowData: mergedData,
          }),
          credentials: "include",
        }
      );

      // if (response.ok) {
      //   const result = await response.json();
      //   navigate("/customers");
      // } else {
      //   throw new Error("Failed to submit approval");
      // }
    } catch (error) {
      console.log("Error", error.message);
    }
  };
  const handleReject = async () => {
    const mergedData = {
      updates: {
        branch: { ...workflowData.branch, ...updatedBranchData.current },
        contacts: {
          ...workflowData.contacts,
          ...updatedBranchContactsData.current,
        },
      },
      id: branchId,
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/workflow-instance/id/${customer?.workflowInstanceId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approvedStatus: "rejected",
            comment: "comment",
            workflowData: mergedData,
          }),
          credentials: "include",
        }
      );

      // if (response.ok) {
      //   const result = await response.json();
      //   navigate("/customers");
      // } else {
      //   throw new Error("Failed to submit approval");
      // }
    } catch (error) {
      console.log("Error", error.message);
    }
  };

  // Open dialog with action
  const handleApprovalClick = (action) => {
    setApprovalAction(action);
    setIsApprovalDialogOpen(true);
  };

  // Approval dialog submit handler
  const handleApprovalDialogSubmit = async (comment) => {
    const mergedData = {
      updates: {
        branch: { ...workflowData.branch, ...updatedBranchData.current },
        contacts: {
          ...workflowData.contacts,
          ...updatedBranchContactsData.current,
        },
      },
      id: branchId,
    };
var dataToBeValidated = {};
      if(branch?.branchStatus === "pending") {
        dataToBeValidated = {...branch, ...branchContacts, ...hoursDetails, ...updatedBranchData.current, ...updatedBranchContactsData.current, ...mergedData?.updates?.branch, ...mergedData?.updates?.contacts};
      }
      else {
        dataToBeValidated = {
          ...mergedData?.updates?.branch,
          ...mergedData?.updates?.contacts,
        };
      }
      console.log("Data to be validated:", dataToBeValidated);
      const errors = await validateData(
        dataToBeValidated,
        true,
        mandatoryFieldsForApproval
      );
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) {
        Swal.fire({
          icon: "error",
          title: t("Error"),
          text: t("Please fix the errors before saving."),
          confirmButtonText: t("OK"),
        });
        // alert("Please fix the errors before saving.");
        return;
      }
    try {
      const response = await fetch(
        `${API_BASE_URL}/workflow-instance/id/${customer?.workflowInstanceId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approvedStatus:
              approvalAction === "approve" ? "approved" : "rejected",
            comment,
            workflowData: mergedData,
          }),
          credentials: "include",
        }
      );
      setIsApprovalDialogOpen(false);
      // Optionally reload or navigate
      // window.location.reload();
      navigate("/customers");
    } catch (error) {
      console.error("Error approving/rejecting branch:", error.message);
      setIsApprovalDialogOpen(false);
    }
  };

  return (
    <div className="expanded-form-container">
      {/* Branch Details Section */}
      <BranchDetailsSection
        branch={branchDetails}
        originalBranch={originalBranchDetails}
        customer={customer}
        inApproval={isApprovalMode}
        workflowId={customer?.workflowId}
        workflowInstanceId={customer?.workflowInstanceId}
        branchChanges={branchChanges}
        handleBranchFieldChange={handleBranchDataChange}
        setGeoLocation={setGeoLocation}
        mode={mode}
        formErrors={formErrors}
        handleDeliveryChargesChange={handleDeliveryChargesChange}
        isFirstBranch={isFirstBranch}
        setSameAsCustomer={setSameAsCustomer}
      />

      {/* Contact Section */}
      <ContactSection
        branch={branchContacts}
        originalBranchContacts={originalBranchContacts}
        branchDetails={branchDetails || branch}
        customer={customer}
        branchChanges={branchChanges}
        handleBranchFieldChange={handleBranchContactsDataChange}
        inApproval={isApprovalMode}
        workflowInstanceId={customer?.workflowInstanceId}
        formErrors={formErrors}
      />
      <OperatingHours
        hoursData={hoursDetails}
        originalHoursData={originalHoursData}
        branchDetails={branchDetails}
        customer={customer}
        branchId={branch?.id}
        handleBranchFieldChange={handleBranchDataChange}
        inApproval={isApprovalMode}
        handleHoursChange={handleHoursChange}
        applyAllHours={applyAllHours}
        workflowInstanceId={customer?.workflowInstanceId}
      />

      {/* Footer with action buttons */}
      <div className="expanded-form-container-footer">
        <div className="customer-onboarding-form-actions">
          <div className="action-buttons">
            {mode === "add" &&
            (branch?.branchStatus === "new" || branch?.isNew) ? (
              <>
                <button
                  className="save"
                  onClick={() => handleSave(branch?.id)}
                  disabled={customer?.isBlocked}
                >
                  {t("Save")}
                </button>
                <button
                  className="save"
                  onClick={() => handleSubmit(branch?.id)}
                  disabled={branch?.id < 0 || customer?.isBlocked}
                >
                  {t("Submit")}
                </button>
              </>
            ) : (
              branch?.branchStatus !== "pending" &&
              !branch?.isNew &&
              mode === "add" && (
                <>
                  <button
                    className="save changes"
                    onClick={() => handleSaveChanges(branch?.id)}
                    disabled={
                      isApprovalMode ||
                      branch?.branchStatus === "blocked" ||
                      customer?.isBlocked
                    }
                  >
                    {t("Save Changes")}
                  </button>

                  {branch?.branchStatus !== "blocked" ? (
                    <button
                      className="block"
                      disabled={isApprovalMode || customer?.isBlocked}
                      onClick={() => handleBlock(branch?.id)}
                    >
                      {t("Block")}
                    </button>
                  ) : (
                    <button
                      className="block"
                      disabled={isApprovalMode || customer?.isBlocked}
                      onClick={() => handleUnblock(branch?.id)}
                    >
                      {t("Unblock")}
                    </button>
                  )}
                </>
              )
            )}

            {mode === "edit" && isApprovalMode && (
              <button
                className="approve"
                onClick={() => handleApprovalClick("approve")}
              >
                {t("Approve")}
              </button>
            )}
            {mode === "edit" && isApprovalMode && (
              <button
                className="reject"
                onClick={() => handleApprovalClick("reject")}
              >
                {t("Reject")}
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Approval dialog for comment input */}
      <ApprovalDialog
        isOpen={isApprovalDialogOpen}
        onClose={() => setIsApprovalDialogOpen(false)}
        action={approvalAction}
        onSubmit={handleApprovalDialogSubmit}
        customerName={branchDetails?.branchNameEn || "this branch"}
        title={
          approvalAction === "approve"
            ? t("Approve Branch")
            : t("Reject Branch")
        }
        subtitle={
          approvalAction === "approve"
            ? t("Are you sure you want to approve this branch?")
            : t("Are you sure you want to reject this branch?")
        }
      />
    </div>
  );
};

export default BranchDetailsForm;
