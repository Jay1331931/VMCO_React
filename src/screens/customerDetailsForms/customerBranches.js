
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { faToggleOff, faToggleOn, faCheck, faXmark, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import Pagination from '../../components/Pagination';
import '../../styles/pagination.css';
import '../../styles/forms.css';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { or } from 'ajv/dist/compile/codegen';

const getStatusClass = (status) => {
    switch (status) {
        case 'Active': return 'branch-status-approved';
        case 'Inactive': return 'branch-status-rejected';
        default: return 'branch-status-pending';
    }
};



// Helper function to stringify hours for saving
export const stringifyHours = (hours) => {
    const result = {
        operatingHours: {},
        deliveryHours: {}
    };

    Object.entries(hours).forEach(([day, { operating, delivery }]) => {
        result.operatingHours[day] = `${operating.from}-${operating.to}`;
        result.deliveryHours[day] = `${delivery.from}-${delivery.to}`;
    });

    return JSON.stringify(result);
};
const LocationPicker = ({ onLocationSelect }) => {
    const mapContainer = useRef(null);
    const markerRef = useRef(null); // Using ref instead of state for the marker
    const [map, setMap] = useState(null);
    const { t, i18n } = useTranslation();
    const [coords, setCoords] = useState('Detecting your location...');
    const [coordsArabic, setCoordsArabic] = useState(t('Detecting your location...'));
    const [defaultCenter] = useState([77.5946, 12.9716]);
    const [zoom] = useState(14);
    const [confirmedLocation, setConfirmedLocation] = useState(null);

    useEffect(() => {
        let mapInstance;

        const initializeMap = async () => {
            mapInstance = new maplibregl.Map({
                container: mapContainer.current,
                style: 'https://api.maptiler.com/maps/streets/style.json?key=NxvpwMoXuYLINUijkWEc',
                center: defaultCenter,
                zoom: zoom
            });

            mapInstance.on('load', async () => {
                setMap(mapInstance);
                try {
                    const position = await getCurrentPosition();
                    const { latitude, longitude } = position.coords;
                    updateMarker(mapInstance, longitude, latitude);
                } catch (error) {
                    console.log('Geolocation error:', error);
                    setCoords('Click on the map to select a location');
                    setCoordsArabic(t('Click on the map to select a location'));
                }
            });

            mapInstance.on('click', (e) => {
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
                    timeout: 5000
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
            setCoordsArabic(`خط العرض: ${lat.toFixed(6)}, خط الطول: ${lng.toFixed(6)}`);

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
        }
    };

    const handleReset = () => {
        if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
        }
        setConfirmedLocation(null);
        setCoords('Click on the map to select a location');
        setCoordsArabic(t('Click on the map to select a location'));
    };

    return (
        <div className="location-picker-container">
            <div ref={mapContainer} className="map-container" />
            <div className="location-coords">{i18n.language === 'ar' ? coordsArabic : coords}</div>
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
                        <div className="location-confirmed">
                            Location confirmed!
                        </div>
                        <button
                            className="reset-location-button"
                            onClick={handleReset}
                        >
                            Change Location
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

function Branches({ customer, setTabsHeight}) {
    const location = useLocation();
    // const customer = location.state?.customer;
    const [branches, setBranches] = useState([]);
    const [transformedBranches, setTransformedBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedRows, setExpandedRows] = useState([]);
    const { t } = useTranslation();
    const actionMenuRef = useRef(null);
    const [isActionMenuOpen, setActionMenuOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(branches.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    // const currentItems = branches.slice(startIndex, endIndex);
    const currentItems = branches;
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const contentRef = useRef();
    // const [branchChanges, setBranchChanges] = useState({});
        function transformBranchData(branches, branchContacts) {
        console.log('Branches:', branches);
        console.log('Branch Contacts:', branchContacts);
        const branchesArray = Array.isArray(branches) ? branches : [branches];
        const contactsArray = Array.isArray(branchContacts) ? branchContacts : (branchContacts ? [branchContacts] : []);

        return branchesArray.map(branch => {
            // Filter contacts for this specific branch
            const branchContacts = contactsArray.filter(contact => contact.branchId === branch.id);

            // Create a map of contactType to contact data
            const contactsMap = branchContacts.reduce((acc, contact) => {
                acc[contact.contactType] = contact;
                return acc;
            }, {});

            return {
                ...branch,
                // Primary contact information
                primaryContactName: contactsMap.primary?.name || '',
                primaryContactDesignation: contactsMap.primary?.designation || '',
                primaryContactEmail: contactsMap.primary?.email || '',
                primaryContactMobile: contactsMap.primary?.mobile || '',

                // Secondary contact information
                secondaryContactName: contactsMap.secondary?.name || '',
                secondaryContactDesignation: contactsMap.secondary?.designation || '',
                secondaryContactEmail: contactsMap.secondary?.email || '',
                secondaryContactMobile: contactsMap.secondary?.mobile || '',

                // Supervisor contact information
                supervisorContactName: contactsMap.supervisor?.name || '',
                supervisorContactDesignation: contactsMap.supervisor?.designation || '',
                supervisorContactEmail: contactsMap.supervisor?.email || '',
                supervisorContactMobile: contactsMap.supervisor?.mobile || '',

                // Include all original contacts array for reference
                allContacts: branchContacts
            };
        });
    }
    const fetchBranchContacts = async (branchId, branches) => {
        setLoading(true);
        setError(null);
        const customerId = branches.find((branch) => branch.id === branchId)?.customerId;
        console.log('Customer ID:', customerId);
        try {
            const response = await fetch(`http://localhost:3000/api/customer-contacts/branch/${branchId}/customer/${customerId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const result = await response.json();
            console.log('API Response:', result);
            if (result.status === 'Ok') {
                const transformedBranch = transformBranchData(branches, result.data);
                console.log('Transformed Branch:', transformedBranch);
                transformedBranch.filter((branch) => branch.id === branchId).forEach((branch) => {
                    setTransformedBranches([branch]);
                }

                );
                console.log('Transformed Branches:', transformedBranches);

            } else {
                throw new Error(response.data.message || 'Failed to fetch customer contacts');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching customer contacts:', err);
        } finally {
            setLoading(false);
        }
    };
    const handleBranchFieldChange = (branchId, fieldName, value) => {
        // setBranchChanges(prev => ({
        //     ...prev,
        //     [branchId]: {
        //         ...prev[branchId],
        //         [fieldName]: value
        //     }
        // }));
        // console.log('Branch changes', branchChanges);
        // Also update the local branches data for UI
        // onBranchesChange(prev =>
        //     prev.map(branch =>
        //         branch.id === branchId ? { ...branch, [fieldName]: value } : branch
        //     )
        // );
    };

    // const BranchDetailsForm = ({ branch, branchChanges, handleBranchFieldChange }) => {
    //     console.log(branch)
    //     const { t } = useTranslation();
    //     const [showMap, setShowMap] = useState(false);
    //     const [selectedLocation, setSelectedLocation] = useState(null);
    //     const [sameAsCustomer, setSameAsCustomer] = useState(false);
    //     const [approvalRequired, setApprovalRequired] = useState(branch.approvalRequiredForOrdering || false);
    //     // Track changes for a specific branch field


    //     const handleInputChange = (e) => {
    //         const { name, value } = e.target;
    //         handleBranchFieldChange(branch.id, name, value);
    //     };
    //     // const fields = [
    //     //     { label: 'Branch', value: branch.branchNameEn, placeholder: 'Branch', required: true },
    //     //     { label: 'Branch (Arabic)', value: branch.branchNameLc, placeholder: 'Branch', required: true },
    //     //     { label: 'Building Name', value: branch.buildingName, placeholder: 'Building Name', required: true },
    //     //     { label: 'Street', value: branch.street, placeholder: 'Street Name', required: true },
    //     //     { label: 'City', value: branch.city, placeholder: 'City', required: true },
    //     //     { label: 'Location Type', value: branch.locationType, placeholder: 'Location Type', required: true },
    //     //     {
    //     //         label: 'Geolocation',
    //     //         value: selectedLocation ? `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}` : 'Select Location',
    //     //         placeholder: 'Geolocation',
    //     //         isLocation: true,
    //     //         required: true
    //     //     },
    //     // ];
    //     const fields = [
    //         { label: 'Branch', name: 'branchNameEn', placeholder: 'Branch', required: true },
    //         { label: 'Branch (Arabic)', name: 'branchNameLc', placeholder: 'Branch (Arabic)', required: true },
    //         { label: 'Building Name', name: 'buildingName', placeholder: 'Building Name', required: true },
    //         { label: 'Street', name: 'street', placeholder: 'Street', required: true },
    //         { label: 'City', name: 'city', placeholder: 'City', required: true },
    //         { label: 'Location Type', name: 'locationType', placeholder: 'Location Type', required: true },
    //         {
    //             label: 'Geolocation',
    //             name: 'geolocation',
    //             placeholder: 'Geolocation',
    //             isLocation: true,
    //             required: true
    //         }
    //     ];


    //     const handleLocationSelect = (lat, lng) => {
    //         setSelectedLocation({ lat, lng });
    //         setShowMap(false);
    //     };

    //     return (
    //         <div className="form-section">
    //             <h3>{t('Branch Details')}</h3>

    //             <div className="form-group">
    //                 <label>
    //                     <input
    //                         type="checkbox"
    //                         checked={sameAsCustomer}
    //                         onChange={(e) => setSameAsCustomer(e.target.checked)}
    //                     />
    //                     {'\t' + t('Same as Customer Details')}
    //                 </label>
    //                 <div className="form-group">
    //                     <label>
    //                         <input
    //                             type="checkbox"
    //                             checked={approvalRequired}
    //                             onChange={(e) => setApprovalRequired(e.target.checked)}
    //                         />
    //                         {'\t' + t('Approval Required for Ordering')}
    //                     </label>
    //                 </div>

    //             </div>

    //             <div className="form-row">
    //                 {fields.map((field, index) => {
    //                     const changedValue = branchChanges?.[branch.id]?.[field.name];
    //                     const value = changedValue !== undefined ? changedValue : branch[field.name] || '';
    //                     return (
    //                         <div className="form-group" key={index}>
    //                             <label>
    //                                 {t(field.label)}
    //                                 {field.required && <span className="required-field">*</span>}
    //                             </label>

    //                             {
    //                                 field.isLocation ? (
    //                                     <div className="location-input-container">
    //                                         <input
    //                                             value={value}
    //                                             placeholder={t(field.placeholder)}
    //                                             readOnly = {true}
    //                                         />
    //                                         <button
    //                                             className="location-picker-button"
    //                                             onClick={() => setShowMap(true)}
    //                                         >
    //                                             <FontAwesomeIcon icon={faLocationDot} />
    //                                         </button>
    //                                     </div>
    //                                 ) : (
    //                                     <input type='text' value={value} placeholder={t(field.placeholder)} onChange={(e) => handleInputChange} />
    //                                 )
    //                             }
    //                         </div>
    //                     )
    //                 })}
    //             </div>

    //             {
    //                 showMap && (
    //                     <div className="map-modal">
    //                         <div className="map-modal-content">
    //                             <button
    //                                 className="close-modal-button"
    //                                 onClick={() => setShowMap(false)}
    //                             >
    //                                 <FontAwesomeIcon icon={faXmark} />
    //                             </button>
    //                             <h3>{t('Select Location')}</h3>
    //                             <LocationPicker onLocationSelect={handleLocationSelect} />
    //                         </div>
    //                     </div>
    //                 )
    //             }
    //         </div >
    //     );
    // };

const BranchDetailsForm = ({ branch, branchChanges, handleBranchFieldChange }) => {
    const { t } = useTranslation();
    const [showMap, setShowMap] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    
    // Get current values from branchChanges or fall back to branch data
    const getFieldValue = (fieldName) => {
        return branchChanges?.[branch.id]?.[fieldName] ?? branch[fieldName] ?? '';
    };

    // Handle checkbox changes
    const [sameAsCustomer, setSameAsCustomer] = useState(
        getFieldValue('sameAsCustomer') || false
    );
    const [approvalRequired, setApprovalRequired] = useState(
        getFieldValue('approvalRequiredForOrdering') || false
    );

    // Use useCallback to memoize the handler
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        handleBranchFieldChange(branch.id, name, value);
    }, [branch.id, handleBranchFieldChange]);

    const handleCheckboxChange = useCallback((e) => {
        const { name, checked } = e.target;
        if (name === 'sameAsCustomer') {
            setSameAsCustomer(checked);
        } else if (name === 'approvalRequiredForOrdering') {
            setApprovalRequired(checked);
        }
        handleBranchFieldChange(branch.id, name, checked);
    }, [branch.id, handleBranchFieldChange]);

    const handleLocationSelect = useCallback((lat, lng) => {
        setSelectedLocation({ lat, lng });
        setShowMap(false);
        handleBranchFieldChange(branch.id, 'geolocation', `${lat},${lng}`);
    }, [branch.id, handleBranchFieldChange]);

    const fields = useMemo(() => [
        { label: 'Branch', name: 'branchNameEn', placeholder: 'Branch', required: true },
        { label: 'Branch (Arabic)', name: 'branchNameLc', placeholder: 'Branch (Arabic)', required: true },
        { label: 'Building Name', name: 'buildingName', placeholder: 'Building Name', required: true },
        { label: 'Street', name: 'street', placeholder: 'Street', required: true },
        { label: 'City', name: 'city', placeholder: 'City', required: true },
        { label: 'Location Type', name: 'locationType', placeholder: 'Location Type', required: true },
        {
            label: 'Geolocation',
            name: 'geolocation',
            placeholder: 'Geolocation',
            isLocation: true,
            required: true
        }
    ], []);

    return (
        <div className="form-section">
            <h3>{t('Branch Details')}</h3>

            <div className="form-group">
                <label>
                    <input
                        type="checkbox"
                        name="sameAsCustomer"
                        checked={sameAsCustomer}
                        onChange={handleCheckboxChange}
                    />
                    {'\t' + t('Same as Customer Details')}
                </label>
                <div className="form-group">
                    <label>
                        <input
                            type="checkbox"
                            name="approvalRequiredForOrdering"
                            checked={approvalRequired}
                            onChange={handleCheckboxChange}
                        />
                        {'\t' + t('Approval Required for Ordering')}
                    </label>
                </div>
            </div>

            <div className="form-row">
                {fields.map((field, index) => {
                    const value = getFieldValue(field.name);
                    const displayValue = field.isLocation && selectedLocation 
                        ? `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}` 
                        : value;

                    return (
                        <div className="form-group" key={index}>
                            <label>
                                {t(field.label)}
                                {field.required && <span className="required-field">*</span>}
                            </label>

                            {field.isLocation ? (
                                <div className="location-input-container">
                                    <input
                                        value={displayValue}
                                        placeholder={t(field.placeholder)}
                                        readOnly
                                    />
                                    <button
                                        type="button"
                                        className="location-picker-button"
                                        onClick={() => setShowMap(true)}
                                    >
                                        <FontAwesomeIcon icon={faLocationDot} />
                                    </button>
                                </div>
                            ) : (
                                <input 
                                    type="text" 
                                    name={field.name}
                                    value={value}
                                    placeholder={t(field.placeholder)}
                                    onChange={handleInputChange}
                                />
                            )}
                        </div>
                    )
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
                        <h3>{t('Select Location')}</h3>
                        <LocationPicker onLocationSelect={handleLocationSelect} />
                    </div>
                </div>
            )}
        </div>
    );
};
    const ContactRow = ({ label, isRequired, onChange }) => {
        const { t } = useTranslation();
        return (
            <div className="form-row">
                <div className='form-group'>
                    <label></label>
                    <input
                        placeholder={t(`${label} Name`)}
                        required={isRequired}
                        onChange={onChange}
                    />
                </div>
                <div className='form-group'>
                    <label></label>
                    <input
                        placeholder={t("Designation")}
                        required={isRequired}
                        onChange={onChange}
                    />
                </div>
                <div className='form-group'>
                    <label></label>
                    <input
                        placeholder={t("Email")}
                        required={isRequired}
                        onChange={onChange}
                    />
                </div>
                <div className='form-group'>
                    <label></label>
                    <input
                        placeholder={t("Phone")}
                        required={isRequired}
                        onChange={onChange}
                    />
                </div>
            </div>
        );
    };

    const ContactSection = ({ branch }) => {
        console.log(branch)
        const { t } = useTranslation();

        // Contact types we want to display
        const contactTypes = [
            {
                type: 'primary',
                label: 'Primary Contact',
                isRequired: true,
                fields: {
                    name: branch.primaryContactName || '',
                    designation: branch.primaryContactDesignation || '',
                    email: branch.primaryContactEmail || '',
                    phone: branch.primaryContactMobile || ''
                }
            },
            {
                type: 'secondary',
                label: 'Secondary Contact',
                isRequired: true,
                fields: {
                    name: branch.secondaryContactName || '',
                    designation: branch.secondaryContactDesignation || '',
                    email: branch.secondaryContactEmail || '',
                    phone: branch.secondaryContactMobile || ''
                }
            },
            {
                type: 'supervisor',
                label: 'Supervisor Contact',
                isRequired: false,
                fields: {
                    name: branch.supervisorContactName || '',
                    designation: branch.supervisorContactDesignation || '',
                    email: branch.supervisorContactEmail || '',
                    phone: branch.supervisorContactMobile || ''
                }
            }
        ];

        const handleContactChange = (contactType, field, value) => {
            const fieldName = `${contactType}Contact${field.charAt(0).toUpperCase() + field.slice(1)}`;
            handleBranchFieldChange(branch.id, fieldName, value);
        };

        return (
            <div className="form-section">
                <h3>{t('Personal Details')}</h3>
                {contactTypes.map(({ type, label, isRequired, fields }, index) => (
                    <div className='form row' key={index}>
                        <div className='form-group'>
                            <label>
                                {t(label)}
                                {isRequired && <span className="required-field">*</span>}
                            </label>
                            <div className="form-row">
                                <div className='form-group'>
                                    <input
                                        placeholder={t("Name")}
                                        value={fields.name}
                                        required={isRequired}
                                    onChange={(e) => handleContactChange(type, 'name', e.target.value)}
                                    />
                                </div>
                                <div className='form-group'>
                                    <input
                                        placeholder={t("Designation")}
                                        value={fields.designation}
                                        required={isRequired}
                                    onChange={(e) => handleContactChange(type, 'designation', e.target.value)}
                                    />
                                </div>
                                <div className='form-group'>
                                    <input
                                        placeholder={t("Email")}
                                        value={fields.email}
                                        required={isRequired}
                                    onChange={(e) => handleContactChange(type, 'email', e.target.value)}
                                    />
                                </div>
                                <div className='form-group'>
                                    <input
                                        placeholder={t("Phone")}
                                        value={fields.phone}
                                        required={isRequired}
                                    onChange={(e) => handleContactChange(type, 'mobile', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };
    const parseTimeRange = (timeRange) => {
        if (typeof timeRange === 'object') return timeRange;
        const [from, to] = timeRange.split('-');
        return { from, to };
    };
    const OperatingHours = ({ hoursData, branchId }) => {
        const handleHoursChange = (day, type, field, value) => {
            // Create updated hours object
            const updatedHours = { ...hours };
            updatedHours[day][type][field] = value;

            // Stringify and send to parent
            const hoursString = stringifyHours(updatedHours);
            handleBranchFieldChange(branchId, 'hours', hoursString);
        };
        console.log(hoursData)
        const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const { t } = useTranslation();

        // Initialize state with parsed hours or defaults
        const [hours, setHours] = useState(() => {
            const defaultHours = weekdays.reduce((acc, day) => ({
                ...acc,
                [day]: {
                    operating: { from: '09:00', to: '18:00' },
                    delivery: { from: '09:00', to: '18:00' }
                }
            }), {});

            if (!hoursData) return defaultHours;

            try {
                const parsedData = typeof hoursData === 'string' ? JSON.parse(hoursData) : hoursData;
                console.log(parsedData)
                return weekdays.reduce((acc, day) => ({
                    ...acc,
                    [day]: {
                        operating: parseTimeRange(parsedData.operatingHours?.[day] || '09:00-18:00'),
                        delivery: parseTimeRange(parsedData.deliveryHours?.[day] || '09:00-18:00')
                    }
                }), {});
            } catch (e) {
                console.error('Error parsing hours data:', e);
                return defaultHours;
            }
        });
        console.log(hours)
        const [modifiedDays, setModifiedDays] = useState({});
        const [activeField, setActiveField] = useState(null);
        const [originalValues, setOriginalValues] = useState({});





        const applyAllHours = (sourceDay, type) => {
            const timeToApply = hours[sourceDay][type];

            setHours(prev => ({
                ...prev,
                ...weekdays.reduce((acc, day) => ({
                    ...acc,
                    [day]: {
                        ...prev[day],
                        [type]: timeToApply
                    }
                }), {})
            }));
            setModifiedDays({});
        };

        const handleConfirm = () => setActiveField(null);

        const handleCancel = () => {
            if (activeField) {
                const [day, type, field] = activeField.split('-');
                const originalValue = originalValues[activeField];

                setHours(prev => ({
                    ...prev,
                    [day]: {
                        ...prev[day],
                        [type]: {
                            ...prev[day][type],
                            [field]: originalValue
                        }
                    }
                }));

                setActiveField(null);
            }
        };

        const formatDayName = (day) => day.charAt(0).toUpperCase() + day.slice(1);

        return (
            <div className="form-section">
                <h3>
                    {t('Operating And Delivery Hours')}
                    <span className="required-field">*</span>
                </h3>
                <table className="hours-table">
                    <thead>
                        <tr>
                            <th>{t('Day')}</th>
                            <th>{t('Operating Hours')}</th>
                            <th>{t('Delivery Hours')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {weekdays.map((day) => (
                            <tr key={day} className={day === 'friday' ? 'friday-row' : ''}>
                                <td>{t(formatDayName(day))}</td>

                                {/* Operating Hours */}
                                <td>
                                    <TimeInputGroup
                                        day={day}
                                        type="operating"
                                        time={hours[day].operating}
                                        isActive={activeField}
                                        isModified={modifiedDays[day]}
                                        onChange={handleHoursChange}
                                        onFocus={(field, value) => {
                                            setActiveField(`${day}-operating-${field}`);
                                            setOriginalValues(prev => ({
                                                ...prev,
                                                [`${day}-operating-${field}`]: value
                                            }));
                                        }}
                                        onApplyAll={() => applyAllHours(day, 'operating')}
                                    />
                                </td>

                                {/* Delivery Hours */}
                                <td>
                                    <TimeInputGroup
                                        day={day}
                                        type="delivery"
                                        time={hours[day].delivery}
                                        isActive={activeField}
                                        isModified={modifiedDays[day]}
                                        onChange={handleHoursChange}
                                        onFocus={(field, value) => {
                                            setActiveField(`${day}-delivery-${field}`);
                                            setOriginalValues(prev => ({
                                                ...prev,
                                                [`${day}-delivery-${field}`]: value
                                            }));
                                        }}
                                        onApplyAll={() => applyAllHours(day, 'delivery')}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Extracted TimeInputGroup component for better readability
    const TimeInputGroup = ({ day, type, time, isActive, isModified, onChange, onFocus, onApplyAll }) => {
        console.log('time from', time.from)
        return (
            <div className={`time-input-group ${day === 'friday' ? 'friday-time-input-group' : ''}`}>
                <input
                    type="time"
                    value={time.from}
                    onChange={(e) => onChange(day, type, 'from', e.target.value)}
                    onFocus={() => onFocus('from', time.from)}
                    onBlur={() => { }}
                />
                <span>-</span>
                <input
                    type="time"
                    value={time.to}
                    onChange={(e) => onChange(day, type, 'to', e.target.value)}
                    onFocus={() => onFocus('to', time.to)}
                    onBlur={() => { }}
                />

                {(isActive === `${day}-${type}-from` || isActive === `${day}-${type}-to`) && (
                    <div className="time-action-buttons">
                        <button className="time-confirm-button" /*onClick={onConfirm}*/>
                            <FontAwesomeIcon icon={faCheck} />
                        </button>
                        <button className="time-cancel-button" /*onClick={onCancel}*/>
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
            </div>
        );
    };
    // Pass changes back to parent when needed
    // useEffect(() => {
    //     if (onBranchChanges && Object.keys(branchChanges).length > 0) {
    //         onBranchChanges(branchChanges);
    //     }
    // }, [branchChanges, onBranchChanges]);

    // useEffect(() => {
    //     const fetchBranches = async () => {
    //         try {
    //             const response = await fetch(`http://localhost:3000/api/customer-branches/cust-id/${customer.id}`, {
    //                 // const response = await fetch(`http://localhost:3000/api/customers/pagination?${params.toString()}`, {
    //                 method: 'GET',
    //                 headers: { 'Content-Type': 'application/json' },
    //                 credentials: 'include'
    //             });
    //             if (!response.ok) {
    //                 throw new Error('Failed to fetch branches');
    //             }
    //             const data = await response.json();
    //             setBranches(data);
    //             onBranchesChange(data);
    //             console.log('Branches:', data);
    //         } catch (err) {
    //             setError(err.message);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     if (customer?.id) {
    //         fetchBranches();
    //     }
    // }, [customer]);
const fetchBranches = useCallback(async () => {
  try {
    const response = await fetch(`http://localhost:3000/api/customer-branches/cust-id/${customer.id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    if (!response.ok) throw new Error('Failed to fetch branches');
    
    const data = await response.json();
    setBranches(data);
    // onBranchesChange(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, [customer.id]);

// Fetch immediately
useMemo(() => {
  if (customer?.id) {
    fetchBranches();
  }
}, [customer?.id, fetchBranches]);
    useEffect(() => {
        const baseRowHeight = 80;
        const collapsedExtraHeight = 40;
        const expandedExtraHeight = 1100;

        const numRows = currentItems.length;
        const rowHeightTotal = numRows * baseRowHeight;

        const contentHeight = rowHeightTotal + (expandedRows.length > 0 ? expandedExtraHeight : collapsedExtraHeight);

        setTabsHeight(`${contentHeight}px`);
    }, [expandedRows.length, currentItems.length]);

    // ... other existing functions remain the same

    const parseOperatingHours = (hoursJson) => {
        try {
            const hours = JSON.parse(hoursJson);
            return Object.entries(hours).reduce((acc, [day, timeRange]) => {
                const [from, to] = timeRange.split('-');
                acc[day] = { from, to };
                return acc;
            }, {});
        } catch (e) {
            // Return default hours if parsing fails
            const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            return weekdays.reduce((acc, day) => {
                acc[day] = { from: '09:00', to: '18:00' };
                return acc;
            }, {});
        }
    };

    if (loading) return <div>Loading branches...</div>;
    if (error) return <div>Error: {error}</div>;




    const toggleRow = (branchId) => {
        setExpandedRows((prev) =>
            prev.includes(branchId) ? [] : [branchId]
        );
        console.log(branchId)
        fetchBranchContacts(branchId, currentItems);
    };


    const isExpanded = (orderId) => expandedRows.includes(orderId);

    return (
        <div className="branches-content" ref={contentRef}>
            <div className="form-main-header">
                <a href="#">{t('Customer Approval Checklist')}</a>
            </div>
            <div className="branches-page-header">
                <div className="branches-header-controls">
                    <input type="text" placeholder={t('Search...')} className="branches-search-input" />
                    <div className="branches-action-buttons">
                        <button className='branches-approve-button'>{t('Approve')}</button>
                        <button className='branches-reject-button'>{t('Reject')}</button>
                        <button className="branches-add-button">{t('+ Add')}</button>
                        <div className="action-menu-container" ref={actionMenuRef}>
                            <FontAwesomeIcon icon={faEllipsisV} className="action-menu-icon" onClick={() => setActionMenuOpen(!isActionMenuOpen)} />
                            {isActionMenuOpen && (
                                <div className="action-menu">
                                    <div className="action-menu-item">{t('Export')}</div>
                                    <div className="action-menu-item">{t('Import')}</div>
                                    <div className="action-menu-item">{t('Settings')}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {isMobile ? (
                <div className="branches-list">
                    {currentItems.map((branch) => (
                        <div key={branch.id} className="branch-card">
                            <div className="branch-summary" onClick={() => toggleRow(branch.id)}>
                                <div className="branch-id">{branch.erp_branch_id || branch.id}</div>
                                <div className="branch-name">{branch.branch_name_en}</div>
                                <div className="branch-status">
                                    <span className={`branches-status-badge ${getStatusClass(branch.branch_status)}`}>
                                        {t(branch.branch_status)}
                                    </span>
                                </div>
                                <button className="branches-toggle-row-btn">
                                    {isExpanded(branch.id)
                                        ? <FontAwesomeIcon icon={faChevronDown} />
                                        : <FontAwesomeIcon icon={faChevronRight} />}
                                </button>
                            </div>
                            {isExpanded(branch.id) && (
                                <div className="branch-expanded">
                                    <BranchDetailsForm
                                        branch={branch}
                                         />
                                    <ContactSection branch={branch} />
                                    <OperatingHours hoursData={branch.hours} branchId={branch.id} />
                                </div>
                            )}
                        </div>
                    ))}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => {
                            setCurrentPage(page);
                            setExpandedRows([]);
                        }}
                        startIndex={startIndex}
                        endIndex={Math.min(endIndex, branches.length)}
                        totalItems={branches.length}
                    />
                </div>
            ) : (
                <div className="branches-table-container">
                    <table className="branches-data-table">
                        <thead>
                            <tr>
                                <th className="desktop-only">{t('Branch ID')}</th>
                                <th className="desktop-only">{t('Branch Name')}</th>
                                <th className="desktop-only">{t('City')}</th>
                                <th className="desktop-only">{t('Location Type')}</th>
                                <th>{t('Status')}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((branch) => (
                                <React.Fragment key={branch.id}>
                                    <tr onClick={() => toggleRow(branch.id)} className={isExpanded(branch.id) ? 'branches-expanded-row' : ''}>
                                        <td className="mobile-only mobile-primary" data-label="Branch">
                                            <div className="mobile-content">
                                                <span className="mobile-title">{branch.erp_branch_id || branch.id}</span>
                                                <span className="mobile-subtitle">{branch.branch_name_en}</span>
                                            </div>
                                        </td>
                                        <td className="mobile-secondary">
                                            <span className={`branches-status-badge ${getStatusClass(branch.branch_status)}`}>
                                                {t(branch.branch_status)}
                                            </span>
                                        </td>
                                        <td className="desktop-only">{branch.erp_branch_id || branch.id}</td>
                                        <td className="desktop-only">{branch.branchNameEn}</td>
                                        <td className="desktop-only">{branch.city}</td>
                                        <td className="desktop-only">{branch.locationType}</td>
                                        <td className='desktop-only'>
                                            <span className={`branches-status-badge ${getStatusClass(branch.branch_status)}`}>
                                                {t(branch.branchStatus)}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="branches-toggle-row-btn">
                                                {isExpanded(branch.id)
                                                    ? <FontAwesomeIcon icon={faChevronDown} />
                                                    : <FontAwesomeIcon icon={faChevronRight} />}
                                            </button>
                                        </td>
                                    </tr>
                                    {!isMobile && isExpanded(branch.id) && (
                                        <tr className="expanded-row">
                                            <td colSpan="6">
                                                <div className="expanded-form-container">
                                                    <BranchDetailsForm
                                                        branch={branch}
                                                         />
                                                    <ContactSection branch={transformedBranches[0]} />
                                                    <OperatingHours hoursData={branch.hours} branchId={branch.id} />
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => {
                            setExpandedRows([]);
                            setCurrentPage(page);
                        }}
                        startIndex={startIndex}
                        endIndex={Math.min(endIndex, branches.length)}
                        totalItems={branches.length}
                    />
                </div>
            )}
        </div>
    );
}

export default Branches;