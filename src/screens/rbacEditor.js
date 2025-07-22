import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ActionButton from "../components/ActionButton";
import Table from "../components/Table";
import "../styles/components.css";
import { useTranslation } from "react-i18next";
import RbacManager from "../utilities/rbac";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";

function RbacEditor() {
  const [newRoleName, setNewRoleName] = useState("");
  const [addingRole, setAddingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedPage, setSelectedPage] = useState("");
  const [fieldsData, setFieldsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [pages, setPages] = useState([]);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const { user } = useAuth();

  // Fetch roles and pages from API
  useEffect(() => {
    fetchRoles();
    fetchPages();
  }, []);

  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/currentRoles`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch roles: ${response.statusText}`);
      }

      const data = await response.json();
      setRoles(data.data);
    } catch (err) {
      setError(`Error loading roles: ${err.message}`);
      // Fallback to RbacManager if API fails
      setRoles(RbacManager.getRoles());
    } finally {
      setRolesLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) {
      setError("Role name cannot be empty");
      return;
    }

    setAddingRole(true);
    setError(null);

    try {
      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/addRole`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ roleName: newRoleName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to add role: ${response.statusText}`);
      }

      // Clear the input field
      setNewRoleName("");

      // Refetch roles to update the dropdown
      fetchRoles();
    } catch (err) {
      setError(`Error adding role: ${err.message}`);
    } finally {
      setAddingRole(false);
    }
  };

  const fetchPages = async () => {
    setPagesLoading(true);
    try {
      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/forms`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pages: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Fetched pages:", result.data);
      if (result.success && Array.isArray(result.data)) {
        setPages(result.data);
      } else {
        throw new Error("Invalid response format from API");
      }
    } catch (err) {
      setError(`Error loading pages: ${err.message}`);
      // Fallback to RbacManager if API fails
      setPages(RbacManager.getForms());
    } finally {
      setPagesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRole && selectedPage) {
      fetchFieldPermissions();
    } else {
      setFieldsData([]);
    }
  }, [selectedRole, selectedPage]);

  const fetchFieldPermissions = () => {
    setLoading(true);
    try {
      // In a real implementation, you would fetch this from your backend or from RbacManager
      // For now, we'll create some example permissions
      const rbacMgr = new RbacManager();
      const fieldPermissions = rbacMgr.getFieldPermissions(selectedRole, selectedPage) || {};

      // Transform permissions object to array format for the table
      const permissionsArray = Object.keys(fieldPermissions || {}).map((fieldName) => ({
        field: fieldName,
        isVisible: fieldPermissions[fieldName]?.visible || false,
        isEditable: fieldPermissions[fieldName]?.editable || false,
      }));

      setFieldsData(
        permissionsArray.length
          ? permissionsArray
          : [
              { field: "id", isVisible: true, isEditable: false },
              { field: "name", isVisible: true, isEditable: true },
              { field: "status", isVisible: true, editable: true },
              { field: "createDate", isVisible: true, editable: false },
            ]
      );
    } catch (err) {
      setError(err.message || "Failed to fetch field permissions");
      setFieldsData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
    setSelectedPage(""); // Reset page selection when role changes
  };

  const handlePageChange = (e) => {
    setSelectedPage(e.target.value);
  };

  const handleTogglePermission = (index, permissionType) => {
    const updatedFields = [...fieldsData];
    updatedFields[index][permissionType] = !updatedFields[index][permissionType];

    // If visibility is turned off, editability should also be turned off
    if (permissionType === "isVisible" && !updatedFields[index][permissionType]) {
      updatedFields[index]["isEditable"] = false;
    }

    setFieldsData(updatedFields);

    // In a real implementation, you would save these changes to your backend
    // savePermissions(selectedRole, selectedPage, updatedFields);
  };

  const handleSavePermissions = () => {
    // Implement saving permissions to your backend or RbacManager
    Swal.fire({
      title: "Save Permissions",
      text: t("Permissions saved successfully"),
      icon: "warning",
      confirmButtonText:t("Ok")
    })  
    // alert("Permissions saved successfully");
  };

  const columns = [
    {
      key: "field",
      header: "Field",
    },
    {
      key: "isVisible",
      header: "Is Visible",
      render: (row, index) => (
        <div className='toggle-switch'>
          <input type='checkbox' id={`visibility-${index}`} checked={row.isVisible} onChange={() => handleTogglePermission(index, "isVisible")} />
          <label htmlFor={`visibility-${index}`}></label>
        </div>
      ),
    },
    {
      key: "isEditable",
      header: "Is Editable",
      render: (row, index) => (
        <div className='toggle-switch'>
          <input
            type='checkbox'
            id={`editable-${index}`}
            checked={row.isEditable}
            disabled={!row.isVisible}
            onChange={() => handleTogglePermission(index, "isEditable")}
          />
          <label htmlFor={`editable-${index}`}></label>
        </div>
      ),
    },
  ];

  // Action menu items
  const rbacMenuItems = [
    {
      key: "exportConfig",
      label: "Export Configuration",
      onClick: () =>Swal.fire({
        title: t("Export RBAC Configuration"),
        text: t("Export RBAC Configuration clicked"),
        icon: "info",
        confirmButtonText: "OK",
      }), // Replace with actual export logic
        //  alert("Export RBAC Configuration clicked"),
    },
    {
      key: "importConfig",
      label: "Import Configuration",
      onClick: () => 
        Swal.fire({
          title: t("Import RBAC Configuration"),
          text: t("Import RBAC Configuration clicked"),
          icon: "info",
          confirmButtonText: "OK",
        }), // Replace with actual import logic
        // alert("Import RBAC Configuration clicked"),
    },
  ];

  return (
    <Sidebar title={t("RBAC Permission Editor")}>
      <div className='rbac-editor-content'>
        {/* Add Role Section */}
        <div className='add-role-section' style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "5px" }}>
          <h3 style={{ marginTop: 0 }}>Add New Role</h3>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type='text'
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder='Enter role name'
              className='form-control'
              style={{ flex: 1 }}
              disabled={addingRole}
            />
            <button className='btn btn-primary' onClick={handleAddRole} disabled={addingRole || !newRoleName.trim()} style={{ minWidth: "100px" }}>
              {addingRole ? "Adding..." : "Add Role"}
            </button>
          </div>
        </div>

        <div className='page-header'>
          <div className='header-controls'>
            <div className='dropdown-container' style={{ display: "flex", gap: "20px" }}>
              <div className='dropdown-group'>
                <label htmlFor='roleSelect'>Role</label>
                <select id='roleSelect' value={selectedRole} onChange={handleRoleChange} className='form-select' disabled={rolesLoading}>
                  <option value=''>{rolesLoading ? "Loading roles..." : "Select Role"}</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div className='dropdown-group'>
                <label htmlFor='pageSelect'>Page</label>
                <select id='pageSelect' value={selectedPage} onChange={handlePageChange} className='form-select' disabled={!selectedRole || pagesLoading}>
                  <option value=''>{pagesLoading ? "Loading pages..." : "Select Page"}</option>
                  {pages.map((page) => (
                    <option key={page} value={page}>
                      {page}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className='header-actions'>
            {selectedRole && selectedPage && (
              <button className='save-button' onClick={handleSavePermissions}>
                {t("Save Permissions")}
              </button>
            )}
            <ActionButton menuItems={rbacMenuItems} />
          </div>
        </div>

        {(rolesLoading || pagesLoading) && (
          <div className='loading-indicator'>
            {rolesLoading && pagesLoading ? "Loading roles and pages..." : rolesLoading ? "Loading roles..." : "Loading pages..."}
          </div>
        )}

        {selectedRole && selectedPage ? (
          <>
            <Table columns={columns} data={fieldsData} />

            {loading && <div className='loading-indicator'>Loading...</div>}
            {error && <div className='error-message'>{error}</div>}

            {fieldsData.length === 0 && !loading && !error && <div className='no-data-message'>No field permissions defined for this page</div>}
          </>
        ) : (
          <div className='selection-prompt'>Please select both a role and a page to view and edit permissions</div>
        )}
      </div>
    </Sidebar>
  );
}

export default RbacEditor;
