import React, { useState, useEffect, useCallback } from 'react';
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
import Swal from 'sweetalert2';


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
  // const { user } = useAuth();
  const [isApprovalMode, setApprovalMode] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, } = useAuth();



  const toggleApprovalMode = () => {
    setApprovalMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        fetchApprovals(page, searchQuery);
      } else {
        fetchOrders(page, searchQuery);
      }
      return newMode;
    });
  };

  // Fetch orders from API
  const fetchOrders = useCallback(async (page = 1, searchTerm = '') => {
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

      const response = await fetch(`${API_BASE_URL}/sales-order/pagination?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API did not return JSON. Check API URL and server.');
      } const result = await response.json();
      if (result.status === 'Ok') {
        // Ensure we have the companyNameEn field for each order
        const processedOrders = result.data.data.map(order => ({
          ...order,
          // If companyNameEn is not present in the data, use the company name or erpCustId as fallback
          companyNameEn: order.companyNameEn || order.company_name_en || order.selectedCustomerName || order.erpCustId || ''
        }));
        setFilteredOrders(processedOrders);
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
  }, [pageSize]);

  // Fetch approvals for orders (similar to customers page)
  const fetchApprovals = async (page = 1, searchTerm = '') => {
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
      console.log('Fetching approvals with params:', params.toString());
      const response = await fetch(`${API_BASE_URL}/workflow-instance/pending-orders-approval?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const result = await response.json();
      console.log('API Response:', result);
      if (result.status === 'Ok') {
        // Ensure we have the companyNameEn field for each order in approvals
        const processedOrders = result.data.data.map(order => ({
          ...order,
          // If companyNameEn is not present in the data, use the company name or erpCustId as fallback
          companyNameEn: order.companyNameEn || order.company_name_en || '',
          workflowName: order.workflowName,
          workflowInstanceId: order.workflowInstanceId
        }));
        setFilteredOrders(processedOrders);
        setTotal(result.data.totalRecords);
      } else {
        throw new Error(result.message || 'Failed to fetch order approvals');
      }
    } catch (err) {
      setError(err.message);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  //NOTE: For fetching the user again after browser refersh - start
  useEffect(() => {

    if (loading) {
      return; // Wait while loading
    }

    console.log("$$$$$$$$$$$ user in orders page", user);
    if (user) {
      fetchOrders(page, searchQuery);
      // eslint-disable-next-line
    }// Check loading state first

    if (!user) {
      console.log("$$$$$$$$$$$ logging out");
      // Logout instead of showing loading message
      //logout();
      //navigate('/login');
      //return null; // Return null while logout is processing
    }

  }, [page, searchQuery, user, fetchOrders]);




  //For fetching the user again after browser refersh - End
  //RBAC
  //use formMode to decide if it is editform or add form
  const rbacMgr = new RbacManager(user?.userType === 'employee' && user?.roles[0] !== 'admin' ? user?.designation : user?.roles[0], 'orderList');
  const isV = rbacMgr.isV.bind(rbacMgr);

  const handleSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
    setPage(1);
  };

  const handleAddOrder = async () => {
    // No need to fetch next orderId, just navigate to add mode
    navigate('/orderDetails', { state: { mode: 'add' } });
  };

  const handleRowClick = async (order) => {
    console.log('Row clicked, navigating to order details with:', order);
    try {
      // Fetch sales order lines for this order
      const params = new URLSearchParams({
        page: 1,
        pageSize: 100,
        search: '',
        sortBy: 'id',
        sortOrder: 'asc',
        filters: JSON.stringify({ order_id: order.id })
      });
      const response = await fetch(`${API_BASE_URL}/sales-order-lines/pagination?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const result = await response.json();
      let salesOrderLines = result.data ? result.data.data : [];
      if (result.status === 'Ok' && result.data && Array.isArray(result.data.data)) {
        salesOrderLines = result.data.data;
      }
      console.log('Fetched sales order :', order);
      navigate('/orderDetails', {
        state: {
          order: { ...order, salesOrderLines },
          mode: 'edit',
          fromApproval: isApprovalMode,
          wfid: isApprovalMode ? order.workflowInstanceId : undefined,
          workflowName: isApprovalMode ? order.workflowName : undefined,
          workflowData: isApprovalMode ? order.workflowData : undefined, // Pass workflowData if in approval mode
          approvalHistory: isApprovalMode ? order.approvalHistory : undefined
        }
      });
    } catch (err) {
      console.error('Failed to fetch sales order lines:', err);
      // Fallback: navigate without salesOrderLines if fetch fails
      navigate('/orderDetails', {
        state: {
          order,
          mode: 'edit',
          fromApproval: isApprovalMode,
          wfid: isApprovalMode ? order.workflowInstanceId : undefined,
          workflowName: isApprovalMode ? order.workflowName : undefined,
          workflowData: isApprovalMode ? order.workflowData : undefined
        }
      });
    }
  };

  const handlePay = (order) => {
    // navigate('/checkout', { state: { order } });
    const paymentWindow = window.open(
      `/payment?orderId=${order.id}&amount=${order.totalAmount}&customerName=${encodeURIComponent(order.companyNameEn || order.erpCustId || '')}&linkExpiryDays=1`,
      '_blank',
      'width=500,height=600'
    );
    // window.location.href = '/payment?orderId=' + order.id + '&amount=' + order.totalAmount;
  };

  // Action menu for Orders page
  const orderMenuItems = [
    {
      key: 'favorites',
      label: 'Favorites',
      onClick: () => Swal.fire({
        title: t('Favorites'),
        text: t('Favorites clicked'),
        icon: 'info',
        confirmButtonText: 'OK'
      })
        // alert('Favorites clicked')
    },
    {
      key: 'customOrders',
      label: 'Custom Orders',
      onClick: () => 
        Swal.fire({
          title: t('Custom Orders'),
          text: t('Custom Orders clicked'),
          icon: 'info',
          confirmButtonText: 'OK'
        })
        // alert('Custom Orders clicked')
    }
  ];


  const isArabic = i18n.language === 'ar'; // or use your language state

  const columns = [
    { key: 'id', header: () => t('Order #'), include: isV('orderNumber') },
    {
      key: isArabic ? 'companyNameAr' : 'companyNameEn',
      header: () => t('Customer'),
      include: isV('companyName')
    },
    {
      key: isArabic ? 'branchNameLc' : 'branchNameEn',
      header: () => t('Branch'),
      include: isV('branchName')
    },
    { key: 'entity', header: () => t('Entity'), include: isV('entity') },
    { key: 'paymentMethod', header: () => t('Payment Method'), include: isV('paymentMethod') },
    { key: 'deliveryDate', header: () => t('Delivery Date'), include: isV('expectedDeliveryDate') },
    { key: 'totalAmount', header: () => t('Total Amount'), include: isV('totalAmount') },
    //{ key: 'paidAmount', header: () => t('Paid Amount'), include: isV('paidAmount') },
    { key: 'paymentStatus', header: () => t('Payment Status'), include: isV('paymentStatus') },
    { key: 'status', header: () => t('Status'), include: isV('status') },
    { key: 'pay', header: () => t('Pay'), include: isV('action') }
  ];

  // Paginate the filtered orders
  const totalPages = Number.isFinite(total) && Number.isFinite(pageSize) && total > 0 && pageSize > 0 ? Math.ceil(total / pageSize) : 1;
  // Always pass totalPages as a string to Pagination to avoid NaN warning
  const paginatedOrders = Array.isArray(filteredOrders) ? filteredOrders.slice(0, pageSize) : [];

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
            {isV('actionMenu') && (<ActionButton menuItems={orderMenuItems} />)}
          </div>
        </div>
        {isV('ordersTable') && (<Table
          columns={columns.filter(col => col.include !== false)}
          data={paginatedOrders}
          getStatusClass={getStatusClass}
          onRowClick={handleRowClick}
          onPay={handlePay}
        />)}
        {isV('ordersPagination') && (<Pagination
          currentPage={page}
          totalPages={String(totalPages)}
          onPageChange={setPage}
        />)}
        {loading && <div>{t("Loading...")}</div>}
        {error && <div className="error">{error}</div>}
      </div>)}
    </Sidebar>
  );
}

export default Orders;