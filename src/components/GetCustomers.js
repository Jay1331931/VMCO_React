import React, { useState, useEffect, useRef } from 'react';
import '../styles/components.css';
import Pagination from './Pagination';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';


function GetCustomers({ open, onClose, onSelectCustomer, API_BASE_URL, apiEndpoint, apiParams, t = (x) => x }) {
  const { i18n } = useTranslation();
  const { token } = useAuth();
  const isRTL = i18n.language === 'ar';
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: apiParams?.page || 1,
    pageSize: apiParams?.pageSize || 10,
    total: 0
  });
  const debounceTimeout = useRef();

  // Debounce search input
  useEffect(() => {
    if (!open) return;
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setSearchQuery(search);
      setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(debounceTimeout.current);
  }, [search, open]);

  useEffect(() => {
    if (open) {
      fetchCustomers();
    }
  }, [open, pagination.page, pagination.pageSize, searchQuery]);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the provided apiParams and add pagination and search parameters
      const params = new URLSearchParams({
        ...apiParams,
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: searchQuery
      });

      const url = `${API_BASE_URL}${apiEndpoint}?${params.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        
      });
      
      if (!response.ok) throw new Error('Failed to fetch customers');
      
      const result = await response.json();
      if (result.status === 'Ok' && result.data) {
        setCustomers(result.data.data);
        setPagination(prev => ({
          ...prev,
          total: result.data.totalRecords,
        }));
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // Calculate totalPages
  const totalPages = pagination.total > 0 ? Math.ceil(pagination.total / pagination.pageSize) : 1;

  return (
    <div>
      <div className="gp-backdrop" onClick={onClose} />
      <div className="gp-modal">
        <div className="gp-header">
          <span className="gp-title">{t("Select a Customer")}</span>
          <button
            className="gp-close-btn"
            onClick={onClose}
            style={{ marginLeft: isRTL ? '0' : 'auto', marginRight: isRTL ? 'auto' : '0' }}
          >
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
          {loading ? (
            <div style={{ padding: 24 }}>{t("Loading...")}</div>
          ) : error ? (
            <div style={{ padding: 24, color: 'red' }}>{error}</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{t('Customer ID')}</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{t('ERP Customer ID')}</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{t('Company Name')}</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}></th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '10px', textAlign: 'center' }}>{t('No customers found')}</td>
                  </tr>
                ) : (
                  customers.map((customer) => {
                    const status = (customer.customerStatus || '').toLowerCase();
                    const isApproved = status === 'approved';
                    return (
                      <tr key={customer.id}>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{customer.id}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{customer.erp_cust_id || customer.erpCustId || '-'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                          {isRTL 
                            ? (customer.company_name_ar || customer.companyNameAr)
                            : (customer.company_name_en || customer.companyNameEn)
                          }
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd', 
                          // position: 'sticky', right: 0, zIndex: 1, background: 'white'  
                          }}>
                          <button
                            className="gp-product-btn"
                            onClick={() => onSelectCustomer(customer)}
                            disabled={!isApproved}
                            title={isApproved ? '' : t('Customer is either inactive or not approved')}
                          >
                            {t('Select')}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="gp-footer">
          {totalPages > 0 && (
            <Pagination
              currentPage={Number(pagination.page)}
              totalPages={totalPages}
              onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
              startIndex={(pagination.page - 1) * pagination.pageSize + 1}
              endIndex={Math.min(pagination.page * pagination.pageSize, pagination.total)}
              totalItems={pagination.total}
            />
          )}
        </div>
      </div>

      <style>{`
        .gp-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.15);
          z-index: 1000;
        }
        .gp-modal {
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          width: 700px;
          max-width: 95vw;
          z-index: 1001;
          padding: 0;
          animation: gp-fadein 0.2s;
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
        }
        .gp-title {
          font-size: 1.25rem;
          font-weight: light;
        }
        .gp-table-container {
          margin: 10px 28px;
          padding: 6px;
          border: 1.9px solid #eee;
          border-radius: 10px;
          max-height: 400px;
          overflow-y: auto;
        }
          .gp-table-container table th:last-child,
.gp-table-container table td:last-child {
  position: sticky;
  right: 0;
  background: white;      /* Important: avoids overlap transparency */
  z-index: 5;             /* Keep above other cells */
  white-space: nowrap;
}
        .gp-product-btn {
          width: 100%;
          text-align: center;
          border-radius: 4px;
          background: #0a5640;
          cursor: pointer;
          border: none;
          color: white;
          padding: 6px 12px;
          font-size: 0.9rem;
          transition: background 0.15s;
        }
        .gp-product-btn:hover {
          background: #084532;
        }
        .gp-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 28px 22px 28px;
        }
        .gp-close-btn {
          padding: 7px 18px;
          border-radius: 6px;
          border: 1px solid #bbb;
          background: #fff;
          color: #222;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .gp-close-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .gp-close-btn:hover:not(:disabled) {
          background: #f2f2f2;
        }
      `}</style>
    </div>
  );
}

export default GetCustomers;