import React, { useEffect, useState, useRef } from "react";
import Pagination from "./Pagination";
import SearchableDropdown from "./SearchableDropdown";
import { useTranslation } from 'react-i18next';

function GetProducts({
  open,
  onClose,
  onSelectProduct,
  API_BASE_URL,
  token,
  customerId,
  entity,
  category,
  t = (x) => x // fallback translation
}) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [backendProducts, setBackendProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // actual query sent to backend

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

  // Close dropdowns when clicking outside
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

  // Fetch categories based on entity
  const fetchCategories = async () => {
    if (!entity) {
      setCategories([]);
      return;
    }

    try {
      // Build query parameters like in catalog
      const params = new URLSearchParams({ entity: entity });
      
      // Add isMachine parameter for VMCO entity tabs (similar to catalog logic)
      if (entity === "VMCO") {
        if (category && category.toLowerCase() === "vmco machines") {
          params.append("isMachine", "true");
        } else {
          params.append("isMachine", "false");
        }
      }

      const response = await fetch(`${API_BASE_URL}/product-categories?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result?.data && Array.isArray(result.data)) {
        // Transform data to match SearchableDropdown format
        const options = result.data.map(cat => ({
          name: cat.category || cat.name || cat,
          value: cat.category || cat.name || cat,
        }));
        setCategories(options);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  // Fetch subcategories based on selected category and entity
  const fetchSubcategories = async (categoryValue) => {
    if (!categoryValue || !entity) {
      setSubcategories([]);
      return;
    }

    try {
      const params = new URLSearchParams({
        entity: entity,
        category: categoryValue,
      });

      const response = await fetch(`${API_BASE_URL}/product-subcategories?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result?.data && Array.isArray(result.data)) {
        // Transform data to match SearchableDropdown format
        const options = result.data.map(sub => ({
          name: sub.subCategory || sub.subcategory || sub.name || sub,
          value: sub.subCategory || sub.subcategory || sub.name || sub,
        }));
        setSubcategories(options);
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setSubcategories([]);
    }
  };

  // Effect to fetch categories when entity changes
  useEffect(() => {
    if (open && entity) {
      fetchCategories();
      // Reset filters when entity changes
      setSelectedCategory("");
      setSelectedSubcategory("");
      setCategorySearch("");
      setSubcategorySearch("");
    }
  }, [open, API_BASE_URL, token, entity]);

  // Effect to fetch subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory);
      // Reset subcategory when category changes
      setSelectedSubcategory("");
      setSubcategorySearch("");
    } else {
      setSubcategories([]);
    }
  }, [selectedCategory, entity]);

  // Function to fetch products with pagination and filters
  const fetchProducts = async () => {
    if (!open) return;

    setProductLoading(true);
    try {
      // Build filters object based on entity, category, and subcategory
      const filters = {
        customerId: parseInt(customerId),
        entity: entity
      };

      // Add category and subcategory to filters if selected
      if (selectedCategory) {
        filters.categoryId = parseInt(selectedCategory);
      }
      if (selectedSubcategory) {
        filters.subcategoryId = parseInt(selectedSubcategory);
      }

      const params = new URLSearchParams({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: searchQuery,
        filters: JSON.stringify(filters),
        sortBy: "id",
        sortOrder: "asc",
        isMachine: category && category.toLowerCase() === "vmco machines" ? true : false
      });

      // Add entity filter
      if (entity) {
        params.append("entity", entity);
      }

      // Add category filter for API (not the dropdown filter)
      if (selectedCategory) {
        params.append("category", selectedCategory);
      }

      // Add subcategory filter for API
      if (selectedSubcategory) {
        params.append("subCategory", selectedSubcategory);
      }

      // Add search fields
      if (searchQuery) {
        params.append("searchFields", "productName,product_name,product_name_lc,productNameLc");
      }

      const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const result = await response.json();
      console.log("API response:", result);

      // Support both array and paginated object
      if (Array.isArray(result.data.data)) {
        setBackendProducts(result.data.data);
        setPagination(prev => ({
          ...prev,
          total: result.data.totalRecords
        }));
      } else if (result && Array.isArray(result.data.data)) {
        setBackendProducts(result.data.data);
        setPagination(prev => ({
          ...prev,
          total: result.data.totalRecords
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
  }, [open, API_BASE_URL, token, pagination.page, pagination.pageSize, searchQuery, selectedCategory, selectedSubcategory, entity]);

  // Filter categories based on search
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Filter subcategories based on search
  const filteredSubcategories = subcategories.filter(subcat =>
    subcat.name.toLowerCase().includes(subcategorySearch.toLowerCase())
  );

  // Handle category selection
  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat.value);
    setCategorySearch(cat.name);
    setCategoryDropdownOpen(false);
    setSelectedSubcategory(""); // Reset subcategory when category changes
    setSubcategorySearch(""); // Reset subcategory search
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
  };

  // Handle subcategory selection
  const handleSubcategorySelect = (subcat) => {
    setSelectedSubcategory(subcat.value);
    setSubcategorySearch(subcat.name);
    setSubcategoryDropdownOpen(false);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
  };

  // Clear category filter
  const clearCategoryFilter = () => {
    setSelectedCategory("");
    setCategorySearch("");
    setSelectedSubcategory("");
    setSubcategorySearch("");
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Clear subcategory filter
  const clearSubcategoryFilter = () => {
    setSelectedSubcategory("");
    setSubcategorySearch("");
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (!open) return null;

  // Calculate totalPages based on total number of products and page size
  const { page, pageSize, total } = pagination;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;

  return (
    <div>
      <div className="gp-backdrop" onClick={onClose} />
      <div className="gp-modal">
        <div className="gp-header">
          <span className="gp-title">{t("Select a Product")}</span>
          <button
            className="gp-close-btn"
            onClick={onClose}
            style={{ marginLeft: isRTL ? '0' : 'auto', marginRight: isRTL ? 'auto' : '0' }}
          >
            {t("Close")}
          </button>
        </div>

        {/* Search Input */}
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

          {/* Category and Subcategory Filters */}
          <div className="gp-filters-row">
            <SearchableDropdown
              id="category-filter"
              name="categoryFilter"
              options={categories}
              className="category-filter"
              placeholder={t("Category")}
              value={selectedCategory}
              onChange={(e) => {
                const newCategoryValue = e.target.value;
                setSelectedCategory(newCategoryValue);
                setSelectedSubcategory(""); // Always reset subcategory when category changes

                // If no category is selected, clear subcategory options immediately
                if (!newCategoryValue) {
                  setSubcategories([]);
                }
                // If category is selected, subcategories will be fetched by useEffect
              }}
            />

            <SearchableDropdown
              id="subcategory-filter"
              name="subCategoryFilter"
              options={subcategories}
              className="category-filter"
              placeholder={!selectedCategory ? t("Select category first") : t("Sub category")}
              value={selectedSubcategory}
              onChange={(e) => {
                setSelectedSubcategory(e.target.value);
              }}
              disabled={!selectedCategory || subcategories.length === 0}
            />
          </div>
        </div>

        {/* Products List */}
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
                    style={{ textAlign: isRTL ? 'right' : 'left' }}
                  >
                    {i18n.language === 'ar' ? `${product.id} - ${product.productNameLc}` : `${product.id} - ${product.productName}`}
                  </button>
                </li>
              ))}
              {backendProducts.length === 0 && <li>{t("No products found.")}</li>}
            </ul>
          )}
        </div>

        {/* Footer with Pagination and Close Button */}
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
          background: #fff;
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
          justify-content: flex-start;
          align-items: center;
          padding: 22px 28px 10px 28px;
        }
        .gp-title {
          font-size: 1.25rem;
          font-weight: light;
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
          flex-direction: column;
          align-items: center;
          padding: 0px 28px 22px 28px;
          gap: 12px;
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