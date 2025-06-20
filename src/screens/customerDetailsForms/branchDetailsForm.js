import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import BranchDetailsSection from "./branchDetailsSection";
import ContactSection from "./contactSection";
import OperatingHours from "./operatingHours";
import "../../styles/forms.css";
import "../../styles/components.css";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const BranchDetailsForm = ({ branchId, branch, customer, branchChanges, handleBranchFieldChange, inApproval, onSave, onSubmit, onBlock, onUnblock }) => {
  const { t } = useTranslation();
  const [branchDetails, setBranchDetails] = useState({});
  const [branchContacts, setBranchContacts] = useState([]);
  const [hoursDetails, setHoursDetails] = useState({});

  const fetchBranchDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customer-branches/id/${branchId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

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
      const response = await fetch(`${API_BASE_URL}/customer-contacts/branch/${branchId}/customer/${customer?.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const result = await response.json();

      if (result.status === "Ok") {
        // setBranchContacts(result.data);
        return result.data;
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const branchData = await fetchBranchDetails();
      const hoursData = branchData?.hours || {};
      const contactsData = await fetchBranchContacts();
      setBranchDetails(branchData);
      setBranchContacts(contactsData);
      setHoursDetails(hoursData);
    };
    fetchData();
  }, []);
  return (
    <div className='expanded-form-container'>
      {inApproval && (
        <div className='approval-notice'>
          <h3>{t("Branch is currently under approval")}</h3>
        </div>
      )}

      {/* Branch Details Section */}
      <BranchDetailsSection
        branch={branchDetails}
        customer={customer}
        inApproval={inApproval}
        branchChanges={branchChanges}
        handleBranchFieldChange={handleBranchFieldChange}
      />

      {/* Contact Section */}
      <ContactSection
        branch={branchContacts}
        customer={customer}
        branchChanges={branchChanges}
        handleBranchFieldChange={handleBranchFieldChange}
        inApproval={inApproval}
      />

      {/* Operating Hours */}
      {branchDetails && hoursDetails ? (
        <OperatingHours
          hoursData={hoursDetails}
          customer={customer}
          branchId={branch?.id}
          handleBranchFieldChange={handleBranchFieldChange}
          inApproval={inApproval}
        />
      ) : (
        <div className='loading-section'>Loading hours data...</div>
      )}

      {/* Footer with action buttons */}
      <div className='expanded-form-container-footer'>
        <div className='customer-onboarding-form-actions'>
          <div className='action-buttons'>
            {branch?.branchStatus === "new" || branch?.isNew ? (
              <>
                <button className='save' onClick={() => onSave && onSave(branch?.id, branch, "save")}>
                  {t("Save")}
                </button>
                <button className='save' onClick={() => onSubmit && onSubmit(branch?.id, branch)} disabled={branch?.id < 0}>
                  {t("Submit")}
                </button>
              </>
            ) : (
              branch?.branchStatus !== "pending" &&
              !branch?.isNew && (
                <>
                  <button
                    className='save changes'
                    onClick={() => onSave && onSave(branch?.id, branch, "save changes")}
                    disabled={inApproval || branch?.branchStatus === "blocked"}>
                    {t("Save Changes")}
                  </button>

                  {branch?.branchStatus !== "blocked" ? (
                    <button className='block' disabled={inApproval} onClick={() => onBlock && onBlock(branch?.id, branch)}>
                      {t("Block")}
                    </button>
                  ) : (
                    <button className='block' disabled={inApproval} onClick={() => onUnblock && onUnblock(branch?.id, branch)}>
                      {t("Unblock")}
                    </button>
                  )}
                </>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchDetailsForm;
