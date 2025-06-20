import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
const parseTimeRange = (timeRange) => {
  if (typeof timeRange === "object") return timeRange;
  const [from, to] = timeRange.split("-");
  return { from, to };
};

const OperatingHours = ({ hoursData, customer, branchId, handleBranchFieldChange, inApproval }) => {
  const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const { t } = useTranslation();
  const [hours, setHours] = useState({});

  let customerFormMode;

  if (inApproval) {
    customerFormMode = "custDetailsEdit";
  } else {
    customerFormMode = "custDetailsAdd";
  }
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
      result.operatingHours[day] = `${hoursData[day].operating.from}-${hoursData[day].operating.to}`;
      result.deliveryHours[day] = `${hoursData[day].delivery.from}-${hoursData[day].delivery.to}`;
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

  const getBranchTimeSlotsInStringHours = () => {
    console.log("#### Enter");
    try {
      if (hoursData !== null && hoursData !== undefined) {
        const parsedData = typeof hoursData === "string" ? JSON.parse(hoursData) : hoursData;
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
  //getBranchTimeSlotsInStringHours();
  useEffect(() => {
    console.log("~~~~$$ useEffect hoursData", hoursData);
    if (hoursData) {
      const hoursToBeSet = getBranchTimeSlotsInStringHours();
      setHours(hoursToBeSet);
    } else setHours(getDefaultTimeSlotsInStringHours());
  }, [hoursData]);

  const [modifiedDays, setModifiedDays] = useState({});
  const [activeField, setActiveField] = useState(null);
  const [originalValues, setOriginalValues] = useState({});

  const handleHoursChange = (day, type, field, value) => {
    const updatedHours = {
      ...hours,
      [day]: {
        ...hours[day],
        [type]: {
          ...hours[day][type],
          [field]: value,
        },
      },
    };

    setHours(updatedHours);
    setModifiedDays((prev) => ({ ...prev, [day]: true }));
    handleBranchFieldChange(branchId, "hours", stringifyHours(updatedHours));
  };

  const applyAllHours = (sourceDay, type) => {
    const timeToApply = hours[sourceDay][type];
    const updatedHours = {
      ...hours,
      ...weekdays.reduce(
        (acc, day) => ({
          ...acc,
          [day]: {
            ...hours[day],
            [type]: timeToApply,
          },
        }),
        {}
      ),
    };

    setHours(updatedHours);
    setModifiedDays({});
    handleBranchFieldChange(branchId, "hours", stringifyHours(updatedHours));
  };

  const handleCancel = () => {
    if (activeField) {
      const [day, type, field] = activeField.split("-");
      const originalValue = originalValues[activeField];

      const updatedHours = {
        ...hours,
        [day]: {
          ...hours[day],
          [type]: {
            ...hours[day][type],
            [field]: originalValue,
          },
        },
      };

      setHours(updatedHours);
      setActiveField(null);
      handleBranchFieldChange(branchId, "hours", stringifyHours(updatedHours));
    }
  };

  const formatDayName = (day) => day.charAt(0).toUpperCase() + day.slice(1);

  return (
    <div className='form-section'>
      <h3>
        {t("Operating And Delivery Hours")}
        <span className='required-field'>*</span>
      </h3>
      <table className='hours-table'>
        <thead>
          <tr>
            <th>{t("Day")}</th>
            <th>{t("Operating Hours")}</th>
            <th>{t("Delivery Hours")}</th>
          </tr>
        </thead>
        <tbody>
          {weekdays.map((day) => (
            <tr key={day} className={day === "friday" ? "friday-row" : ""}>
              <td>{t(formatDayName(day))}</td>

              {/* Operating Hours */}
              <td>
                <TimeInputGroup
                  day={day}
                  type='operating'
                  time={hours[day]?.operating}
                  isActive={activeField}
                  isModified={modifiedDays[day]}
                  onChange={handleHoursChange}
                  onFocus={(field, value) => {
                    setActiveField(`${day}-operating-${field}`);
                    setOriginalValues((prev) => ({
                      ...prev,
                      [`${day}-operating-${field}`]: value,
                    }));
                  }}
                  onApplyAll={() => applyAllHours(day, "operating")}
                  customerFormMode={customerFormMode}
                />
              </td>

              {/* Delivery Hours */}
              <td>
                <TimeInputGroup
                  day={day}
                  type='delivery'
                  time={hours[day]?.delivery}
                  isActive={activeField}
                  isModified={modifiedDays[day]}
                  onChange={handleHoursChange}
                  onFocus={(field, value) => {
                    setActiveField(`${day}-delivery-${field}`);
                    setOriginalValues((prev) => ({
                      ...prev,
                      [`${day}-delivery-${field}`]: value,
                    }));
                  }}
                  onApplyAll={() => applyAllHours(day, "delivery")}
                  customerFormMode={customerFormMode}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
const TimeInputGroup = ({ day, type, time, isActive, isModified, onChange, onFocus, onApplyAll, customerFormMode }) => {
  return (
    <div className={`time-input-group ${day === "friday" ? "friday-time-input-group" : ""}`}>
      <input
        type='time'
        value={time?.from}
        onChange={(e) => onChange(day, type, "from", e.target.value)}
        onFocus={() => onFocus("from", time?.from)}
        onBlur={() => {}}
        disabled={customerFormMode === "custDetailsEdit"}
      />
      <span>-</span>
      <input
        type='time'
        value={time?.to}
        onChange={(e) => onChange(day, type, "to", e.target.value)}
        onFocus={() => onFocus("to", time?.to)}
        onBlur={() => {}}
        disabled={customerFormMode === "custDetailsEdit"}
      />

      {(isActive === `${day}-${type}-from` || isActive === `${day}-${type}-to`) && (
        <div className='time-action-buttons'>
          <button className='time-confirm-button' /*onClick={onConfirm}*/>{/* <FontAwesomeIcon icon={faCheck} /> */}</button>
          <button className='time-cancel-button' /*onClick={onCancel}*/>{/* <FontAwesomeIcon icon={faXmark} /> */}</button>
        </div>
      )}

      {isModified && (
        <button className='apply-row-button' onClick={onApplyAll} title='Apply to all days'>
          Apply All
        </button>
      )}
    </div>
  );
};

export default OperatingHours;
