import React, { useState, useEffect, use } from "react";
import Sidebar from "../components/Sidebar";
import ActionButton from "../components/ActionButton";
import "../styles/components.css";
import { useTranslation } from "react-i18next";
import RbacManager from "../utilities/rbac";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import axios from "axios";

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
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [showPageInput, setShowPageInput] = useState(false);
  const [showFieldInput, setShowFieldInput] = useState(false);
  const [pageName, setPageName] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [fields, setFields] = useState([]);
  const [pageNames, setPageNames] = useState([]);
  const [pageNameLoading, setPageNameLoading] = useState(true);
  const [fieldNames, setFieldNames] = useState([]);
  const [fieldNameLoading, setFieldNameLoading] = useState(true);
  const [showDeletePageInput, setShowDeletePageInput] = useState(false);
  const [showDeleteFieldInput, setShowDeleteFieldInput] = useState(false);
  const [deleteFieldName, setDeleteFieldName] = useState("");
  // Fetch roles and pages from API
  useEffect(() => {
    fetchRolesAndPages();
  }, []);

  const fetchRolesAndPages = async () => {
    setRolesLoading(true);
    setPagesLoading(true);
    try {
      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/rbac/rolesandforms`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch roles: ${response.statusText}`);
      }

      const data = await response.json();
      setRoles(data.data.roles);
      setPages(data.data.forms);
    } catch (err) {
      setError(`Error loading roles: ${err.message}`);
    } finally {
      setRolesLoading(false);
      setPagesLoading(false);
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roleName: newRoleName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to add role: ${response.statusText}`
        );
      }

      setNewRoleName("");
    } catch (err) {
      setError(`Error adding role: ${err.message}`);
    } finally {
      setAddingRole(false);
    }
  };

  useEffect(() => {
    if (selectedRole) {
      fetchFieldPermissions();
    } else {
      setFieldsData([]);
    }
  }, [selectedRole]);

  const fetchFieldPermissions = async () => {
    setLoading(true);
    try {
      const rbacMgr = new RbacManager();

      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/rbac/getrbacbyroles`;

      const payload = {
        roles: [selectedRole],
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch roles: ${response.statusText}`);
      }

      const data = await response.json();
      setPermissions({ [data.data[0].role]: data.data[0].rbac } || {});
      console.log(JSON.stringify(permissions));
    } catch (err) {
      setError(err.message || "Failed to fetch field permissions");
      setFieldsData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
    setSelectedPage("");
  };

  const handlePageChange = (e) => {
    setSelectedPage(e.target.value);
    const fieldPermissions =
      permissions[selectedRole]?.[e.target.value]?.fields || {};

    const permissionsArray = Object.keys(fieldPermissions || {}).map(
      (fieldName) => ({
        field: fieldName,
        isVisible: fieldPermissions[fieldName]?.visible || false,
        isEditable: fieldPermissions[fieldName]?.editable || false,
      })
    );

    setFieldsData(permissionsArray.length ? permissionsArray : []);
  };

  const handleTogglePermission = (index, permissionType) => {
    console.log("Index received:", index, "Permission type:", permissionType); // Debug log

    const updatedFields = [...fieldsData];
    updatedFields[index][permissionType] =
      !updatedFields[index][permissionType];

    // If visibility is turned off, editability should also be turned off
    if (
      permissionType.toLowerCase() === "isvisible" &&
      !updatedFields[index][permissionType]
    ) {
      updatedFields[index]["isEditable"] = false;
    }

    setFieldsData(updatedFields);

    // Update the permissions state to persist changes
    const updatedPermissions = { ...permissions };
    const fieldName = updatedFields[index].field;

    // Ensure the nested structure exists
    if (!updatedPermissions[selectedRole]) {
      updatedPermissions[selectedRole] = {};
    }
    if (!updatedPermissions[selectedRole][selectedPage]) {
      updatedPermissions[selectedRole][selectedPage] = { fields: {} };
    }
    if (!updatedPermissions[selectedRole][selectedPage].fields[fieldName]) {
      updatedPermissions[selectedRole][selectedPage].fields[fieldName] = {};
    }

    // Update the specific permission
    if (permissionType === "isVisible") {
      updatedPermissions[selectedRole][selectedPage].fields[fieldName].visible =
        updatedFields[index]["isVisible"];
      // If visibility is turned off, also turn off editability in permissions
      if (!updatedFields[index]["isVisible"]) {
        updatedPermissions[selectedRole][selectedPage].fields[
          fieldName
        ].editable = false;
      }
    } else if (permissionType === "isEditable") {
      updatedPermissions[selectedRole][selectedPage].fields[
        fieldName
      ].editable = updatedFields[index]["isEditable"];
    }

    setPermissions(updatedPermissions);

    console.log("Updated permissions:", updatedPermissions); // Debug log to see the updated permissions
  };

  const handleSavePermissions = async () => {
    try {
      setLoading(true);

      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/rbac/updaterbac`;

      const payload = {
        role: selectedRole,
        rbacConfig: permissions[selectedRole],
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to save permissions: ${response.statusText}`
        );
      }

      const result = await response.json();

      Swal.fire({
        title: "Success",
        text: t("Permissions saved successfully"),
        icon: "success",
        confirmButtonText: t("Ok"),
      });
    } catch (err) {
      console.error("Error saving permissions:", err);

      Swal.fire({
        title: "Error",
        text: t(`Error saving permissions: ${err.message}`),
        icon: "error",
        confirmButtonText: t("Ok"),
      });
    } finally {
      setLoading(false);
    }
  };

  // Action menu items
  const rbacMenuItems = [
    {
      key: "exportConfig",
      label: "Export Configuration",
      onClick: () =>
        Swal.fire({
          title: t("Export RBAC Configuration"),
          text: t("Export RBAC Configuration clicked"),
          icon: "info",
          confirmButtonText: "OK",
        }),
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
        }),
    },
  ];

  const handleAddField = () => {
    const cleanField = fieldName.trim().replace(/\s+/g, "");

    if (cleanField && !fields.includes(cleanField)) {
      setFields([...fields, cleanField]);
      setFieldName("");
    }
  };

  const fetchPages = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/rbac/getall_pages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data?.status?.toLowerCase() === "ok") {
        setPageNames(res.data.pages);
      }
    } catch (err) {
      console.error("Error fetching pages", err);
    } finally {
      setPageNameLoading(false);
    }
  };
  useEffect(() => {
    if (!showFieldInput && !showDeletePageInput && !showDeleteFieldInput)
      return;
    fetchPages();
  }, [showFieldInput, showDeletePageInput, showDeleteFieldInput]);
  const fetchFields = async (pageName) => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/rbac/get_all_fieldsby_page?pageName=${pageName}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data?.status?.toLowerCase() === "ok") {
        setFieldNames(res?.data?.fields);
      }
    } catch (err) {
      console.error("Error fetching pages", err);
    } finally {
      setFieldNameLoading(false);
    }
  };

  useEffect(() => {
    if (!showDeleteFieldInput && !pageName) return;
    fetchFields(pageName);
  }, [pageName, showDeleteFieldInput]);
  const handleDeleteField = () => {
    if (deleteFieldName) {
      setFields([...fields, deleteFieldName]);
      setDeleteFieldName("");
    }
  };
  const handleSubmit = async () => {
    if (
      (!pageName || fields.length === 0) &&
      (showFieldInput || showPageInput)
    ) {
      Swal.fire({
        title: "Validation Error",
        text: "Please enter a page name and at least one field",
        icon: "warning",
        confirmButtonText: "OK",
        confirmButtonColor: "#f0ad4e", // Bootstrap warning color
      });
      return;
    }

    const body = {
      pageName,
      fields,
    };
    let url =
      showFieldInput || showPageInput
        ? `${process.env.REACT_APP_API_BASE_URL}/rbac/adding_rbacpageAndfield`
        : `${process.env.REACT_APP_API_BASE_URL}/rbac/delete_rbacpageAndfield`;

    try {
      const res = await axios.post(url, body, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data?.status?.toLowerCase() === "ok") {
        fetchFields(pageName);
        fetchPages();
        setFields([]);
        setPageName("");
        setShowPageInput(false);
        setShowFieldInput(false);
        setShowDeletePageInput(false);
        setShowDeleteFieldInput(false);
        Swal.fire({
          title: "Success",
          text: res.data?.message,
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#28a745", // Bootstrap success green
        });
      } else {
        Swal.fire({
          title: "Error",
          text: res.data?.message,
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#dc3545", // Bootstrap danger red
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Error",
        text: err.response?.data?.message || "Internal Server Error",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#dc3545",
      });
    }
  };
  return (
    <Sidebar title={t("RBAC Permission Editor")}>
      <div className="rbac-editor-content">
        {/* Add Role Section */}
        {/* <div
          className="add-role-section"
          style={{
            marginBottom: "20px",
            padding: "15px",
            backgroundColor: "#f8f9fa",
            borderRadius: "5px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Add New Role</h3>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Enter role name"
              className="form-control"
              style={{ flex: 1 }}
              disabled={addingRole}
            />
            <button
              className="btn btn-primary"
              onClick={handleAddRole}
              disabled={addingRole || !newRoleName.trim()}
              style={{ minWidth: "100px" }}
            >
              {addingRole ? "Adding..." : "Add Role"}
            </button>
          </div>
        </div> */}

        <div className="page-header">
          <div className="header-controls">
            <div
              className="dropdown-container"
              style={{ display: "flex", gap: "20px" }}
            >
              <div className="dropdown-group">
                <label htmlFor="roleSelect">Role</label>
                <select
                  id="roleSelect"
                  value={selectedRole}
                  onChange={handleRoleChange}
                  className="form-select"
                  disabled={rolesLoading}
                >
                  <option value="">
                    {rolesLoading ? "Loading roles..." : "Select Role"}
                  </option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="dropdown-group">
                <label htmlFor="pageSelect">Page</label>
                <select
                  id="pageSelect"
                  value={selectedPage}
                  onChange={handlePageChange}
                  className="form-select"
                  disabled={!selectedRole || pagesLoading}
                >
                  <option value="">
                    {pagesLoading ? "Loading pages..." : "Select Page"}
                  </option>
                  {pages?.map((page) => (
                    <option key={page} value={page}>
                      {page}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="header-actions">
            {selectedRole && selectedPage && (
              <button className="save-button" onClick={handleSavePermissions}>
                {t("Save Permissions")}
              </button>
            )}
            <ActionButton menuItems={rbacMenuItems} />
          </div>
        </div>

        {(rolesLoading || pagesLoading) && (
          <div className="loading-indicator">
            {rolesLoading && pagesLoading
              ? "Loading roles and pages..."
              : rolesLoading
              ? "Loading roles..."
              : "Loading pages..."}
          </div>
        )}

        {selectedRole && selectedPage ? (
          <>
            {/* Inline Table */}
            <div className="table-container">
              <table className="permissions-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Is Visible</th>
                    <th>Is Editable</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldsData.map((row, index) => (
                    <tr key={index}>
                      <td>{row.field}</td>
                      <td>
                        <div className="toggle-switch">
                          <input
                            type="checkbox"
                            id={`visibility-${index}`}
                            checked={row.isVisible}
                            onChange={() =>
                              handleTogglePermission(index, "isVisible")
                            }
                          />
                          <label htmlFor={`visibility-${index}`}></label>
                        </div>
                      </td>
                      <td>
                        <div className="toggle-switch">
                          <input
                            type="checkbox"
                            id={`editable-${index}`}
                            checked={row.isEditable}
                            disabled={!row.isVisible}
                            onChange={() =>
                              handleTogglePermission(index, "isEditable")
                            }
                          />
                          <label htmlFor={`editable-${index}`}></label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {loading && <div className="loading-indicator">Loading...</div>}
            {error && <div className="error-message">{error}</div>}

            {fieldsData.length === 0 && !loading && !error && (
              <div className="no-data-message">
                No field permissions defined for this page
              </div>
            )}
          </>
        ) : (
          <div className="selection-prompt">
            Please select both a role and a page to view and edit permissions
          </div>
        )}

        <div
          className="action-buttons-row"
          style={{ display: "flex", gap: "12px", marginTop: "15px" }}
        >
          <button
            className="btn btn-outline-primary"
            onClick={() => {
              setShowPageInput(true);
              setShowFieldInput(false);
              setShowDeletePageInput(false);
              setShowDeleteFieldInput(false);
            }}
            style={{
              flex: 1,
              maxWidth: "120px",
              borderRadius: "20px",
              padding: "10px",
            }}
          >
            Add Page
          </button>
          <button
            className="btn btn-outline-success"
            onClick={() => {
              setShowFieldInput(true);
              setShowPageInput(false);
              setShowDeletePageInput(false);
              setShowDeleteFieldInput(false);
            }}
            style={{
              flex: 1,
              maxWidth: "120px",
              borderRadius: "20px",
              padding: "10px",
            }}
          >
            Add Fields
          </button>
          <button
            className="btn btn-outline-success"
            onClick={() => {
              setShowDeletePageInput(true);
              setShowDeleteFieldInput(false);
              setShowPageInput(false);
              setShowFieldInput(false);
            }}
            style={{
              flex: 1,
              maxWidth: "120px",
              borderRadius: "20px",
              padding: "10px",
            }}
          >
            Delete Page
          </button>
          <button
            className="btn btn-outline-success"
            onClick={() => {
              setShowDeleteFieldInput(true);
              setShowDeletePageInput(false);

              setShowPageInput(false);
              setShowFieldInput(false);
            }}
            style={{
              flex: 1,
              maxWidth: "120px",
              borderRadius: "20px",
              padding: "10px",
            }}
          >
            Delete Fields
          </button>
        </div>
        {showPageInput && (
          <div style={{ marginTop: "15px" }}>
            <input
              type="text"
              placeholder="Enter page name"
              value={pageName}
              onChange={(e) => setPageName(e.target.value.replace(/\s+/g, ""))}
              className="form-control"
              style={{ marginBottom: "10px" }}
            />
          </div>
        )}

        {/* Fields Input */}
        {(showFieldInput ||
          showPageInput ||
          showDeletePageInput ||
          showDeleteFieldInput) && (
          <div style={{ marginTop: "15px" }}>
            {(showFieldInput ||
              showDeletePageInput ||
              showDeleteFieldInput) && (
              <select
                className="form-select"
                onChange={(e) => setPageName(e.target.value)}
                value={pageName}
                disabled={pageNameLoading}
              >
                <option value="">
                  {pageNameLoading ? "Loading..." : "Select Page"}
                </option>
                {pageNames?.map((page, idx) => (
                  <option key={idx} value={page}>
                    {page}
                  </option>
                ))}
              </select>
            )}
            {pageName && showDeleteFieldInput && (
              <>
                <select
                  className="form-select"
                  onChange={(e) => setDeleteFieldName(e.target.value)}
                  value={deleteFieldName}
                  disabled={fieldNameLoading}
                >
                  <option value="">
                    {fieldNameLoading ? "Loading..." : "Select Field"}
                  </option>
                  {fieldNames?.map((field, idx) => (
                    <option key={idx} value={field}>
                      {field}
                    </option>
                  ))}
                </select>

                <button
                  className="btn btn-danger"
                  onClick={handleDeleteField}
                  disabled={!deleteFieldName}
                >
                  Delete Field
                </button>
              </>
            )}

            {(showFieldInput || showPageInput) && (
              <>
                <input
                  type="text"
                  placeholder="Enter field name"
                  value={fieldName}
                  onChange={(e) =>
                    setFieldName(e.target.value.replace(/\s+/g, ""))
                  }
                  className="form-control"
                  style={{ marginBottom: "10px" }}
                />
                <button className="btn btn-success" onClick={handleAddField}>
                  Add Field
                </button>
              </>
            )}
            <div style={{ marginTop: "10px" }}>
              {fields.map((f, idx) => (
                <span
                  key={idx}
                  style={{
                    marginRight: "8px",
                    padding: "5px 10px",
                    background: "#e9ecef",
                    borderRadius: "12px",
                  }}
                >
                  {f}
                </span>
              ))}
            </div>

            <button
              className="btn btn-primary"
              style={{ marginTop: "15px" }}
              onClick={handleSubmit}
            >
              Save RBAC
            </button>
          </div>
        )}
      </div>
    </Sidebar>
  );
}

export default RbacEditor;
