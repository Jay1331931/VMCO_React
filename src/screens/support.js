import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Table from "../components/Table";
import SearchInput from "../components/SearchInput";
import "../styles/components.css";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import formatDate from "../utilities/dateFormatter";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import ActionButton from "../components/ActionButton";
//import { supportMenuItems } from '../utilities/supportMenuItems';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function Support() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const [initialTickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const { token, user, isAuthenticated, logout } = useAuth();

  //RBAC
  const rbacMgr = new RbacManager(user?.userType === "employee" && user?.roles[0] !== "admin" ? user?.designation : user?.roles[0], "supList");
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  console.log("~~~~~~~~~~~~~User Data:~~~~~~~~~~~~~~~~~~~\n", user);

  // Fetch tickets from API
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = API_BASE_URL
        ? `${API_BASE_URL}/grievances/pagination?page=1&pageSize=10&sortBy=ticket_id&sortOrder=asc`
        : "http://localhost:3000/api/grievances/pagination?page=1&pageSize=10&sortBy=ticket_id&sortOrder=asc";

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
        setTickets(resp.data?.data || resp.data || []);
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
  }, [navigate, logout, user?.userType]);

  //NOTE: For fetching the user again after browser refresh - start
  useEffect(() => {
    if (loading) {
      return; // Wait while loading
    }

    console.log("$$$$$$$$$$$ user in support page", user);
    if (user) {
      fetchTickets();
    }

    if (!user) {
      console.log("$$$$$$$$$$$ logging out");
      // Logout instead of showing loading message
      // logout();
      // navigate('/login');
      // return null; // Return null while logout is processing
    }
  }, [user, fetchTickets]);
  //For fetching the user again after browser refresh - End

  // Handle search functionality
  const handleSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
  };

  //TODO: Handle arabic and english names for company and branch
  const columns = [
    { key: "ticketId", header: "Ticket #", include: isV('ticketIdCol') },
    { key: currentLanguage == "en" ? "companyNameEn" : "companyNameAr", header: "Customer", include: isV('customerCol') },
    { key: currentLanguage == "en" ? "branchNameEn" : "branchNameLc", header: "Branch", include: isV('branchCol') },
    { key: "grievanceName", header: "Issue Name", include: isV('issueNameCol') },
    { key: "grievanceType", header: "Issue Type", include: isV('issueTypeCol') },
    { key: "createdAt", header: "Created Date", include: isV('createdDateCol') },
    { key: "CreatedByUserName", header: "Created By", include: isV('createdByCol') },
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

  // Handle row click to navigate to supportDetails page with ticket details
  const handleRowClick = (ticket) => {
    navigate("/supportDetails", { state: { ticket: ticket, mode: "edit" } });
  };

  // Handle adding a new ticket
  const handleAddTicket = () => {
    if (isAuthenticated) {
      navigate("/supportDetails", { state: { ticket: {}, mode: "add" } });
    } else {
      navigate(user?.userType === "customer" ? "/login" : "/login/employee");
    }
  };

  return (
    <Sidebar title={t("Support - Tickets")}>
      {isV('supportContent') && (
        <div className='support-content'>
          <div className='support-header'>
            {isV('searchInput') && <SearchInput onSearch={handleSearch} />}
            {isV("btnAdd") && (
              <button className='support-add-button' onClick={handleAddTicket}>
                {t("+ Add")}
              </button>
            )}
          </div>
          {/* <ActionButton menuItems={supportMenuItems} /> */}
          {isV('supportTable') && (
            <Table 
              columns={columns.filter(col => col.include !== false)} 
              data={filteredTickets.map(ticket => ({
                ...ticket,
                createdAt: formatDate(ticket.createdAt, 'DD/MM/YYYY')
              }))} 
              getStatusClass={getStatusClass} 
              onRowClick={(ticket) => handleRowClick(ticket)} 
            />
          )}
          {loading && isV('loadingState') && <div>{t("Loading...")}</div>}
          {error && isV('errorState') && <div className="error">{error}</div>}
        </div>
      )}
    </Sidebar>
  );
}

export default Support;
