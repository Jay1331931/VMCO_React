import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import QuantityController from '../components/QuantityController';
import Dropdown from '../components/DropDown';
import Tabs from '../components/Tabs';

const products = [
    { id: 1, name: 'Product 1', code: 'SAR24', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCjOB037ulNEDjgZohK5Hr4vNAQ90_ChsFVQ&s' },
    { id: 2, name: 'Product 2', code: 'SAR24', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCjOB037ulNEDjgZohK5Hr4vNAQ90_ChsFVQ&s' },
    { id: 3, name: 'Product 3', code: 'SAR24', image: '' },
    { id: 4, name: 'Product 4', code: 'SAR24', image: '' },
    { id: 5, name: 'Product 5', code: 'SAR24', image: '' },
    { id: 6, name: 'Product 6', code: 'SAR24', image: '' },
    { id: 7, name: 'Product 7', code: 'SAR24', image: '' },
    { id: 8, name: 'Product 8', code: 'SAR24', image: '' },
    { id: 9, name: 'Product 9', code: 'SAR24', image: '' },
    { id: 10, name: 'Product 10', code: 'SAR24', image: '' },
    { id: 11, name: 'Product 11', code: 'SAR24', image: '' },
    { id: 12, name: 'Product 12', code: 'SAR24', image: '' },
    { id: 13, name: 'Product 13', code: 'SAR24', image: '' },
    { id: 14, name: 'Product 14', code: 'SAR24', image: '' },
    { id: 15, name: 'Product 15', code: 'SAR24', image: '' },
    { id: 16, name: 'Product 16', code: 'SAR24', image: '' },
    { id: 17, name: 'Product 17', code: 'SAR24', image: '' },
    { id: 18, name: 'Product 18', code: 'SAR24', image: '' },
    { id: 19, name: 'Product 19', code: 'SAR24', image: '' },
    { id: 20, name: 'Product 20', code: 'SAR24', image: '' },
    { id: 21, name: 'Product 21', code: 'SAR24', image: '' },
    { id: 22, name: 'Product 22', code: 'SAR24', image: '' },
    { id: 23, name: 'Product 23', code: 'SAR24', image: '' },
    { id: 24, name: 'Product 24', code: 'SAR24', image: '' },
    { id: 25, name: 'Product 25', code: 'SAR24', image: '' },
    { id: 26, name: 'Product 26', code: 'SAR24', image: '' },
    { id: 27, name: 'Product 27', code: 'SAR24', image: '' },
    { id: 28, name: 'Product 28', code: 'SAR24', image: '' },
    { id: 29, name: 'Product 29', code: 'SAR24', image: '' },
    { id: 30, name: 'Product 30', code: 'SAR24', image: '' },
    { id: 31, name: 'Product 31', code: 'SAR24', image: '' },
    { id: 32, name: 'Product 32', code: 'SAR24', image: '' },
    { id: 33, name: 'Product 33', code: 'SAR24', image: '' },
    { id: 34, name: 'Product 34', code: 'SAR24', image: '' },
    { id: 35, name: 'Product 35', code: 'SAR24', image: '' },
    { id: 36, name: 'Product 36', code: 'SAR24', image: '' },
    { id: 37, name: 'Product 37', code: 'SAR24', image: '' },
    { id: 38, name: 'Product 38', code: 'SAR24', image: '' },
    { id: 39, name: 'Product 39', code: 'SAR24', image: '' },
    { id: 40, name: 'Product 40', code: 'SAR24', image: '' },
    { id: 41, name: 'Product 41', code: 'SAR24', image: '' },
    { id: 42, name: 'Product 42', code: 'SAR24', image: '' },
    { id: 43, name: 'Product 43', code: 'SAR24', image: '' },
    { id: 44, name: 'Product 44', code: 'SAR24', image: '' },
    { id: 45, name: 'Product 45', code: 'SAR24', image: '' },
    { id: 46, name: 'Product 46', code: 'SAR24', image: '' },
    { id: 47, name: 'Product 47', code: 'SAR24', image: '' },
    { id: 48, name: 'Product 48', code: 'SAR24', image: '' },
    { id: 49, name: 'Product 49', code: 'SAR24', image: '' },
    { id: 50, name: 'Product 50', code: 'SAR24', image: '' },
    { id: 51, name: 'Product 51', code: 'SAR24', image: '' },
    { id: 52, name: 'Product 52', code: 'SAR24', image: '' },
    { id: 53, name: 'Product 53', code: 'SAR24', image: '' },
    { id: 54, name: 'Product 54', code: 'SAR24', image: '' },
    { id: 55, name: 'Product 55', code: 'SAR24', image: '' },
    { id: 56, name: 'Product 56', code: 'SAR24', image: '' },
    { id: 57, name: 'Product 57', code: 'SAR24', image: '' },
    { id: 58, name: 'Product 58', code: 'SAR24', image: '' },
    { id: 59, name: 'Product 59', code: 'SAR24', image: '' },
    { id: 60, name: 'Product 60', code: 'SAR24', image: '' },
    { id: 61, name: 'Product 61', code: 'SAR24', image: '' },
    { id: 62, name: 'Product 62', code: 'SAR24', image: '' },
    { id: 63, name: 'Product 63', code: 'SAR24', image: '' },
    { id: 64, name: 'Product 64', code: 'SAR24', image: '' },
    { id: 65, name: 'Product 65', code: 'SAR24', image: '' },
    { id: 66, name: 'Product 66', code: 'SAR24', image: '' },
    { id: 67, name: 'Product 67', code: 'SAR24', image: '' },
    { id: 68, name: 'Product 68', code: 'SAR24', image: '' },
    { id: 69, name: 'Product 69', code: 'SAR24', image: '' },
    { id: 70, name: 'Product 70', code: 'SAR24', image: '' },
    { id: 71, name: 'Product 71', code: 'SAR24', image: '' },
    { id: 72, name: 'Product 72', code: 'SAR24', image: '' },
    { id: 73, name: 'Product 73', code: 'SAR24', image: '' },
    { id: 74, name: 'Product 74', code: 'SAR24', image: '' },
    { id: 75, name: 'Product 75', code: 'SAR24', image: '' },
    { id: 76, name: 'Product 76', code: 'SAR24', image: '' },
    { id: 77, name: 'Product 77', code: 'SAR24', image: '' },
    { id: 78, name: 'Product 78', code: 'SAR24', image: '' },
    { id: 79, name: 'Product 79', code: 'SAR24', image: '' },
    { id: 80, name: 'Product 80', code: 'SAR24', image: '' },
    { id: 81, name: 'Product 81', code: 'SAR24', image: '' },
    { id: 82, name: 'Product 82', code: 'SAR24', image: '' },
    { id: 83, name: 'Product 83', code: 'SAR24', image: '' },
    { id: 84, name: 'Product 84', code: 'SAR24', image: '' },
    { id: 85, name: 'Product 85', code: 'SAR24', image: '' },
    { id: 86, name: 'Product 86', code: 'SAR24', image: '' },
    { id: 87, name: 'Product 87', code: 'SAR24', image: '' },
    { id: 88, name: 'Product 88', code: 'SAR24', image: '' },
    { id: 89, name: 'Product 89', code: 'SAR24', image: '' },
    { id: 90, name: 'Product 90', code: 'SAR24', image: '' },
    { id: 91, name: 'Product 91', code: 'SAR24', image: '' },
    { id: 92, name: 'Product 92', code: 'SAR24', image: '' },
    { id: 93, name: 'Product 93', code: 'SAR24', image: '' },
    { id: 94, name: 'Product 94', code: 'SAR24', image: '' },
    { id: 95, name: 'Product 95', code: 'SAR24', image: '' },
    { id: 96, name: 'Product 96', code: 'SAR24', image: '' },
    { id: 97, name: 'Product 97', code: 'SAR24', image: '' },
    { id: 98, name: 'Product 98', code: 'SAR24', image: '' },
    { id: 99, name: 'Product 99', code: 'SAR24', image: '' },
    { id: 100, name: 'Product 100', code: 'SAR24', image: '' }
];

const categories = ['VMCO Machines', 'VMCO Other', 'Diayafa', 'Green Mart', 'Naqui'];

function Catalog() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState('VMCO Machines');
    const [selectedLocation, setSelectedLocation] = useState('JP Nagar');
    const [quantities, setQuantities] = useState({});
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [displayedProducts, setDisplayedProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const productsPerPage = 12;

    const locations = [
        { value: 'JP Nagar', label: 'JP Nagar' },
        { value: 'Jayanagar', label: 'Jayanagar' },
        { value: 'Banashankari', label: 'Banashankari' }
    ];

    const categoryOptions = [
        { value: '', label: 'Category' },
        { value: 'category1', label: 'Category 1' },
        { value: 'category2', label: 'Category 2' }
    ];

    const subcategoryOptions = [
        { value: '', label: 'Sub Category' },
        { value: 'sub1', label: 'Sub Category 1' },
        { value: 'sub2', label: 'Sub Category 2' }
    ];

    const categoryTabs = categories.map(category => ({
        value: category,
        label: category
    }));

    const loadMoreProducts = useCallback(() => {
        setIsLoading(true);
        setTimeout(() => {
            const startIndex = (currentPage - 1) * productsPerPage;
            const endIndex = startIndex + productsPerPage;
            const newProducts = products.slice(startIndex, endIndex).map(product => ({
                ...product,
                uniqueId: `${product.id}-${currentPage}` // Add unique identifier
            }));
            
            setDisplayedProducts(prev => [...prev, ...newProducts]);
            setIsLoading(false);
        }, 1000);
    }, [currentPage, productsPerPage]);

    useEffect(() => {
        loadMoreProducts();
    }, [currentPage, loadMoreProducts]);

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
    }, [displayedProducts.length, isLoading]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectedProduct) {
                const popup = document.querySelector('.product-popup');
                if (popup && !popup.contains(event.target)) {
                    setSelectedProduct(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedProduct]);

    const handleQuantityChange = (productId, value) => {
        setQuantities(prev => ({
            ...prev,
            [productId]: Math.max(0, Number(prev[productId] || 0) + value)
        }));
    };

    const handleGoToCart = () => {
        navigate('/Cart');
    };

    const handleProductClick = (product) => {
        setSelectedProduct(product);
    };

    const handleClosePopup = () => {
        setSelectedProduct(null);
    };

    return (
        <Sidebar title={t('Catalog')}>
            <div className="catalog-content">
                <div className="catalog-header">
                    <div className="location-selector">
                        <Dropdown
                            id="locationSelect"
                            name="locationSelect"
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            options={locations}
                            className="location-select"
                            label="Delivery to:"
                        />
                    </div>
                </div>

                <Tabs
                    tabs={categoryTabs}
                    activeTab={activeCategory}
                    onTabChange={setActiveCategory}
                    variant="category"
                />

                <div className="search-section">
                    <div className="search-container">
                        <input 
                            type="text" 
                            id="productSearch"
                            name="productSearch"
                            placeholder={t('Search...')} 
                            className="catalog-search" 
                        />
                    </div>
                    <div className="filter-section">
                        <Dropdown
                            id="categoryFilter"
                            name="categoryFilter"
                            options={categoryOptions}
                            className="category-filter"
                            placeholder="Category"
                        />
                        <Dropdown
                            id="subcategoryFilter"
                            name="subcategoryFilter"
                            options={subcategoryOptions}
                            className="subcategory-filter"
                            placeholder="Sub Category"
                        />
                    </div>
                    <button className="go-to-cart-btn" onClick={handleGoToCart}>
                        <FontAwesomeIcon icon={faShoppingCart} className="cart-icon" />
                        <span>{t('Go to Cart')}</span>
                    </button>
                </div>

                <div className="products-grid">
                    {displayedProducts.map((product) => (
                        <ProductCard
                            key={product.uniqueId} // Use the unique identifier
                            product={product}
                            quantities={quantities}
                            onQuantityChange={handleQuantityChange}
                            onProductClick={handleProductClick}
                            setQuantities={setQuantities}
                        />
                    ))}
                    {isLoading && (
                        <div className="loading-container">
                            <LoadingSpinner size="medium" />
                        </div>
                    )}
                </div>
            </div>
            {selectedProduct && (
                <div className="product-popup-overlay" onClick={handleClosePopup}>
                    <div className="product-popup" onClick={(e) => e.stopPropagation()}>
                        <button className="popup-close" onClick={handleClosePopup}>×</button>
                        <div className="popup-image-container">
                            {selectedProduct.image ? (
                                <img 
                                    src={selectedProduct.image} 
                                    alt={selectedProduct.name} 
                                    className="popup-image"
                                />
                            ) : (
                                <div className="popup-image"></div>
                            )}
                        </div>
                        <div className="popup-details">
                            <h2>{selectedProduct.name}</h2>
                            <h3 className="product-code">{selectedProduct.code}</h3>
                            <p>{t('description of the product')}</p>
                            <QuantityController 
                                itemId={selectedProduct.id}
                                quantity={quantities[selectedProduct.id] || 0}
                                onQuantityChange={handleQuantityChange}
                                onInputChange={(itemId, value) => setQuantities({
                                    ...quantities,
                                    [itemId]: value
                                })}
                            />
                            <button className="add-to-cart-btn">
                                {t('ADD TO CART')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Sidebar>
    );
}

export default Catalog;