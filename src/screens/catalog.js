import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/components.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import Dropdown from "../components/DropDown";
import Tabs from "../components/Tabs";
import ProductPopup from "../components/ProductPopup";
import SearchInput from "../components/SearchInput";
import { useAuth } from "../context/AuthContext";
import RbacManager from "../utilities/rbac";
import Swal from "sweetalert2";
import Constants from "../constants";
import SearchableDropdown from "../components/SearchableDropdown";
import ProductsGrid from "./ProductsGrid";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
// Initial categories with their corresponding entity values
const initialCategories = [
  {
    value: Constants.ENTITY.SHC,
    entity: Constants.ENTITY.SHC,
    label: Constants.ENTITY.SHC,
  },
  {
    value: Constants.CATEGORY.VMCO_CONSUMABLES,
    entity: Constants.ENTITY.VMCO,
    label: Constants.TAB_NAMES.VMCO_CONSUMABLES,
  },
  {
    value: Constants.ENTITY.GMTC,
    entity: Constants.ENTITY.GMTC,
    label: Constants.ENTITY.GMTC,
  },
  {
    value: Constants.ENTITY.NAQI,
    entity: Constants.ENTITY.NAQI,
    label: Constants.ENTITY.NAQI,
  },
  {
    value: Constants.CATEGORY.VMCO_MACHINES,
    entity: Constants.ENTITY.VMCO,
    label: Constants.TAB_NAMES.VMCO_MACHINES,
  },
  {
    value: Constants.ENTITY.DAR,
    entity: Constants.ENTITY.DAR,
    label: Constants.ENTITY.DAR,
  },
  {
    value: "SPECIAL_PRODUCTS",
    entity: "",
    label: "Special Products",
  },
  {
    value: "FAVORITES",
    entity: "",
    label: "Favorites",
  },
];
function Catalog() {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [categories] = useState(initialCategories);
  const [activeCategory, setActiveCategory] = useState(initialCategories[0].value);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCustSequenceId, setSelectedCustSequenceId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [branches, setBranches] = useState([]);
  const [selectedBranchRegion, setSelectedBranchRegion] = useState("");
  const [selectedBranchCity, setSelectedBranchCity] = useState("");
  const [quantities, setQuantities] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Simplified pagination states
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryTabs, setCategoryTabs] = useState([]);
  const productsPerPage = 20;
  const { token, user, isAuthenticated, loading, logout } = useAuth();

  const [filteredProducts, setFilteredProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);
  const [entityDescriptions, setEntityDescriptions] = useState([]);

  // Refs for pagination and observer
  const currentPageRef = useRef(1);
  const isLoadingRef = useRef(false);
  const observerRef = useRef(null);
  const loadingTimeoutRef = useRef(null);

  // FIXED: Add refs to track current values to prevent stale closures
  const activeCategoryRef = useRef(activeCategory);
  const categoryFilterRef = useRef(categoryFilter);
  const subCategoryFilterRef = useRef(subCategoryFilter);
  const searchQueryRef = useRef(searchQuery);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  // const [paymentChangesIsThere, setPaymentChangesIsThere] = useState(false);

  useEffect(() => {
    // Add class to body when catalog mounts
    document.body.classList.add('catalog-page');

    // Remove class when catalog unmounts
    return () => {
      document.body.classList.remove('catalog-page');
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    console.log("isMobile", isMobile);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // FIXED: Update refs when values change
  useEffect(() => {
    activeCategoryRef.current = activeCategory;
  }, [activeCategory]);
  const tabsRef = useRef([]);

  useEffect(() => {
    const activeEl = document.querySelector(".tabs .category-tab.active");
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeCategory]);

  useEffect(() => {
    categoryFilterRef.current = categoryFilter;
  }, [categoryFilter]);

  useEffect(() => {
    subCategoryFilterRef.current = subCategoryFilter;
  }, [subCategoryFilter]);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  // FIXED: Helper function to reset all infinite scroll states
  const resetInfiniteScrollStates = useCallback(() => {
    console.log("🔄 Resetting infinite scroll states");
    setProducts([]);
    setCurrentPage(1);
    currentPageRef.current = 1;
    setHasMore(true);
    setIsLoading(false);
    setIsLoadingMore(false);
    isLoadingRef.current = false;

    // Clear any pending load timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    // Disconnect existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // FIXED: Fetch function with enhanced filter checking
  const fetchProducts = async (page = 1, reset = false) => {
    // Use ref values to get current state at the time of execution
    const currentActiveCategory = activeCategoryRef.current;
    const currentCategoryFilter = categoryFilterRef.current;
    const currentSubCategoryFilter = subCategoryFilterRef.current;
    const currentSearchQuery = searchQueryRef.current;

    console.log(`🚀 fetchProducts called: page=${page}, reset=${reset}, tab=${currentActiveCategory}, category=${currentCategoryFilter}, subCategory=${currentSubCategoryFilter}`);

    if (reset) {
      setIsLoading(true);
      isLoadingRef.current = true;
    } else {
      setIsLoadingMore(true);
      isLoadingRef.current = true;
    }

    try {
      const params = new URLSearchParams({
        page: page,
        pageSize: productsPerPage,
        sortBy: "id",
        sortOrder: "asc",
      });

      // Handle category-specific filtering using current ref values
      if (currentActiveCategory === "SPECIAL_PRODUCTS") {
        params.append("filters", JSON.stringify({ "specialProduct": true }));
      } else if (currentActiveCategory === "FAVORITES") {
        params.append("favorite", "true");
      } else {
        const selectedCategory = categories.find(cat => cat.value === currentActiveCategory);
        const entityToFilter = selectedCategory ? selectedCategory.entity : null;

        if (entityToFilter) {
          params.append("entity", entityToFilter);

          if (entityToFilter === Constants.ENTITY.VMCO) {
            if (currentActiveCategory === Constants.CATEGORY.VMCO_MACHINES) {
              params.append("isMachine", "true");
            } else if (currentActiveCategory === Constants.CATEGORY.VMCO_CONSUMABLES) {
              params.append("isMachine", "false");
            }
          }
        }
      }

      // Add filters using current ref values
      if (currentCategoryFilter && currentCategoryFilter.trim() !== "") {
        params.append("category", currentCategoryFilter);
      }
      if (currentSubCategoryFilter && currentSubCategoryFilter.trim() !== "") {
        params.append("subCategory", currentSubCategoryFilter);
      }
      if (currentSearchQuery) {
        params.append("search", currentSearchQuery);
        params.append("searchFields", "productName,product_name,product_name_lc,productNameLc");
      }

      console.log(`🌐 API call: ${API_BASE_URL}/products?${params.toString()}`);

      const response = await fetch(
        `${API_BASE_URL}/products?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        }
      );

      const result = await response.json();
      console.log(`📦 API response for page ${page}:`, result);

      // FIXED: Check if any filter changed while request was in flight
      if (currentActiveCategory !== activeCategoryRef.current ||
        currentCategoryFilter !== categoryFilterRef.current ||
        currentSubCategoryFilter !== subCategoryFilterRef.current ||
        currentSearchQuery !== searchQueryRef.current) {
        console.log(`🚫 Filters changed during fetch, ignoring response`);
        return;
      }

      let pageProducts = [];
      let totalCount = 0;

      if (result && result.data) {
        if (Array.isArray(result.data.data)) {
          pageProducts = result.data.data;
        } else if (Array.isArray(result.data)) {
          pageProducts = result.data;
        }

        totalCount = result.data.totalRecords ||
          result.data.total ||
          result.total ||
          (result.pagination && result.pagination.total) ||
          pageProducts.length;
      }

      // FIXED: Double-check filters haven't changed before updating state
      if (currentActiveCategory !== activeCategoryRef.current ||
        currentCategoryFilter !== categoryFilterRef.current ||
        currentSubCategoryFilter !== subCategoryFilterRef.current ||
        currentSearchQuery !== searchQueryRef.current) {
        console.log(`🚫 Filters changed before state update, ignoring response`);
        return;
      }

      // Update products state
      if (reset || page === 1) {
        setProducts(pageProducts);
        setCurrentPage(1);
        currentPageRef.current = 1;
      } else {
        setProducts(prev => {
          const newProducts = [...prev, ...pageProducts];
          console.log(`📄 Added page ${page} products. Total: ${newProducts.length}`);
          return newProducts;
        });
        setCurrentPage(page);
        currentPageRef.current = page;
      }

      setTotalProducts(totalCount);

      // FIXED: Proper hasMore calculation with empty page check
      const currentProductsCount = reset ? pageProducts.length : products.length + pageProducts.length;
      const hasMoreProducts = currentProductsCount < totalCount && pageProducts.length > 0;
      setHasMore(hasMoreProducts);

      console.log(`📄 Loaded page ${page}:`, {
        pageProducts: pageProducts.length,
        totalProductsNow: currentProductsCount,
        totalAvailable: totalCount,
        hasMore: hasMoreProducts,
        emptyPage: pageProducts.length === 0
      });

    } catch (err) {
      console.error("❌ Error fetching products:", err);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  };

  // FIXED: Load more function with enhanced filter checking
  const loadMoreProducts = useCallback(() => {
    if (isLoadingRef.current) {
      console.log("🚫 Load more blocked: already loading");
      return;
    }

    const currentHasMore = hasMore;
    if (!currentHasMore) {
      console.log("🚫 Load more blocked: no more products");
      return;
    }

    console.log("⏳ Starting load more with 2s delay...");
    setIsLoadingMore(true);
    isLoadingRef.current = true;

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // FIXED: Store current filters when scheduling the load
    const scheduledTab = activeCategoryRef.current;
    const scheduledCategoryFilter = categoryFilterRef.current;
    const scheduledSubCategoryFilter = subCategoryFilterRef.current;
    const scheduledSearchQuery = searchQueryRef.current;

    loadingTimeoutRef.current = setTimeout(() => {
      // FIXED: Check if any filter changed while waiting
      if (scheduledTab !== activeCategoryRef.current ||
        scheduledCategoryFilter !== categoryFilterRef.current ||
        scheduledSubCategoryFilter !== subCategoryFilterRef.current ||
        scheduledSearchQuery !== searchQueryRef.current) {
        console.log(`🚫 Filters changed during load delay, cancelling`);
        setIsLoadingMore(false);
        isLoadingRef.current = false;
        return;
      }

      const nextPage = currentPageRef.current + 1;
      console.log(`📈 Loading next page: ${nextPage} for current filters`);
      fetchProducts(nextPage, false);
    }, 2000);
  }, [hasMore]);

  // FIXED: Effect to handle tab changes and reset states
  useEffect(() => {
    if (loading || !user) return;

    console.log("🔄 Tab/filters changed, resetting products", {
      activeCategory,
      categoryFilter,
      subCategoryFilter,
      searchQuery
    });

    // Reset all infinite scroll states when changing tabs or filters
    resetInfiniteScrollStates();

    // Clear quantities when changing tabs to avoid confusion
    setQuantities({});

    // Fetch fresh products for the new tab/filters
    fetchProducts(1, true);
  }, [activeCategory, categoryFilter, subCategoryFilter, searchQuery, user, resetInfiniteScrollStates]);

  // FIXED: Optimized intersection observer setup
  useEffect(() => {
    console.log("🔧 Setting up observer", { hasMore, productsLength: products.length });

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!hasMore || isLoadingRef.current) {
      console.log("⚠️ Observer not needed", { hasMore, isLoading: isLoadingRef.current });
      return;
    }

    const handleIntersection = (entries) => {
      const lastElement = entries[0];

      console.log("👁️ Intersection detected:", {
        isIntersecting: lastElement.isIntersecting,
        hasMore,
        isLoading: isLoadingRef.current,
        activeTab: activeCategoryRef.current
      });

      if (lastElement.isIntersecting && hasMore && !isLoadingRef.current) {
        console.log('🔄 Triggering load more for current filters');
        loadMoreProducts();
      }
    };

    // Setup observer after products are rendered
    const setupObserver = () => {
      const productsGrid = document.querySelector('.products-grid');
      if (!productsGrid || productsGrid.children.length === 0) {
        console.log("⚠️ Products grid not ready");
        return;
      }

      const lastProductElement = productsGrid.children[productsGrid.children.length - 1];
      if (!lastProductElement) {
        console.log("⚠️ No last product element found");
        return;
      }

      observerRef.current = new IntersectionObserver(handleIntersection, {
        root: null,
        rootMargin: '200px',
        threshold: 0.1
      });

      observerRef.current.observe(lastProductElement);
      console.log('👁️ Observer setup for element:', lastProductElement);
    };

    // Setup observer after products are rendered
    if (products.length > 0) {
      const timeoutId = setTimeout(setupObserver, 100);

      return () => {
        clearTimeout(timeoutId);
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [products.length, hasMore, loadMoreProducts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // FIXED: Simplified displayed products - API handles all filtering
  useEffect(() => {
    // Since API handles all filtering (entity, category, subcategory, search),
    // displayedProducts should just mirror the products from API
    setFilteredProducts(products);
    setDisplayedProducts(products);
  }, [products]); // Only depend on products since API handles all filtering

  // Add this effect to fetch entity descriptions
  useEffect(() => {
    const fetchEntityDescriptions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/basics-masters?filters={"masterName": "entity"}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${token}`
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch entity descriptions");
        }
        const result = await response.json();
        setEntityDescriptions(
          result.data?.map((entity) => ({
            descriptionLc: entity.descriptionLc,
            description: entity.description,
            value: entity.value,
          })) || []
        );
      } catch (error) {
        console.error("Error fetching entity descriptions:", error);
      }
    };
    fetchEntityDescriptions();
  }, [i18n.language, API_BASE_URL, token]);

  //NOTE: For fetching the user again after browser refersh - start
  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      console.log("$$$$$$$$$$$ logging out");
      logout();
      navigate("/login");
      return;
    }
    if (user && user.userType) {
      // Initial load will be handled by the filter change effect
    }
  }, [user, loading, logout, navigate]);

  //RBAC
  const rbacMgr = new RbacManager(
    user?.userType === "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "catalog"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);
  const isE = rbacMgr.isE.bind(rbacMgr);
  // Helper function to get localized entity name
  const getLocalizedEntityName = (
    initialCategories,
    currentLanguage,
    entityDescriptions
  ) => {
    console.log("getLocalizedEntityName called with:", {
      initialCategories,
      currentLanguage,
      entityDescriptions,
    });
    const match = entityDescriptions?.find(
      (desc) => desc.value.toLowerCase() === initialCategories.toLowerCase()
    );
    if (!match) return initialCategories;
    return currentLanguage === "ar"
      ? match.descriptionLc || match.description
      : match.description;
  };

  const [filteredCategoryTabs, setFilteredCategoryTabs] = useState(categoryTabs);

  // Create categoryTabs with localized labels and filter for interCompany customers
  useEffect(() => {
    if (!entityDescriptions || entityDescriptions?.length === 0) {
      return;
    }
    if (!user) return;
    const allLocalizedTabs = initialCategories.map((category) => {
      const response = getLocalizedEntityName(
        category.label,
        i18n.language,
        entityDescriptions
      );
      return {
        value: category.value,
        label: response,
      };
    });
    // Filter tabs based on user type and interCompany status
    let tabsToShow = allLocalizedTabs.filter(tab => {
      const category = initialCategories.find(cat => cat.value === tab.value);

      if (category && (category.value === "FAVORITES" || category.value === "SPECIAL_PRODUCTS")) {
        return user.userType.toLowerCase() === "customer";
      }
      return true;
    });
    // If user is a customer with interCompany set to true, filter out matching entity tabs
    if (
      user.userType === "customer" &&
      user.interCompany === true &&
      user.entity
    ) {
      const customerEntity = user.entity.toLowerCase();
      console.log("Filtering tabs for interCompany customer with entity:", customerEntity);

      tabsToShow = tabsToShow.filter(tab => {
        const category = initialCategories.find(cat => cat.value === tab.value);

        if (!category || !category.entity) return true;

        const tabEntityExists = entityDescriptions.some(
          (desc) => desc.value.toLowerCase() === category.entity.toLowerCase()
        );

        if (tabEntityExists && category.entity.toLowerCase() === customerEntity) {
          console.log("Excluding tab:", tab.label, "for entity:", category.entity);
          return false;
        }

        return true;
      });
      console.log("Filtered tabs for interCompany customer:", tabsToShow);
    }
    setCategoryTabs(tabsToShow);
    setFilteredCategoryTabs(tabsToShow);
    // If current active category is not in filtered tabs, set to first available
    if (
      tabsToShow.length > 0 &&
      !tabsToShow.some((tab) => tab?.value === activeCategory)
    ) {
      setActiveCategory(tabsToShow[0]?.value);
    }
  }, [
    entityDescriptions,
    i18n.language,
    initialCategories,
    user,
    activeCategory,
  ]);
  const customerId = user?.customerId;
  const custSequenceId = user?.sequenceId;
  const userId = user?.userId;
  useEffect(() => {
    if (customerId) {
      setSelectedCustomerId(customerId);
      console.log("CustomerId:", customerId);
    }
    if (custSequenceId) {
      setSelectedCustSequenceId(custSequenceId);

      console.log("CustomerSequenceId:", selectedCustSequenceId);
    }

  }, [customerId, custSequenceId]);

  // Map product fields from backend to component props
  const mapProductToCardProps = useCallback(
    (product) => {
      const currentLanguage = i18n.language;
      // Parse images JSON and extract URLs
      let imageUrls = [];
      if (product.images) {
        try {
          const parsed =
            typeof product.images === "string"
              ? JSON.parse(product.images)
              : product.images;
          if (Array.isArray(parsed)) {
            imageUrls = parsed;
          }
        } catch (e) {
          // fallback: treat as single image string
          imageUrls = [product.images];
        }
      }
      // Choose the right product name based on language
      let productName = product.productName;
      if (currentLanguage !== "en" && product.productNameLc) {
        productName = product.productNameLc;
      }
      // Choose the right product description based on language
      let productDescription = product.description;
      if (
        currentLanguage !== "en" &&
        (product.description_lc || product.descriptionLc)
      ) {
        productDescription = product.description_lc || product.descriptionLc;
      }
      return {
        id: product.id,
        name: productName,
        code: product.erpProdId || product.erp_prod_id || "No ID",
        image: imageUrls[0] || "",
        images: imageUrls,
        description: productDescription,
        category: product.category,
        subCategory: product.sub_category || product.subCategory,
        entity: product.entity,
        unit: product.unit,
        vat: product.vatPercentage || product.VAT_percentage,
        moq: product.moq || product.minimumOrderQuantity || 0,
        favorite: product.favorite || false,
        ...product,
      };
    },
    [i18n.language]
  );

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };
  const handleClosePopup = () => {
    setSelectedProduct(null);
  };
  // Update the handleQuantityChange function
  const handleQuantityChange = (productId, value) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const moq = Number(product.moq || 0);
    const currentQuantity = quantities[productId] || 0;
    const newQuantity = Math.max(moq, currentQuantity + value);
    setQuantities((prev) => ({
      ...prev,
      [productId]: newQuantity,
    }));
  };
  const handleGoToCart = () => {
    const selectedBranch = branches.find((b) => b.value === selectedLocation);
    navigate("/Cart", {
      state: {
        selectedCustomerId,
        selectedCustomerStatus: user?.customerStatus,
        selectedBranchId: selectedLocation,
        selectedBranchName: selectedBranch?.label || "",
        selectedBranchNameLc: selectedBranch?.raw?.branchNameLc || selectedBranch?.branch_name_lc || "",
        selectedBranchNameEn: selectedBranch?.raw?.branchNameEn || selectedBranch?.branch_name_en || "",
        selectedBranchErpId: selectedBranch?.erpBranchId || "",
        selectedBranchRegion,
        selectedBranchCity,
        selectedBranchStatus: selectedBranch?.raw?.branchStatus || "",
        selectedCustSequenceId: selectedCustSequenceId,
        selectedBranchSequenceId: selectedBranch?.raw?.sequenceId,
      },
    });
  };
  const catalogId = React.useId();
  // Get unique categories and subcategories for dropdowns
  const uniqueCategories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  );
  const uniqueSubCategories = Array.from(
    new Set(products.map((p) => p.subCategory).filter(Boolean))
  );
  // NEW: Branch selection functionality moved here (before add to cart function)
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/customer-branches/pagination?pageSize=10000`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to fetch branches: ${errorData.message || response.statusText
            }`
          );
        }
        const result = await response.json();
        let branchData = [];
        if (Array.isArray(result)) {
          branchData = result;
        } else if (result.status === "Ok" && Array.isArray(result.data)) {
          branchData = result.data;
        } else if (result && Array.isArray(result.data)) {
          branchData = result.data;
          console.log("Fetched branch data:", branchData);
          console.log(
            "Status of branches:",
            branchData.map((b) => b.branchStatus)
          );
        } else {
          branchData = [];
        }
        const branchOptions = branchData.map((branch) => {
          const status = branch.branchStatus.toLowerCase();
          const isApproved = status === "approved";
          return {
            value: String(branch.id || branch.branch_id),
            label:
              i18n.language === "en"
                ? branch.branch_name_en || branch.branchNameEn
                : branch.branch_name_lc ||
                branch.branchNameLc ||
                branch.branch_name_en ||
                branch.branchNameEn,
            erpBranchId: branch.erpBranchId || branch.erp_branch_id,
            branchRegion: branch.region || branch.region,
            branchCity: branch.city || branch.branchCity || branch.branch_city,
            raw: branch,
            disabled: !isApproved || !branch.erpBranchId,
            branch_name_en: branch.branch_name_en || branch.branchNameEn,
            branch_name_lc: branch.branch_name_lc || branch.branchNameLc,
          };
        });
        setBranches(branchOptions);
      } catch (error) {
        console.error("Error fetching branches:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBranches();
  }, [API_BASE_URL, i18n.language]);
  // Handler for branch selection with cart check
  const handleBranchSelect = async (e) => {
    const newBranchId = e.target.value;
    const currentBranchId = selectedLocation;
    if (newBranchId === currentBranchId) return;
    const selectedBranch = branches.find(
      (b) => String(b.value) === String(newBranchId)
    );
    try {
      setIsLoading(true);
      // Fetch cart items for the user
      const params = new URLSearchParams({
        page: 1,
        pageSize: 100,
        sortBy: "id",
        sortOrder: "asc",
        filters: JSON.stringify({
          user_id: userId,
          customer_id: selectedCustomerId || customerId,
        }),
      });
      const response = await fetch(
        `${API_BASE_URL}/cart/pagination?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch cart items");
      const result = await response.json();
      const cartItems = result?.data?.data || [];
      // Find all unique branchIds in the cart
      const cartBranchIds = [
        ...new Set(
          cartItems.map((item) => String(item.branch_id || item.branchId))
        ),
      ];
      if (cartBranchIds.length === 0) {
        // No items in cart, allow any branch selection
        setSelectedLocation(newBranchId);
        if (selectedBranch) {
          setSelectedBranchRegion(selectedBranch.branchRegion || "");
          setSelectedBranchCity(selectedBranch.branchCity || "");
        }
        return;
      }
      if (cartBranchIds.length === 1 && cartBranchIds[0] === newBranchId) {
        // Only items for this branch, allow selection
        setSelectedLocation(newBranchId);
        if (selectedBranch) {
          setSelectedBranchRegion(selectedBranch.branchRegion || "");
          setSelectedBranchCity(selectedBranch.branchCity || "");
        }
        return;
      }
      // If there are items for a different branch, alert the user
      const otherBranchId = cartBranchIds.find((id) => id !== newBranchId);
      if (otherBranchId) {
        const otherBranch = branches.find(
          (branch) => String(branch.value) === String(otherBranchId)
        );
        const otherBranchLabel = otherBranch
          ? otherBranch.label
          : otherBranchId;

        const { isConfirmed } = await Swal.fire({
          icon: "warning",
          title: t("Discard items?"),
          html: `${t(
            "There are items in the cart for branch"
          )} <strong>${otherBranchLabel}</strong>.<br>${t(
            "Do you want to discard them?"
          )}`,
          showCancelButton: true,
          focusCancel: true,
          confirmButtonText: t("Yes, discard"),
          cancelButtonText: t("No, keep"),
          reverseButtons: true,
        });

        if (isConfirmed) {
          try {
            await fetch(
              `${API_BASE_URL}/cart/delete?customer_id=${selectedCustomerId || customerId
              }&branch_id=${otherBranchId}`,
              {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            setSelectedLocation(newBranchId);
            if (selectedBranch) {
              setSelectedBranchRegion(selectedBranch.branchRegion || "");
              setSelectedBranchCity(selectedBranch.branchCity || "");
            }
            await Swal.fire({
              icon: "success",
              title: t("Success"),
              text: t(
                `Items discarded from the cart for branch ${otherBranchLabel}`
              ),
              confirmButtonText: t("OK"),
            });
          } catch (deleteError) {
            await Swal.fire({
              icon: "error",
              title: t("Error"),
              text: t(
                "Failed to discard items from the cart. Please try again."
              ),
              confirmButtonText: t("OK"),
            });
          }
        }
      }
    } catch (error) {
      console.error("Error during branch change:", error);
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t("Error checking cart. Branch change may not work correctly."),
        confirmButtonText: t("OK"),
      });
    } finally {
      setIsLoading(false);
    }
  };
  //  Add to cart functionality
  const handleAddToCart = async (productId) => {
    console.log("Adding product to cart:", productId);
    try {
      // Check if a branch is selected
      if (!selectedLocation) {
        Swal.fire({
          icon: "warning",
          title: t("No Branch Selected"),
          text: t("Please select a delivery branch before adding products to the cart."),
          timer: 5000,
          showConfirmButton: false,
          timerProgressBar: true,
        });
        return;
      }
      // Find the product being added
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      // Get MOQ and ensure quantity meets it
      const moq = Number(product.moq);
      let quantity = quantities[productId];
      // If quantity is less than MOQ, set it to MOQ
      if (quantity < moq) {
        quantity = moq;
        // Update the quantities state
        setQuantities((prev) => ({
          ...prev,
          [productId]: moq,
        }));
      }
      // Ensure quantity is at least 1
      quantity = Math.max(1, quantity);
      // Calculate needed values
      const unitPrice = product.unitPrice;
      const netAmount = unitPrice * quantity;
      const vatPercentage = parseFloat(product.vatPercentage) || 0;

      // Calculate VAT
      const vatAmount = netAmount * (vatPercentage / 100);

      // Parse images JSON and extract URLs
      let imageUrls = [];
      if (product.images) {
        try {
          const parsed =
            typeof product.images === "string"
              ? JSON.parse(product.images)
              : product.images;
          if (Array.isArray(parsed)) {
            imageUrls = parsed;
          }
        } catch (e) {
          imageUrls = [product.images];
        }
      }
      // First check if this item already exists in the cart
      const checkResponse = await fetch(
        `${API_BASE_URL}/cart/pagination?filters={"userId":${user.userId}, "customerId":${customerId},"branchId":${selectedLocation}, "productId":${productId}}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const checkResult = await checkResponse.json();
      console.log("Check cart response:", checkResult);
      if (checkResult?.data?.data && checkResult?.data?.data?.length > 0) {
        // Item already exists in cart
        const existingItem = checkResult?.data?.data[0];
        const updatedQuantity =
          parseInt(existingItem?.quantityOrdered) + parseInt(quantity);

        Swal.fire({
          icon: "warning",
          title: t("Product already exists in cart"),
          text: t(`This item already has a quantity of`) + t(`${existingItem?.quantityOrdered}. `) + t(`Do you want to update it?`),
          showCancelButton: true,
          confirmButtonText: t("Yes, update it"),
          cancelButtonText: t("No, cancel"),
          reverseButtons: true,
        }).then(async (result) => {
          if (result?.isConfirmed) {
            // User confirmed update
            const updateResponse = await fetch(
              `${API_BASE_URL}/cart/update?customer_id=${customerId}&branch_id=${selectedLocation}&product_id=${productId}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  quantityOrdered: updatedQuantity,
                  netAmount: unitPrice * updatedQuantity,
                }),
              }
            );

            if (!updateResponse.ok) {
              const errorData = await updateResponse?.json().catch(() => ({}));
              throw new Error(
                `Failed to update cart item: ${errorData?.message || updateResponse?.statusText
                }`
              );
            }

            Swal.fire({
              icon: "success",
              title: t("Product quantity updated successfully"),
              showConfirmButton: false,
              timer: 1000,
            });
          } else if (result?.dismiss === Swal.DismissReason.cancel) {
            // User cancelled update
            Swal.fire({
              icon: "info",
              title: t("Update cancelled"),
              showConfirmButton: false,
              timer: 1000,
            });
          }
        });
      }
      else {
        // Item doesn't exist in cart, add it as new
        const cartItem = {
          userId: userId,
          customerId: selectedCustomerId,
          branchId: selectedLocation,
          branchRegion: selectedBranchRegion,
          productId: product.id,
          productName: product.productName || product.product_name,
          productNameLc: product.productNameLc || product.product_name_lc,
          erpProdId: product.erpProdId || product.erp_prod_id || "",
          moq: product.moq || product.minimumOrderQuantity,
          entity: product.entity,
          category: product.category,
          unit: product.unit,
          // Add the two new properties
          isMachine: product.isMachine,
          isFresh: product.isFresh,

          unitPrice: unitPrice,
          quantityOrdered: parseInt(quantity),
          netAmount: netAmount,
          vatPercentage:
            user.companyType === "non trading" ? 0.0 : vatPercentage.toFixed(2),
          images: JSON.stringify(imageUrls),
        };
        console.log("Adding new item to cart:", cartItem);
        const response = await fetch(`${API_BASE_URL}/cart`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cartItem),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to add item to cart: ${errorData.message || response.statusText
            }`
          );
        }
        Swal.fire({
          icon: "success",
          title: t("Product added to cart successfully"),
          showConfirmButton: false,
          timer: 1000,
        });
      }
      // Reset quantity only if less than moq after successful add/update
      if (quantities[productId] < moq) {
        setQuantities((prev) => ({
          ...prev,
          [productId]: 0,
        }));
      } else {
        // Otherwise, keep the current quantity
        setQuantities((prev) => ({
          ...prev,
          [productId]: quantities[productId],
        }));
      }
    } catch (error) {
      console.error("Error handling product cart action:", error);
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t("Failed to add product to cart. Please try again."),
        confirmButtonText: t("OK"),
      });
    }
  };

  const handleToggleFavorite = async (productId, isFavorite) => {
    try {
      if (!isAuthenticated || !user) {
        Swal.fire({
          icon: "warning",
          title: t("Please Log In"),
          text: t("You need to be logged in to add products to favorites."),
          confirmButtonText: t("OK"),
        });
        return;
      }
      if (isFavorite) {
        // Add to favorites
        const response = await fetch(`${API_BASE_URL}/favorites`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user.userId,
            customerId: selectedCustomerId || user.customerId,
            productId: productId,
            favorite: true,
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to add to favorites");
        }
      } else {
        // Remove from favorites
        const response = await fetch(
          `${API_BASE_URL}/favorites/${user.userId}/${productId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to remove from favorites");
        }
      }
      // Update local state to reflect changes immediately
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === productId
            ? { ...product, favorite: isFavorite }
            : product
        )
      );
      // Also update filtered/displayed products
      setFilteredProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === productId
            ? { ...product, favorite: isFavorite }
            : product
        )
      );
      setDisplayedProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === productId
            ? { ...product, favorite: isFavorite }
            : product
        )
      );
    } catch (error) {
      console.error("Error toggling favorite status:", error);
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t("Failed to update favorite status. Please try again."),
        confirmButtonText: t("OK"),
      });
    }
  };
  // Get unique categories filtered by the current entity tab
  const getFilteredCategories = () => {
    const selectedCategory = categories.find(
      (cat) => cat.value === activeCategory
    );
    const entityToFilter = selectedCategory ? selectedCategory.entity : null;
    if (!entityToFilter) return [];
    // First filter by entity
    let filteredProductsByEntity = products.filter(
      (p) => (p.entity || "").toLowerCase() === entityToFilter.toLowerCase()
    );

    // Additional filtering for VMCO tabs
    if (
      activeCategory.toLowerCase() ===
      Constants.CATEGORY.VMCO_MACHINES.toLowerCase()
    ) {
      return Array.from(
        new Set(
          filteredProductsByEntity
            .map((p) => p.category)
            .filter(Boolean)
            .filter(
              (category) =>
                !(
                  category.toLowerCase().includes("consumable") ||
                  category.toLowerCase().includes("supply") ||
                  category.toLowerCase().includes("accessory")
                )
            )
        )
      );
    } else if (
      activeCategory.toLowerCase() ===
      Constants.CATEGORY.VMCO_CONSUMABLES.toLowerCase()
    ) {
      return Array.from(
        new Set(
          filteredProductsByEntity
            .map((p) => p.category)
            .filter(Boolean)
            .filter(
              (category) =>
                !(
                  category.toLowerCase().includes("machine") ||
                  category.toLowerCase().includes("equipment") ||
                  category.toLowerCase().includes("device")
                )
            )
        )
      );
    } else {
      return Array.from(
        new Set(filteredProductsByEntity.map((p) => p.category).filter(Boolean))
      );
    }
  };
  // Get unique subcategories filtered by the current entity tab and selected category
  const getFilteredSubcategories = () => {
    const selectedCategory = categories.find(
      (cat) => cat.value === activeCategory
    );
    const entityToFilter = selectedCategory ? selectedCategory.entity : null;
    if (!entityToFilter) return [];
    let filteredProducts = products;
    // Filter by entity first
    filteredProducts = filteredProducts.filter(
      (p) => (p.entity || "").toLowerCase() === entityToFilter.toLowerCase()
    );

    // If a category is selected, filter by that category
    if (categoryFilter) {
      filteredProducts = filteredProducts.filter(
        (p) => (p.category || "").toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    // Return unique subcategories from the filtered products
    return Array.from(
      new Set(
        filteredProducts
          .map((p) => p.subCategory || p.sub_category)
          .filter(Boolean)
      )
    );
  };
  // Initialize quantities with MOQ values when products are loaded
  useEffect(() => {
    if (products.length > 0) {
      let initialQuantities = { ...quantities };
      let hasChanges = false;
      products.forEach((product) => {
        // Only set MOQ for products without quantity or with 0 quantity
        if (
          product.moq &&
          (!initialQuantities[product.id] ||
            initialQuantities[product.id] === 0)
        ) {
          initialQuantities[product.id] = Number(product.moq);
          hasChanges = true;
        }
      });
      // Only update state if there were changes
      if (hasChanges) {
        setQuantities(initialQuantities);
      }
    }
  }, [products]);

  // Determine direction and alignment
  const dir = i18n.dir();
  const isRTL = dir === "rtl";
  // Fetch categories from API when active tab/entity changes
  useEffect(() => {
    const fetchCategories = async () => {
      const selectedCategory = categories.find(
        (cat) => cat.value === activeCategory
      );
      const entity = selectedCategory?.entity;
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
          if (activeCategory === Constants.CATEGORY.VMCO_MACHINES) {
            const isMachine = true;
            params.append("isMachine", isMachine);
          } else {
            const isMachine = false;
            params.append("isMachine", isMachine);
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

        const options = Array.isArray(result.data)
          ? result.data.map(cat => ({
            name: cat.category || cat.name || cat,
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
  }, [activeCategory, categories, API_BASE_URL]);
  // Fetch subcategories from API when category or active tab/entity changes
  useEffect(() => {
    const fetchSubCategories = async () => {
      const selectedCategoryObj = categories.find(
        (cat) => cat.value === activeCategory
      );
      const entity = selectedCategoryObj?.entity;
      if (!entity || !categoryFilter) {
        setSubCategoryOptions([]);
        return;
      }
      try {
        const params = new URLSearchParams({
          entity: entity,
          category: categoryFilter,
        });
        const response = await fetch(`${API_BASE_URL}/product-subcategories?${params.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        });
        if (!response.ok) throw new Error("Failed to fetch subcategories");
        const result = await response.json();

        const options = Array.isArray(result.data)
          ? result.data.map(sub => ({
            name: sub.subCategory || sub.subcategory || sub.name || sub,
            value: sub.subCategory || sub.subcategory || sub.name || sub,
          }))
          : [];
        setSubCategoryOptions(options);
      } catch (err) {
        setSubCategoryOptions([]);
        console.error("Error fetching subcategories:", err);
      }
    };
    fetchSubCategories();
  }, [activeCategory, categoryFilter, categories, API_BASE_URL, token]); // ✅ Added token

  // Reset subcategory filter when category filter changes or is cleared
  useEffect(() => {
    if (!categoryFilter) {
      setSubCategoryFilter("");
      setSubCategoryOptions([]);
    }
  }, [categoryFilter]);

  return (
    <Sidebar title={t("Catalog")}>
      <div
        className={`catalog-wrapper${isRTL ? " rtl" : ""}`}
        style={{ direction: dir, textAlign: isRTL ? "right" : "left" }}
        dir={dir}
      >
        {/* Fixed Header Container */}
        <div className="catalog-fixed-header">
          {/* Location Selector and Cart Button */}
          {isV("selectBranch") && (
            <div className="catalog-header">
              <div className="location-selector">
                <SearchableDropdown
                  id={`location-select-${catalogId}`}
                  name="locationSelect"
                  value={selectedLocation}
                  onChange={handleBranchSelect}
                  options={branches.map((b) => ({
                    ...b,
                    name: b.label || b.name || b.value,
                    disabled: b.disabled,
                  }))}
                  className={isMobile ? "mobile-select-branch location-select" : "location-select"}
                  placeholder={t("Select Branch")}
                  disabled={isLoading || branches.length === 0}
                />
                {isLoading && branches.length === 0 && (
                  <div className="dropdown-loading">
                    <LoadingSpinner size="small" />
                  </div>
                )}
                {!isLoading && branches.length === 0 && (
                  <div className="no-branches-message">
                    {t("No branches available")}
                  </div>
                )}
              </div>
              {isV("goToCart") && (
                <button
                  className={`go-to-cart-btn ${!selectedLocation ? "disabled" : ""}`}
                  style={{
                    opacity: !selectedLocation ? 0.6 : 1,
                    cursor: !selectedLocation ? "not-allowed" : "pointer",
                  }}
                  onClick={handleGoToCart}
                  disabled={!selectedLocation}
                >
                  <FontAwesomeIcon icon={faShoppingCart} className="cart-icon" />
                  {!isMobile && <span>{t("Go to Cart")}</span>}
                </button>
              )}
            </div>
          )}

          {/* Tabs Section */}
          <div className="filter-section">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 12,
                overflowX: "auto",
                scrollbarWidth: "none",
              }}
            >
              <Tabs
                tabs={filteredCategoryTabs}
                activeTab={activeCategory}
                onTabChange={(newCategory) => {
                  console.log("🔄 Tab changing from", activeCategory, "to", newCategory);
                  setActiveCategory(newCategory);
                  setSearchQuery("");
                  setCategoryFilter("");
                  setSubCategoryFilter("");
                  setSubCategoryOptions([]);
                }}
                className={isMobile ? "catalog" : ""}
                variant="category"
              />
            </div>
          </div>

          {/* Search and Filters */}
          <div className="search-section">
            <div className="search-container">
              {isV("search") && (
                <SearchInput
                  onSearch={(searchTerm) => {
                    setSearchQuery(searchTerm);
                  }}
                  debounceTime={500}
                />
              )}
              <SearchableDropdown
                id={`category-filter-${catalogId}`}
                name="categoryFilter"
                options={categoryOptions}
                className={!isMobile ? `category-filter ${[
                  Constants.CATEGORY.VMCO_MACHINES.toLowerCase(),
                  Constants.CATEGORY.VMCO_CONSUMABLES.toLowerCase(),
                ].includes(activeCategory.toLowerCase())
                  ? "tab-linked-filter"
                  : ""
                  }` : `mobile category-filter ${[
                  Constants.CATEGORY.VMCO_MACHINES.toLowerCase(),
                  Constants.CATEGORY.VMCO_CONSUMABLES.toLowerCase(),
                ].includes(activeCategory.toLowerCase())
                  ? "tab-linked-filter"
                  : ""
                  }`}
                placeholder={t("Category")}
                value={categoryFilter}
                onChange={(e) => {
                  const newCategoryValue = e.target.value;
                  setCategoryFilter(newCategoryValue);
                  setSubCategoryFilter("");
                  if (!newCategoryValue) {
                    setSubCategoryOptions([]);
                  }
                }}
              />
              <SearchableDropdown
                id={`subcategory-filter-${catalogId}`}
                name="subCategoryFilter"
                options={subCategoryOptions}
                className={!isMobile ? "category-filter" : "mobile category-filter"}
                placeholder={!categoryFilter ? t("Select category first") : t("Sub category")}
                value={subCategoryFilter}
                onChange={(e) => {
                  setSubCategoryFilter(e.target.value);
                }}
                disabled={!categoryFilter || subCategoryOptions.length === 0}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Products Container */}
        <div className="catalog-scrollable-content">
          <div className="products-grid">
            {displayedProducts.length > 0
              ? displayedProducts?.map((product) => (
                <ProductCard
                  key={product.id}
                  product={mapProductToCardProps(product)}
                  quantities={quantities}
                  onQuantityChange={handleQuantityChange}
                  onAddToCart={() => handleAddToCart(product.id)}
                  onProductClick={() => handleProductClick(product)}
                  setQuantities={setQuantities}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))
              : !isLoading && (
                <div className="no-products-message">
                  {searchQuery ? (
                    <p>
                      {t(
                        'No products found matching your search term "{{searchTerm}}".',
                        { searchTerm: searchQuery }
                      )}
                    </p>
                  ) : (
                    <p>{t("No products found matching your criteria.")}</p>
                  )}
                </div>
              )}
            {isLoading && !isMobile && (
              <div className="loading-container">
                <LoadingSpinner size="medium" />
              </div>
            )}
          </div>
            {isLoading && isMobile && (
              <div className="loading-container">
                <LoadingSpinner size="medium" />
              </div>
            )}
          {/* Loading More Indicator */}
          {isLoadingMore && (
            <div className="loading-more-container">
              <LoadingSpinner size="medium" />
              <span className="loading-more-text">{t("Loading more products...")}</span>
            </div>
          )}

          {/* End of Catalog Message */}
          {!hasMore && displayedProducts.length > 0 && !isLoading && !isLoadingMore && (
            <div className="end-of-catalog-message">
              <p>{t("End of product catalog")}</p>
            </div>
          )}
        </div>

        {/* Product Popup */}
        {selectedProduct && (
          <ProductPopup
            product={mapProductToCardProps(selectedProduct)}
            quantities={quantities}
            onQuantityChange={handleQuantityChange}
            onAddToCart={() => handleAddToCart(selectedProduct.id)}
            onInputChange={(itemId, value) =>
              setQuantities({
                ...quantities,
                [itemId]: value,
              })
            }
            onClose={handleClosePopup}
          />
        )}
      </div>

      {/* {isMobile && isV("selectBranch") && (
          <div className="catalog-header">
            <div className="location-selector">
              <SearchableDropdown
                id={`location-select-${catalogId}`}
                name="locationSelect"
                value={selectedLocation}
                onChange={handleBranchSelect}
                options={branches.map((b) => ({
                  ...b,
                  name: b.label || b.name || b.value,
                  disabled: b.disabled,
                }))}
                className="location-select"
                placeholder={t("Select Branch")}
                disabled={isLoading || branches.length === 0}
              />
              {isLoading && branches.length === 0 && (
                <div className="dropdown-loading">
                  <LoadingSpinner size="small" />
                </div>
              )}
              {!isLoading && branches.length === 0 && (
                <div className="no-branches-message">
                  {t("No branches available")}
                </div>
              )}
            </div>
            {isV("goToCart") && (
              <button
                className={`go-to-cart-btn ${!selectedLocation ? "disabled" : ""
                  }`}
                style={{
                  opacity: !selectedLocation ? 0.6 : 1,
                  cursor: !selectedLocation ? "not-allowed" : "pointer",
                }}
                onClick={handleGoToCart}
                disabled={!selectedLocation}
              >
                <FontAwesomeIcon icon={faShoppingCart} className="cart-icon" />
                <span>{t("Go to Cart")}</span>
              </button>
            )}
          </div>
        )} */}
      <style jsx="true">{`
        .no-products-message {
          width: 100%;
          height: auto;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 20px 20px;
          color: #666;
          font-size: 1.1rem;
          grid-column: 1 / -1;
          margin: 20px auto;
          background-color: #f9f9f9;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
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
        .loading-more-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px 0;
          width: 100%;
          margin: 20px 0;
          background-color: #f9f9f9;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .loading-more-text {
          margin-top: 15px;
          color: #666;
          font-size: 1rem;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .product-search-input {
            width: 125px !important;
            margin-bottom: 10px;
            padding: 5px 10px !important;
          }
          .search-container {
            flex-direction: row !important;
            overflow-x: auto;
            scrollbar-width: none;
          }
            .no-products-message {
            display: flex;
            flex-direction: row;
            background-color: unset;
            font-size: 1rem !important;
      }
            .products-grid > * {
            max-width: none !important;
      }
        }
      `}</style>
    </Sidebar>
  );
}
export default Catalog;