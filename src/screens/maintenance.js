import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Table from "../components/Table";
import SearchInput from "../components/SearchInput";
import ToggleButton from "../components/ToggleButton";
import "../styles/components.css";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { convertToTimezone, TIMEZONES } from "../utilities/convertToTimezone";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import ActionButton from "../components/ActionButton";
import Constants from "../constants";
import LoadingSpinner from "../components/LoadingSpinner";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function Maintenance() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [searchQuery, setSearchQuery] = useState("");
  const [isMyTicketsMode, setMyTicketsMode] = useState(false);
  const navigate = useNavigate();

  const [initialTickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const { token, user, isAuthenticated, logout } = useAuth();

  //RBAC
  const rbacMgr = new RbacManager(user?.userType === "employee" && user?.roles[0] !== "admin" ? user?.designation : user?.roles[0], "maintList");
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  // Fetch all tickets from API
  const fetchMaintenanceTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let apiUrl;
      
      // Only include access parameter if user is maintenance head
      if (user?.designation.toLowerCase() === Constants.DESIGNATIONS.MAINTENANCE_HEAD.toLowerCase()) {
        const accessParam = isMyTicketsMode ? 'region' : 'all';
        apiUrl = `${API_BASE_URL}/maintenance/pagination?page=1&pageSize=10&sortBy=request_id&sortOrder=asc&access=${accessParam}`;
      } else {
        // For other designations, don't include access parameter
        apiUrl = `${API_BASE_URL}/maintenance/pagination?page=1&pageSize=10&sortBy=request_id&sortOrder=asc`;
      }
      
      console.log("Fetching maintenance tickets from:", apiUrl);
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
      console.log("Fetched maintenance tickets:", resp);
      
      if (resp.status === 'Ok' || resp.data) {
        setTickets(resp.data?.data || resp.data || []);
      } else {
        throw new Error(resp.message || 'Failed to fetch maintenance tickets');
      }
    } catch (err) {
      console.error("Failed to fetch maintenance tickets:", err);
      setError(err.message);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [navigate, logout, user?.userType, user?.designation, isMyTicketsMode]);

  // Toggle between all tickets and my tickets
  const toggleMyTicketsMode = () => {
    setMyTicketsMode((prev) => {
      const newMode = !prev;
      // The fetchMaintenanceTickets function will be called by useEffect when isMyTicketsMode changes
      return newMode;
    });
  };

  //NOTE: For fetching the user again after browser refresh - start
  useEffect(() => {
    if (loading) {
      return; // Wait while loading
    }

    console.log("$$$$$$$$$$$ user in maintenance page", user);
    if (user) {
      fetchMaintenanceTickets();
    }

    if (!user) {
      console.log("$$$$$$$$$$$ logging out");
      // Logout instead of showing loading message
      // logout();
      // navigate('/login');
      // return null; // Return null while logout is processing
    }
  }, [user, fetchMaintenanceTickets, isMyTicketsMode]);
  //For fetching the user again after browser refresh - End

  // Handle search functionality
  const handleSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
  };

  //TODO: Handle arabic and english names for company and branch
  const columns = [
    { key: "requestId", header: "Request #", include: isV('requestIdCol') },
    { key: currentLanguage === "en" ? "companyNameEn" : "companyNameAr", header: "Customer", include: isV('customerCol') },
    { key: currentLanguage === "en" ? "branchNameEn" : "branchNameLc", header: "Branch", include: isV('branchCol') },
    { key: "issueName", header: "Issue Name", include: isV('issueNameCol') },
    { key: "issueType", header: "Issue Type", include: isV('issueTypeCol') },
    { key: "createdAt", header: "Created Date", include: isV('createdDateCol') },
    { key: "createdByUsername", header: "Created By", include: isV('createdByCol') },
    { key: "urgencyLevel", header: "Urgency Level", include: isV('urgencyLevelCol') },
    { key: "assignedTo", header: "Assigned To", include: isV('assignedToCol') },
    { key: "status", header: "Status", include: isV('statusCol') },
    ];

  const getStatusClass = (status) => {
    switch (status) {
      case "Closed":
        return "status-approved";
      case "Rejected":
        return "status-rejected";
      case "In Progress":
      default:
        return "status-pending";
    }
  };

  const filteredTickets = initialTickets.filter((ticket) => Object.values(ticket).some((val) => String(val).toLowerCase().includes(searchQuery.toLowerCase())));

  // Handle row click to navigate to Maintenance details page with ticket details
  const handleRowClick = (ticket) => {
    navigate("/maintenanceDetails", { state: { ticket: ticket, mode: "edit" } });
  };

  // Handle adding a new ticket
  const handleAdd = () => {
    if (isAuthenticated) {
      navigate("/maintenanceDetails", { state: { ticket: {}, mode: "add" } });
    } else {
      navigate(user?.userType === "customer" ? "/login" : "/login/employee");
    }
  };

  return (
    <Sidebar title={t("Maintenance")}>
      {isV('maintenanceContent') && (
        <div className='maintenance-content'>
          <div className='maintenance-header'>
            <div className="header-controls">
              {isV('searchInput') && <SearchInput onSearch={handleSearch} />}
            </div>
            <div className="header-actions">
              {/* Only show toggle button for maintenance head */}
              {isV('toggleButton') && user?.designation === "maintenance head" && (
                <ToggleButton
                  isToggled={isMyTicketsMode}
                  onToggle={toggleMyTicketsMode}
                  leftLabel={t('All')}
                  rightLabel={t('My Tickets')}
                />
              )}
              {isV("btnAdd") && isE("btnAdd") && (
                <button className='support-add-button' onClick={handleAdd}>
                  {t("+ Add")}
                </button>
              )}
            </div>
          </div>
          {/* <ActionButton menuItems={maintenanceMenuItems} /> */}
          {isV('maintenanceTable') && (
            <Table 
              columns={columns.filter(col => col.include !== false)} 
              data={filteredTickets.map(ticket => ({
                ...ticket,
                createdAt: convertToTimezone(
                  ticket.createdAt, 
                  TIMEZONES.SAUDI_ARABIA, 
                  'DD/MM/YYYY'
                )
              }))}
              getStatusClass={getStatusClass} 
              onRowClick={(ticket) => handleRowClick(ticket)} 
            />
          )}
          {loading && isV('loadingState') && <div className="loading-container">
            <LoadingSpinner size="medium" />
          </div>}
          {error && isV('errorState') && <div className="error">{error}</div>}
        </div>
      )}
    </Sidebar>
  );
}

export default Maintenance;
