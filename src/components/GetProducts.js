import React, { useEffect, useState, useRef } from "react";

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
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // actual query sent to backend
  const [total, setTotal] = useState(0); // Initialize with 0 instead of undefined
  const debounceTimeout = useRef();

  // Debounce search input
  useEffect(() => {
    if (!open) return;
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setSearchQuery(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceTimeout.current);
  }, [search, open]);

  useEffect(() => {
    if (open) {
      setProductLoading(true);
      const params = new URLSearchParams({
        page: page, // changed 'Page' to 'page' for API param
        pageSize,
        search: searchQuery,
        sortBy: "id",
        sortOrder: "asc"
      });
      fetch(`${API_BASE_URL}/products?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("API response:", data); // Add logging to debug API response
          // Support both array and paginated object
          if (Array.isArray(data)) {
            setBackendProducts(data);
            setTotal(data.length);
          } else if (data && Array.isArray(data.data)) {
            setBackendProducts(data.data);
            // Try to get total from data.total, data.pagination.total, or fallback to data.data.length
            const backendTotal =
              (data.total !== undefined && Number(data.total)) ||
              (data.pagination && data.pagination.total !== undefined && Number(data.pagination.total)) ||
              data.data.length;
            console.log("Setting total to:", backendTotal); // Log the total being set
            setTotal(backendTotal);
          } else {
            setBackendProducts([]);
            setTotal(0);
          }
        })
        .catch(() => {
          setBackendProducts([]);
          setTotal(0);
        })
        .finally(() => setProductLoading(false));
    }
  }, [open, API_BASE_URL, token, page, pageSize, searchQuery]);

  if (!open) return null;

  // Calculate totalPages: 0 if no products, otherwise based on total and pageSize
  const totalPages = Math.max(1, Math.ceil(Number(total || 0) / Number(pageSize)));

  console.log("Pagination values:", { 
    page, 
    pageSize, 
    total, 
    calculatedTotalPages: totalPages 
  });

  return (
    <div>
      <div className="gp-backdrop" onClick={onClose} />
      <div className="gp-modal">
        <div className="gp-header">
          <span className="gp-title">{t("Select a Product")}</span>
        </div>
        <div style={{ padding: "0 28px 10px 28px" }}>
          <input
            type="text"
            placeholder={t("Search products...")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setSearchQuery(search);
                setPage(1);
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
        </div>
        <div className="gp-footer">
          <div style={{ flex: 1 }}>
            <span>
              {t("Page")} {totalPages === 0 ? 0 : page} {t("of")} {totalPages}
            </span>
          </div>
          <button
            className="gp-close-btn"
            onClick={onClose}
            style={{ marginLeft: 8 }}
          >
            {t("Close")}
          </button>
          <button
            className="gp-close-btn"
            onClick={() => setPage(page - 1)}
            disabled={Number(page) <= 1 || totalPages === 0}
            style={{ marginLeft: 8 }}
          >
            {t("Prev")}
          </button>
          <button
            className="gp-close-btn"
            onClick={() => setPage(page + 1)}
            disabled={Number(page) >= Number(totalPages) || totalPages === 0}
            style={{ marginLeft: 8 }}
          >
            {t("Next")}
          </button>
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
        }
        .gp-footer {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
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