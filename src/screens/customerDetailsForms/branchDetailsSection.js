import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { useTranslation } from "react-i18next";
import { isMobile } from "../../utilities/isMobile";
import { useAuth } from "../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisV,
  faChevronDown,
  faChevronRight,
  faLocationDot,
  faXmark,
  faBuilding,
  faClock,
  faTimes,
  faUser,
  faTruck,
  faExclamationCircle,
  faMapMarkerAlt,
  faPen,
  faMap,
  faLanguage,
  faHistory,
  faExclamationTriangle,
  faCheck,
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
  setShowAllDetails,
  setExpandedRows,
}) => {
  const { t, i18n } = useTranslation();
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(branch?.geolocation);
  const [geoData, setGeoData] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 500);
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
const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Go' || e.key === 'Search' || e.key === 'Done'  ) {
      if (isMobile) {
        // Close keyboard
        e.target.blur();
        document.body.classList.remove('keyboard-open');
      }
    }
  };
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
              const handleResize = () => setIsMobile(window.innerWidth < 768);
              console.log("isMobile", isMobile);
              window.addEventListener("resize", handleResize);
              return () => window.removeEventListener("resize", handleResize);
            }, []);
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
        //  const [marker, setMarker] = useState(null);
         const markerRef = useRef(null);
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
       
            //  setPlacesService(new window.google.maps.places.Place(document.createElement('div')));
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
           if (markerRef?.current) {
    markerRef.current.setMap(null);
    markerRef.current = null;
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
     markerRef.current = newMarker;
          //  setMarker(newMarker);
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
     
          //  const initializeMap = () => {
          //    try {
          //      if (!window.google) {
          //        console.error("Google Maps API not loaded");
          //        return;
          //      }
     
          //      // Determine initial center
          //      let initialCenter = defaultCenter;
          //      if (initialLat && initialLng) {
          //        initialCenter = { lat: initialLat, lng: initialLng };
          //        setManualLat(Number(initialLat).toFixed(6));
          //        setManualLng(Number(initialLng).toFixed(6));
          //      }
     
          //      mapInstance = new window.google.maps.Map(mapContainer.current, {
          //        center: initialCenter,
          //        zoom: 12,
          //        mapTypeControl: true,
          //        streetViewControl: true,
          //        fullscreenControl: true,
          //      });
     
          //      setMap(mapInstance);
     
          //      // Add initial marker if coordinates exist
          //      if (initialLat && initialLng) {
          //        moveMarkerToLocation(initialLat, initialLng, mapInstance);
          //      } else {
          //        setCoords("Click on the map to select a location");
          //        setCoordsArabic("انقر على الخريطة لتحديد موقع");
          //      }
     
          //      // Add click listener to map
          //      mapInstance.addListener("click", (e) => {
          //        const lat = e.latLng.lat();
          //        const lng = e.latLng.lng();
          //        moveMarkerToLocation(lat, lng, mapInstance);
          //      });
     
          //    } catch (error) {
          //      console.error("Map initialization error:", error);
          //    }
          //  };
     const initializeMap = () => {
  try {
    if (!window.google) {
      console.error("Google Maps API not loaded");
      return;
    }

    let initialCenter = defaultCenter;

    // If a saved location exists, use it
    if (initialLat && initialLng) {
      initialCenter = { lat: initialLat, lng: initialLng };
      setManualLat(Number(initialLat).toFixed(6));
      setManualLng(Number(initialLng).toFixed(6));
    }

    // Create the map instance
    const mapInstance = new window.google.maps.Map(mapContainer.current, {
      center: initialCenter,
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    setMap(mapInstance);

    // ✅ If no location selected, try to detect user’s current location
    if (!initialLat && !initialLng && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          moveMarkerToLocation(latitude, longitude, mapInstance);

          setCoords(
            `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`
          );
          setCoordsArabic(
            `خط العرض: ${latitude.toFixed(6)}, خط الطول: ${longitude.toFixed(6)}`
          );
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
          // Fallback if denied or unavailable
          setCoords("Unable to detect current location.");
          setCoordsArabic("تعذر تحديد الموقع الحالي.");
          mapInstance.setCenter(defaultCenter);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else if (initialLat && initialLng) {
      // Add initial marker if coordinates exist
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
             if (markerRef.current) {
    markerRef.current.setMap(null);
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
          //  if (marker) {
          //    marker.setMap(null);
          //    setMarker(null);
          //  }
          if (markerRef?.current) {
    markerRef.current.setMap(null);
    markerRef.current = null;
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
onFocus={() => {
       if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
   
    
  }}
onKeyDown={handleKeyDown}
  onBlur={() => {
   
      document.body.classList.remove('keyboard-open');
       // 👈 show menu again (optional)
  }}
    
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
               className={isMobile ? "map-container-mobile" : "map-container"}
               style={{ width: "100%", height: isMobile ? "200px" : "300px" }}
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
    !isMobile ?
    (<div className="form-section">
      {console.log(isUnderApproval)}
      {/* {(isUnderApproval) && <h2>{t('Branch is currently under Approval')}</h2>} */}
      <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}}>
  <h3 style={{ margin: 0 }}>{t("Branch Details")}</h3>

  {isMobile && (
    <button
      className="popup-close"
      onClick={() => {
        setShowAllDetails(false);
        setExpandedRows([]);
      }}
      style={{
        width: "25px",
        height: "25px",
        fontSize: "18px",
        background: "light-gray",
        border: "none",
        cursor: "pointer",
        lineHeight: "1",
      }}
    >
      ×
    </button>
  )}
</div>

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
onFocus={() => {
       if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
   
    
  }}
onKeyDown={handleKeyDown}
  onBlur={() => {
   
      document.body.classList.remove('keyboard-open');
       // 👈 show menu again (optional)
  }}
    
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
                                // className={"branchDropDown"}
                                style={{
                                  ...(hasUpdate
                                    ? {
                                        backgroundColor: "#fff8e1",
                                      }
                                    : {width:"150px"}),
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
                  {t("Previous")}{":"}
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
  ) :(<div className="form-section-mobile">
  {/* Header */}
  <div className="form-header-mobile">
    <div className="header-content">
      <h3 className="form-title-mobile">
        <FontAwesomeIcon icon={faBuilding} className="title-icon" />
        {t("Branch Details")}
      </h3>
      {isUnderApproval && (
        <div className="approval-badge-mobile">
          <FontAwesomeIcon icon={faClock} />
          <span>{t("Under Approval")}</span>
        </div>
      )}
    </div>
    
    {isMobile && (
      <button
        className="form-close-btn-mobile"
        onClick={() => {
          setShowAllDetails(false);
          setExpandedRows([]);
        }}
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>
    )}
  </div>

  {/* Checkbox Section */}
   { (user?.userType?.toLowerCase() !== "customer")&& <div className="checkbox-section-mobile">
  {isFirstBranch && mode !== "edit"  &&  (
    <label className="checkbox-group-mobile">
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
        className="checkbox-input-mobile"
      />
      <div className="checkbox-label-mobile">
        <span className="checkbox-custom"></span>
        <FontAwesomeIcon icon={faUser} className="checkbox-icon" />
        <span className="checkbox-text">{t("Same as Customer Details")}</span>
      </div>
    </label>
  )}
  
  {isV("isDeliveryChargesApplicable") && (
    <label className="checkbox-group-mobile">
      <input
        type="checkbox"
        id="isDeliveryChargesApplicable"
        name="isDeliveryChargesApplicable"
        checked={branch?.isDeliveryChargesApplicable}
        onChange={handleDeliveryChargesChange}
        className="checkbox-input-mobile"
      />
      <div className="checkbox-label-mobile">
        <span className="checkbox-custom"></span>
        <FontAwesomeIcon icon={faTruck} className="checkbox-icon" />
        <span className="checkbox-text">{t("Is Delivery Charges Applicable")}</span>
        {hasCheckboxUpdate && (
          <span className="update-badge-mobile">
            <FontAwesomeIcon icon={faExclamationCircle} />
            <span>Updated</span>
          </span>
        )}
      </div>
    </label>
  )}
</div>}

  {/* Form Fields */}
  <div className="form-grid-mobile">
    {fields.map((field, index) => {
      if (
        (field.name === "locationTypeOther" &&
          branch?.locationType !== "Others (specify)") ||
        (field.name === "cityOther" &&
          branch?.city !== "Others (Specify)") ||
        (field.name === "districtOther" &&
          branch?.district !== "Others (Specify)")
      ) {
        return null;
      }
       if (
    user?.userType?.toLowerCase() === "customer" && 
    (field.name === "branch" || field.name === "zone")
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
          className={`form-field-mobile ${hasUpdate ? "field-update" : ""} ${
            field.required ? "field-required" : ""
          }`}
          key={index}
        >
          {isV(field.name) && !field?.hidden && (
            <div className="field-header-mobile">
              <label className="field-label-mobile">
                {field?.isLocation ? (
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                ) : field.type === "dropdown" ? (
                  <FontAwesomeIcon icon={faPen} />
                ) : (
                  <FontAwesomeIcon icon={faPen} />
                )}
                {t(field.label)}
                {field.required && <span className="required-star">*</span>}
              </label>
              
              {hasUpdate && (
                <div className="update-indicator-mobile">
                  <span className="update-dot"></span>
                  <span className="update-text">{t("Updated")}</span>
                </div>
              )}
            </div>
          )}

          <div className="field-input-container-mobile">
            {field?.isLocation ? (
              <div className="location-input-wrapper-mobile">
                <div className="location-display-mobile">
                  <span className="location-text">
                    {branch?.[field.name]
                      ? getLocationDisplay(branch[field.name])
                      : "Select Location"}
                  </span>
                </div>
                <button
                  className="location-picker-btn-mobile"
                  onClick={() => setShowMap(true)}
                  disabled={customerFormMode === "custDetailsAdd" && inApproval}
                >
                  <FontAwesomeIcon icon={faMap} />
                  <span>{t("Pick Location")}</span>
                </button>
              </div>
            ) : (
              <>
                {(() => {
                  switch (field.type) {
                    case "text":
                      return (
                        <div className="text-input-wrapper-mobile">
                          <input
                            type="text"
onFocus={() => {
       if (window.innerWidth <= 768) {
      // This could trigger hiding the bottom menu
      document.body.classList.add('keyboard-open');
    }
   
    
  }}
onKeyDown={handleKeyDown}
  onBlur={() => {
   
      document.body.classList.remove('keyboard-open');
       // 👈 show menu again (optional)
  }}
    
                            name={field.name}
                            value={branch?.[field.name] || ""}
                            placeholder={t(field.placeholder)}
                            onChange={handleBranchFieldChange}
                            className={`text-input-mobile ${
                              field.name === "branchNameLc" ? "arabic-input" : ""
                            } ${hasUpdate ? "input-update" : ""}`}
                            disabled={
                              customerFormMode === "custDetailsAdd" && inApproval
                            }
                            hidden={field?.hidden}
                          />
                          {field.name.includes("branchName") && (
                            <div className="input-icon-mobile">
                              <FontAwesomeIcon 
                                icon={field.name === "branchNameLc" ? faLanguage : faBuilding} 
                              />
                            </div>
                          )}
                        </div>
                      );
                    case "dropdown":
                      return isV(field.name) ? (
                        <div className="dropdown-wrapper-mobile">
                          <SearchableDropdown
                            name={field.name}
                            value={branch?.[field.name]}
                            onChange={field.onChange || handleBranchFieldChange}
                            // className="dropdown-mobile"
                            disabled={
                              (customerFormMode === "custDetailsAdd" && inApproval) ||
                              field.disabled
                            }
                            hidden={!isV(field.name)}
                            options={field.options}
                               style={{width:"100%"}}
                          />
                         
                        </div>
                      ) : null;
                    default:
                      return null;
                  }
                })()}
              </>
            )}
          </div>

          {hasUpdate && (
            <div className="current-value-mobile">
              <FontAwesomeIcon icon={faHistory} />
              <span className="previous-label">{t("Previous")}{":"}</span>
              <span className="previous-value">
                {field.isLocation
                  ? getLocationDisplay(currentValue)
                  : originalBranch?.[field.name] || "(empty)"}
              </span>
            </div>
          )}
          
          {formErrors[field.name] && (
            <div className="error-message-mobile">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <span>{t(formErrors[field.name])}</span>
            </div>
          )}
        </div>
      );
    })}
  </div>

  {/* Map Modal */}
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

  {/* Add some custom styles */}
  <style jsx>{`
    .dropdown-mobile .dropdown-header {
      width: 100% !important;
      min-height: 44px !important;
    }

    /* Mobile Form Section */
.form-section-mobile {
  padding: 20px;
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 89, 76, 0.08);
  border: 1px solid rgba(0, 89, 76, 0.1);
}

/* Form Header */
.form-header-mobile {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(0, 89, 76, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.form-title-mobile {
  font-size: 18px;
  font-weight: 700;
  color: #00594C;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 20px;
  color: #00594C;
}

.approval-badge-mobile {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  border: 1px solid #ffd700;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #856404;
}

.form-close-btn-mobile {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.form-close-btn-mobile:hover {
  background: #00594C;
  color: white;
  transform: rotate(90deg);
}

/* Checkbox Section */
/* Checkbox Section */
.checkbox-section-mobile {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(0, 89, 76, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(0, 89, 76, 0.05);
}

.checkbox-group-mobile {
  position: relative;
  cursor: pointer;
  margin: 0;
  padding: 0;
}

.checkbox-input-mobile {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkbox-label-mobile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  background: white;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
  min-height: 56px;
}

.checkbox-group-mobile:hover .checkbox-label-mobile {
  border-color: #00594C;
  box-shadow: 0 4px 12px rgba(0, 89, 76, 0.1);
  transform: translateY(-2px);
}

.checkbox-input-mobile:checked ~ .checkbox-label-mobile {
  background: rgba(0, 89, 76, 0.08);
  border-color: #00594C;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 4px;
  position: relative;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.checkbox-input-mobile:checked ~ .checkbox-label-mobile .checkbox-custom {
  background: #00594C;
  border-color: #00594C;
}

.checkbox-input-mobile:checked ~ .checkbox-label-mobile .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.checkbox-icon {
  font-size: 16px;
  color: #00594C;
  flex-shrink: 0;
}

.checkbox-text {
  flex: 1;
  font-weight: 500;
  color: #333;
  font-size: 14px;
  line-height: 1.4;
}

.update-badge-mobile {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  border: 1px solid #ffd700;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: #856404;
  margin-left: 8px;
  flex-shrink: 0;
}

.update-badge-mobile svg {
  font-size: 10px;
}

/* Ensure text is visible - add these styles */
.checkbox-label-mobile {
  color: #333; /* Explicit text color */
}

.checkbox-group-mobile:focus-within .checkbox-label-mobile {
  outline: 2px solid #00594C;
  outline-offset: 2px;
}

/* Accessibility improvements */
.checkbox-group-mobile:focus {
  outline: none;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .checkbox-label-mobile {
    padding: 10px;
    gap: 10px;
    min-height: 52px;
  }
  
  .checkbox-text {
    font-size: 13px;
  }
  
  .update-badge-mobile {
    font-size: 10px;
    padding: 3px 6px;
  }
}

.update-badge-mobile {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  border: 1px solid #ffd700;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: #856404;
}

/* Form Grid */
.form-grid-mobile {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.form-field-mobile {
  position: relative;
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.form-field-mobile:hover {
  border-color: #00594C;
  box-shadow: 0 4px 12px rgba(0, 89, 76, 0.05);
}

.form-field-mobile.field-update {
  border-left: 4px solid #00594C;
  background: linear-gradient(135deg, #fff, #fff8e1);
}

.field-header-mobile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.field-label-mobile {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #444;
  margin: 0;
}

.field-label-mobile svg {
  color: #00594C;
  font-size: 14px;
}

.required-star {
  color: #ff4757;
  margin-left: 4px;
}

.update-indicator-mobile {
  display: flex;
  align-items: center;
  gap: 6px;
}

.update-dot {
  width: 8px;
  height: 8px;
  background: #00594C;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.update-text {
  font-size: 11px;
  font-weight: 600;
  color: #00594C;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Input Fields */
.field-input-container-mobile {
  margin-bottom: 8px;
}

/* Location Input */
.location-input-wrapper-mobile {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.location-display-mobile {
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  min-height: 44px;
  display: flex;
  align-items: center;
}

.location-picker-btn-mobile {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #00594C, #007B6B);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.location-picker-btn-mobile:hover:not(:disabled) {
  background: linear-gradient(135deg, #007B6B, #009380);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 89, 76, 0.3);
}

.location-picker-btn-mobile:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Text Input */
.text-input-wrapper-mobile {
  position: relative;
}

.text-input-mobile {
  width: 100%;
  padding: 12px 40px 12px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  background: #f8f9fa;
  transition: all 0.3s ease;
  min-height: 44px;
}

.text-input-mobile:focus {
  outline: none;
  border-color: #00594C;
  box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
  background: white;
}

.text-input-mobile.input-update {
  background: #fff8e1;
  border-color: #ffd700;
}

.text-input-mobile.arabic-input {
  text-align: right;
  direction: rtl;
  padding: 12px 12px 12px 40px;
}

.input-icon-mobile {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  color: #00594C;
  font-size: 16px;
}

.text-input-mobile.arabic-input + .input-icon-mobile {
  right: auto;
  left: 12px;
}

/* Dropdown */
.dropdown-wrapper-mobile {
  position: relative;
}

.dropdown-mobile {
  width: 100% !important;
}

.dropdown-mobile .dropdown-header {
  min-height: 44px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f8f9fa;
  padding: 12px;
  font-size: 14px;
}

.dropdown-mobile .dropdown-header:hover {
  border-color: #00594C;
}

.dropdown-icon-mobile {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  color: #00594C;
  pointer-events: none;
}

/* Current Value */
.current-value-mobile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: rgba(0, 89, 76, 0.05);
  border-radius: 8px;
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

.current-value-mobile svg {
  color: #00594C;
  font-size: 12px;
}

.previous-label {
  font-weight: 600;
  color: #444;
}

.previous-value {
  color: #333;
  font-weight: 500;
}

/* Error Message */
.error-message-mobile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid rgba(255, 71, 87, 0.2);
  border-radius: 8px;
  font-size: 12px;
  color: #ff4757;
  margin-top: 8px;
}

.error-message-mobile svg {
  font-size: 14px;
}

/* Map Modal */
.map-modal-overlay-mobile {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(5px);
}

.map-modal-content-mobile {
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.4s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.map-modal-header-mobile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #00594C, #007B6B);
  color: white;
}

.map-modal-title-mobile {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.map-close-btn-mobile {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.map-close-btn-mobile:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.map-container-mobile {
  height: 200px;
  padding: 20px;
}

.map-actions-mobile {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: center;
}

.map-confirm-btn-mobile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  background: linear-gradient(135deg, #00594C, #007B6B);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.map-confirm-btn-mobile:hover {
  background: linear-gradient(135deg, #007B6B, #009380);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 89, 76, 0.4);
}

/* Animations */
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* Responsive Design */
@media (max-width: 480px) {
  .form-section-mobile {
    padding: 16px;
  }
  
  .form-grid-mobile {
    gap: 16px;
  }
  
  .form-field-mobile {
    padding: 14px;
  }
  
  .checkbox-label-mobile {
    padding: 10px;
  }
  
  .location-picker-btn-mobile,
  .text-input-mobile {
    min-height: 42px;
  }
  
  .map-container-mobile {
    height: 200px;
    padding: 10px;
  }
}

@media (min-width: 768px) {
  .form-grid-mobile {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .form-field-mobile:nth-child(13),
  .form-field-mobile:nth-child(14) {
    grid-column: span 2;
  }
}
  `}</style>
</div>));
};
export default BranchDetailsForm;
