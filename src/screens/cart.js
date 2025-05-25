import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import QuantityController from '../components/QuantityController';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function Cart() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [collapsedCategories, setCollapsedCategories] = useState(new Set());
    const [quantities, setQuantities] = useState({});
    const [selectedBranchName, setSelectedBranchName] = useState('No location selected');
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cartItems, setCartItems] = useState([
        { category: 'VMCO Machines', items: [] },
        { category: 'VMCO Consumables', items: [] },
        { category: 'Diayafa', items: [] },
        { category: 'Green Mast', items: [] },
        { category: 'Naqui', items: [] }    
    ]);

    // Fetch branch information from localStorage
    useEffect(() => {
        // Fetch branch information from localStorage
        try {
            const branchName = localStorage.getItem('selectedBranchName');
            const branchId = localStorage.getItem('selectedBranchId');
            
            console.log('Retrieved branch info:', { branchName, branchId });
            
            if (!branchId || !branchName || branchName.trim() === '') {
                console.warn('Branch selection is missing or incomplete');
                alert(t('Please select a branch before accessing your cart'));
                navigate('/catalog');
                return;
            }

            setSelectedBranchName(branchName);
            setSelectedBranchId(branchId);
            
        } catch (error) {
            console.error('Error retrieving branch info from localStorage:', error);
            alert(t('Error loading your branch information. Please select a branch again.'));
            navigate('/catalog');
        }
    }, [navigate, t]);

    // Fetch cart items from the backend using fetch API
    useEffect(() => {
        const fetchCartItems = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                // Set up parameters for pagination
                const params = new URLSearchParams({
                    page: 1,
                    pageSize: 200, // Fetch a large number to get all cart items
                    sortBy: 'id',
                    sortOrder: 'asc'
                });
                
                // Create filters object and add it as a JSON string
                const filters = {
                    branch_id: selectedBranchId
                };
                
                // Add customer_id if available (you might want to get this from localStorage or context)
                const customerId = localStorage.getItem('customerId');
                if (customerId) {
                    filters.customer_id = customerId;
                }
                
                // Add filters as a JSON string parameter
                params.append('filters', JSON.stringify(filters));
                
                const response = await fetch(`${API_BASE_URL}/cart/pagination?${params.toString()}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include' // Include cookies/auth tokens
                });
                
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log('Fetched cart data:', data);
                
                // Initialize arrays for each category
                const vmcoMachines = [];
                const vmcoConsumables = [];
                const diayafa = [];
                const greenMast = [];
                const naqui = [];
                
                // Extract cart items from the response with better error handling
                const cartProducts = Array.isArray(data) ? data : 
                                   (data.data && Array.isArray(data.data)) ? data.data : [];
                
                // Map initial quantities from fetched data
                const initialQuantities = {};
                
                // Helper function to determine if a product is a machine
                const isProductMachine = (product) => {
                    const productType = (product.productType || product.product_type || '').toLowerCase();
                    const category = (product.category || '').toLowerCase();
                    const subCategory = (product.subCategory || product.sub_category || '').toLowerCase();
                    
                    // Check explicit productType field first
                    if (productType.includes('machine') || productType.includes('equipment')) return true;
                    if (productType.includes('consumable') || productType.includes('supply')) return false;
                    
                    // Check category fields
                    return category.includes('machine') || category.includes('equipment') || 
                           subCategory.includes('machine') || subCategory.includes('equipment');
                };
                
                // Process each product and categorize it correctly
                cartProducts.forEach(product => {
                    // Format the product data for display
                    const formattedItem = {
                        id: product.id,
                        name: product.productName || product.name || 'Unknown Product',
                        price: product.unitPrice || product.price || 0,
                        quantity: product.quantityOrdered || product.quantity || 1,
                        delivery: product.estimatedDelivery || product.delivery || '15 Apr 2025',
                        imageUrl: product.imageUrl || product.image_url || '/placeholder-image.png',
                        productCode: product.erpProdId || product.product_id || product.code,
                        // Include all original properties
                        ...product
                    };
                    
                    // Store initial quantities
                    initialQuantities[formattedItem.id] = formattedItem.quantity;
                    
                    // Categorize based on entity and product type
                    const entity = (product.entity || '').toLowerCase();
                    const isMachine = isProductMachine(product);
                    
                    // Categorize based on entity and product type
                    if (entity === 'vmco') {
                        if (isMachine) {
                            vmcoMachines.push(formattedItem);
                        } else {
                            vmcoConsumables.push(formattedItem);
                        }
                    } else if (entity === 'diayafa' || entity === 'diyafa') {
                        diayafa.push(formattedItem);
                    } else if (entity === 'green mast') {
                        greenMast.push(formattedItem);
                    } else if (entity === 'naqui') {
                        naqui.push(formattedItem);
                    } else {
                        // If entity is not specified, try to determine by category
                        const category = (product.category || '').toLowerCase();
                        
                        if (category.includes('diayafa') || category.includes('diyafa')) {
                            diayafa.push(formattedItem);
                        }
                        else if (category.includes('green mast')) {
                            greenMast.push(formattedItem);
                        }
                        else if (category.includes('naqui')) {
                            naqui.push(formattedItem);
                        }
                        else {
                            // Default to VMCO Consumables if we can't determine category
                            vmcoConsumables.push(formattedItem);
                        }
                    }
                });
                
                // Update the cart items with the categorized data
                setCartItems([
                    { category: 'VMCO Machines', items: vmcoMachines },
                    { category: 'VMCO Consumables', items: vmcoConsumables },
                    { category: 'Diayafa', items: diayafa },
                    { category: 'Green Mast', items: greenMast },
                    { category: 'Naqui', items: naqui }
                ]);
                
                // Initialize quantities from fetched data
                setQuantities(initialQuantities);
                
            } catch (err) {
                console.error('Error fetching cart items:', err);
                setError('Failed to load cart items. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchCartItems();
    }, [selectedBranchId, API_BASE_URL]);

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
                const price = parseFloat(item.price) || 0;
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
            </div>
            <div className="cart-main-content">
                {isLoading ? (
                    <div className="loading-indicator">Loading your cart items...</div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : (
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
                                        {category.items.length === 0 ? (
                                            <div className="empty-category">No items in this category</div>
                                        ) : (
                                            category.items.map((item, idx) => (
                                                <div key={item.id + '-' + idx} className="cart-item">
                                                    <div className="item-image">
                                                        {item.imageUrl ? (
                                                            <img 
                                                                src={item.imageUrl} 
                                                                alt={item.name} 
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = '/placeholder-image.png';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="image-placeholder"></div>
                                                        )}
                                                    </div>
                                                    <div className="item-details">
                                                        <h4 className="item-name">{item.name}</h4>
                                                        <p className="item-code">{item.productCode}</p>
                                                        <p className="delivery-date">Delivery By {item.delivery}</p>
                                                        <QuantityController
                                                            itemId={item.id}
                                                            quantity={quantities[item.id] || item.quantity}
                                                            onQuantityChange={handleQuantityChange}
                                                            onInputChange={(itemId, value) => {
                                                                const numValue = parseInt(value) || 1;
                                                                setQuantities({
                                                                    ...quantities,
                                                                    [itemId]: Math.max(1, numValue)
                                                                });
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="item-price-panel">
                                                        <span className="item-price">
                                                            {parseInt(item.price)} 
                                                            <span className="sar-label">SAR</span>
                                                        </span>
                                                        <span className="item-total-price">
                                                            Total: {parseInt(item.price) * (quantities[item.id] || item.quantity)} 
                                                            <span className="sar-label">SAR</span>
                                                        </span>
                                                        <button className="checkout-btn">Place Order</button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        {/* Show partial payment for VMCO Machines */}
                                        {category.category === 'VMCO Machines' && category.items.length > 0 && (
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
                )}
                <div className="cart-summary-panel">
                    <div className="total-amount">
                        <h3 className="summary-title">
                            {t('Total Amount')} ({totalItems} Items)
                        </h3>
                        <span className="summary-amount">{calculateTotal()} <span className="sar-label">SAR</span></span>
                        <button className="checkout-all-btn">{t('Place all orders')}</button>
                    </div>
                </div>
            </div>
            <div className="cart-footer">
                <button className="continue-shopping" onClick={handleContinueShopping}>
                    {t('Continue Shopping')}
                </button>
            </div>
            <style jsx="true">{`
                .loading-indicator, .error-message, .empty-category {
                    padding: 20px;
                    text-align: center;
                    width: 100%;
                }
                
                .loading-indicator {
                    color: #666;
                }
                
                .error-message {
                    color: #d32f2f;
                }
                
                .empty-category {
                    color: #888;
                    font-style: italic;
                    padding: 10px;
                }
            `}</style>
        </Sidebar>
    );
}

export default Cart;