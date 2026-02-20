import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark, faCheck,
  faCheckCircle,
  faCopy,
  faTimes,
  faClock,
  faArrowLeft,
  faArrowRight,
  faChevronUp,
  faChevronDown,
  faHistory,
  faTruck,
  faBuilding,
  faMosque,
  faStar,
  faCalendarDay,
} from "@fortawesome/free-solid-svg-icons";
import "../../styles/operatingHours.css"
import { useTranslation } from "react-i18next";
const parseTimeRange = (timeRange) => {
  if (typeof timeRange === "object") return timeRange;
  const [from, to] = timeRange.split("-");
  return { from, to };
};

const OperatingHours = ({
  hoursData,
  originalHoursData,
  branchDetails,
  customer,
  branchId,
  handleBranchFieldChange,
  inApproval,
  mode,
  handleHoursChange,
  applyAllHours,
  handleCancelHours,
  workflowInstanceId,
}) => {
  const weekdays = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const { t } = useTranslation();
  const [hours, setHours] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 500);
  const [isExpanded,setIsExpanded]=useState(false)
  let customerFormMode;

  if (mode === "edit") {
    customerFormMode = "custDetailsEdit";
  } else {
    customerFormMode = "custDetailsAdd";
  }
  // Helper function to parse time range strings
  // const parseTimeRange = (timeRange) => {
  //   if (!timeRange) return { from: "09:00", to: "18:00" };
  //   const [from, to] = timeRange.split("-");
  //   return { from: from || "09:00", to: to || "18:00" };
  // };

  // Helper function to stringify hours for storage
  // const stringifyHours = (hoursData) => {
  //   const result = {
  //     operatingHours: {},
  //     deliveryHours: {},
  //   };

  //   weekdays.forEach((day) => {
  //     result.operatingHours[day] = `${hoursData[day].operating.from}-${hoursData[day].operating.to}`;
  //     result.deliveryHours[day] = `${hoursData[day].delivery.from}-${hoursData[day].delivery.to}`;
  //   });

  //   return JSON.stringify(result);
  // };

  // const getDefaultTimeSlotsInStringHours = () => {
  //   return weekdays.reduce((acc, day) => {
  //     acc[day] = {
  //       operating: { from: "09:00", to: "18:00" },
  //       delivery: { from: "09:00", to: "18:00" },
  //     };
  //     return acc;
  //   }, {});
  // };

  // const getBranchTimeSlotsInStringHours = () => {
  //   console.log("#### Enter");
  //   try {
  //     if (hoursData !== null && hoursData !== undefined) {
  //       const parsedData = typeof hoursData === "string" ? JSON.parse(hoursData) : hoursData;
  //       let convertedData = {};
  //       weekdays.forEach((day) => {
  //         convertedData[day] = {
  //           operating: parseTimeRange(parsedData.operatingHours?.[day]),
  //           delivery: parseTimeRange(parsedData.deliveryHours?.[day]),
  //         };
  //       });
  //       console.log("#### Exit" + JSON.stringify(convertedData));
  //       return convertedData;
  //     }
  //     return getDefaultTimeSlotsInStringHours();
  //   } catch (e) {
  //     console.error("Error parsing hours data:", e);
  //   }
  // };
  //getBranchTimeSlotsInStringHours();
  // useEffect(() => {
  //   console.log("~~~~$$ useEffect hoursData", hoursData);
  //   if (hoursData) {
  //     const hoursToBeSet = getBranchTimeSlotsInStringHours();
  //     setHours(hoursToBeSet);
  //   } else setHours(getDefaultTimeSlotsInStringHours());
  // }, [hoursData]);

  const [modifiedDays, setModifiedDays] = useState({});
  const [activeField, setActiveField] = useState(null);
  const [originalValues, setOriginalValues] = useState({});

  // const handleHoursChange = (day, type, field, value) => {
  //   const updatedHours = {
  //     ...hours,
  //     [day]: {
  //       ...hours[day],
  //       [type]: {
  //         ...hours[day][type],
  //         [field]: value,
  //       },
  //     },
  //   };

  //   setHours(updatedHours);
  //   setModifiedDays((prev) => ({ ...prev, [day]: true }));
  //   handleBranchFieldChange(branchId, "hours", stringifyHours(updatedHours));
  // };

  // const applyAllHours = (sourceDay, type) => {
  //   const timeToApply = hours[sourceDay][type];
  //   const updatedHours = {
  //     ...hours,
  //     ...weekdays.reduce(
  //       (acc, day) => ({
  //         ...acc,
  //         [day]: {
  //           ...hours[day],
  //           [type]: timeToApply,
  //         },
  //       }),
  //       {}
  //     ),
  //   };

  //   setHours(updatedHours);
  //   setModifiedDays({});
  //   handleBranchFieldChange(branchId, "hours", stringifyHours(updatedHours));
  // };

  // const handleCancel = () => {
  //   if (activeField) {
  //     const [day, type, field] = activeField.split("-");
  //     const originalValue = originalValues[activeField];

  //     const updatedHours = {
  //       ...hours,
  //       [day]: {
  //         ...hours[day],
  //         [type]: {
  //           ...hours[day][type],
  //           [field]: originalValue,
  //         },
  //       },
  //     };

  //     setHours(updatedHours);
  //     setActiveField(null);
  //     handleBranchFieldChange(branchId, "hours", stringifyHours(updatedHours));
  //   }
  // };
  // const fetchWorkflowDataOfBranch = async (workflowId) => {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/workflow-instance/id/${workflowId}`, {
  //       method: "GET",
  //       headers: { "Content-Type": "application/json" },
  //       
  //     });
  //     const workflowDataJson = await response.json();
  //     console.log("Workflow Data JSON~~~~~~~~~~~~~", workflowDataJson);
  //     return workflowDataJson?.data?.workflowData?.updates;
  //   } catch (error) {
  //     console.error("Error fetching workflow data:", error);
  //     throw error;
  //   }
  // };
  //   useEffect(() => {
  //     const fetchWorkflowData = async () => {
  //     if (inApproval) {
  //       const wfData = await fetchWorkflowDataOfBranch(workflowInstanceId);
  //       // setWorkflowData(wfData?.branch);
  //     }
  //   };
  //   fetchWorkflowData();
  //   }, [workflowInstanceId, inApproval]);
  const formatDayName = (day) => day.charAt(0).toUpperCase() + day.slice(1);

  return (
    !isMobile ? <div className="form-section">
      <h3>
        {t("Operating And Delivery Hours")}
        <span className="required-field">*</span>
      </h3>
      <table className="hours-table">
        <thead>
          <tr>
            <th>{t("Day")}</th>
            <th>{t("Operating Hours")}</th>
            <th>{t("Delivery Hours")}</th>
          </tr>
        </thead>
        <tbody>
          {weekdays.map((day) => {
            return (
              <tr key={day} className={day === "friday" ? "friday-row" : ""}>
                <td>{t(formatDayName(day))}</td>

                {/* Operating Hours */}
                <td>
                  <TimeInputGroup
                    day={day}
                    type="operating"
                    time={hoursData[day]?.operating}
                    isActive={activeField}
                    inApproval={inApproval}
                    isModified={
                      hoursData[day]?.operating?.from !==
                        originalHoursData[day]?.operating?.from ||
                      hoursData[day]?.operating?.to !==
                        originalHoursData[day]?.operating?.to ||
                      branchDetails?.branchStatus === "pending"
                    }
                    onChange={handleHoursChange}
                    onCancel={() => handleCancelHours(day)}
                    onFocus={(field, value) => {
                      setActiveField(`${day}-operating-${field}`);
                      setOriginalValues((prev) => ({
                        ...prev,
                        [`${day}-operating-${field}`]: value,
                      }));
                    }}
                    onApplyAll={() => applyAllHours(day, "operating")}
                    customerFormMode={customerFormMode}
                    mode={mode}
                  />
                  {inApproval &&
                    mode === "edit" &&
                    (hoursData[day]?.operating?.from !==
                      originalHoursData[day]?.operating?.from ||
                      hoursData[day]?.operating?.to !==
                        originalHoursData[day]?.operating?.to ||
                      branchDetails?.branchStatus === "pending") && (
                      <div className="current-value">
                        {t("Previous")}{":"}
                        {originalHoursData[day]?.operating?.from || "09:00"} -{" "}
                        {originalHoursData[day]?.operating?.to || "18:00"}
                      </div>
                    )}
                </td>

                {/* Delivery Hours */}
                <td>
                  <TimeInputGroup
                    day={day}
                    type="delivery"
                    time={hoursData[day]?.delivery}
                    isActive={activeField}
                    inApproval={inApproval}
                    isModified={
                      hoursData[day]?.delivery?.from !==
                        originalHoursData[day]?.delivery?.from ||
                      hoursData[day]?.delivery?.to !==
                        originalHoursData[day]?.delivery?.to ||
                      branchDetails?.branchStatus === "pending"
                    }
                    onChange={handleHoursChange}
                    onCancel={() => handleCancelHours(day)}
                    onFocus={(field, value) => {
                      setActiveField(`${day}-delivery-${field}`);
                      setOriginalValues((prev) => ({
                        ...prev,
                        [`${day}-delivery-${field}`]: value,
                      }));
                    }}
                    onApplyAll={() => applyAllHours(day, "delivery")}
                    customerFormMode={customerFormMode}
                    mode={mode}
                  />
                  {inApproval &&
                    mode === "edit" &&
                    (hoursData[day]?.delivery?.from !==
                      originalHoursData[day]?.delivery?.from ||
                      hoursData[day]?.delivery?.to !==
                        originalHoursData[day]?.delivery?.to ||
                      branchDetails?.branchStatus === "pending") && (
                      <div className="current-value">
                        {t("Previous")}{":"}
                        {originalHoursData[day]?.delivery?.from || "09:00"} -{" "}
                        {originalHoursData[day]?.delivery?.to || "18:00"}
                      </div>
                    )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div> :<div className="operating-hours-section-mobile">
    {/* Section Header */}
    <div className="section-header-mobile">
      <div className="header-content">
        <FontAwesomeIcon icon={faClock} className="section-icon" />
        <h3 className="section-title-mobile">
          {t("Operating And Delivery Hours")}
          {/* <span className="required-badge">*</span> */}
        </h3>
      </div>
      <div className="section-subtitle-mobile">
        {t("Set working hours for each day of the week")}
      </div>
    </div>

    {/* Days Cards */}
    <div className="days-cards-container-mobile">
      {weekdays.map((day) => (
        <div 
          key={day} 
          className={`day-card-mobile ${day === "friday" ? "friday-card" : ""}`}
        >
          {/* Day Header */}
          <div className="day-header-mobile">
            <div className="day-info">
              <div className="day-name-mobile">
                <FontAwesomeIcon 
                  icon={day === "friday" ? faStar : faCalendarDay} 
                  className="day-icon" 
                />
                {t(formatDayName(day))}
              </div>
              {day === "friday" && (
                <span className="special-day-badge">
                  <FontAwesomeIcon icon={faMosque} />
                  {t("Special Hours")}
                </span>
              )}
            </div>
          </div>

          {/* Operating Hours Card */}
          <div className="hours-card-mobile">
            <div className="hours-card-header">
              <div className="hours-type-mobile">
                <FontAwesomeIcon icon={faBuilding} className="hours-icon" />
                <span className="hours-label">{t("Operating Hours")}</span>
              </div>
              {hoursData[day]?.operating?.from !==
                  originalHoursData[day]?.operating?.from ||
                hoursData[day]?.operating?.to !==
                  originalHoursData[day]?.operating?.to ||
                branchDetails?.branchStatus === "pending" ? (
                <span className="modified-badge">
                  <span className="modified-dot"></span>
                  {t("Updated")}
                </span>
              ) : null}
            </div>
            
            <TimeInputGroup
              day={day}
              type="operating"
              time={hoursData[day]?.operating}
              isActive={activeField}
              inApproval={inApproval}
              isModified={
                hoursData[day]?.operating?.from !==
                  originalHoursData[day]?.operating?.from ||
                hoursData[day]?.operating?.to !==
                  originalHoursData[day]?.operating?.to ||
                branchDetails?.branchStatus === "pending"
              }
              onChange={handleHoursChange}
              onCancel={() => handleCancelHours(day)}
              onFocus={(field, value) => {
                setActiveField(`${day}-operating-${field}`);
                setOriginalValues((prev) => ({
                  ...prev,
                  [`${day}-operating-${field}`]: value,
                }));
              }}
              onApplyAll={() => applyAllHours(day, "operating")}
              customerFormMode={customerFormMode}
              mode={mode}
            />
            
            {inApproval &&
              mode === "edit" &&
              (hoursData[day]?.operating?.from !==
                originalHoursData[day]?.operating?.from ||
                hoursData[day]?.operating?.to !==
                  originalHoursData[day]?.operating?.to ||
                branchDetails?.branchStatus === "pending") && (
                <div className="previous-value-mobile">
                  <FontAwesomeIcon icon={faHistory} className="previous-icon" />
                  <span className="previous-label">{t("Previous")}{":"}</span>
                  <span className="previous-time">
                    {originalHoursData[day]?.operating?.from || "09:00"} -{" "}
                    {originalHoursData[day]?.operating?.to || "18:00"}
                  </span>
                </div>
              )}
          </div>

          {/* Delivery Hours Card */}
          <div className="hours-card-mobile">
            <div className="hours-card-header">
              <div className="hours-type-mobile">
                <FontAwesomeIcon icon={faTruck} className="hours-icon" />
                <span className="hours-label">{t("Delivery Hours")}</span>
              </div>
              {hoursData[day]?.delivery?.from !==
                  originalHoursData[day]?.delivery?.from ||
                hoursData[day]?.delivery?.to !==
                  originalHoursData[day]?.delivery?.to ||
                branchDetails?.branchStatus === "pending" ? (
                <span className="modified-badge">
                  <span className="modified-dot"></span>
                  {t("Updated")}
                </span>
              ) : null}
            </div>
            
            <TimeInputGroup
              day={day}
              type="delivery"
              time={hoursData[day]?.delivery}
              isActive={activeField}
              inApproval={inApproval}
              isModified={
                hoursData[day]?.delivery?.from !==
                  originalHoursData[day]?.delivery?.from ||
                hoursData[day]?.delivery?.to !==
                  originalHoursData[day]?.delivery?.to ||
                branchDetails?.branchStatus === "pending"
              }
              onChange={handleHoursChange}
              onCancel={() => handleCancelHours(day)}
              onFocus={(field, value) => {
                setActiveField(`${day}-delivery-${field}`);
                setOriginalValues((prev) => ({
                  ...prev,
                  [`${day}-delivery-${field}`]: value,
                }));
              }}
              onApplyAll={() => applyAllHours(day, "delivery")}
              customerFormMode={customerFormMode}
              mode={mode}
            />
            
            {inApproval &&
              mode === "edit" &&
              (hoursData[day]?.delivery?.from !==
                originalHoursData[day]?.delivery?.from ||
                hoursData[day]?.delivery?.to !==
                  originalHoursData[day]?.delivery?.to ||
                branchDetails?.branchStatus === "pending") && (
                <div className="previous-value-mobile">
                  <FontAwesomeIcon icon={faHistory} className="previous-icon" />
                  <span className="previous-label">{t("Previous")}{":"}</span>
                  <span className="previous-time">
                    {originalHoursData[day]?.delivery?.from || "09:00"} -{" "}
                    {originalHoursData[day]?.delivery?.to || "18:00"}
                  </span>
                </div>
              )}
          </div>
        </div>
      ))}
    </div>
  </div>
  );
};
const TimeInputGroup = ({
  day,
  type,
  time,
  isActive,
  inApproval,
  isModified,
  onChange,
  onCancel,
  onFocus,
  onApplyAll,
  customerFormMode,
  mode,
}) => {
  const {t} = useTranslation();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 500);
    const [isExpanded,setIsExpanded]=useState(false)
  return (
   !isMobile ? <div
      className={`time-input-group ${
        day === "friday" ? "friday-time-input-group" : ""
      }`}
    >
      <div className="time-input-wrapper">
      <input
        type="time"
        value={time?.from}
        onChange={(e) => onChange(day, type, "from", e.target.value)}
        onFocus={() => onFocus("from", time?.from)}
        onBlur={() => {}}
        // disabled={inApproval && !isModified}'
        style={
          inApproval && isModified && mode === "edit"
            ? {
                backgroundColor: "#fff8e1",
              }
            : {}
        }
      />
      {<span className="time-placeholder">{t("From")}</span>}
      </div>
      <span>-</span>
      <div className="time-input-wrapper">
      <input
        type="time"
        value={time?.to}
        onChange={(e) => onChange(day, type, "to", e.target.value)}
        onFocus={() => onFocus("to", time?.to)}
        onBlur={() => {}}
        // disabled={inApproval && !isModified}
        style={
          inApproval && isModified && mode === "edit"
            ? {
                backgroundColor: "#fff8e1",
              }
            : {}
        }
      />
      {<span className="time-placeholder">{t("To")}</span>}
      </div>
      {(isActive === `${day}-${type}-from` ||
        isActive === `${day}-${type}-to`) && (
        <div className="time-action-buttons">
          <button className="time-confirm-button" /*onClick={onConfirm}*/>
            <FontAwesomeIcon icon={faCheck} />
          </button>
          <button className="time-cancel-button" onClick={onCancel} >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      )}

      {isModified && (
        <button
          className="apply-row-button"
          onClick={onApplyAll}
          title="Apply to all days"
        >
          Apply All
        </button>
      )}
    </div> : <div className={`time-input-group-mobile ${isModified ? "modified" : ""}`}>
      {/* Time Display Row */}
      <div 
        className="time-display-row-mobile"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="time-display-mobile">
          <div className="time-slot-mobile">
            <FontAwesomeIcon icon={faClock} className="time-icon" />
            <span className="time-value">{time?.from || "--:--"}</span>
            <span className="time-label">{t("From")}</span>
          </div>
          <div className="time-separator-mobile">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="time-slot-mobile">
            <FontAwesomeIcon icon={faClock} className="time-icon" />
            <span className="time-value">{time?.to || "--:--"}</span>
            <span className="time-label">{t("To")}</span>
          </div>
        </div>
        <FontAwesomeIcon 
          icon={isExpanded ? faChevronUp : faChevronDown} 
          className="expand-icon" 
        />
      </div>

      {/* Expanded Time Inputs */}
      {isExpanded && (
        <div className="time-inputs-expanded-mobile">
          <div className="time-inputs-row-mobile">
            {/* From Time Input */}
            <div className="time-input-field-mobile">
              <label className="time-input-label">
                <FontAwesomeIcon icon={faArrowRight} />
                {t("From")}
              </label>
              <div className="time-input-wrapper-mobile">
                <input
                  type="time"
                  value={time?.from || ""}
                  onChange={(e) => onChange(day, type, "from", e.target.value)}
                  onFocus={() => onFocus("from", time?.from)}
                  className={`time-input ${isModified ? "input-modified" : ""}`}
                  style={
                    inApproval && isModified && mode === "edit"
                      ? {
                          backgroundColor: "#fff8e1",
                        }
                      : {}
                  }
                />
                <FontAwesomeIcon icon={faClock} className="time-input-icon" />
              </div>
            </div>

            {/* To Time Input */}
            <div className="time-input-field-mobile">
              <label className="time-input-label">
                <FontAwesomeIcon icon={faArrowLeft} />
                {t("To")}
              </label>
              <div className="time-input-wrapper-mobile">
                <input
                  type="time"
                  value={time?.to || ""}
                  onChange={(e) => onChange(day, type, "to", e.target.value)}
                  onFocus={() => onFocus("to", time?.to)}
                  className={`time-input ${isModified ? "input-modified" : ""}`}
                  style={
                    inApproval && isModified && mode === "edit"
                      ? {
                          backgroundColor: "#fff8e1",
                        }
                      : {}
                  }
                />
                <FontAwesomeIcon icon={faClock} className="time-input-icon" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="time-actions-mobile">
            {(isActive === `${day}-${type}-from` ||
              isActive === `${day}-${type}-to`) && (
              <>
                {/* <button 
                  className="time-action-btn confirm-btn-mobile"
                  onClick={() => setIsExpanded(false)}
                >
                  <FontAwesomeIcon icon={faCheck} />
                  <span>Confirm</span>
                </button> */}
                <button 
                  className="time-action-btn cancel-btn-mobile"
                  onClick={() => {
                    onCancel();
                    setIsExpanded(false);
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} />
                  <span>Cancel</span>
                </button>
              </>
            )}
            
            {isModified && (
              <button
                className="time-action-btn apply-all-btn-mobile"
                onClick={() => {
                  onApplyAll();
                  setIsExpanded(false);
                }}
                title="Apply to all days"
              >
                <FontAwesomeIcon icon={faCopy} />
                <span>Apply All</span>
              </button>
            )}
            
           <button 
                  className="time-action-btn confirm-btn-mobile"
                  onClick={() => setIsExpanded(false)}
                >
                  <FontAwesomeIcon icon={faCheck} />
                  <span>Confirm</span>
                </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatingHours;
