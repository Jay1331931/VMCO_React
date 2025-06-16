import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const MaintenanceCharges = ({ maintenanceCharges, onChargesChange, isEditable = true }) => {
  const { t } = useTranslation();
  const [localCharges, setLocalCharges] = useState({
    serviceCharges: maintenanceCharges?.serviceCharges || 0,
    partsCharges: maintenanceCharges?.partsCharges || [],
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [fieldErrors, setFieldErrors] = useState([]);

  useEffect(() => {
    calculateTotal();
  }, [localCharges.partsCharges]);

  const calculateTotal = () => {
    const total = localCharges.partsCharges.reduce((sum, item) => {
      return sum + (Number(item.amount) || 0);
    }, 0);
    setTotalAmount(total.toFixed(2));
  };

  const handleServiceChargesChange = (value) => {
    const updatedCharges = {
      ...localCharges,
      serviceCharges: value,
    };
    setLocalCharges(updatedCharges);
    if (onChargesChange) onChargesChange(updatedCharges);
  };

  const handlePartsChange = (index, field, value) => {
    const updatedParts = [...localCharges.partsCharges];
    updatedParts[index][field] = value;

    // Clear error for this field if value is provided
    if (value) {
      setFieldErrors((prev) => prev.filter((err) => !(err.index === index && err.field === field)));
    }

    const updatedCharges = {
      ...localCharges,
      partsCharges: updatedParts,
    };
    setLocalCharges(updatedCharges);
    if (onChargesChange) onChargesChange(updatedCharges);
  };

  const addRow = () => {
    // Check if any rows exist and if the last row has all required fields filled
    if (localCharges.partsCharges.length > 0) {
      const lastIndex = localCharges.partsCharges.length - 1;
      const lastRow = localCharges.partsCharges[lastIndex];

      const newErrors = [];
      if (!lastRow.partName) {
        newErrors.push({ index: lastIndex, field: "partName", message: "Part Name is required" });
      }
      if (!lastRow.qty) {
        newErrors.push({ index: lastIndex, field: "qty", message: "Quantity is required" });
      }
      if (!lastRow.amount && lastRow.amount !== 0) {
        newErrors.push({ index: lastIndex, field: "amount", message: "Amount is required" });
      }

      if (newErrors.length > 0) {
        setFieldErrors(newErrors);
        return; // Don't add new row if current row has errors
      }
    }

    const updatedParts = [...localCharges.partsCharges, { partName: "", qty: 1, amount: 0 }];
    const updatedCharges = {
      ...localCharges,
      partsCharges: updatedParts,
    };
    setLocalCharges(updatedCharges);
    if (onChargesChange) onChargesChange(updatedCharges);
  };

  const removeRow = (index) => {
    // Allow removing any row, even if it's the last one
    const updatedParts = localCharges.partsCharges.filter((_, i) => i !== index);
    const updatedCharges = {
      ...localCharges,
      partsCharges: updatedParts,
    };

    // Remove any errors associated with this row
    setFieldErrors((prev) => prev.filter((err) => err.index !== index));

    // Update indexes for errors after the removed row
    setFieldErrors((prev) => prev.map((err) => (err.index > index ? { ...err, index: err.index - 1 } : err)));

    setLocalCharges(updatedCharges);
    if (onChargesChange) onChargesChange(updatedCharges);
  };

  const hasError = (index, field) => {
    return fieldErrors.some((err) => err.index === index && err.field === field);
  };

  return (
    <div>
      <div className='maintenance-details-field maintenance-details-textarea'>
        <label htmlFor='serviceCharges'>{t("Service Charges")}</label>
        <input
          id='serviceCharges'
          name='serviceCharges'
          type='number'
          step='0.01'
          value={localCharges.serviceCharges || ""}
          onChange={(e) => handleServiceChargesChange(e.target.value)}
          disabled={!isEditable}
          placeholder={t("Enter service charges")}
        />
      </div>

      <div className='maintenance-details-section'>
        <h3 className='maintenance-details-subtitle'>{t("Consumables")}</h3>
        <div className='table-container'>
          <table className='data-table'>
            <thead>
              <tr>
                <th>{t("Part Name")} *</th>
                <th>{t("Quantity")} *</th>
                <th>{t("Amount")} *</th>
                <th>{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {localCharges.partsCharges.length > 0 ? (
                localCharges.partsCharges.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type='text'
                        value={item.partName}
                        onChange={(e) => handlePartsChange(index, "partName", e.target.value)}
                        disabled={!isEditable}
                        style={hasError(index, "partName") ? { borderColor: "red" } : {}}
                      />
                    </td>
                    <td>
                      <input
                        type='number'
                        min='1'
                        value={item.qty}
                        onChange={(e) => handlePartsChange(index, "qty", e.target.value)}
                        disabled={!isEditable}
                        style={hasError(index, "qty") ? { borderColor: "red" } : {}}
                      />
                    </td>
                    <td>
                      <input
                        type='number'
                        step='0.01'
                        min='0'
                        value={item.amount}
                        onChange={(e) => handlePartsChange(index, "amount", e.target.value)}
                        disabled={!isEditable}
                        style={hasError(index, "amount") ? { borderColor: "red" } : {}}
                      />
                    </td>
                    <td>
                      <button className='remove-btn' onClick={() => removeRow(index)} disabled={!isEditable}>
                        {t("Remove")}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan='4' style={{ textAlign: "center", padding: "20px" }}>
                    {t("No consumables added")}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan='2' style={{ textAlign: "right", paddingRight: "10px" }}>
                  <strong>{t("Total Amount")}:</strong>
                </td>
                <td>
                  <strong>{totalAmount}</strong>
                </td>
                <td>
                  <button className='support-add-button' onClick={addRow} disabled={!isEditable}>
                    {t("Add Row")}
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
          {fieldErrors.length > 0 && (
            <div className='error-message' style={{ color: "red", marginTop: "8px" }}>
              {t("All fields are required to add a new row")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// // {
// "serviceCharges": 150,
// "partsCharges": [
// {
// "qty": 1,
// "amount": 50,
// "partName": "Filter"
// }
// ]
// }
export default MaintenanceCharges;
