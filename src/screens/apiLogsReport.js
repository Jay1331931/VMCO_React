import React, { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import ActionButton from "../components/ActionButton";
import ToggleButton from "../components/ToggleButton";
import SearchInput from "../components/SearchInput";
import Table from "../components/Table";
import Pagination from "../components/Pagination";
import "../styles/components.css";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import Swal from "sweetalert2";
import { formatDate } from "../utilities/dateFormatter";
import axios from "axios";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchableDropdown from "../components/SearchableDropdown";
 
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
 
function ApiLogsReport() {
  const [externalApiLogs, setExternalApiLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApiType, setSelectedApiType] = useState("");
  const [selectedApiName, setSelectedApiName] = useState("");
  const [selectedCallName, setSelectedCallName] = useState("");
  const [selectedStatusCode, setSelectedStatusCode] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [apiNameOptions, setApiNameOptions] = useState([]);
  const [callNameOptions, setCallNameOptions] = useState([]);
  const [statusCodeOptions, setStatusCodeOptions] = useState([]);
  const [apiTypeOptions, setApiTypeOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
 
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
 
  const fetchApiTypeOptions = useCallback(() => {
   
 
      const options = [{value: "external_api_logs", name: "API Call External"},
        {value: "api_call_logs", name: "API Call"},
      {value: "payment_api_logs", name: "Payment API Call"}];
          console.log("API Type Options:", options);
          setApiTypeOptions(options);
        },[]);
 
  // Fetch API name options for the dropdown
  const fetchApiNameOptions = useCallback(async (apiType) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/fetchOptions`,
        {
          method: "POST",
          body: JSON.stringify({
            tableName: apiType,
            fieldName: "api_name"
          }),
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        }
      );
 
      if (response.ok) {
        const result = await response.json();
        if (result.status === "Ok") {
          // Transform the API names into options for the dropdown
          const options = result.data.map(apiName => ({
            name: apiName,
            label: apiName
          }));
          console.log("API Name Options:", options);
          setApiNameOptions(options);
        }
      }
    } catch (err) {
      console.error("Failed to fetch API names:", err);
    }
  }, [token]);
  const fetchCallNameOptions = useCallback(async (apiType) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/fetchOptions`,
        {
          method: "POST",
          body: JSON.stringify({
            tableName: apiType,
            fieldName: "callname"
          }),
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        }
      );
 
      if (response.ok) {
        const result = await response.json();
        if (result.status === "Ok") {
          // Transform the call names into options for the dropdown
          const options = result.data.map(callName => ({
            name: callName,
            label: callName
          }));
          console.log("Call Name Options:", options);
          setCallNameOptions(options);
        }
      }
    } catch (err) {
      console.error("Failed to fetch call names:", err);
    }
  }, [token]);
  const fetchStatusCodeOptions = useCallback(async (apiType) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/fetchOptions`,
        {
          method: "POST",
          body: JSON.stringify({
            tableName: apiType,
            fieldName: "status_code"
          }),
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        }
      );
 
      if (response.ok) {
        const result = await response.json();
        if (result.status === "Ok") {
          // Transform the status codes into options for the dropdown
          const options = result.data.map(statusCode => ({
            name: statusCode.toString(),
            label: statusCode.toString()
          }));
          console.log("Status Code Options:", options);
          setStatusCodeOptions(options);
        }
      }
    } catch (err) {
      console.error("Failed to fetch status codes:", err);
    }
  }, [token]);
 
  const fetchExternalApiLogs = useCallback(
    async (page = 1, searchTerm = "", apiName = "", callName = "", statusCode = "", fromDate = "", toDate = "", apiType = "external_api_logs") => {
      setLoading(true);
      setError(null);
      try {
        // Build filters object
        const filters = {};
        if (searchTerm) filters.search = searchTerm;
        if (apiName) filters.apiName = apiName;
        if (callName) filters.callname = callName;
        if (statusCode) filters.statusCode = Number(statusCode);
        if (fromDate) filters.fromDate = fromDate;
        if (toDate) filters.toDate = toDate;
 
        console.log("@@@@filters", filters);
        const params = new URLSearchParams({
          page,
          pageSize,
          search: searchTerm,
          sortBy: "id",
          sortOrder: "asc",
          tableName: apiType,
          filters: JSON.stringify(filters),
        });
 
        const response = await fetch(
          `${API_BASE_URL}/externalApiLogs/pagination?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
          }
        );
 
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("API did not return JSON. Check API URL and server.");
        }
        const result = await response.json();
        if (result.status === "Ok") {
          setExternalApiLogs(result.data.data);
          setTotal(result.data.totalRecords);
        } else {
          throw new Error(result.message || "Failed to fetch API logs");
        }
      } catch (err) {
        console.error("Fetch error:", err.message);
        setError(err.message);
        setExternalApiLogs([]);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, token]
  );
 
  useEffect(() => {
    if (loading) return;
 
    if (user) {
      fetchExternalApiLogs(page, searchQuery, selectedApiName, selectedCallName, selectedStatusCode, fromDate, toDate, selectedApiType);
      console.log("Selected API Type:", selectedApiType);
      fetchApiTypeOptions();
      fetchApiNameOptions(selectedApiType);
      fetchCallNameOptions(selectedApiType);
      fetchStatusCodeOptions(selectedApiType);
    }
  }, 
  // [page, searchQuery, selectedApiName, selectedCallName, selectedStatusCode, selectedApiType, fromDate, toDate, user]
  [page, searchQuery, user]
);
 
  const handleApiTypeChange = (selectedOption) => {
    setSelectedApiType(selectedOption ? selectedOption.value : "");
    setPage(1);
  };
  const handleApiNameChange = (selectedOption) => {
    setSelectedApiName(selectedOption ? selectedOption.value : "");
    setPage(1);
  };
 
  const handleCallNameChange = (selectedOption) => {
    setSelectedCallName(selectedOption ? selectedOption.value : "");
    setPage(1);
  };
 
  const handleStatusCodeChange = (selectedOption) => {
    setSelectedStatusCode(selectedOption ? selectedOption.value : "");
    setPage(1);
  };
 
  const handleFromDateChange = (e) => {
    setFromDate(e.target.value);
    setPage(1);
  };
 
  const handleToDateChange = (e) => {
    setToDate(e.target.value);
    setPage(1);
  };
 
  const handleSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
    setPage(1);
  };
 
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedApiType("");
    setSelectedApiName("");
    setSelectedCallName("");
    setSelectedStatusCode("");
    setFromDate("");
    setToDate("");
    setExternalApiLogs([]);
    setPage(1);
  };
 
  const rbacMgr = new RbacManager(
    user?.userType === "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "apiLogsReport"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
 
  const isArabic = i18n.language === "ar";
 
 
  const reportColumns =[
    { key: "apiName", header: () => t("API Name"), include: isV("apiName") },
    { key: "callname", header: () => t("Call Name"), include: isV("requestMethod") },
    { key: "statusCode", header: () => t("Status Code"), include: isV("requestBody") },
    { key: "createdAt", header: () => t("Created At"), include: isV("responseStatus") },
    { key: "requestBody", header: () => t("Request Body"), include: isV("responseTime") },
    { key: "responseBody", header: () => t("Response Body"), include: isV("responseBody") },
  ];
 
  const totalPages = Math.ceil(total / pageSize) || 1;
 
  return (
    <Sidebar title={t("API Logs Report")}>
      <div className="logs-content">
        <div className="logs-header">
          <div className="logs-header-controls" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* <SearchInput onSearch={handleSearch} placeholder={t("Search...")} /> */}
            <div className="form-group">
              <label>{t("API Type")}</label>
              <SearchableDropdown
                options={apiTypeOptions}
                value={selectedApiType}
                 onChange={(e) => {
                  setSelectedApiType(e.target.value);
                  fetchApiNameOptions(e.target.value);
                  fetchCallNameOptions(e.target.value);
                  fetchStatusCodeOptions(e.target.value);
                  setPage(1);
                }}
                placeholder={t("Select API Type")}
                isClearable={true}
                className="api-name-dropdown"
              />
            </div>
            {/* <div className="form-group">
              <label>{t("API Name")}</label>
              <SearchableDropdown
                options={apiNameOptions}
                value={selectedApiName}
                 onChange={(e) => {
                  setSelectedApiName(e.target.value);
                  setPage(1);
                }}
                placeholder={t("Select API Name")}
                isClearable={true}
                className="api-name-dropdown"
              />
              </div> */}
              <div className="form-group">
                <label>{t("Call Name")}</label>
                <SearchableDropdown
                  options={callNameOptions}
                  value={selectedCallName}
                  onChange={(e) => {
                    setSelectedCallName(e.target.value);
                  setPage(1);
                }}
                placeholder={t("Select Call Name")}
                isClearable={true}
                className="call-name-dropdown"
              />
              </div>
              {/* <div className="form-group">
                <label>{t("Status Code")}</label>
              <SearchableDropdown
                options={statusCodeOptions}
                value={selectedStatusCode}
                onChange={(e) => {
                  setSelectedStatusCode(e.target.value);
                  setPage(1);
                }}
                placeholder={t("Select Status Code")}
                isClearable={true}
                className="status-code-dropdown"
              />
             </div> */}
             <div className="form-group">
              <label>{t("From Date")}</label>
<div className="date-filter" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <input
                type="date"
                value={fromDate}
                onChange={handleFromDateChange}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
             </div>

           <div className="form-group">
              <label>{t("To Date")}</label>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <input
                type="date"
                value={toDate}
                onChange={handleToDateChange}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
           </div>
          </div>
          <div style={{ display: 'flex', marginTop: '10px' }}>
          <div className="clear-filters-btn">
            {
            // (searchQuery || selectedApiName || selectedCallName || selectedStatusCode || fromDate || toDate || selectedApiType) && 
            (
              <button
                onClick={() => fetchExternalApiLogs(page, searchQuery, selectedApiName, selectedCallName, selectedStatusCode, fromDate, toDate, selectedApiType)}
                className="clear-filters-btn"
                style={{
                  padding: '8px 12px',
                  // backgroundColor: '#007bff',
                  // color: '#fff',
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: 'max-content',
                  marginRight: '10px'
                }}
              >
                {t("Filter")}
              </button>
            )}
            </div>
           <div className="clear-filters-btn">
            {
            // (searchQuery || selectedApiName || selectedCallName || selectedStatusCode || fromDate || toDate || selectedApiType) && 
            (
              <button
                onClick={clearFilters}
                className="clear-filters-btn"
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: 'max-content',
                  marginRight: '10px'
                }}
              >
                {t("Clear Filters")}
              </button>
            )}
            </div>
            </div>
        </div>
 
        {error && (
          <div style={{ color: 'red', padding: '10px', textAlign: 'center' }}>
            {t(error)}
          </div>
        )}
 
        <Table
          columns={reportColumns.filter(col => col.include)}
          data={externalApiLogs}
          emptyMessage={t("No API logs found")}
        />
 
        {externalApiLogs.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
       
        {loading && (
          <div className="loading-container">
            <LoadingSpinner size="medium" />
          </div>
        )}
      </div>
    </Sidebar>
  );
}
 
export default ApiLogsReport;