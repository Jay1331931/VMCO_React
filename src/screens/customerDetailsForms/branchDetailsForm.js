import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import BranchDetailsSection from "./branchDetailsSection";
import ContactSection from "./contactSection";
import OperatingHours from "./operatingHours";
import "../../styles/forms.css";
import "../../styles/components.css";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const BranchDetailsForm = ({
  branchId,
  branch,
  customer,
  branchChanges,
  handleBranchFieldChange,
  inApproval,
  onSave,
  onSubmit,
  onBlock,
  onUnblock,
}) => {
  const { t } = useTranslation();
  const [branchDetails, setBranchDetails] = useState({});
  const [branchContacts, setBranchContacts] = useState([]);
  const [hoursDetails, setHoursDetails] = useState({});
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
  const handleBranchDataChange = (e) => {
    const { name, value } = e.target;
    updatedBranchData.current[name] = value;
    setBranchDetails((prev) => ({ ...prev, [name]: value }));
  };
  const handleBranchContactsDataChange = (e) => {
    const { name, value } = e.target;
    updatedBranchContactsData.current[name] = value;
    setBranchContacts((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (id) => {
    const isNewBranch = id < 0; // Negative IDs are temporary
      if (isNewBranch) {
        
        try {
        const response = await fetch(`${API_BASE_URL}/customer-branches`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...updatedBranchData.current,
            customer_id: customer?.id,
            isDeliveryChargesApplicable: customer?.isDeliveryChargesApplicable,
          }),
          credentials: "include",
        });

          const result = await response.json();

          if (response.ok) {
            console.log("$$$$ updatedBranchContactsData:", updatedBranchContactsData.current);
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
          const response =
            await fetch(`${API_BASE_URL}/customer-branches/id/${id}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...updatedBranchData.current, customerId: customer.id }),
              credentials: "include",
            });
        } catch (error) {
          console.error("Error updating branch:", error);
        }
        // console.log("Contact payload:", contactPayload);
        // if (Object.keys(contactPayload).length > 0) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/customer-contacts/customer/${customer.id}/branch/${id}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedBranchContactsData.current),
              credentials: "include", 
            }
          );
        } catch (error) {
          console.error("Error saving contacts for updated branch:", error);
        }
      }

      // Clear changes for this branch
      // setBranchChanges(prev => {
      //     const newChanges = { ...prev };
      //     delete newChanges[id];
      //     return newChanges;
      // });

      // Refresh data
      // await fetchBranches();
    // } catch (error) {
    //   console.error("Error saving branch:", error);
    // }
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
    <div className="expanded-form-container">
      {inApproval && (
        <div className="approval-notice">
          <h3>{t("Branch is currently under approval")}</h3>
        </div>
      )}

      {/* Branch Details Section */}
      <BranchDetailsSection
        branch={branchDetails}
        customer={customer}
        inApproval={inApproval}
        branchChanges={branchChanges}
        handleBranchFieldChange={handleBranchDataChange}
      />

      {/* Contact Section */}
      <ContactSection
        branch={branchContacts}
        customer={customer}
        branchChanges={branchChanges}
        handleBranchFieldChange={handleBranchContactsDataChange}
        inApproval={inApproval}
      />

      {/* Operating Hours */}
      {branchDetails && hoursDetails ? (
        <OperatingHours
          hoursData={hoursDetails}
          customer={customer}
          branchId={branch?.id}
          handleBranchFieldChange={handleBranchDataChange}
          inApproval={inApproval}
        />
      ) : (
        <div className="loading-section">Loading hours data...</div>
      )}

      {/* Footer with action buttons */}
      <div className="expanded-form-container-footer">
        <div className="customer-onboarding-form-actions">
          <div className="action-buttons">
            {branch?.branchStatus === "new" || branch?.isNew ? (
              <>
                <button
                  className="save"
                  onClick={() => handleSave(branch?.id)}
                >
                  {t("Save")}
                </button>
                <button
                  className="save"
                  onClick={() => onSubmit && onSubmit(branch?.id, branch)}
                  disabled={branch?.id < 0}
                >
                  {t("Submit")}
                </button>
              </>
            ) : (
              branch?.branchStatus !== "pending" &&
              !branch?.isNew && (
                <>
                  <button
                    className="save changes"
                    onClick={() =>
                      onSave && onSave(branch?.id, branch, "save changes")
                    }
                    disabled={inApproval || branch?.branchStatus === "blocked"}
                  >
                    {t("Save Changes")}
                  </button>

                  {branch?.branchStatus !== "blocked" ? (
                    <button
                      className="block"
                      disabled={inApproval}
                      onClick={() => onBlock && onBlock(branch?.id, branch)}
                    >
                      {t("Block")}
                    </button>
                  ) : (
                    <button
                      className="block"
                      disabled={inApproval}
                      onClick={() => onUnblock && onUnblock(branch?.id, branch)}
                    >
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
