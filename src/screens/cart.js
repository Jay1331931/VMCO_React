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
import Swal from 'sweetalert2';
import Constants from '../constants';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Simple helper function that doesn't depend on component state
const getEntityFromCategory = (categoryName) => {
    // Check if categoryName is null or undefined
    if (!categoryName) {
        return null;
    }

    // Just use the fallback logic which doesn't require cartItems
    const category = categoryName.toLowerCase();

    // Direct mapping from section to entity
    if (category.includes(Constants.ENTITY.VMCO.toLowerCase()) ||
        category.includes('vending machine company')) {
        return Constants.ENTITY.VMCO;
    } else if (category.includes(Constants.ENTITY.SHC.toLowerCase()) ||
        category.includes('saudi hospitality company')) {
        return Constants.ENTITY.SHC;
    } else if (category.includes(Constants.ENTITY.GMTC.toLowerCase()) ||
        category.includes('green mast factory ltd')) {
        return Constants.ENTITY.GMTC;
    } else if (category.includes(Constants.ENTITY.NAQI.toLowerCase()) ||
        category.includes('naqi company')) {
        return Constants.ENTITY.NAQI;
    } else if (category.includes(Constants.ENTITY.DAR.toLowerCase()) ||
        category.includes('dar company')) {
        return Constants.ENTITY.DAR;
    }

    // If no match is found, return null or a default entity
    return null;
};

