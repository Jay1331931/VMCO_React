import React, { useEffect, useState, useRef } from "react";
import Pagination from "./Pagination";
import SearchableDropdown from "./SearchableDropdown";
import { useTranslation } from 'react-i18next';
import Constants from "../constants";

function GetProducts({
  open,
  onClose,
  onSelectProduct,
  API_BASE_URL,
  token,
  customerId,
  entity,
  category,
  t = (x) => x,
  machineMode
}) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Product states
  const [backendProducts, setBackendProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0
  });
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Category/subcategory states (matching catalog)
  const [categoryEnOptions, setCategoryEnOptions] = useState([]);
  const [categoryArOptions, setCategoryArOptions] = useState([]);
  const [subCategoryEnOptions, setSubCategoryEnOptions] = useState([]);
  const [subCategoryArOptions, setSubCategoryArOptions] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");

  const debounceTimeout = useRef();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Refs to track current values (matching catalog pattern)
  const categoryFilterRef = useRef(categoryFilter);
  const subCategoryFilterRef = useRef(subCategoryFilter);

  // Update refs when filters change
  useEffect(() => {
    categoryFilterRef.current = categoryFilter;
  }, [categoryFilter]);

  useEffect(() => {
    subCategoryFilterRef.current = subCategoryFilter;
  }, [subCategoryFilter]);

  // Clear selected products when modal closes
  useEffect(() => {
    if (!open) setSelectedProducts([]);
  }, [open]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Product selection handlers
  const handleProductCheck = (product, isChecked) => {
    if (machineMode) {
      if (isChecked) {
        setSelectedProducts([product]);
      } else {
        setSelectedProducts([]);
      }
    } else {
      if (isChecked) {
        setSelectedProducts(prev => [...prev, product]);
      } else {
        setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
      }
    }
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedProducts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newProducts = backendProducts.filter(p => !existingIds.has(p.id));
        return [...prev, ...newProducts];
      });
    } else {
      setSelectedProducts(prev => {
        const currentPageIds = new Set(backendProducts.map(p => p.id));
        return prev.filter(p => !currentPageIds.has(p.id));
      });
    }
  };

  const areAllSelected = backendProducts.length > 0 &&
    backendProducts.every(product => selectedProducts.some(p => p.id === product.id));

  const handleSelectProducts = () => {
    if (selectedProducts.length === 0) {
      alert(t("Please select at least one product."));
      return;
    }
    onSelectProduct(selectedProducts);
    setSelectedProducts([]);
    onClose();
  };

  const isProductSelected = (productId) => {
    return selectedProducts.some(p => p.id === productId);
  };

  // Debounce search input
  useEffect(() => {
    if (!open) return;
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setSearchQuery(search);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(debounceTimeout.current);
  }, [search, open]);

  // ✅ FETCH CATEGORIES - Matching catalog logic exactly
  const fetchCategories = async () => {
    if (!entity) {
      setCategoryEnOptions([]);
      setCategoryArOptions([]);
      return;
    }

    try {
      const params = new URLSearchParams({ entity: entity });

      // Handle VMCO entity special cases (matching catalog)
      if (entity === Constants.ENTITY.VMCO) {
        if (category?.toLowerCase().includes('machine')) {
          params.append("isMachine", true);
        } else {
          params.append("isMachine", false);
        }
      }

      const response = await fetch(
        `${API_BASE_URL}/product-categories?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch categories");

      const result = await response.json();

      // English options
      const optionsEn = Array.isArray(result.data)
        ? result.data.map(cat => ({
          name: cat.categoryCodeEn,
          value: cat.categoryCodeEn,
          sequenceId: cat.sequenceId,
          id: cat.id,
          codeEn: cat.categoryCodeEn,
          codeAr: cat.categoryCodeAr
        }))
        : [];

      // Arabic options
      const optionsAr = Array.isArray(result.data)
        ? result.data.map(cat => ({
          name: cat.categoryCodeAr,
          value: cat.categoryCodeEn, // value stays in English for API consistency
          sequenceId: cat.sequenceId,
          id: cat.id,
          codeEn: cat.categoryCodeEn,
          codeAr: cat.categoryCodeAr
        }))
        : [];

      setCategoryEnOptions(optionsEn);
      setCategoryArOptions(optionsAr);
    } catch (err) {
      setCategoryEnOptions([]);
      setCategoryArOptions([]);
      console.error("Error fetching categories:", err);
    }
  };

  // ✅ FETCH SUBCATEGORIES - Matching catalog logic exactly
  const fetchSubCategories = async () => {
    if (!entity) {
      setSubCategoryEnOptions([]);
      setSubCategoryArOptions([]);
      return;
    }

    // Find selected category to get sequenceId
    const selectedCategory = categoryEnOptions.find((cat) => cat.value === categoryFilter);
    const categoryCodeEn = selectedCategory?.codeEn;

    if (!categoryCodeEn) {
      setSubCategoryEnOptions([]);
      setSubCategoryArOptions([]);
      return;
    }

    try {
      const params = new URLSearchParams({
        entity: entity,
        categoryCodeEn: categoryCodeEn
      });

      const response = await fetch(
        `${API_BASE_URL}/product-subcategories?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch subcategories");

      const result = await response.json();

      // English options
      const optionsEn = Array.isArray(result.data)
        ? result.data.map(sub => ({
          name: sub.subCategoryCodeEn,
          value: sub.subCategoryCodeEn,
          sequenceId: sub.sequenceId,
          codeEn: sub.subCategoryCodeEn,
          codeAr: sub.subCategoryCodeAr
        }))
        : [];

      // Arabic options
      const optionsAr = Array.isArray(result.data)
        ? result.data.map(sub => ({
          name: sub.subCategoryCodeAr,
          value: sub.subCategoryCodeEn,
          sequenceId: sub.sequenceId,
          codeEn: sub.subCategoryCodeEn,
          codeAr: sub.subCategoryCodeAr
        }))
        : [];

      setSubCategoryEnOptions(optionsEn);
      setSubCategoryArOptions(optionsAr);
    } catch (err) {
      setSubCategoryEnOptions([]);
      setSubCategoryArOptions([]);
      console.error("Error fetching subcategories:", err);
    }
  };

  // Load categories when modal opens
  useEffect(() => {
    if (open && entity && !machineMode) {
      fetchCategories();
      setCategoryFilter("");
      setSubCategoryFilter("");
    }
  }, [open, entity, machineMode]);

  // Load subcategories when category changes (matching catalog)
  useEffect(() => {
    if (categoryFilter && !machineMode) {
      fetchSubCategories();
      setSubCategoryFilter(""); // Reset subcategory when category changes
    } else if (!machineMode) {
      setSubCategoryEnOptions([]);
      setSubCategoryArOptions([]);
    }
  }, [categoryFilter, entity, machineMode, categoryEnOptions]);

  // Clear subcategory when category is cleared (matching catalog)
  useEffect(() => {
    if (!categoryFilter) {
      setSubCategoryFilter("");
      setSubCategoryEnOptions([]);
      setSubCategoryArOptions([]);
    }
  }, [categoryFilter]);

  // ✅ FETCH PRODUCTS - Matching catalog filtering logic
  const fetchProducts = async () => {
    if (!open) return;
    setProductLoading(true);

    try {
      // Get current filter values from refs (avoiding stale closure)
      const currentCategoryFilter = categoryFilterRef.current || "";
      const currentSubCategoryFilter = subCategoryFilterRef.current || "";

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        sortBy: "id",
        sortOrder: "asc"
      });

      // Add entity filter
      if (entity) {
        params.append("entity", entity);
      }

      // Handle VMCO entity special cases (matching catalog)
      if (entity === Constants.ENTITY.VMCO) {
        if (category?.toLowerCase().includes('machine')) {
          params.append("isMachine", true);
        } else if (category?.toLowerCase().includes('consumable')) {
          params.append("isMachine", false);
        }
      }

      // Handle SHC entity special cases
      if (entity === Constants.ENTITY.SHC) {
        if (category?.toLowerCase().includes('fresh')) {
          params.append("isFresh", true);
        } else if (category?.toLowerCase().includes('frozen')) {
          params.append("isFresh", false);
        }
      }

      // ✅ Add category filter with safe string check (matching catalog)
      if (currentCategoryFilter && typeof currentCategoryFilter === 'string' && currentCategoryFilter.trim()) {
        params.append("category", currentCategoryFilter.trim());
        console.log('Category filter applied:', currentCategoryFilter.trim());
      }

      // ✅ Add subcategory filter with safe string check (matching catalog)
      if (currentSubCategoryFilter && typeof currentSubCategoryFilter === 'string' && currentSubCategoryFilter.trim()) {
        params.append("subCategory", currentSubCategoryFilter.trim());
        console.log('Subcategory filter applied:', currentSubCategoryFilter.trim());
      }

      // Add search query (matching catalog)
      if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim()) {
        params.append("search", searchQuery.trim());
        params.append("searchFields", "productName,productname,productnamelc,productNameLc");
      }

      console.log('API URL:', `${API_BASE_URL}/products?${params.toString()}`);
      console.log('Filters:', { category: currentCategoryFilter, subCategory: currentSubCategoryFilter });

      const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const result = await response.json();
      console.log('API Response:', result);

      // Parse response (matching catalog)
      let productsFromApi = [];
      let totalCount = 0;

      if (result?.data) {
        if (Array.isArray(result.data.data)) {
          productsFromApi = result.data.data;
          totalCount = result.data.totalRecords || result.data.total || 0;
        } else if (Array.isArray(result.data)) {
          productsFromApi = result.data;
          totalCount = result.total || result.pagination?.total || productsFromApi.length;
        }
      }

      // Add "Others" option for machine mode
      if (machineMode) {
        if (!productsFromApi.some(p => p.id === "others")) {
          productsFromApi.push({ id: "others", productName: "Others", productNameLc: "أخرى" });
        }
      }

      setBackendProducts(productsFromApi);
      setPagination(prev => ({
        ...prev,
        total: totalCount,
      }));
    } catch (error) {
      console.error("Error fetching products:", error);
      setBackendProducts([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setProductLoading(false);
    }
  };

  // Fetch products when dependencies change
  useEffect(() => {
    fetchProducts();
  }, [open, pagination.page, pagination.pageSize, searchQuery, categoryFilter, subCategoryFilter, entity, category, machineMode]);

  const handleKeyDown = (e) => {
    if (["Enter", "Go", "Search", "Done"].includes(e.key)) {
      if (window.innerWidth <= 768) {
        e.target.blur();
        document.body.classList.remove("keyboard-open");
      }
    }
  };

  if (!open) return null;

  const { page, pageSize, total } = pagination;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;

  // Dynamically select categories based on language (matching catalog)
  const categories = i18n.language === 'ar' ? categoryArOptions : categoryEnOptions;
  const subcategories = i18n.language === 'ar' ? subCategoryArOptions : subCategoryEnOptions;

  return (
    <div>
      <div className="gp-backdrop" onClick={onClose} />
      <div className="gp-modal">
        <div className="gp-header">
          <span className="gp-title">{t("Select Products")}</span>
          <div className="gp-header-buttons">
            <button className="gp-close-btn" onClick={onClose}>
              {t("Cancel")}
            </button>
            <button
              className="gp-select-btn"
              onClick={handleSelectProducts}
              disabled={selectedProducts.length === 0}
              style={{
                marginRight: isRTL ? '0' : '8px',
                marginLeft: isRTL ? '8px' : '0',
                opacity: selectedProducts.length === 0 ? 0.5 : 1,
                cursor: selectedProducts.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {t("Select")} ({selectedProducts.length})
            </button>
          </div>
        </div>

        <div style={{ padding: "0 28px 10px 28px" }}>
          <input
            type="text"
            placeholder={t("Search products...")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => window.innerWidth <= 768 && document.body.classList.add("keyboard-open")}
            onKeyDown={handleKeyDown}
            onBlur={() => document.body.classList.remove("keyboard-open")}
            style={{
              width: "100%",
              padding: "8px 10px",
              marginBottom: 10,
              borderRadius: 4,
              border: "1px solid #ddd"
            }}
          />

          {!machineMode && (
            <div className="gp-filters-row">
              <SearchableDropdown
                id="category-filter"
                name="categoryFilter"
                options={categories}
                className={isMobile ? "mobile-select-branch location-select" : "category-filter"}
                placeholder={t("Category")}
                value={categoryFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  console.log('Category selected:', value); // Debug
                  setCategoryFilter(value);
                  setSubCategoryFilter(""); // Reset subcategory
                  if (!value) {
                    setSubCategoryEnOptions([]);
                    setSubCategoryArOptions([]);
                  }
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              />

              <SearchableDropdown
                id="subcategory-filter"
                name="subCategoryFilter"
                options={subcategories}
                className={isMobile ? "mobile-select-branch location-select" : "category-filter"}
                placeholder={!categoryFilter ? t("Select category first") : t("Sub category")}
                value={subCategoryFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  console.log('Subcategory selected:', value); // Debug
                  setSubCategoryFilter(value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                disabled={!categoryFilter || (subCategoryEnOptions.length === 0 && subCategoryArOptions.length === 0)}
              />
            </div>
          )}
        </div>

        <div className="gp-table-container">
          {productLoading ? (
            <div style={{ padding: 24 }}>{t("Loading...")}</div>
          ) : (
            <>
              {!machineMode && backendProducts.length > 0 && (
                <div className="gp-select-all" style={{ padding: "8px 12px", borderBottom: "1px solid #eee" }}>
                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={areAllSelected}
                      onChange={e => handleSelectAll(e.target.checked)}
                      style={{ marginRight: isRTL ? "0" : "8px", marginLeft: isRTL ? "8px" : "0" }}
                    />
                    <span style={{ fontWeight: "bold", fontSize: "14px" }}>
                      {t("Select All")} ({backendProducts.length})
                    </span>
                  </label>
                </div>
              )}

              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {backendProducts.map(product => (
                  <li key={product.id}>
                    <label
                      className="gp-product-item"
                      style={{
                        display: "flex", alignItems: "center",
                        padding: "8px 12px", cursor: "pointer",
                        backgroundColor: isProductSelected(product.id) ? "#f0f8ff" : "#f9f9f9",
                        border: "1px solid #ddd", borderRadius: "4px",
                        marginBottom: "8px", transition: "background-color 0.15s"
                      }}
                    >
                      <input
                        type={machineMode ? "radio" : "checkbox"}
                        checked={isProductSelected(product.id)}
                        onChange={e => handleProductCheck(product, e.target.checked)}
                        style={{
                          marginRight: isRTL ? "0" : "12px",
                          marginLeft: isRTL ? "12px" : "0",
                          cursor: "pointer"
                        }}
                        name={machineMode ? "singleSelectProduct" : undefined}
                      />
                      <span
                        style={{
                          flex: 1,
                          textAlign: isRTL ? 'right' : 'left',
                          fontSize: isMobile ? "0.7rem" : "1rem"
                        }}
                      >
                        {i18n.language === 'ar' ?
                          `${product.id} - ${product.productNameLc || product.productName}` :
                          `${product.id} - ${product.productName}`
                        }
                      </span>
                    </label>
                  </li>
                ))}
                {backendProducts.length === 0 && (
                  <li style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                    {t("No products found.")}
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
              onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
              startIndex={(page - 1) * pageSize + 1}
              endIndex={Math.min(page * pageSize, total)}
              totalItems={total}
            />
          )}
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
        .gp-filters-row {
          display: flex;
          justify-content: space-between;
          gap: auto;
        }
        .gp-dropdown-container {
          position: relative;
          flex: 1;
        }
        .gp-dropdown-header {
          position: relative;
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        .gp-dropdown-input {
          width: 100%;
          padding: 8px 30px 8px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
        }
        .gp-dropdown-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
        .gp-dropdown-arrow {
          position: absolute;
          right: 8px;
          font-size: 12px;
          color: #666;
          transition: transform 0.2s;
        }
        .gp-dropdown-arrow.open {
          transform: rotate(180deg);
        }
        .gp-clear-btn {
          position: absolute;
          right: 25px;
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gp-clear-btn:hover {
          color: #666;
        }
        .gp-dropdown-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          max-height: 200px;
          overflow-y: auto;
          z-index: 1002;
        }
        .gp-dropdown-item {
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
          border-bottom: 1px solid #f0f0f0;
        }
        .gp-dropdown-item:last-child {
          border-bottom: none;
        }
        .gp-dropdown-item:hover {
          background-color: #f5f5f5;
        }
        .gp-dropdown-item.selected {
          background-color: #e3f2fd;
        }
        .gp-dropdown-item.disabled {
          color: #999;
          cursor: default;
        }
        .gp-dropdown-item.disabled:hover {
          background-color: transparent;
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
        @media(max-width: 768px) {
          .gp-filters-row {
            flex-direction: column;
            gap: 10px;
            align-items: center;
          }
        }
      `}</style>
      </div>
    </div>
  );
}

export default GetProducts;