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
import { useAuth } from '../context/AuthContext';
import RbacManager from '../utilities/rbac';
import Constants from '../constants';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const getStatusClass = (status) => {
  //get the status from the order
  
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
  const { user } = useAuth();
  const [isApprovalMode, setApprovalMode] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [assignedCustomerIds, setAssignedCustomerIds] = useState([]);
  const [assignedBranchIds, setAssignedBranchIds] = useState([]);

  const { t } = useTranslation();
  const navigate = useNavigate();


  //RBAC
  //use formMode to decide if it is editform or add form
  const rbacMgr = new RbacManager(user.userType === 'employee' && user.roles[0] !== 'admin' ? user.designation : user.roles[0], 'orderList');
  const isV = rbacMgr.isV.bind(rbacMgr);

  const toggleApprovalMode = () => {
    setApprovalMode(!isApprovalMode);
  };

  // Fetch assigned customers/branches for the logged-in user
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user) return;
      // Sales Executive: fetch assigned customers
      if (
        user.designation?.toLowerCase() === 'sales executive' ||
        user.roles?.includes('sales executive')
      ) {
        try {
          const params = new URLSearchParams({
            page: 1,
            pageSize: 1000,
            sortBy: 'id',
            sortOrder: 'asc',
            filters: JSON.stringify({ assignedTo: user.name || user.username || user.id })
          });
          const response = await fetch(`${API_BASE_URL}/customers/pagination?${params.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
          const result = await response.json();
          if (result.status === 'Ok') {
            setAssignedCustomerIds(result.data.data.map(c => c.id));
          } else {
            setAssignedCustomerIds([]);
          }
        } catch {
          setAssignedCustomerIds([]);
        }
      }
      // Branch Primary: fetch assigned branches
      else if (
        user.designation?.toLowerCase() === 'branch primary' ||
        user.roles?.includes('branch_primary')
      ) {
        try {
          const params = new URLSearchParams({
            page: 1,
            pageSize: 1000,
            sortBy: 'id',
            sortOrder: 'asc',
            filters: JSON.stringify({ assignedTo: user.name || user.username || user.id })
          });
          const response = await fetch(`${API_BASE_URL}/customer-branches/pagination?${params.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
          const result = await response.json();
          if (result.status === 'Ok') {
            setAssignedBranchIds(result.data.data.map(b => b.id));
          } else {
            setAssignedBranchIds([]);
          }
        } catch {
          setAssignedBranchIds([]);
        }
      }
    };
    fetchAssignments();
    // eslint-disable-next-line
  }, [user]);

  // Fetch orders from API
  const fetchOrders = async (page = 1, searchTerm = '') => {
    setLoading(true);
    setError(null);
    try {
      let filters = {};
      // Sales Executive: filter by assigned customers
      if (
        user &&
        (user.designation?.toLowerCase() === 'sales executive' ||
          user.roles?.includes('sales executive'))
      ) {
        if (assignedCustomerIds.length > 0) {
          filters.customerId = assignedCustomerIds;
        } else {
          setFilteredOrders([]);
          setTotal(0);
          setLoading(false);
          return;
        }
      }
      // Branch Primary: filter by assigned branches
      else if (
        user &&
        (user.designation?.toLowerCase() === 'branch primary' ||
          user.roles?.includes('branch_primary'))
      ) {
        if (assignedBranchIds.length > 0) {
          filters.branchId = assignedBranchIds;
        } else {
          setFilteredOrders([]);
          setTotal(0);
          setLoading(false);
          return;
        }
      }
      // Admin or other: no filter (see all)
      const params = new URLSearchParams({
        page,
        pageSize,
        search: searchTerm,
        sortBy: 'id',
        sortOrder: 'asc',
        filters: JSON.stringify(filters)
      });
      const response = await fetch(`${API_BASE_URL}/sales-order/pagination?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API did not return JSON. Check API URL and server.');
      }

      const result = await response.json();
      if (result.status === 'Ok') {
        setFilteredOrders(result.data.data);
        setTotal(result.data.totalRecords);
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
    fetchOrders(page, searchQuery);
    // eslint-disable-next-line
  }, [page, searchQuery]);

  const handleSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
    setPage(1);
  };

  const handleAddOrder = async () => {
    setLoading(true);
    try {
      // Fetch latest order to determine next order number
      const params = new URLSearchParams({
        page: 1,
        pageSize: 1,
        sortBy: 'id',
        sortOrder: 'desc'
      });
      const response = await fetch(`${API_BASE_URL}/sales-order/pagination?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const result = await response.json();
      let nextOrderId = 1;
      if (result.status === 'Ok' && result.data.data.length > 0) {
        nextOrderId = (parseInt(result.data.data[0].id, 10) || 0) + 1;
      }
      // Navigate to orderDetails with mode: 'add' and nextOrderId
      navigate('/orderDetails', { state: { order: { id: nextOrderId }, mode: 'add' } });
    } catch (err) {
      setError('Failed to get next order number');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (order) => {
    navigate('/orderDetails', { state: { order, mode: 'edit' } });
  };

  const handleCheckout = (order) => {
    navigate('/checkout', { state: { order } });
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
    { key: 'id', header: 'Order #', include: isV('orderNumber') },
    { key: 'erpCustId', header: 'Customer', include: isV( 'companyName') },
    { key: 'erpBranchId', header: 'Branch', include: isV( 'branchName') },
    { key: 'entity', header: 'Entity', include: isV( 'entity') },
    { key: 'paymentMethod', header: 'Payment Method', include: isV( 'paymentMethod') },
    { key: 'deliveryDate', header: 'Delivery Date', include: isV( 'expectedDeliveryDate') },
    { key: 'totalAmount', header: 'Total Amount', include: isV( 'totalAmount') },
    { key: 'paidAmount', header: 'Paid Amount', include: isV( 'paidAmount') },
    { key: 'paymentStatus', header: 'Payment Status', include: isV( 'paymentStatus') },
    { key: 'status', header: 'Status', include: isV( 'status') },
    { key: 'checkout', header: 'Checkout', include: isV( 'action') }
  ];

  // Paginate the filtered orders
  const paginatedOrders = filteredOrders.slice(0, pageSize);

  return (
    <Sidebar title={t('Orders')}>
      {isV('ordersContent') && (<div className="orders-content">
        <div className="page-header">
          <div className="header-controls">
            <SearchInput onSearch={handleSearch} />
          </div>
          <div className="header-actions">
            {isV('approvalButton') && <ToggleButton
            className="toggle-button"
              isToggled={isApprovalMode}
              onToggle={toggleApprovalMode}
            />}
            {isV('addButton') && <button className="add-button" onClick={handleAddOrder}>{t('+ Add')}</button>}
            {isV ('actionMenu') && (<ActionButton menuItems={orderMenuItems} />)}
          </div>
        </div>
        {isV ('ordersTable') && (<Table
          columns={columns.filter(col => col.include !== false)}
          data={paginatedOrders}
          getStatusClass={getStatusClass}
          onRowClick={handleRowClick}
          onCheckout={handleCheckout}
        />)}
        {isV('ordersPagination') && (<Pagination
          currentPage={page}
          totalPages={Math.ceil(total / pageSize)}
          onPageChange={setPage}
        />)}
        {loading && <div>Loading...</div>}
        {error && <div className="error">{error}</div>}
      </div>)}
    </Sidebar>
  );
}

export default Orders;