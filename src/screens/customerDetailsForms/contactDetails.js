import React, { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { fetchDropdownFromBasicsMaster } from "../../utilities/commonServices";
import "../../styles/forms.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisV,
  faChevronDown,
  faChevronRight,
  faLocationDot,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import RbacManager from "../../utilities/rbac";
import { useAuth } from "../../context/AuthContext";
import SearchableDropdown from "../../components/SearchableDropdown";
const CUSTOMER_APPROVAL_CHECKLIST_URL =
  process.env.REACT_APP_CUSTOMER_APPROVAL_CHECKLIST_URL;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function ContactDetails({
  customerData = {},
  customerContactsData = {},
  originalCustomerData = {},
  originalCustomerContactsData = {},
  onChangeCustomerContactsData,
  onChangeCustomerData,
  setGeoLocation,
  setBusinessHeadSameAsPrimary,
  mode,
  setTabsHeight,
  formErrors = {},
}) {
  // Now you can access both objects
  const { t, i18n } = useTranslation();
  // const [businessHeadSameAsPrimary, setBusinessHeadSameAsPrimary] =
  //   useState(false);

  // Dropdown state
  const dropdownFields = ["zone", "branch"];
  const [basicMasterLists, setBasicMasterLists] = useState({});
  const [selectedRegion, setSelectedRegion] = useState(customerData?.region);
  const [selectedCity, setSelectedCity] = useState(customerData?.city);
  const [geoData, setGeoData] = useState(null);

  const { token, user, isAuthenticated, logout, loading } = useAuth();

  const rbacMgr = new RbacManager(
    user?.userType == "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    mode === "add" || customerData?.customerStatus === "new"
      ? "custDetailsAdd"
      : "custDetailsEdit"
  );
  console.log("RBAC Manager:", rbacMgr);

  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);
  useEffect(() => {
    const fetchData = async () => {
      const listOfBasicsMaster = await fetchDropdownFromBasicsMaster(
        dropdownFields
      );
      setBasicMasterLists(listOfBasicsMaster);
    };
    fetchData();
    setTabsHeight("auto");
  }, []);
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
  const getBindingValue = (contactType, fieldname) => {
    if (Array.isArray(customerContactsData.data)) {
      const contact = customerContactsData.data.find(
        (item) => item.contactType === contactType
      );
      return contact ? contact[fieldname] || "" : "";
    }
    return "";
  };

  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

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
          y: lngLat.lng.toFixed(6),
        });
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

  // const getCityOptions = useCallback(() => {
  //   if (!selectedRegion || !geoData) return [];
  //   return Object.keys(geoData?.[selectedRegion]).map((city) => ({
  //     value: city,
  //     name: city,
  //   }));
  // }, [selectedRegion, geoData]);
  const getCityOptions = useCallback(() => {
    if (!selectedRegion || !geoData || !geoData[selectedRegion]?.cities)
      return [];
    return Object.keys(geoData[selectedRegion].cities).map((city) => ({
      value: city,
      name:
        i18n.language === "ar"
          ? geoData[selectedRegion].cities[city].ar
          : geoData[selectedRegion].cities[city].en,
    }));
  }, [selectedRegion, geoData]);

  // Get districts based on selected city
  // const getDistrictOptions = useCallback(() => {
  //   if (!selectedRegion || !selectedCity || !geoData) return [];
  //   return geoData[selectedRegion][selectedCity].map((district) => ({
  //     value: district,
  //     name: district,
  //   }));
  // }, [selectedRegion, selectedCity, geoData]);
  const getDistrictOptions = useCallback(() => {
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
  }, [selectedRegion, selectedCity, geoData]);
  // Handle region selection
  const handleRegionChange = (e) => {
    const { name, value } = e.target;
    console.log("value", value);
    setSelectedRegion(value || null);
    setSelectedCity(null); // Reset city when region changes
    // Update your form data as needed
    onChangeCustomerData({
      target: {
        name: "region",
        value: value || null,
      },
    });
  };

  // Handle city selection
  const handleCityChange = (e) => {
    const { name, value } = e.target;
    setSelectedCity(value || null);
    // Update your form data as needed
    onChangeCustomerData({
      target: {
        name: "city",
        value: value || null,
      },
    });
  };

  // Handle district selection
  const handleDistrictChange = (e) => {
    const { name, value } = e.target;
    onChangeCustomerData({
      target: {
        name: "district",
        value: value || null,
      },
    });
  };

  return (
    <div className="customer-onboarding-form-grid">
      {isV("customerApprovalChecklist") && (
        <div className="form-main-header">
          <a
            href={CUSTOMER_APPROVAL_CHECKLIST_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!CUSTOMER_APPROVAL_CHECKLIST_URL) {
                e.preventDefault();
                alert(t("No checklist URL configured."));
              }
            }}
          >
            {t("Customer Approval Checklist")}
          </a>
        </div>
      )}
      {/* Primary Contact Details Header */}
      <h3 className="form-header full-width">{t("Primary Contact Details")}</h3>
      <div className="form-group">
        <label htmlFor="primaryContactName">
          {t("Primary Contact Name")}
          <span className="required-field">*</span>
          {originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.primaryContactName !=
              customerContactsData?.primaryContactName &&
            mode === "edit" && <span className="update-badge">Updated</span>}
        </label>
        <input
          type="text"
          id="primaryContactName"
          name="primaryContactName"
          className={`text-field small ${
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.primaryContactName !=
              customerContactsData?.primaryContactName &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter name")}
          value={customerContactsData?.primaryContactName || ""}
          onChange={onChangeCustomerContactsData}
          disabled={
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.primaryContactName ===
              customerContactsData?.primaryContactName &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerContactsData &&
          customerContactsData &&
          originalCustomerContactsData?.primaryContactName !=
            customerContactsData?.primaryContactName &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerContactsData?.primaryContactName || "(empty)"}
            </div>
          )}
        {formErrors.primaryContactName && (
          <div className="error">{formErrors.primaryContactName}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="primaryContactDesignation">
          {t("Designation")}
          <span className="required-field">*</span>
          {originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.primaryContactDesignation !=
              customerContactsData?.primaryContactDesignation &&
            mode === "edit" && <span className="update-badge">Updated</span>}
        </label>
        <input
          type="text"
          id="primaryContactDesignation"
          name="primaryContactDesignation"
          className={`text-field small ${
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.primaryContactDesignation !=
              customerContactsData?.primaryContactDesignation &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter designation")}
          value={customerContactsData?.primaryContactDesignation || ""}
          onChange={onChangeCustomerContactsData}
          disabled={
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.primaryContactDesignation ===
              customerContactsData?.primaryContactDesignation &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerContactsData &&
          customerContactsData &&
          originalCustomerContactsData?.primaryContactDesignation !=
            customerContactsData?.primaryContactDesignation &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerContactsData?.primaryContactDesignation ||
                "(empty)"}
            </div>
          )}
        {formErrors.primaryContactDesignation && (
          <div className="error">{formErrors.primaryContactDesignation}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="primaryContactEmail">
          {t("Email")}
          <span className="required-field">*</span>
          {originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.primaryContactEmail !=
              customerContactsData?.primaryContactEmail &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="primaryContactEmail"
          name="primaryContactEmail"
          className={`text-field small ${
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.primaryContactEmail !=
              customerContactsData?.primaryContactEmail &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter email")}
          value={customerContactsData?.primaryContactEmail || ""}
          onChange={onChangeCustomerContactsData}
          disabled={
            (originalCustomerContactsData &&
              customerContactsData &&
              originalCustomerContactsData?.primaryContactEmail ===
                customerContactsData?.primaryContactEmail &&
              mode === "edit" &&
              customerData?.customerStatus !== "pending") ||
            true
          }
          required
        />
        {originalCustomerContactsData &&
          customerContactsData &&
          originalCustomerContactsData?.primaryContactEmail !=
            customerContactsData?.primaryContactEmail &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerContactsData?.primaryContactEmail || "(empty)"}
            </div>
          )}
        {formErrors.primaryContactEmail && (
          <div className="error">{formErrors.primaryContactEmail}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="primaryContactMobile">
          {t("Mobile")}
          <span className="required-field">*</span>
          {originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.primaryContactMobile !=
              customerContactsData?.primaryContactMobile &&
            mode === "edit" && <span className="update-badge">Updated</span>}
        </label>
        <input
          type="text"
          id="primaryContactMobile"
          name="primaryContactMobile"
          className={`text-field small ${
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.primaryContactMobile !=
              customerContactsData?.primaryContactMobile &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter Mobile number")}
          value={customerContactsData?.primaryContactMobile || ""}
          onChange={onChangeCustomerContactsData}
          disabled={
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.primaryContactMobile ===
              customerContactsData?.primaryContactMobile &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerContactsData &&
          customerContactsData &&
          originalCustomerContactsData?.primaryContactMobile !=
            customerContactsData?.primaryContactMobile &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerContactsData?.primaryContactMobile || "(empty)"}
            </div>
          )}
        {formErrors.primaryContactMobile && (
          <div className="error">{formErrors.primaryContactMobile}</div>
        )}
      </div>

      {/* Business Head Header */}
      <h3 className="form-header full-width">{t("Business Head")}</h3>
      <div className="form-group">
        <label className="checkbox-group-label">
          <input
            type="checkbox"
            id="businessHeadSameAsPrimary"
            name="businessHeadSameAsPrimary"
            checked={
              customerContactsData?.businessHeadName ===
                customerContactsData?.primaryContactName &&
              customerContactsData?.businessHeadDesignation ===
                customerContactsData?.primaryContactDesignation &&
              customerContactsData?.businessHeadEmail ===
                customerContactsData?.primaryContactEmail &&
              customerContactsData?.businessHeadMobile ===
                customerContactsData?.primaryContactMobile
            }
            onChange={(e) => setBusinessHeadSameAsPrimary(e.target.checked)}
          />
          {`\t  ${t("Same as Primary Contact Details")}`}
        </label>
      </div>
      <div className="form-group" />
      <div className="form-group">
        <label htmlFor="businessHeadName">
          {t("Business Head Name")}
          <span className="required-field">*</span>
          {originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.businessHeadName !=
              customerContactsData?.businessHeadName &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="businessHeadName"
          name="businessHeadName"
          className={`text-field small ${
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.businessHeadName !=
              customerContactsData?.businessHeadName &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter name")}
          value={customerContactsData?.businessHeadName || ""}
          onChange={onChangeCustomerContactsData}
          disabled={
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.businessHeadName ===
              customerContactsData?.businessHeadName &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerContactsData &&
          customerContactsData &&
          originalCustomerContactsData?.businessHeadName !=
            customerContactsData?.businessHeadName &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerContactsData?.businessHeadName || "(empty)"}
            </div>
          )}
        {formErrors.businessHeadName && (
          <div className="error">{formErrors.businessHeadName}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="businessHeadDesignation">
          {t("Designation")}
          <span className="required-field">*</span>
          {originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.businessHeadDesignation !=
              customerContactsData?.businessHeadDesignation &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="businessHeadDesignation"
          name="businessHeadDesignation"
          className={`text-field small ${
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.businessHeadDesignation !=
              customerContactsData?.businessHeadDesignation &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter designation")}
          value={customerContactsData?.businessHeadDesignation || ""}
          onChange={onChangeCustomerContactsData}
          disabled={
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.businessHeadDesignation ===
              customerContactsData?.businessHeadDesignation &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerContactsData &&
          customerContactsData &&
          originalCustomerContactsData?.businessHeadDesignation !=
            customerContactsData?.businessHeadDesignation &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerContactsData?.businessHeadDesignation ||
                "(empty)"}
            </div>
          )}
        {formErrors.businessHeadDesignation && (
          <div className="error">{formErrors.businessHeadDesignation}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="businessHeadEmail">
          {t("Email")}
          <span className="required-field">*</span>
          {originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.businessHeadEmail !=
              customerContactsData?.businessHeadEmail &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="businessHeadEmail"
          name="businessHeadEmail"
          className={`text-field small ${
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.businessHeadEmail !=
              customerContactsData?.businessHeadEmail &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter email")}
          value={customerContactsData?.businessHeadEmail || ""}
          onChange={onChangeCustomerContactsData}
          disabled={
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.businessHeadEmail ===
              customerContactsData?.businessHeadEmail &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerContactsData &&
          customerContactsData &&
          originalCustomerContactsData?.businessHeadEmail !=
            customerContactsData?.businessHeadEmail &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerContactsData?.businessHeadEmail || "(empty)"}
            </div>
          )}
        {formErrors.businessHeadEmail && (
          <div className="error">{formErrors.businessHeadEmail}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="businessHeadMobile">
          {t("Mobile")}
          <span className="required-field">*</span>
          {originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.businessHeadMobile !=
              customerContactsData?.businessHeadMobile &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="businessHeadMobile"
          name="businessHeadMobile"
          className={`text-field small ${
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.businessHeadMobile !=
              customerContactsData?.businessHeadMobile &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter Mobile number")}
          value={customerContactsData?.businessHeadMobile || ""}
          onChange={onChangeCustomerContactsData}
          disabled={
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.businessHeadMobile ===
              customerContactsData?.businessHeadMobile &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerContactsData &&
          customerContactsData &&
          originalCustomerContactsData?.businessHeadMobile !=
            customerContactsData?.businessHeadMobile &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerContactsData?.businessHeadMobile || "(empty)"}
            </div>
          )}
        {formErrors.businessHeadMobile && (
          <div className="error">{formErrors.businessHeadMobile}</div>
        )}
      </div>

      {/* Finance Head Header */}
      <h3 className="form-header full-width">{t("Finance Head")}</h3>
      <div className="form-group">
        <label htmlFor="financeHeadName">
          {t("Finance Head Name")}
          <span className="required-field">*</span>
          {originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.financeHeadName !=
              customerContactsData?.financeHeadName &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="financeHeadName"
          name="financeHeadName"
          className={`text-field small ${
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.financeHeadName !=
              customerContactsData?.financeHeadName &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter name")}
          value={customerContactsData?.financeHeadName || ""}
          onChange={onChangeCustomerContactsData}
          disabled={
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.financeHeadName ===
              customerContactsData?.financeHeadName &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerContactsData &&
          customerContactsData &&
          originalCustomerContactsData?.financeHeadName !=
            customerContactsData?.financeHeadName &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerContactsData?.financeHeadName || "(empty)"}
            </div>
          )}
        {formErrors.financeHeadName && (
          <div className="error">{formErrors.financeHeadName}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="financeHeadDesignation">
          {t("Designation")}
          <span className="required-field">*</span>
          {originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.financeHeadDesignation !=
              customerContactsData?.financeHeadDesignation &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="financeHeadDesignation"
          name="financeHeadDesignation"
          className={`text-field small ${
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.financeHeadDesignation !=
              customerContactsData?.financeHeadDesignation &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter designation")}
          value={customerContactsData?.financeHeadDesignation || ""}
          onChange={onChangeCustomerContactsData}
          disabled={
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.financeHeadDesignation ===
              customerContactsData?.financeHeadDesignation &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerContactsData &&
          customerContactsData &&
          originalCustomerContactsData?.financeHeadDesignation !=
            customerContactsData?.financeHeadDesignation &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerContactsData?.financeHeadDesignation ||
                "(empty)"}
            </div>
          )}
        {formErrors.financeHeadDesignation && (
          <div className="error">{formErrors.financeHeadDesignation}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="financeHeadEmail">
          {t("Email")}
          <span className="required-field">*</span>
          {originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.financeHeadEmail !=
              customerContactsData?.financeHeadEmail &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="financeHeadEmail"
          name="financeHeadEmail"
          className={`text-field small ${
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.financeHeadEmail !=
              customerContactsData?.financeHeadEmail &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter email")}
          value={customerContactsData?.financeHeadEmail || ""}
          onChange={onChangeCustomerContactsData}
          disabled={
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.financeHeadEmail ===
              customerContactsData?.financeHeadEmail &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerContactsData &&
          customerContactsData &&
          originalCustomerContactsData?.financeHeadEmail !=
            customerContactsData?.financeHeadEmail &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerContactsData?.financeHeadEmail || "(empty)"}
            </div>
          )}
        {formErrors.financeHeadEmail && (
          <div className="error">{formErrors.financeHeadEmail}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="financeHeadMobile">
          {t("Mobile")}
          <span className="required-field">*</span>
          {originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.financeHeadMobile !=
              customerContactsData?.financeHeadMobile &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="financeHeadMobile"
          name="financeHeadMobile"
          className={`text-field small ${
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.financeHeadMobile !=
              customerContactsData?.financeHeadMobile &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter Mobile number")}
          value={customerContactsData?.financeHeadMobile || ""}
          onChange={onChangeCustomerContactsData}
          disabled={
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.financeHeadMobile ===
              customerContactsData?.financeHeadMobile &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerContactsData &&
          customerContactsData &&
          originalCustomerContactsData?.financeHeadMobile !=
            customerContactsData?.financeHeadMobile &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerContactsData?.financeHeadMobile || "(empty)"}
            </div>
          )}
        {formErrors.financeHeadMobile && (
          <div className="error">{formErrors.financeHeadMobile}</div>
        )}
      </div>

      {/* Purchasing Head Header */}
      <h3 className="form-header full-width">{t("Purchasing Head")}</h3>
      <div className="form-group">
        <label htmlFor="purchasingHeadName">
          {t("Purchasing Head Name")}
          <span className="required-field">*</span>
          {originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.purchasingHeadName !=
              customerContactsData?.purchasingHeadName &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="purchasingHeadName"
          name="purchasingHeadName"
          className={`text-field small ${
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.purchasingHeadName !=
              customerContactsData?.purchasingHeadName &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter name")}
          value={customerContactsData?.purchasingHeadName || ""}
          onChange={onChangeCustomerContactsData}
          disabled={
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.purchasingHeadName ===
              customerContactsData?.purchasingHeadName &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerContactsData &&
          customerContactsData &&
          originalCustomerContactsData?.purchasingHeadName !=
            customerContactsData?.purchasingHeadName &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerContactsData?.purchasingHeadName || "(empty)"}
            </div>
          )}
        {formErrors.purchasingHeadName && (
          <div className="error">{formErrors.purchasingHeadName}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="purchasingHeadDesignation">
          {t("Designation")}
          <span className="required-field">*</span>
          {originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.purchasingHeadDesignation !=
              customerContactsData?.purchasingHeadDesignation &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="purchasingHeadDesignation"
          name="purchasingHeadDesignation"
          className={`text-field small ${
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.purchasingHeadDesignation !=
              customerContactsData?.purchasingHeadDesignation &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter designation")}
          value={customerContactsData?.purchasingHeadDesignation || ""}
          onChange={onChangeCustomerContactsData}
          disabled={
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.purchasingHeadDesignation ===
              customerContactsData?.purchasingHeadDesignation &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerContactsData &&
          customerContactsData &&
          originalCustomerContactsData?.purchasingHeadDesignation !=
            customerContactsData?.purchasingHeadDesignation &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerContactsData?.purchasingHeadDesignation ||
                "(empty)"}
            </div>
          )}
        {formErrors.purchasingHeadDesignation && (
          <div className="error">{formErrors.purchasingHeadDesignation}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="purchasingHeadEmail">
          {t("Email")}
          <span className="required-field">*</span>
          {originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.purchasingHeadEmail !=
              customerContactsData?.purchasingHeadEmail &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="purchasingHeadEmail"
          name="purchasingHeadEmail"
          className={`text-field small ${
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.purchasingHeadEmail !=
              customerContactsData?.purchasingHeadEmail &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter email")}
          value={customerContactsData?.purchasingHeadEmail || ""}
          onChange={onChangeCustomerContactsData}
          disabled={
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.purchasingHeadEmail ===
              customerContactsData?.purchasingHeadEmail &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerContactsData &&
          customerContactsData &&
          originalCustomerContactsData?.purchasingHeadEmail !=
            customerContactsData?.purchasingHeadEmail &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerContactsData?.purchasingHeadEmail || "(empty)"}
            </div>
          )}
        {formErrors.purchasingHeadEmail && (
          <div className="error">{formErrors.purchasingHeadEmail}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="purchasingHeadMobile">
          {t("Mobile")}
          <span className="required-field">*</span>
          {originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.purchasingHeadMobile !=
              customerContactsData?.purchasingHeadMobile &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="purchasingHeadMobile"
          name="purchasingHeadMobile"
          className={`text-field small ${
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.purchasingHeadMobile !=
              customerContactsData?.purchasingHeadMobile &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter Mobile number")}
          value={customerContactsData?.purchasingHeadMobile || ""}
          onChange={onChangeCustomerContactsData}
          disabled={
            originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.purchasingHeadMobile ===
              customerContactsData?.purchasingHeadMobile &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerContactsData &&
          customerContactsData &&
          originalCustomerContactsData?.purchasingHeadMobile !=
            customerContactsData?.purchasingHeadMobile &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {originalCustomerContactsData?.purchasingHeadMobile || "(empty)"}
            </div>
          )}
        {formErrors.purchasingHeadMobile && (
          <div className="error">{formErrors.purchasingHeadMobile}</div>
        )}
      </div>

      {/* Business Address Header */}
      <h3 className="form-header full-width">{t("Business Address")}</h3>
      <div className="form-group">
        <label htmlFor="buildingName">
          {t("Building Name")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.buildingName != customerData?.buildingName &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="buildingName"
          name="buildingName"
          className={`text-field small ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.buildingName != customerData?.buildingName &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter building name")}
          value={customerData?.buildingName || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.buildingName === customerData?.buildingName &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.buildingName != customerData?.buildingName &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.buildingName || "(empty)"}
            </div>
          )}
        {formErrors.buildingName && (
          <div className="error">{formErrors.buildingName}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="street">
          {t("Street")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.street != customerData?.street &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="street"
          name="street"
          className={`text-field small ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.street != customerData?.street &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter street")}
          value={customerData?.street || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.street === customerData?.street &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.street != customerData?.street &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.street || "(empty)"}
            </div>
          )}
        {formErrors.street && <div className="error">{formErrors.street}</div>}
      </div>
      {/* region dropdown */}
      <div className="form-group">
        <label htmlFor="region">
          {t("Region")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.region != customerData?.region &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <SearchableDropdown
          name="region"
          // options={basicMasterLists?.region || []}
          options={
            geoData
              ? Object.keys(geoData).map((region) => ({
                  value: region,
                  name:
                    i18n.language === "ar"
                      ? geoData[region].ar
                      : geoData[region].en,
                }))
              : []
          }
          value={customerData?.region || ""}
          onChange={handleRegionChange}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.region === customerData?.region &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          className={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.region != customerData?.region &&
            mode === "edit"
              ? "update-field"
              : ""
          }
          placeholder={t("Enter region")}
          required
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.region != customerData?.region &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.region || "(empty)"}
            </div>
          )}
        {formErrors.region && <div className="error">{formErrors.region}</div>}
      </div>

      {/* city dropdown */}
      <div className="form-group">
        <label htmlFor="city">
          {t("City")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.city != customerData?.city &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <SearchableDropdown
          name="city"
          options={getCityOptions()}
          value={customerData?.city || ""}
          onChange={handleCityChange}
          disabled={
            (originalCustomerData &&
              customerData &&
              originalCustomerData?.city === customerData?.city &&
              mode === "edit" &&
              customerData?.customerStatus !== "pending") ||
            !selectedRegion
          }
          className={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.city != customerData?.city &&
            mode === "edit"
              ? "update-field"
              : ""
          }
          placeholder={t("Enter city")}
          required
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.city != customerData?.city &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.city || "(empty)"}
            </div>
          )}
        {formErrors.city && <div className="error">{formErrors.city}</div>}
      </div>
      {/*district dropdown*/}
      <div className="form-group">
        <label htmlFor="district">
          {t("District")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.district != customerData?.district &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <SearchableDropdown
          name="district"
          options={getDistrictOptions()}
          value={customerData?.district || ""}
          onChange={handleDistrictChange}
          disabled={
            (originalCustomerData &&
              customerData &&
              originalCustomerData?.district === customerData?.district &&
              mode === "edit" &&
              customerData?.customerStatus !== "pending") ||
            !selectedCity
          }
          className={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.district != customerData?.district &&
            mode === "edit"
              ? "update-field"
              : ""
          }
          placeholder={t("Enter district")}
          required
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.district != customerData?.district &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.district || "(empty)"}
            </div>
          )}
        {formErrors.district && (
          <div className="error">{formErrors.district}</div>
        )}
      </div>

      {/* zone dropdown */}
      <div className="form-group">
        <label htmlFor="zone">
          {t("Zone")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.zone != customerData?.zone &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <SearchableDropdown
          name="zone"
          options={basicMasterLists?.zone || []}
          value={customerData?.zone || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.zone === customerData?.zone &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          className={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.zone != customerData?.zone &&
            mode === "edit"
              ? "update-field"
              : ""
          }
          placeholder={t("Enter zone")}
          required
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.zone != customerData?.zone &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.zone || "(empty)"}
            </div>
          )}
        {formErrors.zone && <div className="error">{formErrors.zone}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="pincode">
          {t("Pincode")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.pincode != customerData?.pincode &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <input
          type="text"
          id="pincode"
          name="pincode"
          className={`text-field small ${
            originalCustomerData &&
            customerData &&
            originalCustomerData?.pincode != customerData?.pincode &&
            mode === "edit"
              ? "update-field"
              : ""
          }`}
          placeholder={t("Enter pincode")}
          value={customerData?.pincode || ""}
          onChange={onChangeCustomerData}
          disabled={
            originalCustomerData &&
            customerData &&
            originalCustomerData?.pincode === customerData?.pincode &&
            mode === "edit" &&
            customerData?.customerStatus !== "pending"
          }
          required
        />
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.pincode != customerData?.pincode &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.pincode || "(empty)"}
            </div>
          )}
        {formErrors.pincode && (
          <div className="error">{formErrors.pincode}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="geolocation">
          {t("Geolocation")}
          <span className="required-field">*</span>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.geolocation != customerData?.geolocation &&
            mode === "edit" && (
              <span className="update-badge">{t("Updated")}</span>
            )}
        </label>
        <div className="location-input-container">
          <input
            name="geolocation"
            value={
              // selectedLocation
              //   ? `${selectedLocation.lat.toFixed(
              //       6
              //     )}, ${selectedLocation.lng.toFixed(6)}` :
              customerData?.geolocation
                ? getLocationDisplay(customerData.geolocation)
                : "Select Location"
            }
            // value={getLocationDisplay(branch[field.name])}
            placeholder={t("Select Location")}
            onChange={onChangeCustomerData}
            disabled={
              originalCustomerData &&
              customerData &&
              originalCustomerData?.geolocation === customerData?.geolocation &&
              mode === "edit" &&
              customerData?.customerStatus !== "pending"
            }
            className={`text-field small ${
              originalCustomerData &&
              customerData &&
              originalCustomerData?.geolocation != customerData?.geolocation &&
              mode === "edit"
                ? "update-field"
                : ""
            }`}
            readOnly
            required
          />

          <button
            className="location-picker-button"
            //   disabled={!isE(field.name, transformedCustomer?.isApprovalMode, hasUpdate && customer?.workflowData?.updates
            //     ? field.name in customer.workflowData.updates
            //     : false)}
            // disabled={
            //   customerFormMode === "custDetailsEdit" && !hasUpdate
            // }
            onClick={() => setShowMap(true)}
          >
            <FontAwesomeIcon icon={faLocationDot} />
          </button>
        </div>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.geolocation != customerData?.geolocation &&
          mode === "edit" && (
            <div className="current-value">
              Previous:{" "}
              {typeof originalCustomerData?.geolocation === "object"
                ? JSON.stringify(originalCustomerData?.geolocation)
                : originalCustomerData?.geolocation || "(empty)"}
            </div>
          )}
        {formErrors.geolocation && (
          <div className="error">{formErrors.geolocation}</div>
        )}
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
              initialLat={customerData?.geolocation?.x}
              initialLng={customerData?.geolocation?.y}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ContactDetails;
