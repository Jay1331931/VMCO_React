import React from 'react';
import { useTranslation } from 'react-i18next';
import QuantityController from './QuantityController';

const ProductCard = ({ 
    product, 
    quantities, 
    onQuantityChange, 
    onProductClick,
    setQuantities 
}) => {
    const { t } = useTranslation();

    const handleQuantityInputChange = (productId, value) => {
        setQuantities({
            ...quantities,
            [product.id]: value
        });
    };

    return (
        <div 
            className="product-card"
            onClick={() => onProductClick(product)}
            style={{ cursor: 'pointer' }}
        >
            <div className="product-image">
                {product.image ? (
                    <img 
                        src={product.image} 
                        alt={product.name}
                        className="product-img"
                    />
                ) : (
                    <div className="image-placeholder"></div>
                )}
            </div>
            <div className="product-details">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-code">{product.code}</p>
                <div className="quantity-controls">
                    <QuantityController 
                        itemId={product.id}
                        quantity={quantities[product.id] || 0}
                        onQuantityChange={onQuantityChange}
                        onInputChange={handleQuantityInputChange}
                        stopPropagation={true}
                    />
                    <button 
                        className="add-to-cart-btn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {t('ADD TO CART')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;