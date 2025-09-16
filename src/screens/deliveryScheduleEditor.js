import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/components.css";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import Swal from "sweetalert2";
import axios from "axios";
import SearchableDropdown from "../components/SearchableDropdown";
import Tabs from "../components/Tabs";

function DeliveryScheduleEditor() {
    const [deliverySchedules, setDeliverySchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({
        region: "",
        city: "",
        cutoffDay: "",
        pickupDay: "",
        deliveryDay: ""
    });
    const [newSchedule, setNewSchedule] = useState({
        region: "",
        city: "",
        cutoffDay: "",
        pickupDay: "",
        deliveryDay: ""
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(1000);
    const [activeTab, setActiveTab] = useState("SHC"); // Initialize with SHC as default

    // Geographic data states
    const [geoData, setGeoData] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [editSelectedRegion, setEditSelectedRegion] = useState("");
    const [editSelectedCity, setEditSelectedCity] = useState("");

    const { t, i18n } = useTranslation();
    const { user, token } = useAuth();
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    // Define tabs array
    const tabs = [
        { value: "VMCO", label: "VMCO", disabled: true },
        { value: "SHC", label: "SHC", disabled: false },
        { value: "GMTC", label: "GMTC", disabled: true },
        { value: "NAQI", label: "NAQI", disabled: true },
        { value: "DAR", label: "DAR", disabled: true }
    ];

    // Fetch geo data on component mount
    useEffect(() => {
        fetchGeoData();
    }, []);


    //RBAC
    const rbacMgr = new RbacManager(user?.userType === "employee" && user?.roles[0] !== "admin" ? user?.designation : user?.roles[0], "deliveryScheduleEditor");

    useEffect(() => {
        if (activeTab) { // Only fetch when there's an active tab
            fetchDeliverySchedules();
        }
    }, [currentPage, searchTerm, activeTab]);

    const fetchGeoData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/geoLocation`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
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

    const fetchDeliverySchedules = async () => {
        setLoading(true);
        try {
            const apiUrl = `${API_BASE_URL}/delivery-schedule/pagination`;

            // Remove entity from filters since we're passing it as a separate parameter
            const filters = {};

            const params = new URLSearchParams({
                page: currentPage,
                pageSize: pageSize,
                search: searchTerm,
                sortBy: "id",
                sortOrder: "asc",
                filters: JSON.stringify(filters),
                entity: activeTab // Add entity as separate parameter
            });

            const response = await axios.get(`${apiUrl}?${params}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data?.status?.toLowerCase() === "ok") {
                setDeliverySchedules(response.data.data.data || []);
                setTotalPages(response.data.data.totalPages || 1);
            }
        } catch (err) {
            console.error("Error fetching delivery schedules:", err);
            Swal.fire({
                title: "Error",
                text: "Failed to fetch delivery schedules",
                icon: "error",
                confirmButtonText: "OK",
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle tab change
    const handleTabChange = (tabValue) => {
        // Only allow SHC tab to be selected
        if (tabValue === "SHC") {
            setActiveTab(tabValue);
            setCurrentPage(1); // Reset to first page when tab changes
        }
    };

    // Get region options
    const getRegionOptions = () => {
        if (!geoData) return [];
        return Object.keys(geoData).map((region) => ({
            value: region,
            name: i18n.language === "ar" ? geoData[region].ar : geoData[region].en,
        }));
    };

    // Get city options based on selected region
    const getCityOptions = (regionKey) => {
        if (!regionKey || !geoData || !geoData[regionKey]?.cities) return [];
        return Object.keys(geoData[regionKey].cities).map((city) => ({
            value: city,
            name: i18n.language === "ar"
                ? geoData[regionKey].cities[city].ar
                : geoData[regionKey].cities[city].en,
        }));
    };

    // Handle region selection for add form
    const handleRegionChange = (e) => {
        const region = e.target.value;
        setSelectedRegion(region);
        setSelectedCity("");
        setNewSchedule({
            ...newSchedule,
            region: region,
            city: ""
        });
    };

    // Handle city selection for add form
    const handleCityChange = (e) => {
        const city = e.target.value;
        setSelectedCity(city);
        setNewSchedule({
            ...newSchedule,
            city: city
        });
    };

    const handleAddSchedule = async () => {
        // Validate required fields
        const requiredFields = ["region", "city", "cutoffDay", "pickupDay", "deliveryDay"];
        const missingFields = requiredFields.filter(field => !newSchedule[field]);

        if (missingFields.length > 0) {
            Swal.fire({
                title: "Validation Error",
                text: `Please fill in all required fields: ${missingFields.join(", ")}`,
                icon: "warning",
                confirmButtonText: "OK",
            });
            return;
        }

        setLoading(true);
        try {
            const apiUrl = `${API_BASE_URL}/delivery-schedule`;

            // Create the payload with entity from active tab
            const payload = {
                entity: activeTab, // Add entity from active tab
                region: newSchedule.region,
                city: newSchedule.city,
                cutoffDay: newSchedule.cutoffDay,
                pickupDay: newSchedule.pickupDay,
                deliveryDay: newSchedule.deliveryDay,
                createdBy: user?.id || 1,
                modifiedBy: user?.id || 1
            };

            console.log("Sending payload:", payload); // Debug log

            const response = await axios.post(apiUrl, payload, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data?.status?.toLowerCase() === "ok") {
                Swal.fire({
                    title: "Success",
                    text: "Delivery schedule created successfully",
                    icon: "success",
                    confirmButtonText: "OK",
                });

                // Reset form and refresh data
                setNewSchedule({
                    region: "",
                    city: "",
                    cutoffDay: "",
                    pickupDay: "",
                    deliveryDay: ""
                });
                setSelectedRegion("");
                setSelectedCity("");
                setShowAddForm(false);
                fetchDeliverySchedules();
            }
        } catch (err) {
            console.error("Error creating delivery schedule:", err);
            console.error("Response data:", err.response?.data);
            Swal.fire({
                title: "Error",
                text: err.response?.data?.message || "Failed to create delivery schedule",
                icon: "error",
                confirmButtonText: "OK",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (schedule) => {
        setEditData({
            region: schedule.region,
            city: schedule.city,
            cutoffDay: schedule.cutoffDay,
            pickupDay: schedule.pickupDay,
            deliveryDay: schedule.deliveryDay
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async () => {
        if (!editData.pickupDay?.trim() || !editData.deliveryDay?.trim()) {
            Swal.fire({
                title: "Validation Error",
                text: "Please fill in both pickup day and delivery day",
                icon: "warning",
                confirmButtonText: "OK",
            });
            return;
        }

        setLoading(true);
        try {
            const apiUrl = `${API_BASE_URL}/delivery-schedule/${activeTab}/${editData.region}/${editData.city}/${editData.cutoffDay}`;

            const payload = {
                pickupDay: editData.pickupDay,
                deliveryDay: editData.deliveryDay,
                modifiedBy: user?.id || 1
            };

            console.log("Updating with payload:", payload);

            const response = await axios.patch(apiUrl, payload, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data?.status?.toLowerCase() === "ok") {
                Swal.fire({
                    title: "Success",
                    text: "Delivery schedule updated successfully",
                    icon: "success",
                    confirmButtonText: "OK",
                });

                setShowEditModal(false);
                fetchDeliverySchedules();
            }
        } catch (err) {
            console.error("Error updating delivery schedule:", err);
            Swal.fire({
                title: "Error",
                text: err.response?.data?.message || "Failed to update delivery schedule",
                icon: "error",
                confirmButtonText: "OK",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = async (schedule) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: `Delete delivery schedule for ${schedule.region} - ${schedule.city} - ${schedule.cutoffDay}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                const apiUrl = `${API_BASE_URL}/delivery-schedule/delete/${activeTab}/${schedule.region}/${schedule.city}/${schedule.cutoffDay}`;

                const response = await axios.delete(apiUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.data?.status?.toLowerCase() === "ok") {
                    Swal.fire({
                        title: "Deleted!",
                        text: "Delivery schedule has been deleted.",
                        icon: "success",
                    });
                    fetchDeliverySchedules();
                }
            } catch (err) {
                console.error("Error deleting delivery schedule:", err);
                Swal.fire({
                    title: "Error",
                    text: err.response?.data?.message || "Failed to delete delivery schedule",
                    icon: "error",
                    confirmButtonText: "OK",
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    return (
        <Sidebar title={t("Delivery Schedule Editor")}>
            <div className="rbac-editor-content">
                {/* Header with Search and Add Button */}
                <div className="logs-header">
                    <div className="logs-header-controls">
                        <div className="search-container" style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                            <input
                                type="text"
                                placeholder="Search delivery schedules..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="form-control"
                                style={{
                                    fontSize: "12px",
                                    padding: "8px 12px",
                                    height: "40px",
                                    border: "1px solid #ccc",
                                    borderRadius: "8px",
                                    width: "300px",
                                }}
                            />
                            <button
                                className="clear-filters-btn"
                                onClick={() => setShowAddForm(!showAddForm)}
                                disabled={!activeTab} // Disable when no tab is active
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: !activeTab ? '#ccc' : '#28a745', // Gray out when disabled
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: !activeTab ? 'not-allowed' : 'pointer', // Show not-allowed cursor when disabled
                                    fontWeight: 'bold',
                                    opacity: !activeTab ? 0.6 : 1, // Reduce opacity when disabled
                                }}
                                title={!activeTab ? "Please select an entity tab first" : ""}
                            >
                                {showAddForm ? 'Cancel' : 'Add Schedule'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="tabs-section" style={{ marginTop: "20px" }}>
                    <div style={{
                        display: "flex",
                        width: "60%",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 12,
                        overflowX: "auto",
                        scrollbarWidth: "none"
                    }}>
                        <Tabs
                            tabs={tabs}
                            activeTab={activeTab}
                            onTabChange={handleTabChange}
                            variant="category"
                        />
                    </div>
                </div>

                {/* Show current entity info */}
                {activeTab && (
                    <div style={{
                        marginTop: "10px",
                        padding: "8px 12px",
                        backgroundColor: "#e3f2fd",
                        borderRadius: "4px",
                        fontSize: "14px",
                        color: "#1976d2",
                        border: "1px solid #bbdefb"
                    }}>
                        <strong>Current Entity:</strong> {activeTab}
                    </div>
                )}

                {/* Add Form - Only show when activeTab exists */}
                {showAddForm && activeTab && (
                    <div style={{
                        marginTop: "20px",
                        padding: "20px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        border: "1px solid #dee2e6"
                    }}>
                        <h4>Add New Delivery Schedule for {activeTab}</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginTop: "15px" }}>
                            <div>
                                <label>Region</label>
                                <SearchableDropdown
                                    name="region"
                                    value={selectedRegion}
                                    onChange={handleRegionChange}
                                    placeholder="Select Region"
                                    options={getRegionOptions()}
                                    style={{
                                        marginTop: "10px",
                                        fontSize: "12px",
                                        height: "40px",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                        width: "100%",
                                    }}
                                />
                            </div>
                            <div>
                                <label>City</label>
                                <SearchableDropdown
                                    name="city"
                                    value={selectedCity}
                                    onChange={handleCityChange}
                                    placeholder="Select City"
                                    options={getCityOptions(selectedRegion)}
                                    disabled={!selectedRegion}
                                    style={{
                                        marginTop: "10px",
                                        fontSize: "12px",
                                        height: "40px",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                        width: "100%",
                                    }}
                                />
                            </div>
                            <div>
                                <label>Cut-off Day</label>
                                <SearchableDropdown
                                    name="cutoffDay"
                                    value={newSchedule.cutoffDay}
                                    onChange={(e) => {
                                        console.log("Cutoff Day selected:", e.target.value);
                                        setNewSchedule({ ...newSchedule, cutoffDay: e.target.value });
                                    }}
                                    placeholder="Select Day"
                                    options={daysOfWeek.map(day => ({ value: day, name: day }))}
                                    style={{
                                        marginTop: "10px",
                                        fontSize: "12px",
                                        height: "40px",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                        width: "100%",
                                    }}
                                />
                            </div>

                            <div>
                                <label>Pickup Day</label>
                                <SearchableDropdown
                                    name="pickupDay"
                                    value={newSchedule.pickupDay}
                                    onChange={(e) => {
                                        console.log("Pickup Day selected:", e.target.value);
                                        setNewSchedule({ ...newSchedule, pickupDay: e.target.value });
                                    }}
                                    placeholder="Select Day"
                                    options={daysOfWeek.map(day => ({ value: day, name: day }))}
                                    style={{
                                        marginTop: "10px",
                                        fontSize: "12px",
                                        height: "40px",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                        width: "100%",
                                    }}
                                />
                            </div>

                            <div>
                                <label>Delivery Day</label>
                                <SearchableDropdown
                                    name="deliveryDay"
                                    value={newSchedule.deliveryDay}
                                    onChange={(e) => {
                                        console.log("Delivery Day selected:", e.target.value);
                                        setNewSchedule({ ...newSchedule, deliveryDay: e.target.value });
                                    }}
                                    placeholder="Select Day"
                                    options={daysOfWeek.map(day => ({ value: day, name: day }))}
                                    style={{
                                        marginTop: "10px",
                                        fontSize: "12px",
                                        height: "40px",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                        width: "100%",
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ marginTop: "15px" }}>
                            <button
                                className="clear-filters-btn"
                                onClick={handleAddSchedule}
                                disabled={loading}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#007bff',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginRight: '10px'
                                }}
                            >
                                {loading ? 'Creating...' : 'Create Schedule'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading Indicator */}
                {loading && (
                    <div className="loading-indicator" style={{ textAlign: "center", padding: "20px" }}>
                        Loading...
                    </div>
                )}

                {/* Data Table */}
                <div className="table-container" style={{ marginTop: "20px" }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Entity</th>
                                <th>Region</th>
                                <th>City</th>
                                <th>Cut-off Day</th>
                                <th>Pickup Day</th>
                                <th>Delivery Day</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliverySchedules.map((schedule, index) => (
                                <tr key={index}>
                                    <td>{schedule.entity}</td>
                                    <td>{schedule.region}</td>
                                    <td>{schedule.city}</td>
                                    <td>{schedule.cutoffDay}</td>
                                    <td>{schedule.pickupDay}</td>
                                    <td>{schedule.deliveryDay}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
                                            <button
                                                onClick={() => handleEditClick(schedule)}
                                                style={{
                                                    padding: "4px 8px",
                                                    backgroundColor: "#ffffff",
                                                    color: "#000",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                    fontSize: "12px"
                                                }}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(schedule)}
                                                style={{
                                                    padding: "4px 8px",
                                                    backgroundColor: "#ffffff",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                    fontSize: "12px"
                                                }}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {deliverySchedules.length === 0 && !loading && (
                        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                            {!activeTab ? "Select an Entity Tab" : "No delivery schedules found"}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ marginTop: "20px", textAlign: "center" }}>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            style={{
                                padding: "8px 12px",
                                marginRight: "5px",
                                backgroundColor: currentPage === 1 ? "#ccc" : "#007bff",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: currentPage === 1 ? "not-allowed" : "pointer"
                            }}
                        >
                            Previous
                        </button>
                        <span style={{ margin: "0 15px" }}>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: "8px 12px",
                                marginLeft: "5px",
                                backgroundColor: currentPage === totalPages ? "#ccc" : "#007bff",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: currentPage === totalPages ? "not-allowed" : "pointer"
                            }}
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Edit Modal */}
                {showEditModal && (
                    <div style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: "#fff",
                            padding: "30px",
                            borderRadius: "8px",
                            width: "400px",
                            maxWidth: "90%"
                        }}>
                            <h4 style={{ marginBottom: "20px" }}>Edit Delivery Schedule</h4>

                            <div style={{ marginBottom: "15px" }}>
                                <label>Pickup Day</label>
                                <SearchableDropdown
                                    name="pickupDay"
                                    value={editData.pickupDay}
                                    onChange={(e) => setEditData({ ...editData, pickupDay: e.target.value })}
                                    placeholder="Select Day"
                                    options={daysOfWeek.map(day => ({ value: day, name: day }))}
                                    style={{
                                        marginTop: "10px",
                                        fontSize: "12px",
                                        height: "40px",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                        width: "100%",
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: "20px" }}>
                                <label>Delivery Day</label>
                                <SearchableDropdown
                                    name="deliveryDay"
                                    value={editData.deliveryDay}
                                    onChange={(e) => setEditData({ ...editData, deliveryDay: e.target.value })}
                                    placeholder="Select Day"
                                    options={daysOfWeek.map(day => ({ value: day, name: day }))}
                                    style={{
                                        marginTop: "10px",
                                        fontSize: "12px",
                                        height: "40px",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                        width: "100%",
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditData({
                                            region: "",
                                            city: "",
                                            cutoffDay: "",
                                            pickupDay: "",
                                            deliveryDay: ""
                                        });
                                    }}
                                    style={{
                                        padding: "8px 16px",
                                        backgroundColor: "#6c757d",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer"
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEditSubmit}
                                    disabled={loading}
                                    style={{
                                        padding: "8px 16px",
                                        backgroundColor: "#007bff",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer"
                                    }}
                                >
                                    {loading ? 'Updating...' : 'Update Schedule'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Sidebar>
    );
}

export default DeliveryScheduleEditor;
