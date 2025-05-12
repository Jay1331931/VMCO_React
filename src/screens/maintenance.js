import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Table from '../components/Table';
import SearchInput from '../components/SearchInput';
import '../styles/components.css';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const initialTickets = [
  { id: '0001', customer: 'Customer 1', branch: 'Branch 1', issueName: 'Damaged Product', issueType: 'Issue Type', createdDate: '10 Apr 025', details: 'The product is damaged', images: [{image1: '', image2: '', image3: '', image4: ''}], assignedTo: 'Employee 1', status: 'In Progress' },
  { id: '0002', customer: 'Customer 2', branch: 'Branch 1', issueName: 'Payment Issues', issueType: 'Issue Type', createdDate: '10 Apr 025', details: 'Not able to pay', images: [{image1: '', image2: '', image3: '', image4: ''}], assignedTo: 'Employee 1', status: 'Closed' },
  { id: '0003', customer: 'Customer 1', branch: 'Branch 2', issueName: 'Missing Parts', issueType: 'Issue Type', createdDate: '10 Apr 025', details: 'I have not received all the parts', images: [{image1: '', image2: '', image3: '', image4: ''}], assignedTo: 'Employee 1', status: 'In Progress' },
  { id: '0004', customer: 'Customer 3', branch: 'Branch 4', issueName: 'Delivery Delay', issueType: 'Issue Type', createdDate: '10 Apr 025', details: 'The delivery is delayed', images: [{image1: '', image2: '', image3: '', image4: ''}], assignedTo: 'Employee 1', status: 'Rejected' },
  { id: '0005', customer: 'Customer 4', branch: 'Branch 7', issueName: 'Product Not Received', issueType: 'Issue Type', createdDate: '10 Apr 025', details: 'The product has not arrived', images: [{image1: '', image2: '', image3: '', image4: ''}], assignedTo: 'Employee 1', status: 'In Progress' },
  { id: '0006', customer: 'Customer 5', branch: 'Branch 5', issueName: 'Incorrect Item', issueType: 'Issue Type', createdDate: '10 Apr 025', details: 'Received the wrong item', images: [{image1: '', image2: '', image3: '', image4: ''}], assignedTo: 'Employee 1', status: 'In Progress' },
  { id: '0007', customer: 'Customer 6', branch: 'Branch 3', issueName: 'Missing Item', issueType: 'Issue Type', createdDate: '10 Apr 025', details: 'Item is missing', images: [{image1: '', image2: '', image3: '', image4: ''}], assignedTo: 'Employee 1', status: 'In Progress' },
];

function Maintenance() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const columns = [
    { key: 'id', header: 'Ticket #' },
    { key: 'customer', header: 'Customer' },
    { key: 'branch', header: 'Branch' },
    { key: 'issueName', header: 'Category' },
    { key: 'issueType', header: 'Machine' },
    { key: 'createdDate', header: 'Urgency Level' },
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
  
  // Handle row click to navigate to Maintenance page with ticket details
  const handleRowClick = (ticket) => {
    navigate('/maintenanceDetails', { state: { ticket } });
  };

  return (
    <Sidebar title={t('Maintenance Support - Tickets')}>
      <div className="maintenance-content">
        <div className="maintenance-header">
          <SearchInput onSearch={setSearchQuery} />
        </div>
        <Table
          columns={columns}
          data={filteredTickets}
          getStatusClass={getStatusClass}
          onRowClick={handleRowClick}
        />
      </div>
    </Sidebar>
  );
}

export default Maintenance;