import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Table from '../components/Table';
import SearchInput from '../components/SearchInput';
import '../styles/components.css';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import formatDate from '../utilities/dateFormatter';

function Maintenance() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  const [initialTickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMaintenanceTickets = async () => {
      try {
        // Replace with your actual API endpoint URL
        //TODO: Parameters such as search, sort order must be added dynamically
        const apiUrl = process.env.REACT_APP_API_BASE_URL 
          ? `${process.env.REACT_APP_API_BASE_URL}/maintenance/pagination?page=1&pageSize=10&sortBy=request_id&sortOrder=asc`
          : 'http://localhost:3000/api/maintenance/pagination?page=1&pageSize=10&sortBy=ticket_id&sortOrder=asc';
          
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const resp = await response.json();
        console.log('Fetched maintenance tickets:', typeof(resp.data.data));
        setTickets(resp.data.data);
      } catch (err) {
        console.error('Failed to fetch maintenance tickets:', err);
        setError(err.message);
        // Fall back to static data in case of API failure
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    
    console.log('Component mounted, fetching maintenance tickets...');
    fetchMaintenanceTickets();
  }, []);

  const columns = [
    { key: 'id', header: 'requestId #' },
    { key: currentLanguage === 'en' ? 'companyNameEn' : 'companyNameAr', header: 'Customer' },
    { key: currentLanguage === 'en' ? 'branchNameEn' : 'branchNameAr', header: 'Branch' },
    { key: 'category', header: 'Category' },
    { key: 'machineSerialNumber', header: 'Machine' },
    { key: 'urgencyLevel', header: 'Urgency Level' },
    { key: 'assignedTo', header: 'Assigned To' },
    { key: 'status', header: 'Status' }
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case 'Closed':
        return 'status-approved';
      case 'Rejected':
        return 'status-rejected';
      case 'In Progress':
      default:
        return 'status-pending';
    }
  };

  const filteredTickets = initialTickets.filter(ticket =>
    Object.values(ticket).some(val =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  const handleAdd = () => {
    navigate('/maintenanceDetails')
  }
  
  // Handle row click to navigate to Maintenance details page with ticket details
  const handleRowClick = (ticket) => {
    navigate('/maintenanceDetails', { state: { ticket } });
  };

  return (
    <Sidebar title={t('Maintenance Support - Tickets')}>
      <div className="maintenance-content">
        <div className="maintenance-header">
          <SearchInput onSearch={setSearchQuery} />
          <button className="support-add-button" onClick={handleAdd} >{t('+ Add')}</button>
        </div>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="error-message">Error loading data: {error}</div>
        ) : (
          <Table
            columns={columns}
            data={filteredTickets}
            getStatusClass={getStatusClass}
            onRowClick={handleRowClick}
          />
        )}
      </div>
    </Sidebar>
  );
}

export default Maintenance;

/*
{
    "status": "Ok",
    "data": {
        "page": 1,
        "pageSize": 10,
        "totalRecords": 2,
        "totalPages": 1,
        "data": [
            {
                "id": 1,
                "requestId": "M-1234",
                "customerId": 1,
                "branchId": 1,
                "category": "Machine Maintenance",
                "issueName": "Machine depensation Issue",
                "issueDetails": "Regular maintenance check required",
                "urgencyLevel": "Medium",
                "machineSerialNumber": "F-123444334321",
                "warrantyEndDate": {},
                "attachment": null,
                "status": "Open",
                "assignedTeamMember": 1,
                "assignedTeamMemberDept": "Maintenance",
                "comments": [
                    {
                        "userid": 2,
                        "comment": "Scheduled for next week",
                        "createdAt": "2025-04-01T11:00:00Z"
                    }
                ],
                "chargers": {
                    "maintenance": 150,
                    "partsCharges": [
                        {
                            "qty": 1,
                            "amount": 50,
                            "partName": "Filter"
                        }
                    ]
                },
                "customerRegion": "jeddah",
                "branchRegion": "jeddah",
                "createdAt": "2025-05-20T02:08:02.701Z",
                "updatedAt": "2025-05-20T02:08:02.701Z",
                "createdBy": 1,
                "modifiedBy": 1,
                "companyNameEn": "Al Khaleej Trading",
                "companyNameAr": "الخليج التجارية",
                "branchNameEn": "Khaleej Riyadh Branch",
                "branchNameLc": "فرع الخليج الرياض",
                "assignedTo": "SE1"
            },
            {
                "id": 2,
                "requestId": "M-2133",
                "customerId": 1,
                "branchId": 1,
                "category": "Machine Maintenance",
                "issueName": "Machine Noise",
                "issueDetails": "Machine makes noise while dispensing coffee",
                "urgencyLevel": "Medium",
                "machineSerialNumber": "F-321444334321",
                "warrantyEndDate": {},
                "attachment": null,
                "status": "Open",
                "assignedTeamMember": 1,
                "assignedTeamMemberDept": "Maintenance",
                "comments": [
                    {
                        "userid": 2,
                        "comment": "Scheduled for next week",
                        "createdAt": "2025-04-01T11:00:00Z"
                    }
                ],
                "chargers": {
                    "maintenance": 150,
                    "partsCharges": [
                        {
                            "qty": 1,
                            "amount": 50,
                            "partName": "Filter"
                        }
                    ]
                },
                "customerRegion": "jeddah",
                "branchRegion": "jeddah",
                "createdAt": "2025-05-20T02:08:02.701Z",
                "updatedAt": "2025-05-20T02:08:02.701Z",
                "createdBy": 1,
                "modifiedBy": 1,
                "companyNameEn": "Al Khaleej Trading",
                "companyNameAr": "الخليج التجارية",
                "branchNameEn": "Khaleej Riyadh Branch",
                "branchNameLc": "فرع الخليج الرياض",
                "assignedTo": "SE1"
            }
        ]
    }
}
*/