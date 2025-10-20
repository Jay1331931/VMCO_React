import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QuantityController from './QuantityController';
import { useAuth } from '../context/AuthContext';
import RbacManager from '../utilities/rbac';
import FavButton from './FavButton';

const ProductCard = ({
    product,
    quantities,
    onQuantityChange,
    onProductClick,
    setQuantities,
    onAddToCart,
    onToggleFavorite
}) => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();

    // Initialize RBAC manager
    const rbacMgr = new RbacManager(
        user?.userType === 'employee' && user?.roles[0] !== 'admin'
            ? user?.designation
            : user?.roles?.[0],
        "catalog"
    );
    const isV = rbacMgr.isV.bind(rbacMgr);
    const isE = rbacMgr.isE.bind(rbacMgr);

    // Initialize with default value of 0, not MOQ
    useEffect(() => {
        if (product && quantities[product.id] === undefined) {
            setQuantities(prev => ({
                ...prev,
                [product.id]: 0  // Start with 0, let QuantityController show MOQ as display value
            }));
        }
    }, [product, quantities, setQuantities]);

    const handleQuantityInputChange = (productId, value) => {
        // Allow any input value, including strings and empty values
        setQuantities(prev => ({
            ...prev,
            [product.id]: value  // Store the exact value without any transformation
        }));
    };

    const handleQuantityButtonChange = (productId, delta) => {
        const currentQty = typeof quantities[product.id] === 'number' ? quantities[product.id] : parseInt(quantities[product.id]) || 0;
        const newQty = currentQty + delta;
        
        setQuantities(prev => ({
            ...prev,
            [product.id]: Math.max(0, newQty)  // Don't allow negative quantities
        }));
    };

    const handleAddToCart = (e) => {
        e.stopPropagation();
        onAddToCart(product.id);
    }

    const handleFavoriteToggle = (newState) => {
        onToggleFavorite(product.id, newState);
    };

    // Determine direction and alignment
    const dir = i18n.dir();
    const isRTL = dir === 'rtl';

    return (
        <div
            className={`product-card${isRTL ? ' rtl' : ''}`}
            onClick={() => onProductClick(product)}
            style={{ cursor: 'pointer', direction: dir, textAlign: isRTL ? 'right' : 'left' }}
            dir={dir}
        >
            {isV('favoriteButton') && (
                <FavButton
                    initialState={product.favorite || false}
                    onToggle={handleFavoriteToggle}
                />
            )}

            <div className="product-image-container">
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        className="responsive-product-image"
                    />
                ) : (
                    <div className="product-image-placeholder">No Image</div>
                )}
            </div>

            <div className="product-details">
                <h3 className="product-name" title={product.name}>{product.name}</h3>
                <p className="product-code">{product.code}</p>
                {product.entity && <p className="product-entity">{product.entity?.toUpperCase()}</p>}
                <h4 className="unit-price" style={{ color: "#6c7584" }}>{t('Price: ')}{(product.unitPrice).toFixed(2)}</h4>
                <div className="buttons-container">
                    {isV('quantityController') && (
                        <QuantityController
                            itemId={product.id}
                            quantity={quantities[product.id] !== undefined ? quantities[product.id] : 0}
                            onQuantityChange={handleQuantityButtonChange}
                            onInputChange={handleQuantityInputChange}
                            stopPropagation={true}
                            minQuantity={Number(product.moq) || 0}
                            moq={Number(product.moq) || 0}
                        />
                    )}
                    {isV('addToCart') && (
                        <button
                            className="add-to-cart-btn"
                            onClick={(e) => handleAddToCart(e)}
                            style={{ backgroundColor: '#01594C', color: "#ffffff" }}
                        >
                            {t('ADD TO CART')}
                        </button>
                    )}
                </div>
            </div>
            
            {/* Keep existing styles */}
            <style>{`
                .product-image-container {
                    position: relative;
                    width: 100%;
                }
                
                /* RTL support for favorite button */
                .product-card.rtl .favorite-btn {
                    right: auto;
                    left: 10px;
                }
                
                .buttons-container {
                    display: flex;
                    flex-direction: row;
                    width: 100%;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                }
                
                .product-card {
                    border: 1px solid #D9D9D6;
                    border-radius: 14px;
                    overflow: hidden;
                    background: white;
                    height: 100%;
                    transition: 200ms;
                    position: relative;
                }

                .product-card:hover {
                    transform: scale(1.02);
                    transition: 200ms;
                    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.1);
                }
                
                .product-image {
                    padding: 10px;
                    width: 100%;
                    aspect-ratio: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .image-placeholder {
                    width: 100%;
                    height: 100%;
                    border-radius: 5px;
                    background-color: #D9D9D6;
                }

                .product-details {
                    padding: 15px;
                }

                .product-name {
                    font-size: 1rem;
                    margin: 0 0 5px 0;
                    color: #384152;
                    white-space: nowrap;      
                    overflow: hidden;          
                    text-overflow: ellipsis;  
                    max-width: 100%;         
                    cursor: default;           
                    display: inline-block;
                }

                .product-code {
                    font-size: 0.9rem;
                    color: #6B7280;
                    margin: 0 0 5px 0;
                }

                .product-entity {
                    font-size: 0.8rem;
                    color: #00205B;
                    margin: 0 0 15px 0;
                    padding: 2px 8px;
                    background-color: #f0f4ff;
                    border-radius: 4px;
                    display: inline-block;
                }

                .quantity-controls {
                    display: flex;
                    gap: 0px;
                    margin-top: 15px;
                    margin-bottom: 15px;
                }

                .add-to-cart-btn {
                    width: 160px;
                    height: 30px;
                    padding: 10px 10px;
                    color: white;
                    align-items: center;
                    justify-content: center;
                    display: flex;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.7rem;
                    font-weight: 600;
                }

                @media (max-width: 768px) {
                    .product-card {
                        min-width: 160px;
                        max-width: 100%;
                        padding: 12px 8px 12px 8px;
                        min-height: 260px;
                    }
                    .product-image {
                        height: 90px;
                        margin-bottom: 10px;
                    }
                    .product-name {
                        font-size: 1rem;
                    }
                    .product-code {
                        font-size: 0.9rem;
                    }
                    .add-to-cart-btn {
                        font-size: 0.97rem;
                        padding: 7px 12px;
                        width: 140px !important;
                        font-size: 14px;
                    }
                    
                    .favorite-btn, button[style*="position: absolute"] {
                    left: 5px;
                    right: auto;
            }
                }
                
                .product-card.rtl {
                    direction: rtl;
                    text-align: right;
                }

                .favorite-btn, 
                button[style*="position: absolute"] {
                    opacity: 1 !important;
                    visibility: visible !important;
                    z-index: 8 !important;
                }
            `}</style>
        </div>
    );
};

export default ProductCard;
