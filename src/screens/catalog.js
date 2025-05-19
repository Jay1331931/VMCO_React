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

const categories = ['VMCO Machines', 'VMCO Other', 'Diayafa', 'Green Mart', 'Naqui'];

function Catalog() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState('VMCO Machines');
    const [selectedLocation, setSelectedLocation] = useState('JP Nagar');
    const [quantities, setQuantities] = useState({});
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [products, setProducts] = useState([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [displayedProducts, setDisplayedProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [subCategoryFilter, setSubCategoryFilter] = useState('');
    const productsPerPage = 12;

    const locations = [
        { value: 'JP Nagar', label: 'JP Nagar' },
        { value: 'Jayanagar', label: 'Jayanagar' },
        { value: 'Banashankari', label: 'Banashankari' }
    ];

    const categoryTabs = categories.map(category => ({
        value: category,
        label: category
    }));

    // Fetch products from backend
    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams({
                    Page: currentPage,
                    pageSize: productsPerPage,
                    sortBy: 'id',
                    sortOrder: 'asc',
                });
                if (activeCategory) params.append('entity', activeCategory);
                if (categoryFilter) params.append('category', categoryFilter);
                if (subCategoryFilter) params.append('subCategory', subCategoryFilter);

                const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                const result = await response.json();
                if (result.status === 'Ok' && Array.isArray(result.data)) {
                    setProducts(result.data);
                    setTotalProducts(result.total || result.data.length);
                } else {
                    setProducts([]);
                    setTotalProducts(0);
                }
            } catch (err) {
                setProducts([]);
                setTotalProducts(0);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, [activeCategory, categoryFilter, subCategoryFilter, currentPage, productsPerPage, API_BASE_URL]);


    // Filter products based on tab, category, and subcategory
    useEffect(() => {
        let filtered = products;

        // Filter by tab (entity)
        if (activeCategory) {
            filtered = filtered.filter(
                p => (p.entity || '').toLowerCase() === activeCategory.toLowerCase()
            );
        }

        // Filter by category
        if (categoryFilter) {
            filtered = filtered.filter(
                p => (p.category || '').toLowerCase() === categoryFilter.toLowerCase()
            );
        }

        // Filter by subcategory
        if (subCategoryFilter) {
            filtered = filtered.filter(
                p => (p.subCategory || '').toLowerCase() === subCategoryFilter.toLowerCase()
            );
        }

        setDisplayedProducts(filtered.slice(0, currentPage * productsPerPage));
    }, [products, activeCategory, categoryFilter, subCategoryFilter, currentPage, productsPerPage]);

    // Infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight;
            const scrollTop = document.documentElement.scrollTop;
            const clientHeight = document.documentElement.clientHeight;

            if (scrollTop + clientHeight >= scrollHeight - 20 && !isLoading) {
                if (displayedProducts.length < products.length) {
                    setCurrentPage(prev => prev + 1);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [displayedProducts.length, isLoading, products.length]);

    useEffect(() => {
        setCurrentPage(1); // Reset page when filters change
    }, [activeCategory, categoryFilter, subCategoryFilter]);

    useEffect(() => {
        setDisplayedProducts(products.slice(0, currentPage * productsPerPage));
    }, [products, currentPage, productsPerPage]);

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
                        onTabChange={setActiveCategory}
                        variant="category"
                    />
                    <button className="go-to-cart-btn" onClick={handleGoToCart}>
                        <FontAwesomeIcon icon={faShoppingCart} className="cart-icon" />
                        <span>{t('Go to Cart')}</span>
                    </button>
                </div>
                <div className="search-section">
                    <div className="search-container">
                        <SearchInput />
                        <Dropdown
                            id={`category-filter-${catalogId}`}
                            name="categoryFilter"
                            options={uniqueCategories.map(category => ({ value: category, label: category }))}
                            className="category-filter"
                            placeholder="Category"
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
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
                </div>
                <div className="products-grid">
                    {displayedProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            quantities={quantities}
                            onQuantityChange={handleQuantityChange}
                            onProductClick={handleProductClick}
                        />
                    ))}
                    {isLoading && (
                        <div className="loading-container">
                            <LoadingSpinner size="medium" />
                        </div>
                    )}
                </div>
                {selectedProduct && (
                    <ProductPopup
                        product={selectedProduct}
                        quantities={quantities}
                        onQuantityChange={handleQuantityChange}
                        onInputChange={(itemId, value) => setQuantities({
                            ...quantities,
                            [itemId]: value
                        })}
                        onClose={handleClosePopup}
                    />
                )}
            </div>
        </Sidebar>
    );
}

export default Catalog;