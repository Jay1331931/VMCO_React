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
    onToggleFavorite,
    isAdding,
    isMobile = false
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
                [product.id]: 0
            }));
        }
    }, [product, quantities, setQuantities]);

    const handleQuantityInputChange = (productId, value) => {
        setQuantities(prev => ({
            ...prev,
            [product.id]: value
        }));
    };

    const handleQuantityButtonChange = (productId, delta) => {
        const currentQty = typeof quantities[product.id] === 'number' ? quantities[product.id] : parseInt(quantities[product.id]) || 0;
        const newQty = currentQty + delta;

        setQuantities(prev => ({
            ...prev,
            [product.id]: Math.max(0, newQty)
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
            className={`product-card ${isMobile ? 'mobile-layout' : 'desktop-layout'}${isRTL ? ' rtl' : ''}`}
            onClick={() => onProductClick(product)}
            style={{ cursor: 'pointer', direction: dir, textAlign: isRTL ? 'right' : 'left' }}
            dir={dir}
        >
            {isV('favoriteButton') && !isMobile && (
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
                <div className="product-info-section">
                    <h3 className="product-name" title={product.name}>{product.name}</h3>
                    <p className="product-code">{product.code}</p>
                    <h4 className="unit-price">{t('Price: ')}{(product.unitPrice).toFixed(2)}</h4>
                </div>
                
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
                            disabled={isAdding}
                        >
                            {isAdding === product?.id ? t('ADDING...') : t('ADD TO CART')}
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                /* Desktop Layout - Vertical Card */
                .product-card.desktop-layout {
                    border: 1px solid #D9D9D6;
                    border-radius: 14px;
                    overflow: hidden;
                    background: white;
                    height: 100%;
                    transition: 200ms;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                }

                .product-card.desktop-layout:hover {
                    transform: scale(1.02);
                    transition: 200ms;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }

                .product-card.desktop-layout .product-image-container {
                    position: relative;
                    width: 100%;
                    padding: 10px;
                    aspect-ratio: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .product-card.desktop-layout .responsive-product-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 8px;
                }

                .product-card.desktop-layout .product-details {
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .product-card.desktop-layout .product-name {
                    font-size: 1rem;
                    margin: 0 0 5px 0;
                    color: #384152;
                    white-space: nowrap;      
                    overflow: hidden;          
                    text-overflow: ellipsis;  
                    max-width: 100%;         
                    cursor: default;
                }

                .product-card.desktop-layout .product-code {
                    font-size: 0.9rem;
                    color: #6B7280;
                    margin: 0 0 5px 0;
                }

                .product-card.desktop-layout .unit-price {
                    font-size: 1rem;
                    font-weight: 600;
                    margin: 0 0 10px 0;
                    color: #6c7584 !important;
                }

                /* Mobile Layout - Horizontal Card */
                .product-card.mobile-layout {
                    border: 1px solid #E5E7EB;
                    border-radius: 12px;
                    overflow: visible;
                    background: white;
                    transition: 200ms;
                    position: relative;
                    display: flex;
                    flex-direction: row;
                    align-items: flex-start;
                    padding: 12px;
                    gap: 12px;
                    min-height: 120px;
                    width: 100% !important;
                    max-width: 100% !important;
                    box-sizing: border-box;
                    margin: 0 !important;
                }

                .product-card.mobile-layout:active {
                    background-color: #f9fafb;
                }

                .product-card.mobile-layout .product-image-container {
                    position: relative;
                    width: 90px;
                    min-width: 90px;
                    height: 90px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #F3F4F6;
                    border-radius: 8px;
                    overflow: hidden;
                    padding: 0;
                }

                .product-card.mobile-layout .responsive-product-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                    display: block;
                }

                .product-card.mobile-layout .product-image-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #E5E7EB;
                    color: #9CA3AF;
                    font-size: 0.7rem;
                }

                .product-card.mobile-layout .product-details {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 0;
                    gap: 0;
                    min-width: 0;
                    overflow: hidden;
                }

                .product-card.mobile-layout .product-info-section {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    margin-bottom: 8px;
                }

                .product-card.mobile-layout .product-name {
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin: 0;
                    color: #1F2937;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    line-height: 1.3;
                    word-break: break-word;
                }

                .product-card.mobile-layout .product-code {
                    font-size: 0.75rem;
                    color: #6B7280;
                    margin: 0;
                }

                .product-card.mobile-layout .product-entity {
                    font-size: 0.65rem;
                    color: #00205B;
                    margin: 0;
                    padding: 2px 6px;
                    background-color: #EEF2FF;
                    border-radius: 4px;
                    display: inline-block;
                    width: fit-content;
                }

                .product-card.mobile-layout .unit-price {
                    font-size: 0.85rem;
                    font-weight: 700;
                    margin: 0;
                    color: #374151 !important;
                }

                .product-card.mobile-layout .buttons-container {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: space-between;
                    gap: 6px;
                    margin-top: auto;
                    width: 100%;
                }

                /* Common Styles */
                .product-image-container {
                    position: relative;
                }
                
                .product-card.rtl .favorite-btn {
                    right: auto !important;
                    left: 10px !important;
                }
                
                .buttons-container {
                    display: flex;
                    flex-direction: row;
                    width: 100%;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
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

                .add-to-cart-btn {
                    height: 32px;
                    padding: 0 16px;
                    color: white;
                    background-color: #01594C;
                    align-items: center;
                    justify-content: center;
                    display: flex;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.75rem;
                    font-weight: 600;
                    white-space: nowrap;
                    flex-shrink: 0;
                    transition: background-color 0.2s;
                }

                .add-to-cart-btn:hover {
                    background-color: #014839;
                }

                .add-to-cart-btn:disabled {
                    background-color: #9CA3AF;
                    cursor: not-allowed;
                }

                .product-card.mobile-layout .add-to-cart-btn {
                    height: 32px;
                    font-size: 0.7rem;
                    padding: 0 10px;
                    min-width: 85px;
                    flex-shrink: 0;
                }

                .favorite-btn, 
                button[style*="position: absolute"] {
                    opacity: 1 !important;
                    visibility: visible !important;
                    z-index: 8 !important;
                }

                .product-card.rtl {
                    direction: rtl;
                    text-align: right;
                }

                /* Responsive adjustments for different mobile sizes */
                @media (max-width: 425px) {
                    .product-card.mobile-layout {
                        padding: 10px;
                        gap: 10px;
                        min-height: 100px;
                    }

                    .product-card.mobile-layout .product-image-container {
                        width: 80px;
                        min-width: 80px;
                        height: 80px;
                    }

                    .product-card.mobile-layout .product-name {
                        font-size: 0.85rem;
                        line-height: 1.2;
                    }

                    .product-card.mobile-layout .product-code {
                        font-size: 0.7rem;
                    }

                    .product-card.mobile-layout .unit-price {
                        font-size: 0.8rem;
                    }

                    .product-card.mobile-layout .buttons-container {
                        gap: 4px;
                        flex-wrap: nowrap;
                    }

                    .product-card.mobile-layout .add-to-cart-btn {
                        height: 30px;
                        font-size: 0.65rem;
                        padding: 0 8px;
                        min-width: 75px;
                    }
                }

                @media (max-width: 375px) {
                    .product-card.mobile-layout {
                        padding: 8px;
                        gap: 8px;
                    }

                    .product-card.mobile-layout .product-image-container {
                        width: 70px;
                        min-width: 70px;
                        height: 70px;
                    }

                    .product-card.mobile-layout .product-name {
                        font-size: 0.8rem;
                    }

                    .product-card.mobile-layout .product-code {
                        font-size: 0.65rem;
                    }

                    .product-card.mobile-layout .unit-price {
                        font-size: 0.75rem;
                    }

                    .product-card.mobile-layout .add-to-cart-btn {
                        height: 28px;
                        font-size: 0.6rem;
                        padding: 0 6px;
                        min-width: 70px;
                    }
                }

                @media (max-width: 320px) {
                    .product-card.mobile-layout {
                        padding: 8px;
                        gap: 8px;
                        min-height: 100px;
                    }

                    .product-card.mobile-layout .product-image-container {
                        width: 65px;
                        min-width: 65px;
                        height: 65px;
                    }

                    .product-card.mobile-layout .product-info-section {
                        gap: 2px;
                        margin-bottom: 6px;
                    }

                    .product-card.mobile-layout .product-name {
                        font-size: 0.75rem;
                        line-height: 1.2;
                    }

                    .product-card.mobile-layout .product-code {
                        font-size: 0.6rem;
                    }

                    .product-card.mobile-layout .unit-price {
                        font-size: 0.7rem;
                    }

                    .product-card.mobile-layout .buttons-container {
                        gap: 4px;
                    }

                    .product-card.mobile-layout .add-to-cart-btn {
                        height: 26px;
                        font-size: 0.55rem;
                        padding: 0 6px;
                        min-width: 65px;
                    }
                }

                /* Responsive adjustments for desktop layout on smaller screens */
                @media (max-width: 768px) {
                    .product-card.desktop-layout {
                        min-width: 160px;
                        max-width: 100%;
                        padding: 12px 8px;
                        min-height: 260px;
                    }
                    
                    .product-card.desktop-layout .product-image-container {
                        height: 90px;
                        margin-bottom: 10px;
                    }
                    
                    .product-card.desktop-layout .product-name {
                        font-size: 1rem;
                    }
                    
                    .product-card.desktop-layout .product-code {
                        font-size: 0.9rem;
                    }
                    
                    .product-card.desktop-layout .add-to-cart-btn {
                        font-size: 0.8rem;
                        padding: 7px 12px;
                        width: 140px !important;
                    }
                    
                    .product-card.desktop-layout .buttons-container {
                        flex-direction: column !important;
                    }
                    
                    .product-card.desktop-layout .favorite-btn, 
                    .product-card.desktop-layout button[style*="position: absolute"] {
                        left: 5px !important;
                        right: auto !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProductCard;
