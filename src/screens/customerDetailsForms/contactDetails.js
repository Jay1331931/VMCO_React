import React, { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { fetchDropdownFromBasicsMaster } from "../../utilities/commonServices";
import "../../styles/forms.css";
import "react-phone-number-input/style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisV,
  faChevronDown,
  faChevronRight,
  faLocationDot,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import RbacManager from "../../utilities/rbac";
import { useAuth } from "../../context/AuthContext";
import SearchableDropdown from "../../components/SearchableDropdown";
import Constants from "../../constants";
import PhoneInput from "react-phone-number-input";
import EditIcon from "@mui/icons-material/Edit";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import maplibregl from "maplibre-gl";

// Google Maps API key - replace with your actual key
const GOOGLE_MAPS_API_KEY =
  process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY";
const OLA_MAPS_API_KEY =
  process.env.REACT_APP_OLA_MAPS_API_KEY || "YOUR_OLA_MAPS_API_KEY";
const CUSTOMER_APPROVAL_CHECKLIST_URL =
  Constants.DOCUMENTS_NAME.CUSTOMER_APPROVAL_CHECKLIST;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const CUSTOMER_APPROVAL_CHECKLIST =
  Constants.DOCUMENTS_NAME.CUSTOMER_APPROVAL_CHECKLIST;

function ContactDetails({
  customerData = {},
  customerContactsData = {},
  originalCustomerData = {},
  originalCustomerContactsData = {},
  onChangeCustomerContactsData,
  onChangeCustomerData,
  verifiedData = {},
  onChangeVerifiedData,
  setGeoLocation,
  setBusinessHeadSameAsPrimary,
  mode,
  setTabsHeight,
  formErrors = {},
}) {
  const { t, i18n } = useTranslation();
  const dropdownFields = ["zone", "branch"];
  const [basicMasterLists, setBasicMasterLists] = useState({});
  const [selectedRegion, setSelectedRegion] = useState(customerData?.region);
  const [selectedCity, setSelectedCity] = useState(customerData?.city);
  const [geoData, setGeoData] = useState(null);
  const [currentEmail, setcurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { token, user, isAuthenticated, logout, loading } = useAuth();
  const [popup, setPopup] = useState(false);
  const rbacMgr = new RbacManager(
    user?.userType == "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    mode === "add" || customerData?.customerStatus === "new"
      ? "custDetailsAdd"
      : "custDetailsEdit"
  );

  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  useEffect(() => {
    const fetchData = async () => {
      const listOfBasicsMaster = await fetchDropdownFromBasicsMaster(
        dropdownFields,
        token
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
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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
    const [map, setMap] = useState(null);
    const { t, i18n } = useTranslation();
    const [coords, setCoords] = useState("Detecting your location...");
    const [coordsArabic, setCoordsArabic] = useState(
      t("Detecting your location...")
    );
    const [defaultCenter] = useState({ lat: 12.9716, lng: 77.5946 }); // Default center for Google Maps
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [marker, setMarker] = useState(null);

    // Search states
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [manualLat, setManualLat] = useState("");
    const [manualLng, setManualLng] = useState("");
    const [showManualInput, setShowManualInput] = useState(false);

    // Google Maps services
    const [autocompleteService, setAutocompleteService] = useState(null);
    const [placesService, setPlacesService] = useState(null);
    const [geocoder, setGeocoder] = useState(null);

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

    // Initialize Google Maps services
    useEffect(() => {
      if (window.google) {
        setAutocompleteService(new window.google.maps.places.AutocompleteService());
        setPlacesService(new window.google.maps.places.PlacesService(document.createElement('div')));
        setGeocoder(new window.google.maps.Geocoder());
      }
    }, []);

    // Google Places Autocomplete
    const searchLocation = async (query) => {
      if (!query.trim() || !autocompleteService) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        autocompleteService.getPlacePredictions(
          {
            input: query,
            types: ['geocode', 'establishment']
          },
          (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setSearchResults(predictions);
            } else {
              setSearchResults([]);
            }
            setIsSearching(false);
          }
        );
      } catch (error) {
        console.error("Error during autocomplete:", error);
        setSearchResults([]);
        setIsSearching(false);
      }
    };

    const handlePlaceSelect = async (place) => {
      setSearchQuery(place.description);
      setSearchResults([]);

      try {
        if (!placesService) return;

        const request = {
          placeId: place.place_id,
          fields: ['geometry', 'name', 'formatted_address']
        };

        placesService.getDetails(request, (placeDetails, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && placeDetails.geometry) {
            const lat = placeDetails.geometry.location.lat();
            const lng = placeDetails.geometry.location.lng();
            
            if (isValidCoordinate(lat, lng) && map) {
              moveMarkerToLocation(lat, lng);
            }
          }
        });
      } catch (error) {
        console.error("Error fetching place details:", error);
      }
    };

    // Function to move marker to specific location
    const moveMarkerToLocation = (lat, lng, mapRef = map) => {
      if (!mapRef) return;

      // Remove existing marker
      if (marker) {
        marker.setMap(null);
      }

      // Create new draggable marker
      const newMarker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapRef,
        draggable: true,
      });

      // Add drag end event listener
      newMarker.addListener("dragend", () => {
        const position = newMarker.getPosition();
        const newLat = position.lat();
        const newLng = position.lng();

        setCoords(
          `Latitude: ${newLat.toFixed(6)}, Longitude: ${newLng.toFixed(6)}`
        );
        setCoordsArabic(
          `خط العرض: ${newLat.toFixed(6)}, خط الطول: ${newLng.toFixed(6)}`
        );
        setSelectedLocation({ lat: newLat, lng: newLng });
        setManualLat(newLat.toFixed(6));
        setManualLng(newLng.toFixed(6));
      });

      setMarker(newMarker);
      setSelectedLocation({ lat, lng });
      setCoords(
        `Latitude: ${Number(lat).toFixed(6)}, Longitude: ${Number(lng).toFixed(6)}`
      );
      setCoordsArabic(
        `خط العرض: ${Number(lat).toFixed(6)}, خط الطول: ${Number(lng).toFixed(6)}`
      );
      
      // Update manual input fields
      setManualLat(Number(lat).toFixed(6));
      setManualLng(Number(lng).toFixed(6));
      // Center map on the selected location
      mapRef.setCenter({ lat, lng });
      mapRef.setZoom(14);
    };

    const handleManualCoordinates = () => {
      const lat = parseFloat(manualLat);
      const lng = parseFloat(manualLng);

      if (isValidCoordinate(lat, lng)) {
        moveMarkerToLocation(lat, lng);
        // setShowManualInput(false);
      }
      //  else {
      //   alert("Please enter valid coordinates:\nLatitude: -90 to 90\nLongitude: -180 to 180");
      // }
    };

    // Initialize Google Map
    useEffect(() => {
      let mapInstance;

      const initializeMap = () => {
        try {
          if (!window.google) {
            console.error("Google Maps API not loaded");
            return;
          }

          // Determine initial center
          let initialCenter = defaultCenter;
          if (initialLat && initialLng) {
            initialCenter = { lat: initialLat, lng: initialLng };
            setManualLat(Number(initialLat).toFixed(6));
            setManualLng(Number(initialLng).toFixed(6));
          }

          mapInstance = new window.google.maps.Map(mapContainer.current, {
            center: initialCenter,
            zoom: 12,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
          });

          setMap(mapInstance);

          // Add initial marker if coordinates exist
          if (initialLat && initialLng) {
            moveMarkerToLocation(initialLat, initialLng, mapInstance);
          } else {
            setCoords("Click on the map to select a location");
            setCoordsArabic("انقر على الخريطة لتحديد موقع");
          }

          // Add click listener to map
          mapInstance.addListener("click", (e) => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            moveMarkerToLocation(lat, lng, mapInstance);
          });

        } catch (error) {
          console.error("Map initialization error:", error);
        }
      };

      // Load Google Maps script if not already loaded
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = initializeMap;
        document.head.appendChild(script);
      } else {
        initializeMap();
      }

      return () => {
        if (mapInstance) {
          try {
            if (marker) marker.setMap(null);
          } catch (error) {
            console.error("Error cleaning up map:", error);
          }
        }
      };
    }, []);

    // Search debounce effect
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        if (searchQuery.trim()) {
          searchLocation(searchQuery);
        } else {
          setSearchResults([]);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    useEffect(() => {
  handleManualCoordinates();
}, [manualLat, manualLng]);
    const handleConfirm = () => {
      if (selectedLocation) {
        const { lat, lng } = selectedLocation;

        if (isValidCoordinate(lat, lng)) {
          // Call the parent component's callback
          onLocationSelect(lat, lng);

          // Show confirmation message
          setCoords(
            `Location confirmed! Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`
          );
          setCoordsArabic(
            `تم تأكيد الموقع! خط العرض: ${lat.toFixed(6)}, خط الطول: ${lng.toFixed(6)}`
          );
          setGeoLocation({
            x: lat.toFixed(6),
            y: lng.toFixed(6),
          });
          setShowMap(false)
          console.log("Location confirmed:", { lat, lng });
        }
      } else {
        setCoords("Please select a location first");
        setCoordsArabic("يرجى تحديد موقع أولاً");
      }
    };

    const handleReset = () => {
      // Remove marker
      if (marker) {
        marker.setMap(null);
        setMarker(null);
      }

      // Reset states
      setSelectedLocation(null);
      setCoords("Click on the map to select a location");
      setCoordsArabic("انقر على الخريطة لتحديد موقع");
      setSearchQuery("");
      setSearchResults([]);
      setManualLat("");
      setManualLng("");
      setShowManualInput(false);
    };

    return (
      <div className="location-picker-container">
        {/* Search input */}
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
              {searchResults.map((place, index) => (
                <div
                  key={place.place_id || index}
                  className="search-result-item"
                  onClick={() => handlePlaceSelect(place)}
                >
                  {place.description}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Coordinates Input */}
        <div className="manual-coordinates-section">
          <button
            type="button"
            className="toggle-manual-input-btn"
            onClick={() => setShowManualInput(!showManualInput)}
          >
            {showManualInput ? t("Hide Manual Input") : t("Enter Coordinates Manually")}
          </button>

          {showManualInput && (
            <div className="manual-input-fields">
              <div className="coord-input-group">
                <label>{t("Latitude")}:</label>
                <input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  placeholder="e.g., 12.9716"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  className="coord-input"
                />
              </div>
              <div className="coord-input-group">
                <label>{t("Longitude")}:</label>
                <input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  placeholder="e.g., 77.5946"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  className="coord-input"
                />
              </div>
              <button
                type="button"
                 onClick={() => {
    handleManualCoordinates();
    setShowManualInput(false);
  }}
                className="apply-coordinates-btn"
                disabled={!manualLat || !manualLng}
              >
                {t("Apply Coordinates")}
              </button>
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
          <button
            className="confirm-location-button"
            onClick={handleConfirm}
            disabled={!selectedLocation}
          >
            {t("Confirm Location")}
          </button>

          {/* <button className="reset-location-button" onClick={handleReset}>
            {t("Reset Location")}
          </button> */}
        </div>
      </div>
    );
  };

  const handleLocationSelect = useCallback((lat, lng) => {
    setSelectedLocation({ lat, lng });
    setShowMap(false);
  }, []);

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
    // .reverse();
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
    // .reverse();
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
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  const handleNewEmailChange = (e) => {
    const value = e.target.value;
    setNewEmail(value);

    if (value && !validateEmail(value)) {
      setError("Invalid email format");
    } else {
      setError("");
    }
  };
  const handleSubmit = async () => {
    try {
      const payload = {
        customerId: customerData?.id,
        oldEmail: currentEmail,
        email: newEmail,
      };

      const { data } = await axios.post(
        `${API_BASE_URL}/customer-contact-primary-email-update`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("data", data);

      if (data.success) {
        navigate("/customers");
        setPopup(false);
        setSuccess(data.message);

        Swal.fire({
          icon: "success",
          title: t("Updated Email "),
          text: t(data.message),
          confirmButtonText: t("OK"),
        });
        setError("");
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error("Error updating email:", error?.response?.data?.message);
      setError(
        error?.response?.data?.message ||
          "Something went wrong while updating email"
      );
    }
  };
  return (
    <div className="customer-onboarding-form-grid">
      {/* {isV("customerApprovalChecklist") && (
        <div className="form-main-header">
          <a
            href="#"
            onClick={async (e) => {
              e.preventDefault();
              if (!CUSTOMER_APPROVAL_CHECKLIST_URL) {
                alert(t("No checklist URL configured."));
                return;
              }

              try {
                const response = await fetch(`${API_BASE_URL}/get-files`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    fileName: CUSTOMER_APPROVAL_CHECKLIST,
                    containerType: "documents",
                  }),
                });
                const res = await response.json();
                if (res.status === "Ok") {
                  window.open(res.data.url, "_blank", "noopener,noreferrer");
                } else {
                  throw new Error("Failed to fetch file URL");
                }
              } catch (error) {
                console.error("Error viewing checklist:", error);

                window.open(
                  CUSTOMER_APPROVAL_CHECKLIST_URL,
                  "_blank",
                  "noopener,noreferrer"
                );
              }
            }}
            style={{ cursor: "pointer" }}
          >
            {t("Customer Approval Checklist")}
          </a>
        </div>
      )} */}
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
        <div className="input-with-verification">
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
          {isV("primaryContactNameVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="primaryContactNameVerified"
                  name="primaryContactNameVerified"
                  checked={verifiedData?.primaryContactNameVerified || false}
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="primaryContactNameVerified">Verified</label>
              </div>
            )}
        </div>
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
          <div className="error">{t(formErrors.primaryContactName)}</div>
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
        <div className="input-with-verification">
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
          {isV("primaryContactDesignationVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="primaryContactDesignationVerified"
                  name="primaryContactDesignationVerified"
                  checked={
                    verifiedData?.primaryContactDesignationVerified || false
                  }
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="primaryContactDesignationVerified">
                  Verified
                </label>
              </div>
            )}
        </div>
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
          <div className="error">{t(formErrors.primaryContactDesignation)}</div>
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
        <div className="input-with-verification">
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
          {customerData?.customerStatus?.toLowerCase() === "approved" &&
            isE("emailEdit") &&
            isV("emailEdit") && (
              <IconButton
                onClick={() => {
                  setcurrentEmail(customerContactsData?.primaryContactEmail);
                  setPopup(true);
                }}
                sx={{ padding: "5px" }}
              >
                <EditIcon />
              </IconButton>
            )}
          {isV("primaryContactEmailVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="primaryContactEmailVerified"
                  name="primaryContactEmailVerified"
                  checked={verifiedData?.primaryContactEmailVerified || false}
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="primaryContactEmailVerified">Verified</label>
              </div>
            )}
        </div>
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
          <div className="error">{t(formErrors.primaryContactEmail)}</div>
        )}
      </div>

      {/* <div className="form-group">
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
          <div className="error">{t(formErrors.primaryContactMobile)}</div>
        )}
      </div> */}

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
        <div className="input-with-verification">
          <PhoneInput
            international
            defaultCountry="SA" // Set your default country code
            countryCallingCodeEditable={false}
            id="primaryContactMobile"
            name="primaryContactMobile"
            className={`phone-input ${
              // Use a specific class for phone input
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
            onChange={(value) => {
              // Handle the phone number change
              onChangeCustomerContactsData({
                target: {
                  name: "primaryContactMobile",
                  value: value,
                },
              });
            }}
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
          {isV("primaryContactMobileVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="primaryContactMobileVerified"
                  name="primaryContactMobileVerified"
                  checked={verifiedData?.primaryContactMobileVerified || false}
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="primaryContactMobileVerified">Verified</label>
              </div>
            )}
        </div>
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
          <div className="error">{t(formErrors.primaryContactMobile)}</div>
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
        <div className="input-with-verification">
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
          {isV("businessHeadNameVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="businessHeadNameVerified"
                  name="businessHeadNameVerified"
                  checked={verifiedData?.businessHeadNameVerified || false}
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="businessHeadNameVerified">Verified</label>
              </div>
            )}
        </div>
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
          <div className="error">{t(formErrors.businessHeadName)}</div>
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
        <div className="input-with-verification">
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
          {isV("businessHeadDesignationVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="businessHeadDesignationVerified"
                  name="businessHeadDesignationVerified"
                  checked={
                    verifiedData?.businessHeadDesignationVerified || false
                  }
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="businessHeadDesignationVerified">
                  Verified
                </label>
              </div>
            )}
        </div>
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
          <div className="error">{t(formErrors.businessHeadDesignation)}</div>
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
        <div className="input-with-verification">
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
          {isV("businessHeadEmailVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="businessHeadEmailVerified"
                  name="businessHeadEmailVerified"
                  checked={verifiedData?.businessHeadEmailVerified || false}
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="businessHeadEmailVerified">Verified</label>
              </div>
            )}
        </div>
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
          <div className="error">{t(formErrors.businessHeadEmail)}</div>
        )}
      </div>

      {/* <div className="form-group">
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
          <div className="error">{t(formErrors.businessHeadMobile)}</div>
        )}
      </div> */}

      <div className="form-group">
        <label htmlFor="businessHeadMobile">
          {t("Mobile")}
          <span className="required-field">*</span>
          {originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.businessHeadMobile !=
              customerContactsData?.businessHeadMobile &&
            mode === "edit" && <span className="update-badge">Updated</span>}
        </label>
        <div className="input-with-verification">
          <PhoneInput
            international
            defaultCountry="SA" // Set your default country code
            countryCallingCodeEditable={false}
            id="businessHeadMobile"
            name="businessHeadMobile"
            className={`phone-input ${
              // Use a specific class for phone input
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
            onChange={(value) => {
              // Handle the phone number change
              onChangeCustomerContactsData({
                target: {
                  name: "businessHeadMobile",
                  value: value,
                },
              });
            }}
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
          {isV("businessHeadMobileVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="businessHeadMobileVerified"
                  name="businessHeadMobileVerified"
                  checked={verifiedData?.businessHeadMobileVerified || false}
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="businessHeadMobileVerified">Verified</label>
              </div>
            )}
        </div>

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
          <div className="error">{t(formErrors.businessHeadMobile)}</div>
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
        <div className="input-with-verification">
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
          {isV("financeHeadNameVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="financeHeadNameVerified"
                  name="financeHeadNameVerified"
                  checked={verifiedData?.financeHeadNameVerified || false}
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="financeHeadNameVerified">Verified</label>
              </div>
            )}
        </div>
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
          <div className="error">{t(formErrors.financeHeadName)}</div>
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
        <div className="input-with-verification">
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
          {isV("financeHeadDesignationVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="financeHeadDesignationVerified"
                  name="financeHeadDesignationVerified"
                  checked={
                    verifiedData?.financeHeadDesignationVerified || false
                  }
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="financeHeadDesignationVerified">Verified</label>
              </div>
            )}
        </div>
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
          <div className="error">{t(formErrors.financeHeadDesignation)}</div>
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
        <div className="input-with-verification">
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
          {isV("financeHeadEmailVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="financeHeadEmailVerified"
                  name="financeHeadEmailVerified"
                  checked={verifiedData?.financeHeadEmailVerified || false}
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="financeHeadEmailVerified">Verified</label>
              </div>
            )}
        </div>
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
          <div className="error">{t(formErrors.financeHeadEmail)}</div>
        )}
      </div>

      {/* <div className="form-group">
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
          <div className="error">{t(formErrors.financeHeadMobile)}</div>
        )}
      </div> */}

      <div className="form-group">
        <label htmlFor="financeHeadMobile">
          {t("Mobile")}
          <span className="required-field">*</span>
          {originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.financeHeadMobile !=
              customerContactsData?.financeHeadMobile &&
            mode === "edit" && <span className="update-badge">Updated</span>}
        </label>
        <div className="input-with-verification">
          <PhoneInput
            international
            defaultCountry="SA" // Set your default country code
            countryCallingCodeEditable={false}
            id="financeHeadMobile"
            name="financeHeadMobile"
            className={`phone-input ${
              // Use a specific class for phone input
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
            onChange={(value) => {
              // Handle the phone number change
              onChangeCustomerContactsData({
                target: {
                  name: "financeHeadMobile",
                  value: value,
                },
              });
            }}
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
          {isV("financeHeadMobileVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id=""
                  name="financeHeadMobileVerified"
                  checked={verifiedData?.financeHeadMobileVerified || false}
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="financeHeadMobileVerified">Verified</label>
              </div>
            )}
        </div>
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
          <div className="error">{t(formErrors.financeHeadMobile)}</div>
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
        <div className="input-with-verification">
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
          {isV("purchasingHeadNameVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="purchasingHeadNameVerified"
                  name="purchasingHeadNameVerified"
                  checked={verifiedData?.purchasingHeadNameVerified || false}
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="purchasingHeadNameVerified">Verified</label>
              </div>
            )}
        </div>
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
          <div className="error">{t(formErrors.purchasingHeadName)}</div>
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
        <div className="input-with-verification">
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
          {isV("purchasingHeadDesignationVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="purchasingHeadDesignationVerified"
                  name="purchasingHeadDesignationVerified"
                  checked={
                    verifiedData?.purchasingHeadDesignationVerified || false
                  }
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="purchasingHeadDesignationVerified">
                  Verified
                </label>
              </div>
            )}
        </div>
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
          <div className="error">{t(formErrors.purchasingHeadDesignation)}</div>
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
        <div className="input-with-verification">
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
          {isV("purchasingHeadEmailVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="purchasingHeadEmailVerified"
                  name="purchasingHeadEmailVerified"
                  checked={verifiedData?.purchasingHeadEmailVerified || false}
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="purchasingHeadEmailVerified">Verified</label>
              </div>
            )}
        </div>
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
          <div className="error">{t(formErrors.purchasingHeadEmail)}</div>
        )}
      </div>

      {/* <div className="form-group">
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
          <div className="error">{t(formErrors.purchasingHeadMobile)}</div>
        )}
      </div> */}

      <div className="form-group">
        <label htmlFor="purchasingHeadMobile">
          {t("Mobile")}
          <span className="required-field">*</span>
          {originalCustomerContactsData &&
            customerContactsData &&
            originalCustomerContactsData?.purchasingHeadMobile !=
              customerContactsData?.purchasingHeadMobile &&
            mode === "edit" && <span className="update-badge">Updated</span>}
        </label>
        <div className="input-with-verification">
          <PhoneInput
            international
            defaultCountry="SA" // Set your default country code
            countryCallingCodeEditable={false}
            id="purchasingHeadMobile"
            name="purchasingHeadMobile"
            className={`phone-input ${
              // Use a specific class for phone input
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
            onChange={(value) => {
              // Handle the phone number change
              onChangeCustomerContactsData({
                target: {
                  name: "purchasingHeadMobile",
                  value: value,
                },
              });
            }}
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
          {isV("purchasingHeadMobileVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="purchasingHeadMobileVerified"
                  name="purchasingHeadMobileVerified"
                  checked={verifiedData?.purchasingHeadMobileVerified || false}
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="purchasingHeadMobileVerified">Verified</label>
              </div>
            )}
        </div>
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
          <div className="error">{t(formErrors.purchasingHeadMobile)}</div>
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
        <div className="input-with-verification">
          <input
            type="text"
            id="buildingName"
            name="buildingName"
            className={`text-field small ${
              originalCustomerData &&
              customerData &&
              originalCustomerData?.buildingName !=
                customerData?.buildingName &&
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
              originalCustomerData?.buildingName ===
                customerData?.buildingName &&
              mode === "edit" &&
              customerData?.customerStatus !== "pending"
            }
            required
          />
          {isV("buildingNameVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="buildingNameVerified"
                  name="buildingNameVerified"
                  checked={verifiedData?.buildingNameVerified || false}
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="buildingNameVerified">Verified</label>
              </div>
            )}
        </div>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.buildingName != customerData?.buildingName &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.buildingName || "(empty)"}
            </div>
          )}
        {formErrors.buildingName && (
          <div className="error">{t(formErrors.buildingName)}</div>
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
        <div className="input-with-verification">
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
          {isV("streetVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="streetVerified"
                  name="streetVerified"
                  checked={verifiedData?.streetVerified || false}
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="streetVerified">Verified</label>
              </div>
            )}
        </div>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.street != customerData?.street &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.street || "(empty)"}
            </div>
          )}
        {formErrors.street && (
          <div className="error">{t(formErrors.street)}</div>
        )}
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
        <div className="input-with-verification">
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
          {isV("regionVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="regionVerified"
                  name="regionVerified"
                  checked={verifiedData?.regionVerified || false}
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="regionVerified">Verified</label>
              </div>
            )}
        </div>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.region != customerData?.region &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.region || "(empty)"}
            </div>
          )}
        {formErrors.region && (
          <div className="error">{t(formErrors.region)}</div>
        )}
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
        <div className="input-with-verification">
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
          {isV("cityVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="cityVerified"
                  name="cityVerified"
                  checked={verifiedData?.cityVerified || false}
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="cityVerified">Verified</label>
              </div>
            )}
        </div>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.city != customerData?.city &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.city || "(empty)"}
            </div>
          )}
        {formErrors.city && <div className="error">{t(formErrors.city)}</div>}
      </div>

      {/* City (Other) - Conditional */}
      {customerData?.city?.toLowerCase() === "others (specify)" && (
        <div className="form-group">
          <label htmlFor="cityOther">
            {t("City (Other)")}
            <span className="required-field">*</span>
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.cityOther != customerData?.cityOther &&
              mode === "edit" && (
                <span className="update-badge">{t("Updated")}</span>
              )}
          </label>
          <div className="input-with-verification">
            <input
              type="text"
              id="cityOther"
              name="cityOther"
              className={`text-field small ${
                originalCustomerData &&
                customerData &&
                originalCustomerData?.cityOther != customerData?.cityOther &&
                mode === "edit"
                  ? "update-field"
                  : ""
              }`}
              placeholder={t("Enter City")}
              value={customerData?.cityOther || ""}
              onChange={onChangeCustomerData}
              disabled={
                originalCustomerData &&
                customerData &&
                originalCustomerData?.cityOther === customerData?.cityOther &&
                mode === "edit" &&
                customerData?.customerStatus !== "pending"
              }
            />
            {isV("cityOtherVerified") &&
              // (originalCustomerData &&
              //     customerData &&
              //     originalCustomerData?.companyNameEn !==
              //       customerData?.companyNameEn &&
              //     mode === "edit") ||
              mode === "edit" &&
              customerData?.customerStatus === "pending" && (
                <div className="verification-checkbox">
                  <input
                    type="checkbox"
                    id="cityOtherVerified"
                    name="cityOtherVerified"
                    checked={verifiedData?.cityOtherVerified || false}
                    onChange={onChangeVerifiedData}
                    // className="verified-checkbox"
                  />
                  <label htmlFor="cityOtherVerified">Verified</label>
                </div>
              )}
          </div>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.cityOther != customerData?.cityOther &&
            mode === "edit" && (
              <div className="current-value">
                Previous: {originalCustomerData?.cityOther || "(empty)"}
              </div>
            )}
          {formErrors.cityOther && (
            <div className="error">{t(formErrors.cityOther)}</div>
          )}
        </div>
      )}

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
        <div className="input-with-verification">
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
          {isV("districtVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="districtVerified"
                  name="districtVerified"
                  checked={verifiedData?.districtVerified || false}
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="districtVerified">Verified</label>
              </div>
            )}
        </div>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.district != customerData?.district &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.district || "(empty)"}
            </div>
          )}
        {formErrors.district && (
          <div className="error">{t(formErrors.district)}</div>
        )}
      </div>
      {/* District (Other) - Conditional */}
      {customerData?.district?.toLowerCase() === "others (specify)" && (
        <div className="form-group">
          <label htmlFor="districtOther">
            {t("District (Other)")}
            <span className="required-field">*</span>
            {originalCustomerData &&
              customerData &&
              originalCustomerData?.districtOther !=
                customerData?.districtOther &&
              mode === "edit" && (
                <span className="update-badge">{t("Updated")}</span>
              )}
          </label>
          <div className="input-with-verification">
            <input
              type="text"
              id="districtOther"
              name="districtOther"
              className={`text-field small ${
                originalCustomerData &&
                customerData &&
                originalCustomerData?.districtOther !=
                  customerData?.districtOther &&
                mode === "edit"
                  ? "update-field"
                  : ""
              }`}
              placeholder={t("Enter District")}
              value={customerData?.districtOther || ""}
              onChange={onChangeCustomerData}
              disabled={
                originalCustomerData &&
                customerData &&
                originalCustomerData?.districtOther ===
                  customerData?.districtOther &&
                mode === "edit" &&
                customerData?.customerStatus !== "pending"
              }
            />
            {isV("districtOtherVerified") &&
              // (originalCustomerData &&
              //     customerData &&
              //     originalCustomerData?.companyNameEn !==
              //       customerData?.companyNameEn &&
              //     mode === "edit") ||
              mode === "edit" &&
              customerData?.customerStatus === "pending" && (
                <div className="verification-checkbox">
                  <input
                    type="checkbox"
                    id="districtOtherVerified"
                    name="districtOtherVerified"
                    checked={verifiedData?.districtOtherVerified || false}
                    onChange={onChangeVerifiedData}
                    // className="verified-checkbox"
                  />
                  <label htmlFor="districtOtherVerified">Verified</label>
                </div>
              )}
          </div>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.districtOther !=
              customerData?.districtOther &&
            mode === "edit" && (
              <div className="current-value">
                Previous: {originalCustomerData?.districtOther || "(empty)"}
              </div>
            )}
          {formErrors.districtOther && (
            <div className="error">{t(formErrors.districtOther)}</div>
          )}
        </div>
      )}

      {/* zone dropdown */}
      {isV("assignedToEntityWise") && (
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
          <div className="input-with-verification">
            <SearchableDropdown
              name="zone"
              options={(basicMasterLists?.zone || []).map((item) => ({
                value: item.value,
                name: i18n.language === "ar" ? item.valueLc : item.value,
              }))}
              value={customerData?.zone || ""}
              onChange={(e) => {
                onChangeCustomerData({
                  target: { name: "zone", value: e.target.value },
                });
              }}
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
            {isV("zoneVerified") &&
              // (originalCustomerData &&
              //     customerData &&
              //     originalCustomerData?.companyNameEn !==
              //       customerData?.companyNameEn &&
              //     mode === "edit") ||
              mode === "edit" &&
              customerData?.customerStatus === "pending" && (
                <div className="verification-checkbox">
                  <input
                    type="checkbox"
                    id="zoneVerified"
                    name="zoneVerified"
                    checked={verifiedData?.zoneVerified || false}
                    onChange={onChangeVerifiedData}
                    // className="verified-checkbox"
                  />
                  <label htmlFor="zoneVerified">Verified</label>
                </div>
              )}
          </div>
          {originalCustomerData &&
            customerData &&
            originalCustomerData?.zone != customerData?.zone &&
            mode === "edit" && (
              <div className="current-value">
                Previous: {originalCustomerData?.zone || "(empty)"}
              </div>
            )}
          {formErrors.zone && <div className="error">{t(formErrors.zone)}</div>}
        </div>
      )}
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
        <div className="input-with-verification">
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
          {isV("pincodeVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="pincodeVerified"
                  name="pincodeVerified"
                  checked={verifiedData?.pincodeVerified || false}
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="pincodeVerified">Verified</label>
              </div>
            )}
        </div>
        {originalCustomerData &&
          customerData &&
          originalCustomerData?.pincode != customerData?.pincode &&
          mode === "edit" && (
            <div className="current-value">
              Previous: {originalCustomerData?.pincode || "(empty)"}
            </div>
          )}
        {formErrors.pincode && (
          <div className="error">{t(formErrors.pincode)}</div>
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
        <div className="input-with-verification">
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
                originalCustomerData?.geolocation ===
                  customerData?.geolocation &&
                mode === "edit" &&
                customerData?.customerStatus !== "pending"
              }
              className={`text-field small ${
                originalCustomerData &&
                customerData &&
                originalCustomerData?.geolocation !=
                  customerData?.geolocation &&
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
          {isV("geolocationVerified") &&
            // (originalCustomerData &&
            //     customerData &&
            //     originalCustomerData?.companyNameEn !==
            //       customerData?.companyNameEn &&
            //     mode === "edit") ||
            mode === "edit" &&
            customerData?.customerStatus === "pending" && (
              <div className="verification-checkbox">
                <input
                  type="checkbox"
                  id="geolocationVerified"
                  name="geolocationVerified"
                  checked={verifiedData?.geolocationVerified || false}
                  onChange={onChangeVerifiedData}
                  // className="verified-checkbox"
                />
                <label htmlFor="geolocationVerified">Verified</label>
              </div>
            )}
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
          <div className="error">{t(formErrors.geolocation)}</div>
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
      <Dialog
        open={popup}
        onClose={() => setPopup(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Email</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {/* Current Email (disabled) */}
          <TextField
            label="Current Email"
            value={currentEmail}
            disabled
            fullWidth
          />

          <TextField
            label="New Email"
            value={newEmail}
            onChange={handleNewEmailChange}
            error={!!error}
            helperText={error}
            fullWidth
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setPopup(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!newEmail}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default ContactDetails;
