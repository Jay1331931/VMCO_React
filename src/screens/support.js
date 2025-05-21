import React, { useState,useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Table from '../components/Table';
import SearchInput from '../components/SearchInput';
import '../styles/components.css';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import formatDate from '../utilities/dateFormatter';



// const initialTickets = [
//   { id: '0001', customer: 'Customer 1', branch: 'Branch 1', issueName: 'Damaged Product', issueType: 'Issue Type', createdDate: '10 Apr 025', details: 'The product is damaged', images: [{image1: '', image2: '', image3: '', image4: ''}], assignedTo: 'Employee 1', status: 'In Progress' },
//   { id: '0002', customer: 'Customer 2', branch: 'Branch 1', issueName: 'Payment Issues', issueType: 'Issue Type', createdDate: '10 Apr 025', details: 'Not able to pay', images: [{image1: '', image2: '', image3: '', image4: ''}], assignedTo: 'Employee 1', status: 'Closed' },
//   { id: '0003', customer: 'Customer 1', branch: 'Branch 2', issueName: 'Missing Parts', issueType: 'Issue Type', createdDate: '10 Apr 025', details: 'I have not received all the parts', images: [{image1: '', image2: '', image3: '', image4: ''}], assignedTo: 'Employee 1', status: 'In Progress' },
//   { id: '0004', customer: 'Customer 3', branch: 'Branch 4', issueName: 'Delivery Delay', issueType: 'Issue Type', createdDate: '10 Apr 025', details: 'The delivery is delayed', images: [{image1: '', image2: '', image3: '', image4: ''}], assignedTo: 'Employee 1', status: 'Rejected' },
//   { id: '0005', customer: 'Customer 4', branch: 'Branch 7', issueName: 'Product Not Received', issueType: 'Issue Type', createdDate: '10 Apr 025', details: 'The product has not arrived', images: [{image1: '', image2: '', image3: '', image4: ''}], assignedTo: 'Employee 1', status: 'In Progress' },
//   { id: '0006', customer: 'Customer 5', branch: 'Branch 5', issueName: 'Incorrect Item', issueType: 'Issue Type', createdDate: '10 Apr 025', details: 'Received the wrong item', images: [{image1: '', image2: '', image3: '', image4: ''}], assignedTo: 'Employee 1', status: 'In Progress' },
//   { id: '0007', customer: 'Customer 6', branch: 'Branch 3', issueName: 'Missing Item', issueType: 'Issue Type', createdDate: '10 Apr 025', details: 'Item is missing', images: [{image1: '', image2: '', image3: '', image4: ''}], assignedTo: 'Employee 1', status: 'In Progress' },
// ];

function Support() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  const [initialTickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        // Replace with your actual API endpoint URL
        //TODO: Parameters such as search, sort order must be added dynamiccally
        const apiUrl = process.env.REACT_APP_API_BASE_URL 
          ? `${process.env.REACT_APP_API_BASE_URL}/grievances/pagination?page=1&pageSize=10&sortBy=ticket_id&sortOrder=asc`
          : 'http://localhost:3000/api/grievances/pagination?page=1&pageSize=10&sortBy=ticket_id&sortOrder=asc';
          
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const resp = await response.json();
        console.log('Fetched tickets:', typeof(resp.data.data));
        setTickets(resp.data.data);
      } catch (err) {
        console.error('Failed to fetch support tickets:', err);
        setError(err.message);
        // Fall back to static data if API call fails
        setTickets(initialTickets);
      } finally {
        setLoading(false);
      }
    };
    console.log('Component mounted, fetching tickets...');
    fetchTickets();
  }, []);

  //TODO: Handle arabic and english names for company and branch
  const columns = [
    { key: 'id', header: 'Ticket #' },
    { key: currentLanguage=='en'?'companyNameEn':'companyNameAr', header: 'Customer' },
    { key: currentLanguage=='en'?'branchNameEn':'branchNameAr', header: 'Branch' },
    { key: 'grievanceName', header: 'Issue Name' },
    { key: 'grievanceType', header: 'Issue Type' },
    { key: 'createdAt', header: 'Created Date' },
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
  
  // Handle row click to navigate to supportDetails page with ticket details
  const handleRowClick = (ticket) => {
    navigate('/supportDetails', { state: { ticket } });
  };

  return (
    <Sidebar title={t('Support - Tickets')}>
      <div className="support-content">
        <div className="support-header">
          <SearchInput onSearch={setSearchQuery} />
        </div>
        <Table
          columns={columns}
          data={filteredTickets}
          getStatusClass={getStatusClass}
          onRowClick={(ticket) => handleRowClick(ticket)}
        />
      </div>
    </Sidebar>
  );
}

export default Support;