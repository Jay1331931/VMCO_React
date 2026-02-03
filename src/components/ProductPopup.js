import React, { useState, useEffect } from 'react';
import QuantityController from './QuantityController';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import RbacManager from '../utilities/rbac';
import FavButton from './FavButton';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

function ProductPopup({
    product,
    quantities,
    onQuantityChange,
    onInputChange,
    onClose,
    onAddToCart,
    onToggleFavorite,
    isAdding
}) {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        console.log("isMobile", isMobile);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    // Initialize RBAC manager
    const rbacMgr = new RbacManager(
        user?.userType === 'employee' && user?.roles[0] !== 'admin'
            ? user?.designation
            : user?.roles?.[0],
        'catalog'
    );
    const isV = rbacMgr.isV.bind(rbacMgr);

    const images = Array.isArray(product.images) ? product.images : [];
    const mainImage = images[0] || '';
    const [selectedImage, setSelectedImage] = useState(mainImage);

    // Add handler for add to cart button
    const handleAddToCart = (e) => {
        e.stopPropagation(); // Prevent closing the popup
        onAddToCart(product.id); // Call the parent component's onAddToCart function
    };

    const handleFavoriteToggle = (newState) => {
        // Call the parent component's toggle function
        onToggleFavorite(product.id, newState);
    };

    if (!product) return null;

    return (
        <div className="product-popup-overlay" onClick={onClose}>
            <div className="product-popup" onClick={e => e.stopPropagation()}>
                {!isMobile && <button className="popup-close" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>}
                <div className="popup-content">
                    <div className="popup-image-section">
                        <div className="popup-image-container">
                            {isMobile && <button className="popup-close popup-close-mobile" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>}
                            {isV('favoriteButton') && <FavButton
                                initialState={product.favorite || false}
                                onToggle={handleFavoriteToggle}
                                isPopup={true}
                            />}
                            {selectedImage ? (
                                <img
                                    src={selectedImage}
                                    alt={product.name}
                                    className="popup-image"
                                />
                            ) : (
                                <div className="popup-image placeholder"></div>
                            )}
                        </div>
                        <div className="additional-images">
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
                        <h2 className="popup-product-name">{product.name}</h2>
                        {!isMobile && product.entity && <div className="popup-product-entity">{t(product.entity)}</div>}

                        <p className="popup-product-description">
                            {(i18n.language === 'en' ? product.description : product.descriptionLc)}
                        </p>

                        <h4 className="unit-price">{(t('Unit Price: '))}{(product.unitPrice).toFixed(2)} {t('SAR')}</h4>
                        {isMobile ?
                            (
                                <div className='' style={{ display: 'flex', flexDirection: 'column' }}>
                                    {isV('quantityController') && (
                                        <div className="" style={{ display: 'flex', justifyContent: 'center', marginTop: "10px" }}>
                                            <QuantityController
                                                itemId={product.id}
                                                quantity={quantities[product.id] || 0}
                                                onQuantityChange={onQuantityChange}
                                                onInputChange={onInputChange}
                                                stopPropagation={true}
                                                minQuantity={Number(product.moq) || 0}
                                                moq={Number(product.moq) || 0}
                                            />
                                        </div>
                                    )}
                                    {isV('addToCart') && (
                                        <div className='addtocartbutton'>
                                            <button
                                                onClick={handleAddToCart}
                                                style={{
                                                    backgroundColor: '#0a5640', color: '#ffffff', width: '100%', height: '30px',
                                                    padding: '5px', borderRadius: '4px', alignItems: 'center',
                                                    border: 'none', cursor: 'pointer',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 600, height: '30px', marginTop: '10px'
                                                }} disabled={isAdding}    >
                                                {isAdding === product?.id ? t('ADDING...') : t('Add to Cart')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) :
                            <>
                                {isV('quantityController') && (
                                    <QuantityController
                                        itemId={product.id}
                                        quantity={quantities[product.id] || 0}
                                        onQuantityChange={onQuantityChange}
                                        onInputChange={onInputChange}
                                        stopPropagation={true}
                                        minQuantity={Number(product.moq) || 0}
                                        moq={Number(product.moq) || 0}
                                    />
                                )}
                                {isV('addToCart') && (
                                    <div className='addtocartbutton'>
                                        <button
                                            className="add-to-cart-btn"
                                            onClick={handleAddToCart}
                                            style={{ backgroundColor: '#0a5640', color: '#ffffff', width: '100%' }} disabled={isAdding}    >
                                            {isAdding === product?.id ? t('ADDING...') : t('Add to Cart')}
                                        </button>
                                    </div>
                                )}
                            </>
                        }

                    </div>
                </div>
                <style>{`
                    .product-popup-overlay {
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(0,0,0,0.12);
                        z-index: 1000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 24px;
                    }
                    .product-popup {
                        background: #fff;
                        border-radius: 8px;
                        box-shadow: 0 4px 16px rgba(0,0,0,0.10);
                        padding: 0;
                        max-width: 900px;
                        width: 100%;
                        position: relative;
                        animation: popup-fade-in 0.18s;
                        min-height: 420px;
                        max-height: 90vh;
                        display: flex;
                        flex-direction: column;
                    }
                    @keyframes popup-fade-in {
                        from { opacity: 0; transform: scale(0.97);}
                        to { opacity: 1; transform: scale(1);}
                    }
                    .popup-close {
                        position: absolute;
                        top: 2px;
                        right: 20px;
                        background: none;
                        border: none;
                        font-size: 2rem;
                        color: #888;
                        cursor: pointer;
                        z-index: 2;
                        transition: color 0.15s;
                    }
                    .popup-close:hover {
                        color: #0a5640;
                    }
                    .popup-close-mobile {
                        top: 4px;
                        right: 10px;
                        left: auto;
                        font-size: 1.8rem;
                        color: #000000;
                    }
                    .popup-close-mobile:hover {
                        color: #0a5640;
                    }
                    .popup-content {
                        display: flex;
                        flex-direction: row;
                        gap: 40px;
                        padding: 48px 48px 40px 48px;
                        overflow-y: auto;
                    }
                    .popup-image-section {
                        flex: 1.1;
                        display: flex;
                        flex-direction: column;
                        align-items: flex-start;
                        min-width: 320px;
                    }
                    .popup-image-container {
                        position: relative;
                        width: 100%;
                    }
                    .popup-image {
                        width: 100%;
                        max-width: 400px;
                        aspect-ratio: 1/1;
                        object-fit: contain;
                        border-radius: 8px;
                        background: var(--bg-transparent, transparent);
                        margin-bottom: 18px;
                        min-width: 280px;
                        min-height: 280px;
                        display: block;
                    }
                    .popup-image.placeholder {
                        background: #E5E5E5;
                        width: 100%;
                        max-width: 400px;
                        aspect-ratio: 1/1;
                        border-radius: 8px;
                        margin-bottom: 18px;
                        min-width: 280px;
                        min-height: 280px;
                    }
                    .additional-images {
                        display: flex;
                        gap: 12px;
                    }
                    .additional-image-thumb {
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        width: 64px;
                        height: 64px;
                        background: #D9D9D6;
                        background-size: cover;
                        background-position: center;
                        cursor: pointer;
                        transition: border 0.15s;
                    }
                    .additional-image-thumb.selected {
                        border: 2px solid #00665A;
                    }
                    .popup-details {
                        flex: 1.2;
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-start;
                        gap: 10px;
                        min-width: 320px;
                        margin-top: 8px;
                    }                    
                    .popup-product-name {
                        font-size: 1.35rem;
                        font-weight: 600;
                        margin: 0 0 8px 0;
                        color: #222;
                    }
                    .popup-product-entity {
                        font-size: 0.9rem;
                        color: #00205B;
                        margin: 0 0 10px 0;
                        padding: 3px 10px;
                        background-color: #f0f4ff;
                        border-radius: 4px;
                        display: inline-block;
                    }
                    .unit-price {
                        font-size: 1.1rem;
                        margin-bottom: 20px;
                    }
                    [dir="rtl"].unit-price {
                        text-align: right;
                    }
                    .popup-product-description {
                        font-size: 1rem;
                        color: #888;
                        margin: 0 0 18px 0;
                    }
                    .addtocartbutton {
                        display: flex;
                        justify-content: flex-end;
                    }
                    .add-to-cart-btn {
                        background-color: var(--logo-deep-green);
                        color: rgb(255, 255, 255);
                        width: 90%;
                        height: 40px;
                        padding: 5px;
                        border-radius: 5px;
                        align-items: center;
                        border: none;
                        cursor: pointer;
                        font-size: 0.9rem;
                        font-weight: 600;
                        margin-top: 10px;
                    }
                    .add-to-cart-btn:hover {
                        background-color: #001845;
                    }
                    @media (max-width: 900px) {
                        .popup-content {
                            flex-direction: column;
                            gap: 24px;
                            padding: 32px 16px 24px 16px;
                        }
                        .popup-image-section,
                        .popup-details {
                            min-width: 0;
                        }
                        .popup-image {
                            min-width: 180px;
                            min-height: 180px;
                            max-width: 100%;
                            background: none !important;
                        }
                    }
                    @media (max-width: 600px) {
                        .product-popup {
                            padding: 0;
                            min-height: unset;
                            max-height: 85vh;
                        }
                        .popup-content {
                            flex-direction: column;
                            gap: 12px;
                            padding: 12px 12px 16px 12px;
                        }
                        .popup-image {
                            min-width: 140px !important;
                            min-height: 140px !important;
                            max-width: 140px !important;
                            max-height: 140px !important;
                            width: 140px !important;
                            margin: 0 auto 12px auto;
                            display: block;
                        }
                        .popup-image.placeholder {
                            min-width: 140px !important;
                            min-height: 140px !important;
                            max-width: 140px !important;
                            max-height: 140px !important;
                            width: 140px !important;
                            margin: 0 auto 12px auto;
                        }
                        .popup-image-section {
                            align-items: center;
                            min-width: 0;
                        }
                        .popup-product-description {
                            font-size: 0.95rem;
                            color: #888;
                            margin: 0 0 12px 0;
                            line-height: 1.4;
                        }
                        .popup-details {
                            min-width: 0;
                            gap: 8px;
                        }
                        .add-to-cart-btn {
                            align-items: center;
                            height: 44px;
                            width: 100%;
                        }
                        .addtocartbutton {
                            margin-top: 8px;
                        }
                    }
                    @media (max-width: 480px) {
                        .popup-image {
                            min-width: 160px !important;
                            min-height: 160px !important;
                            max-width: 160px !important;
                            max-height: 160px !important;
                            width: 160px !important;
                        }
                        .popup-image.placeholder {
                            min-width: 160px !important;
                            min-height: 160px !important;
                            max-width: 160px !important;
                            max-height: 160px !important;
                            width: 160px !important;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}

export default ProductPopup;