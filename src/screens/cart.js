import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/components.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import QuantityController from '../components/QuantityController';
import RbacManager from '../utilities/rbac';
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
    const location = useLocation();
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
    const { token, user, logout, loading } = useAuth();
    console.log('User data:', user);

    const userId = user?.userId;
    const customerId = user?.customerId;

    useEffect(() => {
        // Set user and customer IDs from context
        if (userId) { setSelectedUserId(userId); }
        if (customerId) { setSelectedCustomerId(customerId); }
    }, [userId, customerId, navigate, t]);

    // Get current language
    const currentLanguage = i18n.language;
    const isArabic = currentLanguage.startsWith('ar');



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
                }                    // Format the product data for display
                const formattedItem = {
                    id: product.id,
                    product_id: product.product_id, // Ensure product_id is explicitly preserved
                    productId: product.product_id, // Add productId for consistent access
                    name: productName, // Language-aware
                    moq: Number(product.moq || product.minimumOrderQuantity || 1), // Store MOQ with the item as a number
                    description: isArabic && product.descriptionLc ? product.descriptionLc : product.description,
                    price: product.unitPrice,
                    quantity: product.quantityOrdered,
                    delivery: product.estimatedDelivery || product.delivery || '15 Apr 2025',
                    imageUrl: imageUrls[0], // <-- Use first image URL
                    productCode: product.erpProdId || product.product_id || product.code,
                    // Include all original properties
                    ...product
                };                    // Store initial quantities, ensuring we respect MOQ
                const moq = Number(formattedItem.moq) || 1;
                const currentQuantity = Number(formattedItem.quantity) || 0;
                // Ensure quantity is at least MOQ
                initialQuantities[formattedItem.id] = Math.max(moq, currentQuantity);

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
    // Fetch cart items from the backend using fetch API
    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            console.log("$$$$$$$$$$$ logging out");
            // Logout instead of showing loading message
            logout();
            navigate('/login');
            return; // Return while logout is processing
        }

        if (user && user.userType) {
            const fetchData = async () => {
                await fetchCartItems();
            };
            fetchData();
        }
    }, [user, selectedUserId, t, token, selectedCustomerId, selectedBranchId, i18n.language]
    );


    //Rbac and other access based on user object to follow below lik this
    const rbacMgr = new RbacManager(user?.userType == 'employee' && user?.roles[0] !== 'admin' ? user?.designation : user?.roles[0], 'cart');
    const isV = rbacMgr.isV.bind(rbacMgr);
    const isE = rbacMgr.isE.bind(rbacMgr);


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
    }; const handleQuantityChange = (itemId, delta) => {
        // Find the item in any category to get its MOQ
        const item = cartItems.flatMap(category => category.items).find(item => item.id === itemId);
        const moq = item ? Number(item.moq) || 1 : 1;

        setQuantities(prev => {
            // Ensure we're working with numbers, not strings
            const currentQty = Number(prev[itemId] || item?.quantity || 1);
            // Ensure we don't go below MOQ
            const newQty = Math.max(moq, currentQty + Number(delta));
            return {
                ...prev,
                [itemId]: newQty
            };
        });
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

        // Remove special handling for VMCO: always place order for the selected category only
        setIsPlacingOrder(true);
        setError(null);
        try {
            await placeOrderForCategory(categoryItems, categoryName, selectedPaymentMethod);
        } catch (err) {
            setError(err.message);
            alert(t(`Failed to place order: ${err.message}`));
        } finally {
            setIsPlacingOrder(false);
        }
    };

    // Helper function to place order for a single category
    const placeOrderForCategory = async (categoryItems, categoryName, selectedPaymentMethod) => {
        // Copy the original handlePlaceOrder logic here, but add productCategory to orderPayload
        if (categoryItems.length === 0) {
            alert(t('No items in this category to order.'));
            return;
        }
        try {
            const entity = getEntityFromCategory(categoryName);
            const category = categoryName;
            // Build filters for existing order check based on entity
            let orderFiltersObj;
            if (entity && entity.toLowerCase() === 'vmco') {
                // For vmco, include productCategory
                orderFiltersObj = {
                    customerId: selectedCustomerId,
                    branchId: selectedBranchId,
                    entity,
                    status: 'Open',
                    productCategory: categoryName
                };
            } else {
                // For other entities, do not include productCategory
                orderFiltersObj = {
                    customerId: selectedCustomerId,
                    branchId: selectedBranchId,
                    entity,
                    status: 'Open'
                };
            }
            const orderFilters = new URLSearchParams({
                filters: JSON.stringify(orderFiltersObj)
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
            let existingOrderData = null;
            // Fetch customer data for delivery charge calculation - do this once up front
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
            const companyNameEn = customerData?.data?.companyNameEn;
            const companyNameAr = customerData?.data?.companyNameAr;
            const pricingPolicy = customerData?.data?.pricingPolicy;
            const customerRegion = customerData.data?.region;
            const assignedToEntityWiseRaw = customerData?.data?.assignedToEntityWise;
            let assignedTo = customerData?.data?.assignedTo;
            if (assignedToEntityWiseRaw) {
                try {
                    const assignedToEntityWise = typeof assignedToEntityWiseRaw === 'string' ? JSON.parse(assignedToEntityWiseRaw) : assignedToEntityWiseRaw;
                    if (entity && assignedToEntityWise[entity.toLowerCase()]) {
                        assignedTo = assignedToEntityWise[entity.toLowerCase()];
                    }
                } catch (e) {
                    console.error('Error parsing assignedToEntityWise:', e);
                }
            }
            if (existingOrderResult.data?.data?.length > 0) {
                existingOrderData = existingOrderResult.data.data[0];
                orderId = existingOrderData.id;
                const linesResponse = await fetch(`${API_BASE_URL}/sales-order-lines/pagination?filters=${encodeURIComponent(JSON.stringify({ orderId }))}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });
                if (!linesResponse.ok) {
                    throw new Error(`Failed to fetch order lines: ${linesResponse.statusText}`);
                }
                const existingLines = await linesResponse.json();
                if (existingLines.data?.data) {
                    const orderLines = existingLines.data.data.filter(line => line.orderId === orderId);
                    orderLines.forEach(line => {
                        if (line.productId) {
                            existingProductMap[line.productId] = line;
                        }
                    });
                }
            } else {
                // First calculate the initial totalAmount from cart items
                let initialTotalAmount = 0;
                for (const item of categoryItems) {
                    const newQuantity = Number(quantities[item.id] || item.quantity || 1);
                    const unitPrice = parseFloat(item.unitPrice || item.price || 0);
                    const vatPercentage = parseFloat(item.vatPercentage || 0);
                    //const sugarTaxPrice = parseFloat(item.sugarTaxPrice || 0);
                    const baseAmount = unitPrice * newQuantity;
                    const vatAmount = (baseAmount * vatPercentage) / 100;
                    //const sugarTaxAmount = (baseAmount * sugarTaxPrice) / 100;
                    const netAmount = baseAmount + vatAmount; // + sugarTaxAmount;
                    initialTotalAmount += netAmount;
                }
                let deliveryCharges = 0.00;
                const isVmcoMachine = categoryName.toLowerCase().includes('vmco') && categoryName.toLowerCase().includes('machine');
                if (isDeliveryChargesApplicable) {
                    if (!isVmcoMachine && initialTotalAmount <= 150) {
                        deliveryCharges = 20.00;
                    }
                }
                const finalTotalAmount = initialTotalAmount + deliveryCharges;
                const orderPayload = {
                    customerId: selectedCustomerId,
                    companyNameEn: companyNameEn,
                    companyNameAr: companyNameAr,
                    branchId: selectedBranchId,
                    erpBranchId: selectedBranchErpId,
                    branchRegion: selectedBranchRegion,
                    orderBy: 'Customer',
                    entity,
                    paymentMethod: selectedPaymentMethod,
                    totalAmount: finalTotalAmount.toFixed(2),
                    paidAmount: '0.00',
                    deliveryCharges: deliveryCharges.toFixed(2),
                    paymentStatus: 'Pending',
                    status: 'Open',
                    pricingPolicy: pricingPolicy,
                    salesExecutive: assignedTo,
                    customerRegion: customerRegion,
                    productCategory: categoryName // <-- Add this field
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
                // Make sure we properly identify the product ID - check all possible fields in priority order
                const productId = item.product_id || item.productId || item.id;

                console.log(`Processing item with product ID: ${productId}`, {
                    item_details: {
                        id: item.id,
                        product_id: item.product_id,
                        productId: item.productId,
                        name: item.name || item.productName,
                        all_item_keys: Object.keys(item)
                    }
                });

                const newQuantity = parseInt(quantities[item.id] || item.quantity || 1);
                const unitPrice = parseFloat(item.unitPrice || item.price || 0);
                const vatPercentage = parseFloat(item.vatPercentage || 0);
                //const sugarTaxPrice = parseFloat(item.sugarTaxPrice || 0);

                // Check if this product already exists in the order
                const existingLine = existingProductMap[productId];
                console.log(`Item ${productId} existing line check:`, existingLine ? 'Found' : 'Not found', {
                    item_id: item.id,
                    product_id: productId,
                    existing_line_id: existingLine?.id,
                    existing_quantity: existingLine?.quantity
                });

                const totalQuantity = existingLine ? parseInt(existingLine.quantity || 0) + newQuantity : newQuantity;
                const baseAmount = unitPrice * totalQuantity;
                const vatAmount = (baseAmount * vatPercentage) / 100;
                //const sugarTaxAmount = (baseAmount * sugarTaxPrice) / 100;
                const netAmount = baseAmount + vatAmount; if (existingLine) {
                    // Update existing line with new quantity and recalculated net amount
                    const patchPayload = {
                        quantity: totalQuantity,
                        net_amount: netAmount.toFixed(2) // Ensure proper format with 2 decimal places
                    };

                    console.log(`Updating existing line for orderId ${orderId} and productId ${productId}:`, {
                        payload: patchPayload,
                        existingLine: {
                            id: existingLine.id,
                            product_id: productId,
                            old_quantity: existingLine.quantity,
                            old_net_amount: existingLine.net_amount
                        }
                    });

                    try {
                        // Using the new API endpoint that updates by orderId and productId
                        const patchResponse = await fetch(`${API_BASE_URL}/sales-order-lines/${orderId}/${productId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(patchPayload),
                            credentials: 'include',
                        });

                        if (!patchResponse.ok) {
                            const errorText = await patchResponse.text();
                            console.error(`Failed to update line for orderId ${orderId} and productId ${productId}: ${errorText}`);
                            throw new Error(errorText);
                        } else {
                            const updatedLine = await patchResponse.json();
                            console.log(`Successfully updated line for orderId ${orderId} and productId ${productId}:`, updatedLine);
                        }
                    } catch (error) {
                        console.error(`Error updating line for orderId ${orderId} and productId ${productId}:`, error);
                        // Continue with the process - don't let one line failure stop the entire order
                    }
                } else {
                    // Create a new line for this product
                    const productName = item.productName || item.name || 'Product';
                    const productNameLc = item.productNameLc || item.nameLc || productName; // Use localized name if available
                    const newLinePayload = {
                        order_id: orderId,
                        product_id: productId,
                        productName: productName,
                        productNameLc: productNameLc,
                        quantity: newQuantity,
                        unit: item.unit || 'EA', // Default to EA if unit is not provided
                        unit_price: unitPrice,
                        vat_percentage: vatPercentage || 0,
                        //sugar_tax_price: sugarTaxPrice || 0,
                        net_amount: netAmount.toFixed(2), // Ensure proper format with 2 decimal places
                        erp_line_number: item.erp_line_number || 1,
                        erp_prod_id: item.erpProdId || item.erp_prod_id || item.productCode || productId
                    };

                    console.log(`Creating new line for product ${productId}:`, {
                        payload: newLinePayload,
                        original_item: {
                            id: item.id,
                            product_id: item.product_id,
                            productId: item.productId,
                            name: item.name || item.productName,
                            productNameLc: productNameLc
                        }
                    }); try {
                        const createResponse = await fetch(`${API_BASE_URL}/sales-order-lines`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newLinePayload),
                            credentials: 'include',
                        });

                        if (!createResponse.ok) {
                            const errorText = await createResponse.text();
                            console.error(`Failed to create line for product ${productId}: ${errorText}`);
                            throw new Error(errorText);
                        } else {
                            const newLine = await createResponse.json();
                            console.log(`Successfully created line for product ${productId}:`, newLine);
                            // Add the newly created line to our existingProductMap
                            if (newLine.data && newLine.data.product_id) {
                                existingProductMap[newLine.data.product_id] = newLine.data;
                            }
                        }
                    } catch (error) {
                        console.error(`Error creating line for product ${productId}:`, error);
                        // Continue with the process - don't let one line failure stop the entire order
                    }
                }
            }            // Recalculate totalAmount after line inserts/updates
            const recalcLinesResponse = await fetch(`${API_BASE_URL}/sales-order-lines/pagination?filters=${encodeURIComponent(JSON.stringify({ orderId: orderId }))}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!recalcLinesResponse.ok) {
                throw new Error('Failed to fetch order lines for recalculating total amount');
            }

            const recalcLinesData = await recalcLinesResponse.json();
            console.log('Fetched order lines data for orderId ' + orderId + ':', recalcLinesData);

            // Verify we have the correct lines for this order
            const allLines = recalcLinesData?.data?.data?.filter(line => line.orderId === orderId) || [];
            console.log(`All order lines for orderId ${orderId}:`, allLines);

            // Calculate the sum of all order line net amounts - ensure we parse all values correctly
            let linesTotal = 0;
            for (const line of allLines) {
                const netAmount = parseFloat(line.netAmount);
                console.log(`Line for product ${line.productId}: net_amount=${line.netAmount}, parsed=${netAmount}`);
                linesTotal += netAmount;
            }

            console.log('Recalculated lines total:', linesTotal);

            // Get existing delivery charges if updating an order
            let currentDeliveryCharges = existingOrderData ? parseFloat(existingOrderData.deliveryCharges || 0) : 0;        // Calculate delivery charges based on recalculated line totals
            let deliveryCharges = 0.00;
            const isVmcoMachine = categoryName.toLowerCase().includes('vmco') && categoryName.toLowerCase().includes('machine');            // Updated delivery charges logic according to requirements
            if (isDeliveryChargesApplicable) {
                // For VMCO Machines: always set deliveryCharges to 0.00 (already set to 0.00 by default)

                // For VMCO Consumables, Diyafa, Naqui, or Green Mast: set deliveryCharges to 20.00 if total <= 150, otherwise 0.00
                if (!isVmcoMachine && linesTotal <= 150) {
                    deliveryCharges = 20.00;
                }
            } else if (existingOrderData) {
                // Keep existing delivery charges if they exist and we don't need to add new ones
                deliveryCharges = currentDeliveryCharges;
            }

            console.log('Delivery Charges calculated:', deliveryCharges);

            // Calculate final total amount (lines total + delivery charges)
            const finalTotalAmount = linesTotal + deliveryCharges;
            console.log('Final order totals:', {
                linesTotal,
                deliveryCharges,
                finalTotalAmount,
                details: {
                    isVmcoMachine,
                    isDeliveryChargesApplicable,
                    categoryName
                }
            });

            // Update the order with final calculated amounts
            const updateOrderPayload = {
                id: orderId,
                paymentMethod: selectedPaymentMethod,
                totalAmount: finalTotalAmount.toFixed(2),
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
            } const updatedOrderResponse = await updateOrderResponse.json();
            console.log('Updated the order:', updatedOrderResponse);

            // Show order confirmation alert with order number
            alert(t(`Order placed successfully! Order #${orderId}`));

            // Delete cart items
            try {
                const deleteUrl = new URL(`${API_BASE_URL}/cart/delete`);
                deleteUrl.searchParams.append('customer_id', selectedCustomerId);
                deleteUrl.searchParams.append('branch_id', selectedBranchId);
                // For VMCO entity, include both entity and category; for others, only entity
                if (entity && entity.toLowerCase() === 'vmco') {
                    deleteUrl.searchParams.append('entity', 'vmco');
                    deleteUrl.searchParams.append('category', categoryName);
                } else {
                    deleteUrl.searchParams.append('entity', entity);
                    // Do NOT include category for non-vmco entities
                }

                const deleteResponse = await fetch(deleteUrl, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });

                if (!deleteResponse.ok) {
                    console.error(`Error removing cart items: ${deleteResponse.statusText}`);
                }
                // After deleting cart items, reload the page
                window.location.reload();
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

    // Initialize from navigation state if available
    useEffect(() => {
        const navState = location.state || {};
        if (navState.selectedCustomerId) setSelectedCustomerId(navState.selectedCustomerId);
        if (navState.selectedBranchId) setSelectedBranchId(navState.selectedBranchId);
        if (navState.selectedBranchName) setSelectedBranchName(navState.selectedBranchName);
        if (navState.selectedBranchErpId) setSelectedBranchErpId(navState.selectedBranchErpId);
        if (navState.selectedBranchRegion) setSelectedBranchRegion(navState.selectedBranchRegion);
    }, [location.state]);

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
                                    <span className="category-count">{category.items.length} {t("Items")}</span>
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
                                                        <p className="delivery-date">{t("Delivery By")} {item.delivery}</p>                                                        <QuantityController
                                                            itemId={item.id}
                                                            quantity={Number(quantities[item.id] || item.quantity || 1)}
                                                            onQuantityChange={handleQuantityChange}
                                                            onInputChange={(itemId, value) => {
                                                                // Find the item to get its MOQ
                                                                const item = cartItems.flatMap(category => category.items).find(item => item.id === itemId);
                                                                const moq = item ? Number(item.moq) || 1 : 1;

                                                                // Ensure value is treated as a number, not a string
                                                                const numValue = value === '' ? moq : Number(value);

                                                                // Ensure we don't go below MOQ
                                                                setQuantities(prev => ({
                                                                    ...prev,
                                                                    [itemId]: Math.max(moq, numValue)
                                                                }));
                                                            }}
                                                            moq={item.moq ? Number(item.moq) : 1}
                                                            minQuantity={item.moq ? Number(item.moq) : 1}
                                                        />
                                                    </div>
                                                    <div className="item-price-panel">                                                        <span className="item-price">
                                                        {(Number(item.price) * Number(quantities[item.id] || item.quantity || 1)).toFixed(2)}
                                                        <span className="sar-label"> {t("SAR")}</span>
                                                    </span>

                                                        <span className="tax-row">{t("VAT: ")}{Number(item.vatPercentage)}%</span>
                                                        <span className="item-total-price">
                                                            {t("Net Amount:")} {(Number(item.price) * Number(quantities[item.id] || item.quantity || 1) +
                                                                (((Number(item.price) * Number(quantities[item.id] || item.quantity || 1)) / 100) * Number(item.vatPercentage))).toFixed(2)} {t("SAR")}
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
                                     
                                        {(category.category === 'VMCO Machines'|| category.category === "آلات VMCO") && category.items.length > 0 && (
                                            <div className="partial-payment-row">
                                                <span className="partial-payment-warning">{t("Min. 30% Partial Payment required")}</span>
                                            </div>
                                        )}
                                        {category.items.length > 0 && (
                                            <div className="checkout-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span className="checkout-info" style={{ margin: '10px', fontWeight: 'bold' }}>
                                                    {t('Total for this category')}:
                                                    {(() => {
                                                        // Calculate total for category including VAT and sugar tax
                                                        let categoryTotal = 0; category.items.forEach(item => {
                                                            const quantity = Number(quantities[item.id] || item.quantity || 1);
                                                            const unitPrice = parseFloat(item.price) || 0;
                                                            const vatPercentage = parseFloat(item.vatPercentage) || 0;
                                                            //const sugarTaxPrice = parseFloat(item.sugarTaxPrice) || 0;

                                                            const baseAmount = unitPrice * quantity;
                                                            const vatAmount = (baseAmount * vatPercentage) / 100;
                                                            //const sugarTaxAmount = sugarTaxPrice ? (baseAmount * sugarTaxPrice) / 100 : 0;

                                                            const totalAmount = baseAmount + vatAmount; // + sugarTaxAmount
                                                            categoryTotal += totalAmount;
                                                        });
                                                        return (
                                                            <strong> {categoryTotal.toFixed(2)} <span className="sar-label" style={{ margin: '5px' }}>{t("SAR")}</span></strong>
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
                {isV('continueShoppingButton') && isE('continueShoppingButton') && (<button className="continue-shopping" onClick={handleContinueShopping}>
                    {t('Continue Shopping')}
                </button>)}
            </div>

            <GetPaymentMethods
                open={showPaymentPopup}
                onClose={() => setShowPaymentPopup(false)}
                onSelectPaymentMethod={handleSelectPaymentMethod}
                API_BASE_URL={API_BASE_URL}
                t={t}
                category={pendingOrderCategory}
                customerId={selectedCustomerId}
                totalAmount={(() => {
                    // Calculate totalAmount for the pending order category
                    if (!pendingOrderCategory || !pendingOrderItems || pendingOrderItems.length === 0) return 0;
                    let sum = 0;
                    pendingOrderItems.forEach(item => {
                        const qty = Number(quantities[item.id] || item.quantity || 1);
                        const price = Number(item.price || item.unitPrice || 0);
                        const vat = Number(item.vatPercentage || 0);
                        const base = price * qty;
                        const vatAmount = (base * vat) / 100;
                        sum += base + vatAmount;
                    });
                    return sum;
                })()}
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