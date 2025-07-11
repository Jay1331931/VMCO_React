import React, { useState, useEffect, useCallback } from "react";
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

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Initial categories with their corresponding entity values
const initialCategories = [
  {
    value: Constants.CATEGORY.VMCO_MACHINES,
    entity: Constants.ENTITY.VMCO,
    label: Constants.CATEGORY.VMCO_MACHINES,
  },
  {
    value: Constants.CATEGORY.VMCO_CONSUMABLES,
    entity: Constants.ENTITY.VMCO,
    label: Constants.CATEGORY.VMCO_CONSUMABLES,
  },
  {
    value: Constants.ENTITY.SHC,
    entity: Constants.ENTITY.SHC,
    label: "Saudi Hospitality Company",
  },
  {
    value: Constants.ENTITY.GMTC,
    entity: Constants.ENTITY.GMTC,
    label: "Green Mast Factory Ltd",
  },
  {
    value: Constants.ENTITY.NAQI,
    entity: Constants.ENTITY.NAQI,
    label: "Naqi Company",
  },
  {
    value: Constants.ENTITY.DAR,
    entity: Constants.ENTITY.DAR,
    label: "DAR Company",
  },
  {
    value: "SPECIAL_PRODUCTS",
    entity: "", // No specific entity restriction
    label: "Special Products",
  },
  {
    value: "FAVORITES",
    entity: "", // No specific entity restriction 
    label: "Favorites",
  },
];

