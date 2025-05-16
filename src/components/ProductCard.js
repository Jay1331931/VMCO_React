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


    const handleAddToCart = (e, productId) => {
        e.stopPropagation(); // Prevent triggering the onProductClick event
        console.log('Added to cart:', product.name, 'Quantity:', quantities[productId]);
    }

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
                        onClick={(e) => handleAddToCart(e, product.id)}
                    >
                        {t('ADD TO CART')}
                    </button>
                </div>
            </div>
            <style>{`
                .product-card {
  border: 1px solid #D9D9D6;
  border-radius: 14px;
  overflow: hidden;
  background: white;
  min-width: 280px;
  /* Set minimum width for cards */
  height: 100%;
  /* Ensure consistent height */
  transition: 200ms;
}

.product-card:hover {
  transform: scale(1.02);
  /* Scale up on hover */
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

.product-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 5px;
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
  color: #333;
}

.product-code {
  font-size: 0.9rem;
  color: #6B7280;
  margin: 0 0 15px 0;
}

.quantity-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.quantity-btn {
  width: 30px;
  height: 30px;
  border: 1px solid #D9D9D6;
  border-radius: 4px;
  background: white;
  color: #00205B;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity-input {
  width: 30px;
  height: 30px;
  text-align: center;
  border: 1px solid #D9D9D6;
  border-radius: 4px;
  -webkit-appearance: none;
  appearance: textfield;
  -moz-appearance: textfield;
}

.add-to-cart-btn {
  width: 160px;
  height: 30px;
  padding: 10px 10px;
  background-color: #00205B;
  color: white;
  align-items: center;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 600;
}

.add-to-cart-btn:hover {
  background-color: #001845;
}

* Specifically target Firefox */
.quantity-input::-webkit-outer-spin-button,
.quantity-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
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
                    }
                }
            `}</style>
        </div>
    );
};

export default ProductCard;