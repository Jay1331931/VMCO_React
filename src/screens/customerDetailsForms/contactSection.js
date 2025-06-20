import { useTranslation } from "react-i18next";
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
  customer,
  branchChanges,
  handleBranchFieldChange,
  inApproval,
}) => {
  const { t } = useTranslation();
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

  const handleContactChange = (fieldName, value) => {
    handleBranchFieldChange(branch.id, fieldName, value);
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
              {fields.map(({ name, field }) => (
                <div className="form-group" key={field}>
                  <input
                    placeholder={t(name)}
                    value={branch[field]}
                    required={isRequired}
                    onChange={(e) => handleContactChange(field, e.target.value)}
                    disabled={
                      customerFormMode === "custDetailsEdit" ||
                      (label === "Primary Contact" &&
                        name === "Email" &&
                        branch?.branchStatus !== "new" &&
                        !branch?.isNew)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
export default ContactSection;