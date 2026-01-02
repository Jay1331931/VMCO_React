import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import CustomToolbar from "../components/CustomToolbar";
import Pagination from "../components/Pagination";
import Tabs from "../components/Tabs";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/components.css";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import Swal from "sweetalert2";
import axios from "axios";
import SearchableDropdown from "../components/SearchableDropdown";
import { DataGrid, useGridApiRef } from "@mui/x-data-grid";
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import DeleteIcon from '@mui/icons-material/Delete';
import Switch from '@mui/material/Switch';

function DeliveryScheduleEditor() {
    const [deliverySchedules, setDeliverySchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({});
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
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [pageSize] = useState(10);
    const [activeCategory, setActiveCategory] = useState("SHC");
    const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
    const [filterAnchor, setFilterAnchor] = useState(null);
    const [switchLoading, setSwitchLoading] = useState({});
    const [filtersInitialized, setFiltersInitialized] = useState(false);

    // Geographic data states
    const [geoData, setGeoData] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState("");
    const [selectedCity, setSelectedCity] = useState("");

    const { t, i18n } = useTranslation();
    const { user, token } = useAuth();
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const gridApiRef = useGridApiRef();

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    // Define tabs array
    const categoryTabs = [
        { value: "VMCO", label: "VMCO", disabled: true },
        { value: "SHC", label: "SHC", disabled: false },
        { value: "GMTC", label: "GMTC", disabled: true },
        { value: "NAQI", label: "NAQI", disabled: true },
        { value: "DAR", label: "DAR", disabled: true }
    ];
    const excludeFiltersFromChips = [];

    // RBAC
    const rbacMgr = new RbacManager(
        user?.userType === "employee" && user?.roles[0] !== "admin" ? user?.designation : user?.roles[0],
        "deliveryScheduleEditor"
    );
    const isV = rbacMgr.isV.bind(rbacMgr);

    // Load filters from localStorage on component mount
    useEffect(() => {
        console.log("Loading filters from localStorage...");
        const savedFilters = localStorage.getItem('deliveryScheduleFilters');
        if (savedFilters) {
            console.log("Saved filters found:", savedFilters);
            try {
                const parsed = JSON.parse(savedFilters);
                if (parsed.filters) setFilters(parsed.filters);
                if (parsed.searchQuery) setSearchQuery(parsed.searchQuery);
                if (parsed.activeCategory) setActiveCategory(parsed.activeCategory);
            } catch (error) {
                console.error('Error parsing saved filters:', error);
            }
        }
        setFiltersInitialized(true);
    }, []);

    // Save filters to localStorage whenever they change
    useEffect(() => {
        if (!filtersInitialized) {
            return;
        }

        const filtersToSave = {
            filters,
            searchQuery,
            activeCategory
        };
        localStorage.setItem('deliveryScheduleFilters', JSON.stringify(filtersToSave));
        console.log("Filters saved to localStorage:", filtersToSave);
    }, [filters, searchQuery, activeCategory, filtersInitialized]);

    // Updated handleToggleActive function
    const handleToggleActive = async (schedule, newValue) => {
        const scheduleKey = `${schedule.region}-${schedule.city}-${schedule.cutoffDay}`;
        setSwitchLoading(prev => ({ ...prev, [scheduleKey]: true }));

        try {
            const apiUrl = `${API_BASE_URL}/delivery-schedule/${activeCategory}/${schedule.region}/${schedule.city}/${schedule.cutoffDay}`;
            const payload = {
                isActive: newValue
            };

            const response = await axios.patch(apiUrl, payload, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data?.status?.toLowerCase() === "ok") {
                setDeliverySchedules(prevSchedules =>
                    prevSchedules.map(s =>
                        s.region === schedule.region &&
                            s.city === schedule.city &&
                            s.cutoffDay === schedule.cutoffDay
                            ? { ...s, isActive: newValue }
                            : s
                    )
                );
            }
        } catch (err) {
            console.error("Error toggling delivery schedule status:", err);
            Swal.fire({
                title: "Error",
                text: err.response?.data?.message || "Failed to update delivery schedule status",
                icon: "error",
                confirmButtonText: "OK",
            });
        } finally {
            setSwitchLoading(prev => ({ ...prev, [scheduleKey]: false }));
        }
    };

    // Define columns for DataGrid with searchable fields
    const columns = [
        {
            field: "region",
            headerName: t("Region"),
            flex: 1,
            minWidth: 120,
            searchable: true,
            include: true,
            align: i18n.language === "ar" ? "right" : "left",
            headerAlign: i18n.language === "ar" ? "right" : "left",
        },
        {
            field: "city",
            headerName: t("City"),
            flex: 1,
            minWidth: 120,
            searchable: true,
            include: true,
            align: i18n.language === "ar" ? "right" : "left",
            headerAlign: i18n.language === "ar" ? "right" : "left",
        },
        {
            field: "cutoffDay",
            headerName: t("Cut-off Day"),
            flex: 1,
            minWidth: 120,
            searchable: true,
            include: true,
            align: i18n.language === "ar" ? "right" : "left",
            headerAlign: i18n.language === "ar" ? "right" : "left",
        },
        {
            field: "pickupDay",
            headerName: t("Pickup Day"),
            flex: 1,
            minWidth: 120,
            searchable: true,
            include: true,
            align: i18n.language === "ar" ? "right" : "left",
            headerAlign: i18n.language === "ar" ? "right" : "left",
        },
        {
            field: "deliveryDay",
            headerName: t("Delivery Day"),
            flex: 1,
            minWidth: 120,
            searchable: true,
            include: true,
            align: i18n.language === "ar" ? "right" : "left",
            headerAlign: i18n.language === "ar" ? "right" : "left",
        },
        {
            field: "actions",
            headerName: t("Actions"),
            sortable: false,
            searchable: false,
            include: true,
            width: 200,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => {
                const scheduleKey = `${params.row.region}-${params.row.city}-${params.row.cutoffDay}`;
                const isLoading = switchLoading[scheduleKey] || false;

                return (
                    <div style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        {/* Active/Inactive Switch */}
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <Switch
                                checked={params.row.isActive || false}
                                onChange={(event) => {
                                    event.stopPropagation();
                                    handleToggleActive(params.row, event.target.checked);
                                }}
                                disabled={isLoading}
                                size="small"
                                color="success"
                                slotProps={{
                                    input: {
                                        'aria-label': `Toggle active status for ${params.row.region} - ${params.row.city}`
                                    }
                                }}
                                title={params.row.isActive ? t("Turn off") : t("Turn on")}
                                style={i18n.language === "ar" ? { transform: "rotate(180deg)" } : {}}
                            />
                        </div>

                        {/* Edit Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(params.row);
                            }}
                            style={{
                                padding: "4px 8px",
                                backgroundColor: "transparent",
                                color: "#3D5654",
                                cursor: "pointer",
                                display: "flex",
                                border: "none",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                            title={t("Edit")}
                        >
                            <EditCalendarIcon fontSize="small" />
                        </button>

                        {/* Delete Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(params.row);
                            }}
                            style={{
                                padding: "4px 8px",
                                backgroundColor: "transparent",
                                color: "#3D5654",
                                cursor: "pointer",
                                display: "flex",
                                border: "none",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                            title={t("Delete")}
                        >
                            <DeleteIcon fontSize="small" />
                        </button>
                    </div>
                );
            },
        },
    ];

    // Fetch geo data on component mount
    useEffect(() => {
        fetchGeoData();
    }, []);

    // Fetch delivery schedules - using useCallback like support page
    const fetchDeliverySchedules = useCallback(async (page = 1, searchTerm = "", customFilters = {}) => {
        setLoading(true);
        try {
            const apiUrl = `${API_BASE_URL}/delivery-schedule/pagination`;
            const filtersCopy = { ...customFilters };

            const params = new URLSearchParams({
                page,
                pageSize: pageSize,
                search: searchTerm,
                sortBy: "id",
                sortOrder: "asc",
                filters: JSON.stringify(filtersCopy),
                entity: activeCategory
            });

            const response = await axios.get(`${apiUrl}?${params}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data?.status?.toLowerCase() === "ok") {
                const schedules = (response.data.data.data || []).map((schedule, index) => ({
                    id: index + 1,
                    ...schedule
                }));
                setDeliverySchedules(schedules);
                setTotalPages(response.data.data.totalPages || 1);
                setTotal(response.data.data.totalRecords || 0);
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
    }, [pageSize, token, API_BASE_URL, activeCategory]);

    // useEffect to call fetchDeliverySchedules - exactly like support page
    useEffect(() => {
        if (!filtersInitialized || loading) {
            return;
        }

        if (user && activeCategory) {
            fetchDeliverySchedules(page, searchQuery, filters);
        }

        if (!user) {
            console.log("logging out");
        }
    }, [page, searchQuery, user, fetchDeliverySchedules, filters, activeCategory, filtersInitialized]);

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

    // Handle tab change
    const handleTabChange = (tabValue) => {
        if (tabValue === "SHC") {
            setActiveCategory(tabValue);
            setPage(1);
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

    // Handle search functionality - UPDATED to handle both search and clear
    const handleSearch = (searchTerm) => {
        console.log("Search called with:", searchTerm);
        const previousSearch = searchQuery;
        setSearchQuery(searchTerm);
        setPage(1);

        // If clearing search (empty string) and previous had value, force immediate refresh
        if (searchTerm === "" && previousSearch !== "") {
            console.log("Clearing search, forcing immediate refresh");
            // Use setTimeout to ensure state updates have completed
            setTimeout(() => {
                fetchDeliverySchedules(1, "", filters);
            }, 0);
        }
    };

    const handleAddSchedule = async () => {
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
            const payload = {
                entity: activeCategory,
                region: newSchedule.region,
                city: newSchedule.city,
                cutoffDay: newSchedule.cutoffDay,
                pickupDay: newSchedule.pickupDay,
                deliveryDay: newSchedule.deliveryDay,
                isActive: true,
                createdBy: user?.id || 1,
                modifiedBy: user?.id || 1
            };

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
                    showConfirmButton: false,
                    timer: 800
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
                fetchDeliverySchedules(page, searchQuery, filters);
            }
        } catch (err) {
            console.error("Error creating delivery schedule:", err);
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
            const apiUrl = `${API_BASE_URL}/delivery-schedule/${activeCategory}/${editData.region}/${editData.city}/${editData.cutoffDay}`;
            const payload = {
                pickupDay: editData.pickupDay,
                deliveryDay: editData.deliveryDay,
                modifiedBy: user?.id || 1
            };

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
                fetchDeliverySchedules(page, searchQuery, filters);
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
                const apiUrl = `${API_BASE_URL}/delivery-schedule/delete/${activeCategory}/${schedule.region}/${schedule.city}/${schedule.cutoffDay}`;

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
                    fetchDeliverySchedules(page, searchQuery, filters);
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

    const handleColumnVisibilityChange = (newModel) => {
        setColumnVisibilityModel(newModel);
    };

    const handleFilterChange = (newFilters) => {
        console.log("Filter change called with:", newFilters);
        setFilters(newFilters);
        setPage(1);
        setFilterAnchor(null);
    };

    const handleAddClick = () => {
        setShowAddForm(!showAddForm);
    };

    // Filter visible columns and get searchable fields like support page
    const visibleColumns = columns.filter(col => col.include !== false);
    const searchableFields = visibleColumns.filter(item => item.searchable).map(item => item.field);
    const filteredData = visibleColumns.filter(item => searchableFields.includes(item.field));

    // Columns to display mapping like support page
    const columnsToDisplay = {
        region: "Region",
        city: "City",
        cutoffDay: "Cut-off Day",
        pickupDay: "Pickup Day",
        deliveryDay: "Delivery Day"
    };

    return (
        <Sidebar title={t("Delivery Schedule Editor")}>
            <div className="orders-content">
                {/* Entity Tabs Section */}
                <div className="filter-section">
                    <div style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 12,
                        overflowX: "auto",
                        scrollbarWidth: "none"
                    }}>
                        <Tabs
                            tabs={categoryTabs}
                            activeTab={activeCategory}
                            onTabChange={handleTabChange}
                            variant='mobile'
                        />
                    </div>
                </div>

                {/* Loading Spinner */}
                {loading && <LoadingSpinner />}

                {/* Add Form */}
                {showAddForm && activeCategory && (
                    <div style={{
                        marginTop: "10px",
                        marginBottom: "10px",
                        padding: "20px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        border: "1px solid #dee2e6"
                    }}>
                        <h4>{t("Add New Delivery Schedule for")} {t(activeCategory)}</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginTop: "10px", marginBottom: "10px" }}>
                            <div>
                                <label>{t("Region")}</label>
                                <SearchableDropdown
                                    name="region"
                                    value={selectedRegion}
                                    onChange={handleRegionChange}
                                    placeholder={t("Select Region")}
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
                                <label>{t("City")}</label>
                                <SearchableDropdown
                                    name="city"
                                    value={selectedCity}
                                    onChange={handleCityChange}
                                    placeholder={t("Select City")}
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
                                <label>{t("Cut-off Day")}</label>
                                <SearchableDropdown
                                    name="cutoffDay"
                                    value={newSchedule.cutoffDay}
                                    onChange={(e) => {
                                        setNewSchedule({ ...newSchedule, cutoffDay: e.target.value });
                                    }}
                                    placeholder={t("Select Day")}
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
                                <label>{t("Pickup Day")}</label>
                                <SearchableDropdown
                                    name="pickupDay"
                                    value={newSchedule.pickupDay}
                                    onChange={(e) => {
                                        setNewSchedule({ ...newSchedule, pickupDay: e.target.value });
                                    }}
                                    placeholder={t("Select Day")}
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
                                <label>{t("Delivery Day")}</label>
                                <SearchableDropdown
                                    name="deliveryDay"
                                    value={newSchedule.deliveryDay}
                                    onChange={(e) => {
                                        setNewSchedule({ ...newSchedule, deliveryDay: e.target.value });
                                    }}
                                    placeholder={t("Select Day")}
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
                                onClick={handleAddSchedule}
                                disabled={loading}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: 'var(--logo-deep-green)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginRight: '10px'
                                }}
                            >
                                {loading ? t('Creating...') : t("Create Schedule")}
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Table Container */}
                <div className="table-container">
                    <div style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column"
                    }}>
                        <DataGrid
                            apiRef={gridApiRef}
                            rows={deliverySchedules}
                            columns={visibleColumns}
                            pageSize={pageSize}
                            rowCount={total}
                            disableSelectionOnClick
                            disableColumnMenu
                            hideFooter={true}
                            hideFooterPagination={true}
                            paginationMode="server"
                            rowHeight={55}
                            showToolbar
                            columnVisibilityModel={columnVisibilityModel}
                            onColumnVisibilityModelChange={handleColumnVisibilityChange}
                            slots={{
                                toolbar: CustomToolbar,
                            }}
                            slotProps={{
                                toolbar: {
                                    searchQuery: searchQuery,
                                    filterAnchor: filterAnchor,
                                    onSearch: handleSearch,
                                    setSearchQuery: setSearchQuery,
                                    setFilterAnchor: setFilterAnchor,
                                    handleFilterChange: handleFilterChange,
                                    onColumnVisibilityChange: handleColumnVisibilityChange,
                                    columns: filteredData,
                                    filters: filters,
                                    columnVisibilityModel: columnVisibilityModel,
                                    searchPlaceholder: "Search delivery schedules...",
                                    showColumnVisibility: false,
                                    showFilters: true,
                                    showExport: false,
                                    showUpload: false,
                                    showCalendar: false,
                                    showAdd: isV("addButton"),
                                    buttonName: t("Add Schedule"),
                                    showApproval: false,
                                    handleAddClick: handleAddClick,
                                    columnsToDisplay: columnsToDisplay,
                                    showAddForm: showAddForm,
                                    excludeFiltersFromChips: excludeFiltersFromChips,
                                },
                            }}
                            sx={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                "& .MuiDataGrid-toolbar": {
                                    padding: "0px 8px !important",
                                    minHeight: "56px !important",
                                    flexShrink: 0,
                                },
                                "& .MuiDataGrid-main": {
                                    flex: 1,
                                    overflow: "hidden",
                                    display: "flex",
                                    flexDirection: "column",
                                },
                                "& .MuiDataGrid-virtualScroller": {
                                    overflow: "auto !important",
                                    flex: 1,
                                },
                                "& .MuiDataGrid-columnHeaders": {
                                    top: 0,
                                    zIndex: 1,
                                    backgroundColor: "white",
                                    borderBottom: "1px solid #e0e0e0",
                                    flexShrink: 0,
                                },
                                "& .MuiDataGrid-row": {
                                    cursor: "default",
                                    "&:hover": {
                                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                                    },
                                },
                                ...(i18n.language === "ar" && {
                                    direction: "rtl",
                                    "& .MuiDataGrid-cell": {
                                        textAlign: "right !important",
                                    },
                                    "& .MuiDataGrid-columnHeader": {
                                        textAlign: "right !important",
                                    },
                                    "& .MuiDataGrid-columnHeaderTitle": {
                                        textAlign: "right !important",
                                    },
                                    "& .MuiDataGrid-cellContent": {
                                        textAlign: "right !important",
                                    },
                                }),
                                ...(i18n.language !== "ar" && {
                                    "& .MuiDataGrid-cell": {
                                        textAlign: "left",
                                    },
                                    "& .MuiDataGrid-columnHeader": {
                                        textAlign: "left",
                                    },
                                    "& .MuiDataGrid-columnHeaderTitle": {
                                        textAlign: "left",
                                    },
                                    "& .MuiDataGrid-cellContent": {
                                        textAlign: "left",
                                    },
                                }),
                            }}
                        />
                    </div>
                </div>

                {/* Pagination Component */}
                {isV("ordersPagination") && deliverySchedules.length > 0 && (
                    <Pagination
                        currentPage={page}
                        totalPages={String(totalPages)}
                        onPageChange={setPage}
                    />
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

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#6c757d',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEditSubmit}
                                    disabled={loading}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: 'var(--logo-deep-green)',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {loading ? 'Updating...' : 'Update'}
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
