import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import CustomToolbar from '../components/CustomToolbar';
import Pagination from '../components/Pagination';
import '../styles/components.css';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { convertToTimezone, TIMEZONES } from '../utilities/convertToTimezone';
import { useAuth } from '../context/AuthContext';
import RbacManager from '../utilities/rbac';
import { formatDate } from '../utilities/dateFormatter';
import {
    Box, Button, Typography, Tooltip, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
    Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { DataGrid, GridFooterContainer, GridPagination, useGridApiRef } from '@mui/x-data-grid';
import TableMobile from '../components/TableMobile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import ChatBubbleOutlineSharpIcon from '@mui/icons-material/ChatBubbleOutlineSharp';
import ChatBubbleSharpIcon from '@mui/icons-material/ChatBubbleSharp';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Status class helper functions
const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
        case 'closed':
            return 'status-approved';
        case 'rejected':
            return 'status-rejected';
        case 'open':
        case 'in progress':
        default:
            return 'status-pending';
    }
};

// Utility function to detect data type and structure
const getDataType = (value) => {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'unknown';
};

// Enhanced Recursive component for rendering nested data at any level
const RecursiveNestedTable = ({ data, level = 0, maxWidth = '100%', showHeader = false }) => {
    if (!data || (typeof data !== 'object' && !Array.isArray(data))) {
        return (
            <Typography variant="body2" color="textSecondary" style={{ padding: '8px' }}>
                {String(data) || 'No data available'}
            </Typography>
        );
    }

    const getCellStyle = (currentLevel, isKey) => ({
        borderRight: isKey ? '1px solid #e0e0e0' : 'none',
        verticalAlign: 'top',
        fontWeight: isKey ? 'medium' : 'normal',
        padding: '8px',
        backgroundColor: currentLevel === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
        fontSize: `${Math.max(14 - currentLevel, 12)}px`,
        minWidth: '120px'
    });

    const formatKey = (key) => {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/_/g, ' ');
    };

    const renderPrimitiveValue = (value) => {
        const valueType = getDataType(value);
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{String(value)}</span>
            </div>
        );
    };

    const renderArrayValue = (arrayData, currentLevel) => {
        if (arrayData.length === 0) {
            return;
        }

        return (
            <div style={{ width: '100%' }}>
                {arrayData.map((item, index) => {
                    const itemType = getDataType(item);

                    if (itemType === 'object') {
                        return (
                            <Accordion key={index} style={{ margin: '4px 0', boxShadow: 'none', border: '1px solid #f0f0f0' }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ minHeight: '36px' }}>
                                    <Typography variant="subtitle2">Item {index + 1}</Typography>
                                </AccordionSummary>
                                <AccordionDetails style={{ padding: '8px' }}>
                                    <RecursiveNestedTable
                                        data={item}
                                        level={currentLevel + 1}
                                        maxWidth="100%"
                                        showHeader={false}
                                    />
                                </AccordionDetails>
                            </Accordion>
                        );
                    } else {
                        return (
                            <div
                                key={index}
                                style={{
                                    padding: '4px 8px',
                                    borderBottom: '1px solid #f0f0f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {renderPrimitiveValue(item)}
                            </div>
                        );
                    }
                })}
            </div>
        );
    };

    const renderObjectValue = (objData, currentLevel) => {
        if (!objData || typeof objData !== 'object' || Object.keys(objData).length === 0) {
            return;
        }

        return (
            <TableContainer
                component={Paper}
                style={{
                    border: `1px solid ${level === 0 ? '#f0f0f0' : '#e0e0e0'}`,
                    borderRadius: '4px',
                    maxWidth: '100%',
                    overflow: 'auto',
                    marginTop: currentLevel > 0 ? '4px' : '0'
                }}
            >
                <Table size="small">
                    <TableBody>
                        {Object.entries(objData).map(([key, value]) => {
                            const valueType = getDataType(value);

                            return (
                                <TableRow key={key}>
                                    <TableCell style={getCellStyle(currentLevel, true)}>
                                        {formatKey(key)}
                                    </TableCell>
                                    <TableCell style={getCellStyle(currentLevel, false)}>
                                        {valueType === 'object' ? (
                                            <RecursiveNestedTable
                                                data={value}
                                                level={currentLevel + 1}
                                                maxWidth="100%"
                                                showHeader={false}
                                            />
                                        ) : valueType === 'array' ? (
                                            renderArrayValue(value, currentLevel + 1)
                                        ) : (
                                            renderPrimitiveValue(value)
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    // Handle both objects and arrays at root level
    if (Array.isArray(data)) {
        return (
            <div style={{ width: maxWidth }}>
                {showHeader && (
                    <Typography variant="subtitle2" style={{ fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Root Array
                    </Typography>
                )}
                {renderArrayValue(data, level)}
            </div>
        );
    }

    return renderObjectValue(data, level);
};

// Enhanced Updates Nested Table with multi-level support
const EnhancedUpdatesNestedTable = ({ updates }) => {
    if (!updates || typeof updates !== 'object') {
        return <Typography>No updates available</Typography>;
    }

    return (
        <div style={{ width: '100%' }}>
            {Object.entries(updates).map(([tableName, tableData]) => (
                <div key={tableName} style={{ marginBottom: '24px' }}>
                    <Typography variant="h6">
                        {tableName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Typography>
                    <RecursiveNestedTable
                        data={tableData}
                        level={0}
                        maxWidth="100%"
                        showHeader={false}
                    />
                </div>
            ))}
        </div>
    );
};

// Enhanced Workflow Data Table with multi-level support
const EnhancedWorkflowDataTable = ({ data }) => {
    if (!data || typeof data !== 'object') {
        return <Typography>No workflow data available</Typography>;
    }

    const { id, updates, ...otherData } = data;

    return (
        <TableContainer
            component={Paper}
            style={{
                width: '100%',
                height: '400px',
                overflow: 'auto',
                border: '1px solid #e0e0e0'
            }}
        >
            <Table size="small">
                <TableBody>
                    {/* ID Row */}
                    <TableRow>
                        <TableCell style={{ verticalAlign: 'top', borderRight: '1px solid #e0e0e0', fontWeight: 'medium', width: 'auto' }}>
                            ID
                        </TableCell>
                        <TableCell style={{ verticalAlign: 'top' }}>
                            {id || 'N/A'}
                        </TableCell>
                    </TableRow>

                    {/* Updates Row */}
                    <TableRow>
                        <TableCell style={{ verticalAlign: 'top', borderRight: '1px solid #e0e0e0', fontWeight: 'medium' }}>
                            Updates
                        </TableCell>
                        <TableCell style={{ verticalAlign: 'top', padding: '16px' }}>
                            {updates ? (
                                <EnhancedUpdatesNestedTable updates={updates} />
                            ) : (
                                <Typography>No updates available</Typography>
                            )}
                        </TableCell>
                    </TableRow>

                    {/* Other Data Rows */}
                    {Object.entries(otherData).map(([key, value]) => (
                        <TableRow key={key}>
                            <TableCell style={{ verticalAlign: 'top', fontWeight: 'medium', borderRight: '1px solid #e0e0e0' }}>
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </TableCell>
                            <TableCell style={{ verticalAlign: 'top', padding: '16px' }}>
                                <RecursiveNestedTable
                                    data={value}
                                    level={0}
                                    maxWidth="100%"
                                    showHeader={false}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

// Enhanced Approval History Table with multi-level support
const EnhancedApprovalHistoryTable = ({ data, workflowId }) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return <Typography>No approval history available</Typography>;
    }

    return (
        <TableContainer
            component={Paper}
            style={{
                width: '100%',
                height: '400px',
                overflow: 'auto',
                border: '1px solid #e0e0e0'
            }}
        >
            <Table size="small">
                <TableHead style={{ top: 0, backgroundColor: '#f5f5f5', zIndex: 10 }}>
                    <TableRow>
                        <TableCell style={{ fontWeight: 'bold', width: '80px', borderRight: '1px solid #e0e0e0' }}>
                            Workflow ID
                        </TableCell>
                        <TableCell style={{ fontWeight: 'bold' }}>
                            History Stages
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell style={{ verticalAlign: 'top', borderRight: '1px solid #e0e0e0', fontWeight: 'medium' }}>
                            {workflowId || 'N/A'}
                        </TableCell>
                        <TableCell style={{ verticalAlign: 'top', padding: '16px' }}>
                            <div style={{ width: '100%' }}>
                                {data.map((entry, index) => (
                                    <div key={index} style={{ marginBottom: '24px' }}>
                                        <Typography variant="h6">
                                            Stage {index + 1}
                                        </Typography>
                                        <RecursiveNestedTable
                                            data={entry}
                                            level={0}
                                            maxWidth="100%"
                                            showHeader={false}
                                        />
                                    </div>
                                ))}
                            </div>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
};

function ApprovalHistory() {
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language;
    const isArabic = i18n.language === 'ar';
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const [approvalHistoryData, setApprovalHistoryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);
    const { token, user, isAuthenticated, logout } = useAuth();

    // Pagination and filtering state
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({});
    const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
    const [sortModel, setSortModel] = useState([]);
    const [filterAnchor, setFilterAnchor] = useState(null);

    // Workflow data popup state
    const [workflowDataPopup, setWorkflowDataPopup] = useState({
        open: false,
        data: null,
        workflowId: null
    });

    // Approval history popup state
    const [approvalHistoryPopup, setApprovalHistoryPopup] = useState({
        open: false,
        data: null,
        workflowId: null
    });

    // Grid API reference
    const gridApiRef = useGridApiRef();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // RBAC
    const rbacMgr = new RbacManager(
        user?.userType === 'employee' && user?.roles?.[0] !== 'admin' ? user?.designation : user?.roles?.[0],
        'approvalHistory'
    );
    const isV = rbacMgr.isV.bind(rbacMgr);
    const isE = rbacMgr.isE.bind(rbacMgr);

    const role = user?.userType === 'employee' ? user?.designation : user?.roles?.[0];
    const pageName = 'approvalHistory';
    const storageKey = `${pageName}_${role}_columns`;
    const columnWidthsKey = `${pageName}_${role}_columnWidths`;
    const [columnDimensions, setColumnDimensions] = useState({});

    useEffect(() => {
        const savedModel = localStorage.getItem(storageKey);
        if (savedModel) {
            setColumnVisibilityModel(JSON.parse(savedModel));
        }
    }, [storageKey]);

    // Handle workflow data icon click
    const handleWorkflowDataClick = (params, event) => {
        event.stopPropagation(); // Prevent any row interactions

        let workflowData;
        try {
            workflowData = JSON.parse(params.value);
        } catch (error) {
            workflowData = { error: 'Invalid JSON data' };
        }

        setWorkflowDataPopup({
            open: true,
            data: workflowData,
            workflowId: params.row.workflow_id || params.row.id
        });
    };

    // Handle approval history icon click
    const handleApprovalHistoryClick = (params, event) => {
        event.stopPropagation(); // Prevent any row interactions

        let historyData;
        try {
            historyData = JSON.parse(params.value);
        } catch (error) {
            historyData = [];
        }

        setApprovalHistoryPopup({
            open: true,
            data: historyData,
            workflowId: params.row.workflow_id || params.row.id
        });
    };

    // Close workflow data popup
    const handleCloseWorkflowDataPopup = () => {
        setWorkflowDataPopup({
            open: false,
            data: null,
            workflowId: null
        });
    };

    // Close approval history popup
    const handleCloseApprovalHistoryPopup = () => {
        setApprovalHistoryPopup({
            open: false,
            data: null,
            workflowId: null
        });
    };

    // Fetch approval history from API
    const fetchApprovalHistory = useCallback(async (page = 1, searchTerm = '', customFilters = {}, sortedModel = []) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                page,
                pageSize,
                search: searchTerm,
                sortBy: sortedModel[0]?.field || 'id',
                sortOrder: sortedModel[0]?.sort || 'asc',
                filters: JSON.stringify(customFilters),
            });

            const employeeId = user?.employeeId || user?.id || 'emp_1006';
            const apiUrl = `${API_BASE_URL}/workflow-instance/get-approval-history?${params.toString()}`;

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('API did not return JSON. Check API URL and server.');
            }

            if (!response.ok) {
                if (response.status === 401) {
                    logout();
                    navigate(user?.userType === 'customer' ? '/login' : '/login-employee');
                    return;
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const resp = await response.json();
            console.log('Fetched approval history:', resp);

            if (resp.data) {
                const processedData = resp.data.map((item, index) => ({
                    ...item,
                    id: item.id || index,
                    workflowId: item.workflow_id || item.id,
                    workflowName: item.name,
                    module: item.module,
                    currentStageName: item.current_stage_name || 'N/A',
                    status: item.status,
                    currentApprover: Array.isArray(item.CurrentapproverNames)
                        ? item.CurrentapproverNames.join(', ')
                        : item.CurrentapproverNames || '',
                    workflowData: JSON.stringify(item.workflow_data),
                    approvalHistory: JSON.stringify(item.approval_history),
                    createdBy: item.created_by_username || 'N/A',
                }));

                setApprovalHistoryData(processedData);
                setTotal(resp.totalRecords || processedData.length);
            } else {
                throw new Error(resp.message || 'Failed to fetch approval history');
            }
        } catch (err) {
            console.error('Failed to fetch approval history:', err);
            setError(err.message);
            setApprovalHistoryData([]);
        } finally {
            setLoading(false);
        }
    }, [navigate, logout, user?.userType, user?.employeeId, user?.id, token, pageSize]);

    useEffect(() => {
        if (loading) return;

        if (user) {
            fetchApprovalHistory(page, searchQuery, filters, sortModel);
        }

        if (!user) {
            console.log('User not authenticated, logging out...');
        }
    }, [page, searchQuery, user, fetchApprovalHistory, filters, sortModel]);

    // Handle search functionality
    const handleSearch = (searchTerm) => {
        setSearchQuery(searchTerm);
        setPage(1);
    };

    // Handle sort model change
    const handleSortModelChange = (model) => {
        console.log('Sort model changed:', model);
        setSortModel(model);
        fetchApprovalHistory(1, searchQuery, filters, model);
    };

    // Add the column resize handler
    const handleColumnResize = (params) => {
        const { colDef } = params;
        setColumnDimensions(prev => {
            const newDimensions = {
                ...prev,
                [colDef.field]: { width: colDef.width }
            };
            localStorage.setItem(columnWidthsKey, JSON.stringify(newDimensions));
            return newDimensions;
        });
    };

    // Define columns for the DataGrid as per your requirements
    const approvalHistoryColumns = [
        {
            field: 'id',
            headerName: t('ID'),
            include: isV('idCol'),
            searchable: true,
            sortable: false,
            width: columnDimensions.id?.width || 30,
            align: isArabic ? 'right' : 'left',
            headerAlign: isArabic ? 'right' : 'left',
            renderCell: (params) => <span>{params.value}</span>,
        },
        {
            field: 'workflowName',
            headerName: t('Workflow Name'),
            include: isV('workflowNameCol'),
            searchable: true,
            sortable: false,
            width: columnDimensions.workflowName?.width || 120,
            align: isArabic ? 'right' : 'left',
            headerAlign: isArabic ? 'right' : 'left',
            renderCell: (params) => <span>{params.value}</span>,
        },
        {
            field: 'module',
            headerName: t('Module'),
            include: isV('moduleCol'),
            searchable: true,
            sortable: false,
            width: columnDimensions.module?.width || 100,
            align: isArabic ? 'right' : 'left',
            headerAlign: isArabic ? 'right' : 'left',
            renderCell: (params) => <span>{params.value}</span>,
        },
        {
            field: 'currentStageName',
            headerName: t('Current Stage'),
            include: isV('currentStageCol'),
            searchable: true,
            sortable: false,
            width: columnDimensions.currentStageName?.width || 120,
            align: isArabic ? 'right' : 'left',
            headerAlign: isArabic ? 'right' : 'left',
            renderCell: (params) => <span>{params.value}</span>,
        },
        {
            field: 'status',
            headerName: t('Status'),
            include: isV('statusCol'),
            searchable: true,
            sortable: false,
            width: columnDimensions.status?.width || 100,
            align: isArabic ? 'right' : 'left',
            headerAlign: isArabic ? 'right' : 'left',
            cellClassName: (params) => getStatusClass(params.value),
            renderCell: (params) => (
                <label className={getStatusClass(params.value)}>
                    {t(params.value)}
                </label>
            ),
        },
        {
            field: 'currentApprover',
            headerName: t('Current Approver'),
            include: isV('currentApproverCol'),
            searchable: isV('currentApproverSearch'),
            sortable: false,
            width: columnDimensions.currentApprover?.width || 180,
            align: isArabic ? 'right' : 'left',
            headerAlign: isArabic ? 'right' : 'left',
            renderCell: (params) => (
                <Tooltip title={params.value} arrow>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                        {params.value}
                    </span>
                </Tooltip>
            ),
        },
        {
            field: 'workflowData',
            headerName: t('Workflow Data'),
            include: isV('workflowDataCol'),
            searchable: false,
            sortable: false,
            width: columnDimensions.workflowData?.width || 100,
            align: 'center',
            headerAlign: isArabic ? 'right' : 'left',
            renderCell: (params) => (
                <Tooltip title="Click to view workflow data" arrow>
                    <IconButton
                        onClick={(event) => handleWorkflowDataClick(params, event)}
                        size="small"
                        style={{ color: 'var(--logo-deep-green)', cursor: 'pointer', padding: '4px' }}
                    >
                        <TextSnippetIcon style={{ fontSize: '16px' }} />
                    </IconButton>
                </Tooltip>
            ),
        },
        {
            field: 'approvalHistory',
            headerName: t('Approval History'),
            include: isV('approvalHistoryCol'),
            searchable: false,
            sortable: false,
            width: columnDimensions.approvalHistory?.width || 120,
            align: 'center',
            headerAlign: isArabic ? 'right' : 'left',
            renderCell: (params) => {
                // Parse approval history data to determine which icon to show
                let historyData;
                try {
                    historyData = JSON.parse(params.value);
                } catch (error) {
                    historyData = [];
                }

                // Check if there are less than 1 entries (0 entries) or 1 or more entries
                const hasEntries = Array.isArray(historyData) && historyData.length >= 1;
                const IconComponent = hasEntries ? ChatBubbleSharpIcon : ChatBubbleOutlineSharpIcon;

                return (
                    <Tooltip title="Click to view approval history" arrow>
                        <IconButton
                            onClick={(event) => handleApprovalHistoryClick(params, event)}
                            size="small"
                            style={{ color: 'var(--logo-deep-green)', cursor: 'pointer', padding: '4px' }}
                        >
                            <IconComponent style={{ fontSize: '16px' }} />
                        </IconButton>
                    </Tooltip>
                );
            },
        },
        {
            field: 'createdBy',
            headerName: t('Created By'),
            include: isV('createdByCol'),
            searchable: true,
            sortable: false,
            width: columnDimensions.createdBy?.width || 150,
            align: isArabic ? 'right' : 'left',
            headerAlign: isArabic ? 'right' : 'left',
            renderCell: (params) => <span>{params.value}</span>,
        },
    ];

    // Filter visible columns
    const visibleColumns = approvalHistoryColumns.filter((col) => col.include !== false);

    // Searchable fields for the toolbar
    const searchableFields = visibleColumns.filter(item => item.searchable).map(item => item.field);

    // Handle filter changes
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setPage(1);
        setFilterAnchor(null);
    };

    const filteredData = visibleColumns?.filter(item => searchableFields?.includes(item?.field));

    // Columns to display mapping
    const columnsToDisplay = {
        id: 'ID',
        workflowName: 'Workflow Name',
        module: 'Module',
        currentStageName: 'Current Stage Name',
        status: 'Status',
        currentApprover: 'Current Approver',
        workflowData: 'Workflow Data',
        approvalHistory: 'Approval History',
        createdBy: 'Created By',
    };

    const totalPages = Number.isFinite(total) && Number.isFinite(pageSize) && total > 0 && pageSize > 0
        ? Math.ceil(total / pageSize)
        : 1;

    const handleColumnVisibilityChange = (newModel) => {
        setColumnVisibilityModel(newModel);
        localStorage.setItem(storageKey, JSON.stringify(newModel));
    };

    const handleExportData = async () => {
        try {
            const params = new URLSearchParams({
                page: page,
                pageSize: pageSize,
                search: searchQuery,
                sortBy: sortModel[0]?.field || 'id',
                sortOrder: sortModel[0]?.sort || 'asc',
                filters: JSON.stringify(filters),
                isdownload: 'true'
            });

            const apiUrl = `${API_BASE_URL}/workflow-instance/get-approval-history?${params.toString()}`;

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    logout();
                    navigate(user?.userType === 'customer' ? '/login' : '/login-employee');
                    return;
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'approval_history.xlsx';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            console.log('Excel file downloaded successfully');

        } catch (error) {
            console.error('Error downloading approval history:', error);
        }
    };



    return (
        <Sidebar title={t('Approval History')} isV={isV('approvalHistoryContent')}>
            <div className="approval-history-content">
                {isMobile ? (
                    <div className="table-container">
                        {loading ? (
                            <div className="loading-container" style={{ position: "absolute", top: "50%", left: "50%" }}>
                                <LoadingSpinner size="medium" />
                            </div>
                        ) : error ? (
                            <div className="error-message">{error}</div>
                        ) : (
                            <TableMobile
                                columns={visibleColumns}
                                allColumns={approvalHistoryColumns}
                                data={approvalHistoryData}
                                showAllDetails={false}
                            />
                        )}
                    </div>
                ) : (
                    <div className="table-container">
                        {loading ? (
                            <div className="loading-container" style={{ position: "absolute", top: "50%", left: "50%" }}>
                                <LoadingSpinner size="medium" />
                            </div>
                        ) : error ? (
                            <div className="error-message">{error}</div>
                        ) : (
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                                <DataGrid
                                    apiRef={gridApiRef}
                                    rows={approvalHistoryData}
                                    columns={visibleColumns}
                                    pageSize={pageSize}
                                    rowCount={total}
                                    columnVisibilityModel={columnVisibilityModel}
                                    onColumnVisibilityModelChange={handleColumnVisibilityChange}
                                    sortModel={sortModel}
                                    onSortModelChange={handleSortModelChange}
                                    disableSelectionOnClick
                                    disableColumnMenu
                                    hideFooter={true}
                                    hideFooterPagination={true}
                                    pagination={false}
                                    rowHeight={55}
                                    showToolbar
                                    onColumnResize={handleColumnResize}
                                    columnDimensions={columnDimensions}
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
                                                searchPlaceholder="Search approval history..."
                                                showColumnVisibility={false}
                                                showFilters={false}
                                                showExport={true}
                                                handleExportClick={handleExportData}
                                                showUpload={false}
                                                showCalendar={false}
                                                showAdd={false}
                                                showApproval={false}
                                                columnsToDisplay={columnsToDisplay}
                                            />
                                        ),
                                    }}
                                    sx={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        '& .MuiDataGrid-main': {
                                            flex: 1,
                                            overflowX: 'scroll',
                                            overflowY: 'hidden',
                                        },
                                        '& .MuiDataGrid-toolbar': {
                                            padding: '0px 8px !important',
                                            minHeight: '56px !important',
                                            flexShrink: 0,
                                        },
                                        '& .MuiDataGrid-virtualScroller': {
                                            flex: 1,
                                        },
                                        '& .MuiDataGrid-columnHeaders': {
                                            top: 0,
                                            zIndex: 1,
                                            backgroundColor: 'white',
                                            borderBottom: '1px solid #e0e0e0',
                                        },
                                        '& .MuiDataGrid-row:hover': {
                                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                        },
                                        ...(isArabic && {
                                            direction: 'rtl',
                                            '& .MuiDataGrid-cell': {
                                                textAlign: 'right !important',
                                            },
                                            '& .MuiDataGrid-columnHeader': {
                                                textAlign: 'right !important',
                                            },
                                            '& .MuiDataGrid-columnHeaderTitle': {
                                                textAlign: 'right !important',
                                            },
                                            '& .MuiDataGrid-cellContent': {
                                                textAlign: 'right !important',
                                            },
                                        }),
                                        ...(!isArabic && {
                                            '& .MuiDataGrid-cell': {
                                                textAlign: 'left',
                                            },
                                            '& .MuiDataGrid-columnHeader': {
                                                textAlign: 'left',
                                            },
                                            '& .MuiDataGrid-columnHeaderTitle': {
                                                textAlign: 'left',
                                            },
                                            '& .MuiDataGrid-cellContent': {
                                                textAlign: 'left',
                                            },
                                        }),
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* External Pagination component */}
                {isV('approvalHistoryPagination') && approvalHistoryData.length > 0 && (
                    <Pagination
                        currentPage={page}
                        totalPages={String(totalPages)}
                        onPageChange={setPage}
                    />
                )}

                {/* Enhanced Workflow Data Popup */}
                <Dialog
                    open={workflowDataPopup.open}
                    onClose={handleCloseWorkflowDataPopup}
                    PaperProps={{
                        style: {
                            width: '80vw',
                            height: '80vh',
                            maxWidth: '800px',
                            maxHeight: '600px'
                        }
                    }}
                >
                    <DialogTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '8px', height: '60px', minHeight: '60px' }}>
                        <Typography variant="h6">{t('Workflow Data')}</Typography>
                        <IconButton onClick={handleCloseWorkflowDataPopup} size="small" style={{ color: 'gray' }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers style={{ padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', height: 'calc(80vh - 120px)' /* Total height minus title and actions */ }}>
                        {workflowDataPopup.data ? (
                            <EnhancedWorkflowDataTable data={workflowDataPopup.data} />
                        ) : (
                            <Typography>{t('No workflow data available')}</Typography>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Enhanced Approval History Popup */}
                <Dialog
                    open={approvalHistoryPopup.open}
                    onClose={handleCloseApprovalHistoryPopup}
                    PaperProps={{
                        style: {
                            width: '80vw',
                            height: '80vh',
                            maxWidth: '800px',
                            maxHeight: '600px'
                        }
                    }}
                >
                    <DialogTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '8px', height: '60px', minHeight: '60px' }}>
                        <Typography variant="h6">{t('Approval History')}</Typography>
                        <IconButton onClick={handleCloseApprovalHistoryPopup} size="small" style={{ color: 'gray' }}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers style={{ padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', height: 'calc(80vh - 120px)' /* Total height minus title and actions */ }}>
                        {approvalHistoryPopup.data ? (
                            <EnhancedApprovalHistoryTable
                                data={approvalHistoryPopup.data}
                                workflowId={approvalHistoryPopup.workflowId}
                            />
                        ) : (
                            <Typography>{t('No approval history available')}</Typography>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </Sidebar>
    );
}

export default ApprovalHistory;
