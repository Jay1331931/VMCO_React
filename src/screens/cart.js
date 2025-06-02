import React, { useState, useEffect, use } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import QuantityController from '../components/QuantityController';
import { useAuth } from '../context/AuthContext';

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
    const { token, user, isAuthenticated, logout } = useAuth();
    console.log('User data:', user);

    const userId = user.userId;
    const customerId = user?.customerId;
    // Fetch branch information from localStorage
    useEffect(() => {
        try {
            // Set user and customer IDs from context
            if (userId) {setSelectedUserId(userId);}
            if (customerId) {setSelectedCustomerId(customerId);}
            const branchName = localStorage.getItem('selectedBranchName');
            const branchId = localStorage.getItem('selectedBranchId');
            const branchErpId = localStorage.getItem('selectedBranchErpId');

            console.log('User details:', { userId, customerId }, 'Retrieved branch info:', { branchName, branchId, branchErpId });

            if (!branchId || !branchName || branchName.trim() === '') {
                console.warn('Branch selection is missing or incomplete');
                alert(t('Please select a branch before accessing your cart'));
                navigate('/catalog');
                return;
            }

            setSelectedBranchName(branchName);
            setSelectedBranchId(branchId);
            setSelectedBranchErpId(branchErpId);

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
                    page: 1,
                    pageSize: 200, // Fetch a large number to get all cart items
                    sortBy: 'id',
                    sortOrder: 'asc'
                });

                // Create a single filters object with all required fields
                const filters = {
                    user_id: selectedUserId, // Make sure userId is defined, fallback to user.id if available
                    customer_id: selectedCustomerId || customerId || '3',
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
                console.log('Fetched cart data:',  result);

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
                    const formattedItem = {
                        id: product.id,
                        name: productName, // Language-aware
                        description: isArabic && product.descriptionLc ? product.descriptionLc : product.description,
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
    }, [selectedBranchId, API_BASE_URL, i18n.language]); // Add i18n.language as a dependency

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

            // Build the URL for the delete request
            const deleteUrl = new URL(`${API_BASE_URL}/cart?customer_id=${customerId || '3'}&branch_id=${selectedBranchId}&entity=${item.entity}&category=${item.category}&id=${item.id}`);

            console.log(`Removing cart item with ID: ${item.id}`);

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

    const calculateTotal = () => {
        return cartItems.reduce((total, category) => {
            return total + category.items.reduce((catTotal, item) => {
                const price = parseFloat(item.price) || 0;
                return catTotal + price * (quantities[item.id] || item.quantity);
            }, 0);
        }, 0);
    };

    const handleContinueShopping = () => {
        navigate(-1);
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
            
            // Calculate total amount for this category
            const totalAmount = categoryItems.reduce((total, item) => {
                const price = parseFloat(item.price) || 0;
                const qty = quantities[item.id] || item.quantity || 1;
                return total + (price * qty);
            }, 0);

            // Determine entity from category
            const entity = getEntityFromCategory(categoryName);
            
            // Step 1: Check if there's an existing pending order for this customer+branch+entity
            const orderFilters = new URLSearchParams({
                customerId: selectedCustomerId || '3',
                branchId: selectedBranchId,
                entity: entity
            });
            
            console.log(`Checking for existing orders with filters: ${orderFilters.toString()}`);
            
            const existingOrderResponse = await fetch(`${API_BASE_URL}/sales-order/pagination?${orderFilters.toString()}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            
            if (!existingOrderResponse.ok) {
                console.error(`Error checking existing orders: ${existingOrderResponse.status}`);
                throw new Error(`Failed to check existing orders: ${existingOrderResponse.statusText}`);
            }
            
            const existingOrderResult = await existingOrderResponse.json();
            console.log('Existing order check result:', existingOrderResult);
            
            let orderId;
            
            // If we have an existing pending order, use it. Otherwise create a new one
            if (existingOrderResult.data && existingOrderResult.data.length > 0) {
                // Use the first pending order
                orderId = existingOrderResult.data[0].id;
                console.log(`Using existing order #${orderId}`);
                
                // Update the order total amount
                const updateOrderPayload = {
                    id: orderId,
                    totalAmount: totalAmount.toString()
                    // Keep other fields unchanged
                };
                
                const updateOrderResponse = await fetch(`${API_BASE_URL}/sales-order/${orderId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateOrderPayload),
                    credentials: 'include',
                });
                
                if (!updateOrderResponse.ok) {
                    console.error(`Error updating order: ${updateOrderResponse.status}`);
                    throw new Error(`Failed to update order: ${updateOrderResponse.statusText}`);
                }
                
            } else {
                // Create a new sales order
                const orderPayload = {
                    customerId: selectedCustomerId || '3',
                    branchId: selectedBranchId,
                    erpBranchId: selectedBranchErpId,
                    orderBy: 'Customer',
                    entity: entity,
                    paymentMethod: 'Online',
                    totalAmount: totalAmount.toString(),
                    paidAmount: '0',
                    deliveryCharges: '0',
                    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
                    status: 'Pending',
                };

                console.log('Creating new order with payload:', orderPayload);

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

                orderId = orderResult.data.id;
            }

            // Step 2: Fetch existing order lines for this order
            const linesResponse = await fetch(`${API_BASE_URL}/sales-order-lines/pagination?order_id=${orderId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            
            if (!linesResponse.ok) {
                console.error(`Error fetching order lines: ${linesResponse.status}`);
                throw new Error(`Failed to fetch order lines: ${linesResponse.statusText}`);
            }
            
            const existingLines = await linesResponse.json();
            console.log('Existing order lines:', existingLines.data || []);
            
            // Map existing product lines by product_id for easy lookup
            const existingProductMap = {};
            if (existingLines.data && Array.isArray(existingLines.data)) {
                existingLines.data.forEach(line => {
                    if (line.product_id) {
                        existingProductMap[line.product_id] = line;
                    }
                });
            }
            
            // Prepare payloads for new lines and updates to existing lines
            const newLinesPayload = [];
            const updateLinesPayload = [];
            
            // Process each product in our category
            categoryItems.forEach((item, index) => {
                const productId = item.productId || item.id;
                const quantity = parseInt(quantities[item.id] || item.quantity || 1, 10);
                const unitPrice = parseFloat(item.unitPrice || item.price || 0);
                const netAmount = unitPrice * quantity;
                
                // Check if this product already exists in the order
                if (existingProductMap[productId]) {
                    // Update existing line
                    const existingLine = existingProductMap[productId];
                    const updatedQuantity = quantity; // Set to the new quantity value
                    
                    updateLinesPayload.push({
                        id: existingLine.id,
                        order_id: orderId,
                        quantity: updatedQuantity,
                        net_amount: unitPrice * updatedQuantity
                        // Keep other fields unchanged
                    });
                } else {
                    // Create new line
                    newLinesPayload.push({
                        order_id: orderId,
                        line_number: index + 1, // Generate sequential line numbers
                        erp_line_number: index + 1, // Using same as line_number
                        product_id: productId,
                        erp_prod_id: item.erpProdId || item.erp_prod_id || '',
                        quantity: quantity,
                        unit: item.unit || 'EA',
                        unit_price: unitPrice,
                        net_amount: netAmount,
                        sales_tax_rate: parseFloat(item.vatPercentage || item.vat || item.salesTaxRate || 0)
                    });
                }
            });
            
            // Submit new order lines if any
            if (newLinesPayload.length > 0) {
                console.log('Creating new order lines:', newLinesPayload);
                
                const createLinesResponse = await fetch(`${API_BASE_URL}/sales-order-lines`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newLinesPayload),
                    credentials: 'include',
                });
                
                if (!createLinesResponse.ok) {
                    const errorText = await createLinesResponse.text();
                    console.error('Server response for new lines:', errorText);
                    throw new Error(`Failed to add products to order: ${createLinesResponse.status} ${createLinesResponse.statusText}`);
                }
            }
            
            // Update existing order lines if any
            for (const line of updateLinesPayload) {
                console.log(`Updating line ID ${line.id}:`, line);
                
                const updateLineResponse = await fetch(`${API_BASE_URL}/sales-order-lines/id/${line.id}`, {
                    method: 'PATCH', // Change from PUT to PATCH to match the API route
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(line),
                    credentials: 'include',
                });
                
                if (!updateLineResponse.ok) {
                    const errorText = await updateLineResponse.text();
                    console.error(`Server response for updating line ${line.id}:`, errorText);
                    throw new Error(`Failed to update order line: ${updateLineResponse.status} ${updateLineResponse.statusText}`);
                }
            }

            // Step 3: Remove items from cart using the batch deletion endpoint
            try {
                // Build the URL with query parameters
                const deleteUrl = new URL(`${API_BASE_URL}/cart/delete`);
                deleteUrl.searchParams.append('customer_id', selectedCustomerId || '3');
                deleteUrl.searchParams.append('branch_id', selectedBranchId);
                deleteUrl.searchParams.append('entity', entity);
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
            //alert(t(`Order for ${categoryName} placed successfully! Order #${orderId}`));

            // Refresh cart items
            //window.location.reload();

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
            setError(null);

            // Group items by entity
            const vmcoMachineItems = cartItems.find(cat => cat.category === t('VMCO Machines'))?.items || [];
            const vmcoConsumableItems = cartItems.find(cat => cat.category === t('VMCO Consumables'))?.items || [];
            const diyafaItems = cartItems.find(cat => cat.category === t('Diyafa'))?.items || [];
            const greenMastItems = cartItems.find(cat => cat.category === t('Green Mast'))?.items || [];
            const naquiItems = cartItems.find(cat => cat.category === t('Naqui'))?.items || [];

            // Process VMCO items together (machines and consumables)
            const vmcoItems = [...vmcoMachineItems, ...vmcoConsumableItems];
            if (vmcoItems.length > 0) {
                await createEntityOrder('vmco', vmcoItems);
            }

            // Process other entities
            if (diyafaItems.length > 0) {
                await createEntityOrder('diyafa', diyafaItems);
            }

            if (greenMastItems.length > 0) {
                await createEntityOrder('green mast', greenMastItems);
            }

            if (naquiItems.length > 0) {
                await createEntityOrder('naqui', naquiItems);
            }

            alert(t('All orders have been placed successfully!'));
            window.location.reload(); // Refresh page after all orders are placed

        } catch (err) {
            console.error('Error placing all orders:', err);
            alert(t(`Failed to place all orders: ${err.message}`));
        } finally {
            setIsPlacingOrder(false);
        }

        // Helper function to create an order for a specific entity
        async function createEntityOrder(entity, items) {
            if (items.length === 0) return;

            // Calculate total amount for this entity
            const totalAmount = items.reduce((total, item) => {
                const price = parseFloat(item.price) || 0;
                const qty = quantities[item.id] || item.quantity || 1;
                return total + (price * qty);
            }, 0);

            // Create sales order payload
            const orderPayload = {
                customerId: selectedCustomerId || '3', //
                branchId: selectedBranchId,
                erpBranchId: selectedBranchErpId,
                orderBy: 'Customer',
                entity: entity,
                paymentMethod: 'Online',
                totalAmount: totalAmount.toString(),
                paidAmount: '0',
                deliveryCharges: '0',
                expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
                status: 'Pending',
            };

            console.log(`Creating ${entity} order with payload:`, orderPayload);

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
                    throw new Error(errorData.message || `Failed to create ${entity} order`);
                } catch (e) {
                    throw new Error(`Failed to create ${entity} order: ${orderResponse.status} ${orderResponse.statusText}`);
                }
            }

            // Parse the response to get the order ID
            const orderResult = await orderResponse.json();
            console.log(`${entity} order creation result:`, orderResult);

            if (!orderResult.data || !orderResult.data.id) {
                throw new Error(`Order ID not returned from API for ${entity}`);
            }

            const orderId = orderResult.data.id;

            // Step 2: Create sales order lines for each product
            const productsPayload = items.map((item, index) => ({
                order_id: orderId,
                line_number: index + 1,
                erp_line_number: index + 1,
                product_id: item.productId || item.id,
                erp_prod_id: item.erpProdId || item.erp_prod_id || '',
                quantity: parseInt(quantities[item.id] || item.quantity || 1, 10),
                unit: item.unit || 'EA',
                unit_price: parseFloat(item.unitPrice || item.price || 0),
                net_amount: parseFloat(item.price || 0) * parseInt(quantities[item.id] || item.quantity || 1, 10),
                sales_tax_rate: parseFloat(item.vatPercentage || item.vat || item.salesTaxRate || 0)
            }));

            console.log(`Submitting ${entity} products payload:`, productsPayload);

            // Add product lines to the order
            const linesResponse = await fetch(`${API_BASE_URL}/sales-order-lines`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productsPayload),
                credentials: 'include',
            });

            if (!linesResponse.ok) {
                const errorText = await linesResponse.text();
                console.error(`Server response for ${entity} product lines:`, errorText);
                try {
                    const errorData = JSON.parse(errorText);
                    throw new Error(errorData.message || `Failed to add products to ${entity} order`);
                } catch (e) {
                    throw new Error(`Failed to add products to ${entity} order: ${linesResponse.status} ${linesResponse.statusText}`);
                }
            }

            // Step 3: Remove items from cart
            try {
                // For VMCO, we need to delete both machines and consumables
                if (entity === 'vmco') {
                    await deleteCartItems('vmco', t('VMCO Machines'));
                    await deleteCartItems('vmco', t('VMCO Consumables'));
                } else {
                    // Map entity to category name
                    let categoryName;
                    if (entity === 'diyafa') categoryName = t('Diyafa');
                    else if (entity === 'green mast') categoryName = t('Green Mast');
                    else if (entity === 'naqui') categoryName = t('Naqui');

                    await deleteCartItems(entity, categoryName);
                }
            } catch (err) {
                console.error(`Error removing ${entity} cart items:`, err);
                // Continue with the order process even if deletion fails
            }

            console.log(`Successfully placed order for ${entity}, Order #${orderId}`);
        }

        // Helper function to delete cart items
        async function deleteCartItems(entity, categoryName) {
            // Build the URL with query parameters
            const deleteUrl = new URL(`${API_BASE_URL}/cart/delete`);
            deleteUrl.searchParams.append('customer_id', selectedCustomerId || '3'); // Use selected customer ID or default to '3'
            deleteUrl.searchParams.append('branch_id', selectedBranchId);
            deleteUrl.searchParams.append('entity', entity);
            deleteUrl.searchParams.append('category', categoryName);

            console.log(`Deleting cart items with URL: ${deleteUrl}`);

            const deleteResponse = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!deleteResponse.ok) {
                console.error(`Error removing cart items: ${deleteResponse.status} ${deleteResponse.statusText}`);
                // We don't throw here to allow the process to continue
            }
        }
    };
    // Calculate total items for header and summary
    const totalItems = cartItems.reduce((sum, cat) => sum + cat.items.length, 0);

    return (
        <Sidebar title={t('Your Cart')} dir={t('direction')}>
            <div className="cart-header">
                <h2 className="cart-title">{t('Cart')} ({totalItems} {t('items')})</h2>
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
                                                            <div className="image-placeholder" style={{ backgroundColor: '#cccccc', height: '100%', width: '100%' }}></div>
                                                        )}
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
                                                            {parseInt(item.price)}
                                                            <span className="sar-label">SAR</span>
                                                        </span>
                                                        <span className="item-total-price">
                                                            Total: {parseInt(item.price) * (quantities[item.id] || item.quantity)}
                                                            <span className="sar-label">SAR</span>
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
                {/* <div className="cart-summary-panel">
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
                </div> */}
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

export default Cart