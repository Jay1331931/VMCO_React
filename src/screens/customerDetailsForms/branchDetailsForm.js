import React, { useEffect, useState, useRef, use, act } from "react";
import { useTranslation } from "react-i18next";
import BranchDetailsSection from "./branchDetailsSection";
import ContactSection from "./contactSection";
import OperatingHours from "./operatingHours";
import ApprovalDialog from "../../components/ApprovalDialog";
import "../../styles/forms.css";
import "../../styles/components.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2";
import LoadingSpinner from "../../components/LoadingSpinner"; // Import the LoadingSpinner component
import RbacManager from "../../utilities/rbac";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const BranchDetailsForm = ({
  branchId, // required
  branch,
  setBranches,
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
  const [branchDetails, setBranchDetails] = useState({ ...branch });
  const [originalBranchDetails, setOriginalBranchDetails] = useState({});
  const [branchContacts, setBranchContacts] = useState([]);
  const [originalBranchContacts, setOriginalBranchContacts] = useState([]);
  const [hoursDetails, setHoursDetails] = useState({});
  const [originalHoursData, setOriginalHoursData] = useState({});
  const [workflowData, setWorkflowData] = useState({});
  const [completeWorkflowData, setCompleteWorkflowData] = useState({});
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
  // Add these state variables after the existing useState declarations
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);
  const { token, user, isAuthenticated, logout } = useAuth();
  let customerFormMode;
  if (mode === "edit") {
    customerFormMode = "custDetailsEdit";
  } else {
    customerFormMode = "custDetailsAdd";
  }
  const rbacMgr = new RbacManager(
    user?.userType == "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    customerFormMode
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);
  var updatedBranchData = useRef({});
  var updatedBranchContactsData = useRef({});
  const fetchBranchDetails = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/customer-branches/id/${branchId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json",
                                'Authorization': `Bearer ${token}` },
          
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
          headers: { "Content-Type": "application/json" ,
                                'Authorization': `Bearer ${token}`},
          
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
          headers: { "Content-Type": "application/json",
                                'Authorization': `Bearer ${token}` },
          
        }
      );
      const workflowDataJson = await response.json();
      console.log("Workflow Data JSON~~~~~~~~~~~~~", workflowDataJson);
      setCompleteWorkflowData(workflowDataJson?.data?.workflowData);
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
        headers: { "Content-Type": "application/json",
                                'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          id: branchId,
          module: "branch",
        }),
        
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
      // Check if the current day is Friday, set special hours
      if (day === "friday") {
        acc[day] = {
          operating: { from: "08:00", to: "23:00" }, // 8am to 11pm
          delivery: { from: "13:00", to: "16:00" }, // 1pm to 4pm
        };
      } else {
        acc[day] = {
          operating: { from: "09:00", to: "18:00" },
          delivery: { from: "09:00", to: "18:00" },
        };
      }
      return acc;
    }, {});
  };

  const getBranchTimeSlotsInStringHours = (hoursData) => {
    console.log("#### Enter");
    try {
      if (Object.keys(hoursData).length > 0) {
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

  const handleCancelHours = (day) => {
    // const {day, type, field, value} = e.target;
    const updatedHours = {
      ...hoursDetails,
      [day]: {
        ["operating"]: {
          "from": "00:00",
          "to": "00:00"
        },
        ["delivery"]: {
          "from": "00:00",
          "to": "00:00"
        }
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
    updatedBranchContactsData.current.primaryContactName =
      customer?.primaryContactName || "";
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
      const branchData = (await fetchBranchDetails()) || branch;
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
        isAppMode && temp?.branch && Object.keys(temp?.branch).length > 0
          ? { ...branchData, ...temp?.branch }
          : branchData
      );
      setOriginalBranchDetails(branchData);
      setBranchContacts(
        isAppMode && temp?.contacts && Object.keys(temp?.contacts)?.length > 0
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
    "district",
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
    "district",
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
    "zone",
    // "supervisorContactName",
    // "supervisorContactDesignation",
    // "supervisorContactEmail",
    // "supervisorContactMobile",
  ];
  const uniqueContactFieldsList = [
      {name: "primaryContactEmail", field: "email"},
      // {name: "secondaryContactEmail", field: "email"},
      // {name: "supervisorContactEmail", field: "email"},
    ]
  const isArabicText = (text) => {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
  };
  const isEnglishText = (text) => {
  return /^[\u0000-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u2C60-\u2C7F\uA720-\uA7FF]+$/.test(text);
};
  const validateData = async (
    dataToValidate,
    mandatoryCheckRequired = false,
    mandatoryFields = mandatoryFields
  ) => {
    const errors = {};
    const arabicList = ["branchNameLc"];
    const englishList = ["branchNameEn"];

    // If mandatoryCheckReguired is true, check all mandatory fields

    if (mandatoryCheckRequired) {
      mandatoryFields.forEach((field) => {
        if (field in dataToValidate && !dataToValidate[field]) {
          errors[field] = "This field is required";
        }
      });
    }
    for (const field in dataToValidate) {
      const value = dataToValidate[field];
      if(value === undefined || value === null || value === "") {
        continue; // Skip undefined or null values
      }
      if (arabicList.includes(field) && value && !isArabicText(value)) {
        errors[field] = "Please enter Arabic text.";
      }
      if (englishList.includes(field) && value && !isEnglishText(value)) {
        errors[field] = "Please enter English text.";
      }

      if(uniqueContactFieldsList.some(item => item.name === field)) {
        const { name, field: contactField } = uniqueContactFieldsList.find(item => item.name === field);
        const res = await fetch(`${API_BASE_URL}/customer-contacts/uniqueField/checkUniqueField`, {
          method: "POST",
          headers: { "Content-Type": "application/json" ,
                                'Authorization': `Bearer ${token}`},
          
          body: JSON.stringify({ customerId: customer?.id, name, value }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data.isUnique) {
            // Field is valid
          } else {
            errors[name] = t(`This ${contactField} is already registered.`);
          }
        }
      }

      if (field.toLowerCase().includes("email")) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          errors[field] = "Invalid email format";
        }
      }

      if (
        field.toLowerCase().includes("mobile") ||
        field.toLowerCase().includes("phone")
      ) {
        const universalMobileRegex = /^\+?[1-9]\d{7,14}$/;
      if (value && !universalMobileRegex.test(value)) {
        errors[field] = "Invalid mobile number format";
      }
      }
    }
    if( dataToValidate?.locationType?.toLowerCase() === "others (specify)" && !dataToValidate?.locationTypeOther) {
        errors.locationTypeOther = "This field is required.";
      }
    return errors;
  };

  const handleSubmit = async (id) => {
    setIsSubmitting(true);

    try {
      handleSave(id, "submit");

      const errors = await validateData(
        { ...branchDetails, ...branchContacts },
        true,
        mandatoryFields
      );
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) {
        setIsSubmitting(false);
        Swal.fire({
          icon: "error",
          title: t("Error"),
          text: t("Please fix the errors before saving."),
          confirmButtonText: t("OK"),
        });
        setIsSaving(false);
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/customer-branches/id/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" ,
                                'Authorization': `Bearer ${token}`},
          body: JSON.stringify({
            branch: {
              branchStatus: "pending",
              customerId: customer?.id
            },
            contacts: {},
          }),
          
        }
      );

      const result = await response.json();

      // Keep loading for 3 seconds then reload
      setTimeout(() => {
        setIsSubmitting(false);
        window.location.reload(true);
      }, 3000);
    } catch (error) {
      setIsSubmitting(false);
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

  const handleSave = async (id, action) => {
    setIsSaving(true);

    try {
      const isNewBranch = id < 0;
      const errors = await validateData(
        { ...updatedBranchData.current, ...updatedBranchContactsData.current },
        false,
        []
      );
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) {
        setIsSaving(false);
        Swal.fire({
          icon: "error",
          title: t("Error"),
          text: t("Please fix the errors before saving."),
          confirmButtonText: t("OK"),
        });
        return;
      }

      if (isNewBranch) {
        try {
          const response = await fetch(`${API_BASE_URL}/customer-branches`, {
            method: "POST",
            headers: { "Content-Type": "application/json",
                                'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              ...updatedBranchData.current,
              customer_id: customer?.id, // Set initial status to 'new'
              isDeliveryChargesApplicable:
                customer?.isDeliveryChargesApplicable,
              erpCustId: customer?.erpCustId,
              hours: stringifyHours(hoursDetails),
              custSeqId: customer?.sequenceId
            }),
            
          });

          const result = await response.json();

          if (response.ok) {
            // branch.id = result?.data?.id; // Update branch ID with the newly created branch ID
            // branch = result?.data;
            // remove branch with id < 0 from branches
            setBranches((prevBranches) =>
              prevBranches.filter((branch) => branch.id !== id)
            );
            setBranches((prevBranches) => [
              ...prevBranches,
              { ...result?.data, id: result?.data?.id },
            ]);
            setExpandedRows([]);
            console.log(
              "$$$$ updatedBranchContactsData:",
              updatedBranchContactsData.current
            );
            try {
              const res = await fetch(
                `${API_BASE_URL}/customer-contacts/create/customer/${customer.id}/branch/${result.data.id}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" ,
                                'Authorization': `Bearer ${token}`},
                  body: JSON.stringify({
                    ...updatedBranchContactsData.current,
                    customer_id: customer.id,
                    branch_id: result.data.id,
                  }),
                  
                }
              );
              if (res.ok) {
                const contactResult = await res.json();
                if (action !== "submit") {
                  Swal.fire({
                    icon: "success",
                    title: t("Success"),
                    text: t("Branch saved successfully."),
                    confirmButtonText: t("OK"),
                  });
                }
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
              headers: { "Content-Type": "application/json",
                                'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                branch: {
                  ...updatedBranchData.current,
                  customerId: customer.id,
                  branchStatus: branchDetails?.branchStatus,
                },
                contacts: {},
              }),
              
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
              headers: { "Content-Type": "application/json" ,
                                'Authorization': `Bearer ${token}`},
              body: JSON.stringify({ ...updatedBranchContactsData.current }),
              
            }
          );
        } catch (error) {
          console.error("Error saving contacts for updated branch:", error);
        }
        if (action !== "submit") {
          Swal.fire({
            icon: "success",
            title: t("Success"),
            text: t("Branch saved successfully."),
            confirmButtonText: t("OK"),
          });
        }
      }
    } catch (error) {
      setIsSaving(false);
      console.error("Error creating/updating branch:", error);
    } finally {
      if (action !== "submit") {
        setIsSaving(false);
      }
    }
  };
  const handleSaveChanges = async (id) => {
    setIsSavingChanges(true);

    try {
      const errors = await validateData(
        { ...branchDetails, ...branchContacts },
        true,
        mandatoryFields
      );
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) {
        setIsSavingChanges(false);
        Swal.fire({
          icon: "error",
          title: t("Error"),
          text: t("Please fix the errors before saving."),
          confirmButtonText: t("OK"),
        });
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/customer-branches/id/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json",
                                'Authorization': `Bearer ${token}` },
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
          
        }
      );

      if (response.ok) {
        const result = await response.json();
        Swal.fire({
          icon: "success",
          title: t("Success"),
          text: t("Branch updated successfully."),
          confirmButtonText: t("OK"),
        });
        setExpandedRows([]);
      }
    } catch (error) {
      console.error("Error updating branch:", error);
    } finally {
      setIsSavingChanges(false);
    }
  };

  const handleBlock = async (id) => {
    setIsBlocking(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/customer-branches/id/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json",
                                'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            branch: {
              branchStatus: "blocked",
              customerId: customer?.id,
              isBlocked: true,
            },
          }),
          
        }
      );

      if (response.ok) {
        const result = await response.json();
        Swal.fire({
          icon: "success",
          title: t("Success"),
          text: t("Branch blocked successfully."),
          confirmButtonText: t("OK"),
        });
        setExpandedRows([]);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error blocking branch:", error);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblock = async (id) => {
    setIsUnblocking(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/customer-branches/id/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" ,
                                'Authorization': `Bearer ${token}`},
          body: JSON.stringify({
            branch: {
              branchStatus: "approved",
              customerId: customer?.id,
              isBlocked: false,
            },
          }),
          
        }
      );

      if (response.ok) {
        const result = await response.json();
        Swal.fire({
          icon: "success",
          title: t("Success"),
          text: t("Branch unblocked successfully."),
          confirmButtonText: t("OK"),
        });
        setExpandedRows([]);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error unblocking branch:", error);
    } finally {
      setIsUnblocking(false);
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
          headers: { "Content-Type": "application/json",
                                'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            approvedStatus: "approved",
            comment: "comment",
            workflowData: mergedData,
          }),
          
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
          headers: { "Content-Type": "application/json" ,
                                'Authorization': `Bearer ${token}`},
          body: JSON.stringify({
            approvedStatus: "rejected",
            comment: "comment",
            workflowData: mergedData,
          }),
          
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
    if (approvalAction === "approve") {
      setIsApproving(true);
    } else {
      setIsRejecting(true);
    }

    try {
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
      if (branch?.branchStatus === "pending") {
        dataToBeValidated = {
          ...branch,
          ...branchContacts,
          ...hoursDetails,
          ...updatedBranchData.current,
          ...updatedBranchContactsData.current,
          ...mergedData?.updates?.branch,
          ...mergedData?.updates?.contacts,
        };
      } else {
        dataToBeValidated = {
          ...mergedData?.updates?.branch,
          ...mergedData?.updates?.contacts,
        };
      }

      console.log("Data to be validated:", dataToBeValidated);
      let errors = {};
      if(approvalAction === "approve") {
      errors = await validateData(
        dataToBeValidated,
        true,
        mandatoryFieldsForApproval
      );
      setFormErrors(errors);
    }
      if (Object.keys(errors).length > 0) {
        setIsApproving(false);
        setIsRejecting(false);
        Swal.fire({
          icon: "error",
          title: t("Error"),
          text: t("Please fix the errors before saving."),
          confirmButtonText: t("OK"),
        });
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/workflow-instance/id/${customer?.workflowInstanceId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json",
                                'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            approvedStatus:
              approvalAction === "approve" ? "approved" : "rejected",
            comment,
            workflowData: mergedData,
          }),
          
        }
      );

      Swal.fire({
                icon: "success",
                title: t("Success"),
                text:
                  approvalAction === "approve"
                    ? t("Branch has been approved successfully")
                    : t("Branch has been rejected successfully"),
                confirmButtonText: t("OK"),
              }).then(() => {
                setIsApprovalDialogOpen(false);
                setIsApproving(false);
                setIsRejecting(false);
                navigate("/customers");
              });

      // setIsApprovalDialogOpen(false);
      // navigate("/customers");
    } catch (error) {
      console.error("Error approving/rejecting branch:", error.message);
    } finally {
      setIsApproving(false);
      setIsRejecting(false);
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
        mode={mode}
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
        mode={mode}
        handleHoursChange={handleHoursChange}
        applyAllHours={applyAllHours}
        handleCancelHours={handleCancelHours}
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
                  onClick={() => handleSave(branch?.id, "save")}
                  disabled={
                    isSaving ||
                    isSubmitting ||
                    isSavingChanges ||
                    isApproving ||
                    isRejecting ||
                    isBlocking ||
                    isUnblocking ||
                    customer?.isBlocked
                  }
                >
                  {isSaving ? t("Saving...") : t("Save")}
                </button>
                <button
                  className="save"
                  onClick={() => handleSubmit(branch?.id)}
                  disabled={
                    isSaving ||
                    isSubmitting ||
                    isSavingChanges ||
                    isApproving ||
                    isRejecting ||
                    isBlocking ||
                    isUnblocking ||
                    branch?.id < 0 ||
                    customer?.isBlocked
                  }
                >
                  {isSubmitting ? t("Submitting...") : t("Submit")}
                </button>
              </>
            ) : (
              branch?.branchStatus !== "pending" &&
              !branch?.isNew &&
              mode === "add" && isV("btnBranchSaveChanges")&& (
                <>
                  <button
                    className="save changes"
                    onClick={() => handleSaveChanges(branch?.id)}
                    disabled={
                      isSaving ||
                      isSubmitting ||
                      isSavingChanges ||
                      isApproving ||
                      isRejecting ||
                      isBlocking ||
                      isUnblocking ||
                      isApprovalMode ||
                      branch?.branchStatus === "blocked" ||
                      customer?.isBlocked
                    }
                  >
                    {isSavingChanges ? t("Saving...") : t("Save Changes")}
                  </button>

                  {isV("btnBranchBlock") && 
                  branch?.branchStatus !== "blocked" ? (
                    <button
                      className="block"
                      disabled={
                        isSaving ||
                        isSubmitting ||
                        isSavingChanges ||
                        isApproving ||
                        isRejecting ||
                        isBlocking ||
                        isUnblocking ||
                        isApprovalMode ||
                        customer?.isBlocked
                      }
                      onClick={() => handleBlock(branch?.id)}
                    >
                      {isBlocking ? t("Blocking...") : t("Block")}
                    </button>
                  ) : (isV("btnBranchUnblock") &&
                    <button
                      className="block"
                      disabled={
                        isSaving ||
                        isSubmitting ||
                        isSavingChanges ||
                        isApproving ||
                        isRejecting ||
                        isBlocking ||
                        isUnblocking ||
                        isApprovalMode ||
                        customer?.isBlocked
                      }
                      onClick={() => handleUnblock(branch?.id)}
                    >
                      {isUnblocking ? t("Unblocking...") : t("Unblock")}
                    </button>
                  )}
                </>
              )
            )}

            {mode === "edit" && isV("btnBranchApprove") && isE("btnBranchApprove") &&(
              <button
                className="approve"
                onClick={() => handleApprovalClick("approve")}
                disabled={
                  isSaving ||
                  isSubmitting ||
                  isSavingChanges ||
                  isApproving ||
                  isRejecting ||
                  isBlocking ||
                  isUnblocking
                }
               hidden={Number(branch?.id) !== Number(completeWorkflowData?.id)}

              >
                {isApproving ? t("Approving...") : t("Approve")}
              </button>
            )}
            {mode === "edit" &&  isV("btnBranchReject") && isE("btnBranchReject")  && (
              <button
                className="reject"
                onClick={() => handleApprovalClick("reject")}
                disabled={
                  isSaving ||
                  isSubmitting ||
                  isSavingChanges ||
                  isApproving ||
                  isRejecting ||
                  isBlocking ||
                  isUnblocking
                }
               hidden={Number(branch?.id) !== Number(completeWorkflowData?.id)}

              >
                {isRejecting ? t("Rejecting...") : t("Reject")}
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

      {/* Add this to show the overlay spinner */}
      {isSubmitting && (
        <div className="loading-container">
          <LoadingSpinner size="medium" />
        </div>
      )}
    </div>
  );
};

export default BranchDetailsForm;
