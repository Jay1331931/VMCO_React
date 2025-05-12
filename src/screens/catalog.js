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

const products = [
    { id: 1, name: 'Product 1', code: 'SAR24', image: 'https://shopatshams.com.pk/cdn/shop/products/1117826-1_73225306-dd8e-4b6c-88b0-52e394d10172.jpg?v=1634903061', additionalImages: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCjOB037ulNEDjgZohK5Hr4vNAQ90_ChsFVQ&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH8WOqyNTKBki66sRT-sDV4jXHcJLNvDenLamwNSbcsHGxWUF5Sf1eSqpIQjY1bRO-Uc8&usqp=CAU', 'https://greendroprecycling.com/wp-content/uploads/2017/04/GreenDrop_Station_Aluminum_Can_3.jpg'] },
    { id: 2, name: 'Product 2', code: 'SAR24', image: 'https://driftbasket.com/wp-content/uploads/2024/04/pepsi-BLUE-TITAN-0_33L-SRB_600_600px-e1713358658329.jpg', additionalImages: ['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxPwagsrUPMvuj-3EzzLmaKEd4LqvOym2HobFxeSh9iB3jRcxmTNjazwwj9dC-WddyCrc&usqp=CAU', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH8WOqyNTKBki66sRT-sDV4jXHcJLNvDenLamwNSbcsHGxWUF5Sf1eSqpIQjY1bRO-Uc8&usqp=CAU', 'https://greendroprecycling.com/wp-content/uploads/2017/04/GreenDrop_Station_Aluminum_Can_3.jpg'] },
    { id: 3, name: 'Product 3', code: 'SAR24', image: 'https://m.media-amazon.com/images/I/51Bp30CR3IL.jpg', additionalImages: ['', '', ''] },
    { id: 4, name: 'Product 4', code: 'SAR24', image: 'https://snackstar.in/cdn/shop/products/532b3a20-33f9-495f-b8e5-c3f9bb769888.jpg?v=1598346308', additionalImages: ['', '', ''] },
    { id: 5, name: 'Product 5', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 6, name: 'Product 6', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 7, name: 'Product 7', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 8, name: 'Product 8', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 9, name: 'Product 9', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 10, name: 'Product 10', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 11, name: 'Product 11', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 12, name: 'Product 12', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 13, name: 'Product 13', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 14, name: 'Product 14', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 15, name: 'Product 15', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 16, name: 'Product 16', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 17, name: 'Product 17', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 18, name: 'Product 18', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 19, name: 'Product 19', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 20, name: 'Product 20', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 21, name: 'Product 21', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 22, name: 'Product 22', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 23, name: 'Product 23', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 24, name: 'Product 24', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 25, name: 'Product 25', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 26, name: 'Product 26', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 27, name: 'Product 27', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 28, name: 'Product 28', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 29, name: 'Product 29', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 30, name: 'Product 30', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 31, name: 'Product 31', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 32, name: 'Product 32', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 33, name: 'Product 33', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 34, name: 'Product 34', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 35, name: 'Product 35', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 36, name: 'Product 36', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 37, name: 'Product 37', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 38, name: 'Product 38', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 39, name: 'Product 39', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 40, name: 'Product 40', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 41, name: 'Product 41', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 42, name: 'Product 42', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 43, name: 'Product 43', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 44, name: 'Product 44', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 45, name: 'Product 45', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 46, name: 'Product 46', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 47, name: 'Product 47', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 48, name: 'Product 48', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 49, name: 'Product 49', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 50, name: 'Product 50', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 51, name: 'Product 51', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 52, name: 'Product 52', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 53, name: 'Product 53', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 54, name: 'Product 54', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 55, name: 'Product 55', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 56, name: 'Product 56', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 57, name: 'Product 57', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 58, name: 'Product 58', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 59, name: 'Product 59', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 60, name: 'Product 60', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 61, name: 'Product 61', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 62, name: 'Product 62', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 63, name: 'Product 63', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 64, name: 'Product 64', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 65, name: 'Product 65', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 66, name: 'Product 66', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 67, name: 'Product 67', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 68, name: 'Product 68', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 69, name: 'Product 69', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 70, name: 'Product 70', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 71, name: 'Product 71', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 72, name: 'Product 72', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 73, name: 'Product 73', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 74, name: 'Product 74', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 75, name: 'Product 75', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 76, name: 'Product 76', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 77, name: 'Product 77', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 78, name: 'Product 78', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 79, name: 'Product 79', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 80, name: 'Product 80', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 81, name: 'Product 81', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 82, name: 'Product 82', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 83, name: 'Product 83', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 84, name: 'Product 84', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 85, name: 'Product 85', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 86, name: 'Product 86', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 87, name: 'Product 87', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 88, name: 'Product 88', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 89, name: 'Product 89', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 90, name: 'Product 90', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 91, name: 'Product 91', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 92, name: 'Product 92', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 93, name: 'Product 93', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 94, name: 'Product 94', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 95, name: 'Product 95', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 96, name: 'Product 96', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 97, name: 'Product 97', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 98, name: 'Product 98', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 99, name: 'Product 99', code: 'SAR24', image: '', additionalImages: ['', '', ''] },
    { id: 100, name: 'Product 100', code: 'SAR24', image: '', additionalImages: ['', '', ''] }
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
                uniqueId: `${product.id}-${currentPage}-${Date.now()}`
            }));
            setDisplayedProducts(prev => [...prev, ...newProducts]);
            setIsLoading(false);
        }, 1000);
    }, [currentPage, productsPerPage]);

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
        loadMoreProducts();
    }, [currentPage, loadMoreProducts]);

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
                    <Dropdown
                        id={`category-filter-${catalogId}`}
                        name="categoryFilter"
                        options={categories.map(category => ({ value: category, label: category }))}
                        className="category-filter"
                        placeholder="Category"
                    />
                    <Dropdown
                        id={`category-filter-${catalogId}`}
                        name="categoryFilter"
                        options={categories.map(category => ({ value: category, label: category }))}
                        className="category-filter"
                        placeholder="Sub category"
                    />
                    <button className="go-to-cart-btn" onClick={handleGoToCart}>
                    <FontAwesomeIcon icon={faShoppingCart} className="cart-icon" />
                    <span>{t('Go to Cart')}</span>
                </button>
                </div>
                <div className="search-section">
                    <div className="search-container">
                        <SearchInput />
                    </div>
                </div>
                <div className="products-grid">
                    {displayedProducts.map((product) => (
                        <ProductCard
                            key={product.uniqueId}
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