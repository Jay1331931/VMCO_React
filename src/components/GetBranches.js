import React, { useState, useEffect, useRef } from 'react';
import '../styles/components.css';
import Pagination from './Pagination';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

function GetBranches({ open, onClose, onSelectBranch, customerId, API_BASE_URL, t = (x) => x }) {
  const { i18n } = useTranslation();
  const { token } = useAuth();
  const isRTL = i18n.language === 'ar';
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
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
    if (open && customerId) {
      fetchBranches();
    }
  }, [open, customerId, pagination.page, pagination.pageSize, searchQuery]);

  const fetchBranches = async () => {
    if (!customerId) {
      setError("No customer selected. Please select a customer first.");
      setBranches([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Use the same API as Catalog: /customer-branches/pagination with filters
      const filters = encodeURIComponent(JSON.stringify({ customerId: customerId }));
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const url = `${API_BASE_URL}/customer-branches/pagination?filters=${filters}&page=${pagination.page}&pageSize=${pagination.pageSize}${searchParam}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
        
      });
      if (!response.ok) throw new Error('Failed to fetch branches');
      const result = await response.json();
      // Handle different possible response structures
      let branchesData = [];
      let totalRecords = 0;
      if (Array.isArray(result)) {
        branchesData = result;
        totalRecords = result.length;
      } else if (result.status === 'Ok' && Array.isArray(result.data)) {
        branchesData = result.data;
        totalRecords = result.totalRecords || result.data.length;
      } else if (result && Array.isArray(result.data)) {
        branchesData = result.data;
        totalRecords = result.data.length;
      } else {
        branchesData = [];
        totalRecords = 0;
      }
      setBranches(branchesData);
      setPagination(prev => ({ ...prev, total: totalRecords }));
    } catch (err) {
      console.error('Error fetching branches:', err);
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
      <div className="gb-backdrop" onClick={onClose} />
      <div className="gb-modal">
        <div className="gb-header">
          <span className="gb-title">{t("Select a Branch")}</span>
          <button
            className="gb-close-btn"
            onClick={onClose}
            style={{ marginLeft: isRTL ? '0' : 'auto', marginRight: isRTL ? 'auto' : '0' }}
          >
            {t("Close")}
          </button>
        </div>
        <div style={{ padding: "0 28px 10px 28px" }}>
          <input
            type="text"
            placeholder={t("Search branches...")}
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
        <div className="gb-table-container">
          {loading ? (
            <div style={{ padding: 24 }}>{t("Loading...")}</div>
          ) : error ? (
            <div style={{ padding: 24, color: 'red' }}>{error}</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{t('Branch ID')}</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{t('ERP Branch ID')}</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{t('Branch Name')}</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}></th>
                </tr>
              </thead>
              <tbody>
                {branches.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '10px', textAlign: 'center' }}>
                      {customerId ? t('No branches found for this customer') : t('Please select a customer first')}
                    </td>
                  </tr>
                ) : (
                  branches.map((branch) => {
                    const status = (branch.branchStatus || '').toLowerCase();
                    const isApproved = status === 'approved';
                    return (
                      <tr key={branch.id}>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{branch.id}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{branch.erp_branch_id || branch.erpBranchId || '-'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                          {isRTL 
                            ? (branch.branch_name_lc || branch.branchNameLc)
                            : (branch.branch_name_en || branch.branchNameEn)
                          }
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd', 
                          // position: 'sticky', right: 0, zIndex: 5, background: 'white', boxShadow: '-1px 0 8px rgba(0, 0, 0, .98)' 
                          }}>
                          <button
                            className="gb-branch-btn"
                            onClick={() => onSelectBranch(branch)}
                            disabled={!isApproved || !branch.erpBranchId}
                            title={isApproved ? '' : t('Branch is either inactive or not approved')}
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
        <div className="gb-footer">
          {totalPages > 0 && (
            <Pagination
              currentPage={Number(pagination.page)}
              totalPages={totalPages}
              onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))
              }
              startIndex={(pagination.page - 1) * pagination.pageSize + 1}
              endIndex={Math.min(pagination.page * pagination.pageSize, pagination.total)}
              totalItems={pagination.total}
            />
          )}
        </div>
      </div>

      <style>{`
        .gb-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.15);
          z-index: 1000;
        }
        .gb-modal {
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
          animation: gb-fadein 0.2s;
        }
        @keyframes gb-fadein {
          from { opacity: 0; transform: translate(-50%, -60%);}
          to { opacity: 1; transform: translate(-50%, -50%);}
        }
        .gb-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 22px 28px 10px 28px;
        }
        .gb-title {
          font-size: 1.25rem;
          font-weight: light;
        }
        .gb-table-container {
          margin: 10px 28px;
          padding: 6px;
          border: 1.9px solid #eee;
          border-radius: 10px;
          max-height: 400px;
          overflow-y: auto;
        }
        .gb-branch-btn {
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
        .gb-branch-btn:hover {
          background: #084532;
        }
        .gb-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 28px 22px 28px;
        }
        .gb-close-btn {
          padding: 7px 18px;
          border-radius: 6px;
          border: 1px solid #bbb;
          background: #fff;
          color: #222;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .gb-close-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .gb-close-btn:hover:not(:disabled) {
          background: #f2f2f2;
        }
      `}</style>
    </div>
  );
}

export default GetBranches;

