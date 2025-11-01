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
  const GOOGLE_MAPS_API_KEY =
  process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY";

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
          headers: { "Content-Type": "application/json" , "Authorization": `Bearer ${token}`},
          
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
        "zone"
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
          headers: { "Content-Type": "application/json",
                                'Authorization': `Bearer ${token}` },
          
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
          headers: { "Content-Type": "application/json" ,
              "Authorization": `Bearer ${token}` 
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
        // .reverse(),
        onChange: handleCityChange,
        value: branch?.city || "",
        disabled: !selectedRegion,
      },
      {
        type: "text",
        label: "City (Other)",
        name: "cityOther",
        placeholder: "City (Other)",
        required: true,
        // hidden: branch?.locationType !== "Others (specify)",
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
        // .reverse(),
        value: branch?.district || "",
        disabled: !selectedCity,
      },
      {
        type: "text",
        label: "District (Other)",
        name: "districtOther",
        placeholder: "District (Other)",
        required: true,
        // hidden: branch?.locationType !== "Others (specify)",
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
      {
        type: "dropdown",
        label: "Zone",
        name: "zone",
        placeholder: "Zone",
        required: true,
        options: (dropdownOptions?.zone || []).map((item) => ({
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
                // disabled={
                //   customerFormMode === "custDetailsEdit" && !hasCheckboxUpdate
                // }
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
            (field.name === "locationTypeOther" &&
            branch?.locationType !== "Others (specify)")||
            (
              field.name === "cityOther" &&
              branch?.city !== "Others (Specify)"
            ) || 
            (
              field.name === "districtOther" &&
              branch?.district !== "Others (Specify)"
            )
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
                      // (customerFormMode === "custDetailsEdit" && !hasUpdate) ||
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
                    // disabled={
                    //   customerFormMode === "custDetailsEdit" && !hasUpdate
                    // }
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
                              // (customerFormMode === "custDetailsEdit" &&
                              //   !hasUpdate) 
                              //   ||
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
                                  // (customerFormMode === "custDetailsEdit" &&
                                  //   !hasUpdate) ||
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