function Cart() {
    const location = useLocation();
    const { t, i18n } = useTranslation(); // Get i18n at component level
    const navigate = useNavigate();
    const [collapsedCategories, setCollapsedCategories] = useState(new Set());
    const [quantities, setQuantities] = useState({}); const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedCustomerStatus, setSelectedCustomerStatus] = useState('');
    const [selectederpCustId, setSelectederpCustId] = useState('');
    const [selectedBranchName, setSelectedBranchName] = useState('No location selected');
    const [selectedBranchNameLc, setSelectedBranchNameLc] = useState('');
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [selectedBranchErpId, setSelectedBranchErpId] = useState('');
    const [selectedBranchRegion, setSelectedBranchRegion] = useState('');
    const [selectedBranchCity, setSelectedBranchCity] = useState('');
    const [selectedBranchStatus, setSelectedBranchStatus] = useState('');
    const [showPaymentPopup, setShowPaymentPopup] = useState(false);
    const [pendingOrderCategory, setPendingOrderCategory] = useState(null);
    const [entityDescriptions, setEntityDescriptions] = useState({});
    const [pendingOrderItems, setPendingOrderItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false); const [error, setError] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [filteredCartItems, setFilteredCartItems] = useState([]);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const { token, user, logout, loading } = useAuth();
    console.log('User data:', user);

    // Use location.state to initialize userId, customerId, branchId if present
    useEffect(() => {
        if (location.state) {
            if (location.state.selectedUserId) setSelectedUserId(location.state.selectedUserId);
            else if (user?.userId) setSelectedUserId(user.userId);
            if (location.state.selectedCustomerId) setSelectedCustomerId(location.state.selectedCustomerId);
            else if (user?.customerId) setSelectedCustomerId(user.customerId);
            if (location.state.selectedBranchId) setSelectedBranchId(location.state.selectedBranchId);
            if (location.state.selectedBranchName) setSelectedBranchName(location.state.selectedBranchName);
            if (location.state.selectedBranchNameLc) setSelectedBranchNameLc(location.state.selectedBranchNameLc);
            if (location.state.selectedBranchErpId) setSelectedBranchErpId(location.state.selectedBranchErpId);
            if (location.state.selectedBranchRegion) setSelectedBranchRegion(location.state.selectedBranchRegion);
            if (location.state.selectedBranchCity) setSelectedBranchCity(location.state.selectedBranchCity);
        } else {
            if (user?.userId) setSelectedUserId(user.userId);
            if (user?.customerId) setSelectedCustomerId(user.customerId);
        }
    }, [location.state, user]);

    // Use the selectedUserId, selectedCustomerId, selectedBranchId for fetching cart items
    const userId = selectedUserId || user?.userId;
    const customerId = selectedCustomerId || user?.customerId;
    const erpCustId = user?.erpCustomerId;

    // Get current language
    const currentLanguage = i18n.language;
    const isArabic = currentLanguage.startsWith('ar');

    // Fetch cart items from the backend using fetch API
    const fetchCartItems = React.useCallback(async () => {
        // Don't fetch if we don't have the required user data
        if (!userId || !customerId || !selectedBranchId) {
            console.log('Missing required user data for cart fetch:', {
                userId,
                customerId,
                selectedBranchId,
                userObject: user
            });
            return;
        }

        console.log('Starting cart fetch with data:', { userId, customerId, selectedBranchId });

        setIsLoading(true);
        setError(null);

        try {
            // Set up parameters for pagination
            const params = new URLSearchParams({
                sortBy: 'id',
                sortOrder: 'asc'
            });

            // Create a single filters object with all required fields - use actual user data
            const filters = {
                user_id: userId,
                customer_id: customerId,
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

            // Declare category arrays before use
            const vmco = [];
            const shc = [];
            const gmtc = [];
            const naqi = [];
            const dar = [];

            // ...existing code...
            const cartProducts = Array.isArray(result.data.data) ? result.data.data :
                (result.data && Array.isArray(result.data)) ? result.data : [];

            console.log('Extracted cart products:', cartProducts.length, 'items');

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

                // Add isMachine flag to formattedItem
                formattedItem.isMachine = isMachine;

                // Add isFresh flag to formattedItem (preserve from original product data)
                formattedItem.isFresh = product.isFresh === true;                // Categorize based on entity and product type
                if (entity === Constants.ENTITY.VMCO.toLowerCase()) {
                    vmco.push(formattedItem);
                } else if (entity === Constants.ENTITY.SHC.toLowerCase()) {
                    shc.push(formattedItem);
                } else if (entity === Constants.ENTITY.GMTC.toLowerCase()) {
                    gmtc.push(formattedItem);
                } else if (entity === Constants.ENTITY.NAQI.toLowerCase()) {
                    naqi.push(formattedItem);
                } else if (entity === Constants.ENTITY.DAR.toLowerCase()) {
                    dar.push(formattedItem);
                } else {
                    // If entity is not specified, try to determine by category
                    const category = (product.category || '').toLowerCase();
                    if (category.includes(Constants.ENTITY.SHC.toLowerCase())) {
                        shc.push(formattedItem);
                    }
                    else if (category.includes(Constants.ENTITY.GMTC.toLowerCase())) {
                        gmtc.push(formattedItem);
                    }
                    else if (category.includes(Constants.ENTITY.NAQI.toLowerCase())) {
                        naqi.push(formattedItem);
                    }
                    else if (category.includes(Constants.ENTITY.DAR.toLowerCase())) {
                        dar.push(formattedItem);
                    }
                    else {
                        // Default to VMCO if we can't determine category
                        vmco.push(formattedItem);
                    }
                }
            });            // Update the cart items with the categorized data
            setCartItems([
                { category: 'Vending Machine Company', items: vmco },
                { category: 'Saudi Hospitality Company', items: shc },
                { category: 'Green Mast Factory Ltd', items: gmtc },
                { category: 'Naqi Company', items: naqi },
                { category: 'DAR Company', items: dar }
            ]);

            // Initialize quantities from fetched data
            setQuantities(initialQuantities);

            console.log('Cart items successfully loaded:', {
                vmco: vmco.length,
                shc: shc.length,
                gmtc: gmtc.length,
                naqi: naqi.length,
                dar: dar.length
            });

        } catch (err) {
            console.error('Error fetching cart items:', err);
            setError('Failed to load cart items. Please try again.');

            // Don't clear existing cart items if there's an error
            // This prevents the cart from being cleared due to temporary network issues
        } finally {
            setIsLoading(false);
        }
    }, [userId, customerId, selectedBranchId, token, t, currentLanguage, isArabic]);

    useEffect(() => {
        if (loading) return;
        if (!user) {
            logout();
            navigate('/login');
            return;
        }
        // Only fetch cart items if we have user data and required IDs
        if (user && user.userType && userId && customerId && selectedBranchId) {
            fetchCartItems();
        }
    }, [user, loading, logout, navigate, fetchCartItems, userId, customerId, selectedBranchId]);


    //Rbac and other access based on user object to follow below lik this
    const rbacMgr = new RbacManager(user?.userType === 'employee' && user?.roles[0] !== 'admin' ? user?.designation : user?.roles[0], 'cart');
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
            Swal.fire({
                icon: 'info',
                title: t('Processing Order'),
                text: t('An order is being processed. Please wait.'),
                showConfirmButton: false,
                timer: 2000
            });
            // alert(t('An order is being processed. Please wait.'));
            return;
        }

        try {
            setIsPlacingOrder(true); // Use the same state to prevent multiple actions

            // Build the URL for the delete request with correct query params
            const deleteUrl = new URL(`${API_BASE_URL}/cart/delete`);
            deleteUrl.searchParams.append('customer_id', customerId);
            if (selectedBranchId) {
                deleteUrl.searchParams.append('branch_id', selectedBranchId);
            }
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
            Swal.fire({
                icon: 'success',
                title: t('Item Removed'),
                text: t('The item has been successfully removed from your cart.'),
                confirmButtonText: t('OK')
            });

        } catch (err) {
            console.error('Error removing item:', err);
            Swal.fire({
                icon: 'error',
                title: t('Error'),
                text: t(`Failed to remove item: ${err.message}`),
                confirmButtonText: t('OK')
            });
            // alert(t(`Failed to remove item: ${err.message}`));
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
        navigate('/catalog', {
            state: {
                selectedBranchId,
                selectedBranchName,
                selectedBranchNameLc,
                selectedBranchErpId,
                selectedBranchRegion,
                selectedBranchCity,
                selectedCustomerId
            }
        });
    };

    const handleSelectPaymentMethod = async (method) => {
        setShowPaymentPopup(false);

        // If payment method is Cash on Delivery, check for existing COD orders and limits
        if (method.toLowerCase() === 'cash on delivery') {
            try {
                // Calculate current order total amount
                let currentOrderTotal = 0;
                pendingOrderItems.forEach(item => {
                    const baseAmount = Number(item.price) * Number(quantities[item.id] || item.quantity || 1);
                    const vatPercentage = Number(item.vatPercentage) || 0;
                    const vatAmount = (baseAmount * vatPercentage) / 100;
                    currentOrderTotal += baseAmount + vatAmount;
                });

                // Check for existing open COD orders
                const orderFilters = new URLSearchParams({
                    filters: JSON.stringify({
                        customerId: selectedCustomerId,
                        status: 'Open',
                        paymentMethod: 'Cash on Delivery'
                    })
                });

                const existingOrdersResponse = await fetch(`${API_BASE_URL}/sales-order/pagination?${orderFilters}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });

                if (!existingOrdersResponse.ok) {
                    throw new Error('Failed to fetch existing COD orders');
                }

                const existingOrdersResult = await existingOrdersResponse.json();
                
                // Calculate total amount of existing COD orders
                let existingCODTotal = 0;
                if (existingOrdersResult.data?.data) {
                    existingOrdersResult.data.data.forEach(order => {
                        existingCODTotal += Number(order.totalAmount) || 0;
                    });
                }

                // Get customer's COD limit
                const customerResponse = await fetch(`${API_BASE_URL}/payment-method-balances/id/${selectedCustomerId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });

                if (!customerResponse.ok) {
                    throw new Error('Failed to fetch customer COD limit');
                }

                const customerData = await customerResponse.json();
                console.log('Customer COD limit data:', customerData);
                const codLimit = Number(customerData?.data?.methodDetails?.COD?.limit) || 0;

                // Compare total with COD limit
                if (existingCODTotal + currentOrderTotal >= codLimit) {
                    console.log(`COD limit reached: existing=${existingCODTotal}, Sum=${existingCODTotal + currentOrderTotal}, current=${currentOrderTotal}, limit=${codLimit}`);
                    Swal.fire({
                        icon: 'warning',
                        title: t('COD Limit Reached'),
                        text: t('The COD Limit has been reached. Please choose a different payment method.'),
                        confirmButtonText: t('OK')
                    });
                    return;
                }
            } catch (error) {
                console.error('Error checking COD limits:', error);
                Swal.fire({
                    icon: 'error',
                    title: t('Error'),
                    text: t('Failed to verify COD limits. Please try again.'),
                    confirmButtonText: t('OK')
                });
    
                return;
            }
            console.log('COD limit check passed. continuing with order placement.');
        }

        // Proceed with order placement if COD limit check passes or if it's not COD
        const entity = getEntityFromCategory(pendingOrderCategory);
        if (entity && entity.toLowerCase() === Constants.ENTITY.SHC.toLowerCase()) {
            handleSHCOrderSplitting(pendingOrderItems, pendingOrderCategory, method);
        } else {
            // For NAQI, GMTC, DAR - directly place order with selected payment method
            placeOrderForCategory(pendingOrderItems, pendingOrderCategory, method, true);
        }
    };

    // Handle SHC order splitting into fresh and non-fresh products
    const handleSHCOrderSplitting = async (categoryItems, categoryName, selectedPaymentMethod) => {
        try {
            setIsPlacingOrder(true);
            const entity = getEntityFromCategory(categoryName);

            // Separate SHC products into fresh and non-fresh products
            const freshProducts = categoryItems.filter(item => {
                const isFresh = item.isFresh === true;
                console.log(`Product ${item.name} (${item.product_id}): isFresh=${isFresh}`);
                return isFresh;
            });
            const nonFreshProducts = categoryItems.filter(item => {
                const isFresh = item.isFresh === true;
                console.log(`Product ${item.name} (${item.product_id}): isFresh=${isFresh}, isNonFresh=${!isFresh}`);
                return !isFresh;
            });

            console.log('SHC products separated:', {
                total: categoryItems.length,
                fresh: freshProducts.length,
                nonFresh: nonFreshProducts.length,
                freshProductIds: freshProducts.map(p => p.product_id),
                nonFreshProductIds: nonFreshProducts.map(p => p.product_id)
            });

            const orderIds = [];

            // Place order for fresh products
            if (freshProducts.length > 0) {
                console.log('Placing order for SHC fresh products with selected payment method:', selectedPaymentMethod);
                // Use a specific category name for fresh products to ensure separate orders
                const freshOrderId = await placeOrderForCategory(freshProducts, categoryName + ' - Fresh', selectedPaymentMethod, false, true);
                console.log('Fresh order result:', freshOrderId);
                if (freshOrderId) {
                    orderIds.push(freshOrderId);
                    console.log('Added fresh order ID to array:', freshOrderId);
                    // Delete fresh products from cart after successful order
                    await deleteCartItems(selectedCustomerId, selectedBranchId, entity, true, null, freshProducts);
                    console.log('Deleted fresh products from cart after order:', freshProducts);
                } else {
                    console.error('Fresh order failed - no order ID returned');
                }
            }

            // Place order for non-fresh products
            if (nonFreshProducts.length > 0) {
                console.log('Placing order for SHC non-fresh products with selected payment method:', selectedPaymentMethod);
                // Use a specific category name for non-fresh products to ensure separate orders
                const nonFreshOrderId = await placeOrderForCategory(nonFreshProducts, categoryName + ' - Non-Fresh', selectedPaymentMethod, false, false);
                console.log('Non-fresh order result:', nonFreshOrderId);
                if (nonFreshOrderId) {
                    orderIds.push(nonFreshOrderId);
                    console.log('Added non-fresh order ID to array:', nonFreshOrderId);
                    // Delete non-fresh products from cart after successful order
                    await deleteCartItems(selectedCustomerId, selectedBranchId, entity, false, null, nonFreshProducts);
                    console.log('Deleted non-fresh products from cart after order:', nonFreshProducts);
                } else {
                    console.error('Non-fresh order failed - no order ID returned');
                }
            }

            // Show combined success message for SHC orders
            if (orderIds.length > 0) {
                console.log('Order IDs collected:', orderIds);
                const orderText = orderIds.length === 1
                    ? t(`Your order has been placed successfully! Order #${orderIds[0]}`)
                    : t(`Your orders have been placed successfully! Orders: ${orderIds.map(id => `#${id}`).join(' and ')}`);

                console.log('Order success message:', orderText);

                Swal.fire({
                    icon: 'success',
                    title: t('Order Placed'),
                    text: orderText,
                    confirmButtonText: t('OK')
                }).then(() => {
                    setCartItems(prevCartItems =>
                        prevCartItems.map(category => ({
                            ...category,
                            items: category.items.filter(
                                cartItem => !categoryItems.some(ci => ci.id === cartItem.id))
                        })));

                    // Clean up quantities state for removed items
                    setQuantities(prevQuantities => {
                        const newQuantities = { ...prevQuantities };
                        categoryItems.forEach(item => {
                            delete newQuantities[item.id];
                        });
                        return newQuantities;
                    });
                });
           if (entity.toLowerCase() === Constants.ENTITY?.SHC?.toLowerCase() && selectedPaymentMethod?.toLowerCase()==="pre payment") {
            try {
                const { data } = await axios.post(
                `${API_BASE_URL}/generatePayment-link`,
                {
                    id: orderIds?.map(String).join(','),
                    endPoint: "payment-opations/order",
                    IsEmail: false,
                },
                { withCredentials: true }
                );

                        if (data?.details?.url) {
                            window.open(data.details.url, '_blank', 'width=500,height=600');
                        } else {
                            console.error("Payment URL not found in response:", data);
                        }
                    } catch (error) {
                        console.error("Error generating payment link:", error);
                    }
                }
            }



        } catch (err) {
            console.error('Error in SHC order splitting:', err);
            setError(err.message);
            Swal.fire({
                icon: 'error',
                title: t('Order Failed'),
                text: t(`Failed to place order: ${err.message}`),
                confirmButtonText: t('OK')
            });
        } finally {
            setIsPlacingOrder(false);
        }
    };

    // Handle place order button click
    const handlePlaceOrder = async (categoryItems, categoryName, selectedPaymentMethod) => {

        if (categoryItems.length === 0) {
            Swal.fire({
                icon: 'info',
                title: t('No Items'),
                text: t('No items in this category to order.'),
                confirmButtonText: t('OK')
            });
            return;
        }

        // Check customer and branch status before placing order
        if ((selectedCustomerStatus || '').toLowerCase() !== 'approved') {
            Swal.fire({
                icon: 'warning',
                title: t('Order Blocked'),
                text: t('The Customer is not approved to place order.'),
                confirmButtonText: t('OK')
            });
            return;
        }
        if ((selectedBranchStatus || '').toLowerCase() !== 'approved') {
            Swal.fire({
                icon: 'warning',
                title: t('Order Blocked'),
                text: t('The branch is not approved to place order.'),
                confirmButtonText: t('OK')
            });
            return;
        }

        if (isPlacingOrder) {
            Swal.fire({
                icon: 'info',
                title: t('Processing Order'),
                text: t('An order is already being processed. Please wait.'),
                showConfirmButton: false,
                timer: 2000
            });
            return;
        }

        setIsPlacingOrder(true);
        setError(null);

        try {
            // Check if this is a VMCO category and handle special logic
            const entity = getEntityFromCategory(categoryName);
            if (entity && entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()) {
                // Separate VMCO products into machines and consumables
                const machineProducts = categoryItems.filter(item => item.isMachine === true);
                const nonMachineProducts = categoryItems.filter(item => !item.isMachine);

                console.log('VMCO products separated:', {
                    total: categoryItems.length,
                    machines: machineProducts.length,
                    consumables: nonMachineProducts.length,
                    machineProductIds: machineProducts.map(p => p.product_id),
                    nonMachineProductIds: nonMachineProducts.map(p => p.product_id)
                });

                const orderIds = [];

                // First, place order for machines with Pre Payment
                if (machineProducts.length > 0) {
                    console.log('Placing order for VMCO machines with Pre Payment');
                    const machineOrderId = await placeOrderForCategory(machineProducts, categoryName + ' - Machines', 'Pre Payment', false);
                    console.log('Machine order result:', machineOrderId);
                    if (machineOrderId) {
                        orderIds.push(machineOrderId);
                        await deleteCartItems(selectedCustomerId, selectedBranchId, entity, null, true, machineProducts);
                    }
                }

                // Then, place order for non-machine products with payment method logic like GMTC, SHC, DAR
                if (nonMachineProducts.length > 0) {
                    // Calculate total amount for non-machine products
                    let nonMachineTotal = 0;
                    nonMachineProducts.forEach(item => {
                        const baseAmount = Number(item.price) * Number(quantities[item.id] || item.quantity || 1);
                        const vatPercentage = Number(item.vatPercentage) || 0;
                        const vatAmount = (baseAmount * vatPercentage) / 100;
                        const totalAmount = baseAmount + vatAmount;
                        nonMachineTotal += totalAmount;
                    });

                    // Use the same payment method determination as GMTC, SHC, DAR
                    const paymentMethod = await determinePaymentMethodForNonMachines(selectedCustomerId, nonMachineTotal, entity);

                    // If payment method determination returned null (insufficient balance), cancel the order
                    if (paymentMethod === null) {
                        console.log('Payment method determination cancelled due to insufficient balance');
                        return; // Exit the function early
                    }

                    if (paymentMethod === 'Pre Payment') {
                        // Directly place order with Pre Payment, do not show popup
                        console.log(`Credit not allowed or COD limit exceeded, placing order directly with Pre Payment for VMCO entity`);
                        const orderId = await placeOrderForCategory(nonMachineProducts, categoryName + ' - Consumables', 'Pre Payment', false);
                        if (orderId) {
                            orderIds.push(orderId);
                            await deleteCartItems(selectedCustomerId, selectedBranchId, entity, null, false, nonMachineProducts);
                        }
                    } else if (paymentMethod && paymentMethod !== 'Cash on Delivery') {
                        console.log(`Using determined payment method ${paymentMethod} for VMCO entity`);
                        const orderId = await placeOrderForCategory(nonMachineProducts, categoryName + ' - Consumables', paymentMethod, false);
                        if (orderId) {
                            orderIds.push(orderId);
                            await deleteCartItems(selectedCustomerId, selectedBranchId, entity, null, false, nonMachineProducts);
                        }
                    } else {
                        // For COD or when payment method needs user selection, show popup
                        console.log(`Showing payment method selection for VMCO entity`);
                        setPendingOrderCategory(categoryName + ' - Consumables');
                        setPendingOrderItems(nonMachineProducts);
                        setShowPaymentPopup(true);
                        return;
                    }
                }

                // Show combined success message for VMCO orders
                if (orderIds.length > 0 || (nonMachineProducts.length > 0 && !machineProducts.length)) {
                    const orderText = orderIds.length === 1
                        ? t(`Your order has been placed successfully! Order #${orderIds[0]}`)
                        : orderIds.length > 1
                            ? t(`Your orders have been placed successfully! Orders: ${orderIds.map(id => `#${id}`).join(' and ')}`)
                            : t('Your order has been placed successfully!');

                    Swal.fire({
                        icon: 'success',
                        title: t('Order Placed'),
                        text: orderText,
                        confirmButtonText: t('OK')
                    }).then(() => {
                        // Update cart items state to remove ordered items
                        setCartItems(prevCartItems =>
                            prevCartItems.map(category => ({
                                ...category,
                                items: category.items.filter(
                                    cartItem => !categoryItems.some(ci => ci.id === cartItem.id))
                            })));

                        // Clear quantities for ordered items
                        setQuantities(prevQuantities => {
                            const newQuantities = { ...prevQuantities };
                            categoryItems.forEach(item => {
                                delete newQuantities[item.id];
                            });
                            return newQuantities;
                        });

                        // Force a refresh of cart items
                        fetchCartItems();
                    });
                }
            } else if (entity && entity.toLowerCase() === Constants.ENTITY.SHC.toLowerCase()) {
                // For SHC entity, handle fresh/non-fresh splitting with payment method determination
                // Calculate total amount for all products
                let totalAmount = 0;
                categoryItems.forEach(item => {
                    const baseAmount = Number(item.price) * Number(quantities[item.id] || item.quantity || 1);
                    const vatPercentage = Number(item.vatPercentage) || 0;
                    const vatAmount = (baseAmount * vatPercentage) / 100;
                    const itemTotal = baseAmount + vatAmount;
                    totalAmount += itemTotal;
                });

                // Determine payment method for SHC products
                const shcPaymentMethod = await determinePaymentMethodForSHC(selectedCustomerId, totalAmount, entity);

                // If payment method determination returned null (insufficient balance), cancel the order
                if (shcPaymentMethod === null) {
                    console.log('Payment method determination cancelled due to insufficient balance');
                    return; // Exit the function early
                }

                // If a specific payment method was determined, use it directly
                if (shcPaymentMethod && shcPaymentMethod !== 'Cash on Delivery') {
                    console.log(`Using determined payment method ${shcPaymentMethod} for SHC entity`);
                    await handleSHCOrderSplitting(categoryItems, categoryName, shcPaymentMethod);
                } else {
                    // For COD or when payment method needs user selection, show popup
                    console.log(`Showing payment method selection for SHC splitting`);
                    setPendingOrderCategory(categoryName);
                    setPendingOrderItems(categoryItems);
                    setShowPaymentPopup(true);
                    return; // Exit function to wait for user selection
                }
            } else if (entity && [Constants.ENTITY.NAQI.toLowerCase(), Constants.ENTITY.GMTC.toLowerCase(), Constants.ENTITY.DAR.toLowerCase()].includes(entity.toLowerCase())) {
                // Calculate total amount for all products
                let totalAmount = 0;
                categoryItems.forEach(item => {
                    const baseAmount = Number(item.price) * Number(quantities[item.id] || item.quantity || 1);
                    const vatPercentage = Number(item.vatPercentage) || 0;
                    const vatAmount = (baseAmount * vatPercentage) / 100;
                    const itemTotal = baseAmount + vatAmount;
                    totalAmount += itemTotal;
                });

                // Determine payment method for non-machine products
                const paymentMethod = await determinePaymentMethodForNonMachines(selectedCustomerId, totalAmount, entity);

                // If payment method determination returned null (insufficient balance), cancel the order
                if (paymentMethod === null) {
                    console.log('Payment method determination cancelled due to insufficient balance');
                    return; // Exit the function early
                }

                // If a specific payment method was determined, use it directly
                if (paymentMethod === 'Pre Payment') {
                    // Directly place order with Pre Payment, do not show popup
                    console.log(`Credit not allowed or COD limit exceeded, placing order directly with Pre Payment for ${entity} entity`);
                    await placeOrderForCategory(categoryItems, categoryName, 'Pre Payment', true);
                    return;
                } else if (paymentMethod && paymentMethod !== 'Cash on Delivery') {
                    console.log(`Using determined payment method ${paymentMethod} for ${entity} entity`);
                    await placeOrderForCategory(categoryItems, categoryName, paymentMethod, true);
                } else {
                    // For COD or when payment method needs user selection, show popup
                    console.log(`Showing payment method selection for ${entity} entity`);
                    setPendingOrderCategory(categoryName);
                    setPendingOrderItems(categoryItems);
                    setShowPaymentPopup(true);
                    return;
                }
            } else {
                // For other categories, place order as usual
                await placeOrderForCategory(categoryItems, categoryName, selectedPaymentMethod, true);
            }
        } catch (err) {
            setError(err.message);
            Swal.fire({
                icon: 'error',
                title: t('Order Failed'),
                text: t(`Failed to place order: ${err.message}`),
                confirmButtonText: t('OK')
            });
        } finally {
            setIsPlacingOrder(false);
        }
    };

    // Helper function to place order for a single category
    const placeOrderForCategory = async (categoryItems, categoryName, selectedPaymentMethod, showSuccessMessage = true, isFresh = false) => {
        // Copy the original handlePlaceOrder logic here, but add productCategory to orderPayload
        if (categoryItems.length === 0) {
            Swal.fire({
                icon: 'info',
                title: t('No Items'),
                text: t('No items in this category to order.'),
                confirmButtonText: t('OK')
            });
            // alert(t('No items in this category to order.'));
            return;
        }
        try {
            const entity = getEntityFromCategory(categoryName);
            console.log('Entity determination:', { categoryName, entity });

            // --- Fetch the user name using userId for orderBy field (same as orderDetails.js) ---
            let orderByName = '';
            const userId = user?.userId;
            if (userId) {
                try {
                    const usernameRes = await fetch(`${API_BASE_URL}/user/get-username-by-id/${userId}`, {
                        method: 'GET',
                        credentials: 'include',
                    });
                    if (usernameRes.ok) {
                        const contentType = usernameRes.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            const usernameResult = await usernameRes.json();
                            if (usernameResult && (usernameResult.userName || usernameResult.username)) {
                                orderByName = usernameResult.userName || usernameResult.username;
                            } else {
                                console.warn('Username API did not return userName field:', usernameResult);
                            }
                        }
                    } else {
                        console.error('Failed to fetch username: HTTP', usernameRes.status);
                    }
                } catch (error) {
                    console.error('Failed to fetch userName for orderBy:', error);
                }
            }

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
            const pricingPolicy = customerData?.data?.entity?.pricingPolicy;
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

            let orderId;
            let existingProductMap = {};
            let existingOrderData = null;

            // Check if payment method is "Pre Payment" - if so, always create a new order
            const isPrePayment = selectedPaymentMethod === 'Pre Payment';

            console.log(`placeOrderForCategory called with:`, {
                categoryName,
                selectedPaymentMethod,
                isPrePayment,
                entity,
                itemCount: categoryItems.length
            });

            if (!isPrePayment) {
                // Only check for existing orders if NOT using Pre Payment
                const orderFiltersObj = (entity && entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()) ||
                    (entity && entity.toLowerCase() === Constants.ENTITY.SHC.toLowerCase())
                    ? {
                        customerId: selectedCustomerId,
                        branchId: selectedBranchId,
                        entity,
                        selectedPaymentMethod: selectedPaymentMethod,
                        status: 'Open',
                        productCategory: categoryName,  // This ensures we only find orders with the exact same category
                        paymentMethod: selectedPaymentMethod
                    }
                    : {
                        customerId: selectedCustomerId,
                        branchId: selectedBranchId,
                        entity,
                        status: 'Open'
                    };

                console.log('Searching for existing orders with filters:', orderFiltersObj);

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
                console.log('Existing order search result:', existingOrderResult);

                if (existingOrderResult.data?.data?.length > 0) {
                    // For VMCO and SHC orders, ensure we match the exact productCategory
                    const matchingOrders = existingOrderResult.data.data.filter(order => {
                        if (entity && (entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase() ||
                            entity.toLowerCase() === Constants.ENTITY.SHC.toLowerCase())) {
                            console.log('Checking order:', {
                                orderId: order.id,
                                orderCategory: order.productCategory,
                                searchCategory: categoryName,
                                entity: entity,
                                match: order.productCategory === categoryName
                            });
                            return order.productCategory === categoryName;
                        }
                        return true; // For other entities, any matching order is fine
                    });

                    if (matchingOrders.length > 0) {
                        existingOrderData = matchingOrders[0];
                        orderId = existingOrderData.id;
                        console.log(`Found existing order: ${orderId} for category: ${categoryName}`);

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
                        console.log(`No existing order found with matching category: ${categoryName}`);
                    }
                }
            }

            // If we don't have an existing order ID (either because we're using Pre Payment or no existing order was found)
            // we need to create a new order
            if (!orderId) {
                // First calculate the initial totalAmount from cart items
                let initialTotalAmount = 0;
                for (const item of categoryItems) {
                    const newQuantity = Number(quantities[item.id] || item.quantity || item.moq || 1);
                    const unitPrice = parseFloat(item.unitPrice || item.price || 0);
                    const vatPercentage = parseFloat(item.vatPercentage || 0);

                    // Validate values to prevent NaN
                    if (isNaN(newQuantity) || isNaN(unitPrice) || isNaN(vatPercentage) || newQuantity <= 0 || unitPrice < 0) {
                        console.warn('Invalid values detected in order calculation:', {
                            itemId: item.id,
                            newQuantity,
                            unitPrice,
                            vatPercentage,
                            available_quantities: quantities[item.id],
                            item_quantity: item.quantity,
                            item_moq: item.moq,
                            item: item
                        });
                        continue; // Skip this item if values are invalid
                    }

                    const baseAmount = unitPrice * newQuantity;
                    const vatAmount = (baseAmount * vatPercentage) / 100;
                    const netAmount = baseAmount + vatAmount;

                    initialTotalAmount += netAmount;

                    console.log(`Item ${item.id} calculation:`, {
                        quantity: newQuantity,
                        unitPrice,
                        vatPercentage,
                        baseAmount,
                        vatAmount,
                        netAmount
                    });
                }

                // Validate initial total
                if (isNaN(initialTotalAmount) || initialTotalAmount < 0) {
                    console.error('Invalid initialTotalAmount calculated:', initialTotalAmount);
                    throw new Error(`Invalid initial total amount: ${initialTotalAmount}`);
                }

                console.log('Initial total amount calculated:', initialTotalAmount);

                let deliveryCharges = 0.00;
                const isVmcoMachine = categoryName.toLowerCase().includes('machines') || categoryName.toLowerCase().includes('آلات');
                if (isDeliveryChargesApplicable) {
                    if (!isVmcoMachine && initialTotalAmount <= 150) {
                        deliveryCharges = 20.00;
                    }
                }

                // Determine if this is a machine order or fresh order based on category name and entity
                const isMachineOrder = categoryName.toLowerCase().includes('machines') || categoryName.toLowerCase().includes('آلات');
                const isFreshOrder = categoryName.toLowerCase().includes('fresh') || categoryName.toLowerCase().includes('طازج');

                // Determine status based on entity and payment method (case-insensitive)
                let orderStatus = 'Open'; // Default status
                if (entity && entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()) {
                    orderStatus = 'Pending';
                } else if (entity && entity.toLowerCase() === Constants.ENTITY.SHC.toLowerCase()) {
                    orderStatus = 'Open';
                } else if (entity && entity.toLowerCase() === Constants.ENTITY.NAQI.toLowerCase()) {
                    // For Naqi entity, set status based on payment method
                    const pm = (selectedPaymentMethod || '').toLowerCase();
                    if (pm === 'credit' || pm === 'cash on delivery') {
                        orderStatus = 'Approved';
                    } else if (pm === 'pre payment') {
                        orderStatus = 'Pending';
                    }
                }

                const finalTotalAmount = initialTotalAmount + deliveryCharges;
                const orderPayload = {
                    customerId: selectedCustomerId,
                    erpCustId: erpCustId,
                    companyNameEn: companyNameEn,
                    companyNameAr: companyNameAr,
                    branchId: selectedBranchId,
                    branchNameEn: selectedBranchName,
                    branchNameLc: selectedBranchNameLc,
                    branchCity: selectedBranchCity,
                    erpBranchId: selectedBranchErpId,
                    branchRegion: selectedBranchRegion,
                    orderBy: orderByName,
                    entity,
                    paymentMethod: selectedPaymentMethod,
                    totalAmount: finalTotalAmount.toFixed(2),
                    paidAmount: '0.00',
                    deliveryCharges: deliveryCharges.toFixed(2),
                    paymentStatus: selectedPaymentMethod === 'Credit' ? 'Paid' : 'Pending',
                    status: orderStatus,
                    pricingPolicy: pricingPolicy,
                    salesExecutive: assignedTo,
                    customerRegion: customerRegion,
                    productCategory: categoryName,
                    paymentPercentage: '100.00',
                    isMachine: isMachineOrder,
                    isFresh: isFresh
                    //createdBy: userId // <-- Add createdBy field
                };

                // For VMCO Machines, set payment method to Pre Payment
                const isVmcoMachines = categoryName.toLowerCase().includes('machines') || categoryName.toLowerCase().includes('آلات');
                if (isVmcoMachines) {
                    orderPayload.paymentMethod = 'Pre Payment';
                    console.log('Override payment method to Pre Payment for VMCO machines:', categoryName);
                }

                console.log('Order payload:', orderPayload);
                console.log('Key differentiators:', {
                    productCategory: orderPayload.productCategory,
                    paymentMethod: orderPayload.paymentMethod,
                    status: orderPayload.status,
                    customerId: orderPayload.customerId,
                    branchId: orderPayload.branchId,
                    entity: orderPayload.entity,
                    isMachine: orderPayload.isMachine,
                    isFresh: orderPayload.isFresh
                });

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
                console.log(`Created new order with ID: ${orderId} for category: ${categoryName} with payment method: ${selectedPaymentMethod}`);
                console.log('Order creation response:', orderResult);
            }

            // Create or Update Order Lines
            let lineNumber = 1; // Initialize line number counter
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

                const newQuantity = parseInt(quantities[item.id] || item.quantity || item.moq || 1);
                const unitPrice = parseFloat(item.unitPrice || item.price || 0);
                const vatPercentage = parseFloat(item.vatPercentage || 0);

                // Validate order line values
                if (isNaN(newQuantity) || isNaN(unitPrice) || isNaN(vatPercentage) || newQuantity <= 0 || unitPrice < 0) {
                    console.error('Invalid order line values:', {
                        itemId: item.id,
                        productId,
                        newQuantity,
                        unitPrice,
                        vatPercentage,
                        available_quantities: quantities[item.id],
                        item_quantity: item.quantity,
                        item_moq: item.moq
                    });
                    continue; // Skip this item if values are invalid
                }

                // Check if this product already exists in the order (only if not using Pre Payment)
                const existingLine = isPrePayment ? null : existingProductMap[productId];

                console.log(`Item ${productId} existing line check:`, existingLine ? 'Found' : 'Not found', {
                    item_id: item.id,
                    product_id: productId,
                    existing_line_id: existingLine?.id,
                    existing_quantity: existingLine?.quantity,
                    isPrepayment: isPrePayment
                });

                const totalQuantity = existingLine ? parseInt(existingLine.quantity || 0) + newQuantity : newQuantity;
                const baseAmount = unitPrice * totalQuantity;
                const vatAmount = (baseAmount * vatPercentage) / 100;
                const netAmount = baseAmount + vatAmount;

                if (existingLine && !isPrePayment) {
                    // Update existing line with new quantity and recalculated net amount
                    const patchPayload = {
                        quantity: totalQuantity,
                        sales_tax_amount: vatAmount.toFixed(2),
                        net_amount: netAmount.toFixed(2),
                        line_number: lineNumber
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
                    const productNameLc = item.productNameLc || item.nameLc || productName;

                    // Determine isMachine and isFresh for this line based on the category and item
                    let lineMachine = false;
                    let lineFresh = false;

                    if (entity && entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()) {
                        lineMachine = item.isMachine === true;
                        lineFresh = false; // VMCO products don't have fresh flag
                    } else if (entity && entity.toLowerCase() === Constants.ENTITY.SHC.toLowerCase()) {
                        lineMachine = false; // SHC products are never machines
                        lineFresh = item.isFresh === true; // Use the item's isFresh flag
                    } else {
                        // For other entities, use the item's flags as-is
                        lineMachine = item.isMachine === true;
                        lineFresh = item.isFresh === true;
                    }

                    const newLinePayload = {
                        order_id: orderId,
                        product_id: productId,
                        productName: productName,
                        productNameLc: productNameLc,
                        is_machine: lineMachine,
                        isMachine: lineMachine, // for backend compatibility
                        isFresh: lineFresh, // set based on entity and item
                        quantity: newQuantity,
                        unit: item.unit || 'EA',
                        unit_price: unitPrice,
                        vat_percentage: vatPercentage || 0,
                        sales_tax_amount: vatAmount.toFixed(2),
                        net_amount: netAmount.toFixed(2),
                        line_number: lineNumber,
                        erp_line_number: item.erp_line_number || lineNumber,
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
                    });

                    try {
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
                        // Delete the sales order with orderId if line creation fails
                        try {
                            const deleteResponse = await fetch(`${API_BASE_URL}/sales-order/hard-delete/${orderId}`, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                            });
                            if (!deleteResponse.ok) {
                                console.error(`Failed to hard delete sales order ${orderId}:`, await deleteResponse.text());
                            } else {
                                console.log(`Successfully hard deleted sales order ${orderId} after line creation failure.`);
                            }
                        } catch (deleteError) {
                            console.error(`Error during hard delete of sales order ${orderId}:`, deleteError);
                        }
                        Swal.fire({
                            icon: 'error',
                            title: t('Order Failed'),
                            text: t('Creation of sales order failed.'),
                            confirmButtonText: t('OK')
                        });
                        return;
                    }
                }

                // Increment line number for next iteration
                lineNumber++;
            }

            // Small delay to ensure order lines are committed to the database
            await new Promise(resolve => setTimeout(resolve, 100));

            // Recalculate totalAmount after line inserts/updates
            // Try multiple approaches to fetch the correct order lines
            let recalcLinesResponse;
            let recalcLinesData;

            // First try with orderId filter
            try {
                recalcLinesResponse = await fetch(`${API_BASE_URL}/sales-order-lines/pagination?filters=${encodeURIComponent(JSON.stringify({ orderId: orderId }))}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });

                if (!recalcLinesResponse.ok) {
                    throw new Error('Failed to fetch order lines for recalculating total amount');
                }

                recalcLinesData = await recalcLinesResponse.json();
                console.log('Fetched order lines data for orderId ' + orderId + ':', recalcLinesData);
            } catch (error) {
                console.error('Error fetching order lines with orderId filter:', error);
                // Fallback: try with order_id filter
                try {
                    recalcLinesResponse = await fetch(`${API_BASE_URL}/sales-order-lines/pagination?filters=${encodeURIComponent(JSON.stringify({ order_id: orderId }))}`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                    });

                    if (!recalcLinesResponse.ok) {
                        throw new Error('Failed to fetch order lines for recalculating total amount');
                    }

                    recalcLinesData = await recalcLinesResponse.json();
                    console.log('Fetched order lines data with order_id filter for orderId ' + orderId + ':', recalcLinesData);
                } catch (secondError) {
                    console.error('Error fetching order lines with order_id filter:', secondError);
                    throw new Error('Failed to fetch order lines for recalculating total amount');
                }
            }

            // Verify we have the correct lines for this order
            // Try multiple field names for orderId comparison
            const allLines = recalcLinesData?.data?.data?.filter(line =>
                Number(line.orderId) === Number(orderId) ||
                Number(line.order_id) === Number(orderId) ||
                Number(line.OrderId) === Number(orderId)
            ) || [];
            console.log(`All order lines for orderId ${orderId}:`, allLines);

            // Additional debugging to understand the filtering issue
            if (allLines.length === 0) {
                console.log('No lines found for orderId. Debugging info:');
                console.log('Looking for orderId:', orderId, 'Type:', typeof orderId);
                console.log('Available order lines:', recalcLinesData?.data?.data?.map(line => ({
                    id: line.id,
                    orderId: line.orderId,
                    order_id: line.order_id,
                    OrderId: line.OrderId,
                    orderIdType: typeof line.orderId,
                    productId: line.productId,
                    netAmount: line.netAmount || line.net_amount
                })));

                // Try a direct API call to get lines for this specific order
                try {
                    console.log('Attempting direct API call for order lines...');
                    const directResponse = await fetch(`${API_BASE_URL}/sales-order-lines/order/${orderId}`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                    });

                    if (directResponse.ok) {
                        const directData = await directResponse.json();
                        console.log('Direct API call successful:', directData);
                        if (directData.data && Array.isArray(directData.data)) {
                            allLines.push(...directData.data);
                        }
                    }
                } catch (directError) {
                    console.log('Direct API call failed:', directError);
                    // This is expected if the endpoint doesn't exist - not a real error
                }
            }

            // Calculate the sum of all order line net amounts and sales tax amounts - ensure we parse all values correctly
            let linesTotal = 0;
            let totalSalesTaxAmount = 0;

            if (allLines.length > 0) {
                for (const line of allLines) {
                    // Handle multiple possible field names and ensure we get valid numbers
                    const netAmountRaw = line.netAmount || line.net_amount || 0;
                    const salesTaxAmountRaw = line.salesTaxAmount || line.sales_tax_amount || 0;

                    const netAmount = parseFloat(netAmountRaw);
                    const salesTaxAmount = parseFloat(salesTaxAmountRaw);

                    // Check for NaN values and handle them appropriately
                    const validNetAmount = isNaN(netAmount) ? 0 : netAmount;
                    const validSalesTaxAmount = isNaN(salesTaxAmount) ? 0 : salesTaxAmount;

                    console.log(`Line for product ${line.productId}: net_amount_raw=${netAmountRaw}, parsed=${validNetAmount}, sales_tax_amount_raw=${salesTaxAmountRaw}, parsed=${validSalesTaxAmount}`);

                    linesTotal += validNetAmount;
                    totalSalesTaxAmount += validSalesTaxAmount;
                }
            } else {
                // Fallback: calculate totals based on cart items since we couldn't fetch order lines
                console.log('Using fallback calculation based on cart items');
                for (const item of categoryItems) {
                    const newQuantity = Number(quantities[item.id] || item.quantity || item.moq || 1);
                    const unitPrice = parseFloat(item.unitPrice || item.price || 0);
                    const vatPercentage = parseFloat(item.vatPercentage || 0);

                    if (!isNaN(newQuantity) && !isNaN(unitPrice) && !isNaN(vatPercentage) && newQuantity > 0 && unitPrice >= 0) {
                        const baseAmount = unitPrice * newQuantity;
                        const vatAmount = (baseAmount * vatPercentage) / 100;
                        const netAmount = baseAmount + vatAmount;

                        linesTotal += netAmount;
                        totalSalesTaxAmount += vatAmount;

                        console.log(`Fallback calculation for item ${item.id}:`, {
                            quantity: newQuantity,
                            unitPrice,
                            vatPercentage,
                            baseAmount,
                            vatAmount,
                            netAmount
                        });
                    }
                }
            }

            console.log('Recalculated lines total:', linesTotal);
            console.log('Total sales tax amount:', totalSalesTaxAmount);

            // Additional validation to ensure we have valid totals
            if (isNaN(linesTotal) || linesTotal < 0) {
                console.error('Invalid linesTotal detected:', linesTotal, 'Setting to 0');
                linesTotal = 0;
            }
            if (isNaN(totalSalesTaxAmount) || totalSalesTaxAmount < 0) {
                console.error('Invalid totalSalesTaxAmount detected:', totalSalesTaxAmount, 'Setting to 0');
                totalSalesTaxAmount = 0;
            }

            // Get existing delivery charges if updating an order
            let currentDeliveryCharges = existingOrderData ? parseFloat(existingOrderData.deliveryCharges || 0) : 0;

            // Calculate delivery charges based on recalculated line totals
            let deliveryCharges = 0.00;
            const isVmcoMachine = categoryName.toLowerCase().includes('machines') || categoryName.toLowerCase().includes('آلات');

            // Updated delivery charges logic according to requirements
            if (isDeliveryChargesApplicable) {
                // For VMCO Machines: always set deliveryCharges to 0.00 (already set to 0.00 by default)
                // For VMCO Consumables, SHC, Naqi, or Green Mast: set deliveryCharges to 20.00 if total <= 150, otherwise 0.00
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

            // Additional validation for final total
            if (isNaN(finalTotalAmount) || finalTotalAmount < 0) {
                console.error('Invalid finalTotalAmount detected:', finalTotalAmount, 'Components:', { linesTotal, deliveryCharges });
                throw new Error(`Invalid total amount calculation: linesTotal=${linesTotal}, deliveryCharges=${deliveryCharges}, finalTotal=${finalTotalAmount}`);
            }

            // Ensure orderStatus is defined in this scope
            let orderStatusUpdate = 'Open';
            if (entity && entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase()) {
                orderStatusUpdate = 'Pending';
            } else if (entity && entity.toLowerCase() === Constants.ENTITY.SHC.toLowerCase()) {
                orderStatusUpdate = 'Open';
            } else if (entity && entity.toLowerCase() === Constants.ENTITY.NAQI.toLowerCase()) {
                const pm = (selectedPaymentMethod || '').toLowerCase();
                if (pm === 'credit' || pm === 'cash on delivery') {
                    orderStatusUpdate = 'Approved';
                } else if (pm === 'pre payment') {
                    orderStatusUpdate = 'Pending';
                }
            }

            console.log('Final order totals:', {
                linesTotal,
                totalSalesTaxAmount,
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
                total_sales_tax_amount: totalSalesTaxAmount.toFixed(2),
                status: orderStatusUpdate, // Always send the current orderStatus
                deliveryCharges: deliveryCharges.toFixed(2),
                paymentPercentage: '100.00',
                // modifiedBy: userId // Removed to avoid backend 500 error
            };

            console.log('Update order payload:', updateOrderPayload);

            // Validate payload before sending
            if (parseFloat(updateOrderPayload.totalAmount) <= 0) {
                console.error('Invalid totalAmount in update payload:', updateOrderPayload.totalAmount);
                console.error('Debug info:', {
                    linesTotal,
                    totalSalesTaxAmount,
                    deliveryCharges,
                    finalTotalAmount,
                    allLinesCount: allLines.length,
                    categoryItemsCount: categoryItems.length
                });

                // If we have cart items but no order lines, this might be a timing issue
                // Let's try one more time with a longer delay
                if (categoryItems.length > 0 && allLines.length === 0) {
                    console.log('Retrying order line fetch after longer delay...');
                    await new Promise(resolve => setTimeout(resolve, 500));

                    try {
                        const retryResponse = await fetch(`${API_BASE_URL}/sales-order-lines/pagination?filters=${encodeURIComponent(JSON.stringify({ orderId: orderId }))}`, {
                            method: 'GET',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                        });

                        if (retryResponse.ok) {
                            const retryData = await retryResponse.json();
                            const retryLines = retryData?.data?.data?.filter(line =>
                                Number(line.orderId) === Number(orderId) ||
                                Number(line.order_id) === Number(orderId) ||
                                Number(line.OrderId) === Number(orderId)
                            ) || [];

                            if (retryLines.length > 0) {
                                console.log('Retry successful, found order lines:', retryLines);
                                // Recalculate with the retry data
                                let retryLinesTotal = 0;
                                let retryTotalSalesTaxAmount = 0;

                                for (const line of retryLines) {
                                    const netAmountRaw = line.netAmount || line.net_amount || 0;
                                    const salesTaxAmountRaw = line.salesTaxAmount || line.sales_tax_amount || 0;

                                    const netAmount = parseFloat(netAmountRaw);
                                    const salesTaxAmount = parseFloat(salesTaxAmountRaw);

                                    const validNetAmount = isNaN(netAmount) ? 0 : netAmount;
                                    const validSalesTaxAmount = isNaN(salesTaxAmount) ? 0 : salesTaxAmount;

                                    retryLinesTotal += validNetAmount;
                                    retryTotalSalesTaxAmount += validSalesTaxAmount;
                                }

                                if (retryLinesTotal > 0) {
                                    linesTotal = retryLinesTotal;
                                    totalSalesTaxAmount = retryTotalSalesTaxAmount;
                                    const retryFinalTotalAmount = linesTotal + deliveryCharges;

                                    updateOrderPayload.totalAmount = retryFinalTotalAmount.toFixed(2);
                                    updateOrderPayload.total_sales_tax_amount = totalSalesTaxAmount.toFixed(2);

                                    console.log('Updated totals after retry:', {
                                        retryLinesTotal,
                                        retryTotalSalesTaxAmount,
                                        retryFinalTotalAmount
                                    });
                                }
                            }
                        }
                    } catch (retryError) {
                        console.error('Retry failed:', retryError);
                    }
                }

                // Final check - if still zero, something is wrong
                if (parseFloat(updateOrderPayload.totalAmount) <= 0) {
                    throw new Error(`Cannot update order with totalAmount of ${updateOrderPayload.totalAmount}. This indicates a problem with order line creation or fetching.`);
                }
            }

            const updateOrderResponse = await fetch(`${API_BASE_URL}/sales-order/id/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateOrderPayload),
                credentials: 'include',
            });

            if (!updateOrderResponse.ok) {
                throw new Error(`Failed to update order with final amounts`);
            }
            const updatedOrderResponse = await updateOrderResponse.json();
            console.log('Updated the order:', updatedOrderResponse);

            // Show order confirmation alert with order number (conditionally)
            if (showSuccessMessage) {
                Swal.fire({
                    icon: 'success',
                    title: t('Order Placed'),
                    text: t(`Your order has been placed successfully! Order #${orderId}. Payment Method: ${selectedPaymentMethod}`),
                    confirmButtonText: t('OK')
                }).then(() => {
                    setCartItems(prevCartItems =>
                        prevCartItems.map(category => ({
                            ...category,
                            items: category.items.filter(
                                cartItem => !categoryItems.some(ci => ci.id === cartItem.id))
                        })));

                    // Clean up quantities state for removed items
                    setQuantities(prevQuantities => {
                        const newQuantities = { ...prevQuantities };
                        categoryItems.forEach(item => {
                            delete newQuantities[item.id];
                        });
                        return newQuantities;
                    });
                    console.log("ssssss", updatedOrderResponse)



                });

                // Delete cart items for non-VMCO and non-SHC categories
                if (entity && entity.toLowerCase() !== Constants.ENTITY.VMCO.toLowerCase() &&
                    entity.toLowerCase() !== Constants.ENTITY.SHC.toLowerCase()) {
                    try {
                        const deleteUrl = new URL(`${API_BASE_URL}/cart/delete`);
                        deleteUrl.searchParams.append('customer_id', selectedCustomerId);
                        deleteUrl.searchParams.append('branch_id', selectedBranchId);
                        deleteUrl.searchParams.append('entity', entity);
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
                }
            }
            if (updatedOrderResponse && updatedOrderResponse.status.toLowerCase() === 'ok' &&
                updatedOrderResponse?.salesOrder?.paymentMethod.toLowerCase() === "pre payment" &&
                (
                    updatedOrderResponse?.salesOrder?.entity?.toLowerCase() === Constants?.ENTITY?.DAR?.toLowerCase()
                    || updatedOrderResponse?.salesOrder?.entity?.toLowerCase() === Constants?.ENTITY?.NAQI?.toLowerCase()
                    || updatedOrderResponse?.salesOrder?.entity?.toLowerCase() === Constants?.ENTITY?.GMTC?.toLowerCase())) {
                const { data } = await axios.post(`${API_BASE_URL}/generatePayment-link`, { id: updatedOrderResponse?.salesOrder.id, endPoint: "payment-opations/order", IsEmail: false }, { withCredentials: true });

                window.open(data.details.url, '_blank', 'width=500,height=600');

            }

            // Return the order ID for use in combined success messages
            console.log(`placeOrderForCategory completed - returning order ID: ${orderId} for category: ${categoryName}`);
            return orderId;

        } catch (err) {
            console.error('Error placing order:', err);
            setError(err.message);
            // alert(t(`Failed to place order: ${err.message}`));
            Swal.fire({
                icon: 'error',
                title: t('Order Failed'),
                text: t(`Failed to place order: ${err.message}`),
                confirmButtonText: t('OK')
            });
        } finally {
            setIsPlacingOrder(false);
        }
    };    // Function to check if credit payment is allowed for the customer (entity-specific)
    const isCreditPaymentAllowed = async (customerId, entity = null) => {
        try {
            const response = await fetch(`${API_BASE_URL}/payment-method-balances/id/${customerId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) {
                console.error('Failed to fetch payment method details');
                return false;
            }

            const result = await response.json();
            console.log('Payment method details response:', result);

            if (result.status === 'Ok' && result.data && result.data.methodDetails) {
                const methodDetails = result.data.methodDetails;

                // If entity is provided, check entity-specific credit allowance
                if (entity && methodDetails.credit && methodDetails.credit[entity]) {
                    const entityCreditDetails = methodDetails.credit[entity];
                    const isAllowed = entityCreditDetails.isAllowed === true;
                    console.log(`Credit payment is ${isAllowed ? 'allowed' : 'not allowed'} for entity ${entity}`);
                    return isAllowed;
                }

                // Fallback: check if credit is generally allowed (legacy support)
                if (methodDetails.credit && methodDetails.credit.isAllowed === true) {
                    console.log('Credit payment is allowed for customer (general)');
                    return true;
                }
            }

            console.log('Credit payment is not allowed for customer');
            return false;
        } catch (error) {
            console.error('Error checking credit payment allowance:', error);
            return false;
        }
    };

    // Function to validate credit balance and show warning if insufficient (entity-specific)
    const validateCreditBalance = async (customerId, totalAmount, entity = null) => {
        try {
            const response = await fetch(`${API_BASE_URL}/payment-method-balances/id/${customerId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) {
                console.error('Failed to fetch payment method details');
                return false;
            }

            const result = await response.json();
            console.log('Payment method details response:', result);

            if (result.status === 'Ok' && result.data && result.data.methodDetails) {
                const methodDetails = result.data.methodDetails;
                const currentBalance = result.data.currentBalance || {};

                // Check if totalAmount is provided and compare with credit balance
                if (totalAmount !== undefined && methodDetails.credit) {
                    let creditBalance = 0;

                    // If entity is provided, check entity-specific credit balance from currentBalance
                    if (entity && currentBalance[entity] !== undefined) {
                        creditBalance = Math.abs(currentBalance[entity] || 0);
                    } else if (methodDetails.credit.balance !== undefined) {
                        // Fallback to general credit balance (legacy support)
                        creditBalance = Number(methodDetails.credit.balance);
                    }

                    const orderTotal = Number(totalAmount);

                    console.log(`Checking credit balance: ${creditBalance} vs order total: ${orderTotal} for entity: ${entity || 'general'}`);

                    if (orderTotal > creditBalance) {
                        console.log('Order total exceeds credit balance');
                        Swal.fire({
                            icon: 'warning',
                            title: t('Insufficient Balance'),
                            text: t(`Insufficient Balance! Your current credit balance is: `) + `${creditBalance.toFixed(2)}`,
                            confirmButtonText: t('OK')
                        }).then(() => {
                            //
                        });
                        return false;
                    }
                }

                return true;
            }

            return false;
        } catch (error) {
            console.error('Error validating credit balance:', error);
            return false;
        }
    };    // Initialize from navigation state if available
    useEffect(() => {
        console.log('Location state useEffect triggered:', location.state);
        if (location.state) {
            console.log('Setting branch data from location state:', {
                selectedBranchId: location.state.selectedBranchId,
                selectedCustomerId: location.state.selectedCustomerId
            });
            setSelectedCustomerId(location.state.selectedCustomerId || '');
            setSelectedCustomerStatus(location.state.selectedCustomerStatus || '');
            setSelectedBranchId(location.state.selectedBranchId || '');
            setSelectedBranchName(location.state.selectedBranchName || 'No location selected');
            setSelectedBranchErpId(location.state.selectedBranchErpId || '');
            setSelectedBranchRegion(location.state.selectedBranchRegion || '');
            setSelectedBranchNameLc(location.state.selectedBranchNameLc || '');
            setSelectedBranchCity(location.state.selectedBranchCity || '');
            setSelectedBranchStatus(location.state.selectedBranchStatus || '');
        } else {
            console.log('No location state available - user might have navigated directly to cart');
            // Don't clear existing branch data if no location state is available
            // This prevents losing branch information when the user refreshes the page
        }
    }, [location.state]);

    // Add a new effect to filter cart sections based on interCompany status
    useEffect(() => {
        // Don't filter if cart items are still loading
        if (isLoading) {
            console.log("Skipping filtering - cart is loading");
            return;
        }

        // If cart items are empty, clear filtered cart items
        if (cartItems.length === 0) {
            console.log("Cart items are empty, clearing filtered cart items");
            setFilteredCartItems([]);
            return;
        }

        // Default to showing all sections
        let sectionsToShow = cartItems;

        console.log("=== INTER-COMPANY CART SECTION FILTERING DEBUG ===");
        console.log("User details:", {
            userType: user?.userType,
            interCompany: user?.interCompany,
            entity: user?.entity
        });
        console.log("Original cart sections:", cartItems.map(item => ({ category: item.category, itemCount: item.items.length })));

        // If user is a customer with interCompany set to true, filter out matching entity sections
        if (user?.userType === "customer" && user?.interCompany === true && user?.entity) {
            const customerEntity = user.entity.toLowerCase();
            console.log("Customer entity (lowercase):", customerEntity);

            sectionsToShow = cartItems.filter(section => {
                // Get the entity from the category name
                const sectionEntity = getEntityFromCategory(section.category)?.toLowerCase();

                // If no entity could be determined, include the section
                if (!sectionEntity) {
                    console.log(`Section ${section.category}: No matching entity determined - including`);
                    return true;
                }

                // If entity matches customer's entity, exclude the section
                const shouldInclude = sectionEntity !== customerEntity;
                console.log(`Section ${section.category}: Entity = ${sectionEntity}, Include = ${shouldInclude}`);
                return shouldInclude;
            });
        } else {
            console.log("Not applying interCompany filtering - user is not an interCompany customer");
        }

        console.log("Filtered sections:", sectionsToShow.map(item => ({ category: item.category, itemCount: item.items.length })));
        console.log("=== END DEBUG ===");

        setFilteredCartItems(sectionsToShow);

        // Collapse all sections by default when cart items are loaded
        if (sectionsToShow.length > 0) {
            const allCategories = new Set(sectionsToShow.map(item => item.category));
            setCollapsedCategories(allCategories);
            console.log("Collapsed all sections by default:", Array.from(allCategories));
        }
    }, [cartItems, user, isLoading]);

    // Add this effect to fetch entity descriptions
    useEffect(() => {
        const fetchEntityDescriptions = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/basics-masters?filters={"masterName": "entity"}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch entity descriptions');
                }

                const result = await response.json();

                // Create a mapping of entity codes to descriptions
                const descriptionMap = {};
                if (result.data && Array.isArray(result.data)) {
                    result.data.forEach(entity => {
                        // Use current language for description
                        const description = entity.description;

                        // Use the entity code/value as the key, not the entity object itself
                        const entityCode = entity.value || entity.code || entity.name;
                        if (entityCode) {
                            descriptionMap[entityCode.toLowerCase()] = description;
                        }
                    });
                }

                setEntityDescriptions(descriptionMap);

                // Initialize cart items with these descriptions
                initializeCartItems(descriptionMap);
            } catch (error) {
                console.error('Error fetching entity descriptions:', error);
            }
        };

        fetchEntityDescriptions();
    }, [i18n.language]); // Re-fetch when language changes

    // Function to initialize cart items with dynamic entity descriptions
    const initializeCartItems = (descriptions) => {
        const items = [
            {
                category: descriptions[Constants.ENTITY.VMCO.toLowerCase()],
                entityCode: Constants.ENTITY.VMCO,
                items: []
            },
            {
                category: descriptions[Constants.ENTITY.SHC.toLowerCase()],
                entityCode: Constants.ENTITY.SHC,
                items: []
            },
            {
                category: descriptions[Constants.ENTITY.GMTC.toLowerCase()],
                entityCode: Constants.ENTITY.GMTC,
                items: []
            },
            {
                category: descriptions[Constants.ENTITY.NAQI.toLowerCase()],
                entityCode: Constants.ENTITY.NAQI,
                items: []
            },
            {
                category: descriptions[Constants.ENTITY.DAR.toLowerCase()],
                entityCode: Constants.ENTITY.DAR,
                items: []
            }
        ];

        setCartItems(items);
    };

    // Helper function to determine payment method for non-machine products
    const determinePaymentMethodForNonMachines = async (customerId, totalAmount, entity) => {
        try {
            const response = await fetch(`${API_BASE_URL}/payment-method-balances/id/${customerId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) {
                console.error('Failed to fetch payment method details');
                return 'Pre Payment'; // Default fallback
            }

            const result = await response.json();
            console.log('Payment method details response:', result);

            if (result.status === 'Ok' && result.data && result.data.methodDetails) {
                const methodDetails = result.data.methodDetails;
                const currentBalance = result.data.currentBalance || {};
                let creditAllowed = false;
                if (methodDetails.credit && methodDetails.credit[entity]) {
                    const entityCreditDetails = methodDetails.credit[entity];
                    creditAllowed = entityCreditDetails.isAllowed === true;
                    if (creditAllowed) {
                        // Check if current balance is sufficient
                        const entityBalance = currentBalance[entity] || 0;
                        if (totalAmount <= Math.abs(entityBalance)) {
                            console.log(`Credit is allowed for entity ${entity} and balance ${entityBalance} is sufficient for amount ${totalAmount}, using Credit payment method`);
                            return 'Credit';
                        } else {
                            console.log(`Credit is allowed for entity ${entity} but balance ${entityBalance} is insufficient for amount ${totalAmount}`);
                            Swal.fire({
                                icon: 'warning',
                                title: t('Insufficient Balance'),
                                text: t(`Insufficient Balance! Your current credit balance is: ${Math.abs(entityBalance).toFixed(2)}`),
                                confirmButtonText: t('OK')
                            });
                            return null;
                        }
                    }
                }

                // If credit is not allowed, check COD limit logic
                if (!creditAllowed && methodDetails.COD && methodDetails.COD.isAllowed === true) {
                    const codLimit = methodDetails.COD.limit || 0;
                    if (totalAmount >= codLimit) {
                        // If totalAmount is greater than or equal to COD limit, force Pre Payment
                        console.log(`Credit not allowed, COD allowed but totalAmount ${totalAmount} >= codLimit ${codLimit}, using Pre Payment`);
                        return 'Pre Payment';
                    }
                    else {
                        setShowPaymentPopup(true);
                        return;
                    }
                }
            }

            return 'Pre Payment'; // Default fallback
        } catch (error) {
            console.error('Error determining payment method:', error);
            return 'Pre Payment'; // Default fallback
        }
    };

    // Helper function to determine payment method for SHC products (fresh and non-fresh)
    const determinePaymentMethodForSHC = async (customerId, totalAmount, entity) => {
        try {
            const response = await fetch(`${API_BASE_URL}/payment-method-balances/id/${customerId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) {
                console.error('Failed to fetch payment method details');
                return 'Pre Payment'; // Default fallback
            }

            const result = await response.json();
            console.log('Payment method details response for SHC:', result);

            if (result.status === 'Ok' && result.data && result.data.methodDetails) {
                const methodDetails = result.data.methodDetails;
                const currentBalance = result.data.currentBalance || {};

                // Check if credit is allowed for SHC entity
                if (methodDetails.credit && methodDetails.credit.SHC && methodDetails.credit.SHC.isAllowed === true) {
                    // Check if current balance is sufficient
                    const entityBalance = currentBalance.SHC || 0;
                    if (totalAmount <= Math.abs(entityBalance)) {
                        console.log(`Credit payment is allowed for SHC entity and balance ${entityBalance} is sufficient for amount ${totalAmount}`);
                        return 'Credit';
                    } else {
                        console.log(`Credit is allowed for SHC but balance ${entityBalance} is insufficient for amount ${totalAmount}`);
                        // Show insufficient balance alert
                        Swal.fire({
                            icon: 'warning',
                            title: t('Insufficient Balance'),
                            text: t(`Insufficient Balance! Your current credit balance is: ${Math.abs(entityBalance).toFixed(2)}`),
                            confirmButtonText: t('OK')
                        });
                        return null; // Return null to indicate payment method selection should be cancelled
                    }
                }

                // Check Cash on Delivery limits if credit is not allowed or insufficient
                if (methodDetails.COD && methodDetails.COD.isAllowed === true) {
                    const codLimit = methodDetails.COD.limit || 0;
                    if (totalAmount <= codLimit) {
                        console.log(`Cash on Delivery payment is allowed for amount ${totalAmount} (limit: ${codLimit})`);
                        return 'Cash on Delivery';
                    } else {
                        console.log(`Total amount ${totalAmount} exceeds Cash on Delivery limit ${codLimit}, using Pre Payment`);
                        return 'Pre Payment';
                    }
                } else {
                    console.log('Cash on Delivery is not allowed, using Pre Payment');
                    return 'Pre Payment';
                }
            }

            console.log('Defaulting to Pre Payment for SHC');
            return 'Pre Payment';
        } catch (error) {
            console.error('Error determining payment method for SHC:', error);
            return 'Pre Payment';
        }
    };

    // Helper function to delete cart items with specific parameters
    const deleteCartItems = async (customerId, branchId, entity, isFresh, isMachine, products) => {
        try {
            const deletePromises = products.map(async (product) => {
                const deleteUrl = new URL(`${API_BASE_URL}/cart/delete`);
                deleteUrl.searchParams.append('customer_id', customerId);
                deleteUrl.searchParams.append('branch_id', branchId);
                deleteUrl.searchParams.append('entity', entity);
                if (isFresh !== null && isFresh !== undefined) {
                    deleteUrl.searchParams.append('isFresh', isFresh);
                }
                if (isMachine !== null && isMachine !== undefined) {
                    deleteUrl.searchParams.append('isMachine', isMachine);
                }
                deleteUrl.searchParams.append('product_id', product.product_id || product.productId);

                console.log(`Deleting cart item with params: ${deleteUrl}`);

                const deleteResponse = await fetch(deleteUrl, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });

                if (!deleteResponse.ok) {
                    console.error(`Error removing cart item: ${deleteResponse.statusText}`);
                    throw new Error(`Failed to remove cart item: ${deleteResponse.statusText}`);
                }

                return deleteResponse;
            });

            await Promise.all(deletePromises);
            console.log(`Successfully deleted ${products.length} cart items`);
        } catch (err) {
            console.error('Error during cart cleanup:', err);
            throw err;
        }
    };

    // Helper function to check if credit is allowed for specific entity
    const checkCreditAllowed = async (customerId, entity) => {
        try {
            const response = await fetch(`${API_BASE_URL}/payment-method-balances/id/${customerId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) {
                console.error('Failed to fetch payment method details');
                return false;
            }

            const result = await response.json();
            console.log('Payment method details response for credit check:', result);

            if (result.status === 'Ok' && result.data && result.data.methodDetails) {
                const methodDetails = result.data.methodDetails;

                // Check if credit is allowed for specific entity
                if (methodDetails.credit && methodDetails.credit[entity.toUpperCase()]) {
                    const isAllowed = methodDetails.credit[entity.toUpperCase()].isAllowed;
                    console.log(`Credit isAllowed for ${entity} entity:`, isAllowed);
                    return isAllowed === true;
                }
            }

            return false;
        } catch (error) {
            console.error('Error checking credit allowance:', error);
            return false;
        }
    };

    // Helper function to get COD limit
    const getCODLimit = async (customerId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/payment-method-balances/id/${customerId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) {
                console.error('Failed to fetch payment method details');
                return 0;
            }

            const result = await response.json();
            console.log('Payment method details response for COD limit:', result);

            if (result.status === 'Ok' && result.data && result.data.methodDetails) {
                const methodDetails = result.data.methodDetails;

                // Get COD limit
                if (methodDetails.COD && methodDetails.COD.limit) {
                    const limit = Number(methodDetails.COD.limit);
                    console.log('COD limit:', limit);
                    return limit;
                }
            }

            return 0;
        } catch (error) {
            console.error('Error getting COD limit:', error);
            return 0;
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
                        {filteredCartItems.map((category) => (
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
                                                        <QuantityController
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

                                        {(category.category.toLowerCase() === t(Constants.CATEGORY.VMCO_MACHINES).toLowerCase() || category.category === "آلات VMCO") && category.items.length > 0 && (
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
                                                            //const sugarTaxAmount = (baseAmount * sugarTaxPrice) / 100 : 0;

                                                            const totalAmount = baseAmount + vatAmount; // + sugarTaxAmount
                                                            categoryTotal += totalAmount;
                                                        });
                                                        return (
                                                            <strong> {categoryTotal.toFixed(2)} <span className="sar-label" style={{ margin: '5px' }}>{t("SAR")}</span></strong>
                                                        );
                                                    })()}
                                                </span>                                                <button
                                                    className="checkout-btn" onClick={async () => {
                                                        setPendingOrderCategory(category.category);
                                                        setPendingOrderItems(category.items);

                                                        // Check if this is a VMCO or SHC category
                                                        const entity = getEntityFromCategory(category.category);
                                                        if (entity && (entity.toLowerCase() === Constants.ENTITY.VMCO.toLowerCase() ||
                                                            entity.toLowerCase() === Constants.ENTITY.SHC.toLowerCase())) {
                                                            // For VMCO and SHC, let handlePlaceOrder handle the payment method determination
                                                            handlePlaceOrder(category.items, category.category, null);
                                                        } else {
                                                            // Other categories - existing logic
                                                            let categoryTotal = 0;
                                                            category.items.forEach(item => {
                                                                const baseAmount = Number(item.price) * Number(quantities[item.id] || item.quantity || 1);
                                                                const vatPercentage = Number(item.vatPercentage) || 0;
                                                                const vatAmount = (baseAmount * vatPercentage) / 100;
                                                                const totalAmount = baseAmount + vatAmount;
                                                                categoryTotal += totalAmount;
                                                            });

                                                            const isCreditAllowed = await isCreditPaymentAllowed(selectedCustomerId, entity);
                                                            if (isCreditAllowed) {
                                                                const isBalanceValid = await validateCreditBalance(selectedCustomerId, categoryTotal, entity);
                                                                if (isBalanceValid) {
                                                                    handlePlaceOrder(category.items, category.category, 'Credit');
                                                                }
                                                            } else {
                                                                // COD limit logic for non-credit entities
                                                                const codLimit = await getCODLimit(selectedCustomerId);
                                                                if (categoryTotal >= codLimit) {
                                                                    // Place order directly with Pre Payment
                                                                    handlePlaceOrder(category.items, category.category, 'Pre Payment');
                                                                } else {
                                                                    // Show payment method popup (COD/Pre Payment)
                                                                    setShowPaymentPopup(true);
                                                                }
                                                            }
                                                        }
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
                    try {
                        pendingOrderItems.forEach((item) => {
                            const qty = Number(quantities[item.id] || item.quantity || 1);
                            const price = Number(item.price || item.unitPrice || 0);
                            const vat = Number(item.vatPercentage || 0);
                            const base = price * qty;
                            const vatAmount = (base * vat) / 100;
                            sum += base + vatAmount;
                        });
                    } catch (error) {
                        console.error('Error calculating totalAmount:', error);
                        return 0;
                    }
                    return sum;
                })()}
                isSimpleMode={(() => {
                    // Check if this is for SHC, NAQI, GMTC, or DAR entities
                    if (!pendingOrderCategory) return false;
                    const entity = getEntityFromCategory(pendingOrderCategory);
                    return entity && [Constants.ENTITY.SHC.toLowerCase(), Constants.ENTITY.NAQI.toLowerCase(), Constants.ENTITY.GMTC.toLowerCase(), Constants.ENTITY.DAR.toLowerCase()].includes(entity.toLowerCase());
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