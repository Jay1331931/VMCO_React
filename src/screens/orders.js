import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ActionButton from '../components/ActionButton';
import ToggleButton from '../components/ToggleButton';
import SearchInput from '../components/SearchInput';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import '../styles/components.css';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { NullType } from 'maplibre-gl';

const getStatusClass = (status) => {
  switch (status) {
    case 'Approved':
      return 'status-approved';
    case 'Rejected':
      return 'status-rejected';
    default:
      return 'status-pending';
  }
};

function Orders() {
  const [isApprovalMode, setApprovalMode] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const { t } = useTranslation();
  const navigate = useNavigate();

  const toggleApprovalMode = () => {
    setApprovalMode(!isApprovalMode);
  };

  // Fetch orders from API
  const fetchOrders = async (page = 1, searchTerm = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        pageSize,
        search: searchTerm,
        sortBy: 'id',
        sortOrder: 'asc',
        filters: '{}'
      });

      const response = await fetch(`http://localhost:3000/api/sales-order/pagination?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const result = await response.json();
      if (result.status === 'Ok') {
        setFilteredOrders(result.data.data);
        setTotal(result.data.total || result.data.data.length);
      } else {
        throw new Error(result.message || 'Failed to fetch orders');
      }
    } catch (err) {
      setError(err.message);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page);
    // eslint-disable-next-line
  }, [page]);

  const handleSearch = (searchTerm) => {
    fetchOrders(1, searchTerm);
    setPage(1);
  };

  const handleAddOrder = () => {
    navigate('/orderDetails', { state: { order: {} } });
    // Add your logic to handle adding an order here
  };

  const handleRowClick = (order) => {
    navigate('/orderDetails', { state: { order } });
  };

  // Action menu for Orders page
  const orderMenuItems = [
    {
      key: 'favorites',
      label: 'Favorites',
      onClick: () => alert('Favorites clicked')
    },
    {
      key: 'customOrders',
      label: 'Custom Orders',
      onClick: () => alert('Custom Orders clicked')
    }
  ];

  const columns = [
    { key: 'erpOrderId', header: 'Order #' },
    { key: 'erpCustId', header: 'Customer' },
    { key: 'erpBranchId', header: 'Branch' },
    { key: 'entity', header: 'Entity' },
    { key: 'paymentMethod', header: 'Payment Method' },
    { key: 'deliveryDate', header: 'Delivery Date' },
    { key: 'paidAmount', header: 'Paid Amount' },
    { key: 'customerApproval', header: 'Customer Approval' },
    { key: 'status', header: 'Status' }
  ];

  // Paginate the filtered orders
  const paginatedOrders = filteredOrders.slice(0, pageSize);

  return (
    <Sidebar title={t('Orders')}>
      <div className="orders-content">
        <div className="page-header">
          <div className="header-controls">
            <SearchInput onSearch={handleSearch} />
          </div>
          <div className="header-actions">
            <ToggleButton 
              isToggled={isApprovalMode}
              onToggle={toggleApprovalMode}
            />
            <button className="add-button" onClick={handleAddOrder}>{t('+ Add')}</button>
            <ActionButton menuItems={orderMenuItems} />
          </div>
        </div>
        <Table 
          columns={columns}
          data={paginatedOrders}
          getStatusClass={getStatusClass}
          onRowClick={handleRowClick}
        />
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(total / pageSize)}
          onPageChange={setPage}
        />
        {loading && <div>Loading...</div>}
        {error && <div className="error">{error}</div>}
      </div>
    </Sidebar>
  );
}

export default Orders;