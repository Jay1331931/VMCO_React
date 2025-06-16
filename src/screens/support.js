import React, { useState, useEffect } from "react";
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

function Support() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const [initialTickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const { token, user, isAuthenticated, logout } = useAuth();

  //RBAC
  const rbacMgr = new RbacManager(user.userType == "employee" && user.roles[0] !== "admin" ? user.designation : user.roles[0], "supList");
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  console.log("~~~~~~~~~~~~~User Data:~~~~~~~~~~~~~~~~~~~\n", user);

  useEffect(() => {
    //Handle isAuthenticated or token expired and lout. Genertic common without writing code in every component
    const fetchTickets = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_BASE_URL
          ? `${process.env.REACT_APP_API_BASE_URL}/grievances/pagination?page=1&pageSize=10&sortBy=ticket_id&sortOrder=asc`
          : "http://localhost:3000/api/grievances/pagination?page=1&pageSize=10&sortBy=ticket_id&sortOrder=asc";

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        console.error("Error fetching tickets:", response);
        if (!response.ok) {
          if (response.status === 401) {
            logout();
            navigate(user.userType === "customer" ? "/login" : "/login/employee");
            return;
          }

          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const resp = await response.json();
        console.log("Fetched tickets:", typeof resp.data.data);
        setTickets(resp.data.data);
      } catch (err) {
        console.error("Failed to fetch support tickets:", err);
        setError(err.message);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [navigate]);

  //TODO: Handle arabic and english names for company and branch
  const columns = [
    { key: "ticketId", header: "Ticket #" },
    { key: currentLanguage == "en" ? "companyNameEn" : "companyNameAr", header: "Customer" },
    { key: currentLanguage == "en" ? "branchNameEn" : "branchNameAr", header: "Branch" },
    { key: "grievanceName", header: "Issue Name" },
    { key: "grievanceType", header: "Issue Type" },
    { key: "createdAt", header: "Created Date" },
    { key: "assignedTo", header: "Assigned To" },
    { key: "status", header: "Status" },
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
      navigate(user.userType === "customer" ? "/login" : "/login/employee");
    }
  };

  return (
    <Sidebar title={t("Support - Tickets")}>
      <div className='support-content'>
        <div className='support-header'>
          <SearchInput onSearch={setSearchQuery} />
          {isV("btnAdd") && (
            <button className='support-add-button' onClick={handleAddTicket}>
              {t("+ Add")}
            </button>
          )}
        </div>
        {/* <ActionButton menuItems={supportMenuItems} /> */}
        <Table columns={columns} data={filteredTickets} getStatusClass={getStatusClass} onRowClick={(ticket) => handleRowClick(ticket)} />
      </div>
    </Sidebar>
  );
}

export default Support;
