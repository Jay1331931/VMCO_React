import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Template from './template';
import '../styles/components.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const products = [
    { id: 1, name: 'Product Name', code: 'SAR24', image: '' },
    { id: 2, name: 'Product Name', code: 'SAR24', image: '' },
    { id: 3, name: 'Product Name', code: 'SAR24', image: '' },
    { id: 4, name: 'Product Name', code: 'SAR24', image: '' },
    { id: 5, name: 'Product Name', code: 'SAR24', image: '' },
    { id: 6, name: 'Product Name', code: 'SAR24', image: '' },
    { id: 7, name: 'Product Name', code: 'SAR24', image: '' },
    { id: 8, name: 'Product Name', code: 'SAR24', image: '' },
    { id: 9, name: 'Product Name', code: 'SAR24', image: '' },
    { id: 10, name: 'Product Name', code: 'SAR24', image: '' },
    { id: 11, name: 'Product Name', code: 'SAR24', image: '' },
    { id: 12, name: 'Product Name', code: 'SAR24', image: '' },
    { id: 13, name: 'Product Name', code: 'SAR24', image: '' },
    { id: 14, name: 'Product Name', code: 'SAR24', image: '' },
    { id: 15, name: 'Product Name', code: 'SAR24', image: '' },
    { id: 16, name: 'Product Name', code: 'SAR24', image: '' },
    { id: 17, name: 'Product Name', code: 'SAR24', image: '' },
    { id: 18, name: 'Product Name', code: 'SAR24', image: '' },
    { id: 19, name: 'Product Name', code: 'SAR24', image: '' },
    { id: 20, name: 'Product Name', code: 'SAR24', image: '' },
];

const categories = ['VMCO Machines', 'VMCO Other', 'Diayafa', 'Green Mart', 'Naqui'];

function Catalog() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isActionMenuOpen, setActionMenuOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('VMCO Machines');
    const [selectedLocation, setSelectedLocation] = useState('JP Nagar');
    const actionMenuRef = useRef(null);
    const [quantities, setQuantities] = useState({});

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
                setActionMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleQuantityChange = (productId, value) => {
        setQuantities(prev => ({
            ...prev,
            [productId]: Math.max(0, Number(prev[productId] || 0) + value)
        }));
    };

    const handleGoToCart = () => {
        navigate('/Cart');
    };

    return (
        <Template title={t('Catalog')}>
            <div className="catalog-content">
                <div className="catalog-header">
                    <div className="location-selector">
                        <span>Delivery to:</span>
                        <select
                            id="locationSelect"
                            name="locationSelect"
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="location-select"
                        >
                            <option value="JP Nagar">JP Nagar</option>
                            <option value="Jayanagar">Jayanagar</option>
                            <option value="Banashankari">Banashankari</option>
                        </select>
                    </div>
                </div>

                <div className="category-tabs">
                    {categories.map((category) => (
                        <button
                            key={category}
                            className={`category-tab ${activeCategory === category ? 'active' : ''}`}
                            onClick={() => setActiveCategory(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>

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
                        <select 
                            className="category-filter"
                            id="categoryFilter"
                            name="categoryFilter"
                        >
                            <option value="">Category</option>
                            <option value="category1">Category 1</option>
                            <option value="category2">Category 2</option>
                        </select>
                        <select 
                            className="subcategory-filter"
                            id="subcategoryFilter"
                            name="subcategoryFilter"
                        >
                            <option value="">Sub Category</option>
                            <option value="sub1">Sub Category 1</option>
                            <option value="sub2">Sub Category 2</option>
                        </select>
                    </div>
                    <button className="go-to-cart-btn" onClick={handleGoToCart}>
                        <FontAwesomeIcon icon={faShoppingCart} className="cart-icon" />
                        <span>{t('Go to Cart')}</span>
                    </button>
                </div>

                <div className="products-grid">
                    {products.map((product) => (
                        <div key={product.id} className="product-card">
                            <div className="product-image">
                                {/* Placeholder for product image */}
                                <div className="image-placeholder"></div>
                            </div>
                            <div className="product-details">
                                <h3 className="product-name">{product.name}</h3>
                                <p className="product-code">{product.code}</p>
                                <div className="quantity-controls">
                                    <button
                                        className="quantity-btn"
                                        onClick={() => handleQuantityChange(product.id, -1)}
                                    >
                                        <FontAwesomeIcon icon={faMinus} />
                                    </button>
                                    <input
                                        type="number"
                                        className="quantity-input"
                                        id={`quantity-${product.id}`}
                                        name={`quantity-${product.id}`}
                                        value={quantities[product.id] || 0}
                                        onChange={(e) => setQuantities({
                                            ...quantities,
                                            [product.id]: Math.max(0, parseInt(e.target.value) || 0)
                                        })}
                                    />
                                    <button
                                        className="quantity-btn"
                                        onClick={() => handleQuantityChange(product.id, 1)}
                                    >
                                        <FontAwesomeIcon icon={faPlus} />
                                    </button>
                                    <button className="add-to-cart-btn">
                                    {t('ADD TO CART')}
                                </button>
                                </div>
                                
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Template>
    );
}

export default Catalog;