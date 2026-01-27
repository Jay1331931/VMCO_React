import React, { useState, useRef, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
import Pagination from "../../components/Pagination";
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
import SearchableDropdown from "../../components/SearchableDropdown"; // Add this import
import LoadingSpinner from "../../components/LoadingSpinner";
// --- Entities (Tabs) like catalog.js ---
const initialEntities = [
  {
    value: Constants.ENTITY.VMCO,
    label:  Constants.TAB_NAMES.VMCO_MACHINES,
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
  const [products, setProducts] = useState([]); // all products
  const [currentItems, setCurrentItems] = useState([]); // products on current page
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isActionMenuOpen, setActionMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const actionMenuRef = useRef(null);
  const { t, i18n } = useTranslation();
  const [entities] = useState(initialEntities);
  const [activeEntity, setActiveEntity] = useState(initialEntities[0].value);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [editingMoq, setEditingMoq] = useState(null);

  const [isInputFocused, setIsInputFocused] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  // const totalPages = Math.ceil(currentItems.length / itemsPerPage);
  const [totalPages, setTotalPages] = useState(0);
  const [pageInput, setPageInput] = useState("");
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const { token, user, isAuthenticated, logout } = useAuth();
  // const currentItems = products.slice(startIndex, endIndex);
  const rbacMgr = new RbacManager(
    user?.userType == "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "custDetailsAdd"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);
   useEffect(() => {
            const handleResize = () => setIsMobile(window.innerWidth < 768);
            console.log("isMobile", isMobile);
            window.addEventListener("resize", handleResize);
            return () => window.removeEventListener("resize", handleResize);
          }, []);
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

  const fetchProducts = async (activeEntity) => {
    setLoading(true);
    setError(null);

    const filters = {
      customer_id: customerId,
      entity: activeEntity,
      active: true,
      visible: isApprovalMode ? true : undefined, // Only show selected if in approval mode
    };
    if (categoryFilter) filters.category = categoryFilter;
    if (subCategoryFilter) filters.subCategory = subCategoryFilter;
    if (activeEntity?.toLowerCase() === "vmco") {
      filters.is_machine = true;
    }
    if (activeEntity?.toLowerCase() === "vmco consumables") {
      filters.entity = "VMCO";
      filters.is_machine = false;
    }
    if (activeEntity?.toLowerCase() === "special products") {
      filters.special_product = true;
      filters.erp_cust_id = customer?.erpCustId;
      // remove entity from filters
      delete filters.customer_id;
      delete filters.entity;
    }
    const query = new URLSearchParams({
      page: currentPage,
      pageSize: itemsPerPage,
      sortBy: "product_id",
      sortOrder: "asc",
      filters: JSON.stringify(filters),
      search: search,
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/product-customer-mappings/pagination?${query.toString()}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch products");
        return;
      }

      const data = await response.json();
      return data;
      // setProducts(data.data);
      // setCurrentItems(data.data);
      // setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId && activeEntity) {
      const fetchData = async () => {
        const products = await fetchProducts(activeEntity);
        setProducts(products?.data);
        setCurrentItems(products?.data);
        setTotalPages(products?.totalPages);
      };
      fetchData();
    }
    setTabsHeight("auto");
  }, [
    customer,
    activeEntity,
    currentPage,
    isApprovalMode,
    search,
    categoryFilter,
    subCategoryFilter,
  ]);
  useEffect(() => {
      const activeEl = document.querySelector(".tabs .category-tab.active");
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }, [activeEntity]);

  const toggleApprovalMode = () => {
    setApprovalMode(!isApprovalMode);
    setCurrentPage(1);
    // fetchProducts();
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

    // Use the callback form to get the updated selectedItems
    setSelectedItems((prevSelected) => {
      const newSelected = prevSelected.includes(id)
        ? [...prevSelected.filter((itemId) => itemId !== id)]
        : [...prevSelected, id];
      // Call API with the new selection
      callUpdateSelectedItemsAPI([id]);
      return newSelected;
    });
  };

  const callUpdateSelectedItemsAPI = async (selectedItems, state = false) => {
    try {
      let updatedItems;

      if (selectedItems.length === 0) {
        // When deselecting all, set all items to visible: false
        updatedItems = currentItems.map((item) => ({
          ...item,
          visible: false,
        }));
      } else if (state) {
        // When selecting all with state=true (select all case)
        updatedItems = currentItems.map((item) => ({
          ...item,
          visible: true,
        }));
      } else {
        // Toggle case for individual items
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
    try {
      const response = fetch(
        `${API_BASE_URL}/product-customer-mappings/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ moq: value }),
          
        }
      );
    } catch (error) {
      console.error("Error saving MoQ:", error);
    }

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

  // Apply All: only for current page
  const handleApplyAll = () => {
    const moqValue = document.querySelector(".product-text-input").value;
    if (!moqValue) return;

    const numericValue = parseInt(moqValue);
    if (isNaN(numericValue)) return;

    // Only update visible items on the current page
    currentItems
      .filter((item) => item.visible)
      .forEach((item) => {
        handleMoqChange(item.id, numericValue);
        handleSaveMoq(item.id, numericValue);
      });
  };

  // Debounced search handler
  const handleSearchChange = debounce((e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  }, 400);

  // Filter products based on entity, category, subcategory, and search
  const filteredProducts = products?.filter((product) => {
    const matchesEntity = !activeEntity || product.entity === activeEntity;
    const matchesCategory =
      !categoryFilter || product.category === categoryFilter;
    const matchesSubCategory =
      !subCategoryFilter || product.subCategory === subCategoryFilter;
    const matchesSearch =
      !search ||
      (product.productName &&
        product.productName.toLowerCase().includes(search.toLowerCase()));
    return (
      matchesEntity && matchesCategory && matchesSubCategory && matchesSearch
    );
  });

  // // Use filteredProducts for rendering and pagination
  // useEffect(() => {
  //   setCurrentItems(filteredProducts.slice(startIndex, endIndex));
  //   setTotalPages(Math.ceil(filteredProducts.length / itemsPerPage));
  // }, [filteredProducts, startIndex, endIndex, itemsPerPage]);

  // Add state for category and subcategory options
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);

  // Fetch category options when products or activeEntity changes
  useEffect(() => {
    const fetchCategories = async () => {
      const selectedCategory = entities?.find(
        (cat) => cat?.value === activeEntity
      );
      const entity = selectedCategory?.entity || selectedCategory?.value; // Use entity or value

      if (!entity) {
        setCategoryOptions([]);
        return;
      }

      try {
        // Build query parameters
        const params = new URLSearchParams({
          entity: entity,
        });

        // Add isMachine parameter for VMCO entity tabs
        if (entity === Constants.ENTITY.VMCO) {
          if (activeEntity.toLowerCase() === "vmco") {
            params.append("isMachine", "true");
          } else if (activeEntity === Constants.CATEGORY.VMCO_CONSUMABLES) {
            params.append("isMachine", "false");
          }
        }

        const response = await fetch(
          `${API_BASE_URL}/product-categories?${params.toString()}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" ,
              "Authorization": `Bearer ${token}`  
            },
            
          }
        );

        if (!response.ok) throw new Error("Failed to fetch categories");

        const result = await response.json();

        // Assuming result.data is an array of category names/objects
        const options = Array.isArray(result.data)
          ? result.data.map((cat) => ({
              name: cat.category || cat.name || cat, // adapt as per API response
              value: cat.category || cat.name || cat,
            }))
          : [];

        setCategoryOptions(options);
      } catch (err) {
        setCategoryOptions([]);
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, [activeEntity, API_BASE_URL]);

  // Fetch subcategory options when products, activeEntity, or categoryFilter changes
  useEffect(() => {
    const fetchSubCategories = async () => {
      const selectedEntityObj = entities.find(
        (cat) => cat.value === activeEntity
      );
      const entity = selectedEntityObj?.entity || selectedEntityObj?.value;

      if (!entity || !categoryFilter) {
        setSubCategoryOptions([]);
        return;
      }

      try {
        const params = new URLSearchParams({
          entity: entity,
          category: categoryFilter,
        });

        // Add isMachine parameter for VMCO entity tabs
        if (entity === Constants.ENTITY.VMCO) {
          if (activeEntity === Constants.CATEGORY.VMCO_MACHINES) {
            params.append("isMachine", "true");
          } else if (activeEntity === Constants.CATEGORY.VMCO_CONSUMABLES) {
            params.append("isMachine", "false");
          }
        }

        const response = await fetch(
          `${API_BASE_URL}/product-subcategories?${params.toString()}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json",  "Authorization": `Bearer ${token}` },
        
          }
        );

        if (!response.ok) throw new Error("Failed to fetch subcategories");

        const result = await response.json();

        // Assuming result.data is an array of subcategory names/objects
        const options = Array.isArray(result.data)
          ? result.data.map((sub) => ({
              name: sub.subCategory || sub.sub_category || sub.name || sub,
              value: sub.subCategory || sub.sub_category || sub.name || sub,
            }))
          : [];

        setSubCategoryOptions(options);
      } catch (err) {
        setSubCategoryOptions([]);
        console.error("Error fetching subcategories:", err);
      }
    };

    fetchSubCategories();
  }, [activeEntity, categoryFilter, API_BASE_URL]);

  return (
    <div className="products-content">
      <h3>{t("Products")}</h3>

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
        {/* --- Second row: Category & Subcategory dropdowns --- */}
        <div className="products-page-header">
          <ToggleButton
          isToggled={isApprovalMode}
          onToggle={toggleApprovalMode}
          leftLabel={t("All")}
          rightLabel={t("Selected")}
        />
          
          
        <div className="toggle-container">
          {isV("btnApplyAll") && <label>{t("MoQ")}</label>}
          {isV("btnApplyAll") && (
            <input type="text" className="product-text-input" />
          )}
          {isV("btnApplyAll") && (
            <button
              className="branches-approve-button"
              disabled={currentItems?.filter((item) => item.visible).length < 2}
              onClick={handleApplyAll}
            >
              {t("Apply All")}
            </button>
          )}
        </div>
          {/* Search */}
          <input
            type="text"
            placeholder={t("Search...")}
            className="product-search-input"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: "10px 15px",
              width: "250px",
              border: "0px solid lightgray",
              borderRadius: "8px",
              fontSize: "1rem",
              backgroundColor: "#fff",
              transition: "all 0.2s ease",
              marginRight: "10px",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* --- Toggle and Apply All below filters --- */}
      <div className="products-page-header">
        {isMobile ? (<>
<div className="category-and-subcategory" style={{ display: "flex", flexDirection: "row", gap: "10px", justifyContent: "center", alignItems: "center", width: "100%" }}>
                              <div className="category-dropdown-mobile" style={{ flex: 1 }}>
                                  <SearchableDropdown
setHideMenu={setHideMenu}
                                  id="category-filter"
            name="categoryFilter"
            options={categoryOptions}
            placeholder={t("All Categories")}
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
setHideMenu={setHideMenu}
                                  id="subcategory-filter"
            name="subCategoryFilter"
            options={subCategoryOptions}
            placeholder={t("All Subcategories")}
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
setHideMenu={setHideMenu}
            id="category-filter"
            name="categoryFilter"
            options={categoryOptions}
            className={isMobile ? "category-filter-mobile" : "category-filter"}
            placeholder={t("All Categories")}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setSubCategoryFilter(""); // Reset subcategory when category changes
              setCurrentPage(1);
            }}
          />
          {/* Subcategory Filter - use SearchableDropdown */}
          <SearchableDropdown
setHideMenu={setHideMenu}
            id="subcategory-filter"
            name="subCategoryFilter"
            options={subCategoryOptions}
            className={isMobile ? "subcategory-filter-mobile" : "category-filter"}
            placeholder={t("All Subcategories")}
            value={subCategoryFilter}
            onChange={(e) => {
              setSubCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            disabled={!categoryFilter}
          /></>)}
        
      </div>
      
{loading && (
              <div style={{ padding: 24 }}>
                <LoadingSpinner />
              </div>
        )}
      
      {!loading && (<div className="products-table-container">
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
                        value={product.moq}
                        onChange={(e) =>
                          handleMoqChange(product.id, e.target.value)
                        }
                        onFocus={() => {
                          setIsInputFocused(true);
                          setEditingMoq(product.id);
                        }}
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
      </div>)}
      <style jsx="true">{`
        .product-search-input {
          padding: 10px 15px;
          width: 300px;
          border: 2px solid #1d396d;
          border-radius: 8px;
          font-size: 1rem;
          background-color: #fff;
          box-shadow: 0 0 0 2px #e5e4e2;
          transition: all 0.2s ease;
          margin-right: 10px;
          box-sizing: border-box;
        }
        .product-search-input:focus {
          border-color: #1d396d;
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
          .product-search-input {
            width: 125px !important;
            margin-bottom: 10px;
            padding: 5px 10px !important;
          }
          .products-header-controls {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default Products;
