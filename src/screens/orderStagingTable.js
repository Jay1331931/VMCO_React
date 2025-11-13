import React, { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../components/Sidebar";
import LoadingSpinner from "../components/LoadingSpinner";
import CustomToolbar from "../components/CustomToolbar";
import Pagination from "../components/Pagination";
import "../styles/components.css";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import Swal from "sweetalert2";
import axios from "axios";
import { Tooltip } from "@mui/material";
import { DataGrid, useGridApiRef } from "@mui/x-data-grid";
import TableMobile from "../components/TableMobile";

function OrderStagingTable() {
    const [orderList, setOrderList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({});
    const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
    const [sortModel, setSortModel] = useState([]);
    const [filterAnchor, setFilterAnchor] = useState(null);

    const { t, i18n } = useTranslation();
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    // Check if current language is Arabic
    const isArabic = i18n.language === "ar" || i18n.resolvedLanguage === "ar";

    // Use ref to track if component is mounted to prevent state updates after unmount
    const isMountedRef = useRef(true);

    // Grid API reference
    const gridApiRef = useGridApiRef();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // RBAC
    const rbacMgr = new RbacManager(
        user?.userType === "employee" && user?.roles[0] !== "admin"
            ? user?.designation
            : user?.roles[0],
        "orderStagingTable"
    );
    const isV = rbacMgr.isV.bind(rbacMgr);
    const isE = rbacMgr.isE.bind(rbacMgr);

    const role = user?.userType === "employee" ? user?.designation : user?.roles?.[0];
    const pageName = "orderStagingTable";
    const storageKey = `${pageName}_${role}_columns`;
    const columnWidthsKey = `${pageName}_${role}_columnWidths`;
    const [columnDimensions, setColumnDimensions] = useState({});

    useEffect(() => {
        const savedModel = localStorage.getItem(storageKey);
        if (savedModel) {
            setColumnVisibilityModel(JSON.parse(savedModel));
        }

        const savedWidths = localStorage.getItem(columnWidthsKey);
        if (savedWidths) {
            setColumnDimensions(JSON.parse(savedWidths));
        }
    }, [storageKey, columnWidthsKey]);

    const fetchOrderList = useCallback(
        async (page = 1, searchTerm = "", customFilters = {}, sortedModel = []) => {
            // Early return if no token or user (prevents API calls during logout)
            if (!token || !user) {
                console.log("No token or user available, skipping API call");
                return;
            }

            // Check if component is still mounted
            if (!isMountedRef.current) {
                console.log("Component unmounted, skipping API call");
                return;
            }

            setLoading(true);

            // Create AbortController for cleanup
            const abortController = new AbortController();

            try {
                const apiUrl = `${API_BASE_URL}/temp-sales-order/all`;
                const params = new URLSearchParams({
                    page: page - 1, // Backend uses 0-based index
                    pageSize: pageSize,
                    search: searchTerm,
                    sortBy: sortedModel?.[0]?.field || "id",
                    sortOrder: sortedModel?.[0]?.sort || "asc",
                });

                // Add custom filters if any
                if (Object.keys(customFilters).length > 0) {
                    Object.entries(customFilters).forEach(([key, value]) => {
                        if (value) {
                            params.append(key, value);
                        }
                    });
                }

                const response = await axios.get(`${apiUrl}?${params}`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    signal: abortController.signal,
                });

                console.log("API Response:", response.data);

                // Check if component is still mounted before updating state
                if (!isMountedRef.current) {
                    return;
                }

                if (response.data && response.data.status === "Ok" && Array.isArray(response.data.data)) {
                    // Process data for DataGrid
                    const processedData = response.data.data.map((item, index) => ({
                        ...item,
                        id: item.id || `row-${index}`, // Ensure unique id for DataGrid
                        companyName: isArabic
                            ? item.orderDetails?.companyNameAr
                            : item.orderDetails?.companyNameEn,
                    }));

                    setOrderList(processedData);
                    const totalRecords = response.data?.totalRecords || processedData.length;
                    setTotal(totalRecords);
                } else {
                    console.warn("Unexpected response format:", response.data);
                    setOrderList([]);
                    setTotal(0);
                }
            } catch (err) {
                // Don't show error if request was aborted (component unmounted)
                if (axios.isCancel(err) || err.name === "CanceledError") {
                    console.log("Request was cancelled");
                    return;
                }

                // Don't show error if component is unmounted
                if (!isMountedRef.current) {
                    return;
                }

                console.error("Error fetching order staging data:", err);
                setOrderList([]);
                setTotal(0);

                // Only show error if it's not a 401 (which would be handled by logout)
                if (err.response?.status === 401) {
                    logout();
                    navigate(user?.userType === "customer" ? "/login" : "/login-employee");
                } else {
                    Swal.fire({
                        title: "Error",
                        text: err.response?.data?.message || "Failed to fetch order staging data",
                        icon: "error",
                        confirmButtonText: "OK",
                    });
                }
            } finally {
                // Check if component is still mounted before updating loading state
                if (isMountedRef.current) {
                    setLoading(false);
                }
            }
        },
        [API_BASE_URL, token, user, pageSize, isArabic, logout, navigate]
    );

    useEffect(() => {
        // Set mounted flag
        isMountedRef.current = true;

        // Only fetch if we have both token and user
        if (token && user) {
            fetchOrderList(page, searchQuery, filters, sortModel);
        }

        // Cleanup function
        return () => {
            isMountedRef.current = false;
        };
    }, [page, searchQuery, user, fetchOrderList, filters, sortModel]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Handle search functionality
    const handleSearch = (searchTerm) => {
        setSearchQuery(searchTerm);
        setPage(1);
    };

    // Handle sort model change
    const handleSortModelChange = (model) => {
        console.log("Sort model changed:", model);
        setSortModel(model);
        fetchOrderList(page, searchQuery, filters, model);
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

    const handleColumnVisibilityChange = (newModel) => {
        setColumnVisibilityModel(newModel);
        localStorage.setItem(storageKey, JSON.stringify(newModel));
    };

    // Handle filter changes
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setPage(1);
        setFilterAnchor(null);
    };

    // Export functionality
    const handleExportData = async () => {
        try {
            const params = new URLSearchParams({
                page: page - 1,
                pageSize: pageSize,
                search: searchQuery,
                download: "true",
            });

            // Add filters to export
            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    params.append(key, value);
                }
            });

            const apiUrl = `${API_BASE_URL}/temp-sales-order/all?${params.toString()}`;

            const response = await fetch(apiUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    logout();
                    navigate(user?.userType === "customer" ? "/login" : "/login-employee");
                    return;
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;

            const contentDisposition = response.headers.get("Content-Disposition");
            let filename = "temp_sales_orders.csv";
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, "");
                }
            }

            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            console.log("CSV file downloaded successfully");
        } catch (error) {
            console.error("Error downloading order staging data:", error);
            Swal.fire({
                title: "Error",
                text: "Failed to download data",
                icon: "error",
                confirmButtonText: "OK",
            });
        }
    };

    // Define columns for the DataGrid
    const orderColumns = [
        {
            field: "id",
            headerName: t("ID"),
            include: isV("idCol"),
            searchable: true,
            sortable: true,
            width: columnDimensions.id?.width || 120,
            align: isArabic ? "right" : "left",
            headerAlign: isArabic ? "right" : "left",
            renderCell: (params) => (
                <span style={{ fontWeight: "500" }}>{params.value || "-"}</span>
            ),
        },
        {
            field: "orderId",
            headerName: t("Order ID"),
            include: isV("orderIdCol"),
            searchable: true,
            sortable: true,
            width: columnDimensions.orderId?.width || 100,
            align: isArabic ? "right" : "left",
            headerAlign: isArabic ? "right" : "left",
            renderCell: (params) => <span>{params.value || "-"}</span>,
        },
        {
            field: "companyName",
            headerName: t("Company Name"),
            include: isV("companyNameCol"),
            searchable: true,
            sortable: true,
            width: columnDimensions.companyName?.width || 250,
            align: isArabic ? "right" : "left",
            headerAlign: isArabic ? "right" : "left",
            renderCell: (params) => (
                <Tooltip title={params.value || "-"} arrow>
                    <span
                        style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "100%",
                        }}
                    >
                        {params.value || "-"}
                    </span>
                </Tooltip>
            ),
        },
        {
            field: "entity",
            headerName: t("Entity"),
            include: isV("entityCol"),
            searchable: true,
            sortable: true,
            width: columnDimensions.entity?.width || 100,
            align: isArabic ? "right" : "left",
            headerAlign: isArabic ? "right" : "left",
            renderCell: (params) => <span>{params.value || "-"}</span>,
        },
        {
            field: "totalAmount",
            headerName: t("Total Amount"),
            include: isV("totalAmountCol"),
            searchable: true,
            sortable: true,
            width: columnDimensions.totalAmount?.width || 130,
            align: "right",
            headerAlign: isArabic ? "right" : "left",
            renderCell: (params) => (
                <span>{params.value ? parseFloat(params.value).toFixed(2) : "-"}</span>
            ),
        },
        {
            field: "createdAt",
            headerName: t("Created At"),
            include: isV("createdAtCol"),
            searchable: false,
            sortable: true,
            width: columnDimensions.createdAt?.width || 180,
            align: isArabic ? "right" : "left",
            headerAlign: isArabic ? "right" : "left",
            renderCell: (params) => (
                <span>{params.value ? new Date(params.value).toLocaleString() : "-"}</span>
            ),
        },
    ];

    // Filter visible columns
    const visibleColumns = orderColumns.filter((col) => col.include !== false);

    // Searchable fields for the toolbar
    const searchableFields = visibleColumns.filter((item) => item.searchable).map((item) => item.field);

    const filteredData = visibleColumns?.filter((item) => searchableFields?.includes(item?.field));

    // Columns to display mapping
    const columnsToDisplay = {
        id: "ID",
        orderId: "Order ID",
        companyName: "Company Name",
        entity: "Entity",
        totalAmount: "Total Amount",
        createdAt: "Created At",
    };

    const totalPages =
        Number.isFinite(total) && Number.isFinite(pageSize) && total > 0 && pageSize > 0
            ? Math.ceil(total / pageSize)
            : 1;

    // Add safety check to ensure orderList is always an array
    const safeOrderList = Array.isArray(orderList) ? orderList : [];

    // Don't render anything if user is not authenticated
    if (!user || !token) {
        return null;
    }

    return (
        <Sidebar title={t("Order Staging Table")} isV={isV("orderStagingTableContent")}>
            <div className="order-staging-content">
                {isMobile ? (
                    <div className="table-container">
                        {loading ? (
                            <LoadingSpinner />
                        ) : (
                            <TableMobile
                                columns={visibleColumns}
                                allColumns={orderColumns}
                                data={safeOrderList}
                                showAllDetails={false}
                            />
                        )}
                    </div>
                ) : (
                    <div className="table-container">
                        {loading ? (
                            <LoadingSpinner />
                        ) : (
                            <div style={{ width: "100%" }}>
                                <DataGrid
                                    apiRef={gridApiRef}
                                    rows={safeOrderList}
                                    columns={visibleColumns}
                                    pageSize={pageSize}
                                    rowCount={total}
                                    getRowId={(row) => row.id}
                                    columnVisibilityModel={columnVisibilityModel}
                                    onColumnVisibilityModelChange={handleColumnVisibilityChange}
                                    sortModel={sortModel}
                                    onSortModelChange={handleSortModelChange}
                                    disableSelectionOnClick
                                    disableColumnMenu
                                    hideFooter={true}
                                    hideFooterPagination={true}
                                    pagination={false}
                                    rowHeight={55}
                                    autoHeight
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
                                                searchPlaceholder={t("Search orders...")}
                                                showColumnVisibility={false}
                                                showFilters={false}
                                                showExport={true}
                                                handleExportClick={handleExportData}
                                                showUpload={false}
                                                showCalendar={false}
                                                showAdd={false}
                                                showApproval={false}
                                                columnsToDisplay={columnsToDisplay}
                                            />
                                        ),
                                    }}
                                    sx={{
                                        "& .MuiDataGrid-main": {
                                            overflowX: "auto",
                                        },
                                        "& .MuiDataGrid-toolbar": {
                                            padding: "0px 8px !important",
                                            minHeight: "56px !important",
                                        },
                                        "& .MuiDataGrid-columnHeaders": {
                                            backgroundColor: "white",
                                            borderBottom: "1px solid #e0e0e0",
                                        },
                                        "& .MuiDataGrid-row:hover": {
                                            backgroundColor: "rgba(0, 0, 0, 0.04)",
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
                            </div>
                        )}
                    </div>
                )}

                {/* External Pagination component */}
                {isV("orderStagingPagination") && safeOrderList.length > 0 && (
                    <Pagination currentPage={page} totalPages={String(totalPages)} onPageChange={setPage} />
                )}
            </div>
        </Sidebar>
    );
}

export default OrderStagingTable;
