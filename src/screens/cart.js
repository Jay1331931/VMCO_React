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
    const [selectedBranchErpId, setSelectedBranchErpId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cartItems, setCartItems] = useState([
        { category: 'VMCO Machines', items: [] },
        { category: 'VMCO Consumables', items: [] },
        { category: 'Diayafa', items: [] },
        { category: 'Green Mast', items: [] },
        { category: 'Naqui', items: [] }    
    ]);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    // Fetch branch information from localStorage
    useEffect(() => {
        // Fetch branch information from localStorage
        try {
            const branchName = localStorage.getItem('selectedBranchName');
            const branchId = localStorage.getItem('selectedBranchId');
            const branchErpId = localStorage.getItem('selectedBranchErpId');  // <-- Fixed key name here
            
            console.log('Retrieved branch info:', { branchName, branchId, branchErpId });
            
            if (!branchId || !branchName || branchName.trim() === '') {
                console.warn('Branch selection is missing or incomplete');
                alert(t('Please select a branch before accessing your cart'));
                navigate('/catalog');
                return;
            }

            setSelectedBranchName(branchName);
            setSelectedBranchId(branchId);
            setSelectedBranchErpId(branchErpId);  // <-- Use the correct variable name

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
                
                const result = await response.json();
                console.log('Fetched cart data:', result);
                
                // Initialize arrays for each category
                const vmcoMachines = [];
                const vmcoConsumables = [];
                const diayafa = [];
                const greenMast = [];
                const naqui = [];
                
                // Extract cart items from the response with better error handling
                const cartProducts = Array.isArray(result.data.data) ? result.data.data : 
                                   (result.data && Array.isArray(result.data)) ? result.data : [];
                
                // Map initial quantities from fetched data
                const initialQuantities = {};
                
                // Helper function to determine if a product is a machine
                const isProductMachine = (product) => {
                    const productType = (product.productType || product.product_type || '').toLowerCase();
                    const category = (product.category || '').toLowerCase();
                    
                    // Check explicit productType field first
                    if (productType.includes('machine') || productType.includes('equipment')) return true;
                    if (productType.includes('consumable') || productType.includes('supply')) return false;
                    
                    // Check category fields
                    return category.includes('machine') || category.includes('equipment')
                };
                
                // Process each product and categorize it correctly
                cartProducts.forEach(product => {
                    // Format the product data for display
                    const formattedItem = {
                        id: product.id,
                        name: product.productName,
                        price: product.unitPrice,
                        quantity: product.quantityOrdered,
                        delivery: product.estimatedDelivery || product.delivery || '15 Apr 2025',
                        imageUrl: product.image, 
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

    // Handle place order button click
    const handlePlaceOrder = async (categoryItems, categoryName) => {
        if (categoryItems.length === 0) {
            alert(t('No items in this category to order.'));
            return;
        }

        if (isPlacingOrder) {
            alert(t('An order is already being processed. Please wait.'));
            return;
        }

        try {
            setIsPlacingOrder(true);
            setError(null);

            // Get customer ID from localStorage or another source
            const customerId = localStorage.getItem('customerId') || '3'; // Default if not available

            // Calculate total amount for this category
            const totalAmount = categoryItems.reduce((total, item) => {
                const price = parseFloat(item.price) || 0;
                const qty = quantities[item.id] || item.quantity || 1;
                return total + (price * qty);
            }, 0);

            // Create sales order payload
            const orderPayload = {
                customerId, // Use customer ID
                // erpCustId: customer.erpCustId, // Use the erpCustId that belongs to the customer id customerId
                branchId: selectedBranchId, // Use selected branch ID
                erpBranchId: selectedBranchErpId, // Use same as branch ID
                orderBy: 'Customer', // Default value
                entity: getEntityFromCategory(categoryName), // Use helper function to determine entity from category
                paymentMethod: 'Online', // Default value
                totalAmount: totalAmount.toString(),
                paidAmount: '0', // Default value for now
                deliveryCharges: '0', // Default value for now
                expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
                status: 'Pending', // Default status for new orders
            };

            // Helper function to determine entity based on category
            function getEntityFromCategory(category) {
                const categoryLower = category.toLowerCase();
                
                if (categoryLower.includes('vmco')) {
                    return 'vmco';
                } else if (categoryLower.includes('diayafa') || categoryLower.includes('diyafa')) {
                    return 'diyafa';
                } else if (categoryLower.includes('green mast')) {
                    return 'green mast';
                } else if (categoryLower.includes('naqui')) {
                    return 'naqui';
                }
                
                // Default fallback to the first word of category (original logic)
                return category.split(' ')[0].toLowerCase();
            }

            console.log('Creating order with payload:', orderPayload);

            // Step 1: Create the sales order
            const orderResponse = await fetch(`${API_BASE_URL}/sales-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload),
                credentials: 'include',
            });

            if (!orderResponse.ok) {
                const errorText = await orderResponse.text();
                console.error('Server response:', errorText);
                try {
                    const errorData = JSON.parse(errorText);
                    throw new Error(errorData.message || 'Failed to create order');
                } catch (e) {
                    throw new Error(`Failed to create order: ${orderResponse.status} ${orderResponse.statusText}`);
                }
            }

            // Parse the response to get the order ID
            const orderResult = await orderResponse.json();
            console.log('Order creation result:', orderResult);

            if (!orderResult.data || !orderResult.data.id) {
                throw new Error('Order ID not returned from API');
            }

            const orderId = orderResult.data.id;

            // Step 2: Create sales order lines for each product
            const productsPayload = categoryItems.map((item, index) => ({
                order_id: orderId,
                line_number: index + 1, // Generate sequential line numbers
                erp_line_number: index + 1, // Using same as line_number
                product_id: item.productId || item.id, // Use the proper product ID
                erp_prod_id: item.erpProdId || item.erp_prod_id || '', // Use ERP product ID if available
                quantity: parseInt(quantities[item.id] || item.quantity || 1, 10),
                unit: item.unit || 'EA',
                unit_price: parseFloat(item.unitPrice || item.price || 0),
                net_amount: parseFloat(item.price || 0) * parseInt(quantities[item.id] || item.quantity || 1, 10),
                sales_tax_rate: parseFloat(item.vatPercentage || item.vat || item.salesTaxRate || 0)
            }));

            console.log('Submitting products payload:', productsPayload);

            // Add product lines to the order
            const linesResponse = await fetch(`${API_BASE_URL}/sales-order-lines`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productsPayload),
                credentials: 'include',
            });

            if (!linesResponse.ok) {
                const errorText = await linesResponse.text();
                console.error('Server response for product lines:', errorText);
                try {
                    const errorData = JSON.parse(errorText);
                    throw new Error(errorData.message || 'Failed to add products to order');
                } catch (e) {
                    throw new Error(`Failed to add products to order: ${linesResponse.status} ${linesResponse.statusText}`);
                }
            }

            // Step 3: Remove items from cart using the batch deletion endpoint
            try {
                // Get customer ID from localStorage or use a default
                const customerId = localStorage.getItem('customerId') || '3';
                
                // Build the URL with query parameters
                const deleteUrl = new URL(`${API_BASE_URL}/cart/delete`);
                deleteUrl.searchParams.append('customer_id', customerId);
                deleteUrl.searchParams.append('branch_id', selectedBranchId);
                deleteUrl.searchParams.append('entity', getEntityFromCategory(categoryName));
                deleteUrl.searchParams.append('category', categoryName);
                
                console.log(`Deleting cart items with URL: ${deleteUrl}`);
                
                const deleteResponse = await fetch(deleteUrl, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });
                
                if (!deleteResponse.ok) {
                    console.error(`Error removing cart items: ${deleteResponse.status} ${deleteResponse.statusText}`);
                }
            } catch (err) {
                console.error('Error removing cart items:', err);
                // Continue with the order process even if deletion fails
            }

            // Show success message
            alert(t(`Order for ${categoryName} placed successfully! Order #${orderId}`));
            
            // Refresh cart items
            window.location.reload();
            
        } catch (err) {
            console.error('Error placing order:', err);
            setError(err.message);
            alert(t(`Failed to place order: ${err.message}`));
        } finally {
            setIsPlacingOrder(false);
        }
    };

    // Handle place all orders button click
    const handlePlaceAllOrders = async () => {
        // Check if there are any items to order
        const allItems = cartItems.flatMap(category => category.items);
        if (allItems.length === 0) {
            alert(t('Your cart is empty.'));
            return;
        }

        if (isPlacingOrder) {
            alert(t('An order is already being processed. Please wait.'));
            return;
        }

        try {
            setIsPlacingOrder(true);
            
            // Place an order for each category that has items
            for (const category of cartItems) {
                if (category.items.length > 0) {
                    await handlePlaceOrder(category.items, category.category);
                }
            }
            
            alert(t('All orders have been placed successfully!'));
            window.location.reload(); // Refresh page after all orders are placed
            
        } catch (err) {
            console.error('Error placing all orders:', err);
            alert(t(`Failed to place all orders: ${err.message}`));
        } finally {
            setIsPlacingOrder(false);
        }
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
                                                                alt={''} 
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = '/placeholder-image.png';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="image-placeholder" style={{ backgroundColor: '#cccccc', height: '100%', width: '100%' }}></div>
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
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        {/* Show partial payment for VMCO Machines */}
                                        {category.category === 'VMCO Machines' && category.items.length > 0 && (
                                            <div className="partial-payment-row">
                                                <span className="partial-payment-warning">Min. 30% Partial Payment required</span>
                                            </div>
                                        )}
                                        {category.items.length > 0 && (
                                            <div className="checkout-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span className="checkout-info" style={{ margin: '10px', fontWeight: 'bold' }}>
                                                    {t('Total for this category')}: 
                                                    {category.items.reduce((total, item) => {
                                                        const price = parseFloat(item.price) || 0;
                                                        return total + price * (quantities[item.id] || item.quantity);
                                                    }, 0)} 
                                                    <span className="sar-label" style={{ margin: '5px' }}>SAR</span>
                                                </span>
                                                <button 
                                                    className="checkout-btn"
                                                    onClick={() => handlePlaceOrder(category.items, category.category)}
                                                    disabled={isPlacingOrder}
                                                >
                                                    {isPlacingOrder ? t('Processing...') : t('Place Order')}
                                                </button>
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
                        <button 
                            className="checkout-all-btn"
                            onClick={handlePlaceAllOrders}
                            disabled={isPlacingOrder || totalItems === 0}
                        >
                            {isPlacingOrder ? t('Processing...') : t('Place all orders')}
                        </button>
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
                
                /* Styling for disabled buttons */
                button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>
        </Sidebar>
    );
}

export default Cart;