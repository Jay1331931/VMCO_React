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
    { value: 'VMCO Consumables', entity: 'VMCO Consumables', label: 'VMCO Consumables' },
    { value: 'Diyafa', entity: 'Diyafa', label: 'Diyafa' },
    { value: 'Green Mast', entity: 'Green Mast', label: 'Green Mast' },
    { value: 'Naqui', entity: 'Naqui', label: 'Naqui' }
];

function Catalog() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState(categories[0].value);
    const [selectedLocation, setSelectedLocation] = useState('JP Nagar');
    const [quantities, setQuantities] = useState({});
    const [selectedProduct, setSelectedProduct] = useState(null);    const [products, setProducts] = useState([]);
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

    const locations = [
        { value: 'JP Nagar', label: 'JP Nagar' },
        { value: 'Jayanagar', label: 'Jayanagar' },
        { value: 'Banashankari', label: 'Banashankari' }
    ];
    
    const categoryTabs = categories.map(category => ({
        value: category.value,
        label: category.label
    }));

    // Helper function to determine if a product is a machine or not
    const isProductMachine = (product) => {
        if (!product) return false;
        
        // Check explicit productType field
        if (product.productType === 'machine') return true;
        
        // Check category and subCategory fields
        const categoryLower = (product.category || '').toLowerCase();
        const subCategoryLower = (product.subCategory || product.sub_category || '').toLowerCase();
        
        // Look for machine-related keywords in category or subcategory
        return categoryLower.includes('machine') || 
               subCategoryLower.includes('machine') ||
               categoryLower.includes('equipment') ||
               subCategoryLower.includes('equipment');
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
    };    // Fetch products from backend - now loads all pages from 1 to currentPage
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
                // If currentPage is 1, fetch page 1
                // If currentPage is 2, fetch pages 1-2 if not already loaded
                // If currentPage is 3, fetch pages 1-3 if not already loaded
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
                
                // Reset products if we're starting fresh
                if (pagesToFetch.includes(1)) {
                    setProducts([]);
                    setLoadedPages([]);
                }
                
                // Create a function to fetch a single page
                const fetchPage = async (pageNumber) => {
                    const params = new URLSearchParams({
                        page: pageNumber,
                        pageSize: productsPerPage,
                        sortBy: 'id',
                        sortOrder: 'asc',
                    });
                    
                    // Handle entity filtering - this is the category tab selected by the user
                    const selectedCategory = categories.find(cat => cat.value === activeCategory);
                    const entityToFilter = selectedCategory ? selectedCategory.entity : null;
                    if (entityToFilter) {
                        params.append('entity', entityToFilter);
                        // Some APIs might use 'entityName' instead of 'entity'
                        params.append('entityName', entityToFilter);
                    }

                    // For VMCO Machines and VMCO Consumables, add additional filtering
                    if (activeCategory === 'VMCO Machines') {
                        params.append('productType', 'vmco');
                    } else if (activeCategory === 'Diyafa') {
                        params.append('productType', 'Diyafa');
                    } else if (activeCategory === 'VMCO Consumables') {
                        params.append('productType', 'vmco consumables');
                    }
                    else if (activeCategory === 'Green Mast') {
                        params.append('productType', 'green mast');
                    }
                    else if (activeCategory === 'Naqui') {
                        params.append('productType', 'naqui');
                    }
                    
                    // Add category and subcategory filters
                    if (categoryFilter) params.append('category', categoryFilter);
                    if (subCategoryFilter) params.append('subCategory', subCategoryFilter);
                    
                    // Add search query - search for product name
                    if (searchQuery) {
                        params.append('search', searchQuery);
                        params.append('searchFields', 'productName,product_name'); // Search in product name fields
                    }

                    const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include'
                    });
                    
                    const result = await response.json();
                    
                    // Extract the new products from the response
                    let pageProducts = [];
                    let totalCount = 0;
                    
                    if (Array.isArray(result)) {
                        pageProducts = result;
                        totalCount = result.length;
                    } else if (result.status === 'Ok' && Array.isArray(result.data)) {
                        pageProducts = result.data;
                        totalCount = 
                            (result.total !== undefined && Number(result.total)) ||
                            (result.pagination && result.pagination.total !== undefined && Number(result.pagination.total)) ||
                            result.data.length;
                    } else if (result && Array.isArray(result.data)) {
                        pageProducts = result.data;
                        totalCount = 
                            (result.total !== undefined && Number(result.total)) ||
                            (result.pagination && result.pagination.total !== undefined && Number(result.pagination.total)) ||
                            result.data.length;
                    }
                    
                    return { pageProducts, totalCount, pageNumber };
                };
                
                // Fetch all pages in sequence
                let allProducts = [...products];
                let maxTotalCount = 0;
                
                for (const page of pagesToFetch) {
                    const { pageProducts, totalCount, pageNumber } = await fetchPage(page);
                    
                    // Add these products to our collection
                    allProducts = [...allProducts, ...pageProducts];
                    maxTotalCount = Math.max(maxTotalCount, totalCount);
                    
                    // Mark this page as loaded
                    setLoadedPages(prev => [...prev, pageNumber]);
                }
                
                // Set all products at once after we've loaded everything
                setProducts(allProducts);
                setTotalProducts(maxTotalCount);
                
                // Determine if there are more products to load
                const loadedProductsCount = productsPerPage * Math.max(...pagesToFetch);
                const moreAvailable = loadedProductsCount < maxTotalCount;
                setHasMore(moreAvailable);
                
            } catch (err) {
                console.error('Error fetching products:', err);
                // Don't reset existing products on error
                setHasMore(false);
            } finally {
                setIsLoading(false);
                setIsLoadingMore(false);
            }
        };
        
        fetchAllPages();
    }, [activeCategory, categoryFilter, subCategoryFilter, searchQuery, currentPage, productsPerPage, API_BASE_URL, loadedPages, products]);// Filter products based on tab, category, and subcategory
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
            
            // For VMCO entities, filter by product type (machine vs other)
            if (entityToFilter === 'VMCO') {
                const isVMCOMachines = activeCategory === 'VMCO Machines';
                filtered = filtered.filter(product => {
                    const isMachine = isProductMachine(product);
                    return isVMCOMachines ? isMachine : !isMachine;
                });
            }
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
        // We now set displayed products directly to filtered products
        // No need for pagination here since we handle that with server-side fetching
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
        setQuantities(prev => ({
            ...prev,
            [productId]: Math.max(0, Number(prev[productId] || 0) + value)
        }));
    };

    const handleGoToCart = () => {
        navigate('/Cart');
    };

    const catalogId = React.useId();

    // Get unique categories and subcategories for dropdowns
    const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    const uniqueSubCategories = Array.from(new Set(products.map(p => p.subCategory).filter(Boolean)));

    // Notes on the catalog entity filtering:
    // 1. Each tab corresponds to a specific entity:
    //    - VMCO Machines: Shows VMCO products that are machines
    //    - VMCO Other: Shows VMCO products that are not machines
    //    - Diyafa: Shows only Diyafa products
    //    - Green Mast: Shows only Green Mast products
    //    - Naqui: Shows only Naqui products
    // 2. Filtering happens at both server-side (API) and client-side
    // 3. When changing tabs, other filters (category, subcategory, search) are reset

    return (
        <Sidebar title={t('Catalog')}>
            <div className="catalog-content">
                <div className="catalog-header">
                    <div className="location-selector">
                        <Dropdown
                            id={`location-select-${catalogId}`}
                            name="locationSelect"
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            options={locations}
                            className="location-select"
                            label={t("Delivery to:")}
                        />
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
                        }}
                        variant="category"
                    />
                    <button className="go-to-cart-btn" onClick={handleGoToCart}>
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
                            options={categoryTabs} // Use categoryTabs to match the tab options
                            className="category-filter tab-linked-filter"
                            placeholder="Category"
                            value={activeCategory} // Set value to match the active tab
                            onChange={e => {
                                // This won't be triggered since the dropdown is disabled
                                // but keep it for consistency
                                setActiveCategory(e.target.value);
                                setCategoryFilter('');
                                setSubCategoryFilter('');
                            }}
                            disabled={true} // Disable the dropdown
                        />
                        <Dropdown
                            id={`subcategory-filter-${catalogId}`}
                            name="subCategoryFilter"
                            options={uniqueSubCategories.map(sub => ({ value: sub, label: sub }))}
                            className="category-filter"
                            placeholder="Sub category"
                            value={subCategoryFilter}
                            onChange={e => setSubCategoryFilter(e.target.value)}
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
