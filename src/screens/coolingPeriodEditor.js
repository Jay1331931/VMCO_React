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
function CoolingPeriodEditor() {
  const [coolingPeriods, setCoolingPeriods] = useState([]);
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
  const [newPeriod, setNewPeriod] = useState({
    fromTime: "",
    toTime: "",
    isActive: true,
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);
  const [activeCategory, setActiveCategory] = useState("SHC"); // Default entity
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [switchLoading, setSwitchLoading] = useState({});

  const { t, i18n } = useTranslation();
  const { user, token } = useAuth();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const gridApiRef = useGridApiRef();

  // Define tabs array based on your entities
  const categoryTabs = [
    // { value: "VMCO", label: "VMCO", disabled: false },
    { value: "SHC", label: "SHC", disabled: false },
    { value: "GMTC", label: "GMTC", disabled: false },
    // { value: "NAQI", label: "NAQI", disabled: false },
    // { value: "DAR", label: "DAR", disabled: false },
  ];

  // RBAC
  const rbacMgr = new RbacManager(
    user?.userType === "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "coolingPeriodEditor"
  );
  const isV = () => true;

  const fetchCoolingPeriods = useCallback(async () => {
    if (!activeCategory) return;

    setLoading(true);
    try {
      const queryFilters = {
        ...filters,
        entity: activeCategory,
      };

      const response = await axios.get(
        `${API_BASE_URL}/cooling-period/pagination`,
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
        setCoolingPeriods(response.data.data.data);
        setTotalPages(response.data.data.totalPages);
        setTotal(response.data.data.totalRecords);
      }
    } catch (err) {
      console.error("Error fetching cooling periods:", err);
      Swal.fire({
        title: t("Error"),
        text: t("Failed to fetch cooling periods"),
        icon: "error",
        confirmButtonText: t("OK"),
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
    fetchCoolingPeriods();
  }, [fetchCoolingPeriods]);

  // Handle active switch toggle
  const handleToggleActive = async (period, newValue) => {
    const periodKey = `${period.entity}-${period.fromTime}-${period.toTime}`;
    setSwitchLoading((prev) => ({ ...prev, [periodKey]: true }));

    try {
      const fromTime = period.fromTime;
      const toTime = period.toTime;

      const apiUrl = `${API_BASE_URL}/cooling-period/${period.entity}/${fromTime}/${toTime}`;
      const payload = {
        isActive: newValue,
      };

      const response = await axios.patch(apiUrl, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.status?.toLowerCase() === "ok") {
        setCoolingPeriods((prevPeriods) =>
          prevPeriods.map((p) =>
            p.id === period.id ? { ...p, isActive: newValue } : p
          )
        );

        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
        Toast.fire({
          icon: "success",
          title: `Status updated to ${newValue ? "Active" : "Inactive"}`,
        });
      }
    } catch (err) {
      console.error("Error toggling status:", err);
      Swal.fire({
        title: t("Error"),
        text: err.response?.data?.message || t("Failed to update status"),
        icon: "error",
        confirmButtonText: t("OK"),
      });
    } finally {
      setSwitchLoading((prev) => ({ ...prev, [periodKey]: false }));
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleAddSubmit = async () => {
    if (!newPeriod.fromTime || !newPeriod.toTime) {
      Swal.fire(t("Error"), t("Please fill all required fields"), "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        entity: activeCategory,
        fromTime: newPeriod.fromTime,
        toTime: newPeriod.toTime,
        isActive: newPeriod.isActive,
      };

      const response = await axios.post(
        `${API_BASE_URL}/cooling-period`,
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
        Swal.fire(t("Success"), t("Cooling period added successfully"), "success");
        setShowAddForm(false);
        setNewPeriod({ fromTime: "", toTime: "", isActive: true });
        fetchCoolingPeriods();
      }
    } catch (err) {
      console.error("Error adding cooling period:", err);
      Swal.fire({
        title: t("Error"),
        text: err.response?.data?.message || t("Failed to add cooling period"),
        icon: "error",
        confirmButtonText: t("OK"),
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
        Swal.fire(t("Success"), t("Cooling period updated successfully"), "success");
        setShowEditModal(false);
        fetchCoolingPeriods();
      }
    } catch (err) {
      console.error("Error updating cooling period:", err);
      Swal.fire({
        title: t("Error"),
        text: err.response?.data?.message || t("Failed to update cooling period"),
        icon: "error",
        confirmButtonText: t("OK"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (activeCategory) => {
    Swal.fire({
      title: t("Are you sure?"),
      text: `This will delete ALL cooling periods for ${activeCategory}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#C01823",
      cancelButtonColor: "#0B4C45",
      confirmButtonText: t("Yes, delete all!"),
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${API_BASE_URL}/cooling-period/delete/${activeCategory}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data?.status?.toLowerCase() === "ok") {
            Swal.fire(
              t("Deleted!"),
              t("Cooling periods have been deleted."),
              "success"
            );
            fetchCoolingPeriods();
          }
        } catch (err) {
          console.error("Error deleting cooling period:", err);
          Swal.fire(
            t("Error"),
            err.response?.data?.message || t("Failed to delete cooling period"),
            "error"
          );
        }
      }
    });
  };

  const columns = [
    {
      field: "entity",
      headerName: t("Entity"),
      flex: 1,
      headerClassName: "super-app-theme--header",
    },
    {
      field: "fromTime",
      headerName: t("From Time"),
      flex: 1,
      headerClassName: "super-app-theme--header",
      renderCell: (params) => {
        const localTime = TimeConverter(params?.row?.fromTime);
        return <span>{localTime}</span>;
      },
    },
    {
      field: "toTime",
      headerName: t("To Time"),
      flex: 1,
      headerClassName: "super-app-theme--header",
      renderCell: (params) => {
        const localTime = TimeConverter(params?.row?.toTime);

        return <span>{localTime}</span>;
      },
    },
    {
      field: "isActive",
      headerName: t("Status"),
      width: 120,
      headerClassName: "super-app-theme--header",
      renderCell: (params) => {
        const key = `${params.row.entity}-${params.row.fromTime}-${params.row.toTime}`;
        return (
          <Switch
            checked={params.value === true}
            onChange={(e) => handleToggleActive(params.row, e.target.checked)}
            disabled={switchLoading[key]}
            color="primary"
            inputProps={{ "aria-label": "status switch" }}
          />
        );
      },
    },
    {
      field: "actions",
      headerName: t("Actions"),
      width: 120,
      headerClassName: "super-app-theme--header",
      renderCell: (params) => (
        <div style={{ display: "flex", gap: "10px" }}>
          <EditCalendarIcon
            style={{ margin:"12px", cursor: "pointer", color: "#007bff" }}
            onClick={() => handleEditClick(params.row)}
          />
        </div>
      ),
    },
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
          <h2>{t("Cooling Period Editor")}</h2>
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
            {showAddForm ? t("Close Form") : t("Add New Period")}
          </button>
          <DeleteIcon
            style={{ cursor: "pointer", color: "#C01823" }}
            onClick={() => handleDeleteClick(activeCategory)}
          />
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
            <h3 style={{ marginTop: 0,marginBottom: 20 }}>{t("Add New Cooling Period")}</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr auto",
                gap: "20px",
                alignItems: "end",
              }}
            >
              <div>
                {/* <label style={{ display: "block", marginBottom: "5px" }}>
                  From Time
                </label>
                <input
                  type="time"
                  value={newPeriod.fromTime}
                  onChange={(e) =>
                    setNewPeriod({ ...newPeriod, fromTime: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ced4da",
                  }}
                /> */}
                <TimePicker
        label="From Time"
        ampm
        value={
          newPeriod.fromTime
            ? dayjs.utc(newPeriod.fromTime, "HH:mm").tz(userTimezone)
            : null
        }
        onChange={(newValue) => {
          if (!newValue) return;
          const utcTime = newValue.tz(userTimezone).utc().format("HH:mm");
          setNewPeriod({ ...newPeriod, fromTime: utcTime });
        }}
        renderInput={(params) => <TextField {...params} fullWidth />}
      />
              </div>
              <div>
                {/* <label style={{ display: "block", marginBottom: "5px" }}>
                  To Time
                </label>
                <input
                  type="time"
                  value={newPeriod.toTime}
                  onChange={(e) =>
                    setNewPeriod({ ...newPeriod, toTime: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ced4da",
                  }}
                /> */}
                 <TimePicker
        label="To Time"
        ampm
        value={
          newPeriod.toTime
            ? dayjs.utc(newPeriod.toTime, "HH:mm").tz(userTimezone)
            : null
        }
        onChange={(newValue) => {
          if (!newValue) return;
          const utcTime = newValue.tz(userTimezone).utc().format("HH:mm");
          setNewPeriod({ ...newPeriod, toTime: utcTime });
        }}
        renderInput={(params) => <TextField {...params} fullWidth />}
      />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "40px",
                }}
              >
                <label style={{ marginRight: "10px" }}>Active:</label>
                <Switch
                  checked={newPeriod.isActive}
                  onChange={(e) =>
                    setNewPeriod({ ...newPeriod, isActive: e.target.checked })
                  }
                  color="primary"
                />
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
                {loading ? t("Adding...") : t("Save Period")}
              </button>
            </div>
          </div>
        )}

        {loading && !coolingPeriods.length ? (
          <LoadingSpinner />
        ) : (
          <div style={{ height: 600, width: "100%", backgroundColor: "white" }}>
            <DataGrid
              rows={coolingPeriods}
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
                  title: t("Cooling Period Editor"),
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

        {/* Edit Modal */}
        {showEditModal && (
          <div
  style={{
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "10px", // ensures spacing on small screens
  }}
>
  <div
    style={{
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "8px",
      width: "100%",
      maxWidth: "400px",
      boxSizing: "border-box",
    }}
  >
    <h3 style={{ marginTop: 0, marginBottom: 30, fontSize: "1.2rem", textAlign: "center" }}>
      {t("Edit Cooling Period")}
    </h3>

    <div style={{ marginBottom: "15px" }}>
      <TimePicker
        label="From Time"
        ampm
        value={
          editData.fromTime
            ? dayjs.utc(editData.fromTime, "HH:mm").tz(userTimezone)
            : null
        }
        onChange={(newValue) => {
          if (!newValue) return;
          const utcTime = newValue.tz(userTimezone).utc().format("HH:mm");
          setEditData({ ...editData, fromTime: utcTime });
        }}
        renderInput={(params) => <TextField {...params} fullWidth />}
      />
    </div>

    <div style={{ marginBottom: "15px" }}>
      <TimePicker
        label="To Time"
        ampm
        value={
          editData.toTime
            ? dayjs.utc(editData.toTime, "HH:mm").tz(userTimezone)
            : null
        }
        onChange={(newValue) => {
          if (!newValue) return;
          const utcTime = newValue.tz(userTimezone).utc().format("HH:mm");
          setEditData({ ...editData, toTime: utcTime });
        }}
        renderInput={(params) => <TextField {...params} fullWidth />}
      />
    </div>

    <div
      style={{
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        flexWrap: "wrap",
        gap: "10px",
      }}
    >
      <label style={{ marginRight: "10px" }}>Active:</label>
      <Switch
        checked={editData.isActive}
        onChange={(e) =>
          setEditData({ ...editData, isActive: e.target.checked })
        }
        color="primary"
      />
    </div>

    <div
      style={{
        display: "flex",
        gap: "10px",
        justifyContent: "flex-end",
        flexWrap: "wrap",
      }}
    >
      <button
        onClick={() => setShowEditModal(false)}
        style={{
          flex: "1 1 auto",
          minWidth: "100px",
          padding: "8px 16px",
          backgroundColor: "#6c757d",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        {t("Cancel")}
      </button>
      <button
        onClick={handleEditSubmit}
        disabled={loading}
        style={{
          flex: "1 1 auto",
          minWidth: "100px",
          padding: "8px 16px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        {loading ? t("Updating...") : t("Update")}
      </button>
    </div>
  </div>
</div>

        )}
      </div>
    </Sidebar>
  );
}

export default CoolingPeriodEditor;
