import React, { useState, useEffect, useCallback } from "react";
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
import { Box, Button, Typography, Tooltip, Chip } from "@mui/material";
import {
    DataGrid,
    GridFooterContainer,
    GridPagination,
    useGridApiRef,
} from "@mui/x-data-grid";
import TableMobile from "../components/TableMobile";
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
const [selectedRow, setSelectedRow] = useState(null);
  const [showRowPopup, setShowRowPopup] = useState(false);
  
    // Grid API reference
    const gridApiRef = useGridApiRef();
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  // const [paymentChangesIsThere, setPaymentChangesIsThere] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    console.log("isMobile", isMobile);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
    //RBAC
    const rbacMgr = new RbacManager(
        user?.userType === "employee" && user?.roles[0] !== "admin"
            ? user?.designation
            : user?.roles[0],
        "supList"
    );
    const isV = rbacMgr.isV.bind(rbacMgr);
    const isE = rbacMgr.isE.bind(rbacMgr);
 const role=  user?.userType === "employee" ? user?.designation :user?.roles[0]
const pageName= "support"
      const storageKey = `${pageName}_${role}_columns`;
const columnWidthsKey = `${pageName}_${role}_columnWidths`;
const [columnDimensions, setColumnDimensions] = useState({});
  useEffect(() => {
    const savedModel = localStorage.getItem(storageKey);
    if (savedModel) {
      setColumnVisibilityModel(JSON.parse(savedModel));
    }
  }, [storageKey]);
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
                    id: ticket.id,
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

    // Add the column resize handler
