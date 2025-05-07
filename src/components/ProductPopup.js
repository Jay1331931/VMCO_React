import React, { useState } from 'react';
import QuantityController from './QuantityController';
import { useTranslation } from 'react-i18next';

function ProductPopup({
    product,
    quantities,
    onQuantityChange,
    onInputChange,
    onClose
}) {
    const { t } = useTranslation();

    // Always treat product.image as main, and product.additionalImages as array of additional images
    const mainImage = product.image || '';
    const additionalImages = Array.isArray(product.additionalImages) ? product.additionalImages : [];
    const images = [mainImage, ...additionalImages];

    const [selectedImage, setSelectedImage] = useState(mainImage);

    if (!product) return null;

    return (
        <div className="product-popup-overlay" onClick={onClose}>
            <div className="product-popup" onClick={e => e.stopPropagation()}>
                <button className="popup-close" onClick={onClose}>×</button>
                <div className="popup-image-container">
                    {selectedImage ? (
                        <img
                            src={selectedImage}
                            alt={product.name}
                            className="popup-image"
                        />
                    ) : (
                        <div className="popup-image"></div>
                    )}
                    <div className="additional-images" style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                        {images.map((img, idx) => (
                            <div
                                key={idx}
                                className={`additional-image-thumb${selectedImage === img ? ' selected' : ''}`}
                                onClick={() => setSelectedImage(img)}
                                style={{
                                    background: '#D9D9D6',
                                    backgroundImage: img ? `url(${img})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    width: 64,
                                    height: 64,
                                    borderRadius: 8,
                                    border: selectedImage === img ? '2px solid #00665A' : '2px solid #e0e0e0',
                                    cursor: 'pointer',
                                    display: 'inline-block'
                                }}
                                aria-label={`Show image ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>
                <div className="popup-details">
                    <h2>{product.name}</h2>
                    <h3 className="product-code">{product.code}</h3>
                    <p>{t('description of the product')}</p>
                    <QuantityController
                        itemId={product.id}
                        quantity={quantities[product.id] || 0}
                        onQuantityChange={onQuantityChange}
                        onInputChange={onInputChange}
                    />
                    <div className='addtocartbutton'>
                        <button className="add-to-cart-btn">
                            {t('ADD TO CART')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductPopup;