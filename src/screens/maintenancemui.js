import React, { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../components/Sidebar";
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
import Constants from "../constants";
import { formatDate } from "../utilities/dateFormatter";
import { Box, Button, Typography, Tooltip, Chip } from "@mui/material";
import {
  DataGrid,
  GridFooterContainer,
  GridPagination,
  useGridApiRef,
} from "@mui/x-data-grid";
import TableMobile from "../components/TableMobile";
import MaintenanceCard from "../components/MaintenanceCard";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Status class helper function
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

function Maintenance() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const isArabic = i18n.language === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [isMyTicketsMode, setMyTicketsMode] = useState(false);
  const [isClosedMode, setClosedMode] = useState("open");
  const navigate = useNavigate();
  const [initialTickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const { token, user, isAuthenticated, logout } = useAuth();
  const [openTicketsCount, setOpenTicketsCount] = useState(0);

  // Pagination and filtering state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({});
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [sortModel, setSortModel] = useState([]);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showRowPopup, setShowRowPopup] = useState(false);
  const [paymentChangesIsThere, setPaymentChangesIsThere] = useState(false);

  // Add these state variables near the top of your component
  const role = user?.userType === "employee" ? user?.designation : user?.roles[0];
  const pageName = "Maintenance";
  const columnWidthsKey = `${pageName}_${role}_columnWidths`;
  const [columnDimensions, setColumnDimensions] = useState({});
  const contentRef = useRef(null);
  const [isAtTop, setIsAtTop] = useState(true);

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

  const storageKey = `${pageName}_${role}_columns`;

  useEffect(() => {
    const savedModel = localStorage.getItem(storageKey);
    if (savedModel) {
      setColumnVisibilityModel(JSON.parse(savedModel));
    }
  }, [storageKey]);

  // Add this useEffect to load saved column widths
  useEffect(() => {
    const savedDimensions = localStorage.getItem(columnWidthsKey);
    if (savedDimensions) {
      setColumnDimensions(JSON.parse(savedDimensions));
    }
  }, [columnWidthsKey]);

  // Grid API reference
  const gridApiRef = useGridApiRef();

  // RBAC
  const rbacMgr = new RbacManager(
    user?.userType === "employee"
      ? user?.roles[0] !== "admin"
        ? user?.designation
        : user?.roles[0]
      : "",
    "maintList"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  // Fetch all tickets from API
  const fetchMaintenanceTickets = useCallback(
    async (page = 1, searchTerm = "", customFilters = {}, sortedModel = []) => {
      setLoading(true);
      setError(null);

      try {
        // Add isOpen filter based on isClosedMode
        const filtersWithStatus = {
          ...customFilters,
          isOpen: isClosedMode === "open",
        };

        const params = new URLSearchParams({
          page,
          pageSize,
          search: searchTerm,
          sortBy: sortedModel[0]?.field || "id",
          sortOrder: sortedModel[0]?.sort || "asc",
          filters: JSON.stringify(filtersWithStatus),
        });

        let apiUrl;
        // Only include access parameter if user is maintenance head
        if (
          user?.designation?.toLowerCase() === Constants.DESIGNATIONS.MAINTENANCE_HEAD.toLowerCase()) {
          const accessParam = isMyTicketsMode ? "region" : "all";
          apiUrl = `${API_BASE_URL}/maintenance/pagination?${params.toString()}&access=${accessParam}`;
        } else {
          // For other designations, don't include access parameter
          apiUrl = `${API_BASE_URL}/maintenance/pagination?${params.toString()}`;
        }

        console.log("Fetching maintenance tickets from:", apiUrl);

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
            navigate(user?.userType === "customer" ? "/login" : "/loginemployee");
            return;
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const resp = await response.json();
        console.log("Fetched maintenance tickets:", resp);

        if (resp.status === "Ok" || resp.data) {
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
          throw new Error(
            resp.message || "Failed to fetch maintenance tickets"
          );
        }
      } catch (err) {
        console.error("Failed to fetch maintenance tickets:", err);
        setError(err.message);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    },
    [
      navigate,
      logout,
      user?.userType,
      user?.designation,
      isMyTicketsMode,
      token,
      pageSize,
      isClosedMode,
    ]
  );

  // NOTE: For fetching the user again after browser refresh - start
  useEffect(() => {
    if (loading) return;
    console.log("user in maintenance page:", user);
    if (user) {
      fetchMaintenanceTickets(page, searchQuery, filters, sortModel);
    }
    if (!user) {
      console.log("logging out");
    }
  }, [
    page,
    searchQuery,
    user,
    fetchMaintenanceTickets,
    filters,
    sortModel,
    isMyTicketsMode,
    isClosedMode,
  ]);

  // Handle search functionality
  const handleSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
    setPage(1);
  };

  // Handle sort model change
  const handleSortModelChange = (model) => {
    console.log("Sort model changed:", model);
    setSortModel(model);
    fetchMaintenanceTickets(1, searchQuery, filters, model);
  };

  // Toggle between all tickets and my tickets
  const handleApproval = (mode) => {
    setFilters({});
    setMyTicketsMode(mode === "approval");
    setPage(1);
  };

  // Add handler for open/closed toggle
  const handleShowClosedTickets = (mode) => {
    console.log("Closed Mode:", mode);
    setClosedMode(mode);
    setPage(1);
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
  const maintenanceColumns = [
    {
      field: "requestId",
      headerName: t("Request #"),
      include: isV("requestIdCol"),
      searchable: true,
      width: columnDimensions["requestId"]?.width || 100,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{params.value}</span>,
    },
    {
      field: "erpCustomerId",
      headerName: t("ERP Customer ID"),
      include: isV("erpCustomerIdCol"),
      width: 150,
      searchable: true,
      sortable: false,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{params.value}</span>,
    },
    {
      field: currentLanguage === "en" ? "companyNameEn" : "companyNameAr",
      headerName: t("Customer"),
      include: isV("customerCol"),
      width:
        columnDimensions[
          currentLanguage === "en" ? "companyNameEn" : "companyNameAr"
        ]?.width || 150,
      searchable: false,
      sortable: false,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{params.value}</span>,
    },
    {
      field: "assignedSalesExecutive",
      headerName: t("Asigned Sales Executive"),
      include: isV("assignedSalesExecutiveCol"),
      width: 150,
      searchable: true,
      sortable: false,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{params.value}</span>,
    },
    {
      field: currentLanguage === "en" ? "branchNameEn" : "branchNameLc",
      headerName: t("Branch"),
      include: isV("branchCol"),
      width:
        columnDimensions[
          currentLanguage === "en" ? "branchNameEn" : "branchNameLc"
        ]?.width || 150,
      searchable: false,
      sortable: false,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{params.value}</span>,
    },
    {
      field: "issueName",
      headerName: t("Issue Name"),
      include: isV("issueNameCol"),
      searchable: true,
      width: columnDimensions["issueName"]?.width || 100,
      align: isArabic ? "right" : "left",
      headerAlign: isArabic ? "right" : "left",
      renderCell: (params) => <span>{params.value}</span>,
    },
    {
      field: "issueType",
      headerName: t("Issue Type"),
      include: isV("issueTypeCol"),
      searchable: true,
      width: columnDimensions["issueType"]?.width || 120,
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
      field: "urgencyLevel",
      headerName: t("Urgency Level"),
      include: isV("urgencyLevelCol"),
      searchable: true,
      width: columnDimensions["urgencyLevel"]?.width || 120,
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
  const visibleColumns = maintenanceColumns.filter(
    (col) => col.include !== false
  );

  // Searchable fields for the toolbar
  const searchableFields = visibleColumns
    .filter((item) => item.searchable)
    .map((item) => item.field);

  const handleShowAllDetailsClick = async (ticket) => {
    navigate("/maintenanceDetails", { state: { ticket: ticket, mode: "edit" } });
  };

  // Handle row click to navigate to Maintenance details page with ticket details
  const handleRowClick = (params) => {
    const ticket = params.row;
    if (isMobile) {
      setSelectedRow(ticket);
      setShowRowPopup(true);
    } else {
      navigate("/maintenanceDetails", { state: { ticket: ticket, mode: "edit" } });
    }
  };

  // Handle adding a new ticket
  const handleAdd = () => {
    if (isAuthenticated) {
      navigate("/maintenanceDetails", { state: { ticket: {}, mode: "add" } });
    } else {
      navigate(user?.userType === "customer" ? "/login" : "/loginemployee");
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
    requestId: "Request #",
    erpCustomerId: "ERP Customer ID",
    companyNameEn: "Customer",
    assignedSalesExecutive: "Assigned Sale Executive",
    branchNameEn: "Branch",
    issueName: "Issue Name",
    issueType: "Issue Type",
    createdAt: "Created Date",
    createdByUsername: "Created By",
    urgencyLevel: "Urgency Level",
    assignedTo: "Assigned To",
    status: "Status",
  };

  // Pagination calculation - same as Orders and Support pages
  const totalPages =
    Number.isFinite(total) && Number.isFinite(pageSize) && total > 0 && pageSize > 0
      ? Math.ceil(total / pageSize)
      : 1;

  const handleColumnVisibilityChange = (newModel) => {
    setColumnVisibilityModel(newModel);
    localStorage.setItem(storageKey, JSON.stringify(newModel));
  };

  return (
    <Sidebar title={t("Maintenance")} isV={isV("maintenanceContent")}>
      <div className="maintenance-content">
        {isMobile ? (
          <div className="orders-content">
            {loading ? (
              <LoadingSpinner />
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <>
                <div
                  className="catalog-fixed-header"
                  style={{
                    top: isAtTop ? "60px" : "0px", // 👈 adjust height of filter-section
                    position: "sticky",
                    zIndex: 20,
                    transition: "top 0.3s ease",
                    background: "#fff",
                  }}
                >
                  <TableMobile
                    columns={visibleColumns}
                    allColumns={maintenanceColumns}
                    data={initialTickets}
                    showAllDetails={true}
                    handleAllDetailsClick={handleShowAllDetailsClick}
                    selectedRow={selectedRow}
                    setSelectedRow={setSelectedRow}
                    showRowPopup={showRowPopup}
                    setShowRowPopup={setShowRowPopup}
                    getPaymentStatusClass={getStatusClass}
                    dataGridComponent={
                      <DataGrid
                        apiRef={gridApiRef}
                        rows={[]}
                        columns={[]}
                        pageSize={pageSize}
                        rowCount={total}
                        onRowClick={handleRowClick}
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
                              searchPlaceholder="Search maintenance tickets..."
                              showColumnVisibility={false}
                              showFilters={true}
                              showExport={false}
                              showUpload={false}
                              showAdd={isV("btnAdd") || isE("btnAdd")}
                              buttonName={t("Add")}
                              showApproval={isV("toggleButton") && user?.designation === "maintenance head"}
                              showClosed={true}
                              isClosedMode={isClosedMode}
                              handleClosedTickets={handleShowClosedTickets}
                              handleAddClick={handleAdd}
                              columnsToDisplay={columnsToDisplay}
                              handleApproval={handleApproval}
                              isApprovalMode={isMyTicketsMode}
                              openTicketsCount={openTicketsCount}
                            />
                          ),
                        }}
                        sx={{
                          border: "none !important",
                          "& .MuiDataGrid-overlay": {
                            display: "none !important", // ✅ hides “No rows” message
                          },
                          "& .MuiDataGrid-row": {
                            // cursor: "default",
                            // "&:hover": {
                            //   backgroundColor: "rgba(0, 0, 0, 0.04)",
                            // },
                            display: "none !important",
                          },
                          ".MuiDataGrid-cell": {
                            display: "none !important",
                          },
                          "& .MuiDataGrid-main": {
                            display: "none", // ✅ hides the main grid body
                          },
                          "& .MuiDataGrid-toolbar": {
                            // position: "sticky",
                            // top: 0,
                            // zIndex: 10, // keeps it above rows
                            // backgroundColor: "#fff", // ensures it doesn't become transparent
                            // borderBottom: "1px solid #e0e0e0",
                            padding: "0px",
                            gap: "10px",
                            border: "none",
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
                    }
                  />
                </div>
                <MaintenanceCard
                  tickets={initialTickets}
                  setSelectedRow={handleShowAllDetailsClick}
                // handleViewDetails={(ticket) =>
                //   navigate("/maintenanceDetails", { state: { ticket, mode: "edit" } })
                // }
                // handleAdd={() =>
                //   navigate("/maintenanceDetails", { state: { ticket: {}, mode: "add" } })
                // }
                />

              </>
            )}
          </div>
        ) : (
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
                onRowClick={handleRowClick}
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
                      searchPlaceholder="Search maintenance tickets..."
                      showColumnVisibility={true}
                      showFilters={true}
                      showExport={false}
                      showUpload={false}
                      showAdd={isV("btnAdd") || isE("btnAdd")}
                      buttonName={t("Add")}
                      showApproval={
                        isV("toggleButton") &&
                        user?.designation === "maintenance head"
                      }
                      showClosed={true}
                      isClosedMode={isClosedMode}
                      handleClosedTickets={handleShowClosedTickets}
                      handleAddClick={handleAdd}
                      columnsToDisplay={columnsToDisplay}
                      handleApproval={handleApproval}
                      isApprovalMode={isMyTicketsMode}
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
                  ...(isArabic
                    ? {
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
                    }
                    : {
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
            )}
          </div>
        )}

        {/* External Pagination component */}
        {isV("maintenancePagination") && initialTickets.length > 0 && (
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

export default Maintenance;
