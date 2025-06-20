import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import QuantityController from './QuantityController';
import { useAuth } from '../context/AuthContext';
import RbacManager from '../utilities/rbac';

const ProductCard = ({
    product,
    quantities,
    onQuantityChange,
    onProductClick,
    setQuantities,
    onAddToCart // Destructure onAddToCart prop
}) => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    
    // Initialize RBAC manager
    const rbacMgr = new RbacManager(
        user?.userType === 'employee' && user?.roles[0] !== 'admin' 
            ? user?.designation 
            : user?.roles?.[0], 
        'catalog'
    );
    const isV = rbacMgr.isV.bind(rbacMgr);

    // Initialize with MOQ when product is loaded or changed
    useEffect(() => {
        if (product && product.moq && (!quantities[product.id] || quantities[product.id] < Number(product.moq))) {
            setQuantities(prev => ({
                ...prev,
                [product.id]: Number(product.moq) || 0
            }));
        }
    }, [product, quantities, setQuantities]);

    const handleQuantityInputChange = (productId, value) => {
        // Ensure the value is not less than the MOQ
        const moq = Number(product.moq) || 0;
        const newValue = Math.max(moq, Number(value));
        
        setQuantities({
            ...quantities,
            [product.id]: newValue
        });
    };

    const handleAddToCart = (e) => {
        e.stopPropagation(); // Prevent triggering the onProductClick event
        onAddToCart(product.id); // Call the parent component's onAddToCart function
    }

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
                <h3 className="product-name" title={product.name}>{product.name}</h3>
                <p className="product-code">{product.code}</p>
                {product.entity && <p className="product-entity">{product.entity}</p>}
                <h4 className="unit-price" style={{color:"#6c7584"}}>{t('Price: ')}{(product.unitPrice).toFixed(2)}</h4>
                <div className="buttons-container">
                    {isV('quantityController') && (
                        <QuantityController
                            itemId={product.id}
                            quantity={quantities[product.id] || (product.moq ? Number(product.moq) : 0)}
                            onQuantityChange={(id, delta) => {
                                // Only allow quantity changes that don't go below MOQ
                                const currentQty = quantities[product.id] || 0;
                                const moq = Number(product.moq) || 0;
                                const newQty = currentQty + delta;
                                
                                if (newQty >= moq) {
                                    onQuantityChange(id, delta);
                                } else if (delta > 0 && currentQty < moq) {
                                    // Special case: If increasing from below MOQ, jump to MOQ
                                    setQuantities(prev => ({
                                        ...prev,
                                        [product.id]: moq
                                    }));
                                }
                            }}
                            onInputChange={handleQuantityInputChange}
                            stopPropagation={true}
                            minQuantity={Number(product.moq) || 0} // Pass MOQ as min quantity
                            moq={Number(product.moq) || 0} // Pass MOQ directly
                        />
                    )}
                    {isV('addToCart') && (
                        <button
                            className="add-to-cart-btn"
                            onClick={(e) => handleAddToCart(e)}
                            style={{backgroundColor: '#01594d',color:"#ffffff"}}
                        >
                            {t('ADD TO CART')}
                        </button>
                    )}
                </div>
            </div>
            <style>{`
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
//   min-width: 150px;
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
  justify-content: center;
    display: flex;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 600;
}

.add-to-cart-btn:hover {
  background-color: #001845;
}

/* Specifically target Firefox */
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
                   
                    .add-to-cart-btn {
                        width: 140px  !important;
                        font-size: 14px
                    }
                }
                .product-card.rtl {
                  direction: rtl;
                  text-align: right;
                }
            `}</style>
        </div>
    );
};

export default ProductCard;