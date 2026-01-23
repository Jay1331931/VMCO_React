import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
// Remove CustomToolbar from here if it's grid-dependent
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
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import DeleteIcon from "@mui/icons-material/Delete";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

import timezone from "dayjs/plugin/timezone";
import { ro } from "date-fns/locale";
dayjs.extend(utc);
dayjs.extend(timezone);
const userTimezone = dayjs.tz.guess();
// const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const TimeConverter = (time) => {
  const todayUTC = new Date().toISOString().split("T")[0];
  const utcDateTime = `${todayUTC}T${time}Z`;

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const localTime = new Date(utcDateTime).toLocaleTimeString("en-IN", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return localTime;
};
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
  // We need to keep track of the original keys for the update API URL
  const [originalEditKeys, setOriginalEditKeys] = useState({
    entity: "",
    fromTime: "",
    toTime: "",
  });

  // State for Add Form
  const [policyName, setPolicyName] = useState();
  const [policyNameLc, setPolicyNameLc] = useState();
  const [errors, setErrors] = useState({});

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [activeCategory, setActiveCategory] = useState("VMCO"); // Default entity
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [switchLoading, setSwitchLoading] = useState({});

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

  // RBAC
  const rbacMgr = new RbacManager(
    user?.userType === "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "coolingPeriodEditor"
  );
  const isV = () => true;

  const fetchPricingPolicies = useCallback(async () => {
    if (!activeCategory) return;

    setLoading(true);
    try {
      const queryFilters = {
        ...filters,
        entity: activeCategory,
      };

      const response = await axios.get(
        `${API_BASE_URL}/pricing-policy/pagination`,
        {
          params: {
            page,
            pageSize,
            search: searchQuery,
            entity: activeCategory,
            filters: JSON.stringify(queryFilters),
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.status?.toLowerCase() === "ok") {
        setPricingPolicies(response.data.data.data);
        setTotalPages(response.data.data.totalPages);
        setTotal(response.data.data.totalRecords);
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
  }, [
    API_BASE_URL,
    token,
    page,
    pageSize,
    searchQuery,
    activeCategory,
    filters,
  ]);

  useEffect(() => {
    fetchPricingPolicies();
  }, [fetchPricingPolicies]);

  

  const handleSearch = (query) => {
    setSearchQuery(query);
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

    if(!isArabicText(policyNameLc)){
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

  const handleEditClick = (row) => {
    setEditData({
      id: row.id,
      entity: row.entity,
      fromTime: row.fromTime,
      toTime: row.toTime,
      isActive: row.isActive,
    });
    setOriginalEditKeys({
      entity: row.entity,
      fromTime: row.fromTime,
      toTime: row.toTime,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    setLoading(true);
    try {
      const { entity, fromTime, toTime } = originalEditKeys;
      const apiUrl = `${API_BASE_URL}/cooling-period/${entity}/${fromTime}/${toTime}`;

      const payload = {
        fromTime: editData.fromTime,
        toTime: editData.toTime,
        isActive: editData.isActive,
      };

      const response = await axios.patch(apiUrl, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.status?.toLowerCase() === "ok") {
        Swal.fire("Success", "Cooling period updated successfully", "success");
        setShowEditModal(false);
        fetchPricingPolicies();
      }
    } catch (err) {
      console.error("Error updating cooling period:", err);
      Swal.fire({
        title: "Error",
        text: err.response?.data?.message || "Failed to update cooling period",
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

  const columns = [
    {
      field: i18n.language === "ar" ? "nameLc" : "name",
      headerName: t("Name"),
      flex: 1,
      headerClassName: "super-app-theme--header",
    },
    {
      field: i18n.language === "en" ? "nameLc" : "nameLc",
      headerName: t("Name (Arabic)"),
      flex: 1,
      headerClassName: "super-app-theme--header",
    },
    {
      field: "entity",
      headerName: t("Entity"),
      flex: 1,
      headerClassName: "super-app-theme--header",
    },
   {
  field: "actions",
  headerName: t("Actions"),
  width: 120,
  headerClassName: "super-app-theme--header",
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
        }}
      >
        {canDelete && (
          <DeleteIcon
            style={{ cursor: "pointer", color: "#C01823" }}
            onClick={() => handleDeleteClick(params.row)}
          />
        )}
      </div>
    );
  },
}
  ];

  return (
    <Sidebar>
      <div className="orders-container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2>{t("Pricing Policy Editor")}</h2>
        </div>

        <Tabs
          tabs={categoryTabs}
          activeTab={activeCategory}
          onTabChange={setActiveCategory}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            margin: "10px",
          }}
        >
          <button
            className="add-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#0B4C45",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {showAddForm ? t("Close Form") : t("Add New Pricing Policy")}
          </button>
        </div>

        {showAddForm && (
          <div
            style={{
              padding: "20px",
              backgroundColor: "#f8f9fa",
              marginBottom: "20px",
              borderRadius: "8px",
              border: "1px solid #dee2e6",
            }}
          >
            <h3 style={{ marginTop: 0,marginBottom: 20 }}>{t("Add New Pricing Policy")}</h3>
            <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr auto",
        gap: "20px",
        alignItems: "end",
      }}
    >
      {/* Pricing Policy Name */}
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "6px",
            fontWeight: 500,
          }}
        >
          {t("Pricing Policy Name")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          value={policyName}
          onChange={(e) => setPolicyName(e.target.value)}
          placeholder={t("Enter pricing policy name")}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ced4da",
          }}
        />
        {errors.policyName && (
          <span style={{ color: "red", fontSize: "12px" }}>
            {errors.policyName}
          </span>
        )}
      </div>
      {/* Pricing Policy Name */}
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "6px",
            fontWeight: 500,
          }}
        >
          {t("Pricing Policy Name (Arabic)")}
          <span className="required-field">*</span>
        </label>
        <input
          type="text"
          value={policyNameLc}
          onChange={(e) => setPolicyNameLc(e.target.value)}
          placeholder={t("Enter pricing policy name (Arabic)")}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ced4da",
          }}
        />
        {errors.policyName && (
          <span style={{ color: "red", fontSize: "12px" }}>
            {errors.policyName}
          </span>
        )}
      </div>
    </div>
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                onClick={handleAddSubmit}
                disabled={loading}
                style={{
                  padding: "8px 20px",
                  backgroundColor: "#0B4C45",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {loading ? t("Adding...") : t("Save Pricing Policy")}
              </button>
            </div>
          </div>
        )}

        {loading && !pricingPolicies.length ? (
          <LoadingSpinner />
        ) : (
          <div style={{ height: 600, width: "100%", backgroundColor: "white" }}>
            <DataGrid
              rows={pricingPolicies}
              columns={columns}
              pageSize={pageSize}
              rowCount={total}
              paginationMode="server"
              onPageChange={(newPage) => setPage(newPage + 1)}
              loading={loading}
              getRowId={(row) => row.id}
              disableColumnMenu
              slots={{
                toolbar: CustomToolbar,
              }}
              slotProps={{
                toolbar: {
                  title: t("Pricing Policy Editor"),
                  onSearch: handleSearch,
                  showExport: false,
                  showImport: false,
                },
              }}
              sx={{
                "& .super-app-theme--header": {
                  backgroundColor: "#f5f5f5",
                  fontWeight: "bold",
                },
              }}
            />
          </div>
        )}

      </div>
    </Sidebar>
  );
}

export default PricingPolicyEditor;
