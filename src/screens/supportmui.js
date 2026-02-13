import React, { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../components/Sidebar";
import ActionButton from "../components/ActionButton";
import LoadingSpinner from "../components/LoadingSpinner";
import CustomToolbar from "../components/CustomToolbar";
import Pagination from "../components/Pagination";
import "../styles/components.css";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { convertToTimezone, TIMEZONES } from "../utilities/convertToTimezone";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import { formatDate } from "../utilities/dateFormatter";
import { Box, Button, Typography, Tooltip, Chip, Badge } from "@mui/material"; // Added Badge import
import {
    DataGrid,
    GridFooterContainer,
    GridPagination,
    useGridApiRef,
} from "@mui/x-data-grid";
import TableMobile from "../components/TableMobile";
import SupportCard from "../components/SupportCard";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SkeletonWrapper from "../components/SkeletonWrapper";


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
    const [isClosedMode, setClosedMode] = useState("open");
    const [initialTickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);
    const { token, user, isAuthenticated, logout } = useAuth();
    const [openTicketsCount, setOpenTicketsCount] = useState(0); // New state for open tickets count


    // Pagination and filtering state
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({});
    const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
    const [sortModel, setSortModel] = useState([]);
    const [filterAnchor, setFilterAnchor] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const [showRowPopup, setShowRowPopup] = useState(false);
    const [filtersInitialized, setFiltersInitialized] = useState(false);


    // Grid API reference
    const gridApiRef = useGridApiRef();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [paymentChangesIsThere, setPaymentChangesIsThere] = useState(false);
    const contentRef = useRef(null);
    const [isAtTop, setIsAtTop] = useState(true);
    const [showHeader, setShowHeader] = useState(true);
    const dragStartY = useRef(0);

    useEffect(() => {
        console.log("Loading filters from localStorage...");
        const savedFilters = localStorage.getItem('supportFilters');
        if (savedFilters) {
            console.log("Saved filters found:", savedFilters);
            try {
                const parsed = JSON.parse(savedFilters);
                if (parsed.filters) setFilters(parsed.filters);
                if (parsed.searchQuery) setSearchQuery(parsed.searchQuery);
                if (parsed.isClosedMode) setClosedMode(parsed.isClosedMode);
            } catch (error) {
                console.error('Error parsing saved filters:', error);
            }
        }
        setFiltersInitialized(true);
    }, []);

    useEffect(() => {
        if (!filtersInitialized) {
            return;
        }

        const filtersToSave = {
            filters,
            searchQuery,
            isClosedMode
        };
        localStorage.setItem('supportFilters', JSON.stringify(filtersToSave));
        console.log("Filters saved to localStorage:", filtersToSave);
    }, [filters, searchQuery, isClosedMode, filtersInitialized]);


    useEffect(() => {
        const handleTouchStart = (e) => {
            dragStartY.current = e.touches[0].clientY;
        };

        const handleTouchMove = (e) => {
            const currentY = e.touches[0].clientY;

            // Drag up → hide header
            if (currentY < dragStartY.current - 15) {
                setShowHeader(false);
            }

            // Drag down → show header
            if (currentY > dragStartY.current + 15) {
                setShowHeader(true);
            }
        };

        window.addEventListener("touchstart", handleTouchStart);
        window.addEventListener("touchmove", handleTouchMove);

        return () => {
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchmove", handleTouchMove);
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = contentRef.current?.scrollTop || 0;
            setIsAtTop(scrollTop < 20); // detect near top
        };

        const container = contentRef.current;
        container?.addEventListener("scroll", handleScroll);
        return () => container?.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        console.log("isMobile", isMobile);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);


    // RBAC
    const rbacMgr = new RbacManager(
        user?.userType === "employee"
            ? user?.roles[0] !== "admin"
                ? user?.designation
                : user?.roles[0]
            : "",
        "supList"
    );
    const isV = rbacMgr.isV.bind(rbacMgr);
    const isE = rbacMgr.isE.bind(rbacMgr);


    const role =
        user?.userType === "employee" ? user?.designation : user?.roles[0];
    const pageName = "support";
    const storageKey = `${pageName}_${role}_columns`;
    const columnWidthsKey = `${pageName}_${role}_columnWidths`;


    const [columnDimensions, setColumnDimensions] = useState({});


    useEffect(() => {
        const savedModel = localStorage.getItem(storageKey);
        if (savedModel) {
            setColumnVisibilityModel(JSON.parse(savedModel));
        }
    }, [storageKey]);


    // Fetch tickets from API - Modified to include isOpen filter
    const fetchTickets = useCallback(
        async (page = 1, searchTerm = "", customFilters = {}, sortedModel) => {
            setLoading(true);
            setError(null);
            try {
                // Add isOpen filter based on isClosedMode
                const filtersWithStatus = {
                    ...customFilters,
                    isOpen: isClosedMode === "open"
                };

                const params = new URLSearchParams({
                    page,
                    pageSize,
                    search: searchTerm,
                    sortBy: sortedModel?.[0]?.field || "id",
                    sortOrder: sortedModel?.[0]?.sort || "desc",
                    filters: JSON.stringify(filtersWithStatus),
                });

                const apiUrl = `${API_BASE_URL}/grievances/pagination?${params.toString()}`;
                const response = await fetch(apiUrl, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new Error("API did not return JSON. Check API URL and server.");
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

                if (resp.status === "Ok" && resp.data) {
                    const processedTickets = (resp.data?.data || resp.data).map(
                        (ticket) => ({
                            ...ticket,
                            id: ticket.id,
                        })
                    );
                    setTickets(processedTickets);
                    const totalRecords = resp.data?.totalRecords || resp.totalRecords || processedTickets.length;
                    setTotal(totalRecords);

                    // Store open tickets count when in open mode
                    if (isClosedMode === "open") {
                        setOpenTicketsCount(totalRecords);
                    }
                } else {
                    throw new Error(resp.message || "Failed to fetch support tickets");
                }
            } catch (err) {
                console.error("Failed to fetch support tickets:", err);
                setError(err.message);
                setTickets([]);
            } finally {
                setLoading(false);
            }
        },
        [navigate, logout, user?.userType, token, pageSize, isClosedMode]
    );

    useEffect(() => {
        if (!filtersInitialized || loading) {
            return;
        }
        if (user) {
            fetchTickets(page, searchQuery, filters, sortModel);
        }
    }, [page, searchQuery, user, fetchTickets, filters, isClosedMode, sortModel, filtersInitialized]);

    // Handle search functionality
    const handleSearch = (searchTerm) => {
        setSearchQuery(searchTerm);
        setPage(1);
    };

    // Updated toggle function to handle "open" and "closed" modes
    const handleShowClosedTickets = (mode) => {
        console.log("Mode:", mode);
        setClosedMode(mode);
        setPage(1);
    };

    // Handle sort model change
    const handleSortModelChange = (model) => {
        console.log("Sort model changed:", model);
        setSortModel(model);
        fetchTickets(page, searchQuery, filters, model);
    };

    // Add the column resize handler
    const handleColumnResize = (params) => {
        const { colDef } = params;
        setColumnDimensions((prev) => {
            const newDimensions = {
                ...prev,
                [colDef.field]: { width: colDef.width },
            };
            localStorage.setItem(columnWidthsKey, JSON.stringify(newDimensions));
            return newDimensions;
        });
    };

    // Define columns for the DataGrid
    const supportColumns = [
        {
            field: "ticketId",
            headerName: t("Ticket #"),
            include: isV("ticketIdCol"),
            searchable: true,
            width: columnDimensions["ticketId"]?.width || 100,
            align: isArabic ? "right" : "left",
            headerAlign: isArabic ? "right" : "left",
            renderCell: (params) => <span>{params.value}</span>,
        },
        {
            field: "erpCustId",
            headerName: t("ERP Customer Id"),
            include: isV("erpCustomerIdCol"),
            searchable: true,
            width:
                i18n.language === "ar"
                    ? columnDimensions["erpCustId"]?.width || 150
                    : columnDimensions["erpCustId"]?.width || 150,
            align: isArabic ? "right" : "left",
            headerAlign: isArabic ? "right" : "left",
            renderCell: (params) => <span>{params.value}</span>,
        },
        {
            field: "assignedSalesExecutive",
            headerName: t("Primary Sales Executive"),
            include: isV("assignedSalesExecutive"),
            searchable: true,
            width:
                i18n.language === "ar"
                    ? columnDimensions["assignedSalesExecutive"]?.width || 150
                    : columnDimensions["assignedSalesExecutive"]?.width || 150,
            align: isArabic ? "right" : "left",
            headerAlign: isArabic ? "right" : "left",
            renderCell: (params) => <span>{params.value}</span>,
        },
        {
            field: isArabic ? "companyNameAr" : "companyNameEn",
            headerName: t("Customer"),
            include: isV("customerCol"),
            searchable: false,
            width:
                i18n.language === "ar"
                    ? columnDimensions["companyNameAr"]?.width || 150
                    : columnDimensions["companyNameEn"]?.width || 150,
            align: isArabic ? "right" : "left",
            headerAlign: isArabic ? "right" : "left",
            renderCell: (params) => <span>{params.value}</span>,
        },
        {
            field: isArabic ? "branchNameLc" : "branchNameEn",
            headerName: t("Branch"),
            include: isV("branchCol"),
            searchable: false,
            sortable: false,
            width:
                i18n.language === "ar"
                    ? columnDimensions["branchNameLc"]?.width || 60
                    : columnDimensions["branchNameEn"]?.width || 60,
            flex: 1,
            align: isArabic ? "right" : "left",
            headerAlign: isArabic ? "right" : "left",
            renderCell: (params) => <span>{params.value}</span>,
        },
        {
            field: "entity",
            headerName: t("Entity"),
            include: isV("entityCol"),
            searchable: true,
            width:
                i18n.language === "ar"
                    ? columnDimensions["entity"]?.width || 150
                    : columnDimensions["entity"]?.width || 150,
            align: isArabic ? "right" : "left",
            headerAlign: isArabic ? "right" : "left",
            renderCell: (params) => <span>{params.value}</span>,
        },
        {
            field: "grievanceName",
            headerName: t("Issue Name"),
            include: isV("issueNameCol"),
            searchable: true,
            width: columnDimensions["grievanceName"]?.width || 100,
            flex: 1,
            align: isArabic ? "right" : "left",
            headerAlign: isArabic ? "right" : "left",
            renderCell: (params) => <span>{params.value}</span>,
        },
        {
            field: "grievanceType",
            headerName: t("Issue Type"),
            include: isV("issueTypeCol"),
            searchable: true,
            width: columnDimensions["grievanceType"]?.width || 120,
            flex: 1,
            align: isArabic ? "right" : "left",
            headerAlign: isArabic ? "right" : "left",
            renderCell: (params) => <span>{params.value}</span>,
        },
        {
            field: "daysOpen",
            headerName: t("Days Open"),
            include: isClosedMode === 'open' && isV("daysOpen"),
            searchable: false,
            width: columnDimensions["daysOpen"]?.width || 120,
            flex: 1,
            align: isArabic ? "right" : "left",
            headerAlign: isArabic ? "right" : "left",
            renderCell: (params) => <span>{params.value}</span>,
        },
        {
            field: "createdAt",
            headerName: t("Created Date"),
            include: isV("createdDateCol"),
            searchable: false,
            width: columnDimensions["createdAt"]?.width || 100,
            flex: 1,
            align: isArabic ? "right" : "left",
            headerAlign: isArabic ? "right" : "left",
            renderCell: (params) => (
                <span>
                    {params?.row?.createdAt
                        ? formatDate(params?.row?.createdAt, "DD/MM/YYYY") ||
                        convertToTimezone(
                            params?.row?.createdAt,
                            TIMEZONES.SAUDI_ARABIA,
                            "DD/MM/YYYY"
                        )
                        : ""}
                </span>
            ),
        },
        {
            field: "createdByUsername",
            headerName: t("Created By"),
            include: isV("createdByCol"),
            searchable: false,
            sortable: false,
            width: columnDimensions["createdByUsername"]?.width || 100,
            flex: 1,
            align: isArabic ? "right" : "left",
            headerAlign: isArabic ? "right" : "left",
            renderCell: (params) => <span>{params.value}</span>,
        },
        {
            field: "assignedTo",
            headerName: t("Assigned To"),
            include: isV("assignedToCol"),
            searchable: false,
            width: columnDimensions["assignedTo"]?.width || 100,
            flex: 1,
            align: isArabic ? "right" : "left",
            headerAlign: isArabic ? "right" : "left",
            renderCell: (params) => <span>{params.value}</span>,
        },
        {
            field: "status",
            headerName: t("Status"),
            include: isV("statusCol"),
            searchable: true,
            width: columnDimensions["status"]?.width || 80,
            flex: 1,
            align: isArabic ? "right" : "left",
            headerAlign: isArabic ? "right" : "left",
            cellClassName: (params) => getStatusClass(params.value),
            renderCell: (params) => (
                <label className={getStatusClass(params.value)}>
                    {t(params.value)}
                </label>
            ),
        },
    ];

    // Filter visible columns
    const visibleColumns = supportColumns.filter((col) => col.include !== false);

    // Searchable fields for the toolbar
    const searchableFields = visibleColumns
        .filter((item) => item.searchable)
        .map((item) => item.field);

    const handleShowAllDetailsClick = async (ticket) => {
        navigate("/supportDetails", { state: { ticket: ticket, mode: "edit" } });
    };

    // Handle row click to navigate to supportDetails page with ticket details
    const handleRowClick = (ticket) => {
        if (isMobile) {
            setSelectedRow(ticket);
            setShowRowPopup(true);
        } else {
            navigate("/supportDetails", { state: { ticket: ticket, mode: "edit" } });
        }
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
    const filteredData = visibleColumns?.filter((item) =>
        searchableFields?.includes(item?.field)
    );

    // Columns to display mapping
    const columnsToDisplay = {
        ticketId: "Ticket #",
        erpCustId: "ERP Customer ID",
        assignedSalesExecutive: "Primary Sales Executive",
        companyNameEn: "Customer",
        branchNameEn: "Branch",
        entity: "Entity",
        grievanceName: "Issue Name",
        grievanceType: "Issue Type",
        createdAt: "Created Date",
        createdByUsername: "Created By",
        assignedTo: "Assigned To",
        status: "Status",
    };

    const totalPages = Number.isFinite(total) && Number.isFinite(pageSize) && total > 0 && pageSize > 0
        ? Math.ceil(total / pageSize)
        : 1;

    const handleColumnVisibilityChange = (newModel) => {
        setColumnVisibilityModel(newModel);
        localStorage.setItem(storageKey, JSON.stringify(newModel));
    };

    return (
        <Sidebar title={t("Support")} isV={isV("supportContent")} MenuName={"Others"} CardPaddingClass={true}>
            <div className="support-content">
                {isMobile ? (
                    <div className="orders-content">
                        {
                            // loading ? (
                            //     <LoadingSpinner />
                            // ) : 
                            error ? (
                                <div className="error-message">{error}</div>
                            ) : (

                                <>
                                    <div className={`catalog-fixed-header ${showHeader ? "show" : "show"}`}>
                                        {/* This DataGrid is only for the toolbar, not for displaying rows */}
                                        <div style={{ height: "auto", marginBottom: "16px" }}>
                                            <DataGrid
                                                apiRef={gridApiRef}
                                                rows={[]}
                                                columns={[]}
                                                pageSize={pageSize}
                                                rowCount={total}
                                                onRowClick={(params) => handleRowClick(params.row)}
                                                columnVisibilityModel={columnVisibilityModel}
                                                onColumnVisibilityModelChange={handleColumnVisibilityChange}
                                                sortModel={sortModel}
                                                onSortModelChange={handleSortModelChange}
                                                disableSelectionOnClick
                                                disableColumnMenu
                                                hideFooter={true}
                                                hideFooterPagination={true}
                                                disableExtendRowFullWidth={true}
                                                pagination={false}
                                                autoHeight
                                                rowHeight={55}
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
                                                            columns={visibleColumns}
                                                            filters={filters}
                                                            columnVisibilityModel={columnVisibilityModel}
                                                            searchPlaceholder="Search tickets..."
                                                            showColumnVisibility={false}
                                                            showFilters={false}
                                                            showExport={false}
                                                            showUpload={false}
                                                            showAdd={isV('btnAdd')}
                                                            buttonName={t("Add Ticket")}
                                                            showApproval={false}
                                                            showClosed={true}
                                                            isClosedMode={isClosedMode}
                                                            handleClosedTickets={handleShowClosedTickets}
                                                            handleAddClick={handleAddTicket}
                                                            columnsToDisplay={columnsToDisplay}
                                                            openTicketsCount={openTicketsCount}
                                                        />
                                                    ),
                                                }}
                                                sx={{
                                                    border: "none !important",
                                                    "& .MuiDataGrid-overlay": {
                                                        display: "none !important",
                                                    },
                                                    "& .MuiDataGrid-row": {
                                                        display: "none !important",
                                                    },
                                                    ".MuiDataGrid-cell": {
                                                        display: "none !important",
                                                    },
                                                    "& .MuiDataGrid-main": {
                                                        display: "none",
                                                    },
                                                    "& .MuiDataGrid-toolbar": {
                                                        padding: "0px 8px",
                                                        gap: "10px",
                                                        border: "none",
                                                        marginBottom: "0",
                                                    },
                                                    "&.catalog-datagrid": {
                                                        border: "2px solid black",
                                                        borderRadius: "8px",
                                                        backgroundColor: "#f8f9fa",
                                                    },
                                                    "& .MuiOutlinedInput-root": {
                                                        width: "100% !important",
                                                        minWidth: "230px !important",
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Order cards section - This should be separate from the fixed header */}
                                    <div style={{ position: "relative", zIndex: 1 }}>
                                        <SkeletonWrapper loading={loading} type="order_card" count={4}>
                                            <SupportCard
                                                tickets={initialTickets}
                                                setSelectedRow={handleShowAllDetailsClick}
                                            />
                                        </SkeletonWrapper>
                                    </div>
                                </>

                            )}
                    </div>
                ) : (
                    <div className="table-container">
                        {
                            // loading ? (
                            //     <div className="loading-container" style={{ position: "absolute", top: "50%", left: "50%" }}>
                            //         <LoadingSpinner size="medium" />
                            //     </div>
                            // ) : 
                            error ? (
                                <div className="error-message">{error}</div>
                            ) : (
                                <SkeletonWrapper loading={loading} type="table" rows={10} columns={5}>
                                    <DataGrid
                                        apiRef={gridApiRef}
                                        rows={initialTickets}
                                        columns={visibleColumns}
                                        pageSize={pageSize}
                                        rowCount={total}
                                        onRowClick={(params) => handleRowClick(params.row)}
                                        columnVisibilityModel={columnVisibilityModel}
                                        onColumnVisibilityModelChange={handleColumnVisibilityChange}
                                        sortModel={sortModel}
                                        onSortModelChange={handleSortModelChange}
                                        disableSelectionOnClick
                                        disableColumnMenu
                                        hideFooter={true}
                                        hideFooterPagination={true}
                                        pagination={false}
                                        // autoHeight
                                        rowHeight={55}
                                        showToolbar
                                        onColumnResize={handleColumnResize}
                                        columnDimensions={columnDimensions}
                                        slots={{
                                            toolbar: () => (
                                                <CustomToolbar
                                                    searchQuery={searchQuery}
                                                    filterAnchor={filterAnchor}
                                                    onSearch={handleSearch}
                                                    setSearchQuery={setSearchQuery}
                                                    setFilterAnchor={setFilterAnchor}
                                                    handleFilterChange={handleFilterChange}
                                                    onColumnVisibilityChange={handleColumnVisibilityChange}
                                                    columns={visibleColumns}
                                                    filters={filters}
                                                    columnVisibilityModel={columnVisibilityModel}
                                                    searchPlaceholder={"Search tickets..."}
                                                    showColumnVisibility={true}
                                                    showFilters={true}
                                                    showExport={false}
                                                    showUpload={false}
                                                    showAdd={isV("btnAdd")}
                                                    buttonName={t("Add Ticket")}
                                                    showApproval={false}
                                                    showClosed={true}
                                                    isClosedMode={isClosedMode}
                                                    handleClosedTickets={handleShowClosedTickets}
                                                    handleAddClick={handleAddTicket}
                                                    columnsToDisplay={columnsToDisplay}
                                                    openTicketsCount={openTicketsCount}
                                                />
                                            ),
                                        }}
                                        sx={{
                                            "& .MuiDataGrid-row": {
                                                cursor: "pointer",
                                                "&:hover": {
                                                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                                                },
                                            },
                                            "& .MuiDataGrid-toolbar": {
                                                padding: "0px 8px"
                                            },
                                            ...(isArabic && {
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
                                            ...(!isArabic && {
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
                                </SkeletonWrapper>
                            )}
                    </div>
                )}
                {isV("supportPagination") && !loading && initialTickets.length > 0 && (
                    <Pagination
                        currentPage={page}
                        totalPages={String(totalPages)}
                        onPageChange={setPage}
                    />
                )}
            </div>

        </Sidebar>
    );
}

export default Support;
