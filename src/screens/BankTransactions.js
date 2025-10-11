import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import i18n from "../i18n";
import axios from "axios";
import { convertToTimezone, TIMEZONES } from "../utilities/convertToTimezone";
import RbacManager from "../utilities/rbac";
import CustomToolbar from "../components/CustomToolbar"; // same as used in Support
import LoadingSpinner from "../components/LoadingSpinner";

import {
  DataGrid,
  useGridApiRef,
} from "@mui/x-data-grid";

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

  // Pagination + sorting
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortModel, setSortModel] = useState([]);
  const [filters, setFilters] = useState({});
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [filterAnchor, setFilterAnchor] = useState(null);

  const gridApiRef = useGridApiRef();

  // RBAC
  const rbacMgr = new RbacManager(
    user?.userType === "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "BankTransactions"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);

   const role=  user?.userType === "employee" ? user?.designation :user?.roles[0]
const pageName= "BankTransactions"
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
          id: row.id, // required for DataGrid
          orderId: Array.isArray(row.orderId) ? row.orderId.join(", ") : row.orderId,
          erpOrderId: Array.isArray(row.erpOrderId) ? row.erpOrderId.join(", ") : row.erpOrderId,
          createdAt: convertToTimezone(row.createdAt, TIMEZONES.SAUDI_ARABIA, "DD/MM/YYYY"),
          transactionDate:
            convertToTimezone(row.transactionDate, TIMEZONES.SAUDI_ARABIA, "DD/MM/YYYY") || "N/A",
        }));

        setTransactions(formattedData);
        setTotal(data.pagination?.totalRecords || formattedData.length);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, token]
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

  // Handle filter
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
    setFilterAnchor(null);
  };

  // Handle row click
  const handleRowClick = (transaction) => {
    navigate(`/bankTransactions/edit/${transaction.id}`);
  };


  const handleAddClick = () => {
    navigate(`/bankTransactions/add`);
  };
  // Columns
  const transactionColumns = [
    { field: "id", headerName: t("Transaction Id"), include: isV("TransactionIdCol"),      searchable: true,flex: 1 },
    { field: "erpCustId", headerName: t("ERP Customer Id"), include: isV("erpCustIdCol"),     searchable: true, flex: 1 },
    { field: "erpOrderId", headerName: t("ERP Order Id"), include: isV("erpOrderIdCol"),     searchable: false, flex: 1 },
    { field: "orderId", headerName: t("Order Id"), include: isV("OrderIdCol"),      searchable: false,flex: 1 },
    {
      field: isArabic ? "companyNameAr" : "companyNameEn",
      headerName: t("Customer"),
      include: isV("customerCol"),
           searchable: true,
      flex: 2,
    },
    { field: "amountTransferred", headerName: t("Amount Transferred"), include: isV("amountTransferredCol"),     searchable: false, flex: 1 },
    { field: "transactionDate", headerName: t("Transaction Date"), include: isV("transactionDateCol"),      searchable: false,flex: 1 },
    { field: "createdAt", headerName: t("Created At"), include: isV("createdAtCol"),     searchable: true, flex: 1 },
    { field: "status", headerName: t("Transaction Status"), include: isV("statusCol"),       searchable: true,   flex: 1 },
  ];

  const visibleColumns = transactionColumns.filter((col) => col.include !== false);
  const searchableFields = visibleColumns.filter((c) => c.searchable).map((c) => c.field);

  // Columns mapping for toolbar
  const columnsToDisplay = {
    id: "Transaction Id",
    erpCustId: "ERP Customer Id",
    erpOrderId: "ERP Order Id",
    orderId: "Order Id",
    companyNameEn: "Customer",
    amountTransferred: "Amount Transferred",
    transactionDate: "Transaction Date",
    createdAt: "Created At",
    status: "Status",
  };
   const handleColumnVisibilityChange = (newModel) => {
    setColumnVisibilityModel(newModel);
    localStorage.setItem(storageKey, JSON.stringify(newModel));
  };
  return (
    <Sidebar title={t("Bank Transactions")}>
      {isV("BankContent") && (
        <div className="bank-transactions-container">
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
                      onColumnVisibilityChange={handleColumnVisibilityChange}
                      columns={visibleColumns}
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
                    />
                  ),
                }}
                sx={{
                  "& .MuiDataGrid-row": {
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                  },
                }}
              />
            )}
          </div>
        </div>
      )}
    </Sidebar>
  );
};

export default BankTransactions;