function Catalog() {
  const location = useLocation();
  const { t, i18n } = useTranslation(); // Get i18n at component level
  const navigate = useNavigate();
  const [categories] = useState(initialCategories); // No need for setCategories anymore
  const [activeCategory, setActiveCategory] = useState(
    initialCategories[0].value
  );
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(""); // Initialize empty
  const [branches, setBranches] = useState([]);
  const [selectedBranchRegion, setSelectedBranchRegion] = useState("");
  const [selectedBranchCity, setSelectedBranchCity] = useState("");
  const [quantities, setQuantities] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // Now represents the max page to load
  const [loadedPages, setLoadedPages] = useState([]); // Track which pages have been loaded
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false); // New state for loading more products
  const [hasMore, setHasMore] = useState(true); // New state to track if there are more products to load
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const productsPerPage = 60;
  const { token, user, isAuthenticated, loading, logout } = useAuth();
  console.log("User Dataaaaa:", user);

  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]); // For category dropdown options
  const [subCategoryOptions, setSubCategoryOptions] = useState([]); // For subcategory dropdown options

  const fetchAllPages = async () => {
    // Show loading state
    if (currentPage === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      // Determine which pages we need to fetch
      const pagesToFetch = [];
      for (let i = 1; i <= currentPage; i++) {
        if (!loadedPages.includes(i)) {
          pagesToFetch.push(i);
        }
      }

      if (pagesToFetch.length === 0) {
        // All needed pages are already loaded
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      // Create a function to fetch a single page
      const fetchPage = async (pageNumber) => {
        const params = new URLSearchParams({
          page: pageNumber,
          pageSize: productsPerPage,
          sortBy: "id",
          sortOrder: "asc",
        });

        // Special handling for the Special Products tab
        if (activeCategory === "SPECIAL_PRODUCTS") {
          params.append("filters", JSON.stringify({ "specialProduct": true }));
          // No entity filtering for special products
        } else if (activeCategory === "FAVORITES") {
          params.append("favorite", "true");
          // No entity filtering for favorites
        } else {
          // Handle entity filtering for regular tabs
          const selectedCategory = categories.find(
            (cat) => cat.value === activeCategory
          );
          const entityToFilter = selectedCategory
            ? selectedCategory.entity
            : null;

          if (entityToFilter) {
            params.append("entity", entityToFilter);

            // Special handling for VMCO entity tabs
            if (entityToFilter === Constants.ENTITY.VMCO) {
              if (activeCategory === Constants.CATEGORY.VMCO_MACHINES) {
                params.append("isMachine", "true");
              } else {
                params.append("isMachine", "false");
              }
            }
          }
        }

        // Add category and subcategory filters
        if (categoryFilter) params.append("category", categoryFilter);
        if (subCategoryFilter) params.append("subCategory", subCategoryFilter);

        // Add search query
        if (searchQuery) {
          params.append("search", searchQuery);
          params.append(
            "searchFields",
            "productName,product_name,product_name_lc,productNameLc"
          );
        }

        const response = await fetch(
          `${API_BASE_URL}/products?${params.toString()}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        const result = await response.json();
        console.log(`Fetched page ${pageNumber} products:`, result);
        // Extract the new products from the response
        let pageProducts = [];
        let totalCount = 0;

        if (result.status === "Ok") {
          pageProducts = result.data.data;
          totalCount = result.data.totalRecords;
        }

        if (Array.isArray(result.data)) {
          pageProducts = result.data.data;
          totalCount = result.length;
        } else if (result.status === "Ok" && Array.isArray(result.data.data)) {
          pageProducts = result.data.data;
          totalCount =
            (result.total !== undefined && Number(result.total)) ||
            (result.pagination &&
              result.pagination.total !== undefined &&
              Number(result.pagination.total)) ||
            result.data.length;
        } else if (result && Array.isArray(result.data.data)) {
          pageProducts = result.data.data;
          totalCount =
            (result.total !== undefined && Number(result.total)) ||
            (result.pagination &&
              result.pagination.total !== undefined &&
              Number(result.pagination.total)) ||
            result.data.length;
        }

        return { pageProducts, totalCount, pageNumber };
      };

      // Key fix: Handle the reset products case differently
      let allProducts = [];
      let newLoadedPages = [];

      // Reset products if we're starting fresh
      if (pagesToFetch.includes(1)) {
        // Just prepare to reset - don't call setState yet
        allProducts = [];
        newLoadedPages = [];
      } else {
        // If not resetting, start with existing data
        allProducts = [...products];
        newLoadedPages = [...loadedPages];
      }

      // Fetch all pages in sequence
      let maxTotalCount = 0;

      for (const page of pagesToFetch) {
        const { pageProducts, totalCount } = await fetchPage(page);

        // Add these products to our collection
        allProducts = [...allProducts, ...pageProducts];
        maxTotalCount = Math.max(maxTotalCount, totalCount);

        // Add to our new loaded pages array
        newLoadedPages.push(page);
      }

      // Set all products and loaded pages at once after we've loaded everything
      setProducts(allProducts);
      setTotalProducts(maxTotalCount);
      setLoadedPages(newLoadedPages);

      // Determine if there are more products to load
      const loadedProductsCount = productsPerPage * Math.max(...newLoadedPages);
      const moreAvailable = loadedProductsCount < maxTotalCount;
      setHasMore(moreAvailable);
    } catch (err) {
      console.error("Error fetching products:", err);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  //NOTE: For fetching the user again after browser refersh - start
  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      console.log("$$$$$$$$$$$ logging out");
      // Logout instead of showing loading message
      logout();
      navigate("/login");
      return; // Return while logout is processing
    }

    if (user && user.userType) {
      const fetchData = async () => {
        // Only fetch products, entity descriptions are fetched separately
        await fetchAllPages();
      };
      fetchData();
    }
  }, [
    user,
    activeCategory,
    categoryFilter,
    subCategoryFilter,
    searchQuery,
    currentPage,
    productsPerPage,
    API_BASE_URL,
  ]);

  //RBAC
  //use formMode to decide if it is editform or add form
  const rbacMgr = new RbacManager(
    user?.userType === "employee" && user?.roles[0] !== "admin"
      ? user?.designation
      : user?.roles[0],
    "catalog"
  );
  const isV = rbacMgr.isV.bind(rbacMgr);

  const categoryTabs = categories.map((category) => ({
    value: category.value,
    label: category.label,
  }));

  const customerId = user?.customerId;
  const userId = user?.userId;
  useEffect(() => {
    if (customerId) {
      setSelectedCustomerId(customerId);
    }
  }, [customerId]);

  // Initial setup when component loads - for default tab

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
      let productName = product.productName || product.product_name;
      if (
        currentLanguage !== "en" &&
        (product.product_name_lc || product.productNameLc)
      ) {
        productName =
          product.product_name_lc || product.productNameLc || productName;
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
        image: imageUrls[0] || "", // Use first image for ProductCard
        images: imageUrls, // Pass all images for ProductPopup
        description: productDescription,
        category: product.category,
        subCategory: product.sub_category || product.subCategory,
        entity: product.entity,
        unit: product.unit,
        vat: product.vatPercentage || product.VAT_percentage,
        moq: product.moq || product.minimumOrderQuantity || 0,
        favorite: product.favorite || false, // Add this line to include favorite status
        ...product,
      };
    },
    [i18n.language]
  );

  useEffect(() => {
   const selectedCategory = categories.find(
      (cat) => cat.value === activeCategory
    );
    const entityToFilter = selectedCategory ? selectedCategory.entity : null;

    let filtered = [...products]; // Create a copy of products array for filtering

    // Filter by entity first
    if (entityToFilter) {
      filtered = filtered.filter((product) => {
        const productEntity = (product.entity || "").toLowerCase();
        return productEntity === entityToFilter.toLowerCase();
      });

      // No special handling for VMCO entities anymore
    }

    // Apply search filter on product name
    if (searchQuery && searchQuery.trim() !== "") {
      const searchLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((product) => {
        const productName = (
          product.productName ||
          product.product_name ||
          ""
        ).toLowerCase();
        const localizedName = (
          product.product_name_lc ||
          product.productNameLc ||
          ""
        ).toLowerCase();
        const productCode = (
          product.erpProdId ||
          product.erp_prod_id ||
          ""
        ).toLowerCase();
        const productDescription = (product.description || "").toLowerCase();
        const localizedDescription = (
          product.description_lc ||
          product.descriptionLc ||
          ""
        ).toLowerCase();

        return (
          productName.includes(searchLower) ||
          localizedName.includes(searchLower) ||
          productCode.includes(searchLower) ||
          productDescription.includes(searchLower) ||
          localizedDescription.includes(searchLower)
        );
      });
    }

    // Apply category filter
    if (categoryFilter && categoryFilter.trim() !== "") {
      filtered = filtered.filter(
        (product) =>
          (product.category || "").toLowerCase() ===
          categoryFilter.toLowerCase()
      );
    }

    // Apply subcategory filter
    if (subCategoryFilter && subCategoryFilter.trim() !== "") {
      filtered = filtered.filter((product) => {
        const subCategory = (
          product.subCategory ||
          product.sub_category ||
          ""
        ).toLowerCase();
        return subCategory === subCategoryFilter.toLowerCase();
      });
    }

    setFilteredProducts(filtered);
    setDisplayedProducts(filtered);
  }, [
    products,
    activeCategory,
    searchQuery,
    categoryFilter,
    subCategoryFilter,
  ]);
  // We no longer need this effect as we're using infinite scroll with server-side pagination    // Auto-loading pagination with delay - now increments maximum page number to load
  useEffect(() => {
    let timeoutId = null;

    // Function to handle automatic loading of more pages
    const loadMorePagesWithDelay = () => {
      // Only load more if there are more products to fetch
      if (
        hasMore &&
        !isLoading &&
        !isLoadingMore &&
        displayedProducts.length < totalProducts
      ) {
        setIsLoadingMore(true);
        timeoutId = setTimeout(() => {
          setCurrentPage((prev) => prev + 1);
        }, 3000);
      }
    };

    if (
      !isLoading &&
      !isLoadingMore &&
      displayedProducts.length > 0 &&
      hasMore &&
      displayedProducts.length < totalProducts
    ) {
      loadMorePagesWithDelay();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [
    currentPage,
    hasMore,
    isLoading,
    isLoadingMore,
    displayedProducts.length,
    totalProducts,
  ]); // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setLoadedPages([]);
    setHasMore(true); // Reset hasMore when filters change to ensure new data is fetched
  }, [activeCategory, categoryFilter, subCategoryFilter, searchQuery]);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const handleClosePopup = () => {
    setSelectedProduct(null);
  };

  // Update the handleQuantityChange function

  const handleQuantityChange = (productId, value) => {
    // Find the product to get its MOQ
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const moq = Number(product.moq || 0);

    // Calculate the new quantity ensuring it doesn't go below MOQ
    const currentQuantity = quantities[productId] || 0;
    const newQuantity = Math.max(moq, currentQuantity + value);

    // Update local state only for immediate UI feedback
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
        selectedBranchId: selectedLocation,
        selectedBranchName: selectedBranch?.label || "",
        selectedBranchNameLc:
          selectedBranch?.branch_name_lc ||
          selectedBranch?.raw?.branchNameLc ||
          "",
        selectedBranchNameEn:
          selectedBranch?.raw?.branchNameEn || selectedBranch?.label || "",
        selectedBranchErpId: selectedBranch?.erpBranchId || "",
        selectedBranchRegion,
        selectedBranchCity
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
          `${API_BASE_URL}/customer-branches/pagination`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            credentials: "include",
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
        } else {
          branchData = [];
        }
        const branchOptions = branchData.map((branch) => ({
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
        }));
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
          },
          credentials: "include",
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
        // Make sure this function is already marked `async` (it looks like it is)

        const { isConfirmed } = await Swal.fire({
          icon: "warning",
          title: t("Discard items?"),
          html: t(
            "There are items in the cart for branch <strong>{{branch}}</strong>.<br>Do you want to discard them?",
            { branch: otherBranchLabel }
          ),
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
                },
                credentials: "include",
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
      // alert('Error checking cart. Branch change may not work correctly.');
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
        // alert(t('Please select a delivery branch first'));
        Swal.fire({
          icon: "warning",
          title: t("No Branch Selected"),
          text: t(
            "Please select a delivery branch before adding products to the cart."
          ),
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
      //const sugarTaxPrice = parseFloat(product.sugarTaxPrice) || 0;

      // Calculate VAT and sugar tax
      const vatAmount = netAmount * (vatPercentage / 100);
      //const sugarTaxAmount = sugarTaxPrice ? netAmount * (sugarTaxPrice / 100) : 0;

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
        `${API_BASE_URL}/cart/pagination?filters={"user_id":${user.userId}, "customer_id":3,"branch_id":${selectedLocation}, "product_id":${productId}}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Send along auth cookies/JWT
        }
      );

      const checkResult = await checkResponse.json();
      console.log("Check cart response:", checkResult);

      if (checkResult.data.data && checkResult.data.data.length > 0) {
        // Item exists in cart, update the quantity
        const existingItem = checkResult.data.data[0];
        const updatedQuantity =
          parseInt(existingItem.quantityOrdered) + parseInt(quantity);

        const updateResponse = await fetch(
          `${API_BASE_URL}/cart/update?customer_id=3&branch_id=${selectedLocation}&product_id=${productId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              quantityOrdered: updatedQuantity,
              netAmount: unitPrice * updatedQuantity,
            }),
          }
        );

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json().catch(() => ({}));
          throw new Error(
            `Failed to update cart item: ${errorData.message || updateResponse.statusText
            }`
          );
        }
        Swal.fire({
          icon: "success",
          title: t("Success"),
          text: t("Product quantity updated in cart successfully"),
          confirmButtonText: t("OK"),
        });
      } else {
        // Item doesn't exist in cart, add it as new
        const cartItem = {
          userId: userId, // Use user ID from auth context
          customerId: selectedCustomerId,
          branchId: selectedLocation,
          branchRegion: selectedBranchRegion,
          productId: product.id,
          productName: product.productName || product.product_name,
          productNameLc: product.productNameLc || product.product_name_lc,
          erpProdId: product.erpProdId || product.erp_prod_id || "",
          moq: product.moq || product.minimumOrderQuantity,
          entity: product.entity, // Keep original case
          category: product.category, // Keep original case
          unit: product.unit,

          // Add the two new properties
          isMachine: product.isMachine, // Add isMachine field
          isFresh: product.isFresh,  // Add isFresh field

          unitPrice: unitPrice,
          quantityOrdered: parseInt(quantity),
          netAmount: netAmount,
          //sugarTaxPrice: sugarTaxPrice.toFixed(2) || '0.00',
          vatPercentage:
            user.companyType === "non trading" ? 0.0 : vatPercentage.toFixed(2),
          images: JSON.stringify(imageUrls), // <-- Add images as JSONB
        };

        console.log("Adding new item to cart:", cartItem);

        const response = await fetch(`${API_BASE_URL}/cart`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
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
          title: t("Success"),
          text: t("Product added to cart successfully"),
          confirmButtonText: t("OK"),
        });
      }

      // Reset quantity after successful add/update
      setQuantities((prev) => ({
        ...prev,
        [productId]: 0,
      }));
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

  // Add this function to your Catalog component

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
          },
          credentials: "include",
          body: JSON.stringify({
            userId: user.userId,
            customerId: selectedCustomerId || user.customerId,
            productId: productId,
            favorite: true
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
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to remove from favorites");
        }
      }

      // Update local state to reflect changes immediately
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, favorite: isFavorite } 
            : product
        )
      );

      // Also update filtered/displayed products
      setFilteredProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, favorite: isFavorite } 
            : product
        )
      );
      setDisplayedProducts(prevProducts => 
        prevProducts.map(product => 
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
    // Get the entity for the current active tab
    const selectedCategory = categories.find(
      (cat) => cat.value === activeCategory
    );
    const entityToFilter = selectedCategory ? selectedCategory.entity : null;

    if (!entityToFilter) return [];

    // First filter by entity
    let filteredProductsByEntity = products.filter(
      (p) => (p.entity || "").toLowerCase() === entityToFilter.toLowerCase()
    ); // Additional filtering for VMCO tabs
    if (
      activeCategory.toLowerCase() ===
      Constants.CATEGORY.VMCO_MACHINES.toLowerCase()
    ) {
      // For VMCO Machines tab, exclude categories that have "consumable" in their name
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
      // For VMCO Consumables tab, exclude categories that have "machine" in their name
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
      // For all other tabs, just filter by entity without special handling
      return Array.from(
        new Set(filteredProductsByEntity.map((p) => p.category).filter(Boolean))
      );
    }
  };

  // Get unique subcategories filtered by the current entity tab and selected category
  const getFilteredSubcategories = () => {
    // Get the entity for the current active tab
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

    // No special handling for VMCO entities anymore

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
  }, [products]); // Only depends on products changing    // Auto-select category based on active tab when products load
  // Removed effect that auto-selects category filter based on tab or products.

  // Determine direction and alignment
  const dir = i18n.dir();
  const isRTL = dir === "rtl";

  // Filter categories based on interCompany status
  const [filteredCategoryTabs, setFilteredCategoryTabs] = useState(categoryTabs);

  // Filter out tabs based on interCompany status
  useEffect(() => {
    if (!user) return;

    // Default to all tabs
    let tabsToShow = categoryTabs;

    // If user is a customer with interCompany set to true, filter out matching entity tabs
    if (user.userType === "customer" && user.interCompany === true && user.entity) {
      const customerEntity = user.entity.toLowerCase();

      tabsToShow = categoryTabs.filter(tab => {
        // Find the original category to get its entity
        const category = categories.find(cat => cat.value === tab.value);

        // If no matching category or no entity, include the tab
        if (!category || !category.entity) return true;

        // If entity matches customer's entity, exclude the tab
        return category.entity.toLowerCase() !== customerEntity;
      });

      // If we filtered all tabs, show the original tabs as fallback
      if (tabsToShow.length === 0) {
        tabsToShow = categoryTabs;
        console.warn("All tabs would be filtered out based on interCompany rules. Showing all tabs instead.");
      }
    }

    setFilteredCategoryTabs(tabsToShow);

    // If current active category is not in filtered tabs, set to first available
    if (tabsToShow.length > 0 && !tabsToShow.some(tab => tab.value === activeCategory)) {
      setActiveCategory(tabsToShow[0].value);
    }
  }, [user, categories.entity, categoryTabs.values, activeCategory]);

  // Fetch categories from API when active tab/entity changes
  useEffect(() => {
    const fetchCategories = async () => {
      const selectedCategory = categories.find(cat => cat.value === activeCategory);
      const entity = selectedCategory?.entity;
      if (!entity) {
        setCategoryOptions([]);
        return;
      }
      try {
        // Build query parameters
        const params = new URLSearchParams({
          entity: entity
        });

        // Add isMachine parameter for VMCO entity tabs
        if (entity === Constants.ENTITY.VMCO) {
          if(activeCategory === Constants.CATEGORY.VMCO_MACHINES){
          const isMachine = true;
          params.append('isMachine', isMachine);
          }
          else {
            const isMachine = false;
            params.append('isMachine', isMachine);
          }
        }

        const response = await fetch(`${API_BASE_URL}/product-categories?${params.toString()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch categories");
        const result = await response.json();
        // Assuming result.data is an array of category names/objects
        const options = Array.isArray(result.data)
          ? result.data.map(cat => ({
              name: cat.category || cat.name || cat, // adapt as per API response
              value: cat.category || cat.name || cat,
            }))
          : [];
        setCategoryOptions(options);
        // Do not select any category by default
      } catch (err) {
        setCategoryOptions([]);
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
    // eslint-disable-next-line
  }, [activeCategory, categories, API_BASE_URL]);

  // Fetch subcategories from API when category or active tab/entity changes
  useEffect(() => {
    const fetchSubCategories = async () => {
      const selectedCategoryObj = categories.find(cat => cat.value === activeCategory);
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
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch subcategories");
        const result = await response.json();
        // Assuming result.data is an array of subcategory names/objects
        const options = Array.isArray(result.data)
          ? result.data.map(sub => ({
              name: sub.subCategory || sub.sub_category || sub.name || sub,
              value: sub.subCategory || sub.sub_category || sub.name || sub,
            }))
          : [];
        setSubCategoryOptions(options);
        // Do not select any subcategory by default
      } catch (err) {
        setSubCategoryOptions([]);
        console.error("Error fetching subcategories:", err);
      }
    };
    fetchSubCategories();
    // eslint-disable-next-line
  }, [activeCategory, categoryFilter, categories, API_BASE_URL]);

  return (
    <Sidebar title={t("Catalog")}>
      <div
        className={`catalog-content${isRTL ? " rtl" : ""}`}
        style={{ direction: dir, textAlign: isRTL ? "right" : "left" }}
        dir={dir}
      >
        {isV("selectBranch") && (
          <div className="catalog-header">
            <div className="location-selector">
              <SearchableDropdown
                id={`location-select-${catalogId}`}
                name="locationSelect"
                value={selectedLocation}
                onChange={handleBranchSelect}
                options={branches.map(b => ({ ...b, name: b.label || b.name || b.value }))}
                className="location-select"
                placeholder={t("Select Branch")}
                disabled={isLoading || branches.length === 0}
              />
              {/* Add a loading indicator within the location selector */}
              {isLoading && branches.length === 0 && (
                <div className="dropdown-loading">
                  <LoadingSpinner size="small" />
                </div>
              )}
              {/* Add an error message if no branches are loaded */}
              {!isLoading && branches.length === 0 && (
                <div className="no-branches-message">
                  {t("No branches available")}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="filter-section">
          <Tabs
            tabs={filteredCategoryTabs}  // Use filtered tabs instead of all tabs
            activeTab={activeCategory}
            onTabChange={(newCategory) => {
              setActiveCategory(newCategory);
              setSearchQuery("");
              setCurrentPage(1);
              setLoadedPages([]);
              setHasMore(true);
              setSubCategoryFilter("");
              setCategoryFilter("");
            }}
            variant="category"
          />
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
              <span>{t("Go to Cart")}</span>
            </button>
          )}
        </div>{" "}
        <div className="search-section">
          <div className="search-container">
            {isV("search") && (
              <SearchInput
                onSearch={(searchTerm) => {
                  setSearchQuery(searchTerm);
                  setCurrentPage(1); // Reset to page 1 when searching
                }}
                debounceTime={500}
              />
            )}{" "}
            <SearchableDropdown
              id={`category-filter-${catalogId}`}
              name="categoryFilter"
              options={categoryOptions}
              className={`category-filter ${[
                Constants.CATEGORY.VMCO_MACHINES.toLowerCase(),
                Constants.CATEGORY.VMCO_CONSUMABLES.toLowerCase(),
              ].includes(activeCategory.toLowerCase())
                ? "tab-linked-filter"
                : ""
                }`}
              placeholder={t("Category")}
              value={categoryFilter}
              onChange={(e) => {
                // Always set category filter from dropdown selection only
                setCategoryFilter(e.target.value);
                setSubCategoryFilter(""); // Reset subcategory when category changes
                setCurrentPage(1);
              }}
            />
            <SearchableDropdown
              id={`subcategory-filter-${catalogId}`}
              name="subCategoryFilter"
              options={subCategoryOptions}
              className="category-filter"
              placeholder={t("Sub category")}
              value={subCategoryFilter}
              onChange={(e) => {
                // Always set subcategory filter from dropdown selection only
                setSubCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              disabled={!categoryFilter}
            />
          </div>
        </div>
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
                onToggleFavorite={handleToggleFavorite} // Add this prop
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
          {isLoading && (
            <div className="loading-container">
              <LoadingSpinner size="medium" />
            </div>
          )}
        </div>
        {/* Separate loading indicator at the bottom of the page */}
        {isLoadingMore &&
          hasMore &&
          displayedProducts.length < totalProducts && (
            <div className="loading-more-container">
              <LoadingSpinner size="medium" />
              <span className="loading-more-text">{t("Loading...")}</span>
            </div>
          )}
        {!hasMore &&
          displayedProducts.length >= totalProducts &&
          !isLoading &&
          !isLoadingMore && (
            <div className="end-of-results-message">
              <p>{t("All products loaded.")}</p>
            </div>
          )}
        {!hasMore &&
          displayedProducts.length > 0 &&
          !isLoading &&
          !isLoadingMore &&
          currentPage < 3 && <div className="end-of-results-message"></div>}
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

      <style jsx="true">{`
        .no-products-message {
          width: 100%;
          height: 200px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 40px 0;
          color: #666;
          font-size: 1.1rem;
          grid-column: 1 / -1;
          margin: 40px auto;
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
        .end-of-results-message {
          width: 100%;
          text-align: center;
          padding: 20px 0;
          color: #666;
          font-size: 0.9rem;
          grid-column: 1 / -1;
          border-top: 1px solid #eee;
          margin-top: 20px;
        }
        /* Style for the category filter to show it's linked to tabs */
        // .category-filter {
        //     background-color: #f5f5f5;
        // }


        @media (max-width: 768px) {
          .product-search-input {
            width: 100%;
            margin-bottom: 10px;
          }

          .search-container {
            flex-direction: column;
          }
        }
      `}</style>
    </Sidebar>
  );
}

export default Catalog;
