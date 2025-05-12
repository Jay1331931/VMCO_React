import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { faToggleOff, faToggleOn, faCheck, faXmark, faLocationDot } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from 'react-i18next';
import Pagination from '../../components/Pagination';
import '../../styles/pagination.css';
import '../../styles/forms.css';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const branches = [
    { id: '0001', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0002', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0003', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0004', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Approved' },
    { id: '0005', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Rejected' },
    { id: '0006', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0007', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0008', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Approved' },
    { id: '0009', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Rejected' },
    { id: '0010', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0011', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Pending' },
    { id: '0012', customer: 'XYZ', branch: 'JP Nagar', entity: 'Entity 1', paymentMethod: 'Credit', deliveryDate: '10 Apr 025', totalAmount: 'SAR2000', status: 'Approved' },
];


const getStatusClass = (status) => {
    switch (status) {
        case 'Approved': return 'status-approved';
        case 'Rejected': return 'status-rejected';
        default: return 'status-pending';
    }
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

const BranchDetailsForm = ({ order }) => {
    const { t } = useTranslation();
    const [showMap, setShowMap] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [sameAsCustomer, setSameAsCustomer] = useState(false);
    const fields = [
        { label: 'Branch', value: order.branch, placeholder: 'Branch', required: true },
        { label: 'City', value: 'Bengaluru', placeholder: 'City', required: true },
        { label: 'Location Type', value: 'Metro', placeholder: 'Location Type', required: true },
        {
            label: 'Geolocation',
            value: selectedLocation ? `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}` : 'Select Location',
            placeholder: 'Geolocation',
            isLocation: true,
            required: true
        },
        { label: 'Region', value: 'Region', placeholder: 'Region', required: true },
        { label: 'Pincode', value: order.deliveryDate, placeholder: 'Pincode', required: true },
    ];

    const handleLocationSelect = (lat, lng) => {
        setSelectedLocation({ lat, lng });
        setShowMap(false);
    };

    return (
        <div className="form-section">
            <h3>{t('Branch Details')}</h3>
            
            <div className="form-group">
                <label>
                    <input 
                        type="checkbox" 
                        checked={sameAsCustomer} 
                        onChange={(e) => setSameAsCustomer(e.target.checked)} 
                    />
                    {'\t' + t('Same as Customer Details')}
                </label>
            </div>
        
            <div className="form-row">
                {fields.map((field, index) => (
                    <div className="form-group" key={index}>
                        <label>
                            {t(field.label)}
                            {field.required && <span className="required-field">*</span>}
                        </label>

                        {
                            field.isLocation ? (
                                <div className="location-input-container">
                                    <input
                                        value={field.value}
                                        placeholder={t(field.placeholder)}
                                        readOnly
                                    />
                                    <button
                                        className="location-picker-button"
                                        onClick={() => setShowMap(true)}
                                    >
                                        <FontAwesomeIcon icon={faLocationDot} />
                                    </button>
                                </div>
                            ) : (
                                <input value={field.value} placeholder={t(field.placeholder)} />
                            )
                        }
                    </div>
                ))}
            </div>

            {
                showMap && (
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
                )
            }
        </div >
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

const ContactSection = () => {
    const contactLabels = [
        { label: 'Primary Contact', isRequired: true },
        { label: 'Secondary Contact', isRequired: true },
        { label: 'Supervisor Contact', isRequired: false }
    ];
    const { t } = useTranslation();
    const [contacts, setContacts] = useState({
        'Primary Contact': { name: '', designation: '', email: '', phone: '' },
        'Secondary Contact': { name: '', designation: '', email: '', phone: '' },
        'Supervisor Contact': { name: '', designation: '', email: '', phone: '' }
    });

    const handleContactChange = (label, field, value) => {
        setContacts(prev => ({
            ...prev,
            [label]: {
                ...prev[label],
                [field]: value
            }
        }));
    };

    return (
        <div className="form-section">
            <h3>{t('Personal Details')}</h3>
            {contactLabels.map(({ label, isRequired }, index) => (
                <div className='form row' key={index}>
                    <div className='form-group'>
                        <label>
                            {t(label)}
                            {isRequired && <span className="required-field">*</span>}
                        </label>
                        <ContactRow
                            label={label}
                            isRequired={isRequired}
                            onChange={(e) => handleContactChange(label, e.target.placeholder.toLowerCase(), e.target.value)}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

const OperatingHours = () => {
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const { t } = useTranslation();
    const [operatingHours, setOperatingHours] = useState(
        weekdays.reduce((acc, day) => {
            acc[day] = { from: '09:00', to: '18:00' };
            return acc;
        }, {})
    );
    const [deliveryHours, setDeliveryHours] = useState(
        weekdays.reduce((acc, day) => {
            acc[day] = { from: '09:00', to: '18:00' };
            return acc;
        }, {})
    );
    const [modifiedDays, setModifiedDays] = useState({});
    const [activeField, setActiveField] = useState(null);
    const [originalValues, setOriginalValues] = useState({});

    const handleOperatingHoursChange = (day, field, value) => {
        setOperatingHours(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: value
            }
        }));
        setModifiedDays(prev => ({ ...prev, [day]: true }));
    };

    const handleDeliveryHoursChange = (day, field, value) => {
        setDeliveryHours(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: value
            }
        }));
        setModifiedDays(prev => ({ ...prev, [day]: true }));
    };

    const applyAllOperatingHours = (sourceDay) => {
        const { from, to } = operatingHours[sourceDay];

        const newHours = weekdays.reduce((acc, day) => {
            acc[day] = { from, to };
            return acc;
        }, {});

        setOperatingHours(newHours);
        setModifiedDays({});
    };

    const applyAllDeliveryHours = (sourceDay) => {
        const { from, to } = deliveryHours[sourceDay];

        const newHours = weekdays.reduce((acc, day) => {
            acc[day] = { from, to };
            return acc;
        }, {});

        setDeliveryHours(newHours);
        setModifiedDays({});
    };

    const handleConfirm = () => {
        setActiveField(null);
    };

    const handleCancel = () => {
        if (activeField) {
            const [day, type, field] = activeField.split('-');
            const originalValue = originalValues[activeField];

            if (type === 'operating') {
                setOperatingHours(prev => ({
                    ...prev,
                    [day]: {
                        ...prev[day],
                        [field]: originalValue
                    }
                }));
            } else {
                setDeliveryHours(prev => ({
                    ...prev,
                    [day]: {
                        ...prev[day],
                        [field]: originalValue
                    }
                }));
            }

            setActiveField(null);
        }
    };

    return (
        <div className="form-section">
            <h3>
                {t('Operating And Delivery Hours For Each Week Day (Mon To Sun)')}
                <span className="required-field">*</span>
            </h3>
            <table className="hours-table">
                <thead>
                    <tr>
                        <th>{t('Day')}</th>
                        <th>
                            {t('Operating Hours (From - To)')}

                        </th>
                        <th>
                            {t('Delivery Hours (From - To)')}

                        </th>
                    </tr>
                </thead>
                <tbody>
                    {weekdays.map((day) => (
                        <tr key={day} className={day === 'Friday' ? 'friday-row' : ''}>
                            <td>{t(day)}</td>
                            <td>
                                <div className={day === 'Friday' ? 'friday-time-input-group' : 'time-input-group'}>
                                    <input
                                        type="time"
                                        value={operatingHours[day].from}
                                        onChange={(e) => handleOperatingHoursChange(day, 'from', e.target.value)}
                                        onFocus={() => setActiveField(`${day}-operating-from`)}
                                        onBlur={() => setActiveField(null)}
                                    />
                                    <span>-</span>
                                    <input
                                        type="time"
                                        value={operatingHours[day].to}
                                        onChange={(e) => handleOperatingHoursChange(day, 'to', e.target.value)}
                                        onFocus={() => setActiveField(`${day}-operating-to`)}
                                        onBlur={() => setActiveField(null)}
                                    />
                                    {(activeField === `${day}-operating-from` || activeField === `${day}-operating-to`) && (
                                        <div className="time-action-buttons">
                                            <button
                                                className="time-confirm-button"
                                                onClick={handleConfirm}
                                            >
                                                <FontAwesomeIcon icon={faCheck} />
                                            </button>
                                            <button
                                                className="time-cancel-button"
                                                onClick={handleCancel}
                                            >
                                                <FontAwesomeIcon icon={faXmark} />
                                            </button>
                                        </div>
                                    )}
                                    {modifiedDays[day] && (
                                        <button
                                            className="apply-row-button"
                                            onClick={() => applyAllOperatingHours(day)}
                                            title="Apply to all days"
                                        >
                                            Apply All
                                        </button>
                                    )}
                                </div>
                            </td>
                            <td>
                                <div className={day === 'Friday' ? 'friday-time-input-group' : 'time-input-group'}>
                                    <input
                                        type="time"
                                        value={deliveryHours[day].from}
                                        onChange={(e) => handleDeliveryHoursChange(day, 'from', e.target.value)}
                                        onFocus={() => setActiveField(`${day}-delivery-from`)}
                                        onBlur={() => setActiveField(null)}
                                    />
                                    <span>-</span>
                                    <input
                                        type="time"
                                        value={deliveryHours[day].to}
                                        onChange={(e) => handleDeliveryHoursChange(day, 'to', e.target.value)}
                                        onFocus={() => setActiveField(`${day}-delivery-to`)}
                                        onBlur={() => setActiveField(null)}
                                    />
                                    {(activeField === `${day}-delivery-from` || activeField === `${day}-delivery-to`) && (
                                        <div className="time-action-buttons">
                                            <button
                                                className="time-confirm-button"
                                                onClick={handleConfirm}
                                            >
                                                <FontAwesomeIcon icon={faCheck} />
                                            </button>
                                            <button
                                                className="time-cancel-button"
                                                onClick={handleCancel}
                                            >
                                                <FontAwesomeIcon icon={faXmark} />
                                            </button>
                                        </div>
                                    )}
                                    {modifiedDays[day] && (
                                        <button
                                            className="apply-row-button"
                                            onClick={() => applyAllDeliveryHours(day)}
                                            title="Apply to all days"
                                        >
                                            Apply All
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
// ========== End Form Components ==========

function Branches({ setTabsHeight }) {
    const [expandedRows, setExpandedRows] = useState([]);
    const { t } = useTranslation();
    const actionMenuRef = useRef(null);
    const [isActionMenuOpen, setActionMenuOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(branches.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = branches.slice(startIndex, endIndex);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const contentRef = useRef();
    useEffect(() => {
        const baseRowHeight = 60;
        const collapsedExtraHeight = 40;
        const expandedExtraHeight = 1000;

        const numRows = currentItems.length;
        const rowHeightTotal = numRows * baseRowHeight;

        const contentHeight = rowHeightTotal + (expandedRows.length > 0 ? expandedExtraHeight : collapsedExtraHeight);

        setTabsHeight(`${contentHeight}px`);
    }, [expandedRows.length, currentItems.length]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleRow = (orderId) => {
        setExpandedRows((prev) =>
            prev.includes(orderId) ? [] : [orderId]
        );
    };


    const isExpanded = (orderId) => expandedRows.includes(orderId);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
                setActionMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                    {currentItems.map((order) => (
                        <div key={order.id} className="branch-card">
                            <div className="branch-summary" onClick={() => toggleRow(order.id)}>
                                <div className="branch-id">{order.id}</div>
                                <div className="branch-id">{order.branch}</div>
                                <div className="branch-status">
                                    <span className={`branches-status-badge ${getStatusClass(order.status)}`}>
                                        {t(order.status)}
                                    </span>
                                </div>
                                <button className="branches-toggle-row-btn">
                                    {isExpanded(order.id)
                                        ? <FontAwesomeIcon icon={faChevronDown} />
                                        : <FontAwesomeIcon icon={faChevronRight} />}
                                </button>
                            </div>
                            {isExpanded(order.id) && (
                                <div className="branch-expanded">
                                    <BranchDetailsForm order={order} />
                                    <ContactSection />
                                    <OperatingHours />
                                </div>
                            )}

                        </div>

                    ))}
                    {/* Pagination */}
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
                // Keep your existing table layout for desktop here

                <div className="branches-table-container">
                    <table className="branches-data-table">
                        <thead>
                            <tr>
                                <th className="desktop-only">{t('Branch')}</th>
                                <th className="desktop-only">{t('City')}</th>
                                <th className="desktop-only">{t('Location Type')}</th>
                                <th className="desktop-only">{t('Geolocation')}</th>
                                <th className="desktop-only">{t('Region')}</th>
                                <th className="desktop-only">{t('Pincode')}</th>
                                <th>{t('Status')}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((order) => (
                                <React.Fragment key={order.id}>
                                    <tr onClick={() => toggleRow(order.id)} className={isExpanded(order.id) ? 'branches-expanded-row' : ''}>
                                        <td className="mobile-only mobile-primary" data-label="Branch ID">
                                            <div className="mobile-content">
                                                <span className="mobile-title">{order.id}</span>
                                                <span className="mobile-subtitle">{order.branch}</span>
                                            </div>
                                        </td>
                                        <td className="mobile-secondary">
                                            <span className={`branches-status-badge ${getStatusClass(order.status)}`}>
                                                {t(order.status)}
                                            </span>
                                        </td>
                                        {/* Hidden columns for desktop data */}
                                        <td className="desktop-only">{order.id}</td>
                                        <td className="desktop-only">{order.branch}</td>
                                        <td className="desktop-only">{order.customer}</td>
                                        <td className="desktop-only">{order.entity}</td>
                                        <td className="desktop-only">{order.paymentMethod}</td>
                                        <td className="desktop-only">{order.deliveryDate}</td>
                                        <td className='desktop-only'>
                                            <span className={`branches-status-badge ${getStatusClass(order.status)}`}>
                                                {t(order.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="branches-toggle-row-btn">
                                                {isExpanded(order.id)
                                                    ? <FontAwesomeIcon icon={faChevronDown} />
                                                    : <FontAwesomeIcon icon={faChevronRight} />}
                                            </button>
                                        </td>
                                    </tr>
                                    {!isMobile && isExpanded(order.id) && (
                                        <tr className="expanded-row">
                                            <td colSpan="8">
                                                <div className="expanded-form-container">
                                                    <BranchDetailsForm order={order} />
                                                    <ContactSection />
                                                    <OperatingHours />
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                </React.Fragment>
                            ))}
                        </tbody>

                    </table>
                    {/* Pagination */}
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
