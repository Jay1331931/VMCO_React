import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/components.css';
import Pagination from './Pagination';
import axios from 'axios';
import { BiHandicap } from 'react-icons/bi';


function GetSalesOrder({ open, onClose,formData,API_BASE_URL,setFormData, t = (x) => x }) {
  
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 5,
    total: 0
  });
    const [customerOrders, setCustomerOrders] = useState([]);
     const debounceTimeout = useRef();
    const fetchSalesOrders = useCallback(async () => {
    try {

      const filteredData = {}
      filteredData.erpCustId=formData.erpCustId;
      filteredData.entity= formData.entity;
      filteredData.paymentStatus="Pending";
      const filter=JSON.stringify(filteredData);
      const { data } = await axios.get(`${API_BASE_URL}/sales-order/pagination?page=${pagination?.page}&pageSize=${pagination?.pageSize}&search=${searchQuery}&perpose=maintenancecreation&filters=${filter}`, {
        withCredentials: true,
      });
      setCustomerOrders(data.data.data || []);
      setPagination({
        page: data?.data?.page || 1, 
        pageSize: data?.data.pageSize || 10,
        total: data?.data?.totalRecords || 0
      }
      )
    } catch (error) {
      console.error("Error fetching sales orders:", error);
    }
  }, [formData.entity, pagination.page, pagination.pageSize, searchQuery]);
  useEffect(() => {
    fetchSalesOrders();
  }, [fetchSalesOrders]);
 
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setSearchQuery(search);
      setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(debounceTimeout.current);
  }, [search, open]);

  if (!open) return null;

const handleSelect = (customer) => {
  setFormData(prev => {
    const updated = { ...prev };
    if (customer.erpOrderId) {
      if (prev.erpOrderId?.includes(customer.erpOrderId)) {
        updated.erpOrderId = prev.erpOrderId?.filter(id => id !== customer.erpOrderId);
      } else {
        updated.erpOrderId = [...prev.erpOrderId, customer.erpOrderId];
      }
    }

    if (customer?.id) {
      if (prev.orderId?.includes(customer.id)) {
        updated.orderId = prev.orderId.filter(id => id !== customer.id);
      } else {
        updated.orderId = [...(prev.orderId || []), customer.id];
      }
    }

    return updated;
  });
};


  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  return (
    <div>
      <div className="gp-backdrop" onClick={onClose} />
      <div className="gp-modal">
        <div className="gp-header">
          <span className="gp-title">{t("Select a Customer Order")}</span>
          <button className="gp-close-btn" onClick={onClose}>
            {t("Close")}
          </button>
        </div>
        <div style={{ padding: "0 28px 10px 28px" }}>
          <input
            type="text"
            placeholder={t("Search customers...")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setSearchQuery(search);
                setPagination(prev => ({ ...prev, page: 1 }));
              }
            }}
            style={{
              width: "100%",
              padding: "8px 10px",
              marginBottom: 10,
              borderRadius: 4,
              border: "1px solid #ddd"
            }}
          />
        </div>
        <div className="gp-table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>{t('Id')}</th>
                <th>{t('ERP Order ID')}</th>
                <th>{t('ERP Customer ID')}</th>
                
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customerOrders?.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '10px', textAlign: 'center' }}>{t('No customers found')}</td>
                </tr>
              ) : (
                customerOrders?.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.id}</td>
                    <td>{customer.erpOrderId}</td>
                    <td>{customer.erpCustId}</td>
                    <td>
                      <button
                        className="gp-product-btn"
                        onClick={() =>handleSelect(customer)} 
                      >
                         {formData.orderId?.includes(customer.id) ? t("Selected") : t("Select")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="gp-footer">
          <Pagination
            currentPage={pagination.page}
            totalPages={totalPages}
            onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
            startIndex={(pagination.page - 1) * pagination.pageSize + 1}
            endIndex={Math.min(pagination.page * pagination.pageSize, pagination.total)}
            totalItems={pagination.total}
          />
        </div>
      </div>
      <style>
        {
          `.gp-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.gp-modal {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  width: 800px;
  max-width: 95vw;
  z-index: 1001;
  overflow: hidden;
  animation: gp-fadein 0.2s ease;
}

@keyframes gp-fadein {
  from { opacity: 0; transform: translate(-50%, -60%); }
  to { opacity: 1; transform: translate(-50%, -50%); }
}

.gp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 28px 10px 28px;
  // background: #f8f8f8;
  // border-bottom: 1px solid #ddd;
}

.gp-title {
  font-size: 1.2rem;
  font-weight: 500;
  color: #222;
}

.gp-close-btn {
  padding: 6px 16px;
  font-size: 0.95rem;
  background: #eee;
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}
.gp-close-btn:hover {
  background: #ddd;
}

.gp-table-container {
  margin: 10px 28px;
  padding: 8px;
  border: 1px solid #eee;
  border-radius: 8px;
  max-height: 350px;
  overflow-y: auto;
  background-color: #fafafa;
}

.gp-table-container table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.gp-table-container th,
.gp-table-container td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.gp-table-container tr:hover {
  background-color: #f0f8ff;
}

.gp-product-btn {
  padding: 6px 12px;
  background: #0a5640;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}
.gp-product-btn:hover {
  background: #084a36;
}

.gp-footer {
  display: flex;
  justify-content: center;
  padding: 16px 28px 20px 28px;
  background: #f9f9f9;
  border-top: 1px solid #ddd;
}

.gp-modal input[type="text"] {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 10px;
}

/* Responsive */
@media (max-width: 600px) {
  .gp-modal {
    width: 95vw;
  }

  .gp-table-container {
    font-size: 0.85rem;
  }

  .gp-title {
    font-size: 1rem;
  }

  .gp-close-btn {
    font-size: 0.85rem;
  }
}
`
        } </style>
    </div>
  );
}

export default GetSalesOrder;
