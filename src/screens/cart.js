import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import QuantityController from '../components/QuantityController';
import { useAuth } from '../context/AuthContext';
import GetPaymentMethods from '../components/GetPaymentMethods';


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Helper function to determine entity from category name
const getEntityFromCategory = (categoryName) => {
    // Convert to lowercase for case-insensitive comparison
    const category = categoryName.toLowerCase();

    if (category.includes('vmco')) {
        return 'vmco';
    } else if (category.includes('diyafa')) {
        return 'diyafa';
    } else if (category.includes('green mast')) {
        return 'green mast';
    } else if (category.includes('naqui')) {
        return 'naqui';
    }

    // Default to vmco if no match (though this shouldn't happen with your categories)
    return 'vmco';
};

function Cart() {
    const { t, i18n } = useTranslation(); // Get i18n at component level
    const navigate = useNavigate();
    const [collapsedCategories, setCollapsedCategories] = useState(new Set());
    const [quantities, setQuantities] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(''); // Initialize empty
    const [selectedCustomerId, setSelectedCustomerId] = useState(''); // Initialize empty
    const [selectedBranchName, setSelectedBranchName] = useState('No location selected');
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [selectedBranchErpId, setSelectedBranchErpId] = useState('');
    const [selectedBranchRegion, setSelectedBranchRegion] = useState('');
    const [showPaymentPopup, setShowPaymentPopup] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [pendingOrderCategory, setPendingOrderCategory] = useState(null);
    const [pendingOrderItems, setPendingOrderItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cartItems, setCartItems] = useState([
        { category: t('VMCO Machines'), items: [] },
        { category: t('VMCO Consumables'), items: [] },
        { category: t('Diyafa'), items: [] },
        { category: t('Green Mast'), items: [] },
        { category: t('Naqui'), items: [] }
    ]);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const { token, user } = useAuth();
    console.log('User data:', user);

    const userId = user.userId;
    const customerId = user?.customerId;
    // Fetch branch information from localStorage
    useEffect(() => {
        try {
            // Set user and customer IDs from context
            if (userId) { setSelectedUserId(userId); }
            if (customerId) { setSelectedCustomerId(customerId); }
            const branchName = localStorage.getItem('selectedBranchName');
            const branchId = localStorage.getItem('selectedBranchId');
            const branchErpId = localStorage.getItem('selectedBranchErpId');
            const branchRegion = localStorage.getItem('selectedBranchRegion');

            console.log('User details:', { userId, customerId }, 'Retrieved branch info:', { branchName, branchId, branchErpId, branchRegion });

            if (!branchId || !branchName || branchName.trim() === '') {
                console.warn('Branch selection is missing or incomplete');
                alert(t('Please select a branch before accessing your cart'));
                navigate('/catalog');
                return;
            }

            setSelectedBranchName(branchName);
            setSelectedBranchId(branchId);
            setSelectedBranchErpId(branchErpId);
            setSelectedBranchRegion(branchRegion);

        } catch (error) {
            console.error('Error retrieving branch info from localStorage:', error);
            alert(t('Error loading your branch information. Please select a branch again.'));
            navigate('/catalog');
        }
    }, [userId, customerId, navigate, t]);

    // Fetch cart items from the backend using fetch API
    useEffect(() => {
        const fetchCartItems = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Set up parameters for pagination
                const params = new URLSearchParams({
                    //page: 1,
                    //pageSize: 200, // Fetch a large number to get all cart items
                    sortBy: 'id',
                    sortOrder: 'asc'
                });

                // Create a single filters object with all required fields
                const filters = {
                    user_id: selectedUserId, // Make sure userId is defined, fallback to user.id if available
                    customer_id: selectedCustomerId,
                    branch_id: selectedBranchId
                };

                // Log the filters to ensure userId is included
                console.log('Cart filters:', filters);

                // Add filters as a single parameter with stringified JSON
                params.append('filters', JSON.stringify(filters));

                console.log('Fetching cart with params:', params.toString());

                const response = await fetch(`${API_BASE_URL}/cart/pagination?${params.toString()}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}` // Add authorization token if required
                    },
                    credentials: 'include' // Include cookies/auth tokens
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Server error response:', errorText);
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();
                console.log('Fetched cart data:', result);

                // Initialize arrays for each category
                const vmcoMachines = [];
                const vmcoConsumables = [];
                const diyafa = [];
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

                // Get current language
                const currentLanguage = i18n.language;
                const isArabic = currentLanguage.startsWith('ar');



                // Process each product and categorize it correctly
                cartProducts.forEach(product => {

                    // Choose the right product name based on language
                    let productName = product.productName || product.product_name;

                    // If language is not English and we have a localized name, use it
                    if (currentLanguage !== 'en' && (product.product_name_lc || product.productNameLc)) {
                        productName = product.product_name_lc || product.productNameLc || productName;
                    }

                    // Format the product data for display
                    let imageUrls = [];
                    if (product.images) {
                        try {
                            const parsed = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                            if (Array.isArray(parsed)) {
                                imageUrls = parsed;
                            }
                        } catch (e) {
                            imageUrls = [product.images];
                        }
                    }

                    // Format the product data for display
                    const formattedItem = {
                        id: product.id,
                        name: productName, // Language-aware
                        description: isArabic && product.descriptionLc ? product.descriptionLc : product.description,
                        price: product.unitPrice,
                        quantity: product.quantityOrdered,
                        delivery: product.estimatedDelivery || product.delivery || '15 Apr 2025',
                        imageUrl: imageUrls[0], // <-- Use first image URL
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
                    } else if (entity === 'diyafa' || entity === 'diyafa') {
                        diyafa.push(formattedItem);
                    } else if (entity === 'green mast') {
                        greenMast.push(formattedItem);
                    } else if (entity === 'naqui') {
                        naqui.push(formattedItem);
                    } else {
                        // If entity is not specified, try to determine by category
                        const category = (product.category || '').toLowerCase();

                        if (category.includes('diyafa') || category.includes('diyafa')) {
                            diyafa.push(formattedItem);
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
                    { category: t('VMCO Machines'), items: vmcoMachines },
                    { category: t('VMCO Consumables'), items: vmcoConsumables },
                    { category: t('Diyafa'), items: diyafa },
                    { category: t('Green Mast'), items: greenMast },
                    { category: t('Naqui'), items: naqui }
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
    }, [selectedUserId, t, token, selectedCustomerId, selectedBranchId, i18n.language]); // Add i18n.language as a dependency

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

    // Add this function to the Cart component
    const handleRemoveItem = async (item) => {
        if (!item || !item.id) {
            console.error('Invalid item provided to handleRemoveItem');
            return;
        }

        if (isPlacingOrder) {
            alert(t('An order is being processed. Please wait.'));
            return;
        }

        try {
            setIsPlacingOrder(true); // Use the same state to prevent multiple actions

            // Build the URL for the delete request with correct query params
            const deleteUrl = new URL(`${API_BASE_URL}/cart/delete`);
            deleteUrl.searchParams.append('customer_id', customerId);
            deleteUrl.searchParams.append('branch_id', selectedBranchId);
            if (item.entity) deleteUrl.searchParams.append('entity', item.entity);
            if (item.category) deleteUrl.searchParams.append('category', item.category);
            deleteUrl.searchParams.append('product_id', item.productId);

            console.log(`Removing cart item with params: ${deleteUrl}`);

            const deleteResponse = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!deleteResponse.ok) {
                const errorText = await deleteResponse.text();
                console.error(`Error removing item: ${deleteResponse.status}`, errorText);
                throw new Error(`Failed to remove item: ${deleteResponse.statusText}`);
            }

            // Update the local cart state by filtering out the removed item
            setCartItems(prevCartItems =>
                prevCartItems.map(category => ({
                    ...category,
                    items: category.items.filter(cartItem => cartItem.id !== item.id)
                }))
            );

            // Also remove the item from quantities state
            setQuantities(prev => {
                const newQuantities = { ...prev };
                delete newQuantities[item.id];
                return newQuantities;
            });

        } catch (err) {
            console.error('Error removing item:', err);
            alert(t(`Failed to remove item: ${err.message}`));
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const handleQuantityChange = (itemId, delta) => {
        setQuantities(prev => ({
            ...prev,
            [itemId]: Math.max(1, (prev[itemId] || 1) + delta)
        }));
    };


    const handleContinueShopping = () => {
        navigate(-1);
    };

    const handleSelectPaymentMethod = (method) => {
        setShowPaymentPopup(false);
        setSelectedPaymentMethod(method);
        console.log('selected payment:', method)
        handlePlaceOrder(pendingOrderItems, pendingOrderCategory, method);
    };

    // Handle place order button click
    const handlePlaceOrder = async (categoryItems, categoryName, selectedPaymentMethod) => {
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

        const entity = getEntityFromCategory(categoryName);
        const category = categoryName;

        const orderFilters = new URLSearchParams({
            filters: JSON.stringify({
                customerId: selectedCustomerId,
                branchId: selectedBranchId,
                entity,
                category,
                status: 'Open'
            })
        });

        const existingOrderResponse = await fetch(`${API_BASE_URL}/sales-order/pagination?${orderFilters}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!existingOrderResponse.ok) {
            throw new Error(`Failed to check existing orders: ${existingOrderResponse.statusText}`);
        }

        const existingOrderResult = await existingOrderResponse.json();
        let orderId;
        let existingProductMap = {};

        if (existingOrderResult.data?.data?.length > 0) {
            orderId = existingOrderResult.data.data[0].id;

            const linesResponse = await fetch(`${API_BASE_URL}/sales-order-lines/pagination?filters={"orderId":${orderId}}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!linesResponse.ok) {
                throw new Error(`Failed to fetch order lines: ${linesResponse.statusText}`);
            }

            const existingLines = await linesResponse.json();
            if (existingLines.data?.data) {
                existingLines.data.data.forEach(line => {
                    if (line.product_id) {
                        existingProductMap[line.product_id] = line;
                    }
                });
            }

        } else {
            // Fetch customer to check delivery charge applicability
            const customerResponse = await fetch(`${API_BASE_URL}/customers/id/${selectedCustomerId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!customerResponse.ok) {
                throw new Error('Failed to fetch customer data for delivery charge evaluation');
            }

            const customerData = await customerResponse.json();
            const isDeliveryChargesApplicable = customerData?.data?.is_delivery_charges_applicable === true;

            // Create new order with 0 totalAmount for now
            const orderPayload = {
                customerId: selectedCustomerId,
                branchId: selectedBranchId,
                erpBranchId: selectedBranchErpId,
                branchRegion: selectedBranchRegion,
                orderBy: 'Customer',
                entity,
                paymentMethod: selectedPaymentMethod,
                totalAmount: '0.00',
                paidAmount: '0.00',
                deliveryCharges: deliveryCharges,
                paymentStatus: 'Pending',
                status: 'Open',
            };

            const orderResponse = await fetch(`${API_BASE_URL}/sales-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload),
                credentials: 'include',
            });

            if (!orderResponse.ok) {
                const errorText = await orderResponse.text();
                throw new Error(JSON.parse(errorText)?.message || 'Failed to create order');
            }

            const orderResult = await orderResponse.json();
            orderId = orderResult.data.id;
        }

        // Create or Update Order Lines
        for (const item of categoryItems) {
            const productId = item.productId || item.id;
            const newQuantity = parseInt(quantities[item.id] || item.quantity || 1);
            const unitPrice = parseFloat(item.unitPrice || item.price || 0);
            const vatPercentage = parseFloat(item.vatPercentage || 0);
            const sugarTaxPrice = parseFloat(item.sugarTaxPrice || 0);

            const existingLine = existingProductMap[productId];
            const totalQuantity = existingLine ? parseInt(existingLine.quantity || 0) + newQuantity : newQuantity;
            const baseAmount = unitPrice * totalQuantity;
            const vatAmount = (baseAmount * vatPercentage) / 100;
            const sugarTaxAmount = (baseAmount * sugarTaxPrice) / 100;
            const netAmount = baseAmount + vatAmount + sugarTaxAmount;

            if (existingLine) {
                const patchPayload = {
                    quantity: totalQuantity,
                    net_amount: netAmount
                };

                const patchResponse = await fetch(`${API_BASE_URL}/sales-order-lines/${orderId}/${productId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(patchPayload),
                    credentials: 'include',
                });

                if (!patchResponse.ok) {
                    const errorText = await patchResponse.text();
                    console.error(`Failed to update line for product ${productId}: ${errorText}`);
                }
            } else {
                const newLinePayload = {
                    order_id: orderId,
                    product_id: productId,
                    quantity: newQuantity,
                    unit: item.unit,
                    unit_price: unitPrice,
                    vat_percentage: vatPercentage,
                    sugar_tax_price: sugarTaxPrice,
                    net_amount: netAmount,
                    erp_line_number: item.erp_line_number || 1,
                    erp_prod_id: item.erpProdId || item.erp_prod_id
                };

                const createResponse = await fetch(`${API_BASE_URL}/sales-order-lines`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newLinePayload),
                    credentials: 'include',
                });

                if (!createResponse.ok) {
                    const errorText = await createResponse.text();
                    console.error(`Failed to create line for product ${productId}: ${errorText}`);
                }
            }
        }

        // Recalculate totalAmount after line inserts/updates
        const recalcLinesResponse = await fetch(`${API_BASE_URL}/sales-order-lines/pagination?filters=${encodeURIComponent(JSON.stringify({ orderId }))}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!recalcLinesResponse.ok) {
            throw new Error('Failed to fetch order lines for recalculating total amount');
        }

        const recalcLinesData = await recalcLinesResponse.json();
        const allLines = recalcLinesData?.data?.data || [];

        const totalAmount = allLines.reduce((sum, line) => {
            return sum + parseFloat(line.net_amount || 0);
        }, 0);

        // Calculate delivery charges again now
        const isDeliveryChargesApplicable = categoryItems.some(item => item.entity === 'VMCO') // fallback if customer not fetched earlier
            ? false
            : true;

        let deliveryCharges = 0.00;
        const isVmcoMachine = categoryName.toLowerCase().includes('vmco') && categoryName.toLowerCase().includes('machine');
        if (!isVmcoMachine && isDeliveryChargesApplicable && totalAmount <= 150) {
            deliveryCharges = 20.00;
        }
        console.log('Delivery Charges calculated:',deliveryCharges);

        const updateOrderPayload = {
            id: orderId,
            paymentMethod: selectedPaymentMethod,
            totalAmount: totalAmount.toFixed(2),
            deliveryCharges: deliveryCharges.toFixed(2),
        };

        const updateOrderResponse = await fetch(`${API_BASE_URL}/sales-order/id/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateOrderPayload),
            credentials: 'include',
        });

        if (!updateOrderResponse.ok) {
            throw new Error(`Failed to update order with final amounts`);
        }

        const updatedOrderResponse= await updateOrderPayload.json();
        console.log('Updated the order:', updatedOrderResponse);

        // Delete cart items
        try {
            const deleteUrl = new URL(`${API_BASE_URL}/cart/delete`);
            deleteUrl.searchParams.append('customer_id', selectedCustomerId);
            deleteUrl.searchParams.append('branch_id', selectedBranchId);
            deleteUrl.searchParams.append('entity', entity);
            deleteUrl.searchParams.append('category', categoryName);

            const deleteResponse = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!deleteResponse.ok) {
                console.error(`Error removing cart items: ${deleteResponse.statusText}`);
            }
        } catch (err) {
            console.error('Error during cart cleanup:', err);
        }

    } catch (err) {
        console.error('Error placing order:', err);
        setError(err.message);
        alert(t(`Failed to place order: ${err.message}`));
    } finally {
        setIsPlacingOrder(false);
    }
};





    return (
        <Sidebar title={t('Your Cart')} dir={t('direction')}>
            <div className="cart-header">
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
                                            <div className="empty-category">{t('No items in this category')}</div>
                                        ) : (
                                            category.items.map((item, idx) => (
                                                <div key={item.id + '-' + idx} className="cart-item">
                                                    <div className="item-image">
                                                        <img
                                                            src={item.imageUrl || '/placeholder-image.png'}
                                                            alt={item.name}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = '/placeholder-image.png';
                                                            }}
                                                            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }}
                                                        />
                                                    </div>
                                                    <div className="item-details">
                                                        <h4 className="item-name">{item.name}</h4>
                                                        <p className="item-code">{item.productCode}</p>
                                                        {item.description && <p className="item-description">{item.description}</p>}
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
                                                            {parseInt(item.price * item.quantity)}
                                                            <span className="sar-label">SAR</span>
                                                        </span>

                                                        <span className="tax-row">VAT:{item.vatPercentage}%</span>
                                                        <span className="item-total-price">
                                                            Net Amount: {(parseInt((item.price * item.quantity) + (((item.price * item.quantity) / 100) * item.vatPercentage)))} SAR
                                                        </span>
                                                        <button
                                                            className="remove-btn"
                                                            onClick={() => handleRemoveItem(item)} /* Fix: pass the current item, not category.item */
                                                            disabled={isPlacingOrder}
                                                        >
                                                            {isPlacingOrder ? t('Processing...') : t('Remove item')}
                                                        </button>
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
                                                    {(() => {
                                                        // Calculate total for category including VAT and sugar tax
                                                        let categoryTotal = 0;
                                                        category.items.forEach(item => {
                                                            const quantity = quantities[item.id] || item.quantity || 1;
                                                            const unitPrice = parseFloat(item.price) || 0;
                                                            const vatPercentage = parseFloat(item.vatPercentage) || 0;
                                                            const sugarTaxPrice = parseFloat(item.sugarTaxPrice) || 0;

                                                            const baseAmount = unitPrice * quantity;
                                                            const vatAmount = (baseAmount * vatPercentage) / 100;
                                                            const sugarTaxAmount = sugarTaxPrice ? (baseAmount * sugarTaxPrice) / 100 : 0;

                                                            const totalAmount = baseAmount + vatAmount + sugarTaxAmount;
                                                            categoryTotal += totalAmount;
                                                        });
                                                        return (
                                                            <strong> {categoryTotal.toFixed(2)} <span className="sar-label" style={{ margin: '5px' }}>SAR</span></strong>
                                                        );
                                                    })()}
                                                </span>
                                                <button
                                                    className="checkout-btn"
                                                    onClick={() => {
                                                        setPendingOrderCategory(category.category);
                                                        setPendingOrderItems(category.items);
                                                        setShowPaymentPopup(true);
                                                    }}
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
            </div>
            <div className="cart-footer">
                <button className="continue-shopping" onClick={handleContinueShopping}>
                    {t('Continue Shopping')}
                </button>
            </div>

            <GetPaymentMethods
                open={showPaymentPopup}
                onClose={() => setShowPaymentPopup(false)}
                onSelectPaymentMethod={handleSelectPaymentMethod}
                API_BASE_URL={API_BASE_URL}
                t={t}
                category={pendingOrderCategory}
                customerId={selectedCustomerId} // <-- Add this line
            />


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

export default Cart