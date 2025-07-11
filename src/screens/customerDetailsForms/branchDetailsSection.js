import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisV,
  faChevronDown,
  faChevronRight,
  faLocationDot,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import RbacManager from "../../utilities/rbac";
import "../../styles/components.css";
import "../../styles/forms.css";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";

const BranchDetailsForm = ({
  branch,
  originalBranch,
  customer,
  inApproval,
  workflowId,
  workflowInstanceId,
  branchChanges,
  handleBranchFieldChange,
  setGeoLocation,
  mode,
  isUnderApproval,
  formErrors = {},
  handleDeliveryChargesChange,
  isFirstBranch,
  setSameAsCustomer
}) => {
  const { t } = useTranslation();
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(branch?.geolocation);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  // LocationPicker component
  const { token, user, isAuthenticated, logout } = useAuth();
  const [workflowData, setWorkflowData] = useState(null);
  let customerFormMode;
  if (inApproval) {
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
  const [dropdownOptions, setDropdownOptions] = useState({});

  const getOptionsFromBasicsMaster = async (fieldName) => {
    const params = new URLSearchParams({
      filters: JSON.stringify({ master_name: fieldName }), // Properly stringify the filter
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/basics-masters?${params.toString()}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
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
    const fetchDropdownOptions = async () => {
      const options = {};
      console.log("branch", branch);
      // Find all dropdown fields and fetch their options
      const dropdownFields = ["city", "locationType", "region", "branch"];
      console.log("dropdownFields", dropdownFields);
      for (const field of dropdownFields) {
        try {
          const data = await getOptionsFromBasicsMaster(field);
          // options[field.name] = data;
          options[field] = data.map(
            (opt) =>
              typeof opt === "string"
                ? opt.charAt(0) + opt.slice(1).toLowerCase()
                : opt // Fallback if not a string
          );
        } catch (err) {
          console.error(`Failed to fetch options for ${field}:`, err);
          options[field] = []; // Fallback to empty array
        }
      }

      setDropdownOptions(options);
      console.log("dropdown options", dropdownOptions);
    };

    fetchDropdownOptions();
  }, [branch]);
const fetchWorkflowDataOfBranch = async (workflowId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/workflow-instance/id/${workflowId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
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
    if (inApproval && workflowInstanceId) {
      const wfData = await fetchWorkflowDataOfBranch(workflowInstanceId);
      setWorkflowData(wfData?.branch);
    }
  };
  fetchWorkflowData();
  }, [workflowInstanceId, inApproval]);
   useEffect(() => {
     const getFieldValue = (fieldName) => {
    if (fieldName === "isDeliveryChargesApplicable") {
      if (branch?.[fieldName]) {
        return branch?.[fieldName];
      } else {
        return customer?.[fieldName];
      }
    }
  }
  branch.isDeliveryChargesApplicable = getFieldValue("isDeliveryChargesApplicable");
  }, []);
  const LocationPicker = ({ onLocationSelect, initialLat, initialLng }) => {
    const mapContainer = useRef(null);
    const markerRef = useRef(null); // Using ref instead of state for the marker
    const [map, setMap] = useState(null);
    const { t, i18n } = useTranslation();
    const [coords, setCoords] = useState("Detecting your location...");
    const [coordsArabic, setCoordsArabic] = useState(
      t("Detecting your location...")
    );
    const [defaultCenter] = useState([77.5946, 12.9716]);
    const [zoom] = useState(14);
    const [confirmedLocation, setConfirmedLocation] = useState(null);
    console.log("Initial Lat:", initialLat);
    console.log("Initial Lng:", initialLng);
    useEffect(() => {
      let mapInstance;

      const initializeMap = async () => {
        mapInstance = new maplibregl.Map({
          container: mapContainer.current,
          style:
            "https://api.maptiler.com/maps/streets/style.json?key=NxvpwMoXuYLINUijkWEc",
          center:
            initialLat && initialLng ? [initialLat, initialLng] : defaultCenter,
          zoom: zoom,
        });

        mapInstance.on("load", async () => {
          setMap(mapInstance);
          try {
            const position =
              initialLat && initialLng
                ? { coords: { latitude: initialLat, longitude: initialLng } }
                : await getCurrentPosition();
            const { latitude, longitude } = position.coords;
            updateMarker(mapInstance, longitude, latitude);
          } catch (error) {
            console.log("Geolocation error:", error);
            setCoords("Click on the map to select a location");
            setCoordsArabic(t("Click on the map to select a location"));
          }
        });

        mapInstance.on("click", (e) => {
          if (!confirmedLocation) {
            const { lng, lat } = e.lngLat;
            updateMarker(mapInstance, lng, lat);
          }
        });

        return () => {
          if (markerRef.current) markerRef.current.remove();
          mapInstance.remove();
        };
      };

      const getCurrentPosition = () => {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          });
        });
      };

      const updateMarker = (map, lng, lat) => {
        // Remove existing marker if it exists
        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }

        // Create new marker
        const newMarker = new maplibregl.Marker()
          .setLngLat([lng, lat])
          .addTo(map);

        markerRef.current = newMarker;
        setCoords(`Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`);
        setCoordsArabic(
          `خط العرض: ${lat.toFixed(6)}, خط الطول: ${lng.toFixed(6)}`
        );

        map.setCenter([lng, lat]);
      };

      initializeMap();

      return () => {
        if (mapInstance) mapInstance.remove();
      };
    }, [confirmedLocation]);

    const handleConfirm = () => {
      if (markerRef.current) {
        const lngLat = markerRef.current.getLngLat();
        onLocationSelect(lngLat.lat, lngLat.lng);
        setConfirmedLocation(lngLat);
        handleLocationSelect(lngLat.lat, lngLat.lng);
        setGeoLocation({
          x: lngLat.lat.toFixed(6),
          y: lngLat.lng.toFixed(6),});
      }
    };

    const handleReset = () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      setConfirmedLocation(null);
      setCoords("Click on the map to select a location");
      setCoordsArabic(t("Click on the map to select a location"));
    };

    return (
      <div className="location-picker-container">
        <div ref={mapContainer} className="map-container" />
        <div className="location-coords">
          {i18n.language === "ar" ? coordsArabic : coords}
        </div>
        <div className="location-actions">
          {!confirmedLocation ? (
            <button
              className="confirm-location-button"
              onClick={handleConfirm}
              disabled={!markerRef.current}
            >
              Confirm Location
            </button>
          ) : (
            <>
              <div className="location-confirmed">Location confirmed!</div>
              <button className="reset-location-button" onClick={handleReset}>
                Change Location
              </button>
            </>
          )}
        </div>
      </div>
    );
  };
  // Get current values from branchChanges or fall back to branch data
  // const getFieldValue = (fieldName) => {
  //     // return branchChanges?.[branch.id]?.[fieldName] ?? branch[fieldName] ?? '';
  //     return branchChanges?.[branch.id]?.[fieldName] ? branchChanges[branch.id][fieldName] : branch[fieldName];
  // };
  const getFieldValue = (fieldName) => {
    if (fieldName === "isDeliveryChargesApplicable") {
      if (branch?.[fieldName]) {
        return branch?.[fieldName];
      } else {
        return customer?.[fieldName];
      }
    }
    if (branchChanges?.[branch?.id]?.hasOwnProperty(fieldName)) {
      return branchChanges[branch?.id][fieldName];
    }
    return branch?.[fieldName] ?? "";
  };

  const handleLocationSelect = useCallback(
    (lat, lng) => {
      setSelectedLocation({ lat, lng });
      setShowMap(false);
      
      // Store as object for display but convert to string for backend
      // handleBranchFieldChange(branch.id, "geolocation", { x: lat, y: lng });
    },
    // [branch.id, handleBranchFieldChange]
  );

  const getLocationDisplay = (location) => {
    if (!location) return "Select Location";

    if (
      typeof location === "object" &&
      location.x !== undefined &&
      location.y !== undefined
    ) {
      const x = parseFloat(location.x);
      const y = parseFloat(location.y);

      if (!isNaN(x) && !isNaN(y)) {
        return `${x.toFixed(6)}, ${y.toFixed(6)}`;
      }
    }

    return "Select Location";
  };

  const fields = useMemo(
    () => [
      {
        type: "text",
        label: "Branch",
        name: "branchNameEn",
        placeholder: "Branch",
        required: true,
      },
      {
        type: "text",
        label: "Branch (Arabic)",
        name: "branchNameLc",
        placeholder: "Branch (Arabic)",
        required: true,
      },
      {
        type: "text",
        label: "Building Name",
        name: "buildingName",
        placeholder: "Building Name",
        required: true,
      },
      {
        type: "text",
        label: "Street",
        name: "street",
        placeholder: "Street",
        required: true,
      },
      {
        type: "dropdown",
        label: "City",
        name: "city",
        placeholder: "City",
        required: true,
        options: ["Jeddah", "Riyadh", "Dammam"],
      },
      {
        type: "dropdown",
        label: "Location Type",
        name: "locationType",
        placeholder: "Location Type",
        required: true,
        options: ["Office", "Warehouse", "Showroom"],
      },
      {
        type: "dropdown",
        label: "Region",
        name: "region",
        placeholder: "Region",
        required: true,
        options: ["Region 1", "Region 2", "Region 3"],
      },
      {
        label: "Geolocation",
        name: "geolocation",
        placeholder: "Geolocation",
        isLocation: true,
        required: true,
      },
      {
        type: "dropdown",
        label: "Branch",
        name: "branch",
        placeholder: "Branch",
        required: true,
        options: ["Jeddah", "Riyadh", "Dammam"],
      },
    ],
    []
  );
  console.log("customer", customer);
  const hasCheckboxUpdate =
    inApproval &&
    workflowData &&
    "isDeliveryChargesApplicable" in workflowData;
  return (
    <div className="form-section">
      {console.log(isUnderApproval)}
      {/* {(isUnderApproval) && <h2>{t('Branch is currently under Approval')}</h2>} */}
      <h3>{t("Branch Details")}</h3>

      <div className="form-group">
        {/* <label>
                    <input
                        type="checkbox"
                        name="sameAsCustomer"
                        checked={sameAsCustomer}
                        onChange={handleCheckboxChange}
                    />
                    {'\t' + t('Same as Customer Details')}
                </label> */}
{isFirstBranch && mode!== "edit" && (<div className="form-group">
        <label className="checkbox-group-label">
          <input
            type="checkbox"
            id="sameAsCustomer"
            name="sameAsCustomer"
            checked={branch?.street === customer?.street &&
              branch?.buildingName === customer?.buildingName &&
              branch?.city === customer?.city &&
              branch?.region === customer?.region &&
              branch?.geolocation === customer?.geolocation}
            onChange={(e) => setSameAsCustomer(e.target.checked)}
          />
          {t("Same as Customer Details")}
        </label>
      </div>)}
        {isV("isDeliveryChargesApplicable") && (
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="isDeliveryChargesApplicable"
                checked={branch?.isDeliveryChargesApplicable}
                onChange={handleDeliveryChargesChange}
                disabled={
                  customerFormMode === "custDetailsEdit" && !hasCheckboxUpdate
                }
                // hidden={!isV('isDeliveryChargesApplicable')}
              />
              {"\t" + t("Is Delivery Charges Applicable")}
              {hasCheckboxUpdate && (
                <span className="update-badge">Updated</span>
              )}
            </label>
          </div>
        )}
      </div>

      <div className="form-row">
        {fields.map((field, index) => {
          const hasUpdate = (inApproval && workflowData ? field.name in workflowData : false) || (inApproval && branch.branchStatus === "pending");
            // inApproval &&
            // customer.module === "branch" &&
            // customer?.workflowData?.updates &&
            // field.name in customer.workflowData.updates;
          const currentValue = originalBranch?.[field.name] || "";
          const value = hasUpdate
            ? workflowData?.[field.name]
            : getFieldValue(field.name);
          console.log(
            "Branch field value:",
            branch?.[field.name],
            typeof branch?.[field.name]
          );

          return (
            <div
              className={`form-group ${hasUpdate ? "pending-update" : ""}`}
              key={index}
            >
              {isV(field.name) && (
                <label>
                  {t(field.label)}
                  {field.required && <span className="required-field">*</span>}
                </label>
              )}

              {field?.isLocation ? (
                <div className="location-input-container">
                  <input
                    name={field.name}
                    value={
                      branch?.[field.name]
                        ? getLocationDisplay(branch[field.name])
                        : "Select Location"
                    }
                    // value={getLocationDisplay(branch[field.name])}
                    placeholder={t(field.placeholder)}
                    disabled={
                      customerFormMode === "custDetailsEdit" && !hasUpdate
                    }
                    style={
                              hasUpdate
                                ? {
                                    backgroundColor: "#fff8e1",
                                  }
                                : {}
                            }
                    onChange={handleBranchFieldChange}
                    readOnly
                  />

                  <button
                    className="location-picker-button"
                    //   disabled={!isE(field.name, transformedCustomer?.isApprovalMode, hasUpdate && customer?.workflowData?.updates
                    //     ? field.name in customer.workflowData.updates
                    //     : false)}
                    disabled={
                      customerFormMode === "custDetailsEdit" && !hasUpdate
                    }
                    onClick={() => setShowMap(true)}
                  >
                    <FontAwesomeIcon icon={faLocationDot} />
                  </button>
                </div>
              ) : (
                  <div className="form-row">
                    {(() => {
                      switch (field.type) {
                        case "text":
                          return (
                            <input
                            type="text"
                            name={field.name}
                            value={branch?.[field.name]}
                            placeholder={t(field.placeholder)}
                            onChange={handleBranchFieldChange}
                            style={
                              hasUpdate
                                ? {
                                    backgroundColor: "#fff8e1",
                                  }
                                : {}
                            }
                            disabled={
                              customerFormMode === "custDetailsEdit" &&
                              !hasUpdate
                            }
                          />
                          
                          
                        );
                      case "dropdown":
                        return (
                          <select
                            name={field.name}
                            value={branch?.[field.name]}
                            onChange={handleBranchFieldChange}
                            style={
                              hasUpdate
                                ? {
                                    backgroundColor: "#fff8e1",
                                  }
                                : {}
                            }
                            disabled={
                              customerFormMode === "custDetailsEdit" &&
                              !hasUpdate
                            }
              hidden={!isV(field.name)}
                          >
                            <option value="">{t(field.placeholder)}</option>
                            {dropdownOptions[field.name]
                              ? dropdownOptions[field.name].map((opt, idx) => (
                                  <option key={idx} value={opt}>
                                    {t(opt)}
                                  </option>
                                ))
                              : []}
                          </select>
                        );
                      default:
                        return null;
                    }
                  })()}
                </div>
            )}
              {hasUpdate && (
                <div className="current-value">
                  Previous:{" "}
                  {field.isLocation
                    ? getLocationDisplay(currentValue)
                    : originalBranch?.[field.name] || "(empty)"}
                </div>
              )}
              {formErrors[field.name] && (
                <div className="current-value">
                <span className="error-message" style={{ fontSize: "12px"}}>{formErrors[field.name]}</span>
              </div>
              )}
            </div>
          );
        })}
      </div>

      {showMap && (
        <div className="map-modal">
          <div className="map-modal-content">
            <button
              className="close-modal-button"
              onClick={() => setShowMap(false)}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <h3>{t("Select Location")}</h3>
            <LocationPicker
              onLocationSelect={() => {}}
              initialLat={getFieldValue("geolocation")?.x}
              initialLng={getFieldValue("geolocation")?.y}
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default BranchDetailsForm;
