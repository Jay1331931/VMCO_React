import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ActionButton from '../components/ActionButton';
import Table from '../components/Table';
import '../styles/components.css';
import { useTranslation } from 'react-i18next';
import RbacManager from '../utilities/rbac';
import { useAuth } from '../context/AuthContext';

function RbacEditor() {
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPage, setSelectedPage] = useState('');
  const [fieldsData, setFieldsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const { user } = useAuth();

  // Get available roles and pages

  const roles = RbacManager.getRoles();
  const pages = RbacManager.getForms();

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
      const permissionsArray = Object.keys(fieldPermissions || {}).map(fieldName => ({
        field: fieldName,
        isVisible: fieldPermissions[fieldName]?.visible || false,
        isEditable: fieldPermissions[fieldName]?.editable || false
      }));
      
      setFieldsData(permissionsArray.length ? permissionsArray : [
        { field: 'id', isVisible: true, isEditable: false },
        { field: 'name', isVisible: true, isEditable: true },
        { field: 'status', isVisible: true, isEditable: true },
        { field: 'createDate', isVisible: true, isEditable: false },
      ]);
    } catch (err) {
      setError(err.message || 'Failed to fetch field permissions');
      setFieldsData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
    setSelectedPage(''); // Reset page selection when role changes
  };

  const handlePageChange = (e) => {
    setSelectedPage(e.target.value);
  };

  const handleTogglePermission = (index, permissionType) => {
    const updatedFields = [...fieldsData];
    updatedFields[index][permissionType] = !updatedFields[index][permissionType];
    
    // If visibility is turned off, editability should also be turned off
    if (permissionType === 'isVisible' && !updatedFields[index][permissionType]) {
      updatedFields[index]['isEditable'] = false;
    }
    
    setFieldsData(updatedFields);
    
    // In a real implementation, you would save these changes to your backend
    // savePermissions(selectedRole, selectedPage, updatedFields);
  };

  const handleSavePermissions = () => {
    // Implement saving permissions to your backend or RbacManager
    alert('Permissions saved successfully');
  };

  const columns = [
    { 
      key: 'field', 
      header: 'Field'
    },
    { 
      key: 'isVisible', 
      header: 'Is Visible',
      render: (row, index) => (
        <div className="toggle-switch">
          <input 
            type="checkbox" 
            id={`visibility-${index}`} 
            checked={row.isVisible}
            onChange={() => handleTogglePermission(index, 'isVisible')}
          />
          <label htmlFor={`visibility-${index}`}></label>
        </div>
      )
    },
    { 
      key: 'isEditable', 
      header: 'Is Editable',
      render: (row, index) => (
        <div className="toggle-switch">
          <input 
            type="checkbox" 
            id={`editable-${index}`}
            checked={row.isEditable}
            disabled={!row.isVisible}
            onChange={() => handleTogglePermission(index, 'isEditable')}
          />
          <label htmlFor={`editable-${index}`}></label>
        </div>
      )
    }
  ];

  // Action menu items
  const rbacMenuItems = [
    {
      key: 'exportConfig',
      label: 'Export Configuration',
      onClick: () => alert('Export RBAC Configuration clicked')
    },
    {
      key: 'importConfig',
      label: 'Import Configuration',
      onClick: () => alert('Import RBAC Configuration clicked')
    }
  ];

  return (
    <Sidebar title={t('RBAC Permission Editor')}>
      <div className="rbac-editor-content">
        <div className="page-header">
          <div className="header-controls">
            <div className="dropdown-container" style={{ display: 'flex', gap: '20px' }}>
              <div className="dropdown-group">
                <label htmlFor="roleSelect">Role</label>
                <select 
                  id="roleSelect" 
                  value={selectedRole}
                  onChange={handleRoleChange}
                  className="form-select"
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
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
                  disabled={!selectedRole}
                >
                  <option value="">Select Page</option>
                  {pages.map(page => (
                    <option key={page} value={page}>{page}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="header-actions">
            {selectedRole && selectedPage && (
              <button 
                className="save-button" 
                onClick={handleSavePermissions}
              >
                {t('Save Permissions')}
              </button>
            )}
            <ActionButton menuItems={rbacMenuItems} />
          </div>
        </div>

        {selectedRole && selectedPage ? (
          <>
            <Table 
              columns={columns}
              data={fieldsData}
            />
            
            {loading && <div className="loading-indicator">Loading...</div>}
            {error && <div className="error-message">{error}</div>}
            
            {fieldsData.length === 0 && !loading && !error && (
              <div className="no-data-message">No field permissions defined for this page</div>
            )}
          </>
        ) : (
          <div className="selection-prompt">
            Please select both a role and a page to view and edit permissions
          </div>
        )}
      </div>
    </Sidebar>
  );
}

export default RbacEditor;