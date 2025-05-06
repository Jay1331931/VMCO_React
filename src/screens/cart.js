import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import QuantityController from '../components/QuantityController';

function Cart() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [collapsedCategories, setCollapsedCategories] = useState(new Set());
    const [quantities, setQuantities] = useState({});

    const cartItems = [
        {
            category: 'VMCO Machines',
            items: [
                { id: 4, name: 'Product Name', code: 'SAR2000', quantity: 10, delivery: '15 Apr 2025' }
            ]
        },
        {
            category: 'VMCO Others',
            items: [
                { id: 4, name: 'Product Name', code: 'SAR2000', quantity: 10, delivery: '15 Apr 2025' }
            ]
        },
        {
            category: 'Diayafa',
            items: [
                { id: 1, name: 'Product Name', code: 'SAR24', quantity: 10, delivery: '15 Apr 2025' },
                { id: 2, name: 'Product Name', code: 'SAR24', quantity: 10, delivery: '15 Apr 2025' }
            ]
        },
        {
            category: 'Green Mart',
            items: [
                { id: 3, name: 'Product Name', code: 'SAR60', quantity: 10, delivery: '15 Apr 2025' }
            ]
        },
        
    ];

    const toggleCategory = (category) => {
        setCollapsedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    const handleQuantityChange = (itemId, delta) => {
        setQuantities(prev => ({
            ...prev,
            [itemId]: Math.max(1, (prev[itemId] || 1) + delta)
        }));
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, category) => {
            return total + category.items.reduce((catTotal, item) => {
                const price = parseInt(item.code.replace('SAR', ''));
                return catTotal + price * (quantities[item.id] || item.quantity);
            }, 0);
        }, 0);
    };

    const handleContinueShopping = () => {
        navigate('/catalog');
    };

    return (
        <Sidebar title={t('Your Cart')} dir={t('direction')}>
            <div className="cart-header">
                    <h2 className="cart-title">Cart (3 items)</h2>
                    <div className="delivery-info">Delivering to JP Nagar</div>
                    <div className="credit-balance">Credit Balance: SAR445</div>
                </div>
            <div className="cart-content">
            
                <div className="cart-items">
                    {cartItems.map((category) => (
                        <div key={category.category} className="category-section">
                            <div 
                                className="category-header" 
                                onClick={() => toggleCategory(category.category)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="category-title">
                                    <h3>{category.category}</h3>
                                    <FontAwesomeIcon 
                                        icon={collapsedCategories.has(category.category) ? faChevronDown : faChevronUp} 
                                    />
                                </div>
                                <span>{category.items.length} {t('Items')}</span>
                            </div>
                            {!collapsedCategories.has(category.category) && (
                                <div className="category-items">
                                    {category.items.map((item) => (
                                        <div key={item.id} className="cart-item">
                                            <div className="item-image">
                                                <div className="image-placeholder"></div>
                                            </div>
                                            <div className="item-details">
                                                <h4 className="item-name">{item.name}</h4>
                                                <p className="delivery-date">Delivery by {item.delivery}</p>
                                                <QuantityController 
                                                    itemId={item.id}
                                                    quantity={quantities[item.id] || item.quantity}
                                                    onQuantityChange={handleQuantityChange}
                                                    onInputChange={(itemId, value) => setQuantities({
                                                        ...quantities,
                                                        [itemId]: value
                                                    })}
                                                />
                                            </div>
                                            <div className="item-price">
                                                <span>{item.code}</span>
                                                <button className="checkout-btn">CHECKOUT</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                 <div className="total-amount">
                        <h3>{t('Total Amount')} ({cartItems.reduce((sum, cat) => sum + cat.items.length, 0)} {t('Items')})</h3>
                        <span>SAR{calculateTotal()}</span>
                        <button className="checkout-all-btn">{t('CHECKOUT ALL')}</button>
                 </div>
            </div>
            <div className="cart-footer">
                    
                    <button className="continue-shopping" onClick={handleContinueShopping}>
                        {t('Continue Shopping')}
                    </button>
                </div>
        </Sidebar>
    );
}

export default Cart;