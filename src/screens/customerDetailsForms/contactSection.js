import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/forms.css";
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
  originalBranchContacts,
  branchDetails,
  customer,
  branchChanges,
  handleBranchFieldChange,
  inApproval,
  workflowInstanceId,
}) => {
  const { t } = useTranslation();
  const [workflowData, setWorkflowData] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  let customerFormMode;
  if (inApproval) {
    customerFormMode = "custDetailsEdit";
  } else {
    customerFormMode = "custDetailsAdd";
  }
  // Get current values from branchChanges or fall back to branch data
  // const getFieldValue = (fieldName) => {
  //     return branchChanges?.[branch.id]?.[fieldName] ?? branch[fieldName] ?? '';
  // };
  const getFieldValue = (fieldName) => {
    if (branchChanges?.[branch.id]?.hasOwnProperty(fieldName)) {
      return branchChanges[branch.id][fieldName];
    }
    return branch[fieldName] ?? "";
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
  useEffect(() => {
    const fetchWorkflowData = async () => {
      if (inApproval) {
        const wfData = await fetchWorkflowDataOfBranch(workflowInstanceId);
        setWorkflowData(wfData?.contacts);
      }
    };
    fetchWorkflowData();
  }, [workflowInstanceId, inApproval]);
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
                const hasUpdate = (inApproval && branch?.[field] !==
                  originalBranchContacts?.[field]) || (inApproval && branchDetails?.branchStatus === "pending");
                return (
                  <div className="form-group" key={field}>
                    <input
                      // type="text"
                      placeholder={t(name)}
                      name={field}
                      value={branch?.[field]}
                    required={isRequired}
                    onChange={handleBranchFieldChange}
                    style={
                              hasUpdate
                                ? {
                                    backgroundColor: "#fff8e1",
                                  }
                                : {}
                            }
                    disabled={
                    (customerFormMode === "custDetailsEdit" &&
                      !hasUpdate) || (branchDetails?.branchStatus !== "new" && field === "primaryContactEmail")
                  }
                  />
                  {hasUpdate && (
                    <div className="current-value">
                      {t("Previous")}:{" "}
                      {originalBranchContacts?.[field] || "(empty)"}
                    </div>
                  )}
                </div>)
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
export default ContactSection;
