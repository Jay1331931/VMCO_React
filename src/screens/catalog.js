import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Dropdown from '../components/DropDown';
import Tabs from '../components/Tabs';
import ProductPopup from '../components/ProductPopup';
import SearchInput from '../components/SearchInput';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Define categories with their corresponding entity values
const categories = [
    { value: 'VMCO Machines', entity: 'VMCO', label: 'VMCO Machines' },
    { value: 'VMCO Consumables', entity: 'VMCO', label: 'VMCO Consumables' },
    { value: 'Diyafa', entity: 'Diyafa', label: 'Diyafa' },
    { value: 'Green Mast', entity: 'Green Mast', label: 'Green Mast' },
    { value: 'Naqui', entity: 'Naqui', label: 'Naqui' }
];

function Catalog() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState(categories[0].value);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [branches, setBranches] = useState([]);
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
    const [categoryFilter, setCategoryFilter] = useState('');
    const [subCategoryFilter, setSubCategoryFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState("");
    const productsPerPage = 60;
    
    // First filter products based on entity and other criteria
    const [filteredProducts, setFilteredProducts] = useState([]);

    
    const categoryTabs = categories.map(category => ({
        value: category.value,
        label: category.label
    }));

    // Helper function to determine if a product is a machine or not
    const isProductMachine = (product) => {
        if (!product) return false;
        
        // Check explicit productType field first
        if (product.productType === 'machine' || product.product_type === 'machine') return true;
        if (product.productType === 'consumable' || product.product_type === 'consumable') return true;
        
        // Check category and subCategory fields
        const categoryLower = (product.category || '').toLowerCase();
        const subCategoryLower = (product.subCategory || product.sub_category || '').toLowerCase();
        
        // Look for machine-related keywords in category or subcategory
        const machineKeywords = ['machine', 'equipment', 'appliance', 'device'];
        const consumableKeywords = ['consumable', 'supply', 'accessory', 'part'];
        
        // First check for machine keywords
        for (const keyword of machineKeywords) {
            if (categoryLower.includes(keyword) || subCategoryLower.includes(keyword)) {
                return true;
            }
        }
        
        // Then check for consumable keywords - if found, it's definitely not a machine
        for (const keyword of consumableKeywords) {
            if (categoryLower.includes(keyword) || subCategoryLower.includes(keyword)) {
                return false;
            }
        }
        
        // If we can't determine based on keywords, default behavior depends on which tab we're in
        // In most cases, if we can't tell, it's safer to treat as a consumable
        return false;
    };
    
    // Map product fields from backend to component props
    const mapProductToCardProps = (product) => {
        return {
            id: product.id,
            name: product.productName || product.product_name || "Unknown Product", // Support both field formats
            code: product.erpProdId || product.erp_prod_id || "No ID", // Support both field formats
            image: product.image, // Add image URL if available
            description: product.description,
            category: product.category,
            subCategory: product.sub_category || product.subCategory,
            entity: product.entity, // Make sure entity is included in mapped props
            unit: product.unit,
            vat: product.vatPercentage || product.VAT_percentage,
            // Keep the original data too for use in other places
            ...product
        };
    };
    
    // Fetch products from backend - now loads all pages from 1 to currentPage
    useEffect(() => {
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
                        sortBy: 'id',
                        sortOrder: 'asc',
                    });
                    
                    // Handle entity filtering
                    const selectedCategory = categories.find(cat => cat.value === activeCategory);
                    const entityToFilter = selectedCategory ? selectedCategory.entity : null;
                    
                    if (entityToFilter) {
                        params.append('entity', entityToFilter);
                    }

                    // For all tabs, just filter by entity without special handling
                    if (activeCategory === 'VMCO Machines' || activeCategory === 'VMCO Consumables') {
                        params.append('entity', 'VMCO');
                    } else if (activeCategory === 'Diyafa') {
                        params.append('entity', 'Diyafa');
                    } else if (activeCategory === 'Green Mast') {
                        params.append('entity', 'Green Mast');
                    } else if (activeCategory === 'Naqui') {
                        params.append('entity', 'Naqui');
                    }
                    
                    // Add category and subcategory filters
                    if (categoryFilter) params.append('category', categoryFilter);
                    if (subCategoryFilter) params.append('subCategory', subCategoryFilter);
                    
                    // Add search query
                    if (searchQuery) {
                        params.append('search', searchQuery);
                        params.append('searchFields', 'productName,product_name');
                    }

                    const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include'
                    });
                    
                    const result = await response.json();
                    console.log(`Fetched page ${pageNumber} products:`, result);
                    // Extract the new products from the response
                    let pageProducts = [];
                    let totalCount = 0;

                    if(result.status === 'Ok')
                    {
                        pageProducts = result.data.data;
                        totalCount = result.data.totalRecords
                    }
                    
                    if (Array.isArray(result.data)) {
                        pageProducts = result.data.data;
                        totalCount = result.length;
                    } else if (result.status === 'Ok' && Array.isArray(result.data.data)) {
                        pageProducts = result.data.data;
                        totalCount = 
                            (result.total !== undefined && Number(result.total)) ||
                            (result.pagination && result.pagination.total !== undefined && Number(result.pagination.total)) ||
                            result.data.length;
                    } else if (result && Array.isArray(result.data.data)) {
                        pageProducts = result.data.data;
                        totalCount = 
                            (result.total !== undefined && Number(result.total)) ||
                            (result.pagination && result.pagination.total !== undefined && Number(result.pagination.total)) ||
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
                console.error('Error fetching products:', err);
                setHasMore(false);
            } finally {
                setIsLoading(false);
                setIsLoadingMore(false);
            }
        };
        
        fetchAllPages();
    }, [activeCategory, categoryFilter, subCategoryFilter, searchQuery, currentPage, productsPerPage, API_BASE_URL]);
    // Filter products based on tab, category, and subcategory
    useEffect(() => {
        // We're already filtering server-side via API params, but we also handle client-side filtering
        // for better UX while waiting for API responses
        // Get the entity value for the selected category tab
        const selectedCategory = categories.find(cat => cat.value === activeCategory);
        const entityToFilter = selectedCategory ? selectedCategory.entity : null;
        
        let filtered = [...products]; // Create a copy of products array for filtering
        
        // Filter by entity first
        if (entityToFilter) {
            filtered = filtered.filter(product => {
                const productEntity = (product.entity || '').toLowerCase();
                return productEntity === entityToFilter.toLowerCase();
            });
            
            // No special handling for VMCO entities anymore
        }
        
        // Apply search filter on product name
        if (searchQuery && searchQuery.trim() !== '') {
            const searchLower = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(product => {
                const productName = (product.productName || product.product_name || '').toLowerCase();
                const productCode = (product.erpProdId || product.erp_prod_id || '').toLowerCase();
                const productDescription = (product.description || '').toLowerCase();
                
                return productName.includes(searchLower) || 
                       productCode.includes(searchLower) ||
                       productDescription.includes(searchLower);
            });
        }
        
        // Apply category filter
        if (categoryFilter && categoryFilter.trim() !== '') {
            filtered = filtered.filter(product => 
                (product.category || '').toLowerCase() === categoryFilter.toLowerCase()
            );
        }
        
        // Apply subcategory filter
        if (subCategoryFilter && subCategoryFilter.trim() !== '') {
            filtered = filtered.filter(product => {
                const subCategory = (product.subCategory || product.sub_category || '').toLowerCase();
                return subCategory === subCategoryFilter.toLowerCase();
            });
        }
        
        setFilteredProducts(filtered);
        setDisplayedProducts(filtered);
        
    }, [products, activeCategory, searchQuery, categoryFilter, subCategoryFilter]);
      // We no longer need this effect as we're using infinite scroll with server-side pagination    // Auto-loading pagination with delay - now increments maximum page number to load
    useEffect(() => {
        let timeoutId = null;
        
        // Function to handle automatic loading of more pages
        const loadMorePagesWithDelay = () => {
            if (hasMore && !isLoading && !isLoadingMore) {
                setIsLoadingMore(true);
                
                // Wait for 3 seconds before loading the next page set
                timeoutId = setTimeout(() => {
                    // Increment the max page to load - this will trigger loading all pages up to this number
                    setCurrentPage(prev => Math.min(prev + 1, 3)); // Don't go beyond page 3
                }, 3000); // 3 seconds delay
            }
        };
        
        // After products are loaded and we're not in a loading state, set up the next load
        // Only continue if we haven't reached page 3 yet
        if (!isLoading && !isLoadingMore && products.length > 0 && hasMore && currentPage < 3) {
            loadMorePagesWithDelay();
        }
        
        // Clean up the timeout if the component unmounts or dependencies change
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [currentPage, hasMore, isLoading, isLoadingMore, products.length]);    // Reset page when filters change
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

    const handleQuantityChange = (productId, value) => {
        // Update local state only for immediate UI feedback
        const newQuantity = Math.max(0, Number(quantities[productId] || 0) + value);
        setQuantities(prev => ({
            ...prev,
            [productId]: newQuantity
        }));
    };

    const handleGoToCart = () => {
        navigate('/Cart');
    };

    const catalogId = React.useId();

// Get unique categories and subcategories for dropdowns
const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
const uniqueSubCategories = Array.from(new Set(products.map(p => p.subCategory).filter(Boolean)));

// NEW: Branch selection functionality moved here (before add to cart function)
// This useEffect fetches customer branches using the customer_id from the auth token
useEffect(() => {
    const fetchBranches = async () => {
        try {
            setIsLoading(true); // Show loading state while fetching
            
            // The API endpoint already reads the customer_id from the JWT token
            const response = await fetch(`${API_BASE_URL}/customer-branches/pagination`, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include' // This includes the auth token/cookies
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to fetch branches: ${errorData.message || response.statusText}`);
            }
            
            const result = await response.json();
            let branchData = [];
            
            // Handle response structure with better validation
            if (Array.isArray(result)) {
                branchData = result;
            } else if (result.status === 'Ok' && Array.isArray(result.data)) {
                branchData = result.data;
            } else if (result && Array.isArray(result.data)) {
                branchData = result.data;
            } else {
                console.warn('Unexpected branch data format:', result);
                branchData = [];
            }
            
            // Map branches to dropdown format with proper field validation
            const branchOptions = branchData.map(branch => ({
                value: String(branch.id || branch.branch_id), // Ensure IDs are strings
                label: branch.branch_name_en || branch.branchNameEn,
                erpBranchId: branch.erpBranchId || branch.erp_branch_id, // Use snake_case for ERP ID
                // Keep additional data for reference if needed
                raw: branch
            }));
            
            setBranches(branchOptions);
            
            // Add additional logging to see the actual data structure
            console.log('Fetched branch data:', branchData);
            
        } catch (error) {
            console.error('Error fetching branches:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchBranches();
}, [API_BASE_URL]); 

//  Add to cart functionality
const handleAddToCart = async (productId) => {
    try {
        // Check if a branch is selected
        if (!selectedLocation) {
            alert(t('Please select a delivery branch first'));
            return;
        }
        // Find the product being added
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        // Get the quantity from state, ensuring it's at least 1
        const quantity = Math.max(1, quantities[productId] || 1);
        
        // Calculate needed values
        const unitPrice = product.unitPrice || 1;
        const netAmount = unitPrice * quantity;
        const sugarTaxPrice = product.sugarTaxPrice;

        // First check if this item already exists in the cart
        const checkResponse = await fetch(`${API_BASE_URL}/cart/pagination?customer_id=3&branch_id=${selectedLocation}&product_id=${productId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Send along auth cookies/JWT
        });

        const checkResult = await checkResponse.json();
        console.log('Check cart response:', checkResult);
        
        if (checkResult.data.data && checkResult.data.data.length > 0) {
            // Item exists in cart, update the quantity
            const existingItem = checkResult.data.data[0];
            const updatedQuantity = existingItem.quantityOrdered + quantity;
            
            const updateResponse = await fetch(`${API_BASE_URL}/cart/update?customer_id=3&branch_id=${selectedLocation}&product_id=${productId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    quantityOrdered: updatedQuantity,
                    netAmount: unitPrice * updatedQuantity
                })
            });
            
            if (!updateResponse.ok) {
                const errorData = await updateResponse.json().catch(() => ({}));
                throw new Error(`Failed to update cart item: ${errorData.message || updateResponse.statusText}`);
            }
            
            alert(t('Product quantity updated in cart successfully'));
        } else {
            // Item doesn't exist in cart, add it as new
            const cartItem = {
                customerId: '3',// The customer_id is read from the JWT token in the backend
                branchId: selectedLocation,
                productId: product.id,
                productName: product.productName || product.product_name || '',
                erpProdId: product.erpProdId || product.erp_prod_id || '',
                entity: product.entity || '',
                category: product.category || '',
                unit: product.unit || 'EA',
                unitPrice: unitPrice,
                quantityOrdered: quantity,
                netAmount: netAmount,
                sugarTaxPrice: sugarTaxPrice,
            };
            
            console.log('Adding new item to cart:', cartItem);
            
            const response = await fetch(`${API_BASE_URL}/cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(cartItem)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to add item to cart: ${errorData.message || response.statusText}`);
            }
            
            alert(t('Product added to cart successfully'));
        }
        
        // Reset quantity after successful add/update
        setQuantities(prev => ({
            ...prev,
            [productId]: 0
        }));
        
    } catch (error) {
        console.error('Error handling product cart action:', error);
        alert(t('Failed to update cart. Please try again.'));
    }
};

// Get unique categories filtered by the current entity tab
const getFilteredCategories = () => {
    // Get the entity for the current active tab
    const selectedCategory = categories.find(cat => cat.value === activeCategory);
    const entityToFilter = selectedCategory ? selectedCategory.entity : null;
    
    if (!entityToFilter) return [];
    
    // First filter by entity
    let filteredProductsByEntity = products.filter(p => 
        (p.entity || '').toLowerCase() === entityToFilter.toLowerCase()
    );
    
    // Additional filtering for VMCO tabs
    if (activeCategory === 'VMCO Machines') {
        // For VMCO Machines tab, exclude categories that have "consumable" in their name
        return Array.from(new Set(
            filteredProductsByEntity
                .map(p => p.category)
                .filter(Boolean)
                .filter(category => 
                    !(category.toLowerCase().includes('consumable') || 
                      category.toLowerCase().includes('supply') ||
                      category.toLowerCase().includes('accessory'))
                )
        ));
    } else if (activeCategory === 'VMCO Consumables') {
        // For VMCO Consumables tab, exclude categories that have "machine" in their name
        return Array.from(new Set(
            filteredProductsByEntity
                .map(p => p.category)
                .filter(Boolean)
                .filter(category => 
                    !(category.toLowerCase().includes('machine') || 
                      category.toLowerCase().includes('equipment') ||
                      category.toLowerCase().includes('device'))
                )
        ));
    } else {
        // For all other tabs, just filter by entity without special handling
        return Array.from(new Set(
            filteredProductsByEntity
                .map(p => p.category)
                .filter(Boolean)
        ));
    }
};

// Get unique subcategories filtered by the current entity tab and selected category
const getFilteredSubcategories = () => {
    // Get the entity for the current active tab
    const selectedCategory = categories.find(cat => cat.value === activeCategory);
    const entityToFilter = selectedCategory ? selectedCategory.entity : null;
    
    if (!entityToFilter) return [];
    
    let filteredProducts = products;
    
    // Filter by entity first
    filteredProducts = filteredProducts.filter(
        p => (p.entity || '').toLowerCase() === entityToFilter.toLowerCase()
    );
    
    // No special handling for VMCO entities anymore
    
    // If a category is selected, filter by that category
    if (categoryFilter) {
        filteredProducts = filteredProducts.filter(
            p => (p.category || '').toLowerCase() === categoryFilter.toLowerCase()
        );
    }
    
    // Return unique subcategories from the filtered products
    return Array.from(new Set(
        filteredProducts
            .map(p => p.subCategory || p.sub_category)
            .filter(Boolean)
    ));
};

    return (
        <Sidebar title={t('Catalog')}>
            <div className="catalog-content">
                <div className="catalog-header">
                    <div className="location-selector">
                        <Dropdown
                            id={`location-select-${catalogId}`}
                            name="locationSelect"
                            value={selectedLocation}
                            onChange={(e) => {
                                const selectedValue = e.target.value;
                                
                                // Convert to string to ensure comparison works correctly
                                const selectedBranch = branches.find(branch => String(branch.value) === String(selectedValue));
                                
                                // Save branch name to localStorage if found
                                if (selectedBranch && selectedBranch.label) {
                                    localStorage.setItem('selectedBranchName', selectedBranch.label);
                                    localStorage.setItem('selectedBranchId', selectedBranch.value);
                                    localStorage.setItem('selectedBranchErpId', selectedBranch.erpBranchId);
                                    
                                    console.log('Selected branch:', selectedBranch.label);
                                    console.log('Selected branch ID:', selectedBranch.value);
                                    console.log('Selected branch ERP ID:', selectedBranch.erpBranchId);
                                } else {
                                    console.log('No branch found with id:', selectedValue);
                                    console.log('Available branches:', branches);
                                    console.log('Selected value type:', typeof selectedValue);
                                    console.log('First branch value type:', branches.length > 0 ? typeof branches[0].value : 'No branches');
                                }
                                
                                // Update your local state
                                setSelectedLocation(selectedValue);
                            }}
                            options={branches}
                            className="location-select"
                            label={t("Delivery to:")}
                            placeholder={t("Select branch")} // Add a placeholder
                            disabled={isLoading || branches.length === 0} // Disable when loading or no branches
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
                                {t('No branches available')}
                            </div>
                        )}
                    </div>
                </div>
                <div className="filter-section">
                    <Tabs
                        tabs={categoryTabs}
                        activeTab={activeCategory}
                        onTabChange={(newCategory) => {
                            setActiveCategory(newCategory);
                            // Reset other filters when changing entity
                            setCategoryFilter('');
                            setSubCategoryFilter('');
                            setSearchQuery('');
                            setCurrentPage(1);
                            setLoadedPages([]);
                            setHasMore(true);
                        }}
                        variant="category"
                    />
                    <button 
                        className={`go-to-cart-btn ${!selectedLocation ? 'disabled' : ''}`}
                        style={{opacity: !selectedLocation ? 0.6 : 1, cursor: !selectedLocation ? 'not-allowed' : 'pointer',
                        }}
                        onClick={handleGoToCart}
                        disabled={!selectedLocation}
                    >
                        <FontAwesomeIcon icon={faShoppingCart} className="cart-icon" />
                        <span>{t('Go to Cart')}</span>
                    </button>
                </div>                <div className="search-section">
                    <div className="search-container">
                        <SearchInput 
                            onSearch={(searchTerm) => {
                                setSearchQuery(searchTerm);
                                setCurrentPage(1); // Reset to page 1 when searching
                            }}
                            debounceTime={500} // Increased debounce time for better performance
                            className="product-search-input"
                        />                        
                        <Dropdown
                            id={`category-filter-${catalogId}`}
                            name="categoryFilter"
                            options={getFilteredCategories().map(cat => ({ value: cat, label: cat }))}
                            className="category-filter"
                            placeholder="Category"
                            value={categoryFilter}
                            onChange={e => {
                                setCategoryFilter(e.target.value);
                                setSubCategoryFilter(''); // Reset subcategory when category changes
                                setCurrentPage(1);
                            }}
                        />
                        <Dropdown
                            id={`subcategory-filter-${catalogId}`}
                            name="subCategoryFilter"
                            options={getFilteredSubcategories().map(sub => ({ value: sub, label: sub }))}
                            className="category-filter"
                            placeholder="Sub category"
                            value={subCategoryFilter}
                            onChange={e => {
                                setSubCategoryFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>                <div className="products-grid">
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
                            />
                        ))
                    ) : !isLoading && (
                        <div className="no-products-message">
                            {searchQuery ? (
                                <p>{t('No products found matching your search term "{{searchTerm}}".', { searchTerm: searchQuery })}</p>
                            ) : (
                                <p>{t('No products found matching your criteria.')}</p>
                            )}
                        </div>
                    )}
                    {isLoading && (
                        <div className="loading-container">
                            <LoadingSpinner size="medium" />
                        </div>
                    )}
                </div>                {/* Separate loading indicator at the bottom of the page */}
                {isLoadingMore && (
                    <div className="loading-more-container">
                        <LoadingSpinner size="medium" />
                        <span className="loading-more-text">
                            {currentPage === 1 ? 
                                t('Loading page 2...') : 
                                currentPage === 2 ? 
                                    t('Loading page 3...') : 
                                    t('Loading more products...')}
                        </span>
                    </div>
                )}
                {!hasMore && displayedProducts.length > 0 && !isLoading && !isLoadingMore && currentPage >= 3 && (
                    <div className="end-of-results-message">
                        <p>{t('All pages loaded. Showing pages 1-3.')}</p>
                    </div>
                )}
                {!hasMore && displayedProducts.length > 0 && !isLoading && !isLoadingMore && currentPage < 3 && (
                    <div className="end-of-results-message">
                    </div>
                )}
                {selectedProduct && (
                    <ProductPopup
                        product={mapProductToCardProps(selectedProduct)}
                        quantities={quantities}
                        onQuantityChange={handleQuantityChange}
                        onAddToCart={() => handleAddToCart(selectedProduct.id)}
                        onInputChange={(itemId, value) => setQuantities({
                            ...quantities,
                            [itemId]: value
                        })}
                        onClose={handleClosePopup}
                    />
                )}
            </div>            <style jsx="true">{`
                .no-products-message {
                    width: 100%;
                    text-align: center;
                    padding: 40px 0;
                    color: #666;
                    font-size: 1.1rem;
                    grid-column: 1 / -1;
                }
                
                .product-search-input {
                    padding: 10px 15px;
                    width: 300px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 1rem;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    transition: all 0.2s ease;
                    margin-right: 10px;
                }
                
                .product-search-input:focus {
                    border-color: #0a5640;
                    box-shadow: 0 2px 8px rgba(10, 86, 64, 0.15);
                    width: 320px;
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
                .category-filter {
                    background-color: #f5f5f5;
                }
                
                
                .tab-linked-filter::after {
                    content: '(Linked to tabs)';
                    position: absolute;
                    bottom: -16px;
                    left: 0;
                    font-size: 10px;
                    color: #666;
                    font-style: italic;
                }
                
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
