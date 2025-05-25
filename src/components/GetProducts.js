import React, { useEffect, useState, useRef } from "react";
import Pagination from "./Pagination";

function GetProducts({
  open,
  onClose,
  onSelectProduct,
  API_BASE_URL,
  token,
  t = (x) => x // fallback translation
}) {  
  const [backendProducts, setBackendProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // actual query sent to backend
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

  
  // Function to fetch products with pagination
  const fetchProducts = async () => {
    if (!open) return;
    
    setProductLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: searchQuery,
        sortBy: "id",
        sortOrder: "asc"
      });
      
      const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
      });
      
      const data = await response.json();
      console.log("API response:", data);
      
      // Support both array and paginated object
      if (Array.isArray(data)) {
        setBackendProducts(data);
        setPagination(prev => ({
          ...prev,
          total: data.totalRecords
        }));
      } else if (data && Array.isArray(data.data)) {
        setBackendProducts(data.data);
        
      
        setPagination(prev => ({
          ...prev,
          total: data.totalRecords
        }));
      } else {
        setBackendProducts([]);
        setPagination(prev => ({
          ...prev,
          total: 0
        }));
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setBackendProducts([]);
      setPagination(prev => ({
        ...prev,
        total: 0
      }));
    } finally {
      setProductLoading(false);
    }
  };

  // Effect to trigger product fetch when relevant dependencies change
  useEffect(() => {
    fetchProducts();
  }, [open, API_BASE_URL, token, pagination.page, pagination.pageSize, searchQuery]);
  
  if (!open) return null;

  // Calculate totalPages based on total number of products and page size
  const { page, pageSize, total } = pagination;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;

  return (
    <div>
      <div className="gp-backdrop" onClick={onClose} />
      <div className="gp-modal">        <div className="gp-header">
          <span className="gp-title">{t("Select a Product")}</span>
          <button
            className="gp-close-btn"
            onClick={onClose}
            style={{ marginLeft: 'auto' }}
          >
            {t("Close")}
          </button>
        </div>
        <div style={{ padding: "0 28px 10px 28px" }}>
          <input
            type="text"
            placeholder={t("Search products...")}
            value={search}
            onChange={e => setSearch(e.target.value)}            onKeyDown={e => {
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
          {productLoading ? (
            <div style={{ padding: 24 }}>{t("Loading...")}</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {backendProducts.map((product) => (
                <li key={product.id}>
                  <button
                    className="gp-product-btn"
                    onClick={() => onSelectProduct(product)}
                  >
                    {product.id} - {product.productName}
                  </button>
                </li>
              ))}
              {backendProducts.length === 0 && <li>{t("No products found.")}</li>}
            </ul>
          )}
        </div>        <div className="gp-footer">
          {totalPages > 0 && (
            <Pagination
              currentPage={Number(page)}
              totalPages={totalPages}
              onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
              startIndex={(page - 1) * pageSize + 1}
              endIndex={Math.min(page * pageSize, total)}
              totalItems={total}
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
          width: 500px;
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
          max-height: 300px;
          overflow-y: auto;
        }
        .gp-product-btn {
          width: 100%;
          text-align: left;
          border-radius: 4px;
          background: #f9f9f9;
          cursor: pointer;
          border: 1px solid #ddd;
          padding: 8px 12px;
          margin-bottom: 8px;
          font-size: 1rem;
          transition: background 0.15s;
        }
        .gp-product-btn:hover {
          background: #f2f2f2;
        }        .gp-footer {
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

export default GetProducts;