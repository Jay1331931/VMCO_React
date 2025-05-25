import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import QuantityController from '../components/QuantityController';

function Cart() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [collapsedCategories, setCollapsedCategories] = useState(new Set());
    const [quantities, setQuantities] = useState({});
    // Set a default message for when no branch is selected
    const [selectedBranchName, setSelectedBranchName] = useState('No location selected');

    // Improved useEffect to handle branch name retrieval
    useEffect(() => {
        // Get the branch name from localStorage
        const branchName = localStorage.getItem('selectedBranchName');
        
        // Log for debugging
        console.log('Retrieved branch name:', branchName);
        
        // Check if branch is selected, if not redirect with alert
        if (!branchName || branchName.trim() === '') {
            alert(t('Please select a branch before accessing your cart'));
            navigate('/'); // Navigate to home page or wherever branch selection happens
            return;
        }

        // Update state if we have a valid branch name
        setSelectedBranchName(branchName);
    }, [navigate, t]);

    // Example cart items, update as needed
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
            category: 'Green Mast',
            items: [
                { id: 3, name: 'Product Name', code: 'SAR60', quantity: 10, delivery: '15 Apr 2025' }
            ]
        }        
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

    // Calculate total items for header and summary
    const totalItems = cartItems.reduce((sum, cat) => sum + cat.items.length, 0);

    return (
        <Sidebar title={t('Your Cart')} dir={t('direction')}>
            <div className="cart-header">
                <h2 className="cart-title">Cart ({totalItems} items)</h2>
                <div className="delivery-info">
                    <span className="delivery-link">
                        {t('Delivering to')}{' '}
                        {selectedBranchName && selectedBranchName !== 'No location selected' 
                            ? <strong>{selectedBranchName}</strong> 
                            : <em>(No location selected)</em>}
                    </span>
                </div>
                <div className="credit-balance">Credit Balance: SAR445</div>
            </div>
            <div className="cart-main-content">
                <div className="cart-items-panel">
                    {cartItems.map((category) => (
                        <div key={category.category} className="category-section">
                            <div
                                className="category-header"
                                onClick={() => toggleCategory(category.category)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="category-title">
                                    <FontAwesomeIcon
                                        icon={collapsedCategories.has(category.category) ? faChevronDown : faChevronUp}
                                    />
                                    <h3>{category.category}</h3>
                                </div>
                                <span className="category-count">{category.items.length} Items</span>
                            </div>
                            {!collapsedCategories.has(category.category) && (
                                <div className="category-items">
                                    {category.items.map((item, idx) => (
                                        <div key={item.id + '-' + idx} className="cart-item">
                                            <div className="item-image">
                                                <div className="image-placeholder"></div>
                                            </div>
                                            <div className="item-details">
                                                <h4 className="item-name">{item.name}</h4>
                                                <p className="delivery-date">Delivery By {item.delivery}</p>
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
                                            <div className="item-price-panel">
                                                <span className="item-price">{parseInt(item.code.replace('SAR', ''))} <span className="sar-label">SAR</span></span>
                                                <button className="checkout-btn">Place Order</button>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Example: Show partial payment for VMCO Machines */}
                                    {category.category === 'VMCO Machines' && (
                                        <div className="partial-payment-row">
                                            <span className="partial-payment-warning">Min. 30% Partial Payment required</span>
                                            <input className="partial-payment-input" type="number" min="0" placeholder="100" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="cart-summary-panel">
                    <div className="total-amount">
                        <h3 className="summary-title">
                            {t('Total Amount')} ({totalItems} Items)
                        </h3>
                        <span className="summary-amount">{calculateTotal()} <span className="sar-label">SAR</span></span>
                        <button className="checkout-all-btn">{t('CHECKOUT ALL')}</button>
                    </div>
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