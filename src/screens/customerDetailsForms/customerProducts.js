import React, { useState, useRef, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
import Pagination from "../../components/Pagination";
import { isMobile } from "../../utilities/isMobile";
import Tabs from "../../components/Tabs";
import "../../styles/pagination.css";
import "../../styles/components.css";
import "../../styles/forms.css";
import ToggleButton from "../../components/ToggleButton";
import RbacManager from "../../utilities/rbac";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faToggleOff,
  faToggleOn,
  faCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { debounce, set } from "lodash";
import Constants from "../../constants";
import { getOptionsFromBasicsMaster } from "../../utilities/commonServices";
import SearchableDropdown from "../../components/SearchableDropdown";
import LoadingSpinner from "../../components/LoadingSpinner";
import SkeletonWrapper from "../../components/SkeletonWrapper";

const initialEntities = [
  {
    value: Constants.ENTITY.VMCO,
    label: Constants.TAB_NAMES.VMCO_MACHINES,
    imageUrl: Constants.TAB_IMAGES.VMCO_MACHINES
  },
  {
    value: Constants.CATEGORY.VMCO_CONSUMABLES,
    entity: Constants.ENTITY.VMCO,
    label: Constants.TAB_NAMES.VMCO_CONSUMABLES,
    imageUrl: Constants.TAB_IMAGES.VMCO_CONSUMABLES
  },
  {
    value: Constants.ENTITY.SHC,
    label: "Saudi Hospitality Company",
    imageUrl: Constants.TAB_IMAGES.SHC
  },
  {
    value: Constants.ENTITY.GMTC,
    label: "Green Mast Factory Ltd",
    imageUrl: Constants.TAB_IMAGES.GMTC
  },
  {
    value: Constants.ENTITY.NAQI,
    label: "Naqi Company",
    imageUrl: Constants.TAB_IMAGES.NAQI
  },
  {
    value: Constants.ENTITY.DAR,
    label: "DAR Company",
    imageUrl: Constants.TAB_IMAGES.DAR
  },
  {
    value: "Special Products",
    label: "Special Products",
    imageUrl: Constants.TAB_IMAGES.SPECIAL_PRODUCTS
  },
];

function Products({ customerId, customer, setTabsHeight }) {
  const [isApprovalMode, setApprovalMode] = useState(false);
  const [products, setProducts] = useState([]);
  const [currentItems, setCurrentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isActionMenuOpen, setActionMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const actionMenuRef = useRef(null);
  const { t, i18n } = useTranslation();
  const [entities] = useState(initialEntities);
  const [activeEntity, setActiveEntity] = useState(initialEntities[0].value);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // Debounced search
  const [selectedItems, setSelectedItems] = useState([]);
  const [editingMoq, setEditingMoq] = useState(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageInput, setPageInput] = useState("");
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const { token, user, isAuthenticated, logout } = useAuth();

  // ✅ Category/Subcategory states (EXACTLY like GetProducts)
  const [categoryEnOptions, setCategoryEnOptions] = useState([]);
  const [categoryArOptions, setCategoryArOptions] = useState([]);
  const [subCategoryEnOptions, setSubCategoryEnOptions] = useState([]);
  const [subCategoryArOptions, setSubCategoryArOptions] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");

  // ✅ Refs for stale closure prevention (EXACTLY like GetProducts)
  const categoryFilterRef = useRef(categoryFilter);
  const subCategoryFilterRef = useRef(subCategoryFilter);
  const searchQueryRef = useRef(searchQuery);
  const debounceTimeout = useRef();

  const itemsPerPage = 5;

  const rbacMgr = new RbacManager(
    user?.userType == "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "custDetailsAdd"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);

  // ✅ Update refs when filters change (EXACTLY like GetProducts)
  useEffect(() => {
    categoryFilterRef.current = categoryFilter;
  }, [categoryFilter]);

  useEffect(() => {
    subCategoryFilterRef.current = subCategoryFilter;
  }, [subCategoryFilter]);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  // Mobile resize handler
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Action menu click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target)
      ) {
        setActionMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ✅ Debounce search (EXACTLY like GetProducts)
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setSearchQuery(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(debounceTimeout.current);
  }, [search]);

  // ✅ FETCH CATEGORIES (EXACTLY like GetProducts)
  const fetchCategories = async () => {
    const selectedEntityObj = entities.find((cat) => cat.value === activeEntity);
    const entity = selectedEntityObj?.entity || selectedEntityObj?.value;

    if (!entity) {
      setCategoryEnOptions([]);
      setCategoryArOptions([]);
      return;
    }

    try {
      const params = new URLSearchParams({ entity: entity });

      // Handle VMCO entity special cases (EXACTLY like GetProducts)
      if (entity === Constants.ENTITY.VMCO) {
        if (activeEntity === Constants.CATEGORY.VMCO_MACHINES || activeEntity === Constants.ENTITY.VMCO) {
          params.append("isMachine", "true");
        } else if (activeEntity === Constants.CATEGORY.VMCO_CONSUMABLES) {
          params.append("isMachine", "false");
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

      // English options (EXACTLY like GetProducts)
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

      // Arabic options (EXACTLY like GetProducts)
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

  const fetchSubCategories = async () => {
    const selectedEntityObj = entities.find((cat) => cat.value === activeEntity);
    const entity = selectedEntityObj?.entity || selectedEntityObj?.value;

    if (!entity) {
      setSubCategoryEnOptions([]);
      setSubCategoryArOptions([]);
      return;
    }

    const selectedCategory = [...categoryEnOptions, ...categoryArOptions].find(
      (cat) => cat.value === categoryFilter
    );
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

      // Handle VMCO entity special cases
      if (entity === Constants.ENTITY.VMCO) {
        if (activeEntity === Constants.CATEGORY.VMCO_MACHINES || activeEntity === Constants.ENTITY.VMCO) {
          params.append("isMachine", "true");
        } else if (activeEntity === Constants.CATEGORY.VMCO_CONSUMABLES) {
          params.append("isMachine", "false");
        }
      }

      const response = await fetch(
        `${API_BASE_URL}/product-subcategories?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
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

  // ✅ Load categories when entity changes (EXACTLY like GetProducts)
  useEffect(() => {
    setCategoryFilter("");
    setSubCategoryFilter("");
    setSubCategoryEnOptions([]);
    setSubCategoryArOptions([]);
    if (activeEntity) {
      fetchCategories();
    }
  }, [activeEntity]);

  // ✅ Load subcategories when category changes (EXACTLY like GetProducts)
  useEffect(() => {
    if (categoryFilter) {
      fetchSubCategories();
      setSubCategoryFilter("");
    } else {
      setSubCategoryFilter("");
      setSubCategoryEnOptions([]);
      setSubCategoryArOptions([]);
    }
  }, [categoryFilter, activeEntity]);

  // ✅ FETCH PRODUCTS with server-side filtering (EXACTLY like GetProducts)
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      // ✅ Use refs to avoid stale closure (EXACTLY like GetProducts)
      const currentCategoryFilter = categoryFilterRef.current || "";
      const currentSubCategoryFilter = subCategoryFilterRef.current || "";
      const currentSearchQuery = searchQueryRef.current || "";

      const selectedEntityObj = entities.find((cat) => cat.value === activeEntity);
      let entity = selectedEntityObj?.entity || selectedEntityObj?.value;

      const filters = {
        customer_id: customerId,
        entity: entity,
        active: true,
        visible: isApprovalMode ? true : undefined,
      };

      // VMCO special cases (EXACTLY like GetProducts)
      if (entity === Constants.ENTITY.VMCO) {
        if (activeEntity === Constants.CATEGORY.VMCO_MACHINES || activeEntity === Constants.ENTITY.VMCO) {
          filters.is_machine = true;
        } else if (activeEntity === Constants.CATEGORY.VMCO_CONSUMABLES) {
          filters.is_machine = false;
        }
      }

      // Special Products case
      if (activeEntity?.toLowerCase() === "special products") {
        filters.special_product = true;
        filters.erp_cust_id = customer?.erpCustId;
        delete filters.customer_id;
        delete filters.entity;
      }

      // ✅ Add category filter with safe string check (EXACTLY like GetProducts)
      if (currentCategoryFilter && typeof currentCategoryFilter === 'string' && currentCategoryFilter.trim()) {
        filters.category = currentCategoryFilter.trim();
        console.log('Category filter applied:', currentCategoryFilter.trim());
      }

      // ✅ Add subcategory filter with safe string check (EXACTLY like GetProducts)
      if (currentSubCategoryFilter && typeof currentSubCategoryFilter === 'string' && currentSubCategoryFilter.trim()) {
        filters.subCategory = currentSubCategoryFilter.trim();
        console.log('Subcategory filter applied:', currentSubCategoryFilter.trim());
      }

      const query = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: itemsPerPage.toString(),
        sortBy: "product_id",
        sortOrder: "asc",
        filters: JSON.stringify(filters),
        ...(currentSearchQuery && typeof currentSearchQuery === 'string' && currentSearchQuery.trim() && {
          search: currentSearchQuery.trim(),
          searchFields: "productName,productname,productnamelc,productNameLc"
        }),
      });

      console.log('Products API URL:', `${API_BASE_URL}/product-customer-mappings/pagination?${query.toString()}`);

      const response = await fetch(
        `${API_BASE_URL}/product-customer-mappings/pagination?${query.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      console.log('Products API Response:', data);

      setProducts(data?.data || []);
      setCurrentItems(data?.data || []);
      setTotalPages(data?.totalPages || 0);

    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message);
      setProducts([]);
      setCurrentItems([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch products when dependencies change (EXACTLY like GetProducts)
  useEffect(() => {
    if (customerId && activeEntity) {
      fetchProducts();
    }
    setTabsHeight("auto");
  }, [
    customerId,
    activeEntity,
    currentPage,
    isApprovalMode,
    searchQuery, // Use debounced searchQuery
    categoryFilter,
    subCategoryFilter,
  ]);

  // Rest of your existing handlers remain the same...
  const handleKeyDown = (e) => {
    if (["Enter", "Go", "Search", "Done"].includes(e.key)) {
      if (isMobile) {
        e.target.blur();
        document.body.classList.remove('keyboard-open');
      }
    }
  };

  const toggleApprovalMode = () => {
    setApprovalMode(!isApprovalMode);
    setCurrentPage(1);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = currentItems.map((item) => item.id);
      setSelectedItems(allIds);
      setCurrentItems((prevItems) =>
        prevItems.map((item) => ({ ...item, visible: true }))
      );
      callUpdateSelectedItemsAPI(allIds, true);
    } else {
      setSelectedItems([]);
      setCurrentItems((prevItems) =>
        prevItems.map((item) => ({ ...item, visible: false }))
      );
      callUpdateSelectedItemsAPI([], false);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((itemId) => itemId !== id)
        : [...prevSelected, id]
    );
  };

  const handleToggleVisibility = (id) => {
    setCurrentItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item
      )
    );

    setSelectedItems((prevSelected) => {
      const newSelected = prevSelected.includes(id)
        ? [...prevSelected.filter((itemId) => itemId !== id)]
        : [...prevSelected, id];
      callUpdateSelectedItemsAPI([id]);
      return newSelected;
    });
  };

  const callUpdateSelectedItemsAPI = async (selectedItems, state = false) => {
    try {
      let updatedItems;

      if (selectedItems.length === 0) {
        updatedItems = currentItems.map((item) => ({
          ...item,
          visible: false,
        }));
      } else if (state) {
        updatedItems = currentItems.map((item) => ({
          ...item,
          visible: true,
        }));
      } else {
        updatedItems = currentItems.map((item) => ({
          ...item,
          visible: selectedItems.includes(item.id)
            ? !item.visible
            : item.visible,
        }));
      }

      const response = await fetch(
        `${API_BASE_URL}/product-customer-mappings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify(updatedItems),
        }
      );

      const data = await response.json();
    } catch (error) {
      console.error("Failed to update selected items:", error);
    }
  };

  const isAllSelected =
    currentItems?.length > 0 && currentItems.every((item) => item.visible);

  const handleMoqChange = (id, value) => {
    setCurrentItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, moq: value } : item))
    );
  };

  const handleSaveMoq = (id, value) => {
    const product = currentItems.find((item) => item.id === id);
    fetch(
      `${API_BASE_URL}/product-customer-mappings/${id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ moq: value }),
      }
    ).catch(error => console.error("Error saving MoQ:", error));

    setIsInputFocused(false);
    setEditingMoq(null);
  };

  const handleCancelMoq = (id) => {
    const product = products.find((item) => item.id === id);
    const originalMoq = product?.moq;
    handleMoqChange(id, originalMoq);
    handleSaveMoq(id, originalMoq);
    setIsInputFocused(false);
    setEditingMoq(null);
  };

  const handleApplyAll = () => {
    const moqValue = document.querySelector(".product-text-input").value;
    if (!moqValue) return;

    const numericValue = parseInt(moqValue);
    if (isNaN(numericValue)) return;

    currentItems
      .filter((item) => item.visible)
      .forEach((item) => {
        handleMoqChange(item.id, numericValue);
        handleSaveMoq(item.id, numericValue);
      });
  };

  // ✅ Dynamic category/subcategory options based on language (EXACTLY like GetProducts)
  const categories = i18n.language === 'ar' ? categoryArOptions : categoryEnOptions;
  const subcategories = i18n.language === 'ar' ? subCategoryArOptions : subCategoryEnOptions;

  if (!token || !customerId) return <div>{t("Loading...")}</div>;

  return (
    <div className="products-content">
      <div className="products-header-controls">
        {/* --- First row: Entity Tabs --- */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 12,
            overflowX: "auto",
            scrollbarWidth: "none"
          }}
        >
          <Tabs
            tabs={entities}
            activeTab={activeEntity}
            onTabChange={(newEntity) => {
              setActiveEntity(newEntity);
              setCurrentPage(1);
              setCategoryFilter("");
              setSubCategoryFilter("");
              setSearch("");
            }}
            variant={isMobile ? 'mobile' : 'pc'}
          />
        </div>
      </div>
      <div className="products-header-controls">
        {/* --- Second row: Toggle Button and MoQ Controls --- */}
        <div className="products-controls-wrapper">
          <div className="products-controls-left">
            <ToggleButton
              isToggled={isApprovalMode}
              onToggle={toggleApprovalMode}
              leftLabel={t("All")}
              rightLabel={t("Selected")}
            />

            <div className="moq-apply-all-container">
              {isV("btnApplyAll") && <label>{t("MoQ")}</label>}
              {isV("btnApplyAll") && (
                <input type="text"
                  onFocus={() => {
                    if (window.innerWidth <= 768) {
                      document.body.classList.add('keyboard-open');
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  onBlur={() => {
                    document.body.classList.remove('keyboard-open');
                  }}
                  className="product-text-input" />
              )}
              {isV("btnApplyAll") && (
                <button
                  className="apply-all-button"
                  disabled={currentItems?.filter((item) => item.visible).length < 2}
                  onClick={handleApplyAll}
                >
                  {t("Apply All")}
                </button>
              )}
            </div>
          </div>

          {/* Search - on same line for desktop, positioned to the right */}
          {!isMobile && (
            <input
              type="text"
              onFocus={() => {
                if (window.innerWidth <= 768) {
                  document.body.classList.add('keyboard-open');
                }
              }}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                document.body.classList.remove('keyboard-open');
              }}
              placeholder={t("Search...")}
              className="product-search-input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      </div>

      {/* --- Search on separate row for mobile --- */}
      {isMobile && (
        <div className="products-header-controls">
          <input
            type="text"
            onFocus={() => {
              if (window.innerWidth <= 768) {
                // This could trigger hiding the bottom menu
                document.body.classList.add('keyboard-open');
              }
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {

              document.body.classList.remove('keyboard-open');
              // 👈 show menu again (optional)
            }}

            placeholder={t("Search...")}
            className="product-search-input"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: "10px",
              margin: "2px",
              width: "100%",
              border: "0px solid lightgray",
              borderRadius: "8px",
              fontSize: "1rem",
              backgroundColor: "#fff",
              transition: "all 0.2s ease",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {/* --- Toggle and Apply All below filters --- */}
      <div className="products-page-header">
        {isMobile ? (<>
          <div className="category-and-subcategory" style={{ display: "flex", flexDirection: "row", gap: "10px", justifyContent: "center", alignItems: "center", width: "100%" }}>
            <div className="category-dropdown-mobile" style={{ flex: 1 }}>
              <SearchableDropdown
                id="category-filter"
                name="categoryFilter"
                options={i18n.language === "en" ? categoryEnOptions : categoryArOptions}
                placeholder={t("Categories")}
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setSubCategoryFilter(""); // Reset subcategory when category changes
                  setCurrentPage(1);
                }}

                className="category-filter-mobile"
                style={{ width: '100%', borderRadius: '16px' }}

              />
            </div>
            <div className="subcategory-dropdown" style={{ flex: 1 }}>
              <SearchableDropdown
                id="subcategory-filter"
                name="subCategoryFilter"
                options={i18n.language === "en" ? subCategoryEnOptions : subCategoryArOptions}
                placeholder={!categoryFilter ? t("Select category first") : t("Sub category")}
                value={subCategoryFilter}
                onChange={(e) => {
                  setSubCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={!categoryFilter}
                className="subcategory-filter-mobile"
                style={{ width: '100%', borderRadius: '16px' }}

              />
            </div>
          </div>
        </>) : (<>{/* Category Filter - use SearchableDropdown */}
          <SearchableDropdown
            id="category-filter"
            name="categoryFilter"
            options={i18n.language === "en" ? categoryEnOptions : categoryArOptions}
            className={isMobile ? "category-filter-mobile" : "category-filter-desktop"}
            placeholder={t("All Categories")}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setSubCategoryFilter(""); // Reset subcategory when category changes
              setCurrentPage(1);
            }}
            style={{ width: '250px !important' }}

          />
          {/* Subcategory Filter - use SearchableDropdown */}
          <SearchableDropdown
            id="subcategory-filter"
            name="subCategoryFilter"
            options={i18n.language === "en" ? subCategoryEnOptions : subCategoryArOptions}
            className={isMobile ? "subcategory-filter-mobile" : "subcategory-filter-desktop"}
            placeholder={t("All Subcategories")}
            value={subCategoryFilter}
            onChange={(e) => {
              setSubCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: '250px !important' }}
            disabled={!categoryFilter}
          /></>)}

      </div>

      {
        loading && (
          // <div style={{ padding: 24 }}>
          //   <LoadingSpinner />
          // </div>
          <SkeletonWrapper loading={loading} type="table" rows={3} columns={1}> </SkeletonWrapper>
        )
      }

      {
        !loading && (<div className="products-table-container">
          <table className="products-data-table">
            <thead>
              <tr>
                <th className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    disabled={!isV("btnSelectItems")}
                  />
                </th>
                <th>{t("Name")}</th>
                {isV("btnApplyAll") && <th>{t("Minimum Order Quantity")}</th>}
              </tr>
            </thead>
            <tbody>
              {currentItems?.map((product) => (
                <tr key={product.id}>
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      checked={product.visible}
                      onChange={() => handleToggleVisibility(product.id)}
                      disabled={!isV("btnSelectItems")}
                    />
                  </td>
                  {i18n.language === "en" ? (
                    <td>{product.productName}</td>
                  ) : (
                    <td>{product.productNameLc}</td>
                  )}
                  {isV("btnApplyAll") && (
                    <td className="edit-cell">
                      <div className="input-with-icons">
                        <input
                          type="text"
                          onFocus={() => {
                            if (window.innerWidth <= 768) {
                              // This could trigger hiding the bottom menu
                              document.body.classList.add('keyboard-open');
                            }

                            setIsInputFocused(true);
                            setEditingMoq(product.id);
                          }}
                          onKeyDown={handleKeyDown}
                          onBlur={() => {

                            document.body.classList.remove('keyboard-open');
                            // 👈 show menu again (optional)
                          }}

                          value={product.moq}
                          onChange={(e) =>
                            handleMoqChange(product.id, e.target.value)
                          }
                          // onBlur={() => {
                          //     // Use setTimeout to allow button clicks to register
                          //     setTimeout(() => {
                          //         setIsInputFocused(false);
                          //         setEditingMoq(null);
                          //     }, 200);
                          // }}
                          disabled={!isV("btnApplyAll")}
                          style={{ width: "80px" }}
                        />
                        {isInputFocused && (
                          <>
                            <button
                              className="icon-button"
                              onClick={() =>
                                handleSaveMoq(product.id, product.moq)
                              }
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <FontAwesomeIcon icon={faCheck} />
                            </button>
                            <button
                              className="icon-button"
                              onClick={() => handleCancelMoq(product.id)}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <FontAwesomeIcon icon={faXmark} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          {currentItems && currentItems.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                fetchProducts();
              }}
            />
          )}
        </div>)
      }
      <style jsx="true">{`
        .products-controls-wrapper {
          display: flex;
          align-items: center;
          gap: 20px;
          width: 100%;
          justify-content: space-between;
        }

        .products-controls-left {
          display: flex;
          align-items: center;
          gap: 15px;
          flex: 0 1 auto;
        }

        .moq-apply-all-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .moq-apply-all-container label {
          font-size: 0.9rem;
          font-weight: 500;
          color: #333;
          white-space: nowrap;
        }

        .product-text-input {
          padding: 8px 10px;
          width: 70px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 0.85rem;
          background-color: #fff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .product-text-input:focus {
          border-color: #1d396d;
          outline: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .apply-all-button {
          padding: 8px 16px;
          font-size: 0.9rem;
          background-color: var(--logo-deep-green, #1d396d);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .apply-all-button:hover:not(:disabled) {
          background-color: var(--logo-deep-green-hover, #162a54);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .apply-all-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background-color: #cccccc;
        }

        .product-search-input {
          padding: 10px 15px;
          width: 250px;
          border: 0px solid lightgray;
          border-radius: 8px;
          font-size: 1rem;
          background-color: #fff;
          box-shadow: 0 0 0 2px #e5e4e2;
          transition: all 0.2s ease;
          box-sizing: border-box;
          flex: 0 0 auto;
        }

        .product-search-input:focus {
          box-shadow: 0 0 0 2px #e5e4e2;
          outline: none;
        }

        .product-search-input::placeholder {
          color: #d3d3d3;
          opacity: 1;
        }

        .category-filter {
          margin-right: 10px;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #ccc;
          font-size: 1rem;
          background: #fff;
        }

        @media (max-width: 768px) {
          .products-controls-wrapper {
            flex-direction: column;
            gap: 10px;
          }

          .products-controls-left {
            width: 100%;
            flex-direction: row;
            gap: 10px;
          }

          .moq-apply-all-container {
            width: 100%;
            justify-content: center;
          }

          .product-search-input {
            width: 95% !important;
            margin-bottom: 0;
            padding: 8px 12px !important;
          }

          .products-header-controls {
            flex-direction: column;
          }
        }
      `}</style>
    </div >
  );
}

export default Products;
