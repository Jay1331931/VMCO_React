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
  t = (x) => x, // fallback translation
  machineMode // new prop, true or falsy
}) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [backendProducts, setBackendProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [hideMenu, setHideMenu] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Category and Subcategory filters
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [subcategorySearch, setSubcategorySearch] = useState("");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [subcategoryDropdownOpen, setSubcategoryDropdownOpen] = useState(false);

  const debounceTimeout = useRef();
  const categoryDropdownRef = useRef();
  const subcategoryDropdownRef = useRef();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  // Clear selected products when modal closes
  useEffect(() => {
    if (!open) setSelectedProducts([]);
  }, [open]);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    console.log("isMobile", isMobile);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // For single-selection mode (machineMode), only allow one selected product
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

  // Normal select all for multi-select mode
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

  const getApiParameters = () => {
    const params = {};
    if (entity?.toLowerCase() === Constants.ENTITY.VMCO?.toLowerCase()) {
      if (category?.toLowerCase() === "vmco machines") params.isMachine = true;
      else if (category?.toLowerCase() === "vmco consumables") params.isMachine = false;
    } else if (entity?.toLowerCase() === Constants.ENTITY.SHC?.toLowerCase()) {
      if (category?.toLowerCase() === "shc - fresh") params.isFresh = true;
      else if (category?.toLowerCase() === "shc - frozen") params.isFresh = false;
    }
    return params;
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
      if (subcategoryDropdownRef.current && !subcategoryDropdownRef.current.contains(event.target)) {
        setSubcategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch categories based on entity (disable in machineMode)
  const fetchCategories = async () => {
    if (!entity || machineMode) {
      setCategories([]); return;
    }
    try {
      const params = new URLSearchParams({ entity });
      const apiParams = getApiParameters();
      params.append("isCategory", true);
      if (apiParams.isMachine !== undefined) params.append("isMachine", apiParams.isMachine);
      if (apiParams.isFresh !== undefined) params.append("isFresh", apiParams.isFresh);
      const response = await fetch(`${API_BASE_URL}/product-categories?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (result?.data && Array.isArray(result.data)) {
        setCategories(result.data.map(cat => ({
          name: cat.category || cat.name || cat,
          value: cat.category || cat.name || cat,
        })));
      }
    } catch { setCategories([]); }
  };

  // Fetch subcategories based on selected category and entity (disable in machineMode)
  const fetchSubcategories = async (categoryValue) => {
    if (!categoryValue || !entity || machineMode) {
      setSubcategories([]); return;
    }
    try {
      const params = new URLSearchParams({
        entity: entity, category: categoryValue
      });
      const apiParams = getApiParameters();
      if (apiParams.isMachine !== undefined) params.append("isMachine", apiParams.isMachine);
      if (apiParams.isFresh !== undefined) params.append("isFresh", apiParams.isFresh);
      const response = await fetch(`${API_BASE_URL}/product-subcategories?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (result?.data && Array.isArray(result.data)) {
        setSubcategories(result.data.map(sub => ({
          name: sub.subCategory || sub.subcategory || sub.name || sub,
          value: sub.subCategory || sub.subcategory || sub.name || sub,
        })));
      }
    } catch { setSubcategories([]); }
  };

  useEffect(() => {
    if (open && entity && !machineMode) {
      fetchCategories();
      setSelectedCategory("");
      setSelectedSubcategory("");
      setCategorySearch("");
      setSubcategorySearch("");
    }
  }, [open, API_BASE_URL, token, entity, category, machineMode]);

  useEffect(() => {
    if (selectedCategory && !machineMode) {
      fetchSubcategories(selectedCategory);
      setSelectedSubcategory("");
      setSubcategorySearch("");
    } else if (!machineMode) {
      setSubcategories([]);
    }
  }, [selectedCategory, entity, machineMode]);

  const fetchProducts = async () => {
    if (!open) return;
    setProductLoading(true);
    try {
      const filters = {
        customerId: parseInt(customerId),
        entity: entity
      };
      if (selectedCategory && !machineMode) filters.categoryId = parseInt(selectedCategory);
      if (selectedSubcategory && !machineMode) filters.subcategoryId = parseInt(selectedSubcategory);
      const apiParams = getApiParameters();
      const params = new URLSearchParams({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: searchQuery,
        filters: JSON.stringify(filters),
        sortBy: "id",
        sortOrder: "asc"
      });
      if (apiParams.isMachine !== undefined) params.append("isMachine", apiParams.isMachine);
      if (apiParams.isFresh !== undefined) params.append("isFresh", apiParams.isFresh);
      if (entity) params.append("entity", entity);
      if (selectedCategory && !machineMode) params.append("category", selectedCategory);
      if (selectedSubcategory && !machineMode) params.append("subCategory", selectedSubcategory);
      if (searchQuery) params.append("searchFields", "productName,product_name,product_name_lc,productNameLc");
      const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      const result = await response.json();

      let productsFromApi = [];
      if (result?.data?.data && Array.isArray(result.data.data)) {
        productsFromApi = result.data.data;
      }

      if (machineMode) {
        productsFromApi = productsFromApi || [];
        if (!productsFromApi.some(p => p.id === "others")) {
          productsFromApi.push({ id: "others", productName: "Others" });
        }
      } 
      setBackendProducts(productsFromApi);
      setPagination(prev => ({
        ...prev,
        total: result.data.totalRecords || productsFromApi.length,
      }));
    } catch (error) {
      setBackendProducts([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setProductLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [open, API_BASE_URL, token, pagination.page, pagination.pageSize, searchQuery, selectedCategory, selectedSubcategory, entity, category, machineMode]);

  // Filter support:
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );
  const filteredSubcategories = subcategories.filter(subcat =>
    subcat.name.toLowerCase().includes(subcategorySearch.toLowerCase())
  );

  // Handlers for dropdown
  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat.value);
    setCategorySearch(cat.name);
    setCategoryDropdownOpen(false);
    setSelectedSubcategory("");
    setSubcategorySearch("");
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  const handleSubcategorySelect = (subcat) => {
    setSelectedSubcategory(subcat.value);
    setSubcategorySearch(subcat.name);
    setSubcategoryDropdownOpen(false);
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  const clearCategoryFilter = () => {
    setSelectedCategory("");
    setCategorySearch("");
    setSelectedSubcategory("");
    setSubcategorySearch("");
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  const clearSubcategoryFilter = () => {
    setSelectedSubcategory("");
    setSubcategorySearch("");
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (!open) return null;
  const { page, pageSize, total } = pagination;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;

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
                marginRight: isRTL ? '0' : '8px', marginLeft: isRTL ? '8px' : '0',
                opacity: selectedProducts.length === 0 ? 0.5 : 1,
                cursor: selectedProducts.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {t("Select")} ({selectedProducts.length})
            </button>
          </div>
        </div>

        {/* Hide category/subcategory/search if machineMode */}
        
          <div style={{ padding: "0 28px 10px 28px" }}>
            <input
              type="text"
              placeholder={t("Search products...")}
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

            {!machineMode && (
            <div className="gp-filters-row">
              <SearchableDropdown
setHideMenu={setHideMenu}
                id="category-filter"
                name="categoryFilter"
                options={categories}
                className={isMobile ? "mobile-select-branch location-select" : "category-filter"}
                placeholder={t("Category")}
                value={selectedCategory}
                onChange={e => {
                  const newCategoryValue = e.target.value;
                  setSelectedCategory(newCategoryValue);
                  setSelectedSubcategory("");
                  if (!newCategoryValue) setSubcategories([]);
                }}
              />

              <SearchableDropdown
setHideMenu={setHideMenu}
                id="subcategory-filter"
                name="subCategoryFilter"
                options={subcategories}
                className={isMobile ? "mobile-select-branch location-select" : "category-filter"}
                placeholder={!selectedCategory ? t("Select category first") : t("Sub category")}
                value={selectedSubcategory}
                onChange={e => setSelectedSubcategory(e.target.value)}
                disabled={!selectedCategory || subcategories.length === 0}
              />
            </div>
            )}
          </div>

        <div className="gp-table-container">
          {productLoading ? (
            <div style={{ padding: 24 }}>{t("Loading...")}</div>
          ) : (
            <>
              {/* Select All Checkbox: hidden in machineMode */}
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
                          fontSize: isMobile ? "0.7rem":"1rem"
                        }}
                      >
                        {i18n.language === 'ar' ?
                          `${product.id} - ${product.productNameLc || product.productName}` :
                          `${product.id} - ${product.productName}`}
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

        {/* Footer with Pagination */}
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
  );
}

export default GetProducts;
