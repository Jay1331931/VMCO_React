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
  const [isPageLoading, setIsPageLoading] = useState(true);
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
  const [isAdding, setIsAdding] = useState(null);
  const [coolingPeriodData, setCoolingPeriodData] = useState([]);
  const [disabledEntities, setDisabledEntities] = useState([]);

  // Refs for pagination and observer
  const currentPageRef = useRef(1);
  const isLoadingRef = useRef(false);
  const observerRef = useRef(null);
  const loadingTimeoutRef = useRef(null);

  // Refs to track current values
  const activeCategoryRef = useRef(activeCategory);
  const categoryFilterRef = useRef(categoryFilter);
  const subCategoryFilterRef = useRef(subCategoryFilter);
  const searchQueryRef = useRef(searchQuery);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    document.body.classList.add('catalog-page');
    return () => {
      document.body.classList.remove('catalog-page');
    };
  }, []);

  const [showHeader, setShowHeader] = useState(true);
  const dragStartY = useRef(0);

  useEffect(() => {
    const fetchCoolingPeriod = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/cooling-period/now`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${token}`
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.status === "Ok" && Array.isArray(result.data)) {
            // Store full data for toTime access
            setCoolingPeriodData(result.data);

            // Extract entities for disabling logic
            const entities = [...new Set(result.data.map(item => item.entity))];
            setDisabledEntities(entities);
          }
        }
      } catch (error) {
        console.error("Error fetching cooling period:", error);
      }
    };

    fetchCoolingPeriod();
  }, [token]);

  useEffect(() => {
    const handleTouchStart = (e) => {
      dragStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      if (currentY < dragStartY.current - 15) {
        setShowHeader(false);
      }
      if (currentY > dragStartY.current + 15) {
        setShowHeader(true);
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (products.length > 0 && !isLoading && !isLoadingMore && isPageLoading) {
      setIsPageLoading(false);
    }
  }, [products, isLoading, isLoadingMore, isPageLoading]);

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

  const resetInfiniteScrollStates = useCallback(() => {
    setProducts([]);
    setCurrentPage(1);
    currentPageRef.current = 1;
    setHasMore(true);
    setIsLoading(false);
    setIsLoadingMore(false);
    isLoadingRef.current = false;

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  const fetchProducts = async (page = 1, reset = false) => {
    const currentActiveCategory = activeCategoryRef.current;
    const currentCategoryFilter = categoryFilterRef.current;
    const currentSubCategoryFilter = subCategoryFilterRef.current;
    const currentSearchQuery = searchQueryRef.current;

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

      if (currentActiveCategory !== activeCategoryRef.current ||
        currentCategoryFilter !== categoryFilterRef.current ||
        currentSubCategoryFilter !== subCategoryFilterRef.current ||
        currentSearchQuery !== searchQueryRef.current) {
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

      if (reset || page === 1) {
        setProducts(pageProducts);
        setCurrentPage(1);
        currentPageRef.current = 1;
      } else {
        setProducts(prev => [...prev, ...pageProducts]);
        setCurrentPage(page);
        currentPageRef.current = page;
      }

      setTotalProducts(totalCount);

      const currentProductsCount = reset ? pageProducts.length : products.length + pageProducts.length;
      const hasMoreProducts = currentProductsCount < totalCount && pageProducts.length > 0;
      setHasMore(hasMoreProducts);

    } catch (err) {
      console.error("❌ Error fetching products:", err);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  };

  const loadMoreProducts = useCallback(() => {
    if (isLoadingRef.current) return;
    const currentHasMore = hasMore;
    if (!currentHasMore) return;

    setIsLoadingMore(true);
    isLoadingRef.current = true;

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    const scheduledTab = activeCategoryRef.current;
    const scheduledCategoryFilter = categoryFilterRef.current;
    const scheduledSubCategoryFilter = subCategoryFilterRef.current;
    const scheduledSearchQuery = searchQueryRef.current;

    loadingTimeoutRef.current = setTimeout(() => {
      if (scheduledTab !== activeCategoryRef.current ||
        scheduledCategoryFilter !== categoryFilterRef.current ||
        scheduledSubCategoryFilter !== subCategoryFilterRef.current ||
        scheduledSearchQuery !== searchQueryRef.current) {
        setIsLoadingMore(false);
        isLoadingRef.current = false;
        return;
      }

      const nextPage = currentPageRef.current + 1;
      fetchProducts(nextPage, false);
    }, 2000);
  }, [hasMore]);

  useEffect(() => {
    if (loading || !user) return;
    resetInfiniteScrollStates();
    setQuantities({});
    fetchProducts(1, true);
  }, [activeCategory, categoryFilter, subCategoryFilter, searchQuery, user, resetInfiniteScrollStates]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!hasMore || isLoadingRef.current) {
      return;
    }

    const handleIntersection = (entries) => {
      const lastElement = entries[0];
      if (lastElement.isIntersecting && hasMore && !isLoadingRef.current) {
        loadMoreProducts();
      }
    };

    const setupObserver = () => {
      const productsGrid = document.querySelector('.products-grid');
      if (!productsGrid || productsGrid.children.length === 0) return;

      const lastProductElement = productsGrid.children[productsGrid.children.length - 1];
      if (!lastProductElement) return;

      observerRef.current = new IntersectionObserver(handleIntersection, {
        root: null,
        rootMargin: '200px',
        threshold: 0.1
      });

      observerRef.current.observe(lastProductElement);
    };

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

  useEffect(() => {
    setFilteredProducts(products);
    setDisplayedProducts(products);
  }, [products]);

  useEffect(() => {
    const fetchEntityDescriptions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/basics-masters?filters={\"masterName\": \"entity\"}`, {
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

  useEffect(() => {
    if (loading) return;
    if (!user) {
      logout();
      navigate("/login");
      return;
    }
  }, [user, loading, logout, navigate]);

  const rbacMgr = new RbacManager(
    user?.userType === "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "catalog"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);

  const getLocalizedEntityName = (
    initialCategories,
    currentLanguage,
    entityDescriptions
  ) => {
    const match = entityDescriptions?.find(
      (desc) => desc.value.toLowerCase() === initialCategories.toLowerCase()
    );
    if (!match) return initialCategories;
    return currentLanguage === "ar"
      ? match.descriptionLc || match.description
      : match.description;
  };

  const [filteredCategoryTabs, setFilteredCategoryTabs] = useState(categoryTabs);

  // UPDATED: Filter tabs and apply disabled status based on cooling period
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

    // Filter tabs based on user type
    let tabsToShow = allLocalizedTabs.filter(tab => {
      const category = initialCategories.find(cat => cat.value === tab.value);
      if (category && (category.value === "FAVORITES" || category.value === "SPECIAL_PRODUCTS")) {
        return user.userType.toLowerCase() === "customer";
      }
      return true;
    });

    // Intercompany filtering
    if (user.userType === "customer" && user.interCompany === true && user.entity) {
      const customerEntity = user.entity.toLowerCase();
      tabsToShow = tabsToShow.filter(tab => {
        const category = initialCategories.find(cat => cat.value === tab.value);
        if (!category || !category.entity) return true;
        const tabEntityExists = entityDescriptions.some(
          (desc) => desc.value.toLowerCase() === category.entity.toLowerCase()
        );
        if (tabEntityExists && category.entity.toLowerCase() === customerEntity) {
          return false;
        }
        return true;
      });
    }

    // APPLY DISABLED STATUS
    tabsToShow = tabsToShow.map(tab => {
      const category = initialCategories.find(cat => cat.value === tab.value);
      if (category && category.entity && disabledEntities.includes(category.entity)) {
        return { ...tab, disabled: true };
      }
      return { ...tab, disabled: false };
    });

    setCategoryTabs(tabsToShow);
    setFilteredCategoryTabs(tabsToShow);

    // If current active category is not in filtered tabs or is disabled, set to first available
    const isCurrentDisabled = tabsToShow.find(t => t.value === activeCategory)?.disabled;
    const isCurrentMissing = !tabsToShow.some(tab => tab.value === activeCategory);

    if (tabsToShow.length > 0 && (isCurrentMissing || isCurrentDisabled)) {
      const firstAvailable = tabsToShow.find(t => !t.disabled);
      if (firstAvailable) {
        setActiveCategory(firstAvailable.value);
      }
    }
  }, [
    entityDescriptions,
    i18n.language,
    initialCategories,
    user,
    activeCategory,
    disabledEntities
  ]);

  const customerId = user?.customerId;
  const custSequenceId = user?.sequenceId;
  const userId = user?.userId;

  useEffect(() => {
    if (customerId) setSelectedCustomerId(customerId);
    if (custSequenceId) setSelectedCustSequenceId(custSequenceId);
  }, [customerId, custSequenceId]);

  const mapProductToCardProps = useCallback(
    (product) => {
      const currentLanguage = i18n.language;
      let imageUrls = [];
      if (product.images) {
        try {
          const parsed = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
          if (Array.isArray(parsed)) imageUrls = parsed;
        } catch (e) {
          imageUrls = [product.images];
        }
      }
      let productName = product.productName;
      if (currentLanguage !== "en" && product.productNameLc) {
        productName = product.productNameLc;
      }
      let productDescription = product.description;
      if (currentLanguage !== "en" && (product.description_lc || product.descriptionLc)) {
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

  const handleProductClick = (product) => setSelectedProduct(product);
  const handleClosePopup = () => setSelectedProduct(null);

  const handleQuantityChange = (productId, value) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const moq = Number(product.moq || 0);
    const currentQuantity = quantities[productId] || 0;
    const newQuantity = Math.max(moq, currentQuantity + value);
    setQuantities((prev) => ({ ...prev, [productId]: newQuantity }));
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
          throw new Error("Failed to fetch branches");
        }
        const result = await response.json();
        let branchData = [];
        if (Array.isArray(result)) {
          branchData = result;
        } else if (result.status === "Ok" && Array.isArray(result.data)) {
          branchData = result.data;
        } else if (result && Array.isArray(result.data)) {
          branchData = result.data;
        }

        const branchOptions = branchData.map((branch) => {
          const status = branch.branchStatus.toLowerCase();
          const isApproved = status === "approved";
          return {
            value: String(branch.id || branch.branch_id),
            label: i18n.language === "en" ? branch.branch_name_en || branch.branchNameEn : branch.branch_name_lc || branch.branchNameLc || branch.branch_name_en || branch.branchNameEn,
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

  const handleBranchSelect = async (e) => {
    const newBranchId = e.target.value;
    const currentBranchId = selectedLocation;
    if (newBranchId === currentBranchId) return;
    const selectedBranch = branches.find(
      (b) => String(b.value) === String(newBranchId)
    );
    try {
      setIsLoading(true);
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
      const cartBranchIds = [...new Set(cartItems.map((item) => String(item.branch_id || item.branchId)))];

      if (cartBranchIds.length === 0 || (cartBranchIds.length === 1 && cartBranchIds[0] === newBranchId)) {
        setSelectedLocation(newBranchId);
        if (selectedBranch) {
          setSelectedBranchRegion(selectedBranch.branchRegion || "");
          setSelectedBranchCity(selectedBranch.branchCity || "");
        }
        return;
      }

      const otherBranchId = cartBranchIds.find((id) => id !== newBranchId);
      if (otherBranchId) {
        const otherBranch = branches.find((branch) => String(branch.value) === String(otherBranchId));
        const otherBranchLabel = otherBranch ? otherBranch.label : otherBranchId;

        const { isConfirmed } = await Swal.fire({
          icon: "warning",
          title: t("Discard items?"),
          html: `${t("There are items in the cart for branch")} <strong>${otherBranchLabel}</strong>.<br>${t("Do you want to discard them?")}`,
          showCancelButton: true,
          focusCancel: true,
          confirmButtonText: t("Yes, discard"),
          cancelButtonText: t("No, keep"),
          reverseButtons: true,
        });

        if (isConfirmed) {
          try {
            await fetch(
              `${API_BASE_URL}/cart/delete?customer_id=${selectedCustomerId || customerId}&branch_id=${otherBranchId}`,
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
              text: t(`Items discarded from the cart for branch ${otherBranchLabel}`),
              confirmButtonText: t("OK"),
            });
          } catch (deleteError) {
            await Swal.fire({
              icon: "error",
              title: t("Error"),
              text: t("Failed to discard items from the cart. Please try again."),
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

  const handleAddToCart = async (productId) => {
    setIsAdding(productId);
    try {
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
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      const moq = Number(product.moq);
      let quantity = quantities[productId];
      if (quantity < moq) {
        quantity = moq;
        setQuantities((prev) => ({ ...prev, [productId]: moq }));
      }
      quantity = Math.max(1, quantity);
      const unitPrice = product.unitPrice;
      const netAmount = unitPrice * quantity;
      const vatPercentage = parseFloat(product.vatPercentage) || 0;

      let imageUrls = [];
      if (product.images) {
        try {
          const parsed = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
          if (Array.isArray(parsed)) imageUrls = parsed;
        } catch (e) {
          imageUrls = [product.images];
        }
      }

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

      if (checkResult?.data?.data && checkResult?.data?.data?.length > 0) {
        const existingItem = checkResult?.data?.data[0];
        const updatedQuantity = parseInt(existingItem?.quantityOrdered) + parseInt(quantity);

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
              throw new Error("Failed to update cart item");
            }
            Swal.fire({
              icon: "success",
              title: t("Product quantity updated successfully"),
              showConfirmButton: false,
              timer: 1000,
            });
          }
        });
      } else {
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
          isMachine: product.isMachine,
          isFresh: product.isFresh,
          unitPrice: unitPrice,
          quantityOrdered: parseInt(quantity),
          netAmount: netAmount,
          vatPercentage: user.companyType === "non trading" ? 0.0 : vatPercentage.toFixed(2),
          images: JSON.stringify(imageUrls),
        };
        const response = await fetch(`${API_BASE_URL}/cart`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cartItem),
        });
        if (!response.ok) {
          throw new Error("Failed to add item to cart");
        }
        Swal.fire({
          icon: "success",
          title: t("Product added to cart successfully"),
          showConfirmButton: false,
          timer: 1000,
        });
      }
      if (quantities[productId] < moq) {
        setQuantities((prev) => ({ ...prev, [productId]: 0 }));
      }
    } catch (error) {
      console.error("Error handling product cart action:", error);
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t("Failed to add product to cart. Please try again."),
        confirmButtonText: t("OK"),
      });
    } finally {
      setIsAdding(null);
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
        if (!response.ok) throw new Error("Failed to add to favorites");
      } else {
        const response = await fetch(
          `${API_BASE_URL}/favorites/${user.userId}/${productId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) throw new Error("Failed to remove from favorites");
      }
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, favorite: isFavorite } : p));
      setFilteredProducts((prev) => prev.map((p) => p.id === productId ? { ...p, favorite: isFavorite } : p));
      setDisplayedProducts((prev) => prev.map((p) => p.id === productId ? { ...p, favorite: isFavorite } : p));
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

  useEffect(() => {
    if (products.length > 0) {
      let initialQuantities = { ...quantities };
      let hasChanges = false;
      products.forEach((product) => {
        if (product.moq && (!initialQuantities[product.id] || initialQuantities[product.id] === 0)) {
          initialQuantities[product.id] = Number(product.moq);
          hasChanges = true;
        }
      });
      if (hasChanges) setQuantities(initialQuantities);
    }
  }, [products]);

  const dir = i18n.dir();
  const isRTL = dir === "rtl";

  useEffect(() => {
    const fetchCategories = async () => {
      const selectedCategory = categories.find((cat) => cat.value === activeCategory);
      const entity = selectedCategory?.entity;
      if (!entity) {
        setCategoryOptions([]);
        return;
      }
      try {
        const params = new URLSearchParams({ entity: entity });
        if (entity === Constants.ENTITY.VMCO) {
          if (activeCategory === Constants.CATEGORY.VMCO_MACHINES) {
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
        const options = Array.isArray(result.data)
          ? result.data.map(cat => ({ name: cat.category || cat.name || cat, value: cat.category || cat.name || cat }))
          : [];
        setCategoryOptions(options);
      } catch (err) {
        setCategoryOptions([]);
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, [activeCategory, categories, API_BASE_URL]);

  useEffect(() => {
    const fetchSubCategories = async () => {
      const selectedCategoryObj = categories.find((cat) => cat.value === activeCategory);
      const entity = selectedCategoryObj?.entity;
      if (!entity || !categoryFilter) {
        setSubCategoryOptions([]);
        return;
      }
      try {
        const params = new URLSearchParams({ entity: entity, category: categoryFilter });
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
          ? result.data.map(sub => ({ name: sub.subCategory || sub.subcategory || sub.name || sub, value: sub.subCategory || sub.subcategory || sub.name || sub }))
          : [];
        setSubCategoryOptions(options);
      } catch (err) {
        setSubCategoryOptions([]);
        console.error("Error fetching subcategories:", err);
      }
    };
    fetchSubCategories();
  }, [activeCategory, categoryFilter, categories, API_BASE_URL, token]);

  useEffect(() => {
    if (!categoryFilter) {
      setSubCategoryFilter("");
      setSubCategoryOptions([]);
    }
  }, [categoryFilter]);

  return (
    <Sidebar title={t("Catalog")}>
      {isPageLoading ? (
        <div className="loading-container">
          <LoadingSpinner size="medium" />
        </div>
      ) : (
        <div
          className={`catalog-wrapper${isRTL ? " rtl" : ""}`}
          style={{ direction: dir, textAlign: isRTL ? "right" : "left" }}
          dir={dir}
        >
          {activeCategory && (
            <div className={isMobile ? `catalog-fixed-header ${showHeader ? "show" : "hide"}` : "catalog-fixed-header"}>
              {isV("selectBranch") && (
                <div className="catalog-header">
                  <div className="location-selector">
                    <SearchableDropdown
                      id={`location-select-${catalogId}`}
                      name="locationSelect"
                      value={selectedLocation}
                      onChange={handleBranchSelect}
                      options={branches.map((b) => ({ ...b, name: b.label || b.name || b.value, disabled: b.disabled }))}
                      className={isMobile ? "mobile-select-branch location-select" : "location-select"}
                      placeholder={t("Select Branch")}
                      disabled={isLoading || branches.length === 0}
                    />
                    {isLoading && !isMobile && branches.length === 0 && (
                      <div className="dropdown-loading"><LoadingSpinner size="small" /></div>
                    )}
                    {!isLoading && branches.length === 0 && (
                      <div className="no-branches-message">{t("No branches available")}</div>
                    )}
                  </div>
                  {isV("goToCart") && (
                    <button
                      className={`go-to-cart-btn ${!selectedLocation ? "disabled" : ""}`}
                      style={{ opacity: !selectedLocation ? 0.6 : 1, cursor: !selectedLocation ? "not-allowed" : "pointer" }}
                      onClick={handleGoToCart}
                      disabled={!selectedLocation}
                    >
                      <FontAwesomeIcon icon={faShoppingCart} className="cart-icon" />
                      {!isMobile && <span>{t("Go to Cart")}</span>}
                    </button>
                  )}
                </div>
              )}

              <div className="filter-section">
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, overflowX: "auto", scrollbarWidth: "none" }}>
                  <Tabs
                    tabs={filteredCategoryTabs}
                    activeTab={activeCategory}
                    onTabChange={(newCategory) => {
                      const targetTab = filteredCategoryTabs.find(t => t.value === newCategory);
                      if (targetTab && targetTab.disabled) {
                        const categoryInfo = initialCategories.find(c => c.value === newCategory);
                        const entityName = categoryInfo?.entity;
                        const coolingInfo = coolingPeriodData.find(cp => cp.entity === entityName);
                        const timeDisplay = coolingInfo ? coolingInfo.toTime : "later";
                        Swal.fire({
                          icon: 'warning',
                          title: t('Ordering Window Closed'),
                          text: `${t('Ordering window is closed.')} ${t('You may place an order after')} ${timeDisplay}`,
                          confirmButtonText: t('OK')
                        });
                        console.log("Blocked switch to disabled tab:", newCategory);
                        return;
                      }

                      setIsLoading(false);
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

              <div className="search-section">
                <div className="search-container">
                  {isV("search") && (
                    <SearchInput
                      onSearch={(searchTerm) => setSearchQuery(searchTerm)}
                      debounceTime={500}
                    />
                  )}
                  <SearchableDropdown
                    id={`category-filter-${catalogId}`}
                    name="categoryFilter"
                    options={categoryOptions}
                    className={!isMobile ? `category-filter ${[Constants.CATEGORY.VMCO_MACHINES.toLowerCase(), Constants.CATEGORY.VMCO_CONSUMABLES.toLowerCase()].includes(activeCategory.toLowerCase()) ? "tab-linked-filter" : ""}` : `mobile category-filter ${[Constants.CATEGORY.VMCO_MACHINES.toLowerCase(), Constants.CATEGORY.VMCO_CONSUMABLES.toLowerCase()].includes(activeCategory.toLowerCase()) ? "tab-linked-filter" : ""}`}
                    placeholder={t("Category")}
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setSubCategoryFilter("");
                      if (!e.target.value) setSubCategoryOptions([]);
                    }}
                  />
                  <SearchableDropdown
                    id={`subcategory-filter-${catalogId}`}
                    name="subCategoryFilter"
                    options={subCategoryOptions}
                    className={!isMobile ? "category-filter" : "mobile category-filter"}
                    placeholder={!categoryFilter ? t("Select category first") : t("Sub category")}
                    value={subCategoryFilter}
                    onChange={(e) => setSubCategoryFilter(e.target.value)}
                    disabled={!categoryFilter || subCategoryOptions.length === 0}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="catalog-scrollable-content">
            <div className="products-grid">
              {displayedProducts.length > 0 ? (
                displayedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={mapProductToCardProps(product)}
                    quantities={quantities}
                    onQuantityChange={handleQuantityChange}
                    onAddToCart={() => handleAddToCart(product.id)}
                    onProductClick={() => handleProductClick(product)}
                    setQuantities={setQuantities}
                    onToggleFavorite={handleToggleFavorite}
                    isAdding={isAdding}
                  />
                ))
              ) : !isLoading && !isLoadingMore && !hasMore && (
                <div className="no-products-message">
                  {searchQuery ? (
                    <p>{t('No products found matching your search term "{{searchTerm}}".', { searchTerm: searchQuery })}</p>
                  ) : (
                    <p>{t("No products found matching your criteria.")}</p>
                  )}
                </div>
              )}
              {isLoading && !isMobile && (
                <div className="loading-container"><LoadingSpinner size="medium" /></div>
              )}
            </div>
            {isLoading && isMobile && (
              <div className="loading-container"><LoadingSpinner size="medium" /></div>
            )}
            {isLoadingMore && (
              <div className="loading-more-container">
                <LoadingSpinner size="medium" />
                <span className="loading-more-text">{t("Loading more products...")}</span>
              </div>
            )}
            {!hasMore && displayedProducts.length > 0 && !isLoading && !isLoadingMore && (
              <div className="end-of-catalog-message">
                <p>{t("End of product catalog")}</p>
              </div>
            )}
          </div>

          {selectedProduct && (
            <ProductPopup
              product={mapProductToCardProps(selectedProduct)}
              quantities={quantities}
              onQuantityChange={handleQuantityChange}
              onAddToCart={() => handleAddToCart(selectedProduct.id)}
              onInputChange={(itemId, value) => setQuantities({ ...quantities, [itemId]: value })}
              onClose={handleClosePopup}
              isAdding={isAdding}
            />
          )}
        </div>
      )}
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
          .catalog-fixed-header.show {
            top: 0px
          }
          .catalog-fixed-header.hide {
            top: -180px;
            height: 0px;
          }
          .catalog-fixed-header {
            position: relative;
            padding: 0px 10px 5px 10px;
            border-bottom: none !important;
            transition: top 0.35s ease-in-out, height 0.35s ease-in-out;
          }
        }
      `}</style>
    </Sidebar>
  );
}

export default Catalog;