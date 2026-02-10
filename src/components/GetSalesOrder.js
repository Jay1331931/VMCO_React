import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/components.css';
import Pagination from './Pagination';
import axios from 'axios';
import { BiHandicap } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from "../utilities/api"

function GetSalesOrder({ open, onClose, formData, API_BASE_URL, setFormData, t = (x) => x, token }) {
  const { i18n } = useTranslation();
  // const { token } = useAuth();
  const isRTL = i18n.language === 'ar';

  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });
  const [customerOrders, setCustomerOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const debounceTimeout = useRef();
  const fetchSalesOrders = useCallback(async () => {
    try {

      const filteredData = {}
      filteredData.erpCustId = formData.erpCustId;
      filteredData.entity = formData.entity;
      filteredData.paymentStatus = "Pending";
      filteredData.paymentMethod = "Pre Payment";
      const filter = JSON.stringify(filteredData);
      const { data } = await api.get(`/sales-order/pagination?page=${pagination?.page}&pageSize=${pagination?.pageSize}&search=${searchQuery}&purpose=banktransactions&filters=${filter}`, {
        headers: { "Authorization": `Bearer ${token}` },
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
    if (!open) setSelectedOrders([]);
  }, [open]);

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

  const handleOrderCheck = (order, isChecked) => {
    if (isChecked) {
      setSelectedOrders(prev => [...prev, order]);
      setTotalAmount(prev => prev + parseFloat(order.totalAmount || 0));
    } else {
      setSelectedOrders(prev => prev.filter(o => o.id !== order.id));
      setTotalAmount(prev => prev - parseFloat(order.totalAmount || 0));
    }
  };

  const isOrderSelected = (orderId) => {
    return selectedOrders.some(o => o.id === orderId);
  };

  const handleSelectOrders = () => {
    if (selectedOrders.length === 0) {
      alert(t("Please select at least one order."));
      return;
    }
    
    // Update formData with selected orders
    setFormData(prev => {
      const updated = { ...prev };
      updated.orderId = selectedOrders.map(o => o.id);
      updated.erpOrderId = selectedOrders.map(o => o.erpOrderId);
      updated.amountTransferred = totalAmount;
      updated.branchVmcoRegion = selectedOrders[0]?.branchRegion || null;
      return updated;
    });
    
    setSelectedOrders([]);
    setTotalAmount(0);
    onClose();
  };

  const handleKeyDown = (e) => {
    // These keys indicate user is done with keyboard
    if (
      e.key === "Enter" ||
      e.key === "Go" ||
      e.key === "Search" ||
      e.key === "Done"
    ) {
      if (window.innerWidth <= 768) {
        // Blur the input to close keyboard
        e.target.blur();
        // Remove keyboard class immediately
        document.body.classList.remove("keyboard-open");
      }
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  return (
    <div>
      <div className="gp-backdrop" onClick={onClose} />
      <div className="gp-modal">
        <div className="gp-header">
          <span className="gp-title">{t("Select Customer Orders")}</span>
          <div className="gp-header-buttons">
            <button className="gp-close-btn" onClick={onClose}>
              {t("Cancel")}
            </button>
            <button
              className="gp-select-btn"
              onClick={handleSelectOrders}
              disabled={selectedOrders.length === 0}
              style={{
                marginRight: isRTL ? '0' : '8px', marginLeft: isRTL ? '8px' : '0',
                opacity: selectedOrders.length === 0 ? 0.5 : 1,
                cursor: selectedOrders.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {t("Select")} ({selectedOrders.length})
            </button>
          </div>
        </div>

        <div style={{ padding: "0 28px 10px 28px" }}>
          <input
            type="text"
            placeholder={t("Search orders...")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => {
              if (window.innerWidth <= 768) {
                document.body.classList.add("keyboard-open");
              }
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              document.body.classList.remove("keyboard-open");
            }}
            style={{
              width: "100%",
              padding: "8px 10px",
              marginBottom: 10,
              borderRadius: 4,
              border: "1px solid #ddd"
            }}
          />

          <input
            type="number"
            placeholder={t("Total Amount")}
            value={totalAmount.toFixed(2)}
            readOnly
            style={{
              width: "100%",
              padding: "8px 10px",
              marginBottom: 10,
              borderRadius: 4,
              border: "1px solid #ddd",
              backgroundColor: "#f9f9f9",
              cursor: "default"
            }}
          />
        </div>

        <div className="gp-table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>{t('Id')}</th>
                <th>{t('ERP Order ID')}</th>
                <th>{t('ERP Customer ID')}</th>
                <th>{t('Amount')}</th>
              </tr>
            </thead>
            <tbody>
              {customerOrders?.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '10px', textAlign: 'center' }}>{t('No Sales Order Found for this customer')}</td>
                </tr>
              ) : (
                customerOrders?.map((order) => (
                  <tr key={order.id} style={{ backgroundColor: isOrderSelected(order.id) ? "#f0f8ff" : "transparent" }}>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isOrderSelected(order.id)}
                        onChange={e => handleOrderCheck(order, e.target.checked)}
                        style={{ cursor: "pointer" }}
                        onFocus={() => {
                          if (window.innerWidth <= 768) {
                            document.body.classList.add("keyboard-open");
                          }
                        }}
                        onKeyDown={handleKeyDown}
                        onBlur={() => {
                          document.body.classList.remove("keyboard-open");
                        }}
                      />
                    </td>
                    <td style={{ padding: '10px' }}>{order.id}</td>
                    <td style={{ padding: '10px' }}>{order.erpOrderId}</td>
                    <td style={{ padding: '10px' }}>{order.erpCustId}</td>
                    <td style={{ padding: '10px' }}>{parseFloat(order.totalAmount || 0).toFixed(2)}</td>
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
  background: rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.gp-modal {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-white);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  width: 700px;
  max-width: 95vw;
  height: 600px;
  max-height: 85vh;
  z-index: 1001;
  padding: 0;
  animation: gp-fadein 0.2s;
  display: flex;
  flex-direction: column;
}
  @media (max-width: 768px) {
          .gp-modal {
          top: 25% !important;
          }
      }

@keyframes gp-fadein {
  from { opacity: 0; transform: translate(-50%, -60%);}
  to { opacity: 1; transform: translate(-50%, -50%);}
}

.gp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 28px 10px 28px;
  flex-shrink: 0;
}

.gp-title {
  font-size: 1.25rem;
  font-weight: light;
}

.gp-header-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gp-select-btn {
  padding: 7px 10px;
  border-radius: 6px;
  border: 1px solid var(--logo-deep-green);
  background: var(--logo-deep-green);
  color: white;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s;
}

.gp-select-btn:hover:not(:disabled) {
  background: var(--logo-light-green);
}

.gp-select-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gp-close-btn {
  padding: 7px 10px;
  border-radius: 6px;
  border: 1px solid #bbb;
  background: #fff;
  color: #222;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s;
}

.gp-close-btn:hover:not(:disabled) {
  background: #f2f2f2;
}

.gp-close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gp-table-container {
  margin: 10px 28px;
  padding: 8px;
  border: 1.9px solid #eee;
  border-radius: 10px;
  overflow-y: auto;
  flex: 1;
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
  background-color: #f0f8ff !important;
}

.gp-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px 28px 22px 28px;
  gap: 12px;
  flex-shrink: 0;
}

.gp-modal input[type="text"],
.gp-modal input[type="number"] {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .gp-modal {
    width: 95vw;
    height: 85vh;
  }

  .gp-table-container {
    font-size: 0.85rem;
  }

  .gp-title {
    font-size: 1rem;
  }

  .gp-header-buttons {
    flex-direction: row;
  }

  .gp-close-btn,
  .gp-select-btn {
    font-size: 0.75rem;
    padding: 6px 8px;
  }
}
`
        } </style>
    </div>
  );
}

export default GetSalesOrder;
