import React, { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import i18n from "../i18n";
import axios from "axios";
import { convertToTimezone, TIMEZONES } from "../utilities/convertToTimezone";
import RbacManager from "../utilities/rbac";
import CustomToolbar from "../components/CustomToolbar";
import LoadingSpinner from "../components/LoadingSpinner";
import BankTransactionsCard from "../components/BankTransactionsCard";
import TableMobile from "../components/TableMobile";
import {
  DataGrid,
  useGridApiRef,
} from "@mui/x-data-grid";
import Pagination from "../components/Pagination";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const BankTransactions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const currentLanguage = i18n.language;
  const isArabic = currentLanguage === "ar";

  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  // Pagination + sorting
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortModel, setSortModel] = useState([]);
  const [filters, setFilters] = useState({ status: "pending" });
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const gridApiRef = useGridApiRef();
  const contentRef = useRef(null);
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    console.log("isMobile", isMobile);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = contentRef.current?.scrollTop || 0;
      setIsAtTop(scrollTop < 20);
    };

    const container = contentRef.current;
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, []);

  // RBAC
  const rbacMgr = new RbacManager(
    user?.userType === "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "BankTransactions"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);

  const role = user?.userType === "employee" ? user?.designation : user?.roles[0];
  const pageName = "BankTransactions";
  const storageKey = `${pageName}_${role}_columns`;

  useEffect(() => {
    const savedModel = localStorage.getItem(storageKey);
    if (savedModel) {
      setColumnVisibilityModel(JSON.parse(savedModel));
    }
  }, [storageKey]);

  // Fetch API
  const fetchTransactions = useCallback(
    async (page = 1, searchTerm = "", customFilters = {}, sortedModel = []) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page,
          pageSize,
          search: searchTerm,
          sortBy: sortedModel[0]?.field || "id",
          sortOrder: sortedModel[0]?.sort || "asc",
          filters: JSON.stringify(customFilters),
        });

        const { data } = await axios.get(
          `${API_BASE_URL}/bank-transactions/pagination?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const formattedData = (data.data || []).map((row) => ({
          ...row,
          id: row.id,
          transactionId: row.transactionId || "",
          erpCustId: row.erpCustId || "",
          customerName: isArabic ? row.companyNameAr : row.companyNameEn,
          entity: row.entity || "",
          assignedSalesExecutive: row.assignedSalesExecutive || "",
          salesPersonRegion: Array.isArray(row.salesPersonRegion) ? row.salesPersonRegion.join(", ") : row.salesPersonRegion || "",
          orderId: Array.isArray(row.orderId) ? row.orderId.join(", ") : row.orderId || "",
          erpOrderId: Array.isArray(row.erpOrderId) ? row.erpOrderId.join(", ") : row.erpOrderId || "",
          transactionDate: convertToTimezone(row.transactionDate, TIMEZONES.SAUDI_ARABIA, "DD/MM/YYYY"),
          createdAt: convertToTimezone(row.createdAt, TIMEZONES.SAUDI_ARABIA, "DD/MM/YYYY"),
          modifiedByName: row.modifiedByName || "",
          status: row.status,
        }));

        setTransactions(formattedData);
        setTotal(data.pagination?.totalPages || 1);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, token, isArabic]
  );

  useEffect(() => {
    if (user) {
      fetchTransactions(page, searchQuery, filters, sortModel);
    }
  }, [page, searchQuery, sortModel, filters, fetchTransactions, user]);

  // Handle search
  const handleSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
    setPage(1);
  };

  // Handle sort
  const handleSortModelChange = (model) => {
    setSortModel(model);
    fetchTransactions(1, searchQuery, filters, model);
  };

  const handleFilterChange = (newFilters) => {
    // Preserve the status filter from the active tab
    const updatedFilters = { ...newFilters };
    if (activeTab === "pending") {
      updatedFilters.status = "pending";
    }
    setFilters(updatedFilters);
    setPage(1);
    setFilterAnchor(null);
  };

  // Handle tab change for Pending/All
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setPage(1);

    if (newTab === "pending") {
      // Apply pending status filter, preserve other filters
      const { status, ...otherFilters } = filters;
      setFilters({ ...otherFilters, status: "pending" });
    } else {
      // Remove status filter for "all", preserve other filters
      const { status, ...otherFilters } = filters;
      setFilters(otherFilters);
    }
  };

  // Handle row click
  const handleRowClick = (transaction) => {
    navigate(`/bankTransactions/edit/${transaction.id}`);
  };

  const handleAddClick = () => {
    navigate(`/bankTransactions/add`);
  };

  // Columns with minWidth for readable headers
  const transactionColumns = [
    {
      field: "transactionId",
      headerName: t("Transaction ID"),
      include: isV("TransactionIdCol"),
      searchable: true,
      flex: 1,
      minWidth: 130
    },
    {
      field: "erpCustId",
      headerName: t("ERP Customer ID"),
      include: isV("erpCustIdCol"),
      searchable: true,
      flex: 1,
      minWidth: 150
    },
    {
      field: "customerName",
      headerName: t("Customer Name"),
      include: isV("customerCol"),
      searchable: true,
      flex: 2,
      minWidth: 180
    },
    {
      field: "entity",
      headerName: t("Business Unit"),
      include: isV("entityCol"),
      searchable: true,
      flex: 1,
      minWidth: 120
    },
    {
      field: "assignedSalesExecutive",
      headerName: t("Assigned Sales Executive"),
      include: isV("assignedSalesExecutiveCol"),
      searchable: true,
      flex: 1.5,
      minWidth: 200
    },
    {
      field: "salesPersonRegion",
      headerName: t("Sales Person Region"),
      include: isV("salesPersonRegionCol"),
      searchable: true,
      flex: 1.5,
      minWidth: 180
    },
    {
      field: "orderId",
      headerName: t("Order ID"),
      include: isV("OrderIdCol"),
      searchable: true,
      flex: 1,
      minWidth: 100
    },
    {
      field: "erpOrderId",
      headerName: t("ERP Order ID"),
      include: isV("erpOrderIdCol"),
      searchable: true,
      flex: 1,
      minWidth: 130
    },
    {
      field: "transactionDate",
      headerName: t("Transaction Date"),
      include: isV("transactionDateCol"),
      searchable: true,
      flex: 1,
      minWidth: 150
    },
    {
      field: "createdAt",
      headerName: t("Created Date"),
      include: isV("createdAtCol"),
      searchable: true,
      flex: 1,
      minWidth: 130
    },
    {
      field: "modifiedByName",
      headerName: t("Verified By"),
      include: isV("modifiedByNameCol"),
      searchable: true,
      flex: 1,
      minWidth: 130
    },
    {
      field: "status",
      headerName: t("Transaction Status"),
      include: isV("statusCol"),
      searchable: true,
      flex: 1,
      minWidth: 160
    },
  ];

  const visibleColumns = transactionColumns.filter((col) => col.include !== false);
  const searchableFields = visibleColumns.filter((c) => c.searchable).map((c) => c.field);
  const filteredData = visibleColumns?.filter((item) =>
    searchableFields?.includes(item?.field)
  );

  const columnsToDisplay = {
    transactionId: "Transaction ID",
    erpCustId: "ERP Customer ID",
    customerName: "Customer Name",
    entity: "Business Unit",
    assignedSalesExecutive: "Assigned Sales Executive",
    salesPersonRegion: "Sales Person Region",
    orderId: "Order ID",
    erpOrderId: "ERP Order ID",
    transactionDate: "Transaction Date",
    createdAt: "Created Date",
    modifiedByName: "Verified By",
    status: "Transaction Status",
  };

  const handleColumnVisibilityChange = (newModel) => {
    setColumnVisibilityModel(newModel);
    localStorage.setItem(storageKey, JSON.stringify(newModel));
  };

  return (
    <Sidebar title={t("Bank Transactions")}>
      {isV("BankContent") && (
        <div className="bank-transactions-container">
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
                      top: isAtTop ? "60px" : "0px",
                      position: "sticky",
                      zIndex: 20,
                      transition: "top 0.3s ease",
                      background: "#fff",
                    }}
                  >
                    <TableMobile
                      columns={visibleColumns}
                      allColumns={visibleColumns}
                      data={transactions}
                      showAllDetails={true}
                      disableExtendRowFullWidth={true}
                      dataGridComponent={
                        <DataGrid
                          apiRef={gridApiRef}
                          rows={transactions}
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
                                onColumnVisibilityChange={handleColumnVisibilityChange}
                                columns={filteredData}
                                filters={filters}
                                columnVisibilityModel={columnVisibilityModel}
                                searchPlaceholder={t("Search transactions...")}
                                showColumnVisibility={false}
                                showFilters={false}
                                showExport={false}
                                showUpload={false}
                                showAdd={isV('btnAdd')}
                                handleAddClick={handleAddClick}
                                buttonName={t("add")}
                                columnsToDisplay={columnsToDisplay}
                                showTransactionTabs={true}
                                activeTransactionTab={activeTab}
                                handleTransactionTabChange={handleTabChange}
                                excludeFiltersFromChips={["status"]}
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
                  <BankTransactionsCard
                    transactions={transactions}
                    setSelectedRow={handleRowClick}
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
                  rows={transactions}
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
                        onColumnVisibilityChange={handleColumnVisibilityChange}
                        columns={filteredData}
                        filters={filters}
                        columnVisibilityModel={columnVisibilityModel}
                        searchPlaceholder={t("Search transactions...")}
                        showColumnVisibility={true}
                        showFilters={true}
                        showExport={false}
                        showUpload={false}
                        showAdd={isV('btnAdd')}
                        handleAddClick={handleAddClick}
                        buttonName={t("add")}
                        columnsToDisplay={columnsToDisplay}
                        showTransactionTabs={true}
                        activeTransactionTab={activeTab}
                        handleTransactionTabChange={handleTabChange}
                        excludeFiltersFromChips={["status"]}
                      />
                    ),
                  }}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    '& .MuiDataGrid-main': {
                      flex: 1,
                      overflow: 'hidden'
                    },
                    '& .MuiDataGrid-toolbar': {
                      padding: '0px 8px  !important',
                      minHeight: '56px !important',
                      flexShrink: 0,
                    },
                    '& .MuiDataGrid-virtualScroller': {
                      flex: 1
                    },
                    '& .MuiDataGrid-columnHeaders': {
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
              )}
            </div>
          )}
          {transactions?.length > 0 && (
            <Pagination
              currentPage={page}
              totalPages={String(total)}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </Sidebar>
  );
};

export default BankTransactions;
