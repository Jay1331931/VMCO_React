import React, { useEffect, useState, useRef } from "react";
import Pagination from "./Pagination";
import { useTranslation } from "react-i18next";

function GetSpareparts({
  open,
  onClose,
  onSelectSpareparts,
  API_BASE_URL,
  token
}) {
  const { t } = useTranslation();
  const isRTL = t.language === "ar";

  const [backendSpareparts, setBackendSpareparts] = useState([]);
  const [sparepartsLoading, setSparepartsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });

  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpareparts, setSelectedSpareparts] = useState([]);

  const debounceTimeout = useRef();
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  // Clear selected items on close
  useEffect(() => {
    if (!open) setSelectedSpareparts([]);
  }, [open]);

  // Responsive handling
  useEffect(() => {
    const handleResize = () =>
      setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSparepartCheck = (sparepart, isChecked) => {
    if (isChecked) {
      setSelectedSpareparts((prev) => [...prev, sparepart]);
    } else {
      setSelectedSpareparts((prev) =>
        prev.filter((p) => p.itemId !== sparepart.itemId)
      );
    }
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedSpareparts((prev) => {
        const existingIds = new Set(prev.map((p) => p.itemId));
        const newItems = backendSpareparts.filter(
          (p) => !existingIds.has(p.itemId)
        );
        return [...prev, ...newItems];
      });
    } else {
      setSelectedSpareparts((prev) => {
        const currentPageIds = new Set(
          backendSpareparts.map((p) => p.itemId)
        );
        return prev.filter((p) => !currentPageIds.has(p.itemId));
      });
    }
  };

  const areAllSelected =
    backendSpareparts.length > 0 &&
    backendSpareparts.every((sp) =>
      selectedSpareparts.some((p) => p.itemId === sp.itemId)
    );

  const handleSelectSpareparts = () => {
    if (selectedSpareparts.length === 0) {
      alert(t("Please select at least one spare part."));
      return;
    }
    onSelectSpareparts(selectedSpareparts);
    setSelectedSpareparts([]);
    onClose();
  };

  const isSparepartSelected = (itemId) =>
    selectedSpareparts.some((p) => p.itemId === itemId);

  // Debounce search
  useEffect(() => {
    if (!open) return;
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setSearchQuery(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(debounceTimeout.current);
  }, [search, open]);

  const fetchSpareparts = async () => {
    if (!open) return;
    setSparepartsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        pageSize: pagination.pageSize,
      });

      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(
        `${API_BASE_URL}/spare-parts/pagination?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      let sparepartsFromApi = [];
      if (
        result?.data?.data &&
        Array.isArray(result.data.data)
      ) {
        sparepartsFromApi = result.data.data;
      }

      setBackendSpareparts(sparepartsFromApi);
      setPagination((prev) => ({
        ...prev,
        total:
          result?.data?.totalRecords ??
          sparepartsFromApi.length,
      }));
    } catch (error) {
      setBackendSpareparts([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
    } finally {
      setSparepartsLoading(false);
    }
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

  useEffect(() => {
    fetchSpareparts();
  }, [
    open,
    API_BASE_URL,
    token,
    pagination.page,
    pagination.pageSize,
    searchQuery,
  ]);

  if (!open) return null;

  const { page, pageSize, total } = pagination;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;

  return (
    <div>
      <div className="gp-backdrop" onClick={onClose} />
      <div className="gp-modal">
        <div className="gp-header">
          <span className="gp-title">{t("Select Spare Parts")}</span>
          <div className="gp-header-buttons">
            <button
              className="gp-close-btn"
              onClick={onClose}
            >
              {t("Cancel")}
            </button>
            <button
              className="gp-select-btn"
              onClick={handleSelectSpareparts}
              disabled={selectedSpareparts.length === 0}
              style={{
                marginRight: isRTL ? "0" : "8px",
                marginLeft: isRTL ? "8px" : "0",
                opacity: selectedSpareparts.length === 0 ? 0.5 : 1,
                cursor:
                  selectedSpareparts.length === 0
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {t("Select")} ({selectedSpareparts.length})
            </button>
          </div>
        </div>

        <div style={{ padding: "0 28px 10px 28px" }}>
          <input
            type="text"
            placeholder={t("Search spare parts...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => {
              if (window.innerWidth <= 768) {
                // This could trigger hiding the bottom menu
                document.body.classList.add("keyboard-open");
              }
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              document.body.classList.remove("keyboard-open");
              // 👈 show menu again (optional)
            }}
            style={{
              width: "100%",
              padding: "8px 10px",
              marginBottom: 10,
              borderRadius: 4,
              border: "1px solid #ddd",
            }}
          />
        </div>

        <div className="gp-table-container">
          {sparepartsLoading ? (
            <div style={{ padding: 24 }}>{t("Loading...")}</div>
          ) : (
            <>
              {backendSpareparts.length > 0 && (
                <div
                  className="gp-select-all"
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={areAllSelected}
                      onChange={(e) =>
                        handleSelectAll(e.target.checked)
                      }
                      style={{
                        marginRight: isRTL ? "0" : "8px",
                        marginLeft: isRTL ? "8px" : "0",
                      }}
                    />
                    <span
                      style={{
                        fontWeight: "bold",
                        fontSize: "14px",
                      }}
                    >
                      {t("Select All")} (
                      {backendSpareparts.length})
                    </span>
                  </label>
                </div>
              )}

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                }}
              >
                {backendSpareparts.map((sp) => (
                  <li key={sp.itemId}>
                    <label
                      className="gp-product-item"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "8px 12px",
                        cursor: "pointer",
                        backgroundColor: isSparepartSelected(
                          sp.itemId
                        )
                          ? "#f0f8ff"
                          : "#f9f9f9",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        marginBottom: "8px",
                        transition: "background-color 0.15s",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSparepartSelected(sp.itemId)}
                        onChange={(e) =>
                          handleSparepartCheck(sp, e.target.checked)
                        }
                        style={{
                          marginRight: isRTL ? "0" : "12px",
                          marginLeft: isRTL ? "12px" : "0",
                          cursor: "pointer",
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          textAlign: isRTL ? "right" : "left",
                          fontSize: isMobile ? "0.7rem" : "1rem",
                        }}
                      >
                        {isRTL
                          ? `${sp.itemId} - ${sp.nameAr || sp.nameEn}`
                          : `${sp.itemId} - ${sp.nameEn}`}
                      </span>
                    </label>
                  </li>
                ))}
                {backendSpareparts.length === 0 && (
                  <li
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#666",
                    }}
                  >
                    {t("No spare parts found.")}
                  </li>
                )}
              </ul>
            </>
          )}
        </div>

        <div className="gp-footer">
          {totalPages > 0 && (
            <Pagination
              currentPage={Number(page)}
              totalPages={totalPages}
              onPageChange={(newPage) =>
                setPagination((prev) => ({
                  ...prev,
                  page: newPage,
                }))
              }
              startIndex={(page - 1) * pageSize + 1}
              endIndex={Math.min(page * pageSize, total)}
              totalItems={total}
            />
          )}
        </div>
      </div>

      {/* Reuse same styles as GetProducts to keep UI consistent */}
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
          background: var(--bg-white);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          width: 600px;
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
        .gp-table-container {
          margin: 10px 28px;
          padding: 6px;
          border: 1.9px solid #eee;
          border-radius: 10px;
          max-height: 300px;
          overflow-y: auto;
        }
        .gp-product-item:hover {
          background-color: #e8f4fd !important;
        }
        .gp-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0px 28px 22px 28px;
          gap: 12px;
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

export default GetSpareparts;
