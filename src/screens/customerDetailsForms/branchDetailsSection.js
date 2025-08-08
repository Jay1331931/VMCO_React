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
import SearchableDropdown from "../../components/SearchableDropdown";

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
  setSameAsCustomer,
}) => {
  const { t, i18n } = useTranslation();
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(branch?.geolocation);
  const [geoData, setGeoData] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  // LocationPicker component
  const { token, user, isAuthenticated, logout } = useAuth();
  const [workflowData, setWorkflowData] = useState(null);
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

      const options = result.data.map((item) => {
        return { value: item.value, valueLc: item.valueLc };
      });
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
      const dropdownFields = [
        "city",
        "locationType",
        "region",
        "branch",
        "district",
      ];
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
  // Fetch geo data on component mount
  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/geoLocation`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setGeoData(data.data);
        }
      } catch (error) {
        console.error("Error fetching geo data:", error);
      }
    };
    fetchGeoData();
  }, []);
  useEffect(() => {
    if (geoData && branch?.region) {
      setSelectedRegion(branch.region);
      if (branch.city) {
        setSelectedCity(branch.city);
      }
    }
  }, [geoData, branch]);
  // Get city options based on selected region
  const getCityOptions = useMemo(() => {
    console.log("excute123", selectedRegion, geoData);
    if (!selectedRegion || !geoData || !geoData[selectedRegion]?.cities)
      return [];
    console.log("excute");
    return Object.keys(geoData[selectedRegion].cities).map((city) => ({
      value: city,
      name:
        i18n.language === "ar"
          ? geoData[selectedRegion].cities[city].ar
          : geoData[selectedRegion].cities[city].en,
    }));
  }, [selectedRegion, geoData]);

  // Get district options based on selected city
  const getDistrictOptions = useMemo(() => {
    if (
      !selectedRegion ||
      !selectedCity ||
      !geoData ||
      !geoData[selectedRegion]?.cities?.[selectedCity]?.districts
    ) {
      return [];
    }

    return Object.keys(
      geoData[selectedRegion].cities[selectedCity].districts
    ).map((district) => ({
      value: district,
      name:
        i18n.language === "ar"
          ? geoData[selectedRegion].cities[selectedCity].districts[district].ar
          : geoData[selectedRegion].cities[selectedCity].districts[district].en,
    }));
  }, [selectedRegion, selectedCity, geoData, i18n.language]);

  // Handle region selection
  const handleRegionChange = (e) => {
    const region = e.target.value;

    setSelectedRegion(region);
    setSelectedCity(null);
    handleBranchFieldChange({
      target: {
        name: "region",
        value: region,
      },
    });
    // Clear city and district when region changes
    handleBranchFieldChange({
      target: {
        name: "city",
        value: "",
      },
    });
    handleBranchFieldChange({
      target: {
        name: "district",
        value: "",
      },
    });
  };

  // Handle city selection
  const handleCityChange = (e) => {
    const city = e.target.value;
    setSelectedCity(city);
    handleBranchFieldChange({
      target: {
        name: "city",
        value: city,
      },
    });
    // Clear district when city changes
    handleBranchFieldChange({
      target: {
        name: "district",
        value: "",
      },
    });
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
    };
    branch.isDeliveryChargesApplicable = getFieldValue(
      "isDeliveryChargesApplicable"
    );
  }, []);
  const LocationPicker = ({ onLocationSelect, initialLat, initialLng }) => {
    const mapContainer = useRef(null);
    const markerRef = useRef(null);
    const [map, setMap] = useState(null);
    const { t, i18n } = useTranslation();
    const [coords, setCoords] = useState("Detecting your location...");
    const [coordsArabic, setCoordsArabic] = useState(
      t("Detecting your location...")
    );
    const [defaultCenter] = useState([77.5946, 12.9716]); // [lng, lat]
    const [zoom] = useState(14);
    const [confirmedLocation, setConfirmedLocation] = useState(null);

    // Add search states
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    console.log("Initial Lat:", initialLat);
    console.log("Initial Lng:", initialLng);

    // Validate and sanitize coordinates
    const isValidCoordinate = (lat, lng) => {
      return (
        typeof lat === "number" &&
        typeof lng === "number" &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180 &&
        !isNaN(lat) &&
        !isNaN(lng)
      );
    };

    const getInitialCenter = () => {
      // Parse coordinates if they're strings
      const lat =
        typeof initialLat === "string" ? parseFloat(initialLat) : initialLat;
      const lng =
        typeof initialLng === "string" ? parseFloat(initialLng) : initialLng;

      if (isValidCoordinate(lat, lng)) {
        return [lng, lat]; // MapLibre expects [lng, lat]
      }
      return defaultCenter;
    };

    const updateMarker = (map, lng, lat) => {
      // Validate coordinates before updating marker
      if (!isValidCoordinate(lat, lng)) {
        console.error("Invalid coordinates:", lat, lng);
        return;
      }

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

    // Add search function
    const searchLocation = async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Using MapTiler Geocoding API
        const response = await fetch(
          `https://api.maptiler.com/geocoding/${encodeURIComponent(
            query
          )}.json?key=NxvpwMoXuYLINUijkWEc&limit=5`
        );
        const data = await response.json();

        if (data.features) {
          setSearchResults(
            data.features.map((feature) => ({
              id: feature.id,
              name: feature.place_name,
              coordinates: feature.center,
            }))
          );
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Handle search input change with debounce
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        searchLocation(searchQuery);
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Handle search result selection
    const handleSearchResultClick = (result) => {
      const [lng, lat] = result.coordinates;
      if (isValidCoordinate(lat, lng) && map) {
        updateMarker(map, lng, lat);
        setSearchQuery(result.name);
        setSearchResults([]);
      }
    };

    useEffect(() => {
      let mapInstance;

      const initializeMap = async () => {
        try {
          mapInstance = new maplibregl.Map({
            container: mapContainer.current,
            style:
              "https://api.maptiler.com/maps/streets/style.json?key=NxvpwMoXuYLINUijkWEc",
            center: getInitialCenter(), // Use the validated center
            zoom: zoom,
          });

          mapInstance.on("load", async () => {
            setMap(mapInstance);
            try {
              let position;
              const lat =
                typeof initialLat === "string"
                  ? parseFloat(initialLat)
                  : initialLat;
              const lng =
                typeof initialLng === "string"
                  ? parseFloat(initialLng)
                  : initialLng;

              if (isValidCoordinate(lat, lng)) {
                position = { coords: { latitude: lat, longitude: lng } };
              } else {
                position = await getCurrentPosition();
              }

              const { latitude, longitude } = position.coords;
              if (isValidCoordinate(latitude, longitude)) {
                updateMarker(mapInstance, longitude, latitude);
              }
            } catch (error) {
              console.log("Geolocation error:", error);
              setCoords("Click on the map to select a location");
              setCoordsArabic(t("Click on the map to select a location"));
            }
          });

          mapInstance.on("click", (e) => {
            if (!confirmedLocation) {
              const { lng, lat } = e.lngLat;
              if (isValidCoordinate(lat, lng)) {
                updateMarker(mapInstance, lng, lat);
              }
            }
          });
        } catch (error) {
          console.error("Map initialization error:", error);
        }
      };

      const getCurrentPosition = () => {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          });
        });
      };

      initializeMap();

      return () => {
        if (mapInstance) {
          try {
            if (markerRef.current) markerRef.current.remove();
            mapInstance.remove();
          } catch (error) {
            console.error("Error cleaning up map:", error);
          }
        }
      };
    }, [confirmedLocation, initialLat, initialLng]);

    const handleConfirm = () => {
      if (markerRef.current) {
        const lngLat = markerRef.current.getLngLat();
        const lat = lngLat.lat;
        const lng = lngLat.lng;

        if (isValidCoordinate(lat, lng)) {
          onLocationSelect(lat, lng);
          setConfirmedLocation(lngLat);
          handleLocationSelect(lat, lng);
          setGeoLocation({
            x: lat.toFixed(6),
            y: lng.toFixed(6),
          });
        }
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
        {/* Add search input */}
        <div className="location-search">
          <input
            type="text"
            placeholder={t("Search for a location...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="location-search-input"
          />
          {isSearching && (
            <div className="search-loading">{t("Searching...")}</div>
          )}

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="search-result-item"
                  onClick={() => handleSearchResultClick(result)}
                >
                  {result.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          ref={mapContainer}
          className="map-container"
          style={{ width: "100%", height: "300px" }}
        />
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
              {t("Confirm Location")}
            </button>
          ) : (
            <>
              <div className="location-confirmed">
                {t("Location confirmed!")}
              </div>
              <button className="reset-location-button" onClick={handleReset}>
                {t("Change Location")}
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
    }
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
        label: "Region",
        name: "region",
        placeholder: "Region",
        required: true,
        options: geoData
          ? Object.keys(geoData).map((region) => ({
              value: region,
              name:
                i18n.language === "ar"
                  ? geoData[region].ar
                  : geoData[region].en,
            }))
          : [],
        onChange: handleRegionChange,
        value: branch?.region || "",
      },
      {
        type: "dropdown",
        label: "City",
        name: "city",
        placeholder: "City",
        required: true,
        options: getCityOptions.map((opt) => ({
          value: opt.value,
          name:
            i18n.language === "ar"
              ? geoData && geoData[selectedRegion]?.cities?.[opt.value]?.ar
              : opt.name,
        })),
        onChange: handleCityChange,
        value: branch?.city || "",
        disabled: !selectedRegion,
      },
      {
        type: "dropdown",
        label: "District",
        name: "district",
        placeholder: "District",
        required: true,
        options: getDistrictOptions.map((opt) => ({
          value: opt.value,
          name:
            i18n.language === "ar" &&
            geoData &&
            selectedRegion &&
            selectedCity &&
            geoData[selectedRegion]?.cities?.[selectedCity]?.districts?.[
              opt.value
            ]?.ar
              ? geoData[selectedRegion].cities[selectedCity].districts[
                  opt.value
                ].ar
              : opt.name,
        })),
        value: branch?.district || "",
        disabled: !selectedCity,
      },
      {
        type: "dropdown",
        label: "Location Type",
        name: "locationType",
        placeholder: "Location Type",
        required: true,
        options: (dropdownOptions?.locationType || []).map((item) => ({
          value: item.value,
          name: i18n.language === "ar" ? item.valueLc : item.value,
        })),
      },
      {
        type: "text",
        label: "Location Type (Other)",
        name: "locationTypeOther",
        placeholder: "Location Type (Other)",
        required: true,
        // hidden: branch?.locationType !== "Others (specify)",
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
        label: "Branch Region",
        name: "branch",
        placeholder: "Branch",
        required: true,
        options: (dropdownOptions?.branch || []).map((item) => ({
          value: item.value,
          name: i18n.language === "ar" ? item.valueLc : item.value,
        })),
      },
    ],
    [geoData, selectedRegion, selectedCity, branch, dropdownOptions]
  );
  console.log("customer", customer);
  const hasCheckboxUpdate =
    inApproval && workflowData && "isDeliveryChargesApplicable" in workflowData;
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
        {isFirstBranch && mode !== "edit" && (
          <div className="form-group">
            <label className="checkbox-group-label">
              <input
                type="checkbox"
                id="sameAsCustomer"
                name="sameAsCustomer"
                checked={
                  branch?.street === customer?.street &&
                  branch?.buildingName === customer?.buildingName &&
                  branch?.city === customer?.city &&
                  branch?.region === customer?.region &&
                  branch?.geolocation === customer?.geolocation
                }
                onChange={(e) => setSameAsCustomer(e.target.checked)}
              />
              {t("Same as Customer Details")}
            </label>
          </div>
        )}
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
          if (
            field.name === "locationTypeOther" &&
            branch?.locationType !== "Others (specify)"
          ) {
            return null;
          }
          const hasUpdate =
            (mode === "edit" && inApproval && workflowData
              ? field.name in workflowData
              : false) ||
            (mode === "edit" &&
              inApproval &&
              branch.branchStatus === "pending");
          const currentValue = originalBranch?.[field.name] || "";
          const value = hasUpdate
            ? workflowData?.[field.name]
            : getFieldValue(field.name);

          return (
            <div
              className={`form-group ${hasUpdate ? "pending-update" : ""}`}
              key={index}
            >
              {isV(field.name) && !field?.hidden && (
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
                      (customerFormMode === "custDetailsEdit" && !hasUpdate) ||
                      (customerFormMode === "custDetailsAdd" && inApproval)
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
                            className={
                              field.name === "branchNameLc"
                                ? "branch-arabic-field"
                                : ""
                            }
                            style={
                              hasUpdate
                                ? {
                                    backgroundColor: "#fff8e1",
                                    ...(field.name === "branchNameLc" && {
                                      textAlign: "right",
                                      direction: "rtl",
                                    }),
                                  }
                                : {
                                    fontSize: "12px",
                                    padding: "3px 6px",
                                    height: "30px",
                                    border: "1px solid #D9D9D6",
                                    borderRadius: "4px",
                                    width: "140px",
                                    rowGap: "10px",
                                    columnGap: "5px",
                                    ...(field.name === "branchNameLc" && {
                                      textAlign: "right",
                                      direction: "rtl",
                                    }),
                                  }
                            }
                            disabled={
                              (customerFormMode === "custDetailsEdit" &&
                                !hasUpdate) ||
                              (customerFormMode === "custDetailsAdd" &&
                                inApproval)
                            }
                            hidden={field?.hidden}
                          />
                        );
                      case "dropdown":
                        return (
                          <>
                            {isV(field.name) && (
                              <SearchableDropdown
                                name={field.name}
                                value={branch?.[field.name]}
                                onChange={
                                  field.onChange || handleBranchFieldChange
                                }
                                className={"branchDropDown"}
                                style={{
                                  ...(hasUpdate
                                    ? {
                                        backgroundColor: "#fff8e1",
                                      }
                                    : {}),
                                }}
                                disabled={
                                  (customerFormMode === "custDetailsEdit" &&
                                    !hasUpdate) ||
                                  (customerFormMode === "custDetailsAdd" &&
                                    inApproval) ||
                                  field.disabled
                                }
                                hidden={!isV(field.name)}
                                options={field.options}
                              ></SearchableDropdown>
                            )}
                          </>
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
                  <span className="error-message" style={{ fontSize: "12px" }}>
                    {t(formErrors[field.name])}
                  </span>
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
      <style>
        {`
          .dropdown-header:{
    width: "140px !important"}`}
      </style>
    </div>
  );
};
export default BranchDetailsForm;
