import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import CustomToolbar from "../components/CustomToolbar";
import Pagination from "../components/Pagination";
import Tabs from "../components/Tabs";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/components.css";
import "../styles/pagination.css";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import Swal from "sweetalert2";
import axios from "axios";
import { DataGrid, useGridApiRef } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";

function PricingPolicyEditor() {
  const [pricingPolicies, setPricingPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // State for Edit Form
  const [editData, setEditData] = useState({
    id: null,
    entity: "",
    fromTime: "",
    toTime: "",
    isActive: true,
  });
  const [originalEditKeys, setOriginalEditKeys] = useState({
    entity: "",
    fromTime: "",
    toTime: "",
  });

  // State for Add Form
  const [policyName, setPolicyName] = useState("");
  const [policyNameLc, setPolicyNameLc] = useState("");
  const [errors, setErrors] = useState({});

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [activeCategory, setActiveCategory] = useState("VMCO");
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [switchLoading, setSwitchLoading] = useState({});
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  const { t, i18n } = useTranslation();
  const { user, token } = useAuth();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const gridApiRef = useGridApiRef();

  // Define tabs array based on your entities
  const categoryTabs = [
    { value: "VMCO", label: "VMCO", disabled: false },
    { value: "SHC", label: "SHC", disabled: false },
    { value: "GMTC", label: "GMTC", disabled: false },
    { value: "NAQI", label: "NAQI", disabled: false },
    { value: "DAR", label: "DAR", disabled: false },
  ];

  const excludeFiltersFromChips = [];

  // RBAC
  const rbacMgr = new RbacManager(
    user?.userType === "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "pricingPolicyEditor"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);

  // Load filters from localStorage on component mount (EXACTLY like DeliveryScheduleEditor)
  useEffect(() => {
    console.log("Loading filters from localStorage...");
    const savedFilters = localStorage.getItem('pricingPolicyFilters');
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

  // Save filters to localStorage whenever they change (EXACTLY like DeliveryScheduleEditor)
  useEffect(() => {
    if (!filtersInitialized) {
      return;
    }

    const filtersToSave = {
      filters,
      searchQuery,
      activeCategory
    };
    localStorage.setItem('pricingPolicyFilters', JSON.stringify(filtersToSave));
    console.log("Filters saved to localStorage:", filtersToSave);
  }, [filters, searchQuery, activeCategory, filtersInitialized]);

  const fetchPricingPolicies = useCallback(async () => {
    if (!activeCategory || !filtersInitialized) return;

    setLoading(true);
    try {
      const apiUrl = `${API_BASE_URL}/pricing-policy/pagination`;
      const filtersCopy = { ...filters };

      const params = new URLSearchParams({
        page,
        pageSize: pageSize,
        search: searchQuery,
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
        const policies = (response.data.data.data || []).map((policy, index) => ({
          id: policy.id || index + 1,
          ...policy
        }));
        setPricingPolicies(policies);
        setTotalPages(response.data.data.totalPages || 1);
        setTotal(response.data.data.totalRecords || 0);
      }
    } catch (err) {
      console.error("Error fetching pricing policies:", err);
      Swal.fire({
        title: "Error",
        text: "Failed to fetch pricing policies",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, filters, activeCategory, token, API_BASE_URL, filtersInitialized]);

  useEffect(() => {
    if (user && activeCategory && filtersInitialized) {
      fetchPricingPolicies();
    }
  }, [page, searchQuery, filters, activeCategory, filtersInitialized, user, token]);

  // useEffect to call fetchPricingPolicies (EXACTLY like DeliveryScheduleEditor)
  useEffect(() => {
    if (user && activeCategory) {
      fetchPricingPolicies();
    }
  }, [page, searchQuery, user, fetchPricingPolicies, filters, activeCategory, filtersInitialized]);

  const handleSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
    setPage(1);
  };

  const isArabicText = (text) => {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
  };

  const handleAddSubmit = async () => {
    if (!policyName || !policyNameLc) {
      Swal.fire("Error", "Please fill all required fields", "error");
      return;
    }

    if (!isArabicText(policyNameLc)) {
      Swal.fire("Error", "Please enter valid Arabic text for Pricing Policy Name (Arabic)", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        entity: activeCategory,
        name: policyName,
        nameLc: policyNameLc,
      };

      const response = await axios.post(
        `${API_BASE_URL}/pricing-policy`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        response.data?.status?.toLowerCase() === "ok" ||
        response.status === 201
      ) {
        Swal.fire("Success", "Pricing policy added successfully", "success");
        setShowAddForm(false);
        setPolicyName("");
        setPolicyNameLc("");
        fetchPricingPolicies();
      }
    } catch (err) {
      console.error("Error adding pricing policy:", err);
      Swal.fire({
        title: "Error",
        text: err.response?.data?.message || "Failed to add pricing policy",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (row) => {
    console.log("Delete clicked for row:", row);
    Swal.fire({
      title: "Are you sure?",
      text: `This will delete pricing policy ${row?.name} for entity ${row?.entity}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#C01823",
      cancelButtonColor: "#0B4C45",
      confirmButtonText: "Yes, delete!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${API_BASE_URL}/pricing-policy/id/${row?.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data?.status?.toLowerCase() === "ok") {
            Swal.fire(
              "Deleted!",
              "Pricing policy has been deleted.",
              "success"
            );
            fetchPricingPolicies();
          }
        } catch (err) {
          console.error("Error deleting pricing policy:", err);
          Swal.fire(
            "Error",
            err.response?.data?.message || "Failed to delete",
            "error"
          );
        }
      }
    });
  };

  // Define columns (EXACTLY like DeliveryScheduleEditor structure)
  const columns = [
    {
      field: i18n.language === "ar" ? "nameLc" : "name",
      headerName: t("Name"),
      flex: 1,
      minWidth: 120,
      searchable: true,
      include: true,
      align: i18n.language === "ar" ? "right" : "left",
      headerAlign: i18n.language === "ar" ? "right" : "left",
    },
    {
      field: "nameLc",
      headerName: t("Name (Arabic)"),
      flex: 1,
      minWidth: 120,
      searchable: true,
      include: true,
      align: i18n.language === "ar" ? "right" : "left",
      headerAlign: i18n.language === "ar" ? "right" : "left",
    },
    {
      field: "entity",
      headerName: t("Entity"),
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
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const restrictedNames = ["price a", "price b", "price c", "price d"];
        const rowName = params.row?.name?.toLowerCase();
        const canDelete = !restrictedNames.includes(rowName);

        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "10px",
              gap: "10px",
              justifyContent: "center"
            }}
          >
            {canDelete && (
              <DeleteIcon
                style={{ cursor: "pointer", color: "#C01823" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(params.row);
                }}
              />
            )}
          </div>
        );
      },
    },
  ];

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

  // Filter visible columns (EXACTLY like DeliveryScheduleEditor)
  const visibleColumns = columns.filter(col => col.include !== false);
  const searchableFields = visibleColumns.filter(item => item.searchable).map(item => item.field);
  const filteredData = visibleColumns.filter(item => searchableFields.includes(item.field));

  const columnsToDisplay = {
    name: "Name",
    nameLc: "Name (Arabic)",
    entity: "Entity"
  };

  // Handle tab change
  const handleTabChange = (tabValue) => {
    setActiveCategory(tabValue);
    setPage(1);
  };

  return (
    <Sidebar title={t("Pricing Policy Editor")}>
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
            <h4>{t("Add New Pricing Policy for")} {t(activeCategory)}</h4>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
              marginTop: "10px",
              marginBottom: "10px"
            }}>
              <div>
                <label>{t("Pricing Policy Name")}<span className="required-field">*</span></label>
                <input
                  type="text"
                  value={policyName}
                  onChange={(e) => setPolicyName(e.target.value)}
                  placeholder={t("Enter pricing policy name")}
                  style={{
                    marginTop: "10px",
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ced4da",
                  }}
                />
              </div>
              <div>
                <label>{t("Pricing Policy Name (Arabic)")}<span className="required-field">*</span></label>
                <input
                  type="text"
                  value={policyNameLc}
                  onChange={(e) => setPolicyNameLc(e.target.value)}
                  placeholder={t("Enter pricing policy name (Arabic)")}
                  style={{
                    marginTop: "10px",
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ced4da",
                  }}
                />
              </div>
            </div>
            <div style={{ marginTop: "15px" }}>
              <button
                onClick={handleAddSubmit}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#0B4C45',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {loading ? t('Adding...') : t("Save Pricing Policy")}
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
              rows={pricingPolicies}
              columns={visibleColumns}
              pageSize={pageSize}
              rowCount={total}
              disableSelectionOnClick
              disableColumnMenu
              hideFooter={true}
              hideFooterPagination={true}
              paginationMode="server"
              rowHeight={55}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={handleColumnVisibilityChange}
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
                    searchPlaceholder={t("Search pricing policies...")}
                    showColumnVisibility={false}
                    showFilters={false}
                    showCalendar={false}
                    showExport={false}
                    showUpload={false}
                    showAdd={isV("addButton")}
                    buttonName={t("Add Pricing Policy")}
                    showApproval={false}
                    handleAddClick={handleAddClick}
                    columnsToDisplay={columnsToDisplay}
                    showAddForm={showAddForm}
                    excludeFiltersFromChips={excludeFiltersFromChips}
                  />
                ),
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

        {/* Pagination Component - EXACTLY like DeliveryScheduleEditor */}
        {isV("ordersPagination") && pricingPolicies.length > 0 && (
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

export default PricingPolicyEditor;