const handleColumnResize = (params) => {
  const { colDef } = params;
  setColumnDimensions(prev => {
    const newDimensions = {
      ...prev,
      [colDef.field]: { width: colDef.width }
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
            include: isV('ticketIdCol'), 
            searchable: true, 
            width: columnDimensions["ticketId"]?.width || 100,
            align: isArabic ? 'right' : 'left',
            headerAlign: isArabic ? 'right' : 'left',
            renderCell: (params) => (
                <span>{params.value}</span>
            )
        },
        {
            field: isArabic ? "companyNameAr" : "companyNameEn", 
            headerName: t("Customer"), 
            include: isV('customerCol'), 
            searchable: false, 
            width: i18n.language === "ar" 
          ? columnDimensions["companyNameAr"]?.width || 150 
          : columnDimensions["companyNameEn"]?.width || 150,
            align: isArabic ? 'right' : 'left',
            headerAlign: isArabic ? 'right' : 'left',
            renderCell: (params) => (
                <span>{params.value}</span>
            )
        },
        {
            field: isArabic ? "branchNameLc" : "branchNameEn", 
            headerName: t("Branch"), 
            include: isV('branchCol'), 
            searchable: false, 
            sortable: false, 
            width: i18n.language === "ar" 
              ? columnDimensions["branchNameLc"]?.width || 60 
              : columnDimensions["branchNameEn"]?.width || 60, 
            // flex: 1,
            align: isArabic ? 'right' : 'left',
            headerAlign: isArabic ? 'right' : 'left',
            renderCell: (params) => (
                <span>{params.value}</span>
            )
        },
        {
            field: "grievanceName", 
            headerName: t("Issue Name"), 
            include: isV('issueNameCol'), 
            searchable: true, 
            width: columnDimensions["grievanceName"]?.width || 100, 
            // flex: 1,
            align: isArabic ? 'right' : 'left',
            headerAlign: isArabic ? 'right' : 'left',
            renderCell: (params) => (
                <span>{params.value}</span>
            )
        },
        {
            field: "grievanceType", 
            headerName: t("Issue Type"), 
            include: isV('issueTypeCol'), 
            searchable: true, 
            width: columnDimensions["grievanceType"]?.width || 120, 
            // flex: 1,
            align: isArabic ? 'right' : 'left',
            headerAlign: isArabic ? 'right' : 'left',
            renderCell: (params) => (
                <span>{params.value}</span>
            )
        },
        {
            field: "createdAt", 
            headerName: t("Created Date"), 
            include: isV('createdDateCol'), 
            searchable: false, 
            width: columnDimensions["createdAt"]?.width || 100, 
            // flex: 1,
            align: isArabic ? 'right' : 'left',
            headerAlign: isArabic ? 'right' : 'left',
            renderCell: (params) => (
                <span>
                    {params?.row?.createdAt
                        ? formatDate(params?.row?.createdAt, 'DD/MM/YYYY')
                        : convertToTimezone(params?.row?.createdAt, TIMEZONES.SAUDI_ARABIA, 'DD/MM/YYYY')}
                </span>
            )
        },
        {
            field: "createdByUsername", 
            headerName: t("Created By"), 
            include: isV('createdByCol'), 
            searchable: false, 
            sortable: false, 
            width: columnDimensions["createdByUsername"]?.width || 100, 
            // flex: 1,
            align: isArabic ? 'right' : 'left',
            headerAlign: isArabic ? 'right' : 'left',
            renderCell: (params) => (
                <span>{params.value}</span>
            )
        },
        {
            field: "assignedTo", 
            headerName: t("Assigned To"), 
            include: isV('assignedToCol'), 
            searchable: false, 
            width: columnDimensions["assignedTo"]?.width || 100, 
            // flex: 1,
            align: isArabic ? 'right' : 'left',
            headerAlign: isArabic ? 'right' : 'left',
            renderCell: (params) => (
                <span>{params.value}</span>
            )
        },
        {
            field: "status", 
            headerName: t("Status"), 
            include: isV('statusCol'), 
            searchable: true, 
            width: columnDimensions["status"]?.width || 80, 
            // flex: 1,
            align: isArabic ? 'right' : 'left',
            headerAlign: isArabic ? 'right' : 'left',
            cellClassName: (params) => getStatusClass(params.value),
            renderCell: (params) => (
                <label className={getStatusClass(params.value)}>{t(params.value)}</label>
            ),
        },
    ];

    // Filter visible columns
    const visibleColumns = supportColumns.filter(col => col.include !== false);

    // Searchable fields for the toolbar
    const searchableFields = visibleColumns.filter(item => item.searchable).map(item => item.field);
const handleShowAllDetailsClick = async (ticket) => {
    navigate("/supportDetails", { state: { ticket: ticket, mode: "edit" } });
  };
    // Handle row click to navigate to supportDetails page with ticket details
    const handleRowClick = (ticket) => {
        if (isMobile) {
        setSelectedRow(ticket);
        setShowRowPopup(true);
      } else  {
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

    const totalPages = Number.isFinite(total) && Number.isFinite(pageSize) && total > 0 && pageSize > 0
        ? Math.ceil(total / pageSize)
        : 1;
   const handleColumnVisibilityChange = (newModel) => {
    setColumnVisibilityModel(newModel);
    localStorage.setItem(storageKey, JSON.stringify(newModel));
  };
    return (
        <Sidebar title={t("Support")}>
            {isV('supportContent') && (
                <div className='support-content'>
                    {isMobile ? (
                              <div className="table-container">
                                {loading ? (
                                  <LoadingSpinner />
                                ) : error ? (
                                  <div className="error-message">{error}</div>
                                ) : (
                                  <TableMobile
                                    columns={visibleColumns}
                                    allColumns={supportColumns}
                                    data={initialTickets}
                                    showAllDetails={true}
                                    handleAllDetailsClick={handleShowAllDetailsClick}
                                    selectedRow={selectedRow}
                                    setSelectedRow={setSelectedRow}
                                    showRowPopup={showRowPopup}
                                    setShowRowPopup={setShowRowPopup}
                                    dataGridComponent={
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
                                    '.MuiDataGrid-cell': {
                                        textAlign: 'center', // Add this line to center all cell content
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }
                                }}
                            />
                                    }
                                />
                            )}
                        </div>
                    ) : (
                        <div className="table-container">
                            {loading ? (
                                <LoadingSpinner />
                            ) : error ? (
                                <div className="error-message">{error}</div>
                            ) : (
                                <>
                                    {/* Fixed height container for DataGrid with scrollable rows only */}
                                    <div style={{
                                        //height: '400px',
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
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
                                            // Remove these to enable internal scrolling behavior
                                            hideFooter={true}
                                            hideFooterPagination={true}
                                            pagination={false}
                                            // Remove autoHeight to enable fixed height with scrolling
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
                                                // Flex grow to fill available space
                                                flex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                '& .MuiDataGrid-main': {
                                                    flex: 1,
                                                    overflowX: 'scroll',
                                                    overflowY: 'hidden',
                                                },
                                                '& .MuiDataGrid-toolbar': {
                                                    padding: '0px 8px  !important',
                                                    minHeight: '56px !important', // Ensure minimum height for toolbar
                                                    flexShrink: 0, // Prevent toolbar from shrinking
                                                },
                                                // Ensure only the virtual scroller (rows) is scrollable
                                                '& .MuiDataGrid-virtualScroller': {
                                                    //overflow: 'auto !important',
                                                    flex: 1
                                                },
                                                // Keep headers sticky and non-scrollable
                                                '& .MuiDataGrid-columnHeaders': {
                                                    //position: 'sticky',
                                                    top: 0,
                                                    zIndex: 1,
                                                    backgroundColor: 'white',
                                                    borderBottom: '1px solid #e0e0e0',
                                                },
                                                '& .MuiDataGrid-row': {
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                                    },
                                                },
                                                // Arabic RTL styling
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
                                                    }
                                                }),
                                                // Default LTR styling (left alignment)
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
                                                    }
                                                })
                                            }}
                                        />
                                    </div>

                                    {/* External Pagination component */}
                                    {isV('supportPagination') && initialTickets.length > 0 && (
                                        <Pagination
                                            currentPage={page}
                                            totalPages={String(totalPages)}
                                            onPageChange={setPage}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Sidebar>
    );
}

export default Support;
