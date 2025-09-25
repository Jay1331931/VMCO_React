import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import ActionButton from "../components/ActionButton";
import LoadingSpinner from "../components/LoadingSpinner";
import CustomToolbar from "../components/CustomToolbar";
import "../styles/components.css";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { convertToTimezone, TIMEZONES } from "../utilities/convertToTimezone";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import { formatDate } from "../utilities/dateFormatter";
import { Box, Button, Typography, Tooltip, Chip } from "@mui/material";
import {
    DataGrid,
    GridFooterContainer,
    GridPagination,
    useGridApiRef,
} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Status class helper functions
const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
        case "closed":
            return "status-approved";
        case "rejected":
            return "status-rejected";
        case "in progress":
        default:
            return "status-pending";
    }
};

function Support() {
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;
    const isArabic = i18n.language === "ar";
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    const [initialTickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);
    const { token, user, isAuthenticated, logout } = useAuth();

    // Pagination and filtering state
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({});
    const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
    const [sortModel, setSortModel] = useState([]);
    const [filterAnchor, setFilterAnchor] = useState(null);

    // Grid API reference
    const gridApiRef = useGridApiRef();

    //RBAC
    const rbacMgr = new RbacManager(
        user?.userType === "employee" && user?.roles[0] !== "admin"
            ? user?.designation
            : user?.roles[0],
        "supList"
    );
    const isV = rbacMgr.isV.bind(rbacMgr);
    const isE = rbacMgr.isE.bind(rbacMgr);

    console.log("~~~~~~~~~~~~~User Data:~~~~~~~~~~~~~~~~~~~\n", user);

    // Fetch tickets from API
    const fetchTickets = useCallback(async (page = 1, searchTerm = "", customFilters = {}, sortedModel = []) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page,
                pageSize,
                search: searchTerm,
                sortBy: sortedModel[0]?.field || "ticket_id",
                sortOrder: sortedModel[0]?.sort || "asc",
                filters: JSON.stringify(customFilters),
            });

            const apiUrl = `${API_BASE_URL}/grievances/pagination?${params.toString()}`;

            const response = await fetch(apiUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('API did not return JSON. Check API URL and server.');
            }

            if (!response.ok) {
                if (response.status === 401) {
                    logout();
                    navigate(user?.userType === "customer" ? "/login" : "/login/employee");
                    return;
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const resp = await response.json();
            console.log("Fetched tickets:", resp);

            if (resp.status === 'Ok' || resp.data) {
                const processedTickets = (resp.data?.data || resp.data || []).map(ticket => ({
                    ...ticket,
                    id: ticket.ticketId || ticket.id, // Ensure id field for DataGrid
                }));
                setTickets(processedTickets);
                setTotal(resp.data?.totalRecords || resp.totalRecords || processedTickets.length);
            } else {
                throw new Error(resp.message || 'Failed to fetch support tickets');
            }
        } catch (err) {
            console.error("Failed to fetch support tickets:", err);
            setError(err.message);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    }, [navigate, logout, user?.userType, token, pageSize]);

    useEffect(() => {
        if (loading) {
            return;
        }

        console.log("$$$$$$$$$$$ user in support page", user);
        if (user) {
            fetchTickets(page, searchQuery, filters, sortModel);
        }

        if (!user) {
            console.log("$$$$$$$$$$$ logging out");
        }
    }, [page, searchQuery, user, fetchTickets, filters, sortModel]);

    // Handle search functionality
    const handleSearch = (searchTerm) => {
        setSearchQuery(searchTerm);
        setPage(1);
    };

    // Handle sort model change
    const handleSortModelChange = (model) => {
        console.log("Sort model changed:", model);
        setSortModel(model);
        fetchTickets(1, searchQuery, filters, model);
    };

    // Define columns for the DataGrid
    const supportColumns = [
        {
            field: "ticketId",
            headerName: t("Ticket #"),
            include: isV('ticketIdCol'),
            searchable: true,
            maxWidth: 100,
            flex: 1,
        },
        {
            field: isArabic ? "companyNameAr" : "companyNameEn",
            headerName: t("Customer"),
            include: isV('customerCol'),
            searchable: false,
            sortable: false,
            maxWidth: 180,
            flex: 2,
        },
        {
            field: isArabic ? "branchNameLc" : "branchNameEn",
            headerName: t("Branch"),
            include: isV('branchCol'),
            searchable: false,
            sortable: false,
            minWidth: 100,
            maxWidth: 180,
            flex: 2,
        },
        {
            field: "grievanceName",
            headerName: t("Issue Name"),
            include: isV('issueNameCol'),
            searchable: true,
            minWidth: 150,
            flex: 2,
        },
        {
            field: "grievanceType",
            headerName: t("Issue Type"),
            include: isV('issueTypeCol'),
            searchable: true,
            minWidth: 120,
            flex: 1,
        },
        {
            field: "createdAt",
            headerName: t("Created Date"),
            include: isV('createdDateCol'),
            searchable: false,
            minWidth: 100,
            maxWidth: 120,
            flex: 1,
            renderCell: (params) =>
                params?.row?.createdAt
                    ? formatDate(params?.row?.createdAt, 'DD/MM/YYYY')
                    : convertToTimezone(params?.row?.createdAt, TIMEZONES.SAUDI_ARABIA, 'DD/MM/YYYY'),
        },
        {
            field: "createdByUsername",
            headerName: t("Created By"),
            include: isV('createdByCol'),
            searchable: false,
            sortable: false,
            minWidth: 100,
            maxWidth: 120,
            flex: 1,
        },
        {
            field: "assignedTo",
            headerName: t("Assigned To"),
            include: isV('assignedToCol'),
            searchable: false,
            minWidth: 100,
            maxWidth: 120,
            flex: 1,
        },
        {
            field: "status",
            headerName: t("Status"),
            include: isV('statusCol'),
            searchable: true,
            minWidth: 80,
            maxWidth: 100,
            flex: 1,
            cellClassName: (params) => getStatusClass(params.value),
            renderCell: (params) => (
                <label className={getStatusClass(params.value)}>{params.value}</label>
            ),
        },
    ];

    // Filter visible columns
    const visibleColumns = supportColumns.filter(col => col.include !== false);

    // Searchable fields for the toolbar
    const searchableFields = visibleColumns.filter(item => item.searchable).map(item => item.field);

    // Handle row click to navigate to supportDetails page with ticket details
    const handleRowClick = (ticket) => {
        navigate("/supportDetails", { state: { ticket: ticket, mode: "edit" } });
    };

    // Handle view ticket
    const handleViewTicket = (ticket) => {
        navigate("/supportDetails", { state: { ticket: ticket, mode: "view" } });
    };

    // Handle adding a new ticket
    const handleAddTicket = () => {
        if (isAuthenticated) {
            navigate("/supportDetails", { state: { ticket: {}, mode: "add" } });
        } else {
            navigate(user?.userType === "customer" ? "/login" : "/login/employee");
        }
    };

    // Handle filter changes
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setPage(1);
        setFilterAnchor(null);
    };

    // Filtered data for CustomToolbar
    const filteredData = visibleColumns?.filter(item =>
        searchableFields?.includes(item?.field)
    );

    // Columns to display mapping
    const columnsToDisplay = {
        ticketId: "Ticket #",
        companyNameEn: "Customer",
        branchNameEn: "Branch",
        grievanceName: "Issue Name",
        grievanceType: "Issue Type",
        createdAt: "Created Date",
        createdByUsername: "Created By",
        assignedTo: "Assigned To",
        status: "Status",
    };

    return (
        <Sidebar title={t("Support")}>
            {isV('supportContent') && (
                <div className='support-content'>
                    <div className="table-container">
                        {loading ? (
                            <LoadingSpinner />
                        ) : error ? (
                            <div className="error-message">{error}</div>
                        ) : (
                            <DataGrid
                                apiRef={gridApiRef}
                                rows={initialTickets}
                                columns={visibleColumns}
                                pageSize={pageSize}
                                rowCount={total}
                                onRowClick={(params) => handleRowClick(params.row)}
                                columnVisibilityModel={columnVisibilityModel}
                                onColumnVisibilityModelChange={setColumnVisibilityModel}
                                sortModel={sortModel}
                                onSortModelChange={handleSortModelChange}
                                disableSelectionOnClick
                                disableColumnMenu
                                hideFooter={true}
                                hideFooterPagination={true}
                                disableExtendRowFullWidth={true}
                                pagination={false}
                                autoHeight
                                rowHeight={70}
                                showToolbar
                                slots={{
                                    toolbar: () => (
                                        <CustomToolbar
                                            searchQuery={searchQuery}
                                            filterAnchor={filterAnchor}
                                            onSearch={handleSearch}
                                            setSearchQuery={setSearchQuery}
                                            setFilterAnchor={setFilterAnchor}
                                            handleFilterChange={handleFilterChange}
                                            onColumnVisibilityChange={setColumnVisibilityModel}
                                            columns={filteredData}
                                            filters={filters}
                                            columnVisibilityModel={columnVisibilityModel}
                                            searchPlaceholder="Search tickets..."
                                            showColumnVisibility={true}
                                            showFilters={true}
                                            showExport={false}
                                            showUpload={false}
                                            showAdd={isV("btnAdd")}
                                            buttonName={t("Add Ticket")}
                                            showApproval={false}
                                            handleAddClick={handleAddTicket}
                                            columnsToDisplay={columnsToDisplay}
                                        />
                                    ),
                                }}
                                sx={{
                                    '& .MuiDataGrid-row': {
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                        },
                                    },
                                }}
                            />
                        )}
                    </div>
                </div>
            )}
        </Sidebar>
    );
}

export default Support;
